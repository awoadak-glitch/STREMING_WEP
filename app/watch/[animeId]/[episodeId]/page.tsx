import { getAnime, getEpisodes, getServers } from '@/lib/content';
import { groupServers } from '@/lib/servers';
import { asArabic } from '@/lib/firestore';
import { normalizeAnime } from '@/lib/normalize';
import PlayerClient from '@/components/PlayerClient';

export const dynamic = 'force-dynamic';

export default async function WatchPage({ params }: { params: Promise<{ animeId: string; episodeId: string }> }) {
  const { animeId, episodeId } = await params;
  const [animeRaw, episodes, serversRaw] = await Promise.all([
    getAnime(animeId).catch(() => null),
    getEpisodes(animeId).catch(() => []),
    getServers(animeId, episodeId).catch(() => []),
  ]);
  const anime: any = animeRaw ? normalizeAnime(animeRaw) : { name: 'Anime Witcher' };
  const canonicalAnimeId = String(animeRaw?.id || anime.id || animeId);
  const ep = episodes.find((x: any) => String(x.id || x.doc_id || x.order) === episodeId);
  const epName = asArabic(ep?.name, `الحلقة ${ep?.order || episodeId}`);
  const servers = groupServers(serversRaw).map(({ raw, sourceUrl, type, url, ...safe }: any) => safe);
  return <PlayerClient animeId={canonicalAnimeId} episodeId={episodeId} animeName={anime.name} episodeName={epName} poster={anime.poster} initialServers={servers as any} />;
}
