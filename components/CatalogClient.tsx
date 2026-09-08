'use client';

import { useEffect, useMemo, useState } from 'react';
import AnimeCard from './AnimeCard';
import type { AnimeCardData } from '@/lib/normalize';

const typeOptions = ['الكل','مسلسل','فيلم','اوفا','اونا','خاصة'];

export default function CatalogClient({ items }: { items: AnimeCardData[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('الكل');
  const [dubbed, setDubbed] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('aw:catalog-filter', handler as EventListener);
    return () => window.removeEventListener('aw:catalog-filter', handler as EventListener);
  }, []);

  const visible = useMemo(() => items.filter(item => {
    if (dubbed && !item.dubbed) return false;
    if (type === 'الكل') return true;
    const current = String(item.type || '');
    if (type === 'اوفا') return /اوفا|ova/i.test(current);
    if (type === 'اونا') return /اونا|ona/i.test(current);
    return current.includes(type);
  }), [items, type, dubbed]);

  return <section className="native-list-page">
    <div className="native-grid">{visible.map((anime, i) => <AnimeCard key={`${anime.id}-${i}`} anime={anime} />)}</div>
    {!visible.length && <div className="status-message">لا توجد نتائج بهذه التصفية.</div>}
    {open && <div className="aw-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setOpen(false)}>
      <section className="catalog-filter-modal" role="dialog" aria-modal="true">
        <h3>تصفية قائمة الأنمي</h3>
        <div className="catalog-filter-types">{typeOptions.map(label => <button key={label} className={type === label ? 'active' : ''} onClick={() => setType(label)}>{label}</button>)}</div>
        <label className="catalog-filter-toggle"><input type="checkbox" checked={dubbed} onChange={e => setDubbed(e.target.checked)} /><span>مدبلج فقط</span></label>
        <button className="catalog-filter-done" onClick={() => setOpen(false)}>تم</button>
      </section>
    </div>}
  </section>;
}
