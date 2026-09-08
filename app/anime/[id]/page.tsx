import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAnime, getAnimeExtras } from '@/lib/content';
import { asArabic } from '@/lib/firestore';
import { animeId, getImage, normalizeAnime } from '@/lib/normalize';
import AnimeDetailClient from '@/components/AnimeDetailClient';
import DetailTabs from '@/components/DetailTabs';

export const revalidate = 90;

function trailerId(raw: any) {
  const value = raw.youtube_video_id || raw.trailer?.youtube_video_id || raw.trailer?.video_id || raw.trailer?.id || '';
  if (!value) return '';
  const text = String(value);
  const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{6,})/);
  return match?.[1] || text;
}
function charName(c: any) {
  return asArabic(c.name || c.character_name || c.character?.name || c.character?.full_name || c.title || c.english_name, 'شخصية');
}
function charImage(c: any) {
  return getImage(c.main_picture || c.picture || c.image || c.poster || c.character?.main_picture || c.character?.picture || c.character?.image || c.images?.jpg?.image_url || c.character?.images?.jpg?.image_url);
}

export default async function AnimeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw: any = await getAnime(id).catch(() => null);
  if (!raw) notFound();
  const extras = await getAnimeExtras(id, raw).catch(() => ({ reviews: [], characters: [], related: [] }));
  const anime: any = normalizeAnime(raw);
  const canonicalId = animeId(raw) || id;
  const details = raw.details || {};
  const story = asArabic(raw.story || details.story || raw.description, 'لا توجد قصة متاحة لهذا العمل بعد.');
  const english = asArabic(raw.english_name || details.english_title || details.english_name || details.name_en, '');
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const youtube = trailerId(raw);
  const poster = anime.poster || '/anime-witcher-icon.webp';
  const cover = anime.cover || poster;
  const state = asArabic(details.state || raw.status || details.status, raw.nextEpTimeInSec ? 'مستمر' : '—');
  const source = asArabic(details.source || raw.source, '—');
  const studio = Array.isArray(details.studio) ? details.studio.join('، ') : asArabic(details.studio, '—');
  const characters = (extras.characters || []).map((c: any) => ({
    id: String(c.id || c.character_id || ''),
    name: charName(c),
    image: charImage(c),
    role: String(c.role || c.character_role || c.character?.role || ''),
    likes: Number(c.fav_count ?? c.favorites ?? c.likes ?? c.statictes?.fav_count ?? 0),
  }));

  return <article className="anime-detail-screen">
    <section className="details-app-hero">
      <img className="details-app-cover" src={cover} alt="" />
      <div className="details-app-cover-shade" />
      <Link className="details-back" href="/" aria-label="رجوع">←</Link>
      <div className="details-app-title"><h1>{anime.name}</h1></div>
    </section>

    <section className="detail-identity">
      <img className="detail-floating-poster" src={poster} alt={anime.name} />
      <div className="detail-identity-copy">
        <h2>{anime.name}</h2>
        <p><b>{details.show_time || raw.show_time || ''}</b>{state && <> · {state}</>}{anime.season && <> · {anime.season}</>}</p>
        <p>{anime.type || 'أنمي'} · {details.eps_num || '—'} {details.age && <>· {details.age}</>}</p>
      </div>
    </section>

    <AnimeDetailClient
      anime={{ id: canonicalId, name: anime.name, poster, type: anime.type }}
      nextEpTimeInSec={Number(raw.nextEpTimeInSec || 0)}
      rating={{ rate: Number(raw.rating?.rate || raw.average_rate || raw.rate || 0), totalRatingsCount: Number(raw.rating?.totalRatingsCount || 0) }}
      mal={{ mean: Number(details.mal_mean || 0), rank: Number(details.mal_rank || 0), users: Number(details.mal_num_scoring_users || 0), id: String(raw.mal_id || details.mal_id || '') }}
    />

    <section className="detail-story-card">
      <p>{story}</p>
      <div className="story-tags">{tags.map((tag: any) => <span key={String(tag)}>{String(tag)}</span>)}</div>
      <div className="story-info-grid">
        <div><span>المصدر :</span><b>{source}</b></div><div><span>مدة الحلقة :</span><b>{raw.duration ? `${raw.duration} دقيقة` : '—'}</b></div>
        <div><span>عرض من :</span><b>{details.start_date || anime.year || '—'}</b></div><div><span>إلى :</span><b>{details.end_date || '؟'}</b></div>
        <div className="wide"><span>الاستوديو :</span><b className="studio-chip">{studio}</b></div>
        {english && <div className="wide"><span>العنوان الإنجليزي :</span><b>{english}</b></div>}
      </div>
    </section>

    {youtube && <a className="app-trailer-card" href={`https://www.youtube.com/watch?v=${encodeURIComponent(youtube)}`} target="_blank" rel="noreferrer">
      <div className="trailer-thumb"><img src={`https://img.youtube.com/vi/${encodeURIComponent(youtube)}/hqdefault.jpg`} alt="" /><span>▶</span></div><strong>العرض الدعائي</strong>
    </a>}

    <DetailTabs characters={characters} related={extras.related || []} />
  </article>;
}
