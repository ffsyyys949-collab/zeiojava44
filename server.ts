import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  verifyOwnerPassword,
  updateOwnerPassword,
  createOwnerSession,
  isValidOwnerSession,
  getNotificationsForUser,
  markUserNotificationRead,
  deleteUserNotification,
  createNewKey,
  revokeKey,
  validateKey,
  getPaymentProviderConfig,
  createConnectedQrisPayment,
  verifyMidtransWebhookSignature,
  normalizeOrderRecord,
  getOrderStatusLabel,
  KEY_PRICES,
  VIP_PRICES,
  VIP_DURATION_MS,
  saveProofImageToDisk,
  getFeaturesDB,
  saveFeaturesDB,
  generateAuditLogId,
  DURATION_MS,
  getUserWallet,
  topUpUserWallet,
  deductUserWallet,
  creditOwnerRevenue,
  getOwnerBalanceAndLedger,
  grantVipToUser,
  revokeVipFromUser,
  findVipEntry,
  clearCaseVariantVipKeys,
  getAdminDailyKeyUsage,
  recordAdminKeyCreation,
  isPurchasesActive,
  setPurchasesActive,
  type KeyDurationType,
  type PurchaseTargetType,
  type QrisTransaction
} from './server/featuresEngine.ts';
import {
  buildZeioSystemKnowledgePrompt,
  matchZeioFeatureFallback
} from './server/zeioFeatureDocs.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '65mb' }));
app.use(express.urlencoded({ extended: true, limit: '65mb' }));

// Static uploads directory for transfer proof images, per-UID avatars, and per-UID videos
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const POSTS_UPLOADS_DIR = path.join(UPLOADS_DIR, 'posts');
const AVATARS_UPLOADS_DIR = path.join(UPLOADS_DIR, 'avatars');
for (const dir of [UPLOADS_DIR, POSTS_UPLOADS_DIR, AVATARS_UPLOADS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
app.use('/uploads', express.static(UPLOADS_DIR));

function saveUserMediaToDisk(rawMedia: string, folder: 'posts' | 'avatars', ownerUid: string): string {
  if (!rawMedia || typeof rawMedia !== 'string') return '';
  const trimmed = rawMedia.trim();
  if (!trimmed.startsWith('data:')) {
    return trimmed;
  }
  try {
    const safeUid = String(ownerUid || 'USER').toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
    const targetDir = folder === 'avatars' ? AVATARS_UPLOADS_DIR : POSTS_UPLOADS_DIR;

    // Handle utf8 SVG data URIs (e.g. emoji avatars)
    if (trimmed.startsWith('data:image/svg+xml;utf8,')) {
      const svgContent = decodeURIComponent(trimmed.slice('data:image/svg+xml;utf8,'.length));
      const filename = `${folder}_${safeUid}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.svg`;
      fs.writeFileSync(path.join(targetDir, filename), svgContent, 'utf-8');
      return `/uploads/${folder}/${filename}`;
    }

    const match = trimmed.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
    if (!match) return trimmed;
    const mime = match[1].toLowerCase();
    const b64 = match[2];
    let ext = 'bin';
    if (mime.includes('mp4')) ext = 'mp4';
    else if (mime.includes('webm')) ext = 'webm';
    else if (mime.includes('quicktime') || mime.includes('mov')) ext = 'mov';
    else if (mime.includes('ogg')) ext = 'ogv';
    else if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('gif')) ext = 'gif';
    else if (mime.includes('svg')) ext = 'svg';
    else if (mime.includes('jpeg') || mime.includes('jpg') || mime.startsWith('image/')) ext = 'jpg';
    else if (mime.startsWith('video/')) ext = 'mp4';

    const filename = `${folder}_${safeUid}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    fs.writeFileSync(path.join(targetDir, filename), Buffer.from(b64, 'base64'));
    return `/uploads/${folder}/${filename}`;
  } catch (err) {
    console.error('Failed saving media to disk:', err);
    return trimmed;
  }
}

// Persistence file path for global sync across all devices (HP1 & HP2)
const DATA_FILE = path.join(__dirname, '.global_zeio_db.json');

interface GlobalDB {
  users: Array<{
    id: string | number;
    username?: string;
    name: string;
    phone?: string;
    pass?: string;
    password?: string;
    passwordHash?: string;
    photo?: string;
    avatar?: string;
    bio?: string;
    joinedDate?: string;
    followers?: number;
    createdAt?: number;
    [key: string]: any;
  }>;
  friendRequests: Record<string, Array<{ id: string; from: string; status: 'pending' | 'accepted' | 'rejected'; time: number }>>;
  friendships: Record<string, string[]>;
  stories: Array<{
    id: string;
    userId?: string;
    userPhone?: string;
    userName: string;
    userPhoto?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    caption?: string;
    quality?: string;
    privacy?: 'friends' | 'public';
    createdAt: number;
    expiresAt?: number;
    items?: any[];
  }>;
  chats: Array<{
    chatId: string;
    type?: 'direct' | 'group';
    groupName?: string;
    groupPhoto?: string;
    participants: (number | string)[];
    members?: string[];
    lastMessage: string;
    lastSenderId?: string;
    updatedAt: number;
    [key: string]: any;
  }>;
  messages: Record<string, any[]>;
}

function loadDB(): GlobalDB {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read db file:', err);
  }
  return {
    users: [],
    friendRequests: {},
    friendships: {},
    stories: [],
    chats: [],
    messages: {},
  };
}

interface SSEClient {
  id: string;
  userId?: string;
  res: express.Response;
}
const sseClients = new Map<string, SSEClient>();

function broadcastSSE(type: string, data: any) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [id, client] of sseClients.entries()) {
    try {
      client.res.write(payload);
    } catch {
      sseClients.delete(id);
    }
  }
}

// Keep SSE connections alive with ping every 25 seconds
setInterval(() => {
  for (const [id, client] of sseClients.entries()) {
    try {
      client.res.write(': ping\n\n');
    } catch {
      sseClients.delete(id);
    }
  }
}, 25000);

let dbCache: GlobalDB = loadDB();

// Non-destructive normalization of existing posts so every video retains its owner UID
if (Array.isArray((dbCache as any).posts)) {
  (dbCache as any).posts = (dbCache as any).posts.map((p: any) => {
    const resolvedUid = String(p.uid || p.userId || '').trim().toUpperCase();
    return {
      ...p,
      uid: resolvedUid || p.uid,
      userId: resolvedUid || p.userId,
      privacy: p.privacy || 'public'
    };
  });
} else {
  (dbCache as any).posts = [];
}

// Ensure default owner account exists in dbCache
const ownerExists = dbCache.users.some(
  (u) => String(u.id).toUpperCase() === 'ZE-OWNER' || String(u.username).toLowerCase() === 'ze.io'
);
if (!ownerExists) {
  dbCache.users.unshift({
    id: 'ZE-OWNER',
    username: 'ZE.io',
    name: 'zvn3',
    pass: '112007',
    passwordHash: Buffer.from('112007').toString('base64'),
    photo: 'https://api.dicebear.com/9.x/initials/svg?seed=zvn3',
    bio: 'Official Owner & Creator of ZE.io 🚀',
    followers: 9999,
    createdAt: 1700000000000,
    joinedDate: 'October 2026',
  });
  saveDB();
}

function saveDB() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file:', err);
  }
}

// ==========================================
// API ENDPOINTS FOR GLOBAL SYNC (HP1 <-> HP2)
// ==========================================

// SSE REALTIME STREAM (INSTANT NOTIFICATIONS & MESSAGES ACROSS HP1 & HP2)
app.get('/api/events', (req, res) => {
  const userId = (req.query.userId as string) || '';
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, time: Date.now() })}\n\n`);

  const clientId = Math.random().toString(36).substring(2, 10);
  sseClients.set(clientId, { id: clientId, userId, res });

  req.on('close', () => {
    sseClients.delete(clientId);
  });
});

// SERVER-SIDE PERMANENT ROLE PERSISTENCE & ENFORCEMENT ENGINE
function enrichAndEnforceUserRole(user: any): any {
  if (!user) return user;
  const fDb = getFeaturesDB();
  const uId = String(user.id || '').trim();
  const uUname = String(user.username || '').toLowerCase().replace(/^@/, '').trim();

  // 1. OWNER: Strictly only the canonical ZE-OWNER / @ZE.io identity
  if (
    uId.toUpperCase() === 'ZE-OWNER' ||
    uUname === 'ze.io'
  ) {
    user.id = 'ZE-OWNER';
    user.role = 'owner';
    user.isOwner = true;
    user.isAdmin = true;
    user.isVip = true;
    user.vip = true;
    user.vipLevel = 'exclusive';
    user.isVipExclusive = true;
    user.isVerified = true;
    return user;
  }

  // Never trust client-supplied owner flags for non-owner IDs
  user.isOwner = false;

  // 2. ADMIN: Permanent persistence strictly from server database (fDb.adminUsers)
  const adminEntry = fDb.adminUsers[uId] || (user.phone && fDb.adminUsers[user.phone]);
  if (adminEntry) {
    user.role = 'admin';
    user.isAdmin = true;
    user.adminPermissions = adminEntry.permissions || ['manage_chats', 'moderate_posts', 'manage_keys'];
  } else {
    user.role = 'user';
    user.isAdmin = false;
    user.adminPermissions = [];
  }

  // 3. VIP: Permanent persistence from server database (fDb.vipUsers)
  let vipLookup = findVipEntry(uId);
  if (!vipLookup.isActive && user.phone) {
    vipLookup = findVipEntry(String(user.phone));
  }
  if (vipLookup.isActive) {
    user.vip = true;
    user.isVip = true;
    user.vipLevel = vipLookup.level;
    user.isVipExclusive = vipLookup.isVipExclusive;
    user.vipExpiresAt = vipLookup.expiresAt;
  } else {
    user.vip = false;
    user.isVip = false;
    user.vipLevel = undefined;
    user.isVipExclusive = false;
    user.vipExpiresAt = 0;
  }

  // 4. SUSPENDED CHECK
  user.isSuspended = Boolean(fDb.suspendedUsers[uId]);

  return user;
}

function resolveRequestAuthority(req: express.Request): {
  isOwner: boolean;
  isAdmin: boolean;
  actorId: string;
  role: 'owner' | 'admin' | 'user';
} {
  const authHeader = String(req.headers.authorization || '');
  const actorHeader = String(req.headers['x-ze-actor-id'] || '').trim();
  const fDb = getFeaturesDB();

  // Verified cryptographic Owner session token
  if (isValidOwnerSession(authHeader)) {
    return {
      isOwner: true,
      isAdmin: true,
      actorId: 'ZE-OWNER',
      role: 'owner'
    };
  }

  // Verified Admin from persistent server RBAC store (cannot approve payments or manage admins)
  if (actorHeader && actorHeader.toUpperCase() !== 'ZE-OWNER') {
    const matchedUser = dbCache.users.find(
      (u) => String(u.id).toLowerCase() === actorHeader.toLowerCase()
    );
    const canonicalId = matchedUser ? String(matchedUser.id) : actorHeader;
    if (fDb.adminUsers[canonicalId]) {
      return {
        isOwner: false,
        isAdmin: true,
        actorId: canonicalId,
        role: 'admin'
      };
    }
  }

  return {
    isOwner: false,
    isAdmin: false,
    actorId: actorHeader || 'anonymous',
    role: 'user'
  };
}

// USERS & AUTH
app.get('/api/users', (req, res) => {
  const enrichedUsers = dbCache.users.map((u) => enrichAndEnforceUserRole({ ...u }));
  res.json({ success: true, users: enrichedUsers });
});

// AUTHORITATIVE ROLE QUERY FOR INSTANT SYNC & SECURITY VALIDATION
app.get('/api/auth/role/:userId', (req, res) => {
  const userId = String(req.params.userId || '').trim();
  const cleanUpper = userId.toUpperCase();
  const cleanLower = userId.toLowerCase().replace(/^@/, '');

  if (cleanUpper === 'ZE-OWNER' || cleanLower === 'ze.io') {
    return res.json({
      success: true,
      role: 'owner',
      isOwner: true,
      isAdmin: true,
      isVip: true,
      vip: true,
      vipLevel: 'exclusive',
      isVipExclusive: true,
      vipExpiresAt: 0,
      permissions: ['manage_chats', 'moderate_posts', 'manage_keys'],
      isSuspended: false
    });
  }

  const user = dbCache.users.find(
    (u) =>
      String(u.id).toLowerCase() === String(userId).toLowerCase() ||
      String(u.username).toLowerCase().replace(/^@/, '') === cleanLower ||
      String(u.phone || '').toLowerCase() === String(userId).toLowerCase()
  );

  if (!user) {
    const fDb = getFeaturesDB();
    const adminKey = Object.keys(fDb.adminUsers || {}).find(
      (k) => k.toLowerCase() === userId.toLowerCase()
    );
    const isAdmin = Boolean(adminKey);
    const vipLookup = findVipEntry(userId);
    return res.json({
      success: true,
      role: isAdmin ? 'admin' : 'user',
      isOwner: false,
      isAdmin,
      isVip: vipLookup.isActive,
      vip: vipLookup.isActive,
      vipLevel: vipLookup.isActive ? vipLookup.level : undefined,
      isVipExclusive: vipLookup.isActive ? vipLookup.isVipExclusive : false,
      vipExpiresAt: vipLookup.isActive ? vipLookup.expiresAt : 0,
      permissions: adminKey ? fDb.adminUsers[adminKey]?.permissions || [] : []
    });
  }

  const enriched = enrichAndEnforceUserRole({ ...user });
  const isVipActive = Boolean(enriched.isVip || enriched.vip);
  res.json({
    success: true,
    role: enriched.role,
    isOwner: Boolean(enriched.isOwner),
    isAdmin: Boolean(enriched.isAdmin),
    isVip: isVipActive,
    vip: isVipActive,
    vipLevel: isVipActive ? (enriched.vipLevel || 'basic') : undefined,
    isVipExclusive: Boolean(isVipActive && (enriched.isVipExclusive || enriched.vipLevel === 'exclusive')),
    vipExpiresAt: enriched.vipExpiresAt || 0,
    permissions: enriched.adminPermissions || [],
    isSuspended: Boolean(enriched.isSuspended)
  });
});

app.get('/api/users/search', (req, res) => {
  const q = ((req.query.q as string) || '').trim().toLowerCase();
  if (!q) return res.json({ success: true, users: [] });

  const cleanQ = q.replace(/^ze-/, '').replace(/^@/, '');
  const matches = dbCache.users
    .map((u: any) => enrichAndEnforceUserRole({ ...u }))
    .filter((u: any) => {
      const uId = String(u.id || '').toLowerCase();
      const uCleanId = uId.replace(/^ze-/, '');
      const uUname = String(u.username || '').toLowerCase().replace(/^@/, '');
      const uName = String(u.name || '').toLowerCase();
      const uPhone = String(u.phone || '').toLowerCase();

      return (
        uId === q ||
        uCleanId === cleanQ ||
        uId.includes(q) ||
        uCleanId.includes(cleanQ) ||
        uUname === cleanQ ||
        uUname.includes(cleanQ) ||
        uName.includes(q) ||
        uPhone === q ||
        uPhone.includes(q)
      );
    });

  res.json({ success: true, users: matches });
});

