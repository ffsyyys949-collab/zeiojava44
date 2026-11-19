import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  Delete,
  Image as ImageIcon,
  Loader2,
  Lock,
  Mic,
  MicOff,
  Palette,
  Pause,
  Phone,
  PhoneOff,
  Play,
  Send,
  Settings,
  Square,
  Trash2,
  Upload,
  Volume2,
  X
} from 'lucide-react';
import {
  ACharacterArt,
  analyzeAutoVisualState,
  preloadZeyaPoseImages,
  type AGesture
} from './ACharacterArt.tsx';
import {
  getEstimatedVoiceCacheCount,
  getPersistedCustomVoiceEmbedding,
  getPersistedVoicePrefs,
  getVoiceCacheCount,
  getVoiceQuotaState,
  preloadLocalVoiceAssets,
  savePersistedCustomVoiceEmbedding,
  savePersistedVoicePrefs,
  stopAllUnifiedVoice,
  speakWithUnifiedVoice,
  subscribeVoiceStateUpdates,
  type PersistedVoicePrefs,
  type VoiceMode,
  type VoiceQuotaState
} from '../lib/voice.ts';

export const DEFAULT_A_AVATAR =
  '/assets/aistudio/7741a2f2268b0c1a726851829218cce6_8fa525c6.jpg';

const LEGACY_OLD_AVATAR_SUBSTR = 'IMG_b4c25b86-a1c4-4712-9ab2-40c765fd572f';

export type AExpression =
  | 'senang'
  | 'sedih'
  | 'malu'
  | 'bingung'
  | 'semangat'
  | 'ngantuk'
  | 'kaget'
  | 'ngambek lucu'
  | 'marah';

export type ASafePose =
  | 'berdiri'
  | 'duduk'
  | 'jongkok'
  | 'peluk'
  | 'jalan santai'
  | 'pake hoodie'
  | 'pake topi'
  | 'pake kacamata'
  | 'pake jaket'
  | 'minum'
  | 'tidur'
  | 'tiduran'
  | 'tiduran dengan baju lengkap dan sopan';

export type ABubbleStyle =
  | 'default'
  | 'whee-sketch'
  | 'bubbly-otter'
  | 'glam-diva'
  | 'custom';

export type ABgTheme =
  | 'blue-stars'
  | 'midnight-navy'
  | 'pink-night'
  | 'aurora-purple'
  | 'custom';

export interface CustomVoiceEmbedding {
  id: string;
  baseVoiceName: string;
  stylePrompt: string;
  pitchHz: number;
  brightness: number;
  energy: number;
  cadence: number;
  playbackRate: number;
  summary: string;
  sourceLabel?: string;
  createdAt: number;
}

export interface ACompanionSettings {
  aiName: string;
  avatarUrl: string;
  bgTheme: ABgTheme;
  customBgColor: string;
  bubbleStyle: ABubbleStyle;
  customAiBubbleColor: string;
  customUserBubbleColor: string;
  voiceId: string; // 'ze-standard' or 'custom-voice'
  customVoiceEmbedding?: CustomVoiceEmbedding | null;
  customPrompt: string;
  adultMode18Plus?: boolean;
}

export interface ACompanionState {
  posisi: ASafePose;
  ekspresi: AExpression;
  headbandRemoved: boolean;
  hatOn?: boolean;
  glassesOn?: boolean;
  hoodieOn?: boolean;
  jacketOn?: boolean;
  drinkOn?: boolean;
  lastGesture?: AGesture;
  lastVariant?: number;
}

const DEFAULT_A_STATE: ACompanionState = {
  posisi: 'berdiri',
  ekspresi: 'senang',
  headbandRemoved: false,
  hatOn: false,
  glassesOn: false,
  hoodieOn: false,
  jacketOn: false,
  drinkOn: false,
  lastGesture: 'dadah',
  lastVariant: 0
};

export interface ACompanionMessage {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  expression?: AExpression;
  pose?: ASafePose;
  gesture?: AGesture;
  poseVariant?: number;
  headbandRemoved?: boolean;
  hatOn?: boolean;
  glassesOn?: boolean;
  hoodieOn?: boolean;
  jacketOn?: boolean;
  drinkOn?: boolean;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  isVoiceNote?: boolean;
  time: string;
}

