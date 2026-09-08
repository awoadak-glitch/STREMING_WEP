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

function pageTitle(pathname: string) {
  if (pathname === '/') return 'الصفحة الرئيسية';
  if (pathname.startsWith('/catalog/anime')) return 'قائمة الأنمي';
  if (pathname.startsWith('/catalog/animation')) return 'قائمة الأنميشن';
  if (pathname.startsWith('/search')) return 'البحث';
  if (pathname.startsWith('/rankings')) return 'الاحصائيات العالمية';
  if (pathname.startsWith('/seasons')) return 'المواسم';
  if (pathname.startsWith('/favorites')) return 'قائمتي';
  if (pathname.startsWith('/history')) return 'اخر المشاهدات';
  if (pathname.startsWith('/characters')) return 'الشخصيات';
  if (pathname.startsWith('/news')) return 'الأخبار';
  if (pathname.startsWith('/settings')) return 'الاعدادات';
  return 'Anime Witcher';
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const immersive = pathname.startsWith('/anime/') || pathname.startsWith('/watch/');
  return (
    <div className={`app-shell ${immersive ? 'immersive-route' : ''}`}>
      {!immersive && <header className="topbar">
        <button className="icon-button menu-button" aria-label="القائمة" onClick={() => setOpen(true)}>☰</button>
        <strong className="appbar-title">{pageTitle(pathname)}</strong>
        <div className="top-actions"><Link className="icon-button search-icon" href="/search" aria-label="البحث">⌕</Link></div>
      </header>}
      <aside className={`drawer ${open ? 'drawer-open' : ''}`}>
        <div className="drawer-profile">
          <img src="/anime-witcher-icon.webp" alt="" />
          <div><strong>Anime Witcher</strong><span>عالم الأنمي بين يديك</span></div>
          <button className="drawer-close" onClick={() => setOpen(false)}>×</button>
        </div>
        <nav>{items.map(([icon, label, href]) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href.split('?')[0]);
          return <Link key={`${label}-${href}`} href={href} className={active ? 'active' : ''} onClick={() => setOpen(false)}><b>{icon}</b><span>{label}</span></Link>;
        })}</nav>
      </aside>
      {open && <button aria-label="إغلاق القائمة" className="scrim" onClick={() => setOpen(false)} />}
      <main className="page-content">{children}</main>
    </div>
  );
}
