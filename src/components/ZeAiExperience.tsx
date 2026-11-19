import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  Terminal,
  Code2,
  Copy,
  Check,
  Lock,
  Crown,
  Trash2,
  Image as ImageIcon,
  X,
  Shield,
  Zap,
  Cpu,
  Layers,
  ChevronRight,
  RotateCcw,
  Activity,
  AlertTriangle,
  Bot,
  Volume2,
  VolumeX,
  Square,
  Loader2
} from 'lucide-react';
import { isUserOwner, isUserVipExclusive } from './UserRoleBadge.tsx';
import { AiACompanion, APinScreen, DEFAULT_A_AVATAR } from './AiACompanion.tsx';

export interface ZeAiMessage {
  id: string | number;
  sender: 'user' | 'ai' | 'system';
  text?: string;
  fullText?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaName?: string;
  time: string;
}

interface ZeAiExperienceProps {
  currentUser: any;
  onBack: () => void;
  onOpenVipStore?: () => void;
}

// --------------------------------------------------------------------------
// CODE & PROMPT BLOCK RENDERER WITH MONOSPACE & DEDICATED COPY BUTTONS
// --------------------------------------------------------------------------
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).catch(() => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const isPrompt = language.toLowerCase().includes('prompt');
  const btnLabel = copied
    ? 'TERSLIN ✓'
    : isPrompt
    ? 'SALIN PROMPT'
    : 'SALIN KODE';

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-zinc-800 bg-[#060608] shadow-2xl text-left">
      <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.03] border-b border-zinc-800 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Terminal size={13} className="text-red-500" />
          <span className="uppercase tracking-widest font-bold text-zinc-300">
            {language || 'SOURCE'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black flex items-center gap-1 transition-all cursor-pointer ${
            copied
              ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.8)]'
              : 'bg-white/10 hover:bg-white/20 text-white active:scale-95'
          }`}
        >
          {copied ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
          <span>{btnLabel}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[11px] font-mono leading-relaxed text-zinc-200 selection:bg-red-900/40 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// --------------------------------------------------------------------------
// PARSES MESSAGE TEXT AND RENDERS CODE BLOCKS + REGULAR PARAGRAPHS
// --------------------------------------------------------------------------
function RenderFormattedAiText({ text }: { text: string }) {
  if (!text) return null;

  // Split markdown code blocks: ```lang\ncode\n```
  const parts: React.ReactNode[] = [];
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`txt_${lastIndex}`} className="whitespace-pre-wrap">
          {text.substring(lastIndex, match.index)}
        </span>
      );
    }
    const lang = match[1] || 'code';
    const code = match[2];
    parts.push(
      <CodeBlock key={`code_${match.index}`} language={lang} code={code} />
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`txt_${lastIndex}`} className="whitespace-pre-wrap">
        {text.substring(lastIndex)}
      </span>
    );
  }

  return <div className="space-y-1">{parts}</div>;
}

// --------------------------------------------------------------------------
// SUDDEN VISUAL JUMPSCARE EFFECT (DARK AI ENTRY)
// Sudden, jarring visual shock (~600ms) with violent screen flicker & chromatic glitch.
// NO video intro, NO countdowns, NO loading text.
// --------------------------------------------------------------------------
function DarkAiJumpscareGlitch({ onComplete }: { onComplete: () => void }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    // Rapid shock strobe frames over ~600ms, then instant transition to Dark AI
    const t1 = setTimeout(() => setFrame(1), 40);
    const t2 = setTimeout(() => setFrame(2), 120);
    const t3 = setTimeout(() => setFrame(3), 220);
    const t4 = setTimeout(() => setFrame(4), 360);
    const t5 = setTimeout(() => setFrame(5), 480);
    const t6 = setTimeout(() => onComplete(), 620);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-[250] bg-black flex items-center justify-center overflow-hidden select-none cursor-pointer"
    >
      {/* Violent color strobe inversion */}
      <div
        className={`absolute inset-0 pointer-events-none transition-none ${
          frame % 2 === 1 ? 'bg-red-950/90 invert' : 'bg-black'
        }`}
      />

      {/* Screen glitch lines */}
      <div
        className="absolute inset-0 opacity-80 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(255,0,0,0.3) 0px, rgba(0,0,0,0.95) 2px, transparent 4px)',
          transform: frame === 2 ? 'translateX(14px) skewX(8deg)' : frame === 4 ? 'translateX(-12px) skewX(-6deg)' : 'none'
        }}
      />

      {/* Sudden distorted cyber skull glyph */}
      <div
        className={`relative z-10 transition-transform duration-75 flex flex-col items-center justify-center ${
          frame === 1
            ? 'scale-125 translate-x-3'
            : frame === 2
            ? 'scale-90 -translate-x-4 rotate-2'
            : frame === 3
            ? 'scale-150 translate-y-3 -rotate-2'
            : frame === 4
            ? 'scale-110 -translate-y-2'
            : 'scale-100'
        }`}
      >
        <div className="relative">
          <div className="text-red-600 font-mono font-black text-7xl sm:text-9xl tracking-widest blur-[3px] opacity-90 absolute -inset-1 flex items-center justify-center">
            ☠
          </div>
          <div className="text-cyan-400 font-mono font-black text-7xl sm:text-9xl tracking-widest blur-[1px] opacity-75 absolute inset-0.5 flex items-center justify-center">
            ☠
          </div>
          <div className="relative text-white font-mono font-black text-7xl sm:text-9xl tracking-widest drop-shadow-[0_0_50px_rgba(255,255,255,1)]">
            ☠
          </div>
        </div>

        <div className="w-72 sm:w-96 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent my-3 shadow-[0_0_25px_#ef4444]" />
      </div>

      {/* Red flashbang strobe */}
      <div className="absolute inset-0 bg-red-600/25 mix-blend-color-dodge pointer-events-none animate-pulse" />
    </div>
  );
}

// --------------------------------------------------------------------------
// MAIN COMPONENT: ZE AI EXPERIENCE (FEATURING ZE.IO NOT HUMAN)
// --------------------------------------------------------------------------
export function ZeAiExperience({
  currentUser,
  onBack,
  onOpenVipStore
}: ZeAiExperienceProps) {
  const [dbVipExclusive, setDbVipExclusive] = useState<boolean>(() => isUserVipExclusive(currentUser));
  const isOwner = isUserOwner(currentUser);
  const isExclusive = isUserVipExclusive(currentUser) || dbVipExclusive;
  const hasDarkAccess = isOwner || isExclusive;

  // Modes: 'selection' | 'opener' | 'standard' | 'dark' | 'a_pin' | 'a_chat'
  const [currentMode, setCurrentMode] = useState<'selection' | 'opener' | 'standard' | 'dark' | 'a_pin' | 'a_chat'>('selection');
  const [lockedModal, setLockedModal] = useState(false);

  // Verify authoritative VIP EKSKLUSIF status from server database
  useEffect(() => {
    const uid = currentUser?.id;
    if (!uid) return;
    let active = true;

    const verifyVipAccess = () => {
      fetch(`/api/auth/role/${encodeURIComponent(String(uid))}`)
        .then((r) => r.json())
        .then((data) => {
          if (!active || !data?.success) return;
          const granted = Boolean(
            data.isOwner ||
              (data.isVip && (data.isVipExclusive || data.vipLevel === 'exclusive'))
          );
          setDbVipExclusive(granted);
        })
        .catch(() => {});
    };

    const handleVipPurchased = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.isVipExclusive || detail?.vipLevel === 'exclusive') {
        setDbVipExclusive(true);
      } else {
        verifyVipAccess();
      }
    };

    verifyVipAccess();
    window.addEventListener('ze-vip-purchased', handleVipPurchased);
    window.addEventListener('ze-user-store-updated', verifyVipAccess);
    return () => {
      active = false;
      window.removeEventListener('ze-vip-purchased', handleVipPurchased);
      window.removeEventListener('ze-user-store-updated', verifyVipAccess);
    };
  }, [currentUser?.id, currentUser?.vipLevel, currentUser?.isVipExclusive, currentUser?.isVip]);

  // Automatically dismiss locked modal as soon as VIP EKSKLUSIF is unlocked
  useEffect(() => {
    if (hasDarkAccess && lockedModal) {
      setLockedModal(false);
    }
  }, [hasDarkAccess, lockedModal]);

  // Per-account chat history isolation:
  const getStorageKey = (mode: 'standard' | 'dark') => {
    const uId = currentUser?.id || 'guest';
    return `ze_ai_chat_history_${uId}_${mode}`;
  };

  const [activeChatMode, setActiveChatMode] = useState<'standard' | 'dark'>('standard');
  const [messages, setMessages] = useState<ZeAiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(false);
  const [activeVoiceMsgIds, setActiveVoiceMsgIds] = useState<Set<string | number>>(new Set());
  const playedAudioIdsRef = useRef<Set<string | number>>(new Set());
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    rawType: string;
    name: string;
  } | null>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);

  // Voice playback state & visible TTS debug status for ZE.ai Standard
  const [speakingMsgId, setSpeakingMsgId] = useState<string | number | null>(null);
  const [loadingTtsMsgId, setLoadingTtsMsgId] = useState<string | number | null>(null);
  const [ttsStatusMap, setTtsStatusMap] = useState<Record<string, string>>({});
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsBlobUrlRef = useRef<string | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const updateTtsStatus = (msgId: string | number, status: string) => {
    setTtsStatusMap((prev) => ({ ...prev, [String(msgId)]: status }));
  };

  const stopAiVoicePlayback = () => {
    if (ttsAbortRef.current) {
      ttsAbortRef.current.abort();
      ttsAbortRef.current = null;
    }
    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.currentTime = 0;
      } catch {}
      ttsAudioRef.current = null;
    }
    if (ttsBlobUrlRef.current) {
      URL.revokeObjectURL(ttsBlobUrlRef.current);
      ttsBlobUrlRef.current = null;
    }
    setSpeakingMsgId(null);
    setLoadingTtsMsgId(null);
  };

  // 1. FUNGSI PUSAT NORMALISASI PENGUCAPAN (SMART REGEX & DICTIONARY)
  const normalisasiTTS = (teks: string) => {
    let result = teks;

    result = result.replace(/\bsa-yang[\s-]*ku\b/gi, "sa ya eng ku");
    result = result.replace(/\bsa-yang\b/gi, "sa ya eng");

    // A. KAMUS PELAFALAN WAJIB (FIX AKUNG)
    // Aturan: 1. sayang -> sa ya eng, 2. sayang ku -> sa ya eng ku, 3. sayangku -> sa ya eng ku, 4. ayang -> sa ya eng
    const mandatoryDictionary: Record<string, string> = {
      "sayangku": "sa ya eng ku",
      "sayang ku": "sa ya eng ku",
      "sayang": "sa ya eng",
      "ayang": "sa ya eng",
    };

    // Terapkan kamus wajib dulu
    for (const [word, phonetic] of Object.entries(mandatoryDictionary)) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      result = result.replace(regex, phonetic);
    }

    // Tangkap variasi sisa dengan regex (sayanggg, ayanggg, dsb)
    result = result.replace(/\bs[ay]*ng+\b/gi, "sa ya eng");
    result = result.replace(/\ba[ay]*ng+\b/gi, "sa ya eng");

    // B. VARIASI BANGET (SOUNDS MORE MANJA)
    result = result.replace(/\bbgt\b/gi, "baanget");
    result = result.replace(/\bbanget+?\b/gi, (match) => {
      return match.length > 6 ? "baaaaanget" : "baanget";
    });

    // C. COMMON SLANGS & SHORT FORMS (MAPPING)
    const slangMap: Record<string, string> = {
      "\\bgw\\b": "gua",
      "\\bgue\\b": "gua",
      "\\blu\\b": "lu",
      "\\blo\\b": "lu",
      "\\bgk\\b": "nggak",
      "\\bgak\\b": "nggak",
      "\\bga\\b": "nggak",
      "\\budh\\b": "udah",
      "\\bjgn\\b": "jangan",
      "\\bklo\\b": "kalo",
      "\\bmksh\\b": "makasih",
      "\\bmks\\b": "makasih",
      "\\bgpp\\b": "nggak apa-apa",
      "\\botw\\b": "on the way",
    };

    for (const [pattern, replacement] of Object.entries(slangMap)) {
      result = result.replace(new RegExp(pattern, "gi"), replacement);
    }

    // D. FINAL SAFETY FOR "YANG" (Antisipasi sisa-sisa kata 'yang')
    result = result.replace(/\byang\b/gi, "ng");

    return result;
  };

  const handlePlayStandardAiVoice = async (msg: ZeAiMessage) => {
    const originalText = (msg.fullText || msg.text || '').trim();
    if (!originalText) return;

    // 1. BERSIHIN TEKS: hapus kode, link, emoji, dan simbol markdown
    const cleanText = originalText
      .replace(/```[\s\S]*?```/g, '') // hapus blok kode
      .replace(/`[^`]*?`/g, '')      // hapus inline kode
      .replace(/https?:\/\/\S+/g, '') // hapus link
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // hapus emoji
      .replace(/[*#_~]/g, '')        // hapus simbol format
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // 2. TRANSFORMATION: Formal -> Informal Jakarta Cewek style (Persona "Manja")
    let modifiedText = cleanText
      .replace(/Halo/gi, "Hai")
      .replace(/Saya/gi, "aku")
      .replace(/Anda/gi, "kamu")
      .replace(/Terima kasih/gi, "makasih yaa")
      .replace(/Maaf/gi, "maaf ya")
      .replace(/Ya/gi, "Iya")
      .replace(/Silahkan/gi, "boleh banget")
      .replace(/Mohon maaf/gi, "maaf yaa")
      .replace(/\?$/g, " nih? hehe")
      .replace(/\.$/g, " yaa..")
      ;

    if (modifiedText.toLowerCase().includes("tanya apa")) {
      modifiedText = modifiedText.replace(/tanya apa/gi, "tanya apa nih? hehe");
    }

    // 3. NORMALISASI PAKSA (FIX SAYANG)
    console.log("TTS TEKS SEBELUM NORMALISASI:", modifiedText);
    const normalizedText = normalisasiTTS(modifiedText);

    const rawSpoken = normalizedText.trim() + " hehe";
    console.log("TTS TEKS AKHIR (DIBACA):", rawSpoken);

    stopAiVoicePlayback();
    setLoadingTtsMsgId(msg.id);
    updateTtsStatus(msg.id, 'memuat...');

    const controller = new AbortController();
    ttsAbortRef.current = controller;

    try {
      const res = await fetch('/api/ze-ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawSpoken }),
        signal: controller.signal
      });

      if (res.status === 429) {
        setSpeakingMsgId(null);
        setLoadingTtsMsgId(null);
        updateTtsStatus(msg.id, 'limit abis');
        return;
      }

      if (!res.ok) throw new Error('TTS server error');

      const wavBlob = await res.blob();
      if (controller.signal.aborted) return;

      const audioUrl = URL.createObjectURL(wavBlob);
      ttsBlobUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      ttsAudioRef.current = audio;

      audio.onended = () => {
        setSpeakingMsgId(null);
        setLoadingTtsMsgId(null);
        updateTtsStatus(msg.id, 'selesai');
        if (ttsBlobUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          ttsBlobUrlRef.current = null;
        }
      };

      audio.onerror = () => {
        setSpeakingMsgId(null);
        setLoadingTtsMsgId(null);
        updateTtsStatus(msg.id, 'error');
      };

      setLoadingTtsMsgId(null);
      setSpeakingMsgId(msg.id);
      updateTtsStatus(msg.id, 'berbunyi');

      await audio.play().catch((err) => {
        console.warn('Autoplay blocked:', err);
        setSpeakingMsgId(null);
        updateTtsStatus(msg.id, 'tap to play');
      });
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setSpeakingMsgId(null);
        setLoadingTtsMsgId(null);
        updateTtsStatus(msg.id, 'limit abis');
      }
    }
  };

  const handleSpeakerClick = (msg: ZeAiMessage) => {
    if (speakingMsgId === msg.id) {
      stopAiVoicePlayback();
    } else {
      handlePlayStandardAiVoice(msg);
    }
  };


  // Load chat history when entering mode
  useEffect(() => {
    if (currentMode === 'standard' || currentMode === 'dark') {
      setActiveChatMode(currentMode);
      const key = getStorageKey(currentMode);
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
      } catch {}

      // Initial Welcome Message
      if (currentMode === 'dark') {
        setMessages([
          {
            id: 'init_not_human',
            sender: 'ai',
            text: `ZE.IO NOT HUMAN // TERMINAL INITIALIZED\n\nIdentitas aktif: ZE.IO NOT HUMAN. Kernel arsitektur siap melayani rekayasa perangkat lunak, arsitektur sistem, automasi, debugging mendalam, dan audit cybersecurity.\n\nKetik perintah, cantumkan spesifikasi kode, atau lampirkan log error untuk langsung dieksekusi.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages([
          {
            id: 'init_std',
            sender: 'ai',
            text: `Halo ${currentUser?.name || 'bro'}! Gue ZE AI, sahabat digital resmi lo di ZE.io. Mau ngobrol apa hari ini? Curhat, musik, fitur ZE.io, atau tanya apapun woles aja di sini!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    }
  }, [currentMode, currentUser?.id]);

  // Persist messages per account
  useEffect(() => {
    if (currentMode === 'standard' || currentMode === 'dark') {
      const key = getStorageKey(currentMode);
      try {
        localStorage.setItem(key, JSON.stringify(messages));
      } catch {}
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentMode]);

  const handleClearChat = () => {
    stopAiVoicePlayback();
    const key = getStorageKey(activeChatMode);
    localStorage.removeItem(key);
    if (activeChatMode === 'dark') {
      setMessages([
        {
          id: 'cleared_dark',
          sender: 'ai',
          text: 'ZE.IO NOT HUMAN // BUFFER CLEARED. Terminal siap menerima instruksi baru.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setMessages([
        {
          id: 'cleared_std',
          sender: 'ai',
          text: 'Riwayat obrolan telah dibersihkan. Mau ngobrol topik apa lagi kita bro?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleDeleteMessage = (msgId: string | number) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Ukuran file maksimal 15MB');
      return;
    }

    setIsProcessingMedia(true);
    const isVid = file.type.startsWith('video');
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedMedia({
        url: String(reader.result),
        type: isVid ? 'video' : 'image',
        rawType: file.type,
        name: file.name
      });
      setIsProcessingMedia(false);
    };
    reader.onerror = () => {
      setIsProcessingMedia(false);
      alert('Gagal membaca file gambar/video');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };



  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 0. BUKA KUNCI AUDIO (Bypass Mobile Restrictions)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    const text = inputText.trim();
    if (!text && !selectedMedia) return;

    // Check for /rw or /bug triggers
    if (text.startsWith('/rw') || text.startsWith('/bug')) {
      const parts = text.split(' ');
      const cmd = parts[0].toLowerCase();
      const keyArg = parts[1];

      const userMsg: ZeAiMessage = {
        id: 'usr_' + Date.now(),
        sender: 'user',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputText('');

      if (!keyArg) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'err_key_' + Date.now(),
            sender: 'ai',
            text: `Perintah ${cmd} memerlukan lisensi KEY. Format: \`${cmd} <KEY>\`\n\nContoh: \`${cmd} ZE-XXXX-XXXX-XXXX\`\nJika belum memiliki Key, dapatkan di menu **KEY STORE** keranjang belanja ZE.io.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      setIsAiTyping(true);
      try {
        const valRes = await fetch('/api/keys/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: keyArg, userId: currentUser?.id })
        });
        const valData = await valRes.json();
        setIsAiTyping(false);

        if (valData.success) {
          const typeLabel = valData.type === 'permanent' ? 'PERMANEN' : valData.type || 'AKTIF';
          setMessages((prev) => [
            ...prev,
            {
              id: 'suc_key_' + Date.now(),
              sender: 'ai',
              text: `KEY RESMI TERVERIFIKASI ✓\n\nLisensi: ${typeLabel}\nAkses fitur ${cmd.toUpperCase()} telah dibuka. Modul siap dijalankan.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          if (cmd === '/rw') {
            window.dispatchEvent(new Event('ze_open_rw'));
          } else if (cmd === '/bug') {
            window.dispatchEvent(new Event('ze_open_bug'));
          }
        } else {
          const isAlreadyUsedByOther =
            valData.code === 'KEY_ALREADY_USED' ||
            valData.error === 'KEY SUDAH DIGUNAKAN OLEH AKUN LAIN';
          setMessages((prev) => [
            ...prev,
            {
              id: 'fail_key_' + Date.now(),
              sender: 'ai',
              text: isAlreadyUsedByOther
                ? `KEY SUDAH DIGUNAKAN OLEH AKUN LAIN\n\nKey "${keyArg}" telah terikat permanen ke pemilik pertama dan tidak dapat diaktifkan pada akun ini.`
                : `AKSES DITOLAK [!]\n\nKey tidak valid atau sudah kedaluwarsa: "${keyArg}".\nAlasan: ${valData.error || 'Key tidak terdaftar'}.\nSilakan periksa kembali atau dapatkan Key resmi baru di Key Store.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch {
        setIsAiTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'net_key_' + Date.now(),
            sender: 'ai',
            text: 'Gagal memvalidasi key ke server. Periksa koneksi internet Anda.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
      return;
    }

    if (isAiTyping) return;

    const currentMedia = selectedMedia;
    const userText = text || '';

    // 1. LANGSUNG BIKIN OBJECT PESAN USER DAN RENDER SEKETIKA
    const userMsg: ZeAiMessage = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      sender: 'user',
      text: userText || undefined,
      mediaUrl: currentMedia?.url,
      mediaType: currentMedia?.type,
      mediaName: currentMedia?.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputText('');
    setSelectedMedia(null);
    setIsAiTyping(true);

    console.log("KIRIM:", userText);

    try {
      // 2. KIRIM HISTORY TERBARU DARI STATE BARU (nextMessages)
      console.log("HISTORY DIKIRIM:", nextMessages);

      const response = await fetch('/api/ze-ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ze-actor-id': currentUser?.id || 'anonymous'
        },
        body: JSON.stringify({
          message: userText,
          mode: activeChatMode,
          mediaData: currentMedia?.url,
          mediaType: currentMedia?.rawType,
          history: nextMessages.slice(-14).map((m) => ({
            sender: m.sender,
            text: (m.fullText || m.text || '').slice(0, 1500)
          }))
        })
      });

      const data = await response.json();
      // 3. JIKA GEMINI GAGAL / ERROR, TAMPILKAN ERROR ASLI TANPA BALASAN PALSU
      const fullReply = String(data?.reply || '').trim() || "gemini error: Empty response from server";
      console.log("BALASAN GEMINI:", fullReply);

      const aiMsgId = 'ai_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const aiMsg: ZeAiMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: fullReply,
        fullText: fullReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // RENDER BALASAN AI SEKETIKA DENGAN TEKS UTUH
      setMessages((prev) => [...prev, aiMsg]);

      // 4. PUTAR OTOMATIS (Hanya di ZE AI Standard jika VOICE ON)
      if (activeChatMode === 'standard' && autoPlayEnabled) {
        setTimeout(() => handlePlayStandardAiVoice(aiMsg), 300);
      }
    } catch (err: any) {
      console.error("ERROR CHAT:", err);
      const errReply = `gemini error: ${String(err?.message || err || 'Network error')}`;
      const aiMsgId = 'ai_' + Date.now();
      const aiMsg: ZeAiMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: errReply,
        fullText: errReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);

      // 4. PUTAR OTOMATIS (Bahkan saat Error jika VOICE ON)
      if (activeChatMode === 'standard' && autoPlayEnabled) {
        setTimeout(() => handlePlayStandardAiVoice(aiMsg), 300);
      }
    } finally {
      // JANGAN KUNCI TOMBOL / ISLOADING SELAMANYA
      setIsAiTyping(false);
    }
  };

  // 1. JUMPSCARE SHOCK SCREEN: DARK AI
  if (currentMode === 'opener') {
    return (
      <DarkAiJumpscareGlitch
        onComplete={() => {
          setCurrentMode('dark');
        }}
      />
    );
  }

  // 1B. A! PIN SCREEN & A! COMPANION CHAT
  if (currentMode === 'a_pin') {
    return (
      <APinScreen
        onUnlock={() => setCurrentMode('a_chat')}
        onReturnToHub={() => setCurrentMode('selection')}
      />
    );
  }

  if (currentMode === 'a_chat') {
    return (
      <AiACompanion
        currentUser={currentUser}
        onBackToHub={() => setCurrentMode('selection')}
        onCloseAll={onBack}
      />
    );
  }

  // 2. SELECTION SCREEN: Choose Standard vs ZE.IO NOT HUMAN
  if (currentMode === 'selection') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col ze-solid-menu-page overflow-y-auto">
        {/* Top Bar */}
        <div className="px-4 py-3.5 ze-solid-header flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl ze-solid-subcard flex items-center justify-center text-white hover:border-[#4b5563] transition cursor-pointer active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-white" />
              <h1 className="text-base font-extrabold text-white tracking-wide">
                ZE.ai HUB
              </h1>
            </div>
          </div>
          <button
            onClick={onBack}
            className="text-xs font-bold px-3 py-1.5 rounded-xl ze-solid-subcard text-white hover:border-[#4b5563] cursor-pointer"
          >
            Tutup
          </button>
        </div>

        {/* Mode Selector Content */}
        <div className="flex-1 max-w-lg mx-auto w-full p-4 sm:p-6 space-y-5 flex flex-col justify-center">
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto shadow-xl">
              <Terminal size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Pilih Antarmuka AI ZE.io
            </h2>
            <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
              Pilih asisten digital percakapan kasual atau sistem terminal rekayasa perangkat lunak ZE.IO NOT HUMAN.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* OPTION 1: ZE.ai Standard */}
            <div
              onClick={() => setCurrentMode('standard')}
              className="group p-5 rounded-3xl ze-solid-card hover:border-[#4b5563] cursor-pointer transition active:scale-[0.99] relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                    <Bot size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">
                        ZE.ai Standard
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        GRATIS
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      Asisten cerdas komunikatif untuk percakapan santai, tanya jawab umum, dan panduan fitur ZE.io.
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-400 group-hover:text-white shrink-0 mt-3" />
              </div>
            </div>

            {/* OPTION 2: ZE.IO NOT HUMAN (DARK AI) */}
            <div
              onClick={() => {
                if (hasDarkAccess) {
                  setCurrentMode('opener');
                } else {
                  setLockedModal(true);
                }
              }}
              className={`group p-5 rounded-3xl border transition cursor-pointer relative overflow-hidden ${
                hasDarkAccess
                  ? 'bg-gradient-to-br from-[#060608] via-zinc-950 to-[#120507] border-red-900/60 shadow-[0_0_25px_rgba(153,27,27,0.25)] hover:border-red-600'
                  : 'bg-black/80 border-zinc-900 opacity-80 hover:border-amber-400/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#090a0f] border border-red-800/60 flex items-center justify-center text-red-400 shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                    <Terminal size={24} className="text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-white tracking-wide font-mono">
                        ZE.IO NOT HUMAN
                      </h3>
                      {hasDarkAccess ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-950/60 text-red-300 border border-red-800/60 flex items-center gap-1 font-mono">
                          <Shield size={10} className="text-red-400" />
                          CYBER CORE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1">
                          <Lock size={10} />
                          VIP EKSKLUSIF
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      Sistem Terminal Rekayasa &amp; Cybersecurity Tingkat Lanjut. Rekayasa perangkat lunak, bot/skrip, APK/Web, debugging, dan audit keamanan sistem.
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-400 group-hover:text-white shrink-0 mt-3" />
              </div>
            </div>

            {/* OPTION 3: A! (LOCKED - PIN) */}
            <div
              onClick={() => setCurrentMode('a_pin')}
              className="group p-5 rounded-3xl border bg-gradient-to-br from-[#0d0914] via-zinc-950 to-[#18091b] border-pink-500/60 hover:border-purple-400 shadow-[0_0_24px_rgba(236,72,153,0.2)] cursor-pointer transition active:scale-[0.99] relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-12 h-12 rounded-2xl bg-[#160b20] border border-pink-500/50 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                    <img
                      src={DEFAULT_A_AVATAR}
                      alt="A!"
                      className="w-full h-full object-cover object-top opacity-75"
                    />
                    <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-base">
                      🔒
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-white">
                        A!
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-200 border border-purple-400/40 flex items-center gap-1">
                        <span>🔒</span>
                        <span>LOCKED - PIN</span>
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      Asisten personal dengan ekspresi, bubble custom, suara, call, dan voice note. Butuh PIN untuk masuk.
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-400 group-hover:text-white shrink-0 mt-3" />
              </div>
            </div>
          </div>
        </div>

        {/* LOCKED MODAL FOR NON-VIP EKSKLUSIF */}
        {lockedModal && (
          <div
            className="fixed inset-0 z-[160] ze-solid-modal-backdrop flex items-center justify-center p-4"
            onClick={() => setLockedModal(false)}
          >
            <div
              className="max-w-sm w-full ze-solid-card rounded-3xl p-6 text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#78350f] border border-[#f59e0b] mx-auto flex items-center justify-center text-amber-200 shadow-xl">
                <Lock size={26} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Akses Terkunci — Khusus VIP EKSKLUSIF &amp; OWNER
                </h3>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  <b>ZE.IO NOT HUMAN</b> dilengkapi engine programming &amp; cybersecurity elit tingkat lanjut. Upgrade ke <b>VIP EKSKLUSIF</b> untuk membuka akses penuh.
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setLockedModal(false);
                    onOpenVipStore?.();
                  }}
                  className="w-full py-3 rounded-2xl bg-white text-black font-extrabold text-xs shadow-lg cursor-pointer hover:bg-zinc-200 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Crown size={15} />
                  <span>Buka VIP Store (130.000 Diamond+)</span>
                </button>
                <button
                  onClick={() => setLockedModal(false)}
                  className="w-full py-2.5 rounded-2xl ze-solid-subcard text-white text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. CHAT ROOM (STANDARD OR ZE.IO NOT HUMAN)
  const isDarkMode = currentMode === 'dark';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col ${
        isDarkMode
          ? 'bg-[#040406] text-white font-mono selection:bg-red-900/60 selection:text-white'
          : 'ze-solid-menu-page text-white'
      }`}
    >
      {/* Top Header */}
      {/* Top Header */}
      <div
        className={`px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 border-b shrink-0 ${
          isDarkMode
            ? 'bg-black/95 border-red-950/60 shadow-[0_4px_30px_rgba(0,0,0,0.9)]'
            : 'ze-solid-header border-white/10'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
          <button
            onClick={() => setCurrentMode('selection')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition cursor-pointer active:scale-95 ${
              isDarkMode
                ? 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white'
                : 'ze-solid-subcard text-white hover:border-[#4b5563]'
            }`}
            title="Pilih Mode"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 overflow-hidden">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow ${
                isDarkMode
                  ? 'bg-black border border-red-900 text-red-500'
                  : 'ze-solid-subcard text-white'
              }`}
            >
              {isDarkMode ? <Terminal size={18} /> : <Bot size={18} />}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
                <h2 className={`text-xs sm:text-sm font-black tracking-tight whitespace-nowrap overflow-hidden text-ellipsis leading-tight ${isDarkMode ? 'text-white font-mono' : 'text-white'}`}>
                  {isDarkMode ? 'ZE.IO NOT HUMAN' : 'ZE.ai Standard'}
                </h2>
                {isDarkMode ? (
                  <span className="shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-900 whitespace-nowrap">
                    ARMED
                  </span>
                ) : autoPlayEnabled ? (
                  <span className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5 whitespace-nowrap">
                    <Volume2 size={9} />
                    VOICE ON
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] text-zinc-400 font-mono whitespace-nowrap overflow-hidden text-ellipsis leading-tight mt-0.5">
                {isDarkMode ? 'ROOT_CORE // OVERSEC' : `@${currentUser?.username || currentUser?.id}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!isDarkMode && (
            <button
              onClick={() => setAutoPlayEnabled((prev) => !prev)}
              className={`px-2 py-1.5 rounded-lg border text-[10px] flex items-center gap-1 transition cursor-pointer shrink-0 ${
                autoPlayEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'ze-solid-subcard text-white/50 border-white/10'
              }`}
              title={autoPlayEnabled ? 'Voice Mode: Aktif' : 'Voice Mode: Nonaktif'}
            >
              {autoPlayEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span className="hidden sm:inline font-mono">Voice</span>
            </button>
          )}
          {/* Replay Intro button for ZE.IO NOT HUMAN */}
          {isDarkMode && (
            <button
              onClick={() => setCurrentMode('opener')}
              className="w-8 h-8 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
              title="Putar Ulang Intro"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Intro</span>
            </button>
          )}
          <button
            onClick={handleClearChat}
            className="w-8 h-8 rounded-lg ze-solid-subcard flex items-center justify-center text-zinc-300 hover:text-rose-400 transition cursor-pointer shrink-0"
            title="Bersihkan Percakapan"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onBack}
            className="text-xs font-bold px-3 py-1.5 rounded-xl ze-solid-subcard text-white hover:border-[#4b5563] cursor-pointer shrink-0 w-auto whitespace-nowrap"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Terminal Status Panel (ZE.IO NOT HUMAN ONLY) */}
      {isDarkMode && (
        <div className="px-4 py-1.5 bg-black/90 border-b border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono tracking-wider shrink-0 overflow-x-auto">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              STATUS: SECURE_CHANNEL
            </span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline text-zinc-400">ARCH: x86_64_LINUX</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">ENGINE: GEMINI_FLASH_V3</span>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((m) => {
          const isMe = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 shadow-xl relative ${
                  isMe
                    ? isDarkMode
                      ? 'bg-zinc-900 text-white rounded-br-none border border-zinc-800'
                      : 'bg-white text-[#0d0f14] font-semibold rounded-br-none'
                    : isDarkMode
                    ? 'bg-[#08090d] text-zinc-100 rounded-bl-none border border-red-950/70 shadow-[0_0_20px_rgba(0,0,0,0.8)]'
                    : 'ze-solid-card text-white rounded-bl-none'
                }`}
              >
                {/* Attached media */}
                {m.mediaUrl && (
                  <div className="mb-2.5 rounded-2xl overflow-hidden bg-black/60 border border-white/10">
                    {m.mediaType === 'video' ? (
                      <video
                        src={m.mediaUrl}
                        controls
                        className="w-full max-h-60 object-contain rounded-2xl"
                      />
                    ) : (
                      <img
                        src={m.mediaUrl}
                        alt="Media"
                        className="w-full max-h-64 object-contain rounded-2xl bg-zinc-950"
                      />
                    )}
                  </div>
                )}

                {/* Formatted Text with Code Blocks & Copy Buttons */}
                <div className="text-xs sm:text-sm leading-relaxed">
                  <RenderFormattedAiText text={m.text || ''} />
                </div>

                {/* Time, Voice Speaker (Standard AI Only) & Delete Button */}
                <div className="flex items-center justify-between gap-2 mt-2.5 pt-1.5 border-t border-white/10 text-[10px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="opacity-60">{m.time}</span>
                    {!isMe && !isDarkMode && Boolean((m.fullText || m.text || '').trim()) && (
                      <button
                        type="button"
                        onClick={() => handleSpeakerClick(m)}
                        disabled={loadingTtsMsgId === m.id}
                        className={`px-3 py-1 rounded-full border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                          speakingMsgId === m.id
                            ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse'
                            : 'bg-white/[0.07] border-white/15 text-zinc-200 hover:bg-white/15'
                        } ${loadingTtsMsgId === m.id ? 'opacity-50 cursor-wait' : ''}`}
                        title="Putar Suara AI"
                      >
                        {loadingTtsMsgId === m.id ? (
                          <Loader2 size={12} className="shrink-0 animate-spin" />
                        ) : (
                          <Volume2 size={12} className="shrink-0" />
                        )}
                        <span className="text-[9px] font-bold uppercase tracking-tighter">
                          {speakingMsgId === m.id ? 'BERBUNYI' : loadingTtsMsgId === m.id ? 'MEMUAT...' : 'PUTAR'}
                        </span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteMessage(m.id)}
                    className="opacity-60 hover:opacity-100 hover:text-rose-400 transition cursor-pointer"
                    title="Hapus pesan"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {isAiTyping && (
          <div className="flex justify-start">
            <div
              className={`rounded-xl px-4 py-2.5 text-xs font-mono flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-black border border-red-950 text-red-400'
                  : 'ze-solid-card text-zinc-200'
              }`}
            >
              <Activity size={14} className={`animate-spin ${isDarkMode ? 'text-red-500' : 'text-blue-400'}`} />
              <span>{isDarkMode ? '_█ PROCESSING_STREAM...' : 'ZE AI sedang merespons...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview before Sending */}
      {selectedMedia && (
        <div className="p-2.5 max-w-2xl mx-auto w-full px-4">
          <div className="p-2.5 rounded-2xl ze-solid-card border border-white/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {selectedMedia.type === 'video' ? (
                <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center border border-white/20 text-xs">
                  VIDEO
                </div>
              ) : (
                <img
                  src={selectedMedia.url}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-white/20"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {selectedMedia.name}
                </p>
                <p className="text-[10px] text-zinc-400">Siap dianalisis</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedMedia(null)}
              className="w-7 h-7 rounded-lg ze-solid-subcard flex items-center justify-center text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div
        className={`p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t shrink-0 ${
          isDarkMode
            ? 'bg-black border-zinc-900'
            : 'ze-solid-header border-white/10'
        }`}
      >
        <form
          onSubmit={handleSend}
          className="max-w-2xl mx-auto flex items-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingMedia}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition cursor-pointer shrink-0 ${
              isDarkMode
                ? 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                : 'ze-solid-subcard text-zinc-300 hover:text-white'
            }`}
            title="Unggah File / Screenshot Kode"
          >
            <ImageIcon size={18} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isDarkMode
                ? 'Ketik instruksi kode, audit cybersec, atau /rw /bug...'
                : 'Tanya ZE AI apa saja atau ketik /rw /bug...'
            }
            className={`flex-1 rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none transition ${
              isDarkMode
                ? 'bg-zinc-950/80 border border-zinc-800 text-white placeholder-zinc-600 focus:border-red-600 font-mono'
                : 'ze-solid-input text-white'
            }`}
          />

          {/* White Paper Plane Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && !selectedMedia}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-40 ${
              isDarkMode
                ? 'bg-white hover:bg-zinc-200 text-black font-black shadow-lg active:scale-95'
                : 'bg-white text-black font-black hover:bg-zinc-200'
            }`}
            title="Kirim Instruksi"
          >
            <Send size={16} className="text-black" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ZeAiExperience;