function enforceHyphenatedSayang(text: string): string {
  return String(text || '')
    .replace(/\bsayang+[\s-]*ku+\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Sa-yang ku' : 'sa-yang ku'))
    .replace(/\bsayang+\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Sa-yang' : 'sa-yang'));
}

function stripALabelTags(text: string): string {
  return String(text || '')
    .replace(/\[Label:[\s\S]*?\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const DEFAULT_A_SETTINGS: ACompanionSettings = {
  aiName: 'A!',
  avatarUrl: DEFAULT_A_AVATAR,
  bgTheme: 'blue-stars',
  customBgColor: '#123884',
  bubbleStyle: 'default',
  customAiBubbleColor: '#ffffff',
  customUserBubbleColor: '#ec4899',
  voiceId: getPersistedVoicePrefs().voiceId || 'ze-standard',
  customVoiceEmbedding: getPersistedCustomVoiceEmbedding(),
  customPrompt: '',
  adultMode18Plus: false
};

function formatDurationSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function compressImageDataUrl(file: File, maxSide = 720, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca gambar'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(String(reader.result));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function encodeMono16kWavDataUrl(samples: Float32Array, srcSampleRate: number): string {
  const targetRate = 16000;
  const maxSamplesSrc = Math.min(samples.length, srcSampleRate * 8);
  const ratio = srcSampleRate / targetRate;
  const outLength = Math.max(1, Math.floor(maxSamplesSrc / ratio));
  const pcmBuffer = new ArrayBuffer(44 + outLength * 2);
  const view = new DataView(pcmBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + outLength * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, outLength * 2, true);

  for (let i = 0; i < outLength; i++) {
    const srcIdx = Math.min(maxSamplesSrc - 1, Math.floor(i * ratio));
    const clamped = Math.max(-1, Math.min(1, samples[srcIdx] || 0));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  const bytes = new Uint8Array(pcmBuffer);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function measureAcousticMetricsFromPcm(samples: Float32Array, sampleRate: number) {
  const maxCheck = Math.min(samples.length, sampleRate * 8);
  const frameSize = 1024;
  const pitchEstimates: number[] = [];
  let totalEnergy = 0;
  let totalZcr = 0;
  let activeFrames = 0;
  let syllabicPeaks = 0;
  let prevRms = 0;

  for (let start = 0; start + frameSize < maxCheck; start += frameSize) {
    let rmsSum = 0;
    let zc = 0;
    for (let i = 0; i < frameSize; i++) {
      const s = samples[start + i];
      rmsSum += s * s;
      if (i > 0 && ((s >= 0 && samples[start + i - 1] < 0) || (s < 0 && samples[start + i - 1] >= 0))) {
        zc += 1;
      }
    }
    const rms = Math.sqrt(rmsSum / frameSize);
    if (rms > 0.015) {
      activeFrames += 1;
      totalEnergy += rms;
      totalZcr += zc / frameSize;
      if (rms > prevRms * 1.35 && prevRms > 0.01) {
        syllabicPeaks += 1;
      }

      // Simple autocorrelation F0 in human range (80Hz - 360Hz)
      const minLag = Math.floor(sampleRate / 360);
      const maxLag = Math.min(frameSize - 1, Math.floor(sampleRate / 80));
      let bestLag = 0;
      let bestCorr = 0;
      for (let lag = minLag; lag <= maxLag; lag++) {
        let corr = 0;
        for (let i = 0; i < frameSize - lag; i += 2) {
          corr += samples[start + i] * samples[start + i + lag];
        }
        if (corr > bestCorr) {
          bestCorr = corr;
          bestLag = lag;
        }
      }
      if (bestLag > 0) {
        pitchEstimates.push(sampleRate / bestLag);
      }
    }
    prevRms = rms;
  }

  pitchEstimates.sort((a, b) => a - b);
  const medianPitch =
    pitchEstimates.length > 0
      ? Math.round(pitchEstimates[Math.floor(pitchEstimates.length / 2)])
      : 185;
  const activeSec = Math.max(0.5, (activeFrames * frameSize) / sampleRate);
  const avgEnergy = activeFrames > 0 ? Math.min(1, (totalEnergy / activeFrames) * 5) : 0.45;
  const avgBrightness =
    activeFrames > 0 ? Math.min(1, Math.max(0.15, (totalZcr / activeFrames) * 6)) : 0.5;
  const cadence = Number(Math.min(1.3, Math.max(0.8, syllabicPeaks / (activeSec * 3.5))).toFixed(2));

  return {
    pitchHz: Math.max(85, Math.min(350, medianPitch)),
    brightness: Number(avgBrightness.toFixed(2)),
    energy: Number(avgEnergy.toFixed(2)),
    cadence
  };
}

async function extractVoiceAudioForEmbedding(
  fileOrBlob: Blob
): Promise<{
  audioDataUrl: string;
  mimeType: string;
  metrics: { pitchHz: number; brightness: number; energy: number; cadence: number };
}> {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioCtx) {
    const ctx = new AudioCtx();
    try {
      const arrayBuf = await fileOrBlob.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
      const ch0 = decoded.getChannelData(0);
      const metrics = measureAcousticMetricsFromPcm(ch0, decoded.sampleRate);
      const wavDataUrl = encodeMono16kWavDataUrl(ch0, decoded.sampleRate);
      await ctx.close().catch(() => {});
      return {
        audioDataUrl: wavDataUrl,
        mimeType: 'audio/wav',
        metrics
      };
    } catch {
      await ctx.close().catch(() => {});
    }
  }

  // Fallback for audio containers if browser decodeAudioData rejects
  const rawType = (fileOrBlob.type || 'audio/mp3').split(';')[0].trim().toLowerCase();
  const isAudioContainer = rawType.startsWith('audio/') && fileOrBlob.size <= 10 * 1024 * 1024;
  if (!isAudioContainer) {
    return {
      audioDataUrl: '',
      mimeType: rawType || 'audio/wav',
      metrics: { pitchHz: 185, brightness: 0.5, energy: 0.5, cadence: 1.0 }
    };
  }

  const fallbackDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca file suara'));
    reader.readAsDataURL(fileOrBlob);
  });

  return {
    audioDataUrl: fallbackDataUrl,
    mimeType: rawType || 'audio/mp3',
    metrics: { pitchHz: 185, brightness: 0.5, energy: 0.5, cadence: 1.0 }
  };
}

// --------------------------------------------------------------------------
// CHARACTER EXPRESSION & SAFE POSE VISUAL COMPOSITOR (PRESERVES SAME FACE)
// --------------------------------------------------------------------------
function AExpressionPortrait({
  avatarUrl,
  expression,
  pose,
  aiName
}: {
  avatarUrl: string;
  expression: AExpression;
  pose: ASafePose;
  aiName: string;
}) {
  const exprConfig: Record<
    AExpression,
    {
      filter: string;
      imgClass: string;
      tint: string;
      badgeBg: string;
      sticker: string;
    }
  > = {
    senang: {
      filter: 'brightness(1.06) saturate(1.12)',
      imgClass: 'scale-[1.03]',
      tint: 'from-pink-400/15 via-transparent to-amber-300/15',
      badgeBg: 'bg-pink-500/85 text-white',
      sticker: '✨😊'
    },
    sedih: {
      filter: 'brightness(0.88) saturate(0.78) hue-rotate(-6deg)',
      imgClass: 'scale-[1.01] translate-y-0.5',
      tint: 'from-sky-900/30 via-transparent to-indigo-950/35',
      badgeBg: 'bg-sky-600/85 text-white',
      sticker: '💧🥺'
    },
    malu: {
      filter: 'brightness(1.04) saturate(1.18)',
      imgClass: 'scale-[1.04] -rotate-1',
      tint: 'from-rose-500/20 via-pink-400/10 to-rose-500/20',
      badgeBg: 'bg-rose-500/85 text-white',
      sticker: '💗😳'
    },
    bingung: {
      filter: 'brightness(1.0) contrast(1.04)',
      imgClass: 'scale-[1.03] rotate-2',
      tint: 'from-amber-400/10 via-transparent to-purple-500/15',
      badgeBg: 'bg-amber-500/90 text-black',
      sticker: '❓🤔'
    },
    semangat: {
      filter: 'brightness(1.1) contrast(1.08) saturate(1.22)',
      imgClass: 'scale-[1.06] -translate-y-0.5',
      tint: 'from-amber-300/20 via-transparent to-pink-400/20',
      badgeBg: 'bg-amber-400 text-black',
      sticker: '⚡🌟'
    },
    ngantuk: {
      filter: 'brightness(0.84) saturate(0.85) sepia(0.1)',
      imgClass: 'scale-[1.01] translate-y-1',
      tint: 'from-indigo-950/40 via-slate-900/15 to-purple-950/35',
      badgeBg: 'bg-indigo-600/85 text-white',
      sticker: '💤😴'
    },
    kaget: {
      filter: 'brightness(1.12) contrast(1.12)',
      imgClass: 'scale-[1.09]',
      tint: 'from-cyan-400/15 via-transparent to-rose-400/15',
      badgeBg: 'bg-cyan-500 text-black',
      sticker: '❗😲'
    },
    'ngambek lucu': {
      filter: 'brightness(1.02) saturate(1.16)',
      imgClass: 'scale-[1.04] -rotate-2',
      tint: 'from-red-500/20 via-transparent to-pink-500/20',
      badgeBg: 'bg-rose-600/90 text-white',
      sticker: '💢😤'
    },
    marah: {
      filter: 'brightness(1.0) contrast(1.1) saturate(1.2)',
      imgClass: 'scale-[1.05]',
      tint: 'from-red-600/25 via-transparent to-orange-500/20',
      badgeBg: 'bg-red-600/90 text-white',
      sticker: '😠💢'
    }
  };

  const cfg = exprConfig[expression] || exprConfig.senang;
  const isLyingSafe =
    pose === 'tiduran' ||
    pose === 'tidur' ||
    pose === 'tiduran dengan baju lengkap dan sopan';

  return (
    <div className="mt-2.5 space-y-1.5">
      <div
        className={`relative w-44 sm:w-48 h-48 sm:h-52 rounded-2xl overflow-hidden border border-white/25 shadow-[0_8px_20px_rgba(0,0,0,0.45)] bg-slate-900 select-none ${
          isLyingSafe ? 'ring-2 ring-indigo-300/40' : pose === 'peluk' ? 'ring-2 ring-pink-400/60' : ''
        }`}
      >
        <img
          src={avatarUrl || DEFAULT_A_AVATAR}
          alt={`${aiName} - ${expression}`}
          style={{ filter: cfg.filter }}
          className={`w-full h-full object-cover object-top transition-transform duration-300 ${
            isLyingSafe
              ? 'rotate-[8deg] scale-110 translate-y-2'
              : pose === 'peluk'
              ? 'scale-[1.12] -translate-y-1'
              : cfg.imgClass
          }`}
        />

        {/* Expression Atmosphere Tint */}
        <div className={`absolute inset-0 bg-gradient-to-t ${cfg.tint} pointer-events-none`} />

        {/* Expression Cheek / Mood Overlays */}
        {(expression === 'malu' || expression === 'ngambek lucu') && (
          <div className="absolute inset-x-0 top-[46%] flex justify-between px-9 pointer-events-none opacity-80">
            <div className="w-7 h-3 rounded-full bg-rose-400/55 blur-[4px]" />
            <div className="w-7 h-3 rounded-full bg-rose-400/55 blur-[4px]" />
          </div>
        )}

        {expression === 'sedih' && (
          <div className="absolute inset-x-0 top-[47%] flex justify-between px-12 pointer-events-none">
            <span className="text-sky-200 text-xs drop-shadow">💧</span>
            <span className="text-sky-200 text-xs drop-shadow">💧</span>
          </div>
        )}

        {expression === 'ngantuk' && (
          <div className="absolute top-3 right-3 text-indigo-100 font-black text-xs tracking-wider drop-shadow animate-pulse pointer-events-none">
            zZz...
          </div>
        )}

        {expression === 'bingung' && (
          <div className="absolute top-3 right-3 text-amber-200 font-black text-base drop-shadow pointer-events-none">
            ??
          </div>
        )}

        {expression === 'kaget' && (
          <div className="absolute top-3 right-3 text-cyan-200 font-black text-base drop-shadow pointer-events-none">
            !!
          </div>
        )}

        {expression === 'ngambek lucu' && (
          <div className="absolute top-3 right-3 text-rose-200 font-black text-sm drop-shadow pointer-events-none">
            💢
          </div>
        )}

        {(expression === 'senang' || expression === 'semangat') && (
          <>
            <div className="absolute top-2.5 left-3 text-amber-200 text-xs drop-shadow pointer-events-none">
              ✦
            </div>
            <div className="absolute top-4 right-3 text-pink-200 text-sm drop-shadow pointer-events-none">
              ✦
            </div>
          </>
        )}

        {/* Safe Pose Visual Accessories / Framing (100% Sopan & Berpakaian Lengkap) */}
        {pose === 'pake topi' && (
          <svg
            viewBox="0 0 200 70"
            className="absolute top-0 inset-x-0 w-full pointer-events-none drop-shadow-md"
          >
            <path d="M40 42 C45 10, 155 10, 160 42 Z" fill="#ec4899" fillOpacity="0.88" />
            <path d="M25 42 Q100 32 175 44 Q110 52 25 42 Z" fill="#be185d" fillOpacity="0.92" />
            <circle cx="100" cy="24" r="5" fill="#fff" fillOpacity="0.9" />
          </svg>
        )}

        {pose === 'pake kacamata' && (
          <svg
            viewBox="0 0 200 60"
            className="absolute top-[33%] inset-x-0 w-full pointer-events-none drop-shadow"
          >
            <rect x="44" y="14" width="44" height="24" rx="8" fill="#0f172a" fillOpacity="0.28" stroke="#f472b6" strokeWidth="3.5" />
            <rect x="112" y="14" width="44" height="24" rx="8" fill="#0f172a" fillOpacity="0.28" stroke="#f472b6" strokeWidth="3.5" />
            <line x1="88" y1="24" x2="112" y2="24" stroke="#f472b6" strokeWidth="3.5" />
          </svg>
        )}

        {pose === 'pake hoodie' && (
          <div className="absolute inset-0 border-[8px] border-pink-300/45 rounded-2xl pointer-events-none shadow-inner">
            <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-pink-500/55 to-transparent flex justify-center gap-6 items-end pb-1">
              <div className="w-1 h-4 bg-white/85 rounded-full" />
              <div className="w-1 h-4 bg-white/85 rounded-full" />
            </div>
          </div>
        )}

        {pose === 'pake jaket' && (
          <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-slate-900/75 via-slate-800/40 to-transparent pointer-events-none border-t border-white/15 flex items-center justify-center">
            <span className="text-[9px] font-bold tracking-wider text-white/90 bg-slate-900/70 px-2 py-0.5 rounded-full">
              🧥 Jaket Hangat
            </span>
          </div>
        )}

        {pose === 'minum' && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-xl bg-white/90 text-slate-900 text-[11px] font-extrabold shadow-lg pointer-events-none flex items-center gap-1">
            <span>🧋</span>
            <span className="text-[9px]">Sruput</span>
          </div>
        )}

        {(pose === 'tidur' || pose === 'tiduran' || pose === 'tiduran dengan baju lengkap dan sopan') && (
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-indigo-200/80 via-indigo-100/35 to-transparent pointer-events-none flex items-end justify-between px-2.5 pb-1.5">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/75 text-indigo-100">
              🛏️ Selimut Nyaman
            </span>
          </div>
        )}

        {pose === 'peluk' && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-pink-500/90 text-white text-[9px] font-bold shadow pointer-events-none">
            🫂 Peluk Hangat
          </div>
        )}

        {pose === 'jalan santai' && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/85 text-white text-[9px] font-bold shadow pointer-events-none">
            🚶‍♀️ Jalan Santai
          </div>
        )}

        {pose === 'duduk' && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-purple-600/85 text-white text-[9px] font-bold shadow pointer-events-none">
            🪑 Duduk Manis
          </div>
        )}

        {/* Top-left quick expression chip */}
        <div
          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-md ${cfg.badgeBg}`}
        >
          {cfg.sticker}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// PIN GATE (LOCKED - PIN 112007)
// --------------------------------------------------------------------------
export function APinScreen({
  onUnlock,
  onReturnToHub
}: {
  onUnlock: () => void;
  onReturnToHub: () => void;
}) {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [avatarUrl] = useState(() => {
    try {
      const saved = localStorage.getItem('ze_ai_a_settings_last');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed?.avatarUrl &&
          !String(parsed.avatarUrl).includes(LEGACY_OLD_AVATAR_SUBSTR)
        ) {
          return parsed.avatarUrl;
        }
      }
    } catch {}
    return DEFAULT_A_AVATAR;
  });

  useEffect(() => {
    preloadZeyaPoseImages();
  }, []);

  const submitPin = (candidate: string) => {
    if (candidate === '112007') {
      setErrorMsg('');
      onUnlock();
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setPin('');

    if (nextAttempts >= 3) {
      onReturnToHub();
      return;
    }

    setErrorMsg(`PIN salah! (Percobaan ${nextAttempts}/3)`);
  };

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 6) {
      setTimeout(() => submitPin(next), 120);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    preloadZeyaPoseImages();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter' && pin.length > 0) {
        submitPin(pin);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#0b0d17] via-[#120b1f] to-[#080910] text-white">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-pink-500/20 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <button
          type="button"
          onClick={onReturnToHub}
          className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Lock size={15} className="text-pink-400" />
          <span className="text-sm font-black tracking-wide">A! — LOCKED PIN</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 max-w-sm mx-auto w-full space-y-5">
        <div className="relative">
          <img
            src={avatarUrl}
            alt="A!"
            className="w-24 h-24 rounded-full object-cover object-top border-2 border-pink-500/80 shadow-[0_0_28px_rgba(236,72,153,0.45)]"
          />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-purple-600 border-2 border-[#0b0d17] flex items-center justify-center shadow-lg">
            <Lock size={14} className="text-white" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-white">Masukkan PIN A!</h2>
          <p className="text-xs text-zinc-400">
            Ketik 6 digit PIN untuk membuka chat personal A!
          </p>
        </div>

        {/* 6 Dots Indicator */}
        <div className="flex items-center justify-center gap-3 py-1">
          {Array.from({ length: 6 }).map((_, idx) => {
            const filled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  filled
                    ? 'bg-pink-500 border-pink-300 scale-110 shadow-[0_0_12px_rgba(236,72,153,0.8)]'
                    : 'border-zinc-600 bg-zinc-900/70'
                }`}
              />
            );
          })}
        </div>

        {errorMsg ? (
          <div className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs font-bold text-center animate-pulse">
            {errorMsg}
          </div>
        ) : (
          <div className="h-8" />
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-white/[0.07] hover:bg-pink-500/25 border border-white/15 hover:border-pink-400/50 text-xl font-black text-white transition active:scale-95 cursor-pointer shadow-lg"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={onReturnToHub}
            className="h-14 rounded-2xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition active:scale-95 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-white/[0.07] hover:bg-pink-500/25 border border-white/15 hover:border-pink-400/50 text-xl font-black text-white transition active:scale-95 cursor-pointer shadow-lg"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-white/[0.04] hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
            title="Hapus"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// MAIN COMPONENT: A! CHAT, VOICE NOTE MODE, CALL, BUBBLE THEME, SETTINGS
// --------------------------------------------------------------------------
export function AiACompanion({
  currentUser,
  onBackToHub,
  onCloseAll
}: {
  currentUser: any;
  onBackToHub: () => void;
  onCloseAll: () => void;
}) {
  const userId = currentUser?.id || 'guest';
  const settingsKey = `ze_ai_a_settings_${userId}`;
  const historyKey = `ze_ai_a_history_${userId}`;
  const stateKey = `ze_ai_a_state_${userId}`;
  const modeKey = `ze_ai_a_mode_${userId}`;

  const [settings, setSettings] = useState<ACompanionSettings>(() => {
    try {
      const saved =
        localStorage.getItem(settingsKey) || localStorage.getItem('ze_ai_a_settings_last');
      const persistedPrefs = getPersistedVoicePrefs();
      const persistedCustomEmb = getPersistedCustomVoiceEmbedding();
      if (saved) {
        const parsed = JSON.parse(saved);
        const migratedAvatar =
          !parsed?.avatarUrl || String(parsed.avatarUrl).includes(LEGACY_OLD_AVATAR_SUBSTR)
            ? DEFAULT_A_AVATAR
            : parsed.avatarUrl;
        const resolvedCustomEmb = parsed?.customVoiceEmbedding || persistedCustomEmb || null;
        return {
          ...DEFAULT_A_SETTINGS,
          ...parsed,
          avatarUrl: migratedAvatar,
          voiceId: resolvedCustomEmb ? 'custom-voice' : persistedPrefs.voiceId || parsed?.voiceId || 'ze-standard',
          customVoiceEmbedding: resolvedCustomEmb
        };
      }
    } catch {}
    return DEFAULT_A_SETTINGS;
  });

  const [companionState, setCompanionState] = useState<ACompanionState>(() => {
    try {
      const saved = localStorage.getItem(stateKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_A_STATE,
          ...parsed,
          posisi: parsed?.posisi || 'berdiri',
          ekspresi: parsed?.ekspresi || 'senang',
          headbandRemoved: Boolean(parsed?.headbandRemoved)
        };
      }
    } catch {}
    return DEFAULT_A_STATE;
  });

  const [messages, setMessages] = useState<ACompanionMessage[]>(() => {
    try {
      const saved = localStorage.getItem(historyKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'a_welcome_' + Date.now(),
        sender: 'ai',
        text: `IYAA! Akhirnya kamu masuk juga, aku zeya siap nemenin kamu ngobrol nih!`,
        expression: 'senang',
        pose: 'berdiri',
        gesture: 'dadah',
        poseVariant: 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [chatMode, setChatMode] = useState<'chat' | 'no-pic' | 'vn'>(() => {
    try {
      const saved = localStorage.getItem(modeKey);
      if (saved === 'chat' || saved === 'no-pic' || saved === 'vn') return saved;
    } catch {}
    return 'chat';
  });
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Photo Attachment
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Voice Note Recording (User Mic)
  const [isRecordingVn, setIsRecordingVn] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [recordedVn, setRecordedVn] = useState<{
    dataUrl: string;
    mimeType: string;
    duration: number;
  } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingSecRef = useRef<number>(0);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  // UI Overlays & Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showBubbleModal, setShowBubbleModal] = useState(false);
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);

  // Voice Playback State & Custom Voice Upload/Recording State
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const [loadingVoiceMsgId, setLoadingVoiceMsgId] = useState<string | null>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [ownVoiceConsent, setOwnVoiceConsent] = useState(false);
  const [isExtractingVoice, setIsExtractingVoice] = useState(false);
  const [voiceSaveSuccessMsg, setVoiceSaveSuccessMsg] = useState<string | null>(null);
  const [isRecordingCustomVoice, setIsRecordingCustomVoice] = useState(false);
  const [customVoiceRecSec, setCustomVoiceRecSec] = useState(0);
  const [voicePrefs, setVoicePrefs] = useState<PersistedVoicePrefs>(() => getPersistedVoicePrefs());
  const [voiceQuota, setVoiceQuota] = useState<VoiceQuotaState>(() => getVoiceQuotaState());
  const [voiceCacheCount, setVoiceCacheCount] = useState<number>(() => getEstimatedVoiceCacheCount());
  const customVoiceInputRef = useRef<HTMLInputElement>(null);
  const customVoiceRecorderRef = useRef<MediaRecorder | null>(null);
  const customVoiceStreamRef = useRef<MediaStream | null>(null);
  const customVoiceChunksRef = useRef<Blob[]>([]);
  const customVoiceTimerRef = useRef<number | null>(null);

  // Call State (Real Mic + Speech + Timer + Mute)
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<'Menghubungkan...' | 'Terhubung'>('Menghubungkan...');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCallAiSpeaking, setIsCallAiSpeaking] = useState(false);
  const [callTranscript, setCallTranscript] = useState<string>('');
  const [callManualText, setCallManualText] = useState('');
  const [speechRecSupported, setSpeechRecSupported] = useState(false);

  const callStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const callActiveRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const isCallAiSpeakingRef = useRef<boolean>(false);
  const callProcessingRef = useRef<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);

  // Starfield positions (static deterministic stars so they never jump on re-render)
  const starField = useMemo(
    () =>
      Array.from({ length: 48 }).map((_, i) => ({
        id: i,
        top: `${((i * 37 + 13) % 96) + 2}%`,
        left: `${((i * 53 + 7) % 96) + 2}%`,
        size: i % 5 === 0 ? 3 : i % 2 === 0 ? 2 : 1.5,
        delay: `${(i % 7) * 0.45}s`,
        opacity: i % 3 === 0 ? 0.95 : 0.65
      })),
    []
  );

  // Persist Settings, Companion State & Chat Mode + Unified Voice Preferences (never reset in APK)
  useEffect(() => {
    try {
      const serialized = JSON.stringify(settings);
      localStorage.setItem(settingsKey, serialized);
      localStorage.setItem('ze_ai_a_settings_last', serialized);
      savePersistedVoicePrefs({
        voiceId: settings.customVoiceEmbedding ? 'custom-voice' : settings.voiceId || 'ze-standard',
      });
      if (settings.customVoiceEmbedding) {
        savePersistedCustomVoiceEmbedding(settings.customVoiceEmbedding);
      }
    } catch {}
  }, [settings, settingsKey]);

  useEffect(() => {
    try {
      localStorage.setItem(stateKey, JSON.stringify(companionState));
    } catch {}
  }, [companionState, stateKey]);

  useEffect(() => {
    try {
      localStorage.setItem(modeKey, chatMode);
    } catch {}
  }, [chatMode, modeKey]);

  // Persist Chat History (keep up to 40 messages safely)
  useEffect(() => {
    try {
      const compact = messages.slice(-40);
      localStorage.setItem(historyKey, JSON.stringify(compact));
    } catch {
      try {
        const stripped = messages.slice(-15).map((m) => ({
          ...m,
          imageUrl: undefined,
          audioUrl: undefined
        }));
        localStorage.setItem(historyKey, JSON.stringify(stripped));
      } catch {}
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, historyKey]);

  // Preload 10 pose cutouts + local MP3 audio assets on mount & subscribe to voice quota/cache updates
  useEffect(() => {
    preloadZeyaPoseImages();
    preloadLocalVoiceAssets().catch(() => {});
    getVoiceCacheCount().then(setVoiceCacheCount).catch(() => {});

    const unsubVoice = subscribeVoiceStateUpdates(() => {
      setVoicePrefs(getPersistedVoicePrefs());
      setVoiceQuota(getVoiceQuotaState());
      setVoiceCacheCount(getEstimatedVoiceCacheCount());
    });

    return () => {
      unsubVoice();
      stopAllVoicePlayback();
      endRealCall();
      cancelVnRecording();
      if (customVoiceTimerRef.current) {
        window.clearInterval(customVoiceTimerRef.current);
      }
      if (customVoiceStreamRef.current) {
        customVoiceStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string) => {
    setNoticeBanner(msg);
    setTimeout(() => {
      setNoticeBanner((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // --------------------------------------------------------------------------
  // UNIFIED VOICE ENGINE (CUSTOM API + LOCAL MP3 + SILENT — ZERO GOOGLE TTS)
  // --------------------------------------------------------------------------
  const stopAllVoicePlayback = () => {
    stopAllUnifiedVoice();
    setPlayingMsgId(null);
    setLoadingVoiceMsgId(null);
    setIsTestingVoice(false);
    isCallAiSpeakingRef.current = false;
    setIsCallAiSpeaking(false);
  };

  const speakWithSelectedVoice = async (
    rawText: string,
    opts?: {
      msgId?: string;
      existingAudioUrl?: string;
      onStart?: () => void;
      onEnd?: () => void;
    }
  ): Promise<void> => {
    const activeCustomVoice = settings.customVoiceEmbedding || null;
    await speakWithUnifiedVoice(rawText, {
      msgId: opts?.msgId,
      existingAudioUrl: opts?.existingAudioUrl,
      voiceId: activeCustomVoice ? 'custom-voice' : settings.voiceId || 'ze-standard',
      customVoiceEmbedding: activeCustomVoice,
      queue: true,
      onStatusChange: (status, label) => {
        if (status === 'loading') {
          if (opts?.msgId) setLoadingVoiceMsgId(opts.msgId);
          setNoticeBanner(label || 'Memuat suara custom...');
        } else if (status === 'playing') {
          setLoadingVoiceMsgId(null);
          setNoticeBanner((prev) =>
            prev === 'Memuat suara custom...' || prev === 'suara lagi loading...' ? null : prev
          );
          if (opts?.msgId) setPlayingMsgId(opts.msgId);
        } else if (status === 'local-backup') {
          setLoadingVoiceMsgId(null);
          if (opts?.msgId) setPlayingMsgId(opts.msgId);
          showToast(label || 'Limit API habis — memutar suara MP3 lokal (bukan Google)');
        } else if (status === 'limit-reached' || status === 'error') {
          setLoadingVoiceMsgId(null);
          setPlayingMsgId(null);
          showToast(label || 'Suara custom lagi abis limit, coba lagi nanti');
        } else {
          setLoadingVoiceMsgId(null);
          setPlayingMsgId(null);
        }
      },
      onStart: opts?.onStart,
      onEnd: opts?.onEnd,
    });
  };

  // Process uploaded audio/video OR recorded microphone audio into Voice Embedding (never plays raw audio back!)
  const processAndSaveCustomVoice = async (fileOrBlob: Blob, labelName: string) => {
    if (!ownVoiceConsent) {
      showToast('Centang persetujuan suara Anda sendiri terlebih dahulu.');
      return;
    }

    setIsExtractingVoice(true);
    setVoiceSaveSuccessMsg(null);
    try {
      const extracted = await extractVoiceAudioForEmbedding(fileOrBlob);
      const res = await fetch('/api/ze-ai/a-voice-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: extracted.audioDataUrl,
          audioMimeType: extracted.mimeType,
          acousticMetrics: extracted.metrics,
          consentConfirmed: true
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.voiceEmbedding) {
        throw new Error(data?.message || 'Gagal mengekstrak karakteristik suara');
      }

      const savedEmbedding: CustomVoiceEmbedding = {
        ...data.voiceEmbedding,
        sourceLabel: labelName
      };

      setSettings((prev) => ({
        ...prev,
        voiceId: 'custom-voice',
        customVoiceEmbedding: savedEmbedding
      }));
      setVoiceSaveSuccessMsg('Suara custom berhasil disimpan!');
      showToast('Suara custom berhasil disimpan!');
    } catch (err: any) {
      showToast(err?.message || 'Gagal memproses audio/video suara custom.');
    } finally {
      setIsExtractingVoice(false);
    }
  };

  const handleUploadCustomVoiceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) {
      showToast('Ukuran file maksimal 40MB.');
      return;
    }
    await processAndSaveCustomVoice(file, file.name);
  };

  const toggleRecordCustomVoice = async () => {
    if (!ownVoiceConsent) return;

    if (isRecordingCustomVoice && customVoiceRecorderRef.current) {
      if (customVoiceTimerRef.current) {
        window.clearInterval(customVoiceTimerRef.current);
        customVoiceTimerRef.current = null;
      }
      if (customVoiceRecorderRef.current.state !== 'inactive') {
        customVoiceRecorderRef.current.stop();
      }
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('Browser tidak mendukung rekaman mikrofon.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      customVoiceStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      customVoiceRecorderRef.current = recorder;
      customVoiceChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          customVoiceChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        if (customVoiceTimerRef.current) {
          window.clearInterval(customVoiceTimerRef.current);
          customVoiceTimerRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        customVoiceStreamRef.current = null;
        setIsRecordingCustomVoice(false);
        setCustomVoiceRecSec(0);

        const blob = new Blob(customVoiceChunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });
        await processAndSaveCustomVoice(blob, 'Rekaman Suara Langsung');
      };

      recorder.start(200);
      setIsRecordingCustomVoice(true);
      setCustomVoiceRecSec(0);
      customVoiceTimerRef.current = window.setInterval(() => {
        setCustomVoiceRecSec((prev) => {
          if (prev >= 12) {
            if (recorder.state !== 'inactive') recorder.stop();
            return 12;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      showToast('Izin mikrofon ditolak.');
    }
  };

  // --------------------------------------------------------------------------
  // PHOTO PICKERS (CHAT ATTACHMENT & AI AVATAR IN SETTINGS)
  // --------------------------------------------------------------------------
  const handleSelectChatPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImageDataUrl(file, 900, 0.85);
      setAttachedPhoto(compressed);
    } catch {
      showToast('Gagal memuat foto dari galeri.');
    }
  };

  const handleSelectAvatarPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImageDataUrl(file, 512, 0.86);
      setSettings((prev) => ({ ...prev, avatarUrl: compressed }));
      showToast('Foto AI berhasil diganti!');
    } catch {
      showToast('Gagal mengubah foto AI.');
    }
  };

  // --------------------------------------------------------------------------
  // REAL MICROPHONE VOICE NOTE RECORDING (MediaRecorder)
  // --------------------------------------------------------------------------
  const cancelVnRecording = () => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((t) => t.stop());
      recordingStreamRef.current = null;
    }
    recordedChunksRef.current = [];
    setIsRecordingVn(false);
    setRecordingSec(0);
    recordingSecRef.current = 0;
  };

  const startVnRecording = async () => {
    if (isRecordingVn) {
      stopAndKeepOrSendVn(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('Browser tidak mendukung rekam mikrofon.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recordedChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data);
        }
      };

      recorder.start(200);
      setIsRecordingVn(true);
      setRecordingSec(0);
      recordingSecRef.current = 0;

      recordingTimerRef.current = window.setInterval(() => {
        recordingSecRef.current += 1;
        setRecordingSec(recordingSecRef.current);
      }, 1000);
    } catch {
      showToast('Izin mikrofon ditolak. Aktifkan mic untuk rekam Voice Note.');
    }
  };

  const stopAndKeepOrSendVn = (sendImmediately: boolean) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    const finalDur = Math.max(1, recordingSecRef.current);

    recorder.onstop = () => {
      const actualMime = recorder.mimeType || 'audio/webm';
      const blob = new Blob(recordedChunksRef.current, { type: actualMime });
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;
      }
      setIsRecordingVn(false);
      setRecordingSec(0);
      recordingSecRef.current = 0;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        const vnObj = {
          dataUrl,
          mimeType: actualMime.split(';')[0] || 'audio/webm',
          duration: finalDur
        };
        if (sendImmediately) {
          dispatchChatMessage({ vn: vnObj });
        } else {
          setRecordedVn(vnObj);
        }
      };
      reader.readAsDataURL(blob);
    };

    recorder.stop();
  };

  // --------------------------------------------------------------------------
  // SEND CHAT / PHOTO / VOICE NOTE TO A! BACKEND
  // --------------------------------------------------------------------------
  const dispatchChatMessage = async (override?: {
    text?: string;
    photo?: string | null;
    vn?: { dataUrl: string; mimeType: string; duration: number } | null;
  }) => {
    if (isAiTyping) return;

    const textToSend = (override?.text !== undefined ? override.text : inputText).trim();
    const photoToSend = override?.photo !== undefined ? override.photo : attachedPhoto;
    const vnToSend = override?.vn !== undefined ? override.vn : recordedVn;

    if (!textToSend && !photoToSend && !vnToSend) return;

    const userMsg: ACompanionMessage = {
      id: 'a_usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      sender: 'user',
      text: textToSend || undefined,
      imageUrl: photoToSend || undefined,
      audioUrl: vnToSend?.dataUrl,
      audioDuration: vnToSend?.duration,
      isVoiceNote: Boolean(vnToSend),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (override?.text === undefined) setInputText('');
    if (override?.photo === undefined) setAttachedPhoto(null);
    if (override?.vn === undefined) setRecordedVn(null);
    setIsAiTyping(true);

    try {
      const isNoPicMode = chatMode === 'no-pic';
      const isVnMode = chatMode === 'vn';
      const res = await fetch('/api/ze-ai/a-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          mediaData: photoToSend || undefined,
          audioData: vnToSend?.dataUrl || undefined,
          audioMimeType: vnToSend?.mimeType || undefined,
          customPrompt: settings.customPrompt,
          adultMode18Plus: Boolean(settings.adultMode18Plus),
          aiName: settings.aiName,
          voiceNoteMode: isVnMode,
          noPicMode: isNoPicMode,
          companionState,
          history: nextMessages.slice(-8).map((m) => ({
            sender: m.sender,
            text: stripALabelTags(m.text || (m.isVoiceNote ? '[Voice Note]' : '[Foto]'))
          }))
        })
      });

      const data = await res.json();
      const replyText =
        enforceHyphenatedSayang(stripALabelTags(String(data?.replyText || ''))) ||
        'Iyaa, aku siap dengerin kamu terus kok sa-yang!';

      // Auto-analyze AI's OWN reply text + user prompt + persistent state BEFORE display!
      const analyzed = analyzeAutoVisualState({
        aiText: replyText,
        userText: textToSend,
        prevState: {
          pose: (data?.pose as ASafePose) || companionState.posisi,
          expression: (photoToSend ? 'senang' : (data?.expression as AExpression)) || companionState.ekspresi,
          gesture: companionState.lastGesture || 'cerita',
          poseVariant: companionState.lastVariant ?? 0,
          headbandRemoved: Boolean(data?.headbandRemoved ?? companionState.headbandRemoved),
          hatOn: Boolean(companionState.hatOn),
          glassesOn: Boolean(companionState.glassesOn),
          hoodieOn: Boolean(companionState.hoodieOn),
          jacketOn: Boolean(companionState.jacketOn),
          drinkOn: Boolean(companionState.drinkOn)
        },
        prevVariant: companionState.lastVariant,
        prevGesture: companionState.lastGesture,
        turnCount: nextMessages.length
      });

      setCompanionState({
        posisi: analyzed.pose,
        ekspresi: analyzed.expression,
        headbandRemoved: analyzed.headbandRemoved,
        hatOn: analyzed.hatOn,
        glassesOn: analyzed.glassesOn,
        hoodieOn: analyzed.hoodieOn,
        jacketOn: analyzed.jacketOn,
        drinkOn: analyzed.drinkOn,
        lastGesture: analyzed.gesture,
        lastVariant: analyzed.poseVariant
      });

      // Mode Chat = teks + <ACharacterArt /> (100% lokal, gratis unlimited)
      // Chat No Pic = teks aja, sembunyiin <ACharacterArt />
      // Mode Voice Note Doang = voice aja
      const shouldShowArt = chatMode === 'chat';
      const aiMsgId = 'a_ai_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

      const aiMsg: ACompanionMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: replyText,
        expression: shouldShowArt ? analyzed.expression : undefined,
        pose: shouldShowArt ? analyzed.pose : undefined,
        gesture: shouldShowArt ? analyzed.gesture : undefined,
        poseVariant: shouldShowArt ? analyzed.poseVariant : undefined,
        headbandRemoved: shouldShowArt ? analyzed.headbandRemoved : undefined,
        hatOn: shouldShowArt ? analyzed.hatOn : undefined,
        glassesOn: shouldShowArt ? analyzed.glassesOn : undefined,
        hoodieOn: shouldShowArt ? analyzed.hoodieOn : undefined,
        jacketOn: shouldShowArt ? analyzed.jacketOn : undefined,
        drinkOn: shouldShowArt ? analyzed.drinkOn : undefined,
        isVoiceNote: isVnMode,
        audioDuration: Math.max(2, Math.min(25, Math.round(replyText.split(/\s+/).length * 0.45))),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);

      // In Mode Voice Note Doang, immediately speak the Voice Note using selected voice!
      if (isVnMode) {
        setTimeout(() => {
          speakWithSelectedVoice(replyText, { msgId: aiMsgId });
        }, 180);
      }
    } catch {
      const fallbackText = 'Iyaa, aku selalu dengerin kamu kok sa-yang! Cerita lagi dong.';
      const analyzed = analyzeAutoVisualState({
        aiText: fallbackText,
        userText: textToSend,
        prevState: {
          pose: companionState.posisi,
          expression: companionState.ekspresi,
          gesture: companionState.lastGesture || 'cerita',
          poseVariant: companionState.lastVariant ?? 0,
          headbandRemoved: companionState.headbandRemoved,
          hatOn: Boolean(companionState.hatOn),
          glassesOn: Boolean(companionState.glassesOn),
          hoodieOn: Boolean(companionState.hoodieOn),
          jacketOn: Boolean(companionState.jacketOn),
          drinkOn: Boolean(companionState.drinkOn)
        },
        prevVariant: companionState.lastVariant,
        prevGesture: companionState.lastGesture,
        turnCount: nextMessages.length
      });
      const shouldShowArt = chatMode === 'chat';
      const errMsg: ACompanionMessage = {
        id: 'a_err_' + Date.now(),
        sender: 'ai',
        text: fallbackText,
        expression: shouldShowArt ? analyzed.expression : undefined,
        pose: shouldShowArt ? analyzed.pose : undefined,
        gesture: shouldShowArt ? analyzed.gesture : undefined,
        poseVariant: shouldShowArt ? analyzed.poseVariant : undefined,
        headbandRemoved: shouldShowArt ? analyzed.headbandRemoved : undefined,
        hatOn: shouldShowArt ? analyzed.hatOn : undefined,
        glassesOn: shouldShowArt ? analyzed.glassesOn : undefined,
        hoodieOn: shouldShowArt ? analyzed.hoodieOn : undefined,
        jacketOn: shouldShowArt ? analyzed.jacketOn : undefined,
        drinkOn: shouldShowArt ? analyzed.drinkOn : undefined,
        isVoiceNote: chatMode === 'vn',
        audioDuration: 4,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecordingVn) {
      stopAndKeepOrSendVn(true);
      return;
    }
    dispatchChatMessage();
  };

  // --------------------------------------------------------------------------
  // REAL CALL FEATURE (MIC PERMISSION + TIMER + MUTE + LIVE SPEECH + HANGUP)
  // --------------------------------------------------------------------------
  const startCallRecognition = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec || !callActiveRef.current) return;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
      }
      const rec = new SpeechRec();
      rec.lang = 'id-ID';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: any) => {
        if (!callActiveRef.current || isMutedRef.current || isCallAiSpeakingRef.current) {
          return;
        }
        let finalText = '';
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalText += chunk + ' ';
          } else {
            interimText += chunk;
          }
        }
        if (interimText.trim()) {
          setCallTranscript(interimText.trim());
        }
        if (finalText.trim() && !callProcessingRef.current) {
          handleCallUserUtterance(finalText.trim());
        }
      };

      rec.onend = () => {
        if (callActiveRef.current && !isMutedRef.current && !isCallAiSpeakingRef.current) {
          setTimeout(() => {
            if (callActiveRef.current && !isMutedRef.current && !isCallAiSpeakingRef.current) {
              try {
                rec.start();
              } catch {}
            }
          }, 300);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch {}
  };

  const handleCallUserUtterance = async (spoken: string) => {
    const clean = spoken.trim();
    if (!clean || !callActiveRef.current || callProcessingRef.current) return;
    callProcessingRef.current = true;
    setCallTranscript(`Kamu: "${clean}"`);

    try {
      const res = await fetch('/api/ze-ai/a-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          customPrompt: settings.customPrompt,
          adultMode18Plus: Boolean(settings.adultMode18Plus),
          aiName: settings.aiName,
          isCallMode: true,
          noPicMode: chatMode === 'no-pic',
          companionState,
          history: messages.slice(-8).map((m) => ({
            sender: m.sender,
            text: stripALabelTags(m.text || '')
          }))
        })
      });
      const data = await res.json();
      if (data?.companionState) {
        setCompanionState({
          posisi: data.companionState.posisi || companionState.posisi,
          ekspresi: data.companionState.ekspresi || companionState.ekspresi,
          headbandRemoved: Boolean(data.companionState.headbandRemoved)
        });
      }
      const replyText =
        enforceHyphenatedSayang(stripALabelTags(String(data?.replyText || ''))) ||
        'Iyaa, aku denger kok suara kamu sa-yang!';

      if (!callActiveRef.current) return;
      setCallTranscript(`${settings.aiName}: "${replyText}"`);

      // Pause recognition while AI speaks so mic doesn't echo AI output
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      isCallAiSpeakingRef.current = true;
      setIsCallAiSpeaking(true);

      await speakWithSelectedVoice(replyText, {
        onEnd: () => {
          isCallAiSpeakingRef.current = false;
          setIsCallAiSpeaking(false);
          if (callActiveRef.current && !isMutedRef.current) {
            startCallRecognition();
          }
        }
      });
    } catch {
      isCallAiSpeakingRef.current = false;
      setIsCallAiSpeaking(false);
    } finally {
      callProcessingRef.current = false;
    }
  };

  const startRealCall = async () => {
    stopAllVoicePlayback();
    setIsInCall(true);
    setCallStatus('Menghubungkan...');
    setCallSeconds(0);
    setIsMuted(false);
    isMutedRef.current = false;
    callActiveRef.current = true;
    callProcessingRef.current = false;
    setCallTranscript('');

    const hasRec = Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
    setSpeechRecSupported(hasRec);

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!callActiveRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        callStreamRef.current = stream;
      }
    } catch {
      showToast('Izin mikrofon diperlukan agar suara kamu terdengar di call.');
    }

    if (!callActiveRef.current) return;
    setCallStatus('Terhubung');

    callTimerRef.current = window.setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);

    const greeting = 'Halo, ini A! Kita lagi call nih.';
    setCallTranscript(`${settings.aiName}: "${greeting}"`);
    isCallAiSpeakingRef.current = true;
    setIsCallAiSpeaking(true);

    await speakWithSelectedVoice(greeting, {
      onEnd: () => {
        isCallAiSpeakingRef.current = false;
        setIsCallAiSpeaking(false);
        if (callActiveRef.current && !isMutedRef.current) {
          startCallRecognition();
        }
      }
    });
  };

  const toggleCallMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;

    if (callStreamRef.current) {
      callStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
    }

    if (nextMuted) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    } else if (callActiveRef.current && !isCallAiSpeakingRef.current) {
      startCallRecognition();
    }
  };

  const endRealCall = () => {
    callActiveRef.current = false;
    if (callTimerRef.current) {
      window.clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (callStreamRef.current) {
      callStreamRef.current.getTracks().forEach((t) => t.stop());
      callStreamRef.current = null;
    }
    stopAllVoicePlayback();
    setIsInCall(false);
    setIsMuted(false);
    isMutedRef.current = false;
    setCallTranscript('');
  };

  // --------------------------------------------------------------------------
  // LONG-PRESS HANDLER FOR "GANTI BUBBLE CHAT"
  // --------------------------------------------------------------------------
  const startBubbleLongPress = () => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      setShowBubbleModal(true);
    }, 450);
  };

  const cancelBubbleLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // --------------------------------------------------------------------------
  // BUBBLE & BACKGROUND THEME COMPUTATIONS (WITH VISIBLE EDGE SHADOWS)
  // --------------------------------------------------------------------------
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (settings.bgTheme) {
      case 'midnight-navy':
        return { background: 'linear-gradient(165deg, #050a18 0%, #0d1d42 55%, #070d1f 100%)' };
      case 'pink-night':
        return { background: 'linear-gradient(165deg, #250b24 0%, #4c1343 50%, #19081c 100%)' };
      case 'aurora-purple':
        return { background: 'linear-gradient(165deg, #130b2e 0%, #2d165e 52%, #0e1029 100%)' };
      case 'custom':
        return { background: settings.customBgColor || '#123884' };
      case 'blue-stars':
      default:
        return { background: 'linear-gradient(165deg, #0b2663 0%, #1648a8 52%, #081c47 100%)' };
    }
  };

  const getBubbleDecoration = (
    sender: 'user' | 'ai'
  ): { className: string; style?: React.CSSProperties } => {
    const isUser = sender === 'user';
    const baseRadius = isUser ? 'rounded-3xl rounded-br-md' : 'rounded-3xl rounded-bl-md';
    // Every bubble MUST have visible edge shadows ("bayangan di pinggiran")
    const edgeShadow =
      'shadow-[0_10px_24px_rgba(0,0,0,0.48),0_2px_8px_rgba(2,6,23,0.65)]';

    switch (settings.bubbleStyle) {
      case 'whee-sketch':
        return {
          className: `${baseRadius} border-2 border-dashed ${
            isUser
              ? 'bg-[#fef3c7] text-slate-900 border-amber-800/80 shadow-[4px_6px_0px_rgba(15,23,42,0.75)]'
              : 'bg-[#fffdf7] text-slate-900 border-slate-800/80 shadow-[-4px_6px_0px_rgba(15,23,42,0.75)]'
          }`
        };
      case 'bubbly-otter':
        return {
          className: `${baseRadius} border-2 ${
            isUser
              ? 'bg-gradient-to-br from-cyan-400 to-sky-500 text-slate-950 font-semibold border-white/70 shadow-[0_10px_25px_rgba(14,165,233,0.55),0_2px_10px_rgba(0,0,0,0.4)]'
              : 'bg-gradient-to-br from-amber-50 to-orange-100 text-slate-900 border-amber-300/80 shadow-[0_10px_25px_rgba(0,0,0,0.45),0_0_12px_rgba(251,191,36,0.3)]'
          }`
        };
      case 'glam-diva':
        return {
          className: `${baseRadius} border ${
            isUser
              ? 'bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-700 text-white border-pink-300/60 shadow-[0_10px_26px_rgba(236,72,153,0.48),0_3px_10px_rgba(0,0,0,0.5)]'
              : 'bg-gradient-to-br from-[#231029] via-[#34163b] to-[#1a0b22] text-pink-50 border-pink-400/50 shadow-[0_10px_26px_rgba(0,0,0,0.58),0_0_14px_rgba(244,114,182,0.28)]'
          }`
        };
      case 'custom':
        return {
          className: `${baseRadius} border border-white/25 ${edgeShadow}`,
          style: {
            backgroundColor: isUser
              ? settings.customUserBubbleColor
              : settings.customAiBubbleColor,
            color: '#0f172a'
          }
        };
      case 'default':
      default:
        return {
          className: `${baseRadius} border ${
            isUser
              ? `bg-gradient-to-br from-pink-500 to-purple-600 text-white border-pink-300/40 ${edgeShadow}`
              : `bg-white/95 text-slate-900 border-blue-200/70 ${edgeShadow}`
          }`
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col text-white overflow-hidden select-none sm:select-text"
      style={getBackgroundStyle()}
    >
      {/* Twinkling Small White Stars Background Layer */}
      {(settings.bgTheme === 'blue-stars' ||
        settings.bgTheme === 'midnight-navy' ||
        settings.bgTheme === 'aurora-purple') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {starField.map((star) => (
            <span
              key={star.id}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animationDelay: star.delay,
                boxShadow: '0 0 6px rgba(255,255,255,0.9)'
              }}
            />
          ))}
        </div>
      )}

      {/* HEADER: Photo Left, Name & Online Center, Gear ⚙️ & Call 📞 Top-Right */}
      <header className="relative z-10 px-3 sm:px-4 py-2.5 bg-slate-950/70 backdrop-blur-md border-b border-white/15 flex items-center justify-between gap-2 shrink-0 shadow-lg">
        {/* Left: Back + AI Photo */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              stopAllVoicePlayback();
              onBackToHub();
            }}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition cursor-pointer active:scale-95"
            title="Kembali ke ZE.ai HUB"
          >
            <ArrowLeft size={18} />
          </button>
          <img
            src={settings.avatarUrl || DEFAULT_A_AVATAR}
            alt={settings.aiName}
            className="w-10 h-10 rounded-full object-cover object-top border-2 border-pink-400/80 shadow-md"
          />
        </div>

        {/* Center: Name + Online */}
        <div className="flex-1 min-w-0 text-center px-1">
          <h2 className="text-sm sm:text-base font-black text-white truncate leading-tight">
            {settings.aiName || 'A!'}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-[11px] font-semibold text-emerald-300">Online</span>
            {settings.adultMode18Plus && (
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-500/25 border border-rose-400/50 text-rose-200">
                18+
              </span>
            )}
          </div>
        </div>

        {/* Top-Right: Gear ⚙️ then Call 📞 right beside it */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition cursor-pointer active:scale-95"
            title="Setting A!"
          >
            <Settings size={17} />
          </button>
          <button
            type="button"
            onClick={startRealCall}
            className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            title="Call A!"
          >
            <Phone size={17} />
          </button>
        </div>
      </header>

      {/* MODE BUTTONS ABOVE CHAT: Mode Chat, Chat No Pic, Mode Voice Note Doang */}
      <div className="relative z-10 px-2.5 py-2 bg-slate-950/45 backdrop-blur-sm border-b border-white/10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setChatMode('chat')}
          className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition cursor-pointer active:scale-95 border ${
            chatMode === 'chat'
              ? 'bg-white text-slate-950 border-white shadow-[0_4px_14px_rgba(255,255,255,0.3)]'
              : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/15'
          }`}
        >
          Mode Chat
        </button>
        <button
          type="button"
          onClick={() => setChatMode('no-pic')}
          className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition cursor-pointer active:scale-95 border ${
            chatMode === 'no-pic'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 border-cyan-200 shadow-[0_4px_14px_rgba(34,211,238,0.4)]'
              : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/15'
          }`}
        >
          Chat No Pic
        </button>
        <button
          type="button"
          onClick={() => setChatMode('vn')}
          className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold transition cursor-pointer active:scale-95 border flex items-center gap-1.5 ${
            chatMode === 'vn'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-300 shadow-[0_4px_16px_rgba(236,72,153,0.45)]'
              : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/15'
          }`}
        >
          <Mic size={13} />
          <span>Mode Voice Note Doang</span>
        </button>
      </div>

      {/* Notice Toast */}
      {noticeBanner && (
        <div className="relative z-20 mx-auto mt-2 px-4 py-1.5 rounded-full bg-slate-900/95 border border-pink-400/50 text-xs font-bold text-white shadow-xl">
          {noticeBanner}
        </div>
      )}

      {/* CHAT MESSAGES AREA */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          const bubbleDec = getBubbleDecoration(m.sender);
          const isPlayingThis = playingMsgId === m.id;
          const isLoadingThis = loadingVoiceMsgId === m.id;

          return (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <img
                  src={settings.avatarUrl || DEFAULT_A_AVATAR}
                  alt={settings.aiName}
                  className="w-7 h-7 rounded-full object-cover object-top border border-white/40 shrink-0 shadow-md mt-1"
                />
              )}

              <div className={`max-w-[84%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  onPointerDown={startBubbleLongPress}
                  onPointerUp={cancelBubbleLongPress}
                  onPointerLeave={cancelBubbleLongPress}
                  onPointerCancel={cancelBubbleLongPress}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setShowBubbleModal(true);
                  }}
                  className={`w-full px-4 py-3 transition-transform active:scale-[0.99] ${bubbleDec.className}`}
                  style={bubbleDec.style}
                  title="Tekan lama untuk ganti tema bubble chat"
                >
                  {/* Attached User/AI Image */}
                  {m.imageUrl && (
                    <div className="mb-2 rounded-2xl overflow-hidden border border-black/15 shadow-md bg-black/20">
                      <img
                        src={m.imageUrl}
                        alt="Foto terkirim"
                        className="w-full max-h-60 object-contain"
                      />
                    </div>
                  )}

                  {/* User Recorded Voice Note Bubble OR AI Voice Note Bubble */}
                  {m.isVoiceNote ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 py-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (isPlayingThis) {
                              stopAllVoicePlayback();
                            } else {
                              speakWithSelectedVoice(m.text || '', {
                                msgId: m.id,
                                existingAudioUrl: isUser ? m.audioUrl : undefined
                              });
                            }
                          }}
                          disabled={isLoadingThis}
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer active:scale-95 shadow ${
                            isUser
                              ? 'bg-white text-pink-600'
                              : 'bg-pink-500 text-white'
                          }`}
                        >
                          {isLoadingThis ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : isPlayingThis ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} className="ml-0.5" />
                          )}
                        </button>

                        {/* Animated Voice Note Bars */}
                        <div className="flex-1 flex items-center gap-1 min-w-[115px] h-6">
                          {[45, 80, 60, 95, 50, 75, 90, 40, 70, 85, 55, 65].map((h, idx) => (
                            <div
                              key={idx}
                              className={`flex-1 rounded-full transition-all ${
                                isPlayingThis ? 'animate-pulse' : ''
                              } ${isUser ? 'bg-white/85' : 'bg-pink-500/80'}`}
                              style={{
                                height: `${isPlayingThis ? ((h + idx * 11) % 85) + 15 : h}%`
                              }}
                            />
                          ))}
                        </div>

                        <span className="text-[10px] font-mono font-bold opacity-80 shrink-0">
                          {formatDurationSec(m.audioDuration || 3)}
                        </span>
                      </div>

                      {!isUser && m.text && (
                        <p className="text-xs leading-relaxed opacity-90 border-t border-current/15 pt-1.5">
                          {stripALabelTags(m.text)}
                        </p>
                      )}
                      {isUser && m.text && (
                        <p className="text-xs leading-relaxed opacity-95">{m.text}</p>
                      )}
                    </div>
                  ) : (
                    m.text && (
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                        {isUser ? m.text : stripALabelTags(m.text)}
                      </p>
                    )
                  )}

                  {/* Custom Avatar fallback inside bubble only if user uploaded custom avatar */}
                  {!isUser && m.expression && m.pose && settings.avatarUrl !== DEFAULT_A_AVATAR && (
                    <AExpressionPortrait
                      avatarUrl={settings.avatarUrl}
                      expression={m.expression}
                      pose={m.pose}
                      aiName={settings.aiName || 'A!'}
                    />
                  )}

                  {/* Bubble Footer: Time + Voice Speaker + Delete */}
                  <div className="flex items-center justify-between gap-3 mt-2 pt-1.5 border-t border-current/10 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="opacity-65 font-mono">{m.time}</span>
                      {!isUser && m.text && !m.isVoiceNote && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isPlayingThis) {
                              stopAllVoicePlayback();
                            } else {
                              speakWithSelectedVoice(m.text || '', { msgId: m.id });
                            }
                          }}
                          disabled={isLoadingThis}
                          className={`px-2 py-0.5 rounded-full flex items-center gap-1 font-bold transition cursor-pointer ${
                            isPlayingThis
                              ? 'bg-emerald-500 text-white'
                              : 'bg-black/10 hover:bg-black/20'
                          }`}
                        >
                          {isLoadingThis ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <Volume2 size={10} />
                          )}
                          <span>
                            {isLoadingThis
                              ? 'suara lagi loading...'
                              : isPlayingThis
                              ? 'Stop'
                              : 'Suara'}
                          </span>
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setMessages((prev) => prev.filter((item) => item.id !== m.id))
                      }
                      className="opacity-55 hover:opacity-100 cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {/* Seamless 100% Local SVG Zeya directly over the starry blue chat sky (NO white box, NO API limit!) */}
                {!isUser &&
                  chatMode === 'chat' &&
                  m.expression &&
                  m.pose &&
                  settings.avatarUrl === DEFAULT_A_AVATAR && (
                    <ACharacterArt
                      expression={m.expression}
                      pose={m.pose}
                      aiName={settings.aiName || 'A!'}
                      gesture={m.gesture}
                      poseVariant={m.poseVariant}
                      headbandRemoved={Boolean(m.headbandRemoved)}
                      hatOn={Boolean(m.hatOn)}
                      glassesOn={Boolean(m.glassesOn)}
                      hoodieOn={Boolean(m.hoodieOn)}
                      jacketOn={Boolean(m.jacketOn)}
                      drinkOn={Boolean(m.drinkOn)}
                    />
                  )}
              </div>
            </div>
          );
        })}

        {isAiTyping && (
          <div className="flex items-end gap-2 justify-start">
            <img
              src={settings.avatarUrl || DEFAULT_A_AVATAR}
              alt={settings.aiName}
              className="w-7 h-7 rounded-full object-cover object-top border border-white/40 shrink-0"
            />
            <div className="px-4 py-2.5 rounded-3xl rounded-bl-md bg-white/90 text-slate-900 text-xs font-bold shadow-[0_8px_22px_rgba(0,0,0,0.45)] flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-pink-500" />
              <span>{settings.aiName} lagi ngetik...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ATTACHED PHOTO OR RECORDED VN PREVIEW BAR */}
      {(attachedPhoto || recordedVn || isRecordingVn) && (
        <div className="relative z-10 px-3 pt-2 max-w-2xl mx-auto w-full">
          <div className="p-2.5 rounded-2xl bg-slate-950/90 border border-white/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shadow-xl">
            {attachedPhoto && (
              <div className="flex items-center gap-2">
                <img
                  src={attachedPhoto}
                  alt="Preview Foto"
                  className="w-11 h-11 rounded-xl object-cover border border-pink-400/60"
                />
                <span className="text-xs font-bold text-white">Foto siap dikirim</span>
                <button
                  type="button"
                  onClick={() => setAttachedPhoto(null)}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-rose-500/40 flex items-center justify-center cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {isRecordingVn && (
              <div className="flex items-center gap-2.5 flex-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-extrabold text-rose-300 font-mono">
                  Merekam VN {formatDurationSec(recordingSec)}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={cancelVnRecording}
                    className="px-2.5 py-1 rounded-xl bg-white/10 text-xs font-bold text-zinc-300 hover:text-white cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => stopAndKeepOrSendVn(false)}
                    className="px-2.5 py-1 rounded-xl bg-pink-500 text-xs font-bold text-white cursor-pointer flex items-center gap-1"
                  >
                    <Square size={11} />
                    <span>Selesai</span>
                  </button>
                </div>
              </div>
            )}

            {recordedVn && !isRecordingVn && (
              <div className="flex items-center gap-2 flex-1">
                <div className="px-2.5 py-1 rounded-xl bg-pink-500/25 border border-pink-400/50 text-xs font-bold text-pink-200 flex items-center gap-1.5">
                  <Mic size={13} />
                  <span>VN siap kirim ({formatDurationSec(recordedVn.duration)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRecordedVn(null)}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-rose-500/40 flex items-center justify-center cursor-pointer ml-auto"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM INPUT BAR: 📷 Photo, Text Input, 🎤 Mic VN, ➤ Send */}
      <div className="relative z-10 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-slate-950/80 backdrop-blur-md border-t border-white/15 shrink-0">
        <form
          onSubmit={handleSubmitForm}
          className="max-w-2xl mx-auto flex items-center gap-2"
        >
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handleSelectChatPhoto}
            className="hidden"
          />

          {/* 📷 Gallery Photo Button */}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition cursor-pointer shrink-0 active:scale-95"
            title="Kirim Foto dari Galeri"
          >
            <Camera size={18} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              chatMode === 'vn'
                ? `Ketik atau rekam VN untuk ${settings.aiName}...`
                : chatMode === 'no-pic'
                ? `Chat tanpa foto sama ${settings.aiName}...`
                : `Ngobrol sama ${settings.aiName}...`
            }
            className="flex-1 rounded-2xl px-4 py-2.5 text-xs sm:text-sm bg-white/10 border border-white/20 text-white placeholder-white/55 outline-none focus:border-pink-400 transition"
          />

          {/* 🎤 Voice Note Record Button */}
          <button
            type="button"
            onClick={startVnRecording}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95 ${
              isRecordingVn
                ? 'bg-rose-600 border-rose-300 text-white animate-pulse shadow-[0_0_16px_rgba(225,29,72,0.7)]'
                : 'bg-white/10 hover:bg-pink-500/30 border-white/15 text-white'
            }`}
            title={isRecordingVn ? 'Hentikan & Simpan VN' : 'Rekam Voice Note'}
          >
            <Mic size={18} />
          </button>

          {/* ➤ Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && !attachedPhoto && !recordedVn && !isRecordingVn}
            className="w-10 h-10 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-40 shadow-lg active:scale-95"
            title="Kirim"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* LONG-PRESS MODAL: GANTI BUBBLE CHAT */}
      {showBubbleModal && (
        <div
          className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowBubbleModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#101322] border border-pink-400/40 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette size={18} className="text-pink-400" />
                <h3 className="text-sm font-black tracking-wide text-white">
                  GANTI BUBBLE CHAT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBubbleModal(false)}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {(
                [
                  { id: 'default', label: 'Default', desc: 'Putih bersih & pink-ungu modern berbayangan' },
                  { id: 'whee-sketch', label: 'Whee Sketch', desc: 'Garis sketsa putus-putus & kertas hangat' },
                  { id: 'bubbly-otter', label: 'Bubbly Otter', desc: 'Gelembung lembut ceria biru-oranye' },
                  { id: 'glam-diva', label: 'Glam Diva', desc: 'Ungu gelap mewah & aksen pink glamour' },
                  { id: 'custom', label: 'Custom Warna', desc: 'Pilih warna bubble AI & User sendiri' }
                ] as const
              ).map((opt) => {
                const active = settings.bubbleStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, bubbleStyle: opt.id }))
                    }
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                      active
                        ? 'bg-pink-500/20 border-pink-400 text-white'
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-extrabold">{opt.label}</p>
                      <p className="text-[11px] opacity-75">{opt.desc}</p>
                    </div>
                    {active && <Check size={16} className="text-pink-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {settings.bubbleStyle === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold flex items-center justify-between">
                  <span>Bubble AI</span>
                  <input
                    type="color"
                    value={settings.customAiBubbleColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        customAiBubbleColor: e.target.value
                      }))
                    }
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                </label>
                <label className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold flex items-center justify-between">
                  <span>Bubble User</span>
                  <input
                    type="color"
                    value={settings.customUserBubbleColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        customUserBubbleColor: e.target.value
                      }))
                    }
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                </label>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowBubbleModal(false)}
              className="w-full py-2.5 rounded-2xl bg-white text-slate-950 font-black text-xs cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL: SETTING A! */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[130] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0f1322] border border-pink-400/40 p-5 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-pink-400" />
                <h3 className="text-base font-black text-white">Setting A!</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* 1. Nama AI */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-zinc-200">
                1. Nama AI
              </label>
              <input
                type="text"
                value={settings.aiName}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, aiName: e.target.value }))
                }
                placeholder="A!"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-sm font-bold text-white outline-none focus:border-pink-400"
              />
            </div>

            {/* 2. Foto AI */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-zinc-200">
                2. Foto AI (Referensi Wajah &amp; Ekspresi)
              </label>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <img
                  src={settings.avatarUrl || DEFAULT_A_AVATAR}
                  alt="Avatar A!"
                  className="w-14 h-14 rounded-2xl object-cover object-top border border-pink-400/60"
                />
                <div className="flex-1 flex flex-wrap gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSelectAvatarPhoto}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon size={13} />
                    <span>Ganti Foto</span>
                  </button>
                  {settings.avatarUrl !== DEFAULT_A_AVATAR && (
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          avatarUrl: DEFAULT_A_AVATAR
                        }))
                      }
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-zinc-200 text-xs font-bold cursor-pointer"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Tema Latar Belakang */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-zinc-200">
                3. Tema Latar Belakang
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'blue-stars', label: 'Biru + Bintang Putih' },
                    { id: 'midnight-navy', label: 'Midnight Navy' },
                    { id: 'pink-night', label: 'Pink Night' },
                    { id: 'aurora-purple', label: 'Ungu Aurora' },
                    { id: 'custom', label: 'Custom Warna' }
                  ] as const
                ).map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, bgTheme: bg.id }))
                    }
                    className={`px-3 py-2 rounded-xl border text-xs font-bold text-left cursor-pointer transition ${
                      settings.bgTheme === bg.id
                        ? 'bg-pink-500/25 border-pink-400 text-white'
                        : 'bg-white/5 border-white/10 text-zinc-300'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
              {settings.bgTheme === 'custom' && (
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold">
                  <span>Pilih Warna Latar</span>
                  <input
                    type="color"
                    value={settings.customBgColor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        customBgColor: e.target.value
                      }))
                    }
                    className="w-8 h-8 rounded bg-transparent cursor-pointer"
                  />
                </label>
              )}
            </div>

            {/* 4. Bubble AI & Bubble User */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-zinc-200">
                4. Bubble AI &amp; Bubble User
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'default', label: 'Default' },
                    { id: 'whee-sketch', label: 'Whee Sketch' },
                    { id: 'bubbly-otter', label: 'Bubbly Otter' },
                    { id: 'glam-diva', label: 'Glam Diva' },
                    { id: 'custom', label: 'Custom Warna' }
                  ] as const
                ).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, bubbleStyle: b.id }))
                    }
                    className={`px-3 py-2 rounded-xl border text-xs font-bold text-left cursor-pointer transition ${
                      settings.bubbleStyle === b.id
                        ? 'bg-pink-500/25 border-pink-400 text-white'
                        : 'bg-white/5 border-white/10 text-zinc-300'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {settings.bubbleStyle === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold flex items-center justify-between">
                    <span>Bubble AI</span>
                    <input
                      type="color"
                      value={settings.customAiBubbleColor}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          customAiBubbleColor: e.target.value
                        }))
                      }
                      className="w-7 h-7 bg-transparent cursor-pointer"
                    />
                  </label>
                  <label className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold flex items-center justify-between">
                    <span>Bubble User</span>
                    <input
                      type="color"
                      value={settings.customUserBubbleColor}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          customUserBubbleColor: e.target.value
                        }))
                      }
                      className="w-7 h-7 bg-transparent cursor-pointer"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* 5. Pengaturan Suara A! (Mode Suara, Indikator Limit, Cache & Custom Voice — ZERO Google TTS) */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-white/5 border border-white/15">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-extrabold text-zinc-100">
                  5. Setting Suara A! (Anti Google TTS)
                </label>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    voicePrefs.voiceMode === 'local-mp3'
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50'
                      : voicePrefs.voiceMode === 'silent'
                      ? 'bg-zinc-500/30 text-zinc-200 border border-white/20'
                      : settings.customVoiceEmbedding
                      ? 'bg-pink-500/25 text-pink-200 border border-pink-400/50'
                      : 'bg-sky-500/20 text-sky-200 border border-sky-400/40'
                  }`}
                >
                  {voicePrefs.voiceMode === 'local-mp3'
                    ? 'MP3 Lokal (Unlimited)'
                    : voicePrefs.voiceMode === 'silent'
                    ? 'Tanpa Suara'
                    : settings.customVoiceEmbedding
                    ? 'Suara Custom API'
                    : 'ZE API Standard'}
                </span>
              </div>

              {/* 3 Mode Suara */}
              <div className="space-y-1.5">
                {(
                  [
                    {
                      id: 'custom-api' as VoiceMode,
                      title: 'Suara Custom API (Gemini Voice Clone)',
                      desc: 'Suara natural & custom embedding, ada kuota harian',
                    },
                    {
                      id: 'local-mp3' as VoiceMode,
                      title: 'Suara File Lokal MP3',
                      desc: 'Gratis unlimited, puter file MP3 lokal (bukan Google)',
                    },
                    {
                      id: 'silent' as VoiceMode,
                      title: 'Tanpa Suara',
                      desc: 'Teks aja, tidak memutar audio apa pun',
                    },
                  ]
                ).map((modeOpt) => {
                  const isActive = voicePrefs.voiceMode === modeOpt.id;
                  return (
                    <button
                      key={modeOpt.id}
                      type="button"
                      onClick={() => {
                        stopAllVoicePlayback();
                        const updated = savePersistedVoicePrefs({ voiceMode: modeOpt.id });
                        setVoicePrefs(updated);
                        showToast(`Mode suara: ${modeOpt.title}`);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-pink-500/20 border-pink-400 text-white'
                          : 'bg-black/30 border-white/10 text-zinc-300 hover:border-white/25'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-extrabold leading-tight">{modeOpt.title}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{modeOpt.desc}</p>
                      </div>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-pink-500 border-pink-300 text-white' : 'border-white/30'
                        }`}
                      >
                        {isActive && <Check size={10} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Indikator Limit & Cache Kuota Suara */}
              <div className="p-2.5 rounded-xl bg-black/35 border border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-bold text-zinc-200">Status Kuota API Suara</span>
                  <span
                    className={`font-black ${
                      voiceQuota.limit - voiceQuota.used <= 0
                        ? 'text-rose-400'
                        : 'text-emerald-300'
                    }`}
                  >
                    {voicePrefs.voiceMode === 'local-mp3'
                      ? 'Unlimited'
                      : `Sisa ${Math.max(0, voiceQuota.limit - voiceQuota.used)} / ${voiceQuota.limit}`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[9px] text-zinc-400">Terpakai</p>
                    <p className="text-[11px] font-extrabold text-white">{voiceQuota.used}x</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[9px] text-zinc-400">Cache Hemat</p>
                    <p className="text-[11px] font-extrabold text-emerald-300">{voiceCacheCount} teks</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[9px] text-zinc-400">Reset Kuota</p>
                    <p className="text-[11px] font-extrabold text-sky-300">
                      {new Date(voiceQuota.resetAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voicePrefs.localBackupOnLimit}
                    onChange={(e) => {
                      const updated = savePersistedVoicePrefs({
                        localBackupOnLimit: e.target.checked,
                      });
                      setVoicePrefs(updated);
                    }}
                    className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer shrink-0"
                  />
                  <span className="text-[10px] font-semibold text-zinc-300 leading-tight">
                    Saat limit API habis / offline, otomatis putar cadangan MP3 lokal (jangan pernah ke Google TTS)
                  </span>
                </label>
              </div>

              {/* Mandatory Own Voice Consent Checkbox */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-black/30 border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ownVoiceConsent}
                  onChange={(e) => setOwnVoiceConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-pink-500 cursor-pointer shrink-0"
                />
                <span className="text-[11px] font-bold text-zinc-200 leading-snug">
                  Ini adalah suara saya sendiri, saya setuju dipakai untuk A!
                </span>
              </label>

              {/* Upload (.mp3/.wav/.mp4/.mov) & Rekam Langsung */}
              <input
                ref={customVoiceInputRef}
                type="file"
                accept=".mp3,.wav,.mp4,.mov,audio/*,video/*"
                onChange={handleUploadCustomVoiceFile}
                className="hidden"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!ownVoiceConsent || isExtractingVoice || isRecordingCustomVoice}
                  onClick={() => customVoiceInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-pink-500 hover:bg-pink-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  {isExtractingVoice ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  <span>Upload Audio/Video</span>
                </button>

                <button
                  type="button"
                  disabled={!ownVoiceConsent || isExtractingVoice}
                  onClick={toggleRecordCustomVoice}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed ${
                    isRecordingCustomVoice
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {isRecordingCustomVoice ? <Square size={13} /> : <Mic size={14} />}
                  <span>
                    {isRecordingCustomVoice
                      ? `Stop (${customVoiceRecSec}s)`
                      : 'Rekam Langsung'}
                  </span>
                </button>
              </div>

              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Format: .mp3 / .wav / .mp4 / .mov. Video otomatis dibuang dan hanya karakteristik suara (timbre, nada, pitch) yang diambil. Tersimpan permanen di memori APK.
              </p>

              {voiceSaveSuccessMsg && (
                <div className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-extrabold">
                  {voiceSaveSuccessMsg}
                </div>
              )}

              {settings.customVoiceEmbedding && (
                <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-400/35 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold text-pink-200 truncate">
                      Profil: {settings.customVoiceEmbedding.summary} ({settings.customVoiceEmbedding.pitchHz}Hz)
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      Sumber: {settings.customVoiceEmbedding.sourceLabel || 'Audio Custom'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      stopAllVoicePlayback();
                      setVoiceSaveSuccessMsg(null);
                      savePersistedCustomVoiceEmbedding(null);
                      setSettings((prev) => ({
                        ...prev,
                        voiceId: 'ze-standard',
                        customVoiceEmbedding: null
                      }));
                      showToast('Kembali ke Suara Default (ZE.ai Standard).');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Hapus Suara Custom"
                  >
                    <Trash2 size={12} />
                    <span>Hapus</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                disabled={isExtractingVoice}
                onClick={() => {
                  if (isTestingVoice) {
                    stopAllVoicePlayback();
                  } else {
                    setIsTestingVoice(true);
                    const sampleSentence = settings.customVoiceEmbedding
                      ? 'Halo, ini suara custom aku'
                      : `IYAA! Halo, aku ${settings.aiName || 'A!'}. Ini suara custom aku.`;
                    speakWithSelectedVoice(sampleSentence, {
                      onEnd: () => setIsTestingVoice(false)
                    });
                  }
                }}
                className={`w-full py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                  isTestingVoice
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                <Volume2 size={15} />
                <span>{isTestingVoice ? 'BERBUNYI... (TAP STOP)' : 'TES SUARA'}</span>
              </button>
            </div>

            {/* 6. Custom Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-zinc-200">
                6. Custom Prompt
              </label>
              <textarea
                rows={3}
                value={settings.customPrompt}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, customPrompt: e.target.value }))
                }
                placeholder="Contoh: Panggil aku kakak, selalu ingetin aku minum air putih..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-xs text-white placeholder-zinc-400 outline-none focus:border-pink-400 resize-none"
              />
            </div>

            {/* 7. Mode Chat 18+ (Dewasa Romantis Terbatas) */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-400/30">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-rose-100">
                  7. Mode Chat 18+ (Khusus 18+)
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    settings.adultMode18Plus
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/10 text-zinc-300'
                  }`}
                >
                  {settings.adultMode18Plus ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.adultMode18Plus)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSettings((prev) => ({ ...prev, adultMode18Plus: checked }));
                    showToast(
                      checked
                        ? 'Mode 18+ (Romantis Dewasa Sopan) diaktifkan.'
                        : 'Mode 18+ dinonaktifkan.'
                    );
                  }}
                  className="mt-0.5 w-4 h-4 accent-rose-500 cursor-pointer shrink-0"
                />
                <span className="text-[11px] font-semibold text-zinc-200 leading-snug">
                  Saya berusia 18 tahun ke atas &amp; izinkan obrolan romantis dewasa yang hangat, manja, dan menggoda secara sopan (tidak berlebihan / non-vulgar).
                </span>
              </label>
            </div>

            {/* Clear Chat + Done */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  stopAllVoicePlayback();
                  setCompanionState(DEFAULT_A_STATE);
                  setMessages([
                    {
                      id: 'a_reset_' + Date.now(),
                      sender: 'ai',
                      text: `IYAA! Chat udah aku bersihin yaa, yuk mulai ngobrol lagi sa-yang!`,
                      expression: chatMode === 'chat' ? 'semangat' : undefined,
                      pose: chatMode === 'chat' ? 'berdiri' : undefined,
                      gesture: chatMode === 'chat' ? 'dadah' : undefined,
                      poseVariant: 0,
                      time: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    }
                  ]);
                  setShowSettings(false);
                }}
                className="px-4 py-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold cursor-pointer"
              >
                Reset Chat
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs cursor-pointer shadow-lg"
              >
                Simpan &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REAL CALL SCREEN (📞) */}
      {isInCall && (
        <div className="fixed inset-0 z-[150] bg-gradient-to-b from-[#071330] via-[#13183b] to-[#080a16] flex flex-col items-center justify-between p-6 text-white">
          <div className="w-full max-w-md flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {callStatus}
            </span>
            <button
              type="button"
              onClick={() => {
                endRealCall();
                onCloseAll();
              }}
              className="text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
            >
              Keluar App
            </button>
          </div>

          {/* Center Avatar, Name, Status, Timer */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              {isCallAiSpeaking && (
                <div className="absolute -inset-4 rounded-full border-2 border-pink-400/70 animate-ping" />
              )}
              <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-pink-500/40 to-purple-500/40 blur-md" />
              <img
                src={settings.avatarUrl || DEFAULT_A_AVATAR}
                alt={settings.aiName}
                className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover object-top border-4 border-pink-400/80 shadow-[0_0_40px_rgba(236,72,153,0.45)]"
              />
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight">
                {settings.aiName || 'A!'}
              </h2>
              <p className="text-sm font-bold text-emerald-300 mt-1">{callStatus}</p>
              <p className="text-xl font-mono font-black text-white mt-2 tracking-wider">
                {formatDurationSec(callSeconds)}
              </p>
            </div>

            {/* Live transcript / speaking indicator */}
            <div className="min-h-[44px] max-w-xs px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs text-zinc-100 leading-relaxed">
              {isCallAiSpeaking
                ? callTranscript || `${settings.aiName} lagi ngomong...`
                : isMuted
                ? 'Mikrofon sedang di-mute.'
                : callTranscript ||
                  (speechRecSupported
                    ? 'Ngomong aja langsung ke mic...'
                    : 'Ketik ucapan di bawah kalau mic browser gak auto-transcribe.')}
            </div>

            {/* Optional quick voice-turn text fallback for devices without Web SpeechRecognition */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!callManualText.trim()) return;
                const txt = callManualText.trim();
                setCallManualText('');
                handleCallUserUtterance(txt);
              }}
              className="flex items-center gap-2 w-full max-w-xs"
            >
              <input
                type="text"
                value={callManualText}
                onChange={(e) => setCallManualText(e.target.value)}
                placeholder="Atau ketik ucapan saat call..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-zinc-400 outline-none focus:border-pink-400"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-pink-500 text-white text-xs font-bold cursor-pointer"
              >
                Kirim
              </button>
            </form>
          </div>

          {/* Call Bottom Controls: MUTE & TUTUP CALL */}
          <div className="flex items-center justify-center gap-8 pb-6">
            <button
              type="button"
              onClick={toggleCallMute}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center border transition shadow-xl group-active:scale-95 ${
                  isMuted
                    ? 'bg-amber-500 border-amber-300 text-slate-950'
                    : 'bg-white/15 border-white/25 text-white hover:bg-white/25'
                }`}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </div>
              <span className="text-xs font-black tracking-wide">
                {isMuted ? 'UNMUTE' : 'MUTE'}
              </span>
            </button>

            <button
              type="button"
              onClick={endRealCall}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 border-2 border-rose-300/60 text-white flex items-center justify-center transition shadow-[0_0_28px_rgba(225,29,72,0.7)] group-active:scale-95">
                <PhoneOff size={24} />
              </div>
              <span className="text-xs font-black tracking-wide text-rose-300">
                TUTUP CALL
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
