import { getDocument } from './firestore';
import { SETTINGS } from './config';

type SearchConfig = { appId: string; apiKey: string; browseKey?: string; active: boolean; errorMessage?: string };
let cached: { value: SearchConfig; until: number } | null = null;

function pick(obj: any, ...keys: string[]) {
  for (const k of keys) if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
}

export async function getSearchConfig(): Promise<SearchConfig> {
  if (cached && cached.until > Date.now()) return cached.value;
  const envApp = process.env.ALGOLIA_APP_ID || '';
  const envKey = process.env.ALGOLIA_SEARCH_KEY || '';
  try {
    const constants = await getDocument(SETTINGS.constants);
    const search = constants?.search_settings || constants?.search || {};
    const value = {
      appId: String(pick(search, 'app_id', 'application_id') || pick(constants, 'algolia_app_id') || envApp),
      apiKey: String(pick(search, 'api_key', 'search_api_key') || pick(constants, 'algolia_api_key') || envKey),
      browseKey: String(pick(search, 'browse_api_key') || pick(constants, 'algolia_browse_api_key') || ''),
      active: Boolean(pick(constants, 'is_search_active') ?? true),
      errorMessage: String(pick(search, 'error_message') || ''),
    };
    if (!value.appId || !value.apiKey) throw new Error('Algolia configuration is missing');
    cached = { value, until: Date.now() + 5 * 60_000 };
    return value;
  } catch (error) {
    if (!envApp || !envKey) throw error;
    return { appId: envApp, apiKey: envKey, active: true };
  }
}

function headers(cfg: SearchConfig) {
  return {
    'Content-Type': 'application/json',
    'X-Algolia-Application-Id': cfg.appId,
    'X-Algolia-API-Key': cfg.apiKey,
  };
}

export async function searchIndex(
  index: string,
  query = '',
  params: Record<string, any> = {},
): Promise<{ hits: any[]; nbHits: number; page: number; nbPages: number }> {
  const cfg = await getSearchConfig();
  if (!cfg.active) return { hits: [], nbHits: 0, page: 0, nbPages: 0 };
  const url = `https://${cfg.appId.toLowerCase()}-dsn.algolia.net/1/indexes/${encodeURIComponent(index)}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(cfg),
    body: JSON.stringify({ query, hitsPerPage: 24, page: 0, ...params }),
    next: { revalidate: query ? 15 : 90 },
  });
  if (!res.ok) throw new Error(`Algolia ${res.status}`);
  const data = await res.json();
  return { hits: data.hits || [], nbHits: data.nbHits || 0, page: data.page || 0, nbPages: data.nbPages || 0 };
}

export async function getIndexObject(index: string, objectID: string): Promise<any | null> {
  const cfg = await getSearchConfig();
  if (!cfg.active || !objectID) return null;
  const url = `https://${cfg.appId.toLowerCase()}-dsn.algolia.net/1/indexes/${encodeURIComponent(index)}/${encodeURIComponent(objectID)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: headers(cfg),
    next: { revalidate: 6 * 60 * 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Algolia object ${res.status}`);
  return res.json();
}

export async function safeGetIndexObject(index: string, objectID: string) {
  try { return await getIndexObject(index, objectID); }
  catch { return null; }
}

export async function safeSearch(index: string, query = '', params: Record<string, any> = {}) {
  try { return await searchIndex(index, query, params); }
  catch { return { hits: [], nbHits: 0, page: 0, nbPages: 0 }; }
}
