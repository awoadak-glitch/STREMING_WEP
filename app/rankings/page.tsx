import RankingsClient from '@/components/RankingsClient';
import { safeSearch } from '@/lib/algolia';
import { asArabic } from '@/lib/firestore';
import { normalizeAnime } from '@/lib/normalize';

export const revalidate = 90;

export default async function RankingsPage() {
  const result = await safeSearch('best_mal_ranked', '', { hitsPerPage: 150 });
  const items = result.hits.map((raw: any) => ({
    ...normalizeAnime(raw),
    state: asArabic(raw?.details?.state || raw?.state || raw?.status, ''),
  }));
  return <RankingsClient items={items} />;
}
