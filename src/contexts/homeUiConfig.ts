import React, { useEffect, useState } from 'react';
import { deleteVideoBlob, getVideoBlob, saveVideoBlob } from './themeStorage.ts';

export type HomeLayoutMode =
  | 'grid-2'
  | 'grid-3'
  | 'grid-4'
  | 'list-vertical'
  | 'list-small-left'
  | 'list-horizontal'
  | 'carousel'
  | 'masonry'
  | 'staggered'
  | 'circle'
  | 'pill'
  | 'stack'
  | 'compact'
  | 'grid-1-large'
  | 'drag-drop'
  | 'focus-4'
  | 'minimal-icon';

export type HomeThemeId =
  | 'dark-stars'
  | 'pink-manja'
  | 'ungu-galaxy'
  | 'hitam-gold'
  | 'putih-minimal'
  | 'biru-neon'
  | 'merah-maroon'
  | 'hijau-tosca'
  | 'orange-sunset'
  | 'abu-monochrome';

export type HomeBoxStyle = 'tajam' | 'bulat' | 'kaca';

export type HomeShadowIntensity = 'mati' | 'tipis' | 'tebal' | 'neon';

export type LogoAnimationSpeed = 'mati' | 'pelan' | 'sedang' | 'cepet' | 'heboh';

export type LogoAnimStyle =
  | 'mati'
  | 'wiggle'
  | 'wiggle-heboh'
  | 'float'
  | 'bounce'
  | 'spin'
  | 'spin-fast'
  | 'blink'
  | 'pulse'
  | 'slide'
  | 'dance'
  | 'glow'
  | 'shake'
  | 'swing'
  | 'random'
  | 'tap-only';

export type LogoAnimSpeedSetting = 'pelan' | 'sedang' | 'cepet' | 'heboh';

export interface LogoAnimStoredConfig {
  enabled: boolean;
  style: LogoAnimStyle;
  speed: LogoAnimSpeedSetting;
}

export type HomeBlockId = 'video' | 'stories' | 'features';

export type BottomNavId = 'updates' | 'music' | 'comm' | 'chats' | 'you';

export interface HomeUiConfig {
  layoutMode: HomeLayoutMode;
  themeId: HomeThemeId;
  boxStyle: HomeBoxStyle;
  shadowIntensity: HomeShadowIntensity;
  shadowThickness: number;
  logoAnimation: LogoAnimationSpeed;
  logoAnimEnabled: boolean;
  logoAnimStyle: LogoAnimStyle;
  logoAnimSpeed: LogoAnimSpeedSetting;
  featureOrder: string[];
  favoriteFeatures: string[];
  featureSize: 'small' | 'medium' | 'large';
  featureGap: 'tight' | 'normal' | 'wide';
  sectionOrder: HomeBlockId[];
  headerPosition: 'top' | 'compact' | 'bottom' | 'hidden';
  videoPosition: 'top' | 'middle' | 'bottom' | 'hidden';
  videoSize: 'small' | 'medium' | 'large' | 'full';
  storiesPosition: 'top' | 'bottom' | 'hidden';
  storiesShape: 'circle' | 'square' | 'pill';
  bottomNavOrder: BottomNavId[];
  bottomNavHidden: boolean;
  bottomNavMode: 'all' | 'focus-4';
  bottomNavFavorites: BottomNavId[];
  bannerVideoMode: 'default' | 'preset' | 'custom-url' | 'custom-blob';
  bannerVideoUrl: string;
}

export const DEFAULT_HOME_BANNER_VIDEO =
  '/assets/aistudio/ssstik.io_1793231239969_f00ac994.mp4';

export const HOME_BANNER_BLOB_ID = 'home_hero_banner_video_v1';

export const DEFAULT_FEATURE_ORDER: string[] = [
  'tiktok',
  'topup',
  'ze-ai',
  'community',
  'group-chat',
  'zhd-ai',
  'web-to-apk',
  'tag-no',
];

export const DEFAULT_FAVORITE_FEATURES: string[] = [
  'tiktok',
  'topup',
  'ze-ai',
  'community',
];

export const DEFAULT_SECTION_ORDER: HomeBlockId[] = ['video', 'stories', 'features'];

export const DEFAULT_BOTTOM_NAV_ORDER: BottomNavId[] = [
  'updates',
  'music',
  'comm',
  'chats',
  'you',
];

export const DEFAULT_BOTTOM_NAV_FAVORITES: BottomNavId[] = [
  'updates',
  'music',
  'chats',
  'you',
];

export const DEFAULT_LOGO_ANIM_CONFIG: LogoAnimStoredConfig = {
  enabled: true,
  style: 'random',
  speed: 'pelan',
};

