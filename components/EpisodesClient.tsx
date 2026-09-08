'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Anime = { id: string; name: string; poster?: string; cover?: string };

function decoded(value: string) {
  let out = String(value || '');
  for (let i = 0; i < 2; i++) {
    if (!/%[0-9A-Fa-f]{2}/.test(out)) break;
    try { const next = decodeURIComponent(out); if (next === out) break; out = next; } catch { break; }
  }
  return out;
}

function epId(ep: any, index: number) {
  return String(ep?.id || ep?.doc_id || ep?.order || index + 1);
}

function epNumber(ep: any) {
  return Number(ep?.order ?? ep?.id ?? ep?.doc_id ?? 0) || 0;
}

export default function EpisodesClient({ anime, episodes }: { anime: Anime; episodes: any[] }) {
  const [selected, setSelected] = useState<any | null>(null);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const canonicalId = decoded(anime.id);
  const sorted = useMemo(() => [...episodes].sort((a, b) => epNumber(b) - epNumber(a)), [episodes]);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('aw:history') || '[]');
      setWatched(new Set(history.filter((x: any) => decoded(String(x.id || '')) === canonicalId).map((x: any) => String(x.episodeId || ''))));
    } catch {}
  }, [canonicalId]);

  return <div className="episodes-screen">
    <header className="episode-topbar">
      <button className="appbar-back" aria-label="رجوع" onClick={() => history.back()}>←</button>
      <h1>{anime.name}</h1>
      <div className="episode-toolbar"><button aria-label="شبكة">▦</button><button aria-label="تصفية">≡</button><button aria-label="المزيد">⋮</button></div>
    </header>

    <div className="episode-app-list">
      {sorted.map((ep: any, index: number) => {
        const id = epId(ep, index);
        const order = epNumber(ep) || sorted.length - index;
        const title = ep.title_translated || ep.title || '';
        const image = ep.thumb_uri || ep.cover || anime.cover || anime.poster;
        const seen = watched.has(id);
        return <button className="episode-app-card" key={`${id}-${index}`} onClick={() => setSelected({ ...ep, _id: id, _order: order, _title: title, _image: image })}>
          <span className={`episode-state ${seen ? 'seen' : ''}`}>✓</span>
          <span className="episode-card-copy"><strong>الحلقة {order}</strong>{title && <small>{title}</small>}</span>
          {image ? <img src={image} alt="" /> : <span className="episode-card-fallback">AW</span>}
        </button>;
      })}
      {!sorted.length && <div className="status-message">لا توجد حلقات متاحة حاليًا.</div>}
    </div>

    {selected && <div className="aw-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setSelected(null)}>
      <section className="episode-preview-modal" role="dialog" aria-modal="true">
        <div className="episode-preview-art">
          {selected._image ? <img src={selected._image} alt="" /> : null}
          <div className="episode-preview-shade" />
          <button className="modal-close" onClick={() => setSelected(null)}>×</button>
          <div className="episode-preview-title"><strong>الحلقة {selected._order}</strong>{selected._title && <span>{selected._title}</span>}</div>
          <div className="episode-preview-rounds"><span>✓</span><Link href="/">⌂</Link></div>
        </div>
        <div className="episode-rating-block">
          <h3>ما رأيك في الحلقة؟</h3>
          <div className="rating-stars">{['سيئة','متوسطة','جيدة','رائعة','أسطورية'].map(label => <button key={label}><b>☆</b><span>{label}</span></button>)}</div>
        </div>
        <Link className="episode-watch-cta" href={`/watch/${encodeURIComponent(canonicalId)}/${encodeURIComponent(String(selected._id))}`}>المشاهدة والتحميل</Link>
      </section>
    </div>}
  </div>;
}
