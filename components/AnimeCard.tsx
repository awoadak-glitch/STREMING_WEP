import Link from 'next/link';
import type { AnimeCardData } from '@/lib/normalize';

export default function AnimeCard({ anime, compact = false }: { anime: AnimeCardData; compact?: boolean }) {
  return (
    <Link href={`/anime/${encodeURIComponent(anime.id)}`} className={`anime-card ${compact ? 'compact' : ''}`}>
      <div className="poster-box">
        {anime.poster ? <img src={anime.poster} alt={anime.name} loading="lazy" /> : <div className="poster-placeholder">AW</div>}
        <div className="poster-gradient" />
        {anime.dubbed && <span className="badge dubbed">مدبلج</span>}
        {!!anime.year && <span className="badge year">{String(anime.year)}</span>}
        {!!anime.tags?.[0] && <span className="badge tag">{anime.tags[0]}</span>}
      </div>
      <strong className="anime-title">{anime.name}</strong>
      <span className="anime-type">{anime.type || 'أنمي'}</span>
    </Link>
  );
}
