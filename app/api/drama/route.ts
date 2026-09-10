import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN_A = (process.env.DRAMA_TOKEN_A || '4F5A9C3D9A86FA54EACEDDD635185').trim();
const TOKEN_B = (process.env.DRAMA_TOKEN_B || 'd506abfd-9fe2-4b71-b979-feff21bcad13').trim();
const APP_SIGNATURE = (process.env.DRAMA_APP_SIGNATURE || 'eLXLul9MmbuG2DF3kKDY8aygdeVgUAalDrznu4kRfP8=').trim();
const DEFAULT_VALIDATION_URL = 'https://test.arabypros.com/api/validate.php';
const LAST_KNOWN_API_BASE = 'https://dwapp.arabypros.com/api/';
const FIREBASE = {
  projectId: 'alamaldrama2022v2',
  projectNumber: '462519862201',
  appId: '1:462519862201:android:e2b2f8fc6e55730e846c68',
  apiKey: 'AIzaSyDgICP_l7w5uHw1C-HGzj0o4ehFCp7BwYc',
  packageName: 'com.alam.aldrama3'
};

const TTL = 10 * 60 * 1000;
let configCache: { base: string; at: number; validationUrl: string; trace: string[]; error: string } = { base: '', at: 0, validationUrl: '', trace: [], error: '' };
let goodBase = { base: '', at: 0 };
const responseCache = new Map<string, { at: number; data: any; base: string }>();

