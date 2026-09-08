import type { Metadata } from 'next';
import './globals.css';
import Shell from '@/components/Shell';

export const metadata: Metadata = {
  title: { default: 'Anime Witcher', template: '%s | Anime Witcher' },
  description: 'Anime Witcher Web — نسخة الويب الرسمية المطابقة لتجربة التطبيق.',
  icons: { icon: '/anime-witcher-icon.webp', apple: '/anime-witcher-icon.webp' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body><Shell>{children}</Shell></body></html>;
}
