import Link from 'next/link';
import { getAnime, getEpisodes } from '@/lib/content';
import { asArabic } from '@/lib/firestore';
import { normalizeAnime, getImage } from '@/lib/normalize';

export const revalidate = 60;
export default async function EpisodesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [rawAnime, episodes] = await Promise.all([getAnime(id).catch(() => null), getEpisodes(id).catch(() => [])]);
  const anime = rawAnime ? normalizeAnime(rawAnime) : { name: 'الحلقات' } as any;
  return <>
    <header className="page-header"><h1>{anime.name}</h1><p>{episodes.length ? `${episodes.length} حلقة متاحة` : 'قائمة الحلقات'}</p></header>
    <div className="episode-list">{episodes.map((ep: any, index: number) => {
      const epId = String(ep.id || ep.doc_id || ep.order || index + 1);
      const name = asArabic(ep.name, `الحلقة ${ep.order || epId}`);
      const translated = asArabic(ep.title_translated || ep.title, '');
      const thumb = getImage(ep.thumb_uri || ep.cover || anime.poster);
      return <Link className="episode-card" key={`${epId}-${index}`} href={`/watch/${encodeURIComponent(id)}/${encodeURIComponent(epId)}`}>
        {thumb ? <img className="episode-thumb" src={thumb} alt="" /> : <div className="episode-thumb poster-placeholder">AW</div>}
        <div className="episode-info"><strong>{name}</strong>{translated && <span>{translated}</span>}</div>
        {ep.filler && <span className="filler-badge">فلر</span>}<span className="episode-go">‹</span>
      </Link>;
    })}{!episodes.length && <div className="status-message">لا توجد حلقات متاحة أو تعذر جلبها.</div>}</div>
  </>;
}
