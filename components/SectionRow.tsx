import Link from 'next/link';
import AnimeCard from './AnimeCard';
import type { AnimeCardData } from '@/lib/normalize';

export default function SectionRow({ title, items, href, compact = false }: { title: string; items: AnimeCardData[]; href?: string; compact?: boolean }) {
  if (!items?.length) return null;
  return <section className="home-section">
    <div className="section-heading"><h2>{title}</h2>{href && <Link href={href}>عرض المزيد ‹</Link>}</div>
    <div className="horizontal-list">{items.map((x, i) => <AnimeCard key={`${x.id}-${i}`} anime={x} compact={compact} />)}</div>
  </section>;
}
