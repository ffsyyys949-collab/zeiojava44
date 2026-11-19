import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';

// Path for features persistence
const DATA_DIR = path.resolve(process.cwd());
const FEATURES_DB_FILE = path.join(DATA_DIR, '.features_zeio_db.json');

export interface GlobalNotification {
  id: string;
  title: string;
  message: string;
  category: 'PENGUMUMAN' | 'UPDATE' | 'MAINTENANCE' | 'EVENT' | 'PROMO' | string;
  senderId: string;
  senderName: string;
  createdAt: number;
  deliveryStatus: 'DELIVERED';
  recipientsCount: number;
  readBy: string[];
}

export interface UserNotification {
  id: string;
  notificationId?: string;
  title: string;
  message: string;
  category?: string;
  senderName: string;
  senderId?: string;
  read: boolean;
  readAt?: number;
  createdAt: number;
  keyIssued?: string;
  orderId?: string;
}

export type KeyDurationType = '1day' | '2days' | '1week' | '1month' | 'permanent' | '1hour' | '20hours';
export type PurchaseTargetType = 'key' | 'vip_basic' | 'vip_exclusive' | 'topup';

export interface OwnerLedgerEntry {
  id: string;
  type: 'OPENING_BALANCE' | 'KEY_SALE' | 'VIP_SALE' | 'TOPUP_VERIFIED' | 'SALDO_PURCHASE' | 'DIRECT_SALE';
  amount: number;
  balanceAfter: number;
  source: string;
  description: string;
  timestamp: number;
  orderId?: string;
  userId?: string;
}

export interface KeyRecord {
  id: string;
  key: string;
  type: KeyDurationType | string;
  status: 'available' | 'active' | 'expired' | 'revoked';
  usageStatus?: 'BELUM DIGUNAKAN' | 'SUDAH DIGUNAKAN';
  boundUid?: string;
  issuedTo?: string;
  userName?: string;
  orderId?: string;
  createdAt: number;
  activatedAt?: number;
  expiresAt?: number;
  generatedBy: string;
}

export type OrderPaymentStatus =
  | 'PENDING'
  | 'WAITING_PAYMENT'
  | 'WAITING_PROOF'
  | 'WAITING_OWNER_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export interface OrderDecisionEntry {
  action: 'CREATED' | 'AWAITING_PROOF' | 'PROOF_SUBMITTED' | 'PROOF_RESUBMITTED' | 'WEBHOOK_SETTLED' | 'APPROVED' | 'REJECTED';
  actor: string;
  reason?: string;
  timestamp: number;
}

export interface QrisTransaction {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userUsername?: string;
  purchaseType?: PurchaseTargetType;
  keyType: KeyDurationType;
  amount: number;
  status: OrderPaymentStatus | 'pending' | 'paid' | 'expired';
  statusLabel?: string;
  qrisString?: string;
  qrisImageUrl?: string;
  qrisQrDataUrl?: string;
  paymentProvider: 'OFFICIAL_MERCHANT_QRIS' | 'MIDTRANS_QRIS' | 'SALDO_WALLET' | 'TRANSFER_BANK' | 'MANUAL_TRANSFER';
  gatewayTransactionId?: string;
  gatewayWebhookVerified?: boolean;
  gatewayStatus?: string;
  proofImageUrl?: string;
  proofNote?: string;
  proofUploadedAt?: number;
  rejectionReason?: string;
  rejectedAt?: number;
  rejectedBy?: string;
  keyIssued?: string;
  vipIssued?: boolean;
  vipLevel?: 'basic' | 'exclusive';
  createdAt: number;
  expiresAt: number;
  paidAt?: number;
  approvedAt?: number;
  approvedBy?: string;
  verifiedBy?: string;
  decisionHistory?: OrderDecisionEntry[];
}

export interface AuditLog {
  id: string;
  action: string;
  target?: string;
  performedBy: string;
  timestamp: number;
  details?: string;
}

export interface FeaturesDB {
  ownerPasswordHash: string;
  ownerSalt: string;
  ownerBalance: number;
  ownerTotalRevenue: number;
  ownerLedger: OwnerLedgerEntry[];
  userWallets: Record<string, number>;
  globalNotifications: GlobalNotification[];
  userNotifications: Record<string, UserNotification[]>;
  deletedNotifications: Record<string, string[]>;
  keys: KeyRecord[];
  qrisTransactions: QrisTransaction[];
  tagNumbers?: Record<string, any>;
  suspendedUsers: Record<string, { suspendedAt: number; reason: string; bannedBy?: string }>;
  vipUsers: Record<string, { status: boolean; type: string; level?: 'basic' | 'exclusive'; expiresAt: number; grantedAt: number; lastDailyKeyClaimAt?: number }>;
  adminUsers: Record<string, { role: 'admin' | 'moderator'; permissions: string[]; grantedAt: number }>;
  adminDailyKeyQuota?: Record<string, Record<string, number>>; // adminId -> { 'YYYY-MM-DD': count }
  purchasesEnabled?: boolean;
  auditLogs: AuditLog[];
}

// Key duration calculation in milliseconds — Paket Promo Baru
export const DURATION_MS: Record<string, number> = {
  '1hour': 60 * 60 * 1000,
  '1day': 24 * 60 * 60 * 1000, // Promo 1 Hari (24 Jam)
  '2days': 48 * 60 * 60 * 1000,
  '20hours': 20 * 60 * 60 * 1000, // VIP Daily Key (20 jam)
  '1week': 7 * 24 * 60 * 60 * 1000, // Promo 1 Minggu
  '1month': 30 * 24 * 60 * 60 * 1000, // Promo 1 Bulan
  '2months': 60 * 24 * 60 * 60 * 1000, // VIP 2 Bulan
  'permanent': 0
};

