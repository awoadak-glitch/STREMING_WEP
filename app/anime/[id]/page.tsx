import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAnime, getAnimeExtras } from '@/lib/content';
import { asArabic } from '@/lib/firestore';
import { animeId, getImage, normalizeAnime } from '@/lib/normalize';
import { FavoriteButton } from '@/components/ClientLibrary';
import SectionRow from '@/components/SectionRow';

export const revalidate = 90;

function trailerId(raw: any) {
  const value = raw.youtube_video_id || raw.trailer?.youtube_video_id || raw.trailer?.video_id || raw.trailer?.id || '';
  if (!value) return '';
  const text = String(value);
  const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{6,})/);
  return match?.[1] || text;
}

export default async function AnimeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw: any = await getAnime(id).catch(() => null);
  if (!raw) notFound();
  const extras = await getAnimeExtras(id, raw).catch(() => ({ reviews: [], characters: [], related: [] }));
  const anime = normalizeAnime(raw);
  const canonicalId = animeId(raw) || id;
  const details = raw.details || {};
  const story = asArabic(raw.story || details.story || raw.description, 'لا توجد قصة متاحة لهذا العمل بعد.');
  const english = raw.english_name || details.english_name || details.name_en || '';
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const malId = raw.mal_id || details.mal_id;
  const imdbId = raw.imdb_id || details.imdb_id;
  const youtube = trailerId(raw);
  const poster = anime.poster || '/anime-witcher-icon.webp';
  const cover = anime.cover || poster;
  const note = asArabic(raw.note || details.note, '');
  const isEcchi = tags.some((tag: any) => /ecchi|ايتشي|إيتشي/i.test(String(tag)));

  return <article className="anime-details">
    <section className="details-hero">
      <img className="details-cover" src={cover} alt="" />
      <div className="details-cover-shade" />
      <div className="details-main">
        <img className="details-poster" src={poster} alt={anime.name} />
        <div className="details-title">
          <h1>{anime.name}</h1>{english && <div className="eng">{english}</div>}
          <div className="details-tags">{anime.dubbed && <span>مدبلج</span>}{anime.type && <span>{anime.type}</span>}{anime.year && <span>{anime.year}</span>}{tags.slice(0,4).map((t: any) => <span key={String(t)}>{String(t)}</span>)}</div>
        </div>
      </div>
    </section>

    {(note || isEcchi) && <div className="detail-alerts">
      {note && <div className="detail-note">{note}</div>}
      {isEcchi && <div className="ecchi-note">تنبيه: هذا العمل مصنف ضمن محتوى الإيتشي.</div>}
    </div>}

    <div className="detail-actions">
      <Link className="primary-button" href={`/anime/${encodeURIComponent(canonicalId)}/episodes`}>▶ الحلقات والمشاهدة</Link>
      <FavoriteButton anime={{ id: canonicalId, name: anime.name, poster, type: anime.type }} />
      {youtube && <a className="secondary-button" href={`https://www.youtube.com/watch?v=${encodeURIComponent(youtube)}`} target="_blank" rel="noreferrer">▷ العرض التشويقي</a>}
    </div>

    <div className="details-body">
      <section className="panel"><h2>القصة</h2><p className="story">{story}</p>
        <div className="rating-card"><div className="score-circle">{String(raw.average_rate || raw.rate || raw.rating?.average || '—')}</div><div><strong>تقييم Anime Witcher</strong><p className="story">{raw.views ? `${Number(raw.views).toLocaleString('ar')} مشاهدة` : 'قيّم العمل بعد المشاهدة'}</p></div></div>
        <div className="external-links">{malId && <a href={`https://myanimelist.net/anime/${encodeURIComponent(String(malId))}`} target="_blank" rel="noreferrer">MyAnimeList ↗</a>}{imdbId && <a href={`https://www.imdb.com/title/${encodeURIComponent(String(imdbId))}`} target="_blank" rel="noreferrer">IMDb ↗</a>}</div>
      </section>
      <aside className="panel"><h3>معلومات العمل</h3><div className="info-list">
        <div><span>النوع</span><b>{anime.type || '—'}</b></div><div><span>الموسم</span><b>{anime.season || asArabic(raw.season) || '—'}</b></div><div><span>عام الإنتاج</span><b>{anime.year || '—'}</b></div><div><span>مدة الحلقة</span><b>{raw.duration ? `${raw.duration} دقيقة` : '—'}</b></div><div><span>الحالة</span><b>{asArabic(raw.status || details.status, raw.nextEpTimeInSec ? 'مستمر' : '—')}</b></div><div><span>التصنيف</span><b>{asArabic(raw.tag, tags[0] || '—')}</b></div>
      </div></aside>
    </div>

    {youtube && <section className="panel trailer-panel"><h2>العرض التشويقي</h2><div className="trailer-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube)}`} title={`Trailer ${anime.name}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></section>}

    {extras.characters.length > 0 && <section className="panel detail-section"><h2>الشخصيات</h2><div className="detail-characters">{extras.characters.map((c: any) => {
      const name = asArabic(c.name || c.character_name, 'شخصية');
      const image = getImage(c.main_picture || c.picture || c.image || c.poster);
      return <div className="detail-character" key={c.id || name}>{image ? <img src={image} alt={name} /> : <div className="avatar-fallback">♟</div>}<div><strong>{name}</strong>{c.role && <span>{asArabic(c.role)}</span>}</div></div>;
    })}</div></section>}

    {extras.reviews.length > 0 && <section className="panel detail-section"><h2>المراجعات المثبتة</h2><div className="review-list">{extras.reviews.slice(0,6).map((review: any) => <article className="review-card" key={review.id}><div className="review-head"><strong>{asArabic(review.user_name || review.author || review.name, 'مستخدم')}</strong>{(review.rate || review.rating) && <span>★ {String(review.rate || review.rating)}</span>}</div><p>{asArabic(review.review || review.text || review.comment || review.content, '')}</p></article>)}</div></section>}

    {extras.related.length > 0 && <SectionRow title="أعمال ذات صلة" items={extras.related} />}
  </article>;
}
