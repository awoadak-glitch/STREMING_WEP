import AnimeCard from '@/components/AnimeCard';
import { safeSearch } from '@/lib/algolia';
import { animeId, normalizeAnime } from '@/lib/normalize';

export const revalidate = 90;

function clean(value: any) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function sameTag(raw: any, tag: string) {
  const wanted = clean(tag);
  const tags = Array.isArray(raw?.tags)
    ? raw.tags
    : Array.isArray(raw?.details?.tags)
      ? raw.details.tags
      : [];
  return tags.some((x: any) => clean(x) === wanted);
}

export default async function CategoryPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: encoded } = await params;
  const tag = decodeURIComponent(encoded);

  // Some Anime Witcher Algolia indexes expose tags in the record but do not
  // expose them as filterable facets. Build the category from the same real
  // indexes and filter locally instead of returning an empty page.
  const results = await Promise.all([
    safeSearch('all', '', { hitsPerPage: 1000 }),
    safeSearch('series_fav_count_desc', '', { hitsPerPage: 350 }),
    safeSearch('series_date_created', '', { hitsPerPage: 350 }),
    safeSearch('best_mal_ranked', '', { hitsPerPage: 350 }),
    safeSearch('all_animation', '', { hitsPerPage: 350 }),
  ]);

  const seen = new Set<string>();
  const hits: any[] = [];
  for (const result of results) {
    for (const raw of result.hits || []) {
      if (!sameTag(raw, tag)) continue;
      const id = animeId(raw) || String(raw?.objectID || raw?.id || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      hits.push(raw);
    }
  }

  // Last real-data fallback for indexes where the tag is searchable but not faceted.
  if (!hits.length) {
    const searched = await Promise.all([
      safeSearch('all', tag, { hitsPerPage: 250 }),
      safeSearch('series', tag, { hitsPerPage: 250 }),
    ]);
    for (const result of searched) {
      for (const raw of result.hits || []) {
        if (!sameTag(raw, tag)) continue;
        const id = animeId(raw) || String(raw?.objectID || raw?.id || '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        hits.push(raw);
      }
    }
  }

  const items = hits.map(normalizeAnime);
  return <section className="native-list-page category-native-page">
    <div className="native-grid">{items.map((anime, i) => <AnimeCard key={`${anime.id}-${i}`} anime={anime} />)}</div>
    {!items.length && <div className="status-message">لا توجد أنميات ضمن تصنيف «{tag}» حاليًا.</div>}
  </section>;
}