export const VIP_DURATION_MS = 60 * 24 * 60 * 60 * 1000; // 2 Bulan (60 hari) masa aktif VIP

// HARGA RESMI PROMO KEY BARU (dalam Diamond+ / Rupiah)
export const KEY_PRICES: Record<string, number> = {
  '1day': 5000,       // 1 HARI: 5.000 Diamond+ (Rp5.000)
  '1hour': 5000,      // Fallback
  '2days': 10000,     // Fallback legacy
  '1week': 30000,     // 1 MINGGU: 30.000 Diamond+ (Rp30.000)
  '1month': 60000,    // 1 BULAN: 60.000 Diamond+ (Rp60.000)
  'permanent': 88000  // PERMANENT PROMO: 88.000 Diamond+ (Rp88.000, coret Rp111.000)
};

// HARGA RESMI VIP PASS BARU (2 BULAN) (dalam Diamond+ / Rupiah)
export const VIP_PRICES: Record<'vip_basic' | 'vip_exclusive', number> = {
  'vip_basic': 115000,     // VIP BASIC: 115.000 Diamond+ (Rp115.000) (2 Bulan)
  'vip_exclusive': 130000  // VIP EKSKLUSIF: 130.000 Diamond+ (Rp130.000) (2 Bulan)
};

// Simpan bukti transfer ke disk lokal agar foto tidak putih dan gambar asli awet
export function saveProofImageToDisk(base64Data: string, orderId: string): string {
  try {
    if (!base64Data || !base64Data.startsWith('data:image/')) {
      return base64Data;
    }
    const proofsDir = path.join(DATA_DIR, 'public', 'uploads', 'proofs');
    if (!fs.existsSync(proofsDir)) {
      fs.mkdirSync(proofsDir, { recursive: true });
    }
    const match = base64Data.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) return base64Data;
    let ext = match[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `proof_${cleanOrderId}_${Date.now()}.${ext}`;
    const filePath = path.join(proofsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'));
    return `/uploads/proofs/${filename}`;
  } catch (err) {
    console.warn('Gagal menyimpan file bukti ke disk, fallback data URL:', err);
    return base64Data;
  }
}

// Initial Owner Credential: 112007
const DEFAULT_OWNER_PASS = '112007';

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateAuditLogId(): string {
  return 'log_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

export function getOrderStatusLabel(status: QrisTransaction['status']): string {
  switch (status) {
    case 'PENDING':
    case 'WAITING_PROOF':
    case 'WAITING_PAYMENT':
    case 'pending':
      return 'MENUNGGU BUKTI PEMBAYARAN';
    case 'WAITING_OWNER_APPROVAL':
      return 'MENUNGGU ACC OWNER';
    case 'APPROVED':
    case 'paid':
      return 'DISETUJUI (ACC)';
    case 'REJECTED':
      return 'DITOLAK';
    case 'expired':
      return 'KEDALUWARSA';
    default:
      return 'MENUNGGU BUKTI PEMBAYARAN';
  }
}

export function normalizeOrderRecord(tx: QrisTransaction): QrisTransaction {
  let normalizedStatus: OrderPaymentStatus = 'PENDING';
  if (tx.status === 'paid' || tx.status === 'APPROVED') {
    normalizedStatus = 'APPROVED';
  } else if (tx.status === 'REJECTED') {
    normalizedStatus = 'REJECTED';
  } else if (tx.status === 'WAITING_OWNER_APPROVAL') {
    normalizedStatus = 'WAITING_OWNER_APPROVAL';
  } else if (tx.status === 'WAITING_PROOF' || tx.status === 'WAITING_PAYMENT' || tx.status === 'pending') {
    normalizedStatus = 'WAITING_PROOF';
  } else {
    normalizedStatus = 'PENDING';
  }

  return {
    ...tx,
    status: normalizedStatus,
    statusLabel: getOrderStatusLabel(normalizedStatus),
    paymentProvider: tx.paymentProvider || 'TRANSFER_BANK'
  };
}

function loadFeaturesDB(): FeaturesDB {
  const OPENING_BALANCE_OWNER = 7800970;
  try {
    if (fs.existsSync(FEATURES_DB_FILE)) {
      const raw = fs.readFileSync(FEATURES_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.auditLogs)) {
        const seen = new Set<string>();
        parsed.auditLogs = parsed.auditLogs.map((log: any, idx: number) => {
          if (!log.id || seen.has(log.id)) {
            log.id = `log_${log.timestamp || Date.now()}_${idx}_${crypto.randomBytes(3).toString('hex')}`;
          }
          seen.add(log.id);
          return log;
        });
      }
      parsed.deletedNotifications = parsed.deletedNotifications || {};
      parsed.userNotifications = parsed.userNotifications || {};
      parsed.globalNotifications = parsed.globalNotifications || [];
      parsed.qrisTransactions = Array.isArray(parsed.qrisTransactions)
        ? parsed.qrisTransactions.map(normalizeOrderRecord)
        : [];
      parsed.vipUsers = parsed.vipUsers || {};
      parsed.adminUsers = parsed.adminUsers || {};
      parsed.suspendedUsers = parsed.suspendedUsers || {};
      parsed.keys = Array.isArray(parsed.keys)
        ? parsed.keys.filter(Boolean).map((k: any) => {
            if (k.key === '112007') {
              return {
                ...k,
                status: 'active',
                boundUid: 'ZE-OWNER',
                issuedTo: 'ZE-OWNER',
                usageStatus: 'SUDAH DIGUNAKAN' as const
              };
            }
            if (k.status === 'available' && !k.boundUid) {
              return {
                ...k,
                usageStatus: 'BELUM DIGUNAKAN' as const
              };
            }
            const resolvedBound =
              k.boundUid
                ? String(k.boundUid).trim().toUpperCase()
                : k.status !== 'available' && k.issuedTo && String(k.issuedTo).toLowerCase() !== 'anonymous'
                ? String(k.issuedTo).trim().toUpperCase()
                : undefined;
            return {
              ...k,
              boundUid: resolvedBound,
              usageStatus:
                resolvedBound || k.status === 'active' || k.activatedAt
                  ? ('SUDAH DIGUNAKAN' as const)
                  : ('BELUM DIGUNAKAN' as const)
            };
          })
        : [];

      // MIGRATION: SALDO PEMBUKAAN RESMI OWNER (Rp7.800.970) & USER WALLETS
      parsed.userWallets = parsed.userWallets || {};
      parsed.ownerLedger = Array.isArray(parsed.ownerLedger) ? parsed.ownerLedger : [];
      if (parsed.ownerLedger.length === 0) {
        parsed.ownerBalance = OPENING_BALANCE_OWNER;
        parsed.ownerTotalRevenue = 0;
        parsed.ownerLedger = [
          {
            id: 'ledger_opening_001',
            type: 'OPENING_BALANCE',
            amount: OPENING_BALANCE_OWNER,
            balanceAfter: OPENING_BALANCE_OWNER,
            source: 'SYSTEM_MIGRATION',
            description: 'Saldo Pembukaan Resmi Owner ZE.io (Migrasi Database Khusus)',
            timestamp: 1700000000000
          }
        ];
        if (Array.isArray(parsed.auditLogs)) {
          parsed.auditLogs.unshift({
            id: 'log_migration_owner_balance',
            action: 'OWNER_OPENING_BALANCE_MIGRATED',
            performedBy: 'SYSTEM_MIGRATION',
            timestamp: Date.now(),
            details: `Saldo pembukaan resmi Owner Rp${OPENING_BALANCE_OWNER.toLocaleString('id-ID')} dicatat ke ledger database.`
          });
        }
      } else {
        parsed.ownerBalance = typeof parsed.ownerBalance === 'number' ? parsed.ownerBalance : OPENING_BALANCE_OWNER;
        parsed.ownerTotalRevenue = typeof parsed.ownerTotalRevenue === 'number' ? parsed.ownerTotalRevenue : 0;
      }

      saveFeaturesDB(parsed);
      return parsed;
    }
  } catch (err) {
    console.error('Error loading features DB:', err);
  }

  const salt = generateSalt();
  const initialHash = hashPassword(DEFAULT_OWNER_PASS, salt);

  const initialDB: FeaturesDB = {
    ownerPasswordHash: initialHash,
    ownerSalt: salt,
    ownerBalance: OPENING_BALANCE_OWNER,
    ownerTotalRevenue: 0,
    ownerLedger: [
      {
        id: 'ledger_opening_001',
        type: 'OPENING_BALANCE',
        amount: OPENING_BALANCE_OWNER,
        balanceAfter: OPENING_BALANCE_OWNER,
        source: 'SYSTEM_MIGRATION',
        description: 'Saldo Pembukaan Resmi Owner ZE.io (Migrasi Database Khusus)',
        timestamp: 1700000000000
      }
    ],
    userWallets: {},
    globalNotifications: [
      {
        id: 'gnotif_welcome',
        title: 'SELAMAT DATANG DI ZE.io',
        message: 'Platform generasi baru untuk interaksi sosial, musik, komunikasi, dan ekosistem digital terpadu.',
        category: 'PENGUMUMAN',
        senderId: 'ZE-OWNER',
        senderName: 'ZE.io OWNER',
        createdAt: Date.now() - 86400000,
        deliveryStatus: 'DELIVERED',
        recipientsCount: 1,
        readBy: []
      }
    ],
    userNotifications: {},
    deletedNotifications: {},
    keys: [
      {
        id: 'key_master_1',
        key: '112007',
        type: 'permanent',
        status: 'active',
        usageStatus: 'SUDAH DIGUNAKAN',
        boundUid: 'ZE-OWNER',
        issuedTo: 'ZE-OWNER',
        userName: 'zvn3 (Owner)',
        createdAt: 1700000000000,
        activatedAt: 1700000000000,
        expiresAt: 0,
        generatedBy: 'SYSTEM_MASTER'
      }
    ],
    qrisTransactions: [],
    suspendedUsers: {},
    vipUsers: {},
    adminUsers: {},
    auditLogs: [
      {
        id: 'log_init',
        action: 'SYSTEM_BOOT',
        performedBy: 'ZE-OWNER',
        timestamp: Date.now(),
        details: 'Features engine initialized successfully with Owner opening balance'
      }
    ]
  };

  saveFeaturesDB(initialDB);
  return initialDB;
}

let featuresCache: FeaturesDB = loadFeaturesDB();

export function saveFeaturesDB(data?: FeaturesDB) {
  try {
    const toSave = data || featuresCache;
    fs.writeFileSync(FEATURES_DB_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write features db file:', err);
  }
}

// --------------------------------------------------------------------------
// OWNER & ADMIN SERVER-SIDE AUTHENTICATION
// --------------------------------------------------------------------------
export function verifyOwnerPassword(password: string): boolean {
  if (!password) return false;
  if (password === DEFAULT_OWNER_PASS) return true;
  const hash = hashPassword(password, featuresCache.ownerSalt);
  return hash === featuresCache.ownerPasswordHash;
}

export function updateOwnerPassword(newPassword: string): boolean {
  if (!newPassword || newPassword.length < 4) return false;
  const newSalt = generateSalt();
  featuresCache.ownerSalt = newSalt;
  featuresCache.ownerPasswordHash = hashPassword(newPassword, newSalt);
  featuresCache.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'OWNER_PASSWORD_CHANGED',
    performedBy: 'ZE-OWNER',
    timestamp: Date.now(),
    details: 'Owner password successfully updated'
  });
  saveFeaturesDB();
  return true;
}

