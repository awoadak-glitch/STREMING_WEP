'use client';

import Hls from 'hls.js';
import { useEffect, useMemo, useRef, useState } from 'react';

type Server = { id: string; name: string; quality: string; url?: string };
type Resolved = { url: string; name: string; quality: string; index: number };
type DialogMode = null | 'actions' | 'players' | 'downloads';

const qualityRank = (q: string) => {
  const n = Number(String(q || '').match(/\d+/)?.[0] || 0);
  return n || -1;
};
const serverRank = (name: string) => {
  const order = ['KF', 'MF2', 'PD', 'ST'];
  const i = order.indexOf(String(name || '').toUpperCase());
  return i < 0 ? 99 : i;
};
function cleanId(value: string) {
  let out = String(value || '');
  for (let i = 0; i < 2; i++) {
    if (!/%[0-9A-Fa-f]{2}/.test(out)) break;
    try { const next = decodeURIComponent(out); if (next === out) break; out = next; } catch { break; }
  }
  return out;
}
function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = Math.floor(value % 60).toString().padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2,'0')}:${s}` : `${m}:${s}`;
}

export default function PlayerClient({ animeId, episodeId, animeName, episodeName, poster, initialServers }: { animeId: string; episodeId: string; animeName: string; episodeName: string; poster?: string; initialServers: Server[] }) {
  const canonicalAnimeId = cleanId(animeId);
  const canonicalEpisodeId = cleanId(episodeId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerBoxRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [stateMap, setStateMap] = useState<Record<number, 'ok' | 'error'>>({});
  const [inlineError, setInlineError] = useState('');
  const [src, setSrc] = useState('');
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);

  const groups = useMemo(() => {
    const withIndex = initialServers.map((server, index) => ({ ...server, _index: index }));
    const map = new Map<string, typeof withIndex>();
    for (const server of withIndex) {
      const q = server.quality || 'متعدد';
      if (!map.has(q)) map.set(q, []);
      map.get(q)!.push(server);
    }
    return [...map.entries()]
      .sort((a, b) => qualityRank(b[0]) - qualityRank(a[0]))
      .map(([quality, servers]) => ({ quality, servers: [...servers].sort((a, b) => serverRank(a.name) - serverRank(b.name)) }));
  }, [initialServers]);

  useEffect(() => {
    if (!src || !videoRef.current) return;
    const video = videoRef.current;
    let hls: Hls | null = null;
    if (/\.m3u8($|\?)/i.test(src) && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src;
    }
    const sync = () => { setCurrent(video.currentTime || 0); setDuration(video.duration || 0); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener('timeupdate', sync);
    video.addEventListener('durationchange', sync);
    video.addEventListener('loadedmetadata', sync);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.playbackRate = rate;
    video.play().catch(() => {});
    return () => {
      hls?.destroy();
      video.removeEventListener('timeupdate', sync);
      video.removeEventListener('durationchange', sync);
      video.removeEventListener('loadedmetadata', sync);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeAttribute('src');
      video.load();
    };
  }, [src]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = rate; }, [rate]);

  function remember() {
    try {
      const list = JSON.parse(localStorage.getItem('aw:history') || '[]');
      const filtered = list.filter((x: any) => !(cleanId(String(x.id || '')) === canonicalAnimeId && String(x.episodeId || '') === canonicalEpisodeId));
      localStorage.setItem('aw:history', JSON.stringify([{ id: canonicalAnimeId, name: animeName, type: episodeName, poster, episodeId: canonicalEpisodeId, date: Date.now() }, ...filtered].slice(0, 80)));
    } catch {}
  }

  async function choose(index: number) {
    setActive(index); setLoading(true); setInlineError('');
    try {
      const res = await fetch(`/api/anime/${encodeURIComponent(canonicalAnimeId)}/episodes/${encodeURIComponent(canonicalEpisodeId)}/servers?resolve=${index}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'تعذر تجهيز رابط هذا السيرفر');
      const next = { url: data.url, name: data.name || initialServers[index]?.name || '', quality: data.quality || initialServers[index]?.quality || '', index };
      setResolved(next);
      setStateMap(prev => ({ ...prev, [index]: 'ok' }));
      setDialog('actions');
      remember();
    } catch (e: any) {
      setStateMap(prev => ({ ...prev, [index]: 'error' }));
      setInlineError(e?.message || 'هذا السيرفر غير متاح حاليًا، جرّب سيرفرًا آخر.');
    } finally { setLoading(false); }
  }

  function openIntent(url: string, packageName: string) {
    try {
      const u = new URL(url);
      const intent = `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(':','')};action=android.intent.action.VIEW;type=video/*;package=${packageName};end`;
      const before = document.visibilityState;
      window.location.href = intent;
      setTimeout(() => { if (document.visibilityState === before) window.open(url, '_blank', 'noopener,noreferrer'); }, 1100);
    } catch { window.open(url, '_blank', 'noopener,noreferrer'); }
  }

  function quickPlay() {
    if (!resolved) return;
    setSrc(resolved.url);
    setPlayerOpen(true);
    setDialog(null);
    remember();
  }
  function mxPlay() { if (resolved) { setDialog(null); openIntent(resolved.url, 'com.mxtech.videoplayer.ad'); } }
  function otherPlay() { if (resolved) { setDialog(null); window.open(resolved.url, '_blank', 'noopener,noreferrer'); } }
  function directDownload() {
    if (!resolved) return;
    const a = document.createElement('a');
    a.href = resolved.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.download = '';
    document.body.appendChild(a); a.click(); a.remove(); setDialog(null);
  }
  function admDownload() { if (resolved) { setDialog(null); openIntent(resolved.url, 'com.dv.adm'); } }
  async function otherDownload() {
    if (!resolved) return;
    setDialog(null);
    try { if (navigator.share) await navigator.share({ title: `${animeName} - ${episodeName}`, url: resolved.url }); else window.open(resolved.url, '_blank', 'noopener,noreferrer'); }
    catch {}
  }

  function togglePlay() {
    const video = videoRef.current; if (!video) return;
    if (video.paused) video.play().catch(() => {}); else video.pause();
  }
  function seek(delta: number) { const video = videoRef.current; if (video) video.currentTime = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + delta)); }
  function seekTo(value: number) { const video = videoRef.current; if (video) video.currentTime = value; }
  async function fullscreen() {
    const box = playerBoxRef.current as any;
    try { if (!document.fullscreenElement) await box?.requestFullscreen?.(); else await document.exitFullscreen?.(); } catch {}
  }

  return <div className="server-screen">
    <header className="server-topbar">
      <button className="appbar-back" onClick={() => history.back()} aria-label="رجوع">←</button>
      <button className="server-more">⋮</button>
      <div className="episode-nav-arrows"><button>‹</button><button>›</button></div>
      <h1>{episodeName}</h1>
    </header>

    <div className="quality-groups">
      {groups.map(group => <section className="quality-group" key={group.quality}>
        <h2>{group.quality}</h2>
        <div className="quality-server-list">
          {group.servers.map(server => {
            const i = server._index;
            const state = stateMap[i];
            return <div className={`quality-server-card ${active === i ? 'active' : ''}`} key={`${server.id}-${i}`}>
              <span className={`server-health ${state || ''}`}>{state === 'ok' ? '✓' : state === 'error' ? '!' : ''}</span>
              <strong>سيرفر : {server.name}</strong>
              <button onClick={() => choose(i)} disabled={loading && active === i}>{loading && active === i ? '...' : 'اختيار'}</button>
            </div>;
          })}
        </div>
      </section>)}
      {!initialServers.length && <div className="status-message">لم يتم العثور على سيرفرات لهذه الحلقة.</div>}
      {inlineError && <div className="server-toast">{inlineError}</div>}
    </div>

    {dialog && resolved && <div className="aw-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setDialog(null)}>
      {dialog === 'actions' && <section className="mini-action-modal">
        <h3>{resolved.quality || 'الجودة المختارة'}</h3>
        <div className="big-action-icons">
          <button onClick={() => setDialog('downloads')}><b>⇩</b><span>تحميل</span></button>
          <button onClick={() => setDialog('players')}><b>▶</b><span>مشاهدة</span></button>
        </div>
      </section>}
      {dialog === 'players' && <section className="choice-modal">
        <h3>المشاهدة بواسطة؟</h3>
        <div className="choice-row"><button className="accent-choice" onClick={quickPlay}>المشغل السريع</button><button onClick={mxPlay}>مشغل MX</button><button onClick={otherPlay}>أخرى</button></div>
      </section>}
      {dialog === 'downloads' && <section className="choice-modal download-choice-modal">
        <h3>تحميل ({episodeName}) بواسطة؟</h3>
        <p>ملاحظة: عند استخدام التحميل المباشر سيتم فتح رابط الملف وإضافته لسجل تحميلاتك في المتصفح.</p>
        <div className="choice-row"><button className="accent-choice" onClick={directDownload}>التنزيل المباشر</button><button onClick={admDownload}>ADM</button><button onClick={otherDownload}>أخرى</button></div>
      </section>}
    </div>}

    {playerOpen && src && <div className="custom-player-overlay">
      <div className="custom-player" ref={playerBoxRef}>
        <video ref={videoRef} playsInline onClick={togglePlay} poster={poster} />
        <div className="custom-player-top"><div><strong>{animeName}</strong><span>{episodeName} · {resolved?.quality}</span></div><button onClick={() => { setPlayerOpen(false); setSrc(''); }}>×</button></div>
        <button className="center-play" onClick={togglePlay}>{playing ? 'Ⅱ' : '▶'}</button>
        <div className="custom-player-controls">
          <input aria-label="شريط المشاهدة" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(current, duration || 0)} onChange={e => seekTo(Number(e.target.value))} />
          <div className="control-row">
            <div className="left-controls"><button onClick={fullscreen}>⛶</button><button onClick={() => setRate(r => r >= 2 ? .75 : Number((r + .25).toFixed(2)))}>{rate}×</button></div>
            <span className="player-time">{formatTime(current)} / {formatTime(duration)}</span>
            <div className="right-controls"><button onClick={() => seek(10)}>+10</button><button onClick={togglePlay}>{playing ? 'Ⅱ' : '▶'}</button><button onClick={() => seek(-10)}>-10</button></div>
          </div>
        </div>
      </div>
    </div>}
  </div>;
}