export const DEFAULT_HOME_UI_CONFIG: HomeUiConfig = {
  layoutMode: 'grid-2',
  themeId: 'dark-stars',
  boxStyle: 'bulat',
  shadowIntensity: 'tipis',
  shadowThickness: 35,
  logoAnimation: 'pelan',
  logoAnimEnabled: true,
  logoAnimStyle: 'random',
  logoAnimSpeed: 'pelan',
  featureOrder: DEFAULT_FEATURE_ORDER,
  favoriteFeatures: DEFAULT_FAVORITE_FEATURES,
  featureSize: 'medium',
  featureGap: 'normal',
  sectionOrder: DEFAULT_SECTION_ORDER,
  headerPosition: 'top',
  videoPosition: 'top',
  videoSize: 'medium',
  storiesPosition: 'top',
  storiesShape: 'circle',
  bottomNavOrder: DEFAULT_BOTTOM_NAV_ORDER,
  bottomNavHidden: false,
  bottomNavMode: 'all',
  bottomNavFavorites: DEFAULT_BOTTOM_NAV_FAVORITES,
  bannerVideoMode: 'default',
  bannerVideoUrl: DEFAULT_HOME_BANNER_VIDEO,
};

export const HOME_BANNER_PRESETS: Array<{ id: string; label: string; url: string }> = [
  {
    id: 'default-anime',
    label: 'Default Anime Feed',
    url: DEFAULT_HOME_BANNER_VIDEO,
  },
  {
    id: 'liquid-bw',
    label: 'Liquid Glass Wave',
    url: 'https://pomf2.lain.la/f/0c4r19dc.mp4',
  },
  {
    id: 'ocean-dark',
    label: 'Dark Ocean Motion',
    url: 'https://pomf2.lain.la/f/kv285epn.mp4',
  },
  {
    id: 'tiktok-loop',
    label: 'Cyber Motion Loop',
    url: '/assets/aistudio/ssstik.io_1792870405896_cd0f92f4.mp4',
  },
];

// Primary persistence keys requested by user + legacy mirror key
const PRIMARY_STORAGE_KEY = 'ze_home_ui';
const LOGO_ANIM_STORAGE_KEY = 'ze_logo_anim';
const LEGACY_STORAGE_KEY = 'ze_home_ui_config_v1';
const UPDATE_EVENT = 'ze-home-ui-updated';

const VALID_LOGO_STYLES: LogoAnimStyle[] = [
  'mati',
  'wiggle',
  'wiggle-heboh',
  'float',
  'bounce',
  'spin',
  'spin-fast',
  'blink',
  'pulse',
  'slide',
  'dance',
  'glow',
  'shake',
  'swing',
  'random',
  'tap-only',
];

const VALID_LOGO_SPEEDS: LogoAnimSpeedSetting[] = ['pelan', 'sedang', 'cepet', 'heboh'];

export function shadowIntensityToThickness(intensity: HomeShadowIntensity): number {
  if (intensity === 'mati') return 0;
  if (intensity === 'tipis') return 35;
  if (intensity === 'tebal') return 70;
  return 95;
}

export function thicknessToShadowIntensity(thickness: number): HomeShadowIntensity {
  if (thickness <= 0) return 'mati';
  if (thickness <= 45) return 'tipis';
  if (thickness <= 80) return 'tebal';
  return 'neon';
}

function clampShadowThickness(val: unknown, fallbackIntensity: HomeShadowIntensity): number {
  if (typeof val === 'number' && Number.isFinite(val)) {
    return Math.max(0, Math.min(100, Math.round(val)));
  }
  return shadowIntensityToThickness(fallbackIntensity);
}

let cachedCustomBannerBlobUrl: string | null = null;
let loadedCustomBlobOnce = false;

