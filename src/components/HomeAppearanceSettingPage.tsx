import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bot,
  Check,
  Clock,
  Film,
  GripVertical,
  LayoutGrid,
  Loader2,
  Navigation,
  Palette,
  Power,
  RotateCcw,
  Upload,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_FEATURE_ORDER,
  DEFAULT_HOME_BANNER_VIDEO,
  getHomeThemeTokens,
  HOME_BANNER_PRESETS,
  HOME_THEME_METADATA,
  HomeBoxStyle,
  HomeLayoutMode,
  HomeShadowIntensity,
  LogoAnimSpeedSetting,
  LogoAnimStyle,
  resetHomeBannerVideoToDefault,
  setCustomHomeBannerVideoFile,
  shadowIntensityToThickness,
  thicknessToShadowIntensity,
  useHomeUiConfig,
  type BottomNavId,
} from '../contexts/homeUiConfig.ts';
import {
  restoreHiddenHistoryItems,
  useHistoryUiConfig,
  type HistoryDisplayMode,
  type HistoryFilterCategory,
  type HistoryLayoutMode,
  type HistorySortMode,
} from '../contexts/historyUiConfig.ts';

const LAYOUT_OPTIONS: Array<{
  id: HomeLayoutMode;
  title: string;
  desc: string;
}> = [
  { id: 'grid-2', title: '1. Grid 2 Kolom', desc: 'Kotak FEATURES 2 kolom klasik' },
  { id: 'grid-3', title: '2. Grid 3 Kolom Kecil', desc: 'Kotak ringkas 3 kolom' },
  { id: 'grid-4', title: '3. Grid 4 Kolom Mini', desc: '4 kolom super ringkas' },
  { id: 'list-vertical', title: '4. List Vertikal Besar', desc: '1 kolom memanjang ke bawah' },
  { id: 'list-small-left', title: '5. List Kecil + Icon Kiri', desc: 'Baris ramping icon di kiri' },
  { id: 'list-horizontal', title: '6. List Horizontal Geser', desc: 'Swipe kiri kanan berderet' },
  { id: 'carousel', title: '7. Carousel Gede', desc: '1 kotak besar bisa di-swipe' },
  { id: 'masonry', title: '8. Masonry / Acak', desc: 'Gede kecil ala Pinterest' },
  { id: 'staggered', title: '9. Staggered / Tangga', desc: 'Kotak zig-zag naik turun' },
  { id: 'circle', title: '10. Kotak Bulat', desc: 'Menu bentuk lingkaran penuh' },
  { id: 'pill', title: '11. Pill / Kapsul Panjang', desc: 'Kapsul panjang bulat penuh' },
  { id: 'stack', title: '12. Card Bertumpuk', desc: 'Kartu bertumpuk berurutan' },
  { id: 'compact', title: '13. Compact Rapat', desc: 'Hemat ruang banyak menu' },
  { id: 'grid-1-large', title: '14. Jumbo 1 Kolom', desc: '1 menu 1 baris gede + detail' },
  { id: 'drag-drop', title: '15. Bebas Drag & Drop', desc: 'Geser urutan sesuka hati' },
  { id: 'focus-4', title: '16. Mode Fokus (4 Gede)', desc: '4 menu favorit gede aja' },
  { id: 'minimal-icon', title: '17. Mode Minimal (Icon)', desc: 'Hanya logo animasi tanpa teks' },
];

const FEATURE_LABELS: Record<string, string> = {
  tiktok: 'TikTok No WM',
  topup: 'Top Up Diamond+',
  'ze-ai': 'ZE AI',
  community: 'Community',
  'group-chat': 'Group Chat',
  'zhd-ai': 'ZHD AI',
  'web-to-apk': 'WEB TO APK',
  'tag-no': 'TAG NO',
};

const BOTTOM_NAV_LABELS: Record<BottomNavId, string> = {
  updates: 'Updates',
  music: 'Music',
  comm: 'Communities',
  chats: 'Chats',
  you: 'You',
};

const BOX_STYLE_OPTIONS: Array<{ id: HomeBoxStyle; title: string; desc: string }> = [
  { id: 'tajam', title: 'KOTAK TAJAM', desc: 'Sudut tegas & lancip' },
  { id: 'bulat', title: 'KOTAK BULAT', desc: 'Sudut melengkung lembut' },
  { id: 'kaca', title: 'KOTAK KACA', desc: 'Transparan glass blur' },
];

const SHADOW_OPTIONS: Array<{ id: HomeShadowIntensity; title: string; desc: string }> = [
  { id: 'mati', title: 'Mati', desc: 'Tanpa bayangan' },
  { id: 'tipis', title: 'Tipis', desc: 'Bawah+Kiri halus' },
  { id: 'tebal', title: 'Tebal', desc: 'Bawah+Kiri tegas' },
  { id: 'neon', title: 'Neon Kiri+Bawah', desc: 'Glow 2 sisi' },
];

