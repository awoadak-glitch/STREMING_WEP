import AnimeCard from '@/components/AnimeCard';
import { safeSearch } from '@/lib/algolia';
import { normalizeAnime } from '@/lib/normalize';

export const revalidate = 90;

function sameTag(raw: any, tag: string) {
  const wanted = tag.replace(/\s+/g, ' ').trim().toLowerCase();
  return Array.isArray(raw?.tags) && raw.tags.some((x: any) => String(x).replace(/\s+/g, ' ').trim().toLowerCase() === wanted);
}

export default async function CategoryPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: encoded } = await params;
  const tag = decodeURIComponent(encoded);
  let result = await safeSearch('all', '', { hitsPerPage: 90, filters: `tags:\"${tag.replace(/\"/g, '')}\"` });
  let hits = result.hits;
  if (!hits.length) {
    result = await safeSearch('all', tag, { hitsPerPage: 120 });
    hits = result.hits.filter(x => sameTag(x, tag));
  }
  if (!hits.length) {
    result = await safeSearch('all', '', { hitsPerPage: 250 });
    hits = result.hits.filter(x => sameTag(x, tag));
  }
  const items = hits.map(normalizeAnime);
  return <section className="native-list-page category-native-page">
    <div className="native-grid">{items.map((anime, i) => <AnimeCard key={`${anime.id}-${i}`} anime={anime} />)}</div>
    {!items.length && <div className="status-message">لا توجد أنميات ضمن تصنيف «{tag}» حاليًا.</div>}
  </section>;
}
