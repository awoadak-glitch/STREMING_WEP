import { getAnime, getEpisodes } from '@/lib/content';
import { normalizeAnime } from '@/lib/normalize';
import EpisodesClient from '@/components/EpisodesClient';

export const revalidate = 60;

export default async function EpisodesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [rawAnime, episodes] = await Promise.all([
    getAnime(id).catch(() => null),
    getEpisodes(id).catch(() => []),
  ]);
  const anime: any = rawAnime ? normalizeAnime(rawAnime) : { id, name: 'الحلقات' };
  const canonicalId = String(rawAnime?.id || anime.id || id);
  return <EpisodesClient anime={{ id: canonicalId, name: anime.name, poster: anime.poster, cover: anime.cover }} episodes={episodes} />;
}