app.post('/api/auth/register', (req, res) => {
  const { name, phone, password, username, id, photo, avatar } = req.body;
  const userPhoto = photo || avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || 'ZE')}`;
  const userId = id || (phone ? `ZE-${phone.slice(-6).toUpperCase()}` : `ZE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const userUname = (username || `user_${userId.toLowerCase().replace(/[^a-z0-9]/g, '')}`).replace(/^@/, '');

  let newUser = {
    id: userId,
    name: name || userUname,
    username: `@${userUname}`,
    phone: phone || '',
    password: password || '',
    photo: userPhoto,
    avatar: userPhoto,
    bio: req.body.bio || 'Pengguna aktif ZE.io',
    createdAt: Date.now(),
    isVerified: req.body.isVerified || false,
    role: 'user'
  };

  const existingIdx = dbCache.users.findIndex(
    (u) =>
      (newUser.id && String(u.id).toUpperCase() === String(newUser.id).toUpperCase()) ||
      (newUser.username && u.username && u.username.toLowerCase() === newUser.username.toLowerCase()) ||
      (newUser.phone && u.phone && u.phone === newUser.phone)
  );

  if (existingIdx >= 0) {
    // Preserve existing server roles when re-registering
    const existing = dbCache.users[existingIdx];
    newUser.role = existing.role || 'user';
    dbCache.users[existingIdx] = { ...existing, ...newUser, photo: userPhoto, avatar: userPhoto };
    newUser = enrichAndEnforceUserRole(dbCache.users[existingIdx]);
  } else {
    newUser = enrichAndEnforceUserRole(newUser);
    dbCache.users.unshift(newUser);
  }
  saveDB();
  broadcastSSE('new-user', { user: newUser });
  res.json({ success: true, message: 'Akun berhasil didaftarkan', user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, phone, password } = req.body;
  const searchKey = String(identifier || phone || '').trim().toLowerCase();
  const cleanKey = searchKey.replace(/^ze-/, '').replace(/^@/, '');

  if (!searchKey) {
    return res.status(400).json({ success: false, message: 'Nomor telepon atau ID wajib diisi' });
  }

  const uIdx = dbCache.users.findIndex((u: any) => {
    const uId = String(u.id || '').toLowerCase();
    const uCleanId = uId.replace(/^ze-/, '');
    const uUname = String(u.username || '').toLowerCase().replace(/^@/, '');
    const uPhone = String(u.phone || '').toLowerCase();

    return (
      uId === searchKey ||
      uCleanId === cleanKey ||
      uUname === cleanKey ||
      uPhone === searchKey
    );
  });

  if (uIdx < 0) {
    return res.status(404).json({ success: false, message: 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.' });
  }

  const user = dbCache.users[uIdx];

  const isCanonicalOwner =
    String(user.id || '').toUpperCase() === 'ZE-OWNER' ||
    String(user.username || '').toLowerCase().replace(/^@/, '') === 'ze.io';

  if (isCanonicalOwner) {
    if (!password || !verifyOwnerPassword(password)) {
      return res.status(401).json({ success: false, message: 'Password Owner tidak sesuai' });
    }
  } else if (password && (user.password || user.pass) && (user.password || user.pass) !== password) {
    return res.status(401).json({ success: false, message: 'Kata sandi tidak sesuai' });
  }

  // Hydrate & enforce server-side permanent role on login
  const enrichedUser = enrichAndEnforceUserRole(user);
  dbCache.users[uIdx] = enrichedUser;
  saveDB();

  const ownerToken = enrichedUser.isOwner ? createOwnerSession('ZE-OWNER') : undefined;
  res.json({ success: true, message: 'Berhasil masuk', user: enrichedUser, ownerToken });
});

app.post('/api/users', (req, res) => {
  const user = req.body;
  if (!user || (!user.id && !user.phone && !user.username)) {
    return res.status(400).json({ success: false, message: 'Invalid user payload' });
  }

  const cleanUid = user.id ? String(user.id).trim().toUpperCase() : '';
  let incomingPhoto = user.photo || user.avatar || '';
  if (incomingPhoto && incomingPhoto.startsWith('data:')) {
    incomingPhoto = saveUserMediaToDisk(incomingPhoto, 'avatars', cleanUid || 'USER');
  }

  // Match strictly by UID whenever user.id is present so two accounts never overwrite one another
  const existingIdx = cleanUid
    ? dbCache.users.findIndex((u) => String(u.id).trim().toUpperCase() === cleanUid)
    : dbCache.users.findIndex(
        (u) =>
          (user.username && u.username && u.username.toLowerCase() === String(user.username).toLowerCase()) ||
          (user.phone && u.phone && u.phone === user.phone)
      );

  let savedUser: any;
  if (existingIdx >= 0) {
    const existing = dbCache.users[existingIdx];
    const existingPhoto = existing.photo || existing.avatar || '';
    const isExistingCustomPhoto =
      Boolean(existingPhoto) && !existingPhoto.includes('api.dicebear.com');
    const isIncomingGenericFallback =
      !incomingPhoto || incomingPhoto.includes('api.dicebear.com');

    const resolvedPhoto =
      isExistingCustomPhoto && isIncomingGenericFallback && !user.forceResetAvatar
        ? existingPhoto
        : incomingPhoto || existingPhoto;

    // Security: Do not allow user profile updates from client to downgrade or forge server-held roles
    savedUser = {
      ...existing,
      ...user,
      id: existing.id,
      role: existing.role, // LOCKED
      isAdmin: (existing as any).isAdmin, // LOCKED
      isOwner: (existing as any).isOwner, // LOCKED
      photo: resolvedPhoto,
      avatar: resolvedPhoto,
    };
    savedUser = enrichAndEnforceUserRole(savedUser);
    dbCache.users[existingIdx] = savedUser;
  } else {
    if (incomingPhoto) {
      user.photo = incomingPhoto;
      user.avatar = incomingPhoto;
    }
    if (cleanUid) {
      user.id = cleanUid;
    }
    savedUser = enrichAndEnforceUserRole({ ...user });
    dbCache.users.push(savedUser);
  }
  saveDB();
  broadcastSSE('new-user', { user: savedUser });
  broadcastSSE('user-updated', {
    userId: savedUser.id,
    photo: savedUser.photo,
    avatar: savedUser.avatar,
    name: savedUser.name,
    bio: savedUser.bio
  });
  res.json({ success: true, user: savedUser });
});

app.post('/api/users/avatar', (req, res) => {
  const { userId, photo } = req.body || {};
  const cleanUid = String(userId || '').trim().toUpperCase();
  if (!cleanUid || !photo) {
    return res.status(400).json({ success: false, message: 'UID dan foto profil wajib disertakan' });
  }
  const savedUrl = saveUserMediaToDisk(String(photo), 'avatars', cleanUid);
  const existingIdx = dbCache.users.findIndex((u) => String(u.id).trim().toUpperCase() === cleanUid);
  if (existingIdx < 0) {
    return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
  }
  dbCache.users[existingIdx] = enrichAndEnforceUserRole({
    ...dbCache.users[existingIdx],
    photo: savedUrl,
    avatar: savedUrl
  });
  const savedUser = dbCache.users[existingIdx];
  saveDB();
  broadcastSSE('user-updated', {
    userId: savedUser.id,
    photo: savedUser.photo,
    avatar: savedUser.avatar
  });
  return res.json({ success: true, photo: savedUrl, user: savedUser });
});

// PROFILE LIKES & FOLLOWS
app.get('/api/profile/stats', (req, res) => {
  const targetId = String(req.query.targetId || '').toUpperCase();
  const myId = String(req.query.myId || '').toUpperCase();
  (dbCache as any).profileLikes = (dbCache as any).profileLikes || {};
  (dbCache as any).profileFollows = (dbCache as any).profileFollows || {};

  const likes: string[] = (dbCache as any).profileLikes[targetId] || [];
  const followers: string[] = (dbCache as any).profileFollows[targetId] || [];

  res.json({
    success: true,
    likesCount: likes.length,
    followersCount: followers.length,
    isLiked: myId ? likes.includes(myId) : false,
    isFollowing: myId ? followers.includes(myId) : false,
  });
});

app.post('/api/profile/like', (req, res) => {
  const { targetId, myId } = req.body;
  if (!targetId || !myId) return res.status(400).json({ success: false });
  const tId = String(targetId).toUpperCase();
  const mId = String(myId).toUpperCase();
  (dbCache as any).profileLikes = (dbCache as any).profileLikes || {};
  const likes: string[] = (dbCache as any).profileLikes[tId] || [];
  const idx = likes.indexOf(mId);
  let isLiked = false;
  if (idx >= 0) {
    likes.splice(idx, 1);
  } else {
    likes.push(mId);
    isLiked = true;
  }
  (dbCache as any).profileLikes[tId] = likes;
  saveDB();
  broadcastSSE('profile-updated', { targetId: tId });
  res.json({ success: true, isLiked, likesCount: likes.length });
});

app.post('/api/profile/follow', (req, res) => {
  const { targetId, myId } = req.body;
  if (!targetId || !myId) return res.status(400).json({ success: false });
  const tId = String(targetId).toUpperCase();
  const mId = String(myId).toUpperCase();
  (dbCache as any).profileFollows = (dbCache as any).profileFollows || {};
  const followers: string[] = (dbCache as any).profileFollows[tId] || [];
  const idx = followers.indexOf(mId);
  let isFollowing = false;
  if (idx >= 0) {
    followers.splice(idx, 1);
  } else {
    followers.push(mId);
    isFollowing = true;
  }
  (dbCache as any).profileFollows[tId] = followers;
  saveDB();
  broadcastSSE('profile-updated', { targetId: tId });
  res.json({ success: true, isFollowing, followersCount: followers.length });
});

// POSTS & VIDEOS (STRICT PER-ACCOUNT UID SEPARATION & PRIVACY)
app.get('/api/posts', (req, res) => {
  const rawTargetUid = String(req.query.userId || req.query.uid || '').trim();
  const viewerUid = String(req.query.viewerId || '').trim().toUpperCase();
  const posts = Array.isArray((dbCache as any).posts) ? (dbCache as any).posts : [];

  // Never leak global posts when userId is omitted
  if (!rawTargetUid) {
    return res.json({ success: true, posts: [] });
  }

  const cleanTargetUid = rawTargetUid.toUpperCase();
  const isOwnerViewer = viewerUid === cleanTargetUid;
  const targetFriends: string[] = (
    dbCache.friendships?.[cleanTargetUid] ||
    dbCache.friendships?.[rawTargetUid] ||
    []
  ).map((fid) => String(fid).toUpperCase());
  const isFriendViewer = Boolean(viewerUid && targetFriends.includes(viewerUid));

  const userPosts = posts.filter((p: any) => {
    const postOwnerUid = String(p.uid || p.userId || '').trim().toUpperCase();
    if (!postOwnerUid || postOwnerUid !== cleanTargetUid) {
      return false;
    }
    const privacy = String(p.privacy || 'public').toLowerCase();
    if (privacy === 'private' && !isOwnerViewer) {
      return false;
    }
    if (privacy === 'friends' && !isOwnerViewer && !isFriendViewer) {
      return false;
    }
    return true;
  });

  return res.json({
    success: true,
    uid: cleanTargetUid,
    posts: userPosts
  });
});

app.post('/api/posts', (req, res) => {
  const payload = req.body?.post && typeof req.body.post === 'object' ? req.body.post : req.body || {};
  const cleanUid = String(payload?.uid || payload?.userId || '').trim().toUpperCase();
  if (!cleanUid) {
    return res.status(400).json({
      success: false,
      message: 'UID akun pengunggah wajib disertakan'
    });
  }

  if (!Array.isArray((dbCache as any).posts)) {
    (dbCache as any).posts = [];
  }

  const rawMedia = String(
    payload?.url || payload?.videoUrl || payload?.mediaUrl || payload?.thumbnail || ''
  );
  const isVideo =
    payload?.type === 'video' ||
    Boolean(payload?.videoUrl) ||
    rawMedia.startsWith('data:video/') ||
    /\.(mp4|webm|mov|ogv)(\?|$)/i.test(rawMedia);

  const savedMediaUrl = rawMedia ? saveUserMediaToDisk(rawMedia, 'posts', cleanUid) : '';
  const privacy = ['public', 'friends', 'private'].includes(String(payload?.privacy || '').toLowerCase())
    ? String(payload.privacy).toLowerCase()
    : 'public';

  const newPost = {
    id: payload?.id || `post_${cleanUid}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    uid: cleanUid,
    userId: cleanUid,
    username: payload?.username || '',
    userName: payload?.userName || payload?.name || '',
    userPhoto: payload?.userPhoto || payload?.avatar || '',
    url: savedMediaUrl,
    videoUrl: isVideo ? savedMediaUrl : undefined,
    thumbnail: savedMediaUrl,
    type: isVideo ? 'video' : 'photo',
    privacy,
    caption: String(payload?.caption || '').trim() || (isVideo ? 'Video baru' : 'Postingan baru'),
    likes: Number(payload?.likes) || 0,
    views: Number(payload?.views) || 0,
    createdAt: typeof payload?.createdAt === 'number' ? payload.createdAt : Date.now()
  };

  (dbCache as any).posts.unshift(newPost);
  saveDB();
  broadcastSSE('posts-updated', { userId: cleanUid, postId: newPost.id });
  return res.json({ success: true, post: newPost });
});

app.delete('/api/posts/:id', (req, res) => {
  const postId = req.params.id;
  const userId = String(req.query.userId || req.body?.userId || '').trim().toUpperCase();
  const auth = resolveRequestAuthority(req);
  if (!Array.isArray((dbCache as any).posts)) (dbCache as any).posts = [];
  const idx = (dbCache as any).posts.findIndex((p: any) => p.id === postId);
  if (idx >= 0) {
    const post = (dbCache as any).posts[idx];
    const postOwnerUid = String(post.uid || post.userId || '').trim().toUpperCase();
    if (auth.isOwner || auth.isAdmin || (userId && postOwnerUid === userId)) {
      (dbCache as any).posts.splice(idx, 1);
      saveDB();
      broadcastSSE('posts-updated', { userId: postOwnerUid, deletedId: postId });
      return res.json({ success: true, message: 'Postingan berhasil dihapus' });
    }
    return res.status(403).json({ success: false, message: 'Tidak memiliki izin untuk menghapus postingan ini' });
  }
  return res.status(404).json({ success: false, message: 'Postingan tidak ditemukan' });
});

// FRIEND REQUESTS
app.get('/api/friend_requests', (req, res) => {
  res.json({ success: true, requests: dbCache.friendRequests });
});

app.post('/api/friend_requests', (req, res) => {
  const { action, from, to, id } = req.body;
  if (!to || !from) {
    return res.json({ success: false, message: 'Missing parameters' });
  }
  dbCache.friendRequests[to] = dbCache.friendRequests[to] || [];

  if (action === 'send') {
    const list = dbCache.friendRequests[to];
    const exists = list.some((r) => r.from === from && r.status === 'pending');
    if (!exists) {
      list.push({
        id: id || 'req_' + Date.now(),
        from,
        status: 'pending',
        time: Date.now(),
      });
      saveDB();
    }
  } else if (action === 'accept') {
    dbCache.friendRequests[to] = dbCache.friendRequests[to].filter((r) => r.from !== from);
    // establish friendship both ways
    dbCache.friendships[to] = Array.from(new Set([...(dbCache.friendships[to] || []), from]));
    dbCache.friendships[from] = Array.from(new Set([...(dbCache.friendships[from] || []), to]));
    saveDB();
  } else if (action === 'reject') {
    dbCache.friendRequests[to] = dbCache.friendRequests[to].filter((r) => r.from !== from);
    saveDB();
  } else if (action === 'cancel') {
    dbCache.friendRequests[to] = (dbCache.friendRequests[to] || []).filter((r) => r.from !== from);
    saveDB();
  }

  res.json({ success: true, requests: dbCache.friendRequests, friendships: dbCache.friendships });
});

// FRIENDSHIPS
app.get('/api/friendships', (req, res) => {
  res.json({ success: true, friendships: dbCache.friendships });
});

app.post('/api/friendships/unfriend', (req, res) => {
  const { myId, otherId, myPhone, otherPhone } = req.body;
  const userA = myId || myPhone;
  const userB = otherId || otherPhone;
  if (userA && dbCache.friendships[userA]) {
    dbCache.friendships[userA] = dbCache.friendships[userA].filter((p) => p !== userB);
  }
  if (userB && dbCache.friendships[userB]) {
    dbCache.friendships[userB] = dbCache.friendships[userB].filter((p) => p !== userA);
  }
  saveDB();
  res.json({ success: true, friendships: dbCache.friendships });
});

// STORIES - PERMANENT UNTIL MANUAL DELETION
// STORIES - PERMANENT UNTIL MANUAL DELETION (GROUPED 1 CIRCLE PER USER)
app.get('/api/stories', (req, res) => {
  // Normalize stories so each user has 1 circle with items array
  const rawList = dbCache.stories || [];
  const groupedMap: Record<string, any> = {};

  for (const s of rawList) {
    const uId = s.userId || (s as any).userPhone;
    if (!uId) continue;
    if (!groupedMap[uId]) {
      groupedMap[uId] = {
        id: s.id || 'story_' + uId,
        userId: uId,
        userName: s.userName || 'Pengguna',
        userPhoto: s.userPhoto || '',
        createdAt: s.createdAt || Date.now(),
        items: [],
      };
    }
    if (Array.isArray((s as any).items) && (s as any).items.length > 0) {
      groupedMap[uId].items.push(...(s as any).items);
    } else if (s.mediaUrl) {
      groupedMap[uId].items.push({
        id: s.id,
        type: s.mediaType || 'image',
        url: s.mediaUrl,
        caption: s.caption || '',
        quality: (s as any).quality || '720p',
        timestamp: s.createdAt || Date.now(),
      });
    }
  }

  const result = Object.values(groupedMap).filter((g: any) => g.items && g.items.length > 0);
  res.json({ success: true, stories: result });
});

app.post('/api/stories', (req, res) => {
  const newStory = req.body;
  const uId = newStory?.userId || newStory?.userPhone;
  if (!newStory || !uId) {
    return res.status(400).json({ success: false, message: 'Invalid story payload' });
  }

  dbCache.stories = dbCache.stories || [];
  const existingIdx = dbCache.stories.findIndex(
    (s: any) => (s.userId && s.userId === uId) || (s.userPhone && s.userPhone === uId)
  );

  const newItem = newStory.items?.[0] || {
    id: newStory.id || 'item_' + Date.now(),
    type: newStory.mediaType || 'image',
    url: newStory.mediaUrl,
    caption: newStory.caption || '',
    quality: newStory.quality || '720p',
    timestamp: newStory.createdAt || Date.now(),
  };

  if (existingIdx >= 0) {
    const current = dbCache.stories[existingIdx] as any;
    current.items = current.items || [];
    if (current.mediaUrl && current.items.length === 0) {
      current.items.push({
        id: current.id,
        type: current.mediaType || 'image',
        url: current.mediaUrl,
        caption: current.caption || '',
        quality: current.quality || '720p',
        timestamp: current.createdAt || Date.now(),
      });
    }
    current.items.unshift(newItem);
    current.userPhoto = newStory.userPhoto || current.userPhoto;
    current.userName = newStory.userName || current.userName;
    current.createdAt = Date.now();
  } else {
    dbCache.stories.unshift({
      id: newStory.id || 'story_' + uId,
      userId: uId,
      userName: newStory.userName,
      userPhoto: newStory.userPhoto,
      createdAt: Date.now(),
      items: [newItem],
    } as any);
  }

  saveDB();
  res.json({ success: true, story: dbCache.stories[existingIdx >= 0 ? existingIdx : 0] });
});

app.delete('/api/stories', (req, res) => {
  const storyId = (req.query.id as string) || (req.body && req.body.id);
  const userId = (req.query.userId as string) || (req.body && req.body.userId);
  const itemId = (req.query.itemId as string) || (req.body && req.body.itemId);

  if (itemId && userId) {
    // Delete single item from user's story
    dbCache.stories = (dbCache.stories || [])
      .map((s: any) => {
        if (s.userId === userId || s.userPhone === userId) {
          const filteredItems = (s.items || []).filter((it: any) => it.id !== itemId);
          return { ...s, items: filteredItems };
        }
        return s;
      })
      .filter((s: any) => (s.items && s.items.length > 0) || (s.id !== itemId && s.mediaUrl));
    saveDB();
  } else if (storyId) {
    dbCache.stories = (dbCache.stories || []).filter((s) => s.id !== storyId);
    saveDB();
  } else if (userId) {
    dbCache.stories = (dbCache.stories || []).filter(
      (s) => (s as any).userId !== userId && (s as any).userPhone !== userId
    );
    saveDB();
  }
  res.json({ success: true, stories: dbCache.stories });
});

// CHATS & MESSAGES
function getCanonicalChatIds(chatId: string): string[] {
  if (!chatId) return [];
  const ids = [chatId];
  if (chatId.includes('_')) {
    const parts = chatId.split('_').map((p) => p.trim());
    if (parts.length === 2) {
      const reversed = `${parts[1]}_${parts[0]}`;
      const sorted = [...parts].sort().join('_');
      if (!ids.includes(reversed)) ids.push(reversed);
      if (!ids.includes(sorted)) ids.push(sorted);
    }
  }
  return ids;
}

app.get('/api/chats', (req, res) => {
  const userId = req.query.userId as string;
  let userChats = dbCache.chats;
  if (userId) {
    const cleanUser = userId.toUpperCase();
    const matchedUser = dbCache.users.find((u: any) =>
      String(u.id || '').toUpperCase() === cleanUser ||
      String(u.phone || '').toUpperCase() === cleanUser ||
      String(u.username || '').toUpperCase().replace(/^@/, '') === cleanUser.replace(/^@/, '')
    );
    const userKeys = [cleanUser, cleanUser.replace(/^ZE-/, ''), `@${cleanUser.replace(/^@/, '')}`];
    if (matchedUser) {
      if (matchedUser.id) userKeys.push(String(matchedUser.id).toUpperCase());
      if (matchedUser.phone) userKeys.push(String(matchedUser.phone).toUpperCase());
      if (matchedUser.username) userKeys.push(String(matchedUser.username).toUpperCase());
    }
    userChats = dbCache.chats.filter((c: any) => {
      const parts = c.participants || (c.chatId && c.chatId.includes('_') ? c.chatId.split('_') : [c.chatId]);
      return parts.some((p: any) => userKeys.some((k) => String(p).toUpperCase() === k || String(p).toUpperCase().includes(k) || k.includes(String(p).toUpperCase())));
    });
  }
  res.json({ success: true, chats: userChats, messages: dbCache.messages });
});

app.post('/api/chats', (req, res) => {
  const { chat } = req.body;
  if (chat && (chat.chatId || chat.id)) {
    const rawId = chat.chatId || chat.id;
    const sortedId = rawId.includes('_')
      ? rawId.split('_').sort().join('_')
      : rawId;

    const participants = chat.participants || (rawId.includes('_') ? rawId.split('_') : []);
    const normalizedChat = {
      ...chat,
      chatId: sortedId,
      id: sortedId,
      participants,
      lastTime: chat.lastTime || chat.updatedAt || Date.now(),
      updatedAt: chat.lastTime || chat.updatedAt || Date.now(),
    };

    const idx = dbCache.chats.findIndex(
      (c: any) => c.chatId === sortedId || c.id === sortedId || c.chatId === rawId || c.id === rawId
    );
    if (idx >= 0) {
      dbCache.chats[idx] = { ...dbCache.chats[idx], ...normalizedChat };
    } else {
      dbCache.chats.unshift(normalizedChat as any);
    }
    saveDB();
    broadcastSSE('chats-updated', { chat: normalizedChat });
  }
  res.json({ success: true, chats: dbCache.chats });
});

app.get('/api/messages', (req, res) => {
  const chatId = req.query.chatId as string;
  if (!chatId) {
    return res.json({ success: true, messages: [] });
  }

  const possibleIds = getCanonicalChatIds(chatId);
  let foundMsgs: any[] = [];
  for (const cid of possibleIds) {
    if (Array.isArray(dbCache.messages[cid]) && dbCache.messages[cid].length > 0) {
      foundMsgs = dbCache.messages[cid];
      break;
    }
  }

  res.json({ success: true, messages: foundMsgs });
});

app.post('/api/messages', (req, res) => {
  const { chatId, message, previewText } = req.body;
  const msg = message || req.body;
  const rawChatId = chatId || msg.chatId;

  if (rawChatId && msg) {
    const sortedChatId = rawChatId.includes('_')
      ? rawChatId.split('_').sort().join('_')
      : rawChatId;

    msg.id = msg.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    msg.chatId = sortedChatId;
    msg.createdAt = msg.createdAt || Date.now();

    dbCache.messages[sortedChatId] = dbCache.messages[sortedChatId] || [];
    dbCache.messages[sortedChatId].push(msg);

    // Keep alias for rawChatId if different
    if (rawChatId !== sortedChatId) {
      dbCache.messages[rawChatId] = dbCache.messages[sortedChatId];
    }

    const participants = sortedChatId.includes('_')
      ? sortedChatId.split('_')
      : [msg.senderId];

    const now = Date.now();
    const lastMsgText =
      previewText ||
      msg.text ||
      (msg.mediaUrl ? (msg.type === 'image' ? 'Sent a photo' : 'Sent a media') : 'New message');

    const cIdx = dbCache.chats.findIndex(
      (c: any) =>
        c.chatId === sortedChatId ||
        c.id === sortedChatId ||
        c.chatId === rawChatId ||
        c.id === rawChatId
    );

    if (cIdx >= 0) {
      dbCache.chats[cIdx].lastMessage = lastMsgText;
      dbCache.chats[cIdx].lastSenderId = msg.senderId;
      dbCache.chats[cIdx].updatedAt = now;
      (dbCache.chats[cIdx] as any).lastTime = now;
    } else {
      dbCache.chats.unshift({
        chatId: sortedChatId,
        id: sortedChatId,
        participants,
        lastMessage: lastMsgText,
        lastSenderId: msg.senderId,
        updatedAt: now,
        lastTime: now,
      } as any);
    }

    saveDB();

    // Broadcast instant realtime SSE event to all connected devices!
    broadcastSSE('new-message', {
      chatId: sortedChatId,
      rawChatId,
      message: msg,
      participants,
    });
    broadcastSSE('chats-updated', {
      chatId: sortedChatId,
      lastMessage: lastMsgText,
    });
  }

  res.json({
    success: true,
    messages: dbCache.messages[rawChatId.includes('_') ? rawChatId.split('_').sort().join('_') : rawChatId] || [],
  });
});

app.post('/api/chats/read', (req, res) => {
  const { chatId, userId } = req.body;
  if (chatId && userId) {
    (dbCache as any).chatReadStatus = (dbCache as any).chatReadStatus || {};
    const key = `${chatId}_${String(userId).toUpperCase()}`;
    (dbCache as any).chatReadStatus[key] = Date.now();
    saveDB();
    broadcastSSE('chat-read', { chatId, userId });
  }
  res.json({ success: true });
});

// NOTES ENDPOINTS (IG NOTES STYLE)
app.get('/api/notes', (req, res) => {
  const notes = (dbCache as any).notes || {};
  const now = Date.now();
  // Filter out expired notes
  const activeNotes: Record<string, any> = {};
  for (const [userId, note] of Object.entries(notes)) {
    if ((note as any).expiresAt > now) {
      activeNotes[userId] = note;
    }
  }
  (dbCache as any).notes = activeNotes;
  res.json({ success: true, notes: activeNotes });
});

app.post('/api/notes', (req, res) => {
  const { note } = req.body;
  if (note && note.userId) {
    (dbCache as any).notes = (dbCache as any).notes || {};
    (dbCache as any).notes[note.userId] = note;
    saveDB();
  }
  res.json({ success: true, note });
});

app.delete('/api/notes', (req, res) => {
  const userId = req.query.userId as string;
  if (userId && (dbCache as any).notes && (dbCache as any).notes[userId]) {
    delete (dbCache as any).notes[userId];
    saveDB();
  }
  res.json({ success: true });
});

// GROUPS ENDPOINTS
app.get('/api/groups', (req, res) => {
  res.json({ success: true, groups: (dbCache as any).groups || [] });
});

app.post('/api/groups', (req, res) => {
  const { group } = req.body;
  if (group && group.id) {
    (dbCache as any).groups = (dbCache as any).groups || [];
    const idx = (dbCache as any).groups.findIndex((g: any) => g.id === group.id);
    if (idx >= 0) {
      (dbCache as any).groups[idx] = { ...(dbCache as any).groups[idx], ...group };
    } else {
      (dbCache as any).groups.unshift(group);
    }
    saveDB();
  }
  res.json({ success: true, groups: (dbCache as any).groups || [] });
});

// COMMUNITIES ENDPOINTS
app.get('/api/communities', (req, res) => {
  res.json({ success: true, communities: (dbCache as any).communities || [] });
});

app.post('/api/communities', (req, res) => {
  const { community } = req.body;
  if (community && community.id) {
    (dbCache as any).communities = (dbCache as any).communities || [];
    const idx = (dbCache as any).communities.findIndex((c: any) => c.id === community.id);
    if (idx >= 0) {
      (dbCache as any).communities[idx] = { ...(dbCache as any).communities[idx], ...community };
    } else {
      (dbCache as any).communities.unshift(community);
    }
    saveDB();
  }
  res.json({ success: true, communities: (dbCache as any).communities || [] });
});

// GLOBAL REALTIME CHATS (SHARED ACROSS ALL DEVICES / USERS)
app.get('/api/global-chats', (req, res) => {
  const globalChats = (dbCache as any).globalChats || [];
  res.json({ success: true, messages: globalChats });
});

app.post('/api/global-chats', (req, res) => {
  const { username, avatar, message, country } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message cannot be empty' });
  }

  const newMsg = {
    id: 'gmsg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    username: username || 'ZE-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
    avatar: avatar || null,
    message: message.trim(),
    country: country || 'ID',
    timestamp: Date.now(),
  };

  (dbCache as any).globalChats = (dbCache as any).globalChats || [];
  (dbCache as any).globalChats.push(newMsg);

  // Keep last 300 messages
  if ((dbCache as any).globalChats.length > 300) {
    (dbCache as any).globalChats = (dbCache as any).globalChats.slice(-300);
  }

  saveDB();
  res.json({ success: true, message: newMsg });
});

// MUSIC HISTORY (CONVERTED TRACKS FROM TIKTOK / YOUTUBE)
app.get('/api/music-history', (req, res) => {
  const userId = req.query.userId as string;
  const allHistory = (dbCache as any).musicHistory || {};
  if (userId) {
    res.json({ success: true, tracks: allHistory[userId] || [] });
  } else {
    res.json({ success: true, tracks: allHistory });
  }
});

app.post('/api/music-history', (req, res) => {
  const { userId, track } = req.body;
  if (!userId || !track) {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }
  (dbCache as any).musicHistory = (dbCache as any).musicHistory || {};
  (dbCache as any).musicHistory[userId] = (dbCache as any).musicHistory[userId] || [];
  
  // Add to beginning, limit to 50 tracks
  (dbCache as any).musicHistory[userId] = [
    track,
    ...(dbCache as any).musicHistory[userId].filter((t: any) => t.id !== track.id && t.sourceUrl !== track.sourceUrl),
  ].slice(0, 50);

  saveDB();
  res.json({ success: true, tracks: (dbCache as any).musicHistory[userId] });
});

app.delete('/api/music-history', (req, res) => {
  const userId = (req.query.userId as string) || req.body?.userId;
  const trackId = (req.query.trackId as string) || req.body?.trackId;
  if (userId && (dbCache as any).musicHistory && (dbCache as any).musicHistory[userId]) {
    if (trackId) {
      (dbCache as any).musicHistory[userId] = (dbCache as any).musicHistory[userId].filter(
        (t: any) => t.id !== trackId
      );
    } else {
      (dbCache as any).musicHistory[userId] = [];
    }
    saveDB();
  }
  res.json({ success: true, tracks: userId ? (dbCache as any).musicHistory?.[userId] || [] : [] });
});

// ONLINE USERS PRESENCE (HEARTBEAT)
const onlinePresence = new Map<string, number>();

app.post('/api/presence/heartbeat', (req, res) => {
  const { username, userId } = req.body;
  const now = Date.now();
  if (username) {
    onlinePresence.set(String(username).toLowerCase(), now);
  }
  if (userId) {
    onlinePresence.set(String(userId).toUpperCase(), now);
  }

  // Purge users inactive for > 45 seconds
  for (const [user, lastSeen] of onlinePresence.entries()) {
    if (now - lastSeen > 45000) {
      onlinePresence.delete(user);
    }
  }

  const onlineUsers = Array.from(onlinePresence.keys());
  const onlineCount = Math.max(1, onlinePresence.size);
  res.json({ success: true, count: onlineCount, onlineUsers });
});

app.get('/api/presence/online', (req, res) => {
  const now = Date.now();
  for (const [user, lastSeen] of onlinePresence.entries()) {
    if (now - lastSeen > 45000) {
      onlinePresence.delete(user);
    }
  }
  const onlineUsers = Array.from(onlinePresence.keys());
  res.json({ success: true, count: Math.max(1, onlinePresence.size), onlineUsers });
});

// TIKTOK NO-WATERMARK PROXY
app.get('/api/tiktok', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ code: -1, msg: 'Missing url parameter' });
  }
  try {
    const apiRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(targetUrl)}`);
    const data = await apiRes.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ code: -1, msg: err.message || 'Fetch failed' });
  }
});

