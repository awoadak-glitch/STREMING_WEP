'use client';

import { useMemo, useState } from 'react';
import AnimeCard from './AnimeCard';
import type { AnimeCardData } from '@/lib/normalize';

type RankingItem = AnimeCardData & { state?: string };
const tabs = ['أفضل الأنميات','أفضل الأنميات المستمرة','أفضل الأفلام','أفضل المسلسلات','أفضل الاوفا','أفضل الاونا'] as const;

function matches(item: RankingItem, tab: typeof tabs[number]) {
  const type = String(item.type || '').trim();
  const state = String(item.state || '').trim();
  if (tab === 'أفضل الأنميات') return true;
  if (tab === 'أفضل الأنميات المستمرة') return /مستمر|يعرض|ongoing|airing/i.test(state);
  if (tab === 'أفضل الأفلام') return /فيلم|movie/i.test(type);
  if (tab === 'أفضل المسلسلات') return /مسلسل|tv/i.test(type);
  if (tab === 'أفضل الاوفا') return /اوفا|ova/i.test(type);
  if (tab === 'أفضل الاونا') return /اونا|ona/i.test(type);
  return true;
}

export default function RankingsClient({ items }: { items: RankingItem[] }) {
  const [tab, setTab] = useState<typeof tabs[number]>('أفضل الأنميات');
  const visible = useMemo(() => {
    const filtered = items.filter(item => matches(item, tab));
    return (filtered.length ? filtered : items).slice(0, 90);
  }, [items, tab]);

  return <section className="native-ranking-page">
    <div className="ranking-tabs" dir="rtl">{tabs.map(label => <button key={label} className={tab === label ? 'active' : ''} onClick={() => setTab(label)}>{label}</button>)}</div>
    <div className="native-grid ranking-native-grid">{visible.map((anime, i) => <AnimeCard key={`${anime.id}-${i}`} anime={anime} />)}</div>
  </section>;
}
