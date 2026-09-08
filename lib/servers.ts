import { QUALITY_ORDER } from './config';

export type ResolvedServer = {
  id: string;
  name: string;
  quality: string;
  url?: string;
  sourceUrl?: string;
  type?: string;
  raw: any;
};

function str(v: any) { return typeof v === 'string' ? v.trim() : ''; }
function first(raw: any, keys: string[]) { for (const k of keys) { const v = str(raw?.[k]); if (v) return v; } return ''; }

export function normalizeServer(raw: any, index = 0): ResolvedServer {
  const name = first(raw, ['name', 'server_name', 'server', 'type']) || `S${index + 1}`;
  const quality = first(raw, ['quality', 'resolution', 'label']) || 'اخري';
  const url = first(raw, ['video_uri', 'video_url', 'direct_url', 'download_url', 'url', 'link', 'uri', 'temp_video_uri']);
  const sourceUrl = first(raw, ['source_url', 'source', 'page_url', 'web_url']);
  return { id: String(raw?.id || raw?.doc_id || index), name, quality, url: url || undefined, sourceUrl: sourceUrl || undefined, type: first(raw, ['type', 'server_type']) || name, raw };
}

export function qualityRank(q: string) {
  const index = QUALITY_ORDER.findIndex(x => q.includes(x.replace('p', '')) || q === x);
  return index < 0 ? 99 : index;
}

export function groupServers(raw: any[]) {
  return raw.map(normalizeServer).sort((a, b) => qualityRank(a.quality) - qualityRank(b.quality));
}

function between(text: string, start: string, end: string) {
  const a = start ? text.indexOf(start) : 0;
  if (a < 0) return '';
  const from = a + (start?.length || 0);
  const b = end ? text.indexOf(end, from) : text.length;
  return text.slice(from, b < 0 ? text.length : b).trim();
}
function cleanFoundUrl(value: string) {
  let out = String(value || '').replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/&amp;/g, '&');
  if (out.startsWith('//')) out = `https:${out}`;
  return out.replace(/["'<>\\\s]+$/g, '');
}

export function resolveFromHtml(server: ResolvedServer, html: string) {
  const raw = server.raw || {};
  const type = (server.type || server.name).toUpperCase();
  const normalized = html.replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/&amp;/g, '&');

  if (type === 'ST') {
    const direct = normalized.match(/(?:https?:)?\/\/(?:www\.)?streamtape\.(?:com|to)\/get_video\?[^"'<>\s]+/i)?.[0];
    if (direct) return cleanFoundUrl(direct);
  }

  const w1 = str(raw.word1), w2 = str(raw.word2), w3 = str(raw.word3), w4 = str(raw.word4);
  let token = between(normalized, w1, w2);
  for (const marker of [w1, w2, w3, w4].filter(Boolean)) token = token.split(marker).join('');
  const eq = token.lastIndexOf('=');
  if (eq >= 0 && !token.includes('http')) token = token.slice(eq + 1);
  token = token.replace(/^['"\s]+|['"\s;<>]+$/g, '').trim();

  if (type === 'ST' && token) {
    if (/^https?:\/\//i.test(token) || token.startsWith('//')) return cleanFoundUrl(token);
    if (!token.includes('+')) return `https://streamtape.com/get_video?id=${encodeURIComponent(token)}&dl=1`;
  }
  if (type === 'VT' && token) return token.startsWith('http') ? token : `https://vidtube.one${token.startsWith('/') ? '' : '/'}${token}`;

  const urls = normalized.match(/https:\/\/[^"'<>\s]+/g)?.map(cleanFoundUrl) || [];
  return urls.find(x => /\.(m3u8|mp4|webm)(?:\?|#|$)/i.test(x)) || urls.find(x => /\/api\/file\//i.test(x)) || urls[0] || '';
}

export function isAllowedFetchUrl(input: string) {
  try {
    const u = new URL(input);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)) return false;
    return true;
  } catch { return false; }
}

export async function signBunnyUrl(input: string, key: string, expiresIn = 28800) {
  if (!key) return input;
  const crypto = await import('node:crypto');
  const url = new URL(input);
  const expires = Math.floor(Date.now() / 1000) + expiresIn;
  const signaturePath = url.pathname;
  const queryEntries = [...url.searchParams.entries()].filter(([k]) => !['token', 'expires', 'bcdn_token'].includes(k)).sort(([a],[b]) => a.localeCompare(b));
  const query = queryEntries.map(([k,v]) => `${k}=${v}`).join('&');
  const hashable = `${key}${signaturePath}${expires}${query ? query : ''}`;
  const token = crypto.createHash('sha256').update(hashable, 'utf8').digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  url.searchParams.set('token', token);
  url.searchParams.set('expires', String(expires));
  return url.toString();
}