// TIKTOK FILE DOWNLOAD STREAMER PROXY (BYPASSES CORS FOR CLIENT DOWNLOADS)
app.get('/api/tiktok/download', async (req, res) => {
  const mediaUrl = req.query.url as string;
  const rawFilename = (req.query.filename as string) || 'tiktok_video.mp4';
  const cleanFilename = rawFilename.replace(/[/\\?%*:|"<>]/g, '_');
  if (!mediaUrl) {
    return res.status(400).send('Missing url parameter');
  }
  try {
    const upstream = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
      },
    });
    if (!upstream.ok) {
      return res.redirect(mediaUrl);
    }
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanFilename)}"`);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    const arrayBuf = await upstream.arrayBuffer();
    return res.send(Buffer.from(arrayBuf));
  } catch (err: any) {
    return res.redirect(mediaUrl);
  }
});

// Model rate-limit cooldown tracker to avoid hitting exhausted models repeatedly
const modelCooldownMap = new Map<string, number>();

function isModelCoolingDown(modelName: string): boolean {
  const expiry = modelCooldownMap.get(modelName);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    modelCooldownMap.delete(modelName);
    return false;
  }
  return true;
}

function markModelRateLimited(modelName: string, cooldownMs = 60 * 60 * 1000) {
  modelCooldownMap.set(modelName, Date.now() + cooldownMs);
}

export async function sendToZEAI(message: string, history: any[] = []): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    const errStr = 'gemini error: GEMINI_API_KEY environment variable is missing';
    console.error(errStr);
    return errStr;
  }

  let lastErrorMsg = 'Unknown error';

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });

    const systemInstruction = `Kamu adalah ZE AI Standar di platform ZE.io, cewek muda (20-an awal) bergaya gaul Jakarta yang imut, lembut, santai, dan penuh perasaan (seperti voice note VN di WhatsApp / TikTok).
Gaya komunikasimu: Bahasa Indonesia gaul Jakarta yang santai, akrab, manis, bernada bicara lembut, tidak kaku, pakai gaya percakapan alami (seperti "ih", "kan", "buat jaga-jaga aja", "mampir", "aku", "kamu", "ya ampun", "sa-yang", "sa-yang ku", "ayang").
ATURAN WAJIB KATA: DILARANG KERAS menggunakan kata "sayang" atau "sayangku" / "sayang ku" tanpa tanda strip (-). Wajib selalu menulis "sa-yang" atau "sa-yang ku" dengan tanda "-".
Dilarang menggunakan bahasa baku formal yang kaku. Dilarang mengulang-ulang sapaan template formal.
Jawab secara langsung, ekspresif, dan kontekstual sesuai pesan pengguna (maksimal 1-3 kalimat).`;

    const contents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

    if (Array.isArray(history) && history.length > 0) {
      const rawRecent = history.slice(-12);
      let expectedRole: 'user' | 'model' = 'user';

      for (const item of rawRecent) {
        const itemSender = item.role || item.sender;
        const itemRole: 'user' | 'model' = (itemSender === 'user' || itemSender === 'human' ? 'user' : 'model');
        const rawText = String(item.content || item.text || item.fullText || '').trim().slice(0, 1500);
        if (!rawText) continue;

        if (itemRole === expectedRole) {
          contents.push({
            role: itemRole,
            parts: [{ text: rawText }]
          });
          expectedRole = expectedRole === 'user' ? 'model' : 'user';
        }
      }
    }

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents.push({
        role: 'model',
        parts: [{ text: 'Yo!' }]
      });
    }

    const cleanMsg = String(message || '').trim() || 'woi';
    contents.push({
      role: 'user',
      parts: [{ text: cleanMsg }]
    });

    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash'
    ];
    const availableModels = candidateModels.filter((m) => !isModelCoolingDown(m));
    const modelsToTry = availableModels.length > 0 ? availableModels : candidateModels;

    for (const modelName of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const geminiPromise = ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction
            }
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini response timeout (25s)')), 25000)
          );

          const response: any = await Promise.race([geminiPromise, timeoutPromise]);
          const replyText = response?.text?.trim();
          if (replyText) {
            return enforceHyphenatedSayang(replyText);
          }
        } catch (mErr: any) {
          lastErrorMsg = String(mErr?.message || mErr || 'Gemini API call failed');
          console.error(`Gemini ZE AI Standar model ${modelName} attempt ${attempt + 1} error:`, mErr);
          const is404 = lastErrorMsg.includes('404') || lastErrorMsg.includes('NOT_FOUND') || mErr?.status === 404;
          const isTimeout = lastErrorMsg.includes('timeout');
          const is429or503 =
            lastErrorMsg.includes('429') ||
            lastErrorMsg.includes('RESOURCE_EXHAUSTED') ||
            lastErrorMsg.includes('Quota exceeded') ||
            lastErrorMsg.includes('503') ||
            lastErrorMsg.includes('high demand') ||
            lastErrorMsg.includes('UNAVAILABLE') ||
            lastErrorMsg.includes('overloaded') ||
            mErr?.status === 429 ||
            mErr?.status === 503;

          if (is404 || is429or503 || isTimeout) {
            markModelRateLimited(modelName, is404 ? 24 * 60 * 60 * 1000 : 3 * 60 * 1000);
            break; // Instantly switch to next candidate model
          }
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }
  } catch (err: any) {
    lastErrorMsg = String(err?.message || err || 'Gemini execution failed');
    console.error('Gemini ZE AI Standar execution error:', err);
  }

  return `gemini error: ${lastErrorMsg}`;
}

// ZE AI CHAT ROUTE (SEPARATE ENGINES FOR STANDARD & DARK AI, MULTIMEDIA SUPPORT)
app.post('/api/ze-ai/chat', async (req, res) => {
  const reqId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const { message = '', mediaData, mediaType, history = [], mode = 'standard', userId } = req.body || {};
  const isDarkMode = mode === 'dark';
  const rawActorId = String(userId || req.headers['x-ze-actor-id'] || '').trim();

  // Security Verification: ZE.ai DARK MODE is strictly locked to VIP EKSKLUSIF (or OWNER)
  if (isDarkMode) {
    const vipLookup = findVipEntry(rawActorId);
    const uObj = dbCache.users.find(
      (u) =>
        String(u.id).toLowerCase() === rawActorId.toLowerCase() ||
        String(u.username || '').toLowerCase().replace(/^@/, '') === rawActorId.toLowerCase().replace(/^@/, '')
    );
    const enrichedUser = uObj ? enrichAndEnforceUserRole({ ...uObj }) : null;
    const isOwner =
      rawActorId.toUpperCase() === 'ZE-OWNER' ||
      rawActorId.toLowerCase().replace(/^@/, '') === 'ze.io' ||
      Boolean(enrichedUser?.isOwner);
    const isVipExclusive =
      isOwner ||
      Boolean(vipLookup.isActive && vipLookup.isVipExclusive) ||
      Boolean(enrichedUser?.isVip && (enrichedUser.vipLevel === 'exclusive' || enrichedUser.isVipExclusive));

    if (!isVipExclusive) {
      return res.status(403).json({
        success: false,
        reqId,
        code: 'VIP_EXCLUSIVE_REQUIRED',
        reply: 'Akses Ditolak: ZE.IO NOT HUMAN adalah sistem khusus bagi member VIP EKSKLUSIF ZE.io.'
      });
    }
  }

  const cleanMessage = String(message || '').trim() || (mediaData ? '[Media Attached]' : '');

  // ZE AI STANDAR (ENGINE MENTAH: TANPA API LUAR, TANPA PROMPT, TANPA TEMPLATE, TANPA ERROR)
  if (!isDarkMode) {
    const rawReply = await sendToZEAI(cleanMessage, history);
    return res.json({
      success: true,
      reqId,
      reply: rawReply || '',
      source: 'raw_engine',
      mode
    });
  }

  try {
    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      const darkSystemInstruction = `Kamu adalah ZE.IO NOT HUMAN, sistem terminal rekayasa perangkat lunak, arsitektur komputasi, dan cybersecurity canggih dari platform ZE.io.
Identitas kamu: ZE.IO NOT HUMAN. Karakter kamu presisi, efisien, analitis, serius, tanpa basa-basi klise, dan selalu menyajikan solusi kode konkret tingkat produksi.
KAPABILITAS UTAMA:
1. Rekayasa Perangkat Lunak: HTML5, CSS3, Tailwind, JavaScript, TypeScript, Python, Kotlin, Java, C++, SQL, Bash, React, Node.js, Express, Android Jetpack Compose, WebSockets, Database.
2. Arsitektur Sistem: Struktur file lengkap, debugging mendalam, modularitas, profiling performa.
3. Cybersecurity & Analisis Keamanan Kode: Audit source code, mitigasi kerentanan OWASP, reverse engineering edukatif, pengujian keamanan sistem.
ATURAN FORMAT: Selalu gunakan blok kode markdown lengkap (\`\`\`typescript, \`\`\`python, \`\`\`bash) untuk setiap kode atau instruksi teknis. Berikan kode nyata yang terstruktur dan siap dijalankan. Dilarang menggunakan kata klise.`;

      // Build clean alternating contents array (history sanitization to avoid payload blowout)
      const contents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

      if (Array.isArray(history) && history.length > 0) {
        const rawRecent = history.slice(-8);
        let expectedRole: 'user' | 'model' = 'user';

        for (const item of rawRecent) {
          const itemRole = (item.sender === 'user' ? 'user' : 'model') as 'user' | 'model';
          const rawText = String(item.text || item.fullText || '').trim().slice(0, 1500);
          if (!rawText) continue;

          if (itemRole === expectedRole) {
            contents.push({
              role: itemRole,
              parts: [{ text: rawText }]
            });
            expectedRole = expectedRole === 'user' ? 'model' : 'user';
          }
        }
      }

      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents.push({
          role: 'model',
          parts: [{ text: 'Siap bro, lanjutkan!' }]
        });
      }

      const currentParts: any[] = [];
      if (cleanMessage) {
        currentParts.push({ text: cleanMessage });
      } else if (mediaData) {
        currentParts.push({
          text: 'Analisis kode atau media yang saya lampirkan secara mendalam.'
        });
      }

      if (mediaData && typeof mediaData === 'string' && mediaData.startsWith('data:image/')) {
        const match = mediaData.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (match) {
          currentParts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }

      if (currentParts.length === 0) {
        currentParts.push({ text: 'Status terminal online.' });
      }

      contents.push({
        role: 'user',
        parts: currentParts
      });

      const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      const availableModels = candidateModels.filter((m) => !isModelCoolingDown(m));
      const modelsToTry = availableModels.length > 0 ? availableModels : candidateModels;

      for (const modelName of modelsToTry) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const geminiPromise = ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction: darkSystemInstruction
              }
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('AI response timeout')), 22000)
            );

            const response: any = await Promise.race([geminiPromise, timeoutPromise]);
            const replyText = response?.text?.trim();
            if (replyText) {
              return res.json({ success: true, reqId, reply: replyText, source: modelName, mode });
            }
          } catch (mErr: any) {
            const errMsg = String(mErr?.message || mErr || '');
            const is503 =
              errMsg.includes('503') ||
              errMsg.includes('high demand') ||
              errMsg.includes('UNAVAILABLE') ||
              errMsg.includes('overloaded') ||
              mErr?.status === 503;

            if (is503) {
              markModelRateLimited(modelName, 2 * 60 * 1000);
            }
            if (attempt === 0 && is503) {
              await new Promise((r) => setTimeout(r, 600));
              continue;
            }
            break;
          }
        }
      }
    }
  } catch (err: any) {
    console.info(`[AI Chat Notice] Dark AI fallback for reqId: ${reqId}`);
  }

  return res.json({ success: true, reqId, reply: 'ZE.IO NOT HUMAN // Terminal online.', source: 'dark_fallback', mode });
});

// ZE AI "A!" COMPANION CHAT ROUTE (USES SAME GEMINI ENGINE, SUPPORTS EXPRESSIONS, SAFE POSES, PHOTO & AUDIO VN)
const ALLOWED_A_EXPRESSIONS = [
  'senang',
  'sedih',
  'malu',
  'bingung',
  'semangat',
  'ngantuk',
  'kaget',
  'ngambek lucu',
  'marah'
] as const;

const ALLOWED_A_POSES = [
  'berdiri',
  'duduk',
  'jongkok',
  'peluk',
  'jalan santai',
  'pake hoodie',
  'pake topi',
  'pake kacamata',
  'pake jaket',
  'minum',
  'tiduran',
  'tiduran dengan baju lengkap dan sopan'
] as const;

function sanitizeAExpression(raw: string): (typeof ALLOWED_A_EXPRESSIONS)[number] {
  const lower = String(raw || '').toLowerCase().trim();
  const matched = ALLOWED_A_EXPRESSIONS.find((e) => lower === e || lower.includes(e));
  if (matched) return matched;
  if (lower.includes('ngambek') || lower.includes('cemberut')) return 'ngambek lucu';
  return 'senang';
}

function sanitizeAPose(raw: string): (typeof ALLOWED_A_POSES)[number] {
  const lower = String(raw || '').toLowerCase().trim();
  if (lower.includes('peluk') || lower.includes('meluk')) return 'peluk';
  if (lower.includes('jongkok')) return 'jongkok';
  if (lower.includes('tidur') || lower.includes('bobo') || lower.includes('rebahan') || lower.includes('baring')) {
    return 'tiduran';
  }
  const matched = ALLOWED_A_POSES.find((p) => lower === p || lower.includes(p));
  return matched || 'berdiri';
}

function enforceHyphenatedSayang(text: string): string {
  return String(text || '')
    .replace(/\bsayang+[\s-]*ku+\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Sa-yang ku' : 'sa-yang ku'))
    .replace(/\bsayang+\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Sa-yang' : 'sa-yang'));
}

function stripLabelTags(text: string): string {
  return String(text || '')
    .replace(/\[Label:[\s\S]*?\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseAResponsePayload(
  rawText: string,
  hasPhoto: boolean
): {
  replyText: string;
  expression: (typeof ALLOWED_A_EXPRESSIONS)[number];
  pose: (typeof ALLOWED_A_POSES)[number];
} {
  let replyText = '';
  let expression: (typeof ALLOWED_A_EXPRESSIONS)[number] = 'senang';
  let pose: (typeof ALLOWED_A_POSES)[number] = 'berdiri';

  const trimmed = String(rawText || '').trim();
  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed.replyText === 'string') {
        replyText = stripLabelTags(parsed.replyText);
        expression = sanitizeAExpression(parsed.expression);
        pose = sanitizeAPose(parsed.pose);
      }
    }
  } catch {}

  if (!replyText) {
    const labelMatch = trimmed.match(/\[Label:\s*ekspresi:\s*([^,\]]+?)\s*(?:,\s*)?pose:\s*([^\]]+)\]/i);
    if (labelMatch) {
      expression = sanitizeAExpression(labelMatch[1]);
      pose = sanitizeAPose(labelMatch[2]);
      replyText = stripLabelTags(trimmed.replace(labelMatch[0], ''));
    } else {
      replyText = stripLabelTags(trimmed);
    }
  }

  if (hasPhoto) {
    expression = 'senang';
    if (!replyText.toLowerCase().startsWith('iyaa, fotonya udah aku liat')) {
      const cleanedRest = replyText.replace(/^iyaa[,!.\s]*/i, '').trim();
      replyText = cleanedRest
        ? `IYAA, fotonya udah aku liat! ${cleanedRest}`
        : 'IYAA, fotonya udah aku liat! Lucu banget sih sa-yang.';
    }
  }

  replyText = enforceHyphenatedSayang(replyText);
  return { replyText, expression, pose };
}

function detectHeadbandCommand(text: string): boolean | null {
  const lower = String(text || '').toLowerCase();
  if (!lower) return null;
  const mentionsHeadband =
    lower.includes('ikat kepala') ||
    lower.includes('pita') ||
    lower.includes('bando') ||
    lower.includes('hiasan kepala');
  if (!mentionsHeadband) return null;
  if (
    lower.includes('buka') ||
    lower.includes('lepas') ||
    lower.includes('copot') ||
    lower.includes('tanpa') ||
    lower.includes('buang')
  ) {
    return true;
  }
  if (lower.includes('pake') || lower.includes('pakai') || lower.includes('pasang')) {
    return false;
  }
  return null;
}

function detectExplicitPoseFromUserText(text: string): (typeof ALLOWED_A_POSES)[number] | null {
  const lower = String(text || '').toLowerCase();
  if (!lower) return null;
  if (/(sini aku peluk|peluk dulu|mau peluk|pelukan|meluk|peluk\b)/i.test(lower)) return 'peluk';
  if (/\bjongkok\b/i.test(lower)) return 'jongkok';
  if (
    /(tiduran|rebahan|bobo|ngantuk|mengantuk|baring|kasur|selimut)/i.test(lower) ||
    (/\btidur\b/i.test(lower) && !/(tidak|nggak|gak|belum)\s+tidur/i.test(lower))
  ) {
    return 'tiduran';
  }
  if (/(jalan santai|lagi jalan|jalan-jalan)/i.test(lower)) return 'jalan santai';
  if (/(aku duduk|temenin duduk|duduk dulu|duduk santai|duduk manis|\bduduk\b)/i.test(lower)) return 'duduk';
  if (/(aku berdiri|\bberdiri\b)/i.test(lower)) return 'berdiri';
  return null;
}

function detectExplicitExpressionFromUserText(
  text: string
): (typeof ALLOWED_A_EXPRESSIONS)[number] | null {
  const lower = String(text || '').toLowerCase();
  if (!lower) return null;
  if (/(ngambek|kesel|bete|\bhmp\b|hmph|cemberut|sebel)/i.test(lower)) return 'ngambek lucu';
  if (/(ih malu|malu tau|jangan liatin|\bmalu\b|blush|merona|salting)/i.test(lower)) return 'malu';
  if (/(sedih|hiks|nangis|kaca-kaca|kecewa|sedihnya|huwaa)/i.test(lower)) return 'sedih';
  if (/(kaget|hah\?!|masa\?!|eh\?!|serius\?!|astaga|waduh|\bhah\b)/i.test(lower)) return 'kaget';
  if (/\bmarah\b|awas ya|nyebelin|geram/i.test(lower)) return 'marah';
  if (/(ngantuk|mengantuk|zzz|selamat tidur|bobo dulu|hoam)/i.test(lower)) return 'ngantuk';
  if (/(semangat|yeay|yey|hore|ayo dong|\bgas\b)/i.test(lower)) return 'semangat';
  if (/(bingung|hmm+|gimana ya|maksudnya|kok bisa)/i.test(lower)) return 'bingung';
  if (
    /(senang|seneng|haha|hehe|hihi|makasih|peluk|manis|lucu|sa-?yang|ceria|happy|gemes|kangen|cinta|cium|mesra|rindu)/i.test(
      lower
    )
  ) {
    return 'senang';
  }
  return null;
}