function normalizeFeatureOrder(order: unknown): string[] {
  if (!Array.isArray(order)) return [...DEFAULT_FEATURE_ORDER];
  const valid = order.filter(
    (id): id is string => typeof id === 'string' && DEFAULT_FEATURE_ORDER.includes(id)
  );
  const missing = DEFAULT_FEATURE_ORDER.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

function normalizeFavorites(favs: unknown): string[] {
  if (!Array.isArray(favs)) return [...DEFAULT_FAVORITE_FEATURES];
  const valid = favs.filter(
    (id): id is string => typeof id === 'string' && DEFAULT_FEATURE_ORDER.includes(id)
  );
  const combined = [...new Set([...valid, ...DEFAULT_FEATURE_ORDER])];
  return combined.slice(0, 4);
}

function normalizeSectionOrder(order: unknown): HomeBlockId[] {
  if (!Array.isArray(order)) return [...DEFAULT_SECTION_ORDER];
  const valid = order.filter(
    (id): id is HomeBlockId => id === 'video' || id === 'stories' || id === 'features'
  );
  const missing = DEFAULT_SECTION_ORDER.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

function normalizeBottomNavOrder(order: unknown): BottomNavId[] {
  if (!Array.isArray(order)) return [...DEFAULT_BOTTOM_NAV_ORDER];
  const valid = order.filter(
    (id): id is BottomNavId =>
      id === 'updates' || id === 'music' || id === 'comm' || id === 'chats' || id === 'you'
  );
  const missing = DEFAULT_BOTTOM_NAV_ORDER.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

function normalizeBottomNavFavorites(favs: unknown): BottomNavId[] {
  if (!Array.isArray(favs)) return [...DEFAULT_BOTTOM_NAV_FAVORITES];
  const valid = favs.filter(
    (id): id is BottomNavId =>
      id === 'updates' || id === 'music' || id === 'comm' || id === 'chats' || id === 'you'
  );
  const combined = [...new Set([...valid, ...DEFAULT_BOTTOM_NAV_ORDER])];
  return combined.slice(0, 4);
}

function loadLogoAnimStandalone(): Partial<LogoAnimStoredConfig> {
  try {
    const raw = localStorage.getItem(LOGO_ANIM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed?.enabled === 'boolean' ? parsed.enabled : undefined,
      style: VALID_LOGO_STYLES.includes(parsed?.style) ? parsed.style : undefined,
      speed: VALID_LOGO_SPEEDS.includes(parsed?.speed) ? parsed.speed : undefined,
    };
  } catch {
    return {};
  }
}

export function loadHomeUiConfig(): HomeUiConfig {
  try {
    const raw =
      localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const logoStandalone = loadLogoAnimStandalone();

    const legacyLogoAnim = parsed?.logoAnimation as LogoAnimationSpeed | undefined;
    const enabled =
      logoStandalone.enabled !== undefined
        ? logoStandalone.enabled
        : typeof parsed?.logoAnimEnabled === 'boolean'
        ? parsed.logoAnimEnabled
        : legacyLogoAnim === 'mati'
        ? false
        : DEFAULT_HOME_UI_CONFIG.logoAnimEnabled;

    const style: LogoAnimStyle =
      logoStandalone.style ||
      (VALID_LOGO_STYLES.includes(parsed?.logoAnimStyle)
        ? parsed.logoAnimStyle
        : DEFAULT_HOME_UI_CONFIG.logoAnimStyle);

    const speed: LogoAnimSpeedSetting =
      logoStandalone.speed ||
      (VALID_LOGO_SPEEDS.includes(parsed?.logoAnimSpeed)
        ? parsed.logoAnimSpeed
        : legacyLogoAnim && legacyLogoAnim !== 'mati' && VALID_LOGO_SPEEDS.includes(legacyLogoAnim)
        ? legacyLogoAnim
        : DEFAULT_HOME_UI_CONFIG.logoAnimSpeed);

    const effectiveLogoAnimation: LogoAnimationSpeed =
      !enabled || style === 'mati' ? 'mati' : speed;

    return {
      ...DEFAULT_HOME_UI_CONFIG,
      ...parsed,
      layoutMode: parsed?.layoutMode || DEFAULT_HOME_UI_CONFIG.layoutMode,
      themeId: parsed?.themeId || DEFAULT_HOME_UI_CONFIG.themeId,
      boxStyle: parsed?.boxStyle || DEFAULT_HOME_UI_CONFIG.boxStyle,
      shadowIntensity: parsed?.shadowIntensity || DEFAULT_HOME_UI_CONFIG.shadowIntensity,
      shadowThickness: clampShadowThickness(
        parsed?.shadowThickness,
        parsed?.shadowIntensity || DEFAULT_HOME_UI_CONFIG.shadowIntensity
      ),
      logoAnimation: effectiveLogoAnimation,
      logoAnimEnabled: enabled,
      logoAnimStyle: style,
      logoAnimSpeed: speed,
      featureOrder: normalizeFeatureOrder(parsed?.featureOrder),
      favoriteFeatures: normalizeFavorites(parsed?.favoriteFeatures),
      featureSize: parsed?.featureSize || 'medium',
      featureGap: parsed?.featureGap || 'normal',
      sectionOrder: normalizeSectionOrder(parsed?.sectionOrder),
      headerPosition: parsed?.headerPosition || 'top',
      videoPosition: parsed?.videoPosition || 'top',
      videoSize: parsed?.videoSize || 'medium',
      storiesPosition: parsed?.storiesPosition || 'top',
      storiesShape: parsed?.storiesShape || 'circle',
      bottomNavOrder: normalizeBottomNavOrder(parsed?.bottomNavOrder),
      bottomNavHidden: Boolean(parsed?.bottomNavHidden),
      bottomNavMode: parsed?.bottomNavMode === 'focus-4' ? 'focus-4' : 'all',
      bottomNavFavorites: normalizeBottomNavFavorites(parsed?.bottomNavFavorites),
      bannerVideoMode: parsed?.bannerVideoMode || 'default',
      bannerVideoUrl:
        typeof parsed?.bannerVideoUrl === 'string' && parsed.bannerVideoUrl.trim()
          ? parsed.bannerVideoUrl
          : DEFAULT_HOME_BANNER_VIDEO,
    };
  } catch {
    return { ...DEFAULT_HOME_UI_CONFIG };
  }
}

export function syncLogoAnimDomAttributes(
  cfg: Pick<HomeUiConfig, 'logoAnimEnabled' | 'logoAnimStyle' | 'logoAnimSpeed'>,
  accentColor?: string
) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-logo-anim-enabled', cfg.logoAnimEnabled ? 'true' : 'false');
  root.setAttribute('data-logo-anim-style', cfg.logoAnimEnabled ? cfg.logoAnimStyle : 'mati');
  root.setAttribute('data-logo-anim-speed', cfg.logoAnimSpeed);
  root.setAttribute(
    'data-logo-anim',
    !cfg.logoAnimEnabled || cfg.logoAnimStyle === 'mati' ? 'mati' : cfg.logoAnimSpeed
  );
  if (accentColor) {
    root.style.setProperty('--ze-theme-accent', accentColor);
  }
}

export function saveHomeUiConfig(next: HomeUiConfig): HomeUiConfig {
  const enabled =
    typeof next.logoAnimEnabled === 'boolean' ? next.logoAnimEnabled : DEFAULT_LOGO_ANIM_CONFIG.enabled;
  const style: LogoAnimStyle = VALID_LOGO_STYLES.includes(next.logoAnimStyle)
    ? next.logoAnimStyle
    : DEFAULT_LOGO_ANIM_CONFIG.style;
  const speed: LogoAnimSpeedSetting = VALID_LOGO_SPEEDS.includes(next.logoAnimSpeed)
    ? next.logoAnimSpeed
    : DEFAULT_LOGO_ANIM_CONFIG.speed;

  const resolvedThickness = clampShadowThickness(next.shadowThickness, next.shadowIntensity);
  const sanitized: HomeUiConfig = {
    ...DEFAULT_HOME_UI_CONFIG,
    ...next,
    shadowThickness: resolvedThickness,
    shadowIntensity: next.shadowIntensity || thicknessToShadowIntensity(resolvedThickness),
    logoAnimEnabled: enabled,
    logoAnimStyle: style,
    logoAnimSpeed: speed,
    logoAnimation: !enabled || style === 'mati' ? 'mati' : speed,
    featureOrder: normalizeFeatureOrder(next.featureOrder),
    favoriteFeatures: normalizeFavorites(next.favoriteFeatures),
    sectionOrder: normalizeSectionOrder(next.sectionOrder),
    bottomNavOrder: normalizeBottomNavOrder(next.bottomNavOrder),
    bottomNavFavorites: normalizeBottomNavFavorites(next.bottomNavFavorites),
    bannerVideoUrl: next.bannerVideoUrl?.trim() || DEFAULT_HOME_BANNER_VIDEO,
  };
  try {
    const serialized = JSON.stringify(sanitized);
    localStorage.setItem(PRIMARY_STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_STORAGE_KEY, serialized);
    localStorage.setItem(
      LOGO_ANIM_STORAGE_KEY,
      JSON.stringify({ enabled, style, speed } satisfies LogoAnimStoredConfig)
    );
  } catch {}

  const tokens = getHomeThemeTokens(
    sanitized.themeId,
    sanitized.boxStyle,
    sanitized.shadowIntensity,
    sanitized.shadowThickness
  );
  syncLogoAnimDomAttributes(sanitized, tokens.accentColor);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: sanitized }));
  }
  return sanitized;
}

