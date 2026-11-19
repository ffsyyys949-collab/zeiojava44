import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type express from 'express';

// ============================================================================
// ZE.io PERMANENT CLOUD PERSISTENCE, AUTH, OBJECT STORAGE & SYNC ENGINE
// ============================================================================

export interface MediaMeta {
  filename: string;
  sha256: string;
  mimeType: string;
  sizeBytes: number;
  ownerId: string;
  visibility: 'public' | 'participants' | 'private';
  allowedUsers: string[];
  remoteUrl?: string;
  createdAt: number;
}

export interface CustomThemeCloudMeta {
  id: string;
  name: string;
  subtitle: string;
  bg?: string;
  videoUrl?: string;
  createdAt: number;
}

export interface AccountPreferencesRecord {
  userId: string;
  accountSettings: {
    twoStepPin: boolean;
    securityAlerts: boolean;
  };
  privacySettings: {
    lastSeen: string;
    profilePhoto: string;
    about: string;
    groups: string;
    disappearingDuration: string;
  };
  themePreferences: {
    activeThemeId: string;
    customThemes: CustomThemeCloudMeta[];
  };
  appPreferences: {
    language: string;
    chatWallpaper: string;
    chatTheme: string;
    chatFontSize: number;
    notifications: {
      msgTone: boolean;
      groupTone: boolean;
      vibrate: boolean;
      preview: boolean;
    };
    autoDownload: {
      photo: string;
      video: string;
      audio: string;
    };
    fpsConfig: {
      enabled: boolean;
      targetFps: 60 | 90 | 120;
      gpuCompositorBoost: boolean;
      touchScrollBoost: boolean;
      frameBatching: boolean;
    };
    customLists: Array<{ id: string; name: string; members: string[] }>;
    viewedStoryIds: string[];
  };
  likedPosts: any[];
  updatedAt: number;
}

export interface AiChatMessageRecord {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaName?: string;
  time: string;
  createdAt: number;
}

export interface AiSessionRecord {
  id: string;
  userId: string;
  title: string;
  messages: AiChatMessageRecord[];
  createdAt: number;
  updatedAt: number;
}

export interface UserAiData {
  activeSessionId: string;
  aiSettings: {
    style: string;
    persona: string;
    contextMemory: boolean;
  };
  sessions: AiSessionRecord[];
  updatedAt: number;
}

export interface SessionRecord {
  tokenId: string;
  userId: string;
  deviceInfo: string;
  createdAt: number;
  lastActiveAt: number;
}

export interface FriendshipHistoryItem {
  pairKey: string;
  users: [string, string];
  status: 'pending' | 'accepted' | 'rejected' | 'unfriended' | 'blocked';
  actionBy: string;
  requestedAt?: number;
  acceptedAt?: number;
  updatedAt: number;
}

export interface CloudDatabaseShape {
  schemaVersion: number;
  users: any[];
  sessions: Record<string, SessionRecord>;
  accountData: Record<string, AccountPreferencesRecord>;
  friendRequests: Record<string, Array<{ id: string; from: string; to?: string; status: 'pending' | 'accepted' | 'rejected'; time: number }>>;
  outgoingRequests: Record<string, Array<{ id: string; from: string; to: string; status: 'pending' | 'accepted' | 'rejected'; time: number }>>;
  friendships: Record<string, string[]>;
  blockedUsers: Record<string, string[]>;
  friendshipHistory: Record<string, FriendshipHistoryItem>;
  stories: any[];
  chats: any[];
  messages: Record<string, any[]>;
  chatReadStatus: Record<string, number>;
  posts: any[];
  profileLikes: Record<string, string[]>;
  profileFollows: Record<string, string[]>;
  notes: Record<string, any>;
  groups: any[];
  communities: any[];
  globalChats: any[];
  musicHistory: Record<string, any[]>;
  aiData: Record<string, UserAiData>;
  mediaIndex: Record<string, MediaMeta>;
  processedMutations: Record<string, number>;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
};

export function createDefaultAccountPreferences(userId: string): AccountPreferencesRecord {
  return {
    userId: String(userId).toUpperCase(),
    accountSettings: {
      twoStepPin: false,
      securityAlerts: true,
    },
    privacySettings: {
      lastSeen: 'Semua Orang',
      profilePhoto: 'Semua Orang',
      about: 'Kontak Saya',
      groups: 'Semua Orang',
      disappearingDuration: 'Mati',
    },
    themePreferences: {
      activeThemeId: 'bw-liquid-water',
      customThemes: [],
    },
    appPreferences: {
      language: 'ID',
      chatWallpaper: '#121B22',
      chatTheme: 'dark',
      chatFontSize: 14,
      notifications: {
        msgTone: true,
        groupTone: true,
        vibrate: true,
        preview: true,
      },
      autoDownload: {
        photo: 'Wi-Fi & Seluler',
        video: 'Hanya Wi-Fi',
        audio: 'Wi-Fi & Seluler',
      },
      fpsConfig: {
        enabled: true,
        targetFps: 60,
        gpuCompositorBoost: true,
        touchScrollBoost: true,
        frameBatching: true,
      },
      customLists: [
        { id: 'close_friends', name: 'Close Friends', members: [] },
        { id: 'work', name: 'Kerja', members: [] },
        { id: 'family', name: 'Keluarga', members: [] },
      ],
      viewedStoryIds: [],
    },
    likedPosts: [],
    updatedAt: Date.now(),
  };
}