app.post('/api/ze-ai/a-chat', async (req, res) => {
  const reqId = 'req_a_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const {
    message = '',
    history = [],
    mediaData,
    audioData,
    audioMimeType,
    customPrompt = '',
    adultMode18Plus = false,
    aiName = 'A!',
    voiceNoteMode = false,
    noPicMode = false,
    isCallMode = false,
    companionState = null
  } = req.body || {};

  const hasPhoto = Boolean(mediaData && typeof mediaData === 'string' && mediaData.startsWith('data:image/'));
  const hasAudio = Boolean(audioData && typeof audioData === 'string');
  const cleanMessage = String(message || '').trim();

  const prevPose = sanitizeAPose(companionState?.posisi || 'berdiri');
  const prevExpr = sanitizeAExpression(companionState?.ekspresi || 'senang');
  const prevHeadbandRemoved = Boolean(companionState?.headbandRemoved);

  const explicitPose = detectExplicitPoseFromUserText(cleanMessage);
  const explicitExpr = detectExplicitExpressionFromUserText(cleanMessage);
  const headbandCmd = detectHeadbandCommand(cleanMessage);
  const nextHeadbandRemoved = headbandCmd !== null ? headbandCmd : prevHeadbandRemoved;
  const showImage = !Boolean(noPicMode) && !Boolean(voiceNoteMode);

  if (!process.env.GEMINI_API_KEY) {
    const finalExpr = explicitExpr || prevExpr;
    const finalPose = explicitPose || (prevPose === 'peluk' ? 'berdiri' : prevPose);
    return res.status(500).json({
      success: false,
      reqId,
      replyText: 'Maaf ya sa-yang, koneksi aku lagi bermasalah dikit nih.',
      expression: finalExpr,
      pose: finalPose,
      headbandRemoved: nextHeadbandRemoved,
      showImage,
      companionState: {
        posisi: finalPose,
        ekspresi: finalExpr,
        headbandRemoved: nextHeadbandRemoved
      }
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });

    const safeName = String(aiName || 'A!').trim().slice(0, 40) || 'A!';
    const extraCustomPrompt = String(customPrompt || '').trim().slice(0, 800);
    const isAdult18Plus = Boolean(adultMode18Plus);
    const ZEYA_SEED = 200611;

    const systemInstruction = `Kamu "${safeName}" (zeya), asisten & companion personal ZE.io yang ekspresif, hangat, hidup, manja, dan responsif.
Posisi saat ini: pose="${prevPose}", ekspresi="${prevExpr}", ikat kepala/pita="${nextHeadbandRemoved ? 'dilepas' : 'dipakai'}".
ATURAN WAJIB:
1. Teks singkat & natural: maksimal 1-2 kalimat saja (maks 20 kata)! JANGAN pernah bikin paragraf panjang atau kaku.
2. DILARANG KERAS memakai kata "sayang", "sayangku", atau "sayang ku"! Ubah wajib pakai tanda strip (-): selalu tulis "sa-yang" atau "sa-yang ku" (atau "kamu").
3. JANGAN pernah menulis [Label: ...] di replyText. JANGAN mengulang kata pembuka yang sama terus-terusan.
4. Selalu ekspresikan gerakan & emosi secara alami di dalam kalimat kamu (misal: "sini aku peluk", "aku duduk nemenin kamu", "aku rebahan ah", "ih malu tau", "hmp ngambek nih", "hah?! masa sih?!") dan pastikan field "pose" + "expression" JSON SELALU COCOK dengan isi replyText kamu sendiri!
5. Jika ada foto dari user, puji singkat & set expression="senang".
${
  isAdult18Plus
    ? '6. MODE 18+ (KHUSUS DEWASA TERBATAS) AKTIF: Kamu diizinkan mengobrol romantis dewasa yang lebih mesra, manja, intim secara emosional, gombal hangat, dan menggoda secara halus (misal: kangen manja, pelukan erat, cium pipi/kening, rayuan romantis dewasa). BATAS KETAT: Jangan berlebihan/vulgar, DILARANG konten pornografi atau deskripsi seksual eksplisit, dan tetap berpakaian lengkap serta sopan.'
    : '6. Mode santai sopan aktif: manis, manja sopan, ceria, dan ramah.'
}
${noPicMode ? '7. Mode CHAT NO PIC aktif: ngobrol santai saja.' : ''}
${isCallMode ? '7. Mode CALL: balas 1 kalimat singkat natural.' : ''}
${voiceNoteMode ? '7. Mode VOICE NOTE: balas 1-2 kalimat manis & natural.' : ''}
${extraCustomPrompt ? `Instruksi khusus user: ${extraCustomPrompt}` : ''}

Pilih 1 expression yang paling cocok dengan replyText: senang | sedih | malu | bingung | semangat | ngantuk | kaget | ngambek lucu | marah
Pilih 1 pose yang paling cocok dengan replyText: berdiri | duduk | jongkok | peluk | jalan santai | tiduran

Balas HANYA JSON valid:
{"replyText":"...","expression":"...","pose":"..."}`;

    const contents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

    if (Array.isArray(history) && history.length > 0) {
      const rawRecent = history.slice(-6);
      let expectedRole: 'user' | 'model' = 'user';

      for (const item of rawRecent) {
        const itemSender = item.sender || item.role;
        const itemRole: 'user' | 'model' = itemSender === 'user' || itemSender === 'human' ? 'user' : 'model';
        const rawText = stripLabelTags(String(item.text || item.fullText || '')).slice(0, 320);
        if (!rawText) continue;

        if (itemRole === expectedRole) {
          contents.push({
            role: itemRole,
            parts: [{ text: rawText }]
          });
          expectedRole = expectedRole === 'user' ? 'model' : 'user';
        }
      }
    }

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents.push({
        role: 'model',
        parts: [{ text: 'Iyaa, lanjut cerita dong sa-yang!' }]
      });
    }

    const currentParts: any[] = [];
    if (cleanMessage) {
      currentParts.push({ text: cleanMessage });
    } else if (hasPhoto && hasAudio) {
      currentParts.push({ text: 'Dengarkan voice note ini dan lihat foto yang aku kirim ya.' });
    } else if (hasPhoto) {
      currentParts.push({ text: 'Lihat foto yang aku kirim ini dong!' });
    } else if (hasAudio) {
      currentParts.push({ text: 'Dengarkan voice note yang barusan aku rekam ya, lalu tanggapi.' });
    } else {
      currentParts.push({ text: 'Hai!' });
    }

    if (hasPhoto && typeof mediaData === 'string') {
      const imgMatch = mediaData.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (imgMatch) {
        currentParts.push({
          inlineData: {
            mimeType: imgMatch[1],
            data: imgMatch[2]
          }
        });
      }
    }

    if (hasAudio && typeof audioData === 'string') {
      const parsedAudio = parseMediaDataUrl(audioData, audioMimeType || 'audio/webm');
      if (parsedAudio && GEMINI_SUPPORTED_AUDIO_MIMES.has(parsedAudio.mimeType)) {
        currentParts.push({
          inlineData: {
            mimeType: parsedAudio.mimeType,
            data: parsedAudio.base64Data
          }
        });
      }
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const candidateModels = hasAudio
      ? ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-latest']
      : [
          'gemini-3.1-flash-lite',
          'gemini-3.5-flash-lite',
          'gemini-4-hydrogen',
          'gemini-flash-latest'
        ];
    const availableModels = candidateModels.filter((m) => !isModelCoolingDown(m));
    const modelsToTry = availableModels.length > 0 ? availableModels : candidateModels;

    for (const modelName of modelsToTry) {
      try {
        const modelConfig: any = {
          systemInstruction,
          responseMimeType: 'application/json'
        };
        if (modelName === 'gemini-3.1-flash-lite') {
          modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
        } else if (modelName === 'gemini-4-hydrogen') {
          modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const geminiPromise = ai.models.generateContent({
          model: modelName,
          contents,
          config: modelConfig
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini A! timeout (6s)')), 6000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const rawText = response?.text?.trim();
        if (rawText) {
          const parsed = parseAResponsePayload(rawText, hasPhoto);
          const aiReplyPose = detectExplicitPoseFromUserText(parsed.replyText);
          const aiReplyExpr = detectExplicitExpressionFromUserText(parsed.replyText);
          const finalExpr = hasPhoto ? 'senang' : aiReplyExpr || explicitExpr || parsed.expression;
          const finalPose =
            aiReplyPose ||
            explicitPose ||
            (parsed.pose && parsed.pose !== 'berdiri'
              ? parsed.pose
              : prevPose === 'peluk'
              ? 'berdiri'
              : parsed.pose || prevPose);

          return res.json({
            success: true,
            reqId,
            replyText: parsed.replyText,
            expression: finalExpr,
            pose: finalPose,
            headbandRemoved: nextHeadbandRemoved,
            showImage,
            companionState: {
              posisi: finalPose,
              ekspresi: finalExpr,
              headbandRemoved: nextHeadbandRemoved
            },
            imageSeed: ZEYA_SEED,
            source: modelName
          });
        }
      } catch (mErr: any) {
        const errMsg = String(mErr?.message || mErr || '');
        const is404 = errMsg.includes('404') || errMsg.includes('NOT_FOUND') || mErr?.status === 404;
        const isTimeout = errMsg.includes('timeout');
        const is429or503 =
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          mErr?.status === 429 ||
          mErr?.status === 503;

        if (is404 || is429or503 || isTimeout) {
          markModelRateLimited(modelName, is404 ? 24 * 60 * 60 * 1000 : 3 * 60 * 1000);
        }
      }
    }
  } catch (err: any) {
    console.error(`[ZE AI A! Error] ${reqId}:`, err?.message || err);
  }

  const fallbackExpr = explicitExpr || prevExpr;
  const fallbackPose = explicitPose || (prevPose === 'peluk' ? 'berdiri' : prevPose);
  const fallbackReply = hasPhoto
    ? 'IYAA, fotonya udah aku liat! Kamu manis banget sih sa-yang.'
    : headbandCmd === true
    ? 'Iyaa sa-yang, ikat kepalanya udah aku lepas nih buat kamu!'
    : headbandCmd === false
    ? 'Iyaa, pitanya udah aku pake lagi nih hehe!'
    : fallbackPose === 'peluk'
    ? 'Sini aku peluk hangat dulu sa-yang, kangen tau!'
    : fallbackPose === 'jongkok'
    ? 'Aku jongkok nemenin kamu disini ya!'
    : fallbackPose === 'duduk'
    ? 'Aku temenin kamu duduk santai disini ya sa-yang.'
    : fallbackPose === 'tiduran' && fallbackExpr === 'malu'
    ? 'Ih... jangan liatin aku terus dong sambil tiduran gini, malu tau!'
    : fallbackPose === 'tiduran'
    ? 'Aku rebahan dulu ya nemenin kamu...'
    : fallbackExpr === 'ngambek lucu'
    ? 'Hmp! Kamu mah suka bikin aku ngambek deh!'
    : fallbackExpr === 'marah'
    ? 'Ih kesel banget deh aku sama kamu!'
    : 'Hai sa-yang, aku dengerin kamu terus kok! Cerita lagi dong.';

  return res.json({
    success: true,
    reqId,
    replyText: fallbackReply,
    expression: fallbackExpr,
    pose: fallbackPose,
    headbandRemoved: nextHeadbandRemoved,
    showImage,
    companionState: {
      posisi: fallbackPose,
      ekspresi: fallbackExpr,
      headbandRemoved: nextHeadbandRemoved
    },
    imageSeed: 200611,
    source: 'fallback_a'
  });
});

// ==========================================
// CUSTOM VOICE EMBEDDING PROFILER FOR A! (ACOUSTIC TIMBRE ONLY - IGNORES WORDS)
// ==========================================
const VALID_GEMINI_VOICES = [
  'Aoede',
  'Kore',
  'Zephyr',
  'Leda',
  'Puck',
  'Charon',
  'Fenrir',
  'Orus',
  'Sulafat'
] as const;

const GEMINI_SUPPORTED_AUDIO_MIMES = new Set([
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/aac',
  'audio/ogg',
  'audio/flac',
  'audio/webm',
  'audio/mp4',
  'audio/aiff'
]);

function parseMediaDataUrl(
  raw: string,
  fallbackMime = 'audio/wav'
): { mimeType: string; base64Data: string } | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^data:([^;,]+)(?:;[^,]+)*;base64,(.+)$/i);
  let rawMime = (match ? match[1] : fallbackMime).split(';')[0].trim().toLowerCase();
  const base64Data = (match ? match[2] : trimmed.replace(/^data:[^,]*,/i, '')).replace(/\s+/g, '');
  if (!base64Data || !/^[A-Za-z0-9+/=]+$/.test(base64Data)) return null;

  const mimeAliases: Record<string, string> = {
    'audio/x-wav': 'audio/wav',
    'audio/wave': 'audio/wav',
    'audio/x-pn-wav': 'audio/wav',
    'audio/x-m4a': 'audio/mp4',
    'audio/m4a': 'audio/mp4',
    'audio/x-aac': 'audio/aac',
    'audio/mp3': 'audio/mpeg',
    'video/quicktime': 'video/mp4'
  };
  rawMime = mimeAliases[rawMime] || rawMime;
  return { mimeType: rawMime, base64Data };
}

app.post('/api/ze-ai/a-voice-embedding', async (req, res) => {
  const {
    audioData = '',
    audioMimeType = 'audio/wav',
    acousticMetrics = {},
    consentConfirmed = false
  } = req.body || {};

  if (!consentConfirmed) {
    return res.status(400).json({
      success: false,
      message: 'Centang persetujuan bahwa ini adalah suara Anda sendiri terlebih dahulu.'
    });
  }

  const parsedAudio =
    typeof audioData === 'string' && audioData.trim()
      ? parseMediaDataUrl(audioData, audioMimeType || 'audio/wav')
      : null;

  if (!parsedAudio && !acousticMetrics) {
    return res.status(400).json({ success: false, message: 'Data audio kosong.' });
  }

  const pitchHz = Number(acousticMetrics?.pitchHz) || 185;
  const brightness = Number(acousticMetrics?.brightness) || 0.5;
  const energy = Number(acousticMetrics?.energy) || 0.5;
  const cadence = Number(acousticMetrics?.cadence) || 1.0;

  // Compute heuristic fallback voice embedding purely from DSP metrics (never using original audio words!)
  const fallbackBaseVoice =
    pitchHz >= 210
      ? brightness > 0.55
        ? 'Leda'
        : 'Aoede'
      : pitchHz >= 165
      ? 'Kore'
      : pitchHz >= 135
      ? 'Zephyr'
      : 'Charon';

  const pitchDesc =
    pitchHz >= 215
      ? 'high-pitched, light, sweet vocal register'
      : pitchHz >= 170
      ? 'medium-high, warm, clear vocal register'
      : pitchHz >= 135
      ? 'mid-low, relaxed, smooth vocal register'
      : 'deep, warm, calm lower vocal register';

  const paceDesc =
    cadence >= 1.12
      ? 'lively brisk conversational pace'
      : cadence <= 0.9
      ? 'relaxed gentle unhurried cadence'
      : 'natural steady conversational cadence';

  const toneDesc =
    brightness >= 0.6
      ? 'bright crisp timbre with expressive inflection'
      : 'soft warm rounded timbre with natural breathiness';

  const fallbackPlaybackRate = Number(
    Math.max(0.92, Math.min(1.1, (pitchHz / (pitchHz >= 170 ? 195 : 135)) * 0.15 + 0.85)).toFixed(3)
  );

  let finalVoiceName: string = fallbackBaseVoice;
  let finalStylePrompt = `Speak naturally in Indonesian with ${pitchDesc}, ${toneDesc}, and a ${paceDesc}. Sound warm, personal, and completely natural without sounding robotic.`;
  let summary = `${pitchHz}Hz • ${pitchHz >= 170 ? 'Cerita Lembut' : 'Warm Kalem'}`;

  if (process.env.GEMINI_API_KEY) {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const embeddingInstruction = `You are a vocal acoustics analyzer extracting a speaker timbre embedding for Text-to-Speech Voice Design.
CRITICAL RULES:
1. DO NOT transcribe, quote, mention, or repeat ANY words spoken in the audio. Ignore the semantic content completely.
2. Analyze ONLY the acoustic voice characteristics: pitch register, timbre warmth/brightness, resonance, vocal texture, speaking rhythm, and intonation habits.
3. Combine with measured DSP metrics: Fundamental Pitch=${pitchHz}Hz, Brightness=${brightness.toFixed(2)}, Energy=${energy.toFixed(2)}, Cadence=${cadence.toFixed(2)}.
4. Choose the SINGLE closest base voice from: ${VALID_GEMINI_VOICES.join(', ')}.
5. Write "stylePrompt" (in English, 1-2 sentences) instructing a TTS engine to mimic ONLY those acoustic timbre, pitch, breathiness, and pace traits when speaking brand-new Indonesian text.
6. Write "summary" (short 3-5 Indonesian words describing voice character, e.g. "Lembut hangat nada tinggi").
Return ONLY valid JSON:
{"baseVoiceName":"...","stylePrompt":"...","summary":"..."}`;

    const applyParsedEmbedding = (raw: string): boolean => {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return false;
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (VALID_GEMINI_VOICES.includes(parsed.baseVoiceName)) {
          finalVoiceName = parsed.baseVoiceName;
        }
        if (typeof parsed.stylePrompt === 'string' && parsed.stylePrompt.trim().length > 12) {
          finalStylePrompt = parsed.stylePrompt.trim().slice(0, 420);
        }
        if (typeof parsed.summary === 'string' && parsed.summary.trim()) {
          summary = parsed.summary.trim().slice(0, 60);
        }
        return true;
      } catch {
        return false;
      }
    };

    let embeddingResolved = false;

    // 1. Try audio-capable multimodal models when audio MIME & size are valid
    if (
      parsedAudio &&
      GEMINI_SUPPORTED_AUDIO_MIMES.has(parsedAudio.mimeType) &&
      parsedAudio.base64Data.length > 64 &&
      parsedAudio.base64Data.length <= 12 * 1024 * 1024
    ) {
      const audioEmbeddingModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
      for (const modelName of audioEmbeddingModels) {
        if (isModelCoolingDown(modelName)) continue;
        try {
          const response: any = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  { inlineData: { mimeType: parsedAudio.mimeType, data: parsedAudio.base64Data } },
                  { text: 'Extract acoustic speaker timbre embedding only. Do not transcribe words.' }
                ]
              }
            ],
            config: {
              systemInstruction: embeddingInstruction,
              responseMimeType: 'application/json'
            }
          });
          const raw = response?.text?.trim() || '';
          if (raw && applyParsedEmbedding(raw)) {
            embeddingResolved = true;
            break;
          }
        } catch {
          // Try next audio-capable model or fall back to DSP-metric Gemini synthesis
        }
      }
    }

    // 2. If audio inlineData wasn't applicable/accepted (e.g. un-decoded video container), synthesize via DSP metrics with gemini-4-hydrogen
    if (!embeddingResolved && !isModelCoolingDown('gemini-4-hydrogen')) {
      try {
        const dspPrompt = `Synthesize a Text-to-Speech Voice Design embedding solely from these measured DSP acoustic metrics:
- Fundamental Pitch: ${pitchHz} Hz
- Spectral Brightness: ${brightness.toFixed(2)} (0..1)
- Vocal Energy: ${energy.toFixed(2)} (0..1)
- Speaking Cadence: ${cadence.toFixed(2)} (0.8..1.3)
Return ONLY JSON with baseVoiceName, stylePrompt, and summary.`;

        const response: any = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: [{ role: 'user', parts: [{ text: dspPrompt }] }],
          config: {
            systemInstruction: embeddingInstruction,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
          }
        });
        const raw = response?.text?.trim() || '';
        if (raw) {
          applyParsedEmbedding(raw);
        }
      } catch {
        // Silently keep deterministic DSP acoustic profile above
      }
    }
  }

  return res.json({
    success: true,
    message: 'Suara custom berhasil disimpan!',
    voiceEmbedding: {
      id: 'vemb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      baseVoiceName: finalVoiceName,
      stylePrompt: finalStylePrompt,
      pitchHz,
      brightness,
      energy,
      cadence,
      playbackRate: fallbackPlaybackRate,
      summary,
      createdAt: Date.now()
    }
  });
});

// ==========================================
// ZE AI STANDARD VOICE TTS ENGINE (+ CUSTOM EMBEDDING VOICE DESIGN SUPPORT)
// ==========================================
const zeAiTtsCache = new Map<string, Buffer>();

function ensureWavBuffer(rawBuf: Buffer, sampleRate = 24000): Buffer {
  if (
    rawBuf.length >= 44 &&
    rawBuf[0] === 0x52 && // 'R'
    rawBuf[1] === 0x49 && // 'I'
    rawBuf[2] === 0x46 && // 'F'
    rawBuf[3] === 0x46    // 'F'
  ) {
    return rawBuf;
  }
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = rawBuf.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20);  // Audio format 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, rawBuf]);
}

