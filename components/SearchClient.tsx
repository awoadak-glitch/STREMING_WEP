'use client';
import { FormEvent, useEffect, useState } from 'react';
import AnimeCard from './AnimeCard';

const sorts = [
  ['series', 'الأكثر تفضيلا'], ['series_name_asc', 'الاسم (تصاعدي)'], ['series_name_desc', 'الاسم (تنازلي)'], ['series_year_desc', 'تاريخ الانتاج (تنازلي)'], ['series_year_asc', 'تاريخ الانتاج (تصاعدي)'],
];
export default function SearchClient({ showFilters = false }: { showFilters?: boolean }) {
  const [q, setQ] = useState(''); const [sort, setSort] = useState('series'); const [filters, setFilters] = useState(showFilters); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(false); const [message, setMessage] = useState('اكتب اسم الأنمي للبحث');
  async function run(query = q) { setLoading(true); setMessage(''); try { const r = await fetch(`/api/search?q=${encodeURIComponent(query)}&index=${encodeURIComponent(sort)}`); const d = await r.json(); setItems(d.items || []); setMessage(d.items?.length ? '' : 'لا توجد نتائج'); } catch { setMessage('تعذر إتمام البحث'); } finally { setLoading(false); } }
  function submit(e: FormEvent) { e.preventDefault(); run(); }
  useEffect(() => { if (q.trim().length >= 2) { const t = setTimeout(() => run(q), 450); return () => clearTimeout(t); } }, [sort]);
  return <><form className="search-box-wrap" onSubmit={submit}><input className="search-box" value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث عن أنمي، فيلم أو أنميشن..." autoFocus/><button className="filter-button" type="button" onClick={() => setFilters(x => !x)}>☷ الترتيب</button><button className="primary-button" type="submit">بحث</button></form>{filters && <div className="filters"><label>الترتيب حسب&nbsp;<select value={sort} onChange={e => setSort(e.target.value)}>{sorts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label></div>}{loading && <div className="status-message">جاري البحث...</div>}{!loading && message && <div className="status-message">{message}</div>}<div className="catalog-grid">{items.map((x,i)=><AnimeCard key={`${x.id}-${i}`} anime={x}/>)}</div></>;
}
