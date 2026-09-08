import type { Metadata, Viewport } from 'next';
import './globals.css';
import './native-polish.css';
import Shell from '@/components/Shell';

export const metadata: Metadata = {
  title: { default: 'Anime Witcher', template: '%s | Anime Witcher' },
  description: 'Anime Witcher Web — نسخة الويب الرسمية المطابقة لتجربة التطبيق.',
  applicationName: 'Anime Witcher',
  appleWebApp: { capable: true, title: 'Anime Witcher', statusBarStyle: 'default' },
  icons: { icon: '/anime-witcher-icon.webp', apple: '/anime-witcher-icon.webp' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body><Shell>{children}</Shell></body></html>;
}
