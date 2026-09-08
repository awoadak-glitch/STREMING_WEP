import Link from 'next/link';

export default function RecentRow({ items }: { items: any[] }) {
  if (!items.length) return null;
  return <section className="home-section">
    <div className="section-heading"><h2>حلقات جديدة</h2><Link href="/catalog/recent">عرض المزيد ‹</Link></div>
    <div className="recent-list">{items.map((x, i) => <Link key={`${x.animeId}-${x.episodeId}-${i}`} className="recent-card" href={x.episodeId ? `/watch/${encodeURIComponent(x.animeId)}/${encodeURIComponent(x.episodeId)}` : `/anime/${encodeURIComponent(x.animeId)}`}>
      <div className="recent-image">{x.thumb || x.poster ? <img src={x.thumb || x.poster} alt={x.name} loading="lazy" /> : <div className="poster-placeholder">AW</div>}<span className="play-circle">▶</span></div>
      <strong>{x.name}</strong><span>{x.episodeName}</span>
    </Link>)}</div>
  </section>;
}
