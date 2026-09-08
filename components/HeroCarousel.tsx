'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { AnimeCardData } from '@/lib/normalize';
import styles from './HeroCarousel.module.css';

export default function HeroCarousel({ items }: { items: AnimeCardData[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(current => items.length ? current % items.length : 0);
  }, [items.length]);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => setIndex(current => (current + 1) % items.length), 5200);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  const activeIndex = index % items.length;
  const item = items[activeIndex] || items[0];
  const image = item.cover || item.poster;

  function onTouchStart(event: React.TouchEvent<HTMLElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: React.TouchEvent<HTMLElement>) {
    if (touchStartX.current == null || items.length < 2) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 42) return;
    setIndex(current => delta < 0
      ? (current + 1) % items.length
      : (current - 1 + items.length) % items.length);
  }

  return (
    <section className={styles.wrapper} aria-label="مختارات الصفحة الرئيسية">
      <div className={styles.viewport} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Link className={styles.card} href={`/anime/${encodeURIComponent(item.id)}`} aria-label={item.name}>
          {image ? <img key={`${item.id}-${activeIndex}`} className={styles.image} src={image} alt={item.name} draggable={false} /> : null}
          <div className={styles.shade} />
          <h1 className={styles.title}>{item.name}</h1>
        </Link>
      </div>

      {items.length > 1 && (
        <div className={styles.dots} aria-label="شرائح مختارات Anime Witcher">
          {items.map((entry, i) => (
            <button
              key={`${entry.id}-${i}`}
              type="button"
              aria-label={`شريحة ${i + 1}`}
              aria-current={i === activeIndex ? 'true' : undefined}
              className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
