import { NextRequest, NextResponse } from 'next/server';
import { getDocument } from '@/lib/firestore';
import { getServers } from '@/lib/content';
import { groupServers, isAllowedFetchUrl, resolveFromHtml, signBunnyUrl } from '@/lib/servers';

function deepUrls(v:any,out:string[]=[]):string[]{ if(typeof v==='string' && /^https?:\/\//i.test(v.trim())) out.push(v.trim()); else if(Array.isArray(v)) v.forEach(x=>deepUrls(x,out)); else if(v&&typeof v==='object') Object.values(v).forEach(x=>deepUrls(x,out)); return out; }
function looksDirect(u:string){return /\.(mp4|m3u8|webm)(\?|$)/i.test(u) || /playlist/i.test(u);}

export async function GET(req:NextRequest,{params}:{params:Promise<{id:string;episodeId:string}>}){
  const {id,episodeId}=await params; const raw=await getServers(id,episodeId); const servers=groupServers(raw); const resolveIndex=req.nextUrl.searchParams.get('resolve');
  if(resolveIndex===null) return NextResponse.json({items:servers.map(({raw,sourceUrl,...x})=>x)});
  const i=Number(resolveIndex); if(!Number.isInteger(i)||i<0||i>=servers.length) return NextResponse.json({error:'سيرفر غير صالح'},{status:400});
  const server=servers[i]; let final=server.url||'';
  try{
    if(final && looksDirect(final)) { /* direct */ }
    else {
      const candidates=[server.sourceUrl,server.url,...deepUrls(server.raw)].filter(Boolean) as string[];
      const source=candidates.find(isAllowedFetchUrl);
      if(!source) throw new Error('لا يوجد رابط مصدر صالح لهذا السيرفر');
      const res=await fetch(source,{headers:{'User-Agent':'Mozilla/5.0 AnimeWitcherWeb/1.0','Accept':'text/html,application/xhtml+xml,*/*'},redirect:'follow',cache:'no-store'});
      if(!res.ok) throw new Error(`فشل فتح المصدر (${res.status})`);
      const contentType=res.headers.get('content-type')||'';
      if(/video|mpegurl|octet-stream/.test(contentType) || looksDirect(res.url)) final=res.url;
      else final=resolveFromHtml(server,await res.text());
    }
    if(!final || !isAllowedFetchUrl(final)) throw new Error('لم نتمكن من استخراج رابط المشاهدة');
    const constants=await getDocument('Settings/constants').catch(()=>null);
    const bunnyEnabled=Boolean(constants?.bu_auth_enabled); const bunnyKey=process.env.BUNNY_AUTH_KEY || String(constants?.bu_auth_key||'');
    if(bunnyEnabled && bunnyKey && /bunny|b-cdn|mediadelivery/i.test(final)) final=await signBunnyUrl(final,bunnyKey,28800);
    return NextResponse.json({url:final,name:server.name,quality:server.quality});
  }catch(e:any){return NextResponse.json({error:e?.message||'تعذر تجهيز السيرفر'},{status:502});}
}
