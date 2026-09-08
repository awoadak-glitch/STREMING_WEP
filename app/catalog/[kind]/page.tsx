import CatalogClient from '@/components/CatalogClient';
import { safeSearch } from '@/lib/algolia';
import { normalizeAnime } from '@/lib/normalize';

const catalog: Record<string, { index: string }> = {
  anime: { index: 'all' },
  animation: { index: 'all_animation' },
  popular: { index: 'series_fav_count_desc' },
  latest: { index: 'series_date_created' },
  recent: { index: 'recent' },
  upcoming: { index: 'series' },
};

export const revalidate = 90;

export default async function CatalogPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const cfg = catalog[kind] || catalog.anime;
  const result = await safeSearch(cfg.index, '', { hitsPerPage: 120 });
  let items = result.hits.map(normalizeAnime);
  if (kind === 'upcoming') items = result.hits.filter((raw: any) => /قادم|لم يتم|upcoming/i.test(String(raw?.details?.state || raw?.status || '')) || !raw?.details?.start_date).map(normalizeAnime);
  return <CatalogClient items={items} />;
}