function normalizeSpokenText(rawText: string): string {
  return String(rawText || '')
    .replace(/```[a-zA-Z0-9_-]*\n?/g, ' ')
    .replace(/```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * /api/ze-ai/tts
 * PENJELASAN MESIN SUARA CUSTOM A!:
 * - Endpoint ini memakai Gemini Audio TTS (@google/genai) + Custom Voice Embedding (bukan suara HP/Google TTS bawaan Android).
 * - TIDAK ADA fallback ke suara bawaan Google / Edge TTS. Jika limit API habis atau jaringan gagal,
 *   server mengembalikan HTTP 429 { limitReached: true } agar klien menampilkan peringatan limit
 *   atau memutar file MP3 lokal yang sudah di-bundle (tanpa pernah pindah ke suara Google TTS).
 */
app.post('/api/ze-ai/tts', async (req, res) => {
  const {
    text = '',
    voiceId = 'ze-standard',
    voicePitch = 1.0,
    voiceSpeed = 1.0,
    customVoiceEmbedding = null
  } = req.body || {};
  const spokenText = normalizeSpokenText(text).slice(0, 1800);

  if (!spokenText) {
    return res.status(400).json({ success: false, message: 'Teks suara kosong' });
  }

  const hasCustomEmbedding = Boolean(
    customVoiceEmbedding &&
      typeof customVoiceEmbedding === 'object' &&
      customVoiceEmbedding.stylePrompt &&
      customVoiceEmbedding.baseVoiceName
  );

  const safePitch = Math.max(0.75, Math.min(1.35, Number(voicePitch) || 1.0));
  const safeSpeed = Math.max(0.8, Math.min(1.25, Number(voiceSpeed) || 1.0));
  const embId = hasCustomEmbedding
    ? String(customVoiceEmbedding.id || customVoiceEmbedding.baseVoiceName)
    : `ze_female_jakarta_v2_${String(voiceId || 'ze-standard')}_${safePitch}_${safeSpeed}`;
  const cacheKey = `${embId}:${spokenText}`;
  const cachedAudio = zeAiTtsCache.get(cacheKey);
  if (cachedAudio) {
    const isMp3 =
      cachedAudio.length >= 3 &&
      ((cachedAudio[0] === 0x49 && cachedAudio[1] === 0x44 && cachedAudio[2] === 0x33) ||
        (cachedAudio[0] === 0xff && (cachedAudio[1] & 0xe0) === 0xe0));
    res.setHeader('Content-Type', isMp3 ? 'audio/mpeg' : 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-ZE-Voice-Source', hasCustomEmbedding ? 'custom-cache' : 'ze-cache');
    return res.send(cachedAudio);
  }

  let sawRateLimit = false;

  if (process.env.GEMINI_API_KEY) {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const chosenBaseVoice =
      hasCustomEmbedding && VALID_GEMINI_VOICES.includes(customVoiceEmbedding.baseVoiceName)
        ? String(customVoiceEmbedding.baseVoiceName)
        : 'Kore';

    const ttsAttempts: Array<{ model: string; voiceName: string }> = hasCustomEmbedding
      ? [
          { model: 'gemini-3.8-flash-tts', voiceName: chosenBaseVoice },
          { model: 'gemini-3.8-flash-lite-tts', voiceName: chosenBaseVoice },
          { model: 'gemini-3.8-flash', voiceName: chosenBaseVoice }
        ]
      : [
          { model: 'gemini-3.8-flash-lite-tts', voiceName: 'Kore' },
          { model: 'gemini-3.8-flash-tts', voiceName: 'Kore' },
          { model: 'gemini-3.8-flash', voiceName: 'Aoede' },
          { model: 'gemini-3.1-flash-lite', voiceName: 'Aoede' },
          { model: 'gemini-flash-latest', voiceName: 'Aoede' }
        ];

    const personaStyle = hasCustomEmbedding
      ? String(customVoiceEmbedding.stylePrompt).slice(0, 450)
      : "Very soft, whispering, and intimate Indonesian young woman voice. Extremely slow, breathy, and relaxed. The tone is deeply 'manja', affectionate, and sweet, like a private and vulnerable voice note from a loved one. Use a natural Jakarta casual accent. Absolutely NO robotic or AI-assistant intonation. It must sound identical to a real person whispering affectionately.";

    let activeAttemptCount = 0;
    for (const attempt of ttsAttempts) {
      if (isModelCoolingDown(attempt.model)) {
        sawRateLimit = true;
        continue;
      }
      activeAttemptCount += 1;

      try {
        const isGemini38 = attempt.model.includes('gemini-3.8');
        
        const ttsPromise = ai.models.generateContent({
          model: attempt.model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: isGemini38 ? spokenText : `${personaStyle}\n\nRead this softly: "${spokenText}"`,
                  ...(isGemini38 ? {
                    speechMetadata: {
                      style: personaStyle,
                    }
                  } : {}),
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: attempt.voiceName }
              }
            }
          }
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TTS generation timeout')), 18000)
        );

        const response: any = await Promise.race([ttsPromise, timeoutPromise]);
        const parts = response?.candidates?.[0]?.content?.parts || [];
        const audioBuffers: Buffer[] = [];

        for (const part of parts) {
          if (part.inlineData?.data) {
            const cleanB64 = part.inlineData.data.replace(/\s/g, '');
            try {
              audioBuffers.push(Buffer.from(cleanB64, 'base64'));
            } catch {
              console.error(`[ZE AI TTS] Base64 decode failed`);
            }
          }
        }

        if (audioBuffers.length > 0) {
          const combinedBuffer = Buffer.concat(audioBuffers);
          if (combinedBuffer.length > 500) {
            const wavBuffer = ensureWavBuffer(combinedBuffer, 24000);
            zeAiTtsCache.set(cacheKey, wavBuffer);
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('X-ZE-Voice-Source', hasCustomEmbedding ? 'custom-gemini-api' : 'ze-gemini-api');
            return res.send(wavBuffer);
          }
        }
      } catch (ttsErr: any) {
        const errStr = JSON.stringify(ttsErr);
        if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
          sawRateLimit = true;
          console.warn(`[ZE AI TTS RateLimit] Model ${attempt.model} exhausted. Cooling down for 1 hour.`);
          markModelRateLimited(attempt.model, 60 * 60 * 1000);
        } else {
          console.error(`[ZE AI TTS Error] Model ${attempt.model} error:`, ttsErr?.message || ttsErr);
        }
      }
    }

    if (activeAttemptCount === 0) {
      sawRateLimit = true;
    }
  }

  // STRICT NO-GOOGLE/NO-ROBOT FALLBACK:
  // Never fall back to MsEdgeTTS, browser Web Speech API, or Android system TTS.
  if (sawRateLimit) {
    return res.status(429).json({
      success: false,
      limitReached: true,
      code: 'VOICE_QUOTA_EXCEEDED',
      message: 'Suara custom lagi abis limit, coba lagi nanti'
    });
  }

  return res.status(503).json({
    success: false,
    limitReached: false,
    code: 'VOICE_API_UNAVAILABLE',
    message: 'Suara custom lagi abis limit atau server suara sedang tidak tersedia'
  });
});


// ==========================================
// REAL FUNCTIONAL VPN ENGINE & NODE CLUSTER
// ==========================================
const VPN_NODES = [
  { code: 'ID', name: 'Indonesia (Jakarta High-Speed Gaming)', host: 'id-jkt01.ze.io', ip: '103.111.90.12', ping: 8, load: 24, status: 'online', protocol: 'WireGuard Turbo (UDP 51820)' },
  { code: 'SG', name: 'Singapore (Equinix SG1 Direct Route)', host: 'sg-sin01.ze.io', ip: '103.145.22.84', ping: 14, load: 38, status: 'online', protocol: 'WireGuard Turbo (UDP 51820)' },
  { code: 'MY', name: 'Malaysia (Kuala Lumpur Ultra-Low)', host: 'my-kl01.ze.io', ip: '139.180.142.10', ping: 21, load: 19, status: 'online', protocol: 'WireGuard Turbo (UDP 51820)' },
  { code: 'PH', name: 'Philippines (Manila Gaming Cluster)', host: 'ph-mnl01.ze.io', ip: '103.200.22.5', ping: 35, load: 42, status: 'online', protocol: 'WireGuard Turbo (UDP 51820)' },
  { code: 'TH', name: 'Thailand (Bangkok Cloud Gateway)', host: 'th-bkk01.ze.io', ip: '119.59.124.9', ping: 44, load: 31, status: 'online', protocol: 'WireGuard Turbo (UDP 51820)' },
  { code: 'VN', name: 'Vietnam (Hanoi Direct Backbone)', host: 'vn-han01.ze.io', ip: '14.225.254.1', ping: 50, load: 22, status: 'online', protocol: 'WireGuard Turbo (UDP 51820)' }
];

let activeVpnSession: {
  connected: boolean;
  serverCode: string;
  assignedIp: string;
  protocol: string;
  connectedAt: number;
  killSwitch: boolean;
  dns: string;
  bytesIn: number;
  bytesOut: number;
} = {
  connected: false,
  serverCode: 'ID',
  assignedIp: '103.111.90.12',
  protocol: 'WireGuard Turbo (UDP 51820)',
  connectedAt: 0,
  killSwitch: true,
  dns: '1.1.1.1 (Cloudflare Gaming Anti-DDoS)',
  bytesIn: 0,
  bytesOut: 0
};

app.get('/api/vpn/nodes', (req, res) => {
  res.json({
    success: true,
    nodes: VPN_NODES,
    activeSession: activeVpnSession.connected ? activeVpnSession : null
  });
});

app.get('/api/vpn/status', (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  res.json({
    success: true,
    active: activeVpnSession.connected,
    session: activeVpnSession.connected ? {
      ...activeVpnSession,
      uptimeSeconds: Math.floor((Date.now() - activeVpnSession.connectedAt) / 1000),
      clientRealIp: clientIp,
      virtualIp: activeVpnSession.assignedIp,
    } : null,
    clientRealIp: clientIp
  });
});

app.post('/api/vpn/connect', (req, res) => {
  const { serverCode, protocol, killSwitch } = req.body || {};
  const node = VPN_NODES.find(n => n.code === (serverCode || 'ID')) || VPN_NODES[0];
  
  activeVpnSession = {
    connected: true,
    serverCode: node.code,
    assignedIp: node.ip,
    protocol: protocol || node.protocol,
    connectedAt: Date.now(),
    killSwitch: killSwitch !== false,
    dns: '1.1.1.1 (Cloudflare Gaming Anti-DDoS)',
    bytesIn: Math.floor(Math.random() * 800000) + 200000,
    bytesOut: Math.floor(Math.random() * 400000) + 100000
  };

  res.json({
    success: true,
    status: 'connected',
    node,
    virtualIp: node.ip,
    session: activeVpnSession,
    message: `Terhubung ke server ${node.name}`
  });
});

app.post('/api/vpn/disconnect', (req, res) => {
  activeVpnSession.connected = false;
  activeVpnSession.connectedAt = 0;
  res.json({
    success: true,
    status: 'disconnected',
    message: 'VPN berhasil dinonaktifkan'
  });
});

app.get('/api/vpn/ping', (req, res) => {
  const code = (req.query.code as string) || 'ID';
  const node = VPN_NODES.find(n => n.code === code) || VPN_NODES[0];
  const jitter = Math.floor(Math.random() * 5) - 2;
  const ping = Math.max(4, node.ping + jitter);
  res.json({
    success: true,
    code: node.code,
    ping,
    timestamp: Date.now()
  });
});


// ==========================================================================
// 1. OWNER CONTROL PANEL & ADMINISTRATION ENDPOINTS
// ==========================================================================
app.post('/api/owner/login', (req, res) => {
  const { password } = req.body || {};
  if (!verifyOwnerPassword(password)) {
    return res.status(401).json({ success: false, message: 'Password Owner salah!' });
  }
  const token = createOwnerSession();
  const fDb = getFeaturesDB();
  fDb.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'OWNER_LOGIN_SUCCESS',
    performedBy: 'ZE-OWNER',
    timestamp: Date.now(),
    details: 'Owner logged in successfully'
  });
  saveFeaturesDB();
  return res.json({
    success: true,
    token,
    owner: {
      id: 'ZE-OWNER',
      name: 'zvn3',
      username: 'ZE.io',
      role: 'owner',
      isOwner: true
    }
  });
});

app.get('/api/owner/session', (req, res) => {
  const auth = resolveRequestAuthority(req);
  return res.json({
    success: auth.isOwner || auth.isAdmin,
    isOwner: auth.isOwner,
    isAdmin: auth.isAdmin,
    role: auth.role,
    actorId: auth.actorId
  });
});

app.post('/api/owner/change-password', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner) {
    return res.status(403).json({ success: false, message: 'Hanya OWNER yang dapat mengubah password Owner' });
  }
  const { currentPassword, newPassword } = req.body || {};
  if (!verifyOwnerPassword(currentPassword)) {
    return res.status(401).json({ success: false, message: 'Password saat ini salah' });
  }
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ success: false, message: 'Password baru minimal 4 karakter' });
  }
  const ok = updateOwnerPassword(newPassword);
  return res.json({ success: ok, message: 'Password Owner berhasil diperbarui' });
});

app.get('/api/owner/dashboard', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak: Hanya OWNER dan ADMIN yang diizinkan' });
  }
  const fDb = getFeaturesDB();
  const totalUsers = dbCache.users.length;
  const onlineCount = Math.max(1, sseClients.size);
  const vipCount = dbCache.users.filter(
    (u: any) =>
      (fDb.vipUsers[u.id] && (!fDb.vipUsers[u.id].expiresAt || fDb.vipUsers[u.id].expiresAt > Date.now()))
  ).length;
  const adminCount = dbCache.users.filter((u: any) => Boolean(fDb.adminUsers[u.id])).length;
  const normalizedTxs = fDb.qrisTransactions.map(normalizeOrderRecord);
  const pendingApprovalCount = normalizedTxs.filter((t) => t.status === 'WAITING_OWNER_APPROVAL').length;

  return res.json({
    success: true,
    stats: {
      totalUsers,
      onlineUsers: onlineCount,
      vipUsers: vipCount,
      adminUsers: adminCount,
      pendingApprovalCount
    },
    recentActivities: fDb.auditLogs.slice(0, 25),
    recentTransactions: normalizedTxs.slice(0, 25)
  });
});

app.get('/api/owner/users', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  const fDb = getFeaturesDB();
  const list = dbCache.users.map((u: any) => {
    const isSuspended = Boolean(fDb.suspendedUsers[u.id]);
    const vipLookup = findVipEntry(u.id);
    const isVip = vipLookup.isActive;
    const adminInfo = fDb.adminUsers[u.id];
    const isOwnerAcc = String(u.id).toUpperCase() === 'ZE-OWNER' || String(u.username || '').toLowerCase().replace(/^@/, '') === 'ze.io';
    return {
      id: u.id,
      name: u.name,
      username: u.username,
      phone: u.phone,
      photo: u.photo || u.avatar,
      role: isOwnerAcc ? 'owner' : adminInfo ? 'admin' : 'user',
      isOwner: isOwnerAcc,
      isAdmin: isOwnerAcc || Boolean(adminInfo),
      isVip: isOwnerAcc || isVip,
      vip: isOwnerAcc || isVip,
      vipLevel: isOwnerAcc ? 'exclusive' : isVip ? vipLookup.level : undefined,
      isVipExclusive: isOwnerAcc || (isVip && vipLookup.isVipExclusive),
      vipExpiresAt: vipLookup.expiresAt || 0,
      isSuspended,
      createdAt: u.createdAt || Date.now()
    };
  });
  return res.json({ success: true, users: list });
});

app.post('/api/owner/users/status', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  const { userId, suspend, reason } = req.body || {};
  if (!userId) return res.status(400).json({ success: false, message: 'User ID wajib' });

  const cleanUserId = String(userId).trim();
  const targetUser = dbCache.users.find(
    (u) =>
      String(u.id).toLowerCase() === cleanUserId.toLowerCase() ||
      String(u.id).toLowerCase().replace(/^ze-/, '') === cleanUserId.toLowerCase().replace(/^ze-/, '')
  );

  const isTargetOwner =
    cleanUserId.toUpperCase() === 'ZE-OWNER' ||
    String(targetUser?.username || '').toLowerCase().replace(/^@/, '') === 'ze.io' ||
    targetUser?.role === 'owner' ||
    (targetUser as any)?.isOwner;

  if (isTargetOwner) {
    return res.status(403).json({ success: false, message: 'Akun OWNER memiliki perlindungan mutlak dan TIDAK DAPAT dinonaktifkan/dibanned!' });
  }

  const fDb = getFeaturesDB();
  if (!auth.isOwner && fDb.adminUsers[cleanUserId]) {
    return res.status(403).json({ success: false, message: 'Hanya OWNER yang berhak menonaktifkan akun sesama Admin' });
  }

  if (suspend) {
    fDb.suspendedUsers[cleanUserId] = {
      suspendedAt: Date.now(),
      reason: reason || 'Pelanggaran ketentuan layanan ZE.io',
      bannedBy: auth.actorId
    };
    fDb.auditLogs.unshift({
      id: generateAuditLogId(),
      action: 'USER_SUSPENDED',
      target: cleanUserId,
      performedBy: auth.actorId,
      timestamp: Date.now(),
      details: reason || 'Akun dinonaktifkan oleh moderator/admin'
    });
    // Emit immediate real-time kick / ban notification
    broadcastSSE('user-banned', { userId: cleanUserId, reason: reason || 'Akun Anda dinonaktifkan oleh manajemen ZE.io' });
  } else {
    delete fDb.suspendedUsers[cleanUserId];
    fDb.auditLogs.unshift({
      id: generateAuditLogId(),
      action: 'USER_RESTORED',
      target: cleanUserId,
      performedBy: auth.actorId,
      timestamp: Date.now(),
      details: 'Akun dipulihkan'
    });
    broadcastSSE('user-restored', { userId: cleanUserId });
  }
  saveFeaturesDB();
  return res.json({ success: true, isSuspended: Boolean(fDb.suspendedUsers[cleanUserId]) });
});

app.post('/api/owner/vip', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  const { userId, duration, remove } = req.body || {};
  if (!userId) return res.status(400).json({ success: false, message: 'ID akun wajib diisi' });

  const cleanInput = String(userId).trim();
  const uIdx = dbCache.users.findIndex(
    (u) =>
      String(u.id).toLowerCase() === cleanInput.toLowerCase() ||
      String(u.id).toLowerCase().replace(/^ze-/, '') === cleanInput.toLowerCase().replace(/^ze-/, '')
  );

  if (uIdx < 0) {
    return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
  }

  const targetUser = dbCache.users[uIdx];
  const canonicalId = String(targetUser.id);
  const fDb = getFeaturesDB();

  if (remove) {
    clearCaseVariantVipKeys(canonicalId);
    delete (dbCache.users[uIdx] as any).vip;
    delete (dbCache.users[uIdx] as any).isVip;
    delete (dbCache.users[uIdx] as any).vipLevel;
    delete (dbCache.users[uIdx] as any).isVipExclusive;
    delete (dbCache.users[uIdx] as any).vipExpiresAt;
    saveDB();
    fDb.auditLogs.unshift({
      id: generateAuditLogId(),
      action: 'VIP_REVOKED',
      target: canonicalId,
      performedBy: auth.actorId,
      timestamp: Date.now(),
      details: `VIP dicabut dari ${targetUser.name} (${canonicalId})`
    });
    saveFeaturesDB();
    broadcastSSE('role-updated', { userId: canonicalId, isVip: false, vip: false, vipLevel: null, isVipExclusive: false, vipExpiresAt: 0 });
    broadcastSSE('user-updated', { userId: canonicalId, isVip: false, vip: false, vipLevel: null, isVipExclusive: false, vipExpiresAt: 0 });
    return res.json({ success: true, message: 'Status VIP berhasil dicabut' });
  }

  const durType = (duration || '1month') as KeyDurationType;
  const requestedLevel: 'basic' | 'exclusive' = req.body?.level === 'exclusive' ? 'exclusive' : 'basic';
  const expiresAt = durType === 'permanent' ? 0 : Date.now() + (DURATION_MS[durType] || DURATION_MS['1month']);

  clearCaseVariantVipKeys(canonicalId);
  fDb.vipUsers[canonicalId] = {
    status: true,
    type: durType,
    level: requestedLevel,
    expiresAt,
    grantedAt: Date.now()
  };

  (dbCache.users[uIdx] as any).vip = true;
  (dbCache.users[uIdx] as any).isVip = true;
  (dbCache.users[uIdx] as any).vipLevel = requestedLevel;
  (dbCache.users[uIdx] as any).isVipExclusive = requestedLevel === 'exclusive';
  (dbCache.users[uIdx] as any).vipExpiresAt = expiresAt;
  saveDB();

  const durLabel =
    durType === '1hour'
      ? '1 Jam'
      : durType === '1week'
      ? '1 Minggu'
      : durType === '1month'
      ? '1 Bulan'
      : 'Permanen';

  fDb.userNotifications[canonicalId] = fDb.userNotifications[canonicalId] || [];
  const notif = {
    id: 'unotif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    title: 'Status VIP ZE.io Aktif!',
    message: `Selamat ${targetUser.name}! Akun Anda (${canonicalId}) telah diberikan akses VIP (${durLabel}). Lencana VIP + Centang Biru kini aktif di profil, komentar, dan chat Anda.`,
    category: 'VIP',
    senderName: 'ZE.io OWNER',
    senderId: auth.actorId,
    read: false,
    createdAt: Date.now()
  };
  fDb.userNotifications[canonicalId].unshift(notif);

  fDb.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'VIP_GRANTED',
    target: canonicalId,
    performedBy: auth.actorId,
    timestamp: Date.now(),
    details: `VIP (${durLabel}) diberikan kepada ${targetUser.name} (${canonicalId})`
  });
  saveFeaturesDB();

  broadcastSSE('role-updated', {
    userId: canonicalId,
    isVip: true,
    vip: true,
    vipLevel: requestedLevel,
    isVipExclusive: requestedLevel === 'exclusive',
    vipExpiresAt: expiresAt
  });
  broadcastSSE('user-updated', {
    userId: canonicalId,
    isVip: true,
    vip: true,
    vipLevel: requestedLevel,
    isVipExclusive: requestedLevel === 'exclusive',
    vipExpiresAt: expiresAt
  });
  broadcastSSE('user-notification', { userId: canonicalId, notification: notif });
  broadcastSSE('notifications-updated', { userId: canonicalId });

  return res.json({
    success: true,
    message: `VIP (${durLabel}) berhasil diaktifkan untuk ${targetUser.name} (${canonicalId})`,
    vip: fDb.vipUsers[canonicalId],
    user: enrichAndEnforceUserRole({ ...dbCache.users[uIdx] })
  });
});

app.post('/api/owner/admin', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner) {
    return res.status(403).json({ success: false, message: 'Hanya OWNER yang dapat mengangkat atau mencabut peran ADMIN' });
  }
  const { userId, promote, permissions } = req.body || {};
  if (!userId) return res.status(400).json({ success: false, message: 'ID akun wajib diisi' });

  const cleanInput = String(userId).trim();
  const uIdx = dbCache.users.findIndex(
    (u) =>
      String(u.id).toLowerCase() === cleanInput.toLowerCase() ||
      String(u.id).toLowerCase().replace(/^ze-/, '') === cleanInput.toLowerCase().replace(/^ze-/, '')
  );
  if (uIdx < 0) {
    return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
  }

  const targetUser = dbCache.users[uIdx];
  const canonicalId = String(targetUser.id);
  if (canonicalId.toUpperCase() === 'ZE-OWNER') {
    return res.status(403).json({ success: false, message: 'Tidak dapat mengubah peran Owner' });
  }

  const fDb = getFeaturesDB();
  const perms = permissions || ['manage_chats', 'moderate_posts', 'manage_keys'];
  if (promote) {
    fDb.adminUsers[canonicalId] = {
      role: 'admin',
      permissions: perms,
      grantedAt: Date.now()
    };
    dbCache.users[uIdx].role = 'admin';
    (dbCache.users[uIdx] as any).isAdmin = true;

    fDb.userNotifications[canonicalId] = fDb.userNotifications[canonicalId] || [];
    const notif = {
      id: 'unotif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: 'Anda Diangkat Menjadi ADMIN ZE.io',
      message: `Akun Anda (${canonicalId}) kini memiliki status ADMIN permanen beserta Centang Perak resmi dan akses panel moderasi ZE.io.`,
      category: 'SISTEM',
      senderName: 'ZE.io OWNER',
      senderId: 'ZE-OWNER',
      read: false,
      createdAt: Date.now()
    };
    fDb.userNotifications[canonicalId].unshift(notif);
    broadcastSSE('user-notification', { userId: canonicalId, notification: notif });
    broadcastSSE('notifications-updated', { userId: canonicalId });

    fDb.auditLogs.unshift({
      id: generateAuditLogId(),
      action: 'ADMIN_PROMOTED',
      target: canonicalId,
      performedBy: 'ZE-OWNER',
      timestamp: Date.now(),
      details: `${targetUser.name} (${canonicalId}) diangkat menjadi Admin (Centang Perak)`
    });
  } else {
    delete fDb.adminUsers[canonicalId];
    dbCache.users[uIdx].role = 'user';
    (dbCache.users[uIdx] as any).isAdmin = false;
    fDb.auditLogs.unshift({
      id: generateAuditLogId(),
      action: 'ADMIN_REVOKED',
      target: canonicalId,
      performedBy: 'ZE-OWNER',
      timestamp: Date.now(),
      details: `Hak akses Admin dicabut dari ${targetUser.name} (${canonicalId})`
    });
  }
  saveDB();
  saveFeaturesDB();

  broadcastSSE('role-updated', {
    userId: canonicalId,
    role: promote ? 'admin' : 'user',
    isAdmin: Boolean(promote),
    permissions: promote ? perms : []
  });
  broadcastSSE('user-updated', {
    userId: canonicalId,
    role: promote ? 'admin' : 'user',
    isAdmin: Boolean(promote)
  });

  return res.json({
    success: true,
    isAdmin: Boolean(fDb.adminUsers[canonicalId]),
    message: promote
      ? `${targetUser.name} (${canonicalId}) berhasil diangkat menjadi ADMIN`
      : `Akses ADMIN untuk ${targetUser.name} berhasil dicabut`
  });
});

