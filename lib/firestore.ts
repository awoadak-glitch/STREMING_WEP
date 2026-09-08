import { FIREBASE_PROJECT_ID, FIREBASE_WEB_API_KEY } from './config';

type FireValue = Record<string, any>;

const base = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function decodeValue(v: FireValue): any {
  if (!v || typeof v !== 'object') return v;
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('timestampValue' in v) return v.timestampValue;
  if ('referenceValue' in v) return v.referenceValue;
  if ('geoPointValue' in v) return v.geoPointValue;
  if ('bytesValue' in v) return v.bytesValue;
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue?.fields || {});
  return v;
}

function decodeFields(fields: Record<string, FireValue>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields || {})) out[key] = decodeValue(value);
  return out;
}

function docId(name?: string) {
  return name?.split('/').filter(Boolean).pop() || '';
}

async function firestoreFetch(url: string, init?: RequestInit) {
  const separator = url.includes('?') ? '&' : '?';
  const res = await fetch(`${url}${separator}key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`, {
    ...init,
    next: { revalidate: 90 },
    headers: { Accept: 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Firestore ${res.status}: ${body.slice(0, 220)}`);
  }
  return res.json();
}

export async function getDocument(path: string): Promise<Record<string, any> | null> {
  try {
    const data = await firestoreFetch(`${base}/${path.replace(/^\/+/, '')}`);
    return { id: docId(data.name), path, ...decodeFields(data.fields || {}) };
  } catch (e: any) {
    if (String(e?.message).includes('Firestore 404')) return null;
    throw e;
  }
}

export async function listDocuments(
  path: string,
  options: { pageSize?: number; orderBy?: string; pageToken?: string } = {},
): Promise<{ items: Record<string, any>[]; nextPageToken?: string }> {
  const q = new URLSearchParams();
  q.set('pageSize', String(options.pageSize || 100));
  if (options.orderBy) q.set('orderBy', options.orderBy);
  if (options.pageToken) q.set('pageToken', options.pageToken);
  const data = await firestoreFetch(`${base}/${path.replace(/^\/+/, '')}?${q}`);
  return {
    items: (data.documents || []).map((d: any) => ({
      id: docId(d.name),
      path: d.name?.split('/documents/')[1] || '',
      ...decodeFields(d.fields || {}),
    })),
    nextPageToken: data.nextPageToken,
  };
}

export function refToPath(ref: unknown): string {
  if (typeof ref !== 'string') return '';
  const marker = '/documents/';
  return ref.includes(marker) ? ref.split(marker)[1] : ref.replace(/^\/+/, '');
}

export function asArabic(value: any, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return fallback;
  return value.ar || value.arabic || value.name || value.en || Object.values(value).find(v => typeof v === 'string') as string || fallback;
}
