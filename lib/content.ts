import { HOME_INDEXES } from './config';
import { asArabic, getDocument, listDocuments } from './firestore';
import { safeSearch } from './algolia';
import { normalizeAnime, normalizeNews, normalizeRecent } from './normalize';

function seasonText(raw: any) {
  return asArabic(raw?.season, asArabic(raw?.details?.season, '')).replace(/\s+/g, ' ').trim();
}

function isSameSeason(raw: any, currentSeason: string) {
  if (!currentSeason) return true;
  return seasonText(raw) === currentSeason.replace(/\s+/g, ' ').trim();
}

function decodedId(value: string) {
  let out = String(value || '');
  for (let i = 0; i < 2; i++) {
    if (!/%[0-9A-Fa-f]{2}/.test(out)) break;
    try {
      const next = decodeURIComponent(out);
      if (next === out) break;
      out = next;
    } catch { break; }
  }
  return out;
}

function pathSegment(value: string) {
  return encodeURIComponent(decodedId(value));
}

async function getPopularSeason(currentSeason: string) {
  const exact = await safeSearch(HOME_INDEXES.popularSeason, '', {
    hitsPerPage: 12,
    ...(currentSeason ? { filters: `season:\"${currentSeason.replace(/\"/g, '')}\"` } : {}),
  });
  if (exact.hits.length || !currentSeason) return exact;

  const bySeasonQuery = await safeSearch(HOME_INDEXES.popularSeason, currentSeason, { hitsPerPage: 100 });
  const queriedHits = bySeasonQuery.hits.filter(hit => isSameSeason(hit, currentSeason)).slice(0, 12);
  if (queriedHits.length) return { ...bySeasonQuery, hits: queriedHits, nbHits: queriedHits.length };

  const unfiltered = await safeSearch(HOME_INDEXES.popularSeason, '', { hitsPerPage: 250 });
  const seasonalHits = unfiltered.hits.filter(hit => isSameSeason(hit, currentSeason)).slice(0, 12);
  if (seasonalHits.length) return { ...unfiltered, hits: seasonalHits, nbHits: seasonalHits.length };

  const fallbackHits = unfiltered.hits.slice(0, 12);
  return { ...unfiltered, hits: fallbackHits, nbHits: fallbackHits.length };
}

export async function getHomeData() {
  let currentSeason = '';
  try {
    const constants = await getDocument('Settings/constants');
    currentSeason = String(constants?.current_season || '');
  } catch {}

  const [recent, popular, bestMal, animations, latest, news] = await Promise.all([
    safeSearch(HOME_INDEXES.recent, '', { hitsPerPage: 14 }),
    getPopularSeason(currentSeason),
    safeSearch(HOME_INDEXES.bestMal, '', { hitsPerPage: 12 }),
    safeSearch(HOME_INDEXES.animations, '', { hitsPerPage: 12 }),
    safeSearch(HOME_INDEXES.latest, '', { hitsPerPage: 12 }),
    safeSearch(HOME_INDEXES.news, '', { hitsPerPage: 8 }),
  ]);

  let hero = popular.hits.slice(0, 6).map(normalizeAnime);
  if (!hero.length) hero = latest.hits.slice(0, 6).map(normalizeAnime);

  return {
    currentSeason,
    hero,
    recent: recent.hits.map(normalizeRecent),
    popular: popular.hits.map(normalizeAnime),
    bestMal: bestMal.hits.map(normalizeAnime),
    animations: animations.hits.map(normalizeAnime),
    latest: latest.hits.map(normalizeAnime),
    news: news.hits.map(normalizeNews),
  };
}

export async function getAnime(id: string) {
  const safeId = pathSegment(id);
  const base = await getDocument(`anime_list/${safeId}`);
  if (!base) return null;
  const info = await getDocument(`anime_list/${safeId}/details/anime_info`).catch(() => null);
  const trailer = await getDocument(`anime_list/${safeId}/details/anime_trailer`).catch(() => null);
  return { ...base, ...(info || {}), trailer: trailer || null, id: decodedId(id) };
}

function summaryEpisodes(summary: any) {
  const eps = summary?.episodes;
  if (Array.isArray(eps)) return eps;
  if (eps && typeof eps === 'object') return Object.entries(eps).map(([id, value]) => ({ id, ...(value as any) }));
  return [];
}

export async function getEpisodes(animeId: string) {
  const safeId = pathSegment(animeId);
  const summary = await getDocument(`anime_list/${safeId}/episodes_summery/summery`).catch(() => null);
  const items = summaryEpisodes(summary);
  if (items.length) return items.sort((a: any, b: any) => Number(a.order ?? a.id) - Number(b.order ?? b.id));
  const page = await listDocuments(`anime_list/${safeId}/episodes`, { pageSize: 100, orderBy: 'order' }).catch(() => ({ items: [] }));
  return page.items;
}

export async function getServers(animeId: string, episodeId: string) {
  const path = `anime_list/${pathSegment(animeId)}/episodes/${pathSegment(episodeId)}`;
  const collection = await listDocuments(`${path}/servers`, { pageSize: 100 }).catch(() => ({ items: [] }));
  if (collection.items.length) return collection.items;
  const summary = await getDocument(`${path}/servers2`).catch(() => null);
  const all = summary?.all_servers;
  if (Array.isArray(all)) return all;
  if (all && typeof all === 'object') return Object.entries(all).map(([id, value]) => ({ id, ...(value as any) }));
  return [];
}

export async function getCharacters() {
  const result = await safeSearch('characters', '', { hitsPerPage: 40 });
  return result.hits;
}

export async function getNews() {
  const result = await safeSearch('news', '', { hitsPerPage: 40 });
  return result.hits.map(normalizeNews);
}

export async function getAnimeExtras(id: string, raw?: any) {
  const safeId = pathSegment(id);
  const [reviewsPage, charactersPage] = await Promise.all([
    listDocuments(`anime_list/${safeId}/reviews`, { pageSize: 8 }).catch(() => ({ items: [] })),
    listDocuments(`anime_list/${safeId}/characters`, { pageSize: 16 }).catch(() => ({ items: [] })),
  ]);

  const relatedIds = Array.isArray(raw?.related_anime_ids)
    ? raw.related_anime_ids.map((x: any) => String(x?.id || x)).filter(Boolean).slice(0, 12)
    : [];
  const relatedRaw = await Promise.all(relatedIds.map((relatedId: string) =>
    getDocument(`anime_list/${pathSegment(relatedId)}`).catch(() => null)
  ));

  return {
    reviews: reviewsPage.items,
    characters: charactersPage.items,
    related: relatedRaw.filter(Boolean).map(normalizeAnime),
  };
}