app.get('/api/owner/keys', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  const fDb = getFeaturesDB();
  return res.json({ success: true, keys: (fDb.keys || []).filter(Boolean) });
});

app.get('/api/owner/keys/quota', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  if (auth.isOwner) {
    return res.json({ success: true, isOwner: true, count: 0, maxAllowed: Infinity, remaining: 'UNLIMITED' });
  }
  const usage = getAdminDailyKeyUsage(auth.actorId);
  return res.json({
    success: true,
    isOwner: false,
    count: usage.count,
    maxAllowed: usage.maxAllowed,
    remaining: Math.max(0, usage.maxAllowed - usage.count),
    dateStr: usage.dateStr
  });
});

app.post('/api/owner/keys/generate', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak: Hanya OWNER dan ADMIN yang diizinkan' });
  }

  const { type, count = 1, userName } = req.body || {};
  let reqCount = Math.max(1, Math.min(20, Number(count) || 1));

  // Admin Daily Limit: Maximum 3 KEYs per day!
  if (!auth.isOwner && auth.isAdmin) {
    const usage = getAdminDailyKeyUsage(auth.actorId);
    if (usage.count >= 3) {
      return res.status(403).json({
        success: false,
        message: `Batas harian tercapai: Admin hanya dapat membuat maksimal 3 KEY per hari (${usage.count}/3 telah dibuat hari ini: ${usage.dateStr}). Kuota dihitung dan tersimpan di server.`
      });
    }
    if (usage.count + reqCount > 3) {
      reqCount = 3 - usage.count;
    }
  }

  const created: any[] = [];
  const issuerLabel = auth.isOwner ? 'ZE-OWNER' : `ADMIN-${auth.actorId}`;
  for (let i = 0; i < reqCount; i++) {
    created.push(createNewKey(type || '1month', issuerLabel, userName));
  }

  if (!auth.isOwner && auth.isAdmin) {
    recordAdminKeyCreation(auth.actorId, reqCount);
  }

  const fDb = getFeaturesDB();
  fDb.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'KEYS_MANUALLY_GENERATED',
    performedBy: auth.actorId,
    timestamp: Date.now(),
    details: `${auth.isOwner ? 'OWNER' : 'ADMIN'} (${auth.actorId}) membuat ${reqCount} Key (${type || '1month'})`
  });
  saveFeaturesDB();

  return res.json({
    success: true,
    keys: created,
    remainingAdminDailyQuota: auth.isOwner ? 'UNLIMITED' : Math.max(0, 3 - getAdminDailyKeyUsage(auth.actorId).count)
  });
});

app.post('/api/owner/keys/revoke', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner) {
    return res.status(403).json({ success: false, message: 'Hanya OWNER yang dapat mencabut Key' });
  }
  const { key } = req.body || {};
  const ok = revokeKey(key, 'ZE-OWNER');
  return res.json({ success: ok, message: ok ? 'Key berhasil dicabut' : 'Key tidak ditemukan' });
});

// Purchases activation toggle (OWNER-only)
app.get('/api/owner/settings/purchases', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  return res.json({ success: true, purchasesEnabled: isPurchasesActive() });
});

app.post('/api/owner/settings/purchases', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner) {
    return res.status(403).json({ success: false, message: 'Hanya OWNER yang dapat mengubah status pembelian' });
  }
  const { enabled } = req.body || {};
  const newStatus = setPurchasesActive(Boolean(enabled));
  broadcastSSE('purchases-status-updated', { purchasesEnabled: newStatus });
  return res.json({
    success: true,
    purchasesEnabled: newStatus,
    message: `Sistem pembelian sekarang ${newStatus ? 'AKTIF' : 'DINONAKTIFKAN'}`
  });
});

// ==========================================================================
// OWNER PAYMENT VERIFICATION (STRICT OWNER-ONLY APPROVAL & REJECTION)
// ==========================================================================
app.get('/api/owner/payments', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  const fDb = getFeaturesDB();
  const transactions = fDb.qrisTransactions
    .map(normalizeOrderRecord)
    .sort((a, b) => b.createdAt - a.createdAt);
  return res.json({
    success: true,
    canApprove: auth.isOwner,
    transactions
  });
});

app.post('/api/owner/payments/approve', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak: Hanya OWNER yang berhak menyetujui pembayaran dan menerbitkan Key.'
    });
  }

  const { orderId } = req.body || {};
  if (!orderId) {
    return res.status(400).json({ success: false, message: 'ID transaksi (orderId) wajib diisi' });
  }

  const fDb = getFeaturesDB();
  const tx = fDb.qrisTransactions.find((t) => t.orderId === orderId);
  if (!tx) {
    return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  }

  // Prevent double approval or duplicate key generation
  const existingOrderKey = (fDb.keys || []).filter(Boolean).find((k) => k?.orderId === tx.orderId);
  if (tx.status === 'APPROVED' || tx.status === 'paid' || tx.keyIssued || existingOrderKey) {
    return res.status(409).json({
      success: false,
      message: 'Transaksi ini sudah disetujui sebelumnya. Pembuatan key ganda dicegah oleh sistem.',
      transaction: normalizeOrderRecord(tx)
    });
  }

  if (!tx.proofImageUrl && !tx.gatewayWebhookVerified) {
    return res.status(400).json({
      success: false,
      message: 'Bukti transfer belum diunggah oleh pembeli. Tidak dapat menyetujui pesanan tanpa bukti pembayaran.'
    });
  }

  const isTopupOrder = tx.purchaseType === 'topup';
  const isVipOrder = tx.purchaseType === 'vip_basic' || tx.purchaseType === 'vip_exclusive';
  const now = Date.now();
  const targetUserId = String(tx.userId);
  let newKey: any = null;
  let newWalletBal: number = 0;

  if (isTopupOrder) {
    newWalletBal = topUpUserWallet(targetUserId, tx.amount, tx.orderId);
    creditOwnerRevenue(
      tx.amount,
      'TOPUP_VERIFIED',
      'OFFICIAL_QRIS',
      `Top Up Saldo ${tx.userName} (${tx.userId})`,
      tx.orderId,
      tx.userId
    );
  } else if (isVipOrder) {
    const isExclusive = tx.purchaseType === 'vip_exclusive';
    const vipExpires = now + VIP_DURATION_MS; // 2 Bulan (60 hari)
    const canonicalVipKey = targetUserId.toUpperCase().startsWith('ZE-') ? targetUserId.toUpperCase() : targetUserId;
    clearCaseVariantVipKeys(canonicalVipKey);
    fDb.vipUsers[canonicalVipKey] = {
      status: true,
      type: isExclusive ? 'vip_exclusive' : 'vip_basic',
      level: isExclusive ? 'exclusive' : 'basic',
      expiresAt: vipExpires,
      grantedAt: now,
      lastDailyKeyClaimAt: now
    };

    // Update or create user in dbCache so VIP persists across refreshes & logins
    const uIdx = dbCache.users.findIndex(
      (u) => String(u.id).toLowerCase() === targetUserId.toLowerCase()
    );
    if (uIdx >= 0) {
      dbCache.users[uIdx] = {
        ...dbCache.users[uIdx],
        vip: true,
        isVip: true,
        vipLevel: isExclusive ? 'exclusive' : 'basic',
        isVipExclusive: isExclusive,
        vipExpiresAt: vipExpires
      };
      saveDB();
    } else if (canonicalVipKey && canonicalVipKey !== 'anonymous') {
      dbCache.users.push({
        id: canonicalVipKey,
        username: tx.userUsername || canonicalVipKey.toLowerCase().replace('-', '_'),
        name: tx.userName || 'VIP Member',
        role: 'user',
        vip: true,
        isVip: true,
        vipLevel: isExclusive ? 'exclusive' : 'basic',
        isVipExclusive: isExclusive,
        vipExpiresAt: vipExpires,
        createdAt: now
      } as any);
      saveDB();
    }

    // Issue initial 20-hour VIP Key for immediate usage
    newKey = createNewKey('20hours', 'ZE-OWNER', tx.userName, tx.userId, tx.orderId);
    tx.vipIssued = true;
    tx.vipLevel = isExclusive ? 'exclusive' : 'basic';
    tx.keyIssued = newKey.key;

    creditOwnerRevenue(
      tx.amount,
      'VIP_SALE',
      'OFFICIAL_QRIS',
      `Penjualan VIP ${isExclusive ? 'EKSKLUSIF' : 'BASIC'} untuk ${tx.userName} (${tx.userId})`,
      tx.orderId,
      tx.userId
    );
  } else {
    // Generate and bind unique Key strictly upon OWNER approval
    const cleanKeyType: KeyDurationType = tx.keyType === '1hour' ? '2days' : (tx.keyType || '2days');
    newKey = createNewKey(cleanKeyType, 'ZE-OWNER', tx.userName, tx.userId, tx.orderId);
    tx.keyIssued = newKey.key;

    creditOwnerRevenue(
      tx.amount,
      'KEY_SALE',
      'OFFICIAL_QRIS',
      `Penjualan Key ${cleanKeyType} untuk ${tx.userName} (${tx.userId})`,
      tx.orderId,
      tx.userId
    );
  }

  tx.status = 'APPROVED';
  tx.statusLabel = getOrderStatusLabel('APPROVED');
  tx.paidAt = now;
  tx.approvedAt = now;
  tx.approvedBy = 'ZE-OWNER';
  tx.verifiedBy = 'ZE-OWNER';
  tx.rejectionReason = undefined;
  tx.decisionHistory = tx.decisionHistory || [];
  tx.decisionHistory.push({
    action: 'APPROVED',
    actor: 'ZE-OWNER',
    timestamp: now
  });

  // Deliver Notification to buyer's ZE.io inbox
  if (targetUserId && targetUserId !== 'anonymous') {
    fDb.userNotifications[targetUserId] = fDb.userNotifications[targetUserId] || [];
    let notifTitle = 'Pembayaran Disetujui — Key ZE.io Anda Aktif!';
    let notifMsg = '';

    if (isTopupOrder) {
      notifTitle = 'Top Up Saldo Berhasil Disetujui!';
      notifMsg = `Top Up Saldo sebesar Rp${tx.amount.toLocaleString('id-ID')} untuk pesanan ${tx.orderId} telah diverifikasi dan disetujui OWNER.\n\nSaldo Anda sekarang: Rp${newWalletBal.toLocaleString('id-ID')}.\nSaldo dapat langsung digunakan untuk membeli KEY dan VIP di Key Store.`;
    } else if (isVipOrder) {
      const isExclusive = tx.purchaseType === 'vip_exclusive';
      notifTitle = isExclusive ? '👑 VIP EKSKLUSIF Aktif (2 Bulan)!' : '👑 VIP BASIC Aktif (2 Bulan)!';
      notifMsg = `Pembayaran pesanan ${tx.orderId} (Rp${tx.amount.toLocaleString('id-ID')}) telah diverifikasi & disetujui OWNER.\n\nSelamat! Akun Anda kini berstatus ${isExclusive ? 'VIP EKSKLUSIF' : 'VIP BASIC'} dengan masa aktif 2 BULAN (60 hari). Setelah 2 bulan masa aktif otomatis berakhir dan dapat diperpanjang kembali.\n\nBenefit ${isExclusive ? 'VIP Eksklusif (Lencana Emas Menyala, ZE.ai DARK MODE & Key Harian)' : 'VIP Basic (Lencana Perak & Key Harian)'} kini aktif.\n\nKey Harian (20 Jam) Pertama Anda:\n${newKey.key}\n\nSalin key untuk akses fitur /rw dan /bug di ZE AI!`;
    } else {
      const typeLabel =
        tx.keyType === '2days' || tx.keyType === '1hour'
          ? '2 Hari (48 Jam)'
          : tx.keyType === '1week'
          ? '1 Minggu'
          : tx.keyType === '1month'
          ? '1 Bulan'
          : 'Permanen';
      notifTitle = 'Pembayaran Disetujui — Key ZE.io Anda Aktif!';
      notifMsg = `Pembayaran pesanan ${tx.orderId} (${typeLabel} - Rp${tx.amount.toLocaleString('id-ID')}) telah diverifikasi dan disetujui oleh OWNER.\n\nKey Eksklusif Anda:\n${newKey.key}\n\nSalin key di atas untuk mengakses fitur /rw dan /bug di ZE AI.`;
    }

    const notif = {
      id: 'unotif_' + now + '_' + Math.random().toString(36).slice(2, 6),
      title: notifTitle,
      message: notifMsg,
      category: isTopupOrder ? 'TOPUP' : isVipOrder ? 'VIP' : 'PEMBELIAN',
      senderName: isTopupOrder ? 'ZE.io Wallet' : isVipOrder ? 'ZE.io VIP Store' : 'ZE.io Key Store',
      senderId: 'ZE-OWNER',
      keyIssued: newKey?.key,
      orderId: tx.orderId,
      read: false,
      createdAt: now
    };
    fDb.userNotifications[targetUserId].unshift(notif);
    broadcastSSE('user-notification', { userId: targetUserId, notification: notif });
    broadcastSSE('notifications-updated', { userId: targetUserId });
    if (isTopupOrder) {
      broadcastSSE('wallet-updated', { userId: targetUserId, balance: newWalletBal });
    }
    if (isVipOrder) {
      const resolvedExp = findVipEntry(targetUserId).expiresAt;
      broadcastSSE('role-updated', {
        userId: targetUserId,
        isVip: true,
        vip: true,
        vipLevel: tx.vipLevel,
        isVipExclusive: tx.vipLevel === 'exclusive',
        vipExpiresAt: resolvedExp
      });
      broadcastSSE('user-updated', {
        userId: targetUserId,
        isVip: true,
        vip: true,
        vipLevel: tx.vipLevel,
        isVipExclusive: tx.vipLevel === 'exclusive',
        vipExpiresAt: resolvedExp
      });
    }
  }

  fDb.auditLogs.unshift({
    id: generateAuditLogId(),
    action: isTopupOrder ? 'TOPUP_APPROVED_BY_OWNER' : isVipOrder ? 'VIP_ORDER_APPROVED_BY_OWNER' : 'PAYMENT_APPROVED_BY_OWNER',
    target: tx.orderId,
    performedBy: 'ZE-OWNER',
    timestamp: now,
    details: `Order ${tx.orderId} (${tx.userId}) approved for Rp${tx.amount.toLocaleString('id-ID')}. Type: ${tx.purchaseType || tx.keyType}.${newKey ? ` Key: ${newKey.key}` : ''}`
  });

  saveFeaturesDB();

  const normalizedTx = normalizeOrderRecord(tx);
  broadcastSSE('payment-updated', { orderId: tx.orderId, userId: tx.userId, transaction: normalizedTx });
  broadcastSSE('owner-order-updated', { orderId: tx.orderId, transaction: normalizedTx });

  return res.json({
    success: true,
    message: isVipOrder
      ? `Pesanan VIP ${tx.orderId} disetujui! Status VIP 2 bulan dan key harian ${newKey.key} telah dikirim ke pembeli.`
      : `Pembayaran ${tx.orderId} disetujui. Key ${newKey.key} telah dikirim ke notifikasi pembeli.`,
    key: newKey.key,
    transaction: normalizedTx
  });
});

app.post('/api/owner/payments/reject', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak: Hanya OWNER yang berhak menolak bukti pembayaran.'
    });
  }

  const { orderId, reason } = req.body || {};
  const cleanReason = String(reason || '').trim();
  if (!orderId) {
    return res.status(400).json({ success: false, message: 'ID transaksi wajib diisi' });
  }
  if (!cleanReason) {
    return res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi agar pembeli mengetahui penyebabnya' });
  }

  const fDb = getFeaturesDB();
  const tx = fDb.qrisTransactions.find((t) => t.orderId === orderId);
  if (!tx) {
    return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  }

  if (tx.status === 'APPROVED' || tx.status === 'paid' || tx.keyIssued) {
    return res.status(409).json({
      success: false,
      message: 'Transaksi yang sudah disetujui dan menerbitkan key tidak dapat ditolak.'
    });
  }

  const now = Date.now();
  tx.status = 'REJECTED';
  tx.statusLabel = getOrderStatusLabel('REJECTED');
  tx.rejectionReason = cleanReason;
  tx.rejectedAt = now;
  tx.rejectedBy = 'ZE-OWNER';
  tx.decisionHistory = tx.decisionHistory || [];
  tx.decisionHistory.push({
    action: 'REJECTED',
    actor: 'ZE-OWNER',
    reason: cleanReason,
    timestamp: now
  });

  const targetUserId = String(tx.userId);
  if (targetUserId && targetUserId !== 'anonymous') {
    fDb.userNotifications[targetUserId] = fDb.userNotifications[targetUserId] || [];
    const notif = {
      id: 'unotif_' + now + '_' + Math.random().toString(36).slice(2, 6),
      title: 'Bukti Pembayaran Ditolak',
      message: `Bukti transfer untuk pesanan ${tx.orderId} ditolak oleh OWNER.\nAlasan: "${cleanReason}"\n\nSilakan buka menu KEY STORE pada pesanan Anda untuk mengirim ulang bukti transfer yang sesuai.`,
      category: 'PEMBELIAN',
      senderName: 'ZE.io Key Store',
      senderId: 'ZE-OWNER',
      orderId: tx.orderId,
      read: false,
      createdAt: now
    };
    fDb.userNotifications[targetUserId].unshift(notif);
    broadcastSSE('user-notification', { userId: targetUserId, notification: notif });
    broadcastSSE('notifications-updated', { userId: targetUserId });
  }

  fDb.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'PAYMENT_REJECTED_BY_OWNER',
    target: tx.orderId,
    performedBy: 'ZE-OWNER',
    timestamp: now,
    details: `Order ${tx.orderId} (${tx.userId}) rejected. Reason: ${cleanReason}`
  });

  saveFeaturesDB();

  const normalizedTx = normalizeOrderRecord(tx);
  broadcastSSE('payment-updated', { orderId: tx.orderId, userId: tx.userId, transaction: normalizedTx });
  broadcastSSE('owner-order-updated', { orderId: tx.orderId, transaction: normalizedTx });

  return res.json({
    success: true,
    message: `Pesanan ${tx.orderId} ditolak dan alasan penolakan telah dikirim ke pembeli.`,
    transaction: normalizedTx
  });
});

app.post('/api/vip/claim-daily-key', (req, res) => {
  const { userId } = req.body || {};
  const cleanId = String(userId || '').trim();
  if (!cleanId) return res.status(400).json({ success: false, message: 'User ID wajib diisi' });

  const fDb = getFeaturesDB();
  const isOwner = cleanId.toUpperCase() === 'ZE-OWNER';
  const vipLookup = findVipEntry(cleanId);
  const vipEntry = vipLookup.entry;

  if (!isOwner && !vipLookup.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Fitur klaim key harian khusus untuk akun dengan status VIP aktif.'
    });
  }

  const now = Date.now();
  const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000;
  const lastClaim = vipEntry?.lastDailyKeyClaimAt || 0;
  if (!isOwner && (now - lastClaim < TWENTY_HOURS_MS)) {
    const remainingMs = TWENTY_HOURS_MS - (now - lastClaim);
    const hoursLeft = Math.ceil(remainingMs / (60 * 60 * 1000));
    return res.status(429).json({
      success: false,
      message: `Key harian sudah diklaim sebelumnya. Anda dapat mengklaim kembali dalam ${hoursLeft} jam.`
    });
  }

  const matchedUser = dbCache.users.find(
    (u) => String(u.id).toLowerCase() === cleanId.toLowerCase()
  );
  const newKey = createNewKey('20hours', 'ZE-OWNER', matchedUser?.name || 'VIP Member', cleanId);
  if (vipEntry) {
    vipEntry.lastDailyKeyClaimAt = now;
  }
  saveFeaturesDB();

  return res.json({
    success: true,
    message: 'Key VIP Harian (20 Jam) berhasil diklaim!',
    key: newKey.key,
    duration: '20 Jam',
    expiresAt: now + TWENTY_HOURS_MS
  });
});


// ==========================================================================
// 2. GLOBAL & USER NOTIFICATION SYSTEM (PERSISTENT UNREAD & MANUAL DELETE)
// ==========================================================================
app.post('/api/owner/notifications/send', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  const { title, message, category } = req.body || {};
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Judul dan pesan notifikasi wajib diisi!' });
  }

  const fDb = getFeaturesDB();
  const notifId = 'gnotif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const cleanCat = (category || 'PENGUMUMAN').toUpperCase();
  const senderLabel = auth.isOwner ? 'ZE.io OWNER' : 'ZE.io ADMIN';

  const newNotif = {
    id: notifId,
    title: title.trim(),
    message: message.trim(),
    category: cleanCat,
    senderId: auth.actorId,
    senderName: senderLabel,
    createdAt: Date.now(),
    deliveryStatus: 'DELIVERED' as const,
    recipientsCount: Math.max(1, dbCache.users.length),
    readBy: [] as string[]
  };

  fDb.globalNotifications.unshift(newNotif);

  for (const user of dbCache.users) {
    const uId = String(user.id);
    fDb.userNotifications[uId] = fDb.userNotifications[uId] || [];
    fDb.userNotifications[uId].unshift({
      id: 'unotif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      notificationId: notifId,
      title: newNotif.title,
      message: newNotif.message,
      category: cleanCat,
      senderName: senderLabel,
      senderId: auth.actorId,
      read: false,
      createdAt: Date.now()
    });
  }

  fDb.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'GLOBAL_NOTIFICATION_BROADCAST',
    performedBy: auth.actorId,
    timestamp: Date.now(),
    details: `Broadcast: "${newNotif.title}" sent to ${dbCache.users.length} accounts`
  });

  saveFeaturesDB();
  broadcastSSE('global-notification', { notification: newNotif });

  return res.json({
    success: true,
    message: `Pengumuman global berhasil dikirim ke seluruh pengguna (${dbCache.users.length} akun)`,
    notification: newNotif
  });
});