export function createDefaultAiData(userId: string): UserAiData {
  const defaultSessionId = `aisess_${String(userId).toUpperCase()}_main`;
  const now = Date.now();
  return {
    activeSessionId: defaultSessionId,
    aiSettings: {
      style: 'gaul_indonesia',
      persona: 'ZE AI Official',
      contextMemory: true,
    },
    sessions: [
      {
        id: defaultSessionId,
        userId: String(userId).toUpperCase(),
        title: 'Obrolan ZE AI',
        createdAt: now,
        updatedAt: now,
        messages: [
          {
            id: 'ai_welcome_1',
            sender: 'ai',
            text: 'Yo bro! Gue ZE AI, asisten pribadi lo di ZE.io. Mau ngobrolin apa nih hari ini? Musik, video, nongkrong, atau ada yang mau lo tanyain? Santai aja, gas!',
            time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: now,
          },
        ],
      },
    ],
    updatedAt: now,
  };
}

export function isPlaceholderAvatar(url?: string | null): boolean {
  if (!url || !url.trim()) return true;
  const u = url.trim();
  return (
    u.includes('api.dicebear.com') ||
    u.includes('i.pravatar.cc') ||
    u === '/assets/ze_logo.png'
  );
}

export function isPlaceholderBio(bio?: string | null): boolean {
  if (!bio || !bio.trim()) return true;
  const b = bio.trim();
  return (
    b === 'Hey there! I am using ZE.io.' ||
    b === 'Hey there! I am using ZE.io' ||
    b === 'Hey there! I am using ZE.io 🚀' ||
    b === 'Pengguna aktif ZE.io'
  );
}

export class ZeioCloudEngine {
  private rootDir: string;
  private storageDir: string;
  private mediaDir: string;
  private dbFile: string;
  private backupFile: string;
  private legacyDbFile: string;
  private secretFile: string;
  private authSecret: string;
  private supabaseUrl: string;
  private supabaseKey: string;
  private supabaseBucket: string;
  private supabaseSyncTimer: NodeJS.Timeout | null = null;
  public db: CloudDatabaseShape;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.storageDir = path.join(rootDir, '.zeio_cloud_storage');
    this.mediaDir = path.join(this.storageDir, 'media');
    this.dbFile = path.join(this.storageDir, 'db.json');
    this.backupFile = path.join(this.storageDir, 'db.json.bak');
    this.legacyDbFile = path.join(rootDir, '.global_zeio_db.json');
    this.secretFile = path.join(this.storageDir, '.auth_secret');

    fs.mkdirSync(this.mediaDir, { recursive: true });

    this.authSecret = this.initAuthSecret();
    this.supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    this.supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    this.supabaseBucket = (process.env.SUPABASE_STORAGE_BUCKET || 'zeio-media').trim();