export function updateHomeUiConfig(patch: Partial<HomeUiConfig>): HomeUiConfig {
  const current = loadHomeUiConfig();
  return saveHomeUiConfig({ ...current, ...patch });
}

export async function setCustomHomeBannerVideoFile(file: Blob): Promise<string> {
  await saveVideoBlob(HOME_BANNER_BLOB_ID, file);
  if (cachedCustomBannerBlobUrl) {
    try {
      URL.revokeObjectURL(cachedCustomBannerBlobUrl);
    } catch {}
  }
  const objUrl = URL.createObjectURL(file);
  cachedCustomBannerBlobUrl = objUrl;
  loadedCustomBlobOnce = true;
  updateHomeUiConfig({
    bannerVideoMode: 'custom-blob',
    bannerVideoUrl: DEFAULT_HOME_BANNER_VIDEO,
  });
  return objUrl;
}

export async function resetHomeBannerVideoToDefault(): Promise<void> {
  try {
    await deleteVideoBlob(HOME_BANNER_BLOB_ID);
  } catch {}
  if (cachedCustomBannerBlobUrl) {
    try {
      URL.revokeObjectURL(cachedCustomBannerBlobUrl);
    } catch {}
    cachedCustomBannerBlobUrl = null;
  }
  loadedCustomBlobOnce = true;
  updateHomeUiConfig({
    bannerVideoMode: 'default',
    bannerVideoUrl: DEFAULT_HOME_BANNER_VIDEO,
  });
}

