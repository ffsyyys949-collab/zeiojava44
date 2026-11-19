import React, { useEffect, useMemo } from 'react';
import type { AExpression, ASafePose } from './AiACompanion.tsx';

import zeyaBerdiriCutout from '../assets/images/zeya_berdiri_cutout.png';
import zeyaBerdiriDadahCutout from '../assets/images/zeya_berdiri_dadah_cutout.png';
import zeyaBerdiriAtasCutout from '../assets/images/zeya_berdiri_atas_cutout.png';
import zeyaBerdiriPipiCutout from '../assets/images/zeya_berdiri_pipi_cutout.png';
import zeyaBerdiriPinggangCutout from '../assets/images/zeya_berdiri_pinggang_cutout.png';
import zeyaBerdiriNanyaCutout from '../assets/images/zeya_berdiri_nanya_cutout.png';
import zeyaBerdiriCeritaCutout from '../assets/images/zeya_berdiri_cerita_cutout.png';
import zeyaPelukCutout from '../assets/images/zeya_peluk_cutout.png';
import zeyaNgambekCutout from '../assets/images/zeya_ngambek_cutout.png';
import zeyaDudukCutout from '../assets/images/zeya_duduk_cutout.png';
import zeyaDudukSenderanCutout from '../assets/images/zeya_duduk_senderan_cutout.png';
import zeyaDudukPelukLututCutout from '../assets/images/zeya_duduk_peluk_lutut_cutout.png';
import zeyaSedihCutout from '../assets/images/zeya_sedih_cutout.png';
import zeyaDudukNgambekCutout from '../assets/images/zeya_duduk_ngambek_cutout.png';
import zeyaDudukMaluCutout from '../assets/images/zeya_duduk_malu_cutout.png';
import zeyaDudukMarahCutout from '../assets/images/zeya_duduk_marah_cutout.png';
import zeyaDudukKagetCutout from '../assets/images/zeya_duduk_kaget_cutout.png';
import zeyaTidurCutout from '../assets/images/zeya_tidur_cutout.png';
import zeyaTiduranMiringCutout from '../assets/images/zeya_tiduran_miring_cutout.png';
import zeyaTiduranTengkurepCutout from '../assets/images/zeya_tiduran_tengkurep_cutout.png';
import zeyaMaluCutout from '../assets/images/zeya_malu_cutout.png';
import zeyaMaluTiduranCutout from '../assets/images/zeya_malu_tiduran_cutout.png';
import zeyaMarahCutout from '../assets/images/zeya_marah_cutout.png';
import zeyaKagetCutout from '../assets/images/zeya_kaget_cutout.png';
import zeyaTopiCutout from '../assets/images/zeya_topi_cutout.png';
import zeyaKacamataCutout from '../assets/images/zeya_kacamata_cutout.png';
import zeyaTanpaPitaCutout from '../assets/images/zeya_tanpa_pita_cutout.png';

export const ZEYA_SEED = 200611;

export type AGesture =
  | 'pinggang'
  | 'dadah'
  | 'atas'
  | 'pipi'
  | 'cerita'
  | 'nanya'
  | 'manja'
  | 'seneng'
  | 'peluk'
  | 'lipet'
  | 'tutup_muka';

export interface AAutoVisualState {
  pose: ASafePose;
  expression: AExpression;
  gesture: AGesture;
  poseVariant: number;
  headbandRemoved: boolean;
  hatOn: boolean;
  glassesOn: boolean;
  hoodieOn: boolean;
  jacketOn: boolean;
  drinkOn: boolean;
}

