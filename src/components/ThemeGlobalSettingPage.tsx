import React, { useState, useRef, useMemo } from 'react';
import { ArrowLeft, Check, Film, Image as ImageIcon, Plus, Trash2, Upload, X, Loader2, Play } from 'lucide-react';
import { useTheme, GlobalTheme } from '../contexts/ThemeContext';
import { getHomeThemeTokens, useHomeUiConfig } from '../contexts/homeUiConfig';

export function ThemeGlobalSettingPage({ onBack }: { onBack: () => void }) {
  const { theme, setTheme, allThemes, addCustomTheme, deleteCustomTheme } = useTheme();
  const { config: homeCfg } = useHomeUiConfig();
  const themeTokens = useMemo(
    () =>
      getHomeThemeTokens(
        homeCfg.themeId,
        homeCfg.boxStyle,
        homeCfg.shadowIntensity,
        homeCfg.shadowThickness
      ),
    [homeCfg.themeId, homeCfg.boxStyle, homeCfg.shadowIntensity, homeCfg.shadowThickness]
  );

  const [selectedThemeId, setSelectedThemeId] = useState<string>(theme.id);
  const [appliedNotice, setAppliedNotice] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Custom Theme Modal State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customVideoFile, setCustomVideoFile] = useState<File | null>(null);
  const [customVideoPreviewUrl, setCustomVideoPreviewUrl] = useState<string | null>(null);
  const [customThemeName, setCustomThemeName] = useState('');
  const [customVideoUrlInput, setCustomVideoUrlInput] = useState('');
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (t: GlobalTheme) => {
    setConfirmDeleteId(null);
    setSelectedThemeId(t.id);
    setTheme(t);
  };

  const handleApplyToAll = () => {
    const target = allThemes.find((t) => t.id === selectedThemeId) || theme;
    setTheme(target);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setCustomError('File harus berupa video (MP4, WebM, dll)');
      return;
    }

    setCustomError(null);
    setCustomVideoFile(file);
    const objUrl = URL.createObjectURL(file);
    setCustomVideoPreviewUrl(objUrl);

    if (!customThemeName.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 25);
      setCustomThemeName(cleanName || 'Tema Video Saya');
    }
  };

  const handleSaveCustom = async () => {
    const activeVideo = customVideoPreviewUrl || customVideoUrlInput.trim();
    if (!activeVideo) {
      setCustomError('Pilih file video atau masukkan URL video terlebih dahulu!');
      return;
    }

    setIsSavingCustom(true);
    setCustomError(null);

    try {
      const name = customThemeName.trim() || 'Custom Video';
      const created = await addCustomTheme({
        name,
        subtitle: 'Video kustom pengguna',
        blob: customVideoFile || undefined,
        videoUrl: !customVideoFile ? customVideoUrlInput.trim() : undefined,
        bg: '#000000'
      });

      setSelectedThemeId(created.id);
      setTheme(created);
      setShowCustomModal(false);
      setCustomVideoFile(null);
      setCustomVideoPreviewUrl(null);
      setCustomThemeName('');
      setCustomVideoUrlInput('');

      setAppliedNotice(true);
      setTimeout(() => setAppliedNotice(false), 2500);
    } catch (err: any) {
      console.error('Failed to save custom theme:', err);
      setCustomError(err.message || 'Gagal menyimpan tema video');
    } finally {
      setIsSavingCustom(false);
    }
  };

  const handleConfirmDeleteCustom = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    await deleteCustomTheme(id);
    if (selectedThemeId === id) {
      setSelectedThemeId('bw-liquid-water');
    }
  };

  return (
    <div className="bg-transparent min-h-screen pb-32 text-white">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/mp4,video/webm,video/quicktime,video/*"
        className="hidden"
      />

      {/* Header */}
      <div
        style={themeTokens.headerStyle}
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-white text-base font-bold truncate">Tema Global</h2>
            <p className="text-[11px] text-white/55 truncate">
              Latar belakang video berlaku untuk seluruh halaman ZE.io
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Banner Info */}
        <div
          style={themeTokens.cardStyle}
          className="p-4 flex items-start gap-3"
        >
          <div
            style={themeTokens.iconBoxStyle}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          >
            <Film className="w-4 h-4 text-white ze-logo-anim ze-logo-tiktok" />
          </div>
          <div className="text-xs min-w-0">
            <p className="font-bold text-white">Tema Video Latar Belakang</p>
            <p className="text-white/60 text-[11px] mt-0.5 leading-relaxed">
              Pilih video latar belakang atau unggah video sendiri. Preview hanya diputar di tema aktif agar ringan di HP spek rendah.
            </p>
          </div>
        </div>

        {/* 2-Column Video Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          {allThemes.map((t) => {
            const isCurrent = theme.id === t.id;
            const isSelected = selectedThemeId === t.id;

            return (
              <div
                key={t.id}
                onClick={() => handleSelect(t)}
                style={{
                  ...themeTokens.cardStyle,
                  ...(isSelected
                    ? {
                        outline: `2px solid ${themeTokens.accentColor}`,
                        outlineOffset: '1px',
                      }
                    : {}),
                }}
                className="group relative overflow-hidden cursor-pointer text-left flex flex-col transition-transform active:scale-[0.98]"
              >
                {/* Media Preview Aspect 4:3 */}
                <div className="relative aspect-[4/3] w-full bg-zinc-950 overflow-hidden">
                  {t.video ? (
                    <video
                      key={`${t.id}-${isSelected ? 'active' : 'idle'}`}
                      autoPlay={isSelected}
                      muted
                      loop
                      playsInline
                      preload={isSelected ? 'auto' : 'metadata'}
                      src={t.video}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      style={{ background: t.bg || '#050505' }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <span className="text-xs font-mono text-white/40">{t.name}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />

                  {/* Type label */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-lg border border-white/15 text-[10px] text-white/85 font-semibold">
                    {t.isCustom ? (
                      <span>Custom</span>
                    ) : t.video ? (
                      <>
                        {isSelected ? (
                          <Film className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Play className="w-3 h-3 text-white/75" />
                        )}
                        <span>{isSelected ? 'Aktif' : 'Video'}</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3 text-white/60" />
                        <span>Gelap</span>
                      </>
                    )}
                  </div>

                  {/* Delete button for custom themes (inline 2-tap confirm, no browser confirm()) */}
                  {t.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleConfirmDeleteCustom(e, t.id)}
                      className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-white text-[10px] font-bold transition active:scale-95 shadow-md z-10 flex items-center gap-1 cursor-pointer ${
                        confirmDeleteId === t.id
                          ? 'bg-red-600'
                          : 'bg-black/70 hover:bg-red-600'
                      }`}
                      title={confirmDeleteId === t.id ? 'Ketuk lagi untuk hapus' : 'Hapus Tema Kustom'}
                    >
                      <Trash2 className="w-3 h-3" />
                      {confirmDeleteId === t.id && <span>Hapus?</span>}
                    </button>
                  )}

                  {isCurrent && !t.isCustom && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-black font-bold text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md">
                      <Check className="w-3 h-3" strokeWidth={3} />
                      <span>Dipakai</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-white truncate">{t.name}</p>
                    <p className="text-[10px] text-white/60 line-clamp-2 mt-0.5 leading-snug">
                      {t.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tombol + Custom Video */}
          <div
            onClick={() => {
              setCustomVideoFile(null);
              setCustomVideoPreviewUrl(null);
              setCustomThemeName('');
              setCustomVideoUrlInput('');
              setCustomError(null);
              setShowCustomModal(true);
            }}
            style={themeTokens.cardStyle}
            className="group relative overflow-hidden cursor-pointer flex flex-col justify-center items-center text-center p-4 min-h-[168px] aspect-[4/3] active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 group-hover:bg-white/15 border border-white/15 flex items-center justify-center mb-2.5 transition">
              <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-xs font-bold text-white">Custom Video</p>
            <p className="text-[10px] text-white/55 mt-1 leading-snug px-2">
              Upload video sendiri
            </p>
          </div>
        </div>

        {/* Action Button: Terapkan ke Semua */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleApplyToAll}
            className="w-full py-3.5 rounded-2xl bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-xl"
          >
            {appliedNotice ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Tema Berhasil Diterapkan ke Semua!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Terapkan ke Semua Halaman</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODAL: CUSTOM TEMA VIDEO SENDIRI */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div
            style={themeTokens.cardStyle}
            className="w-full max-w-sm p-5 shadow-2xl relative text-left"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div
                  style={themeTokens.iconBoxStyle}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                >
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Custom Tema Video</h3>
                  <p className="text-[10px] text-white/50">Gunakan video Anda untuk background</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/75 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error notice */}
            {customError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                {customError}
              </div>
            )}

            {/* Video Preview Box */}
            <div className="mt-4">
              <label className="text-[11px] font-semibold text-white/70 block mb-1.5">
                Preview Video Background
              </label>

              {customVideoPreviewUrl ? (
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/15 bg-black">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    src={customVideoPreviewUrl}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomVideoFile(null);
                      setCustomVideoPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/80 text-white text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Ganti</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[16/9] w-full rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 bg-black/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition p-4 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Ketuk untuk Unggah Video</p>
                    <p className="text-[10px] text-white/40 mt-0.5">MP4, WebM, MOV dari perangkat</p>
                  </div>
                </div>
              )}
            </div>

            {/* Or URL input */}
            <div className="mt-3">
              <label className="text-[11px] font-semibold text-white/70 block mb-1">
                Atau Masukkan Tautan Video URL
              </label>
              <input
                type="text"
                placeholder="https://.../video.mp4"
                value={customVideoUrlInput}
                onChange={(e) => {
                  setCustomVideoUrlInput(e.target.value);
                  if (e.target.value.trim().startsWith('http')) {
                    setCustomVideoPreviewUrl(e.target.value.trim());
                    setCustomVideoFile(null);
                  }
                }}
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/40"
              />
            </div>

            {/* Name Input */}
            <div className="mt-3">
              <label className="text-[11px] font-semibold text-white/70 block mb-1">
                Nama Tema
              </label>
              <input
                type="text"
                placeholder="Contoh: Video Favorit Saya"
                value={customThemeName}
                onChange={(e) => setCustomThemeName(e.target.value)}
                maxLength={30}
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/40"
              />
            </div>

            {/* Modal Actions */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/85 font-bold text-xs transition active:scale-95 cursor-pointer text-center"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isSavingCustom || (!customVideoPreviewUrl && !customVideoUrlInput.trim())}
                onClick={handleSaveCustom}
                className="py-2.5 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-white/90 active:scale-95 transition cursor-pointer disabled:opacity-40 shadow-lg text-center"
              >
                {isSavingCustom ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Terapkan Tema</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