const validOwnerSessions = new Map<string, { actorId: string; role: 'owner'; createdAt: number }>();

export function createOwnerSession(actorId = 'ZE-OWNER'): string {
  const token = 'ze_owner_' + crypto.randomBytes(24).toString('hex');
  validOwnerSessions.set(token, { actorId, role: 'owner', createdAt: Date.now() });
  return token;
}

export function isValidOwnerSession(token?: string): boolean {
  if (!token) return false;
  const clean = token.replace(/^Bearer\s+/i, '').trim();
  return validOwnerSessions.has(clean);
}

// --------------------------------------------------------------------------
// NOTIFICATION PERSISTENCE, UNREAD COUNTER & MANUAL DELETION
// --------------------------------------------------------------------------
export function getNotificationsForUser(userId: string): {
  notifications: any[];
  unreadCount: number;
} {
  const cleanUid = String(userId || '').trim();
  featuresCache.deletedNotifications = featuresCache.deletedNotifications || {};
  const deletedSet = new Set<string>(cleanUid ? featuresCache.deletedNotifications[cleanUid] || [] : []);

  const userItems = (cleanUid ? featuresCache.userNotifications[cleanUid] || [] : []).filter((u) => {
    const k1 = u.id;
    const k2 = u.notificationId || '';
    return !deletedSet.has(k1) && (!k2 || !deletedSet.has(k2));
  });

  const globals = featuresCache.globalNotifications
    .filter((g) => !deletedSet.has(g.id))
    .map((g) => ({
      id: g.id,
      notificationId: g.id,
      title: g.title,
      message: g.message,
      category: g.category,
      senderName: g.senderName || 'ZE.io OWNER',
      senderId: g.senderId || 'ZE-OWNER',
      read: cleanUid ? g.readBy.includes(cleanUid) : false,
      createdAt: g.createdAt
    }));

  const seen = new Set<string>();
  const combined: any[] = [];

  for (const item of [...userItems, ...globals]) {
    const canonicalKey = item.notificationId || item.id;
    if (!seen.has(canonicalKey)) {
      // Check if global readBy or personal read is true
      let isRead = Boolean(item.read);
      if (cleanUid && item.notificationId) {
        const gMatch = featuresCache.globalNotifications.find((g) => g.id === item.notificationId);
        if (gMatch && gMatch.readBy.includes(cleanUid)) {
          isRead = true;
        }
      }
      seen.add(canonicalKey);
      combined.push({ ...item, read: isRead });
    }
  }

  combined.sort((a, b) => b.createdAt - a.createdAt);
  const unreadCount = combined.filter((n) => !n.read).length;

  return { notifications: combined, unreadCount };
}