export function useHomeUiConfig() {
  const [config, setConfig] = useState<HomeUiConfig>(() => loadHomeUiConfig());
  const [resolvedBannerVideoUrl, setResolvedBannerVideoUrl] = useState<string>(() => {
    const initial = loadHomeUiConfig();
    if (initial.bannerVideoMode === 'custom-blob' && cachedCustomBannerBlobUrl) {
      return cachedCustomBannerBlobUrl;
    }
    return initial.bannerVideoUrl || DEFAULT_HOME_BANNER_VIDEO;
  });

  useEffect(() => {
    let active = true;

    const tokens = getHomeThemeTokens(
      config.themeId,
      config.boxStyle,
      config.shadowIntensity,
      config.shadowThickness
    );
    syncLogoAnimDomAttributes(config, tokens.accentColor);

    const resolveBanner = async (cfg: HomeUiConfig) => {
      if (cfg.bannerVideoMode === 'custom-blob') {
        if (cachedCustomBannerBlobUrl) {
          if (active) setResolvedBannerVideoUrl(cachedCustomBannerBlobUrl);
          return;
        }
        if (!loadedCustomBlobOnce || !cachedCustomBannerBlobUrl) {
          loadedCustomBlobOnce = true;
          const blob = await getVideoBlob(HOME_BANNER_BLOB_ID);
          if (blob) {
            const url = URL.createObjectURL(blob);
            cachedCustomBannerBlobUrl = url;
            if (active) setResolvedBannerVideoUrl(url);
            return;
          }
        }
        if (active) setResolvedBannerVideoUrl(DEFAULT_HOME_BANNER_VIDEO);
      } else {
        if (active) setResolvedBannerVideoUrl(cfg.bannerVideoUrl || DEFAULT_HOME_BANNER_VIDEO);
      }
    };

    resolveBanner(config);

    const handleUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent<HomeUiConfig>)?.detail;
      const latest = detail || loadHomeUiConfig();
      setConfig(latest);
      resolveBanner(latest);
    };

    window.addEventListener(UPDATE_EVENT, handleUpdate);
    return () => {
      active = false;
      window.removeEventListener(UPDATE_EVENT, handleUpdate);
    };
  }, []);

  const patchConfig = (patch: Partial<HomeUiConfig>) => {
    const updated = updateHomeUiConfig(patch);
    setConfig(updated);
    return updated;
  };

  return {
    config,
    resolvedBannerVideoUrl,
    patchConfig,
    resetAll: () => {
      const resetCfg = saveHomeUiConfig({ ...DEFAULT_HOME_UI_CONFIG });
      setConfig(resetCfg);
    },
  };
}

export interface HomeThemeVisualTokens {
  id: HomeThemeId;
  name: string;
  desc: string;
  isLight: boolean;
  hasSolidBackdrop: boolean;
  backdropStyle: React.CSSProperties;
  headerStyle: React.CSSProperties;
  headerTextColor: string;
  headerButtonBg: string;
  headerButtonBorder: string;
  sectionTitleColor: string;
  mutedTextColor: string;
  cardStyle: React.CSSProperties;
  cardTitleColor: string;
  cardSubtitleColor: string;
  cardIconColor: string;
  iconBoxStyle: React.CSSProperties;
  badgeStyle: React.CSSProperties;
  storyBorderColor: string;
  accentColor: string;
  accentRgb: string;
  swatchGradient: string;
  swatchGlow: string;
}

/**
 * SEMUA 10 TEMA MEMAKAI BACKGROUND GELAP HITAM YANG SAMA PERSIS DENGAN TEMA GELAP BINTANG.
 * YANG BERUBAH HANYA WARNA BAYANGAN BAWAH+KIRI + GARIS BORDER KIRI+BAWAH SAJA.
 */
const DARK_BASE_SWATCH_BG = 'linear-gradient(145deg, #020307 0%, #090d18 100%)';
const DARK_BASE_SWATCH_CARD = '#090b10';

