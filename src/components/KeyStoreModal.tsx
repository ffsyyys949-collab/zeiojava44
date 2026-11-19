import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Key as KeyIcon,
  Crown,
  History,
  Check,
  Copy,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  ShoppingCart
} from 'lucide-react';
import { DiamondPlusIcon } from './DiamondPlusIcon.tsx';
import { isUserOwner } from './UserRoleBadge.tsx';

export type StoreTab = 'key' | 'vip' | 'riwayat';

interface KeyStoreModalProps {
  onClose: () => void;
  currentUser?: any;
  onOpenNotifications?: () => void;
  onOpenTopUp?: () => void;
  onVipPurchased?: (vipInfo: {
    isVip: boolean;
    vip: boolean;
    vipLevel: 'basic' | 'exclusive';
    isVipExclusive: boolean;
    vipExpiresAt: number;
  }) => void;
  initialTab?: StoreTab;
}

interface KeyProduct {
  type: '1day' | '1week' | '1month' | 'permanent';
  title: string;
  durationLabel: string;
  diamondPrice: number;
  originalPrice?: number;
  isPromo?: boolean;
  desc: string;
}

interface VipProduct {
  type: 'vip_basic' | 'vip_exclusive';
  title: string;
  badgeLabel: string;
  durationLabel: string;
  diamondPrice: number;
  benefits: string[];
}

const PROMO_KEY_PRODUCTS: KeyProduct[] = [
  {
    type: '1day',
    title: 'KEY AKSES — 1 HARI',
    durationLabel: 'Masa Aktif 24 Jam Penuh',
    diamondPrice: 5000,
    desc: 'Akses 24 jam penuh untuk diagnostik sistem ZE AI dan pembuka modul /rw & /bug.'
  },
  {
    type: '1week',
    title: 'KEY AKSES — 1 MINGGU',
    durationLabel: 'Masa Aktif 7 Hari Penuh',
    diamondPrice: 30000,
    desc: 'Paket 7 hari pemakaian berturut-turut tanpa jeda untuk analisis berkelanjutan.'
  },
  {
    type: '1month',
    title: 'KEY AKSES — 1 BULAN',
    durationLabel: 'Masa Aktif 30 Hari Penuh',
    diamondPrice: 60000,
    desc: 'Paket terfavorit untuk pemakaian rutin harian selama 30 hari penuh stabil.'
  },
  {
    type: 'permanent',
    title: 'KEY AKSES — PERMANEN',
    durationLabel: 'Akses Selamanya Tanpa Batas',
    diamondPrice: 88000,
    originalPrice: 111000,
    isPromo: true,
    desc: 'Satu kali pembelian untuk lisensi akses seumur hidup tanpa masa kedaluwarsa.'
  }
];

const VIP_PRODUCTS: VipProduct[] = [
  {
    type: 'vip_basic',
    title: 'VIP BASIC (2 BULAN / 60 HARI)',
    badgeLabel: 'LENCANA PERAK VIP',
    durationLabel: 'Masa Aktif 60 Hari (2 Bulan Penuh)',
    diamondPrice: 115000,
    benefits: [
      'Lencana Mahkota Perak VIP resmi di profil & obrolan',
      'Klaim Key Harian (20 Jam) otomatis setiap hari di profil',
      'Jalur prioritas respon cepat server ZE.io',
      'Masa aktif 60 hari penuh, dapat diperpanjang sewaktu-waktu'
    ]
  },
  {
    type: 'vip_exclusive',
    title: 'VIP EKSKLUSIF (2 BULAN / 60 HARI)',
    badgeLabel: 'LENCANA PLATINUM MENYALA',
    durationLabel: 'Masa Aktif 60 Hari (2 Bulan Penuh)',
    diamondPrice: 130000,
    benefits: [
      'Lencana Mahkota Emas/Platinum Menyala resmi di profil & obrolan',
      'Akses Penuh ZE.IO NOT HUMAN (Dark AI) & Terminal Rekayasa',
      'Klaim Key Harian (20 Jam) otomatis setiap hari tanpa antrean',
      'Prioritas komputasi engine tertinggi & akses pembaruan eksklusif'
    ]
  }
];

