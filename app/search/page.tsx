import SearchClient from '@/components/SearchClient';
export const metadata = { title: 'البحث' };
export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) { const p = await searchParams; return <><header className="page-header"><h1>البحث</h1><p>ابحث في مكتبة Anime Witcher باستخدام نفس فهرس التطبيق.</p></header><SearchClient showFilters={p.filters === '1'} /></>; }