export const HOME_THEME_METADATA: Array<{
  id: HomeThemeId;
  name: string;
  desc: string;
  swatchBg: string;
  swatchCard: string;
  swatchGlow: string;
  swatchBorderLeft: string;
  swatchBorderBottom: string;
  accentHex: string;
  isLight: boolean;
}> = [
  {
    id: 'dark-stars',
    name: 'TEMA GELAP BINTANG',
    desc: 'Hitam gelap + bayangan kiri bawah biru',
    swatchBg: DARK_BASE_SWATCH_BG,
    swatchCard: DARK_BASE_SWATCH_CARD,
    swatchGlow: '-4px 6px 12px -2px rgba(59,130,246,0.62), -2px 2px 0 rgba(59,130,246,0.55)',
    swatchBorderLeft: '2px solid rgba(59,130,246,0.85)',
    swatchBorderBottom: '2px solid rgba(59,130,246,0.85)',
    accentHex: '#3b82f6',
    isLight: false,
  },
  {
    id: 'pink-manja',
    name: 'TEMA PINK MANJA',
    desc: 'Hitam gelap + bayangan kiri bawah pink',
    swatchBg: DARK_BASE_SWATCH_BG,
    swatchCard: DARK_BASE_SWATCH_CARD,
    swatchGlow: '-4px 6px 12px -2px rgba(236,72,153,0.65), -2px 2px 0 rgba(236,72,153,0.60)',
    swatchBorderLeft: '2px solid rgba(236,72,153,0.88)',
    swatchBorderBottom: '2px solid rgba(236,72,153,0.88)',
    accentHex: '#ec4899',
    isLight: false,
  },
  {
    id: 'ungu-galaxy',
    name: 'TEMA UNGU GALAXY',
    desc: 'Hitam gelap + bayangan kiri bawah ungu',
    swatchBg: DARK_BASE_SWATCH_BG,
    swatchCard: DARK_BASE_SWATCH_CARD,
    swatchGlow: '-4px 6px 12px -2px rgba(168,85,247,0.68), -2px 2px 0 rgba(168,85,247,0.60)',
    swatchBorderLeft: '2px solid rgba(168,85,247,0.88)',
    swatchBorderBottom: '2px solid rgba(168,85,247,0.88)',
    accentHex: '#a855f7',
    isLight: false,
  },
  {
    id: 'hitam-gold',
    name: 'TEMA HITAM GOLD',
    desc: 'Hitam gelap + bayangan kiri bawah emas',
    swatchBg: DARK_BASE_SWATCH_BG,
    swatchCard: DARK_BASE_SWATCH_CARD,
    swatchGlow: '-4px 6px 12px -2px rgba(245,158,11,0.65), -2px 2px 0 rgba(251,191,36,0.60)',
    swatchBorderLeft: '2px solid rgba(245,158,11,0.90)',
    swatchBorderBottom: '2px solid rgba(245,158,11,0.90)',
    accentHex: '#f59e0b',
    isLight: false,
  },
  {
    id: 'putih-minimal',
    name: 'TEMA PUTIH MINIMAL',
    desc: 'Hitam gelap + bayangan kiri bawah putih',
    swatchBg: DARK_BASE_SWATCH_BG,
    swatchCard: DARK_BASE_SWATCH_CARD,
    swatchGlow: '-4px 6px 12px -2px rgba(255,255,255,0.48), -2px 2px 0 rgba(255,255,255,0.55)',
    swatchBorderLeft: '2px solid rgba(255,255,255,0.85)',
    swatchBorderBottom: '2px solid rgba(255,255,255,0.85)',
    accentHex: '#f8fafc',
    isLight: false,
  },
  {
    id: 'biru-neon',
    name: 'TEMA BIRU NEON',
    desc: 'Hitam gelap + bayangan kiri bawah cyan',
    swatchBg: DARK_BASE_SWATCH_BG,
    swatchCard: DARK_BASE_SWATCH_CARD,
    swatchGlow: '-4px 6px 12px -2px rgba(34,211,238,0.65), -2px 2px 0 rgba(34,211,238,0.60)',
    swatchBorderLeft: '2px solid rgba(34,211,238,0.88)',
    swatchBorderBottom: '2px solid rgba(34,211,238,0.88)',
    accentHex: '#22d3ee',
    isLight: false,
  },
  {
    id: 'merah-maroon',
    name: 'TEMA MERAH MAROON',
    desc: 'Hitam gelap + bayangan kiri bawah merah',
    swatchBg: DARK_BASE_SWATCH_BG,
    swatchCard: DARK_BASE_SWATCH_CARD,
    swatchGlow: '-4px 6px 12px -2px rgba(244,63,94,0.65), -2px 2px 0 rgba(244,63,94,0.58)',
    swatchBorderLeft: '2px solid rgba(244,63,94,0.88)',
    swatchBorderBottom: '2px solid rgba(244,63,94,0.88)',
    accentHex: '#f43f5e',
    isLight: false,
  },
  {
    id: 'hijau-tosca',
    name: 'TEMA HIJAU TOSCA',
    desc: 'Hitam gelap + bayangan kiri bawah tosca',
    swatchBg: DARK_BASE_SWATCH_BG,
    swatchCard: DARK_BASE_SWATCH_CARD,
    swatchGlow: '-4px 6px 12px -2px rgba(20,184,166,0.65), -2px 2px 0 rgba(45,212,191,0.58)',
    swatchBorderLeft: '2px solid rgba(20,184,166,0.88)',
    swatchBorderBottom: '2px solid rgba(20,184,166,0.88)',
    accentHex: '#2dd4bf',
    isLight: false,
  },
  {
    id: 'orange-sunset',
    name: 'TEMA ORANGE SUNSET',
    desc: 'Hitam gelap + bayangan kiri bawah oranye',
    swatchBg: DARK_BASE_SWATCH_BG,
    swatchCard: DARK_BASE_SWATCH_CARD,
    swatchGlow: '-4px 6px 12px -2px rgba(249,115,22,0.65), -2px 2px 0 rgba(251,146,60,0.58)',
    swatchBorderLeft: '2px solid rgba(249,115,22,0.88)',
    swatchBorderBottom: '2px solid rgba(249,115,22,0.88)',
    accentHex: '#fb923c',
    isLight: false,
  },
  {
    id: 'abu-monochrome',
    name: 'TEMA ABU MONOCHROME',
    desc: 'Hitam gelap + bayangan kiri bawah abu silver',
    swatchBg: DARK_BASE_SWATCH_BG,
    swatchCard: DARK_BASE_SWATCH_CARD,
    swatchGlow: '-4px 6px 12px -2px rgba(161,161,170,0.52), -2px 2px 0 rgba(212,212,216,0.45)',
    swatchBorderLeft: '2px solid rgba(161,161,170,0.85)',
    swatchBorderBottom: '2px solid rgba(161,161,170,0.85)',
    accentHex: '#a1a1aa',
    isLight: false,
  },
];

