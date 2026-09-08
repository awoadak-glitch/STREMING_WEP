'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const items = [
  ['⌂', 'الصفحة الرئيسية', '/'],
  ['▦', 'قائمة الأنمي', '/catalog/anime'],
  ['◈', 'قائمة الأنميشن', '/catalog/animation'],
  ['◷', 'المواسم', '/seasons'],
  ['★', 'الاحصائيات العالمية', '/rankings'],
  ['⌛', 'قادم قريبا', '/catalog/upcoming'],
  ['☷', 'قائمتي', '/favorites'],
  ['♥', 'أنمياتي المفضلة', '/favorites'],
  ['♟', 'شخصياتي المفضلة', '/favorites?tab=characters'],
  ['↶', 'اخر المشاهدات', '/history'],
  ['⇩', 'تحميلاتي', '/history?tab=downloads'],
  ['♙', 'الشخصيات', '/characters'],
  ['◫', 'جدول الحلقات', '/show-times'],
  ['✦', 'الأخبار', '/news'],
  ['⚙', 'الاعدادات', '/settings'],
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button menu-button" aria-label="القائمة" onClick={() => setOpen(true)}>☰</button>
        <Link href="/" className="brand"><img src="/anime-witcher-title.webp" alt="Anime Witcher" /></Link>
        <div className="top-actions">
          <Link className="icon-button" href="/search" aria-label="البحث">⌕</Link>
          <Link className="icon-button" href="/search?filters=1" aria-label="التصفية">≡</Link>
        </div>
      </header>
      <aside className={`drawer ${open ? 'drawer-open' : ''}`}>
        <div className="drawer-profile">
          <img src="/anime-witcher-icon.webp" alt="" />
          <div><strong>Anime Witcher</strong><span>تسجيل الدخول</span></div>
          <button className="drawer-close" onClick={() => setOpen(false)}>×</button>
        </div>
        <nav>
          {items.map(([icon, label, href]) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href.split('?')[0]);
            return <Link key={`${label}-${href}`} href={href} className={active ? 'active' : ''} onClick={() => setOpen(false)}><b>{icon}</b><span>{label}</span></Link>;
          })}
        </nav>
      </aside>
      {open && <button aria-label="إغلاق القائمة" className="scrim" onClick={() => setOpen(false)} />}
      <main className="page-content">{children}</main>
      <nav className="mobile-nav">
        <Link href="/">⌂<span>الرئيسية</span></Link>
        <Link href="/catalog/anime">▦<span>الأنمي</span></Link>
        <Link href="/search">⌕<span>بحث</span></Link>
        <Link href="/favorites">♥<span>قائمتي</span></Link>
      </nav>
    </div>
  );
}