function cleanUrl(value: unknown) {
  const raw = String(value || '').trim();
  if (!/^https?:\/\//i.test(raw)) return '';
  try { return new URL(raw).href; } catch { return ''; }
}
function cleanBase(value: unknown) {
  const url = cleanUrl(value);
  return url ? (url.endsWith('/') ? url : `${url}/`) : '';
}
function enc(v: string | null, fallback = '') { return encodeURIComponent((v ?? fallback).trim() || fallback); }
function page(v: string | null) { const n = Number.parseInt(v || '0', 10); return Number.isFinite(n) && n >= 0 ? n : 0; }
function auth() { return `${TOKEN_A}/${TOKEN_B}/`; }
function endpoint(action: string, q: URLSearchParams) {
  const p = page(q.get('page')), t = auth();
  switch (action) {
    case 'home': return `first/${t}`;
    case 'search': return `search/${enc(q.get('query'))}/${p}/${t}`;
    case 'movies': return `movie/by/filtres/${enc(q.get('genre'), '0')}/${enc(q.get('order'), 'created')}/${p}/${t}`;
    case 'series': return `serie/by/filtres/${enc(q.get('genre'), '0')}/${enc(q.get('order'), 'created')}/${p}/${t}`;
    case 'posters': return `poster/by/filtres/${enc(q.get('genre'), '0')}/${enc(q.get('order'), 'created')}/${p}/${t}`;
    case 'posters-year': return `poster/by/year/${enc(q.get('year'))}/${enc(q.get('type'), '0')}/${p}/${t}`;
    case 'years': return `years/all/${t}`;
    case 'genres': return `genre/all/${t}`;
    case 'categories': return `category/all/${t}`;
    case 'countries': return `country/all/${t}`;
    case 'actors': return `actor/all/${p}/${enc(q.get('search'))}/${t}`;
    case 'actor-posters': return `movie/by/actor/${enc(q.get('id'))}/${t}`;
    case 'channels': return `channel/by/filtres/${enc(q.get('category'), '0')}/${enc(q.get('country'), '0')}/${p}/${t}`;
    case 'poster': return `movie/by/${enc(q.get('id'))}/${t}`;
    case 'channel': return `channel/by/${enc(q.get('id'))}/${t}`;
    case 'cast': return `role/by/poster/${enc(q.get('id'))}/${t}`;
    case 'seasons': return `season/by/serie/${enc(q.get('id'))}/${t}`;
    case 'movie-sources': return `movie/source/by/${enc(q.get('id'))}/${t}`;
    case 'episode-sources': return `episode/source/by/${enc(q.get('id'))}/${t}`;
    case 'movie-subs': return `subtitles/by/movie/${enc(q.get('id'))}/${t}`;
    case 'episode-subs': return `subtitles/by/episode/${enc(q.get('id'))}/${t}`;
    case 'random-movies': return `movie/random/${enc(q.get('genres'), '0')}/${t}`;
    case 'random-channels': return `channel/random/${enc(q.get('categories'), '0')}/${t}`;
    default: return '';
  }
}

function safeJson(v: string): any { try { return JSON.parse(v); } catch { return undefined; } }
function decodeBase64Text(value: unknown) {
  try {
    const normalized = String(value || '').trim().replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    if (normalized.length < 4) return null;
    const text = Buffer.from(normalized, 'base64').toString('utf8');
    return !text || text.includes('\uFFFD') ? null : text;
  } catch { return null; }
}
function decodePayload(value: string): any {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const parsed = safeJson(raw);
  if (parsed !== undefined) {
    if (typeof parsed === 'string') {
      const nested = safeJson(parsed);
      if (nested !== undefined) return nested;
      const decoded = decodeBase64Text(parsed);
      if (decoded != null) return safeJson(decoded) ?? decoded;
    }
    return parsed;
  }
  const anchor = raw.indexOf('W3s');
  if (anchor >= 0) {
    const tail = raw.slice(anchor).match(/^[A-Za-z0-9+/_=-]+/)?.[0];
    const decoded = tail ? decodeBase64Text(tail) : null;
    if (decoded) return safeJson(decoded) ?? decoded;
  }
  const decoded = decodeBase64Text(raw.replace(/^"|"$/g, ''));
  return decoded != null ? (safeJson(decoded) ?? decoded) : raw;
}

async function fetchTimed(url: string, init: RequestInit = {}, timeout = 16000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try { return await fetch(url, { ...init, signal: ctl.signal, redirect: 'follow', cache: 'no-store' }); }
  finally { clearTimeout(timer); }
}

function makeFid() {
  const bytes = crypto.randomBytes(17);
  bytes[0] = (bytes[0] & 0x0f) | 0x70;
  return bytes.toString('base64url').slice(0, 22);
}
function decodeRobust(value: unknown) {
  let output = String(value || '').trim();
  const decoded = decodeBase64Text(output);
  if (decoded) output = decoded.trim();
  if (output.startsWith('cipher_key_')) output = output.slice('cipher_key_'.length);
  return cleanUrl(output);
}
async function firebaseValidationUrl() {
  const trace: string[] = [];
  try {
    const fid = makeFid();
    const install = await fetchTimed(`https://firebaseinstallations.googleapis.com/v1/projects/${FIREBASE.projectId}/installations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': FIREBASE.apiKey },
      body: JSON.stringify({ fid, authVersion: 'FIS_v2', appId: FIREBASE.appId, sdkVersion: 'a:17.2.0' })
    }, 10000);
    trace.push(`fis_${install.status}`);
    if (!install.ok) throw new Error(`fis_${install.status}`);
    const installed: any = await install.json();
    const token = installed?.authToken?.token;
    if (!token) throw new Error('fis_no_token');
    const remote = await fetchTimed(`https://firebaseremoteconfig.googleapis.com/v1/projects/${FIREBASE.projectNumber}/namespaces/firebase:fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': FIREBASE.apiKey, 'X-Goog-Firebase-Installations-Auth': token },
      body: JSON.stringify({
        appId: FIREBASE.appId,
        appInstanceId: installed.fid || fid,
        appInstanceIdToken: token,
        appVersion: '4.2f',
        appBuild: '42',
        packageName: FIREBASE.packageName,
        countryCode: 'YE',
        languageCode: 'ar',
        platformVersion: '15',
        timeZone: 'Asia/Aden',
        sdkVersion: '22.1.2',
        analyticsUserProperties: {}
      })
    }, 10000);
    trace.push(`remote_${remote.status}`);
    if (!remote.ok) throw new Error(`remote_${remote.status}`);
    const body: any = await remote.json();
    return { url: decodeRobust(body?.entries?.Robust_small) || DEFAULT_VALIDATION_URL, trace };
  } catch (e: any) {
    trace.push(e?.name === 'AbortError' ? 'remote_timeout' : `remote_error:${e?.message || 'unknown'}`);
    return { url: DEFAULT_VALIDATION_URL, trace };
  }
}
function makeIdentity() {
  const androidId = crypto.createHash('sha256').update('alam-aldrama3-web-4.2f').digest('hex').slice(0, 16);
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(androidId, salt, 10000, 32, 'sha256');
  return { androidId, salt, key };
}
function encryptSignature(identity: ReturnType<typeof makeIdentity>) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', identity.key, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(`${Date.now()}|${APP_SIGNATURE}`, 'utf8')), cipher.final()]);
  return Buffer.concat([iv, encrypted, cipher.getAuthTag()]).toString('base64');
}
function decryptConfig(value: string, key: Buffer) {
  const raw = Buffer.from(String(value || '').trim(), 'base64');
  if (raw.length < 29) throw new Error('encrypted_config_too_short');
  const iv = raw.subarray(0, 12), tag = raw.subarray(raw.length - 16), ciphertext = raw.subarray(12, raw.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const text = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  const parsed = safeJson(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('config_not_json');
  return parsed;
}
function extractConfig(response: any, key: Buffer) {
  if (!response || typeof response !== 'object') return null;
  const encrypted = (response.status === 'encrypted_config_v2' && typeof response.data === 'string' ? response.data : '') || response.encrypted_config_v2 || response.encryptedConfigV2 || response.data?.encrypted_config_v2;
  if (typeof encrypted === 'string' && encrypted.trim()) {
    try { return decryptConfig(encrypted, key); } catch {}
  }
  if (typeof response.base_api_url === 'string') return response;
  if (response.data && typeof response.data === 'object' && typeof response.data.base_api_url === 'string') return response.data;
  return null;
}
async function resolveBase(force = false) {
  const env = cleanBase(process.env.DRAMA_API_BASE_URL);
  if (env) return env;
  if (!force && configCache.base && Date.now() - configCache.at < TTL) return configCache.base;
  const remote = await firebaseValidationUrl();
  const identity = makeIdentity();
  try {
    const response = await fetchTimed(remote.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'User-Agent': 'Aldrama3App/1.0',
        'X-Request-ID': crypto.randomUUID()
      },
      body: JSON.stringify({
        data: encryptSignature(identity),
        android_id: identity.androidId,
        salt: identity.salt.toString('base64')
      })
    }, 14000);
    const parsed = safeJson(await response.text());
    const trace = [...remote.trace, `validate_${response.status}`];
    if (!response.ok) throw Object.assign(new Error(String(parsed?.message || parsed?.error || `validation_${response.status}`)), { trace });
    const cfg: any = extractConfig(parsed, identity.key);
    const base = cleanBase(cfg?.base_api_url);
    if (!base) throw Object.assign(new Error('validation_config_missing'), { trace });
    configCache = { base, at: Date.now(), validationUrl: remote.url, trace, error: '' };
    return base;
  } catch (e: any) {
    configCache = { base: '', at: Date.now(), validationUrl: remote.url, trace: e?.trace || remote.trace, error: e?.message || 'validation_failed' };
    return '';
  }
}
function candidateBases(dynamicBase: string) {
  return [...new Set([
    cleanBase(process.env.DRAMA_API_BASE_URL),
    dynamicBase,
    goodBase.base && Date.now() - goodBase.at < TTL ? goodBase.base : '',
    LAST_KNOWN_API_BASE
  ].filter(Boolean))];
}
async function upstream(action: string, q: URLSearchParams) {
  const path = endpoint(action, q);
  if (!path) throw Object.assign(new Error('unknown_action'), { status: 400 });
  const cached = responseCache.get(path);
  if (cached && Date.now() - cached.at < 90000) return { data: cached.data, base: cached.base, cached: true };
  const dynamicBase = await resolveBase(false);
  let last = configCache.error || 'backend_unavailable';
  for (const base of candidateBases(dynamicBase)) {
    try {
      const response = await fetchTimed(new URL(path, base).href, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'ar-YE,ar;q=0.9,en;q=0.6',
          'User-Agent': 'okhttp/4.9.2',
          'Cache-Control': 'max-age=2',
          'X-Request-ID': crypto.randomUUID()
        }
      }, 22000);
      const text = await response.text();
      const data = decodePayload(text);
      if (response.ok && !/Just a moment|cf-chl|cloudflare/i.test(text.slice(0, 2000))) {
        goodBase = { base, at: Date.now() };
        responseCache.set(path, { at: Date.now(), data, base });
        return { data, base };
      }
      last = `upstream_${response.status}`;
    } catch (e: any) {
      last = e?.name === 'AbortError' ? 'timeout' : (e?.message || 'request_failed');
    }
  }
  if (cached) return { data: cached.data, base: cached.base, cached: true, stale: true };
  throw Object.assign(new Error(last), { status: 502 });
}