const THEME_ACCENT_SPECS: Record<
  HomeThemeId,
  { name: string; desc: string; rgb: string; hex: string; storyHex: string }
> = {
  'dark-stars': {
    name: 'TEMA GELAP BINTANG',
    desc: 'Hitam gelap + bayangan kiri bawah biru',
    rgb: '59, 130, 246',
    hex: '#3b82f6',
    storyHex: '#00FF88',
  },
  'pink-manja': {
    name: 'TEMA PINK MANJA',
    desc: 'Hitam gelap + bayangan kiri bawah pink',
    rgb: '236, 72, 153',
    hex: '#ec4899',
    storyHex: '#ec4899',
  },
  'ungu-galaxy': {
    name: 'TEMA UNGU GALAXY',
    desc: 'Hitam gelap + bayangan kiri bawah ungu',
    rgb: '168, 85, 247',
    hex: '#a855f7',
    storyHex: '#c084fc',
  },
  'hitam-gold': {
    name: 'TEMA HITAM GOLD',
    desc: 'Hitam gelap + bayangan kiri bawah emas',
    rgb: '245, 158, 11',
    hex: '#f59e0b',
    storyHex: '#fbbf24',
  },
  'putih-minimal': {
    name: 'TEMA PUTIH MINIMAL',
    desc: 'Hitam gelap + bayangan kiri bawah putih',
    rgb: '248, 250, 252',
    hex: '#f8fafc',
    storyHex: '#ffffff',
  },
  'biru-neon': {
    name: 'TEMA BIRU NEON',
    desc: 'Hitam gelap + bayangan kiri bawah cyan',
    rgb: '34, 211, 238',
    hex: '#22d3ee',
    storyHex: '#22d3ee',
  },
  'merah-maroon': {
    name: 'TEMA MERAH MAROON',
    desc: 'Hitam gelap + bayangan kiri bawah merah',
    rgb: '244, 63, 94',
    hex: '#f43f5e',
    storyHex: '#fb7185',
  },
  'hijau-tosca': {
    name: 'TEMA HIJAU TOSCA',
    desc: 'Hitam gelap + bayangan kiri bawah tosca',
    rgb: '20, 184, 166',
    hex: '#2dd4bf',
    storyHex: '#2dd4bf',
  },
  'orange-sunset': {
    name: 'TEMA ORANGE SUNSET',
    desc: 'Hitam gelap + bayangan kiri bawah oranye',
    rgb: '249, 115, 22',
    hex: '#fb923c',
    storyHex: '#fb923c',
  },
  'abu-monochrome': {
    name: 'TEMA ABU MONOCHROME',
    desc: 'Hitam gelap + bayangan kiri bawah abu silver',
    rgb: '161, 161, 170',
    hex: '#a1a1aa',
    storyHex: '#d4d4d8',
  },
};

