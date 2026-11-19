import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  Shuffle,
  Repeat,
  SkipBack,
  SkipForward,
  Link as LinkIcon,
  Trash2,
  Clock,
  ListMusic,
  Film,
  Download
} from 'lucide-react';
import { getHomeThemeTokens, useHomeUiConfig } from '../contexts/homeUiConfig.ts';

export interface ConvertedTrack {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  sourceUrl: string;
  sourceType: 'tiktok' | 'youtube' | 'web';
  videoUrl?: string;
  audioUrl?: string;
  streamUrl?: string;
  createdAt: number;
}

export function MusicLabPage({
  currentUser,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onDeleteCurrent,
}: {
  currentUser: { id: string; name: string };
  currentTrack: {
    id?: string;
    title: string;
    thumbnail?: string;
    url?: string;
    videoUrl?: string;
    audioUrl?: string;
    source: 'tiktok' | 'youtube' | 'web';
    sourceType?: 'tiktok' | 'youtube' | 'web';
    author?: string;
    sourceUrl?: string;
  } | null;
  isPlaying: boolean;
  onPlayTrack: (track: {
    id?: string;
    title: string;
    thumbnail?: string;
    url?: string;
    videoUrl?: string;
    audioUrl?: string;
    source: 'tiktok' | 'youtube' | 'web';
    sourceType?: 'tiktok' | 'youtube' | 'web';
    author?: string;
    sourceUrl?: string;
  }) => void;
  onTogglePlay: () => void;
  onDeleteCurrent: () => void;
}) {
  const { config: homeUiConfig } = useHomeUiConfig();
  const themeTokens = React.useMemo(
    () =>
      getHomeThemeTokens(
        homeUiConfig.themeId,
        homeUiConfig.boxStyle,
        homeUiConfig.shadowIntensity,
        homeUiConfig.shadowThickness
      ),
    [
      homeUiConfig.themeId,
      homeUiConfig.boxStyle,
      homeUiConfig.shadowIntensity,
      homeUiConfig.shadowThickness,
    ]
  );

  const [linkInput, setLinkInput] = useState('');
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [historyTracks, setHistoryTracks] = useState<ConvertedTrack[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(false);

  // Time & Progress state for video player
  const [currentTimeSec, setCurrentTimeSec] = useState(74); // default 01:14
  const [durationSec, setDurationSec] = useState(225); // default 03:45
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync video play/pause with parent isPlaying state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [isPlaying, currentTrack?.videoUrl]);

  // Load user's converted music history
  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/music-history?userId=${encodeURIComponent(currentUser.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tracks)) {
          setHistoryTracks(data.tracks);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadHistory();
  }, [currentUser.id]);

  // Handle direct link submission
  const handleInspectAndPlay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = linkInput.trim();
    if (!url) return;

    setIsFetchingInfo(true);

    try {
      if (url.includes('tiktok.com') || url.includes('douyin.com')) {
        // Fetch via TikWM API (direct or server proxy fallback)
        let dataJson: any = null;
        try {
          const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
          dataJson = await res.json();
        } catch {
          const res2 = await fetch(`/api/tiktok?url=${encodeURIComponent(url)}`);
          dataJson = await res2.json();
        }

        if (dataJson && dataJson.code === 0 && dataJson.data) {
          const d = dataJson.data;
          const trackData = {
            id: 'tt_' + Date.now(),
            title: d.title || 'TikTok Video',
            author: d.author?.nickname || 'TikTok Creator',
            thumbnail: d.cover || '',
            videoUrl: d.play || '', // Real video without watermark
            audioUrl: d.music || '',
            url: d.play || url,
            source: 'tiktok' as const,
            sourceType: 'tiktok' as const,
            sourceUrl: url,
          };

          onPlayTrack(trackData);

          // Save to server history
          fetch('/api/music-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              track: {
                ...trackData,
                createdAt: Date.now(),
              },
            }),
          }).then(() => loadHistory()).catch(() => {});

          setLinkInput('');
          setIsFetchingInfo(false);
          return;
        }
      }

      // YouTube or Web Fallback
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let title = 'YouTube Video';
        let author = 'YouTube Creator';
        let thumbnail = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';

        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?#/]+)/i);
        const ytid = match ? match[1] : '';
        if (ytid) {
          thumbnail = `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`;
        }

        try {
          const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.title) title = data.title;
            if (data.author_name) author = data.author_name;
          }
        } catch {}

        const ytTrack = {
          id: 'yt_' + Date.now(),
          title,
          author,
          thumbnail,
          url,
          videoUrl: undefined,
          source: 'youtube' as const,
          sourceType: 'youtube' as const,
          sourceUrl: url,
        };

        onPlayTrack(ytTrack);

        fetch('/api/music-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            track: { ...ytTrack, createdAt: Date.now() },
          }),
        }).then(() => loadHistory()).catch(() => {});

        setLinkInput('');
        setIsFetchingInfo(false);
        return;
      }

      // Generic web link
      const fallbackTrack = {
        id: 'web_' + Date.now(),
        title: 'Tautan Musik Web',
        author: 'Web Audio',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
        url,
        videoUrl: undefined,
        source: 'web' as const,
        sourceType: 'web' as const,
        sourceUrl: url,
      };

      onPlayTrack(fallbackTrack);
      setLinkInput('');
    } catch (e) {
      console.warn('Play error:', e);
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime) setCurrentTimeSec(Math.floor(v.currentTime));
    if (v.duration && !isNaN(v.duration) && v.duration > 0) setDurationSec(Math.floor(v.duration));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const targetTime = pos * durationSec;
    setCurrentTimeSec(Math.floor(targetTime));
    if (v) {
      v.currentTime = targetTime;
    }
    if (typeof window !== 'undefined' && window.mainAudio) {
      window.mainAudio.currentTime = targetTime;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = durationSec > 0 ? Math.min(100, Math.max(0, (currentTimeSec / durationSec) * 100)) : 30;

  const handlePrev = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
    if (typeof window !== 'undefined' && window.mainAudio) {
      window.mainAudio.currentTime = Math.max(0, window.mainAudio.currentTime - 10);
    }
    setCurrentTimeSec((p) => Math.max(0, p - 10));
  };

  const handleNext = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(durationSec, videoRef.current.currentTime + 10);
    }
    if (typeof window !== 'undefined' && window.mainAudio) {
      window.mainAudio.currentTime = Math.min(durationSec, window.mainAudio.currentTime + 10);
    }
    setCurrentTimeSec((p) => Math.min(durationSec, p + 10));
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/music-history?userId=${encodeURIComponent(currentUser.id)}&trackId=${encodeURIComponent(trackId)}`, {
        method: 'DELETE',
      });
      setHistoryTracks((prev) => prev.filter((t) => t.id !== trackId));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-transparent text-white pb-[140px]">
      {/* Header - Solid #141414 */}
      <div className="sticky top-0 z-40 bg-[#141414] border-b border-zinc-800 px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-[#242424] border border-zinc-700 flex items-center justify-center text-white shrink-0">
            <Music size={16} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-white leading-none whitespace-nowrap overflow-hidden text-ellipsis">ZE Music Lab</h2>
            <p className="text-[10px] text-zinc-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">Tautan Jadi Musik • TikTok Video Langsung</p>
          </div>
        </div>
        <div className="bg-[#242424] border border-zinc-700 px-3 py-1 rounded-full text-[11px] font-mono font-medium text-white shrink-0 whitespace-nowrap">
          HD Audio
        </div>
      </div>

      <div className="p-4 space-y-5 max-w-md mx-auto">
        {/* Link Input Card - Solid #181818 */}
        <div className="bg-[#181818] border border-zinc-800 rounded-[28px] p-5 shadow-2xl relative overflow-hidden">
          <p className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
            <LinkIcon size={14} className="text-white" strokeWidth={1.5} />
            Paste Link TikTok / YouTube
          </p>

          <form onSubmit={handleInspectAndPlay} className="space-y-3">
            <div className="bg-[#121212] border border-zinc-700 rounded-full px-4 py-3 flex items-center gap-2.5 focus-within:border-zinc-500 transition">
              <Film size={16} className="text-zinc-400 shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="https://vt.tiktok.com/... atau https://youtube.com/..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                className="bg-transparent flex-1 text-xs text-white placeholder-zinc-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!linkInput.trim() || isFetchingInfo}
              className="w-full py-3.5 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition disabled:opacity-40 cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              {isFetchingInfo ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Mengambil Video TikTok Asli...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Putar Video TikTok Langsung</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* TAMPILAN VIDEO TIKTOK - SOLID #181818 */}
        <div className="bg-[#181818] border border-zinc-800 rounded-[32px] p-4 flex flex-col items-center shadow-2xl">
          {/* VIDEO PLAYER TIKTOK - GLOSSY */}
          <div className="w-full aspect-[9/14] max-w-[300px] rounded-[24px] overflow-hidden bg-black relative border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            {currentTrack ? (
              currentTrack.videoUrl || currentTrack.sourceType === 'tiktok' || currentTrack.source === 'tiktok' ? (
                <video
                  ref={videoRef}
                  src={currentTrack.videoUrl || currentTrack.url}
                  poster={currentTrack.thumbnail}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  muted
                  autoPlay={isPlaying}
                  controls={false}
                  onTimeUpdate={handleTimeUpdate}
                />
              ) : (
                <img
                  src={currentTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-black border border-white/10 flex flex-col items-center justify-center p-4 text-center">
                <Music className="w-12 h-12 text-white/20" strokeWidth={1.5} />
                <p className="text-white/40 text-sm mt-3 font-semibold">Paste link TikTok di atas</p>
                <p className="text-white/20 text-[11px] mt-0.5">Video TikTok akan muncul disini</p>
              </div>
            )}

            {currentTrack && (
              <>
                {/* Overlay gradient glossy di atas video */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Judul di atas video */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <p className="text-[10px] text-white/80 bg-black/50 backdrop-blur-md rounded-full px-3 py-1 font-mono font-medium border border-white/10">
                    {currentTrack.source === 'tiktok' ? 'TikTok Video' : 'YouTube Stream'}
                  </p>
                  {isPlaying && (
                    <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1 text-[10px] text-white font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" /> Playing
                    </span>
                  )}
                </div>

                {/* Tombol play di tengah video kalau pause */}
                {!isPlaying && (
                  <button
                    onClick={onTogglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[2px] cursor-pointer transition active:scale-95"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                      <Play className="w-8 h-8 text-black ml-1" />
                    </div>
                  </button>
                )}
              </>
            )}
          </div>

          {/* INFO JUDUL ASLI DARI TIKTOK */}
          <div className="mt-4 text-center w-full px-2">
            <p className="text-white font-bold text-[16px] line-clamp-2 leading-snug">
              {currentTrack?.title || 'Judul Asli TikTok Video'}
            </p>
            <p className="text-white/50 text-xs mt-1">
              {currentTrack
                ? `${currentTrack.author || 'Kreator TikTok'} • From ${currentTrack.source === 'tiktok' ? 'TikTok' : 'YouTube'}`
                : 'Belum Ada Musik • Paste link TikTok / YouTube di atas'}
            </p>
          </div>

          {/* PROGRESS BAR */}
          <div className="w-full mt-4 max-w-[280px]">
            <div
              onClick={handleSeek}
              className="h-1.5 bg-white/15 rounded-full overflow-hidden cursor-pointer relative"
            >
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-white/40 mt-1 font-mono">
              <span>{formatTime(currentTimeSec)}</span>
              <span>{formatTime(durationSec)}</span>
            </div>
          </div>

          {/* KONTROL */}
          <div className="flex items-center justify-between w-full max-w-[280px] mt-4">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className="p-1 cursor-pointer transition active:scale-90"
              title="Shuffle"
            >
              <Shuffle className={`w-5 h-5 ${isShuffle ? 'text-white' : 'text-white/60'}`} />
            </button>
            <button
              onClick={handlePrev}
              className="p-1 cursor-pointer transition active:scale-90"
              title="Kembali 10s"
            >
              <SkipBack className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={onTogglePlay}
              disabled={!currentTrack}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center transition active:scale-95 disabled:opacity-40 cursor-pointer shadow-lg"
            >
              {isPlaying ? <Pause className="w-7 h-7 text-black" /> : <Play className="w-7 h-7 text-black ml-0.5" />}
            </button>
            <button
              onClick={handleNext}
              className="p-1 cursor-pointer transition active:scale-90"
              title="Maju 10s"
            >
              <SkipForward className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setIsLoop(!isLoop)}
              className="p-1 cursor-pointer transition active:scale-90"
              title="Loop"
            >
              <Repeat className={`w-5 h-5 ${isLoop ? 'text-white' : 'text-white/60'}`} />
            </button>
          </div>
        </div>

        {/* History List: "Riwayat Musik" */}
        <div data-logo-anim={homeUiConfig.logoAnimation} className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div
              style={{ color: themeTokens.sectionTitleColor }}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            >
              <ListMusic size={16} strokeWidth={1.5} className="ze-logo-anim ze-logo-history" />
              <span>Riwayat Musik ({historyTracks.length})</span>
            </div>
            {currentTrack && (
              <button
                onClick={onDeleteCurrent}
                className="text-[11px] text-red-300 hover:text-red-200 flex items-center gap-1 cursor-pointer bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 active:scale-95 transition"
              >
                <Trash2 size={12} /> Hapus Lagu Aktif
              </button>
            )}
          </div>

          {historyTracks.length === 0 ? (
            <div style={themeTokens.cardStyle} className="p-6 text-center text-xs">
              <Music
                size={28}
                className="mx-auto mb-2 opacity-40 ze-logo-anim ze-logo-history"
                style={{ color: themeTokens.cardIconColor }}
                strokeWidth={1.5}
              />
              <span style={{ color: themeTokens.cardSubtitleColor }}>
                Belum ada riwayat musik. Masukkan link TikTok atau YouTube di atas.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {historyTracks.map((item) => {
                const isSelected = currentTrack?.title === item.title;
                return (
                  <div
                    key={item.id}
                    style={themeTokens.cardStyle}
                    className="ze-feature-card p-3 flex items-center justify-between gap-3 transition"
                  >
                    <div
                      onClick={() =>
                        onPlayTrack({
                          id: item.id,
                          title: item.title,
                          thumbnail: item.thumbnail,
                          url: item.videoUrl || item.sourceUrl,
                          videoUrl: item.videoUrl,
                          audioUrl: item.audioUrl,
                          source: item.sourceType,
                          sourceType: item.sourceType,
                          author: item.author,
                          sourceUrl: item.sourceUrl,
                        })
                      }
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/50 border border-white/15 shrink-0 relative">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover ze-video-thumb-zoom"
                        />
                        {isSelected && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          style={{ color: themeTokens.cardTitleColor }}
                          className="text-xs font-bold truncate leading-snug"
                        >
                          {item.title}
                        </p>
                        <p
                          style={{ color: themeTokens.cardSubtitleColor }}
                          className="text-[10px] truncate mt-0.5"
                        >
                          {item.author} • {item.sourceType === 'tiktok' ? 'TikTok' : 'YouTube'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          onPlayTrack({
                            id: item.id,
                            title: item.title,
                            thumbnail: item.thumbnail,
                            url: item.videoUrl || item.sourceUrl,
                            videoUrl: item.videoUrl,
                            audioUrl: item.audioUrl,
                            source: item.sourceType,
                            sourceType: item.sourceType,
                            author: item.author,
                            sourceUrl: item.sourceUrl,
                          })
                        }
                        style={
                          isSelected && isPlaying
                            ? { background: themeTokens.accentColor, color: '#ffffff' }
                            : themeTokens.iconBoxStyle
                        }
                        className="w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer"
                      >
                        {isSelected && isPlaying ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} className="ml-0.5" />
                        )}
                      </button>

                      <button
                        onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                        className="p-1.5 text-white/40 hover:text-red-400 transition cursor-pointer"
                        title="Hapus Dari Riwayat"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
