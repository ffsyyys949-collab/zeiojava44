import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Music, ChevronDown } from 'lucide-react';

declare global {
  interface Window {
    mainAudio?: HTMLAudioElement;
  }
}

// 1. BUAT 1 GLOBAL AUDIO SAJA: window.mainAudio = window.mainAudio || new Audio()
if (typeof window !== 'undefined') {
  if (!window.mainAudio) {
    window.mainAudio = new Audio();
  }
  // 2. LAGU HARUS NGULANG TERUS GA ILANG OTOMATIS: window.mainAudio.loop = true
  window.mainAudio.loop = true;
}

export interface TrackData {
  id?: string;
  title: string;
  thumbnail?: string;
  cover?: string;
  url?: string;
  videoUrl?: string;
  audioUrl?: string;
  source: 'tiktok' | 'youtube' | 'web';
  sourceType?: 'tiktok' | 'youtube' | 'web';
  author?: string;
  artist?: string;
  sourceUrl?: string;
  lyrics?: any;
}


export interface MusicContextType {
  currentTrack: TrackData | null;
  isPlaying: boolean;
  playMusic: (urlOrTrack: string | TrackData, trackDetails?: Partial<TrackData>) => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  togglePlay: () => void;
  closePlayer: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setCurrentTrack: (track: TrackData | null) => void;
  setIsPlaying: (playing: boolean) => void;
}

