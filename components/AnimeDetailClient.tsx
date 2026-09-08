'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Anime = { id: string; name: string; poster?: string; type?: string };

function countdown(target?: number) {
  const now = Date.now() / 1000;
  const left = Math.max(0, Number(target || 0) - now);
  return {
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: Math.floor(left % 60),
  };
}

export default function AnimeDetailClient({ anime, nextEpTimeInSec, rating, mal }: { anime: Anime; nextEpTimeInSec?: number; rating?: { rate?: number; totalRatingsCount?: number }; mal?: { mean?: number; rank?: number; users?: number; id?: string } }) {
  const [time, setTime] = useState(() => countdown(nextEpTimeInSec));
  const [favorite, setFavorite] = useState(false);
  const [listed, setListed] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [myRate, setMyRate] = useState(0);
  const key = anime.id;

  useEffect(() => {
    const timer = setInterval(() => setTime(countdown(nextEpTimeInSec)), 1000);
    return () => clearInterval(timer);
  }, [nextEpTimeInSec]);

  useEffect(() => {
    try {
      const fav = JSON.parse(localStorage.getItem('aw:favorites') || '[]');
      const list = JSON.parse(localStorage.getItem('aw:list') || '[]');
      const rates = JSON.parse(localStorage.getItem('aw:ratings') || '{}');
      setFavorite(fav.some((x: any) => x.id === key));
      setListed(list.some((x: any) => x.id === key));
      setMyRate(Number(rates[key] || 0));
    } catch {}
  }, [key]);

  const saved = useMemo(() => ({ id: anime.id, name: anime.name, poster: anime.poster, type: anime.type, date: Date.now() }), [anime]);
  function toggle(storage: 'aw:favorites' | 'aw:list', current: boolean, setter: (v: boolean) => void) {
    try {
      const list = JSON.parse(localStorage.getItem(storage) || '[]');
      const next = current ? list.filter((x: any) => x.id !== key) : [saved, ...list.filter((x: any) => x.id !== key)];
      localStorage.setItem(storage, JSON.stringify(next)); setter(!current);
    } catch {}
  }
  function saveRate(value: number) {
    try {
      const rates = JSON.parse(localStorage.getItem('aw:ratings') || '{}');
      rates[key] = value; localStorage.setItem('aw:ratings', JSON.stringify(rates));
    } catch {}
    setMyRate(value); setRateOpen(false);
  }

  return <>
    {Number(nextEpTimeInSec || 0) > Date.now() / 1000 && <section className="next-episode-block">
      <h3>حلقة جديدة بعد (وقت تقريبي) :</h3>
      <div className="countdown-cards">
        <div><b>{time.days}</b><span>يوم</span></div><div><b>{time.hours}</b><span>ساعة</span></div><div><b>{time.minutes}</b><span>دقيقة</span></div><div><b>{time.seconds}</b><span>ثانية</span></div>
      </div>
    </section>}

    <div className="detail-primary-actions">
      <Link className="watch-download-card" href={`/anime/${encodeURIComponent(anime.id)}/episodes`}><b>▶</b><span>المشاهدة والتحميل</span></Link>
      <div className="witcher-score-card"><b>★</b><strong>{Number(rating?.rate || 0).toFixed(2)}</strong></div>
    </div>

    <div className="detail-library-actions">
      <button className={favorite ? 'on' : ''} onClick={() => toggle('aw:favorites', favorite, setFavorite)}><b>{favorite ? '♥' : '♡'}</b><span>المفضلة</span></button>
      <button className={listed ? 'on' : ''} onClick={() => toggle('aw:list', listed, setListed)}><b>☷<i>+</i></b><span>{listed ? 'في قائمتك' : 'اضف لقائمتك'}</span></button>
      <button className={myRate ? 'on' : ''} onClick={() => setRateOpen(true)}><b>{myRate ? '★' : '☆'}</b><span>{myRate ? `تقييمك ${myRate}` : 'اضف تقييمك'}</span></button>
    </div>

    {(mal?.mean || mal?.rank || mal?.users) && <a className="mal-card" href={mal.id ? `https://myanimelist.net/anime/${encodeURIComponent(mal.id)}` : 'https://myanimelist.net'} target="_blank" rel="noreferrer">
      <div className="mal-logo">MyAnimeList</div>
      <div className="mal-stat"><b>★ {Number(mal.mean || 0).toFixed(2)}</b><span>({Number(mal.users || 0).toLocaleString()})</span></div>
      <div className="mal-stat"><b>#{mal.rank || '—'}</b><span>الترتيب العالمي</span></div>
      <div className="mal-more"><b>↪</b><span>المزيد</span></div>
    </a>}

    {rateOpen && <div className="aw-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setRateOpen(false)}>
      <section className="rate-modal"><h3>ما تقييمك لهذا الأنمي؟</h3><div className="rate-modal-stars">{[1,2,3,4,5].map(n => <button key={n} className={n <= myRate ? 'on' : ''} onClick={() => saveRate(n)}>★</button>)}</div><button className="rate-cancel" onClick={() => setRateOpen(false)}>إلغاء</button></section>
    </div>}
  </>;
}
