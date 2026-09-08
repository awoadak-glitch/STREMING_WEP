import { NextRequest, NextResponse } from 'next/server';
import { getDocument } from '@/lib/firestore';
import { getServers } from '@/lib/content';
import { groupServers, isAllowedFetchUrl, resolveFromHtml, signBunnyUrl } from '@/lib/servers';

function deepUrls(v:any,out:string[]=[]):string[]{
  if(typeof v==='string' && /^https?:\/\//i.test(v.trim())) out.push(v.trim());
  else if(Array.isArray(v)) v.forEach(x=>deepUrls(x,out));
  else if(v&&typeof v==='object') Object.values(v).forEach(x=>deepUrls(x,out));
  return out;
}
function providerPage(u:string){return /streamtape\.(?:com|to)\/v\/|krakenfiles\.com\/view\/|pixeldrain\.com\/u\//i.test(u);}
function looksDirect(u:string){return !providerPage(u) && (/\.(mp4|m3u8|webm)(?:\?|#|$)/i.test(u) || /\/api\/file\//i.test(u) || /playlist/i.test(u));}
function cleanHtmlUrl(u:string){return u.replace(/\\u0026/g,'&').replace(/\\\//g,'/').replace(/&amp;/g,'&').replace(/["'<>]+$/g,'');}
function pixelDrainDirect(u:string){const m=u.match(/pixeldrain\.com\/u\/([^/?#]+)/i);return m?`https://pixeldrain.com/api/file/${encodeURIComponent(m[1])}`:'';}
function streamTapeDirect(u:string){
  if(/streamtape\.(?:com|to)\/get_video\?/i.test(u)) return u;
  const m=u.match(/streamtape\.(?:com|to)\/v\/([^/?#]+)/i);
  return m?`https://streamtape.com/get_video?id=${encodeURIComponent(m[1])}&dl=1`:'';
}

async function fetchHtml(source:string){
  const res=await fetch(source,{headers:{'User-Agent':'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36','Accept':'text/html,application/xhtml+xml,*/*','Accept-Language':'ar,en;q=0.8'},redirect:'follow',cache:'no-store'});
  if(!res.ok) throw new Error(`فشل فتح المصدر (${res.status})`);
  const type=res.headers.get('content-type')||'';
  if(/video|mpegurl|octet-stream/i.test(type) || looksDirect(res.url)) return {direct:res.url,html:''};
  return {direct:'',html:await res.text()};
}
function attr(tag:string,name:string){
  return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`,'i'))?.[1]||'';
}
function absolute(base:string,value:string){try{return new URL(cleanHtmlUrl(value),base).toString();}catch{return '';}}
function firstJsonUrl(v:any):string{
  if(typeof v==='string'&&/^https?:\/\//i.test(v)) return v;
  if(Array.isArray(v)){for(const x of v){const u=firstJsonUrl(x);if(u)return u;}}
  else if(v&&typeof v==='object'){for(const k of ['url','download','download_url','link','file']){const u=firstJsonUrl(v[k]);if(u)return u;}for(const x of Object.values(v)){const u=firstJsonUrl(x);if(u)return u;}}
  return '';
}

async function resolveKraken(source:string){
  const opened=await fetchHtml(source);
  if(opened.direct) return opened.direct;
  const html=opened.html;
  const immediate=(html.match(/https?:\\?\/\\?\/[^"'<>\s]+\.(?:mp4|m3u8)(?:\?[^"'<>\s]*)?/i)?.[0]||'');
  if(immediate) return cleanHtmlUrl(immediate);

  const tokenTag=(html.match(/<input[^>]*(?:id|name)\s*=\s*["']dl-token["'][^>]*>/i)||html.match(/<input[^>]*value\s*=\s*["'][^"']+["'][^>]*(?:id|name)\s*=\s*["']dl-token["'][^>]*>/i))?.[0]||'';
  const token=attr(tokenTag,'value') || html.match(/["']dl-token["'][\s\S]{0,180}?value\s*=\s*["']([^"']+)/i)?.[1] || html.match(/value\s*=\s*["']([^"']+)["'][\s\S]{0,180}?["']dl-token["']/i)?.[1] || '';
  const hash=html.match(/data-file-hash\s*=\s*["']([^"']+)/i)?.[1] || html.match(/data-hash\s*=\s*["']([^"']+)/i)?.[1] || html.match(/file(?:_|)hash\s*[:=]\s*["']([^"']+)/i)?.[1] || '';
  if(!token || !hash) return '';

  const formActionTag=html.match(/<form[^>]+action\s*=\s*["'][^"']*\/download\/[^"']+["'][^>]*>/i)?.[0]||'';
  const action=attr(formActionTag,'action');
  const scripted=html.match(/(?:url|endpoint)\s*[:=]\s*["']([^"']*\/download\/[^"']+)["']/i)?.[1]||'';
  const endpoints=[action&&absolute(source,action),scripted&&absolute(source,scripted),`https://krakenfiles.com/download/${encodeURIComponent(hash)}`].filter(Boolean) as string[];

  const boundary='----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const body=`--${boundary}\r\nContent-Disposition: form-data; name="token"\r\n\r\n${token}\r\n--${boundary}--\r\n`;
  for(const endpoint of [...new Set(endpoints)]){
    try{
      const res=await fetch(endpoint,{method:'POST',body,headers:{
        'User-Agent':'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36',
        'Accept':'application/json,text/plain,*/*','Content-Type':`multipart/form-data; boundary=${boundary}`,
        'Cache-Control':'no-cache','X-Requested-With':'XMLHttpRequest','Referer':source,'Origin':'https://krakenfiles.com','hash':hash,
      },redirect:'manual',cache:'no-store'});
      const location=res.headers.get('location')||'';
      if(location){const u=absolute(endpoint,location);if(u&&isAllowedFetchUrl(u)&&!providerPage(u))return u;}
      const type=res.headers.get('content-type')||'';
      if(res.ok&&/video|octet-stream/i.test(type)&&isAllowedFetchUrl(res.url)) return res.url;
      const text=await res.text();
      try{const json=JSON.parse(text);const u=firstJsonUrl(json);if(u&&isAllowedFetchUrl(u)&&!providerPage(u))return cleanHtmlUrl(u);}catch{}
      const u=text.match(/https?:\/\/[^"'<>\s]+/)?.[0]||'';
      if(u&&isAllowedFetchUrl(u)&&!providerPage(u))return cleanHtmlUrl(u);
    }catch{}
  }
  return '';
}

async function resolveProvider(server:any,source:string){
  const name=String(server.name||server.type||'').toUpperCase();
  if(name==='ST'||/streamtape\.(?:com|to)\//i.test(source)){const direct=streamTapeDirect(source);if(direct)return direct;}
  if(name==='PD'||/pixeldrain\.com\/u\//i.test(source)){const direct=pixelDrainDirect(source);if(direct)return direct;}
  if(name==='KF'||/krakenfiles\.com\/view\//i.test(source)){const direct=await resolveKraken(source);if(direct)return direct;}
  const opened=await fetchHtml(source);
  if(opened.direct)return opened.direct;
  return resolveFromHtml(server,opened.html);
}

export async function GET(req:NextRequest,{params}:{params:Promise<{id:string;episodeId:string}>}){
  const {id,episodeId}=await params;
  const raw=await getServers(id,episodeId);
  const servers=groupServers(raw);
  const resolveIndex=req.nextUrl.searchParams.get('resolve');
  if(resolveIndex===null)return NextResponse.json({items:servers.map(({raw,sourceUrl,...x})=>x)});
  const i=Number(resolveIndex);
  if(!Number.isInteger(i)||i<0||i>=servers.length)return NextResponse.json({error:'سيرفر غير صالح'},{status:400});
  const server=servers[i];
  let final=server.url||'';
  try{
    if(final&&looksDirect(final)){}else{
      const candidates=[server.sourceUrl,server.url,...deepUrls(server.raw)].filter(Boolean) as string[];
      const source=candidates.find(isAllowedFetchUrl);
      if(!source)throw new Error('لا يوجد رابط مصدر صالح لهذا السيرفر');
      final=await resolveProvider(server,source);
    }
    if(!final||!isAllowedFetchUrl(final)||providerPage(final))throw new Error('لم نتمكن من استخراج رابط الملف المباشر');
    const constants=await getDocument('Settings/constants').catch(()=>null);
    const bunnyEnabled=Boolean(constants?.bu_auth_enabled);
    const bunnyKey=process.env.BUNNY_AUTH_KEY||String(constants?.bu_auth_key||'');
    if(bunnyEnabled&&bunnyKey&&/bunny|b-cdn|mediadelivery/i.test(final))final=await signBunnyUrl(final,bunnyKey,28800);
    return NextResponse.json({url:final,name:server.name,quality:server.quality,direct:true});
  }catch(e:any){return NextResponse.json({error:e?.message||'تعذر تجهيز السيرفر',name:server.name,quality:server.quality},{status:502});}
}