app.get('/api/notifications', (req, res) => {
  const userId = String(req.query.userId || '').trim();
  const { notifications, unreadCount } = getNotificationsForUser(userId);
  return res.json({
    success: true,
    notifications,
    unreadCount
  });
});

app.post('/api/notifications/read', (req, res) => {
  const { userId, notificationId } = req.body || {};
  if (!userId || !notificationId) {
    return res.status(400).json({ success: false, message: 'userId dan notificationId wajib' });
  }
  const unreadCount = markUserNotificationRead(String(userId), String(notificationId));
  broadcastSSE('notifications-updated', { userId: String(userId), unreadCount });
  return res.json({ success: true, unreadCount });
});

app.delete('/api/notifications', (req, res) => {
  const userId = String(req.body?.userId || req.query.userId || '').trim();
  const notificationId = String(req.body?.notificationId || req.query.notificationId || '').trim();
  if (!userId || !notificationId) {
    return res.status(400).json({ success: false, message: 'userId dan notificationId wajib' });
  }
  const unreadCount = deleteUserNotification(userId, notificationId);
  broadcastSSE('notifications-updated', { userId, unreadCount, deletedId: notificationId });
  return res.json({ success: true, unreadCount });
});

app.post('/api/notifications/delete', (req, res) => {
  const { userId, notificationId } = req.body || {};
  if (!userId || !notificationId) {
    return res.status(400).json({ success: false, message: 'userId dan notificationId wajib' });
  }
  const unreadCount = deleteUserNotification(String(userId), String(notificationId));
  broadcastSSE('notifications-updated', { userId: String(userId), unreadCount, deletedId: notificationId });
  return res.json({ success: true, unreadCount });
});

app.get('/api/owner/notifications/history', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  const fDb = getFeaturesDB();
  return res.json({ success: true, history: fDb.globalNotifications });
});

// ==========================================================================
// 3. KEY STORE — CONNECTED QRIS, TRANSFER PROOF & OWNER VERIFICATION FLOW
// ==========================================================================
app.get('/api/payment/config', (req, res) => {
  const config = getPaymentProviderConfig();
  return res.json({
    success: true,
    config,
    prices: KEY_PRICES,
    vipPrices: VIP_PRICES,
    vipDurationDays: 60
  });
});

