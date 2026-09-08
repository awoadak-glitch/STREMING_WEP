import { getAnime, getEpisodes, getServers } from '@/lib/content';
import { groupServers } from '@/lib/servers';
import { asArabic } from '@/lib/firestore';
import { normalizeAnime } from '@/lib/normalize';
import PlayerClient from '@/components/PlayerClient';

export const dynamic = 'force-dynamic';
export default async function WatchPage({ params }: { params: Promise<{ animeId: string; episodeId: string }> }) {
  const { animeId, episodeId } = await params;
  const [animeRaw, episodes, serversRaw] = await Promise.all([getAnime(animeId).catch(() => null), getEpisodes(animeId).catch(() => []), getServers(animeId, episodeId).catch(() => [])]);
  const anime = animeRaw ? normalizeAnime(animeRaw) : { name: 'Anime Witcher' } as any;
  const ep = episodes.find((x: any) => String(x.id || x.doc_id || x.order) === episodeId);
  const epName = asArabic(ep?.name, `الحلقة ${ep?.order || episodeId}`);
  const servers = groupServers(serversRaw).map(({ raw, sourceUrl, type, ...safe }) => safe);
  return <div className="watch-page"><div className="watch-title"><h1>{anime.name}</h1><span>{epName}</span></div><PlayerClient animeId={animeId} episodeId={episodeId} animeName={anime.name} episodeName={epName} poster={anime.poster} initialServers={servers} />{!servers.length && <div className="status-message">لم يتم العثور على سيرفرات لهذه الحلقة.</div>}</div>;
}
