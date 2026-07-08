"use client";
import { useState } from 'react';
import { Search, Film, Star, Bot } from 'lucide-react';

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [showRequest, setShowRequest] = useState(false);

  return (
    <main className="p-6 md:p-12 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        StreamHub Pro
      </h1>
      
      {/* البحث */}
      <div className="relative max-w-xl mx-auto mb-12">
        <input 
          className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
          placeholder="ابحث عن اسم الفيلم أو الأنمي..."
          onChange={(e) => {
            setSearch(e.target.value);
            setShowRequest(e.target.value.length > 2);
          }}
        />
        {showRequest && (
          <div className="mt-4 p-4 bg-slate-800 rounded-xl border border-blue-500/30 flex justify-between items-center">
            <span>لم تجد طلبك؟</span>
            <button className="bg-blue-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Bot size={16} /> طلب محتوى
            </button>
          </div>
        )}
      </div>

      {/* قسم العرض */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-blue-500 transition-all">
            <div className="h-40 bg-slate-800 rounded-lg mb-4 flex items-center justify-center">
              <Film className="text-slate-600" />
            </div>
            <h3 className="font-bold">عنوان المحتوى {i}</h3>
            <p className="text-sm text-slate-400">تقييم: 8.5/10</p>
          </div>
        ))}
      </div>
    </main>
  );
}