const LOGO_STYLE_OPTIONS: Array<{ id: LogoAnimStyle; title: string; desc: string }> = [
  { id: 'mati', title: '1. MATI / DIEM', desc: 'Tidak bergerak' },
  { id: 'wiggle', title: '2. GOYANG PELAN', desc: 'Goyang kiri kanan' },
  { id: 'wiggle-heboh', title: '3. GOYANG HEBOH', desc: 'Goyang kenceng' },
  { id: 'float', title: '4. NAIK TURUN', desc: 'Melayang halus' },
  { id: 'bounce', title: '5. LONCAT', desc: 'Loncat-loncat' },
  { id: 'spin', title: '6. MUTER', desc: 'Putar 360° pelan' },
  { id: 'spin-fast', title: '7. MUTER CEPET', desc: 'Putar 360° cepat' },
  { id: 'blink', title: '8. KEDIP', desc: 'Nyala mati kedip' },
  { id: 'pulse', title: '9. ZOOM IN OUT', desc: 'Gede kecil halus' },
  { id: 'slide', title: '10. GESER KIRI KANAN', desc: 'Geser samping' },
  { id: 'dance', title: '11. JOGET / DANCE', desc: 'Joget + miring' },
  { id: 'glow', title: '12. GLOW NYALA MATI', desc: 'Glow ikut tema' },
  { id: 'shake', title: '13. GETAR', desc: 'Geter kayak HP' },
  { id: 'swing', title: '14. AYUNAN', desc: 'Ayunan bandul' },
  { id: 'random', title: '15. CAMPUR / ACAK', desc: 'Tiap kotak beda' },
  { id: 'tap-only', title: '16. PAS DIPENCET', desc: 'Gerak pas diklik' },
];

const LOGO_SPEED_OPTIONS: Array<{ id: LogoAnimSpeedSetting; title: string; desc: string }> = [
  { id: 'pelan', title: 'Pelan', desc: 'Halus santai' },
  { id: 'sedang', title: 'Sedang', desc: 'Pas seimbang' },
  { id: 'cepet', title: 'Cepet', desc: 'Gerak lincah' },
  { id: 'heboh', title: 'Heboh', desc: 'Kenceng rame' },
];

function LayoutMiniPreview({ mode, accent }: { mode: HomeLayoutMode; accent: string }) {
  const boxCls = 'rounded-[3px] border border-white/25 bg-white/15';
  switch (mode) {
    case 'grid-2':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 grid grid-cols-2 gap-1">
          <div className={boxCls} />
          <div className={boxCls} />
          <div className={boxCls} />
          <div className={boxCls} />
        </div>
      );
    case 'grid-3':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 grid grid-cols-3 gap-1">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={boxCls} />
          ))}
        </div>
      );
    case 'grid-4':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 grid grid-cols-4 gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className={boxCls} />
          ))}
        </div>
      );
    case 'list-vertical':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 flex flex-col gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-2.5 rounded bg-white/15 border border-white/20 flex items-center px-1 gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
              <span className="h-1 flex-1 rounded bg-white/30" />
            </div>
          ))}
        </div>
      );
    case 'list-small-left':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 flex flex-col gap-1 justify-center">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 rounded bg-white/15 flex items-center px-1 gap-1">
              <span className="w-1 h-1 rounded-sm" style={{ background: accent }} />
              <span className="h-0.5 flex-1 rounded bg-white/35" />
            </div>
          ))}
        </div>
      );
    case 'list-horizontal':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 flex items-center gap-1 overflow-hidden">
          <div className="w-7 h-full rounded bg-white/20 border border-white/30 shrink-0" />
          <div className="w-7 h-full rounded bg-white/20 border border-white/30 shrink-0" />
          <div className="w-7 h-full rounded bg-white/15 border border-white/20 shrink-0" />
        </div>
      );
    case 'carousel':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 flex items-center gap-1.5 overflow-hidden">
          <div className="w-16 h-full rounded-lg bg-white/20 border border-white/35 shrink-0" />
          <div className="w-6 h-4/5 rounded-lg bg-white/10 border border-white/15 shrink-0" />
        </div>
      );
    case 'masonry':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 grid grid-cols-2 gap-1">
          <div className="flex flex-col gap-1">
            <div className="h-5 rounded-[3px] bg-white/20 border border-white/30" />
            <div className="h-3 rounded-[3px] bg-white/15 border border-white/20" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-3 rounded-[3px] bg-white/15 border border-white/20" />
            <div className="h-5 rounded-[3px] bg-white/20 border border-white/30" />
          </div>
        </div>
      );
    case 'staggered':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 grid grid-cols-2 gap-1">
          <div className="h-5 rounded-[3px] bg-white/20 border border-white/30" />
          <div className="h-5 mt-3 rounded-[3px] bg-white/20 border border-white/30" />
        </div>
      );
    case 'circle':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 flex items-center justify-around">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-4 h-4 rounded-full bg-white/20 border border-white/35" />
          ))}
        </div>
      );
    case 'pill':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 flex flex-col justify-center gap-1">
          <div className="h-3.5 rounded-full bg-white/20 border border-white/30 px-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
          </div>
          <div className="h-3.5 rounded-full bg-white/15 border border-white/25 px-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </div>
        </div>
      );
    case 'stack':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 relative flex items-center justify-center">
          <div className="w-14 h-5 rounded bg-white/10 border border-white/20 -translate-y-1.5 scale-90 absolute" />
          <div className="w-16 h-5 rounded bg-white/20 border border-white/35 translate-y-1 relative" />
        </div>
      );
    case 'compact':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 grid grid-cols-4 gap-0.5">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="rounded-[2px] bg-white/18 border border-white/25" />
          ))}
        </div>
      );
    case 'grid-1-large':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 flex flex-col gap-1">
          <div className="flex-1 rounded-md bg-white/15 border border-white/25 flex items-center gap-1.5 px-1.5">
            <div className="w-4 h-4 rounded" style={{ background: accent }} />
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-2/3 rounded bg-white/60" />
              <div className="h-1 w-full rounded bg-white/30" />
            </div>
          </div>
        </div>
      );
    case 'drag-drop':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 grid grid-cols-2 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[3px] border border-dashed border-white/40 bg-white/12 flex items-center justify-between px-1"
            >
              <GripVertical size={8} className="text-white/75" />
              <span className="w-2 h-1 rounded bg-white/45" />
            </div>
          ))}
        </div>
      );
    case 'focus-4':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 grid grid-cols-2 gap-1.5">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-md bg-white/22 border border-white/35 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
            </div>
          ))}
        </div>
      );
    case 'minimal-icon':
      return (
        <div className="w-full h-12 rounded-xl bg-black/50 border border-white/10 p-1.5 grid grid-cols-4 gap-1 place-items-center">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="w-3 h-3 rounded-md bg-white/25 border border-white/40" />
          ))}
        </div>
      );
  }
}

