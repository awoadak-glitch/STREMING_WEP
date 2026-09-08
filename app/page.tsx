import HeroCarousel from '@/components/HeroCarousel';
import SectionRow from '@/components/SectionRow';
import RecentRow from '@/components/RecentRow';
import NewsRow from '@/components/NewsRow';
import ContinueWatching from '@/components/ContinueWatching';
import { getHomeData } from '@/lib/content';

export const revalidate = 90;

export default async function HomePage() {
  const data = await getHomeData().catch(() => ({ currentSeason: '', hero: [], recent: [], popular: [], bestMal: [], animations: [], latest: [], news: [] }));
  const heroItems = data.popular.length ? data.popular.slice(0, 10) : data.hero.slice(0, 10);

  return <>
    <HeroCarousel items={heroItems} />
    <ContinueWatching />
    <RecentRow items={data.recent} />
    <SectionRow title="الأكثر شهرة هذا الموسم" items={data.popular} href="/catalog/popular" />
    <SectionRow title="افضل الأنميات عالميا" items={data.bestMal} href="/rankings" />
    <SectionRow title="الانميشن الاكثر مشاهدة" items={data.animations} href="/catalog/animation" />
    <SectionRow title="اخر الأعمال المضافة" items={data.latest} href="/catalog/latest" />
    <NewsRow items={data.news} />
    {!heroItems.length && !data.latest.length && <div className="status-message">تعذر جلب المحتوى الآن. تأكد من إعدادات Firestore/Algolia في المشروع أو متغيرات Vercel.</div>}
  </>;
}
