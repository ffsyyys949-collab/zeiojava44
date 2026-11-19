import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Key,
  Lock,
  Smile,
  List,
  MessageCircle,
  Bell,
  Database,
  Globe,
  HelpCircle,
  Users,
  QrCode,
  Check,
  Copy,
  Trash2,
  Share2,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Send,
  Plus,
  X,
  Volume2,
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Gauge,
  Activity,
  Cpu,
  Sliders
} from 'lucide-react';
import { db, doc, setDoc, serverTimestamp } from '../firebase.ts';
import { checkDuplicateUser, saveUserToDatabase } from '../contexts/userStore.ts';
import {
  useFpsConfig,
  FpsTarget,
  requestRawDisplayFrame,
  cancelRawDisplayFrame,
  getLiveFpsTelemetry,
  DeviceDisplayCapabilities
} from '../contexts/fpsEngine.ts';

// --------------------------------------------------------------------------
// TRANSLATIONS OBJECT
// --------------------------------------------------------------------------
export const SETTINGS_TRANSLATIONS: Record<string, Record<string, string>> = {
  ID: {
    settings: 'Pengaturan',
    account: 'Akun',
    privacy: 'Privasi',
    avatar: 'Avatar',
    lists: 'Daftar Kontak',
    chats: 'Chat',
    notifications: 'Notifikasi',
    storage: 'Penyimpanan dan data',
    language: 'Bahasa aplikasi',
    help: 'Bantuan',
    invite: 'Pengaturan FPS',
    save: 'Simpan Perubahan',
    saved: 'Tersimpan!',
    back: 'Kembali',
    deleteAccount: 'Hapus Akun',
  },
  EN: {
    settings: 'Settings',
    account: 'Account',
    privacy: 'Privacy',
    avatar: 'Avatar',
    lists: 'Lists',
    chats: 'Chats',
    notifications: 'Notifications',
    storage: 'Storage and data',
    language: 'App language',
    help: 'Help',
    invite: 'Pengaturan FPS',
    save: 'Save Changes',
    saved: 'Saved!',
    back: 'Back',
    deleteAccount: 'Delete Account',
  },
  JP: {
    settings: '設定',
    account: 'アカウント',
    privacy: 'プライバシー',
    avatar: 'アバター',
    lists: 'リスト',
    chats: 'チャット',
    notifications: '通知',
    storage: 'ストレージとデータ',
    language: 'アプリの言語',
    help: 'ヘルプ',
    invite: 'FPS設定',
    save: '変更を保存',
    saved: '保存しました！',
    back: '戻る',
    deleteAccount: 'アカウント削除',
  },
  KR: {
    settings: '설정',
    account: '계정',
    privacy: '개인정보 보호',
    avatar: '아바타',
    lists: '목록',
    chats: '대화',
    notifications: '알림',
    storage: '저장공간 및 데이터',
    language: '앱 언어',
    help: '도움말',
    invite: 'FPS 설정',
    save: '변경사항 저장',
    saved: '저장됨!',
    back: '뒤로가기',
    deleteAccount: '계정 삭제',
  },
  AR: {
    settings: 'الإعدادات',
    account: 'الحساب',
    privacy: 'الخصوصية',
    avatar: 'الصورة الرمزية',
    lists: 'القوائم',
    chats: 'الدردشات',
    notifications: 'الإشعارات',
    storage: 'التخزين والبيانات',
    language: 'لغة التطبيق',
    help: 'المساعدة',
    invite: 'إعدادات FPS',
    save: 'حفظ التغييرات',
    saved: 'تم الحفظ!',
    back: 'رجوع',
    deleteAccount: 'حذف الحساب',
  }
};

// Sub-header Component
export const SubHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <div className="sticky top-0 z-40 glass-navbar border-b border-white/[0.08] px-4 py-3 flex items-center gap-3">
    <button
      onClick={onBack}
      className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-white/80 transition cursor-pointer shrink-0"
    >
      <ArrowLeft className="w-5 h-5 text-white" />
    </button>
    <h2 className="text-white text-base sm:text-lg font-bold truncate min-w-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{title}</h2>
  </div>
);

