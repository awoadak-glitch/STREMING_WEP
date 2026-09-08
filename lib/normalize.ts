import { asArabic, refToPath } from './firestore';

export type AnimeCardData = {
  id: string;
  name: string;
  poster: string;
  cover?: string;
  type?: string;
  year?: string | number;
  dubbed?: boolean;
  tags?: string[];
  season?: string;
  rate?: string | number;
};

function imageFrom(value: any): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return value.large || value.medium || value.original || value.uri || value.url || value.en || Object.values(value).find(x => typeof x === 'string') as string || '';
}

function newsDate(value: any): string {
  if (value == null || value === '') return '';
  let candidate: any = value;
  if (typeof candidate === 'object') candidate = candidate.seconds ?? candidate._seconds ?? candidate.timestamp ?? candidate.value ?? '';
  if (typeof candidate === 'number') {
    const ms = candidate > 0 && candidate < 1e12 ? candidate * 1000 : candidate;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }
  const text = String(candidate).trim();
  if (!text) return '';
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const num = Number(text); const ms = num > 0 && num < 1e12 ? num * 1000 : num; const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

export function animeId(raw: any): string {
  if (raw?.objectID) return String(raw.objectID);
  if (raw?.id) return String(raw.id);
  if (raw?.doc_id) return String(raw.doc_id);
  const path = refToPath(raw?.doc_ref || raw?.docRef || raw?.path || '');
  return path.split('/').filter(Boolean).pop() || '';
}

export function normalizeAnime(raw: any): AnimeCardData {
  const details = raw?.details || {};
  return {
    id: animeId(raw),
    name: asArabic(raw?.name, asArabic(details?.name, 'عمل بدون اسم')),
    poster: imageFrom(raw?.poster_uri) || imageFrom(raw?.poster) || imageFrom(details?.poster) || imageFrom(raw?.aniList_poster),
    cover: imageFrom(raw?.cover_uri) || imageFrom(details?.cover),
    type: asArabic(raw?.type, asArabic(details?.type, 'أنمي')),
    year: raw?.year || details?.year || details?.release_year || '',
    dubbed: Boolean(raw?.dubbed || details?.dubbed),
    tags: Array.isArray(raw?.tags) ? raw.tags.map(String) : [],
    season: asArabic(raw?.season || details?.season),
    rate: raw?.average_rate || raw?.rate || details?.rate || '',
  };
}

export function normalizeRecent(raw: any) {
  const poster = imageFrom(raw?.poster_uri) || imageFrom(raw?.poster) || imageFrom(raw?.aniList_poster) || imageFrom(raw?.details?.poster);
  return {
    ...normalizeAnime({ ...raw, id: raw?.anime_id || raw?.objectID, poster_uri: poster }),
    animeId: String(raw?.anime_id || animeId(raw)),
    episodeId: String(raw?.episode_id || raw?.doc_id || ''),
    episodeName: asArabic(raw?.episode_name || raw?.name || raw?.title, 'حلقة جديدة'),
    thumb: imageFrom(raw?.thumb_uri),
    date: raw?.date || '',
  };
}

export function normalizeNews(raw: any) {
  return {
    id: String(raw?.objectID || raw?.id || ''),
    animeId: String(raw?.anime_id || ''),
    title: asArabic(raw?.title, 'خبر'),
    image: imageFrom(raw?.thumb_link || raw?.thumb_uri),
    url: String(raw?.news_link || ''),
    date: newsDate(raw?.date_created ?? raw?.created_at ?? raw?.published_at ?? raw?.date ?? ''),
  };
}

export function getImage(value: any) { return imageFrom(value); }