export function HomeAppearanceSettingPage({ onBack }: { onBack: () => void }) {
  const { config, resolvedBannerVideoUrl, patchConfig, resetAll } = useHomeUiConfig();
  const { config: histCfg, patchConfig: patchHistConfig, resetAll: resetHistAll } = useHistoryUiConfig();
  const [customUrlInput, setCustomUrlInput] = useState(
    config.bannerVideoMode === 'custom-url' ? config.bannerVideoUrl : ''
  );
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const tokens = getHomeThemeTokens(
    config.themeId,
    config.boxStyle,
    config.shadowIntensity,
    config.shadowThickness
  );

  const flashNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => {
      setNotice((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  const handleUploadBannerVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      flashNotice('Pilih file video (MP4 / WebM / MOV) ya.');
      return;
    }
    setIsSavingVideo(true);
    try {
      await setCustomHomeBannerVideoFile(file);
      flashNotice('Video banner atas beranda diperbarui!');
    } catch {
      flashNotice('Gagal menyimpan video. Coba video dengan ukuran lebih kecil.');
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleApplyVideoUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;
    patchConfig({ bannerVideoMode: 'custom-url', bannerVideoUrl: trimmed });
    flashNotice('URL video banner atas diterapkan!');
  };

  const handleSelectPresetVideo = (url: string) => {
    patchConfig({
      bannerVideoMode: url === DEFAULT_HOME_BANNER_VIDEO ? 'default' : 'preset',
      bannerVideoUrl: url,
    });
    flashNotice('Video banner atas diperbarui!');
  };

  const handleResetBannerVideo = async () => {
    setIsSavingVideo(true);
    await resetHomeBannerVideoToDefault();
    setCustomUrlInput('');
    setIsSavingVideo(false);
    flashNotice('Video banner kembali ke default!');
  };

  const moveBottomNav = (id: BottomNavId, delta: number) => {
    const arr = [...config.bottomNavOrder];
    const i = arr.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    patchConfig({ bottomNavOrder: arr });
  };

  const toggleFavoriteFeature = (featId: string) => {
    const exists = config.favoriteFeatures.includes(featId);
    if (exists) {
      if (config.favoriteFeatures.length <= 1) return;
      patchConfig({
        favoriteFeatures: config.favoriteFeatures.filter((id) => id !== featId),
      });
    } else {
      const next = [...config.favoriteFeatures, featId].slice(-4);
      patchConfig({ favoriteFeatures: next });
    }
  };

  const toggleBottomNavFav = (navId: BottomNavId) => {
    const exists = config.bottomNavFavorites.includes(navId);
    if (exists) {
      if (config.bottomNavFavorites.length <= 1) return;
      patchConfig({
        bottomNavFavorites: config.bottomNavFavorites.filter((id) => id !== navId),
      });
    } else {
      const next = [...config.bottomNavFavorites, navId].slice(-4);
      patchConfig({ bottomNavFavorites: next });
    }
  };

  return (
    <div
      data-logo-anim={config.logoAnimation}
      data-logo-anim-enabled={config.logoAnimEnabled ? 'true' : 'false'}
      data-logo-anim-style={config.logoAnimEnabled ? config.logoAnimStyle : 'mati'}
      data-logo-anim-speed={config.logoAnimSpeed}
      style={{ '--ze-theme-accent': tokens.accentColor } as React.CSSProperties}
      className="bg-transparent min-h-screen pb-32 text-white"
    >
      <input
        ref={videoFileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={handleUploadBannerVideo}
        className="hidden"
      />

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/[0.10] px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              UI Tampilan Beranda &amp; History
            </h2>
            <p className="text-[11px] text-white/55 truncate">
              17 Tata Letak • 10 Tema • 16 Animasi Logo • Bayangan Bawah+Kiri
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await resetHomeBannerVideoToDefault();
            resetAll();
            resetHistAll();
            setCustomUrlInput('');
            flashNotice('Semua tampilan Beranda & History di-reset.');
          }}
          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white/90 flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {notice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-extrabold shadow-2xl flex items-center gap-1.5 whitespace-nowrap">
          <Check size={14} strokeWidth={3} />
          <span>{notice}</span>
        </div>
      )}

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* LIVE CARD PREVIEW (Animasi Logo + Bayangan Bawah & Kiri) */}
        <section
          className="rounded-3xl p-4 border border-white/15 shadow-2xl overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #05070e 0%, #0d111d 100%)' }}
        >
          <div className="flex items-center justify-between mb-2.5 gap-2">
            <span
              className="text-[10px] font-extrabold tracking-widest uppercase truncate"
              style={{ color: tokens.sectionTitleColor }}
            >
              Preview Bayangan Kiri+Bawah &amp; Logo Gerak
            </span>
            <span
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0"
              style={tokens.badgeStyle}
            >
              {tokens.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="ze-feature-card p-4 flex flex-col items-center text-center cursor-pointer"
              style={tokens.cardStyle}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                style={tokens.iconBoxStyle}
              >
                <Film size={20} className="ze-logo-anim ze-logo-tiktok" style={{ color: tokens.cardIconColor }} />
              </div>
              <p className="text-xs font-bold" style={{ color: tokens.cardTitleColor }}>
                TikTok No WM
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: tokens.cardSubtitleColor }}>
                Bayangan bawah+kiri
              </p>
            </div>

            <div
              className="ze-feature-card p-4 flex flex-col items-center text-center cursor-pointer"
              style={tokens.cardStyle}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                style={tokens.iconBoxStyle}
              >
                <Bot size={20} className="ze-logo-anim ze-logo-zeai" style={{ color: tokens.cardIconColor }} />
              </div>
              <p className="text-xs font-bold" style={{ color: tokens.cardTitleColor }}>
                ZE AI
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: tokens.cardSubtitleColor }}>
                Atas &amp; kanan bersih
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 1: ANIMASI LOGO (ON/OFF + 16 GAYA + 4 KECEPATAN) */}
        <section className="rounded-3xl bg-[#161616] border border-white/10 p-4 space-y-4 shadow-xl">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={15} style={{ color: tokens.accentColor }} className="ze-logo-anim ze-logo-zeai" />
                <span>Animasi Logo di Semua Menu</span>
              </h3>
              <p className="text-[11px] text-white/55 mt-0.5">
                Berlaku untuk Features, Video, Stories, History, Bottom Nav &amp; Header. Pure CSS ringan.
              </p>
            </div>

            {/* BIG ON / OFF TOGGLE */}
            <button
              type="button"
              onClick={() => {
                const nextEnabled = !config.logoAnimEnabled;
                patchConfig({
                  logoAnimEnabled: nextEnabled,
                  logoAnimStyle:
                    nextEnabled && config.logoAnimStyle === 'mati'
                      ? 'random'
                      : config.logoAnimStyle,
                });
                flashNotice(nextEnabled ? 'Animasi Logo: NYALA' : 'Animasi Logo: MATI TOTAL');
              }}
              className={`w-full py-3 px-4 rounded-2xl border flex items-center justify-between transition cursor-pointer active:scale-[0.99] ${
                config.logoAnimEnabled
                  ? 'bg-emerald-500/20 border-emerald-400 text-white'
                  : 'bg-rose-500/15 border-rose-400/60 text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    config.logoAnimEnabled ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'
                  }`}
                >
                  <Power size={18} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold tracking-wide">
                    Animasi Logo: {config.logoAnimEnabled ? 'NYALA' : 'MATI'}
                  </p>
                  <p className="text-[10px] text-white/65">
                    {config.logoAnimEnabled
                      ? 'Ketuk untuk mematikan semua gerakan logo'
                      : 'Semua logo diam total (tidak goyang / kedip)'}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-xl text-[11px] font-black ${
                  config.logoAnimEnabled ? 'bg-emerald-500 text-black' : 'bg-white/15 text-white'
                }`}
              >
                {config.logoAnimEnabled ? 'NYALA' : 'MATI'}
              </span>
            </button>

            {/* 16 PILIHAN GAYA ANIMASI DENGAN LIVE PREVIEW */}
            <div>
              <p className="text-xs font-bold text-white mb-2">
                16 Pilihan Gaya Animasi (Live Preview)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {LOGO_STYLE_OPTIONS.map((opt) => {
                  const isOffChoice = opt.id === 'mati';
                  const selected = isOffChoice
                    ? !config.logoAnimEnabled || config.logoAnimStyle === 'mati'
                    : config.logoAnimEnabled && config.logoAnimStyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (isOffChoice) {
                          patchConfig({ logoAnimEnabled: false, logoAnimStyle: 'mati' });
                          flashNotice('Animasi Logo dimatikan');
                        } else {
                          patchConfig({ logoAnimEnabled: true, logoAnimStyle: opt.id });
                          flashNotice(`Gaya Animasi: ${opt.title}`);
                        }
                      }}
                      className={`group p-2.5 rounded-2xl border flex items-center gap-2.5 text-left transition cursor-pointer active:scale-[0.98] ${
                        selected
                          ? 'bg-white text-black border-white shadow-lg'
                          : 'bg-black/45 text-white border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          selected ? 'bg-black/10' : 'bg-white/10'
                        }`}
                      >
                        <Bot
                          size={16}
                          data-preview-style={opt.id}
                          className="ze-logo-preview"
                          style={{
                            color: selected ? '#09090b' : tokens.accentColor,
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold leading-tight truncate">
                          {opt.title}
                        </p>
                        <p
                          className={`text-[9px] leading-tight truncate mt-0.5 ${
                            selected ? 'text-black/70' : 'text-white/50'
                          }`}
                        >
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KECEPATAN ANIMASI */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs font-bold text-white mb-2">Kecepatan Animasi</p>
              <div className="grid grid-cols-4 gap-2">
                {LOGO_SPEED_OPTIONS.map((spd) => {
                  const selected = config.logoAnimSpeed === spd.id;
                  return (
                    <button
                      key={spd.id}
                      type="button"
                      onClick={() => {
                        patchConfig({ logoAnimSpeed: spd.id });
                        flashNotice(`Kecepatan: ${spd.title}`);
                      }}
                      className={`py-2 px-1.5 rounded-2xl border flex flex-col items-center text-center gap-0.5 transition cursor-pointer ${
                        selected
                          ? 'bg-white text-black border-white shadow-lg'
                          : 'bg-black/40 text-white border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className="text-[10px] font-extrabold leading-tight">
                        {spd.title}
                      </span>
                      <span
                        className={`text-[9px] leading-tight ${
                          selected ? 'text-black/70' : 'text-white/50'
                        }`}
                      >
                        {spd.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <h3 className="text-sm font-bold text-white">Gaya Sudut &amp; Bahan Kotak</h3>
            <div className="grid grid-cols-3 gap-2 mt-2.5">
              {BOX_STYLE_OPTIONS.map((opt) => {
                const selected = config.boxStyle === opt.id;
                const demoRadius =
                  opt.id === 'tajam'
                    ? 'rounded-[4px]'
                    : opt.id === 'kaca'
                    ? 'rounded-2xl backdrop-blur-md bg-white/15'
                    : 'rounded-full';
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      patchConfig({ boxStyle: opt.id });
                      flashNotice(`Gaya kotak: ${opt.title}`);
                    }}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition cursor-pointer ${
                      selected
                        ? 'bg-white/15 border-white'
                        : 'bg-black/40 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className={`w-10 h-6 border border-white/50 bg-white/10 ${demoRadius}`} />
                    <span className="text-[11px] font-extrabold text-white leading-tight">{opt.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white">Bayangan Kotak (Bawah + Kiri Saja)</h3>
              <p className="text-[11px] text-white/50 mt-0.5">
                Hanya jatuh ke sisi bawah &amp; kiri kotak; sisi atas &amp; kanan bersih
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {SHADOW_OPTIONS.map((opt) => {
                const selected = config.shadowIntensity === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      const nextThickness = shadowIntensityToThickness(opt.id);
                      patchConfig({ shadowIntensity: opt.id, shadowThickness: nextThickness });
                      flashNotice(`Bayangan: ${opt.title} (${nextThickness}%)`);
                    }}
                    className={`py-2 px-1.5 rounded-2xl border flex flex-col items-center text-center gap-0.5 transition cursor-pointer ${
                      selected
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-black/40 text-white border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold leading-tight">{opt.title}</span>
                    <span className={`text-[9px] leading-tight ${selected ? 'text-black/70' : 'text-white/50'}`}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* MANUAL DRAGGABLE SHADOW THICKNESS SLIDER */}
            {(() => {
              const thickness = typeof config.shadowThickness === 'number'
                ? Math.max(0, Math.min(100, config.shadowThickness))
                : shadowIntensityToThickness(config.shadowIntensity);
              const thicknessLabel =
                thickness === 0
                  ? 'Mati'
                  : thickness <= 25
                  ? 'Sangat Tipis'
                  : thickness <= 50
                  ? 'Tipis Halus'
                  : thickness <= 75
                  ? 'Tebal Tegas'
                  : 'Ekstra Tebal';
              const applyThickness = (nextVal: number) => {
                const clamped = Math.max(0, Math.min(100, Math.round(nextVal)));
                patchConfig({
                  shadowThickness: clamped,
                  shadowIntensity: thicknessToShadowIntensity(clamped),
                });
              };
              return (
                <div className="p-3 rounded-2xl bg-black/45 border border-white/12 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-white">Atur Ketebalan Bayangan Manual</p>
                      <p className="text-[10px] text-white/55">
                        Geser kiri/kanan sesuai selera ({thicknessLabel})
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-xl text-[11px] font-black border shrink-0"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        borderColor: tokens.accentColor,
                        color: '#ffffff',
                      }}
                    >
                      {thickness}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => applyThickness(thickness - 5)}
                      aria-label="Kurangi ketebalan bayangan"
                      className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-black text-sm flex items-center justify-center cursor-pointer shrink-0"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={thickness}
                      onChange={(e) => applyThickness(Number(e.target.value))}
                      aria-label="Ketebalan bayangan bawah dan kiri"
                      className="w-full h-2.5 rounded-full appearance-none cursor-pointer touch-pan-x"
                      style={{
                        accentColor: tokens.accentColor,
                        background: `linear-gradient(to right, ${tokens.accentColor} 0%, ${tokens.accentColor} ${thickness}%, rgba(255,255,255,0.16) ${thickness}%, rgba(255,255,255,0.16) 100%)`,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => applyThickness(thickness + 5)}
                      aria-label="Tambah ketebalan bayangan"
                      className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-black text-sm flex items-center justify-center cursor-pointer shrink-0"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-white/55 px-0.5">
                    {[
                      { v: 0, label: '0% Mati' },
                      { v: 35, label: '35% Tipis' },
                      { v: 70, label: '70% Tebal' },
                      { v: 100, label: '100% Max' },
                    ].map((mark) => (
                      <button
                        key={mark.v}
                        type="button"
                        onClick={() => {
                          applyThickness(mark.v);
                          flashNotice(`Ketebalan bayangan: ${mark.v}%`);
                        }}
                        className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                          Math.abs(thickness - mark.v) <= 5
                            ? 'text-white font-bold bg-white/15'
                            : 'hover:text-white/85'
                        }`}
                      >
                        {mark.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* SECTION 2: 17 PILIHAN TATA LETAK BERANDA */}
        <section className="rounded-3xl bg-[#161616] border border-white/10 p-4 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <LayoutGrid size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Tata Letak Beranda (17 Pilihan)</h3>
                <p className="text-[11px] text-white/50">
                  Semua fungsi tombol menu tetap aktif 100%
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {LAYOUT_OPTIONS.map((opt) => {
              const selected = config.layoutMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    patchConfig({ layoutMode: opt.id });
                    flashNotice(`Tata letak: ${opt.title}`);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer active:scale-[0.98] flex flex-col gap-2 ${
                    selected
                      ? 'bg-white/15 border-white shadow-[0_0_16px_rgba(255,255,255,0.22)]'
                      : 'bg-black/40 border-white/10 hover:border-white/30'
                  }`}
                >
                  <LayoutMiniPreview mode={opt.id} accent={tokens.accentColor} />
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold text-white leading-tight">{opt.title}</p>
                      <p className="text-[9px] text-white/55 mt-0.5 leading-snug">{opt.desc}</p>
                    </div>
                    {selected && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Ukuran & Jarak Features + Pilihan 4 Favorit */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[11px] font-bold text-white/80 mb-1.5">Ukuran Kotak Menu</p>
                <div className="grid grid-cols-3 gap-1">
                  {(['small', 'medium', 'large'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => patchConfig({ featureSize: sz })}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                        config.featureSize === sz
                          ? 'bg-white text-black border-white'
                          : 'bg-black/40 text-white/75 border-white/15'
                      }`}
                    >
                      {sz === 'small' ? 'Kecil' : sz === 'large' ? 'Gede' : 'Sedang'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-white/80 mb-1.5">Jarak Antar Kotak</p>
                <div className="grid grid-cols-3 gap-1">
                  {(['tight', 'normal', 'wide'] as const).map((gp) => (
                    <button
                      key={gp}
                      type="button"
                      onClick={() => patchConfig({ featureGap: gp })}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                        config.featureGap === gp
                          ? 'bg-white text-black border-white'
                          : 'bg-black/40 text-white/75 border-white/15'
                      }`}
                    >
                      {gp === 'tight' ? 'Rapat' : gp === 'wide' ? 'Lebar' : 'Normal'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {config.layoutMode === 'focus-4' && (
              <div className="p-3 rounded-2xl bg-black/40 border border-white/15 space-y-2">
                <p className="text-[11px] font-bold text-white">
                  Pilih 4 Menu Favorit (Mode Fokus):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_FEATURE_ORDER.map((id) => {
                    const active = config.favoriteFeatures.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleFavoriteFeature(id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer ${
                          active
                            ? 'bg-emerald-500 text-black border-emerald-400'
                            : 'bg-white/5 text-white/70 border-white/15'
                        }`}
                      >
                        {FEATURE_LABELS[id] || id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: ATUR SEMUA KOTAK (VIDEO BANNER, STORIES, HEADER, BOTTOM NAV) */}
        <section className="rounded-3xl bg-[#161616] border border-white/10 p-4 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Navigation size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Posisi Semua Kotak Beranda</h3>
              <p className="text-[11px] text-white/50">
                Pindahkan posisi Header, Video Banner, Stories &amp; Bottom Nav di sini
              </p>
            </div>
          </div>

          {/* A. Header */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-white">Header (Logo ZE.io + Search + Notif)</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'top', label: 'Atas' },
                  { id: 'compact', label: 'Dikecilin' },
                  { id: 'bottom', label: 'Di Bawah' },
                  { id: 'hidden', label: 'Sembunyi' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => patchConfig({ headerPosition: opt.id })}
                  className={`py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                    config.headerPosition === opt.id
                      ? 'bg-white text-black border-white'
                      : 'bg-black/40 text-white/80 border-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* B. Video Banner Position + Size */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <p className="text-xs font-bold text-white">Kotak Video Banner</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'top', label: 'Paling Atas' },
                  { id: 'middle', label: 'Di Tengah' },
                  { id: 'bottom', label: 'Di Bawah' },
                  { id: 'hidden', label: 'Sembunyi' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    const nextOrder =
                      opt.id === 'top'
                        ? (['video', 'stories', 'features'] as const)
                        : opt.id === 'middle'
                        ? (['stories', 'video', 'features'] as const)
                        : opt.id === 'bottom'
                        ? (['stories', 'features', 'video'] as const)
                        : config.sectionOrder;
                    patchConfig({ videoPosition: opt.id, sectionOrder: [...nextOrder] });
                  }}
                  className={`py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                    config.videoPosition === opt.id
                      ? 'bg-white text-black border-white'
                      : 'bg-black/40 text-white/80 border-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'small', label: 'Kecil' },
                  { id: 'medium', label: 'Sedang' },
                  { id: 'large', label: 'Gede' },
                  { id: 'full', label: 'Full Width' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => patchConfig({ videoSize: opt.id })}
                  className={`py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                    config.videoSize === opt.id
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-black/40 text-white/75 border-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* C. Stories Position + Shape */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <p className="text-xs font-bold text-white">Kotak Stories (+ Add Story)</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'top', label: 'Di Atas' },
                  { id: 'bottom', label: 'Di Bawah' },
                  { id: 'hidden', label: 'Sembunyi' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    const without = config.sectionOrder.filter((s) => s !== 'stories');
                    const nextOrder =
                      opt.id === 'top'
                        ? ['stories', ...without]
                        : opt.id === 'bottom'
                        ? [...without, 'stories']
                        : config.sectionOrder;
                    patchConfig({
                      storiesPosition: opt.id,
                      sectionOrder: nextOrder as any,
                    });
                  }}
                  className={`py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                    config.storiesPosition === opt.id
                      ? 'bg-white text-black border-white'
                      : 'bg-black/40 text-white/80 border-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'circle', label: 'Bentuk Bulat' },
                  { id: 'square', label: 'Bentuk Kotak' },
                  { id: 'pill', label: 'Bentuk Kapsul' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => patchConfig({ storiesShape: opt.id })}
                  className={`py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                    config.storiesShape === opt.id
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-black/40 text-white/75 border-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* D. Bottom Nav */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-white">Bottom Nav (Bawah)</p>
              <button
                type="button"
                onClick={() => patchConfig({ bottomNavHidden: !config.bottomNavHidden })}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer ${
                  config.bottomNavHidden
                    ? 'bg-rose-500/25 border-rose-400 text-rose-200'
                    : 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                }`}
              >
                {config.bottomNavHidden ? 'Tersembunyi (Tap Munculin)' : 'Tampil'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => patchConfig({ bottomNavMode: 'all' })}
                className={`py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                  config.bottomNavMode === 'all'
                    ? 'bg-white text-black border-white'
                    : 'bg-black/40 text-white/75 border-white/15'
                }`}
              >
                Tampilkan Semua (5)
              </button>
              <button
                type="button"
                onClick={() => patchConfig({ bottomNavMode: 'focus-4' })}
                className={`py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                  config.bottomNavMode === 'focus-4'
                    ? 'bg-white text-black border-white'
                    : 'bg-black/40 text-white/75 border-white/15'
                }`}
              >
                Ganti 4 Menu Favorit
              </button>
            </div>

            <div className="space-y-1">
              {config.bottomNavOrder.map((navId, idx) => (
                <div
                  key={navId}
                  className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    {config.bottomNavMode === 'focus-4' && (
                      <input
                        type="checkbox"
                        checked={config.bottomNavFavorites.includes(navId)}
                        onChange={() => toggleBottomNavFav(navId)}
                        className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer"
                      />
                    )}
                    <span className="text-[11px] font-bold text-white">
                      {idx + 1}. {BOTTOM_NAV_LABELS[navId]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveBottomNav(navId, -1)}
                      className="w-6 h-6 rounded-lg bg-white/10 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === config.bottomNavOrder.length - 1}
                      onClick={() => moveBottomNav(navId, 1)}
                      className="w-6 h-6 rounded-lg bg-white/10 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    >
                      <ArrowDown size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: VIDEO BANNER ATAS BERANDA */}
        <section className="rounded-3xl bg-[#161616] border border-white/10 p-4 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Film size={16} className="ze-logo-anim ze-logo-tiktok text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ganti Isi Video Banner</h3>
                <p className="text-[11px] text-white/50">Upload video sendiri, preset, atau link .mp4</p>
              </div>
            </div>
            {config.bannerVideoMode !== 'default' && (
              <button
                type="button"
                onClick={handleResetBannerVideo}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
              >
                Reset Default
              </button>
            )}
          </div>

          <div className="relative w-full h-[116px] rounded-2xl overflow-hidden border border-white/15 bg-black">
            <video
              key={resolvedBannerVideoUrl}
              src={resolvedBannerVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover ze-video-thumb-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
              <p className="text-xs font-bold text-white">ZE.io Realtime Feed</p>
              <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/20 text-[10px] text-emerald-400 font-semibold">
                {config.bannerVideoMode === 'custom-blob' ? 'Video Sendiri' : 'Aktif'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isSavingVideo}
              onClick={() => videoFileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-2xl bg-white text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-white/90 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {isSavingVideo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>Upload Video</span>
            </button>
            <button
              type="button"
              disabled={isSavingVideo}
              onClick={handleResetBannerVideo}
              className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Pakai Default</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {HOME_BANNER_PRESETS.map((preset) => {
              const active =
                config.bannerVideoMode !== 'custom-blob' && config.bannerVideoUrl === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPresetVideo(preset.url)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                    active
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 text-white/80 border-white/15 hover:bg-white/10'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="Atau tempel URL video .mp4 ..."
              className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/35 outline-none focus:border-white/40"
            />
            <button
              type="button"
              onClick={handleApplyVideoUrl}
              disabled={!customUrlInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition"
            >
              Pakai
            </button>
          </div>
        </section>

        {/* SECTION 5: 10 PILIHAN TEMA APLIKASI (MASING-MASING BAYANGAN BAWAH+KIRI) */}
        <section className="rounded-3xl bg-[#161616] border border-white/10 p-4 space-y-3.5 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Palette size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">10 Pilihan Tema Aplikasi</h3>
              <p className="text-[11px] text-white/50">
                Terpasang ke Beranda, Video Banner, dan Halaman History
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {HOME_THEME_METADATA.map((item) => {
              const selected = config.themeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    patchConfig({ themeId: item.id });
                    flashNotice(`Tema: ${item.name}`);
                  }}
                  className={`rounded-2xl border p-2.5 text-left transition cursor-pointer active:scale-[0.98] flex flex-col gap-2 ${
                    selected
                      ? 'border-white bg-white/15 shadow-[0_0_16px_rgba(255,255,255,0.22)]'
                      : 'border-white/10 bg-black/40 hover:border-white/30'
                  }`}
                >
                  <div
                    className="w-full h-12 rounded-xl p-2 flex items-center justify-center"
                    style={{ background: item.swatchBg }}
                  >
                    <div
                      className="w-full h-full rounded-lg flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: item.swatchCard,
                        boxShadow: item.swatchGlow,
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        borderRight: '1px solid rgba(255,255,255,0.08)',
                        borderLeft: item.swatchBorderLeft,
                        borderBottom: item.swatchBorderBottom,
                        color: '#ffffff',
                      }}
                    >
                      FEATURES
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold text-white leading-tight">{item.name}</p>
                      <p className="text-[9px] text-white/55 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                    {selected && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 6: PENGATURAN HALAMAN HISTORY (ze_history_ui) */}
        <section className="rounded-3xl bg-[#161616] border border-white/10 p-4 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Clock size={16} className="ze-logo-anim ze-logo-history text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Pengaturan Halaman History</h3>
                <p className="text-[11px] text-white/50">
                  Tata letak, urutan, filter, &amp; tampilan (otomatis ikut tema Beranda)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-white/80">Tata Letak History</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'list-vertical', label: 'List Vertikal' },
                  { id: 'grid-2', label: 'Grid 2' },
                  { id: 'grid-3', label: 'Grid 3' },
                  { id: 'card-large', label: 'Card Gede' },
                  { id: 'compact', label: 'Compact' },
                ] as Array<{ id: HistoryLayoutMode; label: string }>
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    patchHistConfig({ layout: opt.id });
                    flashNotice(`History layout: ${opt.label}`);
                  }}
                  className={`py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                    histCfg.layout === opt.id
                      ? 'bg-white text-black border-white'
                      : 'bg-black/40 text-white/80 border-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] font-bold text-white/80 mb-1">Urutan History</p>
              <select
                value={histCfg.sort}
                onChange={(e) => patchHistConfig({ sort: e.target.value as HistorySortMode })}
                className="w-full px-2.5 py-2 rounded-xl bg-black/45 border border-white/15 text-xs font-bold text-white outline-none"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="most-opened">Paling Sering Dibuka</option>
              </select>
            </div>
            <div>
              <p className="text-[11px] font-bold text-white/80 mb-1">Filter Default</p>
              <select
                value={histCfg.filter}
                onChange={(e) => patchHistConfig({ filter: e.target.value as HistoryFilterCategory })}
                className="w-full px-2.5 py-2 rounded-xl bg-black/45 border border-white/15 text-xs font-bold text-white outline-none"
              >
                <option value="all">Semua</option>
                <option value="video">Video</option>
                <option value="chat">Chat</option>
                <option value="download">Download</option>
                <option value="topup">Top Up</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-white/80 mb-1.5">Tampilan Kartu History</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'thumb-left', label: 'Thumb Kiri' },
                  { id: 'thumb-large', label: 'Thumb Gede' },
                  { id: 'text-only', label: 'Cuma Teks' },
                ] as Array<{ id: HistoryDisplayMode; label: string }>
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => patchHistConfig({ display: opt.id })}
                  className={`py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                    histCfg.display === opt.id
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-black/40 text-white/80 border-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => patchHistConfig({ hideHistory: !histCfg.hideHistory })}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer ${
                histCfg.hideHistory
                  ? 'bg-rose-500/25 border-rose-400 text-rose-200'
                  : 'bg-white/10 border-white/20 text-white'
              }`}
            >
              {histCfg.hideHistory ? 'History Tersembunyi' : 'Sembunyikan History'}
            </button>
            <button
              type="button"
              onClick={() => {
                restoreHiddenHistoryItems();
                flashNotice('Semua item history tersembunyi dipulihkan.');
              }}
              className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold text-white cursor-pointer"
            >
              Pulihkan Item Tersembunyi
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
