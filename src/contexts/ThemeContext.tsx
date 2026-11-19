import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  getCustomThemesMeta,
  saveCustomThemesMeta,
  saveVideoBlob,
  getVideoBlob,
  deleteVideoBlob,
  CustomThemeMeta
} from './themeStorage';

export interface GlobalTheme {
  id: string;
  name: string;
  subtitle: string;
  video: string | null;
  bg?: string;
  previewThumb?: string;
  isCustom?: boolean;
}

export const EXTERNAL_BG_MAIN_VIDEO = 'https://pomf2.lain.la/f/0c4r19dc.mp4';
export const EXTERNAL_BG_LIQUID_VIDEO = 'https://pomf2.lain.la/f/kv285epn.mp4';

export function resolveExternalBgVideoUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url === '/assets/aistudio/VID-20261028-WA0024_84426855.mp4') {
    return EXTERNAL_BG_MAIN_VIDEO;
  }
  if (url === '/assets/bw_water_liquid.mp4') {
    return EXTERNAL_BG_LIQUID_VIDEO;
  }
  return url;
}

export const GLOBAL_THEMES: GlobalTheme[] = [
  {
    id: 'bw-liquid-water',
    name: 'Black & White Liquid Glass',
    subtitle: 'Air hitam putih bergelombang & efek kaca monokrom mewah',
    video: EXTERNAL_BG_MAIN_VIDEO,
    bg: '#000000',
    previewThumb: '/assets/bw_water_still.jpg',
  },
  {
    id: 'black-liquid',
    name: 'Black Liquid',
    subtitle: 'Gelombang cairan hitam abstrak & bergelombang',
    video: EXTERNAL_BG_MAIN_VIDEO,
    bg: '#000000',
    previewThumb: '/assets/bw_water_still.jpg',
  },
  {
    id: 'minimal-dark',
    name: 'Minimal Dark Glass',
    subtitle: 'Tema kaca gelap murni OLED tanpa animasi',
    video: null,
    bg: '#050505',
  },
  {
    id: 'dark-ocean',
    name: 'Dark Ocean',
    subtitle: 'Video ombak laut malam monokrom',
    video: EXTERNAL_BG_LIQUID_VIDEO,
    bg: '#050b14',
  },
  {
    id: 'forest',
    name: 'Forest Mist',
    subtitle: 'Video hutan pinus berkabut tenang',
    video: EXTERNAL_BG_LIQUID_VIDEO,
    bg: '#07120c',
  },
];

interface ThemeContextType {
  theme: GlobalTheme;
  setTheme: (theme: GlobalTheme) => void;
  selectThemeById: (id: string) => void;
  allThemes: GlobalTheme[];
  addCustomTheme: (data: { name: string; subtitle?: string; blob?: Blob; videoUrl?: string; bg?: string }) => Promise<GlobalTheme>;
  deleteCustomTheme: (id: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [customThemes, setCustomThemes] = useState<GlobalTheme[]>([]);
  const objectUrlsRef = useRef<Map<string, string>>(new Map());

  // Load custom themes from storage on initial mount
  useEffect(() => {
    let isMounted = true;
    const loadCustom = async () => {
      try {
        const metas = getCustomThemesMeta();
        const loaded: GlobalTheme[] = [];
        for (const meta of metas) {
          let videoUrl = resolveExternalBgVideoUrl(meta.videoUrl || null);
          if (meta.hasBlob) {
            const blob = await getVideoBlob(meta.id);
            if (blob) {
              const url = URL.createObjectURL(blob);
              objectUrlsRef.current.set(meta.id, url);
              videoUrl = url;
            }
          }
          loaded.push({
            id: meta.id,
            name: meta.name,
            subtitle: meta.subtitle || 'Tema video kustom pengguna',
            video: videoUrl,
            bg: meta.bg || '#000000',
            isCustom: true
          });
        }
        if (isMounted) {
          setCustomThemes(loaded);
        }
      } catch (err) {
        console.warn('Error loading custom themes:', err);
      }
    };

    loadCustom();

    return () => {
      isMounted = false;
      // Revoke any created object URLs on unmount
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const [themeId, setThemeId] = useState<string>(() => {
    try {
      const savedSimple = localStorage.getItem('zeio-theme');
      if (savedSimple) return savedSimple;
      const saved = localStorage.getItem('zeio-global-theme');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.id) return parsed.id;
        } catch {
          return saved;
        }
      }
    } catch {}
    return 'bw-liquid-water'; // Default to Black & White Liquid Glass
  });

  const allThemes = [...GLOBAL_THEMES, ...customThemes];

  // Resolve current active theme
  const theme = allThemes.find((t) => t.id === themeId) || GLOBAL_THEMES[0];

  useEffect(() => {
    try {
      localStorage.setItem('zeio-theme', theme.id);
      localStorage.setItem('zeio-global-theme', JSON.stringify({
        id: theme.id,
        name: theme.name,
        subtitle: theme.subtitle,
        video: theme.video,
        bg: theme.bg,
        isCustom: theme.isCustom
      }));
    } catch {}
  }, [theme]);

  const setTheme = (newTheme: GlobalTheme) => {
    setThemeId(newTheme.id);
  };

  const selectThemeById = (id: string) => {
    const found = allThemes.find((t) => t.id === id);
    if (found) {
      setThemeId(found.id);
    }
  };

  const addCustomTheme = async (data: {
    name: string;
    subtitle?: string;
    blob?: Blob;
    videoUrl?: string;
    bg?: string;
  }): Promise<GlobalTheme> => {
    const id = 'custom-theme-' + Date.now();
    let videoUrl = data.videoUrl || null;
    let hasBlob = false;

    if (data.blob) {
      await saveVideoBlob(id, data.blob);
      hasBlob = true;
      videoUrl = URL.createObjectURL(data.blob);
      objectUrlsRef.current.set(id, videoUrl);
    }

    const meta: CustomThemeMeta = {
      id,
      name: data.name.trim() || 'Custom Video',
      subtitle: data.subtitle?.trim() || 'Tema video kustom sendiri',
      bg: data.bg || '#000000',
      hasBlob,
      videoUrl: !hasBlob ? videoUrl || undefined : undefined,
      createdAt: Date.now()
    };

    const existingMetas = getCustomThemesMeta();
    saveCustomThemesMeta([...existingMetas, meta]);

    const newTheme: GlobalTheme = {
      id,
      name: meta.name,
      subtitle: meta.subtitle,
      video: videoUrl,
      bg: meta.bg,
      isCustom: true
    };

    setCustomThemes((prev) => [...prev, newTheme]);
    setThemeId(id);
    return newTheme;
  };

  const deleteCustomTheme = async (id: string) => {
    try {
      await deleteVideoBlob(id);
    } catch {}

    const oldUrl = objectUrlsRef.current.get(id);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
      objectUrlsRef.current.delete(id);
    }

    const existingMetas = getCustomThemesMeta();
    saveCustomThemesMeta(existingMetas.filter((m) => m.id !== id));
    setCustomThemes((prev) => prev.filter((t) => t.id !== id));

    if (themeId === id) {
      setThemeId('bw-liquid-water');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        selectThemeById,
        allThemes,
        addCustomTheme,
        deleteCustomTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
