import Link from 'next/link';
export default function NewsRow({ items }: { items: any[] }) {
  if (!items.length) return null;
  return <section className="home-section">
    <div className="section-heading"><h2>اخر الاخبار</h2><Link href="/news">عرض المزيد ‹</Link></div>
    <div className="news-row">{items.map((n, i) => {
      const href = n.animeId ? `/anime/${encodeURIComponent(n.animeId)}` : (n.url || '/news');
      const external = /^https?:/.test(href);
      return <a key={`${n.id}-${i}`} className="news-card" href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
        {n.image ? <img src={n.image} alt="" loading="lazy" /> : <div className="news-placeholder">AW</div>}
        <div><strong>{n.title}</strong><span>{n.date ? new Date(n.date).toLocaleDateString('ar') : 'Anime Witcher'}</span></div>
      </a>;
    })}</div>
  </section>;
}
