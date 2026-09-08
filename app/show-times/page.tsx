import AnimeCard from '@/components/AnimeCard';
import { safeSearch } from '@/lib/algolia';
import { asArabic } from '@/lib/firestore';
import { normalizeAnime } from '@/lib/normalize';

const days = ['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'];
export const revalidate = 180;

function dayOf(raw: any) {
  return asArabic(raw?.show_time || raw?.details?.show_time, '').replace(/\s+/g, ' ').trim();
}

async function getDay(day: string) {
  let result = await safeSearch('series', '', { hitsPerPage: 45, filters: `show_time:\"${day}\"` });
  let hits = result.hits;
  if (!hits.length) {
    result = await safeSearch('series', day, { hitsPerPage: 100 });
    hits = result.hits.filter((x: any) => dayOf(x) === day);
  }
  if (!hits.length) {
    result = await safeSearch('series', '', { hitsPerPage: 250 });
    hits = result.hits.filter((x: any) => dayOf(x) === day);
  }
  return hits.map(normalizeAnime);
}

export default async function ShowTimesPage() {
  const all = await Promise.all(days.map(async day => ({ day, items: await getDay(day) })));
  return <section className="native-schedule-page">
    {all.map(({ day, items }) => <section className="schedule-day-section" key={day}>
      <h2>{day}</h2>
      {items.length ? <div className="native-grid schedule-native-grid">{items.map((anime, i) => <AnimeCard key={`${anime.id}-${i}`} anime={anime} />)}</div> : <div className="schedule-empty">لا توجد حلقات مسجلة</div>}
    </section>)}
  </section>;
}