function privateHost(host: string) { return /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(host); }
async function inspectSource(raw: string) {
  const source = new URL(raw);
  if (!['http:', 'https:'].includes(source.protocol) || privateHost(source.hostname)) throw new Error('unsupported_source');
  const res = await fetchTimed(source.href, { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,*/*', 'Referer': `${source.origin}/` } }, 14000);
  const type = res.headers.get('content-type') || '';
  if (/video|mpegurl|octet-stream/i.test(type) || /\.(m3u8|mp4|webm)(?:\?|#|$)/i.test(res.url)) return [res.url];
  const text = (await res.text()).slice(0, 900000).replace(/\\\//g, '/').replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
  const absolute = [...text.matchAll(/https?:\/\/[^"'<>\s]+/g)].map(m => m[0].replace(/["'<>]+$/g, ''));
  const quoted = [...text.matchAll(/(?:file|src|source|url)\s*[:=]\s*["']([^"']+)["']/gi)].map(m => m[1]);
  const urls = [...absolute, ...quoted].map(v => { try { return new URL(v, source).href; } catch { return ''; } }).filter(v => /m3u8|\.mp4|\.webm|googlevideo|manifest/i.test(v));
  return [...new Set(urls)].slice(0, 24);
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const action = q.get('action') || 'home';
  if (action === 'health') {
    const base = await resolveBase(q.get('refresh') === '1');
    return NextResponse.json({
      ok: Boolean(base),
      configured: Boolean(TOKEN_A && TOKEN_B),
      dynamicBase: Boolean(base),
      baseHost: base ? new URL(base).host : null,
      validationHost: configCache.validationUrl ? new URL(configCache.validationUrl).host : null,
      trace: configCache.trace,
      error: configCache.error
    });
  }
  if (action === 'inspect-source') {
    try { return NextResponse.json({ ok: true, urls: await inspectSource(q.get('url') || '') }); }
    catch (e: any) { return NextResponse.json({ ok: false, error: e?.message || 'inspect_failed' }, { status: 400 }); }
  }
  try {
    const result = await upstream(action, q);
    return NextResponse.json({ ok: true, action, data: result.data, sourceHost: new URL(result.base).host, cached: Boolean((result as any).cached), stale: Boolean((result as any).stale) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'backend_unavailable', trace: configCache.trace }, { status: e?.status || 502 });
  }
}
