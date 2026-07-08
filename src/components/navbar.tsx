import { Film, Tv, Play, Search, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* الشعار */}
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          <Link href="/">StreamHub</Link>
        </div>

        {/* الروابط */}
        <div className="hidden md:flex items-center gap-8 text-slate-300">
          <Link href="/" className="hover:text-blue-400 transition-colors">الرئيسية</Link>
          <Link href="/movies" className="hover:text-blue-400 transition-colors">الأفلام</Link>
          <Link href="/series" className="hover:text-blue-400 transition-colors">المسلسلات</Link>
          <Link href="/anime" className="hover:text-blue-400 transition-colors">الأنمي</Link>
        </div>

        {/* أيقونات جانبية */}
        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-white transition-colors">
            <Search size={20} />
          </button>
          <button className="text-slate-400 hover:text-white transition-colors">
            <Heart size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
