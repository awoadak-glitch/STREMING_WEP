import { getAnime, getEpisodes, getServers } from '@/lib/content';
import { groupServers } from '@/lib/servers';
import { asArabic } from '@/lib/firestore';
import { normalizeAnime } from '@/lib/normalize';
import PlayerClient from '@/components/PlayerClient';

export const dynamic = 'force-dynamic';

function episodeKey(ep: any) {
  return String(ep?.id ?? ep?.doc_id ?? ep?.order ?? '');
}

function sameEpisode(ep: any, episodeId: string) {
  const candidates = [ep?.id, ep?.doc_id, ep?.order].filter(value => value !== undefined && value !== null).map(String);
  if (candidates.includes(String(episodeId))) return true;
  const wanted = Number(episodeId);
  return Number.isFinite(wanted) && candidates.some(value => Number(value) === wanted);
}

export default async function WatchPage({ params }: { params: Promise<{ animeId: string; episodeId: string }> }) {
  const { animeId, episodeId } = await params;
  const [animeRaw, episodeResults, serversRaw] = await Promise.all([
    getAnime(animeId).catch(() => null),
    getEpisodes(animeId).catch(() => []),
    getServers(animeId, episodeId).catch(() => []),
  ]);

  const anime: any = animeRaw ? normalizeAnime(animeRaw) : { name: 'Anime Witcher' };
  const canonicalAnimeId = String(animeRaw?.id || anime.id || animeId);
  const episodes = [...episodeResults].sort((a: any, b: any) => {
    const av = Number(a?.order ?? a?.id ?? a?.doc_id);
    const bv = Number(b?.order ?? b?.id ?? b?.doc_id);
    if (Number.isFinite(av) && Number.isFinite(bv)) return av - bv;
    return episodeKey(a).localeCompare(episodeKey(b), undefined, { numeric: true });
  });

  const currentIndex = episodes.findIndex((ep: any) => sameEpisode(ep, episodeId));
  const ep = currentIndex >= 0 ? episodes[currentIndex] : episodes.find((x: any) => sameEpisode(x, episodeId));
  const previousEpisodeId = currentIndex > 0 ? episodeKey(episodes[currentIndex - 1]) : '';
  const nextEpisodeId = currentIndex >= 0 && currentIndex < episodes.length - 1 ? episodeKey(episodes[currentIndex + 1]) : '';
  const epName = asArabic(ep?.name, `الحلقة ${ep?.order || episodeId}`);
  const servers = groupServers(serversRaw).map(({ raw, sourceUrl, type, url, ...safe }: any) => safe);

  return <PlayerClient
    animeId={canonicalAnimeId}
    episodeId={episodeId}
    animeName={anime.name}
    episodeName={epName}
    poster={anime.poster}
    initialServers={servers as any}
    previousEpisodeId={previousEpisodeId}
    nextEpisodeId={nextEpisodeId}
  />;
}