// Preloaded 100%-identical local transparent PNG cutouts (0 API calls, 0 quota, <0.1s instant)
export const ZEYA_PRELOADED_POSES = {
  berdiri_senang: zeyaBerdiriCutout,
  berdiri_dadah: zeyaBerdiriDadahCutout,
  berdiri_atas: zeyaBerdiriAtasCutout,
  berdiri_pipi: zeyaBerdiriPipiCutout,
  berdiri_pinggang: zeyaBerdiriPinggangCutout,
  berdiri_nanya: zeyaBerdiriNanyaCutout,
  berdiri_cerita: zeyaBerdiriCeritaCutout,
  peluk: zeyaPelukCutout,
  berdiri_ngambek: zeyaNgambekCutout,
  duduk_senang: zeyaDudukCutout,
  duduk_senderan: zeyaDudukSenderanCutout,
  duduk_peluk_lutut: zeyaDudukPelukLututCutout,
  duduk_sedih: zeyaSedihCutout,
  duduk_ngambek: zeyaDudukNgambekCutout,
  duduk_malu: zeyaDudukMaluCutout,
  duduk_marah: zeyaDudukMarahCutout,
  duduk_kaget: zeyaDudukKagetCutout,
  tidur_bobo: zeyaTidurCutout,
  tiduran_miring: zeyaTiduranMiringCutout,
  tiduran_telentang: zeyaMaluTiduranCutout,
  tiduran_tengkurep: zeyaTiduranTengkurepCutout,
  malu: zeyaMaluCutout,
  malu_tiduran: zeyaMaluTiduranCutout,
  marah: zeyaMarahCutout,
  kaget: zeyaKagetCutout,
  pake_topi: zeyaTopiCutout,
  pake_kacamata: zeyaKacamataCutout,
  tanpa_pita: zeyaTanpaPitaCutout
} as const;

const zeyaPoseCache = new Map<string, string>();
let preloadTriggered = false;

/**
 * Preloads & decodes all 28 local transparent Zeya 512x768 PNG assets in background
 * so chat replies + character renders appear in <0.1 second with zero external API calls.
 */
export function preloadZeyaPoseImages(): void {
  if (typeof window === 'undefined' || preloadTriggered) return;
  preloadTriggered = true;

  Object.values(ZEYA_PRELOADED_POSES).forEach((src) => {
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    } catch {}
  });
}

/**
 * Detects pose strictly from text using the Kamus Auto rules.
 */
export function detectAutoPoseFromText(txt: string): ASafePose | null {
  const lower = String(txt || '').toLowerCase();
  if (!lower) return null;

  // Peluk: open-arms hug pose immediately
  if (
    /(sini aku peluk|peluk dulu|mau peluk|pelukan|meluk|peluk\b)/i.test(lower)
  ) {
    return 'peluk';
  }
  if (/\bjongkok\b/i.test(lower)) {
    return 'jongkok';
  }
  if (
    /(tiduran|rebahan|bobo|ngantuk|mengantuk|baring|kasur|selimut)/i.test(lower) ||
    (/\btidur\b/i.test(lower) && !/(tidak|nggak|gak|belum)\s+tidur/i.test(lower))
  ) {
    return 'tiduran';
  }
  if (/(aku duduk|temenin duduk|duduk dulu|duduk santai|duduk manis|\bduduk\b)/i.test(lower)) {
    return 'duduk';
  }
  if (/(jalan santai|lagi jalan|jalan-jalan)/i.test(lower)) {
    return 'jalan santai';
  }
  if (/(aku berdiri|\bberdiri\b)/i.test(lower)) {
    return 'berdiri';
  }
  return null;
}

/**
 * Detects expression strictly from text using the Kamus Auto rules.
 */
export function detectAutoExpressionFromText(txt: string): AExpression | null {
  const lower = String(txt || '').toLowerCase();
  if (!lower) return null;

  if (/(ngambek|kesel|bete|\bhmp\b|hmph|cemberut|sebel)/i.test(lower)) {
    return 'ngambek lucu';
  }
  if (/(ih malu|malu tau|jangan liatin|\bmalu\b|blush|merona|salting)/i.test(lower)) {
    return 'malu';
  }
  if (/(sedih|hiks|nangis|kaca-kaca|kecewa|sedihnya|huwaa)/i.test(lower)) {
    return 'sedih';
  }
  if (/(kaget|hah\?!|masa\?!|eh\?!|serius\?!|astaga|waduh|\bhah\b)/i.test(lower)) {
    return 'kaget';
  }
  if (/\bmarah\b|awas ya|nyebelin|geram/i.test(lower)) {
    return 'marah';
  }
  if (/(ngantuk|mengantuk|zzz|selamat tidur|bobo dulu|hoam)/i.test(lower)) {
    return 'ngantuk';
  }
  if (/(semangat|yeay|yey|hore|ayo dong|\bgas\b)/i.test(lower)) {
    return 'semangat';
  }
  if (/(bingung|hmm+|gimana ya|maksudnya|kok bisa)/i.test(lower)) {
    return 'bingung';
  }
  if (
    /(senang|seneng|haha|hehe|hihi|makasih|peluk|manis|lucu|sa-?yang|ceria|happy|gemes|kangen|cinta|cium|mesra|rindu)/i.test(
      lower
    )
  ) {
    return 'senang';
  }
  return null;
}

