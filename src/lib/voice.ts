/**
 * ============================================================================
 * PENJELASAN ARSITEKTUR SUARA A! (CUSTOM VOICE ENGINE - ZERO GOOGLE TTS)
 * ============================================================================
 * 1. SUARA CUSTOM INI PAKE APA?
 *    - Mode "Suara Custom API" (`custom-api`): Memanggil endpoint server
 *      `/api/ze-ai/tts` yang memakai Gemini Audio TTS (`@google/genai`:
 *      `gemini-3.8-flash-tts`, `gemini-3.8-flash-lite-tts`, `gemini-3.8-flash`)
 *      dengan karakteristik timbre/pitch/cadence dari rekaman/upload custom
 *      (`customVoiceEmbedding`). BUKAN TTS bawaan browser atau HP!
 *    - Mode "Suara File Lokal MP3" (`local-mp3`): Memutar file audio MP3/WAV
 *      asli yang sudah di-bundle langsung di dalam app & APK
 *      (`/assets/aistudio/*.mp3` dan `/assets/vn_girl_sayang_ref_8s.wav`).
 *      100% gratis unlimited, tidak pernah kena limit API, dan jalan offline.
 *    - Mode "Tanpa Suara" (`silent`): Hanya mengirim teks tanpa memutar audio.
 *
 * 2. LARANGAN MUTLAK FALLBACK KE GOOGLE TTS / SYSTEM TTS:
 *    - File ini & seluruh codebase ZE.io TIDAK PERNAH memakai Web Speech API
 *      bawaan browser maupun service Google Android TTS bawaan perangkat.
 *    - Jika API limit habis (HTTP 429) atau internet mati / server gagal:
 *      JANGAN PERNAH fallback ke suara bawaan HP/Google. Sistem akan:
 *      (a) Menampilkan status `"Suara custom lagi abis limit, coba lagi nanti"`
 *          sambil tetap mengirim teks chat, ATAU
 *      (b) Memutar suara cadangan dari file MP3 lokal yang sudah di-preload
 *          (jika opsi cadangan MP3 lokal diaktifkan).
 *
 * 3. HEMAT KUOTA & PERSISTENSI APK:
 *    - Sistem antrian berurutan (queue) agar request tidak balapan/dobel.
 *    - Cache permanen (Memory Map + IndexedDB `ze_voice_audio_cache_v1`):
 *      kalau kalimat yang sama pernah diucapin, langsung putar dari cache tanpa
 *      memanggil API atau memotong kuota lagi.
 *    - Seluruh pilihan suara (`ze_voice_mode`, `ze_voice_id`,
 *      `ze_voice_custom_embedding`, `ze_voice_quota_v1`) disimpan di localStorage
 *      sehingga tidak pernah ke-reset saat aplikasi dibungkus menjadi APK.
 * ============================================================================
 */

export type VoiceMode = 'custom-api' | 'local-mp3' | 'silent';

