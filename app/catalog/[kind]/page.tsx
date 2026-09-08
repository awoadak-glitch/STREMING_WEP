import CatalogClient from '@/components/CatalogClient';
import { safeSearch } from '@/lib/algolia';
import { asArabic, getDocument } from '@/lib/firestore';
import { normalizeAnime } from '@/lib/normalize';

export const revalidate = 90;

const broadAnimeIndexes = [
  'series_name_asc',
  'series_year_desc',
  'series_fav_count_desc',
  'best_mal_ranked',
  'series_date_created',
];

function tidy(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function seasonKey(value: unknown) {
  return tidy(value).replace(/\s+عام\s+/g, ' ').trim();
}

function rawSeason(raw: any) {
  return asArabic(raw?.season, asArabic(raw?.details?.season, ''));
}

function uniqueRaw(rawItems: any[]) {
  const seen = new Set<string>();
  const output: any[] = [];
  for (const raw of rawItems) {
    const item = normalizeAnime(raw);
    const key = tidy(item.id || item.name).toLocaleLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(raw);
  }
  return output;
}

async function searchMany(indexes: string[], hitsPerPage = 320) {
  const results = await Promise.all(indexes.map(index => safeSearch(index, '', { hitsPerPage })));
  return uniqueRaw(results.flatMap(result => result.hits || []));
}

async function nextSeasonName() {
  try {
    const constants = await getDocument('Settings/constants');
    const seasons = constants?.seasons || {};
    return tidy(seasons?.next || seasons?.upcoming || constants?.season_next || constants?.next_season);
  } catch {
    return '';
  }
}

function futureDate(raw: any) {
  let value: any = raw?.details?.start_date ?? raw?.start_date ?? raw?.airing_start ?? raw?.date_start;
  if (!value) return false;
  if (typeof value === 'object') value = value.seconds ?? value._seconds ?? value.timestamp ?? value.value;
  let ms = 0;
  if (typeof value === 'number') ms = value < 1e12 ? value * 1000 : value;
  else ms = Date.parse(String(value));
  return Number.isFinite(ms) && ms > Date.now() - 12 * 60 * 60 * 1000;
}

async function animeCatalog() {
  const primary = await safeSearch('all', '', { hitsPerPage: 260 });
  if (primary.hits.length) return uniqueRaw(primary.hits).map(normalizeAnime);
  return (await searchMany(broadAnimeIndexes, 340)).map(normalizeAnime);
}

async function animationCatalog() {
  const primary = await safeSearch('all_animation', '', { hitsPerPage: 260 });
  if (primary.hits.length) return uniqueRaw(primary.hits).map(normalizeAnime);
  const fallback = await safeSearch('most_watched_animations', '', { hitsPerPage: 220 });
  return uniqueRaw(fallback.hits).map(normalizeAnime);
}

async function upcomingCatalog() {
  const nextSeason = await nextSeasonName();
  const raw = await searchMany(['series', 'series_year_desc', 'series_fav_count_desc', 'series_name_asc', 'best_mal_ranked', 'series_date_created', 'all'], 420);
  let filtered = raw.filter((item: any) => {
    const state = tidy(item?.details?.state || item?.state || item?.status);
    if (/قادم|لم يتم|upcoming|not\s*aired|not\s*yet/i.test(state)) return true;
    if (nextSeason && seasonKey(rawSeason(item)) === seasonKey(nextSeason)) return true;
    return futureDate(item);
  });

  if (!filtered.length && nextSeason) {
    filtered = raw.filter((item: any) => seasonKey(rawSeason(item)) === seasonKey(nextSeason));
  }

  if (!filtered.length) {
    const year = new Date().getFullYear();
    filtered = raw.filter((item: any) => Number(normalizeAnime(item).year || 0) >= year).slice(0, 180);
  }
  return uniqueRaw(filtered).map(normalizeAnime);
}

export default async function CatalogPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;

  if (kind === 'anime') return <CatalogClient items={await animeCatalog()} />;
  if (kind === 'animation') return <CatalogClient items={await animationCatalog()} />;
  if (kind === 'upcoming') return <CatalogClient items={await upcomingCatalog()} />;

  const directIndexes: Record<string, string> = {
    popular: 'series_fav_count_desc',
    latest: 'series_date_created',
    recent: 'recent',
  };
  const index = directIndexes[kind] || 'all';
  const result = await safeSearch(index, '', { hitsPerPage: 180 });
  let items = uniqueRaw(result.hits).map(normalizeAnime);
  if (!items.length) items = await animeCatalog();
  return <CatalogClient items={items} />;
}
