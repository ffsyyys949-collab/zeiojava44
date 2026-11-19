import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Film,
  Download,
  Music,
  Link as LinkIcon,
  Clipboard,
  Check,
  AlertCircle,
  Clock,
  Play,
  Share2,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { getHomeThemeTokens, useHomeUiConfig } from '../contexts/homeUiConfig.ts';

export interface TikTokVideoData {
  title: string;
  author: string;
  avatar?: string;
  cover: string;
  play: string;
  hdplay?: string;
  music?: string;
  musicTitle?: string;
  duration?: number;
  id?: string;
  timestamp?: number;
}

export function TikTokDownloaderPage({
  onBack,
  onPlayAsMusic,
}: {
  onBack: () => void;
  onPlayAsMusic?: (track: {
    title: string;
    videoUrl?: string;
    audioUrl?: string;
    thumbnail: string;
    author: string;
    source: 'tiktok';
    sourceType: 'tiktok';
  }) => void;
}) {
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<TikTokVideoData | null>(null);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [copiedStatus, setCopiedStatus] = useState(false);
  const { config: homeUiConfig } = useHomeUiConfig();
  const themeTokens = getHomeThemeTokens(
    homeUiConfig.themeId,
    homeUiConfig.boxStyle,
    homeUiConfig.shadowIntensity,
    homeUiConfig.shadowThickness
  );
  const [history, setHistory] = useState<TikTokVideoData[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ze_tiktok_history') || '[]');
    } catch {
      return [];
    }
  });

  // Auto check clipboard on mount
  useEffect(() => {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then((text) => {
        if (text && (text.includes('tiktok.com') || text.includes('douyin.com')) && !urlInput) {
          setUrlInput(text.trim());
        }
      }).catch(() => {});
    }
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
      }
    } catch {
      // fallback
    }
  };

  const handleFetchVideo = async (targetUrl?: string) => {
    const link = (targetUrl || urlInput).trim();
    if (!link) return;

    if (!link.includes('tiktok.com') && !link.includes('douyin.com')) {
      setErrorMsg('Link TikTok tidak valid. Pastikan link berisi tiktok.com');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setVideoData(null);

    try {
      // Try direct tikwm API first, fallback to our backend proxy /api/tiktok
      let resJson: any = null;
      try {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(link)}`);
        resJson = await res.json();
      } catch (err) {
        // Fallback to server proxy
        const res2 = await fetch(`/api/tiktok?url=${encodeURIComponent(link)}`);
        resJson = await res2.json();
      }

      if (resJson && resJson.code === 0 && resJson.data) {
        const d = resJson.data;
        const newVideo: TikTokVideoData = {
          id: d.id || 'tt_' + Date.now(),
          title: d.title || 'TikTok Video (No Watermark)',
          author: d.author?.nickname || d.author?.unique_id || 'TikTok Creator',
          avatar: d.author?.avatar,
          cover: d.cover || d.origin_cover || '',
          play: d.play || '',
          hdplay: d.hdplay || d.play || '',
          music: d.music || '',
          musicTitle: d.music_info?.title || d.title,
          duration: d.duration || 0,
          timestamp: Date.now(),
        };

        setVideoData(newVideo);

        // Save to history
        setHistory((prev) => {
          const next = [newVideo, ...prev.filter((item) => item.play !== newVideo.play)].slice(0, 20);
          localStorage.setItem('ze_tiktok_history', JSON.stringify(next));
          return next;
        });
      } else {
        setErrorMsg(resJson?.msg || 'Video tidak ditemukan atau akun privat.');
      }
    } catch (e: any) {
      setErrorMsg('Gagal mengambil data video. Silakan periksa koneksi atau coba tautan lain.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDownload = async (url: string, filename: string, typeKey: string) => {
    if (!url) return;
    setDownloadingType(typeKey);

    const cleanFilename = filename.replace(/[/\\?%*:|"<>]/g, '_');

    try {
      // 1. Try direct fetch blob
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = cleanFilename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        setDownloadingType(null);
        return;
      }
    } catch {
      // direct blob fetch blocked by CORS -> fall back to server proxy
    }

    try {
      // 2. Use backend proxy streamer: /api/tiktok/download?url=...&filename=...
      const proxyDownloadUrl = `/api/tiktok/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(cleanFilename)}`;
      const a = document.createElement('a');
      a.href = proxyDownloadUrl;
      a.download = cleanFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // 3. Fallback direct window navigation
      window.open(url, '_blank');
    }

    setTimeout(() => {
      setDownloadingType(null);
    }, 1500);
  };

  const handleShare = async (data: TikTokVideoData) => {
    if (navigator.share) {
      navigator.share({
        title: data.title,
        text: `Lihat video TikTok ini tanpa watermark: ${data.title}`,
        url: data.play || window.location.href,
      }).catch(() => {});
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data.play);
        setCopiedStatus(true);
        setTimeout(() => setCopiedStatus(false), 2000);
      }
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ze_tiktok_history');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-[120px]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition active:scale-95 shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
              <Film size={18} className="text-white shrink-0" strokeWidth={1.5} />
              <span className="truncate">TikTok Downloader No WM</span>
            </h2>
            <p className="text-[10px] text-white/50 line-clamp-2 leading-[1.3] overflow-hidden">Download video TikTok tanpa watermark asli HD &amp; MP3</p>
          </div>
        </div>

        <div className="bg-white/10 border border-white/20 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold text-white/80 shrink-0 whitespace-nowrap">
          v1.0 Real
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Main Input Form */}
        <div className="bg-[#141414]/90 backdrop-blur-[24px] border border-white/10 rounded-[28px] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <p className="text-xs font-semibold text-white/80 mb-2 flex items-center gap-1.5">
            <LinkIcon size={14} className="text-white" strokeWidth={1.5} />
            Paste Link Video TikTok
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFetchVideo();
            }}
            className="space-y-3"
          >
            <div className="bg-black/50 border border-white/15 rounded-full px-4 py-2.5 flex items-center gap-2 focus-within:border-white/40 transition">
              <input
                type="text"
                placeholder="https://vt.tiktok.com/... atau https://www.tiktok.com/@..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="bg-transparent flex-1 text-xs text-white placeholder-white/30 outline-none"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition active:scale-95"
                title="Paste dari Clipboard"
              >
                <Clipboard size={11} /> Paste
              </button>
            </div>

            <button
              type="submit"
              disabled={!urlInput.trim() || isLoading}
              className="w-full py-3.5 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition disabled:opacity-40 cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Mengambil Data Video...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Get Video (No Watermark)</span>
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="mt-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Video Result Card */}
        {videoData && (
          <div className="bg-[#181818]/95 backdrop-blur-[28px] border border-white/15 rounded-[28px] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex gap-3.5 items-start">
              <div className="w-24 h-32 rounded-2xl overflow-hidden bg-black/60 border border-white/10 shrink-0 relative shadow-md">
                <img
                  src={videoData.cover}
                  alt={videoData.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center pb-2">
                  <span className="text-[10px] text-white/90 font-mono font-medium">
                    {videoData.duration ? `${videoData.duration}s` : 'HD'}
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[9px] uppercase font-mono font-bold bg-[#00FF88]/20 text-[#00FF88] px-2 py-0.5 rounded-full">
                    No Watermark
                  </span>
                  <button
                    onClick={() => handleShare(videoData)}
                    className="p-1 rounded-full text-white/60 hover:text-white transition ml-auto"
                    title="Bagikan Tautan"
                  >
                    <Share2 size={14} />
                  </button>
                </div>

                <p className="text-sm font-bold text-white line-clamp-2 leading-snug">
                  {videoData.title}
                </p>

                <p className="text-xs text-white/60 mt-1 truncate">
                  By {videoData.author}
                </p>

                {videoData.musicTitle && (
                  <p className="text-[11px] text-white/40 mt-1 truncate flex items-center gap-1 font-mono">
                    <Music size={11} /> {videoData.musicTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Real Download Action Buttons */}
            <div className="space-y-2.5 mt-5">
              <button
                onClick={() => triggerDownload(videoData.play, `${videoData.title || 'tiktok'}_no_wm.mp4`, 'standard')}
                disabled={downloadingType === 'standard'}
                className="w-full py-3.5 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-60"
              >
                {downloadingType === 'standard' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Mengunduh Video MP4...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} strokeWidth={2} />
                    <span>Download No Watermark (HD MP4)</span>
                  </>
                )}
              </button>

              {videoData.hdplay && (
                <button
                  onClick={() => triggerDownload(videoData.hdplay!, `${videoData.title || 'tiktok'}_ultra_hd.mp4`, 'hd')}
                  disabled={downloadingType === 'hd'}
                  className="w-full py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {downloadingType === 'hd' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengunduh Full HD...</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      <span>Download HD No WM (Kualitas Tertinggi)</span>
                    </>
                  )}
                </button>
              )}

              {(videoData.play || videoData.music) && (
                <button
                  onClick={() => {
                    const cleanName = `${videoData.title || 'tiktok'}_audio.mp3`.replace(/[/\\?%*:|"<>]/g, '_');
                    const extractUrl = `/api/tiktok/extract-mp3?videoUrl=${encodeURIComponent(
                      videoData.play || ''
                    )}&musicUrl=${encodeURIComponent(videoData.music || '')}&filename=${encodeURIComponent(cleanName)}`;
                    triggerDownload(extractUrl, cleanName, 'mp3');
                  }}
                  disabled={downloadingType === 'mp3'}
                  className="w-full py-2.5 rounded-full bg-transparent hover:bg-white/5 border border-white/15 text-white/80 font-medium text-xs active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {downloadingType === 'mp3' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengunduh Audio MP3...</span>
                    </>
                  ) : (
                    <>
                      <Music size={14} />
                      <span>Download Audio MP3 (Suara Asli Video)</span>
                    </>
                  )}
                </button>
              )}

              {/* Integration with Music Lab */}
              {onPlayAsMusic && (
                <button
                  onClick={() => {
                    onPlayAsMusic({
                      title: videoData.title,
                      videoUrl: videoData.play,
                      audioUrl: videoData.music,
                      thumbnail: videoData.cover,
                      author: videoData.author,
                      source: 'tiktok',
                      sourceType: 'tiktok',
                    });
                  }}
                  className="w-full py-2.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-semibold text-xs active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play size={14} className="fill-purple-300" />
                  <span>Putar Sebagai Background Music di ZE.io</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Download History */}
        {history.length > 0 && (
          <div
            data-logo-anim={homeUiConfig.logoAnimation}
            style={themeTokens.cardStyle}
            className="p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                style={{ color: themeTokens.cardTitleColor }}
                className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Clock size={13} className="ze-logo-anim ze-logo-history" /> Riwayat Download ({history.length})
              </h3>
              <button
                onClick={clearHistory}
                style={{ color: themeTokens.cardSubtitleColor }}
                className="text-[10px] hover:opacity-100 opacity-75 flex items-center gap-1 cursor-pointer transition"
              >
                <Trash2 size={11} /> Bersihkan
              </button>
            </div>

            <div className="space-y-2.5">
              {history.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={themeTokens.cardStyle}
                  className="ze-feature-card p-2.5 flex items-center justify-between gap-3 transition"
                >
                  <div
                    onClick={() => {
                      setUrlInput(item.play);
                      setVideoData(item);
                    }}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0 ze-video-thumb-zoom"
                    />
                    <div className="min-w-0 flex-1">
                      <p style={{ color: themeTokens.cardTitleColor }} className="text-xs font-medium truncate">
                        {item.title}
                      </p>
                      <p style={{ color: themeTokens.cardSubtitleColor }} className="text-[10px] truncate">
                        {item.author}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => triggerDownload(item.play, `${item.title}_no_wm.mp4`, `hist_${idx}`)}
                      style={themeTokens.iconBoxStyle}
                      className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition active:scale-95"
                      title="Download Ulang"
                    >
                      <Download size={13} style={{ color: themeTokens.cardIconColor }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