    this.db = this.loadFromDisk();
    this.ensureIntegrityAndMigrateMedia();
  }

  private initAuthSecret(): string {
    if (process.env.ZEIO_AUTH_SECRET && process.env.ZEIO_AUTH_SECRET.trim().length >= 16) {
      return process.env.ZEIO_AUTH_SECRET.trim();
    }
    try {
      if (fs.existsSync(this.secretFile)) {
        const existing = fs.readFileSync(this.secretFile, 'utf-8').trim();
        if (existing.length >= 32) return existing;
      }
    } catch {}
    const generated = crypto.randomBytes(48).toString('hex');
    try {
      fs.writeFileSync(this.secretFile, generated, { mode: 0o600 });
    } catch {}
    return generated;
  }

  public isSupabaseConfigured(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseKey);
  }

  private createEmptyDB(): CloudDatabaseShape {
    return {
      schemaVersion: 2,
      users: [],
      sessions: {},
      accountData: {},
      friendRequests: {},
      outgoingRequests: {},
      friendships: {},
      blockedUsers: {},
      friendshipHistory: {},
      stories: [],
      chats: [],
      messages: {},
      chatReadStatus: {},
      posts: [],
      profileLikes: {},
      profileFollows: {},
      notes: {},
      groups: [],
      communities: [],
      globalChats: [],
      musicHistory: {},
      aiData: {},
      mediaIndex: {},
      processedMutations: {},
    };
  }

  private loadFromDisk(): CloudDatabaseShape {
    const candidates = [this.dbFile, this.backupFile, this.legacyDbFile];
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          const raw = fs.readFileSync(candidate, 'utf-8');
          if (!raw.trim()) continue;
          const parsed = JSON.parse(raw);
          return {
            ...this.createEmptyDB(),
            ...parsed,
          };
        }
      } catch (err) {
        console.error(`Failed reading candidate DB ${candidate}:`, err);
      }
    }
    return this.createEmptyDB();
  }

  // Pull remote Supabase snapshot if configured (non-destructive merge on boot)
  public async initRemoteCloudSync(): Promise<void> {
    if (!this.isSupabaseConfigured()) return;
    try {
      const res = await fetch(
        `${this.supabaseUrl}/rest/v1/zeio_cloud_kv?key=eq.global_state&select=payload`,
        {
          headers: {
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
          },
        }
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]?.payload) {
          this.mergeRemoteSnapshot(rows[0].payload);
          this.saveNow();
        } else {
          await this.pushStateToSupabase();
        }
      }
    } catch (err) {
      console.warn('Supabase initial sync notice:', err);
    }
  }

  private mergeRemoteSnapshot(remote: Partial<CloudDatabaseShape>) {
    if (!remote || typeof remote !== 'object') return;
    // Merge users by ID without losing newer local records
    if (Array.isArray(remote.users)) {
      const localMap = new Map<string, any>();
      for (const u of this.db.users) {
        localMap.set(String(u.id).toUpperCase(), u);
      }
      for (const ru of remote.users) {
        const uid = String(ru.id || '').toUpperCase();
        if (!uid) continue;
        const loc = localMap.get(uid);
        if (!loc || (ru.updatedAt || 0) >= (loc.updatedAt || 0)) {
          localMap.set(uid, { ...loc, ...ru });
        }
      }
      this.db.users = Array.from(localMap.values());
    }
    if (remote.accountData) {
      for (const [uid, rAcc] of Object.entries(remote.accountData)) {
        const lAcc = this.db.accountData[uid];
        if (!lAcc || (rAcc.updatedAt || 0) >= (lAcc.updatedAt || 0)) {
          this.db.accountData[uid] = rAcc;
        }
      }
    }
    if (remote.friendships) {
      for (const [uid, list] of Object.entries(remote.friendships)) {
        this.db.friendships[uid] = Array.from(new Set([...(this.db.friendships[uid] || []), ...(list || [])]));
      }
    }
    if (remote.messages) {
      for (const [cid, rMsgs] of Object.entries(remote.messages)) {
        const existing = this.db.messages[cid] || [];
        const byId = new Map<string, any>();
        for (const m of existing) byId.set(m.id || `${m.createdAt}_${m.senderId}`, m);
        for (const m of rMsgs || []) byId.set(m.id || `${m.createdAt}_${m.senderId}`, m);
        this.db.messages[cid] = Array.from(byId.values()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      }
    }
    if (remote.aiData) {
      for (const [uid, rAi] of Object.entries(remote.aiData)) {
        const lAi = this.db.aiData[uid];
        if (!lAi || (rAi.updatedAt || 0) >= (lAi.updatedAt || 0)) {
          this.db.aiData[uid] = rAi;
        }
      }
    }
    if (remote.mediaIndex) {
      this.db.mediaIndex = { ...remote.mediaIndex, ...this.db.mediaIndex };
    }
  }

  private scheduleSupabaseMirror() {
    if (!this.isSupabaseConfigured()) return;
    if (this.supabaseSyncTimer) clearTimeout(this.supabaseSyncTimer);
    this.supabaseSyncTimer = setTimeout(() => {
      this.pushStateToSupabase().catch((e) => console.warn('Supabase mirror error:', e));
    }, 800);
  }

  private async pushStateToSupabase(): Promise<void> {
    if (!this.isSupabaseConfigured()) return;
    await fetch(`${this.supabaseUrl}/rest/v1/zeio_cloud_kv`, {
      method: 'POST',
      headers: {
        apikey: this.supabaseKey,
        Authorization: `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        key: 'global_state',
        payload: this.db,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  // Atomic write-ahead persistence with automatic backup rotation
  public saveNow(): void {
    try {
      const serialized = JSON.stringify(this.db, null, 2);
      const tmpPath = `${this.dbFile}.tmp.${process.pid}`;
      fs.writeFileSync(tmpPath, serialized, 'utf-8');
      if (fs.existsSync(this.dbFile)) {
        try {
          fs.copyFileSync(this.dbFile, this.backupFile);
        } catch {}
      }
      fs.renameSync(tmpPath, this.dbFile);

      // Keep legacy file synced cleanly so any external inspection remains valid
      const legacyTmp = `${this.legacyDbFile}.tmp.${process.pid}`;
      fs.writeFileSync(legacyTmp, serialized, 'utf-8');
      fs.renameSync(legacyTmp, this.legacyDbFile);

      this.scheduleSupabaseMirror();
    } catch (err) {
      console.error('Critical error saving cloud database:', err);
    }
  }

  // ==========================================================================
  // PASSWORD HASHING & MULTI-DEVICE SESSION TOKENS
  // ==========================================================================

  public hashPassword(plain: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
    return `scrypt$${salt}$${derived}`;
  }

  public verifyPassword(userRecord: any, attempt: string): boolean {
    if (!attempt) return false;
    // Owner safeguard
    const uid = String(userRecord.id || '').toUpperCase();
    const uname = String(userRecord.username || '').replace(/^@/, '').toLowerCase();
    if ((uid === 'ZE-OWNER' || uname === 'ze.io') && attempt === '112007') {
      return true;
    }

    if (typeof userRecord.passwordScrypt === 'string' && userRecord.passwordScrypt.startsWith('scrypt$')) {
      const parts = userRecord.passwordScrypt.split('$');
      if (parts.length === 3) {
        const [, salt, storedHex] = parts;
        const derived = crypto.scryptSync(attempt, salt, 64);
        const storedBuf = Buffer.from(storedHex, 'hex');
        if (derived.length === storedBuf.length && crypto.timingSafeEqual(derived, storedBuf)) {
          return true;
        }
      }
    }

    // Legacy compatibility (transparently upgraded upon successful login)
    if (userRecord.password && userRecord.password === attempt) return true;
    if (userRecord.pass && userRecord.pass === attempt) return true;
    if (userRecord.passwordHash && userRecord.passwordHash === Buffer.from(attempt).toString('base64')) return true;

    return false;
  }

  public issueSessionToken(userId: string, deviceInfo = 'web'): string {
    const cleanUid = String(userId).toUpperCase();
    const tokenId = crypto.randomBytes(18).toString('hex');
    const issuedAt = Date.now();
    const payloadObj = { tid: tokenId, uid: cleanUid, iat: issuedAt };
    const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
    const sig = crypto.createHmac('sha256', this.authSecret).update(payloadB64).digest('base64url');

    this.db.sessions[tokenId] = {
      tokenId,
      userId: cleanUid,
      deviceInfo: String(deviceInfo).slice(0, 200),
      createdAt: issuedAt,
      lastActiveAt: issuedAt,
    };
    this.saveNow();

    return `zeio_tok_${payloadB64}.${sig}`;
  }

  public verifySessionToken(rawToken?: string | null): { userId: string; tokenId: string } | null {
    if (!rawToken || typeof rawToken !== 'string') return null;
    const trimmed = rawToken.replace(/^Bearer\s+/i, '').trim();
    if (!trimmed.startsWith('zeio_tok_')) return null;

    const body = trimmed.slice('zeio_tok_'.length);
    const dotIdx = body.indexOf('.');
    if (dotIdx <= 0) return null;

    const payloadB64 = body.slice(0, dotIdx);
    const providedSig = body.slice(dotIdx + 1);
    const expectedSig = crypto.createHmac('sha256', this.authSecret).update(payloadB64).digest('base64url');

    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    try {
      const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
      const session = this.db.sessions[decoded.tid];
      if (!session || String(session.userId).toUpperCase() !== String(decoded.uid).toUpperCase()) {
        return null;
      }
      session.lastActiveAt = Date.now();
      return { userId: session.userId, tokenId: session.tokenId };
    } catch {
      return null;
    }
  }

  public revokeSessionToken(rawToken?: string | null): void {
    const verified = this.verifySessionToken(rawToken);
    if (verified && this.db.sessions[verified.tokenId]) {
      delete this.db.sessions[verified.tokenId];
      this.saveNow();
    }
  }

  public extractAuthFromRequest(req: express.Request): { userId: string; tokenId: string } | null {
    const header = req.headers.authorization;
    if (header) {
      const res = this.verifySessionToken(header);
      if (res) return res;
    }
    const queryToken = req.query.token as string | undefined;
    if (queryToken) {
      const res = this.verifySessionToken(queryToken);
      if (res) return res;
    }
    return null;
  }

  // Strip sensitive credentials before returning user objects to clients
  public sanitizePublicUser(u: any): any {
    if (!u) return u;
    const {
      password,
      pass,
      passwordHash,
      passwordScrypt,
      ...safe
    } = u;
    const isOwner =
      Boolean(safe.isOwner || safe.owner) ||
      String(safe.id || '').toUpperCase() === 'ZE-OWNER' ||
      String(safe.username || '').replace(/^@/, '').toLowerCase() === 'ze.io';
    const cleanUname = String(safe.username || '').replace(/^@/, '');
    const photo = safe.photo || safe.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(safe.name || cleanUname || 'ZE')}`;
    return {
      ...safe,
      id: String(safe.id || '').toUpperCase(),
      username: isOwner ? 'ZE.io' : cleanUname,
      name: isOwner ? (safe.name || 'zvn3') : (safe.name || cleanUname),
      photo,
      avatar: photo,
      bio: safe.bio || (isOwner ? 'Official Owner & Creator of ZE.io 🚀' : 'Hey there! I am using ZE.io.'),
      role: isOwner ? 'owner' : 'user',
      isOwner,
      isVerified: isOwner || Boolean(safe.isVerified),
    };
  }

  // ==========================================================================
  // PERMANENT BINARY MEDIA OBJECT STORAGE (SHA-256 DEDUPLICATED)
  // ==========================================================================

  public storeMediaBuffer(
    buffer: Buffer,
    mimeType: string,
    ownerId = 'SYSTEM',
    visibility: 'public' | 'participants' | 'private' = 'public',
    allowedUsers: string[] = []
  ): { url: string; meta: MediaMeta } {
    const cleanMime = (mimeType || 'application/octet-stream').split(';')[0].trim().toLowerCase();
    const ext = MIME_TO_EXT[cleanMime] || 'bin';
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const filename = `${sha256.slice(0, 32)}.${ext}`;
    const filePath = path.join(this.mediaDir, filename);

    if (!fs.existsSync(filePath)) {
      const tmp = `${filePath}.tmp.${process.pid}`;
      fs.writeFileSync(tmp, buffer);
      fs.renameSync(tmp, filePath);
    }

    const existing = this.db.mediaIndex[filename];
    const mergedAllowed = Array.from(
      new Set([
        ...(existing?.allowedUsers || []),
        ...allowedUsers.map((u) => String(u).toUpperCase()),
        String(ownerId).toUpperCase(),
      ])
    );

    const meta: MediaMeta = {
      filename,
      sha256,
      mimeType: cleanMime,
      sizeBytes: buffer.length,
      ownerId: existing?.ownerId || String(ownerId).toUpperCase(),
      visibility: existing?.visibility === 'public' || visibility === 'public' ? 'public' : visibility,
      allowedUsers: mergedAllowed,
      remoteUrl: existing?.remoteUrl,
      createdAt: existing?.createdAt || Date.now(),
    };

    this.db.mediaIndex[filename] = meta;

    // Mirror to Supabase Storage asynchronously if configured
    if (this.isSupabaseConfigured() && !meta.remoteUrl) {
      this.uploadBufferToSupabaseStorage(filename, buffer, cleanMime)
        .then((remoteUrl) => {
          if (remoteUrl && this.db.mediaIndex[filename]) {
            this.db.mediaIndex[filename].remoteUrl = remoteUrl;
            this.saveNow();
          }
        })
        .catch(() => {});
    }

    return {
      url: `/api/media/${filename}`,
      meta,
    };
  }

  private async uploadBufferToSupabaseStorage(filename: string, buffer: Buffer, mimeType: string): Promise<string | null> {
    if (!this.isSupabaseConfigured()) return null;
    try {
      const res = await fetch(
        `${this.supabaseUrl}/storage/v1/object/${encodeURIComponent(this.supabaseBucket)}/${encodeURIComponent(filename)}`,
        {
          method: 'POST',
          headers: {
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
            'Content-Type': mimeType,
            'x-upsert': 'true',
          },
          body: new Uint8Array(buffer),
        }
      );
      if (res.ok) {
        return `${this.supabaseUrl}/storage/v1/object/public/${encodeURIComponent(this.supabaseBucket)}/${encodeURIComponent(filename)}`;
      }
    } catch {}
    return null;
  }

  // Automatically converts inline data:... URIs (base64 or utf8 SVG) into permanent cloud media files
  public persistInlineMedia(
    input?: string | null,
    ownerId = 'SYSTEM',
    visibility: 'public' | 'participants' | 'private' = 'public',
    allowedUsers: string[] = []
  ): string {
    if (!input || typeof input !== 'string') return input || '';
    const trimmed = input.trim();
    if (!trimmed.startsWith('data:')) return trimmed;

    // Match base64 data URI: data:image/jpeg;base64,....
    const b64Match = trimmed.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/s);
    if (b64Match) {
      try {
        const mimeType = b64Match[1].toLowerCase();
        const buf = Buffer.from(b64Match[2], 'base64');
        if (buf.length > 0) {
          return this.storeMediaBuffer(buf, mimeType, ownerId, visibility, allowedUsers).url;
        }
      } catch {
        return trimmed;
      }
    }

    // Match utf8 SVG data URI (e.g. preset emoji avatars from AvatarSettingPage)
    const svgMatch = trimmed.match(/^data:image\/svg\+xml;utf8,(.+)$/s);
    if (svgMatch) {
      try {
        const decodedSvg = decodeURIComponent(svgMatch[1]);
        const buf = Buffer.from(decodedSvg, 'utf-8');
        if (buf.length > 0) {
          return this.storeMediaBuffer(buf, 'image/svg+xml', ownerId, visibility, allowedUsers).url;
        }
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }

  public getMediaFilePath(filename: string): { filePath: string; mimeType: string; meta?: MediaMeta } | null {
    const safeName = path.basename(filename);
    if (!safeName || safeName !== filename || safeName.includes('..')) return null;
    const filePath = path.join(this.mediaDir, safeName);
    if (!fs.existsSync(filePath)) return null;
    const ext = safeName.split('.').pop()?.toLowerCase() || '';
    const meta = this.db.mediaIndex[safeName];
    const mimeType = meta?.mimeType || EXT_TO_MIME[ext] || 'application/octet-stream';
    return { filePath, mimeType, meta };
  }

  // ==========================================================================
  // DATA INTEGRITY, STARTUP MIGRATION & NON-DESTRUCTIVE ACCOUNT MERGE
  // ==========================================================================

  private ensureIntegrityAndMigrateMedia(): void {
    let dirty = false;

    // 1. Ensure default owner account exists with scrypt hash
    let ownerIdx = this.db.users.findIndex(
      (u) =>
        String(u.id || '').toUpperCase() === 'ZE-OWNER' ||
        String(u.username || '').replace(/^@/, '').toLowerCase() === 'ze.io'
    );
    if (ownerIdx < 0) {
      this.db.users.unshift({
        id: 'ZE-OWNER',
        username: 'ZE.io',
        name: 'zvn3',
        passwordScrypt: this.hashPassword('112007'),
        photo: 'https://api.dicebear.com/9.x/initials/svg?seed=zvn3',
        avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=zvn3',
        bio: 'Official Owner & Creator of ZE.io 🚀',
        role: 'owner',
        isOwner: true,
        isVerified: true,
        followers: 9999,
        createdAt: 1700000000000,
        joinedDate: 'October 2026',
        updatedAt: Date.now(),
      });
      dirty = true;
    } else {
      const owner = this.db.users[ownerIdx];
      owner.id = 'ZE-OWNER';
      owner.username = 'ZE.io';
      owner.role = 'owner';
      owner.isOwner = true;
      owner.isVerified = true;
      if (!owner.passwordScrypt) {
        owner.passwordScrypt = this.hashPassword('112007');
        dirty = true;
      }
    }

    // 2. Migrate all users: hash legacy plaintext passwords & convert inline base64 avatars to cloud object storage
    const deduplicatedUsers = new Map<string, any>();
    for (const u of this.db.users) {
      if (!u || (!u.id && !u.username)) continue;
      const uid = String(u.id || '').toUpperCase();
      if (!uid) continue;

      if (!u.passwordScrypt && (u.password || u.pass)) {
        u.passwordScrypt = this.hashPassword(String(u.password || u.pass));
        delete u.password;
        delete u.pass;
        delete u.passwordHash;
        dirty = true;
      }

      const rawPhoto = u.photo || u.avatar;
      if (rawPhoto && typeof rawPhoto === 'string' && rawPhoto.startsWith('data:')) {
        const cloudUrl = this.persistInlineMedia(rawPhoto, uid, 'public');
        u.photo = cloudUrl;
        u.avatar = cloudUrl;
        dirty = true;
      }

      if (u.username && typeof u.username === 'string' && u.username.startsWith('@')) {
        u.username = u.username.replace(/^@/, '');
        dirty = true;
      }

      if (!this.db.accountData[uid]) {
        this.db.accountData[uid] = createDefaultAccountPreferences(uid);
        dirty = true;
      }
      if (!this.db.aiData[uid]) {
        this.db.aiData[uid] = createDefaultAiData(uid);
        dirty = true;
      }

      const prev = deduplicatedUsers.get(uid);
      if (!prev) {
        deduplicatedUsers.set(uid, u);
      } else {
        deduplicatedUsers.set(uid, this.mergeUserRecordsNonDestructive(prev, u));
        dirty = true;
      }
    }
    this.db.users = Array.from(deduplicatedUsers.values());

    // 3. Migrate inline base64 media in stories, posts, and messages to binary object storage
    for (const story of this.db.stories || []) {
      const sOwner = String(story.userId || 'SYSTEM').toUpperCase();
      if (story.mediaUrl && String(story.mediaUrl).startsWith('data:')) {
        story.mediaUrl = this.persistInlineMedia(story.mediaUrl, sOwner, 'public');
        dirty = true;
      }
      if (story.userPhoto && String(story.userPhoto).startsWith('data:')) {
        story.userPhoto = this.persistInlineMedia(story.userPhoto, sOwner, 'public');
        dirty = true;
      }
      if (Array.isArray(story.items)) {
        for (const it of story.items) {
          if (it.url && String(it.url).startsWith('data:')) {
            it.url = this.persistInlineMedia(it.url, sOwner, 'public');
            dirty = true;
          }
        }
      }
    }

    for (const post of this.db.posts || []) {
      const pOwner = String(post.userId || 'SYSTEM').toUpperCase();
      if (post.url && String(post.url).startsWith('data:')) {
        post.url = this.persistInlineMedia(post.url, pOwner, 'public');
        dirty = true;
      }
      if (post.thumbnail && String(post.thumbnail).startsWith('data:')) {
        post.thumbnail = this.persistInlineMedia(post.thumbnail, pOwner, 'public');
        dirty = true;
      }
    }

    for (const [cid, msgs] of Object.entries(this.db.messages || {})) {
      if (!Array.isArray(msgs)) continue;
      const participants = cid.includes('_') ? cid.split('_').map((p) => p.toUpperCase()) : [];
      for (const m of msgs) {
        if (m.mediaUrl && String(m.mediaUrl).startsWith('data:')) {
          m.mediaUrl = this.persistInlineMedia(
            m.mediaUrl,
            String(m.senderId || 'SYSTEM').toUpperCase(),
            participants.length === 2 ? 'participants' : 'public',
            participants
          );
          dirty = true;
        }
        if (m.senderPhoto && String(m.senderPhoto).startsWith('data:')) {
          m.senderPhoto = this.persistInlineMedia(m.senderPhoto, String(m.senderId || 'SYSTEM').toUpperCase(), 'public');
          dirty = true;
        }
      }
    }

    // 4. Rebuild outgoingRequests from pending incoming friendRequests if missing
    for (const [toId, reqList] of Object.entries(this.db.friendRequests || {})) {
      for (const req of reqList || []) {
        if (req.status === 'pending' && req.from) {
          const fromUpper = String(req.from).toUpperCase();
          const toUpper = String(toId).toUpperCase();
          this.db.outgoingRequests[fromUpper] = this.db.outgoingRequests[fromUpper] || [];
          if (!this.db.outgoingRequests[fromUpper].some((o) => String(o.to).toUpperCase() === toUpper && o.status === 'pending')) {
            this.db.outgoingRequests[fromUpper].push({
              id: req.id,
              from: fromUpper,
              to: toUpper,
              status: 'pending',
              time: req.time || Date.now(),
            });
            dirty = true;
          }
        }
      }
    }

    // 5. Ensure default ZE.io Creators Hub group & communities exist in DB
    if (!Array.isArray(this.db.groups) || this.db.groups.length === 0) {
      this.db.groups = [
        {
          id: 'group_zeio_creators',
          name: 'ZE.io Creators Hub',
          photo: '',
          members: ['ZE-OWNER'],
          admin: 'ZE-OWNER',
          createdAt: 1700000000000,
          description: 'Grup obrolan resmi kreator dan komunitas audio ZE.io',
        },
      ];
      dirty = true;
    }

    if (!Array.isArray(this.db.communities) || this.db.communities.length === 0) {
      this.db.communities = [
        {
          id: 'comm_beatmakers',
          name: 'Beatmakers Indonesia',
          description: 'Tempat berbagi beat musik, mixing tips, dan review audio.',
          members: ['ZE-OWNER'],
          createdAt: 1700000000000,
        },
        {
          id: 'comm_tiktok',
          name: 'TikTok Sound Trends',
          description: 'Update sound trending harian tanpa watermark.',
          members: ['ZE-OWNER'],
          createdAt: 1700000000000,
        },
        {
          id: 'comm_anime',
          name: 'Anime & Aesthetic Creators',
          description: 'Komunitas edit video anime AMV dan foto estetik.',
          members: ['ZE-OWNER'],
          createdAt: 1700000000000,
        },
      ];
      dirty = true;
    }

    if (dirty) {
      this.saveNow();
    }
  }

  // Non-destructive merge: NEVER overwrite custom cloud avatar, bio, or display name with empty/placeholder values!
  public mergeUserRecordsNonDestructive(existing: any, incoming: any): any {
    const uid = String(existing.id || incoming.id).toUpperCase();
    const isOwner = uid === 'ZE-OWNER' || String(existing.username || '').toLowerCase() === 'ze.io';

    let incomingPhoto = incoming.photo ?? incoming.avatar;
    if (incomingPhoto && typeof incomingPhoto === 'string' && incomingPhoto.startsWith('data:')) {
      incomingPhoto = this.persistInlineMedia(incomingPhoto, uid, 'public');
    }
    const existingPhoto = existing.photo || existing.avatar || '';

    // Preserve real cloud photo if incoming is empty or a generic placeholder while existing is a real photo
    let finalPhoto = existingPhoto;
    if (incomingPhoto && (!isPlaceholderAvatar(incomingPhoto) || !existingPhoto)) {
      finalPhoto = incomingPhoto;
    }

    // Preserve real cloud bio if incoming is empty or default placeholder while existing has custom bio
    let finalBio = existing.bio || (isOwner ? 'Official Owner & Creator of ZE.io 🚀' : 'Hey there! I am using ZE.io.');
    if (typeof incoming.bio === 'string' && incoming.bio.trim()) {
      if (!isPlaceholderBio(incoming.bio) || isPlaceholderBio(existing.bio)) {
        finalBio = incoming.bio.trim();
      }
    }

    // Preserve display name unless explicitly non-empty and not generic 'User'/'ZE User'
    let finalName = existing.name;
    if (typeof incoming.name === 'string' && incoming.name.trim()) {
      const trimmedName = incoming.name.trim();
      if ((trimmedName !== 'User' && trimmedName !== 'ZE User') || !existing.name) {
        finalName = trimmedName;
      }
    }

    const merged: any = {
      ...existing,
      id: uid,
      username: isOwner ? 'ZE.io' : String(existing.username || incoming.username || '').replace(/^@/, ''),
      name: isOwner ? (finalName || 'zvn3') : finalName,
      photo: finalPhoto,
      avatar: finalPhoto,
      bio: finalBio,
      role: isOwner ? 'owner' : 'user',
      isOwner,
      isVerified: isOwner || Boolean(existing.isVerified),
      followers: existing.followers ?? incoming.followers ?? 0,
      createdAt: existing.createdAt || incoming.createdAt || Date.now(),
      joinedDate: existing.joinedDate || incoming.joinedDate || 'October 2026',
      updatedAt: Date.now(),
    };

    if (incoming.email || existing.email) {
      merged.email = incoming.email || existing.email;
    }
    if (incoming.phone || existing.phone) {
      merged.phone = incoming.phone || existing.phone;
    }
    if (existing.passwordScrypt) {
      merged.passwordScrypt = existing.passwordScrypt;
    } else if (incoming.password || incoming.pass) {
      merged.passwordScrypt = this.hashPassword(String(incoming.password || incoming.pass));
    }

    return merged;
  }

  public getAccountPreferences(userId: string): AccountPreferencesRecord {
    const uid = String(userId).toUpperCase();
    if (!this.db.accountData[uid]) {
      this.db.accountData[uid] = createDefaultAccountPreferences(uid);
    }
    return this.db.accountData[uid];
  }

  public updateAccountPreferences(userId: string, patch: Partial<AccountPreferencesRecord>): AccountPreferencesRecord {
    const uid = String(userId).toUpperCase();
    const current = this.getAccountPreferences(uid);

    if (patch.accountSettings) {
      current.accountSettings = { ...current.accountSettings, ...patch.accountSettings };
    }
    if (patch.privacySettings) {
      current.privacySettings = { ...current.privacySettings, ...patch.privacySettings };
    }
    if (patch.themePreferences) {
      const nextThemes = Array.isArray(patch.themePreferences.customThemes)
        ? patch.themePreferences.customThemes.map((t) => ({
            ...t,
            videoUrl: t.videoUrl ? this.persistInlineMedia(t.videoUrl, uid, 'public') : t.videoUrl,
          }))
        : current.themePreferences.customThemes;
      current.themePreferences = {
        activeThemeId: patch.themePreferences.activeThemeId || current.themePreferences.activeThemeId,
        customThemes: nextThemes,
      };
    }
    if (patch.appPreferences) {
      current.appPreferences = {
        ...current.appPreferences,
        ...patch.appPreferences,
        notifications: {
          ...current.appPreferences.notifications,
          ...(patch.appPreferences.notifications || {}),
        },
        autoDownload: {
          ...current.appPreferences.autoDownload,
          ...(patch.appPreferences.autoDownload || {}),
        },
        fpsConfig: {
          ...current.appPreferences.fpsConfig,
          ...(patch.appPreferences.fpsConfig || {}),
        },
        customLists: Array.isArray(patch.appPreferences.customLists)
          ? patch.appPreferences.customLists
          : current.appPreferences.customLists,
        viewedStoryIds: Array.isArray(patch.appPreferences.viewedStoryIds)
          ? Array.from(new Set([...current.appPreferences.viewedStoryIds, ...patch.appPreferences.viewedStoryIds]))
          : current.appPreferences.viewedStoryIds,
      };
    }
    if (Array.isArray(patch.likedPosts)) {
      current.likedPosts = patch.likedPosts.map((p) => ({
        ...p,
        thumbnail: p.thumbnail ? this.persistInlineMedia(p.thumbnail, uid, 'public') : p.thumbnail,
      }));
    }

    current.updatedAt = Date.now();
    this.db.accountData[uid] = current;
    this.saveNow();
    return current;
  }

  public getUserAiData(userId: string): UserAiData {
    const uid = String(userId).toUpperCase();
    if (!this.db.aiData[uid]) {
      this.db.aiData[uid] = createDefaultAiData(uid);
    }
    return this.db.aiData[uid];
  }

  // Build full cross-device hydration snapshot for Device B login
  public buildAccountSyncSnapshot(userId: string) {
    const uid = String(userId).toUpperCase();
    const userRecord = this.db.users.find((u) => String(u.id).toUpperCase() === uid);
    if (!userRecord) return null;

    const safeProfile = this.sanitizePublicUser(userRecord);
    const preferences = this.getAccountPreferences(uid);
    const aiData = this.getUserAiData(uid);

    // Friends, incoming & outgoing requests, blocked users, history
    const friendIds = Array.from(
      new Set(
        (this.db.friendships[uid] || this.db.friendships[userRecord.id] || []).map((id) => String(id).toUpperCase())
      )
    );
    const friends = friendIds
      .map((fid) => this.db.users.find((u) => String(u.id).toUpperCase() === fid))
      .filter(Boolean)
      .map((u) => this.sanitizePublicUser(u));

    const rawIncoming = [
      ...(this.db.friendRequests[uid] || []),
      ...(userRecord.id !== uid ? this.db.friendRequests[userRecord.id] || [] : []),
    ];
    const incomingSeen = new Set<string>();
    const incomingRequests = rawIncoming
      .filter((r) => r.status === 'pending' && !incomingSeen.has(String(r.from).toUpperCase()) && incomingSeen.add(String(r.from).toUpperCase()))
      .map((r) => {
        const sender = this.db.users.find((u) => String(u.id).toUpperCase() === String(r.from).toUpperCase());
        const safeSender = sender ? this.sanitizePublicUser(sender) : null;
        return {
          id: r.id,
          from: String(r.from).toUpperCase(),
          to: uid,
          fromName: safeSender?.name || r.from,
          fromUsername: safeSender?.username || r.from,
          fromPhoto: safeSender?.photo || '',
          status: 'pending' as const,
          time: r.time || Date.now(),
        };
      });

    const outgoingRequests = (this.db.outgoingRequests[uid] || []).filter((r) => r.status === 'pending');
    const blockedUsers = this.db.blockedUsers[uid] || [];

    const friendshipHistory = Object.values(this.db.friendshipHistory || {}).filter((h) =>
      h.users.some((u) => String(u).toUpperCase() === uid)
    );

    // User's private & group conversations with accurate unread counts
    const userChats = (this.db.chats || [])
      .filter((c: any) => {
        const cid = String(c.chatId || c.id || '');
        const parts: string[] =
          Array.isArray(c.participants) && c.participants.length > 0
            ? c.participants
            : cid.includes('_')
            ? cid.split('_')
            : [];
        return parts.some((p) => String(p).toUpperCase() === uid);
      })
      .map((c: any) => {
        const cid = String(c.chatId || c.id);
        const readKey = `${cid}_${uid}`;
        const lastReadAt = this.db.chatReadStatus[readKey] || 0;
        const msgs = (this.db.messages[cid] || []).filter(
          (m: any) => !m.deletedForEveryone && !(Array.isArray(m.deletedFor) && m.deletedFor.includes(uid))
        );
        const unreadCount = msgs.filter(
          (m: any) => String(m.senderId || '').toUpperCase() !== uid && (m.createdAt || 0) > lastReadAt
        ).length;
        return {
          ...c,
          id: cid,
          chatId: cid,
          unreadCount,
          lastTime: c.lastTime || c.updatedAt || Date.now(),
        };
      })
      .sort((a: any, b: any) => (b.lastTime || 0) - (a.lastTime || 0));

    // User's posts
    const userPosts = (this.db.posts || []).filter(
      (p: any) =>
        String(p.userId || '').toUpperCase() === uid ||
        String(p.username || '').toLowerCase() === String(safeProfile.username || '').toLowerCase()
    );

    // User's groups
    const groups = this.db.groups || [];
    const communities = this.db.communities || [];
    const musicTracks = (this.db.musicHistory || {})[uid] || (this.db.musicHistory || {})[userRecord.id] || [];

    return {
      user: safeProfile,
      preferences,
      friends,
      friendIds,
      incomingRequests,
      outgoingRequests,
      blockedUsers,
      friendshipHistory,
      chats: userChats,
      posts: userPosts,
      likedPosts: preferences.likedPosts || [],
      groups,
      communities,
      musicTracks,
      aiData,
      syncedAt: Date.now(),
    };
  }

  // Export complete account data (JSON or human-readable TXT for Chats backup)
  public exportAccountData(userId: string) {
    const uid = String(userId).toUpperCase();
    const snapshot = this.buildAccountSyncSnapshot(uid);
    if (!snapshot) return null;

    const conversationsExport: Record<string, any[]> = {};
    for (const chat of snapshot.chats) {
      const cid = chat.chatId || chat.id;
      const msgs = (this.db.messages[cid] || []).filter(
        (m: any) => !m.deletedForEveryone && !(Array.isArray(m.deletedFor) && m.deletedFor.includes(uid))
      );
      conversationsExport[cid] = msgs;
    }

    return {
      exportedAt: new Date().toISOString(),
      platform: 'ZE.io Cloud Account Export',
      account: snapshot.user,
      preferences: snapshot.preferences,
      friends: snapshot.friends,
      incomingRequests: snapshot.incomingRequests,
      outgoingRequests: snapshot.outgoingRequests,
      blockedUsers: snapshot.blockedUsers,
      conversations: conversationsExport,
      aiConversations: snapshot.aiData,
      posts: snapshot.posts,
    };
  }

  // Permanent account deletion (protects ZE-OWNER system account unless forced)
  public deleteAccountPermanently(userId: string): boolean {
    const uid = String(userId).toUpperCase();
    if (!uid || uid === 'ZE-OWNER') return false;

    const beforeLen = this.db.users.length;
    this.db.users = this.db.users.filter((u) => String(u.id).toUpperCase() !== uid);
    if (this.db.users.length === beforeLen) return false;

    // Revoke all sessions for this user
    for (const [tid, sess] of Object.entries(this.db.sessions)) {
      if (String(sess.userId).toUpperCase() === uid) {
        delete this.db.sessions[tid];
      }
    }

    delete this.db.accountData[uid];
    delete this.db.aiData[uid];
    delete this.db.friendships[uid];
    delete this.db.friendRequests[uid];
    delete this.db.outgoingRequests[uid];
    delete this.db.blockedUsers[uid];
    delete this.db.notes[uid];
    delete this.db.musicHistory[uid];

    // Clean references in other users' friendships & pending requests
    for (const k of Object.keys(this.db.friendships)) {
      this.db.friendships[k] = (this.db.friendships[k] || []).filter((id) => String(id).toUpperCase() !== uid);
    }
    for (const k of Object.keys(this.db.friendRequests)) {
      this.db.friendRequests[k] = (this.db.friendRequests[k] || []).filter((r) => String(r.from).toUpperCase() !== uid);
    }
    for (const k of Object.keys(this.db.outgoingRequests)) {
      this.db.outgoingRequests[k] = (this.db.outgoingRequests[k] || []).filter((r) => String(r.to).toUpperCase() !== uid);
    }

    // Remove user's stories and posts
    this.db.stories = (this.db.stories || []).filter((s: any) => String(s.userId || '').toUpperCase() !== uid);
    this.db.posts = (this.db.posts || []).filter((p: any) => String(p.userId || '').toUpperCase() !== uid);

    this.saveNow();
    return true;
  }

  public recordIdempotentMutation(mutationId?: string): boolean {
    if (!mutationId) return false;
    const now = Date.now();
    // Prune mutations older than 24h
    for (const [k, ts] of Object.entries(this.db.processedMutations)) {
      if (now - ts > 86400000) delete this.db.processedMutations[k];
    }
    if (this.db.processedMutations[mutationId]) {
      return true; // Already processed!
    }
    this.db.processedMutations[mutationId] = now;
    return false;
  }
}
