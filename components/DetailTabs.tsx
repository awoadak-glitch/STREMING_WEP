'use client';

import Link from 'next/link';
import { useState } from 'react';

type Character = { id?: string; name: string; image?: string; role?: string; likes?: number };
type Related = { id: string; name: string; poster?: string; type?: string };

export default function DetailTabs({ characters, related }: { characters: Character[]; related: Related[] }) {
  const [tab, setTab] = useState<'characters' | 'related' | 'similar'>('characters');
  const main = characters.filter(c => /main|رئيس/i.test(c.role || ''));
  const support = characters.filter(c => !/main|رئيس/i.test(c.role || ''));
  const cards = (items: Character[]) => <div className="character-strip">{items.map((c, i) => <article className="app-character-card" key={`${c.id || c.name}-${i}`}>
    <div className="character-art">{c.image ? <img src={c.image} alt={c.name} /> : <div className="character-gradient" />}{c.likes !== undefined && <span>♥ {c.likes}</span>}<strong>{c.name}</strong></div>
  </article>)}</div>;
  const relatedCards = <div className="related-strip">{related.map((a, i) => <Link href={`/anime/${encodeURIComponent(a.id)}`} className="related-app-card" key={`${a.id}-${i}`}>{a.poster ? <img src={a.poster} alt={a.name} /> : <div className="poster-placeholder">AW</div>}<strong>{a.name}</strong><span>{a.type || 'أنمي'}</span></Link>)}</div>;

  return <section className="detail-tabs-wrap">
    <div className="detail-tabs"><button className={tab === 'characters' ? 'active' : ''} onClick={() => setTab('characters')}>الشخصيات</button><button className={tab === 'related' ? 'active' : ''} onClick={() => setTab('related')}>ذات صلة</button><button className={tab === 'similar' ? 'active' : ''} onClick={() => setTab('similar')}>أنميات مشابهة</button></div>
    <div className="detail-tab-content">
      {tab === 'characters' && <>{main.length > 0 && <><h2>الشخصيات الرئيسية</h2>{cards(main)}</>}{support.length > 0 && <><h2>الشخصيات المساعدة</h2>{cards(support)}</>}{!characters.length && <div className="tab-empty">لا توجد شخصيات متاحة.</div>}</>}
      {tab === 'related' && (related.length ? relatedCards : <div className="tab-empty">لا توجد أعمال ذات صلة.</div>)}
      {tab === 'similar' && (related.length ? relatedCards : <div className="tab-empty">سيتم عرض الأنميات المشابهة عند توفرها.</div>)}
    </div>
  </section>;
}