export function markUserNotificationRead(userId: string, notificationId: string): number {
  const cleanUid = String(userId || '').trim();
  if (!cleanUid || !notificationId) return 0;

  if (notificationId === 'ALL') {
    for (const g of featuresCache.globalNotifications) {
      if (!g.readBy.includes(cleanUid)) {
        g.readBy.push(cleanUid);
      }
    }
    const uList = featuresCache.userNotifications[cleanUid] || [];
    for (const item of uList) {
      item.read = true;
      item.readAt = Date.now();
    }
    saveFeaturesDB();
    return getNotificationsForUser(cleanUid).unreadCount;
  }

  const uList = featuresCache.userNotifications[cleanUid] || [];
  let linkedGlobalId = notificationId;

  for (const item of uList) {
    if (item.id === notificationId || item.notificationId === notificationId) {
      item.read = true;
      item.readAt = Date.now();
      if (item.notificationId) linkedGlobalId = item.notificationId;
    }
  }

  const gNotif = featuresCache.globalNotifications.find(
    (g) => g.id === notificationId || g.id === linkedGlobalId
  );
  if (gNotif && !gNotif.readBy.includes(cleanUid)) {
    gNotif.readBy.push(cleanUid);
  }

  saveFeaturesDB();
  return getNotificationsForUser(cleanUid).unreadCount;
}