export function getHomeThemeTokens(
  themeId: HomeThemeId,
  boxStyle: HomeBoxStyle,
  shadowIntensity: HomeShadowIntensity,
  shadowThickness?: number
): HomeThemeVisualTokens {
  const spec = THEME_ACCENT_SPECS[themeId] || THEME_ACCENT_SPECS['dark-stars'];
  const radius =
    boxStyle === 'tajam' ? '8px' : boxStyle === 'kaca' ? '22px' : '28px';

  const resolvedThickness = clampShadowThickness(shadowThickness, shadowIntensity);
  const ratio = resolvedThickness / 100;

  /**
   * BAYANGAN KOTAK STRICTLY BAWAH + KIRI ONLY (ZERO ATAS + KANAN):
   * - Offset X negatif -> bayangan hanya jatuh ke pinggiran KIRI
   * - Offset Y positif -> bayangan hanya jatuh ke sisi BAWAH
   * - Spread negatif mencegah glow/blur melebar ke sisi ATAS atau KANAN
   * - Ketebalan dapat digeser manual (0 - 100)
   */
  const directionalShadow = (() => {
    if (resolvedThickness <= 0) return 'none';
    const offsetX = Math.round(-(2 + ratio * 11));
    const offsetY = Math.round(3 + ratio * 13);
    const blur = Math.round(6 + ratio * 22);
    const spread = Math.round(-(1 + ratio * 3));
    const edgeX = Math.round(-(1 + ratio * 4));
    const edgeY = Math.round(1 + ratio * 4);
    const alphaBlur = (0.22 + ratio * 0.62).toFixed(2);
    const alphaEdge = (0.32 + ratio * 0.63).toFixed(2);
    return `${offsetX}px ${offsetY}px ${blur}px ${spread}px rgba(${spec.rgb}, ${alphaBlur}), ${edgeX}px ${edgeY}px 0 rgba(${spec.rgb}, ${alphaEdge})`;
  })();

  const cleanRim = 'rgba(255, 255, 255, 0.08)';
  const rimAlpha = (0.34 + ratio * 0.60).toFixed(2);
  const strongRim =
    resolvedThickness <= 0 ? cleanRim : `rgba(${spec.rgb}, ${rimAlpha})`;
  const strongBorderPx =
    resolvedThickness <= 0
      ? '1px'
      : `${(1.2 + ratio * 2.3).toFixed(1)}px`;

  // Background kotak tetap persis dark/black seperti TEMA GELAP BINTANG
  const cardBg =
    boxStyle === 'kaca'
      ? 'rgba(12, 14, 20, 0.52)'
      : 'linear-gradient(160deg, rgba(10,12,18,0.92) 0%, rgba(5,6,10,0.95) 100%)';

  return {
    id: themeId in THEME_ACCENT_SPECS ? themeId : 'dark-stars',
    name: spec.name,
    desc: spec.desc,
    isLight: false,
    hasSolidBackdrop: false,
    backdropStyle: {
      background: 'transparent',
    },
    headerStyle: {
      background: 'rgba(10, 10, 14, 0.62)',
      borderBottom: `1.5px solid rgba(${spec.rgb}, 0.35)`,
    },
    headerTextColor: '#ffffff',
    headerButtonBg: 'rgba(255, 255, 255, 0.08)',
    headerButtonBorder: 'rgba(255, 255, 255, 0.18)',
    sectionTitleColor: '#ffffff',
    mutedTextColor: '#a1a1aa',
    cardStyle: {
      background: cardBg,
      borderTop: `1px solid ${cleanRim}`,
      borderRight: `1px solid ${cleanRim}`,
      borderBottom: `${strongBorderPx} solid ${strongRim}`,
      borderLeft: `${strongBorderPx} solid ${strongRim}`,
      borderRadius: radius,
      boxShadow: directionalShadow,
    },
    cardTitleColor: '#ffffff',
    cardSubtitleColor: '#d4d4d8',
    cardIconColor: '#ffffff',
    iconBoxStyle: {
      background: 'rgba(255, 255, 255, 0.07)',
      borderTop: '1px solid rgba(255, 255, 255, 0.14)',
      borderRight: '1px solid rgba(255, 255, 255, 0.14)',
      borderBottom: `1.5px solid rgba(${spec.rgb}, 0.45)`,
      borderLeft: `1.5px solid rgba(${spec.rgb}, 0.45)`,
    },
    badgeStyle: {
      background: 'rgba(255, 255, 255, 0.10)',
      border: `1px solid rgba(${spec.rgb}, 0.40)`,
      color: 'rgba(255, 255, 255, 0.94)',
    },
    storyBorderColor: spec.storyHex,
    accentColor: spec.hex,
    accentRgb: spec.rgb,
    swatchGradient: DARK_BASE_SWATCH_BG,
    swatchGlow: `-4px 6px 12px -2px rgba(${spec.rgb}, 0.58)`,
  };
}