export interface VoiceEmbeddingConfig {
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

export interface PersistedVoicePrefs {
  voiceMode: VoiceMode;
  voiceId: string;
  voicePitch: number;
  voiceSpeed: number;
  localBackupOnLimit: boolean;
}

export interface VoiceQuotaState {
  used: number;
  limit: number;
  resetAt: number;
  exhaustedUntil?: number;
}

export const VOICE_STORAGE_KEYS = {
  mode: 'ze_voice_mode',
  id: 'ze_voice_id',
  pitch: 'ze_voice_pitch',
  speed: 'ze_voice_speed',
  localBackup: 'ze_voice_local_backup',
  quota: 'ze_voice_quota_v1',
  customEmbedding: 'ze_voice_custom_embedding',
} as const;

export const LOCAL_VOICE_MP3_ASSETS: string[] = [
  '/assets/aistudio/Diam-diam__saya_sayang_kamu.__21.09___vn__voice__fyp__foryou__sundaynight_audio_00ee7ac2.mp3',
  '/assets/aistudio/Request_from_someone__voicenote__suaracewek__vn__pacar__4u__audio_73258909.mp3',
  '/assets/aistudio/pov_vc_sama_intan____jkt48__intanjkt48__audio_16bb5df6.mp3',
  '/assets/vn_girl_sayang_ref_8s.wav',
];

const DEFAULT_DAILY_QUOTA_LIMIT = 30;
const VOICE_UPDATE_EVENT = 'ze-voice-state-updated';
const IDB_NAME = 'ze_voice_cache_db_v1';
const IDB_STORE = 'audio_blobs';
const MAX_IDB_CACHE_ITEMS = 120;

const DEFAULT_VOICE_PREFS: PersistedVoicePrefs = {
  voiceMode: 'custom-api',
  voiceId: 'ze-standard',
  voicePitch: 1.0,
  voiceSpeed: 1.0,
  localBackupOnLimit: true,
};

function clampNumber(val: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

function getNextMidnightTimestamp(): number {
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  return next.getTime();
}

export function getPersistedVoicePrefs(): PersistedVoicePrefs {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { ...DEFAULT_VOICE_PREFS };
  }
  try {
    const rawMode = localStorage.getItem(VOICE_STORAGE_KEYS.mode);
    const voiceMode: VoiceMode =
      rawMode === 'local-mp3' || rawMode === 'silent' || rawMode === 'custom-api'
        ? rawMode
        : DEFAULT_VOICE_PREFS.voiceMode;

    const storedId = localStorage.getItem(VOICE_STORAGE_KEYS.id);
    const storedPitch = localStorage.getItem(VOICE_STORAGE_KEYS.pitch);
    const storedSpeed = localStorage.getItem(VOICE_STORAGE_KEYS.speed);
    const storedBackup = localStorage.getItem(VOICE_STORAGE_KEYS.localBackup);

    const voiceId = storedId && storedId.trim() ? storedId.trim() : DEFAULT_VOICE_PREFS.voiceId;
    const voicePitch = clampNumber(Number(storedPitch ?? DEFAULT_VOICE_PREFS.voicePitch), 0.75, 1.35, 1.0);
    const voiceSpeed = clampNumber(Number(storedSpeed ?? DEFAULT_VOICE_PREFS.voiceSpeed), 0.8, 1.25, 1.0);
    const localBackupOnLimit = storedBackup === null ? true : storedBackup === 'true';

    if (!rawMode) localStorage.setItem(VOICE_STORAGE_KEYS.mode, voiceMode);
    if (!storedId) localStorage.setItem(VOICE_STORAGE_KEYS.id, voiceId);
    if (!storedPitch) localStorage.setItem(VOICE_STORAGE_KEYS.pitch, String(voicePitch));
    if (!storedSpeed) localStorage.setItem(VOICE_STORAGE_KEYS.speed, String(voiceSpeed));
    if (storedBackup === null) localStorage.setItem(VOICE_STORAGE_KEYS.localBackup, String(localBackupOnLimit));

    return { voiceMode, voiceId, voicePitch, voiceSpeed, localBackupOnLimit };
  } catch {
    return { ...DEFAULT_VOICE_PREFS };
  }
}

export function savePersistedVoicePrefs(patch: Partial<PersistedVoicePrefs>): PersistedVoicePrefs {
  const current = getPersistedVoicePrefs();
  const next: PersistedVoicePrefs = {
    voiceMode:
      patch.voiceMode === 'local-mp3' || patch.voiceMode === 'silent' || patch.voiceMode === 'custom-api'
        ? patch.voiceMode
        : current.voiceMode,
    voiceId: patch.voiceId && patch.voiceId.trim() ? patch.voiceId.trim() : current.voiceId,
    voicePitch:
      patch.voicePitch !== undefined
        ? clampNumber(Number(patch.voicePitch), 0.75, 1.35, current.voicePitch)
        : current.voicePitch,
    voiceSpeed:
      patch.voiceSpeed !== undefined
        ? clampNumber(Number(patch.voiceSpeed), 0.8, 1.25, current.voiceSpeed)
        : current.voiceSpeed,
    localBackupOnLimit:
      patch.localBackupOnLimit !== undefined ? Boolean(patch.localBackupOnLimit) : current.localBackupOnLimit,
  };
  try {
    localStorage.setItem(VOICE_STORAGE_KEYS.mode, next.voiceMode);
    localStorage.setItem(VOICE_STORAGE_KEYS.id, next.voiceId);
    localStorage.setItem(VOICE_STORAGE_KEYS.pitch, String(next.voicePitch));
    localStorage.setItem(VOICE_STORAGE_KEYS.speed, String(next.voiceSpeed));
    localStorage.setItem(VOICE_STORAGE_KEYS.localBackup, String(next.localBackupOnLimit));
    window.dispatchEvent(new CustomEvent(VOICE_UPDATE_EVENT));
  } catch {}
  return next;
}

export function getPersistedCustomVoiceEmbedding(): VoiceEmbeddingConfig | null {
  try {
    const raw = localStorage.getItem(VOICE_STORAGE_KEYS.customEmbedding);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.baseVoiceName && parsed.stylePrompt) {
      return parsed as VoiceEmbeddingConfig;
    }
  } catch {}
  return null;
}

