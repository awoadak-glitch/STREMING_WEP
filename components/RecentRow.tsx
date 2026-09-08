import Link from 'next/link';

function relativeDate(value: any) {
  let ms = 0;
  if (value && typeof value === 'object') ms = Number(value._seconds ?? value.seconds ?? 0) * 1000;
  else if (typeof value === 'number') ms = value > 1e12 ? value : value * 1000;
  else if (typeof value === 'string') ms = Date.parse(value);
  if (!ms) return '';
  const diff = Math.max(0, Date.now() - ms);
  const min = Math.floor(diff / 60000);
  if (min < 60) return min <= 1 ? 'منذ دقيقة' : `منذ ${min} دقيقة`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return hours === 1 ? 'منذ ساعة' : hours === 2 ? 'منذ ساعتين' : `منذ ${hours} ساعات`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'منذ يوم' : `منذ ${days} أيام`;
}

export default function RecentRow({ items }: { items: any[] }) {
  if (!items.length) return null;
  return <section className="home-section recent-app-section">
    <div className="recent-app-list">{items.slice(0, 10).map((x, i) => <Link key={`${x.animeId}-${x.episodeId}-${i}`} className="recent-app-card" href={x.episodeId ? `/watch/${encodeURIComponent(x.animeId)}/${encodeURIComponent(x.episodeId)}` : `/anime/${encodeURIComponent(x.animeId)}`}>
      <div className="recent-app-poster">{x.thumb || x.poster ? <img src={x.thumb || x.poster} alt={x.name} loading={i < 3 ? 'eager' : 'lazy'} /> : <div className="poster-placeholder">AW</div>}<span className="episode-yellow-badge">{x.episodeName || 'حلقة جديدة'}</span></div>
      <strong>{x.name}</strong><small>{relativeDate(x.date)}</small>
    </Link>)}</div>
  </section>;
}
