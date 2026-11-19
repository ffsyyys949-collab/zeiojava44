import React, { useState, useRef } from 'react';
import { Camera, Video, X, Check, Sliders } from 'lucide-react';
import { StoryItem } from './StoryViewer.tsx';

export function AddStoryModal({
  currentUser,
  onClose,
  onStoryAdded,
}: {
  currentUser: { id: string; name: string; photo?: string };
  onClose: () => void;
  onStoryAdded: (newStory: any) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [type, setType] = useState<'image' | 'video'>('image');
  const [quality, setQuality] = useState<'144p' | '360p' | '720p' | '1080p'>('720p');
  const [caption, setCaption] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 20MB');
      return;
    }

    const isVid = file.type.startsWith('video');
    setType(isVid ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview || isUploading) return;
    setIsUploading(true);

    const storyItemId = 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newItem: StoryItem = {
      id: storyItemId,
      type,
      url: preview,
      quality: type === 'video' ? quality : undefined,
      caption: caption.trim() || undefined,
      timestamp: Date.now(),
    };

    const payload = {
      id: 'story_' + currentUser.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhoto: currentUser.photo,
      mediaUrl: preview,
      mediaType: type,
      quality: type === 'video' ? quality : undefined,
      caption: caption.trim() || undefined,
      items: [newItem],
      createdAt: Date.now(),
    };

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        onStoryAdded(data.story || payload);
      } else {
        onStoryAdded(payload);
      }
    } catch {
      onStoryAdded(payload);
    }

    setIsUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#141414]/95 backdrop-blur-[30px] border border-white/10 rounded-[32px] p-6 w-full max-w-sm flex flex-col items-center shadow-2xl">
        <div className="w-full flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Camera size={18} className="text-white shrink-0" strokeWidth={1.5} />
            <h3 className="text-base font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">Buat Status Baru</h3>
          </div>
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white cursor-pointer shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Media Preview Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-56 rounded-2xl bg-[#1C1C1C] border-2 border-dashed border-white/20 hover:border-white/40 flex flex-col items-center justify-center overflow-hidden cursor-pointer relative group transition"
        >
          {preview ? (
            type === 'video' ? (
              <video src={preview} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={preview} alt="Story Preview" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="text-center p-4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                <Camera size={24} className="text-white" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-semibold text-white/90">Pilih Foto atau Video</p>
              <p className="text-[10px] text-white/40 mt-1">Galeri ponsel atau kamera</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Quality selector if video is chosen */}
        {type === 'video' && preview && (
          <div className="w-full mt-3">
            <div className="flex items-center gap-1.5 mb-1.5 text-xs text-white/60">
              <Sliders size={13} />
              <span>Kualitas Video</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['144p', '360p', '720p', '1080p'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className={`py-1.5 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                    quality === q
                      ? 'bg-white text-black border-white shadow'
                      : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {q === '720p' ? '720p HD' : q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Caption */}
        <input
          type="text"
          placeholder="Tulis keterangan status..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full bg-[#1C1C1C] border border-white/10 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-white/30 mt-3.5"
        />

        {errorMsg && <p className="text-xs text-red-400 mt-2">{errorMsg}</p>}

        {/* Submit */}
        <div className="flex gap-2 w-full mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!preview || isUploading}
            className="flex-1 py-3 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition disabled:opacity-40 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
          >
            {isUploading ? (
              <span>Mengunggah...</span>
            ) : (
              <>
                <Check size={14} />
                <span>Bagikan Status</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
