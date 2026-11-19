import { useEffect, useState } from 'react';

export type HistoryLayoutMode =
  | 'list-vertical'
  | 'grid-2'
  | 'grid-3'
  | 'card-large'
  | 'compact';

export type HistorySortMode = 'newest' | 'oldest' | 'most-opened';

export type HistoryFilterCategory = 'all' | 'video' | 'chat' | 'download' | 'topup';

export type HistoryDisplayMode = 'thumb-large' | 'text-only' | 'thumb-left';

export interface HistoryUiConfig {
  layout: HistoryLayoutMode;
  sort: HistorySortMode;
  filter: HistoryFilterCategory;
  display: HistoryDisplayMode;
  hideHistory: boolean;
  hiddenIds: string[];
  deletedIds: string[];
  openCounts: Record<string, number>;
}

export const HISTORY_UI_STORAGE_KEY = 'ze_history_ui';
const HISTORY_UPDATE_EVENT = 'ze-history-ui-updated';

export const DEFAULT_HISTORY_UI_CONFIG: HistoryUiConfig = {
  layout: 'list-vertical',
  sort: 'newest',
  filter: 'all',
  display: 'thumb-left',
  hideHistory: false,
  hiddenIds: [],
  deletedIds: [],
  openCounts: {},
};

export function loadHistoryUiConfig(): HistoryUiConfig {
  try {
    const raw = localStorage.getItem(HISTORY_UI_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_HISTORY_UI_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_HISTORY_UI_CONFIG,
      ...parsed,
      hiddenIds: Array.isArray(parsed?.hiddenIds) ? parsed.hiddenIds : [],
      deletedIds: Array.isArray(parsed?.deletedIds) ? parsed.deletedIds : [],
      openCounts:
        parsed?.openCounts && typeof parsed.openCounts === 'object' ? parsed.openCounts : {},
    };
  } catch {
    return { ...DEFAULT_HISTORY_UI_CONFIG };
  }
}

export function saveHistoryUiConfig(next: HistoryUiConfig): HistoryUiConfig {
  const sanitized: HistoryUiConfig = {
    ...DEFAULT_HISTORY_UI_CONFIG,
    ...next,
    hiddenIds: Array.isArray(next.hiddenIds) ? next.hiddenIds : [],
    deletedIds: Array.isArray(next.deletedIds) ? next.deletedIds : [],
    openCounts: next.openCounts || {},
  };
  try {
    localStorage.setItem(HISTORY_UI_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HISTORY_UPDATE_EVENT, { detail: sanitized }));
  }
  return sanitized;
}

export function updateHistoryUiConfig(patch: Partial<HistoryUiConfig>): HistoryUiConfig {
  const cur = loadHistoryUiConfig();
  return saveHistoryUiConfig({ ...cur, ...patch });
}

export function incrementHistoryOpenCount(itemId: string): void {
  const cur = loadHistoryUiConfig();
  const nextCount = (cur.openCounts[itemId] || 0) + 1;
  updateHistoryUiConfig({
    openCounts: {
      ...cur.openCounts,
      [itemId]: nextCount,
    },
  });
}

export function hideHistoryItem(itemId: string): void {
  const cur = loadHistoryUiConfig();
  if (!cur.hiddenIds.includes(itemId)) {
    updateHistoryUiConfig({ hiddenIds: [...cur.hiddenIds, itemId] });
  }
}

export function deleteHistoryItem(itemId: string): void {
  const cur = loadHistoryUiConfig();
  if (!cur.deletedIds.includes(itemId)) {
    updateHistoryUiConfig({ deletedIds: [...cur.deletedIds, itemId] });
  }
}

export function restoreHiddenHistoryItems(): void {
  updateHistoryUiConfig({ hiddenIds: [], hideHistory: false });
}

export function clearAllHistoryRecords(allIds: string[], userId?: string): void {
  const cur = loadHistoryUiConfig();
  const merged = Array.from(new Set([...cur.deletedIds, ...allIds]));
  updateHistoryUiConfig({ deletedIds: merged });
  try {
    localStorage.removeItem('ze_tiktok_history');
    if (userId) {
      localStorage.removeItem(`ze_ai_a_history_${userId}`);
    }
    localStorage.removeItem('ze_ai_chat_history');
  } catch {}
}

export function useHistoryUiConfig() {
  const [config, setConfig] = useState<HistoryUiConfig>(() => loadHistoryUiConfig());

  useEffect(() => {
    const onUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent<HistoryUiConfig>)?.detail;
      setConfig(detail || loadHistoryUiConfig());
    };
    window.addEventListener(HISTORY_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(HISTORY_UPDATE_EVENT, onUpdate);
  }, []);

  const patchConfig = (patch: Partial<HistoryUiConfig>) => {
    const next = updateHistoryUiConfig(patch);
    setConfig(next);
    return next;
  };

  return {
    config,
    patchConfig,
    resetAll: () => {
      const next = saveHistoryUiConfig({ ...DEFAULT_HISTORY_UI_CONFIG });
      setConfig(next);
      return next;
    },
  };
}

export interface UnifiedHistoryItem {
  id: string;
  category: 'video' | 'chat' | 'download' | 'topup';
  title: string;
  subtitle: string;
  thumbnail?: string;
  timestamp: number;
  statusLabel?: string;
  payload?: any;
}