/**
 * Reads the AI's OWN reply text BEFORE display (first priority!) + user text,
 * then picks matching pose, expression, active hand gesture, and non-repeating
 * random pose variations every single chat message.
 */
export function analyzeAutoVisualState(params: {
  aiText: string;
  userText?: string;
  prevState: AAutoVisualState;
  prevVariant?: number;
  prevGesture?: AGesture;
  turnCount?: number;
}): AAutoVisualState {
  const aiLower = String(params.aiText || '').toLowerCase();
  const userLower = String(params.userText || '').toLowerCase();
  const combined = `${userLower} ${aiLower}`.trim();
  const prev = params.prevState;

  // 1. Accessories (composable state — show/hide without resetting pose)
  let headbandRemoved = prev.headbandRemoved;
  if (
    /(buka|lepas|copot|tanpa|buang)\s+(ikat\s*kepala|pita|bando|hiasan kepala)/i.test(combined) ||
    (/(ikat\s*kepala|pita|bando)/i.test(userLower) && /(buka|lepas|copot|tanpa)/i.test(userLower))
  ) {
    headbandRemoved = true;
  } else if (/(pake|pakai|pasang)\s+(ikat\s*kepala|pita|bando)/i.test(combined)) {
    headbandRemoved = false;
  }

  let hatOn = prev.hatOn;
  if (/(buka|lepas|copot)\s+topi/i.test(combined)) hatOn = false;
  else if (/(pake|pakai|pasang)\s+topi|\btopi\b/i.test(combined)) hatOn = true;

  let glassesOn = prev.glassesOn;
  if (/(buka|lepas|copot)\s+kacamata/i.test(combined)) glassesOn = false;
  else if (/(pake|pakai|pasang)\s+kacamata|\bkacamata\b/i.test(combined)) glassesOn = true;

  let hoodieOn = prev.hoodieOn;
  if (/(buka|lepas|copot)\s+hoodie/i.test(combined)) hoodieOn = false;
  else if (/(pake|pakai|pasang)\s+hoodie|\bhoodie\b/i.test(combined)) hoodieOn = true;

  let jacketOn = prev.jacketOn;
  if (/(buka|lepas|copot)\s+jaket/i.test(combined)) jacketOn = false;
  else if (/(pake|pakai|pasang)\s+jaket|\bjaket\b/i.test(combined)) jacketOn = true;

  const drinkOn = /(minum|sruput|boba|haus|es teh|kopi)/i.test(combined);

  // 2. Auto Pose Detection: READ AI'S OWN REPLY TEXT FIRST!
  const poseFromAi = detectAutoPoseFromText(aiLower);
  const poseFromUser = detectAutoPoseFromText(userLower);

  let pose: ASafePose = prev.pose || 'berdiri';
  if (poseFromAi) {
    pose = poseFromAi;
  } else if (poseFromUser) {
    pose = poseFromUser;
  } else if (prev.pose === 'peluk' || prev.pose === 'jongkok') {
    // Momentary actions naturally transition back to standing on new casual chat
    pose = 'berdiri';
  }

  // 3. Auto Expression Detection: READ AI'S OWN REPLY TEXT FIRST!
  const exprFromAi = detectAutoExpressionFromText(aiLower);
  const exprFromUser = detectAutoExpressionFromText(userLower);

  let expression: AExpression = 'senang';
  if (exprFromAi) {
    expression = exprFromAi;
  } else if (
    exprFromUser &&
    /(muka|ekspresi|ngambek|malu|marah|sedih|kaget|ngantuk|senang)/i.test(userLower)
  ) {
    expression = exprFromUser;
  } else if (pose === 'peluk') {
    expression = 'senang';
  } else if (exprFromUser) {
    expression = exprFromUser;
  } else {
    expression = prev.expression && prev.expression !== 'ngantuk' ? prev.expression : 'senang';
  }

  // If AI reply explicitly says ngantuk/bobo/tidur (not tiduran awake), keep ngantuk;
  // otherwise if pose is tiduran without sleep words, keep eyes OPEN (e.g. senang/malu)!
  if (
    pose === 'tiduran' &&
    expression === 'ngantuk' &&
    !/(ngantuk|mengantuk|zzz|bobo|selamat tidur|\btidur\b)/i.test(aiLower) &&
    /(tiduran|rebahan)/i.test(aiLower)
  ) {
    expression = 'senang';
  }

  // 4. Random entropy mixed with turnCount so consecutive "hi" messages ALWAYS rotate
  const randEntropy = Math.floor(Math.random() * 997);
  const seedNum = Math.abs(
    randEntropy + (params.turnCount ?? 0) * 13 + aiLower.length * 7 + (aiLower.charCodeAt(0) || 19)
  );

  // 5. Non-repeating pose variation every turn:
  //    Berdiri = 4 variations (0: pinggang, 1: dadah, 2: atas, 3: pipi)
  //    Duduk = 3 variations (0: duduk manis, 1: duduk senderan, 2: duduk peluk lutut)
  //    Tiduran = 3 variations (0: tiduran miring, 1: tiduran telentang, 2: tiduran tengkurep)
  const maxVariants = pose === 'berdiri' ? 4 : 3;
  let poseVariant = seedNum % maxVariants;
  if (params.prevVariant !== undefined && poseVariant === params.prevVariant % maxVariants) {
    poseVariant = (poseVariant + 1 + (randEntropy % (maxVariants - 1))) % maxVariants;
  }

  // 6. Active Hand Gesture Selection (Tangan Harus Gerak, Bukan Patung!)
  let gesture: AGesture = 'cerita';

  if (pose === 'peluk') {
    gesture = 'peluk';
  } else if (expression === 'ngambek lucu') {
    gesture = 'lipet';
  } else if (expression === 'marah') {
    gesture = 'pinggang';
  } else if (expression === 'malu') {
    gesture = 'tutup_muka';
  } else if (expression === 'kaget') {
    gesture = seedNum % 2 === 0 ? 'tutup_muka' : 'atas';
  } else if (expression === 'sedih') {
    gesture = 'lipet';
  } else if (expression === 'semangat') {
    const senengPool: AGesture[] = ['atas', 'dadah', 'seneng'];
    let pick = senengPool[seedNum % senengPool.length];
    if (pick === params.prevGesture) pick = senengPool[(seedNum + 1) % senengPool.length];
    gesture = pick;
  } else if (aiLower.includes('?') || /\b(apa|kenapa|gimana|siapa|kapan|kok|masa|ya kan)\b/i.test(aiLower)) {
    // Nanya -> tangan di dagu / bertanya
    gesture = params.prevGesture === 'nanya' ? 'cerita' : 'nanya';
  } else if (/(sa-?yang|manja|kangen|ciee|gemes|nih|peluk|cium|rindu|ayang|hehe)/i.test(aiLower)) {
    // Manja -> tangan 2 di pipi / variasi
    const manjaPool: AGesture[] = ['pipi', 'manja', 'cerita', 'dadah'];
    let pick = manjaPool[seedNum % manjaPool.length];
    if (pick === params.prevGesture) pick = manjaPool[(seedNum + 1) % manjaPool.length];
    gesture = pick;
  } else if (/(hai|halo|hi\b|pagi|siang|sore|malam|dadah|bye)/i.test(combined)) {
    // Sapaan -> rotasi dadah / atas / pipi / pinggang / cerita (tidak pernah sama 2x berturut!)
    const greetPool: AGesture[] = ['dadah', 'atas', 'pipi', 'pinggang', 'cerita'];
    let pick = greetPool[seedNum % greetPool.length];
    if (pick === params.prevGesture) pick = greetPool[(seedNum + 1) % greetPool.length];
    gesture = pick;
  } else {
    // Ngomong biasa -> tangan angkat kayak lagi cerita, diselingi variasi hidup
    const talkPool: AGesture[] = ['cerita', 'dadah', 'pipi', 'pinggang', 'atas', 'nanya'];
    let pick = talkPool[seedNum % talkPool.length];
    if (pick === params.prevGesture) pick = talkPool[(seedNum + 1) % talkPool.length];
    gesture = pick;
  }

  return {
    pose,
    expression,
    gesture,
    poseVariant,
    headbandRemoved,
    hatOn,
    glassesOn,
    hoodieOn,
    jacketOn,
    drinkOn
  };
}