export function KeyStoreModal({
  onClose,
  currentUser,
  onOpenTopUp,
  onVipPurchased,
  initialTab = 'key'
}: KeyStoreModalProps) {
  const isOwner = isUserOwner(currentUser);
  const [activeTab, setActiveTab] = useState<StoreTab>(initialTab);
  const [diamondBalance, setDiamondBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Purchase Confirmation State
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [purchaseConfirmItem, setPurchaseConfirmItem] = useState<{
    targetType: 'key' | 'vip_basic' | 'vip_exclusive';
    keyType?: '1day' | '1week' | '1month' | 'permanent';
    title: string;
    diamondPrice: number;
  } | null>(null);

  // Purchase Result Modal
  const [purchaseSuccessData, setPurchaseSuccessData] = useState<{
    key?: string;
    title: string;
    isVip?: boolean;
    vipLevel?: 'basic' | 'exclusive';
    remainingBalance: number;
  } | null>(null);

  // History State
  const [orders, setOrders] = useState<any[]>([]);
  const [myKeys, setMyKeys] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3800);
  }, []);

  const copyToClipboard = (text: string, label = 'Teks') => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast(`${label} disalin ke clipboard!`, 'success');
    } catch {
      showToast('Gagal menyalin teks', 'error');
    }
  };

  // Fetch Diamond+ Balance
  const fetchBalance = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoadingBalance(true);
    try {
      const res = await fetch(`/api/wallet/balance?userId=${encodeURIComponent(currentUser.id)}`);
      const data = await res.json();
      if (data?.success) {
        setDiamondBalance(isOwner || data.isUnlimited ? 999999999 : Number(data.balance) || 0);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingBalance(false);
    }
  }, [currentUser?.id, isOwner]);

  // Fetch Orders History
  const fetchHistory = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/payment/my-orders?userId=${encodeURIComponent(currentUser.id)}`);
      const data = await res.json();
      if (data?.success) {
        setOrders(data.orders || []);
        setMyKeys(data.keys || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  }, [currentUser?.id]);

  const [activateKeyInput, setActivateKeyInput] = useState('');
  const [isActivatingKey, setIsActivatingKey] = useState(false);
  const [activateKeyFeedback, setActivateKeyFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleActivateKeyDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = activateKeyInput.trim();
    const uid = String(currentUser?.id || '').trim();
    if (!cleanKey || !uid || isActivatingKey) return;
    setIsActivatingKey(true);
    setActivateKeyFeedback(null);
    try {
      const res = await fetch('/api/keys/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ze-actor-id': uid
        },
        body: JSON.stringify({ key: cleanKey, userId: uid })
      });
      const data = await res.json();
      if (data?.success) {
        setActivateKeyFeedback({
          text: `KEY BERHASIL DIAKTIFKAN & DIIKAT KE AKUN ${data.activatedByUid || uid.toUpperCase()}`,
          type: 'success'
        });
        setActivateKeyInput('');
        fetchHistory();
      } else {
        const msg =
          data?.code === 'KEY_ALREADY_USED' || data?.error === 'KEY SUDAH DIGUNAKAN OLEH AKUN LAIN'
            ? 'KEY SUDAH DIGUNAKAN OLEH AKUN LAIN'
            : data?.error || 'Key tidak valid';
        setActivateKeyFeedback({ text: msg, type: 'error' });
      }
    } catch {
      setActivateKeyFeedback({ text: 'Gagal menghubungi server untuk aktivasi Key', type: 'error' });
    } finally {
      setIsActivatingKey(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    if (activeTab === 'riwayat') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  // SSE real-time sync for balance and orders
  useEffect(() => {
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource('/api/events');
      evtSource.addEventListener('wallet-updated', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (String(data.userId).toLowerCase() === String(currentUser?.id).toLowerCase()) {
            setDiamondBalance(isOwner || data.isUnlimited ? 999999999 : Number(data.balance) || 0);
          }
        } catch {}
      });
      evtSource.addEventListener('payment-updated', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (String(data.userId).toLowerCase() === String(currentUser?.id).toLowerCase()) {
            fetchHistory();
            fetchBalance();
          }
        } catch {}
      });
    } catch {}

    return () => {
      evtSource?.close();
    };
  }, [currentUser?.id, isOwner, fetchBalance, fetchHistory]);

  // Purchase Key or VIP using Diamond+ (Owner has Unlimited Diamond+)
  const handleExecutePurchase = async () => {
    if (!purchaseConfirmItem || isPurchasing) return;
    if (!isOwner && diamondBalance < purchaseConfirmItem.diamondPrice) {
      showToast('Saldo Diamond+ belum cukup. Mengarahkan ke menu Top Up Diamond+...', 'error');
      setPurchaseConfirmItem(null);
      if (onOpenTopUp) {
        setTimeout(() => onOpenTopUp(), 400);
      }
      return;
    }

    setIsPurchasing(true);
    try {
      const res = await fetch('/api/store/buy-with-saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          userName: currentUser?.name || currentUser?.username,
          purchaseType: purchaseConfirmItem.targetType,
          keyType: purchaseConfirmItem.keyType
        })
      });
      const data = await res.json();
      if (data?.success) {
        const nextBalance = isOwner ? 999999999 : data.remainingBalance ?? 0;
        setDiamondBalance(nextBalance);
        const isVipPurchase = purchaseConfirmItem.targetType.startsWith('vip_');
        const resolvedVipLevel: 'basic' | 'exclusive' =
          data?.vipStatus?.vipLevel === 'exclusive' || purchaseConfirmItem.targetType === 'vip_exclusive'
            ? 'exclusive'
            : 'basic';
        const resolvedVipExpiresAt: number =
          Number(data?.vipStatus?.vipExpiresAt) || (Date.now() + 60 * 24 * 60 * 60 * 1000);

        if (isVipPurchase) {
          const vipPayload = {
            isVip: true,
            vip: true,
            vipLevel: resolvedVipLevel,
            isVipExclusive: resolvedVipLevel === 'exclusive',
            vipExpiresAt: resolvedVipExpiresAt
          };

          // Persist immediately across localStorage keys so refresh & store hooks see it right away
          try {
            const storageKeys = ['zeio-user', 'ze_user', 'vn_currentUser', 'vn_session'];
            for (const sk of storageKeys) {
              const raw = localStorage.getItem(sk);
              if (raw) {
                const parsed = JSON.parse(raw);
                localStorage.setItem(sk, JSON.stringify({ ...parsed, ...vipPayload }));
              }
            }
          } catch {}

          window.dispatchEvent(new Event('ze-user-store-updated'));
          window.dispatchEvent(new Event('zeio-user-updated'));
          window.dispatchEvent(new CustomEvent('ze-vip-purchased', { detail: vipPayload }));
          onVipPurchased?.(vipPayload);
        }

        setPurchaseConfirmItem(null);
        setPurchaseSuccessData({
          key: data.key,
          title: purchaseConfirmItem.title,
          isVip: isVipPurchase,
          vipLevel: isVipPurchase ? resolvedVipLevel : undefined,
          remainingBalance: nextBalance
        });
        showToast(
          isVipPurchase
            ? resolvedVipLevel === 'exclusive'
              ? 'VIP EKSKLUSIF & Dark AI ZE.IO NOT HUMAN langsung aktif!'
              : 'VIP BASIC berhasil diaktifkan!'
            : 'Pembelian berhasil! Layanan langsung aktif.',
          'success'
        );
        fetchHistory();
      } else {
        showToast(data?.message || 'Gagal memproses pembelian Diamond+', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan saat memproses pembelian', 'error');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[135] w-screen h-[100dvh] ze-transparent-page bg-transparent flex flex-col text-white overflow-hidden select-none">
      {/* Transparent Corner & Edge Vignette Shadow Overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 shadow-[inset_0_0_85px_rgba(0,0,0,0.94),inset_0_0_28px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-white/12" />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-3 right-3 z-[170] mx-auto max-w-sm px-4 py-2.5 rounded-2xl text-xs font-bold border shadow-[0_14px_38px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all text-center break-words ${
            toast.type === 'success'
              ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/40'
              : toast.type === 'error'
              ? 'bg-rose-950/85 text-rose-300 border-rose-500/40'
              : 'bg-black/85 text-sky-300 border-sky-500/35'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* FULL-WIDTH ANDROID HEADER BAR (Transparent with Edge Shadow) */}
      <div
        className="relative z-10 w-full px-3.5 py-3 border-b border-white/15 bg-black/28 flex items-center justify-between gap-2 shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.75),inset_0_-1px_0_rgba(255,255,255,0.1)]"
        style={{
          backdropFilter: 'blur(14px) saturate(160%)',
          WebkitBackdropFilter: 'blur(14px) saturate(160%)'
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-black/35 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-90 transition shrink-0 shadow-md"
            title="Kembali"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-md">
            <ShoppingCart size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              MENU KERANJANG
            </h1>
            <p className="text-[10px] text-zinc-300 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              Lisensi Key &amp; Paket VIP Pass
            </p>
          </div>
        </div>

        {/* Balance Pill + Direct Link to Dedicated Top Up Diamond Menu */}
        <button
          onClick={() => onOpenTopUp?.()}
          className="px-2.5 py-1.5 rounded-2xl bg-black/38 border border-white/20 hover:border-white/40 transition flex items-center gap-1.5 cursor-pointer shadow-[0_6px_18px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.15)] active:scale-95 shrink-0"
          title="Buka Menu Top Up Diamond+"
        >
          <DiamondPlusIcon size={13} />
          <span className="text-[11px] font-black text-white tracking-tight whitespace-nowrap">
            {isOwner
              ? 'UNLIMITED'
              : isLoadingBalance
              ? '...'
              : `${diamondBalance.toLocaleString('id-ID')}+`}
          </span>
        </button>
      </div>

      {/* MODERN ANDROID SEGMENTED TABS (3 Clean Tabs, Zero Overlap) */}
      <div
        className="relative z-10 w-full px-3.5 py-2.5 border-b border-white/12 bg-black/22 shrink-0"
        style={{
          backdropFilter: 'blur(12px) saturate(150%)',
          WebkitBackdropFilter: 'blur(12px) saturate(150%)'
        }}
      >
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/35 border border-white/14 shadow-inner">
          <button
            onClick={() => setActiveTab('key')}
            className={`py-2 px-2 rounded-xl text-[11px] font-extrabold tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              activeTab === 'key'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <KeyIcon size={13} className="shrink-0" />
            <span className="truncate">KEY AKSES</span>
          </button>

          <button
            onClick={() => setActiveTab('vip')}
            className={`py-2 px-2 rounded-xl text-[11px] font-extrabold tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              activeTab === 'vip'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Crown size={13} className="shrink-0" />
            <span className="truncate">VIP PASS</span>
          </button>

          <button
            onClick={() => setActiveTab('riwayat')}
            className={`py-2 px-2 rounded-xl text-[11px] font-extrabold tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              activeTab === 'riwayat'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <History size={13} className="shrink-0" />
            <span className="truncate">RIWAYAT</span>
          </button>
        </div>
      </div>

      {/* SCROLLABLE FULL-SCREEN ANDROID CONTENT — Berderet rapi ke bawah */}
      <div className="relative z-10 flex-1 w-full overflow-y-auto overflow-x-hidden px-3.5 py-4 pb-10 flex flex-col gap-4">
        {/* Compact Saldo Diamond+ Banner Card */}
        <div
          className="w-full p-4 rounded-3xl bg-black/28 border border-white/16 shadow-[0_14px_38px_rgba(0,0,0,0.82),inset_0_0_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] flex items-center justify-between gap-3"
          style={{
            backdropFilter: 'blur(14px) saturate(160%)',
            WebkitBackdropFilter: 'blur(14px) saturate(160%)'
          }}
        >
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-1">
              {isOwner && <Crown size={11} className="text-amber-400 shrink-0" />}
              <span>Saldo Diamond+ Anda</span>
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              <DiamondPlusIcon size={18} />
              <span className="text-lg font-black text-white tracking-tight truncate">
                {isOwner
                  ? 'UNLIMITED'
                  : isLoadingBalance
                  ? '...'
                  : `${diamondBalance.toLocaleString('id-ID')}+`}
              </span>
            </div>
          </div>

          {onOpenTopUp && (
            <button
              type="button"
              onClick={onOpenTopUp}
              className="px-3.5 py-2.5 rounded-2xl bg-white text-black font-black text-xs hover:bg-zinc-200 transition flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95 shrink-0"
            >
              <PlusCircle size={14} className="shrink-0" />
              <span>Isi Diamond+</span>
            </button>
          )}
        </div>

        {/* ================================================================ */}
        {/* TAB 1: KEY AKSES — Vertical Stacked Android Cards                 */}
        {/* ================================================================ */}
        {activeTab === 'key' && (
          <div className="flex flex-col gap-3.5">
            <div className="px-1 flex flex-col gap-0.5">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                Daftar Paket Lisensi Key Resmi
              </h2>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Gunakan saldo Diamond+ untuk membeli Key pembuka modul ZE AI secara instan.
              </p>
            </div>

            {PROMO_KEY_PRODUCTS.map((prod) => (
              <div
                key={prod.type}
                className="w-full p-4 rounded-3xl bg-black/28 border border-white/16 hover:border-white/30 transition flex flex-col gap-3 shadow-[0_14px_36px_rgba(0,0,0,0.8),inset_0_0_22px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.15)]"
                style={{
                  backdropFilter: 'blur(14px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(14px) saturate(160%)'
                }}
              >
                {/* Title + Promo Badge Row (Flex wrap, zero overlapping!) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-white tracking-wide leading-snug">
                      {prod.title}
                    </h3>
                    {prod.isPromo && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] tracking-wider uppercase shadow shrink-0">
                        PROMO
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-300 font-bold leading-snug">
                    {prod.durationLabel}
                  </p>
                  <p className="text-xs text-zinc-200 leading-relaxed pt-0.5">
                    {prod.desc}
                  </p>
                </div>

                {/* Price & Action Footer */}
                <div className="pt-3 border-t border-white/12 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex flex-col">
                    {prod.originalPrice && (
                      <span className="line-through text-zinc-400 text-[11px] leading-tight">
                        {prod.originalPrice.toLocaleString('id-ID')} Diamond+
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-white font-black text-base leading-tight mt-0.5">
                      <DiamondPlusIcon size={15} />
                      <span>{prod.diamondPrice.toLocaleString('id-ID')}+</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPurchaseConfirmItem({
                        targetType: 'key',
                        keyType: prod.type,
                        title: prod.title,
                        diamondPrice: prod.diamondPrice
                      })
                    }
                    className="px-4 py-2.5 rounded-2xl bg-white text-black font-black text-xs hover:bg-zinc-200 transition cursor-pointer shadow-lg active:scale-95 shrink-0"
                  >
                    Beli Sekarang
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: VIP PASS — Vertical Stacked Android Cards                  */}
        {/* ================================================================ */}
        {activeTab === 'vip' && (
          <div className="flex flex-col gap-3.5">
            <div className="px-1 flex flex-col gap-0.5">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                Paket Keanggotaan VIP Pass (60 Hari)
              </h2>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Aktifkan lencana mahkota eksklusif, klaim key harian, dan prioritas server.
              </p>
            </div>

            {VIP_PRODUCTS.map((vip) => (
              <div
                key={vip.type}
                className={`w-full p-4 rounded-3xl border flex flex-col gap-3.5 transition ${
                  vip.type === 'vip_exclusive'
                    ? 'bg-black/35 border-amber-400/40 shadow-[0_14px_40px_rgba(0,0,0,0.85),inset_0_0_26px_rgba(245,158,11,0.14),inset_0_1px_0_rgba(255,255,255,0.18)]'
                    : 'bg-black/28 border-white/16 shadow-[0_14px_36px_rgba(0,0,0,0.8),inset_0_0_22px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.15)]'
                }`}
                style={{
                  backdropFilter: 'blur(14px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(14px) saturate(160%)'
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start gap-2">
                    <Crown
                      size={19}
                      className={`shrink-0 mt-0.5 ${
                        vip.type === 'vip_exclusive' ? 'text-amber-400' : 'text-zinc-200'
                      }`}
                    />
                    <h3 className="text-sm font-black text-white leading-snug">
                      {vip.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/12 text-zinc-100 border border-white/20">
                      {vip.badgeLabel}
                    </span>
                    <span className="text-[11px] text-emerald-300 font-bold">
                      {vip.durationLabel}
                    </span>
                  </div>

                  <ul className="mt-1.5 flex flex-col gap-1.5 text-xs text-zinc-200">
                    {vip.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-white/12 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-white font-black text-base">
                    <DiamondPlusIcon size={16} />
                    <span>{vip.diamondPrice.toLocaleString('id-ID')}+</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPurchaseConfirmItem({
                        targetType: vip.type,
                        title: vip.title,
                        diamondPrice: vip.diamondPrice
                      })
                    }
                    className="px-4 py-2.5 rounded-2xl bg-white text-black font-black text-xs hover:bg-zinc-200 transition cursor-pointer shadow-lg active:scale-95 shrink-0"
                  >
                    Beli VIP Pass
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: RIWAYAT TRANSAKSI & LISENSI KEY                           */}
        {/* ================================================================ */}
        {activeTab === 'riwayat' && (
          <div className="flex flex-col gap-4">
            <div className="px-1 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-xs font-black text-white uppercase tracking-wider">
                  Riwayat Pembelian &amp; Key
                </h2>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Daftar lisensi Key aktif dan catatan transaksi akun Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchHistory}
                className="px-3 py-1.5 rounded-xl bg-black/35 border border-white/20 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer active:scale-95 shrink-0 shadow-md"
              >
                <RefreshCw size={12} className={isLoadingHistory ? 'animate-spin' : ''} />
                <span>Segarkan</span>
              </button>
            </div>

            {/* Direct One-Account-One-Key Activation Card */}
            <form
              onSubmit={handleActivateKeyDirect}
              className="w-full p-4 rounded-2xl bg-black/35 border border-white/16 shadow-[0_10px_28px_rgba(0,0,0,0.75)] flex flex-col gap-2.5"
            >
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Aktivasi Lisensi Key (1 Akun 1 Key)
                </h3>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Masukkan kode KEY untuk mengikatnya secara permanen ke UID akun Anda ({currentUser?.id}).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={activateKeyInput}
                  onChange={(e) => {
                    setActivateKeyInput(e.target.value);
                    setActivateKeyFeedback(null);
                  }}
                  placeholder="ZE-XXXX-XXXX-XXXX"
                  className="flex-1 bg-black/55 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 outline-none uppercase"
                />
                <button
                  type="submit"
                  disabled={!activateKeyInput.trim() || isActivatingKey}
                  className="px-4 py-2 rounded-xl bg-white text-black font-black text-xs hover:bg-zinc-200 disabled:opacity-40 cursor-pointer active:scale-95 transition shrink-0"
                >
                  {isActivatingKey ? 'Memproses...' : 'Aktifkan'}
                </button>
              </div>
              {activateKeyFeedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold text-center border ${
                    activateKeyFeedback.type === 'error'
                      ? 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                      : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                  }`}
                >
                  {activateKeyFeedback.text}
                </div>
              )}
            </form>

            {/* Active Keys */}
            {myKeys.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <h3 className="px-1 text-[11px] font-extrabold tracking-wider text-zinc-200 uppercase">
                  Lisensi Key Anda ({myKeys.length})
                </h3>
                {myKeys.map((k, idx) => {
                  const isBound = Boolean(k.activatedByUid || k.usageStatus === 'SUDAH DIGUNAKAN' || k.status === 'active');
                  return (
                    <div
                      key={idx}
                      className="w-full p-3.5 rounded-2xl bg-black/32 border border-white/16 shadow-[0_10px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12)] flex items-center justify-between gap-3"
                      style={{
                        backdropFilter: 'blur(12px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(12px) saturate(150%)'
                      }}
                    >
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-black text-emerald-300 font-mono break-all leading-snug">
                            {k.key}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              isBound
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                            }`}
                          >
                            {isBound ? 'SUDAH DIGUNAKAN' : 'BELUM DIGUNAKAN'}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-300">
                          Tipe: {String(k.type || '').toUpperCase()} • {new Date(k.createdAt).toLocaleDateString('id-ID')}
                          {k.activatedByUid ? ` • UID: ${k.activatedByUid}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(k.key, 'Key')}
                        className="px-3 py-1.5 rounded-xl bg-white/12 border border-white/20 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 shrink-0"
                      >
                        <Copy size={12} />
                        <span>Salin</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Orders List */}
            <div className="flex flex-col gap-2.5">
              <h3 className="px-1 text-[11px] font-extrabold tracking-wider text-zinc-200 uppercase">
                Catatan Pesanan ({orders.length})
              </h3>

              {orders.length === 0 ? (
                <div
                  className="w-full p-8 text-center rounded-3xl bg-black/28 border border-white/15 shadow-[0_12px_34px_rgba(0,0,0,0.78)] flex flex-col items-center gap-2"
                  style={{
                    backdropFilter: 'blur(12px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(150%)'
                  }}
                >
                  <History size={28} className="text-zinc-300 opacity-75" />
                  <p className="text-xs font-bold text-white">Belum Ada Riwayat Transaksi</p>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Semua pembelian Key, VIP Pass, dan Top Up akan tampil rapi di sini.
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id || order.orderId}
                    className="w-full p-4 rounded-2xl bg-black/28 border border-white/15 shadow-[0_10px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12)] flex flex-col gap-2"
                    style={{
                      backdropFilter: 'blur(12px) saturate(150%)',
                      WebkitBackdropFilter: 'blur(12px) saturate(150%)'
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-white break-all">
                        {order.orderId}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          order.status === 'APPROVED' || order.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                            : order.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/35'
                            : 'bg-amber-500/20 text-amber-200 border border-amber-500/35'
                        }`}
                      >
                        {order.status === 'APPROVED' || order.status === 'paid'
                          ? 'SUKSES'
                          : order.status === 'REJECTED'
                          ? 'DITOLAK'
                          : 'MENUNGGU'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-300">
                      <span>{new Date(order.createdAt).toLocaleString('id-ID')}</span>
                      <span className="text-white font-black">
                        {Number(order.amount || 0).toLocaleString('id-ID')} Diamond+
                      </span>
                    </div>

                    {order.keyIssued && (
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/14 flex items-center justify-between gap-2 text-xs font-mono">
                        <span className="truncate text-emerald-300">{order.keyIssued}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.keyIssued, 'Key')}
                          className="p-1 rounded-lg bg-white/10 text-zinc-200 hover:text-white cursor-pointer shrink-0"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog (Transparent Glass with Edge Shadow) */}
      {purchaseConfirmItem && (
        <div
          className="fixed inset-0 z-[160] ze-transparent-page bg-black/55 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPurchaseConfirmItem(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-black/75 backdrop-blur-2xl border border-white/25 p-5 text-center flex flex-col gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/25 mx-auto flex items-center justify-center text-white shadow-md">
              <DiamondPlusIcon size={24} />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wide">
                Konfirmasi Pembelian
              </h3>
              <p className="text-xs text-zinc-200 leading-snug">{purchaseConfirmItem.title}</p>

              <div className="flex items-center justify-center gap-1.5 text-white font-black text-lg pt-2">
                <DiamondPlusIcon size={17} />
                <span>{purchaseConfirmItem.diamondPrice.toLocaleString('id-ID')}+</span>
              </div>

              <p className="text-[11px] text-zinc-300">
                Saldo Anda:{' '}
                <strong className="text-white">
                  {isOwner ? 'UNLIMITED' : `${diamondBalance.toLocaleString('id-ID')}+`}
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPurchaseConfirmItem(null)}
                className="py-2.5 rounded-2xl bg-white/12 border border-white/15 text-white text-xs font-bold hover:bg-white/20 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePurchase}
                disabled={isPurchasing}
                className="py-2.5 rounded-2xl bg-white text-black text-xs font-black hover:bg-zinc-200 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isPurchasing ? 'Memproses...' : 'Beli Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Success Dialog */}
      {purchaseSuccessData && (
        <div
          className="fixed inset-0 z-[160] ze-transparent-page bg-black/55 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPurchaseSuccessData(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-black/80 backdrop-blur-2xl border border-emerald-400/45 p-5 text-center flex flex-col gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.95),inset_0_0_25px_rgba(16,185,129,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 mx-auto flex items-center justify-center text-emerald-300 shadow-md">
              <CheckCircle2 size={26} />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wide">
                Pembelian Berhasil!
              </h3>
              <p className="text-xs text-zinc-200 leading-snug">{purchaseSuccessData.title}</p>
              {purchaseSuccessData.isVip && (
                <p className="text-[11px] font-bold text-amber-300 mt-1 leading-relaxed">
                  {purchaseSuccessData.vipLevel === 'exclusive'
                    ? 'Badge VIP EKSKLUSIF & akses Dark AI (ZE.IO NOT HUMAN) kini otomatis terbuka!'
                    : 'Badge VIP BASIC resmi Anda kini aktif di profil & obrolan!'}
                </p>
              )}

              {purchaseSuccessData.key && (
                <div className="mt-2 p-3 rounded-2xl bg-black/60 border border-white/20 flex flex-col gap-2">
                  <p className="text-[10px] text-zinc-300 uppercase font-bold tracking-wider">
                    Kode Key Lisensi Anda:
                  </p>
                  <p className="text-xs font-mono font-black text-emerald-300 break-all select-all">
                    {purchaseSuccessData.key}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(purchaseSuccessData.key!, 'Key')}
                    className="w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>Salin Kode Key</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPurchaseSuccessData(null)}
              className="w-full py-2.5 rounded-2xl bg-white text-black font-black text-xs hover:bg-zinc-200 cursor-pointer shadow-lg"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default KeyStoreModal;