export function savePersistedCustomVoiceEmbedding(emb: VoiceEmbeddingConfig | null): void {
  try {
    if (emb) {
      localStorage.setItem(VOICE_STORAGE_KEYS.customEmbedding, JSON.stringify(emb));
      savePersistedVoicePrefs({ voiceId: 'custom-voice' });
    } else {
      localStorage.removeItem(VOICE_STORAGE_KEYS.customEmbedding);
      savePersistedVoicePrefs({ voiceId: 'ze-standard' });
    }
    window.dispatchEvent(new CustomEvent(VOICE_UPDATE_EVENT));
  } catch {}
}

export function getVoiceQuotaState(): VoiceQuotaState {
  const now = Date.now();
  const fallback: VoiceQuotaState = {
    used: 0,
    limit: DEFAULT_DAILY_QUOTA_LIMIT,
    resetAt: getNextMidnightTimestamp(),
  };
  if (typeof localStorage === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(VOICE_STORAGE_KEYS.quota);
    if (!raw) {
      localStorage.setItem(VOICE_STORAGE_KEYS.quota, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw) as VoiceQuotaState;
    if (!parsed || !parsed.resetAt || now >= parsed.resetAt) {
      localStorage.setItem(VOICE_STORAGE_KEYS.quota, JSON.stringify(fallback));
      return fallback;
    }
    const limit = Math.max(1, Number(parsed.limit) || DEFAULT_DAILY_QUOTA_LIMIT);
    const used = Math.max(0, Math.min(limit, Number(parsed.used) || 0));
    const exhaustedUntil =
      parsed.exhaustedUntil && parsed.exhaustedUntil > now ? parsed.exhaustedUntil : undefined;
    return { used, limit, resetAt: parsed.resetAt, exhaustedUntil };
  } catch {
    return fallback;
  }
}

function saveVoiceQuotaState(next: VoiceQuotaState): VoiceQuotaState {
  try {
    localStorage.setItem(VOICE_STORAGE_KEYS.quota, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(VOICE_UPDATE_EVENT));
  } catch {}
  return next;
}

export function recordQuotaUsage(delta = 1): VoiceQuotaState {
  const cur = getVoiceQuotaState();
  const used = Math.min(cur.limit, cur.used + delta);
  return saveVoiceQuotaState({
    ...cur,
    used,
  });
}

export function markQuotaExhausted(cooldownMinutes = 60): VoiceQuotaState {
  const cur = getVoiceQuotaState();
  return saveVoiceQuotaState({
    ...cur,
    used: cur.limit,
    exhaustedUntil: Date.now() + cooldownMinutes * 60 * 1000,
  });
}

export function resetVoiceQuotaForTesting(): VoiceQuotaState {
  const fresh: VoiceQuotaState = {
    used: 0,
    limit: DEFAULT_DAILY_QUOTA_LIMIT,
    resetAt: getNextMidnightTimestamp(),
  };
  return saveVoiceQuotaState(fresh);
}

export function isVoiceApiLimitReached(): boolean {
  const q = getVoiceQuotaState();
  if (q.used >= q.limit) return true;
  if (q.exhaustedUntil && Date.now() < q.exhaustedUntil) return true;
  return false;
}

export function subscribeVoiceStateUpdates(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(VOICE_UPDATE_EVENT, cb);
  return () => window.removeEventListener(VOICE_UPDATE_EVENT, cb);
}

export function normalisasiTTS(teks: string): string {
  let result = teks;
  result = result.replace(/\bsa-yang[\s-]*ku\b/gi, 'sa ya eng ku');
  result = result.replace(/\bsa-yang\b/gi, 'sa ya eng');
  const mandatoryDictionary: Record<string, string> = {
    sayangku: 'sa ya eng ku',
    'sayang ku': 'sa ya eng ku',
    sayang: 'sa ya eng',
    ayang: 'sa ya eng',
  };

  for (const [word, phonetic] of Object.entries(mandatoryDictionary)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, phonetic);
  }

  result = result.replace(/\bs[ay]*ng+\b/gi, 'sa ya eng');
  result = result.replace(/\ba[ay]*ng+\b/gi, 'sa ya eng');
  result = result.replace(/\bbgt\b/gi, 'baanget');
  result = result.replace(/\bbanget+?\b/gi, (match) =>
    match.length > 6 ? 'baaaaanget' : 'baanget'
  );

  const slangMap: Record<string, string> = {
    '\\bgw\\b': 'gua',
    '\\bgue\\b': 'gua',
    '\\blu\\b': 'lu',
    '\\blo\\b': 'lu',
    '\\bgk\\b': 'nggak',
    '\\bgak\\b': 'nggak',
    '\\bga\\b': 'nggak',
    '\\budh\\b': 'udah',
    '\\bjgn\\b': 'jangan',
    '\\bklo\\b': 'kalo',
    '\\bmksh\\b': 'makasih',
    '\\bmks\\b': 'makasih',
    '\\bgpp\\b': 'nggak apa-apa',
    '\\botw\\b': 'on the way',
  };

  for (const [pattern, replacement] of Object.entries(slangMap)) {
    result = result.replace(new RegExp(pattern, 'gi'), replacement);
  }

  result = result.replace(/\byang\b/gi, 'ng');
  return result;
}

