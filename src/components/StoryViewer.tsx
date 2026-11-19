import React, { useState, useEffect } from 'react';
import { Play, Pause, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface StoryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  quality?: string;
  caption?: string;
  timestamp: number;
}

export interface GroupedUserStory {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  createdAt: number;
  items: StoryItem[];
}

export function StoryViewerModal({
  story,
  currentUser,
  onClose,
  onDeleteItem,
  onNextStory,
  onPrevStory,
}: {
  story: GroupedUserStory;
  currentUser?: { id: string; name: string; photo?: string } | null;
  onClose: () => void;
  onDeleteItem: (userId: string, itemId: string) => Promise<void> | void;
  onNextStory?: () => void;
  onPrevStory?: () => void;
}) {
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [itemProgress, setItemProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const items = story.items || [];
  const currentItem = items[activeItemIndex] || items[0];
  const isMyStory = currentUser && (story.userId === currentUser.id);

  // Auto progression for each item in the story driven by FPS-locked requestAnimationFrame (smooth 60/90/120 FPS)
  useEffect(() => {
    if (isPaused || showDeleteConfirm || !currentItem) return;

    setItemProgress(0);
    const duration = currentItem.type === 'video' ? 12000 : 5000;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: DOMHighResTimeStamp) => {
      const pct = Math.min(100, ((now - startTime) / duration) * 100);
      setItemProgress(pct);
      if (pct >= 100) {
        handleNextItem();
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [activeItemIndex, isPaused, showDeleteConfirm, currentItem?.id]);

  const handleNextItem = () => {
    if (activeItemIndex < items.length - 1) {
      setActiveItemIndex((prev) => prev + 1);
      setItemProgress(0);
    } else {
      if (onNextStory) {
        onNextStory();
      } else {
        onClose();
      }
    }
  };

  const handlePrevItem = () => {
    if (activeItemIndex > 0) {
      setActiveItemIndex((prev) => prev - 1);
      setItemProgress(0);
    } else {
      if (onPrevStory) {
        onPrevStory();
      }
    }
  };

  const confirmDelete = async () => {
    if (!currentItem) return;
    await onDeleteItem(story.userId, currentItem.id);
    setShowDeleteConfirm(false);
    if (items.length <= 1) {
      onClose();
    } else {
      if (activeItemIndex >= items.length - 1) {
        setActiveItemIndex((prev) => Math.max(0, prev - 1));
      }
      setItemProgress(0);
    }
  };

  // Sembunyikan bottom-nav secara instan saat melihat story
  useEffect(() => {
    document.querySelector('.bottom-nav')?.classList.add('hidden');
    return () => {
      document.querySelector('.bottom-nav')?.classList.remove('hidden');
    };
  }, []);

  if (!currentItem) return null;

  return (
    <div className="fixed inset-0 z-[10005] bg-black flex flex-col justify-between items-center select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Controls & Segmented Progress Bar */}
      <div className="w-full max-w-md pt-3 px-4 z-20">
        {/* Progress Bar Segments (1 per item, WA/IG style) */}
        <div className="flex gap-1.5 w-full mb-3">
          {items.map((it, idx) => {
            let widthPercent = 0;
            if (idx < activeItemIndex) widthPercent = 100;
            else if (idx === activeItemIndex) widthPercent = itemProgress;
            else widthPercent = 0;

            return (
              <div key={it.id || idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* User Info & Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center">
              {story.userPhoto ? (
                <img src={story.userPhoto} alt={story.userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">{story.userName.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white leading-none">
                  {story.userName} {isMyStory ? '(Anda)' : ''}
                </p>
                {currentItem.quality && (
                  <span className="bg-white/20 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {currentItem.quality}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/60 mt-0.5 font-mono">
                Item {activeItemIndex + 1} dari {items.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pause / Play */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              {isPaused ? <Play size={14} className="ml-0.5" /> : <Pause size={14} />}
            </button>

            {/* Trash icon for own story */}
            {isMyStory && (
              <button
                onClick={() => {
                  setIsPaused(true);
                  setShowDeleteConfirm(true);
                }}
                className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Hapus status ini"
              >
                <Trash2 size={14} />
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Media Container with Tap Left/Right Zones */}
      <div
        className="w-full max-w-md flex-1 relative flex items-center justify-center overflow-hidden my-2"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {currentItem.type === 'video' ? (
          <video
            key={currentItem.id}
            src={currentItem.url}
            autoPlay
            playsInline
            muted={false}
            loop={false}
            onEnded={handleNextItem}
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <img
            key={currentItem.id}
            src={currentItem.url}
            alt="Status Item"
            className="w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Left Tap Zone */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handlePrevItem();
          }}
          className="absolute inset-y-0 left-0 w-1/3 cursor-pointer z-10"
        />

        {/* Right Tap Zone */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleNextItem();
          }}
          className="absolute inset-y-0 right-0 w-1/3 cursor-pointer z-10"
        />

        {/* Pause Badge */}
        {isPaused && !showDeleteConfirm && (
          <div className="absolute top-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-white/90 font-medium pointer-events-none z-20">
            Dijeda
          </div>
        )}
      </div>

      {/* Caption at bottom if present */}
      {currentItem.caption && (
        <div className="w-full max-w-md px-6 py-3 bg-gradient-to-t from-black/90 to-transparent text-center z-20">
          <p className="text-white text-sm font-medium drop-shadow">{currentItem.caption}</p>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/15 rounded-[28px] p-6 w-full max-w-xs text-center shadow-2xl">
            <Trash2 size={28} className="mx-auto text-red-400 mb-3" />
            <h4 className="text-base font-bold text-white mb-1">Hapus status ini?</h4>
            <p className="text-xs text-white/60 mb-5">
              Status ini akan dihapus permanen dari server untuk semua orang.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setIsPaused(false);
                }}
                className="flex-1 py-2.5 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 active:scale-95 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-500 active:scale-95 transition cursor-pointer shadow-lg"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