const DEFAULT_PLAYLIST: TrackData[] = [
  {
    id: 'tt_trending_feed',
    title: 'Steal The Show (Sped Up) - Lauv',
    author: 'Lauv • TikTok Trend',
    artist: 'Lauv',
    thumbnail: '/assets/aistudio/Screenshot_20261027-132820_c63c1926.jpg',
    videoUrl: '/assets/aistudio/Screen_Recording_20261027_182218_e52caf48.mp4',
    audioUrl: '/assets/aistudio/Screen_Recording_20261027_182218_e52caf48.mp4',
    url: '/assets/aistudio/Screen_Recording_20261027_182218_e52caf48.mp4',
    source: 'tiktok',
    sourceType: 'tiktok',
  },
  {
    id: 'ze_music_cyber',
    title: 'Cyber Silver Synth 128BPM',
    author: 'ZE.io Music Lab',
    artist: 'ZE.io Official',
    thumbnail: '/assets/ze_logo.png',
    url: '/assets/aistudio/ssstik.io_1793231239969_f00ac994.mp4',
    videoUrl: '/assets/aistudio/ssstik.io_1793231239969_f00ac994.mp4',
    audioUrl: '/assets/aistudio/ssstik.io_1793231239969_f00ac994.mp4',
    source: 'tiktok',
    sourceType: 'tiktok',
  },
  {
    id: 'ze_ambient_water',
    title: 'Deep Midnight Water Lo-Fi',
    author: 'ZE.io Chill Wave',
    artist: 'ZE.io Ambient',
    thumbnail: '/assets/bw_water_still.jpg',
    url: '/assets/aistudio/Screen_Recording_20261027_182218_e52caf48.mp4',
    videoUrl: '/assets/aistudio/Screen_Recording_20261027_182218_e52caf48.mp4',
    audioUrl: '/assets/aistudio/Screen_Recording_20261027_182218_e52caf48.mp4',
    source: 'web',
    sourceType: 'web',
  }
];

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playlist, setPlaylist] = useState<TrackData[]>(DEFAULT_PLAYLIST);
  const [trackIndex, setTrackIndex] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize real DOM <audio> tag & ensure loop = true (survives screen off with MediaSession)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = audioRef.current || window.mainAudio || new Audio();
    window.mainAudio = audio;
    audio.loop = true;
    audio.preload = 'auto';

    const handleAudioPlay = () => setIsPlaying(true);
    const handleAudioPause = () => setIsPlaying(false);
    const handleAudioEnded = () => {
      if (audio.loop && audio.src) {
        audio.play().catch(() => {});
      }
    };
    const handlePositionSync = () => {
      if ('mediaSession' in navigator && typeof navigator.mediaSession.setPositionState === 'function') {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          try {
            navigator.mediaSession.setPositionState({
              duration: audio.duration,
              playbackRate: audio.playbackRate || 1,
              position: Math.min(audio.currentTime || 0, audio.duration),
            });
          } catch {}
        }
      }
    };

    audio.addEventListener('play', handleAudioPlay);
    audio.addEventListener('pause', handleAudioPause);
    audio.addEventListener('ended', handleAudioEnded);
    audio.addEventListener('loadedmetadata', handlePositionSync);
    audio.addEventListener('timeupdate', handlePositionSync);

    // SETIAP KALI PLAY VIDEO: window.mainAudio.pause() -> JADI CUMA 1 SUARA YANG JALAN, GA PERNAH DOBEL
    const handleVideoPlay = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'VIDEO') {
        const videoEl = target as HTMLVideoElement;
        if (
          videoEl.muted ||
          videoEl.hasAttribute('data-bg-video') ||
          videoEl.id === 'bg-water-video' ||
          videoEl.hasAttribute('data-feed-video')
        ) {
          return;
        }
        if (window.mainAudio && !window.mainAudio.paused) {
          window.mainAudio.pause();
          setIsPlaying(false);
        }
      }
    };

    document.addEventListener('play', handleVideoPlay, true);

    return () => {
      audio.removeEventListener('play', handleAudioPlay);
      audio.removeEventListener('pause', handleAudioPause);
      audio.removeEventListener('ended', handleAudioEnded);
      audio.removeEventListener('loadedmetadata', handlePositionSync);
      audio.removeEventListener('timeupdate', handlePositionSync);
      document.removeEventListener('play', handleVideoPlay, true);
    };
  }, []);

  const playMusic = (urlOrTrack: string | TrackData, trackDetails?: Partial<TrackData>) => {
    if (typeof window === 'undefined') return;
    if (!window.mainAudio) {
      window.mainAudio = new Audio();
    }

    // Pause all other video and audio elements on page (EXCLUDE background water video & feed video)
    if (typeof document !== 'undefined') {
      document.querySelectorAll('video, audio').forEach((el: any) => {
        if (
          el !== window.mainAudio &&
          !el.hasAttribute('data-bg-video') &&
          el.id !== 'bg-water-video' &&
          !el.hasAttribute('data-feed-video') &&
          !el.muted
        ) {
          try {
            el.pause();
          } catch {}
        }
      });
    }

    let url = '';
    let trackObj: TrackData;

    if (typeof urlOrTrack === 'string') {
      url = urlOrTrack;
      trackObj = {
        title: trackDetails?.title || 'Musik Audio',
        author: trackDetails?.author || 'ZE.io Music',
        artist: trackDetails?.artist || trackDetails?.author || 'ZE.io Official',
        thumbnail: trackDetails?.thumbnail || '',
        url,
        videoUrl: trackDetails?.videoUrl,
        audioUrl: url,
        source: trackDetails?.source || 'web',
        sourceType: trackDetails?.sourceType || 'web',
        ...trackDetails,
      };
    } else {
      trackObj = { ...urlOrTrack, source: ((trackDetails?.source || urlOrTrack.source || 'web') as 'tiktok' | 'youtube' | 'web'), ...trackDetails };
      url = trackObj.audioUrl || trackObj.videoUrl || trackObj.url || '';
    }

    if (!url) return;

    const useNativeMusicService = Boolean(window.ZeNative?.updateMusicNotification);
    window.mainAudio.pause();
    window.mainAudio.loop = true;
    window.mainAudio.src = url;
    if (!useNativeMusicService) {
      window.mainAudio.play().catch((err) => {
        console.warn('Playback error:', err);
      });
    }

    setCurrentTrack(trackObj);
    setIsPlaying(true);

    // Update playlist if novel
    setPlaylist((prev) => {
      const idx = prev.findIndex((p) => p.title === trackObj.title || p.url === trackObj.url);
      if (idx !== -1) {
        setTrackIndex(idx);
        return prev;
      }
      setTrackIndex(prev.length);
      return [...prev, trackObj];
    });
  };

  const pauseMusic = () => {
    if (typeof window !== 'undefined' && window.mainAudio) {
      window.mainAudio.pause();
    }
    setIsPlaying(false);
  };

  const resumeMusic = () => {
    if (typeof window === 'undefined' || !window.mainAudio) return;
    if (typeof document !== 'undefined') {
      document.querySelectorAll('video, audio').forEach((el: any) => {
        if (
          el !== window.mainAudio &&
          !el.hasAttribute('data-bg-video') &&
          el.id !== 'bg-water-video' &&
          !el.hasAttribute('data-feed-video') &&
          !el.muted
        ) {
          try {
            el.pause();
          } catch {}
        }
      });
    }
    if (!window.ZeNative?.updateMusicNotification) {
      window.mainAudio.play().catch(() => {});
    }
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      if (!currentTrack) {
        playMusic(playlist[0] || DEFAULT_PLAYLIST[0]);
        return;
      }
      resumeMusic();
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    const nextIdx = (trackIndex + 1) % playlist.length;
    setTrackIndex(nextIdx);
    playMusic(playlist[nextIdx]);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;
    const prevIdx = (trackIndex - 1 + playlist.length) % playlist.length;
    setTrackIndex(prevIdx);
    playMusic(playlist[prevIdx]);
  };

  const closePlayer = () => {
    if (typeof window !== 'undefined' && window.mainAudio) {
      window.mainAudio.pause();
      window.mainAudio.removeAttribute('src');
      window.mainAudio.load();
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    if (typeof window !== 'undefined') {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.setActionHandler('nexttrack', null);
          navigator.mediaSession.setActionHandler('previoustrack', null);
          navigator.mediaSession.setActionHandler('stop', null);
        } catch {}
      }
      window.ZeNative?.stopMusicNotification?.();
      if ('serviceWorker' in navigator) {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'DISMISS_MUSIC_NOTIFICATION' });
        } else {
          navigator.serviceWorker.ready
            .then((reg) => reg.active?.postMessage({ type: 'DISMISS_MUSIC_NOTIFICATION' }))
            .catch(() => {});
        }
      }
    }
  };

  // Keep latest callbacks in ref so native MediaSession & SW notification buttons always call fresh handlers
  const musicHandlersRef = useRef({
    pauseMusic,
    resumeMusic,
    togglePlay,
    playNext,
    playPrevious,
    closePlayer,
  });
  musicHandlersRef.current = {
    pauseMusic,
    resumeMusic,
    togglePlay,
    playNext,
    playPrevious,
    closePlayer,
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.__zeMusicControl = (action) => {
      const h = musicHandlersRef.current;
      if (action === 'play') h.resumeMusic();
      else if (action === 'pause') h.pauseMusic();
      else if (action === 'toggle') h.togglePlay();
      else if (action === 'next') h.playNext();
      else if (action === 'prev') h.playPrevious();
      else if (action === 'stop') h.closePlayer();
    };

    const handleSwMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === 'NATIVE_MUSIC_CONTROL' && data.action) {
        window.__zeMusicControl?.(data.action);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      delete window.__zeMusicControl;
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, []);

  // ------------------------------------------------------------------------
  // ANDROID NATIVE MEDIASESSION + FOREGROUND SERVICE NOTIFICATION (SPOTIFY STYLE)
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const toAbsoluteUrl = (rawUrl?: string) => {
      if (!rawUrl) return '';
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
        return rawUrl;
      }
      return `${window.location.origin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    };

    if (currentTrack) {
      const trackTitle = currentTrack.title || 'ZE.io Musik';
      const trackArtist = currentTrack.artist || currentTrack.author || 'ZE.io Audio Player';
      const coverUrl = toAbsoluteUrl(currentTrack.thumbnail || currentTrack.cover || '/assets/ze_logo.png');
      const audioUrl = toAbsoluteUrl(currentTrack.audioUrl || currentTrack.videoUrl || currentTrack.url || '');

      // Sync to native Android ZeMusicForegroundService (MediaSessionCompat + WakeLock + MediaPlayer)
      window.ZeNative?.updateMusicNotification?.(
        trackTitle,
        trackArtist,
        coverUrl,
        audioUrl,
        isPlaying
      );

      if ('mediaSession' in navigator) {
        const artwork = [
          { src: '/assets/ze_logo.png', sizes: '96x96', type: 'image/png' },
          { src: '/assets/ze_logo.png', sizes: '128x128', type: 'image/png' },
          { src: '/assets/ze_logo.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/ze_logo.png', sizes: '256x256', type: 'image/png' },
          { src: '/assets/ze_logo.png', sizes: '384x384', type: 'image/png' },
          { src: '/assets/ze_logo.png', sizes: '512x512', type: 'image/png' }
        ];

        if (currentTrack.thumbnail || currentTrack.cover) {
          artwork.unshift({
            src: currentTrack.thumbnail || currentTrack.cover || '',
            sizes: '512x512',
            type: 'image/jpeg'
          });
        }

        navigator.mediaSession.metadata = new MediaMetadata({
          title: trackTitle,
          artist: 'ZE.io',
          album: 'ZE.io Music',
          artwork
        });

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

        try {
          navigator.mediaSession.setActionHandler('play', () => musicHandlersRef.current.resumeMusic());
          navigator.mediaSession.setActionHandler('pause', () => musicHandlersRef.current.pauseMusic());
          navigator.mediaSession.setActionHandler('previoustrack', () => musicHandlersRef.current.playPrevious());
          navigator.mediaSession.setActionHandler('nexttrack', () => musicHandlersRef.current.playNext());
          navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined && window.mainAudio) {
              window.mainAudio.currentTime = details.seekTime;
            }
          });
          navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            if (window.mainAudio) {
              const skipTime = details.seekOffset || 10;
              window.mainAudio.currentTime = Math.max(0, window.mainAudio.currentTime - skipTime);
            }
          });
          navigator.mediaSession.setActionHandler('seekforward', (details) => {
            if (window.mainAudio) {
              const skipTime = details.seekOffset || 10;
              window.mainAudio.currentTime = Math.min(window.mainAudio.duration || Infinity, window.mainAudio.currentTime + skipTime);
            }
          });
          navigator.mediaSession.setActionHandler('stop', () => musicHandlersRef.current.closePlayer());
        } catch (err) {
          console.warn('MediaSession handler notice:', err);
        }
      }

      // Request native Android / Web notification permission seamlessly
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

      // Relay native notification to Service Worker with Prev / Pause-Play / Next buttons
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const msgPayload = {
          type: 'SHOW_MUSIC_NOTIFICATION',
          title: trackTitle,
          artist: 'ZE.io',
          cover: currentTrack.thumbnail || currentTrack.cover || '/assets/ze_logo.png',
          isPlaying
        };
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage(msgPayload);
        } else {
          navigator.serviceWorker.ready.then((reg) => {
            reg.active?.postMessage(msgPayload);
          }).catch(() => {});
        }
      }
    } else {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
      if ('serviceWorker' in navigator) {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'DISMISS_MUSIC_NOTIFICATION' });
        }
      }
    }
  }, [currentTrack, isPlaying, trackIndex, playlist]);

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        isPlaying,
        playMusic,
        pauseMusic,
        resumeMusic,
        togglePlay,
        closePlayer,
        playNext,
        playPrevious,
        setCurrentTrack,
        setIsPlaying,
      }}
    >
      <audio ref={audioRef} loop preload="auto" playsInline className="hidden" />
      {children}
      <GlobalMiniPlayer />
    </MusicContext.Provider>
  );
}

// MINI PLAYER (MUSIC PLAYER BAR):
// SOLID #2a2a2a TANPA BLUR, BISA MINIMIZE JADI BULET KECIL 56PX DI LEFT TOP
export function GlobalMiniPlayer() {
  const { currentTrack, isPlaying, togglePlay, closePlayer } = useMusic();
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const startPosRef = useRef({ clientX: 0, clientY: 0, elemLeft: 0, elemTop: 0 });
  const hasDraggedRef = useRef(false);

  const bubbleElemRef = useRef<HTMLDivElement | null>(null);
  const liveDragPosRef = useRef<{ x: number; y: number } | null>(null);

  if (!currentTrack) return null;

  // Cover lagu asli dari currentTrack.cover / thumbnail
  const coverImg = currentTrack.cover || currentTrack.thumbnail || '';
  const trackTitle = currentTrack.title || 'Memutar Musik';
  const trackArtist = currentTrack.artist || currentTrack.author || 'ZE.io Music';

  // DRAG HANDLERS: GPU translate3d during drag, single React commit on release
  const startDrag = (clientX: number, clientY: number, elem: HTMLElement) => {
    draggingRef.current = true;
    hasDraggedRef.current = false;
    const rect = elem.getBoundingClientRect();
    startPosRef.current = {
      clientX,
      clientY,
      elemLeft: rect.left,
      elemTop: rect.top,
    };
    liveDragPosRef.current = { x: rect.left, y: rect.top };

    let dragRafId = 0;
    let pendingX = rect.left;
    let pendingY = rect.top;

    const applyTransform = () => {
      dragRafId = 0;
      const target = bubbleElemRef.current || elem;
      target.style.left = '0px';
      target.style.top = '0px';
      target.style.transform = `translate3d(${pendingX}px, ${pendingY}px, 0)`;
    };

    const onMove = (moveX: number, moveY: number) => {
      if (!draggingRef.current) return;
      const dx = moveX - startPosRef.current.clientX;
      const dy = moveY - startPosRef.current.clientY;
      if (Math.hypot(dx, dy) > 5) {
        hasDraggedRef.current = true;
      }
      pendingX = Math.max(8, Math.min(window.innerWidth - 64, startPosRef.current.elemLeft + dx));
      pendingY = Math.max(10, Math.min(window.innerHeight - 70, startPosRef.current.elemTop + dy));
      liveDragPosRef.current = { x: pendingX, y: pendingY };
      if (!dragRafId) {
        dragRafId = window.requestAnimationFrame(applyTransform);
      }
    };

    const finishDrag = () => {
      draggingRef.current = false;
      if (dragRafId) {
        window.cancelAnimationFrame(dragRafId);
        dragRafId = 0;
      }
      if (liveDragPosRef.current && hasDraggedRef.current) {
        setPosition({ ...liveDragPosRef.current });
      }
    };

    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleMouseUp = () => {
      finishDrag();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleTouchEnd = () => {
      finishDrag();
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    startDrag(e.clientX, e.clientY, e.currentTarget);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
    }
  };

  const handleClickCircle = () => {
    if (!hasDraggedRef.current) {
      setIsMinimized(false);
    }
  };

  if (isMinimized) {
    // KETIKA isMinimized TRUE: HIDE FULL BAR, SHOW ONLY BULET KECIL 56px DI LEFT TOP
    const bubbleStyle: React.CSSProperties = position
      ? {
          position: 'fixed',
          left: '0px',
          top: '0px',
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          willChange: 'transform',
          touchAction: 'none',
          userSelect: 'none',
        }
      : {
          position: 'fixed',
          left: '0px',
          top: '0px',
          transform: 'translate3d(16px, 60px, 0)',
          willChange: 'transform',
          touchAction: 'none',
          userSelect: 'none',
        };

    return (
      <div
        ref={bubbleElemRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClickCircle}
        style={bubbleStyle}
        className="z-[999] w-[56px] h-[56px] rounded-full bg-[#2a2a2a] border-2 border-zinc-600 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none group active:scale-95 transition-transform"
        title="Geser posisi • Klik untuk kembali jadi bar panjang"
      >
        {coverImg ? (
          <img
            src={coverImg}
            alt={trackTitle}
            className={`w-full h-full object-cover pointer-events-none select-none ${
              isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''
            }`}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-[#161616] flex items-center justify-center pointer-events-none">
            <Music className={`w-6 h-6 text-white ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
        )}

        {/* TITIK IJO NYALA TANDA LAGI MUTER */}
        {isPlaying && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00FF88] rounded-full border-2 border-black flex items-center justify-center z-20 shadow-[0_0_10px_#00FF88] pointer-events-none">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          </div>
        )}

        {/* INDICATOR LAGI MUTER DI TENGAH */}
        {isPlaying && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none">
            <div className="w-2.5 h-2.5 bg-[#00FF88] rounded-full animate-ping" />
          </div>
        )}

        {/* ICON EXPAND SAAT HOVER */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-white text-[10px] font-bold drop-shadow">▲</span>
        </div>
      </div>
    );
  }

  return (
    // FULL BAR ATAS: SOLID #2a2a2a TANPA BLUR APAPUN
    <div className="fixed top-[60px] left-0 right-0 w-full z-50 px-3 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-full px-3.5 py-2.5 flex items-center justify-between shadow-2xl">
          {/* Left: Thumbnail & Title */}
          <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-2">
            <div
              onClick={() => setIsMinimized(true)}
              className="w-10 h-10 rounded-full bg-[#161616] overflow-hidden border border-[#3a3a3a] flex items-center justify-center shrink-0 relative cursor-pointer"
              title="Klik untuk perkecil jadi bulet"
            >
              {coverImg ? (
                <img
                  src={coverImg}
                  alt={trackTitle}
                  className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}
                />
              ) : (
                <Music className="w-5 h-5 text-white" />
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88]" />
                </div>
              )}
            </div>

            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-white truncate max-w-[170px]">
                {trackTitle}
              </p>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                {trackArtist} • {currentTrack.source === 'tiktok' ? 'TikTok Sound' : currentTrack.source === 'youtube' ? 'YouTube Audio' : 'Musik Web'}
              </p>
            </div>
          </div>

          {/* Right Controls: ChevronDown between title and pause button, Pause/Play, Close X */}
          <div className="flex items-center gap-2 shrink-0">
            {/* BUTTON ChevronDown BETWEEN TITLE AND PAUSE BUTTON */}
            <button
              onClick={() => setIsMinimized(true)}
              className="w-8 h-8 rounded-full bg-[#383838] hover:bg-[#484848] border border-[#484848] text-white flex items-center justify-center active:scale-95 transition cursor-pointer"
              title="Minimize Player"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* BUTTON PAUSE / PLAY */}
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition cursor-pointer shadow-md font-bold"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black ml-0.5" />
              )}
            </button>

            {/* BUTTON CLOSE X */}
            <button
              onClick={closePlayer}
              className="w-8 h-8 rounded-full bg-[#383838] hover:bg-[#484848] border border-[#484848] text-white flex items-center justify-center active:scale-95 transition cursor-pointer"
              title="Tutup Musik"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { GlobalMiniPlayer as MiniPlayer, GlobalMiniPlayer as MusicPlayerBar };



export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within MusicProvider');
  }
  return context;
}