export function resolveZeyaPoseAsset(
  expression: AExpression,
  pose: ASafePose,
  headbandRemoved = false,
  hatOn = false,
  glassesOn = false,
  gesture: AGesture = 'cerita',
  poseVariant = 0
): string {
  const cacheKey = `${expression}::${pose}::${gesture}::${poseVariant}::${headbandRemoved ? 'np' : 'p'}::${hatOn ? 'h' : 'nh'}::${glassesOn ? 'g' : 'ng'}`;
  const cached = zeyaPoseCache.get(cacheKey);
  if (cached) return cached;

  let resolved: string = ZEYA_PRELOADED_POSES.berdiri_cerita;

  const isLying =
    pose === 'tidur' ||
    pose === 'tiduran' ||
    pose === 'tiduran dengan baju lengkap dan sopan';
  const isSitting = pose === 'duduk' || pose === 'jongkok';

  if (pose === 'peluk' || gesture === 'peluk') {
    // Open-arms affectionate hug pose (NEVER standing still!)
    resolved = ZEYA_PRELOADED_POSES.peluk;
  } else if (isLying) {
    // CRITICAL EYE RULE: Only ngantuk/tidur/bobo shows eyes closed!
    if (expression === 'ngantuk' || pose === 'tidur') {
      resolved = ZEYA_PRELOADED_POSES.tidur_bobo;
    } else {
      // 3 lying variations (0: miring, 1: telentang, 2: tengkurep)
      const lieVar = Math.abs(poseVariant) % 3;
      if (lieVar === 0) resolved = ZEYA_PRELOADED_POSES.tiduran_miring;
      else if (lieVar === 1) resolved = ZEYA_PRELOADED_POSES.tiduran_telentang;
      else resolved = ZEYA_PRELOADED_POSES.tiduran_tengkurep;
    }
  } else if (isSitting) {
    if (expression === 'sedih') {
      resolved = ZEYA_PRELOADED_POSES.duduk_sedih;
    } else if (expression === 'ngambek lucu') {
      resolved = ZEYA_PRELOADED_POSES.duduk_ngambek;
    } else if (expression === 'malu') {
      resolved = ZEYA_PRELOADED_POSES.duduk_malu;
    } else if (expression === 'marah') {
      resolved = ZEYA_PRELOADED_POSES.duduk_marah;
    } else if (expression === 'kaget') {
      resolved = ZEYA_PRELOADED_POSES.duduk_kaget;
    } else {
      // 3 sitting variations (0: duduk manis, 1: duduk senderan, 2: duduk peluk lutut)
      const sitVar = Math.abs(poseVariant) % 3;
      if (sitVar === 0) resolved = ZEYA_PRELOADED_POSES.duduk_senang;
      else if (sitVar === 1) resolved = ZEYA_PRELOADED_POSES.duduk_senderan;
      else resolved = ZEYA_PRELOADED_POSES.duduk_peluk_lutut;
    }
  } else if (hatOn || pose === 'pake topi') {
    resolved = ZEYA_PRELOADED_POSES.pake_topi;
  } else if (glassesOn || pose === 'pake kacamata') {
    resolved = ZEYA_PRELOADED_POSES.pake_kacamata;
  } else if (headbandRemoved) {
    resolved = ZEYA_PRELOADED_POSES.tanpa_pita;
  } else if (expression === 'marah') {
    resolved = ZEYA_PRELOADED_POSES.marah;
  } else if (expression === 'ngambek lucu') {
    resolved = ZEYA_PRELOADED_POSES.berdiri_ngambek;
  } else if (expression === 'kaget') {
    resolved = ZEYA_PRELOADED_POSES.kaget;
  } else if (expression === 'malu') {
    resolved = ZEYA_PRELOADED_POSES.malu;
  } else if (expression === 'sedih') {
    resolved = ZEYA_PRELOADED_POSES.duduk_sedih;
  } else if (expression === 'ngantuk') {
    resolved = ZEYA_PRELOADED_POSES.tidur_bobo;
  } else {
    // Standing / active talking poses: map directly to hand-moving gestures + 4 standing variants!
    if (gesture === 'nanya') {
      resolved = ZEYA_PRELOADED_POSES.berdiri_nanya;
    } else if (gesture === 'dadah') {
      resolved = ZEYA_PRELOADED_POSES.berdiri_dadah;
    } else if (gesture === 'atas' || gesture === 'seneng') {
      resolved = ZEYA_PRELOADED_POSES.berdiri_atas;
    } else if (gesture === 'pipi' || gesture === 'manja') {
      resolved = ZEYA_PRELOADED_POSES.berdiri_pipi;
    } else if (gesture === 'pinggang') {
      resolved = ZEYA_PRELOADED_POSES.berdiri_pinggang;
    } else if (gesture === 'cerita') {
      resolved = ZEYA_PRELOADED_POSES.berdiri_cerita;
    } else {
      // Fallback 4 standing variations
      const standVar = Math.abs(poseVariant) % 4;
      if (standVar === 0) resolved = ZEYA_PRELOADED_POSES.berdiri_pinggang;
      else if (standVar === 1) resolved = ZEYA_PRELOADED_POSES.berdiri_dadah;
      else if (standVar === 2) resolved = ZEYA_PRELOADED_POSES.berdiri_atas;
      else resolved = ZEYA_PRELOADED_POSES.berdiri_pipi;
    }
  }

  zeyaPoseCache.set(cacheKey, resolved);
  return resolved;
}