export function deleteUserNotification(userId: string, notificationId: string): number {
  const cleanUid = String(userId || '').trim();
  if (!cleanUid || !notificationId) return 0;

  featuresCache.deletedNotifications = featuresCache.deletedNotifications || {};
  featuresCache.deletedNotifications[cleanUid] = featuresCache.deletedNotifications[cleanUid] || [];
  const delList = featuresCache.deletedNotifications[cleanUid];

  const uList = featuresCache.userNotifications[cleanUid] || [];
  const matchingItems = uList.filter(
    (item) => item.id === notificationId || item.notificationId === notificationId
  );

  for (const m of matchingItems) {
    if (m.id && !delList.includes(m.id)) delList.push(m.id);
    if (m.notificationId && !delList.includes(m.notificationId)) delList.push(m.notificationId);
  }

  if (!delList.includes(notificationId)) {
    delList.push(notificationId);
  }

  featuresCache.userNotifications[cleanUid] = uList.filter(
    (item) => item.id !== notificationId && item.notificationId !== notificationId
  );

  saveFeaturesDB();
  return getNotificationsForUser(cleanUid).unreadCount;
}

// --------------------------------------------------------------------------
// KEY GENERATION & VALIDATION
// --------------------------------------------------------------------------
export function generateRandomKey(): string {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part3 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ZE-${part1}-${part2}-${part3}`;
}

export function createNewKey(
  type: KeyDurationType,
  generatedBy = 'ZE-OWNER',
  userName?: string,
  issuedTo?: string,
  orderId?: string
): KeyRecord {
  const keyStr = generateRandomKey();
  const newKey: KeyRecord = {
    id: 'key_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    key: keyStr,
    type,
    status: 'available',
    usageStatus: 'BELUM DIGUNAKAN',
    boundUid: undefined,
    issuedTo,
    userName,
    orderId,
    createdAt: Date.now(),
    generatedBy
  };
  featuresCache.keys.unshift(newKey);
  featuresCache.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'KEY_GENERATED',
    target: issuedTo || orderId,
    performedBy: generatedBy,
    timestamp: Date.now(),
    details: `Generated ${type} key: ${keyStr}${orderId ? ` for order ${orderId}` : ''}`
  });
  saveFeaturesDB();
  return newKey;
}

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function getAdminDailyKeyUsage(adminId: string): { count: number; maxAllowed: number; dateStr: string } {
  featuresCache.adminDailyKeyQuota = featuresCache.adminDailyKeyQuota || {};
  const dateStr = getTodayDateString();
  const adminRecords = featuresCache.adminDailyKeyQuota[adminId] || {};
  const count = adminRecords[dateStr] || 0;
  return { count, maxAllowed: 3, dateStr };
}

export function recordAdminKeyCreation(adminId: string, qty = 1): number {
  featuresCache.adminDailyKeyQuota = featuresCache.adminDailyKeyQuota || {};
  featuresCache.adminDailyKeyQuota[adminId] = featuresCache.adminDailyKeyQuota[adminId] || {};
  const dateStr = getTodayDateString();
  const current = featuresCache.adminDailyKeyQuota[adminId][dateStr] || 0;
  const newCount = current + qty;
  featuresCache.adminDailyKeyQuota[adminId][dateStr] = newCount;
  saveFeaturesDB();
  return newCount;
}

export function isPurchasesActive(): boolean {
  return featuresCache.purchasesEnabled !== false;
}

export function setPurchasesActive(enabled: boolean): boolean {
  featuresCache.purchasesEnabled = enabled;
  saveFeaturesDB();
  return featuresCache.purchasesEnabled;
}

export function revokeKey(keyStr: string, revokedBy = 'ZE-OWNER'): boolean {
  if (!keyStr) return false;
  const target = (featuresCache.keys || []).find((k) => k?.key === keyStr);
  if (!target) return false;
  target.status = 'revoked';
  featuresCache.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'KEY_REVOKED',
    performedBy: revokedBy,
    timestamp: Date.now(),
    details: `Revoked key: ${keyStr}`
  });
  saveFeaturesDB();
  return true;
}

export function validateKey(keyStr: string, userId?: string): {
  valid: boolean;
  type?: KeyDurationType | string;
  expiresAt?: number;
  remainingMs?: number;
  isOwner?: boolean;
  boundUid?: string;
  usageStatus?: 'BELUM DIGUNAKAN' | 'SUDAH DIGUNAKAN';
  code?: string;
  error?: string;
} {
  const cleanKey = (keyStr || '').trim();
  if (!cleanKey) {
    return { valid: false, error: 'Key tidak boleh kosong' };
  }

  const cleanUid = String(userId || '').trim().toUpperCase();
  if (!cleanUid || cleanUid === 'ANONYMOUS') {
    return { valid: false, error: 'Silakan login ke akun ZE.io terlebih dahulu untuk mengaktifkan KEY' };
  }

  const isCallerOwner =
    cleanUid === 'ZE-OWNER' ||
    cleanUid === 'OWNER' ||
    cleanUid === 'ZE.IO' ||
    cleanUid === '@ZE.IO';

  // Master Initial Owner Key: 112007 — strictly bound to ZE-OWNER only
  if (cleanKey === DEFAULT_OWNER_PASS) {
    if (!isCallerOwner) {
      return {
        valid: false,
        code: 'KEY_ALREADY_USED',
        boundUid: 'ZE-OWNER',
        usageStatus: 'SUDAH DIGUNAKAN',
        error: 'KEY SUDAH DIGUNAKAN OLEH AKUN LAIN'
      };
    }
    return {
      valid: true,
      type: 'permanent',
      expiresAt: 0,
      remainingMs: Infinity,
      isOwner: true,
      boundUid: 'ZE-OWNER',
      usageStatus: 'SUDAH DIGUNAKAN'
    };
  }

  const record = (featuresCache.keys || []).find(
    (k) => k?.key && k.key.toUpperCase() === cleanKey.toUpperCase()
  );
  if (!record) {
    return { valid: false, error: 'Key tidak ditemukan di database resmi ZE.io' };
  }

  // Strict One-Account-One-Key Ownership Check (Checked FIRST before expiry/revocation)
  const existingBoundUid = record.boundUid
    ? String(record.boundUid).trim().toUpperCase()
    : record.status !== 'available' && record.issuedTo && String(record.issuedTo).toLowerCase() !== 'anonymous'
    ? String(record.issuedTo).trim().toUpperCase()
    : '';

  if (existingBoundUid && existingBoundUid !== cleanUid) {
    return {
      valid: false,
      code: 'KEY_ALREADY_USED',
      boundUid: existingBoundUid,
      usageStatus: 'SUDAH DIGUNAKAN',
      error: 'KEY SUDAH DIGUNAKAN OLEH AKUN LAIN'
    };
  }

  if (record.status === 'revoked') {
    return { valid: false, error: 'Key ini telah dicabut oleh Administrator' };
  }

  // Atomic first-time activation: permanently bind KEY to this account's UID
  if (record.status === 'available') {
    const now = Date.now();
    record.status = 'active';
    record.usageStatus = 'SUDAH DIGUNAKAN';
    record.boundUid = cleanUid;
    record.issuedTo = cleanUid;
    record.activatedAt = now;
    if (record.type === 'permanent') {
      record.expiresAt = 0;
    } else {
      record.expiresAt = now + (DURATION_MS[record.type] || DURATION_MS['2days']);
    }
    featuresCache.auditLogs.unshift({
      id: generateAuditLogId(),
      action: 'KEY_ACTIVATED_BOUND_UID',
      target: cleanUid,
      performedBy: cleanUid,
      timestamp: now,
      details: `Key ${record.key} (${record.type}) diaktifkan & diikat permanen ke UID ${cleanUid}`
    });
    saveFeaturesDB();
  } else if (!record.boundUid) {
    record.boundUid = cleanUid;
    record.usageStatus = 'SUDAH DIGUNAKAN';
    saveFeaturesDB();
  }

  if (record.status === 'active' && record.type !== 'permanent' && record.expiresAt) {
    if (Date.now() > record.expiresAt) {
      record.status = 'expired';
      record.usageStatus = 'SUDAH DIGUNAKAN';
      saveFeaturesDB();
      return {
        valid: false,
        boundUid: record.boundUid,
        usageStatus: 'SUDAH DIGUNAKAN',
        error: 'Key ini sudah kedaluwarsa'
      };
    }
    const remainingMs = record.expiresAt - Date.now();
    return {
      valid: true,
      type: record.type,
      expiresAt: record.expiresAt,
      remainingMs,
      boundUid: record.boundUid,
      usageStatus: 'SUDAH DIGUNAKAN'
    };
  }

  if (record.status === 'expired') {
    return {
      valid: false,
      boundUid: record.boundUid,
      usageStatus: 'SUDAH DIGUNAKAN',
      error: 'Key ini sudah kedaluwarsa'
    };
  }

  return {
    valid: true,
    type: record.type,
    expiresAt: 0,
    remainingMs: Infinity,
    boundUid: record.boundUid,
    usageStatus: 'SUDAH DIGUNAKAN'
  };
}

// --------------------------------------------------------------------------
// REAL QRIS PROVIDER & PAYMENT GATEWAY INTEGRATION (NO SIMULATION)
// --------------------------------------------------------------------------
export function getPaymentProviderConfig(): {
  available: boolean;
  provider: 'MIDTRANS_QRIS' | 'OFFICIAL_MERCHANT_QRIS' | 'UNCONFIGURED';
  hasOfficialQrisImage: boolean;
  hasMidtransGateway: boolean;
  midtransBaseUrl: string;
} {
  const midtransKey = (process.env.MIDTRANS_SERVER_KEY || '').trim();
  const isProd = String(process.env.MIDTRANS_IS_PRODUCTION || '').toLowerCase() === 'true';
  const officialQrisPath = path.join(DATA_DIR, 'public/assets/qris_payment.jpg');
  const hasOfficialQrisImage = fs.existsSync(officialQrisPath);
  const hasMidtransGateway = midtransKey.length > 8;

  return {
    available: hasMidtransGateway || hasOfficialQrisImage,
    provider: hasMidtransGateway
      ? 'MIDTRANS_QRIS'
      : hasOfficialQrisImage
      ? 'OFFICIAL_MERCHANT_QRIS'
      : 'UNCONFIGURED',
    hasOfficialQrisImage,
    hasMidtransGateway,
    midtransBaseUrl: isProd ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com'
  };
}

export async function createConnectedQrisPayment(orderId: string, amount: number): Promise<{
  ok: boolean;
  provider: 'MIDTRANS_QRIS' | 'OFFICIAL_MERCHANT_QRIS';
  qrisImageUrl: string;
  qrisString: string;
  gatewayTransactionId?: string;
  error?: string;
}> {
  const cfg = getPaymentProviderConfig();
  if (!cfg.available) {
    return {
      ok: false,
      provider: 'OFFICIAL_MERCHANT_QRIS',
      qrisImageUrl: '',
      qrisString: '',
      error: 'Konfigurasi QRIS / Payment Gateway belum tersedia di server.'
    };
  }

  if (cfg.hasMidtransGateway) {
    try {
      const serverKey = (process.env.MIDTRANS_SERVER_KEY || '').trim();
      const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');
      const resp = await fetch(`${cfg.midtransBaseUrl}/v2/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader
        },
        body: JSON.stringify({
          payment_type: 'qris',
          transaction_details: {
            order_id: orderId,
            gross_amount: amount
          }
        })
      });
      const data: any = await resp.json();
      if (resp.ok && (data.status_code === '201' || data.qr_string || Array.isArray(data.actions))) {
        const qrAction = Array.isArray(data.actions)
          ? data.actions.find((a: any) => a.name === 'generate-qr-code')
          : null;
        let qrDataUrl = qrAction?.url || '';
        if (!qrDataUrl && data.qr_string) {
          qrDataUrl = await QRCode.toDataURL(data.qr_string, { width: 340, margin: 2 });
        }
        return {
          ok: true,
          provider: 'MIDTRANS_QRIS',
          qrisImageUrl: qrDataUrl || '/assets/qris_payment.jpg',
          qrisString: data.qr_string || orderId,
          gatewayTransactionId: data.transaction_id
        };
      }
    } catch (err) {
      console.warn('Midtrans QRIS charge warning, falling back to official merchant QRIS:', err);
    }
  }

  if (cfg.hasOfficialQrisImage) {
    return {
      ok: true,
      provider: 'OFFICIAL_MERCHANT_QRIS',
      qrisImageUrl: '/assets/qris_payment.jpg',
      qrisString: `OFFICIAL_QRIS_${orderId}`
    };
  }

  return {
    ok: false,
    provider: 'OFFICIAL_MERCHANT_QRIS',
    qrisImageUrl: '',
    qrisString: '',
    error: 'Penyedia pembayaran dan QRIS belum dikonfigurasi pada server.'
  };
}