export function cleanTextForSpeech(raw: string): string {
  return String(raw || '')
    .replace(/\[Label:[\s\S]*?\]/gi, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*?`/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ''
    )
    .replace(/[*#_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function prepareZeStandardSpokenText(raw: string): string {
  const cleanText = cleanTextForSpeech(raw);
  if (!cleanText) return '';
  let modifiedText = cleanText
    .replace(/Halo/gi, 'Hai')
    .replace(/Saya/gi, 'aku')
    .replace(/Anda/gi, 'kamu')
    .replace(/Terima kasih/gi, 'makasih yaa')
    .replace(/Maaf/gi, 'maaf ya')
    .replace(/\bYa\b/gi, 'Iya')
    .replace(/Silahkan/gi, 'boleh banget')
    .replace(/Mohon maaf/gi, 'maaf yaa')
    .replace(/\?$/g, ' nih? hehe')
    .replace(/\.$/g, ' yaa..');

  if (modifiedText.toLowerCase().includes('tanya apa')) {
    modifiedText = modifiedText.replace(/tanya apa/gi, 'tanya apa nih? hehe');
  }

  return normalisasiTTS(modifiedText).trim() + ' hehe';
}

// ============================================================================
// PERSISTENT AUDIO CACHE (MEMORY + INDEXEDDB) + LOCAL MP3 ASSET PRELOADER
// ============================================================================
const audioBlobCache = new Map<string, Blob>();
const localAssetBlobCache = new Map<string, Blob>();
let localPreloadPromise: Promise<void> | null = null;
let cachedPhraseCount = 0;

function openVoiceDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getCachedVoiceBlob(key: string): Promise<Blob | null> {
  const mem = audioBlobCache.get(key);
  if (mem) return mem;

  const db = await openVoiceDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const record = req.result as { key: string; blob: Blob } | undefined;
        if (record?.blob) {
          audioBlobCache.set(key, record.blob);
          resolve(record.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function setCachedVoiceBlob(key: string, blob: Blob): Promise<void> {
  audioBlobCache.set(key, blob);
  if (audioBlobCache.size > 60) {
    const firstKey = audioBlobCache.keys().next().value;
    if (firstKey) audioBlobCache.delete(firstKey);
  }

  const db = await openVoiceDb();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put({ key, blob, updatedAt: Date.now() });
    const countReq = store.count();
    countReq.onsuccess = () => {
      cachedPhraseCount = countReq.result;
      if (countReq.result > MAX_IDB_CACHE_ITEMS) {
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            store.delete(cursor.primaryKey);
          }
        };
      }
      window.dispatchEvent(new CustomEvent(VOICE_UPDATE_EVENT));
    };
  } catch {}
}

export async function getVoiceCacheCount(): Promise<number> {
  const db = await openVoiceDb();
  if (!db) return audioBlobCache.size;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).count();
      req.onsuccess = () => {
        cachedPhraseCount = req.result;
        resolve(req.result);
      };
      req.onerror = () => resolve(audioBlobCache.size);
    } catch {
      resolve(audioBlobCache.size);
    }
  });
}

export function getEstimatedVoiceCacheCount(): number {
  return Math.max(cachedPhraseCount, audioBlobCache.size);
}

/**
 * Preload bundled MP3/WAV files into memory on app/APK launch so offline/local mode
 * plays instantaneously without touching network or external TTS.
 */
export function preloadLocalVoiceAssets(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (localPreloadPromise) return localPreloadPromise;

  localPreloadPromise = Promise.all(
    LOCAL_VOICE_MP3_ASSETS.map(async (assetUrl) => {
      if (localAssetBlobCache.has(assetUrl)) return;
      try {
        const res = await fetch(assetUrl, { cache: 'force-cache' });
        if (res.ok) {
          const blob = await res.blob();
          if (blob && blob.size > 200) {
            localAssetBlobCache.set(assetUrl, blob);
          }
        }
      } catch {
        // Direct URL fallback stays valid inside APK WebView
      }
    })
  ).then(() => {
    getVoiceCacheCount().catch(() => {});
  });

  return localPreloadPromise;
}

let localTrackCursor = 0;
function pickLocalMp3Url(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('sayang') || lower.includes('sa-yang') || lower.includes('cinta') || lower.includes('kangen')) {
    return LOCAL_VOICE_MP3_ASSETS[0];
  }
  if (lower.includes('call') || lower.includes('halo') || lower.includes('vc')) {
    return LOCAL_VOICE_MP3_ASSETS[2];
  }
  const idx = localTrackCursor % LOCAL_VOICE_MP3_ASSETS.length;
  localTrackCursor += 1;
  return LOCAL_VOICE_MP3_ASSETS[idx];
}

// ============================================================================
// PLAYBACK CONTROLLER + SEQUENTIAL QUEUE
// ============================================================================
let currentAudio: HTMLAudioElement | null = null;
let currentBlobUrl: string | null = null;
let currentAbortController: AbortController | null = null;
let voiceQueueTail: Promise<void> = Promise.resolve();
let activePlaybackToken = 0;

export function stopAllUnifiedVoice(): void {
  activePlaybackToken += 1;
  if (currentAbortController) {
    try {
      currentAbortController.abort();
    } catch {}
    currentAbortController = null;
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.onended = null;
      currentAudio.onerror = null;
    } catch {}
    currentAudio = null;
  }
  if (currentBlobUrl && currentBlobUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(currentBlobUrl);
    } catch {}
    currentBlobUrl = null;
  }
}

function waitMs(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function resolveTtsEndpoint(): string {
  if (typeof window !== 'undefined' && window.location?.origin?.startsWith('http')) {
    return `${window.location.origin}/api/ze-ai/tts`;
  }
  return '/api/ze-ai/tts';
}

export type UnifiedVoiceStatus =
  | 'loading'
  | 'playing'
  | 'idle'
  | 'error'
  | 'limit-reached'
  | 'local-backup'
  | 'silent';

export interface SpeakVoiceOptions {
  msgId?: string;
  existingAudioUrl?: string;
  voiceId?: string;
  voiceModeOverride?: VoiceMode;
  customVoiceEmbedding?: VoiceEmbeddingConfig | null;
  queue?: boolean;
  onStatusChange?: (status: UnifiedVoiceStatus, label?: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

const MAX_RETRIES = 2;

async function playAudioBlobOrUrl(
  source: { blob?: Blob; url?: string },
  playbackRate: number,
  token: number,
  opts?: SpeakVoiceOptions,
  playingStatus: 'playing' | 'local-backup' = 'playing',
  playingLabel?: string
): Promise<boolean> {
  if (token !== activePlaybackToken) return false;

  let playUrl = source.url || '';
  let isCreatedBlobUrl = false;
  if (source.blob) {
    playUrl = URL.createObjectURL(source.blob);
    currentBlobUrl = playUrl;
    isCreatedBlobUrl = true;
  }

  return new Promise<boolean>((resolve) => {
    const audio = new Audio(playUrl);
    audio.playbackRate = clampNumber(playbackRate, 0.82, 1.22, 1.0);
    if ('preservesPitch' in audio) {
      (audio as any).preservesPitch = false;
    }
    if ('webkitPreservesPitch' in audio) {
      (audio as any).webkitPreservesPitch = false;
    }

    currentAudio = audio;
    opts?.onStatusChange?.(playingStatus, playingLabel);
    opts?.onStart?.();

    const cleanup = () => {
      if (currentAudio === audio) currentAudio = null;
      if (isCreatedBlobUrl && currentBlobUrl === playUrl) {
        try {
          URL.revokeObjectURL(playUrl);
        } catch {}
        currentBlobUrl = null;
      }
    };

    audio.onended = () => {
      cleanup();
      opts?.onStatusChange?.('idle');
      opts?.onEnd?.();
      resolve(true);
    };
    audio.onerror = () => {
      cleanup();
      opts?.onStatusChange?.('error', 'Gagal memutar file audio lokal.');
      opts?.onEnd?.();
      resolve(false);
    };
    audio.play().catch(() => {
      cleanup();
      opts?.onStatusChange?.('idle');
      opts?.onEnd?.();
      resolve(false);
    });
  });
}

async function playLocalMp3Voice(
  cleanSpeech: string,
  prefs: PersistedVoicePrefs,
  token: number,
  opts?: SpeakVoiceOptions,
  isBackupMode = false
): Promise<void> {
  await preloadLocalVoiceAssets().catch(() => {});
  if (token !== activePlaybackToken) return;

  const assetUrl = pickLocalMp3Url(cleanSpeech);
  const preloadedBlob = localAssetBlobCache.get(assetUrl);

  await playAudioBlobOrUrl(
    preloadedBlob ? { blob: preloadedBlob } : { url: assetUrl },
    prefs.voiceSpeed,
    token,
    opts,
    isBackupMode ? 'local-backup' : 'playing',
    isBackupMode ? 'Limit API habis — putar suara MP3 lokal (bukan Google)' : undefined
  );
}

async function executeSpeak(
  rawText: string,
  opts?: SpeakVoiceOptions
): Promise<void> {
  const token = ++activePlaybackToken;
  const cleanSpeech = cleanTextForSpeech(rawText);
  if (!cleanSpeech && !opts?.existingAudioUrl) {
    opts?.onStatusChange?.('idle');
    opts?.onEnd?.();
    return;
  }

  // Case 1: Pre-recorded audio URL (user voice note)
  if (opts?.existingAudioUrl) {
    await playAudioBlobOrUrl({ url: opts.existingAudioUrl }, 1.0, token, opts, 'playing');
    return;
  }

  const prefs = getPersistedVoicePrefs();
  const activeMode: VoiceMode = opts?.voiceModeOverride || prefs.voiceMode || 'custom-api';

  // Case 2: Mode Tanpa Suara (Teks aja)
  if (activeMode === 'silent') {
    opts?.onStatusChange?.('silent');
    opts?.onEnd?.();
    return;
  }

  // Case 3: Mode File Lokal MP3 (Gratis unlimited, nol kuota, nol Google TTS)
  if (activeMode === 'local-mp3') {
    await playLocalMp3Voice(cleanSpeech, prefs, token, opts, false);
    return;
  }

  // Case 4: Mode Suara Custom API (Gemini Audio TTS + Custom Embedding + Cache + Queue)
  const storedCustom = getPersistedCustomVoiceEmbedding();
  const activeVoiceId = opts?.voiceId || prefs.voiceId || (storedCustom ? 'custom-voice' : 'ze-standard');
  const activeCustomVoice =
    opts?.customVoiceEmbedding || (activeVoiceId === 'custom-voice' ? storedCustom : null);

  savePersistedVoicePrefs({
    voiceMode: activeMode,
    voiceId: activeCustomVoice ? 'custom-voice' : activeVoiceId,
    voicePitch: prefs.voicePitch,
    voiceSpeed: prefs.voiceSpeed,
  });

  const spokenPayload = activeCustomVoice
    ? cleanSpeech
    : prepareZeStandardSpokenText(cleanSpeech);

  if (!spokenPayload) {
    opts?.onStatusChange?.('idle');
    opts?.onEnd?.();
    return;
  }

  const cacheKey = `${activeCustomVoice ? activeCustomVoice.id : activeVoiceId}:${prefs.voicePitch}:${prefs.voiceSpeed}:${spokenPayload}`;
  opts?.onStatusChange?.('loading', 'Memuat suara custom...');

  // Step A: Cek cache permanen dulu (0 kuota terpakai!)
  let audioBlob = await getCachedVoiceBlob(cacheKey);
  if (token !== activePlaybackToken) {
    opts?.onStatusChange?.('idle');
    opts?.onEnd?.();
    return;
  }

  if (audioBlob) {
    const rateFromCustom = activeCustomVoice?.playbackRate
      ? clampNumber(activeCustomVoice.playbackRate, 0.9, 1.12, 1.0)
      : 1.0;
    await playAudioBlobOrUrl(
      { blob: audioBlob },
      rateFromCustom * prefs.voiceSpeed,
      token,
      opts,
      'playing'
    );
    return;
  }

  // Step B: Cek apakah kuota habis atau offline sebelum memanggil API
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (isOffline || isVoiceApiLimitReached()) {
    const limitLabel = 'Suara custom lagi abis limit, coba lagi nanti';
    opts?.onStatusChange?.('limit-reached', limitLabel);
    if (prefs.localBackupOnLimit) {
      await playLocalMp3Voice(cleanSpeech, prefs, token, opts, true);
    } else {
      opts?.onEnd?.();
    }
    return;
  }

  // Step C: Panggil endpoint server custom TTS (tanpa fallback ke Google TTS!)
  const controller = new AbortController();
  currentAbortController = controller;
  let limitHit = false;

  for (let attempt = 0; attempt <= MAX_RETRIES && !audioBlob; attempt++) {
    if (controller.signal.aborted || token !== activePlaybackToken) {
      opts?.onStatusChange?.('idle');
      opts?.onEnd?.();
      return;
    }

    if (attempt > 0) {
      try {
        await waitMs(400 * attempt, controller.signal);
      } catch {
        opts?.onStatusChange?.('idle');
        opts?.onEnd?.();
        return;
      }
    }

    try {
      const res = await fetch(resolveTtsEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: spokenPayload,
          voiceId: activeCustomVoice ? 'custom-voice' : activeVoiceId,
          voicePitch: prefs.voicePitch,
          voiceSpeed: prefs.voiceSpeed,
          customVoiceEmbedding: activeCustomVoice,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        limitHit = true;
        markQuotaExhausted(60);
        break;
      }

      if (!res.ok) {
        throw new Error(`Voice endpoint status ${res.status}`);
      }

      const blob = await res.blob();
      if (!blob || blob.size < 120) {
        throw new Error('Voice payload empty');
      }

      audioBlob = blob;
      recordQuotaUsage(1);
      await setCachedVoiceBlob(cacheKey, blob);
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        opts?.onStatusChange?.('idle');
        opts?.onEnd?.();
        return;
      }
    }
  }

  if (token !== activePlaybackToken) {
    opts?.onStatusChange?.('idle');
    opts?.onEnd?.();
    return;
  }

  // Jika gagal atau limit habis -> TIDAK PERNAH pindah ke Google TTS bawaan HP!
  if (!audioBlob) {
    const noticeMsg = 'Suara custom lagi abis limit, coba lagi nanti';
    opts?.onStatusChange?.(limitHit ? 'limit-reached' : 'error', noticeMsg);
    if (prefs.localBackupOnLimit) {
      await playLocalMp3Voice(cleanSpeech, prefs, token, opts, true);
    } else {
      opts?.onEnd?.();
    }
    return;
  }

  const rateFromCustom = activeCustomVoice?.playbackRate
    ? clampNumber(activeCustomVoice.playbackRate, 0.9, 1.12, 1.0)
    : 1.0;

  await playAudioBlobOrUrl(
    { blob: audioBlob },
    rateFromCustom * prefs.voiceSpeed,
    token,
    opts,
    'playing'
  );
}

export async function speakWithUnifiedVoice(
  rawText: string,
  opts?: SpeakVoiceOptions
): Promise<void> {
  if (opts?.queue) {
    const task = voiceQueueTail.then(() => executeSpeak(rawText, opts));
    voiceQueueTail = task.catch(() => {});
    return task;
  }
  stopAllUnifiedVoice();
  const task = executeSpeak(rawText, opts);
  voiceQueueTail = task.catch(() => {});
  return task;
}
