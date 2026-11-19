import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Crown,
  Upload,
  CheckCircle2
} from 'lucide-react';
import DiamondPlusIcon from './DiamondPlusIcon.tsx';
import { isUserOwner } from './UserRoleBadge.tsx';

interface TopUpDiamondModalProps {
  currentUser?: any;
  onClose: () => void;
  onBalanceUpdated?: (newBalance: number) => void;
}

const TOPUP_PRESETS = [
  { diamond: 5000, rupiah: 5000, label: '5.000' },
  { diamond: 10000, rupiah: 10000, label: '10.000' },
  { diamond: 25000, rupiah: 25000, label: '25.000' },
  { diamond: 50000, rupiah: 50000, label: '50.000', popular: true },
  { diamond: 100000, rupiah: 100000, label: '100.000' },
  { diamond: 250000, rupiah: 250000, label: '250.000' }
];

export function TopUpDiamondModal({
  currentUser,
  onClose,
  onBalanceUpdated
}: TopUpDiamondModalProps) {
  const isOwner = isUserOwner(currentUser);
  const [selectedNominal, setSelectedNominal] = useState<number>(50000);
  const [customNominal, setCustomNominal] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const [diamondBalance, setDiamondBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);

  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [isUploadingProof, setIsUploadingProof] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3800);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
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
      setCopiedText(label);
      showToast(`${label} disalin`, 'success');
      setTimeout(() => setCopiedText(null), 2000);
    } catch {
      showToast('Gagal menyalin teks', 'error');
    }
  };

  // Load real balance from server
  const fetchBalance = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoadingBalance(true);
    try {
      const res = await fetch(`/api/wallet/balance?userId=${encodeURIComponent(currentUser.id)}`);
      const data = await res.json();
      if (data?.success) {
        const bal = isOwner || data.isUnlimited ? 999999999 : Number(data.balance) || 0;
        setDiamondBalance(bal);
        onBalanceUpdated?.(bal);
      }
    } catch {
      // ignore transient error
    } finally {
      setIsLoadingBalance(false);
    }
  }, [currentUser?.id, isOwner, onBalanceUpdated]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Real-time SSE sync for instant Owner ACC or webhook settlement
  useEffect(() => {
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource('/api/events');
      evtSource.addEventListener('wallet-updated', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (String(data.userId).toLowerCase() === String(currentUser?.id).toLowerCase()) {
            const bal = isOwner || data.isUnlimited ? 999999999 : Number(data.balance) || 0;
            setDiamondBalance(bal);
            onBalanceUpdated?.(bal);
          }
        } catch {}
      });
      evtSource.addEventListener('payment-updated', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (String(data.userId).toLowerCase() === String(currentUser?.id).toLowerCase()) {
            fetchBalance();
            if (activeInvoice && activeInvoice.orderId === data.orderId && data.transaction) {
              setActiveInvoice(data.transaction);
              if (data.transaction.status === 'APPROVED') {
                showToast('Top Up Diamond+ telah disetujui! Saldo Anda bertambah.', 'success');
              }
            }
          }
        } catch {}
      });
    } catch {}

    return () => {
      evtSource?.close();
    };
  }, [currentUser?.id, isOwner, activeInvoice, fetchBalance, onBalanceUpdated, showToast]);

  // Create real QRIS Invoice exclusively for Top Up Diamond+
  const handleCreateInvoice = async () => {
    const rawCustom = customNominal.replace(/[^0-9]/g, '');
    const amount = isCustom ? Math.floor(Number(rawCustom)) : selectedNominal;
    if (!amount || amount < 1000) {
      showToast('Minimal top up adalah 1.000 Diamond+ (Rp1.000)', 'error');
      return;
    }
    if (!currentUser?.id || currentUser.id === 'anonymous') {
      showToast('Silakan masuk ke akun ZE.io terlebih dahulu', 'error');
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const res = await fetch('/api/payment/create-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseType: 'topup',
          amount,
          userId: currentUser.id,
          userName: currentUser.name || currentUser.username || 'Pengguna ZE.io'
        })
      });

      const data = await res.json();
      if (data?.success && data?.transaction) {
        setActiveInvoice(data.transaction);
        showToast('QRIS Top Up Diamond+ berhasil diterbitkan!', 'success');
      } else {
        showToast(data?.message || 'Gagal menerbitkan QRIS pembayaran', 'error');
      }
    } catch {
      showToast('Terjadi gangguan jaringan saat menerbitkan QRIS', 'error');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Upload optional transfer proof screenshot for Owner ACC
  const handleUploadProofFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeInvoice?.orderId || !currentUser?.id) return;
    if (!file.type.startsWith('image/')) {
      showToast('Pilih file gambar/screenshot bukti transfer (JPG/PNG)', 'error');
      return;
    }

    setIsUploadingProof(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const dataUrl = String(ev.target?.result || '');
        const res = await fetch('/api/payment/upload-proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: activeInvoice.orderId,
            userId: currentUser.id,
            proofImageUrl: dataUrl,
            proofNote: `Top Up Diamond+ Rp${Number(activeInvoice.amount || 0).toLocaleString('id-ID')}`
          })
        });
        const data = await res.json();
        if (data?.success && data.transaction) {
          setActiveInvoice(data.transaction);
          showToast('Bukti transfer terkirim! Menunggu verifikasi Owner.', 'success');
        } else {
          showToast(data?.message || 'Gagal mengunggah bukti transfer', 'error');
        }
      } catch {
        showToast('Gagal mengirim bukti transfer ke server', 'error');
      } finally {
        setIsUploadingProof(false);
        if (proofInputRef.current) proofInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setIsUploadingProof(false);
      showToast('Gagal membaca file gambar', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Real-time server payment status check
  const handleCheckStatus = async () => {
    if (!activeInvoice?.orderId) return;
    setIsCheckingStatus(true);
    try {
      const res = await fetch(`/api/payment/check-status/${encodeURIComponent(activeInvoice.orderId)}`);
      const data = await res.json();
      if (data?.success) {
        if (data.status === 'SUCCESS' || data.verified || data.transaction?.status === 'APPROVED') {
          showToast('Pembayaran SAH DIVERIFIKASI! Saldo Diamond+ telah aktif.', 'success');
          setActiveInvoice(data.transaction || { ...activeInvoice, status: 'APPROVED' });
          await fetchBalance();
        } else if (data.status === 'REJECTED' || data.transaction?.status === 'REJECTED') {
          showToast(data.message || 'Pembayaran ditolak oleh Owner', 'error');
          setActiveInvoice(data.transaction || { ...activeInvoice, status: 'REJECTED' });
        } else {
          showToast('Menunggu verifikasi pembayaran QRIS masuk...', 'info');
        }
      } else {
        showToast(data?.message || 'Status transaksi belum terverifikasi', 'info');
      }
    } catch {
      showToast('Gagal memeriksa status pembayaran server', 'error');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[135] w-screen h-[100dvh] ze-transparent-page bg-transparent flex flex-col text-white overflow-hidden select-none">
      {/* Transparent Corner & Edge Vignette Shadow Overlay (Video remains clear in background) */}
      <div className="pointer-events-none fixed inset-0 z-0 shadow-[inset_0_0_85px_rgba(0,0,0,0.94),inset_0_0_28px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-white/12" />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 left-3 right-3 z-[160] mx-auto max-w-sm px-4 py-2.5 rounded-2xl text-xs font-bold border shadow-[0_14px_38px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all text-center break-words ${
            toast.type === 'success'
              ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/40'
              : toast.type === 'error'
              ? 'bg-rose-950/85 text-rose-300 border-rose-500/40'
              : 'bg-black/80 text-zinc-100 border-white/20'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* FULL-WIDTH ANDROID TOP APP BAR (Transparent Liquid Glass with Edge Shadow) */}
      <div
        className="relative z-10 w-full px-3.5 py-3 border-b border-white/15 bg-black/28 flex items-center justify-between gap-2 shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.75),inset_0_-1px_0_rgba(255,255,255,0.1)]"
        style={{
          backdropFilter: 'blur(14px) saturate(160%)',
          WebkitBackdropFilter: 'blur(14px) saturate(160%)'
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-black/35 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-90 transition shrink-0 shadow-md"
            title="Kembali"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center p-1 shadow-md shrink-0">
            <DiamondPlusIcon size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              TOP UP DIAMOND+
            </h1>
            <p className="text-[10px] text-zinc-300 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">Menu Khusus Isi Saldo</p>
          </div>
        </div>

        {/* Balance Pill */}
        <div className="px-2.5 py-1.5 rounded-2xl bg-black/35 border border-white/20 flex items-center gap-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.15)] shrink-0">
          <DiamondPlusIcon size={13} />
          <span className="text-[11px] font-black tracking-tight text-white whitespace-nowrap">
            {isOwner
              ? 'UNLIMITED'
              : isLoadingBalance
              ? '...'
              : `${diamondBalance.toLocaleString('id-ID')}+`}
          </span>
        </div>
      </div>

      {/* SCROLLABLE FULL-SCREEN ANDROID BODY — Berderet ke bawah rapi tanpa batas layar mengambang */}
      <div className="relative z-10 flex-1 w-full overflow-y-auto overflow-x-hidden px-3.5 py-4 pb-10 flex flex-col gap-4">
        {/* Owner Unlimited Banner */}
        {isOwner && (
          <div
            className="w-full p-3.5 rounded-2xl bg-black/35 border border-amber-400/35 text-amber-100 shadow-[0_12px_32px_rgba(0,0,0,0.78),inset_0_0_20px_rgba(245,158,11,0.12)] flex items-start gap-3"
            style={{
              backdropFilter: 'blur(12px) saturate(150%)',
              WebkitBackdropFilter: 'blur(12px) saturate(150%)'
            }}
          >
            <Crown size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-black uppercase tracking-wider text-amber-300 leading-tight">
                SALDO OWNER: UNLIMITED DIAMOND+
              </p>
              <p className="text-[11px] text-zinc-200 leading-relaxed">
                Akun Owner resmi memiliki Diamond+ tanpa batas secara permanen di seluruh fitur ZE.io.
              </p>
            </div>
          </div>
        )}

        {/* SALDO CARD RINGKAS */}
        <div
          className="w-full p-4 rounded-3xl bg-black/28 border border-white/16 shadow-[0_14px_38px_rgba(0,0,0,0.82),inset_0_0_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] flex flex-col gap-2"
          style={{
            backdropFilter: 'blur(14px) saturate(160%)',
            WebkitBackdropFilter: 'blur(14px) saturate(160%)'
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
              Saldo Diamond+ Aktif
            </span>
            <button
              onClick={fetchBalance}
              className="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer active:scale-95 transition"
            >
              <RefreshCw size={11} className={isLoadingBalance ? 'animate-spin' : ''} />
              <span>Segarkan</span>
            </button>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <DiamondPlusIcon size={22} />
            <span className="text-2xl font-black text-white tracking-tight truncate">
              {isOwner
                ? 'UNLIMITED'
                : isLoadingBalance
                ? '...'
                : `${diamondBalance.toLocaleString('id-ID')}+`}
            </span>
          </div>

          <p className="text-[11px] text-zinc-300 leading-snug">
            Akun: <strong className="text-white">{currentUser?.name || 'Pengguna'}</strong> • 1 Diamond+ = Rp1
          </p>
        </div>

        {/* STEP 1: PILIH NOMINAL DIAMOND+ */}
        {!activeInvoice ? (
          <div
            className="w-full p-4 rounded-3xl bg-black/28 border border-white/16 shadow-[0_14px_38px_rgba(0,0,0,0.82),inset_0_0_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] flex flex-col gap-3.5"
            style={{
              backdropFilter: 'blur(14px) saturate(160%)',
              WebkitBackdropFilter: 'blur(14px) saturate(160%)'
            }}
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white text-black font-black text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <h2 className="text-xs font-black text-white uppercase tracking-wider leading-tight">
                  Pilih Nominal Top Up Diamond+
                </h2>
              </div>
              <p className="text-[11px] text-zinc-300 pl-7 leading-snug">
                Pilih paket nominal di bawah atau ketik jumlah sesuai keinginan Anda.
              </p>
            </div>

            {/* 2-Column Android Touch Grid — ZERO absolute badges so text never overlaps */}
            <div className="grid grid-cols-2 gap-2.5">
              {TOPUP_PRESETS.map((preset) => {
                const active = !isCustom && selectedNominal === preset.diamond;
                return (
                  <button
                    key={preset.diamond}
                    type="button"
                    onClick={() => {
                      setSelectedNominal(preset.diamond);
                      setIsCustom(false);
                    }}
                    className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between gap-1.5 cursor-pointer active:scale-[0.98] min-w-0 ${
                      active
                        ? 'bg-white text-black border-white shadow-[0_8px_25px_rgba(255,255,255,0.28)]'
                        : 'bg-black/35 text-white border-white/15 hover:border-white/35 shadow-[0_6px_18px_rgba(0,0,0,0.55)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <DiamondPlusIcon size={14} />
                        <span className="text-xs font-black truncate">{preset.label}+</span>
                      </div>
                      {preset.popular && (
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider shrink-0 ${
                            active ? 'bg-black text-white' : 'bg-emerald-500 text-black'
                          }`}
                        >
                          Populer
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] font-semibold truncate ${
                        active ? 'text-zinc-700' : 'text-zinc-300'
                      }`}
                    >
                      Rp{preset.rupiah.toLocaleString('id-ID')}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Nominal Kustom */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCustom((prev) => !prev)}
                className={`w-full p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                  isCustom
                    ? 'bg-white/18 border-white text-white shadow-md'
                    : 'bg-black/35 border-white/15 text-zinc-200 hover:border-white/30'
                }`}
              >
                <span className="truncate">Nominal Lainnya (Ketik Sendiri)</span>
                <span className="text-[10px] text-zinc-300 font-mono shrink-0">Min. Rp1.000</span>
              </button>

              {isCustom && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/25">
                  <span className="text-xs font-bold text-zinc-300 shrink-0">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customNominal}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setCustomNominal(val ? Number(val).toLocaleString('id-ID') : '');
                    }}
                    placeholder="Contoh: 75.000"
                    className="w-full bg-transparent text-white placeholder-zinc-400 text-sm font-mono focus:outline-none min-w-0"
                    autoFocus
                  />
                  <span className="text-[10px] font-bold text-zinc-300 shrink-0">Diamond+</span>
                </div>
              )}
            </div>

            {/* Tombol Terbitkan QRIS */}
            <button
              type="button"
              onClick={handleCreateInvoice}
              disabled={isCreatingInvoice}
              className="w-full py-3.5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition active:scale-[0.98] cursor-pointer shadow-[0_10px_28px_rgba(0,0,0,0.75)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreatingInvoice ? (
                <>
                  <RefreshCw size={15} className="animate-spin shrink-0" />
                  <span>Menerbitkan QRIS...</span>
                </>
              ) : (
                <>
                  <QrCode size={16} className="shrink-0" />
                  <span>Terbitkan QRIS Top Up</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* STEP 2: FAKTUR & SCAN QRIS DANA OWNER — Berderet rapi ke bawah */
          <div
            className="w-full p-4 rounded-3xl bg-black/32 border border-white/18 shadow-[0_16px_42px_rgba(0,0,0,0.85),inset_0_0_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.16)] flex flex-col gap-4"
            style={{
              backdropFilter: 'blur(14px) saturate(160%)',
              WebkitBackdropFilter: 'blur(14px) saturate(160%)'
            }}
          >
            {/* Baris Atas Invoice: Kembali & Status */}
            <div className="flex flex-col gap-2 pb-3 border-b border-white/12">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveInvoice(null)}
                  className="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <ArrowLeft size={13} />
                  <span>Ubah Nominal</span>
                </button>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${
                    activeInvoice.status === 'APPROVED' || activeInvoice.status === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
                      : activeInvoice.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/35'
                      : 'bg-amber-500/20 text-amber-200 border-amber-500/35'
                  }`}
                >
                  {activeInvoice.status === 'APPROVED' || activeInvoice.status === 'paid'
                    ? 'LUNAS'
                    : activeInvoice.status === 'WAITING_OWNER_APPROVAL'
                    ? 'MENUNGGU ACC OWNER'
                    : activeInvoice.status === 'REJECTED'
                    ? 'DITOLAK'
                    : 'MENUNGGU BAYAR'}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 pt-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Scan QRIS Resmi DANA Owner
                </h3>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Mendukung DANA, GoPay, OVO, ShopeePay &amp; seluruh Mobile Banking.
                </p>
              </div>
            </div>

            {/* Gambar QRIS */}
            <div className="w-full p-3.5 rounded-2xl bg-white text-black shadow-lg flex flex-col items-center gap-2">
              <div className="w-52 h-52 rounded-xl overflow-hidden border border-zinc-200 flex items-center justify-center bg-white p-1">
                <img
                  src={activeInvoice.qrisImageUrl || '/assets/qris_payment.jpg'}
                  alt="QRIS DANA Owner"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[11px] font-black text-zinc-900 uppercase tracking-wide text-center">
                ZE.io OFFICIAL • QRIS DANA OWNER
              </p>
            </div>

            {/* Detail Tagihan Berderet ke Bawah */}
            <div className="w-full p-3.5 rounded-2xl bg-black/45 border border-white/14 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-300">ID Pesanan:</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-white font-bold text-[11px] truncate">
                    {activeInvoice.orderId}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeInvoice.orderId, 'ID Pesanan')}
                    className="p-1 rounded-lg bg-white/10 text-zinc-200 hover:text-white shrink-0"
                    title="Salin ID"
                  >
                    {copiedText === 'ID Pesanan' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                <span className="text-zinc-300">Jumlah Diamond+:</span>
                <div className="flex items-center gap-1 font-black text-white">
                  <DiamondPlusIcon size={13} />
                  <span>{Number(activeInvoice.amount || selectedNominal).toLocaleString('id-ID')}+</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                <span className="text-zinc-200 font-bold">Total Transfer:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-emerald-300 font-mono">
                    Rp{Number(activeInvoice.amount || selectedNominal).toLocaleString('id-ID')}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        String(activeInvoice.amount || selectedNominal),
                        'Nominal Transfer'
                      )
                    }
                    className="p-1 rounded-lg bg-white/10 text-zinc-200 hover:text-white shrink-0"
                    title="Salin Nominal"
                  >
                    {copiedText === 'Nominal Transfer' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Upload Bukti Transfer & Cek Status Pembayaran (Stacked vertically for Android) */}
            <input
              ref={proofInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadProofFile}
              className="hidden"
            />

            <div className="flex flex-col gap-2.5">
              {activeInvoice.status !== 'APPROVED' && activeInvoice.status !== 'paid' && (
                <button
                  type="button"
                  onClick={() => proofInputRef.current?.click()}
                  disabled={isUploadingProof}
                  className="w-full py-3 rounded-2xl bg-black/45 border border-white/25 hover:border-white/45 text-white font-bold text-xs transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isUploadingProof ? (
                    <>
                      <RefreshCw size={15} className="animate-spin shrink-0" />
                      <span>Mengirim Bukti Transfer...</span>
                    </>
                  ) : activeInvoice.proofImageUrl ? (
                    <>
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      <span>Bukti Terkirim (Ganti Screenshot)</span>
                    </>
                  ) : (
                    <>
                      <Upload size={15} className="shrink-0" />
                      <span>Kirim Screenshot Bukti Transfer</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition active:scale-[0.98] cursor-pointer shadow-[0_10px_28px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCheckingStatus ? (
                  <>
                    <RefreshCw size={15} className="animate-spin shrink-0" />
                    <span>Memeriksa Status Server...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} className="shrink-0" />
                    <span>Cek Status Pembayaran</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* PANDUAN SINGKAT HP ANDROID */}
        <div
          className="w-full p-4 rounded-3xl bg-black/26 border border-white/14 shadow-[0_12px_32px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12)] flex flex-col gap-2 text-xs text-zinc-200"
          style={{
            backdropFilter: 'blur(12px) saturate(150%)',
            WebkitBackdropFilter: 'blur(12px) saturate(150%)'
          }}
        >
          <p className="font-black text-white uppercase tracking-wider text-[11px]">
            Cara Top Up Diamond+ di HP Android:
          </p>
          <ol className="list-decimal list-outside pl-4 space-y-1.5 text-[11px] text-zinc-200 leading-relaxed">
            <li>Pilih nominal Diamond+ lalu ketuk <b>Terbitkan QRIS Top Up</b>.</li>
            <li>Screenshot kode QRIS dan bayar lewat DANA, GoPay, OVO, atau Mobile Banking.</li>
            <li>Unggah screenshot bukti transfer atau ketuk <b>Cek Status Pembayaran</b> agar saldo Diamond+ langsung masuk.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default TopUpDiamondModal;