export function verifyMidtransWebhookSignature(payload: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}): boolean {
  const serverKey = (process.env.MIDTRANS_SERVER_KEY || '').trim();
  if (!serverKey || !payload.order_id || !payload.status_code || !payload.gross_amount || !payload.signature_key) {
    return false;
  }
  const raw = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
  const expected = crypto.createHash('sha512').update(raw).digest('hex');
  return expected.toLowerCase() === payload.signature_key.toLowerCase();
}

export function getFeaturesDB(): FeaturesDB {
  return featuresCache;
}

// --------------------------------------------------------------------------
export function isOwnerUserId(userId: string): boolean {
  if (!userId) return false;
  const clean = String(userId).trim().toUpperCase();
  return clean === 'ZE-OWNER' || clean === 'OWNER' || clean === 'ZE.IO' || clean === '@ZE.IO';
}

export function getUserWallet(userId: string): number {
  if (!userId) return 0;
  if (isOwnerUserId(userId)) return 999999999;
  featuresCache.userWallets = featuresCache.userWallets || {};
  return featuresCache.userWallets[String(userId)] || 0;
}

export function topUpUserWallet(userId: string, amount: number, orderId: string): number {
  const cleanId = String(userId);
  if (isOwnerUserId(cleanId)) return 999999999;
  featuresCache.userWallets = featuresCache.userWallets || {};
  const current = featuresCache.userWallets[cleanId] || 0;
  const newBal = current + amount;
  featuresCache.userWallets[cleanId] = newBal;

  featuresCache.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'WALLET_TOPUP_VERIFIED',
    target: orderId,
    performedBy: 'PAYMENT_ENGINE',
    timestamp: Date.now(),
    details: `Top Up Saldo berhasil untuk akun ${cleanId} senilai +Rp${amount.toLocaleString('id-ID')}. Saldo sekarang: Rp${newBal.toLocaleString('id-ID')}`
  });

  saveFeaturesDB();
  return newBal;
}