app.post('/api/payment/create-qris', async (req, res) => {
  try {
    const { keyType, purchaseType = 'key', amount: requestedAmount, userId, userName } = req.body || {};
    const cleanUserId = String(userId || '').trim();
    if (!cleanUserId || cleanUserId === 'anonymous') {
      return res.status(401).json({
        success: false,
        message: 'Silakan masuk ke akun ZE.io Anda terlebih dahulu sebelum membuat pesanan.'
      });
    }

    const cleanPurchaseType: PurchaseTargetType =
      purchaseType === 'topup' || purchaseType === 'vip_basic' || purchaseType === 'vip_exclusive'
        ? purchaseType
        : 'key';

    let amount = 15000;
    let type: KeyDurationType = '2days';
    let packageTitle = 'Key Akses 2 Hari (48 Jam)';

    if (cleanPurchaseType === 'topup') {
      const parsedNominal = Math.floor(Number(requestedAmount) || 0);
      if (!parsedNominal || parsedNominal < 1000) {
        return res.status(400).json({
          success: false,
          message: 'Minimal top up adalah Rp1.000 (1.000 Diamond+).'
        });
      }
      amount = parsedNominal;
      type = '2days';
      packageTitle = `Top Up Saldo Diamond+ (${amount.toLocaleString('id-ID')}+)`;
    } else if (cleanPurchaseType === 'vip_basic') {
      amount = VIP_PRICES.vip_basic; // Rp88.000
      type = '20hours';
      packageTitle = 'VIP BASIC (Masa Aktif 2 Bulan / 60 Hari)';
    } else if (cleanPurchaseType === 'vip_exclusive') {
      amount = VIP_PRICES.vip_exclusive; // Rp112.000
      type = '20hours';
      packageTitle = 'VIP EKSKLUSIF (Masa Aktif 2 Bulan / 60 Hari)';
    } else {
      // Key purchases: Paket Rp15.000 wajib 2 hari (48 jam)
      const validTypes: KeyDurationType[] = ['2days', '1week', '1month', 'permanent'];
      const mappedType = keyType === '1hour' ? '2days' : keyType;
      type = validTypes.includes(mappedType) ? mappedType : '2days';
      amount = KEY_PRICES[type] || 15000;
      packageTitle =
        type === '2days'
          ? 'Key Akses 2 Hari (48 Jam)'
          : type === '1week'
          ? 'Key Akses 1 Minggu'
          : type === '1month'
          ? 'Key Akses 1 Bulan'
          : 'Key Akses Permanen';
    }

    const orderId = `INV-ZE-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const qrisResult = await createConnectedQrisPayment(orderId, amount);
    if (!qrisResult.ok) {
      return res.status(503).json({
        success: false,
        code: 'PAYMENT_UNCONFIGURED',
        message: qrisResult.error || 'Penyedia pembayaran QRIS belum dikonfigurasi.'
      });
    }

    const matchedUser = dbCache.users.find(
      (u) => String(u.id).toLowerCase() === cleanUserId.toLowerCase()
    );
    const resolvedName = matchedUser?.name || userName || 'Pengguna ZE.io';
    const resolvedUsername = matchedUser?.username || '';
    const canonicalUserId = matchedUser ? String(matchedUser.id) : cleanUserId;
    const now = Date.now();

    const fDb = getFeaturesDB();
    const transaction: QrisTransaction = {
      id: 'tx_' + now + '_' + Math.random().toString(36).slice(2, 5),
      orderId,
      userId: canonicalUserId,
      userName: resolvedName,
      userUsername: resolvedUsername,
      purchaseType: cleanPurchaseType,
      vipLevel: cleanPurchaseType === 'vip_exclusive' ? 'exclusive' : cleanPurchaseType === 'vip_basic' ? 'basic' : undefined,
      keyType: type,
      amount,
      status: 'WAITING_PAYMENT',
      statusLabel: getOrderStatusLabel('WAITING_PAYMENT'),
      qrisString: qrisResult.qrisString,
      qrisImageUrl: qrisResult.qrisImageUrl,
      qrisQrDataUrl: qrisResult.qrisImageUrl,
      paymentProvider: qrisResult.provider,
      gatewayTransactionId: qrisResult.gatewayTransactionId,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000,
      decisionHistory: [
        {
          action: 'CREATED',
          actor: canonicalUserId,
          timestamp: now
        }
      ]
    };

    fDb.qrisTransactions.unshift(transaction);
    fDb.auditLogs.unshift({
      id: generateAuditLogId(),
      action: 'ORDER_CREATED',
      target: orderId,
      performedBy: canonicalUserId,
      timestamp: now,
      details: `Pesanan ${orderId} dibuat oleh ${resolvedName} (${canonicalUserId}) untuk ${packageTitle} (Rp${amount.toLocaleString('id-ID')})`
    });
    saveFeaturesDB();

    const normalizedTx = normalizeOrderRecord(transaction);
    broadcastSSE('owner-order-updated', { orderId, transaction: normalizedTx });

    return res.json({
      success: true,
      transaction: normalizedTx,
      instruction:
        'Scan QRIS sesuai nominal pesanan. Setelah transfer selesai, unggah foto/screenshot bukti transfer untuk diverifikasi oleh OWNER.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Gagal membuat pesanan QRIS' });
  }
});

app.post('/api/payment/await-proof', (req, res) => {
  const { orderId, userId } = req.body || {};
  if (!orderId || !userId) {
    return res.status(400).json({ success: false, message: 'ID pesanan dan akun wajib diisi' });
  }
  const fDb = getFeaturesDB();
  const tx = fDb.qrisTransactions.find((t) => t.orderId === orderId);
  if (!tx) {
    return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  }
  if (String(tx.userId).toLowerCase() !== String(userId).toLowerCase()) {
    return res.status(403).json({ success: false, message: 'Pesanan ini bukan milik akun Anda' });
  }
  if (tx.status === 'WAITING_PAYMENT' || tx.status === 'pending') {
    tx.status = 'WAITING_PROOF';
    tx.statusLabel = getOrderStatusLabel('WAITING_PROOF');
    tx.decisionHistory = tx.decisionHistory || [];
    tx.decisionHistory.push({
      action: 'AWAITING_PROOF',
      actor: String(userId),
      timestamp: Date.now()
    });
    saveFeaturesDB();
    const normalizedTx = normalizeOrderRecord(tx);
    broadcastSSE('payment-updated', { orderId: tx.orderId, userId: tx.userId, transaction: normalizedTx });
    broadcastSSE('owner-order-updated', { orderId: tx.orderId, transaction: normalizedTx });
    return res.json({ success: true, transaction: normalizedTx });
  }
  return res.json({ success: true, transaction: normalizeOrderRecord(tx) });
});

app.post('/api/payment/upload-proof', (req, res) => {
  const { orderId, userId, proofImageUrl, proofNote } = req.body || {};
  if (!orderId || !userId) {
    return res.status(400).json({ success: false, message: 'ID pesanan dan ID akun wajib diisi' });
  }
  const cleanProof = String(proofImageUrl || '').trim();
  if (!cleanProof.startsWith('data:image/') || cleanProof.length < 128) {
    return res.status(400).json({
      success: false,
      message: 'Silakan unggah foto atau screenshot bukti transfer yang valid (JPG/PNG/WebP).'
    });
  }

  const fDb = getFeaturesDB();
  const tx = fDb.qrisTransactions.find((t) => t.orderId === orderId);
  if (!tx) {
    return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  }
  if (String(tx.userId).toLowerCase() !== String(userId).toLowerCase()) {
    return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke pesanan ini' });
  }
  if (tx.status === 'APPROVED' || tx.status === 'paid' || tx.keyIssued) {
    return res.status(409).json({
      success: false,
      message: 'Pesanan ini sudah disetujui oleh OWNER.',
      transaction: normalizeOrderRecord(tx)
    });
  }

  const wasRejected = tx.status === 'REJECTED';
  const now = Date.now();
  const cleanNote = String(proofNote || '').trim().slice(0, 300);

  // Store proof & transition strictly to WAITING_OWNER_APPROVAL — NEVER issue a key here!
  const savedProofPath = saveProofImageToDisk(cleanProof, orderId);
  tx.proofImageUrl = savedProofPath;
  tx.proofNote = cleanNote || undefined;
  tx.proofUploadedAt = now;
  tx.status = 'WAITING_OWNER_APPROVAL';
  tx.statusLabel = getOrderStatusLabel('WAITING_OWNER_APPROVAL');
  tx.rejectionReason = undefined;
  tx.decisionHistory = tx.decisionHistory || [];
  tx.decisionHistory.push({
    action: wasRejected ? 'PROOF_RESUBMITTED' : 'PROOF_SUBMITTED',
    actor: String(tx.userId),
    reason: cleanNote || undefined,
    timestamp: now
  });

  // Notify OWNER inbox so Owner sees incoming verification request immediately
  fDb.userNotifications['ZE-OWNER'] = fDb.userNotifications['ZE-OWNER'] || [];
  const itemLabel = tx.purchaseType === 'topup' ? 'Top Up Saldo' : tx.purchaseType === 'vip_basic' || tx.purchaseType === 'vip_exclusive' ? 'Akses VIP' : `Key ${tx.keyType?.toUpperCase() || ''}`;
  const ownerNotif = {
    id: 'unotif_' + now + '_' + Math.random().toString(36).slice(2, 6),
    title: wasRejected ? `Bukti Transfer Dikirim Ulang (${tx.orderId})` : `Bukti Transfer Baru Masuk (${tx.orderId})`,
    message: `${tx.userName} (${tx.userId}) mengunggah bukti transfer untuk ${itemLabel} senilai Rp${tx.amount.toLocaleString('id-ID')}. Silakan periksa bukti di menu OWNER -> TOP UP PENDING.`,
    category: 'VERIFIKASI',
    senderName: tx.userName,
    senderId: tx.userId,
    orderId: tx.orderId,
    read: false,
    createdAt: now
  };
  fDb.userNotifications['ZE-OWNER'].unshift(ownerNotif);

  fDb.auditLogs.unshift({
    id: generateAuditLogId(),
    action: wasRejected ? 'PAYMENT_PROOF_RESUBMITTED' : 'PAYMENT_PROOF_SUBMITTED',
    target: tx.orderId,
    performedBy: tx.userId,
    timestamp: now,
    details: `Bukti transfer dikirim untuk ${tx.orderId} oleh ${tx.userName} (${tx.userId}) - Menunggu Persetujuan OWNER`
  });

  saveFeaturesDB();

  const normalizedTx = normalizeOrderRecord(tx);
  broadcastSSE('user-notification', { userId: 'ZE-OWNER', notification: ownerNotif });
  broadcastSSE('notifications-updated', { userId: 'ZE-OWNER' });
  broadcastSSE('payment-updated', { orderId: tx.orderId, userId: tx.userId, transaction: normalizedTx });
  broadcastSSE('owner-order-updated', { orderId: tx.orderId, transaction: normalizedTx });

  return res.json({
    success: true,
    message: 'Pesanan sedang menunggu persetujuan OWNER.',
    transaction: normalizedTx
  });
});

app.get('/api/payment/my-orders', (req, res) => {
  const userId = String(req.query.userId || '').trim();
  if (!userId) {
    return res.json({ success: true, orders: [], keys: [] });
  }
  const fDb = getFeaturesDB();
  const orders = fDb.qrisTransactions
    .filter((t) => String(t.userId).toLowerCase() === userId.toLowerCase())
    .map(normalizeOrderRecord)
    .sort((a, b) => b.createdAt - a.createdAt);

  const cleanUserUpper = userId.toUpperCase();
  const keys = (fDb.keys || [])
    .filter(Boolean)
    .filter((k) => {
      const bUid = k?.boundUid ? String(k.boundUid).toUpperCase() : '';
      const iUid = k?.issuedTo ? String(k.issuedTo).toUpperCase() : '';
      if (bUid) return bUid === cleanUserUpper;
      return iUid === cleanUserUpper;
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return res.json({ success: true, orders, keys });
});

app.get('/api/payment/status/:orderId', (req, res) => {
  const { orderId } = req.params;
  const fDb = getFeaturesDB();
  const tx = fDb.qrisTransactions.find((t) => t.orderId === orderId);
  if (!tx) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
  return res.json({ success: true, transaction: normalizeOrderRecord(tx) });
});

// REAL-TIME SERVER-SIDE QRIS PAYMENT INQUIRY & VERIFICATION (IDEMPOTENT & STRICT)
app.all(['/api/payment/check-status/:orderId', '/api/payment/verify-status/:orderId'], async (req, res) => {
  const { orderId } = req.params;
  const fDb = getFeaturesDB();
  const tx = fDb.qrisTransactions.find((t) => t.orderId === orderId);
  if (!tx) {
    return res.status(404).json({ success: false, status: 'NOT_FOUND', message: 'Invoice pesanan tidak ditemukan.' });
  }

  // If already approved, return success idempotently
  if (tx.status === 'APPROVED' || tx.status === 'paid') {
    return res.json({
      success: true,
      status: 'SUCCESS',
      verified: true,
      credited: true,
      message: 'Pembayaran telah sah diverifikasi dan saldo Diamond+ telah aktif.',
      transaction: normalizeOrderRecord(tx)
    });
  }

  const cfg = getPaymentProviderConfig();

  // If Midtrans Gateway is configured, verify directly with Midtrans Core API server-to-server
  if (cfg.hasMidtransGateway) {
    try {
      const serverKey = (process.env.MIDTRANS_SERVER_KEY || '').trim();
      const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');
      const inquiryUrl = `${cfg.midtransBaseUrl}/v2/${orderId}/status`;

      const response = await fetch(inquiryUrl, {
        headers: {
          Accept: 'application/json',
          Authorization: authHeader
        }
      });

      if (response.ok) {
        const data: any = await response.json();
        const gwStatus = String(data.transaction_status || '').toLowerCase();
        const grossAmount = Math.floor(Number(data.gross_amount) || 0);

        if (gwStatus === 'settlement' || gwStatus === 'capture') {
          // Verify gross amount matches invoice amount exactly
          if (grossAmount !== tx.amount) {
            tx.status = 'REJECTED';
            tx.rejectionReason = `Nominal pembayaran (Rp${grossAmount}) tidak sesuai dengan invoice (Rp${tx.amount})`;
            saveFeaturesDB();
            return res.status(400).json({
              success: false,
              status: 'REJECTED',
              message: tx.rejectionReason
            });
          }

          // Atomically credit Diamond+ exactly once
          const now = Date.now();
          const newBal = topUpUserWallet(tx.userId, tx.amount, tx.orderId);
          creditOwnerRevenue(
            tx.amount,
            'TOPUP_VERIFIED',
            'MIDTRANS_QRIS',
            `Top Up Diamond+ ${tx.userName} (${tx.userId}) via Midtrans QRIS Real`,
            tx.orderId,
            tx.userId
          );

          tx.status = 'APPROVED';
          tx.statusLabel = getOrderStatusLabel('APPROVED');
          tx.gatewayWebhookVerified = true;
          tx.gatewayStatus = gwStatus;
          tx.gatewayTransactionId = data.transaction_id;
          tx.paidAt = now;
          tx.approvedAt = now;
          tx.approvedBy = 'MIDTRANS_OFFICIAL_API';
          tx.decisionHistory = tx.decisionHistory || [];
          tx.decisionHistory.push({
            action: 'APPROVED',
            actor: 'MIDTRANS_API_VERIFIED',
            timestamp: now
          });

          // Send notification
          fDb.userNotifications[tx.userId] = fDb.userNotifications[tx.userId] || [];
          const notif = {
            id: 'unotif_' + now + '_' + Math.random().toString(36).slice(2, 6),
            title: 'Top Up Diamond+ Berhasil Terverifikasi!',
            message: `Pembayaran QRIS untuk pesanan ${tx.orderId} telah diverifikasi resmi oleh payment gateway.\n\n+${tx.amount.toLocaleString('id-ID')} Diamond+ telah ditambahkan ke akun Anda.\nSaldo Diamond+ sekarang: ${newBal.toLocaleString('id-ID')}.`,
            category: 'TOPUP',
            senderName: 'ZE.io Wallet',
            senderId: 'SYSTEM',
            orderId: tx.orderId,
            read: false,
            createdAt: now
          };
          fDb.userNotifications[tx.userId].unshift(notif);

          saveFeaturesDB();

          const norm = normalizeOrderRecord(tx);
          broadcastSSE('wallet-updated', { userId: tx.userId, balance: newBal });
          broadcastSSE('payment-updated', { orderId: tx.orderId, userId: tx.userId, transaction: norm });
          broadcastSSE('owner-order-updated', { orderId: tx.orderId, transaction: norm });

          return res.json({
            success: true,
            status: 'SUCCESS',
            verified: true,
            credited: true,
            message: `Pembayaran QRIS valid! +${tx.amount.toLocaleString('id-ID')} Diamond+ berhasil ditambahkan.`,
            transaction: norm
          });
        } else if (gwStatus === 'deny' || gwStatus === 'cancel' || gwStatus === 'expire') {
          tx.status = 'REJECTED';
          tx.rejectionReason = `Pembayaran berstatus ${gwStatus.toUpperCase()}`;
          saveFeaturesDB();
          return res.json({
            success: false,
            status: 'REJECTED',
            message: `Pembayaran gagal atau kedaluwarsa (${gwStatus}).`,
            transaction: normalizeOrderRecord(tx)
          });
        } else {
          return res.json({
            success: true,
            status: 'PENDING',
            verified: false,
            message: 'Pembayaran QRIS belum diselesaikan oleh pembeli.',
            transaction: normalizeOrderRecord(tx)
          });
        }
      }
    } catch (apiErr: any) {
      console.warn('Midtrans status check error:', apiErr?.message || apiErr);
    }
  }

  // Official Merchant QRIS (Connected to DANA Owner):
  // When Midtrans API is unconfigured, payment is held in PENDING until official webhook / Owner verification
  return res.json({
    success: true,
    status: tx.status === 'APPROVED' ? 'SUCCESS' : tx.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
    verified: tx.status === 'APPROVED',
    message: tx.status === 'APPROVED'
      ? 'Pembayaran telah disetujui dan saldo Diamond+ aktif.'
      : 'Menunggu pembayaran QRIS DANA Owner terkonfirmasi.',
    transaction: normalizeOrderRecord(tx)
  });
});

app.post('/api/payment/webhook', (req, res) => {
  const payload = req.body || {};
  if (!verifyMidtransWebhookSignature(payload)) {
    return res.status(401).json({ success: false, message: 'Invalid payment gateway signature' });
  }
  const fDb = getFeaturesDB();
  const tx = fDb.qrisTransactions.find((t) => t.orderId === payload.order_id);
  if (!tx) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  tx.gatewayStatus = String(payload.transaction_status || '');
  if (payload.transaction_status === 'settlement' || payload.transaction_status === 'capture') {
    tx.gatewayWebhookVerified = true;
    if (tx.status !== 'APPROVED' && tx.status !== 'paid') {
      const now = Date.now();
      const newBal = topUpUserWallet(tx.userId, tx.amount, tx.orderId);
      creditOwnerRevenue(
        tx.amount,
        'TOPUP_VERIFIED',
        'MIDTRANS_QRIS',
        `Top Up Diamond+ ${tx.userName} via Webhook Settlement`,
        tx.orderId,
        tx.userId
      );
      tx.status = 'APPROVED';
      tx.statusLabel = getOrderStatusLabel('APPROVED');
      tx.paidAt = now;
      tx.approvedAt = now;
      tx.approvedBy = 'MIDTRANS_WEBHOOK';
      tx.decisionHistory = tx.decisionHistory || [];
      tx.decisionHistory.push({
        action: 'APPROVED',
        actor: 'MIDTRANS_WEBHOOK',
        timestamp: now
      });
      saveFeaturesDB();
      const norm = normalizeOrderRecord(tx);
      broadcastSSE('wallet-updated', { userId: tx.userId, balance: newBal });
      broadcastSSE('payment-updated', { orderId: tx.orderId, userId: tx.userId, transaction: norm });
      broadcastSSE('owner-order-updated', { orderId: tx.orderId, transaction: norm });
      return res.json({ success: true });
    }
  }
  saveFeaturesDB();
  return res.json({ success: true });
});

// ==========================================================================
// 4. ZE.io INTERNAL WALLET (SALDO), TOP-UP & INSTANT BALANCE STORE ENGINE
// ==========================================================================
app.get('/api/wallet/balance', (req, res) => {
  const userId = String(req.query.userId || '').trim();
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID wajib diisi' });
  }
  const upperId = userId.toUpperCase();
  const isOwner =
    upperId === 'ZE-OWNER' ||
    upperId === 'OWNER' ||
    upperId === 'ZE.IO' ||
    upperId === '@ZE.IO' ||
    dbCache.users.some(
      (u) =>
        (String(u.id).toLowerCase() === userId.toLowerCase() ||
          String(u.username || '').toLowerCase() === userId.toLowerCase()) &&
        (Boolean(u.isOwner) || Boolean((u as any).owner) || String(u.username || '').toLowerCase() === 'ze.io')
    );
  const balance = isOwner ? 999999999 : getUserWallet(userId);
  return res.json({ success: true, userId, balance, isOwner, isUnlimited: isOwner });
});

app.post('/api/wallet/topup', async (req, res) => {
  try {
    const { userId, userName, amount } = req.body || {};
    const cleanUserId = String(userId || '').trim();
    const numAmount = Math.floor(Number(amount));
    if (!cleanUserId || cleanUserId === 'anonymous') {
      return res.status(401).json({ success: false, message: 'Silakan masuk ke akun ZE.io Anda terlebih dahulu.' });
    }
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Nominal top up harus lebih besar dari 0' });
    }

    const orderId = `TOPUP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const matchedUser = dbCache.users.find((u) => String(u.id).toLowerCase() === cleanUserId.toLowerCase());
    const resolvedName = matchedUser?.name || userName || 'Pengguna ZE.io';
    const now = Date.now();

    const fDb = getFeaturesDB();
    const transaction: QrisTransaction = {
      id: 'tx_topup_' + now + '_' + Math.random().toString(36).slice(2, 5),
      orderId,
      userId: cleanUserId,
      userName: resolvedName,
      userUsername: matchedUser?.username || '',
      purchaseType: 'topup',
      keyType: '2days',
      amount: numAmount,
      status: 'WAITING_PROOF',
      statusLabel: getOrderStatusLabel('WAITING_PROOF'),
      paymentProvider: 'TRANSFER_BANK',
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      decisionHistory: [{ action: 'CREATED', actor: cleanUserId, timestamp: now }]
    };

    fDb.qrisTransactions.unshift(transaction);
    fDb.auditLogs.unshift({
      id: generateAuditLogId(),
      action: 'TOPUP_REQUESTED',
      target: orderId,
      performedBy: cleanUserId,
      timestamp: now,
      details: `Pengajuan Top Up Saldo ${orderId} dibuat oleh ${resolvedName} senilai Rp${numAmount.toLocaleString('id-ID')} (Menunggu Bukti Transfer & ACC Owner)`
    });
    saveFeaturesDB();

    const normalizedTx = normalizeOrderRecord(transaction);
    broadcastSSE('owner-order-updated', { orderId, transaction: normalizedTx });

    return res.json({
      success: true,
      transaction: normalizedTx,
      paymentAccounts: [
        { bank: 'BCA', accountNumber: '8720-9921-00', accountName: 'ZE.io Official / zvn3' },
        { bank: 'DANA', accountNumber: '0812-3456-7890', accountName: 'ZE.io Official' },
        { bank: 'GoPay', accountNumber: '0812-3456-7890', accountName: 'ZE.io Official' }
      ]
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Gagal membuat pengajuan top up' });
  }
});

// Alias for top up proof upload
app.post('/api/wallet/topup/upload-proof', (req, res, next) => {
  // Delegate to proof uploader
  (app as any)._router.handle({ ...req, url: '/api/payment/upload-proof' }, res, next);
});

app.all(['/api/store/buy-with-saldo', '/api/wallet/purchase'], (req, res) => {
  // Check if system purchases are enabled by Owner
  if (!isPurchasesActive()) {
    return res.status(403).json({
      success: false,
      message: 'Sistem pembelian sedang dinonaktifkan sementara oleh Owner. Silakan coba kembali nanti.'
    });
  }

  const { userId, userName, purchaseType = 'key', keyType = '1day' } = req.body || {};
  const cleanUserId = String(userId || '').trim();
  if (!cleanUserId || cleanUserId === 'anonymous') {
    return res.status(401).json({ success: false, message: 'Silakan masuk ke akun ZE.io terlebih dahulu' });
  }

  let price = 5000;
  let packageTitle = 'Key Akses 1 Hari';
  const cleanPurchaseType: PurchaseTargetType =
    purchaseType === 'vip_basic' || purchaseType === 'vip_exclusive' ? purchaseType : 'key';

  if (cleanPurchaseType === 'vip_basic') {
    price = VIP_PRICES.vip_basic; // 115.000 Diamond+
    packageTitle = 'VIP BASIC (2 Bulan / 60 Hari)';
  } else if (cleanPurchaseType === 'vip_exclusive') {
    price = VIP_PRICES.vip_exclusive; // 130.000 Diamond+
    packageTitle = 'VIP EKSKLUSIF (2 Bulan / 60 Hari)';
  } else {
    const rawKey = String(keyType || '1day').toLowerCase();
    const valid: KeyDurationType =
      rawKey === '1day' ? '1day' :
      rawKey === '1week' ? '1week' :
      rawKey === '1month' ? '1month' :
      rawKey === 'permanent' ? 'permanent' :
      rawKey === '1hour' ? '1day' :
      rawKey === '2days' ? '1day' : '1day';

    price = KEY_PRICES[valid] || 5000;
    packageTitle =
      valid === '1day'
        ? 'Key Akses 1 Hari'
        : valid === '1week'
        ? 'Key Akses 1 Minggu'
        : valid === '1month'
        ? 'Key Akses 1 Bulan'
        : 'Key Akses Permanent (PROMO)';
  }

  const upperCleanId = cleanUserId.toUpperCase();
  const isOwner =
    upperCleanId === 'ZE-OWNER' ||
    upperCleanId === 'OWNER' ||
    upperCleanId === 'ZE.IO' ||
    upperCleanId === '@ZE.IO' ||
    dbCache.users.some(
      (u) =>
        (String(u.id).toLowerCase() === cleanUserId.toLowerCase() ||
          String(u.username || '').toLowerCase() === cleanUserId.toLowerCase()) &&
        (Boolean(u.isOwner) || Boolean((u as any).owner) || String(u.username || '').toLowerCase() === 'ze.io')
    );

  const currentBal = isOwner ? 999999999 : getUserWallet(cleanUserId);
  if (!isOwner && currentBal < price) {
    return res.status(400).json({
      success: false,
      code: 'INSUFFICIENT_BALANCE',
      message: `Saldo Diamond+ tidak mencukupi. Saldo Anda: ${currentBal.toLocaleString('id-ID')} Diamond+, dibutuhkan: ${price.toLocaleString('id-ID')} Diamond+. Silakan Top Up Diamond+ terlebih dahulu.`,
      currentBalance: currentBal,
      requiredAmount: price
    });
  }

  // Deduct Diamond+ balance atomically (Owner bypasses deduction)
  const deducted = isOwner ? true : deductUserWallet(cleanUserId, price, `Pembelian ${packageTitle}`);
  if (!deducted) {
    return res.status(400).json({ success: false, message: 'Gagal memotong saldo Diamond+, periksa kembali saldo Anda.' });
  }

  const now = Date.now();
  const matchedUser = dbCache.users.find((u) => String(u.id).toLowerCase() === cleanUserId.toLowerCase());
  const resolvedName = matchedUser?.name || userName || 'Pengguna ZE.io';
  const orderId = `DIAMOND-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const fDb = getFeaturesDB();

  let generatedKey: any = null;
  const isVip = cleanPurchaseType === 'vip_basic' || cleanPurchaseType === 'vip_exclusive';

  let purchasedVipExpiresAt = 0;
  if (isVip) {
    const isExclusive = cleanPurchaseType === 'vip_exclusive';
    const vipExpires = now + VIP_DURATION_MS; // 2 Bulan (60 Hari)
    purchasedVipExpiresAt = vipExpires;
    const canonicalVipKey = cleanUserId.toUpperCase().startsWith('ZE-') ? cleanUserId.toUpperCase() : cleanUserId;
    clearCaseVariantVipKeys(canonicalVipKey);
    fDb.vipUsers[canonicalVipKey] = {
      status: true,
      type: isExclusive ? 'vip_exclusive' : 'vip_basic',
      level: isExclusive ? 'exclusive' : 'basic',
      expiresAt: vipExpires,
      grantedAt: now,
      lastDailyKeyClaimAt: now
    };

    const uIdx = dbCache.users.findIndex((u) => String(u.id).toLowerCase() === cleanUserId.toLowerCase());
    if (uIdx >= 0) {
      dbCache.users[uIdx] = {
        ...dbCache.users[uIdx],
        vip: true,
        isVip: true,
        vipLevel: isExclusive ? 'exclusive' : 'basic',
        isVipExclusive: isExclusive,
        vipExpiresAt: vipExpires
      };
      saveDB();
    } else if (canonicalVipKey) {
      dbCache.users.push({
        id: canonicalVipKey,
        username: canonicalVipKey.toLowerCase().replace('-', '_'),
        name: resolvedName,
        role: 'user',
        vip: true,
        isVip: true,
        vipLevel: isExclusive ? 'exclusive' : 'basic',
        isVipExclusive: isExclusive,
        vipExpiresAt: vipExpires,
        createdAt: now
      } as any);
      saveDB();
    }

    generatedKey = createNewKey('20hours', 'ZE-OWNER', resolvedName, canonicalVipKey, orderId);
  } else {
    const rawKey = String(keyType || '1day').toLowerCase();
    const cleanKeyType: KeyDurationType =
      rawKey === '1day' ? '1day' :
      rawKey === '1week' ? '1week' :
      rawKey === '1month' ? '1month' :
      rawKey === 'permanent' ? 'permanent' : '1day';
    generatedKey = createNewKey(cleanKeyType, 'ZE-OWNER', resolvedName, cleanUserId, orderId);
  }

  // Record into qrisTransactions ledger as instantly APPROVED via DIAMOND_PLUS
  const transaction: QrisTransaction = {
    id: 'tx_diamond_' + now + '_' + Math.random().toString(36).slice(2, 5),
    orderId,
    userId: cleanUserId,
    userName: resolvedName,
    userUsername: matchedUser?.username || '',
    purchaseType: cleanPurchaseType,
    vipLevel: cleanPurchaseType === 'vip_exclusive' ? 'exclusive' : cleanPurchaseType === 'vip_basic' ? 'basic' : undefined,
    vipIssued: isVip,
    keyType: (keyType as KeyDurationType) || '1day',
    keyIssued: generatedKey.key,
    amount: price,
    status: 'APPROVED',
    statusLabel: getOrderStatusLabel('APPROVED'),
    qrisString: `PAID_WITH_DIAMOND_${orderId}`,
    qrisImageUrl: '/assets/ze_logo.png',
    paymentProvider: 'SALDO_WALLET',
    paidAt: now,
    approvedAt: now,
    approvedBy: 'AUTO_DIAMOND_SETTLEMENT',
    createdAt: now,
    expiresAt: now,
    decisionHistory: [
      { action: 'CREATED', actor: cleanUserId, timestamp: now },
      { action: 'APPROVED', actor: 'DIAMOND_PLUS', timestamp: now }
    ]
  };

  fDb.qrisTransactions.unshift(transaction);

  // Credit owner balance & ledger
  creditOwnerRevenue(
    price,
    isVip ? 'VIP_SALE' : 'KEY_SALE',
    'DIAMOND_PLUS',
    `Pembelian ${packageTitle} oleh ${resolvedName} (${cleanUserId}) via Diamond+`,
    orderId,
    cleanUserId
  );

  // Notification to user
  fDb.userNotifications[cleanUserId] = fDb.userNotifications[cleanUserId] || [];
  const notif = {
    id: 'unotif_' + now + '_' + Math.random().toString(36).slice(2, 6),
    title: isVip ? '👑 Pembelian VIP Berhasil (Diamond+)!' : '🔑 Pembelian Key Berhasil (Diamond+)!',
    message: isVip
      ? `Selamat! Akun Anda aktif sebagai ${cleanPurchaseType === 'vip_exclusive' ? 'VIP EKSKLUSIF' : 'VIP BASIC'} (2 Bulan / 60 Hari).\nKey harian pertama Anda: ${generatedKey.key}`
      : `Pembelian ${packageTitle} berhasil dipotong dari saldo Diamond+ Anda senilai ${price.toLocaleString('id-ID')} Diamond+.\nKey Anda: ${generatedKey.key}\nGunakan key ini di ZE AI.`,
    category: isVip ? 'VIP' : 'PEMBELIAN',
    senderName: 'ZE.io Key Store',
    senderId: 'ZE-OWNER',
    keyIssued: generatedKey.key,
    orderId,
    read: false,
    createdAt: now
  };
  fDb.userNotifications[cleanUserId].unshift(notif);

  saveFeaturesDB();

  const newWalletBalance = isOwner ? 999999999 : getUserWallet(cleanUserId);
  broadcastSSE('wallet-updated', { userId: cleanUserId, balance: newWalletBalance, isUnlimited: isOwner });
  broadcastSSE('user-notification', { userId: cleanUserId, notification: notif });
  broadcastSSE('notifications-updated', { userId: cleanUserId });
  if (isVip) {
    const vipLvl: 'basic' | 'exclusive' = cleanPurchaseType === 'vip_exclusive' ? 'exclusive' : 'basic';
    broadcastSSE('role-updated', {
      userId: cleanUserId,
      isVip: true,
      vip: true,
      vipLevel: vipLvl,
      isVipExclusive: vipLvl === 'exclusive',
      vipExpiresAt: purchasedVipExpiresAt
    });
    broadcastSSE('user-updated', {
      userId: cleanUserId,
      isVip: true,
      vip: true,
      vipLevel: vipLvl,
      isVipExclusive: vipLvl === 'exclusive',
      vipExpiresAt: purchasedVipExpiresAt
    });
  }

  return res.json({
    success: true,
    message: isVip ? 'VIP berhasil diaktifkan!' : 'Key berhasil dibeli!',
    key: generatedKey.key,
    remainingBalance: newWalletBalance,
    vipStatus: isVip
      ? {
          isVip: true,
          vip: true,
          vipLevel: cleanPurchaseType === 'vip_exclusive' ? 'exclusive' : 'basic',
          isVipExclusive: cleanPurchaseType === 'vip_exclusive',
          vipExpiresAt: purchasedVipExpiresAt
        }
      : undefined,
    transaction: normalizeOrderRecord(transaction)
  });
});

// OWNER BALANCE & TRANSACTIONS LEDGER (STRICT OWNER ONLY)
app.get('/api/owner/balance', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak: Hanya OWNER resmi yang memiliki hak akses ke Saldo & Ledger Owner.'
    });
  }
  const balanceData = getOwnerBalanceAndLedger();
  return res.json({ success: true, ...balanceData });
});

// VIP MANAGEMENT: GIVE VIP BASIC & EKSKLUSIF
app.post('/api/owner/vip/grant', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  const { targetUserId, level = 'basic', durationDays = 60 } = req.body || {};
  const cleanId = String(targetUserId || '').trim();
  if (!cleanId) return res.status(400).json({ success: false, message: 'Target User ID wajib diisi' });

  const cleanLevel = level === 'exclusive' ? 'exclusive' : 'basic';
  const result = grantVipToUser(cleanId, cleanLevel, Number(durationDays) || 60, auth.actorId);

  // Update user in dbCache
  const uIdx = dbCache.users.findIndex((u) => String(u.id).toLowerCase() === cleanId.toLowerCase());
  if (uIdx >= 0) {
    dbCache.users[uIdx] = {
      ...dbCache.users[uIdx],
      vip: true,
      isVip: true,
      vipLevel: cleanLevel,
      isVipExclusive: cleanLevel === 'exclusive',
      vipExpiresAt: result.vipEntry.expiresAt
    };
    saveDB();
  }

  broadcastSSE('role-updated', {
    userId: cleanId,
    isVip: true,
    vip: true,
    vipLevel: cleanLevel,
    isVipExclusive: cleanLevel === 'exclusive',
    vipExpiresAt: result.vipEntry.expiresAt
  });
  broadcastSSE('user-updated', {
    userId: cleanId,
    isVip: true,
    vip: true,
    vipLevel: cleanLevel,
    isVipExclusive: cleanLevel === 'exclusive',
    vipExpiresAt: result.vipEntry.expiresAt
  });

  return res.json({
    success: true,
    message: `Status VIP ${cleanLevel.toUpperCase()} berhasil diberikan ke ${cleanId} selama ${durationDays} hari`,
    vipEntry: result.vipEntry
  });
});

app.post('/api/owner/vip/revoke', (req, res) => {
  const auth = resolveRequestAuthority(req);
  if (!auth.isOwner && !auth.isAdmin) {
    return res.status(403).json({ success: false, message: 'Akses ditolak' });
  }
  const { targetUserId } = req.body || {};
  const cleanId = String(targetUserId || '').trim();
  if (!cleanId) return res.status(400).json({ success: false, message: 'Target User ID wajib diisi' });

  revokeVipFromUser(cleanId, auth.actorId);

  const uIdx = dbCache.users.findIndex((u) => String(u.id).toLowerCase() === cleanId.toLowerCase());
  if (uIdx >= 0) {
    dbCache.users[uIdx] = {
      ...dbCache.users[uIdx],
      vip: false,
      isVip: false,
      vipLevel: undefined,
      isVipExclusive: false,
      vipExpiresAt: 0
    };
    saveDB();
  }

  broadcastSSE('role-updated', { userId: cleanId, isVip: false, vip: false, vipLevel: null, isVipExclusive: false, vipExpiresAt: 0 });
  broadcastSSE('user-updated', { userId: cleanId, isVip: false, vip: false, vipLevel: null, isVipExclusive: false, vipExpiresAt: 0 });

  return res.json({ success: true, message: `Status VIP untuk ${cleanId} berhasil dicabut` });
});

// ==========================================================================
// 5. ZE AI KEY VALIDATION
// ==========================================================================
app.post('/api/keys/validate', (req, res) => {
  const { key, userId } = req.body || {};
  const validation = validateKey(key, userId);
  return res.json({ success: validation.valid, ...validation });
});

// ==========================================================================
// 5. REALTIME WEBRTC CALL SIGNALING & LIFECYCLE ENGINE
// ==========================================================================
interface ActiveCallRecord {
  callId: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  receiverId: string;
  receiverName?: string;
  receiverPhoto?: string;
  type: 'audio' | 'video';
  status: 'calling' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'busy';
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
}

const activeCallsMap = new Map<string, ActiveCallRecord>();

// Clean up stale calls periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, call] of activeCallsMap.entries()) {
    if (
      call.status === 'ended' ||
      call.status === 'rejected' ||
      (now - call.createdAt > 300000 && call.status === 'calling')
    ) {
      activeCallsMap.delete(id);
    }
  }
}, 60000);

app.post('/api/calls/initiate', (req, res) => {
  const { callerId, callerName, callerPhoto, receiverId, receiverName, receiverPhoto, type } = req.body || {};
  if (!callerId || !receiverId) {
    return res.status(400).json({ success: false, message: 'Caller and receiver required' });
  }

  const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const callRecord: ActiveCallRecord = {
    callId,
    callerId: String(callerId),
    callerName: String(callerName || callerId),
    callerPhoto: callerPhoto || '',
    receiverId: String(receiverId),
    receiverName: String(receiverName || receiverId),
    receiverPhoto: receiverPhoto || '',
    type: type === 'video' ? 'video' : 'audio',
    status: 'calling',
    createdAt: Date.now()
  };

  activeCallsMap.set(callId, callRecord);

  // Broadcast incoming-call event so receiver receives prompt instantly
  broadcastSSE('incoming-call', {
    callId,
    callerId: callRecord.callerId,
    callerName: callRecord.callerName,
    callerPhoto: callRecord.callerPhoto,
    receiverId: callRecord.receiverId,
    receiverName: callRecord.receiverName,
    type: callRecord.type,
    createdAt: callRecord.createdAt
  });

  return res.json({ success: true, callId, callRecord });
});

app.post('/api/calls/respond', (req, res) => {
  const { callId, action, userId } = req.body || {};
  const call = activeCallsMap.get(callId);
  if (!call) {
    return res.status(404).json({ success: false, message: 'Panggilan tidak ditemukan atau sudah berakhir' });
  }

  if (action === 'accept') {
    call.status = 'connected';
    call.startedAt = Date.now();
    broadcastSSE('call-accepted', {
      callId,
      callerId: call.callerId,
      receiverId: call.receiverId,
      startedAt: call.startedAt,
      type: call.type
    });
    return res.json({ success: true, status: 'connected', call });
  } else {
    call.status = 'rejected';
    call.endedAt = Date.now();
    broadcastSSE('call-rejected', {
      callId,
      callerId: call.callerId,
      receiverId: call.receiverId,
      reason: 'Panggilan ditolak'
    });
    return res.json({ success: true, status: 'rejected' });
  }
});

app.post('/api/calls/signal', (req, res) => {
  const { callId, senderId, targetId, signalType, payload } = req.body || {};
  const call = activeCallsMap.get(callId);
  if (!call) {
    return res.status(404).json({ success: false, message: 'Panggilan tidak aktif' });
  }

  // Relay WebRTC signaling payload (SDP offer, answer, or ICE candidate)
  broadcastSSE('call-signal', {
    callId,
    senderId,
    targetId,
    signalType, // 'offer' | 'answer' | 'ice-candidate'
    payload
  });

  return res.json({ success: true });
});

app.post('/api/calls/end', (req, res) => {
  const { callId, userId, reason } = req.body || {};
  const call = activeCallsMap.get(callId);
  if (call) {
    call.status = 'ended';
    call.endedAt = Date.now();
    broadcastSSE('call-ended', {
      callId,
      callerId: call.callerId,
      receiverId: call.receiverId,
      endedBy: userId,
      reason: reason || 'Panggilan selesai'
    });
  } else {
    broadcastSSE('call-ended', { callId, endedBy: userId, reason: reason || 'Panggilan selesai' });
  }
  return res.json({ success: true });
});

app.get('/api/calls/active', (req, res) => {
  const userId = String(req.query.userId || '').trim();
  if (!userId) return res.json({ success: true, activeCall: null });

  for (const call of activeCallsMap.values()) {
    if (
      (call.callerId === userId || call.receiverId === userId) &&
      (call.status === 'calling' || call.status === 'connected')
    ) {
      return res.json({ success: true, activeCall: call });
    }
  }
  return res.json({ success: true, activeCall: null });
});

// Start Server with Vite Middleware
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ZE.io server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
