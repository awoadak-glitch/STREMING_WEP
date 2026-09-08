import Link from 'next/link';
import type { CSSProperties } from 'react';
import AnimeCard from '@/components/AnimeCard';
import { safeSearch } from '@/lib/algolia';
import { getDocument } from '@/lib/firestore';
import { normalizeAnime } from '@/lib/normalize';

export const dynamic = 'force-dynamic';

const seasonIndexes = [
  'series_fav_count_desc',
  'series_year_desc',
  'series_name_asc',
  'best_mal_ranked',
  'series_date_created',
  'all',
];

const seasonNames = ['شتاء', 'ربيع', 'صيف', 'خريف'] as const;

function tidy(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function seasonKey(value: unknown) {
  return tidy(value).replace(/\s+عام\s+/g, ' ').trim();
}

function uniqueItems(rawItems: any[]) {
  const seen = new Set<string>();
  const output: ReturnType<typeof normalizeAnime>[] = [];
  for (const raw of rawItems) {
    const item = normalizeAnime(raw);
    const key = tidy(item.id || item.name).toLocaleLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

async function getSettings() {
  const constants = await getDocument('Settings/constants').catch(() => null);
  const seasons = constants?.seasons || {};
  return {
    previous: tidy(seasons?.past || seasons?.previous || constants?.season_past || constants?.previous_season),
    current: tidy(seasons?.current || constants?.season_current || constants?.current_season),
    next: tidy(seasons?.next || seasons?.upcoming || constants?.season_next || constants?.next_season),
  };
}

async function getSeasonItems(season: string) {
  if (!season) return [];
  const escaped = season.replace(/"/g, '');
  const filtered = await Promise.all(seasonIndexes.map(index => safeSearch(index, '', {
    hitsPerPage: 180,
    filters: `season:"${escaped}"`,
  })));
  let items = uniqueItems(filtered.flatMap(result => result.hits || []));
  if (items.length) return items;

  const unfiltered = await Promise.all(seasonIndexes.map(index => safeSearch(index, '', { hitsPerPage: 420 })));
  items = uniqueItems(unfiltered.flatMap(result => result.hits || [])).filter(item => seasonKey(item.season) === seasonKey(season));
  if (items.length) return items;

  const byQuery = await Promise.all(['series_fav_count_desc', 'series_year_desc', 'series_name_asc'].map(index => safeSearch(index, season, { hitsPerPage: 180 })));
  return uniqueItems(byQuery.flatMap(result => result.hits || [])).filter(item => !item.season || seasonKey(item.season) === seasonKey(season));
}

function parseSeason(value: string) {
  const match = tidy(value).match(/(شتاء|ربيع|صيف|خريف)(?:\s+عام)?\s+(\d{4})/);
  if (!match) return null;
  return { name: match[1] as (typeof seasonNames)[number], year: Number(match[2]) };
}

function seasonHistory(startValue: string, count = 80) {
  let start = parseSeason(startValue);
  if (!start) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const currentIndex = month <= 3 ? 0 : month <= 6 ? 1 : month <= 9 ? 2 : 3;
    let index = currentIndex + 1;
    let year = now.getFullYear();
    if (index > 3) { index = 0; year += 1; }
    start = { name: seasonNames[index], year };
  }

  let index = seasonNames.indexOf(start.name);
  let year = start.year;
  const output: string[] = [];
  for (let i = 0; i < count; i++) {
    output.push(`${seasonNames[index]} عام ${year}`);
    index -= 1;
    if (index < 0) { index = 3; year -= 1; }
  }
  return output;
}

const tabsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  alignItems: 'stretch',
  background: '#fff',
  borderBottom: '1px solid #e5e5e5',
  boxShadow: '0 2px 7px rgba(0,0,0,.08)',
  direction: 'rtl',
  position: 'sticky',
  top: 0,
  zIndex: 4,
};

function tabStyle(active: boolean): CSSProperties {
  return {
    minHeight: 58,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '9px 3px 7px',
    color: active ? '#e3c300' : '#353535',
    fontWeight: active ? 800 : 650,
    fontSize: 'clamp(13px, 3.7vw, 18px)',
    textDecoration: 'none',
    borderBottom: active ? '4px solid #e6cc00' : '4px solid transparent',
    whiteSpace: 'nowrap',
  };
}

const listRowStyle: CSSProperties = {
  minHeight: 88,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '12px 30px',
  color: '#101010',
  fontSize: 'clamp(20px, 5vw, 27px)',
  fontWeight: 800,
  textDecoration: 'none',
  background: '#fafafa',
  direction: 'rtl',
};

export default async function SeasonsPage({ searchParams }: { searchParams: Promise<{ tab?: string; season?: string }> }) {
  const query = await searchParams;
  const settings = await getSettings();
  const tab = query.tab || 'all';
  const selectedSeason = tidy(query.season);

  const requestedSeason = selectedSeason ||
    (tab === 'current' ? settings.current : tab === 'next' ? settings.next : tab === 'previous' ? settings.previous : '');

  const allActive = !selectedSeason && tab === 'all';
  const nextActive = !selectedSeason && tab === 'next';
  const currentActive = !selectedSeason && tab === 'current';
  const previousActive = !selectedSeason && tab === 'previous';

  const tabBar = <nav style={tabsStyle} aria-label="المواسم">
    <Link href="/seasons?tab=all" style={tabStyle(allActive)}>جميع المواسم</Link>
    <Link href="/seasons?tab=next" style={tabStyle(nextActive)}>الموسم القادم</Link>
    <Link href="/seasons?tab=current" style={tabStyle(currentActive)}>الموسم الحالي</Link>
    <Link href="/seasons?tab=previous" style={tabStyle(previousActive)}>الموسم السابق</Link>
  </nav>;

  if (!requestedSeason) {
    const history = seasonHistory(settings.next || settings.current);
    return <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      {tabBar}
      <div style={{ paddingTop: 8 }}>
        {history.map(value => <Link key={value} href={`/seasons?season=${encodeURIComponent(value)}`} style={listRowStyle}>
          <span>{value}</span><span aria-hidden="true" style={{ fontSize: 42, fontWeight: 400, lineHeight: 1 }}>‹</span>
        </Link>)}
      </div>
    </div>;
  }

  const items = await getSeasonItems(requestedSeason);
  return <div style={{ background: '#fafafa', minHeight: '100vh' }}>
    {tabBar}
    <h2 style={{ textAlign: 'center', color: '#e1c400', fontSize: 'clamp(22px, 5.5vw, 30px)', margin: '20px 0 20px', fontWeight: 900 }}>{requestedSeason}</h2>
    <section className="native-list-page" style={{ paddingTop: 0 }}>
      <div className="native-grid">{items.map((anime, i) => <AnimeCard key={`${anime.id}-${i}`} anime={anime} />)}</div>
      {!items.length && <div className="status-message">لا توجد أعمال متاحة لهذا الموسم حالياً.</div>}
    </section>
  </div>;
}