export function deductUserWallet(userId: string, amount: number, purpose: string): boolean {
  const cleanId = String(userId);
  if (isOwnerUserId(cleanId)) {
    // Owner akun memiliki Diamond+ Unlimited permanen
    return true;
  }
  featuresCache.userWallets = featuresCache.userWallets || {};
  const current = featuresCache.userWallets[cleanId] || 0;
  if (current < amount) return false;

  const newBal = current - amount;
  featuresCache.userWallets[cleanId] = newBal;

  featuresCache.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'WALLET_DEDUCTION',
    target: cleanId,
    performedBy: cleanId,
    timestamp: Date.now(),
    details: `Pembayaran ${purpose} menggunakan saldo: -Rp${amount.toLocaleString('id-ID')}. Sisa saldo: Rp${newBal.toLocaleString('id-ID')}`
  });

  saveFeaturesDB();
  return true;
}

// --------------------------------------------------------------------------
// OWNER BALANCE & TRANSACTIONS LEDGER (OPENING BALANCE Rp7.800.970)
// --------------------------------------------------------------------------
export function creditOwnerRevenue(
  amount: number,
  type: 'KEY_SALE' | 'VIP_SALE' | 'TOPUP_VERIFIED' | 'SALDO_PURCHASE' | 'DIRECT_SALE',
  source: string,
  description: string,
  orderId?: string,
  userId?: string
): void {
  featuresCache.ownerBalance = (featuresCache.ownerBalance || 0) + amount;
  featuresCache.ownerTotalRevenue = (featuresCache.ownerTotalRevenue || 0) + amount;
  featuresCache.ownerLedger = featuresCache.ownerLedger || [];

  const entry: OwnerLedgerEntry = {
    id: 'ledger_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
    type,
    amount,
    balanceAfter: featuresCache.ownerBalance,
    source,
    description,
    timestamp: Date.now(),
    orderId,
    userId
  };

  featuresCache.ownerLedger.unshift(entry);

  featuresCache.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'OWNER_REVENUE_CREDITED',
    performedBy: 'LEDGER_ENGINE',
    timestamp: Date.now(),
    details: `Pendapatan Owner bertambah +Rp${amount.toLocaleString('id-ID')} (${type} - ${description}). Saldo Owner sekarang: Rp${featuresCache.ownerBalance.toLocaleString('id-ID')}`
  });

  saveFeaturesDB();
}

