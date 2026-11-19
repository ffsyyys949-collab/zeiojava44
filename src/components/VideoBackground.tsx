import React, { useState, useEffect, useRef } from 'react';
import {
  useTheme,
  EXTERNAL_BG_MAIN_VIDEO,
  EXTERNAL_BG_LIQUID_VIDEO,
  resolveExternalBgVideoUrl,
} from '../contexts/ThemeContext';

const MIRROR_BG_MAIN_VIDEO = 'https://qu.ax/GxABY.mp4';
const MIRROR_BG_LIQUID_VIDEO = 'https://qu.ax/a4rLw.mp4';

const VideoBackground = React.memo(function VideoBackground() {
  const { theme } = useTheme();
  const [mirrorStep, setMirrorStep] = useState<0 | 1 | 2>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const primarySrc =
    theme?.id === 'minimal-dark'
      ? null
      : resolveExternalBgVideoUrl(theme?.video) || EXTERNAL_BG_MAIN_VIDEO;

  // Reset fallback state on theme or source change
  useEffect(() => {
    setMirrorStep(0);
  }, [theme?.id, primarySrc]);

  // Handle visibility change to save CPU / battery on mobile when app is tabbed out
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        videoRef.current?.pause();
      } else {
        videoRef.current?.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  let activeVideoSrc: string | null = primarySrc;
  if (mirrorStep === 1 && primarySrc) {
    if (primarySrc === EXTERNAL_BG_MAIN_VIDEO) {
      activeVideoSrc = MIRROR_BG_MAIN_VIDEO;
    } else if (primarySrc === EXTERNAL_BG_LIQUID_VIDEO) {
      activeVideoSrc = MIRROR_BG_LIQUID_VIDEO;
    } else {
      activeVideoSrc = null;
    }
  } else if (mirrorStep >= 2) {
    activeVideoSrc = null;
  }

  return (
    <div
      id="global-fixed-bg-layer"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        contain: 'strict',
      }}
      className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Background Video Layer - Global & Fixed */}
      {activeVideoSrc ? (
        <video
          ref={videoRef}
          key={activeVideoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          data-bg-video="true"
          id="bg-water-video"
          onError={() => setMirrorStep((prev) => (prev === 0 ? 1 : 2))}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className="w-full h-full object-cover object-center pointer-events-none"
          src={activeVideoSrc}
        />
      ) : (
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/assets/bw_water_still.jpg'), #000000`,
            transform: 'translate3d(0, 0, 0)',
          }}
        />
      )}
    </div>
  );
});

export default VideoBackground;