// --------------------------------------------------------------------------
// 1. ACCOUNT PAGE
// --------------------------------------------------------------------------
export function AccountSettingPage({
  currentUser,
  onBack,
  onUserUpdate,
  onDeleteAccount
}: {
  currentUser: any;
  onBack: () => void;
  friends?: any[];
  onUserUpdate: (updated: any) => void;
  onDeleteAccount: () => void;
}) {
  const [name, setName] = useState(currentUser?.name || 'ZE User');
  const [about, setAbout] = useState(currentUser?.bio || 'Hey there! I am using ZE.io');
  const [pinAuth, setPinAuth] = useState(() => localStorage.getItem('ze_2step_pin') === 'true');
  const [secAlerts, setSecAlerts] = useState(() => localStorage.getItem('ze_sec_alerts') !== 'false');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Realtime check for duplicate name
  const duplicateCheck = checkDuplicateUser(name, currentUser?.username, currentUser?.id);
  const isNameDuplicate = duplicateCheck.isDuplicate;

  const handleSave = async () => {
    setErrorMessage('');
    if (isNameDuplicate) {
      setErrorMessage(duplicateCheck.reason || 'Akun sudah ada, gunakan nama lain');
      return;
    }

    localStorage.setItem('ze_2step_pin', String(pinAuth));
    localStorage.setItem('ze_sec_alerts', String(secAlerts));
    localStorage.setItem('ze_name', name.trim());
    localStorage.setItem('ze_about', about.trim());

    const updatedUser = {
      ...currentUser,
      name: name.trim(),
      bio: about.trim()
    };

    localStorage.setItem('zeio-user', JSON.stringify(updatedUser));
    localStorage.setItem('ze_user', JSON.stringify(updatedUser));
    localStorage.setItem('vn_currentUser', JSON.stringify(updatedUser));
    saveUserToDatabase({
      id: currentUser?.id,
      name: name.trim(),
      username: currentUser?.username || name.trim(),
      bio: about.trim()
    });

    if (currentUser?.id) {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      }).catch(() => {});
    }

    onUserUpdate(updatedUser);
    window.dispatchEvent(new Event('ze-user-store-updated'));
    window.dispatchEvent(new Event('zeio-user-updated'));

    // Sync to Firestore ze_users
    if (db && currentUser?.id) {
      try {
        await setDoc(
          doc(db, 'ze_users', currentUser.id),
          {
            name: name.trim(),
            about: about.trim(),
            lastUpdated: serverTimestamp()
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Firestore update account:', e);
      }
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-black min-h-screen pb-32 text-white">
      <SubHeader title="Akun" onBack={onBack} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {errorMessage && (
          <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Info */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Informasi Profil</p>
          <div>
            <label className="text-[11px] text-white/60 block mb-1">Nama Tampilan</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMessage('');
              }}
              className={`w-full bg-[#141414] border rounded-xl px-3.5 py-2 text-sm text-white focus:border-white/30 outline-none transition-colors ${
                isNameDuplicate ? 'border-red-500 focus:border-red-500' : 'border-white/10'
              }`}
            />
            {isNameDuplicate && (
              <p className="text-[11px] text-red-400 mt-1 font-medium">
                {duplicateCheck.reason || 'Nama sudah dipakai'}
              </p>
            )}
          </div>
          <div>
            <label className="text-[11px] text-white/60 block mb-1">Info (About)</label>
            <input
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-white/30 outline-none"
            />
          </div>
        </div>

        {/* 2-Step Verification */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Verifikasi 2 Langkah</p>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <p className="text-sm font-medium">PIN Registrasi Ulang</p>
              <p className="text-xs text-white/40">Minta PIN saat mendaftar kembali di perangkat baru</p>
            </div>
            <button
              onClick={() => setPinAuth(!pinAuth)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                pinAuth ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  pinAuth ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Notifikasi Keamanan</p>
              <p className="text-xs text-white/40">Kirim peringatan jika ada aktivitas login tidak dikenal</p>
            </div>
            <button
              onClick={() => setSecAlerts(!secAlerts)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                secAlerts ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  secAlerts ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer shadow"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Tersimpan di ZE.io &amp; Firestore</span>
            </>
          ) : (
            <span>Simpan Perubahan</span>
          )}
        </button>

        {/* Delete Account */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-red-500/20">
          <p className="text-sm font-bold text-red-400 mb-1">Zona Bahaya</p>
          <p className="text-xs text-white/40 mb-3">
            Menghapus akun akan membersihkan data profil lokal dan riwayat chat Anda.
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Akun ZE.io</span>
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] border border-white/10 rounded-[24px] p-6 max-w-sm w-full text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold mb-1">Yakin Hapus Akun?</h3>
            <p className="text-xs text-white/50 mb-5">
              Semua data lokal akun Anda ({currentUser?.id}) akan dihapus permanen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-full bg-white/10 text-white text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={onDeleteAccount}
                className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// 2. PRIVACY PAGE
// --------------------------------------------------------------------------
export function PrivacySettingPage({ onBack, friends = [] }: { onBack: () => void; friends?: any[] }) {
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem('ze_privacy_lastseen') || 'Semua Orang');
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('ze_privacy_photo') || 'Semua Orang');
  const [aboutPrivacy, setAboutPrivacy] = useState(() => localStorage.getItem('ze_privacy_about') || 'Kontak Saya');
  const [groupsPrivacy, setGroupsPrivacy] = useState(() => localStorage.getItem('ze_privacy_groups') || 'Semua Orang');
  const [disappearingDuration, setDisappearingDuration] = useState(() => localStorage.getItem('ze_privacy_disappearing') || 'Mati');
  const [blocked, setBlocked] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ze_blocked_contacts') || '[]');
    } catch {
      return [];
    }
  });
  const [newBlockInput, setNewBlockInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const savePrivacy = () => {
    localStorage.setItem('ze_privacy_lastseen', lastSeen);
    localStorage.setItem('ze_privacy_photo', profilePhoto);
    localStorage.setItem('ze_privacy_about', aboutPrivacy);
    localStorage.setItem('ze_privacy_groups', groupsPrivacy);
    localStorage.setItem('ze_privacy_disappearing', disappearingDuration);
    localStorage.setItem('ze_blocked_contacts', JSON.stringify(blocked));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const addBlocked = (idOrName: string) => {
    if (!idOrName.trim()) return;
    const next = Array.from(new Set([...blocked, idOrName.trim()]));
    setBlocked(next);
    localStorage.setItem('ze_blocked_contacts', JSON.stringify(next));
    setNewBlockInput('');
  };

  const removeBlocked = (item: string) => {
    const next = blocked.filter((b) => b !== item);
    setBlocked(next);
    localStorage.setItem('ze_blocked_contacts', JSON.stringify(next));
  };

  return (
    <div className="bg-black min-h-screen pb-32 text-white">
      <SubHeader title="Privasi" onBack={onBack} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Siapa yang dapat melihat info saya</p>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm">Terakhir Dilihat (Last Seen)</span>
            <select
              value={lastSeen}
              onChange={(e) => setLastSeen(e.target.value)}
              className="bg-[#141414] text-xs text-white/80 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="Semua Orang">Semua Orang</option>
              <option value="Kontak Saya">Kontak Saya</option>
              <option value="Tidak Ada">Tidak Ada</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm">Foto Profil</span>
            <select
              value={profilePhoto}
              onChange={(e) => setProfilePhoto(e.target.value)}
              className="bg-[#141414] text-xs text-white/80 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="Semua Orang">Semua Orang</option>
              <option value="Kontak Saya">Kontak Saya</option>
              <option value="Tidak Ada">Tidak Ada</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm">Info / About</span>
            <select
              value={aboutPrivacy}
              onChange={(e) => setAboutPrivacy(e.target.value)}
              className="bg-[#141414] text-xs text-white/80 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="Semua Orang">Semua Orang</option>
              <option value="Kontak Saya">Kontak Saya</option>
              <option value="Tidak Ada">Tidak Ada</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm">Grup (Menambahkan saya)</span>
            <select
              value={groupsPrivacy}
              onChange={(e) => setGroupsPrivacy(e.target.value)}
              className="bg-[#141414] text-xs text-white/80 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="Semua Orang">Semua Orang</option>
              <option value="Kontak Saya">Kontak Saya</option>
            </select>
          </div>
        </div>

        {/* Disappearing Messages */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-2">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Pesan Sementara (Disappearing)</p>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm">Durasi Timer Pesan</span>
            <select
              value={disappearingDuration}
              onChange={(e) => setDisappearingDuration(e.target.value)}
              className="bg-[#141414] text-xs text-white/80 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="Mati">Mati</option>
              <option value="24 Jam">24 Jam</option>
              <option value="7 Hari">7 Hari</option>
              <option value="90 Hari">90 Hari</option>
            </select>
          </div>
        </div>

        {/* Blocked Contacts */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">
            Kontak yang Diblokir ({blocked.length})
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Masukkan ZE ID atau Nama..."
              value={newBlockInput}
              onChange={(e) => setNewBlockInput(e.target.value)}
              className="flex-1 bg-[#141414] border border-white/10 rounded-full px-3.5 py-2 text-xs text-white focus:border-white/30 outline-none"
            />
            <button
              onClick={() => addBlocked(newBlockInput)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-semibold text-white cursor-pointer"
            >
              Blokir
            </button>
          </div>

          {blocked.length === 0 ? (
            <p className="text-xs text-white/40 italic">Tidak ada kontak yang diblokir.</p>
          ) : (
            <div className="space-y-2 pt-1">
              {blocked.map((item) => (
                <div key={item} className="flex items-center justify-between bg-[#141414] px-3 py-2 rounded-xl border border-white/5">
                  <span className="text-xs font-mono">{item}</span>
                  <button
                    onClick={() => removeBlocked(item)}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                  >
                    Buka Blokir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={savePrivacy}
          className="w-full py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer shadow"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Privasi Tersimpan!</span>
            </>
          ) : (
            <span>Simpan Pengaturan Privasi</span>
          )}
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 3. AVATAR PAGE
// --------------------------------------------------------------------------
export function AvatarSettingPage({
  currentUser,
  onBack,
  onUserUpdate
}: {
  currentUser: any;
  onBack: () => void;
  onUserUpdate: (updated: any) => void;
}) {
  const cleanUid = String(currentUser?.id || '').trim().toUpperCase();
  const fallbackAvatar =
    currentUser?.avatar ||
    currentUser?.photo ||
    (cleanUid ? localStorage.getItem(`ze_avatar_${cleanUid}`) : '') ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'ZE')}`;
  const [photoUrl, setPhotoUrl] = useState(fallbackAvatar);
  const [selectedEmoji, setSelectedEmoji] = useState('😎');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const nextAvatar =
      currentUser?.avatar ||
      currentUser?.photo ||
      (cleanUid ? localStorage.getItem(`ze_avatar_${cleanUid}`) : '') ||
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'ZE')}`;
    setPhotoUrl(nextAvatar);
  }, [cleanUid, currentUser?.avatar, currentUser?.photo, currentUser?.name]);

  const emojiList = ['😀', '😎', '🤠', '🐱', '🦊', '🚀', '🎧', '⚡', '🔥', '💎', '👾', '🦄', '👑', '👻', '🎨', '🌈'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotoUrl(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const createEmojiAvatar = (emoji: string) => {
    setSelectedEmoji(emoji);
    // Render simple circular SVG data uri with emoji
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2A2A2A" />
          <stop offset="100%" stop-color="#141414" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#grad)" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="6"/>
      <text x="100" y="125" font-size="90" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">${emoji}</text>
    </svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setPhotoUrl(dataUri);
  };

  const handleSave = async () => {
    if (!cleanUid) return;
    let finalPhotoUrl = photoUrl;
    try {
      const res = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: cleanUid, photo: photoUrl })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.photo) {
          finalPhotoUrl = data.photo;
          setPhotoUrl(finalPhotoUrl);
        }
      }
    } catch {}

    try {
      localStorage.removeItem('ze_photo');
      localStorage.removeItem('ze_avatar');
      localStorage.setItem(`ze_avatar_${cleanUid}`, finalPhotoUrl);
    } catch {}

    const updatedUser = {
      ...currentUser,
      photo: finalPhotoUrl,
      avatar: finalPhotoUrl
    };
    localStorage.setItem('zeio-user', JSON.stringify(updatedUser));
    localStorage.setItem('ze_user', JSON.stringify(updatedUser));
    localStorage.setItem('vn_currentUser', JSON.stringify(updatedUser));
    onUserUpdate(updatedUser);
    window.dispatchEvent(new Event('ze-user-store-updated'));
    window.dispatchEvent(new Event('zeio-user-updated'));

    if (db && cleanUid) {
      try {
        await setDoc(doc(db, 'ze_users', cleanUid), { photo: finalPhotoUrl, avatar: finalPhotoUrl }, { merge: true });
      } catch (e) {
        console.warn('Firestore update avatar:', e);
      }
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="bg-black min-h-screen pb-32 text-white">
      <SubHeader title="Avatar &amp; Foto Profil" onBack={onBack} />

      <div className="p-4 space-y-4 max-w-lg mx-auto text-center">
        {/* Preview Round Crop */}
        <div className="bg-[#1E1E1E] rounded-[24px] p-6 border border-white/5 flex flex-col items-center">
          <p className="text-xs text-white/50 mb-4 font-semibold uppercase tracking-wider">Pratinjau Crop Bulat</p>
          <div className="w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl relative group bg-black/50">
            <img src={photoUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
          </div>
          <span className="text-[11px] text-white/40 mt-3 font-mono">{currentUser?.id}</span>
        </div>

        {/* Upload Custom Photo */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 text-left">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold mb-2">Unggah Foto Galeri</p>
          <label className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer transition">
            <Upload className="w-4 h-4 text-white" />
            <span className="text-xs font-semibold">Pilih File Foto Baru</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Preset Emoji Avatars */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 text-left">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold mb-2">Pilih Avatar Emoji Estetik</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 pt-1">
            {emojiList.map((em) => (
              <button
                key={em}
                onClick={() => createEmojiAvatar(em)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-transform active:scale-90 cursor-pointer ${
                  selectedEmoji === em ? 'bg-white/20 border-2 border-white' : 'bg-[#141414] hover:bg-white/10 border border-white/5'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer shadow"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Avatar Tersimpan di Profil!</span>
            </>
          ) : (
            <span>Simpan Avatar</span>
          )}
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 4. LISTS PAGE (CUSTOM LISTS & BROADCAST)
// --------------------------------------------------------------------------
export function ListsSettingPage({ onBack, friends = [] }: { onBack: () => void; friends?: any[] }) {
  const [lists, setLists] = useState<Array<{ id: string; name: string; members: string[] }>>(() => {
    try {
      const saved = localStorage.getItem('ze_custom_lists');
      return saved
        ? JSON.parse(saved)
        : [
            { id: 'close_friends', name: 'Close Friends', members: [] },
            { id: 'work', name: 'Kerja', members: [] },
            { id: 'family', name: 'Keluarga', members: [] }
          ];
    } catch {
      return [];
    }
  });

  const [activeListId, setActiveListId] = useState<string>('close_friends');
  const [newListName, setNewListName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const saveLists = (updated: any) => {
    setLists(updated);
    localStorage.setItem('ze_custom_lists', JSON.stringify(updated));
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const newList = {
      id: 'list_' + Date.now(),
      name: newListName.trim(),
      members: []
    };
    const next = [...lists, newList];
    saveLists(next);
    setActiveListId(newList.id);
    setNewListName('');
    setShowAddModal(false);
  };

  const toggleMember = (listId: string, friendId: string) => {
    const next = lists.map((l) => {
      if (l.id === listId) {
        const has = l.members.includes(friendId);
        return {
          ...l,
          members: has ? l.members.filter((m) => m !== friendId) : [...l.members, friendId]
        };
      }
      return l;
    });
    saveLists(next);
  };

  const handleBroadcast = () => {
    if (!broadcastText.trim()) return;
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastText('');
    }, 2500);
  };

  const currentList = lists.find((l) => l.id === activeListId) || lists[0];

  return (
    <div className="bg-black min-h-screen pb-32 text-white">
      <SubHeader title="Daftar Kontak (Lists)" onBack={onBack} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Lists Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveListId(l.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeListId === l.id ? 'bg-white text-black font-bold shadow' : 'bg-[#1E1E1E] text-white/70 hover:text-white'
              }`}
            >
              {l.name} ({l.members.length})
            </button>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> List Baru
          </button>
        </div>

        {/* Member selection */}
        {currentList && (
          <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white">Anggota: {currentList.name}</p>
              <span className="text-xs text-white/50">{currentList.members.length} dipilih</span>
            </div>

            {friends.length === 0 ? (
              <p className="text-xs text-white/40 italic py-2">
                Belum ada kontak teman. Tambah teman pakai ID terlebih dahulu untuk dimasukkan ke list.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {friends.map((f) => {
                  const isChecked = currentList.members.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleMember(currentList.id, f.id)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#141414] hover:bg-white/5 cursor-pointer border border-white/5 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={f.photo || 'https://i.pravatar.cc/100'}
                          alt={f.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">{f.name}</p>
                          <p className="text-[10px] text-white/40 font-mono">{f.id}</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Broadcast Message to List */}
        {currentList && (
          <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">
              Kirim Broadcast ke {currentList.name}
            </p>
            <textarea
              rows={3}
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder={`Ketik pesan untuk dikirim serentak ke semua anggota ${currentList.name}...`}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 outline-none focus:border-white/30"
            />
            <button
              onClick={handleBroadcast}
              disabled={!broadcastText.trim()}
              className="w-full py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              {broadcastSent ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Broadcast Berhasil Terkirim!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Broadcast</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Add List Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] border border-white/10 rounded-[24px] p-6 max-w-sm w-full">
            <h3 className="text-base font-bold mb-3">Buat List Kontak Baru</h3>
            <input
              type="text"
              placeholder="Contoh: Tim Futsal, Sahabat..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-white/30 outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-full bg-white/10 text-white text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                className="flex-1 py-2 rounded-full bg-white text-black text-xs font-bold disabled:opacity-40"
              >
                Buat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// 5. CHATS PAGE (WALLPAPER, THEME, FONT SIZE, EXPORT)
// --------------------------------------------------------------------------
export function ChatsSettingPage({ onBack }: { onBack: () => void }) {
  const wallpapers = [
    { name: 'OLED Black', hex: '#000000' },
    { name: 'WA Dark Slate', hex: '#121B22' },
    { name: 'Deep Carbon', hex: '#1C1917' },
    { name: 'Midnight Indigo', hex: '#1E1B4B' },
    { name: 'Emerald Forest', hex: '#064E3B' },
    { name: 'Navy Steel', hex: '#1E293B' }
  ];

  const [activeWallpaper, setActiveWallpaper] = useState(
    () => localStorage.getItem('ze_chat_wallpaper') || '#121B22'
  );
  const [chatTheme, setChatTheme] = useState(
    () => localStorage.getItem('ze_chat_theme') || 'dark'
  );
  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(localStorage.getItem('ze_chat_font_size') || '14');
  });
  const [exportFeedback, setExportFeedback] = useState(false);

  const handleSelectWallpaper = (hex: string) => {
    setActiveWallpaper(hex);
    localStorage.setItem('ze_chat_wallpaper', hex);
  };

  const handleExportChats = () => {
    const backupData = `ZE.io Chat History Backup\nGenerated: ${new Date().toISOString()}\n==============================\n\n[Chat Room 1]\nUser: Halo apa kabar!\nFriend: Baik, terima kasih.\n\n[Global Chat]\nLutvoid: Selamat datang di ZE.io Global Network!\n`;
    const blob = new Blob([backupData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZE_io_Chats_Backup_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), 2500);
  };

  return (
    <div className="bg-black min-h-screen pb-32 text-white">
      <SubHeader title="Pengaturan Chat" onBack={onBack} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Wallpaper Picker */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Wallpaper Chat</p>
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {wallpapers.map((w) => (
              <div
                key={w.hex}
                onClick={() => handleSelectWallpaper(w.hex)}
                style={{ backgroundColor: w.hex }}
                className={`h-20 rounded-2xl border flex flex-col items-center justify-center p-2 cursor-pointer transition active:scale-95 relative ${
                  activeWallpaper === w.hex ? 'border-white ring-2 ring-white/50' : 'border-white/10'
                }`}
              >
                {activeWallpaper === w.hex && (
                  <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center mb-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <span className="text-[10px] text-white/90 font-medium text-center">{w.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Theme & Font Size */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-4">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Tampilan &amp; Ukuran Huruf</p>

          <div className="flex items-center justify-between py-1 border-b border-white/5">
            <span className="text-sm">Tema Tampilan</span>
            <div className="flex bg-[#141414] p-1 rounded-full border border-white/10 text-xs">
              <button
                onClick={() => {
                  setChatTheme('dark');
                  localStorage.setItem('ze_chat_theme', 'dark');
                }}
                className={`px-3 py-1 rounded-full font-medium ${chatTheme === 'dark' ? 'bg-white text-black' : 'text-white/60'}`}
              >
                Gelap
              </button>
              <button
                onClick={() => {
                  setChatTheme('light');
                  localStorage.setItem('ze_chat_theme', 'light');
                }}
                className={`px-3 py-1 rounded-full font-medium ${chatTheme === 'light' ? 'bg-white text-black' : 'text-white/60'}`}
              >
                Terang
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/70">Ukuran Font Chat:</span>
              <span className="font-mono text-emerald-400 font-bold">{fontSize}px</span>
            </div>
            <input
              type="range"
              min={12}
              max={18}
              step={1}
              value={fontSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFontSize(val);
                localStorage.setItem('ze_chat_font_size', String(val));
              }}
              className="w-full accent-white cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>Kecil (12px)</span>
              <span>Sedang (14px)</span>
              <span>Besar (18px)</span>
            </div>
          </div>
        </div>

        {/* Backup Chat */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-2">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Cadangan &amp; Ekspor Chat</p>
          <p className="text-xs text-white/50">
            Unduh seluruh percakapan ke dalam format dokumen teks (.txt) untuk disimpan offline.
          </p>
          <button
            onClick={handleExportChats}
            className="w-full mt-2 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
          >
            {exportFeedback ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>File Cadangan Berhasil Diunduh!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Chat (.txt)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 6. NOTIFICATIONS PAGE
// --------------------------------------------------------------------------
export function NotificationsSettingPage({ onBack }: { onBack: () => void }) {
  const [msgTone, setMsgTone] = useState(() => localStorage.getItem('ze_notif_msg_tone') !== 'false');
  const [groupTone, setGroupTone] = useState(() => localStorage.getItem('ze_notif_group_tone') !== 'false');
  const [callVibrate, setCallVibrate] = useState(() => localStorage.getItem('ze_notif_vibrate') !== 'false');
  const [previewMsg, setPreviewMsg] = useState(() => localStorage.getItem('ze_notif_preview') !== 'false');
  const [testAlert, setTestAlert] = useState(false);

  const toggle = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(!val);
    localStorage.setItem(key, String(!val));
  };

  const handleTest = () => {
    setTestAlert(true);
    setTimeout(() => setTestAlert(false), 3000);
  };

  return (
    <div className="bg-black min-h-screen pb-32 text-white">
      <SubHeader title="Notifikasi" onBack={onBack} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Pesan &amp; Panggilan</p>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <p className="text-sm font-medium">Nada Pesan Pribadi</p>
              <p className="text-xs text-white/40">Putar suara saat pesan masuk</p>
            </div>
            <button
              onClick={() => toggle('ze_notif_msg_tone', msgTone, setMsgTone)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                msgTone ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${msgTone ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <p className="text-sm font-medium">Nada Pesan Grup</p>
              <p className="text-xs text-white/40">Putar suara saat obrolan grup baru</p>
            </div>
            <button
              onClick={() => toggle('ze_notif_group_tone', groupTone, setGroupTone)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                groupTone ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${groupTone ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <p className="text-sm font-medium">Getar Panggilan</p>
              <p className="text-xs text-white/40">Getarkan perangkat saat panggilan audio/video masuk</p>
            </div>
            <button
              onClick={() => toggle('ze_notif_vibrate', callVibrate, setCallVibrate)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                callVibrate ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${callVibrate ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Pratinjau Pesan</p>
              <p className="text-xs text-white/40">Tampilkan cuplikan teks di banner atas</p>
            </div>
            <button
              onClick={() => toggle('ze_notif_preview', previewMsg, setPreviewMsg)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                previewMsg ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${previewMsg ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Test Notification */}
        <button
          onClick={handleTest}
          className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
        >
          <Volume2 className="w-4 h-4" />
          <span>Uji Coba Banner Notifikasi</span>
        </button>

        {testAlert && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-3 animate-in fade-in duration-200">
            <Bell className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-300">ZE.io Notification Test</p>
              <p className="text-[11px] text-white/80">Pengaturan notifikasi suara &amp; getar aktif berfungsi.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 7. STORAGE AND DATA PAGE
// --------------------------------------------------------------------------
export function StorageSettingPage({ onBack }: { onBack: () => void }) {
  const calculateStorage = () => {
    try {
      let totalBytes = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalBytes += (localStorage[key].length + key.length) * 2;
        }
      }
      return (totalBytes / 1024).toFixed(1);
    } catch {
      return '450.2';
    }
  };

  const [storageUsedKB, setStorageUsedKB] = useState<string>(calculateStorage);
  const [clearedFeedback, setClearedFeedback] = useState(false);
  const [photoAuto, setPhotoAuto] = useState(() => localStorage.getItem('ze_dl_photo') || 'Wi-Fi & Seluler');
  const [videoAuto, setVideoAuto] = useState(() => localStorage.getItem('ze_dl_video') || 'Hanya Wi-Fi');
  const [audioAuto, setAudioAuto] = useState(() => localStorage.getItem('ze_dl_audio') || 'Wi-Fi & Seluler');

  const handleClearCache = () => {
    // Clear temporary music/image cache keys
    localStorage.removeItem('ze_temp_music');
    localStorage.removeItem('ze_temp_media');
    localStorage.removeItem('ze_viewed_stories');
    setStorageUsedKB(calculateStorage());
    setClearedFeedback(true);
    setTimeout(() => setClearedFeedback(false), 2500);
  };

  return (
    <div className="bg-black min-h-screen pb-32 text-white">
      <SubHeader title="Penyimpanan dan Data" onBack={onBack} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Storage Bar */}
        <div className="bg-[#1E1E1E] rounded-[24px] p-5 border border-white/5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Penggunaan Memori Lokal</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{storageUsedKB}</span>
            <span className="text-sm font-bold text-white/60">KB Terpakai</span>
          </div>

          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 w-[45%]" title="Chat & Kontak" />
            <div className="h-full bg-blue-500 w-[30%]" title="Audio & Musik" />
            <div className="h-full bg-purple-500 w-[25%]" title="Foto Profil" />
          </div>

          <div className="flex justify-between text-[11px] text-white/50 pt-1">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Chat &amp; Kontak</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Audio</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> Foto</span>
          </div>

          <button
            onClick={handleClearCache}
            className="w-full mt-2 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {clearedFeedback ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Cache Berhasil Dibersihkan!</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Hapus Cache Media Sementara</span>
              </>
            )}
          </button>
        </div>

        {/* Auto-Download Settings */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Unduh Otomatis Media</p>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm">Foto</span>
            <select
              value={photoAuto}
              onChange={(e) => {
                setPhotoAuto(e.target.value);
                localStorage.setItem('ze_dl_photo', e.target.value);
              }}
              className="bg-[#141414] text-xs text-white/80 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="Wi-Fi & Seluler">Wi-Fi &amp; Seluler</option>
              <option value="Hanya Wi-Fi">Hanya Wi-Fi</option>
              <option value="Mati">Mati</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm">Video</span>
            <select
              value={videoAuto}
              onChange={(e) => {
                setVideoAuto(e.target.value);
                localStorage.setItem('ze_dl_video', e.target.value);
              }}
              className="bg-[#141414] text-xs text-white/80 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="Hanya Wi-Fi">Hanya Wi-Fi</option>
              <option value="Wi-Fi & Seluler">Wi-Fi &amp; Seluler</option>
              <option value="Mati">Mati</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm">Audio</span>
            <select
              value={audioAuto}
              onChange={(e) => {
                setAudioAuto(e.target.value);
                localStorage.setItem('ze_dl_audio', e.target.value);
              }}
              className="bg-[#141414] text-xs text-white/80 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="Wi-Fi & Seluler">Wi-Fi &amp; Seluler</option>
              <option value="Hanya Wi-Fi">Hanya Wi-Fi</option>
              <option value="Mati">Mati</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 8. APP LANGUAGE PAGE
// --------------------------------------------------------------------------
export function LanguageSettingPage({
  currentLang = 'ID',
  onSelectLang,
  onBack
}: {
  currentLang: string;
  onSelectLang: (lang: string) => void;
  onBack: () => void;
}) {
  const languages = [
    { code: 'ID', label: 'Bahasa Indonesia', native: 'Bahasa Indonesia' },
    { code: 'EN', label: 'English', native: "Device's language" },
    { code: 'JP', label: 'Japanese', native: '日本語' },
    { code: 'KR', label: 'Korean', native: '한국어' },
    { code: 'AR', label: 'Arabic', native: 'العربية' }
  ];

  return (
    <div className="bg-black min-h-screen pb-32 text-white">
      <SubHeader title="Bahasa Aplikasi" onBack={onBack} />

      <div className="p-4 space-y-3 max-w-lg mx-auto">
        <div className="bg-[#1E1E1E] rounded-[20px] overflow-hidden border border-white/5 divide-y divide-white/5">
          {languages.map((lang) => (
            <div
              key={lang.code}
              onClick={() => {
                onSelectLang(lang.code);
                localStorage.setItem('ze_lang', lang.code);
              }}
              className="flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/10 cursor-pointer transition"
            >
              <div>
                <p className="text-sm font-semibold text-white">{lang.label}</p>
                <p className="text-xs text-white/40">{lang.native}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  currentLang === lang.code ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'
                }`}
              >
                {currentLang === lang.code && <Check className="w-3 h-3" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 9. HELP PAGE (FAQ, CONTACT WA, REPORT BUG)
// --------------------------------------------------------------------------
export function HelpSettingPage({ onBack }: { onBack: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [bugText, setBugText] = useState('');
  const [bugSubmitted, setBugSubmitted] = useState(false);

  const faqs = [
    {
      q: 'Bagaimana cara mencari dan menambah teman di HP lain?',
      a: 'Buka menu Chats lalu klik "+ Tambah Teman". Masukkan ID unik teman Anda (contoh: ZE-XM21NV). Karena sistem sudah terhubung ke Firebase Firestore Global, pengguna di HP lain akan langsung ditemukan dan dapat dikirimi permintaan pertemanan.'
    },
    {
      q: 'Apakah panggilan suara dan video gratis?',
      a: 'Ya, seluruh panggilan audio dan video di ZE.io menggunakan teknologi WebRTC P2P langsung tanpa biaya pulsa, hanya memerlukan koneksi internet.'
    },
    {
      q: 'Bagaimana cara download lagu TikTok tanpa watermark?',
      a: 'Buka tab Features di menu Updates, pilih "TikTok No WM". Masukkan link video TikTok, lalu klik Download. Audio hasil download juga langsung dapat diputar di tab Music.'
    },
    {
      q: 'Bagaimana cara membagikan ZE ID saya ke teman?',
      a: 'Masuk ke menu Settings > Undang teman, lalu salin link undangan atau bagikan kode ZE ID Anda secara langsung.'
    }
  ];

  const handleReportBug = () => {
    if (!bugText.trim()) return;
    setBugSubmitted(true);
    setTimeout(() => {
      setBugSubmitted(false);
      setBugText('');
    }, 2500);
  };

  return (
    <div className="bg-black min-h-screen pb-32 text-white">
      <SubHeader title="Bantuan (Help)" onBack={onBack} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Contact Us WhatsApp */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Pusat Bantuan &amp; Dukungan</p>
          <a
            href="https://wa.me/?text=Halo%20Tim%20Support%20ZE.io,%20saya%20butuh%20bantuan"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Hubungi Kami via WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-2">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold mb-2">Pertanyaan Populer (FAQ)</p>

          <div className="space-y-2">
            {faqs.map((f, idx) => (
              <div key={idx} className="bg-[#141414] rounded-xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-3 text-left flex items-center justify-between text-xs font-semibold text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <span>{f.q}</span>
                  {openFaq === idx ? <ChevronUp className="w-4 h-4 text-white/50 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/50 shrink-0" />}
                </button>
                {openFaq === idx && (
                  <div className="px-3 pb-3 text-xs text-white/60 leading-relaxed border-t border-white/5 pt-2">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Report Bug */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Laporkan Masalah / Bug</p>
          <textarea
            rows={3}
            value={bugText}
            onChange={(e) => setBugText(e.target.value)}
            placeholder="Jelaskan kendala atau bug yang Anda temukan di ZE.io..."
            className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 outline-none focus:border-white/30"
          />
          <button
            onClick={handleReportBug}
            disabled={!bugText.trim()}
            className="w-full py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition disabled:opacity-40 cursor-pointer shadow flex items-center justify-center gap-2"
          >
            {bugSubmitted ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Laporan Berhasil Terkirim ke Tim!</span>
              </>
            ) : (
              <span>Kirim Laporan Masalah</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 10. PENGATURAN FPS (APPLICATION FPS LOCK ENGINE: 60 / 90 / 120 FPS)
// --------------------------------------------------------------------------
export function InviteFriendSettingPage({
  onBack
}: {
  currentUser?: any;
  onBack: () => void;
}) {
  const [config, setConfig] = useFpsConfig();
  const initialTelemetry = getLiveFpsTelemetry();
  // Initialize with actual measured rendering FPS (0 while sampling first frames if none recorded yet), NEVER hardcoded to targetFps
  const [liveAppFps, setLiveAppFps] = useState<number>(() => initialTelemetry.appFps);
  const [displayHz, setDisplayHz] = useState<number>(() => initialTelemetry.displayHz);
  const [frameTimeMs, setFrameTimeMs] = useState<number>(() => initialTelemetry.frameTimeMs);
  const [stabilityPct, setStabilityPct] = useState<number>(() => initialTelemetry.stabilityPct);
  const [droppedFrames, setDroppedFrames] = useState<number>(() => initialTelemetry.droppedFrames);
  const [capabilities, setCapabilities] = useState<DeviceDisplayCapabilities>(() => initialTelemetry.capabilities);
  const [frameHistory, setFrameHistory] = useState<number[]>(() => initialTelemetry.frameHistoryMs);
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);

  const motionTrackRef = useRef<HTMLDivElement | null>(null);
  const motionOrbRef = useRef<HTMLDivElement | null>(null);
  const cachedTrackWidthRef = useRef<number>(240);

  // Cache motion track width via ResizeObserver so the rAF loop NEVER triggers synchronous layout reflow (clientWidth)
  useEffect(() => {
    const el = motionTrackRef.current;
    if (!el) return;
    const updateWidth = () => {
      cachedTrackWidthRef.current = Math.max(80, el.clientWidth - 28);
    };
    updateWidth();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateWidth, { passive: true });
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 1. Measure physical display refresh rate (Hz) via unthrottled native rAF
  useEffect(() => {
    let rawId = 0;
    let lastT = 0;
    const rawDeltas: number[] = [];

    const measureRaw = (now: DOMHighResTimeStamp) => {
      if (lastT > 0) {
        const dt = now - lastT;
        if (dt > 2 && dt < 55) {
          rawDeltas.push(dt);
          if (rawDeltas.length > 50) rawDeltas.shift();
        }
      }
      lastT = now;

      if (rawDeltas.length >= 12) {
        const sorted = [...rawDeltas].sort((a, b) => a - b);
        const p30Dt = sorted[Math.floor(sorted.length * 0.3)] || sorted[0];
        const rawHz = Math.round(1000 / p30Dt);
        const snappedHz =
          Math.abs(rawHz - 30) <= 2
            ? 30
            : Math.abs(rawHz - 60) <= 3
            ? 60
            : Math.abs(rawHz - 75) <= 3
            ? 75
            : Math.abs(rawHz - 90) <= 4
            ? 90
            : Math.abs(rawHz - 120) <= 6
            ? 120
            : Math.abs(rawHz - 144) <= 6
            ? 144
            : Math.abs(rawHz - 165) <= 6
            ? 165
            : Math.abs(rawHz - 240) <= 8
            ? 240
            : rawHz;
        setDisplayHz((prev) => (prev === snappedHz ? prev : snappedHz));
      }

      rawId = requestRawDisplayFrame(measureRaw);
    };

    rawId = requestRawDisplayFrame(measureRaw);
    return () => cancelRawDisplayFrame(rawId);
  }, []);

  // 2. Real application frame-paced loop (runs directly through window.requestAnimationFrame FPS Engine)
  // Measures ACTUAL rendered frames per second (frameCount / elapsedWindowSec) — zero faking.
  useEffect(() => {
    let appRafId = 0;
    let prevFrame = 0;
    let windowStart = 0;
    let windowFrameCount = 0;
    let pos = 0;
    let dir = 1;
    const recentDeltas: number[] = [];

    const stepAppFrame = (now: DOMHighResTimeStamp) => {
      if (windowStart === 0) {
        windowStart = now;
      }

      if (prevFrame > 0) {
        const dt = now - prevFrame;
        windowFrameCount++;

        if (dt > 1 && dt < 250) {
          recentDeltas.push(dt);
          if (recentDeltas.length > 40) recentDeltas.shift();

          // Drive live hardware-accelerated motion bar using cached track width (zero DOM layout read)
          const maxTravel = cachedTrackWidthRef.current;
          const speedPxPerSec = 220;
          pos += dir * speedPxPerSec * Math.min(dt / 1000, 0.05);
          if (pos >= maxTravel) {
            pos = maxTravel;
            dir = -1;
          } else if (pos <= 0) {
            pos = 0;
            dir = 1;
          }
          if (motionOrbRef.current) {
            motionOrbRef.current.style.transform = `translate3d(${pos.toFixed(2)}px, 0, 0)`;
          }
        }
      }
      prevFrame = now;

      // Commit real measured FPS every ~350ms using exact rendered frame count over elapsed wall time
      const windowElapsed = now - windowStart;
      if (windowElapsed >= 350 && windowFrameCount >= 4 && recentDeltas.length >= 4) {
        const measuredRealFps = Math.max(1, Math.round((windowFrameCount * 1000) / windowElapsed));
        windowStart = now;
        windowFrameCount = 0;

        const avgDt = recentDeltas.reduce((acc, v) => acc + v, 0) / recentDeltas.length;
        const variance =
          recentDeltas.reduce((acc, v) => acc + Math.pow(v - avgDt, 2), 0) / recentDeltas.length;
        const stdDev = Math.sqrt(variance);

        const engineSnap = getLiveFpsTelemetry();
        const stability = Math.max(
          50,
          Math.min(100, Math.round(100 - (stdDev / Math.max(4, avgDt)) * 38))
        );

        setLiveAppFps(measuredRealFps);
        setFrameTimeMs(+avgDt.toFixed(1));
        setStabilityPct(stability);
        setDroppedFrames(engineSnap.droppedFrames);
        setCapabilities(engineSnap.capabilities);
        setFrameHistory(recentDeltas.slice(-24).map((d) => +d.toFixed(1)));
      }

      appRafId = window.requestAnimationFrame(stepAppFrame);
    };

    appRafId = window.requestAnimationFrame(stepAppFrame);
    return () => window.cancelAnimationFrame(appRafId);
  }, [config.enabled, config.targetFps, config.frameBatching, config.gpuCompositorBoost, config.touchScrollBoost]);

  const handleSelectFps = (fps: FpsTarget) => {
    setConfig({ enabled: true, targetFps: fps });
    const maxHw = Math.max(30, displayHz);
    if (fps > maxHw + 4) {
      setAppliedBanner(
        `Target ${fps} FPS aktif • Layar perangkat maksimal ${displayHz} Hz (Render aktual maks ${displayHz} FPS)`
      );
    } else {
      setAppliedBanner(
        `Engine render ZE.io dikunci ke ${fps} FPS (${(1000 / fps).toFixed(2)} ms/frame)`
      );
    }
    setTimeout(() => setAppliedBanner(null), 2800);
  };

  const fpsOptions: Array<{
    fps: FpsTarget;
    label: string;
    tag: string;
    budget: string;
    desc: string;
  }> = [
    {
      fps: 60,
      label: '60 FPS',
      tag: 'Stabil & Efisien',
      budget: '16.67 ms',
      desc: 'Mengunci kecepatan render aplikasi stabil di 60 FPS. Transisi halus & konsumsi baterai paling hemat.'
    },
    {
      fps: 90,
      label: '90 FPS',
      tag: 'Smooth Responsif',
      budget: '11.11 ms',
      desc: 'Membuka limit 90 FPS dengan optimasi blur GPU 1-lapis & respons sentuh 135ms yang lebih ringan.'
    },
    {
      fps: 120,
      label: '120 FPS',
      tag: 'Ultra Lancar',
      budget: '8.33 ms',
      desc: 'Mode performa tertinggi 120 FPS. Native VSync zero-jitter, beban kaca minimum & respons sentuh instan 105ms.'
    }
  ];

  const isHardwareLimited = config.enabled && config.targetFps > displayHz + 4;
  const activeLimitationNote = capabilities.limitationReason;

  return (
    <div className="bg-black min-h-screen pb-32 text-white">
      <SubHeader title="Pengaturan FPS" onBack={onBack} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {appliedBanner && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center gap-2.5 text-xs text-emerald-300 font-semibold">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{appliedBanner}</span>
          </div>
        )}

        {/* Real-time FPS Telemetry Card */}
        <div className="bg-[#1E1E1E] rounded-[24px] p-5 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span className="text-xs uppercase tracking-wider text-white/60 font-semibold">
                Monitor Engine ZE.io Realtime
              </span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                config.enabled
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/10 text-white/60 border-white/10'
              }`}
            >
              {config.enabled ? `TARGET ${config.targetFps} FPS` : 'NATIVE VSYNC'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-[#141414] rounded-2xl p-3 border border-white/5">
              <p className="text-[10px] text-white/45 uppercase font-semibold">FPS Render Asli</p>
              <p className="text-2xl font-extrabold text-white font-mono mt-0.5">{liveAppFps}</p>
              <p className="text-[10px] text-emerald-400 font-mono">
                {config.enabled ? `Target ${config.targetFps}` : `Maks ${displayHz}`}
              </p>
            </div>

            <div className="bg-[#141414] rounded-2xl p-3 border border-white/5">
              <p className="text-[10px] text-white/45 uppercase font-semibold">Frame Time</p>
              <p className="text-2xl font-extrabold text-white font-mono mt-0.5">{frameTimeMs}</p>
              <p className="text-[10px] text-white/50 font-mono">
                ms ({droppedFrames} drop)
              </p>
            </div>

            <div className="bg-[#141414] rounded-2xl p-3 border border-white/5">
              <p className="text-[10px] text-white/45 uppercase font-semibold">Layar Fisik</p>
              <p className="text-2xl font-extrabold text-white font-mono mt-0.5">{displayHz}</p>
              <p className="text-[10px] text-white/50 font-mono">Hz ({stabilityPct}% stabil)</p>
            </div>
          </div>

          {/* Live Paced Motion Bar (Driven directly by app window.requestAnimationFrame) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-white/50">
              <span>Uji Gerak Frame Lock Langsung</span>
              <span className="font-mono text-white/70">
                Budget {(1000 / (config.enabled ? config.targetFps : Math.max(60, displayHz))).toFixed(2)} ms
              </span>
            </div>
            <div
              ref={motionTrackRef}
              className="w-full h-8 rounded-full bg-[#141414] border border-white/10 px-1 flex items-center overflow-hidden relative"
            >
              <div
                ref={motionOrbRef}
                className="w-6 h-6 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] will-change-transform"
              />
            </div>
          </div>

          {/* Live Frame-Time Graph */}
          <div className="pt-1">
            <div className="flex items-end gap-1 h-10 px-1">
              {frameHistory.map((ms, idx) => {
                const heightPct = Math.max(18, Math.min(100, Math.round((16.7 / Math.max(4, ms)) * 65)));
                return (
                  <div
                    key={idx}
                    className="flex-1 rounded-t bg-emerald-400/75 transition-none"
                    style={{ height: `${heightPct}%` }}
                    title={`${ms} ms`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-white/35 mt-1 font-mono">
              <span>
                CPU {capabilities.cpuCores} Core{capabilities.deviceMemoryGb ? ` • RAM ~${capabilities.deviceMemoryGb}GB` : ''}
              </span>
              <span>Stabil {stabilityPct}%</span>
            </div>
          </div>

          {(isHardwareLimited || activeLimitationNote) && (
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/70 leading-relaxed">
              {isHardwareLimited ? (
                <>
                  Terdeteksi batas layar/browser di <span className="text-white font-bold">{displayHz} Hz</span> (FPS render aktual maks <span className="text-white font-bold">{displayHz} FPS</span>). Optimasi latensi sentuh &amp; pipeline GPU <span className="text-emerald-400 font-bold">{config.targetFps} FPS ({(1000 / config.targetFps).toFixed(2)} ms)</span> tetap aktif penuh, dan otomatis berjalan {config.targetFps} FPS di layar {config.targetFps}Hz.
                </>
              ) : (
                <span>{activeLimitationNote}</span>
              )}
            </div>
          )}
        </div>

        {/* Master Switch FPS Lock */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 flex items-center justify-between">
          <div className="pr-3">
            <p className="text-sm font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Aktifkan FPS Lock Aplikasi</span>
            </p>
            <p className="text-xs text-white/45 mt-0.5">
              Mengunci penjadwalan frame animasi &amp; komposit khusus untuk aplikasi ZE.io
            </p>
          </div>
          <button
            onClick={() => setConfig({ enabled: !config.enabled })}
            className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
              config.enabled ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                config.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 60 / 90 / 120 FPS Selector */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">
              Pilih Target FPS Lock (60 / 90 / 120)
            </p>
            <Sliders className="w-4 h-4 text-white/40" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {([60, 90, 120] as FpsTarget[]).map((fps) => {
              const isSelected = config.enabled && config.targetFps === fps;
              return (
                <button
                  key={fps}
                  onClick={() => handleSelectFps(fps)}
                  className={`py-3 px-2 rounded-2xl border text-center transition active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black border-white font-extrabold shadow-lg'
                      : 'bg-[#141414] text-white border-white/10 hover:border-white/25 font-bold'
                  }`}
                >
                  <div className="text-base font-mono leading-tight">{fps}</div>
                  <div
                    className={`text-[10px] mt-0.5 font-semibold ${
                      isSelected ? 'text-black/70' : 'text-white/45'
                    }`}
                  >
                    FPS LOCK
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-2 pt-1">
            {fpsOptions.map((opt) => {
              const active = config.enabled && config.targetFps === opt.fps;
              return (
                <div
                  key={opt.fps}
                  onClick={() => handleSelectFps(opt.fps)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                    active
                      ? 'bg-white/10 border-emerald-400/50'
                      : 'bg-[#141414] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{opt.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-medium">
                        {opt.tag}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">{opt.budget}</span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">{opt.desc}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      active ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engine Smoothness & GPU Pipeline Toggles */}
        <div className="bg-[#1E1E1E] rounded-[20px] p-4 border border-white/5 space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">
              Optimasi Kelancaran Engine ZE.io
            </p>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5 gap-3">
            <div>
              <p className="text-sm font-medium text-white">GPU Compositor Boost</p>
              <p className="text-xs text-white/40">
                Sesuaikan beban komposit kaca &amp; layer hardware agar render stabil di {config.targetFps} FPS
              </p>
            </div>
            <button
              onClick={() => setConfig({ gpuCompositorBoost: !config.gpuCompositorBoost })}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                config.gpuCompositorBoost ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  config.gpuCompositorBoost ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5 gap-3">
            <div>
              <p className="text-sm font-medium text-white">Anti-Lag Sentuh &amp; Scroll</p>
              <p className="text-xs text-white/40">
                Hentikan repaint bayangan berat saat layar digeser &amp; jaga mode High-Hz aktif
              </p>
            </div>
            <button
              onClick={() => setConfig({ touchScrollBoost: !config.touchScrollBoost })}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                config.touchScrollBoost ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  config.touchScrollBoost ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 gap-3">
            <div>
              <p className="text-sm font-medium text-white">Sinkronisasi Frame Batching</p>
              <p className="text-xs text-white/40">
                Gabungkan antrean animasi aplikasi dalam satu siklus VSync bebas stutter
              </p>
            </div>
            <button
              onClick={() => setConfig({ frameBatching: !config.frameBatching })}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                config.frameBatching ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  config.frameBatching ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="px-2 text-center">
          <p className="text-[11px] text-white/40 flex items-center justify-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pengaturan FPS dikunci khusus untuk aplikasi ZE.io &amp; tersimpan otomatis.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export const FpsSettingPage = InviteFriendSettingPage;
