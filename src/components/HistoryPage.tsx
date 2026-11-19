import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Film,
  MessageCircle,
  Palette,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  clearAllHistoryRecords,
  deleteHistoryItem,
  hideHistoryItem,
  incrementHistoryOpenCount,
  restoreHiddenHistoryItems,
  useHistoryUiConfig,
  type HistoryDisplayMode,
  type HistoryFilterCategory,
  type HistoryLayoutMode,
  type HistorySortMode,
  type UnifiedHistoryItem,
} from '../contexts/historyUiConfig.ts';
import { getHomeThemeTokens, useHomeUiConfig } from '../contexts/homeUiConfig.ts';

interface HistoryPageProps {
  currentUser: any;
  chats?: any[];
  onBack: () => void;
  onOpenAppearanceSettings?: () => void;
  onOpenTikTok?: () => void;
  onOpenMusic?: () => void;
  onOpenAi?: () => void;
  onOpenTopUp?: () => void;
  onOpenChatTab?: () => void;
}

const CATEGORY_TABS: Array<{ id: HistoryFilterCategory; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'video', label: 'Video' },
  { id: 'chat', label: 'Chat' },
  { id: 'download', label: 'Download' },
  { id: 'topup', label: 'Top Up' },
];

export function HistoryPage({
  currentUser,
  chats = [],
  onBack,
  onOpenAppearanceSettings,
  onOpenTikTok,
  onOpenMusic,
  onOpenAi,
  onOpenTopUp,
  onOpenChatTab,
}: HistoryPageProps) {
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

  const { config: histCfg, patchConfig } = useHistoryUiConfig();
  const [musicItems, setMusicItems] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => {
      setNotice((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`/api/music-history?userId=${encodeURIComponent(currentUser.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.history)) setMusicItems(d.history);
      })
      .catch(() => {});

    fetch(`/api/payment/my-orders?userId=${encodeURIComponent(currentUser.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.orders)) setOrderItems(d.orders);
      })
      .catch(() => {});
  }, [currentUser?.id]);

  const rawEntries = useMemo<UnifiedHistoryItem[]>(() => {
    const items: UnifiedHistoryItem[] = [];

    // 1. Download History (TikTok No WM)
    try {
      const tkRaw = localStorage.getItem('ze_tiktok_history');
      if (tkRaw) {
        const parsed = JSON.parse(tkRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((it: any, idx: number) => {
            items.push({
              id: `dl_${it.id || idx}_${String(it.title || '').slice(0, 14)}`,
              category: 'download',
              title: it.title || 'TikTok Video No WM',
              subtitle: `${it.author || 'TikTok Creator'} • Unduhan Video`,
              thumbnail: it.cover,
              timestamp: Number(it.timestamp || it.createdAt || Date.now() - idx * 60000),
              statusLabel: 'Download',
              payload: it,
            });
          });
        }
      }
    } catch {}

    // 2. Music & Video Feed History
    musicItems.forEach((m: any, idx: number) => {
      items.push({
        id: `vid_${m.id || idx}`,
        category: 'video',
        title: m.title || 'Video & Musik Feed',
        subtitle: `${m.author || 'Creator'} • ${m.sourceType === 'tiktok' ? 'TikTok' : 'YouTube'}`,
        thumbnail: m.thumbnail,
        timestamp: Number(m.createdAt || m.updatedAt || Date.now() - idx * 90000),
        statusLabel: 'Video',
        payload: m,
      });
    });

    // 3. Chat History (Private chats + A! Companion + ZE AI)
    (chats || []).forEach((c: any, idx: number) => {
      const lastMsg = c?.messages?.[c.messages.length - 1];
      const partnerName = c?.partnerName || c?.name || 'Obrolan Teman';
      items.push({
        id: `chat_room_${c.id || idx}`,
        category: 'chat',
        title: partnerName,
        subtitle: lastMsg?.text || 'Riwayat chat pribadi ZE.io',
        thumbnail: c?.partnerPhoto || c?.photo,
        timestamp: Number(lastMsg?.timestamp || c?.updatedAt || Date.now() - idx * 120000),
        statusLabel: 'Chat',
        payload: c,
      });
    });

    try {
      const aKey = `ze_ai_a_history_${currentUser?.id || 'guest'}`;
      const aRaw = localStorage.getItem(aKey);
      if (aRaw) {
        const aList = JSON.parse(aRaw);
        if (Array.isArray(aList) && aList.length > 0) {
          const lastA = aList[aList.length - 1];
          items.push({
            id: 'chat_ai_a',
            category: 'chat',
            title: 'A! Companion AI',
            subtitle: lastA?.text || `${aList.length} pesan tersimpan`,
            thumbnail: '/assets/aistudio/7741a2f2268b0c1a726851829218cce6_8fa525c6.jpg',
            timestamp: Date.now() - 30000,
            statusLabel: 'AI Chat',
          });
        }
      }
      const zeRaw = localStorage.getItem('ze_ai_chat_history');
      if (zeRaw) {
        const zeList = JSON.parse(zeRaw);
        if (Array.isArray(zeList) && zeList.length > 0) {
          const lastZ = zeList[zeList.length - 1];
          items.push({
            id: 'chat_ze_ai',
            category: 'chat',
            title: 'ZE AI Assistant',
            subtitle: lastZ?.text || `${zeList.length} percakapan`,
            thumbnail: '/assets/ze_logo.png',
            timestamp: Date.now() - 45000,
            statusLabel: 'ZE AI',
          });
        }
      }
    } catch {}

    // 4. Top Up Diamond+ History
    orderItems.forEach((o: any, idx: number) => {
      const nominal = Number(o.amount || o.nominal || 0);
      items.push({
        id: `topup_${o.orderId || o.id || idx}`,
        category: 'topup',
        title: `Top Up ${nominal ? nominal.toLocaleString('id-ID') : ''} Diamond+`,
        subtitle: `Order ${o.orderId || '-'} • ${o.status || 'PENDING'}`,
        thumbnail: '/assets/ze_logo.png',
        timestamp: Number(o.createdAt || Date.now() - idx * 180000),
        statusLabel: o.status || 'Top Up',
        payload: o,
      });
    });

    return items;
  }, [musicItems, orderItems, chats, currentUser?.id]);

  const visibleEntries = useMemo(() => {
    const filtered = rawEntries.filter((item) => {
      if (histCfg.deletedIds.includes(item.id)) return false;
      if (histCfg.hiddenIds.includes(item.id)) return false;
      if (histCfg.filter !== 'all' && item.category !== histCfg.filter) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (histCfg.sort === 'oldest') return a.timestamp - b.timestamp;
      if (histCfg.sort === 'most-opened') {
        const ca = histCfg.openCounts[a.id] || 0;
        const cb = histCfg.openCounts[b.id] || 0;
        if (cb !== ca) return cb - ca;
      }
      return b.timestamp - a.timestamp;
    });
  }, [rawEntries, histCfg]);

  const handleOpenItem = (item: UnifiedHistoryItem) => {
    incrementHistoryOpenCount(item.id);
    if (item.category === 'download') {
      onOpenTikTok?.();
    } else if (item.category === 'video') {
      onOpenMusic?.();
    } else if (item.category === 'topup') {
      onOpenTopUp?.();
    } else if (item.id === 'chat_ai_a' || item.id === 'chat_ze_ai') {
      onOpenAi?.();
    } else {
      onOpenChatTab?.();
    }
  };

  const renderCategoryIcon = (cat: UnifiedHistoryItem['category']) => {
    const cls = 'ze-logo-anim ze-logo-history';
    if (cat === 'download') return <Download size={18} className={cls} style={{ color: themeTokens.cardIconColor }} />;
    if (cat === 'video') return <Film size={18} className={cls} style={{ color: themeTokens.cardIconColor }} />;
    if (cat === 'topup') return <CreditCard size={18} className={cls} style={{ color: themeTokens.cardIconColor }} />;
    return <MessageCircle size={18} className={cls} style={{ color: themeTokens.cardIconColor }} />;
  };

  const containerCls =
    histCfg.layout === 'grid-2'
      ? 'grid grid-cols-2 gap-3'
      : histCfg.layout === 'grid-3'
      ? 'grid grid-cols-3 gap-2.5'
      : histCfg.layout === 'compact'
      ? 'flex flex-col gap-1.5'
      : histCfg.layout === 'card-large'
      ? 'flex flex-col gap-4'
      : 'flex flex-col gap-2.5';

  return (
    <div
      data-logo-anim={homeCfg.logoAnimation}
      data-logo-anim-enabled={homeCfg.logoAnimEnabled ? 'true' : 'false'}
      data-logo-anim-style={homeCfg.logoAnimEnabled ? homeCfg.logoAnimStyle : 'mati'}
      data-logo-anim-speed={homeCfg.logoAnimSpeed}
      style={{ '--ze-theme-accent': themeTokens.accentColor } as React.CSSProperties}
      className="min-h-screen bg-transparent relative pb-32"
    >
      <div className="relative z-10">
        {/* Sticky Theme-Aware Header */}
        <div
          style={themeTokens.headerStyle}
          className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between gap-2 glass-panel"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onBack}
              style={
                themeTokens.hasSolidBackdrop
                  ? {
                      background: themeTokens.headerButtonBg,
                      border: `1px solid ${themeTokens.headerButtonBorder}`,
                      color: themeTokens.headerTextColor,
                    }
                  : undefined
              }
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition shrink-0 ${
                themeTokens.hasSolidBackdrop ? '' : 'glass-input text-white'
              }`}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h2
                style={{ color: themeTokens.headerTextColor }}
                className="text-base font-extrabold truncate flex items-center gap-1.5"
              >
                <Clock size={16} className="ze-logo-anim ze-logo-history shrink-0" />
                <span>History / Riwayat</span>
              </h2>
              <p style={{ color: themeTokens.mutedTextColor }} className="text-[11px] truncate">
                {visibleEntries.length} item • Tema &amp; bayangan ikut Beranda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenAppearanceSettings && (
              <button
                type="button"
                onClick={onOpenAppearanceSettings}
                style={themeTokens.badgeStyle}
                className="px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Palette size={12} />
                <span>Atur UI</span>
              </button>
            )}
          </div>
        </div>

        {notice && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-extrabold shadow-2xl whitespace-nowrap">
            {notice}
          </div>
        )}

        <div className="p-4 space-y-4 max-w-lg mx-auto">
          {/* Quick Control Bar: Filter, Urutan, Layout, Display & Actions */}
          <div style={themeTokens.cardStyle} className="p-3.5 space-y-3">
            {/* Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {CATEGORY_TABS.map((tab) => {
                const active = histCfg.filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => patchConfig({ filter: tab.id })}
                    style={active ? { background: themeTokens.accentColor, color: '#ffffff' } : themeTokens.badgeStyle}
                    className="px-3 py-1 rounded-full text-[11px] font-bold shrink-0 cursor-pointer transition whitespace-nowrap"
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Layout + Sort + Display Pickers */}
            <div className="grid grid-cols-3 gap-2">
              <select
                value={histCfg.layout}
                onChange={(e) => patchConfig({ layout: e.target.value as HistoryLayoutMode })}
                aria-label="Tata letak history"
                className="px-2 py-1.5 rounded-xl bg-black/40 border border-white/15 text-[11px] font-bold text-white outline-none"
              >
                <option value="list-vertical">List Vertikal</option>
                <option value="grid-2">Grid 2 Kolom</option>
                <option value="grid-3">Grid 3 Kolom</option>
                <option value="card-large">Card Gede</option>
                <option value="compact">Compact Rapat</option>
              </select>

              <select
                value={histCfg.sort}
                onChange={(e) => patchConfig({ sort: e.target.value as HistorySortMode })}
                aria-label="Urutan history"
                className="px-2 py-1.5 rounded-xl bg-black/40 border border-white/15 text-[11px] font-bold text-white outline-none"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="most-opened">Paling Dibuka</option>
              </select>

              <select
                value={histCfg.display}
                onChange={(e) => patchConfig({ display: e.target.value as HistoryDisplayMode })}
                aria-label="Tampilan item history"
                className="px-2 py-1.5 rounded-xl bg-black/40 border border-white/15 text-[11px] font-bold text-white outline-none"
              >
                <option value="thumb-left">Thumb Kiri</option>
                <option value="thumb-large">Thumb Gede</option>
                <option value="text-only">Cuma Teks</option>
              </select>
            </div>

            {/* Global Actions: Hide/Show, Restore Hidden, Clear All */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => patchConfig({ hideHistory: !histCfg.hideHistory })}
                  style={themeTokens.badgeStyle}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  {histCfg.hideHistory ? <Eye size={11} /> : <EyeOff size={11} />}
                  <span>{histCfg.hideHistory ? 'Tampilkan History' : 'Sembunyikan Semua'}</span>
                </button>
                {histCfg.hiddenIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      restoreHiddenHistoryItems();
                      flash('Item tersembunyi ditampilkan lagi.');
                    }}
                    style={themeTokens.badgeStyle}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw size={11} />
                    <span>Pulihkan ({histCfg.hiddenIds.length})</span>
                  </button>
                )}
              </div>

              {visibleEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearAllHistoryRecords(
                      rawEntries.map((e) => e.id),
                      currentUser?.id
                    );
                    flash('Semua riwayat dihapus.');
                  }}
                  className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Trash2 size={11} />
                  <span>Hapus Semua</span>
                </button>
              )}
            </div>
          </div>

          {/* History List */}
          {histCfg.hideHistory ? (
            <div style={themeTokens.cardStyle} className="p-8 text-center space-y-3">
              <EyeOff size={28} className="mx-auto opacity-60" style={{ color: themeTokens.cardIconColor }} />
              <p style={{ color: themeTokens.cardTitleColor }} className="text-sm font-bold">
                Halaman History Sedang Disembunyikan
              </p>
              <button
                type="button"
                onClick={() => patchConfig({ hideHistory: false })}
                style={{ background: themeTokens.accentColor }}
                className="px-4 py-2 rounded-full text-xs font-extrabold text-white cursor-pointer"
              >
                Tampilkan History
              </button>
            </div>
          ) : visibleEntries.length === 0 ? (
            <div style={themeTokens.cardStyle} className="p-8 text-center space-y-2">
              <Clock size={28} className="mx-auto ze-logo-anim ze-logo-history opacity-65" style={{ color: themeTokens.cardIconColor }} />
              <p style={{ color: themeTokens.cardTitleColor }} className="text-sm font-bold">
                Belum Ada Riwayat
              </p>
              <p style={{ color: themeTokens.cardSubtitleColor }} className="text-xs">
                Aktivitas Video, Chat, Download TikTok, dan Top Up akan otomatis tercatat di sini.
              </p>
            </div>
          ) : (
            <div className={containerCls}>
              {visibleEntries.map((item) => {
                const isGrid = histCfg.layout === 'grid-2' || histCfg.layout === 'grid-3';
                const isCompact = histCfg.layout === 'compact';
                const showThumbLarge =
                  histCfg.display === 'thumb-large' || histCfg.layout === 'card-large';
                const showThumbLeft = histCfg.display === 'thumb-left' && !showThumbLarge;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenItem(item)}
                    style={themeTokens.cardStyle}
                    className={`ze-feature-card relative cursor-pointer select-none overflow-hidden ${
                      isCompact
                        ? 'p-2.5 flex items-center justify-between gap-2'
                        : isGrid
                        ? 'p-3 flex flex-col gap-2'
                        : 'p-3.5 flex flex-col gap-2.5'
                    }`}
                  >
                    {showThumbLarge && histCfg.display !== 'text-only' && (
                      <div className="w-full h-28 rounded-xl overflow-hidden bg-black/40 border border-white/10 relative">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover ze-video-thumb-zoom"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {renderCategoryIcon(item.category)}
                          </div>
                        )}
                        <span
                          style={themeTokens.badgeStyle}
                          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                        >
                          {item.statusLabel || item.category}
                        </span>
                      </div>
                    )}

                    <div className={`flex items-center gap-2.5 min-w-0 ${isGrid ? 'flex-col items-start' : ''}`}>
                      {showThumbLeft && histCfg.display !== 'text-only' && (
                        <div
                          style={themeTokens.iconBoxStyle}
                          className={`${
                            isCompact ? 'w-8 h-8 rounded-lg' : 'w-11 h-11 rounded-xl'
                          } overflow-hidden flex items-center justify-center shrink-0`}
                        >
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover ze-video-thumb-zoom"
                            />
                          ) : (
                            renderCategoryIcon(item.category)
                          )}
                        </div>
                      )}

                      <div className="min-w-0 flex-1 w-full">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            style={{ color: themeTokens.cardTitleColor }}
                            className={`font-bold truncate ${isCompact ? 'text-[11px]' : 'text-xs'}`}
                          >
                            {item.title}
                          </p>
                          {(histCfg.openCounts[item.id] || 0) > 0 && (
                            <span
                              style={themeTokens.badgeStyle}
                              className="px-1.5 py-0 rounded-full text-[8px] font-bold shrink-0"
                            >
                              {histCfg.openCounts[item.id]}x
                            </span>
                          )}
                        </div>
                        <p
                          style={{ color: themeTokens.cardSubtitleColor }}
                          className="text-[10px] truncate mt-0.5"
                        >
                          {item.subtitle}
                        </p>
                      </div>

                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 shrink-0"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            hideHistoryItem(item.id);
                            flash('Item disembunyikan.');
                          }}
                          className="w-7 h-7 rounded-full bg-black/25 hover:bg-black/45 flex items-center justify-center cursor-pointer"
                          style={{ color: themeTokens.cardSubtitleColor }}
                          title="Sembunyikan item"
                        >
                          <EyeOff size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteHistoryItem(item.id);
                            flash('Item dihapus dari riwayat.');
                          }}
                          className="w-7 h-7 rounded-full bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 flex items-center justify-center cursor-pointer"
                          title="Hapus 1 item"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;
