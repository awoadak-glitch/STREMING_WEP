'use client';

import Hls from 'hls.js';
import { useEffect, useRef, useState } from 'react';

type Server = { id: string; name: string; quality: string; url?: string };

export default function PlayerClient({ animeId, episodeId, animeName, episodeName, poster, initialServers }: { animeId: string; episodeId: string; animeName: string; episodeName: string; poster?: string; initialServers: Server[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [servers] = useState(initialServers);
  const [active, setActive] = useState<number | null>(null);
  const [src, setSrc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!src || !videoRef.current) return;
    const video = videoRef.current;
    let hls: Hls | null = null;
    if (/\.m3u8($|\?)/i.test(src) && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else video.src = src;
    video.play().catch(() => {});
    return () => { hls?.destroy(); video.removeAttribute('src'); video.load(); };
  }, [src]);

  async function choose(i: number) {
    setActive(i); setLoading(true); setError('');
    try {
      const res = await fetch(`/api/anime/${encodeURIComponent(animeId)}/episodes/${encodeURIComponent(episodeId)}/servers?resolve=${i}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'تعذر تجهيز رابط هذا السيرفر');
      setSrc(data.url);
      const history = JSON.parse(localStorage.getItem('aw:history') || '[]').filter((x: any) => x.id !== animeId);
      localStorage.setItem('aw:history', JSON.stringify([{ id: animeId, name: animeName, type: episodeName, poster, episodeId, date: Date.now() }, ...history].slice(0, 80)));
    } catch (e: any) { setError(e?.message || 'حدث خطأ أثناء فتح السيرفر'); }
    finally { setLoading(false); }
  }

  return <div className="watch-layout">
    <div className="player-shell">
      {src ? <video ref={videoRef} controls playsInline autoPlay /> : <div className="player-poster"><img src="/anime-witcher-icon.webp" alt="" /><strong>اختر سيرفر للمشاهدة</strong><span>سيتم تشغيل الحلقة هنا مباشرة</span></div>}
    </div>
    <div className="server-panel">
      <div className="server-panel-title"><div><strong>السيرفرات المتاحة</strong><span>{servers.length} سيرفر</span></div><span className="online-dot">● مباشر</span></div>
      {error && <div className="inline-error">{error}</div>}
      <div className="server-list">
        {servers.map((s, i) => <button key={`${s.id}-${i}`} className={active === i ? 'selected' : ''} onClick={() => choose(i)} disabled={loading && active === i}>
          <div><strong>سيرفر : {s.name}</strong><span>{s.quality || 'متعدد'}</span></div><b>{loading && active === i ? '…' : active === i && src ? '✓' : 'اختيار'}</b>
        </button>)}
      </div>
      {src && <a className="download-link" href={src} target="_blank" rel="noreferrer">⇩ فتح رابط الفيديو / التحميل</a>}
    </div>
  </div>;
}
