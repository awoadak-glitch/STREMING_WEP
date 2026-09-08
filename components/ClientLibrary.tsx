'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Saved = { id: string; name: string; poster?: string; type?: string; date?: number };

export function FavoriteButton({ anime }: { anime: Saved }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const list: Saved[] = JSON.parse(localStorage.getItem('aw:favorites') || '[]');
    setOn(list.some(x => x.id === anime.id));
  }, [anime.id]);
  function toggle() {
    const list: Saved[] = JSON.parse(localStorage.getItem('aw:favorites') || '[]');
    const exists = list.some(x => x.id === anime.id);
    const next = exists ? list.filter(x => x.id !== anime.id) : [{ ...anime, date: Date.now() }, ...list];
    localStorage.setItem('aw:favorites', JSON.stringify(next));
    setOn(!exists);
  }
  return <button onClick={toggle} className={`secondary-button ${on ? 'is-favorite' : ''}`}>{on ? '♥ في المفضلة' : '♡ إضافة للمفضلة'}</button>;
}

export function LocalLibrary({ mode = 'favorites' }: { mode?: 'favorites' | 'history' }) {
  const [items, setItems] = useState<Saved[]>([]);
  useEffect(() => { setItems(JSON.parse(localStorage.getItem(mode === 'history' ? 'aw:history' : 'aw:favorites') || '[]')); }, [mode]);
  if (!items.length) return <div className="empty-state"><div>♡</div><h2>{mode === 'history' ? 'لا يوجد سجل مشاهدة بعد' : 'قائمتك فارغة'}</h2><p>سيتم حفظ العناصر هنا على هذا الجهاز.</p><Link className="primary-button" href="/catalog/anime">تصفح الأنمي</Link></div>;
  return <div className="catalog-grid">{items.map(x => <Link key={x.id} className="saved-card" href={`/anime/${encodeURIComponent(x.id)}`}><div>{x.poster ? <img src={x.poster} alt="" /> : 'AW'}</div><strong>{x.name}</strong><span>{x.type}</span></Link>)}</div>;
}
