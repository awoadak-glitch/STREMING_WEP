'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './DramaFusion.module.css';
import {
  type DramaItem,
  type DramaKind,
  asList,
  dramaFetch,
  episodesOf,
  isRecord,
  itemBackdrop,
  itemDescription,
  itemId,
  itemImage,
  itemRating,
  itemSubtitle,
  itemTitle,
  itemYear,
  sourceLabel,
  sourceUrl,
} from '@/lib/drama-client';

function mergeDetail(base: DramaItem, payload: any): DramaItem {
  if (isRecord(payload)) return { ...base, ...payload };
  const list = asList(payload);
  return list[0] ? { ...base, ...list[0] } : base;
}

function embeddedSources(item: DramaItem) {
  const candidates = [item.sources, item.source, item.streams, item.links, item.servers];
  for (const value of candidates) {
    if (Array.isArray(value)) return value.filter(isRecord);
    if (isRecord(value)) {
      const list = asList(value);
      if (list.length) return list;
    }
  }
  return sourceUrl(item) ? [item] : [];
}

export default function DramaDetailClient({ kind, id }: { kind: DramaKind; id: string }) {
  const router = useRouter();
  const [details, setDetails] = useState<DramaItem>({ id });
  const [cast, setCast] = useState<DramaItem[]>([]);
  const [seasons, setSeasons] = useState<DramaItem[]>([]);
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [sources, setSources] = useState<DramaItem[]>([]);
  const [sourcesTitle, setSourcesTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingUrl, setPlayingUrl] = useState('');

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const detailPayload = await dramaFetch(kind === 'channels' ? 'channel' : 'poster', { id });
        if (!alive) return;
        const merged = mergeDetail({ id }, detailPayload);
        setDetails(merged);

        if (kind !== 'channels') {
          dramaFetch('cast', { id }).then(value => { if (alive) setCast(asList(value)); }).catch(() => undefined);
        }

        if (kind === 'series') {
          const seasonPayload = await dramaFetch('seasons', { id });
          if (alive) setSeasons(asList(seasonPayload));
        } else if (kind === 'movies') {
          setSourcesLoading(true);
          const sourcePayload = await dramaFetch('movie-sources', { id });
          if (alive) {
            setSources(asList(sourcePayload));
            setSourcesTitle('سيرفرات المشاهدة والتنزيل');
          }
        } else {
          const direct = embeddedSources(merged);
          setSources(direct);
          setSourcesTitle('سيرفرات القناة');
        }
      } catch {
        if (alive) setError('تعذر تحميل تفاصيل هذا العمل حالياً');
      } finally {
        if (alive) { setLoading(false); setSourcesLoading(false); }
      }
    }
    void load();
    return () => { alive = false; };
  }, [id, kind]);

  const episodes = useMemo(() => seasons[seasonIndex] ? episodesOf(seasons[seasonIndex]) : [], [seasons, seasonIndex]);

  async function openEpisode(episode: DramaItem, index: number) {
    const episodeId = itemId(episode);
    if (!episodeId) return;
    setSourcesTitle(itemTitle(episode) === 'بدون عنوان' ? `الحلقة ${index + 1}` : itemTitle(episode));
    setSources([]);
    setSourcesLoading(true);
    try {
      const payload = await dramaFetch('episode-sources', { id: episodeId });
      setSources(asList(payload));
      requestAnimationFrame(() => document.getElementById('drama-sources')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch {
      setSources([]);
    } finally {
      setSourcesLoading(false);
    }
  }

  async function play(source: DramaItem) {
    const raw = sourceUrl(source);
    if (!raw) return;
    let url = raw;
    if (!/\.(?:mp4|webm|m3u8)(?:$|[?#])/i.test(raw)) {
      try {
        const payload = await dramaFetch('inspect-source', { url: raw });
        const inspected = Array.isArray(payload?.urls) ? payload.urls : [];
        if (inspected[0]) url = String(inspected[0]);
      } catch { /* use original source */ }
    }
    setPlayingUrl(url);
  }

  if (loading) return <div className={styles.loading}><span className={styles.spinner}/></div>;
  if (error) return <div className={styles.empty}>{error}</div>;

  const backdrop = itemBackdrop(details) || itemImage(details);
  const title = itemTitle(details);

  return <div className={styles.detail}>
    <section className={styles.detailHero}>
      {backdrop ? <img src={backdrop} alt={title} /> : null}
      <div className={styles.detailShade}/>
      <button className={styles.back} onClick={() => router.back()} aria-label="رجوع">‹</button>
      <div className={styles.detailTitle}>
        <h1>{title}</h1>
        <div className={styles.detailMeta}>
          {itemYear(details) && <span>{itemYear(details)}</span>}
          {itemRating(details) && <span>★ {itemRating(details)}</span>}
          {itemSubtitle(details) && <span>{itemSubtitle(details)}</span>}
          <span>{kind === 'series' ? 'مسلسل' : kind === 'movies' ? 'فيلم' : 'بث مباشر'}</span>
        </div>
      </div>
    </section>

    <div className={styles.body}>
      {itemDescription(details) && <p className={styles.description}>{itemDescription(details)}</p>}

      {cast.length > 0 && <section>
        <h2 className={styles.sectionTitle}>فريق العمل</h2>
        <div className="character-strip">
          {cast.slice(0, 14).map((member, index) => {
            const image = itemImage(member);
            return <div className="app-character-card" key={`${itemId(member)}-${index}`}>
              <div className="character-art">{image ? <img src={image} alt={itemTitle(member)} /> : <div className="poster-placeholder">AW</div>}</div>
              <strong>{itemTitle(member)}</strong>
              <span>{String(member.role ?? member.character ?? member.job ?? '')}</span>
            </div>;
          })}
        </div>
      </section>}

      {kind === 'series' && <section>
        <h2 className={styles.sectionTitle}>الحلقات</h2>
        {seasons.length > 0 ? <>
          <div className={styles.seasonTabs}>
            {seasons.map((season, index) => <button
              className={`${styles.seasonButton} ${index === seasonIndex ? styles.seasonActive : ''}`}
              key={`${itemId(season)}-${index}`}
              onClick={() => { setSeasonIndex(index); setSources([]); setSourcesTitle(''); }}
            >{itemTitle(season) === 'بدون عنوان' ? `الموسم ${index + 1}` : itemTitle(season)}</button>)}
          </div>
          {episodes.length ? <div className={styles.episodes}>
            {episodes.map((episode, index) => <button className={styles.episode} key={`${itemId(episode)}-${index}`} onClick={() => void openEpisode(episode, index)}>
              <span className={styles.episodePlay}>▶</span>
              <strong>{itemTitle(episode) === 'بدون عنوان' ? `الحلقة ${index + 1}` : itemTitle(episode)}</strong>
            </button>)}
          </div> : <div className={styles.empty}>لا توجد حلقات في هذا الموسم.</div>}
        </> : <div className={styles.empty}>لا توجد مواسم متاحة حالياً.</div>}
      </section>}

      {(kind !== 'series' || sourcesTitle || sourcesLoading) && <section id="drama-sources" className={styles.sourcePanel}>
        <h2 className={styles.sectionTitle}>{sourcesTitle || (kind === 'channels' ? 'سيرفرات القناة' : 'السيرفرات')}</h2>
        <SourceList sources={sources} loading={sourcesLoading} onPlay={play} />
      </section>}
    </div>

    {playingUrl && <DramaPlayer url={playingUrl} onClose={() => setPlayingUrl('')} />}
  </div>;
}

function SourceList({ sources, loading, onPlay }: { sources: DramaItem[]; loading: boolean; onPlay: (source: DramaItem) => Promise<void> }) {
  if (loading) return <div className={styles.loading} style={{minHeight:140}}><span className={styles.spinner}/></div>;
  if (!sources.length) return <div className={styles.empty} style={{minHeight:120}}>لا توجد سيرفرات متاحة الآن.</div>;
  return <div className={styles.sources}>
    {sources.map((source, index) => {
      const url = sourceUrl(source);
      return <div className={styles.source} key={`${sourceLabel(source,index)}-${index}`}>
        <button className={styles.playButton} onClick={() => void onPlay(source)} aria-label="تشغيل">▶</button>
        <button style={{border:0,background:'transparent',textAlign:'right',padding:0}} className={styles.sourceText} onClick={() => void onPlay(source)}>
          <strong>{sourceLabel(source,index)}</strong>
          <small>تشغيل سريع • سيرفر {index + 1}</small>
        </button>
        {url ? <a className={styles.downloadButton} href={url} target="_blank" rel="noreferrer" download aria-label="تنزيل">↓</a> : <span/>}
      </div>;
    })}
  </div>;
}

function DramaPlayer({ url, onClose }: { url: string; onClose: () => void }) {
  const direct = /\.(?:mp4|webm|ogg)(?:$|[?#])/i.test(url);
  return <div className={styles.player}>
    <div className={styles.playerBar}>
      <button onClick={onClose}>✕</button>
      <strong>المشغل</strong>
      <a href={url} target="_blank" rel="noreferrer">فتح خارجي</a>
    </div>
    {direct ? <video src={url} controls autoPlay playsInline /> : <iframe className={styles.playerFrame} src={url} title="Drama player" allow="autoplay; fullscreen; encrypted-media" allowFullScreen />}
  </div>;
}
