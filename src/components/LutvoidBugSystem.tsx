import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Globe,
  Lock,
  Send,
  X,
  ArrowLeft,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  Copy,
  Radio,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Settings,
  Zap,
  Sun,
  Maximize2,
  LockOpen,
  Power,
  RotateCw,
  Palette,
  Eye,
  Sliders,
  ShieldCheck,
  BatteryCharging,
  Signal
} from 'lucide-react';
import { ALL_DEVICES, getRandomDevice } from '../data/allDevices.ts';
import { getRandomIndonesiaLocation, IndonesiaLocation } from '../data/indonesiaLocations.ts';

export interface SenderItem {
  id: string;
  phone: string;
  connectedAt: number;
  status: 'connected' | 'pairing';
  pairingCode?: string;
  deviceName?: string;
}

export default function LutvoidBugSystem({ onClose }: { onClose: () => void }) {
  // Lock body scroll and set html/body overflow to hidden while modal is active
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevMargin = document.body.style.margin;
    const prevPadding = document.body.style.padding;

    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0px';
    document.body.style.padding = '0px';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.margin = prevMargin;
      document.body.style.padding = prevPadding;
    };
  }, []);

  // Current view: 'home' (Video 1) | 'console' (Video 2) | 'sender' (Halaman Sender Hitam) | 'control' (Control Menu)
  const [currentView, setCurrentView] = useState<'home' | 'console' | 'sender' | 'control'>('home');

  // Control Simulator Visual & Hardware States
  const [screenPower, setScreenPower] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const [isLockScreenOpen, setIsLockScreenOpen] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  // Toggle selection state for Control Panel cards (default: null / unselected)
  const [selectedControlCard, setSelectedControlCard] = useState<'power' | 'target_screen' | 'flashlight' | 'lockscreen' | null>(null);

  // Digital clock for lockscreen
  const [lockScreenTime, setLockScreenTime] = useState('');
  const [lockScreenDate, setLockScreenDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLockScreenTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setLockScreenDate(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Target input & selections in Console (default: null / unselected when opened)
  const [targetInput, setTargetInput] = useState('');
  const [selectedTargetType, setSelectedTargetType] = useState<'nomor' | 'group' | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<'foreclose' | 'crash_lag' | null>(null);
  const [selectedSenderSource, setSelectedSenderSource] = useState<'global' | 'private' | null>(null);

  // Senders list state (default: 0 sender, persisted in localStorage)
  const [senders, setSenders] = useState<SenderItem[]>(() => {
    try {
      const saved = localStorage.getItem('tps_senders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return []; // Default empty, 0 sender
  });

  const saveSenders = (items: SenderItem[]) => {
    setSenders(items);
    localStorage.setItem('tps_senders', JSON.stringify(items));
  };

  const activeSenderCount = useMemo(() => {
    return senders.filter((s) => s.status === 'connected').length;
  }, [senders]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // =========================================================================
  // INPUT VALIDATION LOGIC
  // =========================================================================
  const isInputValid = useMemo(() => {
    if (!selectedTargetType) return false;
    const val = targetInput.trim();
    if (!val) return false;

    if (selectedTargetType === 'nomor') {
      const digitsOnly = val.replace(/\D/g, '');
      const hasLetters = /[a-zA-Z]/.test(val);
      if (hasLetters) return false;
      return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    } else {
      return val.startsWith('https://') && val.length > 15;
    }
  }, [targetInput, selectedTargetType]);

  const validationError = useMemo(() => {
    if (!selectedTargetType) return null;
    const val = targetInput.trim();
    if (!val) return null;

    if (selectedTargetType === 'nomor') {
      const hasLetters = /[a-zA-Z]/.test(val);
      if (hasLetters) {
        return 'Nomor tidak valid (hanya boleh angka)';
      }
      const digitsOnly = val.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        return `Nomor tidak valid (minimal 10 digit angka, saat ini: ${digitsOnly.length})`;
      }
      if (digitsOnly.length > 15) {
        return 'Nomor tidak valid (maksimal 15 digit angka)';
      }
      return null;
    } else {
      if (!val.startsWith('https://')) {
        return 'Tautan grup tidak valid (harus diawali https://)';
      }
      return null;
    }
  }, [targetInput, selectedTargetType]);

  // =========================================================================
  // SENDER PAIRING LOGIC (WHATSAPP 8-DIGIT PAIRING CODE)
  // =========================================================================
  const [showAddSenderModal, setShowAddSenderModal] = useState(false);
  const [inputPhone, setInputPhone] = useState('');
  const [pairingStep, setPairingStep] = useState<'input' | 'code' | 'success'>('input');
  const [generatedPairingCode, setGeneratedPairingCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [countdown, setCountdown] = useState(180);

  const generateCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 4; i++) {
      p1 += chars.charAt(Math.floor(Math.random() * chars.length));
      p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${p1}-${p2}`;
  };

  useEffect(() => {
    let timer: any;
    if (showAddSenderModal && pairingStep === 'code' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => (c > 1 ? c - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showAddSenderModal, pairingStep, countdown]);

  const handleRequestPairingCode = () => {
    const cleanDigits = inputPhone.trim().replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10 || cleanDigits.length > 15) {
      showToast('⚠️ Masukkan nomor WhatsApp valid (10-15 digit angka)!');
      return;
    }

    const code = generateCode();
    setGeneratedPairingCode(code);
    setPairingStep('code');
    setCountdown(180);
  };

  const handleConfirmLinked = () => {
    const cleanDigits = inputPhone.trim().replace(/\D/g, '');
    const formatted = cleanDigits.startsWith('0')
      ? '+62 ' + cleanDigits.slice(1, 4) + '-' + cleanDigits.slice(4, 8) + '-' + cleanDigits.slice(8)
      : '+' + cleanDigits;

    const newSender: SenderItem = {
      id: 'sender_' + Date.now(),
      phone: formatted,
      connectedAt: Date.now(),
      status: 'connected',
      pairingCode: generatedPairingCode,
      deviceName: 'WhatsApp Linked Device (Official)'
    };

    const updated = [newSender, ...senders];
    saveSenders(updated);
    setPairingStep('success');
    showToast(`✅ WhatsApp ${formatted} berhasil terhubung!`);
  };

  const handleCopyCode = () => {
    if (!generatedPairingCode) return;
    navigator.clipboard?.writeText(generatedPairingCode);
    setCopiedCode(true);
    showToast('Kode berhasil disalin: ' + generatedPairingCode);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDeleteSender = (id: string) => {
    const updated = senders.filter((s) => s.id !== id);
    saveSenders(updated);
    showToast('Sender berhasil dihapus');
  };

  // =========================================================================
  // FAKE TRANSMISSION LOADING (Gimmick Animasi Loading Seolah Beneran)
  // =========================================================================
  const [isSendingBug, setIsSendingBug] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendStepText, setSendStepText] = useState('');
  const [sendDone, setSendDone] = useState(false);
  const canSendBug = Boolean(selectedTargetType) && isInputValid && Boolean(selectedPayload) && activeSenderCount > 0;

  // =========================================================================
  // DEVICE & INDONESIA LOCATION ANALYSIS SYSTEM
  // =========================================================================
  const [deviceAnalysisStatus, setDeviceAnalysisStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [simulatedDevice, setSimulatedDevice] = useState<{ fullName: string; model: string; os: string } | null>(null);
  const [simulatedLocation, setSimulatedLocation] = useState<IndonesiaLocation | null>(null);

  // Target Device Validation: Target number must be valid + analysis complete
  const isTargetDeviceReady = useMemo(() => {
    return (
      Boolean(selectedTargetType === 'nomor') &&
      isInputValid &&
      deviceAnalysisStatus === 'done' &&
      simulatedDevice !== null
    );
  }, [selectedTargetType, isInputValid, deviceAnalysisStatus, simulatedDevice]);

  // Target Reset Simulator States (Isolated from global UI state)
  const [showTargetResetConfirm, setShowTargetResetConfirm] = useState(false);
  const [isResettingTarget, setIsResettingTarget] = useState(false);
  const [targetResetProgress, setTargetResetProgress] = useState(0);
  const [targetResetStep, setTargetResetStep] = useState('');
  const [targetResetDone, setTargetResetDone] = useState(false);
  const [targetDeviceStatusLabel, setTargetDeviceStatusLabel] = useState('ONLINE / READY');
  const [lastUpdatedTime, setLastUpdatedTime] = useState('');

  useEffect(() => {
    if (!selectedTargetType || selectedTargetType === 'group') {
      setDeviceAnalysisStatus('idle');
      setSimulatedDevice(null);
      setSimulatedLocation(null);
      return;
    }

    const val = targetInput.trim();
    if (!val) {
      setDeviceAnalysisStatus('idle');
      setSimulatedDevice(null);
      setSimulatedLocation(null);
      return;
    }

    setDeviceAnalysisStatus('analyzing');
    const timer = setTimeout(() => {
      setSimulatedDevice(getRandomDevice());
      setSimulatedLocation(getRandomIndonesiaLocation());
      setDeviceAnalysisStatus('done');
      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      setTargetDeviceStatusLabel('ONLINE / READY');
    }, 1500);

    return () => clearTimeout(timer);
  }, [targetInput, selectedTargetType]);

  const handleRandomizeDeviceAndLocation = () => {
    if (!selectedTargetType || selectedTargetType === 'group' || !targetInput.trim()) return;
    setDeviceAnalysisStatus('analyzing');
    showToast('↻ Memperbarui konfigurasi perangkat & node jaringan...');
    setTimeout(() => {
      const nextDev = getRandomDevice();
      const nextLoc = getRandomIndonesiaLocation();
      setSimulatedDevice(nextDev);
      setSimulatedLocation(nextLoc);
      setDeviceAnalysisStatus('done');
      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      setTargetDeviceStatusLabel('ONLINE / READY');
      showToast(`Data diperbarui: ${nextDev.model} • ${nextLoc.kotaKabupaten}`);
    }, 1500);
  };

  // Target Reset Execution (Does not wipe the UI/form state)
  const handleStartTargetReset = () => {
    if (!isTargetDeviceReady) return;
    setShowTargetResetConfirm(false);
    setIsResettingTarget(true);
    setTargetResetProgress(5);
    setTargetResetDone(false);
    setTargetResetStep('Mengirim sinyal reset ke session gateway target...');

    setTimeout(() => {
      setTargetResetProgress(28);
      setTargetResetStep(`Menutup proses background pada ${simulatedDevice?.model || 'Target'}...`);
    }, 600);

    setTimeout(() => {
      setTargetResetProgress(62);
      setTargetResetStep('Menginisialisasi soft reboot sistem target...');
    }, 1300);

    setTimeout(() => {
      setTargetResetProgress(88);
      setTargetResetStep('Memverifikasi status cache & memori...');
    }, 2000);

    setTimeout(() => {
      setTargetResetProgress(100);
      setTargetResetStep('Proses reset target selesai! Sistem berhasil di-reboot.');
      setTargetResetDone(true);
      setTargetDeviceStatusLabel('REBOOTED / STABLE');
      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      showToast(`Target ${simulatedDevice?.model} berhasil di-reset`);
    }, 2800);
  };

  const handleExecuteGlobalReset = () => {
    setTargetInput('');
    setSelectedTargetType(null);
    setSelectedPayload(null);
    setSelectedSenderSource(null);
    setSelectedControlCard(null);
    setDeviceAnalysisStatus('idle');
    setSimulatedDevice(null);
    setSimulatedLocation(null);
    // Reset all control parameters
    setScreenPower(true);
    setIsFullScreen(false);
    setIsFlashlightOn(false);
    setIsLockScreenOpen(false);
    setShowResetConfirmModal(false);
    showToast('Seluruh konfigurasi berhasil diatur ulang');
  };

  const handleStartSendBug = () => {
    if (!selectedTargetType) {
      showToast('⚠️ Silakan pilih mode BUG NOMOR atau BAN GRUB!');
      return;
    }

    if (!selectedPayload) {
      showToast('⚠️ Silakan pilih tipe bug terlebih dahulu!');
      return;
    }

    if (activeSenderCount === 0) {
      showToast('⚠️ Sender tidak aktif! Wajib tautkan WhatsApp sender terlebih dahulu.');
      return;
    }

    if (!isInputValid) {
      showToast('⚠️ Harap isi target dengan format yang valid!');
      return;
    }

    setIsSendingBug(true);
    setSendProgress(5);
    setSendDone(false);
    setSendStepText('Memulai session gateway WhatsApp...');

    setTimeout(() => {
      setSendProgress(24);
      setSendStepText(`Menyiapkan vector payload [${(selectedPayload || 'PAYLOAD').toUpperCase()}]...`);
    }, 600);

    setTimeout(() => {
      setSendProgress(52);
      setSendStepText(`Menginjeksikan buffer stream protocol ke target...`);
    }, 1300);

    setTimeout(() => {
      setSendProgress(78);
      setSendStepText('Mentransmisikan chunk packet stream melalui socket relay...');
    }, 2000);

    setTimeout(() => {
      setSendProgress(94);
      setSendStepText('Memvalidasi response ack dari target...');
    }, 2700);

    setTimeout(() => {
      setSendProgress(100);
      setSendStepText('Transmisi selesai! Payload berhasil dikirimkan.');
      setSendDone(true);
      showToast('Payload bug berhasil terkirim!');
    }, 3400);
  };

  return (
    <div className="fixed inset-0 z-[999999] w-screen h-screen h-[100dvh] max-h-[100dvh] m-0 p-0 overflow-hidden flex flex-col font-slant select-none bg-transparent">
      
      {/* =================================================================== */}
      {/* 1. LAYER BACKGROUND SINKRON: Tembus langsung ke VideoBackground     */}
      {/* =================================================================== */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-black/40 backdrop-blur-[1px] pointer-events-none select-none" />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000000] bg-black/95 text-white px-5 py-2.5 rounded-full shadow-3d-bl text-xs flex items-center gap-2 border border-white/30 backdrop-blur-md animate-bounce">
          <AlertCircle size={14} className="text-white shrink-0" />
          <span className="font-slant tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. HALAMAN BERANDA MENU BUG (VIDEO 1)                               */}
      {/* =================================================================== */}
      {currentView === 'home' && (
        <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-transparent">
          {/* Top Bar: ZE.PROJECT text & Exit Button */}
          <div className="relative z-20 pt-4 px-5 flex items-center justify-between">
            <h1 className="text-sm tracking-wider text-white font-slant drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              ZE.PROJECT
            </h1>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/25 text-white text-[11px] font-slant flex items-center gap-1.5 cursor-pointer shadow-3d-bl active:scale-95 transition backdrop-blur-md"
            >
              <X size={14} /> KELUAR
            </button>
          </div>

          {/* Center Circular Logo (Tapping enters Console View 2) */}
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center">
            <button
              onClick={() => setCurrentView('console')}
              className="relative group cursor-pointer active:scale-95 transition-transform"
              title="Masuk ke Menu Bug"
            >
              {/* Outer Glowing Pulse Aura */}
              <div className="absolute -inset-4 rounded-full bg-white/20 blur-xl group-hover:bg-white/35 transition animate-pulse" />

              {/* Circular Emblem */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-black/80 backdrop-blur-md border-2 border-white shadow-3d-bl flex items-center justify-center relative overflow-hidden group-hover:border-white transition">
                <img
                  src="/assets/ze_logo.png"
                  alt="ZE.io Emblem"
                  className="w-full h-full object-contain p-2 rounded-full pointer-events-none select-none drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]"
                />
              </div>

              {/* Pulsing ring indicator around circular button */}
              <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping pointer-events-none opacity-40" />
            </button>
          </div>

          {/* Bottom Button: SENDER (Capsule outline matching Video 1) */}
          <div className="relative z-20 pb-8 px-6 flex justify-center">
            <button
              onClick={() => setCurrentView('sender')}
              className="px-6 py-2.5 rounded-full bg-black/60 hover:bg-black/85 border-2 border-white text-white flex flex-col items-center justify-center gap-1 cursor-pointer shadow-3d-bl active:scale-95 transition backdrop-blur-md min-w-[120px]"
            >
              <div className="w-5 h-7 rounded border border-white flex items-center justify-center">
                <Smartphone size={13} className="text-white" />
              </div>
              <span className="text-[10px] font-slant tracking-widest text-white">
                SENDER
              </span>
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. HALAMAN MENU BUG CONSOLE (VIDEO 2)                              */}
      {/* =================================================================== */}
      {currentView === 'console' && (
        <div className="relative w-full h-full flex flex-col bg-transparent overflow-y-auto no-scrollbar">
          
          {/* Sticky Header with translucent glass */}
          <div className="sticky top-0 z-30 bg-black/60 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/15">
            <button
              onClick={() => setCurrentView('home')}
              className="px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white text-[11px] font-slant flex items-center gap-1.5 cursor-pointer shadow-3d-bl active:scale-95 transition backdrop-blur-md"
            >
              <ArrowLeft size={14} /> KEMBALI
            </button>

            <span className="text-xs font-slant text-white tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              CONSOLE PANEL
            </span>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center cursor-pointer shadow-3d-bl active:scale-95 transition backdrop-blur-md"
            >
              <X size={15} />
            </button>
          </div>

          {/* Console Main Body Container */}
          <div className="p-4 space-y-4 max-w-md mx-auto w-full pb-8">
            
            {/* Top Banner Card: Halo Girl Video with ZE.io PROJECT label */}
            <div className="relative w-full h-44 rounded-[26px] overflow-hidden border border-white/25 shadow-3d-bl bg-black/80 flex items-center justify-center">
              <video
                src="/assets/aistudio/ssstik.io_1793231239969_f00ac994.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none" />

              {/* Top-Left Title Overlay matching Video 2 */}
              <div className="absolute top-3.5 left-4 pointer-events-none">
                <h2 className="text-base font-slant text-white tracking-wider drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  ZE.io
                </h2>
                <h3 className="text-lg font-slant text-white tracking-widest drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] -mt-1">
                  PROJECT
                </h3>
              </div>
            </div>

            {/* Target Input Field (Point 2 & Point 3) */}
            <div className="space-y-1.5">
              <div className={`relative w-full rounded-full border bg-black/60 backdrop-blur-md px-4 py-3 shadow-3d-bl flex items-center gap-2 transition-all ${
                validationError ? 'border-red-500/80' : isInputValid ? 'border-emerald-500/60 focus-within:border-white' : 'border-white/30 focus-within:border-white'
              }`}>
                <span className="text-xs text-white/70 font-slant whitespace-nowrap">
                  {selectedTargetType === 'group' ? 'TAUTAN GRUB |' : selectedTargetType === 'nomor' ? 'NO |' : 'TARGET |'}
                </span>
                <input
                  type="text"
                  placeholder={selectedTargetType === 'group' ? 'https://chat.whatsapp.com/...' : '08123456789 atau 628xxx'}
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-full bg-transparent text-sm text-white font-slant tracking-wider outline-none placeholder:text-white/30"
                />
                {targetInput && (
                  <button
                    onClick={() => setTargetInput('')}
                    className="text-white/40 hover:text-white cursor-pointer shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Validation Error Message */}
              {validationError && (
                <p className="text-[11px] text-red-500 font-slant px-3 tracking-wide">
                  ⚠️ {validationError}
                </p>
              )}
            </div>

            {/* Row 1: BUG NOMOR vs BAN GRUB (TOGGLE SELECTION) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedTargetType((prev) => (prev === 'nomor' ? null : 'nomor'));
                  setTargetInput('');
                }}
                className={`py-3 rounded-full text-xs font-slant tracking-wider transition-all cursor-pointer flex items-center justify-center backdrop-blur-md ${
                  selectedTargetType === 'nomor'
                    ? 'border-2 border-white shadow-3d-bl-active bg-white/20 text-white'
                    : 'border border-white/15 shadow-3d-bl bg-black/55 text-white/75 hover:text-white hover:border-white/30'
                }`}
              >
                BUG NOMOR
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTargetType((prev) => (prev === 'group' ? null : 'group'));
                  setTargetInput('');
                }}
                className={`py-3 rounded-full text-xs font-slant tracking-wider transition-all cursor-pointer flex items-center justify-center backdrop-blur-md ${
                  selectedTargetType === 'group'
                    ? 'border-2 border-white shadow-3d-bl-active bg-white/20 text-white'
                    : 'border border-white/15 shadow-3d-bl bg-black/55 text-white/75 hover:text-white hover:border-white/30'
                }`}
              >
                BAN GRUB
              </button>
            </div>

            {/* Row 2: Payload Cards (TOGGLE SELECTION) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Left Card: Z3FORCECLOSE / KICK SEMUA ANGGOTA */}
              <button
                type="button"
                onClick={() => setSelectedPayload((prev) => (prev === 'foreclose' ? null : 'foreclose'))}
                className={`aspect-[1.1] rounded-[24px] p-3 sm:p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer backdrop-blur-md ${
                  selectedPayload === 'foreclose'
                    ? 'border-2 border-white shadow-3d-bl-active bg-white/20 text-white'
                    : 'border border-white/15 shadow-3d-bl bg-black/55 text-white/70 hover:border-white/30'
                }`}
              >
                <span className="text-xs sm:text-sm font-slant tracking-wider text-white text-center leading-snug px-1">
                  {selectedTargetType === 'group' ? 'KICK SEMUA ANGGOTA' : 'Z3FORCECLOSE'}
                </span>
              </button>

              {/* Right Card: CRASH LAG / REPORT MASSAL GRUB */}
              <button
                type="button"
                onClick={() => setSelectedPayload((prev) => (prev === 'crash_lag' ? null : 'crash_lag'))}
                className={`aspect-[1.1] rounded-[24px] p-3 sm:p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer backdrop-blur-md ${
                  selectedPayload === 'crash_lag'
                    ? 'border-2 border-white shadow-3d-bl-active bg-white/20 text-white'
                    : 'border border-white/15 shadow-3d-bl bg-black/55 text-white/70 hover:border-white/30'
                }`}
              >
                <span className="text-xs sm:text-sm font-slant tracking-wider text-white text-center leading-snug px-1">
                  {selectedTargetType === 'group' ? 'REPORT MASSAL GRUB' : 'CRASH LAG'}
                </span>
              </button>
            </div>

            {/* Row 3: SENDER STATUS CARDS (TOGGLE SELECTION) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Left Card: SENDER GLOBAL */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSenderSource((prev) => (prev === 'global' ? null : 'global'));
                  showToast('⚠️ Sender Global segera hadir (SOON)! Silakan tautkan Sender Pribadi.');
                }}
                className={`py-3.5 px-3 rounded-[22px] flex flex-col items-center justify-center text-center transition-all backdrop-blur-md relative overflow-hidden group cursor-pointer ${
                  selectedSenderSource === 'global'
                    ? 'border-2 border-white shadow-3d-bl-active bg-white/20 text-white'
                    : 'border border-white/15 shadow-3d-bl bg-black/45 text-white/70 hover:border-white/30'
                }`}
              >
                <div className="absolute top-1.5 right-2 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[8px] text-amber-300 font-slant">
                  SOON
                </div>
                <Globe size={18} className="text-white/50 mb-1" />
                <span className="text-[10px] font-slant text-amber-400/90 tracking-wider">
                  SENDER GLOBAL
                </span>
              </button>

              {/* Right Card: SENDER AKTIF */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSenderSource((prev) => (prev === 'private' ? null : 'private'));
                  if (activeSenderCount === 0) {
                    setCurrentView('sender');
                  }
                }}
                className={`py-3.5 px-3 rounded-[22px] flex flex-col items-center justify-center text-center transition-all cursor-pointer backdrop-blur-md ${
                  selectedSenderSource === 'private'
                    ? 'border-2 border-white shadow-3d-bl-active bg-white/20 text-white'
                    : 'border border-white/15 shadow-3d-bl bg-black/55 text-white/70 hover:border-white/30'
                }`}
              >
                <div className="relative mb-1">
                  <Lock size={18} className={activeSenderCount > 0 ? 'text-white' : 'text-white/70'} />
                  <span
                    className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                      activeSenderCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-slant tracking-wider ${
                    activeSenderCount > 0
                      ? 'text-emerald-400 animate-pulse'
                      : 'text-red-500'
                  }`}
                >
                  SENDER AKTIF: {activeSenderCount}
                </span>
              </button>
            </div>

            {/* SEND BUG Button (Disabled if target invalid OR sender not active) */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleStartSendBug}
                disabled={!canSendBug}
                className={`w-full py-4 rounded-full border-2 text-white font-slant text-sm tracking-widest flex items-center justify-center gap-2.5 shadow-3d-bl transition backdrop-blur-md ${
                  canSendBug
                    ? 'bg-black/75 border-white hover:bg-white/15 active:scale-95 cursor-pointer'
                    : 'bg-black/45 border-white/20 text-white/30 cursor-not-allowed opacity-50'
                }`}
              >
                <span>SEND BUG</span>
                <Send size={16} className={canSendBug ? 'text-white' : 'text-white/30'} />
              </button>

              {/* Warning when Sender is not active */}
              {activeSenderCount === 0 && (
                <div className="flex items-center justify-between bg-red-950/40 border border-red-500/35 rounded-2xl px-3.5 py-2 shadow-3d-bl">
                  <span className="text-[10px] text-red-400 font-slant tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                    SENDER TIDAK AKTIF (TIDAK BISA KIRIM)
                  </span>
                  <button
                    onClick={() => setCurrentView('sender')}
                    className="text-[10px] text-white underline font-slant cursor-pointer hover:text-emerald-400 shrink-0 ml-2"
                  >
                    TAUTKAN &gt;
                  </button>
                </div>
              )}
            </div>

            {/* ============================================================= */}
            {/* DEVICE INFO CONTAINER (Gimmick Fake Only)                    */}
            {/* ============================================================= */}
            <div className="rounded-[26px] border border-white/25 bg-black/60 backdrop-blur-md p-3.5 shadow-3d-bl space-y-2.5">
              {/* Header Title */}
              <div className="text-center">
                <span className="text-xs font-slant text-white tracking-widest drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  DEVICE INFO
                </span>
              </div>

              {/* Two Sub-Boxes Side by Side */}
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* 1. KOTAK KIRI: DEVICE INFO */}
                <div className="rounded-[20px] border border-white/20 bg-black/55 p-3 flex flex-col justify-between min-h-[165px] shadow-3d-bl transition-all">
                  <div className="pb-1 border-b border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-slant text-white/50 tracking-wider">
                      DEVICE INFO
                    </span>
                    {targetInput.trim() && deviceAnalysisStatus === 'done' && (
                      <button
                        type="button"
                        onClick={handleRandomizeDeviceAndLocation}
                        title="Acak Model"
                        className="text-white/40 hover:text-white transition cursor-pointer p-0.5"
                      >
                        <RefreshCw size={11} />
                      </button>
                    )}
                  </div>

                  {selectedTargetType === 'group' ? (
                    <div className="flex-1 flex items-center justify-center text-center p-1">
                      <span className="text-[10px] font-slant text-white/50 tracking-wide leading-relaxed">
                        Tidak tersedia untuk mode grub
                      </span>
                    </div>
                  ) : !targetInput.trim() ? (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-lg font-slant text-white/40 tracking-widest">-</span>
                    </div>
                  ) : deviceAnalysisStatus === 'analyzing' ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-center py-2">
                      <RefreshCw size={14} className="text-white/60 animate-spin" />
                      <span className="text-[10px] font-slant text-white/70 tracking-wider animate-pulse">
                        Menganalisis...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1 text-left text-[10px] font-slant leading-tight py-1">
                      <p className="text-white/60">
                        DEVICE: <span className="text-white">{simulatedDevice?.model || 'Samsung Galaxy S25'}</span>
                      </p>
                      <p className="text-white/60">
                        OS: <span className="text-emerald-400">{simulatedDevice?.os || 'Android 14'}</span>
                      </p>
                      <p className="text-white/50 text-[8.5px] truncate">
                        SPEC: <span className="text-white/90">{simulatedDevice?.fullName}</span>
                      </p>
                    </div>
                  )}

                  {/* Di bawah nama device: 2 tombol RESET dan CONTROL berdampingan */}
                  {selectedTargetType !== 'group' && (
                    <div className="pt-2 mt-auto">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          disabled={!isTargetDeviceReady}
                          onClick={() => {
                            if (isTargetDeviceReady) setShowTargetResetConfirm(true);
                          }}
                          className={`py-1.5 px-1.5 rounded-lg text-[9px] font-slant flex items-center justify-center gap-1 transition ${
                            isTargetDeviceReady
                              ? 'border border-red-500/80 text-red-400 bg-red-500/10 hover:bg-red-500/20 active:scale-95 cursor-pointer shadow-3d-bl'
                              : 'bg-black/40 border border-white/10 text-white/30 cursor-not-allowed opacity-40 shadow-none pointer-events-none'
                          }`}
                        >
                          <RotateCcw size={10} className="shrink-0" />
                          <span>RESET</span>
                        </button>

                        <button
                          type="button"
                          disabled={!isTargetDeviceReady}
                          onClick={() => {
                            if (isTargetDeviceReady) setCurrentView('control');
                          }}
                          className={`py-1.5 px-1.5 rounded-lg text-[9px] font-slant flex items-center justify-center gap-1 transition ${
                            isTargetDeviceReady
                              ? 'border border-blue-500/80 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 cursor-pointer shadow-3d-bl'
                              : 'bg-black/40 border border-white/10 text-white/30 cursor-not-allowed opacity-40 shadow-none pointer-events-none'
                          }`}
                        >
                          <Settings size={10} className="shrink-0" />
                          <span>CONTROL</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. KOTAK KANAN: LOCATION (Sistem Lokasi Indonesia) */}
                <div className="rounded-[20px] border border-white/20 bg-black/55 p-3 flex flex-col justify-between min-h-[165px] shadow-3d-bl transition-all">
                  <div className="pb-1 border-b border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-slant text-white/50 tracking-wider">
                      LOCATION
                    </span>
                    {targetInput.trim() && deviceAnalysisStatus === 'done' && (
                      <span className="text-[9px] text-emerald-400 font-slant">
                        {simulatedLocation?.latencyMs || 14}ms
                      </span>
                    )}
                  </div>

                  {selectedTargetType === 'group' ? (
                    <div className="flex-1 flex items-center justify-center text-center p-1">
                      <span className="text-[10px] font-slant text-white/50 tracking-wide leading-relaxed">
                        Tidak tersedia untuk mode grub
                      </span>
                    </div>
                  ) : !targetInput.trim() ? (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-lg font-slant text-white/40 tracking-widest">-</span>
                    </div>
                  ) : deviceAnalysisStatus === 'analyzing' ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-center py-2">
                      <RefreshCw size={14} className="text-white/60 animate-spin" />
                      <span className="text-[10px] font-slant text-white/70 tracking-wider animate-pulse">
                        Menganalisis...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1 text-left text-[9.5px] font-slant leading-tight py-1">
                      <p className="text-white/60 truncate">
                        PROVINSI: <span className="text-white">{simulatedLocation?.provinsi || 'DKI Jakarta'}</span>
                      </p>
                      <p className="text-white/60 truncate">
                        KOTA: <span className="text-white">{simulatedLocation?.kotaKabupaten || 'Jakarta Selatan'}</span>
                      </p>
                      <p className="text-white/60 truncate">
                        KECAMATAN: <span className="text-white">{simulatedLocation?.kecamatan || 'Kebayoran Baru'}</span>
                      </p>
                      <p className="text-white/60 truncate">
                        KELURAHAN: <span className="text-white">{simulatedLocation?.kelurahan || 'Senayan'}</span>
                      </p>
                      <p className="text-white/60 truncate">
                        NODE: <span className="text-white">{simulatedLocation?.nodeName || 'JKT-CORE-01'}</span>
                      </p>
                      <p className="text-white/50 text-[8.5px] truncate">
                        WILAYAH: <span className="text-white/80">{simulatedLocation?.wilayahOperasional || 'Jabodetabek'}</span>
                      </p>
                    </div>
                  )}

                  {/* Kotak kanan tidak ada tombol */}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. HALAMAN MENU SENDER SEBELUMNYA (TEMA HITAM TRANSLUSEN)          */}
      {/* =================================================================== */}
      {currentView === 'sender' && (
        <div className="relative w-full h-full flex flex-col bg-transparent overflow-y-auto no-scrollbar">
          
          {/* Header */}
          <div className="sticky top-0 z-30 bg-black/60 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/15">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('console')}
                className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white cursor-pointer shadow-3d-bl active:scale-95 transition backdrop-blur-md"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 className="font-slant text-sm text-white tracking-wider leading-tight">BUG SENDER</h3>
                <p className={`text-[10px] font-slant ${activeSenderCount > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                  {activeSenderCount} SENDER AKTIF
                </p>
              </div>
            </div>

            <button
              onClick={() => showToast('Daftar sender telah diperbarui')}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white cursor-pointer shadow-3d-bl active:scale-95 transition backdrop-blur-md"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Senders Content */}
          <div className="p-4 space-y-4 max-w-md mx-auto w-full pb-8">
            
            {/* Info Box */}
            <div className="bg-black/60 border border-white/25 rounded-[24px] p-4 shadow-3d-bl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-slant text-white tracking-wider">
                    LOGIN WHATSAPP LINKED DEVICE
                  </h4>
                  <p className="text-[10px] text-white/60 mt-0.5">
                    Tautkan perangkat dengan kode 8 digit resmi WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            {/* Senders List (Empty State if 0) */}
            {senders.length === 0 ? (
              <div className="my-6 flex flex-col items-center text-center p-6 bg-black/60 border border-white/25 rounded-[28px] shadow-3d-bl backdrop-blur-md">
                <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center bg-white/5 mb-3">
                  <Smartphone size={24} className="text-white/40" />
                </div>
                <h3 className="font-slant text-sm text-white tracking-wider">BELUM ADA SENDER</h3>
                <p className="text-[11px] text-white/60 max-w-xs mt-1 font-sans">
                  Tambahkan WhatsApp sender pertama untuk mulai transmisi payload.
                </p>

                <button
                  onClick={() => {
                    setPairingStep('input');
                    setInputPhone('');
                    setShowAddSenderModal(true);
                  }}
                  className="mt-5 bg-white text-black font-slant text-xs px-6 py-2.5 rounded-full hover:bg-white/90 active:scale-95 transition cursor-pointer shadow-3d-bl"
                >
                  + TAMBAH SENDER
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {senders.map((s) => (
                  <div
                    key={s.id}
                    className="bg-black/60 border border-white/25 rounded-[24px] p-4 flex items-center justify-between shadow-3d-bl backdrop-blur-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <Radio size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-slant text-white tracking-wider">{s.phone}</p>
                        <p className="text-[10px] text-emerald-400 font-slant flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          TERHUBUNG • KODE: {s.pairingCode || 'AKTIF'}
                        </p>
                        <p className="text-[9px] text-white/50">{s.deviceName || 'WhatsApp Official'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSender(s.id)}
                      className="text-xs text-red-400 hover:text-red-300 p-2 font-slant cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setPairingStep('input');
                    setInputPhone('');
                    setShowAddSenderModal(true);
                  }}
                  className="w-full py-3.5 rounded-full bg-black/60 border-2 border-white text-white font-slant text-xs tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition cursor-pointer shadow-3d-bl mt-2 backdrop-blur-md"
                >
                  <Plus size={16} /> TAMBAH SENDER BARU
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: TAUTKAN PERANGKAT WHATSAPP (8 DIGIT KODE XXXX-XXXX)           */}
      {/* =================================================================== */}
      {showAddSenderModal && (
        <div className="fixed inset-0 z-[1000001] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-[360px] bg-[#0c0c0c] border-2 border-white rounded-[32px] p-6 shadow-3d-bl relative">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-white" />
                <h4 className="font-slant text-xs text-white tracking-wider">TAUTKAN WHATSAPP</h4>
              </div>
              <button
                onClick={() => setShowAddSenderModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* STEP 1: Phone Number Input */}
            {pairingStep === 'input' && (
              <div className="space-y-4">
                <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                  Masukkan nomor telepon akun WhatsApp Anda untuk menerima 8 digit kode penautan resmi:
                </p>

                <div className="border border-white/30 rounded-2xl px-4 py-3 bg-black flex items-center gap-2 shadow-3d-bl">
                  <span className="text-xs font-slant text-white/50">+</span>
                  <input
                    type="text"
                    placeholder="628123456789"
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    autoFocus
                    className="w-full bg-transparent text-sm text-white font-slant tracking-wider outline-none placeholder:text-white/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSenderModal(false)}
                    className="py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-slant text-xs cursor-pointer active:scale-95 transition"
                  >
                    BATAL
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestPairingCode}
                    disabled={!inputPhone.trim()}
                    className="py-3 rounded-full bg-white text-black font-slant text-xs hover:bg-white/90 active:scale-95 transition cursor-pointer shadow-3d-bl disabled:opacity-40"
                  >
                    DAPAT KODE
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: 8-DIGIT PAIRING CODE DISPLAY */}
            {pairingStep === 'code' && (
              <div className="space-y-4 text-center">
                <p className="text-[11px] text-white/70 font-sans">
                  Masukkan kode berikut pada WhatsApp Anda:
                </p>

                {/* Big 8-Digit Code Display */}
                <div className="bg-black border-2 border-white rounded-2xl py-4 px-3 shadow-3d-bl flex flex-col items-center justify-center relative">
                  <span className="text-2xl sm:text-3xl font-slant text-white tracking-[0.25em] font-black">
                    {generatedPairingCode}
                  </span>

                  <button
                    onClick={handleCopyCode}
                    className="mt-2.5 px-3.5 py-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[10px] font-slant flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
                  >
                    {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedCode ? 'TERSALIN' : 'SALIN KODE'}</span>
                  </button>
                </div>

                {/* Steps tutorial */}
                <div className="text-left bg-white/5 border border-white/10 rounded-2xl p-3 text-[10px] text-white/70 space-y-1 font-sans">
                  <p className="font-bold text-white font-slant">CARA TAUTKAN:</p>
                  <p>1. Buka WhatsApp di HP Anda</p>
                  <p>2. Tekan menu titik tiga (⋮) &gt; Perangkat Tertaut</p>
                  <p>3. Pilih Tautkan Perangkat &gt; Tautkan dengan nomor telepon saja</p>
                  <p>4. Masukkan kode 8 digit di atas</p>
                </div>

                <p className="text-[9px] text-white/40">Kedaluwarsa dalam {countdown} detik</p>

                {/* Explicit confirmation button */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPairingStep('input');
                    }}
                    className="py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-slant text-xs cursor-pointer active:scale-95 transition"
                  >
                    GANTI NO
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLinked}
                    className="py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-black font-slant text-xs active:scale-95 transition cursor-pointer shadow-3d-bl font-bold"
                  >
                    KONFIRMASI
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {pairingStep === 'success' && (
              <div className="py-4 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-400 shadow-3d-bl">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="font-slant text-sm text-white tracking-wider">BERHASIL DITAUTKAN!</h4>
                  <p className="text-[11px] text-white/60 font-sans mt-1">
                    WhatsApp Sender Anda kini telah aktif dan terhubung ke sistem.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddSenderModal(false)}
                  className="w-full py-3 rounded-full bg-white text-black font-slant text-xs hover:bg-white/90 active:scale-95 transition cursor-pointer shadow-3d-bl"
                >
                  SELESAI
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. HALAMAN CONTROL SIMULATOR MENU (IDENTIK DENGAN ZE.io PROJECT)    */}
      {/* =================================================================== */}
      {currentView === 'control' && (
        <div className="relative w-full h-full flex flex-col bg-transparent overflow-y-auto no-scrollbar">
          
          {/* Sticky Header with translucent glass */}
          <div className="sticky top-0 z-30 bg-black/60 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/15">
            <button
              onClick={() => setCurrentView('console')}
              className="px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white text-[11px] font-slant flex items-center gap-1.5 cursor-pointer shadow-3d-bl active:scale-95 transition backdrop-blur-md"
            >
              <ArrowLeft size={14} /> KEMBALI
            </button>

            <span className="text-xs font-slant text-white tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              CONTROL PANEL
            </span>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center cursor-pointer shadow-3d-bl active:scale-95 transition backdrop-blur-md"
            >
              <X size={15} />
            </button>
          </div>

          {/* Control Body */}
          <div className="p-4 space-y-3.5 max-w-md mx-auto w-full pb-14">
            
            {/* Target Device Summary Card */}
            <div className="rounded-[24px] border border-white/25 bg-black/60 backdrop-blur-md p-3.5 shadow-3d-bl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-3d-bl">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-slant text-white tracking-wider">
                    {simulatedDevice?.model || 'Samsung Galaxy S25'}
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-slant">
                    {simulatedDevice?.os || 'Android 14'} • {simulatedLocation?.kotaKabupaten || 'Jakarta Selatan'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!isTargetDeviceReady}
                onClick={() => {
                  if (isTargetDeviceReady) setShowTargetResetConfirm(true);
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-slant flex items-center gap-1 transition ${
                  isTargetDeviceReady
                    ? 'border border-red-500/80 bg-red-500/10 hover:bg-red-500/20 text-red-400 active:scale-95 cursor-pointer shadow-3d-bl'
                    : 'bg-black/40 border border-white/10 text-white/30 cursor-not-allowed opacity-40 shadow-none pointer-events-none'
                }`}
              >
                <RotateCcw size={11} /> RESET
              </button>
            </div>

            {/* Row 1: SCREEN ON/OFF & LAYAR TARGET (TOGGLE SELECTION) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Screen On/Off */}
              <button
                type="button"
                onClick={() => {
                  if (selectedControlCard === 'power') {
                    setSelectedControlCard(null);
                    setScreenPower(false);
                    showToast('Layar dipadamkan');
                  } else {
                    setSelectedControlCard('power');
                    setScreenPower(true);
                    showToast('Layar diaktifkan');
                  }
                }}
                className={`py-3.5 px-3 rounded-[22px] flex flex-col items-center justify-center text-center transition-all cursor-pointer backdrop-blur-md ${
                  selectedControlCard === 'power'
                    ? 'border-2 border-white shadow-3d-bl-active bg-white/20 text-white'
                    : 'border border-white/15 shadow-3d-bl bg-black/55 text-white/80 hover:border-white/30'
                }`}
              >
                <Power size={20} className={screenPower ? 'text-emerald-400 mb-1' : 'text-red-500 mb-1'} />
                <span className="text-xs font-slant tracking-wider text-white">
                  SCREEN POWER
                </span>
                <span className={`text-[9px] font-slant mt-0.5 ${screenPower ? 'text-emerald-400' : 'text-red-500'}`}>
                  {screenPower ? 'AKTIF (ON)' : 'PADAM (OFF)'}
                </span>
              </button>

              {/* Layar Target (Full Screen) */}
              <button
                type="button"
                onClick={() => {
                  if (selectedControlCard === 'target_screen') {
                    setSelectedControlCard(null);
                  } else {
                    setSelectedControlCard('target_screen');
                    setIsFullScreen(true);
                  }
                }}
                className={`py-3.5 px-3 rounded-[22px] flex flex-col items-center justify-center text-center transition-all cursor-pointer backdrop-blur-md ${
                  selectedControlCard === 'target_screen'
                    ? 'border-2 border-white shadow-3d-bl-active bg-white/20 text-white'
                    : 'border border-white/15 shadow-3d-bl bg-black/55 text-white/80 hover:border-white/30 active:scale-95'
                }`}
              >
                <Maximize2 size={20} className="text-white mb-1" />
                <span className="text-xs font-slant tracking-wider text-white">
                  LAYAR TARGET
                </span>
                <span className="text-[9px] font-slant text-white/50 mt-0.5">
                  TAMPILAN PENUH
                </span>
              </button>
            </div>

            {/* Row 2: FLASHLIGHT & LOCK SCREEN (TOGGLE SELECTION) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Flashlight */}
              <button
                type="button"
                onClick={() => {
                  if (selectedControlCard === 'flashlight') {
                    setSelectedControlCard(null);
                    setIsFlashlightOn(false);
                    showToast('Senter dimatikan');
                  } else {
                    setSelectedControlCard('flashlight');
                    setIsFlashlightOn(true);
                    showToast('Senter diaktifkan');
                  }
                }}
                className={`py-3.5 px-3 rounded-[22px] flex flex-col items-center justify-center text-center transition-all cursor-pointer backdrop-blur-md ${
                  selectedControlCard === 'flashlight'
                    ? 'border-2 border-white shadow-3d-bl-active bg-white/20 text-white'
                    : 'border border-white/15 shadow-3d-bl bg-black/55 text-white/80 hover:border-white/30'
                }`}
              >
                <Zap size={20} className={isFlashlightOn ? 'text-amber-300 animate-bounce mb-1' : 'text-white/60 mb-1'} />
                <span className="text-xs font-slant tracking-wider text-white">
                  FLASHLIGHT
                </span>
                <span className={`text-[9px] font-slant mt-0.5 ${isFlashlightOn ? 'text-amber-300' : 'text-white/50'}`}>
                  {isFlashlightOn ? 'MENYALA' : 'MATI'}
                </span>
              </button>

              {/* Lock Screen */}
              <button
                type="button"
                onClick={() => {
                  if (selectedControlCard === 'lockscreen') {
                    setSelectedControlCard(null);
                  } else {
                    setSelectedControlCard('lockscreen');
                    setIsLockScreenOpen(true);
                  }
                }}
                className={`py-3.5 px-3 rounded-[22px] flex flex-col items-center justify-center text-center transition-all cursor-pointer backdrop-blur-md ${
                  selectedControlCard === 'lockscreen'
                    ? 'border-2 border-white shadow-3d-bl-active bg-white/20 text-white'
                    : 'border border-white/15 shadow-3d-bl bg-black/55 text-white/80 hover:border-white/30 active:scale-95'
                }`}
              >
                <Lock size={20} className="text-white mb-1" />
                <span className="text-xs font-slant tracking-wider text-white">
                  LOCK SCREEN
                </span>
                <span className="text-[9px] font-slant text-white/50 mt-0.5">
                  KUNCI LAYAR
                </span>
              </button>
            </div>

            {/* Row 3: DEVICE INFORMATION (14 FIELD PANEL - SINKRON DENGAN TARGET) */}
            <div className="rounded-[24px] border border-white/20 bg-black/60 backdrop-blur-md p-4 shadow-3d-bl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-white/80" />
                  <span className="text-xs font-slant text-white tracking-wider">
                    DEVICE INFORMATION
                  </span>
                </div>
                <span className="text-[9px] font-slant px-2 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-400">
                  {targetDeviceStatusLabel}
                </span>
              </div>

              <div className="space-y-2 text-[10px] font-slant">
                {/* 1-4: Hardware & Target Info */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pb-2 border-b border-white/5">
                  <div>
                    <span className="text-white/40 block text-[8.5px]">DEVICE NAME:</span>
                    <span className="text-white font-medium truncate block">{simulatedDevice?.fullName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8.5px]">MODEL:</span>
                    <span className="text-white font-medium truncate block">{simulatedDevice?.model || '-'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8.5px]">ANDROID VERSION:</span>
                    <span className="text-emerald-400 font-medium truncate block">{simulatedDevice?.os || '-'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8.5px]">NOMOR TARGET:</span>
                    <span className="text-white font-medium truncate block">{targetInput || '-'}</span>
                  </div>
                </div>

                {/* 5-11: Structured Indonesian Regional Hierarchy */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pb-2 border-b border-white/5">
                  <div>
                    <span className="text-white/40 block text-[8.5px]">PROVINSI:</span>
                    <span className="text-white/90 truncate block">{simulatedLocation?.provinsi || '-'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8.5px]">KOTA / KABUPATEN:</span>
                    <span className="text-white/90 truncate block">{simulatedLocation?.kotaKabupaten || '-'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8.5px]">KECAMATAN:</span>
                    <span className="text-white/90 truncate block">{simulatedLocation?.kecamatan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8.5px]">KELURAHAN / DESA:</span>
                    <span className="text-white/90 truncate block">{simulatedLocation?.kelurahan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8.5px]">KAMPUNG / LINGKUNGAN:</span>
                    <span className="text-white/90 truncate block">{simulatedLocation?.kampungLingkungan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8.5px]">RT / RW:</span>
                    <span className="text-white/90 truncate block">
                      {simulatedLocation ? `RT ${simulatedLocation.rt} / RW ${simulatedLocation.rw}` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8.5px]">KODE POS:</span>
                    <span className="text-white/90 truncate block">{simulatedLocation?.kodePos || '-'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8.5px]">STATUS PERANGKAT:</span>
                    <span className="text-emerald-400 truncate block">{targetDeviceStatusLabel}</span>
                  </div>
                </div>

                {/* 12-14: Network, Connection & Timestamp */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
                  <div>
                    <span className="text-white/40 block text-[8.5px]">STATUS KONEKSI:</span>
                    <span className="text-emerald-400 truncate block">
                      ONLINE ({simulatedLocation?.latencyMs || 14}ms)
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[8.5px]">PEMBARUAN TERAKHIR:</span>
                    <span className="text-white/80 truncate block">{lastUpdatedTime || 'Baru saja'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: DEVICE HARDWARE STATUS */}
            <div className="rounded-[24px] border border-white/25 bg-black/60 backdrop-blur-md p-4 shadow-3d-bl space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                <ShieldCheck size={16} className="text-white/70" />
                <span className="text-xs font-slant text-white tracking-wider">
                  CONTROL STATE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-slant pt-1">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-white/50">LAYAR:</span>
                  <span className={screenPower ? 'text-emerald-400' : 'text-red-500'}>
                    {screenPower ? 'AKTIF (ON)' : 'PADAM'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-white/50">SENTER:</span>
                  <span className={isFlashlightOn ? 'text-amber-300' : 'text-white/70'}>
                    {isFlashlightOn ? 'MENYALA' : 'MATI'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-white/50">BATERAI:</span>
                  <span className="text-emerald-400">89%</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-white/50">GATEWAY NODE:</span>
                  <span className="text-white truncate max-w-[100px]">
                    {simulatedLocation?.nodeName || 'JKT-01'}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 7: QUICK ACTIONS */}
            <div className="rounded-[24px] border border-white/25 bg-black/60 backdrop-blur-md p-4 shadow-3d-bl space-y-2">
              <span className="text-[10px] font-slant text-white/50 tracking-wider block">
                QUICK ACTIONS
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!isTargetDeviceReady}
                  onClick={() => {
                    if (isTargetDeviceReady) setShowTargetResetConfirm(true);
                  }}
                  className={`py-2.5 rounded-xl text-[10px] font-slant flex items-center justify-center gap-1.5 transition ${
                    isTargetDeviceReady
                      ? 'border border-red-500/70 text-red-400 bg-red-500/10 hover:bg-red-500/20 active:scale-95 cursor-pointer shadow-3d-bl'
                      : 'bg-black/40 border border-white/10 text-white/30 cursor-not-allowed opacity-40 shadow-none pointer-events-none'
                  }`}
                >
                  <RotateCcw size={12} /> RESET TARGET
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('console')}
                  className="py-2.5 rounded-xl border border-white/30 text-white bg-white/10 hover:bg-white/20 text-[10px] font-slant flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-3d-bl"
                >
                  <ArrowLeft size={12} /> KEMBALI CONSOLE
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* OVERLAY: SCREEN OFF POWER STATE                                     */}
      {/* =================================================================== */}
      {!screenPower && (
        <div className="fixed inset-0 z-[1000010] bg-black flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center mb-4">
            <Power size={28} className="text-white/40 animate-pulse" />
          </div>
          <h4 className="font-slant text-sm text-white/70 tracking-wider">LAYAR NONAKTIF</h4>
          <p className="text-[11px] text-white/40 mt-1">Layar saat ini dalam kondisi padam.</p>
          <button
            onClick={() => {
              setScreenPower(true);
              showToast('Layar berhasil dihidupkan');
            }}
            className="mt-6 px-6 py-2.5 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-slant text-xs tracking-wider cursor-pointer shadow-3d-bl transition"
          >
            HIDUPKAN LAYAR
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* OVERLAY: FULLSCREEN MODE                                            */}
      {/* =================================================================== */}
      {isFullScreen && (
        <div className="fixed inset-0 z-[1000009] bg-black flex flex-col justify-between p-6 select-none animate-in fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setIsFullScreen(false);
                setSelectedControlCard(null);
              }}
              className="w-10 h-10 rounded-full border border-white/40 bg-black/80 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center shadow-3d-bl cursor-pointer z-50 transition"
              title="Kembali dari Layar Penuh"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-[10px] font-slant text-white/30 tracking-widest">
              LAYAR TARGET
            </span>
            <div className="w-10" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full border border-white/15 bg-white/5 flex items-center justify-center mb-3">
              <Maximize2 size={32} className="text-white/40 animate-pulse" />
            </div>
            <p className="text-xs font-slant text-white/50 tracking-wider">LAYAR TARGET AKTIF</p>
            <p className="text-[10px] text-white/30 mt-1">Tekan tombol panah di kiri atas untuk kembali.</p>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* OVERLAY: FLASHLIGHT BEAM                                            */}
      {/* =================================================================== */}
      {isFlashlightOn && (
        <div className="fixed inset-0 pointer-events-none z-[1000004] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/35 via-white/10 to-transparent animate-pulse" />
      )}

      {/* =================================================================== */}
      {/* OVERLAY: LOCK SCREEN VIEW                                           */}
      {/* =================================================================== */}
      {isLockScreenOpen && (
        <div className="fixed inset-0 z-[1000008] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-8 text-center select-none animate-in fade-in">
          {/* Top Status */}
          <div className="flex items-center justify-between text-white/50 text-[11px] font-slant px-2">
            <span className="flex items-center gap-1.5"><Signal size={12} /> 5G</span>
            <span className="flex items-center gap-1"><Lock size={13} className="text-white" /> TERKUNCI</span>
            <span className="flex items-center gap-1"><BatteryCharging size={13} className="text-emerald-400" /> 89%</span>
          </div>

          {/* Center Digital Clock */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-2">
            <div className="text-6xl font-slant text-white font-black tracking-widest drop-shadow-[0_0_24px_rgba(255,255,255,0.4)]">
              {lockScreenTime}
            </div>
            <p className="text-sm font-slant text-white/70 tracking-wider">
              {lockScreenDate}
            </p>
            
            <div className="mt-6 px-4 py-2 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md max-w-xs shadow-3d-bl">
              <p className="text-[10px] font-slant text-white/80 tracking-wide">
                ZE.PROJECT SECURE SYSTEM
              </p>
              <p className="text-[9px] text-white/50">
                Semua koneksi terenkripsi &amp; siap beroperasi
              </p>
            </div>
          </div>

          {/* Bottom Unlock Button */}
          <div className="pt-4">
            <button
              onClick={() => {
                setIsLockScreenOpen(false);
                setSelectedControlCard(null);
                showToast('Layar berhasil dibuka');
              }}
              className="mx-auto px-8 py-3.5 rounded-full border-2 border-white bg-white/10 hover:bg-white/20 active:scale-95 text-white font-slant text-xs tracking-widest shadow-3d-bl flex items-center justify-center gap-2 cursor-pointer transition backdrop-blur-md"
            >
              <LockOpen size={16} /> BUKA KUNCI LAYAR
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: KONFIRMASI RESET TARGET (GLASSMORPHISM STYLE)                */}
      {/* =================================================================== */}
      {showTargetResetConfirm && (
        <div className="fixed inset-0 z-[1000020] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0c0c0c]/90 border-2 border-white rounded-[32px] p-6 shadow-3d-bl text-center relative backdrop-blur-xl">
            <div className="w-14 h-14 rounded-full bg-red-500/15 border-2 border-red-400 mx-auto flex items-center justify-center text-red-400 mb-3 shadow-3d-bl">
              <RotateCcw size={26} className="animate-spin-once" />
            </div>

            <h3 className="font-slant text-base text-white tracking-wider">
              KONFIRMASI RESET TARGET
            </h3>

            <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
              Anda akan mengirimkan sinyal soft reboot ke perangkat target berikut:
            </p>

            {/* Target Summary Card inside Modal */}
            <div className="my-3.5 p-3 rounded-2xl bg-black/60 border border-white/20 text-left space-y-1 text-[10px] font-slant shadow-3d-bl">
              <div className="flex justify-between border-b border-white/10 pb-1">
                <span className="text-white/50">DEVICE NAME:</span>
                <span className="text-white font-medium truncate max-w-[170px]">
                  {simulatedDevice?.fullName || '-'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1">
                <span className="text-white/50">MODEL:</span>
                <span className="text-white font-medium truncate max-w-[170px]">
                  {simulatedDevice?.model || '-'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1">
                <span className="text-white/50">VERSI OS:</span>
                <span className="text-emerald-400 font-medium">
                  {simulatedDevice?.os || '-'}
                </span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-white/50">NOMOR TARGET:</span>
                <span className="text-white font-medium">
                  {targetInput || '-'}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-white/50">
              Pengaturan UI dan nomor target Anda akan tetap tersimpan.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-4">
              <button
                type="button"
                onClick={() => setShowTargetResetConfirm(false)}
                className="py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-slant text-xs cursor-pointer active:scale-95 transition"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleStartTargetReset}
                className="py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-slant text-xs active:scale-95 transition cursor-pointer shadow-3d-bl font-bold"
              >
                RESET TARGET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: PROSES RESET TARGET (ANIMASI PROGRES STEP-BY-STEP)           */}
      {/* =================================================================== */}
      {isResettingTarget && (
        <div className="fixed inset-0 z-[1000021] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0c0c0c] border-2 border-white rounded-[32px] p-6 shadow-3d-bl text-center">
            
            <div className="w-14 h-14 rounded-full bg-red-500/10 border-2 border-red-500 mx-auto flex items-center justify-center text-red-400 mb-4 shadow-3d-bl">
              <RotateCcw size={26} className={!targetResetDone ? 'animate-spin' : ''} />
            </div>

            <h3 className="font-slant text-base text-white tracking-wider">
              {!targetResetDone ? 'MEMPROSES RESET TARGET...' : 'RESET BERHASIL!'}
            </h3>

            <div className="my-2 px-2">
              <span className="text-[11px] font-slant text-white/80 block truncate">
                {simulatedDevice?.fullName}
              </span>
              <span className="text-[10px] font-slant text-emerald-400 block">
                TARGET: {targetInput}
              </span>
            </div>
            
            <p className="text-[11px] text-white/60 mt-1 min-h-[32px] px-2 font-sans">
              {targetResetStep}
            </p>

            {/* Progress bar */}
            <div className="w-full h-3 bg-black rounded-full overflow-hidden mt-4 border border-white/30 shadow-3d-bl p-[2px]">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-300"
                style={{ width: `${targetResetProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-white/50 font-slant mt-1 text-right">{targetResetProgress}%</p>

            {targetResetDone && (
              <button
                onClick={() => setIsResettingTarget(false)}
                className="w-full mt-5 py-3 rounded-full bg-white text-black font-slant text-xs hover:bg-white/90 active:scale-95 transition cursor-pointer shadow-3d-bl"
              >
                SELESAI &amp; TUTUP
              </button>
            )}

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: KONFIRMASI RESET (GLASSMORPHISM STYLE)                       */}
      {/* =================================================================== */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-[1000020] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0c0c0c]/90 border-2 border-white rounded-[32px] p-6 shadow-3d-bl text-center relative backdrop-blur-xl">
            <div className="w-14 h-14 rounded-full bg-red-500/15 border-2 border-red-400 mx-auto flex items-center justify-center text-red-400 mb-4 shadow-3d-bl">
              <RotateCcw size={26} className="animate-spin-once" />
            </div>

            <h3 className="font-slant text-base text-white tracking-wider">
              KONFIRMASI RESET
            </h3>

            <p className="text-[11px] text-white/70 mt-2 leading-relaxed">
              Apakah Anda yakin ingin mengatur ulang semua parameter kontrol, tampilan visual, dan data target ke nilai default?
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-5">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-slant text-xs cursor-pointer active:scale-95 transition"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={handleExecuteGlobalReset}
                className="py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-slant text-xs active:scale-95 transition cursor-pointer shadow-3d-bl font-bold"
              >
                YA, RESET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: TRANSMISSION STATUS ANIMATION                                */}
      {/* =================================================================== */}
      {isSendingBug && (
        <div className="fixed inset-0 z-[1000002] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0c0c0c] border-2 border-white rounded-[32px] p-6 shadow-3d-bl text-center">
            
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white mx-auto flex items-center justify-center text-white mb-4 shadow-3d-bl">
              <Send size={26} className={!sendDone ? 'animate-bounce' : ''} />
            </div>

            <h3 className="font-slant text-base text-white tracking-wider">
              {!sendDone ? 'MENGIRIM PAYLOAD...' : 'TRANSMISI SELESAI!'}
            </h3>

            <div className="my-2 px-2">
              <span className="text-[11px] font-slant text-white/70 block">
                TARGET: {targetInput}
              </span>
              <span className="text-[10px] font-slant text-white/50 block">
                TIPE: {selectedTargetType === 'group' ? 'BAN GRUB' : 'BUG NOMOR'} • {(selectedPayload || 'PAYLOAD').toUpperCase()}
              </span>
            </div>
            
            <p className="text-[11px] text-white/60 mt-1 min-h-[32px] px-2 font-sans">
              {sendStepText}
            </p>

            {/* Progress bar with 3D bottom-left shadow */}
            <div className="w-full h-3 bg-black rounded-full overflow-hidden mt-4 border border-white/30 shadow-3d-bl p-[2px]">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${sendProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-white/50 font-slant mt-1 text-right">{sendProgress}%</p>

            {sendDone && (
              <button
                onClick={() => setIsSendingBug(false)}
                className="w-full mt-5 py-3 rounded-full bg-white text-black font-slant text-xs hover:bg-white/90 active:scale-95 transition cursor-pointer shadow-3d-bl"
              >
                SELESAI &amp; TUTUP
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