interface ACharacterArtProps {
  expression: AExpression;
  pose: ASafePose;
  aiName: string;
  gesture?: AGesture;
  poseVariant?: number;
  headbandRemoved?: boolean;
  hatOn?: boolean;
  glassesOn?: boolean;
  hoodieOn?: boolean;
  jacketOn?: boolean;
  drinkOn?: boolean;
}

/**
 * Renders the 100%-identical transparent Zeya PNG cutout directly over the chat starry sky.
 * Dynamically switches between 28 poses/expressions/hand gestures with smooth lively micro-motion.
 */
export function ACharacterArt({
  expression,
  pose,
  aiName,
  gesture = 'cerita',
  poseVariant = 0,
  headbandRemoved = false,
  hatOn = false,
  glassesOn = false,
  drinkOn = false
}: ACharacterArtProps) {
  useEffect(() => {
    preloadZeyaPoseImages();
  }, []);

  const selectedArt = useMemo(
    () =>
      resolveZeyaPoseAsset(
        expression,
        pose,
        headbandRemoved,
        hatOn,
        glassesOn,
        gesture,
        poseVariant
      ),
    [expression, pose, headbandRemoved, hatOn, glassesOn, gesture, poseVariant]
  );

  const isLying =
    pose === 'tidur' ||
    pose === 'tiduran' ||
    pose === 'tiduran dengan baju lengkap dan sopan';

  const motionClass = useMemo(() => {
    if (pose === 'peluk') return 'ze-char-hug';
    if (gesture === 'dadah' || gesture === 'atas' || gesture === 'seneng') return 'ze-char-sway';
    if (pose === 'jalan santai') return 'ze-char-sway';
    if (pose === 'jongkok') return 'scale-y-95 translate-y-1 ze-char-breathe';
    return 'ze-char-breathe';
  }, [pose, gesture]);

  return (
    <div className="relative mt-1.5 ml-1 inline-flex flex-col items-start select-none bg-transparent border-0 shadow-none p-0 ze-char-pop">
      <img
        src={selectedArt}
        alt={aiName || 'A!'}
        width={512}
        height={768}
        decoding="async"
        style={
          isLying
            ? {
                WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)'
              }
            : undefined
        }
        className={`w-40 sm:w-44 h-auto object-contain bg-transparent border-0 shadow-none rounded-none pointer-events-none transition-transform duration-300 ${motionClass}`}
      />
      {/* Subtle floating anime reaction accents (no box/border) */}
      {pose === 'peluk' && (
        <span className="absolute -top-1 right-1 text-base animate-bounce pointer-events-none select-none">
          💕
        </span>
      )}
      {expression === 'ngantuk' && (
        <span className="absolute top-2 right-2 text-xs font-black text-sky-200 animate-pulse pointer-events-none select-none">
          Zzz
        </span>
      )}
      {expression === 'bingung' && (
        <span className="absolute top-1 right-2 text-sm font-black text-amber-300 animate-bounce pointer-events-none select-none">
          ?
        </span>
      )}
      {(drinkOn || pose === 'minum') && (
        <span className="absolute bottom-4 right-1 text-base pointer-events-none select-none">
          🧋
        </span>
      )}
    </div>
  );
}