export function getOwnerBalanceAndLedger(): {
  balance: number;
  totalRevenue: number;
  openingBalance: number;
  ledger: OwnerLedgerEntry[];
} {
  return {
    balance: featuresCache.ownerBalance || 7800970,
    totalRevenue: featuresCache.ownerTotalRevenue || 0,
    openingBalance: 7800970,
    ledger: featuresCache.ownerLedger || []
  };
}

// --------------------------------------------------------------------------
// VIP MANAGEMENT: BASIC & EKSKLUSIF (DURATION, EXPIRY & REVOCATION)
// --------------------------------------------------------------------------
export function findVipEntry(userId: string): {
  matchedKey: string | null;
  entry: any | null;
  isActive: boolean;
  level: 'basic' | 'exclusive';
  isVipExclusive: boolean;
  expiresAt: number;
} {
  const raw = String(userId || '').trim();
  if (!raw || !featuresCache.vipUsers) {
    return { matchedKey: null, entry: null, isActive: false, level: 'basic', isVipExclusive: false, expiresAt: 0 };
  }

  const lower = raw.toLowerCase();
  let matchedKey: string | null = null;
  let entry: any = null;

  if (featuresCache.vipUsers[raw]) {
    matchedKey = raw;
    entry = featuresCache.vipUsers[raw];
  } else if (featuresCache.vipUsers[raw.toUpperCase()]) {
    matchedKey = raw.toUpperCase();
    entry = featuresCache.vipUsers[raw.toUpperCase()];
  } else {
    for (const k of Object.keys(featuresCache.vipUsers)) {
      if (k.toLowerCase() === lower) {
        matchedKey = k;
        entry = featuresCache.vipUsers[k];
        break;
      }
    }
  }

  if (!entry || !matchedKey) {
    return { matchedKey: null, entry: null, isActive: false, level: 'basic', isVipExclusive: false, expiresAt: 0 };
  }

  const expiresAt = Number(entry.expiresAt || 0);
  if (expiresAt > 0 && expiresAt <= Date.now()) {
    delete featuresCache.vipUsers[matchedKey];
    saveFeaturesDB();
    return { matchedKey: null, entry: null, isActive: false, level: 'basic', isVipExclusive: false, expiresAt: 0 };
  }

  const resolvedLevel: 'basic' | 'exclusive' =
    entry.level === 'exclusive' || entry.type === 'vip_exclusive' ? 'exclusive' : 'basic';

  return {
    matchedKey,
    entry,
    isActive: Boolean(entry.status !== false),
    level: resolvedLevel,
    isVipExclusive: resolvedLevel === 'exclusive',
    expiresAt
  };
}

export function clearCaseVariantVipKeys(userId: string) {
  const lower = String(userId || '').trim().toLowerCase();
  if (!lower || !featuresCache.vipUsers) return;
  for (const k of Object.keys(featuresCache.vipUsers)) {
    if (k.toLowerCase() === lower) {
      delete featuresCache.vipUsers[k];
    }
  }
}

export function grantVipToUser(
  userId: string,
  level: 'basic' | 'exclusive',
  durationDays = 60,
  grantedBy = 'ZE-OWNER'
): { success: boolean; vipEntry: any } {
  const cleanId = String(userId).trim();
  const canonicalKey = cleanId.toUpperCase().startsWith('ZE-') ? cleanId.toUpperCase() : cleanId;
  const now = Date.now();
  const expiresAt = durationDays > 0 ? now + durationDays * 24 * 60 * 60 * 1000 : 0;

  featuresCache.vipUsers = featuresCache.vipUsers || {};
  clearCaseVariantVipKeys(canonicalKey);
  featuresCache.vipUsers[canonicalKey] = {
    status: true,
    type: level === 'exclusive' ? 'vip_exclusive' : 'vip_basic',
    level,
    grantedAt: now,
    expiresAt,
    lastDailyKeyClaimAt: 0
  };

  featuresCache.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'VIP_STATUS_GRANTED',
    target: canonicalKey,
    performedBy: grantedBy,
    timestamp: now,
    details: `VIP ${level.toUpperCase()} diberikan ke ${canonicalKey} selama ${durationDays} hari (hingga ${new Date(expiresAt).toLocaleDateString('id-ID')})`
  });

  saveFeaturesDB();
  return { success: true, vipEntry: featuresCache.vipUsers[canonicalKey] };
}

export function revokeVipFromUser(userId: string, revokedBy = 'ZE-OWNER'): boolean {
  const cleanId = String(userId).trim();
  if (!featuresCache.vipUsers) return false;
  const found = findVipEntry(cleanId);
  if (!found.matchedKey) return false;

  clearCaseVariantVipKeys(cleanId);

  featuresCache.auditLogs.unshift({
    id: generateAuditLogId(),
    action: 'VIP_STATUS_REVOKED',
    target: cleanId,
    performedBy: revokedBy,
    timestamp: Date.now(),
    details: `Status VIP untuk akun ${cleanId} telah dicabut oleh ${revokedBy}`
  });

  saveFeaturesDB();
  return true;
}


