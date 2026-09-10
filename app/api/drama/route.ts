import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN_A = (process.env.DRAMA_TOKEN_A || '4F5A9C3D9A86FA54EACEDDD635185').trim();
const TOKEN_B = (process.env.DRAMA_TOKEN_B || 'd506abfd-9fe2-4b71-b979-feff21bcad13').trim();
const DEFAULT_BASE = (process.env.DRAMA_API_BASE_URL || 'https://dwapp.arabypros.com/api/').trim();

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

function decodeBase64(raw: string) {
  try {
    const normalized = raw.trim().replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    if (normalized.length < 4) return null;
    const text = Buffer.from(normalized, 'base64').toString('utf8');
    return text.includes('\uFFFD') ? null : text;
  } catch { return null; }
}
function decodePayload(raw: string): any {
  const text = raw.trim();
  if (!text) return null;
  try { const parsed = JSON.parse(text); if (typeof parsed !== 'string') return parsed; const d = decodeBase64(parsed); return d ? safeJson(d) : parsed; } catch {}
  const anchor = text.indexOf('W3s');
  if (anchor >= 0) {
    const candidate = text.slice(anchor).match(/^[A-Za-z0-9+/_=-]+/)?.[0];
    if (candidate) { const d = decodeBase64(candidate); if (d) return safeJson(d); }
  }
  const d = decodeBase64(text.replace(/^"|"$/g, ''));
  return d ? safeJson(d) : text;
}
function safeJson(v: string): any { try { return JSON.parse(v); } catch { return v; } }
function cleanBase(v: string) { return v.endsWith('/') ? v : `${v}/`; }
async function fetchTimed(url: string, init: RequestInit = {}, timeout = 18000) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), timeout);
  try { return await fetch(url, { ...init, signal: ctl.signal, redirect: 'follow', cache: 'no-store' }); }
  finally { clearTimeout(timer); }
}
function privateHost(host: string) { return /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(host); }
async function inspectSource(raw: string) {
  const source = new URL(raw);
  if (!['http:', 'https:'].includes(source.protocol) || privateHost(source.hostname)) throw new Error('unsupported_source');
  const res = await fetchTimed(source.toString(), { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,*/*', 'Referer': `${source.origin}/` } }, 14000);
  const type = res.headers.get('content-type') || '';
  if (/video|mpegurl|octet-stream/i.test(type) || /\.(m3u8|mp4|webm)(?:\?|#|$)/i.test(res.url)) return [res.url];
  const text = (await res.text()).slice(0, 900000).replace(/\\\//g, '/').replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
  const urls = [...text.matchAll(/https?:\/\/[^"'<>\s]+/g)].map(m => m[0].replace(/["'<>]+$/g, '')).filter(u => /m3u8|\.mp4|\.webm|googlevideo|manifest/i.test(u));
  return [...new Set(urls)].slice(0, 24);
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const action = q.get('action') || 'home';
  if (action === 'health') return NextResponse.json({ ok: Boolean(TOKEN_A && TOKEN_B && DEFAULT_BASE), baseHost: new URL(cleanBase(DEFAULT_BASE)).host });
  if (action === 'inspect-source') {
    try { return NextResponse.json({ ok: true, urls: await inspectSource(q.get('url') || '') }); }
    catch (e: any) { return NextResponse.json({ ok: false, error: e?.message || 'inspect_failed' }, { status: 400 }); }
  }
  const path = endpoint(action, q);
  if (!path) return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
  try {
    const url = new URL(path, cleanBase(DEFAULT_BASE));
    const upstream = await fetchTimed(url.toString(), { headers: { 'Accept': 'application/json, text/plain, */*', 'Accept-Language': 'ar-YE,ar;q=0.9,en;q=0.6', 'User-Agent': 'okhttp/4.9.2', 'Cache-Control': 'no-cache' } });
    const data = decodePayload(await upstream.text());
    if (!upstream.ok) return NextResponse.json({ ok: false, error: `upstream_${upstream.status}`, detail: data }, { status: upstream.status });
    return NextResponse.json({ ok: true, action, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.name === 'AbortError' ? 'timeout' : (e?.message || 'backend_unavailable') }, { status: 502 });
  }
}
