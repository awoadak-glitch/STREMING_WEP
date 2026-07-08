import Navbar from '@/components/Navbar';
import './globals.css'; // تأكد من استدعاء ملف الـ CSS هنا

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased bg-slate-950 text-white">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
