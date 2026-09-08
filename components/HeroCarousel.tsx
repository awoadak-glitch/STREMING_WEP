'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { AnimeCardData } from '@/lib/normalize';

export default function HeroCarousel({ items }: { items: AnimeCardData[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => setIndex(x => (x + 1) % items.length), 5200);
    return () => clearInterval(timer);
  }, [items.length]);
  if (!items.length) return <div className="hero hero-empty"><img src="/anime-witcher-title.webp" alt="Anime Witcher" /></div>;
  const item = items[index] || items[0];
  return <section className="hero">
    {item.cover || item.poster ? <img className="hero-bg" src={item.cover || item.poster} alt="" /> : null}
    <div className="hero-shade" />
    <div className="hero-content">
      <span className="eyebrow">مختارات Anime Witcher</span>
      <h1>{item.name}</h1>
      <div className="hero-meta"><span>{item.type || 'أنمي'}</span>{item.season && <span>{item.season}</span>}{item.rate && <span>★ {item.rate}</span>}</div>
      <Link className="primary-button" href={`/anime/${encodeURIComponent(item.id)}`}>عرض التفاصيل</Link>
    </div>
    <div className="hero-dots">{items.map((_, i) => <button key={i} aria-label={`شريحة ${i + 1}`} className={i === index ? 'on' : ''} onClick={() => setIndex(i)} />)}</div>
  </section>;
}
