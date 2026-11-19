/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Phone,
  PhoneCall,
  PhoneOff,
  Users,
  MessageCircle,
  User,
  Plus,
  Search,
  ChevronDown,
  SquarePen,
  ArrowLeft,
  Send,
  Camera,
  Paperclip,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Copy,
  Bell,
  Settings,
  LogOut,
  Video,
  Play,
  Pause,
  X,
  Volume2,
  VolumeX,
  Share2,
  Edit3,
  UserPlus,
  Music,
  Heart,
  Film,
  Bot,
  Globe,
  Youtube,
  Download,
  ExternalLink,
  RefreshCw,
  Info,
  MoreVertical,
  ShieldAlert,
  Bug,
  Terminal,
  Radio,
  AlertCircle,
  Zap,
  Flame,
  UserCheck,
  UserX,
  Trash2,
  Smile,
  Layers,
  Link,
  Key,
  Lock,
  List,
  Database,
  HelpCircle,
  QrCode,
  Loader2,
  Crown,
  ShoppingCart,
  FileCode2,
  Menu,
  LayoutGrid,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Clock,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff
} from 'lucide-react';

import LutvoidBugSystem from './components/LutvoidBugSystem.tsx';
import { MusicLabPage } from './components/MusicLabPage.tsx';
import { TikTokDownloaderPage } from './components/TikTokDownloaderPage.tsx';
import { StoryViewerModal, GroupedUserStory, StoryItem } from './components/StoryViewer.tsx';
import { AddStoryModal } from './components/AddStoryModal.tsx';
import { AddFriendByIdModal } from './components/AddFriendByIdModal.tsx';
import { ChatsManagerView } from './components/ChatsManagerView.tsx';
import { WhiteEmojiPicker, StickerPicker, renderMessageContent, StickerItem } from './components/EmojiStickerPicker.tsx';
import {
  AccountSettingPage,
  PrivacySettingPage,
  AvatarSettingPage,
  ListsSettingPage,
  ChatsSettingPage,
  NotificationsSettingPage,
  StorageSettingPage,
  LanguageSettingPage,
  HelpSettingPage,
  InviteFriendSettingPage
} from './components/SettingsSubpages.tsx';
import { ThemeGlobalSettingPage } from './components/ThemeGlobalSettingPage.tsx';
import { HomeAppearanceSettingPage } from './components/HomeAppearanceSettingPage.tsx';
import { HistoryPage } from './components/HistoryPage.tsx';
import VideoBackground from './components/VideoBackground.tsx';
import TikTokProfileView from './components/TikTokProfileView.tsx';
import YouPage from './YouPage.tsx';
import GroupChatPage from './pages/GroupChatPage.tsx';
import GlobalChatPage from './pages/GlobalChatPage.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import {
  DEFAULT_BOTTOM_NAV_ORDER,
  DEFAULT_FEATURE_ORDER,
  DEFAULT_SECTION_ORDER,
  getHomeThemeTokens,
  useHomeUiConfig,
  type BottomNavId,
  type HomeBlockId,
} from './contexts/homeUiConfig.ts';
import { RwHiddenMenu } from './components/RwHiddenMenu.tsx';
import { Palette } from 'lucide-react';
import { useMusic } from './contexts/MusicContext.tsx';
import { checkDuplicateUser, saveUserToDatabase, getAllUsers, clearUserStore, getStoredUser } from './contexts/userStore.ts';
import WinkHDPage from './components/WinkHDPage.tsx';
import { useFpsConfig } from './contexts/fpsEngine.ts';
import OwnerDashboardModal from './components/OwnerDashboardModal.tsx';
import KeyStoreModal from './components/KeyStoreModal.tsx';
import TopUpDiamondModal from './components/TopUpDiamondModal.tsx';
import { UserRoleBadge, isUserOwner, isUserAdmin } from './components/UserRoleBadge.tsx';
import { ActiveCallModal, CallSessionData } from './components/ActiveCallModal.tsx';
import { ZeAiExperience } from './components/ZeAiExperience.tsx';
import AppSidebar from './components/AppSidebar.tsx';
import FriendsPageView from './components/FriendsPageView.tsx';
import DiamondPlusIcon from './components/DiamondPlusIcon.tsx';
import LoginPanda, { PandaMood } from './components/LoginPanda.tsx';

// Custom useLocation hook for path-based BottomNav hiding & routing
export function useLocation() {
  const [pathname, setPathname] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('locationchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('locationchange', handleLocationChange);
    };
  }, []);

  return { pathname };
}

export function navigate(to: string, replace = false) {
  if (typeof window === 'undefined') return;
  if (replace) {
    window.history.replaceState(null, '', to);
  } else {
    window.history.pushState(null, '', to);
  }
  window.dispatchEvent(new Event('locationchange'));
}

// Firebase Firestore for real cross-device sync
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

import { db } from './firebase.ts';

// --------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------
interface UserProfile {
  id: string; // ZE-XXXXXX
  username: string; // @username
  name: string;
  pass?: string;
  password?: string;
  passwordHash?: string;
  photo?: string;
  avatar?: string;
  bio?: string;
  role?: string;
  isOwner?: boolean;
  isAdmin?: boolean;
  isVip?: boolean;
  vip?: boolean;
  vipLevel?: 'basic' | 'exclusive';
  isVipExclusive?: boolean;
  vipExpiresAt?: number;
  adminPermissions?: string[];
  isVerified?: boolean;
  joinedDate?: string;
  followers?: any;
  createdAt?: number;
  [key: string]: any;
}


interface UserStory {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  quality?: string;
  caption?: string;
  createdAt: number;
  expiresAt?: number;
  items?: StoryItem[];
}

interface UserNote {
  userId: string;
  userName?: string;
  userPhoto?: string;
  text: string;
  emoji: string;
  createdAt: number;
  expiresAt: number;
}

interface ChatItem {
  id: string; // chatId e.g. ZE-A_ZE-B or group_xxx
  chatId?: string;
  type?: 'direct' | 'group';
  groupName?: string;
  groupPhoto?: string;
  participants: string[];
  participantsInfo?: Record<string, { name: string; photo?: string }>;
  lastMessage: string;
  lastTime: number;
  unreadCount?: number;
}

interface ChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text?: string;
  type?: 'text' | 'image' | 'video' | 'sticker';
  mediaUrl?: string;
  createdAt: number;
}

interface FriendRequest {
  id: string;
  from: string;
  to: string;
  fromName?: string;
  fromUsername?: string;
  fromPhoto?: string;
  status: 'pending' | 'accepted' | 'rejected';
  time: number;
}

interface GroupItem {
  id: string;
  name: string;
  photo?: string;
  members: string[]; // user IDs
  admin: string;
  createdAt: number;
  description?: string;
}

interface CommunityItem {
  id: string;
  name: string;
  description: string;
  photo?: string;
  banner?: string;
  members: string[]; // user IDs
  createdAt: number;
}

// Preset tracks for Background Music Player
const MUSIC_TRACKS = [
  {
    id: 'lofi_1',
    title: 'Lofi Relax & Study Beat',
    artist: 'Lofi Records',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    lyrics: [
      { time: 0, text: 'Relax and let your mind float' },
      { time: 4, text: 'Soft melodies in the late night' },
      { time: 8, text: 'ZE.io ambient soundscapes' },
      { time: 13, text: 'Deep breathing, pure liquid peace' },
      { time: 18, text: 'Waves of tranquil glass energy' },
      { time: 23, text: 'Focus, connect, and unwind' },
      { time: 28, text: 'Lofi vibes across the world' },
    ]
  },
  {
    id: 'tiktok_viral',
    title: 'Viral Electronic Future Beat',
    artist: 'Trending Sound',
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
    lyrics: [
      { time: 0, text: 'Feel the future bass dropping' },
      { time: 3, text: 'Neon lights pulsing in sync' },
      { time: 7, text: 'High voltage rhythm on ZE.io' },
      { time: 11, text: 'Never stop the momentum' },
      { time: 15, text: 'Electro waves through the night' },
      { time: 20, text: 'Feel the heartbeat accelerate' },
    ]
  },
  {
    id: 'soundhelix_1',
    title: 'SoundHelix Acoustic Master',
    artist: 'SoundHelix Studio',
    streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    lyrics: [
      { time: 0, text: 'Acoustic harmony in the air' },
      { time: 4, text: 'Strings echoing through liquid glass' },
      { time: 9, text: 'Pure resonance and clarity' },
      { time: 14, text: 'The rhythm of endless nights' },
    ]
  }
];

// Helper: Compress image to canvas JPEG 400x400 max
function compressImage(file: File, maxWidth = 400, maxHeight = 400, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(ev.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(ev.target?.result as string);
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function generateZeId(): string {
  return 'ZE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function normalizeUser(u: any): UserProfile {
  if (!u) return u;
  let id = u.id;
  if (!id || typeof id === 'number' || !String(id).startsWith('ZE-')) {
    id = generateZeId();
  }
  let username = u.username;
  if (!username) {
    username = (u.name || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '') || ('user_' + String(id).slice(3).toLowerCase());
    if (username.length < 3) username = username + '_' + Math.floor(Math.random() * 100);
  }
  const isOwnerFlag = Boolean(
    u.isOwner ||
      u.owner ||
      u.role === 'owner' ||
      String(id).toUpperCase() === 'ZE-OWNER' ||
      String(username).toLowerCase() === 'ze.io'
  );
  const isAdminFlag = Boolean(!isOwnerFlag && (u.isAdmin || u.role === 'admin'));
  const vipExp = Number(u.vipExpiresAt || 0);
  const rawVipFlag = Boolean(
    u.isVip ||
      u.vip ||
      u.vipLevel === 'basic' ||
      u.vipLevel === 'exclusive' ||
      u.isVipExclusive === true
  );
  const isVipFlag = Boolean(isOwnerFlag || (rawVipFlag && (!vipExp || vipExp > Date.now())));
  const resolvedVipLevel: 'basic' | 'exclusive' | undefined = isOwnerFlag
    ? 'exclusive'
    : isVipFlag
    ? String(u.vipLevel || '').toLowerCase() === 'exclusive' || u.isVipExclusive === true
      ? 'exclusive'
      : 'basic'
    : undefined;
  const isVipExclusiveFlag = Boolean(isOwnerFlag || (isVipFlag && resolvedVipLevel === 'exclusive'));

  return {
    id: String(id),
    username: String(username).toLowerCase(),
    name: u.name || username,
    bio: u.bio || u.about || 'Hey there! I am using ZE.io.',
    photo: u.photo || u.avatar || '',
    avatar: u.avatar || u.photo || '',
    followers: u.followers || 0,
    createdAt: u.createdAt || Date.now(),
    joinedDate: u.joinedDate || 'October 2026',
    role: isOwnerFlag ? 'owner' : isAdminFlag ? 'admin' : u.role || 'user',
    isOwner: isOwnerFlag,
    isAdmin: isAdminFlag,
    isVip: isVipFlag,
    vip: isVipFlag,
    vipLevel: resolvedVipLevel,
    isVipExclusive: isVipExclusiveFlag,
    vipExpiresAt: vipExp || undefined,
    adminPermissions: Array.isArray(u.adminPermissions) ? u.adminPermissions : undefined,
    isVerified: Boolean(isOwnerFlag || u.isVerified || u.verified || u.blueTick),
    verified: Boolean(isOwnerFlag || u.isVerified || u.verified || u.blueTick),
    pass: u.pass,
    passwordHash: u.passwordHash,
  };
}

// --------------------------------------------------------------------------
// REUSABLE AVATAR COMPONENT WITH FALLBACK & CLICK
// --------------------------------------------------------------------------
function Avatar({
  photo,
  name,
  size = 'md',
  className = '',
  onClick
}: {
  photo?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const [hasError, setHasError] = useState(false);
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  };

  const dim = sizeMap[size] || sizeMap.md;

  if (photo && !hasError) {
    return (
      <img
        src={photo}
        alt={name || 'Avatar'}
        onError={() => setHasError(true)}
        onClick={onClick}
        className={`${dim} rounded-full object-cover border border-white/10 flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      />
    );
  }

  const initial = name ? name.trim().charAt(0).toUpperCase() : 'Z';
  return (
    <div
      onClick={onClick}
      className={`${dim} rounded-full bg-[#2A2A2A] border border-white/10 flex items-center justify-center font-semibold text-white/80 select-none flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {initial}
    </div>
  );
}

// --------------------------------------------------------------------------
// MAIN APP COMPONENT
// --------------------------------------------------------------------------
export default function App() {
  // Current user session (Persistent from 'zeio-user')
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('zeio-user');
      if (saved) {
        return normalizeUser(JSON.parse(saved));
      }
    } catch {}
    return null;
  });

  // Synchronize currentUser to localStorage & userStore subscribers after commit (never during render)
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem('zeio-user', JSON.stringify(currentUser));
      localStorage.setItem('ze_user', JSON.stringify(currentUser));
      localStorage.setItem('vn_currentUser', JSON.stringify(currentUser));
    } catch {}
    window.dispatchEvent(new Event('ze-user-store-updated'));
  }, [currentUser]);

  const { pathname } = useLocation();

  // 2. Biar ga langsung ke beranda, jika localStorage.getItem('zeio-user') kosong, redirect ke /auth
  useEffect(() => {
    const saved = localStorage.getItem('zeio-user');
    if (!saved) {
      if (window.location.pathname !== '/auth') {
        navigate('/auth', true);
      }
    }
  }, []);

  // Active Bottom Tab: 'updates' | 'calls' | 'music' | 'comm' | 'chats' | 'you' | 'settings'
  const [activeTab, setActiveTab] = useState<'updates' | 'calls' | 'music' | 'comm' | 'chats' | 'you' | 'settings'>('updates');
  const [settingsInitialView, setSettingsInitialView] = useState<string | null>(null);
  const { config: appHomeUiConfig } = useHomeUiConfig();
  const appThemeTokens = useMemo(
    () =>
      getHomeThemeTokens(
        appHomeUiConfig.themeId,
        appHomeUiConfig.boxStyle,
        appHomeUiConfig.shadowIntensity,
        appHomeUiConfig.shadowThickness
      ),
    [
      appHomeUiConfig.themeId,
      appHomeUiConfig.boxStyle,
      appHomeUiConfig.shadowIntensity,
      appHomeUiConfig.shadowThickness,
    ]
  );
  const [showRW, setShowRW] = useState(false);
  const [showBug, setShowBug] = useState(false);
  const [showOwnerDashboard, setShowOwnerDashboard] = useState(false);
  const [showKeyStore, setShowKeyStore] = useState(false);
  const [showTopUpDiamond, setShowTopUpDiamond] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // New Sidebar & Diamond+ Balance State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [diamondBalance, setDiamondBalance] = useState<number>(0);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // Listen for post viewer / create post modal open state from YouPage & ProfileModal to hide BottomNav
  useEffect(() => {
    const handlePostModalToggle = (e: Event) => {
      const custom = e as CustomEvent<{ open?: boolean }>;
      setIsPostModalOpen(Boolean(custom.detail?.open));
    };
    window.addEventListener('ze-post-modal-toggle', handlePostModalToggle);
    return () => window.removeEventListener('ze-post-modal-toggle', handlePostModalToggle);
  }, []);

  // Sync Diamond+ balance in real-time
  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchWalletBalance = () => {
      fetch(`/api/wallet/balance?userId=${encodeURIComponent(currentUser.id)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d && d.success) {
            setDiamondBalance(Number(d.balance) || 0);
          }
        })
        .catch(() => {});
    };
    fetchWalletBalance();
    const interval = setInterval(fetchWalletBalance, 10000);
    const onWalletUpdate = (e: any) => {
      try {
        const data = e.detail || JSON.parse(e.data);
        if (data && String(data.userId).toLowerCase() === String(currentUser.id).toLowerCase()) {
          setDiamondBalance(Number(data.balance) || 0);
        }
      } catch {
        fetchWalletBalance();
      }
    };
    window.addEventListener('ze-wallet-updated' as any, onWalletUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('ze-wallet-updated' as any, onWalletUpdate);
    };
  }, [currentUser?.id]);

  // Sync unread notification count
  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchNotifsCount = () => {
      fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d && d.success) {
            setUnreadNotifCount(d.unreadCount || 0);
          }
        })
        .catch(() => {});
    };
    fetchNotifsCount();
    const interval = setInterval(fetchNotifsCount, 12000);
    const onNotifRecv = () => fetchNotifsCount();
    window.addEventListener('ze-notification-received', onNotifRecv);
    window.addEventListener('ze-notifications-updated', onNotifRecv);
    return () => {
      clearInterval(interval);
      window.removeEventListener('ze-notification-received', onNotifRecv);
      window.removeEventListener('ze-notifications-updated', onNotifRecv);
    };
  }, [currentUser?.id]);

  // Sync user to Firestore "ze_users" on start / updates
  useEffect(() => {
    const handleOpenRw = () => setShowRW(true);
    const handleOpenBug = () => setShowBug(true);
    window.addEventListener('ze_open_rw', handleOpenRw);
    window.addEventListener('ze_open_bug', handleOpenBug);
    return () => {
      window.removeEventListener('ze_open_rw', handleOpenRw);
      window.removeEventListener('ze_open_bug', handleOpenBug);
    };
  }, []);

  useEffect(() => {
    if (!currentUser || !db) return;
    const syncUser = async () => {
      try {
        const myId = currentUser.id || localStorage.getItem('ze_id') || ('ZE-' + Math.random().toString(36).substr(2, 6).toUpperCase());
        const isOwner = currentUser.username === 'ZE.io' || currentUser.isOwner || (currentUser as any).owner;
        const isVerified = Boolean(isOwner || currentUser.isVerified || (currentUser as any).verified || (currentUser as any).blueTick);

        const userData = {
          id: myId,
          id_upper: myId.toUpperCase(),
          name: currentUser.name || localStorage.getItem('ze_name') || 'ZE User',
          username: currentUser.username || myId.toLowerCase().replace('-', '_'),
          username_lower: (currentUser.username || myId).toLowerCase().trim(),
          about: currentUser.bio || localStorage.getItem('ze_about') || 'Official Owner & Creator of ZE.io 🚀',
          bio: currentUser.bio || localStorage.getItem('ze_about') || 'Official Owner & Creator of ZE.io 🚀',
          photo: currentUser.photo || currentUser.avatar || localStorage.getItem('ze_photo') || 'https://i.pravatar.cc/100',
          avatar: currentUser.avatar || currentUser.photo || 'https://i.pravatar.cc/100',
          followers: isOwner ? '989M' : (currentUser.followers || 0),
          verified: isVerified,
          isVerified: isVerified,
          blueTick: isVerified,
          isBlueTick: isVerified,
          owner: isOwner,
          isOwner: isOwner,
          isVip: Boolean(currentUser.isVip || currentUser.vip),
          vip: Boolean(currentUser.isVip || currentUser.vip),
          vipLevel: currentUser.vipLevel || null,
          isVipExclusive: Boolean(currentUser.isVipExclusive || currentUser.vipLevel === 'exclusive'),
          vipExpiresAt: currentUser.vipExpiresAt || 0,
          lastSeen: serverTimestamp(),
          device: navigator.userAgent
        };

        await setDoc(doc(db, 'ze_users', myId), userData, { merge: true });
        if (currentUser.username) {
          await setDoc(doc(db, 'ze_users', currentUser.username.toLowerCase().trim()), userData, { merge: true });
        }
      } catch (e) {
        console.warn('Firestore sync user error:', e);
      }
    };
    syncUser();
  }, [currentUser]);

  // Realtime listener for Firestore "ze_users" so users on other devices appear instantly
  useEffect(() => {
    if (!db) return;
    try {
      const unsub = onSnapshot(collection(db, 'ze_users'), (snap) => {
        const globalUsers: UserProfile[] = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.id) {
            const isOwner = Boolean(data.owner || data.isOwner || data.username === 'ZE.io');
            const isVer = Boolean(data.verified || data.isVerified || data.blueTick || data.isBlueTick || isOwner);
            const rawVip = Boolean(data.isVip || data.vip);
            const rawExp = Number(data.vipExpiresAt || 0);
            const isActiveVip = Boolean(isOwner || (rawVip && (!rawExp || rawExp > Date.now())));
            const fsVipLevel: 'basic' | 'exclusive' | undefined = isOwner
              ? 'exclusive'
              : isActiveVip
              ? data.vipLevel === 'exclusive' || data.isVipExclusive === true
                ? 'exclusive'
                : 'basic'
              : undefined;
            globalUsers.push({
              id: data.id,
              name: data.name || 'ZE User',
              username: data.username || data.id.toLowerCase().replace('-', '_'),
              bio: data.about || data.bio || 'Hey there! I am using ZE.io',
              photo: data.photo || data.avatar || 'https://i.pravatar.cc/100',
              followers: isOwner ? '989M' : (data.followers || 0),
              isVerified: isVer,
              verified: isVer,
              blueTick: isVer,
              isBlueTick: isVer,
              isOwner: isOwner,
              owner: isOwner,
              isVip: isActiveVip,
              vip: isActiveVip,
              vipLevel: fsVipLevel,
              isVipExclusive: Boolean(isOwner || (isActiveVip && fsVipLevel === 'exclusive')),
              vipExpiresAt: rawExp || undefined,
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
              joinedDate: data.joinedDate || 'October 2026'
            });
          }
        });
        if (globalUsers.length > 0) {
          setAllUsers((prev) => {
            const map = new Map<string, UserProfile>();
            prev.forEach((u) => map.set(u.id, u));
            globalUsers.forEach((u) => {
              const existing = map.get(u.id);
              const mergedVip = Boolean(existing?.isVip || existing?.vip || u.isVip || u.vip);
              const mergedVipLevel: 'basic' | 'exclusive' | undefined = mergedVip
                ? existing?.vipLevel === 'exclusive' || u.vipLevel === 'exclusive' || existing?.isVipExclusive || u.isVipExclusive
                  ? 'exclusive'
                  : existing?.vipLevel || u.vipLevel || 'basic'
                : undefined;
              map.set(u.id, {
                ...u,
                ...existing,
                name: u.name || existing?.name || 'ZE User',
                photo: u.photo || existing?.photo || '',
                bio: u.bio || existing?.bio || '',
                role: existing?.role && existing.role !== 'user' ? existing.role : u.role || 'user',
                isAdmin: Boolean(existing?.isAdmin || u.isAdmin),
                isVip: mergedVip,
                vip: mergedVip,
                vipLevel: mergedVipLevel,
                isVipExclusive: Boolean(mergedVip && mergedVipLevel === 'exclusive'),
                vipExpiresAt: existing?.vipExpiresAt || u.vipExpiresAt,
                isOwner: Boolean(existing?.isOwner || u.isOwner),
                isVerified: Boolean(existing?.isVerified || u.isVerified),
              });
            });
            return Array.from(map.values());
          });
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn('Firestore onSnapshot error:', e);
    }
  }, []);

  // Subpages / Routes:
  // null | 'chat-room' | 'search' | 'notifications' | 'tiktok' | 'bgmusic' | 'ai' | 'community-detail' | 'group-list' | 'group-chat' | 'group-info' | 'global-chat' | 'wink-hd' | 'ytmp4' | 'call-active'
  const [activeSubpage, setActiveSubpage] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const groupChatOriginRef = useRef<'group-list' | 'chats' | 'updates'>('group-list');
  const activeChatStateRef = useRef<{ chatId: string | null; subpage: string | null }>({
    chatId: null,
    subpage: null
  });
  useEffect(() => {
    activeChatStateRef.current = { chatId: activeChatId, subpage: activeSubpage };
  }, [activeChatId, activeSubpage]);

  const location = useLocation();
  const path = location.pathname;

  // Keep activeSubpage synchronized when navigating directly to dedicated routes or via browser Back/Forward
  useEffect(() => {
    if (path === '/global' || path === '/global-chat' || path.startsWith('/global/')) {
      setActiveSubpage((prev) => (prev === 'global-chat' ? prev : 'global-chat'));
    } else if (path === '/group-chat') {
      setActiveSubpage((prev) => (prev === 'group-list' ? prev : 'group-list'));
    } else if (path === '/wink-hd') {
      setActiveSubpage((prev) => (prev === 'wink-hd' ? prev : 'wink-hd'));
    } else if (path === '/history') {
      setActiveSubpage((prev) => (prev === 'history' ? prev : 'history'));
    } else if (path === '/ai' || path === '/ze-ai') {
      setActiveSubpage((prev) => (prev === 'ai' ? prev : 'ai'));
    } else if (
      path === '/' ||
      path === '/updates' ||
      path === '/music' ||
      path === '/comm' ||
      path === '/chats' ||
      path === '/you'
    ) {
      setActiveSubpage((prev) => (prev === null ? prev : null));
    }
  }, [path]);

    // Ini SEMUA HALAMAN BERANDA, BOTTOM NAV HARUS MUNCUL TERUS:
  const isHomePage =
    path === '/' ||
    path === '/updates' ||
    path === '/music' ||
    path === '/comm' ||
    path === '/communities' ||
    path === '/groups' ||
    path === '/chats' ||
    path === '/you' ||
    path === '/akun';

  // BOTTOM NAV MUNCUL DI CHATS LIST, ILANG DI DALEM CHAT, GROUP CHAT & GLOBAL CHAT:
  const isInsideChat =
    path.startsWith('/chat/') ||
    path === '/chat' ||
    path === '/group-chat' ||
    path.startsWith('/messages/') ||
    activeSubpage === 'chat-room' ||
    activeSubpage === 'group-list' ||
    activeSubpage === 'group-chat' ||
    activeSubpage === 'group-info';

  const isGlobalChat =
    path === '/global' ||
    path.startsWith('/global/') ||
    path === '/global-chat' ||
    path.includes('GlobalChat') ||
    activeSubpage === 'global-chat';

  const isAIChat =
    (path.includes('ai') && path !== '/' && path !== '/music') ||
    path === '/ze-ai' ||
    path.startsWith('/ze-ai') ||
    path.includes('ZEAI') ||
    path.startsWith('/bug') ||
    path.startsWith('/rw') ||
    activeSubpage === 'ai' ||
    activeSubpage === 'bug' ||
    activeSubpage === 'call-active' ||
    showRW ||
    showBug;

  const isInsideChatRoom = isInsideChat || isGlobalChat;

  // Sinkronkan URL pathname sesuai tab & subpage bila sudah ada session user
  useEffect(() => {
    const saved = localStorage.getItem('zeio-user');
    if (!saved || !currentUser) {
      if (window.location.pathname !== '/auth') {
        navigate('/auth', true);
      }
      return;
    }

    if (showRW) {
      if (!window.location.pathname.includes('/rw')) navigate('/rw');
    } else if (activeSubpage === 'group-list') {
      if (window.location.pathname !== '/group-chat') navigate('/group-chat');
    } else if (activeSubpage === 'chat-room' || activeSubpage === 'group-chat' || activeSubpage === 'group-info') {
      if (!window.location.pathname.startsWith('/chat')) navigate('/chat');
    } else if (activeSubpage === 'ai') {
      if (!window.location.pathname.includes('/ai')) navigate('/ai');
    } else if (activeSubpage === 'wink-hd') {
      if (window.location.pathname !== '/wink-hd') navigate('/wink-hd');
    } else if (activeSubpage === 'history') {
      if (window.location.pathname !== '/history') navigate('/history');
    } else if (activeSubpage === 'global-chat') {
      if (!window.location.pathname.startsWith('/global')) navigate('/global');
    } else if (activeSubpage === 'bug') {
      if (!window.location.pathname.includes('/bug')) navigate('/bug');
    } else if (!activeSubpage) {
      const curPath = window.location.pathname;
      const isDirectDedicatedRoute =
        curPath === '/global' ||
        curPath === '/global-chat' ||
        curPath === '/group-chat' ||
        curPath === '/wink-hd' ||
        curPath === '/history' ||
        curPath === '/ai' ||
        curPath === '/ze-ai';
      if (!isDirectDedicatedRoute) {
        if (activeTab === 'updates' && curPath !== '/' && curPath !== '/updates') {
          navigate('/');
        } else if (activeTab === 'music' && curPath !== '/music') {
          navigate('/music');
        } else if (activeTab === 'comm' && curPath !== '/comm') {
          navigate('/comm');
        } else if (activeTab === 'chats' && curPath !== '/chats') {
          navigate('/chats');
        } else if (activeTab === 'you' && curPath !== '/you') {
          navigate('/you');
        }
      }
    }
  }, [currentUser, activeTab, activeSubpage, showRW]);

  // Global Profile View Modal State
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserProfile | null>(null);

  // IG Notes State
  const [notesMap, setNotesMap] = useState<Record<string, UserNote>>({});
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [activeViewingNote, setActiveViewingNote] = useState<UserNote | null>(null);

  // Group creation modal
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  // Community creation modal
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);

  // In-app toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  // Global All Users state (Local + Server + Firestore)
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('vn_users');
      return saved ? JSON.parse(saved).map(normalizeUser) : [];
    } catch {
      return [];
    }
  });

  // Friends array
  const [friends, setFriends] = useState<UserProfile[]>([]);

  // Stories
  const [stories, setStories] = useState<UserStory[]>(() => {
    try {
      const saved = localStorage.getItem('vn_stories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeStoryViewer, setActiveStoryViewer] = useState<UserStory | null>(null);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [viewedStoryIds, setViewedStoryIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ze_viewed_stories') || '[]');
    } catch {
      return [];
    }
  });

  const markStoryViewed = (id: string) => {
    setViewedStoryIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem('ze_viewed_stories', JSON.stringify(next));
      return next;
    });
  };

  // Chats list
  const [chats, setChats] = useState<ChatItem[]>(() => {
    try {
      const saved = localStorage.getItem('vn_chats_global');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Groups list
  const [groups, setGroups] = useState<GroupItem[]>([
    {
      id: 'group_zeio_creators',
      name: 'ZE.io Creators Hub',
      photo: '',
      members: [],
      admin: '',
      createdAt: Date.now(),
      description: 'Grup obrolan resmi kreator dan komunitas audio ZE.io'
    }
  ]);

  // Communities list
  const [communities, setCommunities] = useState<CommunityItem[]>([
    {
      id: 'comm_beatmakers',
      name: 'Beatmakers Indonesia',
      description: 'Tempat berbagi beat musik, mixing tips, dan review audio.',
      members: [],
      createdAt: Date.now(),
    },
    {
      id: 'comm_tiktok',
      name: 'TikTok Sound Trends',
      description: 'Update sound trending harian tanpa watermark.',
      members: [],
      createdAt: Date.now(),
    },
    {
      id: 'comm_anime',
      name: 'Anime & Aesthetic Creators',
      description: 'Komunitas edit video anime AMV dan foto estetik.',
      members: [],
      createdAt: Date.now(),
    },
  ]);

  // Friend requests
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  // Real WebRTC Active Call Session State
  const [activeCallSession, setActiveCallSession] = useState<CallSessionData | null>(null);
  const [activeCallTarget, setActiveCallTarget] = useState<UserProfile | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Dynamic Background Music state (TikTok & YouTube link support + Glossy Music Lab via MusicContext)
  const {
    currentTrack,
    isPlaying,
    playMusic,
    togglePlay,
    closePlayer,
    setCurrentTrack,
    setIsPlaying,
  } = useMusic();

  const isMusicPlaying = isPlaying;
  const setIsMusicPlaying = setIsPlaying;
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const currentTrackTitle = currentTrack?.title || "Belum Ada Musik";
  const currentTrackUrl = currentTrack?.url || "";
  const [showMusicModal, setShowMusicModal] = useState<boolean>(false);
  const [showAddFriendById, setShowAddFriendById] = useState<boolean>(false);
  const [showAddStoryModalState, setShowAddStoryModalState] = useState<boolean>(false);
  const [activeStoryViewerGroup, setActiveStoryViewerGroup] = useState<GroupedUserStory | null>(null);
  const [externalMusicUrl, setExternalMusicUrl] = useState<string | null>(null);
  const [currentYoutubeId, setCurrentYoutubeId] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>("ID");
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  // Edit profile modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  // Sembunyikan bottom-nav saat melihat profil (cek profil), cek postingan/video, story, subpage khusus, atau menu fitur
  const isViewingStory = Boolean(activeStoryViewer || activeStoryViewerGroup);
  const isInsideNewFeature = Boolean(
    showOwnerDashboard || showKeyStore || showTopUpDiamond
  );
  const hideBottomNav =
    Boolean(appHomeUiConfig.bottomNavHidden) ||
    Boolean(activeSubpage) ||
    Boolean(selectedProfileUser) ||
    Boolean(isPostModalOpen) ||
    Boolean(showEditProfile) ||
    isInsideChat ||
    isGlobalChat ||
    isAIChat ||
    path === '/auth' ||
    path === '/wink-hd' ||
    isViewingStory ||
    isInsideNewFeature;
  const showBottomNav = !hideBottomNav;

  // Close player, pause audio, and remove track completely from DOM
  const handleClosePlayer = () => {
    closePlayer();
    setCurrentYoutubeId(null);
  };

  // Play track handler for Music Lab & Mini player
  const handlePlayTrack = (track: {
    id?: string;
    title: string;
    thumbnail?: string;
    cover?: string;
    url?: string;
    videoUrl?: string;
    audioUrl?: string;
    source: 'tiktok' | 'youtube' | 'web';
    sourceType?: 'tiktok' | 'youtube' | 'web';
    author?: string;
    sourceUrl?: string;
  }) => {
    const cleanUrl = track.videoUrl || track.audioUrl || track.url || '';
    const match = cleanUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?#/]+)/i);
    if (match && match[1]) {
      setCurrentYoutubeId(match[1]);
      setExternalMusicUrl(null);
      setCurrentTrack(track);
      setIsPlaying(true);
    } else {
      setCurrentYoutubeId(null);
      if (track.audioUrl) {
        playMusic(track, { audioUrl: track.audioUrl });
      } else if (cleanUrl.includes('tiktok.com') && !track.videoUrl) {
        fetch(`/api/tiktok?url=${encodeURIComponent(cleanUrl)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data && data.data && (data.data.play || data.data.music)) {
              const stream = data.data.music || data.data.play;
              const video = data.data.play || data.data.hdplay;
              playMusic({ ...track, videoUrl: video, audioUrl: stream }, { audioUrl: stream, videoUrl: video });
            } else {
              playMusic(track);
            }
          })
          .catch(() => {
            playMusic(track);
          });
      } else {
        playMusic(track);
      }
    }
    showToast(`Memutar: ${track.title.slice(0, 26)}...`);
  };

  // Detect user country from IP
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.country_code) {
          setUserCountry(data.country_code);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch real title from TikTok or YouTube link
  const getMediaInfoFromLink = async (url: string) => {
    try {
      if (url.includes('tiktok.com')) {
        const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        return {
          title: data.title || (data.author_name ? data.author_name + " - TikTok Video" : "TikTok Video"),
          cover: data.thumbnail_url || '',
          author: data.author_name || 'TikTok Sound'
        };
      }
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        return {
          title: data.title || "YouTube Video",
          cover: data.thumbnail_url || '',
          author: data.author_name || 'YouTube Audio'
        };
      }
    } catch (e) {
      console.warn('oEmbed fetch error:', e);
    }
    return { title: "Tautan Musik Web", cover: '', author: 'ZE.io Music' };
  };

  const handlePlayMusicFromLink = async (url: string) => {
    if (!url.trim()) return;
    const cleanUrl = url.trim();
    showToast('Mengambil info video...');
    const mediaInfo = await getMediaInfoFromLink(cleanUrl);
    handlePlayTrack({
      title: mediaInfo.title,
      url: cleanUrl,
      source: cleanUrl.includes('tiktok') ? 'tiktok' : cleanUrl.includes('youtu') ? 'youtube' : 'web',
      thumbnail: mediaInfo.cover,
      cover: mediaInfo.cover,
      author: mediaInfo.author,
    });
    setShowMusicModal(false);
  };

  const toggleMusicPlayback = () => {
    togglePlay();
  };

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Panda visual interaction state (Login / Register page only)
  const [pandaFocusedField, setPandaFocusedField] = useState<'none' | 'text' | 'password'>('none');
  const [pandaLookProgress, setPandaLookProgress] = useState(0);
  const [pandaMood, setPandaMood] = useState<PandaMood>('idle');
  const [pandaErrorTick, setPandaErrorTick] = useState(0);
  const [pandaLastActivity, setPandaLastActivity] = useState(() => Date.now());
  const pandaErrorTimerRef = useRef<number | null>(null);
  const pandaSuccessTimerRef = useRef<number | null>(null);

  const markPandaActivity = () => {
    setPandaLastActivity(Date.now());
    setPandaMood((prev) => (prev === 'error' ? 'idle' : prev));
  };

  const triggerPandaError = () => {
    setPandaFocusedField('none');
    setPandaMood('error');
    setPandaErrorTick((n) => n + 1);
    setPandaLastActivity(Date.now());
    if (pandaErrorTimerRef.current) window.clearTimeout(pandaErrorTimerRef.current);
    pandaErrorTimerRef.current = window.setTimeout(() => {
      setPandaMood((prev) => (prev === 'error' ? 'idle' : prev));
    }, 2400);
  };

  const completeAuthWithPanda = (user: UserProfile) => {
    setPandaFocusedField('none');
    setPandaMood('success');
    setPandaLastActivity(Date.now());
    if (pandaSuccessTimerRef.current) window.clearTimeout(pandaSuccessTimerRef.current);
    pandaSuccessTimerRef.current = window.setTimeout(() => {
      setPandaMood('idle');
      setUserSession(user);
    }, 700);
  };

  const updatePandaCursorLook = (el: HTMLInputElement) => {
    const pos = el.selectionStart ?? el.value.length;
    const normalized = Math.max(-1, Math.min(1, (pos / 18) * 2 - 1));
    setPandaLookProgress(el.value.length === 0 ? 0 : normalized);
    markPandaActivity();
  };

  // ------------------------------------------------------------------------
  // SYNC DATA (USERS, FRIENDS, CHATS, NOTES, GROUPS) - NON-BLOCKING PARALLEL PIPELINE
  // ------------------------------------------------------------------------
  const isSyncingGlobalRef = useRef(false);
  const lastSyncRunAtRef = useRef(0);
  const allUsersSnapshotRef = useRef<UserProfile[]>(allUsers);
  useEffect(() => {
    allUsersSnapshotRef.current = allUsers;
  }, [allUsers]);

  const scheduleStorageWrite = (key: string, value: unknown) => {
    const runWrite = () => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(runWrite, { timeout: 1000 });
    } else {
      setTimeout(runWrite, 16);
    }
  };

  const loadAllGlobalData = async (force = false) => {
    if (!currentUser || isSyncingGlobalRef.current) return;
    const nowTs = performance.now();
    // Coalesce burst triggers (SSE + BroadcastChannel + interval) within 450ms to protect 120 FPS frame budget
    if (!force && nowTs - lastSyncRunAtRef.current < 450) return;
    isSyncingGlobalRef.current = true;
    lastSyncRunAtRef.current = nowTs;

    try {
      const [
        resUsers,
        resFriends,
        resReqs,
        resChats,
        resStories,
        resNotes,
        resGroups,
        resComms,
      ] = await Promise.all([
        fetch('/api/users').catch(() => null),
        fetch('/api/friendships').catch(() => null),
        fetch('/api/friend_requests').catch(() => null),
        fetch('/api/chats').catch(() => null),
        fetch('/api/stories').catch(() => null),
        fetch('/api/notes').catch(() => null),
        fetch('/api/groups').catch(() => null),
        fetch('/api/communities').catch(() => null),
      ]);

      // 1. Process users
      let combinedUsers = allUsersSnapshotRef.current;
      if (resUsers && resUsers.ok) {
        const uData = await resUsers.json();
        if (Array.isArray(uData.users)) {
          const map = new Map<string, UserProfile>();
          combinedUsers.forEach((u) => map.set(u.id, u));
          uData.users.forEach((raw: any) => {
            const u = normalizeUser(raw);
            map.set(u.id, { ...map.get(u.id), ...u });
          });
          const nextUsers = Array.from(map.values());
          combinedUsers = nextUsers;
          setAllUsers((prev) => {
            if (
              prev.length === nextUsers.length &&
              prev.every(
                (p, i) =>
                  p.id === nextUsers[i]?.id &&
                  p.name === nextUsers[i]?.name &&
                  p.photo === nextUsers[i]?.photo &&
                  p.role === nextUsers[i]?.role &&
                  Boolean(p.isAdmin) === Boolean(nextUsers[i]?.isAdmin) &&
                  Boolean(p.isVip) === Boolean(nextUsers[i]?.isVip) &&
                  p.vipLevel === nextUsers[i]?.vipLevel &&
                  Boolean(p.isVipExclusive) === Boolean(nextUsers[i]?.isVipExclusive)
              )
            ) {
              return prev;
            }
            scheduleStorageWrite('vn_users', nextUsers);
            return nextUsers;
          });

          // Keep currentUser VIP status & per-UID saved avatar synchronized with server user record
          const serverMe = nextUsers.find(
            (u) => String(u.id).toUpperCase() === String(currentUser.id).toUpperCase()
          );
          if (serverMe) {
            setCurrentUser((prev: any) => {
              if (!prev) return prev;
              const serverHasCustomPhoto =
                Boolean(serverMe.photo) && !String(serverMe.photo).includes('api.dicebear.com');
              const nextPhoto = serverHasCustomPhoto ? serverMe.photo : prev.photo || serverMe.photo;
              if (
                Boolean(prev.isVip) !== Boolean(serverMe.isVip) ||
                prev.vipLevel !== serverMe.vipLevel ||
                Boolean(prev.isVipExclusive) !== Boolean(serverMe.isVipExclusive) ||
                prev.role !== serverMe.role ||
                Boolean(prev.isAdmin) !== Boolean(serverMe.isAdmin) ||
                (nextPhoto && prev.photo !== nextPhoto)
              ) {
                return {
                  ...prev,
                  role: serverMe.role || prev.role,
                  isAdmin: serverMe.isAdmin,
                  isVip: serverMe.isVip,
                  vip: serverMe.vip,
                  vipLevel: serverMe.vipLevel,
                  isVipExclusive: serverMe.isVipExclusive,
                  vipExpiresAt: serverMe.vipExpiresAt,
                  photo: nextPhoto || prev.photo,
                  avatar: nextPhoto || prev.avatar
                };
              }
              return prev;
            });
          }
        }
      }

      // 2. Process friendships (preserve live VIP badges & per-UID photos on friends)
      let myFriendIds: string[] = [];
      if (resFriends && resFriends.ok) {
        const fData = await resFriends.json();
        const myUpper = String(currentUser.id).toUpperCase();
        const directList =
          fData.friendships?.[currentUser.id] || fData.friendships?.[myUpper] || [];
        if (Array.isArray(directList) && directList.length > 0) {
          myFriendIds = directList;
        }
      }
      if (myFriendIds.length === 0) {
        let localFriendsMap: Record<string, string[]> = {};
        try {
          localFriendsMap = JSON.parse(localStorage.getItem('vn_friends') || '{}');
        } catch {}
        myFriendIds = localFriendsMap[currentUser.id] || [];
      }
      const friendSetUpper = new Set(myFriendIds.map((fid) => String(fid).toUpperCase()));
      const myFriends = combinedUsers.filter((u) => friendSetUpper.has(String(u.id).toUpperCase()));
      setFriends((prev) =>
        prev.length === myFriends.length &&
        prev.every(
          (f, i) =>
            f.id === myFriends[i]?.id &&
            f.name === myFriends[i]?.name &&
            f.photo === myFriends[i]?.photo &&
            f.role === myFriends[i]?.role &&
            Boolean(f.isAdmin) === Boolean(myFriends[i]?.isAdmin) &&
            Boolean(f.isVip) === Boolean(myFriends[i]?.isVip) &&
            f.vipLevel === myFriends[i]?.vipLevel &&
            Boolean(f.isVipExclusive) === Boolean(myFriends[i]?.isVipExclusive)
        )
          ? prev
          : myFriends
      );

      // 3. Process friend requests
      if (resReqs && resReqs.ok) {
        const rData = await resReqs.json();
        if (rData.requests && rData.requests[currentUser.id]) {
          const incoming = (rData.requests[currentUser.id] as any[]).filter((r) => r.status === 'pending');
          const mappedReqs: FriendRequest[] = incoming.map((r) => {
            const sender = combinedUsers.find((u) => u.id === r.from);
            return {
              id: r.id,
              from: r.from,
              to: currentUser.id,
              fromName: sender?.name || r.from,
              fromUsername: sender?.username || r.from,
              fromPhoto: sender?.photo,
              status: 'pending' as const,
              time: r.time || Date.now(),
            };
          });
          setFriendRequests((prev) =>
            prev.length === mappedReqs.length && prev[0]?.id === mappedReqs[0]?.id ? prev : mappedReqs
          );
        }
      }

      // 4. Process chats
      if (resChats && resChats.ok) {
        const cData = await resChats.json();
        if (Array.isArray(cData.chats)) {
          const myCleanId = String(currentUser.id || '').toUpperCase();
          const userChats = cData.chats
            .filter((c: any) => {
              const rawParts =
                Array.isArray(c.participants) && c.participants.length > 0
                  ? c.participants
                  : c.id && c.id.includes('_')
                  ? c.id.split('_')
                  : c.chatId && c.chatId.includes('_')
                  ? c.chatId.split('_')
                  : [];
              return rawParts.some((p: any) => String(p).toUpperCase() === myCleanId);
            })
            .map((c: any) => ({
              id: c.id || c.chatId,
              chatId: c.chatId || c.id,
              participants: c.participants || [],
              participantsInfo: c.participantsInfo || {},
              lastMessage: c.lastMessage || 'Mulai percakapan',
              lastSenderId: c.lastSenderId,
              lastTime: c.lastTime || c.updatedAt || Date.now(),
              type: c.type || (c.id?.startsWith('group_') ? 'group' : 'direct'),
              groupName: c.groupName,
              groupPhoto: c.groupPhoto,
            }))
            .sort((a: ChatItem, b: ChatItem) => b.lastTime - a.lastTime);

          setChats((prev) => {
            if (
              prev.length === userChats.length &&
              prev.every(
                (c, i) =>
                  c.id === userChats[i]?.id &&
                  c.lastTime === userChats[i]?.lastTime &&
                  c.lastMessage === userChats[i]?.lastMessage
              )
            ) {
              return prev;
            }
            scheduleStorageWrite('vn_chats_global', userChats);
            return userChats;
          });
        }
      }

      // 5. Process stories
      if (resStories && resStories.ok) {
        const sData = await resStories.json();
        if (Array.isArray(sData.stories)) {
          setStories((prev) => {
            if (prev.length === sData.stories.length && prev[0]?.id === sData.stories[0]?.id) {
              return prev;
            }
            scheduleStorageWrite('vn_stories', sData.stories);
            return sData.stories;
          });
        }
      }

      // 6. Process notes (structural equality without expensive full-object JSON.stringify on every poll)
      if (resNotes && resNotes.ok) {
        const nData = await resNotes.json();
        if (nData.notes && typeof nData.notes === 'object') {
          const nextNotes = nData.notes as Record<string, UserNote>;
          setNotesMap((prev) => {
            const prevKeys = Object.keys(prev);
            const nextKeys = Object.keys(nextNotes);
            if (
              prevKeys.length === nextKeys.length &&
              nextKeys.every(
                (k) =>
                  prev[k]?.text === nextNotes[k]?.text &&
                  prev[k]?.emoji === nextNotes[k]?.emoji &&
                  prev[k]?.createdAt === nextNotes[k]?.createdAt
              )
            ) {
              return prev;
            }
            return nextNotes;
          });
        }
      }

      // 7. Process groups
      if (resGroups && resGroups.ok) {
        const gData = await resGroups.json();
        if (Array.isArray(gData.groups) && gData.groups.length > 0) {
          setGroups((prev) =>
            prev.length === gData.groups.length &&
            prev.every((g, i) => g.id === gData.groups[i]?.id && g.members?.length === gData.groups[i]?.members?.length)
              ? prev
              : gData.groups
          );
        }
      }

      // 8. Process communities
      if (resComms && resComms.ok) {
        const commData = await resComms.json();
        if (Array.isArray(commData.communities) && commData.communities.length > 0) {
          setCommunities((prev) =>
            prev.length === commData.communities.length && prev[0]?.id === commData.communities[0]?.id
              ? prev
              : commData.communities
          );
        }
      }
    } catch (e) {
      console.warn('Sync notice:', e);
    } finally {
      isSyncingGlobalRef.current = false;
    }
  };

  // Firestore Realtime Listeners
  useEffect(() => {
    if (!currentUser || !db) return;

    try {
      // Friendships
      const qFriendships = query(collection(db, 'friendships'), where('users', 'array-contains', currentUser.id));
      const unsubFriendships = onSnapshot(qFriendships, async (snap) => {
        const friendIds = snap.docs.flatMap((d) => (d.data().users as string[]).filter((id) => id !== currentUser.id));
        if (friendIds.length > 0) {
          let localUsers: UserProfile[] = [];
          try {
            localUsers = JSON.parse(localStorage.getItem('vn_users') || '[]').map(normalizeUser);
          } catch (e) {}
          setFriends(localUsers.filter((u: UserProfile) => friendIds.includes(u.id)));
        }
      });

      // Friend requests
      const qReqs = query(collection(db, 'friend_requests'), where('to', '==', currentUser.id), where('status', '==', 'pending'));
      const unsubReqs = onSnapshot(qReqs, (snap) => {
        const reqList: FriendRequest[] = snap.docs.map((d) => ({
          id: d.id,
          from: d.data().from,
          to: currentUser.id,
          status: 'pending',
          time: d.data().time || Date.now(),
        }));
        setFriendRequests(reqList);
      });

      // Notes (IG Notes)
      const qNotes = query(collection(db, 'notes'));
      const unsubNotes = onSnapshot(qNotes, (snap) => {
        const now = Date.now();
        const map: Record<string, UserNote> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as UserNote;
          if (!data.expiresAt || data.expiresAt > now) {
            map[d.id] = data;
          }
        });
        setNotesMap(map);
      });

      // Groups
      const qGroups = query(collection(db, 'groups'));
      const unsubGroups = onSnapshot(qGroups, (snap) => {
        if (!snap.empty) {
          const gList: GroupItem[] = snap.docs.map((d) => d.data() as GroupItem);
          setGroups(gList);
        }
      });

      return () => {
        unsubFriendships();
        unsubReqs();
        unsubNotes();
        unsubGroups();
      };
    } catch (e) {
      console.warn('Firestore subscription notice:', e);
    }
  }, [currentUser]);

  // Auto-request notification permission on first open & sync background foreground service session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.ZeNative?.requestNotificationPermission?.();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id || typeof window === 'undefined') return;
    window.ZeNative?.setUserSession?.(
      String(currentUser.id),
      String(currentUser.name || currentUser.username || 'ZE User'),
      window.location.origin
    );
  }, [currentUser?.id, currentUser?.name, currentUser?.username]);

  // Direct jump to specific chat when user taps a chat notification
  const openChatByIdRef = useRef<(chatId: string) => void>(() => {});
  openChatByIdRef.current = (targetChatId: string) => {
    if (!targetChatId || !currentUser) return;
    const isGroup = targetChatId.startsWith('grp_') || groups.some((g) => g.id === targetChatId);
    if (isGroup) {
      openGroupChat(targetChatId, 'chats');
      return;
    }
    setActiveTab('chats');
    setActiveChatId(targetChatId);
    setActiveSubpage('chat-room');
    navigate(`/chat/${targetChatId}`);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__zeOpenChatById = (chatId: string) => {
      openChatByIdRef.current(chatId);
    };

    const handleSwChatMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === 'NATIVE_CHAT_NOTIFICATION_OPEN' && data.chatId) {
        openChatByIdRef.current(String(data.chatId));
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwChatMessage);
    }

    return () => {
      delete window.__zeOpenChatById;
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwChatMessage);
      }
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const openChatId = params.get('openChatId');
    if (openChatId) {
      openChatByIdRef.current(openChatId);
      params.delete('openChatId');
      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
      window.history.replaceState(null, '', nextUrl);
    }
  }, [currentUser?.id]);

  // Realtime Server-Sent Events (SSE) across HP1 & HP2
  useEffect(() => {
    if (!currentUser?.id) return;
    let es: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        es = new EventSource(`/api/events?userId=${encodeURIComponent(currentUser.id)}`);

        es.addEventListener('new-message', (e) => {
          try {
            const data = JSON.parse(e.data);
            window.dispatchEvent(new CustomEvent('ze-new-message', { detail: data }));

            const msg = data?.message;
            const chatId = String(data?.chatId || data?.rawChatId || '');
            const participants: string[] = Array.isArray(data?.participants) ? data.participants : [];
            const myIdUpper = String(currentUser.id).toUpperCase();
            const senderIdUpper = String(msg?.senderId || '').toUpperCase();
            const isForMe =
              participants.some((p) => String(p).toUpperCase() === myIdUpper) ||
              chatId.toUpperCase().includes(myIdUpper);

            if (msg && senderIdUpper && senderIdUpper !== myIdUpper && isForMe) {
              const isCurrentlyViewingThisChat =
                !document.hidden &&
                activeChatStateRef.current.subpage === 'chat-room' &&
                activeChatStateRef.current.chatId === chatId;

              if (!isCurrentlyViewingThisChat) {
                const senderProfile = allUsersSnapshotRef.current.find(
                  (u) => String(u.id).toUpperCase() === senderIdUpper
                );
                const senderName =
                  msg.senderName || senderProfile?.name || senderProfile?.username || 'Pengguna ZE.io';
                const senderPhoto = senderProfile?.photo || senderProfile?.avatar || '/assets/ze_logo.png';
                const msgBody =
                  msg.text || (msg.mediaUrl ? '[Mengirim media]' : 'Pesan baru');

                window.ZeNative?.showChatNotification?.(chatId, senderName, msgBody, senderPhoto);

                if ('serviceWorker' in navigator) {
                  const payload = {
                    type: 'SHOW_NEW_CHAT',
                    chatId,
                    senderId: msg.senderId,
                    senderName,
                    senderPhoto,
                    text: msgBody,
                  };
                  if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage(payload);
                  } else {
                    navigator.serviceWorker.ready
                      .then((reg) => reg.active?.postMessage(payload))
                      .catch(() => {});
                  }
                }
              }
            }

            loadAllGlobalData();
          } catch (err) {}
        });

        es.addEventListener('chats-updated', () => {
          loadAllGlobalData();
        });

        es.addEventListener('new-user', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.user) {
              setAllUsers((prev) => {
                const clean = prev.filter((u) => u.id !== data.user.id);
                return [data.user, ...clean];
              });
            }
          } catch (err) {}
        });

        es.addEventListener('global-notification', (e) => {
          try {
            const data = JSON.parse(e.data);
            setUnreadNotifCount((prev) => prev + 1);
            showToast(`Pengumuman: ${data?.notification?.title || 'Pengumuman Baru'}`);
            window.dispatchEvent(new CustomEvent('ze-notification-received', { detail: data }));
          } catch {}
        });

        es.addEventListener('user-notification', (e) => {
          try {
            const data = JSON.parse(e.data);
            setUnreadNotifCount((prev) => prev + 1);
            showToast(`${data?.notification?.title || 'Notifikasi Baru'}`);
            window.dispatchEvent(new CustomEvent('ze-notification-received', { detail: data }));
          } catch {}
        });

        es.addEventListener('notifications-updated', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (typeof data?.unreadCount === 'number') {
              setUnreadNotifCount(data.unreadCount);
            }
            window.dispatchEvent(new CustomEvent('ze-notifications-updated', { detail: data }));
          } catch {}
        });

        es.addEventListener('payment-updated', (e) => {
          try {
            const data = JSON.parse(e.data);
            window.dispatchEvent(new CustomEvent('ze-payment-updated', { detail: data }));
          } catch {}
        });

        es.addEventListener('owner-order-updated', (e) => {
          try {
            const data = JSON.parse(e.data);
            window.dispatchEvent(new CustomEvent('ze-owner-order-updated', { detail: data }));
          } catch {}
        });

        // Instant Server-Side Role Synchronization across all devices
        es.addEventListener('role-updated', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.userId && currentUser?.id && String(data.userId).toUpperCase() === String(currentUser.id).toUpperCase()) {
              setCurrentUser((prev: any) => {
                if (!prev) return prev;
                const nextIsVip = data.isVip !== undefined ? Boolean(data.isVip) : Boolean(prev.isVip || prev.vip);
                const nextVipLevel: 'basic' | 'exclusive' | undefined = nextIsVip
                  ? data.vipLevel === 'exclusive' || data.isVipExclusive === true
                    ? 'exclusive'
                    : data.vipLevel === 'basic'
                    ? 'basic'
                    : prev.vipLevel || 'basic'
                  : undefined;
                return {
                  ...prev,
                  role: data.role !== undefined ? data.role : prev.role,
                  isAdmin: data.isAdmin !== undefined ? data.isAdmin : prev.isAdmin,
                  isVip: nextIsVip,
                  vip: nextIsVip,
                  vipLevel: nextVipLevel,
                  isVipExclusive: Boolean(nextIsVip && nextVipLevel === 'exclusive'),
                  vipExpiresAt: data.vipExpiresAt !== undefined ? data.vipExpiresAt : prev.vipExpiresAt,
                  adminPermissions: data.permissions || prev.adminPermissions
                };
              });

              if (data.isAdmin === false && data.role === 'user') {
                setShowOwnerDashboard(false);
                showToast('Akses status ADMIN Anda telah dicabut oleh Owner');
              } else if (data.isAdmin) {
                showToast('Status akun Anda resmi diperbarui menjadi ADMIN (Centang Perak)');
              } else if (data.isVip) {
                showToast(
                  data.vipLevel === 'exclusive' || data.isVipExclusive
                    ? 'Status VIP EKSKLUSIF & Dark AI Anda aktif!'
                    : 'Status VIP BASIC Anda aktif!'
                );
              }
            }
            loadAllGlobalData(true);
          } catch {}
        });

        es.addEventListener('user-updated', () => {
          loadAllGlobalData(true);
        });

        // REALTIME WEBRTC CALL SIGNALING EVENTS ACROSS HP1 & HP2
        es.addEventListener('incoming-call', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (currentUser?.id && String(data.receiverId).toLowerCase() === String(currentUser.id).toLowerCase()) {
              setActiveCallSession({
                callId: data.callId,
                type: data.type || 'video',
                isCaller: false,
                partnerId: String(data.callerId),
                partnerName: data.callerName || 'Pengguna ZE.io',
                partnerPhoto: data.callerPhoto || ''
              });

              // Native Android Notification via Service Worker (with ANGKAT & TOLAK actions)
              if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'SHOW_INCOMING_CALL',
                  callId: data.callId,
                  callerId: data.callerId,
                  callerName: data.callerName || 'Pengguna ZE.io',
                  callerPhoto: data.callerPhoto || '/assets/ze_logo.png',
                  callType: data.type || 'video'
                });
              }
            }
          } catch {}
        });

        es.addEventListener('call-accepted', (e) => {
          try {
            const data = JSON.parse(e.data);
            window.dispatchEvent(new CustomEvent('ze-call-accepted', { detail: data }));
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'DISMISS_CALL_NOTIFICATION',
                callId: data.callId
              });
            }
          } catch {}
        });

        es.addEventListener('call-rejected', (e) => {
          try {
            const data = JSON.parse(e.data);
            window.dispatchEvent(new CustomEvent('ze-call-rejected', { detail: data }));
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'DISMISS_CALL_NOTIFICATION',
                callId: data.callId
              });
            }
            showToast('Panggilan ditolak');
          } catch {}
        });

        es.addEventListener('call-signal', (e) => {
          try {
            const data = JSON.parse(e.data);
            window.dispatchEvent(new CustomEvent('ze-call-signal', { detail: data }));
          } catch {}
        });

        es.addEventListener('call-ended', (e) => {
          try {
            const data = JSON.parse(e.data);
            window.dispatchEvent(new CustomEvent('ze-call-ended', { detail: data }));
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'DISMISS_CALL_NOTIFICATION',
                callId: data.callId
              });
            }
          } catch {}
        });

        es.onerror = () => {
          es?.close();
          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch (err) {}
    };

    connectSSE();

    // Authoritative Server Role Fetch on connection
    if (currentUser?.id) {
      fetch(`/api/auth/role/${encodeURIComponent(currentUser.id)}`)
        .then((r) => r.json())
        .then((roleData) => {
          if (roleData && roleData.success) {
            if (!roleData.isOwner && !roleData.isAdmin) {
              setShowOwnerDashboard(false);
            }
            setCurrentUser((prev: any) => {
              if (!prev) return prev;
              const serverIsVip = Boolean(roleData.isVip);
              const serverVipLevel: 'basic' | 'exclusive' | undefined = roleData.isOwner
                ? 'exclusive'
                : serverIsVip
                ? roleData.vipLevel === 'exclusive' || roleData.isVipExclusive
                  ? 'exclusive'
                  : 'basic'
                : undefined;
              const serverIsExclusive = Boolean(roleData.isOwner || (serverIsVip && serverVipLevel === 'exclusive'));

              if (
                prev.role !== roleData.role ||
                prev.isAdmin !== roleData.isAdmin ||
                Boolean(prev.isVip || prev.vip) !== serverIsVip ||
                prev.vipLevel !== serverVipLevel ||
                Boolean(prev.isVipExclusive) !== serverIsExclusive
              ) {
                return {
                  ...prev,
                  role: roleData.role,
                  isAdmin: roleData.isAdmin,
                  isOwner: roleData.isOwner,
                  isVip: serverIsVip,
                  vip: serverIsVip,
                  vipLevel: serverVipLevel,
                  isVipExclusive: serverIsExclusive,
                  vipExpiresAt: roleData.vipExpiresAt || 0,
                  adminPermissions: roleData.permissions || prev.adminPermissions
                };
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }

    return () => {
      es?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [currentUser?.id]);

  // Periodic polling & event listeners (Fast fallback sync)
  useEffect(() => {
    if (!currentUser) return;
    loadAllGlobalData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadAllGlobalData();
    }, 8000);

    // Online presence heartbeat across HP1 & HP2
    const sendAppHeartbeat = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username || currentUser.name,
        }),
      }).catch(() => {});
    };
    sendAppHeartbeat();
    const heartbeatTimer = setInterval(sendAppHeartbeat, 15000);

    const onFriendsUpdated = () => loadAllGlobalData();
    const onChatsUpdated = () => loadAllGlobalData();
    window.addEventListener('friends-updated', onFriendsUpdated);
    window.addEventListener('chats-updated', onChatsUpdated);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('vn_chat');
      channel.onmessage = () => loadAllGlobalData();
    } catch (e) {}

    return () => {
      clearInterval(interval);
      clearInterval(heartbeatTimer);
      window.removeEventListener('friends-updated', onFriendsUpdated);
      window.removeEventListener('chats-updated', onChatsUpdated);
      channel?.close();
    };
  }, [currentUser]);

  // Background Audio Controller
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;
    if (isMusicPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isMusicPlaying, currentTrackIndex, externalMusicUrl]);

  // Call timer effect
  useEffect(() => {
    let timer: any = null;
    if (activeSubpage === 'call-active') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeSubpage]);

  // ------------------------------------------------------------------------
  // AUTH
  // ------------------------------------------------------------------------
  const setUserSession = (user: UserProfile) => {
    const cleanUid = String(user.id || '').trim().toUpperCase();
    const resolvedPhoto =
      user.photo ||
      user.avatar ||
      (cleanUid ? localStorage.getItem(`ze_avatar_${cleanUid}`) : '') ||
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name || user.username || 'Z')}`;
    const syncedUser: UserProfile = {
      ...user,
      photo: resolvedPhoto,
      avatar: resolvedPhoto
    };

    // Never keep un-namespaced global avatar keys that could leak across accounts
    localStorage.removeItem('ze_avatar');
    localStorage.removeItem('ze_photo');
    if (cleanUid && resolvedPhoto) {
      try {
        localStorage.setItem(`ze_avatar_${cleanUid}`, resolvedPhoto);
      } catch {}
    }

    setSelectedProfileUser(null);
    setIsPostModalOpen(false);
    setCurrentUser(syncedUser);
    localStorage.setItem('zeio-user', JSON.stringify(syncedUser));
    localStorage.setItem('vn_currentUser', JSON.stringify(syncedUser));
    localStorage.setItem('vn_session', JSON.stringify(syncedUser));
    localStorage.setItem('ze_user', JSON.stringify(syncedUser));
    localStorage.setItem('ze_name', syncedUser.name);
    localStorage.setItem('ze_username', syncedUser.username);
    localStorage.setItem('ze_id', syncedUser.id);
    localStorage.setItem('ze_isOwner', String(Boolean(syncedUser.isOwner)));
    window.dispatchEvent(new Event('ze-user-store-updated'));
    window.dispatchEvent(new Event('zeio-user-updated'));
    navigate('/', true);
  };

  // ------------------------------------------------------------------------
  // GLOBAL REGISTER (FIRESTORE ze_users + BACKEND)
  // ------------------------------------------------------------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanUsername = regUsername.trim();
    const lowerUsername = cleanUsername.toLowerCase();
    const cleanName = regName.trim() || cleanUsername;
    const cleanPass = regPassword.trim();

    if (!cleanUsername || !cleanPass) {
      setAuthError('Mohon isi username dan password');
      triggerPandaError();
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,15}$/.test(cleanUsername)) {
      setAuthError('Username harus 3-15 karakter (huruf, angka, underscore)');
      triggerPandaError();
      return;
    }

    if (cleanPass.length < 6) {
      setAuthError('Password minimal 6 karakter');
      triggerPandaError();
      return;
    }

    // 1. CEK USERNAME OWNER
    if (lowerUsername === 'ze.io' || cleanName.toLowerCase() === 'zvn3') {
      setAuthError('Username ZE.io punya owner, gabisa dipake');
      triggerPandaError();
      setToastMsg('Username ZE.io punya owner, gabisa dipake');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    // 2. CEK GLOBAL APAKAH USERNAME SUDAH ADA DI FIRESTORE
    let isUsernameTaken = false;
    if (db) {
      try {
        const q = query(collection(db, "ze_users"), where("username", "==", cleanUsername));
        const snap = await getDocs(q);
        if (!snap.empty) {
          isUsernameTaken = true;
        }
      } catch (err) {
        console.warn('Firestore register check notice:', err);
      }
    }

    // Cek juga ke server global backend
    if (!isUsernameTaken) {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const uData = await res.json();
          const serverUsers = uData.users || [];
          if (serverUsers.some((u: any) => (u.username || '').toLowerCase() === lowerUsername)) {
            isUsernameTaken = true;
          }
        }
      } catch (err) {}
    }

    if (isUsernameTaken) {
      setAuthError('Username sudah digunakan');
      triggerPandaError();
      setToastMsg('Username sudah digunakan');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    // 3. BUAT USER GLOBAL
    const newId = generateZeId();
    const newUser: UserProfile = {
      id: newId,
      username: cleanUsername,
      name: cleanName,
      pass: cleanPass,
      password: cleanPass,
      passwordHash: btoa(cleanPass),
      role: 'user',
      isOwner: false,
      isVerified: false,
      photo: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
      bio: 'Hey there! I am using ZE.io.',
      followers: 0,
      createdAt: Date.now(),
      joinedDate: 'October 2026',
    };

    // Simpan ke Firestore ze_users
    if (db) {
      try {
        const firestoreUser = {
          ...newUser,
          id: newId.toUpperCase(),
          id_upper: newId.toUpperCase(),
          username: cleanUsername.toLowerCase().trim(),
          username_lower: cleanUsername.toLowerCase().trim(),
          name: cleanName,
          name_lower: cleanName.toLowerCase(),
          password: cleanPass,
          verified: false,
          blueTick: false,
          isVerified: false,
          createdAt: Date.now()
        };
        await setDoc(doc(db, "ze_users", newId.toUpperCase()), firestoreUser);
        await setDoc(doc(db, "ze_users", cleanUsername.toLowerCase().trim()), firestoreUser, { merge: true });
        await setDoc(doc(db, "users", newId.toUpperCase()), firestoreUser);
      } catch (err) {
        console.warn('Firestore setDoc user notice:', err);
      }
    }

    // Simpan ke backend global sync (HP1 <-> HP2)
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    }).catch(() => {});

    completeAuthWithPanda(newUser);
  };

  // ------------------------------------------------------------------------
  // GLOBAL LOGIN (OWNER KHUSUS & FIRESTORE ze_users)
  // ------------------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const input = loginIdentifier.trim();
    const lowerInput = input.toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!input || !cleanPass) {
      setAuthError('Mohon masukkan ZE ID / Username dan Password');
      triggerPandaError();
      return;
    }

    // 1. OWNER TETEP KHUSUS, AMBIL FOTO PROFIL MILIK ZE-OWNER DARI SERVER (BUKAN CACHE GLOBAL AKUN LAIN)
    if ((lowerInput === 'ze.io' || lowerInput === 'zvn3' || lowerInput === 'ze-owner') && cleanPass === '112007') {
      let ownerSavedPhoto = localStorage.getItem('ze_avatar_ZE-OWNER') || '';
      let ownerSavedBio = 'Official Owner & Creator of ZE.io 🚀';
      try {
        const ownerRes = await fetch('/api/owner/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'ZE.io', password: cleanPass }),
        });
        const ownerJson = await ownerRes.json();
        if (ownerJson && ownerJson.success && ownerJson.token) {
          localStorage.setItem('ze_owner_token', ownerJson.token);
        }
      } catch {}

      try {
        const authRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: 'ZE-OWNER', password: cleanPass }),
        });
        if (authRes.ok) {
          const authJson = await authRes.json();
          if (authJson?.success && authJson?.user) {
            if (authJson.ownerToken) {
              localStorage.setItem('ze_owner_token', authJson.ownerToken);
            }
            ownerSavedPhoto = authJson.user.photo || authJson.user.avatar || ownerSavedPhoto;
            ownerSavedBio = authJson.user.bio || ownerSavedBio;
          }
        }
      } catch {}

      const finalOwnerPhoto =
        ownerSavedPhoto || 'https://api.dicebear.com/9.x/initials/svg?seed=zvn3';

      const ownerUser: UserProfile = {
        id: 'ZE-OWNER',
        username: 'ZE.io',
        name: 'zvn3',
        pass: '112007',
        password: '112007',
        passwordHash: btoa('112007'),
        role: 'owner',
        isOwner: true,
        isAdmin: false,
        isVip: true,
        vip: true,
        vipLevel: 'exclusive',
        isVipExclusive: true,
        isVerified: true,
        photo: finalOwnerPhoto,
        avatar: finalOwnerPhoto,
        bio: ownerSavedBio,
        followers: 9999,
        createdAt: Date.now(),
        joinedDate: 'October 2026',
      };

      if (db) {
        const ownerDoc = {
          id: 'ZE-OWNER',
          id_upper: 'ZE-OWNER',
          username: 'ze.io',
          username_lower: 'ze.io',
          name: 'zvn3',
          name_lower: 'zvn3',
          photo: finalOwnerPhoto,
          avatar: finalOwnerPhoto,
          verified: true,
          blueTick: true,
          isVerified: true,
          isOwner: true,
          role: 'owner',
          createdAt: Date.now()
        };
        setDoc(doc(db, "ze_users", "ZE-OWNER"), ownerDoc, { merge: true }).catch(() => {});
        setDoc(doc(db, "ze_users", "ze.io"), ownerDoc, { merge: true }).catch(() => {});
        setDoc(doc(db, "ze_users", "ZE.io"), ownerDoc, { merge: true }).catch(() => {});
      }
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerUser),
      }).catch(() => {});

      completeAuthWithPanda(ownerUser);
      return;
    }

    // 2. CEK AUTHORITATIVE SERVER LOGIN (/api/auth/login) UNTUK ROLE ADMIN & VIP PERMANEN
    try {
      const authRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: input, password: cleanPass }),
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData && authData.success && authData.user) {
          const u = authData.user;
          if (authData.ownerToken) {
            localStorage.setItem('ze_owner_token', authData.ownerToken);
          } else {
            localStorage.removeItem('ze_owner_token');
          }
          const isLoginOwner = Boolean(u.isOwner || u.role === 'owner');
          const isLoginVip = Boolean(isLoginOwner || u.isVip || u.vip);
          const loginVipLevel: 'basic' | 'exclusive' | undefined = isLoginOwner
            ? 'exclusive'
            : isLoginVip
            ? u.vipLevel === 'exclusive' || u.isVipExclusive
              ? 'exclusive'
              : 'basic'
            : undefined;
          const serverSyncedUser: UserProfile = {
            ...u,
            id: u.id,
            name: u.name || u.username,
            username: u.username,
            role: u.role || 'user',
            isOwner: isLoginOwner,
            isAdmin: Boolean(u.isAdmin || u.role === 'admin'),
            isVip: isLoginVip,
            vip: isLoginVip,
            vipLevel: loginVipLevel,
            isVipExclusive: Boolean(isLoginOwner || (isLoginVip && loginVipLevel === 'exclusive')),
            vipExpiresAt: u.vipExpiresAt || undefined,
            adminPermissions: u.adminPermissions || undefined,
            isVerified: Boolean(isLoginOwner || u.isVerified || u.verified),
          };
          completeAuthWithPanda(serverSyncedUser);
          return;
        }
      }
    } catch {}

    // 3. CEK GLOBAL DI FIRESTORE
    let found: any = null;
    if (db) {
      try {
        const q = query(
          collection(db, "ze_users"),
          where("username", "==", input),
          where("password", "==", cleanPass)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          found = snap.docs[0].data();
        }
      } catch (err) {
        console.warn('Firestore login notice:', err);
      }
    }

    // 4. CEK BACKEND SERVER GLOBAL (/api/users)
    if (!found) {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const uData = await res.json();
          const serverUsers = uData.users || [];
          found = serverUsers.find(
            (u: any) =>
              ((u.username && u.username.toLowerCase() === lowerInput) ||
                (u.id && u.id.toLowerCase() === lowerInput)) &&
              (u.password === cleanPass || u.pass === cleanPass || u.passwordHash === btoa(cleanPass))
          );
        }
      } catch (err) {}
    }

    if (!found) {
      setAuthError('Akun tidak ditemukan atau password salah');
      triggerPandaError();
      setToastMsg('Akun tidak ditemukan atau password salah');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    localStorage.removeItem('ze_owner_token');
    let resolvedRole = found.role || 'user';
    let resolvedIsAdmin = Boolean(found.isAdmin || found.role === 'admin');
    let resolvedIsVip = Boolean(found.isVip || found.vip);
    let resolvedVipLevel: 'basic' | 'exclusive' | undefined = resolvedIsVip
      ? found.vipLevel === 'exclusive' || found.isVipExclusive
        ? 'exclusive'
        : 'basic'
      : undefined;
    let resolvedVipExpiresAt = found.vipExpiresAt;
    let resolvedPerms = found.adminPermissions;

    // Tarik role permanen dari server sebelum menyimpan sesi
    if (found.id) {
      try {
        const rRes = await fetch(`/api/auth/role/${encodeURIComponent(found.id)}`);
        if (rRes.ok) {
          const rData = await rRes.json();
          if (rData && rData.success) {
            resolvedRole = rData.role || resolvedRole;
            resolvedIsAdmin = Boolean(rData.isAdmin);
            resolvedIsVip = Boolean(rData.isVip);
            resolvedVipLevel = resolvedIsVip
              ? rData.vipLevel === 'exclusive' || rData.isVipExclusive
                ? 'exclusive'
                : 'basic'
              : undefined;
            resolvedVipExpiresAt = rData.vipExpiresAt || resolvedVipExpiresAt;
            resolvedPerms = rData.permissions || resolvedPerms;
          }
        }
      } catch {}
    }

    const normalUser: UserProfile = {
      ...found,
      id: found.id || ('ZE-' + Math.random().toString(36).substring(2, 8).toUpperCase()),
      name: found.name || found.username,
      username: found.username,
      role: resolvedRole,
      isOwner: false,
      isAdmin: resolvedIsAdmin,
      isVip: resolvedIsVip,
      vip: resolvedIsVip,
      vipLevel: resolvedVipLevel,
      isVipExclusive: Boolean(resolvedIsVip && resolvedVipLevel === 'exclusive'),
      vipExpiresAt: resolvedVipExpiresAt,
      adminPermissions: resolvedPerms,
      isVerified: Boolean(found.isVerified || found.verified || found.blueTick),
    };

    // Sinkronkan akun Firestore ke backend global bila belum terdaftar di server
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...normalUser, password: cleanPass, pass: cleanPass }),
    }).catch(() => {});

    completeAuthWithPanda(normalUser);
  };

  const handleLogout = () => {
    clearUserStore();
    setSelectedProfileUser(null);
    setIsPostModalOpen(false);
    setShowOwnerDashboard(false);
    setShowKeyStore(false);
    setShowTopUpDiamond(false);
    setActiveSubpage(null);
    setActiveTab('updates');
    setPandaFocusedField('none');
    setPandaLookProgress(0);
    setPandaMood('idle');
    setCurrentUser(null);
    navigate('/auth', true);
  };

  // ------------------------------------------------------------------------
  // ACTIONS: OPEN CHAT, OPEN PROFILE, FRIEND REQUEST
  // ------------------------------------------------------------------------
  const openChatWith = async (friend: UserProfile) => {
    if (!currentUser || !friend) return;
    const cleanMyId = String(currentUser.id).toUpperCase();
    const cleanFriendId = String(friend.id).toUpperCase();
    const chatId = [cleanMyId, cleanFriendId].sort().join('_');

    const chatDoc: ChatItem = {
      id: chatId,
      chatId,
      type: 'direct',
      participants: [cleanMyId, cleanFriendId],
      participantsInfo: {
        [cleanMyId]: { name: currentUser.name, photo: currentUser.photo },
        [cleanFriendId]: { name: friend.name, photo: friend.photo },
      },
      lastMessage: 'Mulai percakapan',
      lastTime: Date.now(),
    };

    // Ensure friend is in local allUsers and friends lists
    setAllUsers((prev) => {
      if (prev.some((u) => String(u.id).toUpperCase() === cleanFriendId)) return prev;
      return [friend, ...prev];
    });
    setFriends((prev) => {
      if (prev.some((f) => String(f.id).toUpperCase() === cleanFriendId)) return prev;
      return [friend, ...prev];
    });

    // Make mutual friends in backend
    fetch('/api/friend_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', from: cleanFriendId, to: cleanMyId }),
    }).catch(() => {});

    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat: chatDoc }),
    }).catch(() => {});

    if (db) {
      setDoc(doc(db, 'chats', chatId), chatDoc, { merge: true }).catch(() => {});
    }

    let allChats: ChatItem[] = [];
    try {
      allChats = JSON.parse(localStorage.getItem('vn_chats_global') || '[]');
    } catch (e) {}
    const existingIdx = allChats.findIndex((c) => c.id === chatId || c.chatId === chatId);
    if (existingIdx >= 0) {
      allChats[existingIdx] = { ...allChats[existingIdx], ...chatDoc };
    } else {
      allChats.unshift(chatDoc as any);
    }
    localStorage.setItem('vn_chats_global', JSON.stringify(allChats));
    setChats(allChats);
    window.dispatchEvent(new Event('chats-updated'));

    setActiveChatId(chatId);
    setActiveSubpage('chat-room');
    navigate(`/chat/${friend.id || chatId}`);
  };

  const openGroupChat = (groupId: string, origin?: 'group-list' | 'chats' | 'updates') => {
    if (origin) {
      groupChatOriginRef.current = origin;
    }
    setActiveGroupId(groupId);
    setActiveChatId(groupId);
    setActiveSubpage('group-chat');
    navigate(`/chat/${groupId}`);
  };

  const openProfile = (user: UserProfile) => {
    setSelectedProfileUser(user);
  };

  const sendFriendRequest = async (targetUser: UserProfile) => {
    if (!currentUser) return;
    if (targetUser.id === currentUser.id) return;

    await fetch('/api/friend_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', from: currentUser.id, to: targetUser.id }),
    }).catch(() => {});

    if (db) {
      addDoc(collection(db, 'friend_requests'), {
        from: currentUser.id,
        to: targetUser.id,
        status: 'pending',
        time: Date.now(),
      }).catch(() => {});
    }

    showToast(`Permintaan pertemanan terkirim ke @${targetUser.username} (${targetUser.id})`);
  };

  const acceptFriendRequest = async (senderId: string) => {
    if (!currentUser) return;

    await fetch('/api/friend_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', from: senderId, to: currentUser.id }),
    }).catch(() => {});

    if (db) {
      setDoc(doc(db, 'friendships', `${currentUser.id}_${senderId}`), {
        users: [currentUser.id, senderId],
        createdAt: Date.now(),
      }).catch(() => {});
    }

    let friendsMap: Record<string, string[]> = {};
    try {
      friendsMap = JSON.parse(localStorage.getItem('vn_friends') || '{}');
    } catch (e) {}
    friendsMap[currentUser.id] = Array.from(new Set([...(friendsMap[currentUser.id] || []), senderId]));
    friendsMap[senderId] = Array.from(new Set([...(friendsMap[senderId] || []), currentUser.id]));
    localStorage.setItem('vn_friends', JSON.stringify(friendsMap));

    const chatId = [currentUser.id, senderId].sort().join('_');
    const sender = allUsers.find((u) => u.id === senderId);
    const initialChat: ChatItem = {
      id: chatId,
      chatId,
      type: 'direct',
      participants: [currentUser.id, senderId],
      participantsInfo: {
        [currentUser.id]: { name: currentUser.name, photo: currentUser.photo },
        [senderId]: { name: sender?.name || 'Teman', photo: sender?.photo },
      },
      lastMessage: 'Berteman - mulai chat!',
      lastTime: Date.now(),
    };

    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat: initialChat }),
    }).catch(() => {});

    if (db) {
      setDoc(doc(db, 'chats', chatId), initialChat, { merge: true }).catch(() => {});
    }

    window.dispatchEvent(new Event('friends-updated'));
    window.dispatchEvent(new Event('chats-updated'));
    loadAllGlobalData();
  };

  const rejectFriendRequest = async (senderId: string) => {
    if (!currentUser) return;
    await fetch('/api/friend_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', from: senderId, to: currentUser.id }),
    }).catch(() => {});

    setFriendRequests((prev) => prev.filter((r) => r.from !== senderId));
  };

  // ------------------------------------------------------------------------
  // CUSTOM PHOTO UPLOAD
  // ------------------------------------------------------------------------
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const cleanUid = String(currentUser.id).trim().toUpperCase();
    const base64 = await compressImage(file, 450, 450, 0.8);
    if (!base64) return;

    let finalPhotoUrl = base64;
    try {
      const res = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: cleanUid, photo: base64 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.photo) {
          finalPhotoUrl = data.photo;
        }
      } else {
        const fallbackRes = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...currentUser, id: cleanUid, photo: base64, avatar: base64 }),
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          if (fbData?.user?.photo) finalPhotoUrl = fbData.user.photo;
        }
      }
    } catch {}

    const updatedUser = { ...currentUser, photo: finalPhotoUrl, avatar: finalPhotoUrl };
    localStorage.removeItem('ze_avatar');
    localStorage.removeItem('ze_photo');
    try {
      localStorage.setItem(`ze_avatar_${cleanUid}`, finalPhotoUrl);
      localStorage.setItem('ze_user', JSON.stringify(updatedUser));
      localStorage.setItem('zeio-user', JSON.stringify(updatedUser));
      localStorage.setItem('vn_currentUser', JSON.stringify(updatedUser));
      localStorage.setItem('vn_session', JSON.stringify(updatedUser));
    } catch {}

    setCurrentUser(updatedUser);
    setAllUsers((prev) => {
      const updatedList = prev.map((u) =>
        String(u.id).toUpperCase() === cleanUid
          ? { ...u, photo: finalPhotoUrl, avatar: finalPhotoUrl }
          : u
      );
      try {
        localStorage.setItem('vn_users', JSON.stringify(updatedList));
      } catch {}
      return updatedList;
    });
    setFriends((prev) =>
      prev.map((f) =>
        String(f.id).toUpperCase() === cleanUid
          ? { ...f, photo: finalPhotoUrl, avatar: finalPhotoUrl }
          : f
      )
    );

    window.dispatchEvent(new Event('ze-user-store-updated'));
    window.dispatchEvent(new Event('zeio-user-updated'));

    if (db) {
      setDoc(doc(db, 'ze_users', cleanUid), { photo: finalPhotoUrl, avatar: finalPhotoUrl }, { merge: true }).catch(() => {});
    }
    if (e.target) e.target.value = '';
    showToast('Foto profil akun berhasil diperbarui');
  };

  const saveProfileEdits = () => {
    if (!currentUser) return;
    const dup = checkDuplicateUser(editName, currentUser.username, currentUser.id);
    if (dup.isDuplicate) {
      setToastMsg(dup.reason || 'Akun sudah ada, gunakan nama lain');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }
    const updatedUser = {
      ...currentUser,
      name: editName.trim() || currentUser.name,
      bio: editBio.trim() || currentUser.bio,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('ze_name', updatedUser.name);
    localStorage.setItem('ze_about', updatedUser.bio || '');
    localStorage.setItem('ze_user', JSON.stringify(updatedUser));
    localStorage.setItem('zeio-user', JSON.stringify(updatedUser));
    localStorage.setItem('vn_currentUser', JSON.stringify(updatedUser));
    saveUserToDatabase({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      bio: updatedUser.bio,
    });
    window.dispatchEvent(new Event('ze-user-store-updated'));
    window.dispatchEvent(new Event('zeio-user-updated'));

    const updatedList = allUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setAllUsers(updatedList);
    localStorage.setItem('vn_users', JSON.stringify(updatedList));

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    }).catch(() => {});

    if (db) {
      setDoc(doc(db, 'users', updatedUser.id), updatedUser, { merge: true }).catch(() => {});
    }

    setShowEditProfile(false);
    showToast('Profil berhasil disimpan');
  };

  const handleDirectStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    let mediaUrl = '';
    const isVideo = file.type.startsWith('video');

    if (!isVideo) {
      mediaUrl = await compressImage(file, 720, 720, 0.8);
    } else {
      mediaUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    const newStory: UserStory = {
      id: 'story_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userPhoto: currentUser.photo,
      mediaUrl,
      mediaType: isVideo ? 'video' : 'image',
      caption: '',
      createdAt: Date.now(),
      expiresAt: 0, // Permanent until manually deleted
    };

    setStories((prev) => [newStory, ...prev]);
    localStorage.setItem('vn_stories', JSON.stringify([newStory, ...stories]));

    fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStory),
    }).catch(() => {});

    if (db) {
      addDoc(collection(db, 'stories'), newStory).catch(() => {});
    }

    showToast('Story berhasil diunggah!');
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!currentUser) return;
    setStories((prev) => {
      const updated = prev.filter((s) => s.id !== storyId);
      localStorage.setItem('vn_stories', JSON.stringify(updated));
      return updated;
    });

    fetch(`/api/stories?id=${encodeURIComponent(storyId)}&userId=${encodeURIComponent(currentUser.id)}`, {
      method: 'DELETE',
    }).catch(() => {});

    if (db) {
      try {
        const q = query(collection(db, 'stories'), where('id', '==', storyId));
        getDocs(q).then((snap) => {
          snap.forEach((d) => deleteDoc(d.ref).catch(() => {}));
        }).catch(() => {});
      } catch (e) {}
    }

    if (activeStoryViewer?.id === storyId) {
      setActiveStoryViewer(null);
    }

    showToast('Story berhasil dihapus');
  };

  // ------------------------------------------------------------------------
  // REAL WEBRTC CALL ENGINE (AUTHENTIC PEER-TO-PEER AUDIO & VIDEO CALLS)
  // ------------------------------------------------------------------------
  const startCall = async (target: UserProfile, type: 'audio' | 'video') => {
    if (!currentUser?.id) {
      showToast('Silakan login terlebih dahulu untuk melakukan panggilan');
      return;
    }
    if (String(target.id) === String(currentUser.id)) {
      showToast('Tidak dapat memanggil akun sendiri');
      return;
    }

    try {
      const res = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerId: currentUser.id,
          callerName: currentUser.name || currentUser.username,
          callerPhoto: currentUser.photo || currentUser.avatar || '',
          receiverId: target.id,
          receiverName: target.name,
          receiverPhoto: target.photo || target.avatar || '',
          type
        })
      });
      const data = await res.json();
      if (data?.success && data.callId) {
        setActiveCallSession({
          callId: data.callId,
          type,
          isCaller: true,
          partnerId: String(target.id),
          partnerName: target.name,
          partnerPhoto: target.photo || target.avatar || '',
          partnerUsername: target.username
        });
      } else {
        showToast(data?.message || 'Gagal memulai panggilan');
      }
    } catch {
      showToast('Gagal menghubungi server panggilan');
    }
  };

  const endCall = () => {
    if (activeCallSession) {
      fetch('/api/calls/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: activeCallSession.callId,
          userId: currentUser?.id
        })
      }).catch(() => {});
    }
    setActiveCallSession(null);
    setActiveSubpage(null);
    setActiveCallTarget(null);
  };

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // ------------------------------------------------------------------------
  // IG NOTES LOGIC
  // ------------------------------------------------------------------------
  const saveNote = async (text: string, emoji: string) => {
    if (!currentUser || !text.trim()) return;
    const newNote: UserNote = {
      userId: currentUser.id,
      userName: currentUser.name,
      userPhoto: currentUser.photo,
      text: text.trim().slice(0, 60),
      emoji: emoji || '💭',
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    setNotesMap((prev) => ({ ...prev, [currentUser.id]: newNote }));

    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote }),
    }).catch(() => {});

    if (db) {
      setDoc(doc(db, 'notes', currentUser.id), newNote).catch(() => {});
    }

    setShowCreateNoteModal(false);
    showToast('Catatan dibagikan');
  };

  const deleteMyNote = async () => {
    if (!currentUser) return;
    setNotesMap((prev) => {
      const copy = { ...prev };
      delete copy[currentUser.id];
      return copy;
    });

    fetch(`/api/notes?userId=${encodeURIComponent(currentUser.id)}`, { method: 'DELETE' }).catch(() => {});

    if (db) {
      deleteDoc(doc(db, 'notes', currentUser.id)).catch(() => {});
    }
    showToast('Catatan dihapus');
  };

  // ------------------------------------------------------------------------
  // RENDER AUTH PAGE
  // Bungkus route Beranda, Music, Community, Chats, You, Chat, Global, AI, Bug, RW dengan cek itu.
  // Halaman buat akun/login yang sudah ada jangan diubah.
  // ------------------------------------------------------------------------
  if (!currentUser || !localStorage.getItem('zeio-user') || pathname === '/auth' || pathname.includes('/auth')) {
    const activePasswordLen = authMode === 'register' ? regPassword.length : loginPassword.length;
    const pandaIsCoveringEyes = pandaFocusedField === 'password' && activePasswordLen > 0;
    const pandaIsTrackingText = pandaFocusedField === 'text';

    return (
      <ThemeProvider>
        <VideoBackground />
        <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center p-4 py-6 relative overflow-y-auto overflow-x-hidden z-10">
          <LoginPanda
            isCoveringEyes={pandaIsCoveringEyes}
            isTrackingText={pandaIsTrackingText}
            lookProgress={pandaLookProgress}
            mood={pandaMood}
            errorTrigger={pandaErrorTick}
            lastActivityAt={pandaLastActivity}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm glass-panel rounded-[28px] p-7 shadow-2xl relative z-10"
          >
            <div className="text-center mb-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/20 shadow-2xl mb-3 bg-black flex items-center justify-center p-0.5">
                <img src="/assets/ze_logo.png" alt="ZE.io Logo" className="w-full h-full object-cover rounded-xl" />
              </div>
              <h1 className="text-3xl font-extralight tracking-[6px] text-white">ZE.io</h1>
              <p className="text-xs text-white/50 mt-1 font-medium">Next-Gen Realtime Social &amp; ID</p>
            </div>

            <div className="flex glass-navbar p-1 rounded-full mb-6 border border-white/15">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setPandaFocusedField('none');
                  setPandaLookProgress(0);
                  setPandaMood('idle');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  authMode === 'login' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                Masuk
              </button>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                  setPandaFocusedField('none');
                  setPandaLookProgress(0);
                  setPandaMood('idle');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  authMode === 'register' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                Daftar
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
                {authError}
              </div>
            )}

            {authMode === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="text-[11px] text-zinc-200 font-semibold block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    placeholder="Nama Anda"
                    value={regName}
                    onFocus={(e) => {
                      setPandaFocusedField('text');
                      updatePandaCursorLook(e.currentTarget);
                    }}
                    onBlur={() => setPandaFocusedField((prev) => (prev === 'text' ? 'none' : prev))}
                    onClick={(e) => updatePandaCursorLook(e.currentTarget)}
                    onKeyUp={(e) => updatePandaCursorLook(e.currentTarget)}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      updatePandaCursorLook(e.currentTarget);
                    }}
                    className="w-full ze-glass-input rounded-full px-4 py-2.5 text-sm text-white placeholder-zinc-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-200 font-semibold block mb-1">Username Unik</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="username (3-15 char)"
                      value={regUsername}
                      onFocus={(e) => {
                        setPandaFocusedField('text');
                        updatePandaCursorLook(e.currentTarget);
                      }}
                      onBlur={() => setPandaFocusedField((prev) => (prev === 'text' ? 'none' : prev))}
                      onClick={(e) => updatePandaCursorLook(e.currentTarget)}
                      onKeyUp={(e) => updatePandaCursorLook(e.currentTarget)}
                      onChange={(e) => {
                        setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                        updatePandaCursorLook(e.currentTarget);
                      }}
                      className="w-full ze-glass-input rounded-full pl-8 pr-4 py-2.5 text-sm text-white placeholder-zinc-400 outline-none font-mono"
                    />
                    <span className="absolute left-3.5 top-2.5 text-sm text-zinc-300">@</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-200 font-semibold block mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={regPassword}
                    onFocus={() => {
                      setPandaFocusedField('password');
                      markPandaActivity();
                    }}
                    onBlur={() => setPandaFocusedField((prev) => (prev === 'password' ? 'none' : prev))}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      markPandaActivity();
                    }}
                    className="w-full ze-glass-input rounded-full px-4 py-2.5 text-sm text-white placeholder-zinc-400 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-lg"
                >
                  Buat Akun ZE.io
                </button>
                <p className="text-[10px] text-zinc-300 text-center mt-2">
                  ID unik (ZE-XXXXXX) akan dibuat secara otomatis untuk akun Anda.
                </p>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="text-[11px] text-zinc-200 font-semibold block mb-1">ZE ID atau Username</label>
                  <input
                    type="text"
                    placeholder="Contoh: ZE-A7K9P2 atau @username"
                    value={loginIdentifier}
                    onFocus={(e) => {
                      setPandaFocusedField('text');
                      updatePandaCursorLook(e.currentTarget);
                    }}
                    onBlur={() => setPandaFocusedField((prev) => (prev === 'text' ? 'none' : prev))}
                    onClick={(e) => updatePandaCursorLook(e.currentTarget)}
                    onKeyUp={(e) => updatePandaCursorLook(e.currentTarget)}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      updatePandaCursorLook(e.currentTarget);
                    }}
                    className="w-full ze-glass-input rounded-full px-4 py-2.5 text-sm text-white placeholder-zinc-400 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-200 font-semibold block mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onFocus={() => {
                      setPandaFocusedField('password');
                      markPandaActivity();
                    }}
                    onBlur={() => setPandaFocusedField((prev) => (prev === 'password' ? 'none' : prev))}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      markPandaActivity();
                    }}
                    className="w-full ze-glass-input rounded-full px-4 py-2.5 text-sm text-white placeholder-zinc-400 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-lg"
                >
                  Masuk ke ZE.io
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </ThemeProvider>
    );
  }

  // ------------------------------------------------------------------------
  // REAL WEBRTC ACTIVE / INCOMING CALL SCREEN OVERLAY
  // ------------------------------------------------------------------------
  if (activeCallSession) {
    return (
      <ActiveCallModal
        session={activeCallSession}
        currentUser={currentUser}
        onEndCall={endCall}
      />
    );
  }

  // ------------------------------------------------------------------------
  // STORY VIEWER MODAL
  // ------------------------------------------------------------------------
  const renderStoryViewer = () => {
    if (!activeStoryViewer) return null;
    return (
      <OldLegacyStoryViewerModal
        story={activeStoryViewer}
        currentUser={currentUser}
        onClose={() => setActiveStoryViewer(null)}
        onViewed={(id: string) => markStoryViewed(id)}
        onDeleteStory={(id: string) => handleDeleteStory(id)}
      />
    );
  };

  // ------------------------------------------------------------------------
  // ADD STORY MODAL
  // ------------------------------------------------------------------------
  const renderAddStoryModal = () => {
    if (!showAddStoryModal) return null;
    return (
      <AddStoryModal
        currentUser={currentUser}
        onClose={() => setShowAddStoryModal(false)}
        onStoryAdded={(newStory) => {
          setStories((prev) => [newStory, ...prev]);
          setShowAddStoryModal(false);
          loadAllGlobalData();
        }}
      />
    );
  };

  // ------------------------------------------------------------------------
  // CREATE NOTE MODAL (IG NOTES)
  // ------------------------------------------------------------------------
  const renderCreateNoteModal = () => {
    if (!showCreateNoteModal) return null;
    return (
      <CreateNoteModal
        onClose={() => setShowCreateNoteModal(false)}
        onSave={(text, emoji) => saveNote(text, emoji)}
      />
    );
  };

  // ------------------------------------------------------------------------
  // NOTE VIEWER MODAL
  // ------------------------------------------------------------------------
  const renderNoteViewer = () => {
    if (!activeViewingNote) return null;
    const isMe = activeViewingNote.userId === currentUser.id;
    const author = allUsers.find((u) => u.id === activeViewingNote.userId) || {
      id: activeViewingNote.userId,
      name: activeViewingNote.userName || 'User',
      username: 'user',
      photo: activeViewingNote.userPhoto,
    };

    return (
      <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setActiveViewingNote(null)}>
        <div
          className="w-full max-w-[340px] bg-[#141414]/90 backdrop-blur-[30px] border border-white/10 rounded-[28px] p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-end">
            <button onClick={() => setActiveViewingNote(null)} className="p-1 text-white/50 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="relative inline-block mb-3">
            <Avatar photo={author.photo} name={author.name} size="xl" className="w-20 h-20 text-2xl mx-auto" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap">
              <span>{activeViewingNote.emoji}</span>
              <span>{activeViewingNote.text}</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-white mt-1">{author.name}</h3>
          <p className="text-xs text-white/50 font-mono">@{author.username}</p>

          <div className="flex gap-2 mt-5">
            {isMe ? (
              <button
                onClick={deleteMyNote}
                className="w-full py-2.5 rounded-full bg-red-500/20 text-red-400 font-semibold text-xs border border-red-500/30 hover:bg-red-500/30 transition"
              >
                Hapus Catatan Saya
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setActiveViewingNote(null);
                    openChatWith(author as UserProfile);
                  }}
                  className="flex-1 py-2.5 rounded-full bg-white text-black font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={14} /> Chat
                </button>
                <button
                  onClick={() => {
                    setActiveViewingNote(null);
                    openProfile(author as UserProfile);
                  }}
                  className="flex-1 py-2.5 rounded-full bg-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <User size={14} /> Profil
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ------------------------------------------------------------------------
  // CREATE GROUP MODAL
  // ------------------------------------------------------------------------
  const renderCreateGroupModal = () => {
    if (!showCreateGroupModal) return null;
    return (
      <CreateGroupModal
        currentUser={currentUser}
        friends={friends}
        onClose={() => setShowCreateGroupModal(false)}
        onCreated={(newGroup) => {
          setGroups((prev) => [newGroup, ...prev]);
          setShowCreateGroupModal(false);
          openGroupChat(newGroup.id);
          showToast(`Grup "${newGroup.name}" dibuat`);
        }}
      />
    );
  };

  // ------------------------------------------------------------------------
  // CREATE COMMUNITY MODAL
  // ------------------------------------------------------------------------
  const renderCreateCommunityModal = () => {
    if (!showCreateCommunityModal) return null;
    return (
      <CreateCommunityModal
        currentUser={currentUser}
        onClose={() => setShowCreateCommunityModal(false)}
        onCreated={(newComm) => {
          setCommunities((prev) => [newComm, ...prev]);
          setShowCreateCommunityModal(false);
          setActiveCommunityId(newComm.id);
          setActiveSubpage('community-detail');
          showToast(`Komunitas "${newComm.name}" dibuat`);
        }}
      />
    );
  };

  const isBugActive = showBug || path === '/bug' || activeSubpage === 'bug';
  const isDedicatedFeatureMenuOpen = Boolean(
    showKeyStore ||
      showTopUpDiamond ||
      (showOwnerDashboard && (isUserOwner(currentUser) || isUserAdmin(currentUser)))
  );

  return (
    <ThemeProvider>
      {/* 1. LAYER BACKGROUND VIDEO: FIXED GLOBAL BACKGROUND (Sinkron ke semua halaman) */}
      <VideoBackground />

      {/* 2. LAYER UI KONTEN: Kondisional terpisah - jika bug aktif sembunyikan semua UI beranda utama */}
      {isBugActive ? (
        <LutvoidBugSystem
          onClose={() => {
            setShowBug(false);
            if (path === '/bug') navigate('/');
          }}
        />
      ) : (
        <>
          {showRW && <RwHiddenMenu onClose={() => setShowRW(false)} />}
          <div
            data-logo-anim={appHomeUiConfig.logoAnimation}
            data-logo-anim-enabled={appHomeUiConfig.logoAnimEnabled ? 'true' : 'false'}
            data-logo-anim-style={appHomeUiConfig.logoAnimEnabled ? appHomeUiConfig.logoAnimStyle : 'mati'}
            data-logo-anim-speed={appHomeUiConfig.logoAnimSpeed}
            style={{ '--ze-theme-accent': appThemeTokens.accentColor } as React.CSSProperties}
            className={`relative z-10 min-h-screen bg-transparent text-white selection:bg-white/20 selection:text-white ${
              hideBottomNav ? 'pb-0' : 'pb-32'
            }`}
          >
            {/* STRICT SINGLE-PAGE VIEW RENDERER: Only ONE active page UI mounts over <VideoBackground /> */}
            {/* Saat cek profil (selectedProfileUser), sembunyikan UI sebelumnya agar tidak tembus/ngikut, cukup video latar belakang beranda yang tampil */}
            <div className={selectedProfileUser ? 'hidden' : 'w-full'}>
              {!isDedicatedFeatureMenuOpen &&
              (() => {
                const effectiveSubpage =
                  activeSubpage ||
                  (path === '/global' || path === '/global-chat' || path.startsWith('/global/')
                    ? 'global-chat'
                    : path === '/group-chat'
                    ? 'group-list'
                    : path === '/wink-hd'
                    ? 'wink-hd'
                    : path === '/history'
                    ? 'history'
                    : path === '/ai' || path === '/ze-ai'
                    ? 'ai'
                    : null);

                if (effectiveSubpage === 'history') {
                  return (
                    <HistoryPage
                      currentUser={currentUser}
                      chats={chats}
                      onBack={() => {
                        setActiveSubpage(null);
                        setActiveTab('updates');
                        navigate('/');
                      }}
                      onOpenAppearanceSettings={() => {
                        setSettingsInitialView('home-ui');
                        setActiveSubpage(null);
                        setActiveTab('settings');
                      }}
                      onOpenTikTok={() => setActiveSubpage('tiktok')}
                      onOpenMusic={() => {
                        setActiveSubpage(null);
                        setActiveTab('music');
                      }}
                      onOpenAi={() => setActiveSubpage('ai')}
                      onOpenTopUp={() => setShowTopUpDiamond(true)}
                      onOpenChatTab={() => {
                        setActiveSubpage(null);
                        setActiveTab('chats');
                      }}
                    />
                  );
                }

                if (effectiveSubpage === 'global-chat') {
                  return (
                    <GlobalChatPageView
                      currentUser={currentUser}
                      userCountry={userCountry}
                      onOpenProfile={(u) => openProfile(u)}
                      onBack={() => {
                        setActiveSubpage(null);
                        setActiveTab('chats');
                        navigate('/chats');
                      }}
                    />
                  );
                }

                if (effectiveSubpage === 'group-chat' && activeGroupId) {
                  return (
                    <GroupChatView
                      currentUser={currentUser}
                      groupId={activeGroupId}
                      groups={groups}
                      allUsers={allUsers}
                      onBack={() => {
                        if (groupChatOriginRef.current === 'chats') {
                          setActiveSubpage(null);
                          setActiveTab('chats');
                          navigate('/chats');
                        } else {
                          setActiveSubpage('group-list');
                          navigate('/group-chat');
                        }
                        loadAllGlobalData();
                      }}
                      onOpenInfo={() => setActiveSubpage('group-info')}
                      onViewProfile={(u) => openProfile(u)}
                    />
                  );
                }

                if (effectiveSubpage === 'group-info' && activeGroupId) {
                  return (
                    <GroupInfoView
                      currentUser={currentUser}
                      groupId={activeGroupId}
                      groups={groups}
                      allUsers={allUsers}
                      onBack={() => setActiveSubpage('group-chat')}
                      onViewProfile={(u) => openProfile(u)}
                    />
                  );
                }

                if (effectiveSubpage === 'group-list' || (effectiveSubpage === 'group-chat' && !activeGroupId)) {
                  return (
                    <GroupChatPage
                      onBack={() => {
                        setActiveSubpage(null);
                        setActiveTab('updates');
                        navigate('/');
                      }}
                      onCreateGroup={() => setShowCreateGroupModal(true)}
                      onOpenGroup={(groupId) => openGroupChat(groupId, 'group-list')}
                      groups={groups}
                    />
                  );
                }

                if (effectiveSubpage === 'chat-room' && activeChatId) {
                  return (
                    <ChatRoomView
                      currentUser={currentUser}
                      chatId={activeChatId}
                      allUsers={allUsers}
                      onBack={() => {
                        setActiveSubpage(null);
                        setActiveTab('chats');
                        navigate('/chats');
                        loadAllGlobalData();
                      }}
                      onStartCall={(target, type) => startCall(target, type)}
                      onViewProfile={(u) => openProfile(u)}
                    />
                  );
                }

                if (effectiveSubpage === 'community-detail' && activeCommunityId) {
                  return (
                    <CommunityDetailView
                      currentUser={currentUser}
                      communityId={activeCommunityId}
                      communities={communities}
                      allUsers={allUsers}
                      onBack={() => {
                        setActiveSubpage(null);
                        setActiveTab('comm');
                        navigate('/comm');
                      }}
                      onViewProfile={(u) => openProfile(u)}
                    />
                  );
                }

                if (effectiveSubpage === 'tiktok') {
                  return (
                    <TikTokDownloaderPage
                      onBack={() => {
                        setActiveSubpage(null);
                        navigate('/');
                      }}
                      onPlayAsMusic={(track) => {
                        handlePlayTrack({
                          ...track,
                          url: track.videoUrl || track.audioUrl,
                        });
                        showToast('Memutar audio & video TikTok...');
                      }}
                    />
                  );
                }

                if (effectiveSubpage === 'bgmusic') {
                  return (
                    <BgMusicPage
                      tracks={MUSIC_TRACKS}
                      currentTrackIndex={currentTrackIndex}
                      setCurrentTrackIndex={setCurrentTrackIndex}
                      isMusicPlaying={isMusicPlaying}
                      setIsMusicPlaying={setIsMusicPlaying}
                      onPlayExternal={(url) => {
                        setExternalMusicUrl(url);
                        setIsMusicPlaying(true);
                        showToast('Memutar audio...');
                      }}
                      onBack={() => setActiveSubpage(null)}
                    />
                  );
                }

                if (effectiveSubpage === 'ai') {
                  return (
                    <ZeAiExperience
                      currentUser={currentUser}
                      onBack={() => {
                        setActiveSubpage(null);
                        navigate('/');
                      }}
                      onOpenVipStore={() => setShowKeyStore(true)}
                    />
                  );
                }

                if (effectiveSubpage === 'wink-hd') {
                  return (
                    <WinkHDPage
                      onBack={() => {
                        setActiveSubpage(null);
                        navigate('/');
                      }}
                    />
                  );
                }

                if (effectiveSubpage === 'ytmp4') {
                  return <YouTubeMp4Page onBack={() => setActiveSubpage(null)} />;
                }

                if (effectiveSubpage === 'friends') {
                  return (
                    <FriendsPageView
                      currentUser={currentUser}
                      friends={friends}
                      allUsers={allUsers}
                      onBack={() => setActiveSubpage(null)}
                      onOpenChat={(target) => openChatWith(target)}
                      onViewProfile={(target) => openProfile(target)}
                      onSendFriendRequest={async (targetId) => {
                        await sendFriendRequest({ id: targetId } as any);
                      }}
                    />
                  );
                }

                if (effectiveSubpage === 'search') {
                  return (
                    <SearchUsersView
                      currentUser={currentUser}
                      allUsers={allUsers}
                      friends={friends}
                      onBack={() => setActiveSubpage(null)}
                      onAddFriend={(target) => sendFriendRequest(target)}
                      onOpenChat={(target) => openChatWith(target)}
                      onViewProfile={(target) => openProfile(target)}
                    />
                  );
                }

                if (effectiveSubpage === 'notifications') {
                  return (
                    <NotificationsView
                      currentUser={currentUser}
                      friendRequests={friendRequests}
                      onBack={() => setActiveSubpage(null)}
                      onAccept={(fromId) => acceptFriendRequest(fromId)}
                      onReject={(fromId) => rejectFriendRequest(fromId)}
                      onUnreadChange={(cnt) => setUnreadNotifCount(cnt)}
                    />
                  );
                }

                // MAIN TABS (Mutually exclusive — only ONE tab mounts at a time)
                if (activeTab === 'music') {
                  return (
                    <MusicLabPage
                      currentUser={currentUser}
                      currentTrack={currentTrack}
                      isPlaying={isPlaying}
                      onPlayTrack={handlePlayTrack}
                      onTogglePlay={toggleMusicPlayback}
                      onDeleteCurrent={handleClosePlayer}
                    />
                  );
                }

                if (activeTab === 'comm') {
                  return (
                    <CommunitiesPageView
                      currentUser={currentUser}
                      communities={communities}
                      onOpenCommunity={(id) => {
                        setActiveCommunityId(id);
                        setActiveSubpage('community-detail');
                      }}
                      onCreateCommunity={() => setShowCreateCommunityModal(true)}
                      onCreateGroup={() => setShowCreateGroupModal(true)}
                    />
                  );
                }

                if (activeTab === 'chats') {
                  return (
                    <ChatsManagerView
                      currentUser={currentUser}
                      friends={friends}
                      chats={chats}
                      allUsers={allUsers}
                      notesMap={notesMap}
                      friendRequestsCount={friendRequests.length}
                      onOpenPrivateChat={(partner) => openChatWith(partner)}
                      onOpenGlobalChat={() => {
                        setActiveSubpage('global-chat');
                        navigate('/global');
                      }}
                      onOpenAddFriendById={() => setShowAddFriendById(true)}
                      onNavigateRequests={() => setActiveSubpage('notifications')}
                      onCreateNote={() => setShowCreateNoteModal(true)}
                      onViewNote={(n) => setActiveViewingNote(n)}
                      onViewProfile={(u) => openProfile(u)}
                      renderGlobalChat={() => null}
                    />
                  );
                }

                if (activeTab === 'you') {
                  return (
                    <ProfilePageView
                      currentUser={currentUser}
                      friendsCount={friends.length}
                      storiesCount={stories.filter((s) => s.userId === currentUser.id).length}
                      onEditProfile={() => {
                        setEditName(currentUser.name);
                        setEditBio(currentUser.bio || '');
                        setShowEditProfile(true);
                      }}
                      onPhotoUpload={() => editPhotoInputRef.current?.click()}
                      onLogout={handleLogout}
                      onBack={() => {
                        setActiveTab('updates');
                        navigate('/updates');
                      }}
                    />
                  );
                }

                if (activeTab === 'settings') {
                  return (
                    <SettingsPage
                      onBack={() => {
                        setSettingsInitialView(null);
                        setActiveTab('updates');
                      }}
                      currentUser={currentUser}
                      friends={friends}
                      initialSetting={settingsInitialView}
                      onConsumeInitialSetting={() => setSettingsInitialView(null)}
                      onUserUpdate={(u) => setCurrentUser(u)}
                      onDeleteAccount={() => {
                        localStorage.clear();
                        window.location.reload();
                      }}
                    />
                  );
                }

                return (
                  <HomePageView
                    currentUser={currentUser}
                    friends={friends}
                    stories={stories}
                    viewedStoryIds={viewedStoryIds}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    onTogglePlay={toggleMusicPlayback}
                    onClosePlayer={handleClosePlayer}
                    onOpenMusicModal={() => setShowMusicModal(true)}
                    onOpenStoryGroup={(group) => setActiveStoryViewerGroup(group)}
                    onOpenAddStoryModal={() => setShowAddStoryModalState(true)}
                    onDirectUploadStory={handleDirectStoryUpload}
                    onOpenChatWith={(f) => openChatWith(f)}
                    onStartCall={(f, type) => startCall(f, type)}
                    onNavigateSearch={() => setActiveSubpage('search')}
                    onNavigateNotifications={() => setActiveSubpage('notifications')}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onNavigateSubpage={(sub) => setActiveSubpage(sub)}
                    onViewProfile={(u) => openProfile(u)}
                    friendRequestsCount={friendRequests.length}
                    setActiveTab={setActiveTab}
                    onComingSoon={(name?: string) => showToast(name ? `Fitur ${name} akan segera hadir.` : 'Fitur akan segera hadir.')}
                    onOpenOwner={() => {
                      if (isUserOwner(currentUser) || isUserAdmin(currentUser)) {
                        setShowOwnerDashboard(true);
                      } else {
                        showToast('Akses ditolak: Khusus OWNER / ADMIN');
                      }
                    }}
                    onOpenKeyStore={() => setShowKeyStore(true)}
                    onOpenTopUpDiamond={() => setShowTopUpDiamond(true)}
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                    diamondBalance={diamondBalance}
                    unreadNotifCount={unreadNotifCount}
                  />
                );
              })()}
            </div>

      {/* Profile View Modal (Universal contact viewer) */}
      {selectedProfileUser && (
        <ProfileModal
          user={selectedProfileUser}
          currentUser={currentUser}
          groups={groups}
          onClose={() => setSelectedProfileUser(null)}
          onOpenChat={(u) => {
            setSelectedProfileUser(null);
            openChatWith(u);
          }}
          onStartCall={(u) => {
            setSelectedProfileUser(null);
            startCall(u, 'video');
          }}
        />
      )}

      {/* Hidden file input for custom profile photo upload */}
      <input
        ref={editPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={handleProfilePhotoUpload}
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-[#141414]/95 backdrop-blur-xl border border-white/20 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 pointer-events-none">
          {toastMsg === 'Fitur akan segera hadir.' ? (
            <Info size={14} className="text-zinc-300 shrink-0" />
          ) : (
            <Check size={14} className="text-green-400 shrink-0" />
          )}
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Modals */}
      {activeStoryViewerGroup && (
        <StoryViewerModal
          story={activeStoryViewerGroup}
          currentUser={currentUser}
          onClose={() => setActiveStoryViewerGroup(null)}
          onDeleteItem={async (userId: string, itemId: string) => {
            await fetch(`/api/stories?userId=${encodeURIComponent(userId)}&itemId=${encodeURIComponent(itemId)}`, {
              method: 'DELETE',
            }).catch(() => {});
            loadAllGlobalData();
          }}
        />
      )}
      {showAddStoryModalState && (
        <AddStoryModal
          currentUser={currentUser}
          onClose={() => setShowAddStoryModalState(false)}
          onStoryAdded={(newS) => {
            setStories((p) => [newS, ...p]);
            loadAllGlobalData();
          }}
        />
      )}
      {showAddFriendById && (
        <AddFriendByIdModal
          currentUser={currentUser}
          allUsers={allUsers}
          friends={friends}
          onClose={() => setShowAddFriendById(false)}
          onSendRequest={async (targetId) => {
            await sendFriendRequest({ id: targetId } as any);
          }}
        />
      )}
      {renderCreateNoteModal()}
      {renderNoteViewer()}
      {renderCreateGroupModal()}
      {renderCreateCommunityModal()}

      {/* DEDICATED APPLICATION FEATURE FULL-PAGE MENUS */}
      {showOwnerDashboard && (isUserOwner(currentUser) || isUserAdmin(currentUser)) && (
        <OwnerDashboardModal currentUser={currentUser} onClose={() => setShowOwnerDashboard(false)} />
      )}
      {showKeyStore && (
        <KeyStoreModal
          currentUser={currentUser}
          onClose={() => setShowKeyStore(false)}
          onVipPurchased={(vipInfo) => {
            setCurrentUser((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                isVip: true,
                vip: true,
                vipLevel: vipInfo.vipLevel,
                isVipExclusive: vipInfo.isVipExclusive,
                vipExpiresAt: vipInfo.vipExpiresAt
              };
            });
            setAllUsers((prev) =>
              prev.map((u) =>
                String(u.id).toUpperCase() === String(currentUser.id).toUpperCase()
                  ? {
                      ...u,
                      isVip: true,
                      vip: true,
                      vipLevel: vipInfo.vipLevel,
                      isVipExclusive: vipInfo.isVipExclusive,
                      vipExpiresAt: vipInfo.vipExpiresAt
                    }
                  : u
              )
            );
            loadAllGlobalData(true);
          }}
          onOpenTopUp={() => {
            setShowKeyStore(false);
            setShowTopUpDiamond(true);
          }}
          onOpenNotifications={() => {
            setShowKeyStore(false);
            setActiveSubpage('notifications');
          }}
        />
      )}
      {showTopUpDiamond && (
        <TopUpDiamondModal
          currentUser={currentUser}
          onClose={() => setShowTopUpDiamond(false)}
          onBalanceUpdated={(bal) => setDiamondBalance(bal)}
        />
      )}

      {/* Modern ChatGPT-Style Transparent Liquid Glass Navigation Drawer */}
      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        onOpenProfile={() => {
          setIsSidebarOpen(false);
          if (currentUser) openProfile(currentUser);
        }}
        onOpenSettings={() => {
          setSettingsInitialView(null);
          setActiveTab('settings');
          setActiveSubpage(null);
        }}
        onOpenKeranjang={() => {
          setShowKeyStore(true);
        }}
        onOpenTeman={() => {
          setActiveSubpage('friends');
        }}
        onOpenHistory={() => {
          setActiveSubpage('history');
          navigate('/history');
        }}
        onComingSoon={(featureName) => {
          showToast(`Fitur ${featureName} akan segera hadir.`);
        }}
      />

      {/* Background YouTube audio player if currentYoutubeId is active */}
      {currentYoutubeId && isPlaying && (
        <div className="hidden">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${currentYoutubeId}?autoplay=1&enablejsapi=1`}
            title="BG YouTube Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      {/* Tautan Jadi Musik Modal (Dynamic Video Title) */}
      {showMusicModal && (
        <MusicLinkModal
          onClose={() => setShowMusicModal(false)}
          onSubmitLink={handlePlayMusicFromLink}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141414] border border-white/10 rounded-[28px] p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white">Edit Profil</h3>
              <button
                onClick={() => setShowEditProfile(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-4">
              <div
                onClick={() => editPhotoInputRef.current?.click()}
                className="relative cursor-pointer group"
                title="Ganti Foto Profil"
              >
                <Avatar photo={currentUser.photo} name={currentUser.name} size="xl" className="w-20 h-20 text-2xl mx-auto border-2 border-white/20" />
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => editPhotoInputRef.current?.click()}
                className="text-xs text-blue-400 hover:text-blue-300 mt-2 font-medium cursor-pointer"
              >
                Ubah Foto Profil
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-white/50 block mb-1">Nama Tampilan</label>
                {(() => {
                  const editDup = checkDuplicateUser(editName, currentUser?.username, currentUser?.id);
                  return (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={`w-full bg-[#1e1e1e] border rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 outline-none transition-colors ${
                          editDup.isDuplicate ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-white/30'
                        }`}
                      />
                      {editDup.isDuplicate && (
                        <p className="text-[11px] text-red-400 mt-1 font-medium">{editDup.reason || 'Nama sudah dipakai'}</p>
                      )}
                    </>
                  );
                })()}
              </div>

              <div>
                <label className="text-[11px] text-white/50 block mb-1">Bio / Keterangan</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-white/30 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setShowEditProfile(false)}
                className="flex-1 py-2.5 rounded-full bg-white/10 text-white font-semibold text-xs active:scale-95 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveProfileEdits}
                className="flex-1 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition cursor-pointer shadow-lg"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* BOTTOM NAV - CUSTOMIZABLE ORDER, FAVORITE-4, HIDING & THEME-AWARE    */}
      {/* ==================================================================== */}
      {!hideBottomNav &&
        (() => {
          const orderList =
            appHomeUiConfig.bottomNavOrder && appHomeUiConfig.bottomNavOrder.length > 0
              ? appHomeUiConfig.bottomNavOrder
              : DEFAULT_BOTTOM_NAV_ORDER;
          const visibleNavIds: BottomNavId[] =
            appHomeUiConfig.bottomNavMode === 'focus-4'
              ? orderList.filter((id) => appHomeUiConfig.bottomNavFavorites.includes(id))
              : orderList;

          const navTextColor = appThemeTokens.hasSolidBackdrop
            ? appThemeTokens.isLight
              ? '#0f172a'
              : appThemeTokens.cardTitleColor
            : '#ffffff';

          const avatarSrc =
            currentUser?.avatar ||
            currentUser?.photo ||
            (currentUser?.id
              ? localStorage.getItem(`ze_avatar_${String(currentUser.id).toUpperCase()}`)
              : '') ||
            (currentUser?.name
              ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`
              : 'https://api.dicebear.com/9.x/initials/svg?seed=bhhhh');

          const renderNavBtn = (id: BottomNavId) => {
            const isSelected =
              !activeSubpage &&
              ((id === 'updates' && activeTab === 'updates') ||
                (id === 'music' && activeTab === 'music') ||
                (id === 'comm' && activeTab === 'comm') ||
                (id === 'chats' && activeTab === 'chats') ||
                (id === 'you' && activeTab === 'you'));

            const onPress = () => {
              setActiveTab(id);
              setActiveSubpage(null);
              navigate(id === 'updates' ? '/updates' : `/${id}`);
            };

            const label =
              id === 'updates'
                ? 'Updates'
                : id === 'music'
                ? 'Music'
                : id === 'comm'
                ? 'Communities'
                : id === 'chats'
                ? 'Chats'
                : 'You';

            return (
              <button
                key={id}
                onClick={onPress}
                style={{ color: navTextColor, opacity: isSelected ? 1 : 0.62 }}
                className="flex-1 min-w-0 flex flex-col items-center py-1 transition cursor-pointer relative z-10 text-center"
              >
                {id === 'updates' && <Compass size={20} strokeWidth={1.6} className="shrink-0 ze-logo-anim ze-logo-nav" />}
                {id === 'music' && <Music size={20} strokeWidth={1.6} className="shrink-0 ze-logo-anim ze-logo-nav" />}
                {id === 'comm' && <Users size={20} strokeWidth={1.6} className="shrink-0 ze-logo-anim ze-logo-nav" />}
                {id === 'chats' && (
                  <MessageCircle size={20} strokeWidth={isSelected ? 2 : 1.6} className="shrink-0 ze-logo-anim ze-logo-nav" />
                )}
                {id === 'you' && (
                  <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center border border-white/25 bg-zinc-900 shrink-0 ze-logo-anim ze-logo-nav">
                    <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                )}
                <span className="text-[10px] mt-0.5 font-medium max-w-full truncate text-center block whitespace-nowrap overflow-hidden text-ellipsis">
                  {label}
                </span>
                {isSelected && (
                  <div
                    style={{ backgroundColor: appThemeTokens.accentColor }}
                    className="w-1.5 h-1 rounded-full mt-0.5"
                  />
                )}
              </button>
            );
          };

          return (
            <div className="bottom-nav ze-themed-nav fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-[420px] px-3 pointer-events-none">
              <div
                className="pointer-events-auto mx-auto w-full max-w-[390px] px-3 py-2 flex justify-between items-center gap-1 relative overflow-hidden"
                style={{
                  ...appThemeTokens.cardStyle,
                  background: 'rgba(10, 12, 18, 0.84)',
                  borderRadius: '9999px',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                {visibleNavIds.map(renderNavBtn)}
              </div>
            </div>
          );
        })()}
      {!hideBottomNav && <div className="h-28" />}
    </div>
    </>
    )}
    </ThemeProvider>
  );
}

// ==========================================================================
// PERSISTENT MEMORY-CACHED VIDEO INSTANCES FOR REALTIME FEED BANNER
// Prevents video reload on component re-render, state changes, or tab/menu switching
// ==========================================================================
let cachedAnimeVideoEl: HTMLVideoElement | null = null;
let cachedTikTokVideoEl: HTMLVideoElement | null = null;

function getCachedVideoElement(type: 'anime' | 'tiktok', src: string): HTMLVideoElement | null {
  if (typeof document === 'undefined') return null;

  if (type === 'anime') {
    if (!cachedAnimeVideoEl) {
      const v = document.createElement('video');
      v.src = src;
      v.setAttribute('data-src', src);
      v.loop = true;
      v.muted = true;
      v.defaultMuted = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', 'true');
      v.preload = 'auto';
      v.disablePictureInPicture = true;
      v.setAttribute('data-feed-video', 'true');
      v.className = 'absolute inset-0 w-full h-full object-cover transition-opacity duration-500';
      v.style.transform = 'translateZ(0)';
      v.style.willChange = 'transform';
      v.style.backfaceVisibility = 'hidden';
      (v.style as any).webkitBackfaceVisibility = 'hidden';
      cachedAnimeVideoEl = v;
      v.play().catch(() => {});
    } else if (src && cachedAnimeVideoEl.getAttribute('data-src') !== src) {
      cachedAnimeVideoEl.setAttribute('data-src', src);
      cachedAnimeVideoEl.src = src;
      try {
        cachedAnimeVideoEl.load();
      } catch {}
      cachedAnimeVideoEl.play().catch(() => {});
    }
    return cachedAnimeVideoEl;
  } else {
    if (!cachedTikTokVideoEl) {
      const v = document.createElement('video');
      v.src = src;
      v.loop = true;
      v.muted = true;
      v.defaultMuted = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', 'true');
      v.preload = 'auto';
      v.disablePictureInPicture = true;
      v.setAttribute('data-feed-video', 'true');
      v.className = 'absolute inset-0 w-full h-full object-cover transition-opacity duration-500';
      v.style.transform = 'translateZ(0)';
      v.style.willChange = 'transform';
      v.style.backfaceVisibility = 'hidden';
      (v.style as any).webkitBackfaceVisibility = 'hidden';
      cachedTikTokVideoEl = v;
    } else if (src && cachedTikTokVideoEl.src !== src && !cachedTikTokVideoEl.src.endsWith(src)) {
      cachedTikTokVideoEl.src = src;
    }
    return cachedTikTokVideoEl;
  }
}

// --------------------------------------------------------------------------
// HOME PAGE VIEW (UPDATES TAB)
// --------------------------------------------------------------------------
function HomePageView({
  currentUser,
  friends,
  stories,
  viewedStoryIds,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onClosePlayer,
  onOpenMusicModal,
  onOpenStoryGroup,
  onOpenAddStoryModal,
  onDirectUploadStory,
  onOpenChatWith,
  onStartCall,
  onNavigateSearch,
  onNavigateNotifications,
  onNavigateTab,
  onNavigateSubpage,
  onViewProfile,
  friendRequestsCount,
  setActiveTab,
  onComingSoon,
  onOpenOwner,
  onOpenKeyStore,
  onOpenTopUpDiamond,
  onOpenSidebar,
  diamondBalance = 0,
  unreadNotifCount = 0,
}: {
  currentUser: UserProfile;
  friends: UserProfile[];
  stories: UserStory[];
  viewedStoryIds: string[];
  currentTrack: {
    title: string;
    thumbnail?: string;
    url?: string;
    videoUrl?: string;
    audioUrl?: string;
    source?: 'tiktok' | 'youtube' | 'web';
    sourceType?: 'tiktok' | 'youtube' | 'web';
    author?: string;
    artist?: string;
    lyrics?: any;
  } | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClosePlayer: () => void;
  onOpenMusicModal: () => void;
  onOpenStoryGroup: (story: GroupedUserStory) => void;
  onOpenAddStoryModal: () => void;
  onDirectUploadStory: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenChatWith: (friend: UserProfile) => void;
  onStartCall: (friend: UserProfile, type: 'audio' | 'video') => void;
  onNavigateSearch: () => void;
  onNavigateNotifications: () => void;
  onNavigateTab: (tab: 'updates' | 'music' | 'comm' | 'chats' | 'you' | 'settings') => void;
  onNavigateSubpage: (sub: string) => void;
  onViewProfile: (u: UserProfile) => void;
  friendRequestsCount: number;
  setActiveTab: (tab: 'updates' | 'calls' | 'music' | 'comm' | 'chats' | 'you' | 'settings') => void;
  onComingSoon?: () => void;
  onOpenOwner?: () => void;
  onOpenKeyStore?: () => void;
  onOpenTopUpDiamond?: () => void;
  onOpenSidebar?: () => void;
  diamondBalance?: number;
  unreadNotifCount?: number;
}) {
  // Realtime playback & video mount ref
  const videoMountRef = useRef<HTMLDivElement | null>(null);
  const [videoOnlyMode, setVideoOnlyMode] = useState<boolean>(false);

  // Beranda Appearance & Layout Configuration (persisted in localStorage + IndexedDB)
  const {
    config: homeUiConfig,
    resolvedBannerVideoUrl,
    patchConfig: patchHomeUiConfig,
  } = useHomeUiConfig();
  const themeTokens = useMemo(
    () =>
      getHomeThemeTokens(
        homeUiConfig.themeId,
        homeUiConfig.boxStyle,
        homeUiConfig.shadowIntensity,
        homeUiConfig.shadowThickness
      ),
    [
      homeUiConfig.themeId,
      homeUiConfig.boxStyle,
      homeUiConfig.shadowIntensity,
      homeUiConfig.shadowThickness,
    ]
  );

  const [draggedFeatureId, setDraggedFeatureId] = useState<string | null>(null);
  const [dragOverFeatureId, setDragOverFeatureId] = useState<string | null>(null);
  const [isEditHomeMode, setIsEditHomeMode] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<HomeBlockId | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<HomeBlockId | null>(null);

  // Feed banner video URL (supports custom upload, preset, URL, or default)
  const animeEyeUrl = resolvedBannerVideoUrl;

  // Check if current track is TikTok source
  const isTikTokTrack = Boolean(
    currentTrack &&
      (currentTrack.source === 'tiktok' ||
        currentTrack.sourceType === 'tiktok' ||
        Boolean(currentTrack.videoUrl) ||
        currentTrack.url?.includes('tiktok') ||
        currentTrack.url?.includes('douyin') ||
        currentTrack.url?.includes('.mp4'))
  );

  // Compute TikTok video URL from current track
  const tiktokVideoUrl = useMemo(() => {
    if (currentTrack?.videoUrl) return currentTrack.videoUrl;
    if (
      currentTrack?.url &&
      (currentTrack.url.includes('.mp4') ||
        currentTrack.url.includes('tiktok') ||
        currentTrack.url.includes('douyin'))
    ) {
      return currentTrack.url;
    }
    return '/assets/aistudio/Screen_Recording_20261027_182218_e52caf48.mp4';
  }, [currentTrack]);

  const hasTikTokVideo = Boolean(isTikTokTrack && (currentTrack?.videoUrl || currentTrack?.url));
  const isTikTokActive = Boolean(isPlaying && isTikTokTrack && hasTikTokVideo);

  // Mount persistent cached video elements synchronously into the banner container
  // and pause them automatically when HomePageView unmounts (e.g., inside Settings, Chats, Music, You)
  // so ZE.io isn't decoding multiple invisible full-rate videos simultaneously!
  useEffect(() => {
    const container = videoMountRef.current;
    if (!container) return;

    const animeEl = getCachedVideoElement('anime', animeEyeUrl);
    const tiktokEl = getCachedVideoElement('tiktok', tiktokVideoUrl);

    if (animeEl && !container.contains(animeEl)) {
      container.appendChild(animeEl);
    }
    if (tiktokEl && !container.contains(tiktokEl)) {
      container.appendChild(tiktokEl);
    }

    if (animeEl) {
      animeEl.style.opacity = isTikTokActive ? '0' : '1';
      animeEl.style.pointerEvents = isTikTokActive ? 'none' : 'auto';
      if (!isTikTokActive && animeEl.paused) {
        animeEl.play().catch(() => {});
      }
    }

    if (tiktokEl) {
      tiktokEl.style.opacity = isTikTokActive ? '1' : '0';
      tiktokEl.style.pointerEvents = isTikTokActive ? 'auto' : 'none';
    }

    return () => {
      // Free hardware video decoder budget when user navigates away from Updates tab
      try {
        animeEl?.pause();
      } catch {}
      try {
        tiktokEl?.pause();
      } catch {}
    };
  }, [animeEyeUrl, tiktokVideoUrl, isTikTokActive]);

  // Ultra-Smooth Zero-Stutter PlaybackRate Synchronization & Background Tab Controller
  useEffect(() => {
    const animeEl = getCachedVideoElement('anime', animeEyeUrl);
    const tiktokEl = getCachedVideoElement('tiktok', tiktokVideoUrl);
    const audio = typeof window !== 'undefined' ? window.mainAudio : null;

    if (!isTikTokActive) {
      if (tiktokEl) {
        try {
          tiktokEl.pause();
          tiktokEl.playbackRate = 1.0;
        } catch {}
        tiktokEl.style.opacity = '0';
      }
      if (animeEl) {
        animeEl.style.opacity = '1';
        if (animeEl.paused) {
          animeEl.play().catch(() => {});
        }
      }
      return;
    }

    if (animeEl) animeEl.style.opacity = '0';
    if (tiktokEl) tiktokEl.style.opacity = '1';

    if (!audio || !tiktokEl) return;

    // Audio-Video Latency Micro-Offset Compensation (0.25s lead to offset browser decoding & render latency)
    const VIDEO_LATENCY_OFFSET = 0.25;

    // 1. Initial Offset Sync (ONLY ONCE at start - primed ahead by 0.25s to cover decode duration):
    if (audio.currentTime > 0) {
      try {
        tiktokEl.currentTime = Math.max(0, audio.currentTime + VIDEO_LATENCY_OFFSET);
      } catch {}
    }
    tiktokEl.playbackRate = 1.0;
    if (!audio.paused) {
      tiktokEl.play().catch(() => {});
    }

    // 2. Continuous Smooth Phase-Locking (Frame Lock):
    // Maintains target time (audio.currentTime + VIDEO_LATENCY_OFFSET) seamlessly without seeking
    const syncInterval = setInterval(() => {
      if (!audio || !tiktokEl) return;

      if (audio.paused) {
        if (!tiktokEl.paused) {
          tiktokEl.pause();
        }
        return;
      }

      if (tiktokEl.paused) {
        tiktokEl.play().catch(() => {});
      }

      const targetTime = audio.currentTime + VIDEO_LATENCY_OFFSET;
      const diff = targetTime - tiktokEl.currentTime;

      // Only if massive scrub occurred (> 1.2s), align currentTime once
      if (Math.abs(diff) > 1.2) {
        try {
          tiktokEl.currentTime = Math.max(0, targetTime);
          tiktokEl.playbackRate = 1.0;
        } catch {}
        return;
      }

      // Micro-adjust playbackRate smoothly:
      // If video is even slightly lagging (> 0.03s), imperceptibly speed up (1.02) until aligned
      if (diff > 0.03) {
        tiktokEl.playbackRate = 1.02;
      } else if (diff < -0.03) {
        tiktokEl.playbackRate = 0.98;
      } else {
        // Perfectly locked with target
        if (tiktokEl.playbackRate !== 1.0) {
          tiktokEl.playbackRate = 1.0;
        }
      }
    }, 120);

    // Audio state change handlers
    const handleAudioPlay = () => {
      tiktokEl.play().catch(() => {});
    };

    const handleAudioPause = () => {
      tiktokEl.pause();
      tiktokEl.playbackRate = 1.0;
    };

    // Audio seeked listener: single time alignment only when user manually scrubs the song
    const handleAudioSeeked = () => {
      try {
        tiktokEl.currentTime = Math.max(0, audio.currentTime + VIDEO_LATENCY_OFFSET);
      } catch {}
      tiktokEl.playbackRate = 1.0;
      if (!audio.paused && tiktokEl.paused) {
        tiktokEl.play().catch(() => {});
      }
    };

    audio.addEventListener('play', handleAudioPlay);
    audio.addEventListener('pause', handleAudioPause);
    audio.addEventListener('seeked', handleAudioSeeked);

    // Visibility change listener: ONLY ensures playback continues without buffer reload
    const handleVisibility = () => {
      if (!document.hidden && document.visibilityState === 'visible') {
        const targetTime = audio.currentTime + VIDEO_LATENCY_OFFSET;
        const diff = targetTime - tiktokEl.currentTime;
        if (Math.abs(diff) > 0.5) {
          try {
            tiktokEl.currentTime = Math.max(0, targetTime);
          } catch {}
        }
        if (!audio.paused && tiktokEl.paused) {
          tiktokEl.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(syncInterval);
      audio.removeEventListener('play', handleAudioPlay);
      audio.removeEventListener('pause', handleAudioPause);
      audio.removeEventListener('seeked', handleAudioSeeked);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [isTikTokActive, tiktokVideoUrl, animeEyeUrl]);

  // Tab visibility handler for anime eye video when TikTok is idle
  useEffect(() => {
    if (isTikTokActive) return;

    const handleAnimeVisibility = () => {
      if (!document.hidden && document.visibilityState === 'visible') {
        const anime = getCachedVideoElement('anime', animeEyeUrl);
        if (anime && anime.paused) {
          anime.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleAnimeVisibility);
    window.addEventListener('focus', handleAnimeVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleAnimeVisibility);
      window.removeEventListener('focus', handleAnimeVisibility);
    };
  }, [isTikTokActive, animeEyeUrl]);

  // Memoize grouped stories by userId so HomePageView re-renders don't rebuild story arrays
  const { myGroupStory, friendsGroupStories } = useMemo(() => {
    const groupedUserStories: GroupedUserStory[] = [];
    const map: Record<string, GroupedUserStory> = {};

    (stories || []).forEach((s) => {
      const uId = s.userId;
      if (!uId) return;
      if (!map[uId]) {
        map[uId] = {
          id: s.id,
          userId: uId,
          userName: s.userName,
          userPhoto: s.userPhoto,
          createdAt: s.createdAt,
          items: [],
        };
        groupedUserStories.push(map[uId]);
      }
      if (s.items && s.items.length > 0) {
        map[uId].items.push(...s.items);
      } else if (s.mediaUrl) {
        map[uId].items.push({
          id: s.id,
          type: s.mediaType || 'image',
          url: s.mediaUrl,
          caption: s.caption,
          quality: s.quality || '720p',
          timestamp: s.createdAt,
        });
      }
    });

    return {
      myGroupStory: groupedUserStories.find((g) => g.userId === currentUser.id),
      friendsGroupStories: groupedUserStories.filter((g) => g.userId !== currentUser.id),
    };
  }, [stories, currentUser.id]);

  const moveSectionBlock = (id: HomeBlockId, delta: number) => {
    const order = [...(homeUiConfig.sectionOrder || DEFAULT_SECTION_ORDER)];
    const i = order.indexOf(id);
    const j = i + delta;
    if (i === -1 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    patchHomeUiConfig({ sectionOrder: order });
  };

  const reorderSectionBlocks = (fromId: HomeBlockId, toId: HomeBlockId) => {
    if (!fromId || !toId || fromId === toId) return;
    const order = [...(homeUiConfig.sectionOrder || DEFAULT_SECTION_ORDER)];
    const fromIdx = order.indexOf(fromId);
    const toIdx = order.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) return;
    order.splice(fromIdx, 1);
    order.splice(toIdx, 0, fromId);
    patchHomeUiConfig({ sectionOrder: order });
  };

  const isCompactHeader = homeUiConfig.headerPosition === 'compact';

  const headerBar = (
    <div
      style={themeTokens.headerStyle}
      className={`${
        homeUiConfig.headerPosition === 'bottom' ? 'sticky bottom-2 mx-3 rounded-2xl mt-4' : 'sticky top-0'
      } z-40 px-3 ${isCompactHeader ? 'py-1.5' : 'py-2.5'} flex items-center justify-between gap-2 glass-panel ${
        isEditHomeMode ? 'ze-edit-wiggle' : ''
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onOpenSidebar}
          title="Buka Menu"
          className={`${isCompactHeader ? 'w-8 h-8' : 'w-9 h-9'} rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition shrink-0 glass-input text-white`}
        >
          <Menu size={isCompactHeader ? 16 : 18} className="ze-logo-anim ze-logo-header" />
        </button>
        <div
          className={`${
            isCompactHeader ? 'w-6 h-6' : 'w-7 h-7'
          } rounded-full overflow-hidden border border-white/20 bg-black shrink-0 shadow-sm flex items-center justify-center p-0.5 ze-logo-anim ze-logo-header`}
        >
          <img src="/assets/ze_logo.png" alt="ZE.io Logo" className="w-full h-full object-cover rounded-full" />
        </div>
        <h1
          style={{ color: themeTokens.headerTextColor }}
          className={`${isCompactHeader ? 'text-sm' : 'text-base sm:text-xl'} font-bold tracking-wider truncate`}
        >
          ZE.io
        </h1>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* OWNER ICON */}
        {(isUserOwner(currentUser) || isUserAdmin(currentUser)) && (
          <button
            type="button"
            onClick={onOpenOwner}
            title="Owner Control Panel"
            className={`${isCompactHeader ? 'w-8 h-8' : 'w-9 h-9'} rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition shrink-0 glass-input text-white`}
          >
            <Crown size={isCompactHeader ? 14 : 16} className="ze-logo-anim ze-logo-header" />
          </button>
        )}

        {/* SEARCH ICON */}
        <button
          type="button"
          onClick={onNavigateSearch}
          title="Pencarian"
          className={`${isCompactHeader ? 'w-8 h-8' : 'w-9 h-9'} rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition shrink-0 glass-input text-white`}
        >
          <Search size={isCompactHeader ? 14 : 16} className="ze-logo-anim ze-logo-header" />
        </button>

        {/* NOTIFICATION BELL ICON */}
        <button
          type="button"
          onClick={onNavigateNotifications}
          title="Notifikasi"
          className={`${isCompactHeader ? 'w-8 h-8' : 'w-9 h-9'} rounded-full flex items-center justify-center relative cursor-pointer active:scale-95 transition shrink-0 glass-input text-white`}
        >
          <Bell size={isCompactHeader ? 14 : 16} className="ze-logo-anim ze-logo-header" />
          {(friendRequestsCount + unreadNotifCount) > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
              {friendRequestsCount + unreadNotifCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  const renderBlockControlBar = (blockId: HomeBlockId, label: string, idx: number, total: number) => {
    if (!isEditHomeMode) return null;
    return (
      <div className="mb-1.5 mx-4 px-2.5 py-1.5 rounded-xl bg-black/75 border border-white/25 flex items-center justify-between gap-2 text-[10px] text-white z-20 relative">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
          <GripVertical size={12} className="text-white/60 cursor-grab" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {blockId === 'video' && (
            <button
              type="button"
              onClick={() => {
                const cycle: Array<'small' | 'medium' | 'large' | 'full'> = [
                  'small',
                  'medium',
                  'large',
                  'full',
                ];
                const next = cycle[(cycle.indexOf(homeUiConfig.videoSize) + 1) % cycle.length];
                patchHomeUiConfig({ videoSize: next });
              }}
              className="px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 font-semibold cursor-pointer"
            >
              Ukuran: {homeUiConfig.videoSize}
            </button>
          )}
          <button
            type="button"
            disabled={idx === 0}
            onClick={() => moveSectionBlock(blockId, -1)}
            className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center disabled:opacity-30 cursor-pointer"
            title="Naik"
          >
            <ArrowUp size={11} />
          </button>
          <button
            type="button"
            disabled={idx === total - 1}
            onClick={() => moveSectionBlock(blockId, 1)}
            className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center disabled:opacity-30 cursor-pointer"
            title="Turun"
          >
            <ArrowDown size={11} />
          </button>
          {(blockId === 'video' || blockId === 'stories') && (
            <button
              type="button"
              onClick={() =>
                blockId === 'video'
                  ? patchHomeUiConfig({ videoPosition: 'hidden' })
                  : patchHomeUiConfig({ storiesPosition: 'hidden' })
              }
              className="w-6 h-6 rounded-md bg-rose-500/35 flex items-center justify-center cursor-pointer"
              title="Sembunyikan"
            >
              <EyeOff size={11} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderVideoBlock = (blockIdx: number, totalBlocks: number) => {
    if (homeUiConfig.videoPosition === 'hidden') {
      if (!isEditHomeMode) return null;
      return (
        <div key="video" className="px-4 py-2">
          <button
            type="button"
            onClick={() => patchHomeUiConfig({ videoPosition: 'top' })}
            className="w-full py-2 rounded-2xl border border-dashed border-white/25 bg-black/40 text-xs text-white/75 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye size={13} />
            <span>Tampilkan Kotak Video Banner</span>
          </button>
        </div>
      );
    }

    const isFullWidth = homeUiConfig.videoSize === 'full';
    const bannerHeightClass =
      homeUiConfig.videoSize === 'small'
        ? 'h-[125px]'
        : homeUiConfig.videoSize === 'large'
        ? 'h-[260px]'
        : homeUiConfig.videoSize === 'full'
        ? 'h-[290px]'
        : 'h-[190px]';

    const bannerStyle: React.CSSProperties = {
      ...themeTokens.cardStyle,
      borderRadius: isFullWidth ? '0px' : themeTokens.cardStyle.borderRadius,
      transform: 'translateZ(0)',
      willChange: 'transform',
    };

    return (
      <div
        key="video"
        draggable={isEditHomeMode}
        onDragStart={() => isEditHomeMode && setDraggedBlockId('video')}
        onDragOver={(e) => {
          if (!isEditHomeMode) return;
          e.preventDefault();
          if (dragOverBlockId !== 'video') setDragOverBlockId('video');
        }}
        onDrop={(e) => {
          if (!isEditHomeMode) return;
          e.preventDefault();
          if (draggedBlockId) reorderSectionBlocks(draggedBlockId, 'video');
          setDraggedBlockId(null);
          setDragOverBlockId(null);
        }}
        className={`${isEditHomeMode ? 'ze-edit-wiggle' : ''} ${
          dragOverBlockId === 'video' ? 'ring-2 ring-white/50 rounded-3xl' : ''
        }`}
      >
        {renderBlockControlBar('video', 'Kotak Video Banner', blockIdx, totalBlocks)}
        <div className={isFullWidth ? 'px-0 pt-1 pb-2' : 'p-4 pt-2'}>
          <div
            style={bannerStyle}
            className={`relative w-full ${bannerHeightClass} overflow-hidden flex items-center justify-center select-none`}
          >
            {/* Hardware-accelerated cached video mount container + slow zoom animation */}
            <div
              ref={videoMountRef}
              className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none ze-video-thumb-zoom"
              style={{
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            />

            {/* Gradient Overlay (softened in Video Only mode) */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35 pointer-events-none transition-opacity duration-300 ${
                videoOnlyMode && isTikTokActive ? 'opacity-20' : 'opacity-100'
              }`}
            />

            {/* Top Badges & Controls */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
              {isTikTokActive ? (
                <div className="glass-input px-3 py-1 rounded-full text-[10px] text-white font-medium border border-white/15 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
                  <span>TikTok Video • Synced</span>
                </div>
              ) : (
                <div className="glass-input px-3 py-1 rounded-full text-[10px] text-white font-medium border border-white/15 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
                  <span>Trending Feed</span>
                </div>
              )}

              {isTikTokActive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoOnlyMode((prev) => !prev);
                  }}
                  className={`glass-input px-2.5 py-1 rounded-full text-[10px] font-medium border transition pointer-events-auto active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                    videoOnlyMode
                      ? 'text-[#00FF88] border-[#00FF88]/40 bg-black/40'
                      : 'text-zinc-200 border-white/20 hover:text-white'
                  }`}
                  title="Tampilkan hanya video TikTok tanpa overlay"
                >
                  <Film size={12} className={`ze-logo-anim ze-logo-tiktok ${videoOnlyMode ? 'text-[#00FF88]' : 'text-zinc-300'}`} />
                  <span>{videoOnlyMode ? 'Full Video' : 'Video Only'}</span>
                </button>
              )}
            </div>

            {/* Bottom Info */}
            <div
              className={`absolute bottom-3 left-4 right-4 pointer-events-none z-10 flex items-end justify-between transition-opacity duration-300 ${
                videoOnlyMode && isTikTokActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              {isTikTokActive ? (
                <>
                  <div className="max-w-[75%]">
                    <p className="text-white font-bold text-sm line-clamp-1 leading-tight">
                      {currentTrack?.title || 'TikTok Trending Music'}
                    </p>
                    <p className="text-zinc-300 text-[11px] mt-0.5 line-clamp-1">
                      {currentTrack?.author || currentTrack?.artist || 'TikTok Creator'} • Realtime Audio
                    </p>
                  </div>
                  <div className="glass-input px-2.5 py-1 rounded-full text-[10px] text-[#00FF88] font-mono border border-[#00FF88]/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-ping" />
                    <span>Playing</span>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-white font-bold text-base leading-tight">ZE.io Realtime Feed</p>
                  <p className="text-zinc-300 text-xs mt-0.5">Koneksi teman &amp; musik tanpa batas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStoriesBlock = (blockIdx: number, totalBlocks: number) => {
    if (homeUiConfig.storiesPosition === 'hidden') {
      if (!isEditHomeMode) return null;
      return (
        <div key="stories" className="px-4 py-2">
          <button
            type="button"
            onClick={() => patchHomeUiConfig({ storiesPosition: 'top' })}
            className="w-full py-2 rounded-2xl border border-dashed border-white/25 bg-black/40 text-xs text-white/75 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye size={13} />
            <span>Tampilkan Kotak Stories</span>
          </button>
        </div>
      );
    }

    const storyShapeCls =
      homeUiConfig.storiesShape === 'square'
        ? 'w-[60px] h-[60px] rounded-2xl'
        : homeUiConfig.storiesShape === 'pill'
        ? 'w-[78px] h-[48px] rounded-full'
        : 'w-[60px] h-[60px] rounded-full';

    return (
      <div
        key="stories"
        draggable={isEditHomeMode}
        onDragStart={() => isEditHomeMode && setDraggedBlockId('stories')}
        onDragOver={(e) => {
          if (!isEditHomeMode) return;
          e.preventDefault();
          if (dragOverBlockId !== 'stories') setDragOverBlockId('stories');
        }}
        onDrop={(e) => {
          if (!isEditHomeMode) return;
          e.preventDefault();
          if (draggedBlockId) reorderSectionBlocks(draggedBlockId, 'stories');
          setDraggedBlockId(null);
          setDragOverBlockId(null);
        }}
        className={`mt-2 ${isEditHomeMode ? 'ze-edit-wiggle' : ''} ${
          dragOverBlockId === 'stories' ? 'ring-2 ring-white/50 rounded-3xl' : ''
        }`}
      >
        {renderBlockControlBar('stories', 'Kotak Stories', blockIdx, totalBlocks)}
        <div className="px-4">
          <div className="flex justify-between items-center mb-2.5">
            <h3
              style={{ color: themeTokens.sectionTitleColor }}
              className="text-[11px] font-bold tracking-widest uppercase"
            >
              STORIES
            </h3>
            <span style={{ color: themeTokens.mutedTextColor }} className="text-xs">
              Friends &amp; Public
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {/* Add Story */}
            <div
              onClick={onOpenAddStoryModal}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            >
              <div
                className={`${storyShapeCls} flex items-center justify-center transition shadow-lg glass-panel border-2 border-dashed border-white/20 group-hover:border-[#00FF88]`}
              >
                <Plus size={20} style={{ color: themeTokens.cardIconColor }} className="transition ze-logo-anim ze-logo-story" />
              </div>
              <span
                style={{ color: themeTokens.sectionTitleColor }}
                className="text-[11px] mt-1 font-medium"
              >
                Add Story
              </span>
            </div>

            {/* User's Own Story */}
            {myGroupStory && myGroupStory.items.length > 0 && (
              <div
                onClick={() => onOpenStoryGroup(myGroupStory)}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer relative"
              >
                <div
                  style={{ borderColor: themeTokens.storyBorderColor }}
                  className={`${storyShapeCls} p-[2px] border-2 relative overflow-hidden`}
                >
                  <Avatar
                    photo={myGroupStory.userPhoto || currentUser.photo}
                    name={myGroupStory.userName}
                    size="md"
                    className={`w-full h-full object-cover ${
                      homeUiConfig.storiesShape === 'square' ? '!rounded-xl' : ''
                    }`}
                  />
                  {myGroupStory.items.length > 1 && (
                    <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                      {myGroupStory.items.length}
                    </span>
                  )}
                </div>
                <span
                  style={{ color: themeTokens.sectionTitleColor }}
                  className="text-[11px] mt-1 font-medium"
                >
                  Cerita Anda
                </span>
              </div>
            )}

            {/* Friends' Stories */}
            {friendsGroupStories.map((group) => {
              const isAllViewed = group.items.every((it) => viewedStoryIds?.includes(it.id));
              const storyOwner = friends.find(
                (f) => String(f.id).toUpperCase() === String(group.userId).toUpperCase()
              );
              return (
                <div
                  key={group.userId}
                  onClick={() => onOpenStoryGroup(group)}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer relative"
                >
                  <div
                    style={
                      !isAllViewed
                        ? { borderColor: themeTokens.storyBorderColor }
                        : undefined
                    }
                    className={`${storyShapeCls} p-[2px] transition-all relative overflow-hidden ${
                      isAllViewed ? 'border-2 border-white/20' : 'border-2'
                    }`}
                  >
                    <Avatar
                      photo={storyOwner?.photo || group.userPhoto}
                      name={storyOwner?.name || group.userName}
                      size="md"
                      className={`w-full h-full object-cover ${
                        homeUiConfig.storiesShape === 'square' ? '!rounded-xl' : ''
                      }`}
                    />
                    {group.items.length > 1 && (
                      <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                        {group.items.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1 max-w-[92px]">
                    <span
                      style={{ color: themeTokens.sectionTitleColor }}
                      className="text-[11px] font-medium truncate"
                    >
                      {(storyOwner?.name || group.userName).split(' ')[0]}
                    </span>
                    {storyOwner && <UserRoleBadge user={storyOwner} size="xs" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderFeaturesBlock = (blockIdx: number, totalBlocks: number) => {
    const featureMap: Record<
      string,
      {
        id: string;
        title: string;
        subtitle: string;
        longDesc: string;
        badge?: string;
        onClick: () => void;
        renderIcon: (compact?: boolean) => React.ReactNode;
      }
    > = {
      tiktok: {
        id: 'tiktok',
        title: 'TikTok No WM',
        subtitle: 'Download no watermark',
        longDesc: 'Unduh video TikTok kualitas HD bersih tanpa watermark & putar langsung sebagai musik.',
        onClick: () => onNavigateSubpage('tiktok'),
        renderIcon: (compact) => (
          <Film
            size={compact ? 20 : 28}
            style={{ color: themeTokens.cardIconColor }}
            className="ze-logo-anim ze-logo-tiktok"
          />
        ),
      },
      topup: {
        id: 'topup',
        title: 'Top Up Diamond+',
        subtitle: isUserOwner(currentUser)
          ? 'Saldo: UNLIMITED'
          : `Saldo: ${(diamondBalance ?? 0).toLocaleString('id-ID')} Diamond+`,
        longDesc: `${
          isUserOwner(currentUser)
            ? 'Saldo: UNLIMITED'
            : `Saldo: ${(diamondBalance ?? 0).toLocaleString('id-ID')} Diamond+`
        } • Isi via QRIS DANA instan.`,
        onClick: () => (onOpenTopUpDiamond || onOpenKeyStore)?.(),
        renderIcon: (compact) => (
          <div
            style={themeTokens.iconBoxStyle}
            className={`${
              compact ? 'w-9 h-9 rounded-xl' : 'w-12 h-12 rounded-2xl'
            } flex items-center justify-center p-1.5 shadow-md transition duration-300 ze-logo-anim ze-logo-diamond`}
          >
            <DiamondPlusIcon size={compact ? 20 : 26} />
          </div>
        ),
      },
      'ze-ai': {
        id: 'ze-ai',
        title: 'ZE AI',
        subtitle: 'Smart AI Chatbot',
        longDesc: 'Ngobrol dengan ZE AI, Zeya (A!), dan asisten cerdas dengan suara & ekspresi interaktif.',
        onClick: () => onNavigateSubpage('ai'),
        renderIcon: (compact) => (
          <Bot
            size={compact ? 20 : 28}
            style={{ color: themeTokens.cardIconColor }}
            className="ze-logo-anim ze-logo-zeai"
          />
        ),
      },
      community: {
        id: 'community',
        title: 'Community',
        subtitle: 'Join & create groups',
        longDesc: 'Gabung komunitas aktif atau bangun ruang diskusi publik bersama kreator lain.',
        onClick: () => onNavigateTab('comm'),
        renderIcon: (compact) => (
          <Globe
            size={compact ? 20 : 28}
            style={{ color: themeTokens.cardIconColor }}
            className="ze-logo-anim ze-logo-community"
          />
        ),
      },
      'group-chat': {
        id: 'group-chat',
        title: 'Group Chat',
        subtitle: 'Chat with friends',
        longDesc: 'Ruang obrolan grup real-time bareng teman-teman dengan media, stiker & notifikasi cepat.',
        onClick: () => {
          onNavigateSubpage('group-list');
          navigate('/group-chat');
        },
        renderIcon: (compact) => (
          <Users
            size={compact ? 20 : 28}
            style={{ color: themeTokens.cardIconColor }}
            className="ze-logo-anim ze-logo-groupchat"
          />
        ),
      },
      'zhd-ai': {
        id: 'zhd-ai',
        title: 'ZHD AI',
        subtitle: 'HD Photo & Video AI',
        longDesc: 'Tingkatkan ketajaman foto & video menjadi jernih resolusi tinggi secara otomatis.',
        onClick: () => {
          onNavigateSubpage('wink-hd');
          navigate('/wink-hd');
        },
        renderIcon: (compact) => (
          <div
            style={themeTokens.iconBoxStyle}
            className={`${
              compact ? 'w-9 h-9 rounded-xl' : 'w-12 h-12 rounded-2xl'
            } flex items-center justify-center p-1.5 shadow-md transition duration-300 ze-logo-anim ze-logo-zhdai`}
          >
            <img
              src="/assets/ze_logo.png"
              alt="ZHD AI Logo"
              className="w-full h-full object-cover rounded-xl drop-shadow"
            />
          </div>
        ),
      },
      'web-to-apk': {
        id: 'web-to-apk',
        title: 'WEB TO APK',
        subtitle: 'Android App Builder',
        longDesc: 'Ubah proyek web menjadi aplikasi Android siap pasang langsung dari ZE.io.',
        badge: 'SOON',
        onClick: () => onComingSoon?.(),
        renderIcon: (compact) => (
          <FileCode2
            size={compact ? 20 : 28}
            style={{ color: themeTokens.cardIconColor }}
            className="ze-logo-anim ze-logo-webapk"
          />
        ),
      },
      'tag-no': {
        id: 'tag-no',
        title: 'TAG NO',
        subtitle: 'Caller ID & Tag Nomor',
        longDesc: 'Identifikasi penelepon tak dikenal & cek tag komunitas nomor secara cepat.',
        badge: 'SOON',
        onClick: () => onComingSoon?.(),
        renderIcon: (compact) => (
          <PhoneCall
            size={compact ? 20 : 28}
            style={{ color: themeTokens.cardIconColor }}
            className="ze-logo-anim ze-logo-tagno"
          />
        ),
      },
    };

    const orderedIds = homeUiConfig.featureOrder.filter((id) => Boolean(featureMap[id]));
    const layoutMode = homeUiConfig.layoutMode;
    const effectiveIds =
      layoutMode === 'focus-4'
        ? orderedIds.filter((id) => homeUiConfig.favoriteFeatures.includes(id)).slice(0, 4)
        : orderedIds;
    const orderedFeatures = (effectiveIds.length > 0 ? effectiveIds : orderedIds).map(
      (id) => featureMap[id]
    );

    const reorderFeatures = (fromId: string, toId: string) => {
      if (!fromId || !toId || fromId === toId) return;
      const next = [...orderedIds];
      const fromIdx = next.indexOf(fromId);
      const toIdx = next.indexOf(toId);
      if (fromIdx === -1 || toIdx === -1) return;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, fromId);
      patchHomeUiConfig({ featureOrder: next });
    };

    const shiftFeature = (id: string, delta: number) => {
      const next = [...orderedIds];
      const idx = next.indexOf(id);
      const targetIdx = idx + delta;
      if (idx === -1 || targetIdx < 0 || targetIdx >= next.length) return;
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      patchHomeUiConfig({ featureOrder: next });
    };

    const gapClass =
      homeUiConfig.featureGap === 'tight'
        ? 'gap-2'
        : homeUiConfig.featureGap === 'wide'
        ? 'gap-4'
        : 'gap-3';

    const sizePadClass =
      homeUiConfig.featureSize === 'small'
        ? 'p-3.5'
        : homeUiConfig.featureSize === 'large'
        ? 'p-6'
        : 'p-5';

    const containerClass =
      layoutMode === 'list-vertical' || layoutMode === 'list-small-left'
        ? `flex flex-col ${gapClass} mt-3`
        : layoutMode === 'grid-3' || layoutMode === 'circle'
        ? `grid grid-cols-3 ${gapClass} mt-3`
        : layoutMode === 'grid-4' || layoutMode === 'compact' || layoutMode === 'minimal-icon'
        ? `grid grid-cols-4 ${gapClass} mt-3`
        : layoutMode === 'grid-1-large' || layoutMode === 'pill'
        ? `flex flex-col ${gapClass} mt-3`
        : layoutMode === 'list-horizontal' || layoutMode === 'carousel'
        ? `flex ${gapClass} mt-3 overflow-x-auto snap-x snap-mandatory pb-3 no-scrollbar`
        : layoutMode === 'masonry'
        ? `columns-2 ${gapClass} mt-3`
        : layoutMode === 'stack'
        ? 'flex flex-col mt-3 pb-2'
        : `grid grid-cols-2 ${gapClass} mt-3`;

    const canDragDrop = layoutMode === 'drag-drop' || isEditHomeMode;

    return (
      <div
        key="features"
        draggable={isEditHomeMode}
        onDragStart={() => isEditHomeMode && setDraggedBlockId('features')}
        onDragOver={(e) => {
          if (!isEditHomeMode) return;
          e.preventDefault();
          if (dragOverBlockId !== 'features') setDragOverBlockId('features');
        }}
        onDrop={(e) => {
          if (!isEditHomeMode) return;
          e.preventDefault();
          if (draggedBlockId) reorderSectionBlocks(draggedBlockId, 'features');
          setDraggedBlockId(null);
          setDragOverBlockId(null);
        }}
        className={`mt-5 ${isEditHomeMode ? 'ze-edit-wiggle' : ''} ${
          dragOverBlockId === 'features' ? 'ring-2 ring-white/50 rounded-3xl' : ''
        }`}
      >
        {renderBlockControlBar('features', 'Kotak Features Menu', blockIdx, totalBlocks)}
        <div className="px-4">
          <div className="flex items-center justify-between gap-2">
            <h3
              style={{ color: themeTokens.sectionTitleColor }}
              className="text-[11px] tracking-widest uppercase font-semibold"
            >
              FEATURES {layoutMode === 'focus-4' ? '• FOKUS 4' : ''}
            </h3>
            {canDragDrop && (
              <div className="flex items-center gap-2">
                <span
                  style={{ color: themeTokens.mutedTextColor }}
                  className="text-[10px] font-medium"
                >
                  Geser / urut bebas
                </span>
                <button
                  type="button"
                  onClick={() => patchHomeUiConfig({ featureOrder: DEFAULT_FEATURE_ORDER })}
                  style={themeTokens.badgeStyle}
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={9} />
                  <span>Reset</span>
                </button>
              </div>
            )}
            {(layoutMode === 'carousel' || layoutMode === 'list-horizontal') && !canDragDrop && (
              <span
                style={{ color: themeTokens.mutedTextColor }}
                className="text-[10px] font-medium"
              >
                Swipe samping →
              </span>
            )}
          </div>

          <div className={containerClass}>
            {orderedFeatures.map((feat, idx) => {
              const isDragTarget = canDragDrop && dragOverFeatureId === feat.id;
              const cardInlineStyle: React.CSSProperties = {
                ...themeTokens.cardStyle,
                ...(layoutMode === 'circle' || layoutMode === 'pill'
                  ? { borderRadius: '9999px' }
                  : {}),
                ...(layoutMode === 'stack' && idx > 0 ? { zIndex: idx + 1 } : {}),
                ...(isDragTarget
                  ? {
                      outline: `2px dashed ${themeTokens.accentColor}`,
                      transform: 'scale(1.03)',
                    }
                  : {}),
              };

              const dragProps = canDragDrop
                ? {
                    draggable: true,
                    onDragStart: (e: React.DragEvent) => {
                      e.stopPropagation();
                      setDraggedFeatureId(feat.id);
                    },
                    onDragOver: (e: React.DragEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragOverFeatureId !== feat.id) {
                        setDragOverFeatureId(feat.id);
                      }
                    },
                    onDrop: (e: React.DragEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggedFeatureId) {
                        reorderFeatures(draggedFeatureId, feat.id);
                      }
                      setDraggedFeatureId(null);
                      setDragOverFeatureId(null);
                    },
                    onDragEnd: () => {
                      setDraggedFeatureId(null);
                      setDragOverFeatureId(null);
                    },
                  }
                : {};

              if (layoutMode === 'list-vertical') {
                return (
                  <div
                    key={feat.id}
                    {...dragProps}
                    onClick={feat.onClick}
                    style={cardInlineStyle}
                    className="ze-feature-card relative p-4 flex items-center gap-3.5 cursor-pointer select-none"
                  >
                    <div className="shrink-0">{feat.renderIcon(false)}</div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <p
                          style={{ color: themeTokens.cardTitleColor }}
                          className="font-semibold text-sm truncate"
                        >
                          {feat.title}
                        </p>
                        {feat.badge && (
                          <span
                            style={themeTokens.badgeStyle}
                            className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase shrink-0"
                          >
                            {feat.badge}
                          </span>
                        )}
                      </div>
                      <p
                        style={{ color: themeTokens.cardSubtitleColor }}
                        className="text-xs mt-0.5 truncate"
                      >
                        {feat.subtitle}
                      </p>
                    </div>
                    <ChevronRight
                      size={18}
                      style={{ color: themeTokens.cardSubtitleColor }}
                      className="shrink-0 opacity-75"
                    />
                  </div>
                );
              }

              if (layoutMode === 'list-small-left') {
                return (
                  <div
                    key={feat.id}
                    {...dragProps}
                    onClick={feat.onClick}
                    style={cardInlineStyle}
                    className="ze-feature-card relative px-3.5 py-2.5 flex items-center gap-3 cursor-pointer select-none"
                  >
                    <div
                      style={themeTokens.iconBoxStyle}
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    >
                      {feat.renderIcon(true)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p
                        style={{ color: themeTokens.cardTitleColor }}
                        className="font-bold text-xs truncate"
                      >
                        {feat.title}
                      </p>
                      <p
                        style={{ color: themeTokens.cardSubtitleColor }}
                        className="text-[10px] truncate"
                      >
                        {feat.subtitle}
                      </p>
                    </div>
                    {feat.badge && (
                      <span
                        style={themeTokens.badgeStyle}
                        className="px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase shrink-0"
                      >
                        {feat.badge}
                      </span>
                    )}
                    <ChevronRight
                      size={15}
                      style={{ color: themeTokens.cardSubtitleColor }}
                      className="shrink-0 opacity-70"
                    />
                  </div>
                );
              }

              if (layoutMode === 'pill') {
                return (
                  <div
                    key={feat.id}
                    {...dragProps}
                    onClick={feat.onClick}
                    style={cardInlineStyle}
                    className="ze-feature-card relative px-4 py-2.5 flex items-center gap-3 cursor-pointer select-none"
                  >
                    <div className="shrink-0">{feat.renderIcon(true)}</div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <span
                        style={{ color: themeTokens.cardTitleColor }}
                        className="font-bold text-xs truncate"
                      >
                        {feat.title}
                      </span>
                      <span
                        style={{ color: themeTokens.cardSubtitleColor }}
                        className="text-[10px] truncate opacity-80"
                      >
                        {feat.badge || feat.subtitle}
                      </span>
                    </div>
                  </div>
                );
              }

              if (layoutMode === 'stack') {
                return (
                  <div
                    key={feat.id}
                    {...dragProps}
                    onClick={feat.onClick}
                    style={cardInlineStyle}
                    className={`ze-feature-card relative p-4 flex items-center gap-3.5 cursor-pointer select-none ${
                      idx > 0 ? '-mt-2.5' : ''
                    } hover:z-20`}
                  >
                    <div className="shrink-0">{feat.renderIcon(false)}</div>
                    <div className="flex-1 min-w-0">
                      <p
                        style={{ color: themeTokens.cardTitleColor }}
                        className="font-bold text-sm truncate"
                      >
                        {feat.title}
                      </p>
                      <p
                        style={{ color: themeTokens.cardSubtitleColor }}
                        className="text-xs truncate"
                      >
                        {feat.subtitle}
                      </p>
                    </div>
                    {feat.badge && (
                      <span
                        style={themeTokens.badgeStyle}
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0"
                      >
                        {feat.badge}
                      </span>
                    )}
                  </div>
                );
              }

              if (layoutMode === 'grid-1-large') {
                return (
                  <div
                    key={feat.id}
                    {...dragProps}
                    onClick={feat.onClick}
                    style={cardInlineStyle}
                    className="ze-feature-card relative p-5 flex items-center gap-4 cursor-pointer select-none"
                  >
                    <div
                      style={themeTokens.iconBoxStyle}
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                    >
                      {feat.renderIcon(false)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          style={{ color: themeTokens.cardTitleColor }}
                          className="font-bold text-base truncate"
                        >
                          {feat.title}
                        </p>
                        {feat.badge ? (
                          <span
                            style={themeTokens.badgeStyle}
                            className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase shrink-0"
                          >
                            {feat.badge}
                          </span>
                        ) : (
                          <ChevronRight
                            size={16}
                            style={{ color: themeTokens.cardSubtitleColor }}
                            className="shrink-0 opacity-75"
                          />
                        )}
                      </div>
                      <p
                        style={{ color: themeTokens.cardSubtitleColor }}
                        className="text-xs mt-1 leading-relaxed"
                      >
                        {feat.longDesc}
                      </p>
                    </div>
                  </div>
                );
              }

              if (layoutMode === 'circle') {
                return (
                  <div
                    key={feat.id}
                    {...dragProps}
                    onClick={feat.onClick}
                    style={cardInlineStyle}
                    className="ze-feature-card relative aspect-square p-2.5 flex flex-col items-center justify-center text-center cursor-pointer select-none"
                  >
                    {feat.renderIcon(true)}
                    <p
                      style={{ color: themeTokens.cardTitleColor }}
                      className="font-bold text-[10px] mt-1.5 leading-tight line-clamp-1 px-1"
                    >
                      {feat.title}
                    </p>
                    {feat.id === 'topup' && (
                      <p
                        style={{ color: themeTokens.accentColor }}
                        className="text-[8px] font-bold leading-tight truncate max-w-full px-1"
                      >
                        {isUserOwner(currentUser)
                          ? 'UNLIMITED'
                          : `${(diamondBalance ?? 0).toLocaleString('id-ID')}+`}
                      </p>
                    )}
                  </div>
                );
              }

              if (layoutMode === 'minimal-icon') {
                return (
                  <div
                    key={feat.id}
                    {...dragProps}
                    onClick={feat.onClick}
                    style={cardInlineStyle}
                    title={feat.title}
                    aria-label={feat.title}
                    className="ze-feature-card relative aspect-square p-2 flex items-center justify-center cursor-pointer select-none"
                  >
                    {feat.renderIcon(true)}
                  </div>
                );
              }

              if (layoutMode === 'grid-3') {
                return (
                  <div
                    key={feat.id}
                    {...dragProps}
                    onClick={feat.onClick}
                    style={cardInlineStyle}
                    className="ze-feature-card relative p-3 flex flex-col items-center justify-center text-center cursor-pointer select-none min-h-[112px]"
                  >
                    {feat.badge && (
                      <span
                        style={themeTokens.badgeStyle}
                        className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase"
                      >
                        {feat.badge}
                      </span>
                    )}
                    {feat.renderIcon(true)}
                    <p
                      style={{ color: themeTokens.cardTitleColor }}
                      className="font-semibold text-[11px] mt-2 leading-tight line-clamp-1"
                    >
                      {feat.title}
                    </p>
                    <p
                      style={{ color: themeTokens.cardSubtitleColor }}
                      className="text-[9px] mt-0.5 leading-tight line-clamp-2"
                    >
                      {feat.subtitle}
                    </p>
                  </div>
                );
              }

              if (layoutMode === 'grid-4' || layoutMode === 'compact') {
                return (
                  <div
                    key={feat.id}
                    {...dragProps}
                    onClick={feat.onClick}
                    style={cardInlineStyle}
                    className={`ze-feature-card relative px-1.5 ${
                      layoutMode === 'grid-4' ? 'py-2.5 min-h-[76px]' : 'py-3 min-h-[82px]'
                    } flex flex-col items-center justify-center text-center cursor-pointer select-none`}
                  >
                    {feat.badge && (
                      <span
                        style={themeTokens.badgeStyle}
                        className="absolute top-1 right-1 px-1 py-0 rounded-full text-[7px] font-extrabold uppercase"
                      >
                        {feat.badge}
                      </span>
                    )}
                    {feat.renderIcon(true)}
                    <p
                      style={{ color: themeTokens.cardTitleColor }}
                      className="font-bold text-[10px] mt-1.5 leading-tight line-clamp-2"
                    >
                      {feat.title}
                    </p>
                    {feat.id === 'topup' && (
                      <p
                        style={{ color: themeTokens.accentColor }}
                        className="text-[9px] font-bold mt-0.5 leading-tight truncate max-w-full"
                      >
                        {isUserOwner(currentUser)
                          ? 'UNLIMITED'
                          : `${(diamondBalance ?? 0).toLocaleString('id-ID')}+`}
                      </p>
                    )}
                  </div>
                );
              }

              if (layoutMode === 'list-horizontal') {
                return (
                  <div
                    key={feat.id}
                    {...dragProps}
                    onClick={feat.onClick}
                    style={cardInlineStyle}
                    className="ze-feature-card relative min-w-[44%] snap-start shrink-0 p-4 flex flex-col items-center justify-center text-center cursor-pointer select-none"
                  >
                    {feat.badge && (
                      <span
                        style={themeTokens.badgeStyle}
                        className="absolute top-2 right-2.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase"
                      >
                        {feat.badge}
                      </span>
                    )}
                    {feat.renderIcon(true)}
                    <p
                      style={{ color: themeTokens.cardTitleColor }}
                      className="font-bold text-xs mt-2.5 line-clamp-1"
                    >
                      {feat.title}
                    </p>
                    <p
                      style={{ color: themeTokens.cardSubtitleColor }}
                      className="text-[10px] mt-0.5 line-clamp-1"
                    >
                      {feat.subtitle}
                    </p>
                  </div>
                );
              }

              if (layoutMode === 'carousel') {
                return (
                  <div
                    key={feat.id}
                    {...dragProps}
                    onClick={feat.onClick}
                    style={cardInlineStyle}
                    className="ze-feature-card relative min-w-[82%] sm:min-w-[260px] snap-center shrink-0 p-6 flex flex-col items-center justify-center text-center cursor-pointer select-none"
                  >
                    {feat.badge && (
                      <span
                        style={themeTokens.badgeStyle}
                        className="absolute top-3 right-3.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase"
                      >
                        {feat.badge}
                      </span>
                    )}
                    {feat.renderIcon(false)}
                    <p
                      style={{ color: themeTokens.cardTitleColor }}
                      className="font-bold text-base mt-3"
                    >
                      {feat.title}
                    </p>
                    <p
                      style={{ color: themeTokens.cardSubtitleColor }}
                      className="text-xs mt-1 max-w-[240px]"
                    >
                      {feat.longDesc}
                    </p>
                  </div>
                );
              }

              if (layoutMode === 'masonry') {
                const isTall = idx % 3 === 0 || idx === 1;
                return (
                  <div
                    key={feat.id}
                    {...dragProps}
                    onClick={feat.onClick}
                    style={cardInlineStyle}
                    className={`ze-feature-card break-inside-avoid mb-3 relative ${
                      isTall ? 'p-5 min-h-[168px]' : 'p-4 min-h-[120px]'
                    } flex flex-col items-center justify-center text-center cursor-pointer select-none`}
                  >
                    {feat.badge && (
                      <span
                        style={themeTokens.badgeStyle}
                        className="absolute top-2.5 right-3 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase"
                      >
                        {feat.badge}
                      </span>
                    )}
                    {feat.renderIcon(!isTall)}
                    <p
                      style={{ color: themeTokens.cardTitleColor }}
                      className="font-bold text-xs mt-2.5 leading-snug"
                    >
                      {feat.title}
                    </p>
                    <p
                      style={{ color: themeTokens.cardSubtitleColor }}
                      className="text-[10px] mt-1 leading-snug"
                    >
                      {isTall ? feat.longDesc : feat.subtitle}
                    </p>
                  </div>
                );
              }

              // 'grid-2', 'drag-drop', 'staggered', 'focus-4'
              const isStaggeredOffset = layoutMode === 'staggered' && idx % 2 === 1;
              return (
                <div
                  key={feat.id}
                  {...dragProps}
                  onClick={feat.onClick}
                  style={cardInlineStyle}
                  className={`ze-feature-card relative ${sizePadClass} flex flex-col items-center justify-center text-center cursor-pointer select-none ${
                    canDragDrop ? 'pt-8' : ''
                  } ${isStaggeredOffset ? 'mt-4' : ''}`}
                >
                  {canDragDrop && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10"
                    >
                      <span
                        style={{ color: themeTokens.cardSubtitleColor }}
                        className="inline-flex items-center gap-0.5 text-[10px] opacity-75 cursor-grab"
                        title="Tahan & geser kotak"
                      >
                        <GripVertical size={12} />
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            shiftFeature(feat.id, -1);
                          }}
                          style={themeTokens.badgeStyle}
                          className="w-5 h-5 rounded-full flex items-center justify-center disabled:opacity-25 cursor-pointer"
                          title="Geser maju"
                        >
                          <ChevronLeft size={11} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === orderedFeatures.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            shiftFeature(feat.id, 1);
                          }}
                          style={themeTokens.badgeStyle}
                          className="w-5 h-5 rounded-full flex items-center justify-center disabled:opacity-25 cursor-pointer"
                          title="Geser mundur"
                        >
                          <ChevronRight size={11} />
                        </button>
                      </div>
                    </div>
                  )}

                  {feat.badge && (
                    <span
                      style={themeTokens.badgeStyle}
                      className={`absolute ${
                        canDragDrop ? 'bottom-2 right-2.5' : 'top-3 right-3.5'
                      } px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase`}
                    >
                      {feat.badge}
                    </span>
                  )}

                  {feat.renderIcon(false)}
                  <p
                    style={{ color: themeTokens.cardTitleColor }}
                    className={`font-semibold mt-3 leading-snug ${
                      layoutMode === 'focus-4' ? 'text-base font-bold' : 'text-sm'
                    }`}
                  >
                    {feat.title}
                  </p>
                  <p
                    style={{ color: themeTokens.cardSubtitleColor }}
                    className="text-xs mt-1 leading-snug"
                  >
                    {layoutMode === 'focus-4' ? feat.longDesc : feat.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const orderedBlocks = (homeUiConfig.sectionOrder || DEFAULT_SECTION_ORDER).filter(
    (b, i, arr) => arr.indexOf(b) === i
  );

  return (
    <div
      data-logo-anim={homeUiConfig.logoAnimation}
      data-logo-anim-enabled={homeUiConfig.logoAnimEnabled ? 'true' : 'false'}
      data-logo-anim-style={homeUiConfig.logoAnimEnabled ? homeUiConfig.logoAnimStyle : 'mati'}
      data-logo-anim-speed={homeUiConfig.logoAnimSpeed}
      style={{ '--ze-theme-accent': themeTokens.accentColor } as React.CSSProperties}
      className="min-h-screen bg-transparent relative"
    >
      <div className="relative z-10">
        {/* Header top or compact */}
        {(homeUiConfig.headerPosition === 'top' || homeUiConfig.headerPosition === 'compact') &&
          headerBar}

        {/* Discreet access bar if header is hidden */}
        {homeUiConfig.headerPosition === 'hidden' && (
          <div className="px-4 pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="px-3 py-1.5 rounded-full glass-panel border border-white/15 text-[11px] font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Menu size={13} />
              <span>Menu</span>
            </button>
            <div className="flex items-center gap-1.5">
              {(isUserOwner(currentUser) || isUserAdmin(currentUser)) && (
                <button
                  type="button"
                  onClick={onOpenOwner}
                  title="Owner Control Panel"
                  className="w-8 h-8 rounded-full glass-panel border border-white/15 text-white flex items-center justify-center cursor-pointer"
                >
                  <Crown size={14} className="ze-logo-anim ze-logo-header" />
                </button>
              )}
              <button
                type="button"
                onClick={onNavigateSearch}
                title="Pencarian"
                className="w-8 h-8 rounded-full glass-panel border border-white/15 text-white flex items-center justify-center cursor-pointer"
              >
                <Search size={14} className="ze-logo-anim ze-logo-header" />
              </button>
              <button
                type="button"
                onClick={onNavigateNotifications}
                title="Notifikasi"
                className="w-8 h-8 rounded-full glass-panel border border-white/15 text-white flex items-center justify-center relative cursor-pointer"
              >
                <Bell size={14} className="ze-logo-anim ze-logo-header" />
                {(friendRequestsCount + unreadNotifCount) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {friendRequestsCount + unreadNotifCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mode Atur Beranda Top Control Strip */}
        {isEditHomeMode && (
          <div className="mx-4 mt-2.5 p-3 rounded-2xl bg-black/80 border border-white/25 text-white space-y-2 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold">Mode Atur Beranda Aktif</p>
                <p className="text-[10px] text-white/65">
                  Geser atau klik panah untuk memindah Video, Stories &amp; Features.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditHomeMode(false)}
                className="px-3 py-1.5 rounded-full bg-emerald-500 text-black text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <Check size={12} />
                <span>Selesai</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {homeUiConfig.headerPosition === 'hidden' && (
                <button
                  type="button"
                  onClick={() => patchHomeUiConfig({ headerPosition: 'top' })}
                  className="px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-bold cursor-pointer"
                >
                  + Munculin Header
                </button>
              )}
              {homeUiConfig.bottomNavHidden && (
                <button
                  type="button"
                  onClick={() => patchHomeUiConfig({ bottomNavHidden: false })}
                  className="px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-bold cursor-pointer"
                >
                  + Munculin Bottom Nav
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-bold cursor-pointer"
              >
                Buka Setting UI Lengkap
              </button>
            </div>
          </div>
        )}

        {/* Movable Sections (Video, Stories, Features) */}
        {orderedBlocks.map((blockId, idx) => {
          if (blockId === 'video') return renderVideoBlock(idx, orderedBlocks.length);
          if (blockId === 'stories') return renderStoriesBlock(idx, orderedBlocks.length);
          return renderFeaturesBlock(idx, orderedBlocks.length);
        })}

        {/* Header at bottom if configured */}
        {homeUiConfig.headerPosition === 'bottom' && headerBar}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 1. DEDICATED TIKTOK NO WM PAGE
// --------------------------------------------------------------------------
function TikTokPage({ onBack }: { onBack: () => void }) {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  const handleProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setIsProcessing(true);
    setDownloadReady(false);
    setTimeout(() => {
      setIsProcessing(false);
      setDownloadReady(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-transparent pb-[120px]">
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1 text-white/80 hover:text-white cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Film size={18} /> TikTok No Watermark
        </h2>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        <div className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-6 shadow-xl">
          <p className="text-xs text-white/60 mb-3">
            Masukkan link video TikTok untuk mengunduh versi MP4 bersih tanpa watermark.
          </p>
          <form onSubmit={handleProcess} className="space-y-3">
            <input
              type="text"
              placeholder="Paste link TikTok..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/40"
            />
            <button
              type="submit"
              disabled={isProcessing || !url.trim()}
              className="w-full py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition disabled:opacity-40 cursor-pointer shadow-lg"
            >
              {isProcessing ? 'Memproses Video...' : 'Unduh Tanpa Watermark'}
            </button>
          </form>
        </div>

        {downloadReady && (
          <div className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-5 flex flex-col items-center text-center shadow-xl">
            <div className="w-full h-64 rounded-2xl overflow-hidden bg-black relative mb-4">
              <video
                src="/assets/aistudio/ssstik.io_1792870405896_cd0f92f4.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>
            <p className="text-sm font-bold text-white">Video Bersih HD Siap!</p>
            <p className="text-xs text-white/40 mt-0.5">Format MP4 • No Watermark</p>
            <a
              href="/assets/aistudio/ssstik.io_1792870405896_cd0f92f4.mp4"
              download="TikTok_NoWM_ZE.mp4"
              className="mt-4 bg-white text-black px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-white/90 active:scale-95 transition"
            >
              <Download size={14} /> Simpan ke Galeri
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 2. DEDICATED BG MUSIC PLAY PAGE
// --------------------------------------------------------------------------
function BgMusicPage({
  tracks,
  currentTrackIndex,
  setCurrentTrackIndex,
  isMusicPlaying,
  setIsMusicPlaying,
  onPlayExternal,
  onBack,
}: {
  tracks: Array<{ id: string; title: string; artist: string; streamUrl: string }>;
  currentTrackIndex: number;
  setCurrentTrackIndex: (idx: number) => void;
  isMusicPlaying: boolean;
  setIsMusicPlaying: (v: boolean) => void;
  onPlayExternal: (url: string) => void;
  onBack: () => void;
}) {
  const [linkInput, setLinkInput] = useState('');
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [isFetchingMedia, setIsFetchingMedia] = useState(false);

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?#/]+)/i);
    return match && match[1] ? match[1] : null;
  };

  const handlePlayLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;
    const yId = extractYoutubeId(linkInput);
    if (yId) {
      setYoutubeId(yId);
      setIsMusicPlaying(false);
      return;
    }

    if (linkInput.includes('tiktok.com')) {
      setIsFetchingMedia(true);
      try {
        const res = await fetch(`/api/tiktok?url=${encodeURIComponent(linkInput)}`);
        const data = await res.json();
        if (data && data.data && (data.data.play || data.data.music)) {
          onPlayExternal(data.data.play || data.data.music);
          setYoutubeId(null);
          setIsMusicPlaying(true);
          setIsFetchingMedia(false);
          return;
        }
      } catch (e) {
        console.warn('TikTok fetch notice:', e);
      }
      setIsFetchingMedia(false);
    }

    // Direct audio/video stream URL
    onPlayExternal(linkInput);
    setYoutubeId(null);
    setIsMusicPlaying(true);
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-[120px]">
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1 text-white/80 hover:text-white cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Music size={18} /> BG Music Player
        </h2>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        <div className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-6 shadow-xl border-glow">
          <h3 className="text-sm font-bold text-white mb-1">Streaming Link Musik</h3>
          <p className="text-xs text-white/60 mb-2">
            Paste tautan YouTube atau TikTok untuk memutar audio di latar belakang.
          </p>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setLinkInput('https://www.youtube.com/watch?v=jNQXAC9IVRw')}
              className="text-[10px] text-white/60 hover:text-white bg-white/5 border border-white/10 rounded-full px-2.5 py-1 cursor-pointer transition"
            >
              Uji Coba: YouTube Video
            </button>
          </div>
          <form onSubmit={handlePlayLink} className="space-y-3">
            <input
              id="musicLink"
              type="text"
              placeholder="Paste YouTube / TikTok link..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/40"
            />
            <button
              type="submit"
              disabled={!linkInput.trim() || isFetchingMedia}
              className="w-full py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition disabled:opacity-40 cursor-pointer shadow-lg"
            >
              {isFetchingMedia ? 'Memuat Media...' : 'Putar di Latar Belakang'}
            </button>
          </form>
        </div>

        {/* Embedded YouTube Player if YouTube link */}
        {youtubeId && (
          <div className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-4 shadow-xl border-glow">
            <h4 className="text-xs text-white/50 uppercase tracking-wider mb-2 font-semibold">YouTube Web Audio</h4>
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&enablejsapi=1`}
                title="YouTube Audio Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}

        {/* Preset Tracks */}
        <div className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-5 shadow-xl">
          <h4 className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-3">
            Daftar Putar Rekomendasi
          </h4>
          <div className="space-y-2.5">
            {tracks.map((track, idx) => (
              <div
                key={track.id}
                onClick={() => {
                  setYoutubeId(null);
                  setCurrentTrackIndex(idx);
                  setIsMusicPlaying(true);
                }}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  currentTrackIndex === idx && !youtubeId
                    ? 'bg-white/10 border-white/30 text-white shadow'
                    : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Music size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{track.title}</p>
                    <p className="text-[10px] text-white/40">{track.artist}</p>
                  </div>
                </div>
                {currentTrackIndex === idx && isMusicPlaying && !youtubeId ? (
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full font-semibold">
                    Memutar
                  </span>
                ) : (
                  <Play size={14} className="text-white/40" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Now Playing Glass Bottom Card */}
        <div className="bg-[#141414]/90 backdrop-blur-[24px] border border-white/[0.12] rounded-[24px] p-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Music size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white truncate max-w-[200px]">
                {youtubeId ? 'YouTube Stream' : tracks[currentTrackIndex].title}
              </p>
              <p className="text-xs text-white/40">
                {youtubeId ? 'External Link' : tracks[currentTrackIndex].artist}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMusicPlaying(!isMusicPlaying)}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition cursor-pointer shadow"
          >
            {isMusicPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ZeAiMessage {
  id: string | number;
  sender: 'user' | 'ai';
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaName?: string;
  time: string;
}

interface ZeAiSelectedMedia {
  url: string;
  type: 'image' | 'video';
  name: string;
  rawType: string;
}

// --------------------------------------------------------------------------
// 3. DEDICATED ZE AI PAGE WITH SECRET QUANTUM PANEL TRIGGER & PERSISTENCE
// --------------------------------------------------------------------------
function ZeAiPage({ onBack }: { onBack: () => void }) {
  // Persistent local storage initialization
  const [messages, setMessages] = useState<ZeAiMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ze_ai_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse ze_ai_chat_history from localStorage:', e);
    }
    return [
      {
        id: 'ai_welcome_1',
        sender: 'ai',
        text: 'Yo bro! Gue ZE AI, asisten pribadi lo di ZE.io. Mau ngobrolin apa nih hari ini? Musik, video, nongkrong, atau ada yang mau lo tanyain? Santai aja, gas!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isBugPanelOpen, setIsBugPanelOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<ZeAiSelectedMedia | null>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [pendingKeyCommand, setPendingKeyCommand] = useState<'bug' | 'rw' | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sembunyikan bottom-nav pas di dalem ZE AI
  useEffect(() => {
    document.querySelector('.bottom-nav')?.classList.add('hidden');
    return () => {
      document.querySelector('.bottom-nav')?.classList.remove('hidden');
    };
  }, []);

  // Automatic Persistent Local Storage
  useEffect(() => {
    try {
      localStorage.setItem('ze_ai_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('LocalStorage limit reached for ze_ai_chat_history, trimming media payload:', e);
      try {
        const trimmed = messages.slice(-15).map((m) => ({
          ...m,
          mediaUrl: m.mediaType === 'video' && m.mediaUrl && m.mediaUrl.length > 600000 ? '' : m.mediaUrl
        }));
        localStorage.setItem('ze_ai_chat_history', JSON.stringify(trimmed));
      } catch (err) {
        console.error('Critical localStorage save error:', err);
      }
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  // Delete message/media satu per satu secara realtime
  const handleDeleteMessage = (id: string | number) => {
    setMessages((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      try {
        localStorage.setItem('ze_ai_chat_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Multimedia file selection handler (Foto & Video)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      setIsProcessingMedia(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Compress via canvas for low memory & fast transfer
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.78);
            setSelectedMedia({
              url: compressedUrl,
              type: 'image',
              name: file.name,
              rawType: 'image/jpeg'
            });
          }
          setIsProcessingMedia(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      if (file.size > 25 * 1024 * 1024) {
        alert('Ukuran video maksimal 25MB bro!');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setIsProcessingMedia(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedMedia({
          url: event.target?.result as string,
          type: 'video',
          name: file.name,
          rawType: file.type
        });
        setIsProcessingMedia(false);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Hanya mendukung file foto dan video bro!');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text && !selectedMedia) return;

    // 1. Trigger for /rw and /bug: Require Key Verification
    if (text.toLowerCase() === '/rw' || text.toLowerCase() === '/bug' || text.toLowerCase() === '/panel') {
      const cmd = text.toLowerCase().includes('rw') ? 'rw' : 'bug';
      setInputText('');
      setSelectedMedia(null);

      const userMsg: ZeAiMessage = {
        id: 'usr_' + Date.now(),
        sender: 'user',
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const aiPromptMsg: ZeAiMessage = {
        id: 'ai_' + (Date.now() + 1),
        sender: 'ai',
        text: 'Masukkan key untuk melanjutkan:',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, userMsg, aiPromptMsg]);
      setPendingKeyCommand(cmd);
      return;
    }

    // 2. If waiting for Key Input: Validate against Backend
    if (pendingKeyCommand) {
      const activeCmd = pendingKeyCommand;
      setInputText('');
      setSelectedMedia(null);

      const userMsg: ZeAiMessage = {
        id: 'usr_' + Date.now(),
        sender: 'user',
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsAiTyping(true);

      try {
        const valRes = await fetch('/api/keys/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: text.trim(), userId: getStoredUser()?.id })
        });
        const valData = await valRes.json();
        setIsAiTyping(false);

        if (valData && valData.success) {
          const typeLabel = valData.type === 'permanent' ? 'Permanent' : valData.type;
          const replyText = `Key valid (${typeLabel})! Mengakses ${activeCmd === 'rw' ? 'RW Game Booster' : 'Lutvoid Bug System'}...`;
          setMessages((prev) => [
            ...prev,
            {
              id: 'ai_' + Date.now(),
              sender: 'ai',
              text: replyText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setPendingKeyCommand(null);

          setTimeout(() => {
            if (activeCmd === 'rw') {
              window.dispatchEvent(new CustomEvent('ze_open_rw'));
            } else {
              window.dispatchEvent(new CustomEvent('ze_open_bug'));
            }
          }, 600);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: 'ai_' + Date.now(),
              sender: 'ai',
              text: valData.error || 'Key tidak valid atau sudah kedaluwarsa. Silakan periksa kembali atau dapatkan key resmi di Key Store.',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch {
        setIsAiTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai_' + Date.now(),
            sender: 'ai',
            text: 'Gagal memvalidasi key ke server. Periksa koneksi internet Anda.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
      return;
    }

    const currentMedia = selectedMedia;
    const userMsg: ZeAiMessage = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      sender: 'user',
      text: text || undefined,
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

    try {
      const response = await fetch('/api/ze-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mediaData: currentMedia?.url,
          mediaType: currentMedia?.rawType,
          history: nextMessages.slice(-16).map((m) => ({
            sender: m.sender,
            text: m.text,
            mediaUrl: m.mediaUrl
          }))
        })
      });

      const data = await response.json();
      const fullReply = String(data?.reply || '').trim() || "woi, gua denger, coba kirim lagi";

      const aiMsgId = 'ai_' + Date.now();
      const aiMsg: ZeAiMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: fullReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn('AI fetch fallback:', err);
      const fallbackReply = "woi, gua denger, coba kirim lagi";
      const aiMsgId = 'ai_' + Date.now();
      const aiMsg: ZeAiMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: fallbackReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] flex flex-col bg-black">
      {/* 1. HEADER - nempel atas */}
      <div className="flex-shrink-0 h-14 flex items-center justify-between px-3 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onBack();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition text-white cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/40 flex items-center justify-center text-white shadow-[0_0_16px_rgba(255,255,255,0.4)]">
              <Bot size={17} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">ZE AI</h2>
              <p className="text-[10px] text-emerald-400 font-mono">Online • Fast Respon</p>
            </div>
          </div>
        </div>

        {/* Clear All Messages Button */}
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Bersihkan semua riwayat chat ZE AI?')) {
                setMessages([]);
                try {
                  localStorage.removeItem('ze_ai_chat_history');
                } catch {}
              }
            }}
            title="Bersihkan seluruh riwayat"
            className="p-2 rounded-full text-white/40 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* 2. CHAT MESSAGES BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`group relative flex items-start gap-2.5 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 border-white/20 text-white'
                  : 'bg-white/10 border-white/30 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]'
              }`}
            >
              {msg.sender === 'user' ? <User size={14} /> : <Bot size={15} className="text-white" />}
            </div>

            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed backdrop-blur-md border shadow-lg relative ${
                msg.sender === 'user'
                  ? 'bg-white text-black font-medium rounded-tr-none'
                  : 'bg-[#1E1E1E] border-white/10 text-white/90 rounded-tl-none'
              }`}
            >
              {/* Media Preview: Image */}
              {msg.mediaUrl && msg.mediaType === 'image' && (
                <div className="mb-2 overflow-hidden rounded-xl border border-black/10">
                  <img
                    src={msg.mediaUrl}
                    alt={msg.mediaName || 'Foto terlampir'}
                    onClick={() => setLightboxImage(msg.mediaUrl || null)}
                    className="w-full max-h-72 object-cover rounded-xl cursor-pointer hover:scale-[1.01] transition-transform"
                  />
                </div>
              )}

              {/* Media Preview: Video */}
              {msg.mediaUrl && msg.mediaType === 'video' && (
                <div className="mb-2 overflow-hidden rounded-xl border border-black/10 bg-black">
                  <video
                    src={msg.mediaUrl}
                    controls
                    playsInline
                    className="w-full max-h-72 object-contain rounded-xl bg-black"
                  />
                </div>
              )}

              {/* Text content */}
              {msg.text && <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>}

              {/* Footer: Timestamp & Individual Delete Option */}
              <div
                className={`text-[9px] mt-1.5 flex items-center gap-2 font-mono ${
                  msg.sender === 'user' ? 'justify-end text-black/50' : 'justify-between text-white/40'
                }`}
              >
                <span>{msg.time}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMessage(msg.id);
                  }}
                  title="Hapus pesan/media ini"
                  className={`p-1 rounded-md transition cursor-pointer flex items-center justify-center ${
                    msg.sender === 'user'
                      ? 'text-black/40 hover:text-red-600 hover:bg-black/5'
                      : 'text-white/30 hover:text-red-400 hover:bg-white/10'
                  }`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {isAiTyping && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/30 text-white flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              <Bot size={15} className="text-white" />
            </div>
            <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. INPUT BAR WITH MULTIMEDIA ATTACHMENT */}
      {!isBugPanelOpen && (
        <div className="flex-shrink-0 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-black/80 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-2xl mx-auto space-y-2">
            {/* Selected Media Preview Bar */}
            {selectedMedia && (
              <div className="flex items-center justify-between p-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {selectedMedia.type === 'image' ? (
                    <img
                      src={selectedMedia.url}
                      alt="preview"
                      className="w-12 h-12 rounded-xl object-cover border border-white/30 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-black/80 border border-white/30 flex items-center justify-center text-white shrink-0 relative overflow-hidden">
                      <video src={selectedMedia.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Film size={16} className="text-white" />
                      </div>
                    </div>
                  )}
                  <div className="truncate text-left">
                    <p className="text-xs text-white font-medium truncate">{selectedMedia.name}</p>
                    <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">
                      {selectedMedia.type} SIAP DIKIRIM
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMedia(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-90 cursor-pointer shrink-0 ml-2"
                  title="Batal kirim media"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {isProcessingMedia && (
              <p className="text-[10px] text-white/50 animate-pulse font-mono">
                Memproses media lampiran...
              </p>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className="flex items-center bg-white/10 rounded-full px-2.5 py-1.5 gap-1.5 border border-white/15 focus-within:border-white/40 transition"
            >
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Kirim Foto / Video"
                className="w-9 h-9 rounded-full text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
              >
                <Paperclip size={18} />
              </button>

              <input
                type="text"
                placeholder={selectedMedia ? 'Beri pesan pada media ini...' : 'Ketik pesan santai ke ZE AI...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm px-2 py-1"
              />

              <button
                type="submit"
                disabled={(!inputText.trim() && !selectedMedia) || isProcessingMedia}
                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition disabled:opacity-30 cursor-pointer shadow shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Full View Image */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer shadow-lg"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxImage}
            alt="Preview besar"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// 4. DEDICATED YOUTUBE MP4 PAGE
// --------------------------------------------------------------------------
function YouTubeMp4Page({ onBack }: { onBack: () => void }) {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<'360p' | '720p' | '1080p'>('720p');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ready, setReady] = useState(false);

  const handleProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setIsProcessing(true);
    setReady(false);
    setTimeout(() => {
      setIsProcessing(false);
      setReady(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-[120px]">
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1 text-white/80 hover:text-white cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Youtube size={18} className="text-red-500" /> YouTube MP4
        </h2>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        <div className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-6 shadow-xl">
          <p className="text-xs text-white/60 mb-3">
            Masukkan link video YouTube untuk streaming atau unduh format video MP4.
          </p>
          <form onSubmit={handleProcess} className="space-y-3">
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/40"
            />

            <div>
              <label className="text-[11px] text-white/50 block mb-1.5 font-medium">Kualitas Video</label>
              <div className="grid grid-cols-3 gap-2">
                {(['360p', '720p', '1080p'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    className={`py-2 rounded-full text-xs font-semibold transition cursor-pointer border ${
                      quality === q
                        ? 'bg-white text-black border-white shadow'
                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !url.trim()}
              className="w-full mt-2 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition disabled:opacity-40 cursor-pointer shadow-lg"
            >
              {isProcessing ? 'Memproses Video...' : `Unduh MP4 (${quality})`}
            </button>
          </form>
        </div>

        {ready && (
          <div className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-5 flex flex-col items-center text-center shadow-xl">
            <div className="w-full h-48 rounded-2xl overflow-hidden bg-black relative mb-4">
              <video
                src="/assets/aistudio/ssstik.io_1792870405896_cd0f92f4.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>
            <p className="text-sm font-bold text-white">Video YouTube Siap!</p>
            <p className="text-xs text-white/40 mt-0.5">Format MP4 • Kualitas {quality}</p>
            <a
              href="/assets/aistudio/ssstik.io_1792870405896_cd0f92f4.mp4"
              download={`YouTube_${quality}.mp4`}
              className="mt-4 bg-white text-black px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-white/90 active:scale-95 transition"
            >
              <Download size={14} /> Simpan File MP4
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 5. CHAT LIST PAGE (IG STYLE WITH CATATAN ANDA)
// --------------------------------------------------------------------------
function ChatsListPageView({
  currentUser,
  chats,
  friends,
  allUsers,
  notesMap,
  friendRequestsCount,
  onOpenChat,
  onNavigateSearch,
  onNavigateRequests,
  onCreateGroup,
  onCreateNote,
  onViewNote,
  onViewProfile,
}: {
  currentUser: UserProfile;
  chats: ChatItem[];
  friends: UserProfile[];
  allUsers: UserProfile[];
  notesMap: Record<string, UserNote>;
  friendRequestsCount: number;
  onOpenChat: (chatId: string) => void;
  onNavigateSearch: () => void;
  onNavigateRequests: () => void;
  onCreateGroup: () => void;
  onCreateNote: () => void;
  onViewNote: (note: UserNote) => void;
  onViewProfile: (u: UserProfile) => void;
}) {
  const [filterQuery, setFilterQuery] = useState('');

  const getChatPartner = (chat: ChatItem) => {
    const otherId = chat.participants.find((id) => id !== currentUser.id);
    return allUsers.find((u) => u.id === otherId) || {
      id: otherId || '',
      name: 'User ' + (otherId || '').slice(-4),
      username: (otherId || '').toLowerCase(),
      photo: '',
    };
  };

  const filteredChats = chats.filter((c) => {
    if (c.type === 'group') {
      return (c.groupName || '').toLowerCase().includes(filterQuery.toLowerCase());
    }
    const partner = getChatPartner(c);
    return (
      partner.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      partner.username.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(filterQuery.toLowerCase())
    );
  });

  const myNote = notesMap[currentUser.id];

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Top Header sticky bg-black/60 backdrop-blur-xl */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/[0.06] px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-lg font-bold text-white tracking-tight">@{currentUser.username}</span>
            <ChevronDown size={16} className="text-white/70" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCreateGroup}
              title="Buat Grup Baru"
              className="text-white/80 hover:text-white p-1 cursor-pointer"
            >
              <Users size={19} />
            </button>
            <button
              onClick={onNavigateSearch}
              title="Chat Baru"
              className="text-white/80 hover:text-white p-1 cursor-pointer"
            >
              <SquarePen size={19} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-2.5 text-white/40" />
          <input
            type="text"
            placeholder="Cari chat atau teman..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-[#1E1E1E] border border-white/[0.08] rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/30"
          />
        </div>

        {/* ================================================================= */}
        {/* CATATAN ANDA (IG NOTES ROW)                                       */}
        {/* ================================================================= */}
        <div className="flex gap-4 overflow-x-auto pb-2 pt-3 no-scrollbar">
          {/* User's Own Note */}
          <div className="flex flex-col items-center flex-shrink-0 cursor-pointer relative">
            <div onClick={myNote ? () => onViewNote(myNote) : onCreateNote} className="relative">
              <Avatar photo={currentUser.photo} name={currentUser.name} size="lg" />
              {myNote ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-black rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-md flex items-center gap-1 whitespace-nowrap max-w-[100px] truncate border border-white/20">
                  <span>{myNote.emoji}</span>
                  <span className="truncate">{myNote.text}</span>
                </div>
              ) : (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateNote();
                  }}
                  className="absolute bottom-0 right-0 w-4 h-4 bg-white text-black rounded-full flex items-center justify-center font-bold text-[10px] shadow"
                >
                  +
                </div>
              )}
            </div>
            <span className="text-[11px] text-white/60 mt-1.5">Catatan Anda</span>
          </div>

          {/* Friends' Notes */}
          {friends.map((f) => {
            const fNote = notesMap[f.id];
            return (
              <div
                key={f.id}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer relative"
              >
                <div
                  onClick={fNote ? () => onViewNote(fNote) : () => onOpenChat(f.id)}
                  className="relative"
                >
                  <div className={`rounded-full p-[2px] ${fNote ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' : ''}`}>
                    <Avatar photo={f.photo} name={f.name} size="lg" className="border-2 border-black" />
                  </div>
                  {fNote && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-black rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-md flex items-center gap-1 whitespace-nowrap max-w-[100px] truncate border border-white/20">
                      <span>{fNote.emoji}</span>
                      <span className="truncate">{fNote.text}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                </div>
                <span className="text-[11px] text-white/60 mt-1.5 max-w-[60px] truncate text-center">
                  {f.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subheader: Pesan & Permintaan */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/[0.05]">
        <span className="text-white font-bold text-sm">Pesan</span>
        <button
          onClick={onNavigateRequests}
          className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1.5"
        >
          Permintaan
          {friendRequestsCount > 0 && (
            <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {friendRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat List Items: tap avatar = profile modal, tap card = chat */}
      <div className="divide-y divide-white/[0.04]">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle size={36} className="mx-auto text-white/20 mb-2" />
            <p className="text-white/60 text-sm font-semibold">Belum ada obrolan</p>
            <p className="text-white/30 text-xs mt-1">
              Buka profil teman di Beranda atau cari teman untuk memulai chat!
            </p>
            <button
              onClick={onNavigateSearch}
              className="mt-4 bg-white text-black px-5 py-2 rounded-full text-xs font-bold hover:bg-white/90 active:scale-95 transition"
            >
              Cari Teman
            </button>
          </div>
        ) : (
          filteredChats.map((c) => {
            const partner = getChatPartner(c);
            const isGroup = c.type === 'group';
            const displayName = isGroup ? c.groupName || 'Grup ZE.io' : partner.name;
            const displayPhoto = isGroup ? c.groupPhoto : partner.photo;

            return (
              <div
                key={c.id}
                className="px-4 py-3 flex items-center gap-3.5 hover:bg-white/[0.03] transition active:bg-white/[0.06]"
              >
                {/* Tap photo = view profile modal */}
                <div
                  onClick={() => {
                    if (!isGroup) onViewProfile(partner as UserProfile);
                  }}
                  className="relative flex-shrink-0 cursor-pointer"
                >
                  <Avatar photo={displayPhoto} name={displayName} size="lg" className="hover:scale-105 transition" />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black"></div>
                </div>

                {/* Tap card = open chat */}
                <div
                  onClick={() => onOpenChat(c.id || (c as any).chatId)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-0.5 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-white font-semibold text-[15px] truncate">{displayName}</p>
                      {!isGroup && <UserRoleBadge user={partner} size="sm" />}
                    </div>
                    <span className="text-[11px] text-white/40 shrink-0">Baru saja</span>
                  </div>
                  <p className="text-white/50 text-[14px] truncate leading-tight">
                    {c.lastMessage || 'Baru saja dikirim'}
                  </p>
                </div>

                <div className="text-white/30 flex-shrink-0">
                  <Camera size={18} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// MODAL TAUTAN JADI MUSIK (DYNAMIC TIKTOK / YOUTUBE MUSIC TITLE)
// --------------------------------------------------------------------------
function MusicLinkModal({
  onClose,
  onSubmitLink,
}: {
  onClose: () => void;
  onSubmitLink: (url: string) => Promise<void>;
}) {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setIsSubmitting(true);
    await onSubmitLink(url.trim());
    setIsSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#141414]/95 backdrop-blur-[30px] border border-white/[0.14] rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 border-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <Music size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Tautan Jadi Musik</h3>
              <p className="text-[10px] text-white/50">TikTok &amp; YouTube Stream</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-white/60 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-white/70 block mb-1.5 font-medium">
              Paste Link TikTok / YouTube Disini
            </label>
            <div className="bg-[#1E1E1E] border border-white/10 rounded-full px-4 py-3 flex items-center gap-2 focus-within:border-white/40 transition">
              <Film size={16} className="text-white/40 shrink-0" />
              <input
                type="text"
                placeholder="https://vt.tiktok.com/... atau https://youtube.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-transparent flex-1 text-sm text-white placeholder-white/30 outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-[11px] text-white/60 leading-relaxed">
            💡 <strong className="text-white">Info:</strong> Judul musik akan sama dengan judul video asli yang Anda masukkan.
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!url.trim() || isSubmitting}
              className="flex-1 py-3 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition disabled:opacity-40 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Memuat...</span>
              ) : (
                <>
                  <Play size={14} className="fill-black" />
                  <span>Putar Musik</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// GLOBAL REALTIME CHAT VIEW (SYNCS ACROSS ALL DEVICES WORLDWIDE)
// --------------------------------------------------------------------------
interface GlobalMsg {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
  message: string;
  timestamp: number;
  country?: string;
}

function GlobalChatPageView({
  currentUser,
  userCountry,
  onBack,
  onOpenProfile,
}: {
  currentUser: UserProfile;
  userCountry: string;
  onBack?: () => void;
  onOpenProfile?: (u: any) => void;
}) {
  const [messages, setMessages] = useState<GlobalMsg[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load live users status (OWNER, ADMIN silver tick, VIP + blue tick & avatar) from Server + Firestore
  useEffect(() => {
    let unsub: any = null;
    const syncServerRoles = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.users)) {
            setUsersMap((prev) => {
              const next = { ...prev };
              data.users.forEach((u: any) => {
                if (u.id) {
                  next[u.id] = { ...(next[u.id] || {}), ...u };
                  next[String(u.id).toUpperCase()] = { ...(next[String(u.id).toUpperCase()] || {}), ...u };
                }
                if (u.username) {
                  next[String(u.username).toLowerCase()] = { ...(next[String(u.username).toLowerCase()] || {}), ...u };
                }
              });
              return next;
            });
          }
        }
      } catch {}
    };
    syncServerRoles();
    const roleTimer = setInterval(syncServerRoles, 8000);

    if (db) {
      try {
        unsub = onSnapshot(collection(db, 'ze_users'), (snap) => {
          setUsersMap((prev) => {
            const map: Record<string, any> = { ...prev };
            snap.forEach((d) => {
              const data = d.data();
              const mergeEntry = (existing: any) => ({
                ...(existing || {}),
                ...data,
                role: existing?.role || data.role,
                isAdmin: existing?.isAdmin ?? data.isAdmin,
                isVip: existing?.isVip ?? data.isVip,
                vip: existing?.vip ?? existing?.isVip ?? data.vip ?? data.isVip,
                vipLevel: existing?.vipLevel || data.vipLevel || undefined,
                isVipExclusive: existing?.isVipExclusive ?? data.isVipExclusive ?? false,
                vipExpiresAt: existing?.vipExpiresAt || data.vipExpiresAt
              });
              if (data.id) map[data.id] = mergeEntry(map[data.id]);
              if (data.id_upper) map[data.id_upper] = mergeEntry(map[data.id_upper]);
              if (data.username) map[data.username.toLowerCase()] = mergeEntry(map[data.username.toLowerCase()]);
            });
            return map;
          });
        });
      } catch {}
    }

    return () => {
      clearInterval(roleTimer);
      if (unsub) unsub();
    };
  }, []);

  // Sync Global Chats from server and Firebase
  const fetchGlobalChats = async () => {
    try {
      const res = await fetch('/api/global-chats');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchGlobalChats();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchGlobalChats();
    }, 4000);

    // Online presence heartbeat
    const sendHeartbeat = () => {
      fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.id }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d && typeof d.count === 'number') setOnlineCount(d.count);
        })
        .catch(() => {});
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 15000);

    // Firestore onSnapshot listener for instant cross-device updates
    let unsub: any = null;
    if (db) {
      try {
        const q = query(collection(db, 'ze_global_chats'), orderBy('timestamp', 'asc'));
        unsub = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GlobalMsg));
            setMessages(list);
          }
        });
      } catch (e) {
        console.warn('Firestore global chat note:', e);
      }
    }

    return () => {
      clearInterval(interval);
      clearInterval(heartbeatInterval);
      if (unsub) unsub();
    };
  }, [currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');
    setShowEmojiPicker(false);
    setShowStickerPicker(false);

    const newMsg: GlobalMsg = {
      id: 'gmsg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: currentUser.id,
      avatar: currentUser.photo,
      message: text,
      timestamp: Date.now(),
      country: userCountry || 'ID',
    };

    // Optimistic local push
    setMessages((prev) => [...prev, newMsg]);

    // Send to backend
    fetch('/api/global-chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg),
    }).catch(() => {});

    // Send to Firebase
    if (db) {
      addDoc(collection(db, 'ze_global_chats'), {
        ...newMsg,
        timestamp: serverTimestamp(),
      }).catch(() => {});
    }

    setIsSending(false);
  };

  const handleSendGlobalSticker = (sticker: StickerItem) => {
    setShowStickerPicker(false);
    setShowEmojiPicker(false);

    const newMsg: GlobalMsg = {
      id: 'gmsg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: currentUser.id,
      avatar: currentUser.photo,
      message: `[STICKER]:${sticker.url}`,
      timestamp: Date.now(),
      country: userCountry || 'ID',
    };

    setMessages((prev) => [...prev, newMsg]);

    fetch('/api/global-chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg),
    }).catch(() => {});

    if (db) {
      addDoc(collection(db, 'ze_global_chats'), {
        ...newMsg,
        timestamp: serverTimestamp(),
      }).catch(() => {});
    }
  };

  const getCountryFlag = (code?: string) => {
    if (!code) return '🌐';
    const c = code.toUpperCase();
    if (c === 'ID') return '🇮🇩';
    if (c === 'MY') return '🇲🇾';
    if (c === 'US') return '🇺🇸';
    if (c === 'SG') return '🇸🇬';
    if (c === 'SA') return '🇸🇦';
    if (c === 'GB') return '🇬🇧';
    if (c === 'JP') return '🇯🇵';
    if (c === 'KR') return '🇰🇷';
    return '🌐';
  };

  const formatChatTime = (timestamp?: number) => {
    if (!timestamp) return 'Baru saja';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] flex flex-col ze-transparent-page bg-transparent">
      {/* 1. HEADER - sticky top-0 glass-navbar */}
      <div className="sticky top-0 z-[100] flex items-center justify-between h-[56px] px-3 glass-navbar border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                navigate('/chats');
              }
            }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 cursor-pointer pointer-events-auto relative z-[110] hover:bg-white/20 transition text-white"
            style={{ touchAction: 'manipulation' }}
            title="Kembali ke Chats"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
            <Globe size={16} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none">ZE.io Global Chat</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
              <p className="text-[10px] text-white/60 font-medium">
                {onlineCount} online • Realtime Global
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/10 border border-white/15 px-3 py-1 rounded-full text-xs font-mono font-bold text-white/90">
          {currentUser.id} {getCountryFlag(userCountry)}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <Globe size={40} className="mx-auto text-white/20 mb-3 animate-pulse" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-white/70">Selamat datang di Global Chat ZE.io!</p>
            <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">
              Semua orang di berbagai negara dan perangkat dapat saling mengirim pesan secara realtime di sini.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.username === currentUser.id;
            const isSticker = (m.message || '').startsWith('[STICKER]:');
            const stickerUrl = isSticker ? m.message.replace('[STICKER]:', '') : null;

            const uKey = (m.username || '').toLowerCase();
            const senderData =
              usersMap[m.username] ||
              usersMap[(m.username || '').toUpperCase()] ||
              usersMap[uKey] ||
              usersMap[(m.name || '').toLowerCase()];

            const isVerified = Boolean(
              senderData?.verified === true ||
              senderData?.blueTick === true ||
              senderData?.isVerified === true ||
              senderData?.isBlueTick === true ||
              uKey === 'ze.io' ||
              senderData?.role === 'owner' ||
              senderData?.isOwner === true
            );

            const displayName = m.name || senderData?.name || m.username;

            const userTarget = senderData || {
              id: m.username,
              name: displayName,
              username: m.username,
              photo: m.avatar,
              avatar: m.avatar,
              isVerified,
              verified: isVerified
            };

            const headerNode = (
              <div
                onClick={() => onOpenProfile?.(userTarget)}
                className="flex items-center gap-1.5 mb-1 px-1 cursor-pointer hover:opacity-85 transition group"
                title="Lihat Profil"
              >
                <img
                  src={
                    m.avatar ||
                    senderData?.photo ||
                    senderData?.avatar ||
                    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`
                  }
                  alt={displayName}
                  className="w-5 h-5 rounded-full object-cover border border-white/20 group-hover:border-white/60 transition"
                />
                <span className={`text-[11px] font-bold ${isMe ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                  {displayName}
                </span>
                <UserRoleBadge user={isMe ? { ...userTarget, ...currentUser } : userTarget} size="sm" />
              </div>
            );

            if (isSticker && stickerUrl) {
              return (
                <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1`}>
                  {headerNode}
                  <div className="w-32 h-32 rounded-2xl overflow-hidden drop-shadow-xl">
                    <img src={stickerUrl} alt="Sticker" className="w-full h-full object-cover rounded-2xl" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-white/40 mt-1 px-1 font-mono">
                    <span>{m.username}</span>
                    <span>{getCountryFlag(m.country)}</span>
                    <span>•</span>
                    <span>{formatChatTime(m.timestamp)}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id || idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {headerNode}
                <div
                  className={`max-w-[80%] rounded-[22px] px-4 py-2.5 text-sm shadow-md break-words ${
                    isMe
                      ? 'bg-white text-black font-semibold rounded-br-none'
                      : 'bg-[#1E1E1E] text-white rounded-bl-none border border-white/10'
                  }`}
                >
                  {renderMessageContent(m.message)}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/40 mt-1 px-1 font-mono">
                  <span>{m.username}</span>
                  <span>{getCountryFlag(m.country)}</span>
                  <span>•</span>
                  <span>{formatChatTime(m.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="fixed bottom-[135px] inset-x-0 z-50 max-w-2xl mx-auto px-4">
          <WhiteEmojiPicker
            onSelectEmoji={(code) => setInputText((p) => p + code)}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Sticker Picker Popup */}
      {showStickerPicker && (
        <div className="fixed bottom-[135px] inset-x-0 z-50 max-w-2xl mx-auto px-4">
          <StickerPicker
            onSelectSticker={handleSendGlobalSticker}
            onClose={() => setShowStickerPicker(false)}
          />
        </div>
      )}

      {/* 3. INPUT - NEMPEL BAWAH MATI, DI LUAR SCROLL */}
      <div className="flex-shrink-0 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] glass-navbar border-t border-white/10">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center glass-input rounded-full px-3 py-1.5 gap-2 max-w-2xl mx-auto"
        >
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowStickerPicker(false);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
              showEmojiPicker ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:text-white'
            }`}
          >
            <Smile size={17} strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={() => {
              setShowStickerPicker(!showStickerPicker);
              setShowEmojiPicker(false);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
              showStickerPicker ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:text-white'
            }`}
          >
            <Layers size={17} strokeWidth={1.5} />
          </button>

          <input
            type="text"
            placeholder="Ketik pesan ke seluruh dunia..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-xs sm:text-sm px-2 py-1"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition disabled:opacity-30 cursor-pointer shadow shrink-0"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 6. 1-ON-1 CHAT ROOM
// --------------------------------------------------------------------------
function ChatRoomView({
  currentUser,
  chatId,
  allUsers,
  onBack,
  onStartCall,
  onViewProfile,
}: {
  currentUser: UserProfile;
  chatId: string;
  allUsers: UserProfile[];
  onBack: () => void;
  onStartCall: (target: UserProfile, type: 'audio' | 'video') => void;
  onViewProfile: (u: UserProfile) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const otherId = chatId.includes('_')
    ? chatId.split('_').find((id) => id.toUpperCase() !== String(currentUser.id).toUpperCase())
    : null;

  const partner =
    allUsers.find((u) => String(u.id).toUpperCase() === String(otherId).toUpperCase()) || {
      id: otherId || '',
      name: otherId ? 'User ' + otherId.slice(-4) : 'Chat',
      username: (otherId || '').toLowerCase(),
      photo: '',
    };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?chatId=${encodeURIComponent(chatId)}&userId=${encodeURIComponent(currentUser.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages((prev) => {
            if (prev.length !== data.messages.length) return data.messages;
            const existingIds = new Set(prev.map((m) => m.id || `${m.createdAt}_${m.text}`));
            const hasNew = data.messages.some((m: any) => !existingIds.has(m.id || `${m.createdAt}_${m.text}`));
            return hasNew ? data.messages : prev;
          });
        }
      }
    } catch (e) {}
  };

  // Sembunyikan bottom-nav pas di dalem chat 1vs1
  useEffect(() => {
    document.querySelector('.bottom-nav')?.classList.add('hidden');
    return () => {
      document.querySelector('.bottom-nav')?.classList.remove('hidden');
    };
  }, []);

  // Real-time instantaneous message listener via SSE dispatch
  useEffect(() => {
    const handleRealtimeNewMsg = (e: any) => {
      const detail = e.detail;
      if (!detail || !detail.message) return;
      const sortedCurrent = chatId.includes('_')
        ? chatId.split('_').map((p: string) => p.toUpperCase()).sort().join('_')
        : chatId.toUpperCase();
      const sortedIncoming = detail.chatId
        ? (detail.chatId.includes('_')
            ? detail.chatId.split('_').map((p: string) => p.toUpperCase()).sort().join('_')
            : detail.chatId.toUpperCase())
        : '';
      const rawIncoming = (detail.rawChatId || '').toUpperCase();

      if (sortedIncoming === sortedCurrent || rawIncoming === chatId.toUpperCase() || detail.chatId === chatId) {
        const incoming = detail.message;
        setMessages((prev) => {
          if (incoming.id && prev.some((m) => m.id === incoming.id)) {
            return prev;
          }
          return [...prev, incoming];
        });
      }
    };

    window.addEventListener('ze-new-message', handleRealtimeNewMsg);
    return () => window.removeEventListener('ze-new-message', handleRealtimeNewMsg);
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
    fetch('/api/chats/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, userId: currentUser.id }),
    }).catch(() => {});

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchMessages();
    }, 4500);

    let unsubPrivate: any = null;
    let unsubLegacy: any = null;
    if (db) {
      try {
        const qPrivate = query(collection(db, `private_chats/${chatId}/messages`), orderBy('createdAt', 'asc'));
        unsubPrivate = onSnapshot(qPrivate, (snap) => {
          if (!snap.empty) {
            const list: ChatMessage[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                chatId,
                senderId: data.senderId || data.from,
                senderName: data.senderName || data.from || 'User',
                senderPhoto: data.senderPhoto || '',
                text: data.text,
                type: data.type || 'text',
                mediaUrl: data.mediaUrl,
                createdAt: data.createdAt || Date.now()
              } as ChatMessage;
            });
            setMessages(list);
          }
        });
      } catch (e) {}

      try {
        const qLegacy = query(collection(db, 'messages'), where('chatId', '==', chatId), orderBy('createdAt', 'asc'));
        unsubLegacy = onSnapshot(qLegacy, (snap) => {
          if (!snap.empty) {
            const list: ChatMessage[] = snap.docs.map((d) => d.data() as ChatMessage);
            setMessages((prev) => (prev.length === 0 ? list : prev));
          }
        });
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      if (unsubPrivate) unsubPrivate();
      if (unsubLegacy) unsubLegacy();
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');
    setShowEmojiPicker(false);
    setShowStickerPicker(false);

    const sortedChatId = chatId.includes('_')
      ? chatId.split('_').sort().join('_')
      : chatId;
    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newMsg: ChatMessage = {
      id: msgId,
      chatId: sortedChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderPhoto: currentUser.photo,
      text,
      type: 'text',
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);

    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: sortedChatId, message: newMsg, previewText: text }),
    }).catch(() => {});

    if (db) {
      try {
        addDoc(collection(db, `private_chats/${chatId}/messages`), {
          from: (currentUser.username || currentUser.id).toLowerCase(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderPhoto: currentUser.photo || '',
          text,
          type: 'text',
          createdAt: Date.now()
        }).catch(() => {});

        setDoc(doc(db, 'private_chats', chatId), {
          id: chatId,
          lastMessage: text,
          updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
      } catch (e) {}

      addDoc(collection(db, 'messages'), {
        ...newMsg,
        timestamp: serverTimestamp(),
      }).catch(() => {});

      setDoc(doc(db, 'chats', chatId), { lastMessage: text, lastTime: Date.now() }, { merge: true }).catch(() => {});
    }

    setIsSending(false);
  };

  const handleSendSticker = (sticker: StickerItem) => {
    setShowStickerPicker(false);
    setShowEmojiPicker(false);

    const stickerMsg: ChatMessage = {
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderPhoto: currentUser.photo,
      type: 'sticker',
      mediaUrl: sticker.url,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, stickerMsg]);

    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message: stickerMsg, previewText: 'Stiker' }),
    }).catch(() => {});

    if (db) {
      addDoc(collection(db, 'messages'), {
        ...stickerMsg,
        timestamp: serverTimestamp(),
      }).catch(() => {});

      setDoc(doc(db, 'chats', chatId), { lastMessage: 'Stiker', lastTime: Date.now() }, { merge: true }).catch(() => {});
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const base64 = await compressImage(file, 600, 600, 0.7);
    const mediaMsg: ChatMessage = {
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderPhoto: currentUser.photo,
      type: 'image',
      mediaUrl: base64,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, mediaMsg]);

    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message: mediaMsg, previewText: 'Foto dikirim' }),
    }).catch(() => {});

    if (db) {
      addDoc(collection(db, 'messages'), {
        ...mediaMsg,
        timestamp: serverTimestamp(),
      }).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] flex flex-col ze-transparent-page bg-transparent">
      {/* 1. HEADER - nempel atas */}
      <div className="flex-shrink-0 h-14 flex items-center justify-between px-3 border-b border-white/10 glass-navbar">
        <div className="flex items-center gap-3">
          <button onClick={() => onBack()} className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition cursor-pointer text-white">
            <ArrowLeft size={18} />
          </button>
          <div
            onClick={() => onViewProfile(partner as UserProfile)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="relative">
              <Avatar photo={partner.photo} name={partner.name} size="sm" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-white leading-none">{partner.name}</p>
                <UserRoleBadge user={partner} size="sm" />
              </div>
              <p className="text-[11px] text-white/40 font-mono mt-0.5">@{partner.username} • {partner.id}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onStartCall(partner as UserProfile, 'audio')}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
          >
            <Phone size={16} strokeWidth={1.5} className="text-white" />
          </button>
          <button
            onClick={() => onStartCall(partner as UserProfile, 'video')}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
          >
            <Video size={16} strokeWidth={1.5} className="text-white" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <Avatar photo={partner.photo} name={partner.name} size="xl" className="mb-3" />
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <p className="text-base font-bold text-white">{partner.name}</p>
              <UserRoleBadge user={partner} size="sm" />
            </div>
            <p className="text-xs text-white/40 mt-1 font-mono">@{partner.username} • {partner.id}</p>
            <p className="text-xs text-white/60 mt-4 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              Kalian sudah berteman pakai ID! Mulai kirim pesan pertama Anda.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderId === currentUser.id;

            // WA-style sticker: transparent large image, no chat bubble box
            if (m.type === 'sticker' && m.mediaUrl) {
              return (
                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} my-1`}>
                  <div className="w-32 h-32 rounded-2xl overflow-hidden drop-shadow-2xl">
                    <img src={m.mediaUrl} alt="Sticker" className="w-full h-full object-cover pointer-events-none rounded-2xl" />
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-[20px] px-4 py-2.5 shadow-sm text-sm ${
                    isMe
                      ? 'bg-white text-black font-semibold rounded-br-none'
                      : 'bg-[#1E1E1E] text-white rounded-bl-none border border-white/10'
                  }`}
                >
                  {m.type === 'image' && m.mediaUrl ? (
                    <img src={m.mediaUrl} alt="Photo" className="rounded-xl max-h-60 object-cover mb-1.5" />
                  ) : null}
                  {m.text && renderMessageContent(m.text)}
                  <p
                    className={`text-[9px] mt-1 text-right font-mono ${
                      isMe ? 'text-black/50' : 'text-white/40'
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <WhiteEmojiPicker
          onSelectEmoji={(code) => setInputText((prev) => prev + code)}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Sticker Picker Popup */}
      {showStickerPicker && (
        <StickerPicker
          onSelectSticker={handleSendSticker}
          onClose={() => setShowStickerPicker(false)}
        />
      )}

      {/* 3. INPUT - NEMPEL BAWAH MATI, DI LUAR SCROLL */}
      <div className="flex-shrink-0 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] glass-navbar border-t border-white/10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowStickerPicker(false);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
            showEmojiPicker ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:text-white'
          }`}
          title="Emoji"
        >
          <Smile size={17} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          onClick={() => {
            setShowStickerPicker(!showStickerPicker);
            setShowEmojiPicker(false);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
            showStickerPicker ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:text-white'
          }`}
          title="Stiker"
        >
          <Layers size={17} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          onClick={() => mediaInputRef.current?.click()}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white cursor-pointer shrink-0"
          title="Kirim Foto"
        >
          <Camera size={17} strokeWidth={1.5} />
        </button>

        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*"
          onChange={handleMediaUpload}
          className="hidden"
        />

        <form onSubmit={handleSend} className="flex-1 flex items-center bg-white/10 rounded-full px-3 py-1.5 gap-2 border border-white/10">
          <input
            type="text"
            placeholder="Ketik pesan..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-xs sm:text-sm px-1 py-1"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-8 h-8 rounded-full bg-white text-black disabled:opacity-30 flex items-center justify-center active:scale-95 transition cursor-pointer shadow shrink-0"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 7. GROUP CHAT ROOM VIEW
// --------------------------------------------------------------------------
function GroupChatView({
  currentUser,
  groupId,
  groups,
  allUsers,
  onBack,
  onOpenInfo,
  onViewProfile,
}: {
  currentUser: UserProfile;
  groupId: string;
  groups: GroupItem[];
  allUsers: UserProfile[];
  onBack: () => void;
  onOpenInfo: () => void;
  onViewProfile: (u: UserProfile) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const group = groups.find((g) => g.id === groupId) || {
    id: groupId,
    name: 'Grup ZE.io',
    photo: '',
    members: [currentUser.id],
    admin: currentUser.id,
    createdAt: Date.now(),
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?chatId=${encodeURIComponent(groupId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchMessages();
    }, 4500);

    let unsub: any = null;
    if (db) {
      try {
        const q = query(collection(db, 'messages'), where('chatId', '==', groupId), orderBy('createdAt', 'asc'));
        unsub = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            setMessages(snap.docs.map((d) => d.data() as ChatMessage));
          }
        });
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      if (unsub) unsub();
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');

    const newMsg: ChatMessage = {
      chatId: groupId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderPhoto: currentUser.photo,
      text,
      type: 'text',
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);

    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: groupId, message: newMsg, previewText: `${currentUser.name}: ${text}` }),
    }).catch(() => {});

    if (db) {
      addDoc(collection(db, 'messages'), {
        ...newMsg,
        timestamp: serverTimestamp(),
      }).catch(() => {});

      setDoc(doc(db, 'chats', groupId), {
        lastMessage: `${currentUser.name}: ${text}`,
        lastTime: Date.now()
      }, { merge: true }).catch(() => {});
    }

    setIsSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] flex flex-col ze-transparent-page bg-transparent">
      {/* 1. HEADER - nempel atas */}
      <div className="h-14 flex items-center px-3 gap-2 glass-navbar border-b border-white/10 sticky top-0 z-[100] flex-shrink-0">
        <button 
          onClick={() => onBack()} 
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 cursor-pointer pointer-events-auto relative z-[110] hover:bg-white/20 transition text-white"
          style={{ touchAction: 'manipulation' }}
          title="Kembali"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center font-bold text-white text-sm">
          {group.name ? group.name.trim().charAt(0).toUpperCase() : 'Z'}
        </div>
        <div className="flex-1 cursor-pointer" onClick={onOpenInfo}>
          <p className="text-sm font-bold text-white leading-none">{group.name}</p>
          <p className="text-xs text-white/60 mt-0.5">{group.members?.length || 1} anggota • Online</p>
        </div>
        <button onClick={onOpenInfo} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer">
          <Info size={19} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => {
          const isMe = m.senderId === currentUser.id;
          const senderUser = allUsers.find((u) => u.id === m.senderId);
          return (
            <div key={idx} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <div onClick={() => senderUser && onViewProfile(senderUser)} className="cursor-pointer">
                  <Avatar photo={m.senderPhoto} name={m.senderName} size="xs" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-[20px] px-4 py-2.5 text-sm ${
                  isMe
                    ? 'bg-white text-black font-semibold rounded-br-none'
                    : 'bg-[#1E1E1E] text-white rounded-bl-none border border-white/10'
                }`}
              >
                {!isMe && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <p className="text-[10px] text-purple-400 font-bold">{m.senderName}</p>
                    {senderUser && <UserRoleBadge user={senderUser} size="sm" />}
                  </div>
                )}
                <p className="leading-relaxed break-words">{m.text}</p>
                <p
                  className={`text-[9px] mt-1 text-right ${
                    isMe ? 'text-black/50' : 'text-white/40'
                  }`}
                >
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. INPUT - NEMPEL BAWAH MATI, DI LUAR SCROLL */}
      <div className="flex-shrink-0 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] glass-navbar border-t border-white/10">
        <form onSubmit={handleSend} className="flex items-center glass-input rounded-full px-3 py-1.5 gap-2">
          <input
            type="text"
            placeholder="Kirim pesan ke grup..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-xs sm:text-sm px-1 py-1"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-8 h-8 rounded-full bg-white text-black disabled:opacity-30 flex items-center justify-center active:scale-95 transition cursor-pointer shadow shrink-0"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 8. GROUP INFO VIEW (TAP MEMBER => OPENS PROFILE VIEW MODAL)
// --------------------------------------------------------------------------
function GroupInfoView({
  currentUser,
  groupId,
  groups,
  allUsers,
  onBack,
  onViewProfile,
}: {
  currentUser: UserProfile;
  groupId: string;
  groups: GroupItem[];
  allUsers: UserProfile[];
  onBack: () => void;
  onViewProfile: (u: UserProfile) => void;
}) {
  const [localMembers, setLocalMembers] = useState<string[]>(() => {
    try {
      const savedMembers = localStorage.getItem(`ze_group_members_${groupId}`);
      if (savedMembers) return JSON.parse(savedMembers);
    } catch {}
    const initialGroup = groups.find((g) => g.id === groupId);
    return initialGroup?.members || [currentUser.id];
  });

  const [showAddMember, setShowAddMember] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const group = groups.find((g) => g.id === groupId) || {
    id: groupId,
    name: 'Grup ZE.io',
    photo: '',
    members: localMembers,
    admin: currentUser.id,
    createdAt: Date.now(),
    description: 'Deskripsi grup',
  };

  // User list dari global allUsers
  const candidateUsers = allUsers;

  const memberUsers = candidateUsers.filter((u) => localMembers.includes(u.id) || localMembers.includes(u.username) || u.id === currentUser.id);

  const handleAddMemberToGroup = (selectedUser: any) => {
    const targetId = selectedUser.id || selectedUser.username;
    const isAlreadyMember = localMembers.includes(targetId) || localMembers.includes(selectedUser.username);

    // Validasi: kalo username udah ada di grup
    if (isAlreadyMember) {
      showToast('Anggota sudah ada di grup ini');
      return;
    }

    const updated = [...localMembers, targetId];
    setLocalMembers(updated);
    try {
      localStorage.setItem(`ze_group_members_${groupId}`, JSON.stringify(updated));
      localStorage.setItem('ze_group_members', JSON.stringify(updated));
      // update di vn_groups_list jika ada
      const rawGroups = localStorage.getItem('vn_groups_list');
      if (rawGroups) {
        const parsed = JSON.parse(rawGroups);
        const gIdx = parsed.findIndex((g: any) => g.id === groupId);
        if (gIdx >= 0) {
          parsed[gIdx].members = updated;
          localStorage.setItem('vn_groups_list', JSON.stringify(parsed));
        }
      }
    } catch {}

    showToast(`${selectedUser.name || selectedUser.username} berhasil ditambahkan ke grup`);
  };

  return (
    <div className="min-h-screen ze-transparent-page bg-transparent pb-8">
      <div className="sticky top-0 z-40 glass-navbar border-b border-white/[0.10] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1 text-white/80 hover:text-white cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-bold text-white">Info Grup</h2>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        <div className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-6 flex flex-col items-center text-center shadow-xl">
          <Avatar photo={group.photo} name={group.name} size="2xl" className="w-24 h-24 text-3xl mb-3" />
          <h3 className="text-xl font-bold text-white">{group.name}</h3>
          <p className="text-xs text-white/50 mt-1">{group.members.length} Anggota • Dibuat oleh Admin</p>
          <p className="text-xs text-white/70 mt-3 leading-relaxed max-w-xs">{group.description || 'Tidak ada deskripsi'}</p>
        </div>

        {/* Tombol Tambah Anggota */}
        <button
          onClick={() => setShowAddMember(true)}
          className="w-full py-3 bg-white text-black rounded-full font-medium text-sm hover:bg-white/90 active:scale-95 transition cursor-pointer shadow flex items-center justify-center gap-2 mb-4"
        >
          <Plus size={18} />
          <span>+ Tambah Anggota</span>
        </button>

        {showAddMember && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#141414] border border-white/10 rounded-[28px] p-5 shadow-2xl relative max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h3 className="text-base font-bold text-white">Tambah Anggota Grup</h3>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search input */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Cari nama atau username..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-white/30"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-60">
                {candidateUsers
                  .filter((u) => {
                    const q = addSearch.toLowerCase();
                    return (u.name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
                  })
                  .map((u) => {
                    const isAlreadyIn = localMembers.includes(u.id) || localMembers.includes(u.username);
                    return (
                      <div
                        key={u.id}
                        className="p-2.5 rounded-xl bg-[#1a1a1a] border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar photo={u.photo} name={u.name} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                              <UserRoleBadge user={u} size="xs" />
                            </div>
                            <p className="text-[10px] text-white/40 font-mono truncate">@{u.username}</p>
                          </div>
                        </div>

                        {isAlreadyIn ? (
                          <span className="text-[10px] text-white/40 px-2 py-1 bg-white/5 rounded-md">
                            Sudah di grup
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddMemberToGroup(u)}
                            className="px-3 py-1 bg-white text-black text-xs font-bold rounded-full hover:bg-white/90 active:scale-95 transition cursor-pointer shadow"
                          >
                            + Tambah
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-[#1a1a1a] border border-white/20 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 pointer-events-none">
            <Check size={14} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-5 shadow-xl">
          <h4 className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-3">
            Daftar Anggota ({memberUsers.length})
          </h4>
          <div className="space-y-2.5">
            {memberUsers.map((m) => {
              const isAdmin = m.id === group.admin || (m.id === currentUser.id && !group.admin);
              return (
                <div
                  key={m.id}
                  onClick={() => onViewProfile(m)}
                  className="p-2.5 rounded-2xl hover:bg-white/5 border border-white/5 flex items-center justify-between cursor-pointer transition active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <Avatar photo={m.photo} name={m.name} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white">{m.name} {m.id === currentUser.id && '(Anda)'}</p>
                        <UserRoleBadge user={m} size="sm" />
                      </div>
                      <p className="text-xs text-white/40 font-mono">@{m.username} • {m.id}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <span className="text-[10px] bg-white/10 text-white/80 px-2.5 py-0.5 rounded-full font-semibold border border-white/10">
                      Admin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 9. COMMUNITY DETAIL VIEW
// --------------------------------------------------------------------------
function CommunityDetailView({
  currentUser,
  communityId,
  communities,
  allUsers,
  onBack,
  onViewProfile,
}: {
  currentUser: UserProfile;
  communityId: string;
  communities: CommunityItem[];
  allUsers: UserProfile[];
  onBack: () => void;
  onViewProfile: (u: UserProfile) => void;
}) {
  const [activeTab, setActiveTab] = useState<'chat' | 'members' | 'media'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  const comm = communities.find((c) => c.id === communityId) || {
    id: communityId,
    name: 'Komunitas ZE.io',
    description: 'Tempat berkumpul komunitas kreatif',
    members: [currentUser.id],
    createdAt: Date.now(),
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?chatId=${encodeURIComponent(communityId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchMessages();
    }, 4500);
    return () => clearInterval(interval);
  }, [communityId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    setInputText('');

    const newMsg: ChatMessage = {
      chatId: communityId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderPhoto: currentUser.photo,
      text,
      type: 'text',
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);

    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: communityId, message: newMsg, previewText: `${currentUser.name}: ${text}` }),
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col">
      <div className="bg-[#141414]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 text-white/80 hover:text-white cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-base font-bold text-white leading-none">{comm.name}</h2>
            <p className="text-[11px] text-white/40 mt-0.5">{comm.members.length || 1} anggota terdaftar</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/[0.06] bg-[#101010]/80">
        {(['chat', 'members', 'media'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize transition ${
              activeTab === tab
                ? 'text-white border-b-2 border-white'
                : 'text-white/40 hover:text-white'
            }`}
          >
            {tab === 'chat' ? 'Obrolan Publik' : tab === 'members' ? 'Anggota' : 'Media'}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Globe size={36} className="mx-auto text-white/20 mb-2" />
                <p className="text-sm font-semibold text-white/60">Obrolan Komunitas Dimulai!</p>
                <p className="text-xs text-white/30 mt-1">Kirim pesan pertama Anda di komunitas ini</p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isMe = m.senderId === currentUser.id;
                const senderUser = allUsers.find((u) => u.id === m.senderId);
                return (
                  <div key={idx} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div onClick={() => senderUser && onViewProfile(senderUser)} className="cursor-pointer">
                        <Avatar photo={m.senderPhoto} name={m.senderName} size="xs" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-[20px] px-4 py-2.5 text-sm ${
                        isMe
                          ? 'bg-white text-black font-semibold rounded-br-none'
                          : 'bg-[#1E1E1E] text-white rounded-bl-none border border-white/10'
                      }`}
                    >
                      {!isMe && (
                        <div className="flex items-center gap-1 mb-0.5">
                          <p className="text-[10px] text-purple-400 font-bold">{m.senderName}</p>
                          {senderUser && <UserRoleBadge user={senderUser} size="xs" />}
                        </div>
                      )}
                      <p className="leading-relaxed break-words">{m.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSend} className="bg-[#141414] border-t border-white/[0.08] px-3 py-2.5 flex items-center gap-2">
            <input
              type="text"
              placeholder="Kirim pesan ke seluruh anggota komunitas..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[#1E1E1E] border border-white/[0.1] rounded-full px-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/40"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-full bg-white text-black disabled:opacity-30 flex items-center justify-center active:scale-95 transition cursor-pointer shadow"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {allUsers.slice(0, 10).map((u) => (
            <div
              key={u.id}
              onClick={() => onViewProfile(u)}
              className="p-3 rounded-2xl bg-[#141414] border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/20 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar photo={u.photo} name={u.name} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                    <UserRoleBadge user={u} size="sm" />
                  </div>
                  <p className="text-xs text-white/40 font-mono truncate">@{u.username} • {u.id}</p>
                </div>
              </div>
              <span className="text-xs text-white/40">Anggota</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'media' && (
        <div className="flex-1 overflow-y-auto p-4 text-center py-12">
          <Film size={36} className="mx-auto text-white/20 mb-2" />
          <p className="text-sm text-white/60">Belum ada media bersama</p>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// UNIVERSAL PROFILE MODAL (LIAT PROFIL KONTAK GLOBAL)
// --------------------------------------------------------------------------
function ProfileModal({
  user: initialUser,
  currentUser,
  groups,
  onClose,
  onOpenChat,
  onStartCall,
}: {
  user: UserProfile;
  currentUser: UserProfile;
  groups: GroupItem[];
  onClose: () => void;
  onOpenChat: (u: UserProfile) => void;
  onStartCall: (u: UserProfile) => void;
}) {
  const [liveUser, setLiveUser] = useState<any>(initialUser);
  const [posts, setPosts] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [roleNotice, setRoleNotice] = useState<string>('');

  const targetId = initialUser.id || '';
  const targetIdUpper = String(targetId).trim().toUpperCase();

  // Notify App.tsx when post viewer inside ProfileModal is opened/closed
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('ze-post-modal-toggle', { detail: { open: Boolean(selectedPost) } })
    );
    return () => {
      window.dispatchEvent(new CustomEvent('ze-post-modal-toggle', { detail: { open: false } }));
    };
  }, [selectedPost]);

  // Reset state immediately on target account change & load authoritative DB profile + role + UID posts
  useEffect(() => {
    setLiveUser(initialUser);
    setPosts([]);
    setSelectedPost(null);
    if (!targetIdUpper) return;

    let cancelled = false;

    // 1. Load Profile Stats (Likes & Followers)
    fetch(
      `/api/profile/stats?targetId=${encodeURIComponent(targetIdUpper)}&myId=${encodeURIComponent(currentUser.id)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d?.success) return;
        setLikeCount(d.likesCount || 0);
        setFollowerCount(d.followersCount || 0);
        setIsLiked(Boolean(d.isLiked));
        setIsFollowing(Boolean(d.isFollowing));
      })
      .catch(() => {});

    // 2. Load Authoritative User Photo, Bio & VIP Status from /api/users + /api/auth/role
    fetch('/api/users')
      .then((r) => r.json())
      .then((uData) => {
        if (cancelled || !Array.isArray(uData?.users)) return;
        const foundServerUser = uData.users.find(
          (u: any) => String(u.id).trim().toUpperCase() === targetIdUpper
        );
        if (foundServerUser) {
          setLiveUser((prev: any) => ({
            ...prev,
            ...normalizeUser(foundServerUser)
          }));
        }
      })
      .catch(() => {});

    fetch(`/api/auth/role/${encodeURIComponent(targetIdUpper)}`)
      .then((r) => r.json())
      .then((roleData) => {
        if (cancelled || !roleData?.success) return;
        const isTargetVip = Boolean(roleData.isVip);
        const targetVipLevel: 'basic' | 'exclusive' | undefined = roleData.isOwner
          ? 'exclusive'
          : isTargetVip
          ? roleData.vipLevel === 'exclusive' || roleData.isVipExclusive
            ? 'exclusive'
            : 'basic'
          : undefined;
        setLiveUser((prev: any) => ({
          ...prev,
          role: roleData.role,
          isAdmin: roleData.isAdmin,
          isOwner: roleData.isOwner,
          isVip: isTargetVip,
          vip: isTargetVip,
          vipLevel: targetVipLevel,
          isVipExclusive: Boolean(
            roleData.isOwner || (isTargetVip && targetVipLevel === 'exclusive')
          ),
          vipExpiresAt: roleData.vipExpiresAt,
        }));
      })
      .catch(() => {});

    // 3. Strict Per-Account Video & Photo Fetch (NO global fallback to other users' posts!)
    fetch(
      `/api/posts?userId=${encodeURIComponent(targetIdUpper)}&viewerId=${encodeURIComponent(currentUser.id)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d && d.success && Array.isArray(d.posts)) {
          const strictOwnedPosts = d.posts.filter(
            (p: any) => String(p.uid || p.userId || '').trim().toUpperCase() === targetIdUpper
          );
          setPosts(strictOwnedPosts);
        } else {
          setPosts([]);
        }
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      });

    let unsubUser: any = null;
    if (db) {
      try {
        unsubUser = onSnapshot(doc(db, 'ze_users', targetIdUpper), (snap) => {
          if (!cancelled && snap.exists()) {
            setLiveUser((prev: any) => ({ ...prev, ...snap.data() }));
          }
        });
      } catch {}
    }

    return () => {
      cancelled = true;
      if (unsubUser) unsubUser();
    };
  }, [targetIdUpper, currentUser.id]);

  const handleToggleLike = async () => {
    try {
      const res = await fetch('/api/profile/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: targetIdUpper, myId: currentUser.id }),
      });
      const data = await res.json();
      if (data && data.success) {
        setIsLiked(data.isLiked);
        setLikeCount(data.likesCount);
      }
    } catch {}
  };

  const handleToggleFollow = async () => {
    try {
      const res = await fetch('/api/profile/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: targetIdUpper, myId: currentUser.id }),
      });
      const data = await res.json();
      if (data && data.success) {
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followersCount);
      }
    } catch {}
  };

  const copyId = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(displayUser.id).catch(() => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = displayUser.id;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function displayUserIsOwner(u: any) {
    if (!u) return false;
    return Boolean(
      u.owner ||
        u.isOwner ||
        u.role === 'owner' ||
        String(u.id || '').toUpperCase() === 'ZE-OWNER'
    );
  }

  const isOwner =
    displayUserIsOwner(liveUser) ||
    displayUserIsOwner(initialUser) ||
    liveUser?.username?.toLowerCase() === 'ze.io' ||
    initialUser.username?.toLowerCase() === 'ze.io';

  const isVerified = Boolean(
    isOwner ||
      liveUser?.verified === true ||
      liveUser?.isVerified === true ||
      liveUser?.blueTick === true ||
      liveUser?.isBlueTick === true ||
      initialUser.isVerified === true ||
      (initialUser as any).verified === true ||
      (initialUser as any).blueTick === true
  );

  const displayUser: UserProfile = {
    ...initialUser,
    ...liveUser,
    id: targetIdUpper || initialUser.id,
    isVerified,
    isOwner,
  };

  const isSelfProfile =
    String(displayUser.id).toUpperCase() === String(currentUser.id).toUpperCase();

  const resolvedAvatarUrl =
    liveUser?.photo ||
    liveUser?.avatar ||
    initialUser?.photo ||
    initialUser?.avatar ||
    (targetIdUpper ? localStorage.getItem(`ze_avatar_${targetIdUpper}`) : '') ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
      displayUser.name || 'User'
    )}`;

  return (
    <div className="fixed inset-0 z-[160] w-screen h-[100dvh] overflow-y-auto bg-transparent text-white flex flex-col select-none">
      {/* FULL-SCREEN STICKY TOP BAR WITH WORKING BACK BUTTON */}
      <div className="sticky top-0 z-30 bg-black/40 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold transition cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>

        <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-[180px]">
          @{displayUser.username || 'user'}
        </h2>

        <div className="w-20 flex justify-end">
          <span className="text-[10px] font-mono text-white/45 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            {displayUser.id}
          </span>
        </div>
      </div>

      {/* FULL-SCREEN PROFILE CONTENT */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col">
        {/* HEADER */}
        <div className="flex flex-col items-center px-6 pt-6 pb-5">
          <div className="relative">
            <img
              src={resolvedAvatarUrl}
              alt={displayUser.name}
              className="w-28 h-28 rounded-full object-cover border-2 border-white/40 shadow-2xl bg-black/40"
            />
            {isOwner && (
              <span className="absolute bottom-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-black shadow">
                OWNER
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mt-3.5 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight">{displayUser.name}</h1>
            <UserRoleBadge user={displayUser} size="md" />
          </div>

          <p className="text-white/60 text-sm mt-0.5">@{displayUser.username || 'user'}</p>

          <div
            onClick={copyId}
            className="bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md px-3.5 py-1 rounded-full mt-2.5 text-xs flex items-center gap-1.5 text-white/90 cursor-pointer active:scale-95 transition"
            title="Salin ID"
          >
            <span className="font-mono font-bold">{displayUser.id}</span>
            {copied ? (
              <Check size={13} className="text-green-400" />
            ) : (
              <Copy size={13} className="text-white/60" />
            )}
          </div>

          <p className="mt-3 text-sm text-center max-w-xs text-white/80 leading-relaxed">
            {displayUser.bio ||
              (displayUser as any).about ||
              (isOwner
                ? 'Official Owner & Creator of ZE.io 🚀'
                : 'Hey there! I am using ZE.io.')}
          </p>

          {roleNotice && (
            <p className="mt-2 text-xs text-emerald-400 font-semibold text-center">{roleNotice}</p>
          )}

          {/* Owner Button to Grant/Revoke Centang Biru Global */}
          {isUserOwner(currentUser) && !isSelfProfile && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (!db) return;
                const nextStatus = !isVerified;
                try {
                  await setDoc(
                    doc(db, 'ze_users', displayUser.id),
                    {
                      verified: nextStatus,
                      blueTick: nextStatus,
                      isVerified: nextStatus,
                      isBlueTick: nextStatus,
                    },
                    { merge: true }
                  );

                  if (displayUser.username) {
                    await setDoc(
                      doc(db, 'ze_users', displayUser.username.toLowerCase()),
                      {
                        verified: nextStatus,
                        blueTick: nextStatus,
                        isVerified: nextStatus,
                        isBlueTick: nextStatus,
                      },
                      { merge: true }
                    );
                  }

                  setLiveUser((prev: any) => ({
                    ...prev,
                    verified: nextStatus,
                    blueTick: nextStatus,
                    isVerified: nextStatus,
                  }));

                  setRoleNotice(
                    nextStatus
                      ? `Centang biru global aktif untuk @${displayUser.username}`
                      : `Centang biru dicabut dari @${displayUser.username}`
                  );
                  setTimeout(() => setRoleNotice(''), 3000);
                } catch (err) {
                  console.warn('Set verified error:', err);
                }
              }}
              className="mt-3 px-3.5 py-1 rounded-full text-xs font-bold border border-[#1D9BF0]/40 bg-[#1D9BF0]/15 text-[#1D9BF0] hover:bg-[#1D9BF0]/25 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>✓</span>
              <span>{isVerified ? 'Cabut Centang Biru Global' : 'Beri Centang Biru Global'}</span>
            </button>
          )}

          {/* STATS - REAL */}
          <div className="flex gap-4 mt-5 pt-3.5 border-t border-white/10 w-full justify-around text-center">
            <div className="text-center">
              <p className="font-bold text-lg text-white">
                {isOwner ? '989M' : followerCount}
              </p>
              <p className="text-xs text-white/50 font-medium">Pengikut</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-white">{likeCount}</p>
              <p className="text-xs text-white/50 font-medium">Suka Profil</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-white">{posts.length}</p>
              <p className="text-xs text-white/50 font-medium">Postingan</p>
            </div>
          </div>

          {/* ACTION BUTTONS (FOLLOW, LIKE PROFIL, CHAT, CALL) */}
          {!isSelfProfile && (
            <>
              <div className="flex gap-2.5 w-full mt-4">
                <button
                  onClick={handleToggleFollow}
                  className={`flex-1 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer shadow ${
                    isFollowing
                      ? 'bg-white/15 text-white border border-white/20 backdrop-blur-md hover:bg-white/20'
                      : 'bg-white text-black hover:bg-white/90'
                  }`}
                >
                  <UserPlus size={15} />
                  <span>{isFollowing ? 'Mengikuti' : 'Ikuti'}</span>
                </button>

                <button
                  onClick={handleToggleLike}
                  className={`flex-1 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer shadow border ${
                    isLiked
                      ? 'bg-red-500/20 border-red-500/40 text-red-300 backdrop-blur-md hover:bg-red-500/30'
                      : 'bg-white/10 border-white/15 text-white backdrop-blur-md hover:bg-white/20'
                  }`}
                >
                  <Heart size={15} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
                  <span>{isLiked ? 'Disukai' : 'Suka Profil'}</span>
                </button>
              </div>

              <div className="flex gap-3 w-full mt-2.5">
                <button
                  onClick={() => onOpenChat(displayUser)}
                  className="flex-1 bg-white text-black py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-white/90 active:scale-95 transition shadow cursor-pointer"
                >
                  <MessageCircle size={15} />
                  Chat
                </button>
                <button
                  onClick={() => onStartCall(displayUser)}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-white py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                >
                  <Video size={15} />
                  Video Call
                </button>
              </div>
            </>
          )}
        </div>

        {/* TABS POSTS / LIKED */}
        <div className="flex border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-[57px] z-20">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'posts'
                ? 'border-b-2 border-white text-white'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'liked'
                ? 'border-b-2 border-white text-white'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Liked (0)
          </button>
        </div>

        {/* FULL-SCREEN VIDEO & PHOTO GRID (STRICTLY THIS ACCOUNT'S UID) */}
        <div className="p-2 pb-16 flex-1">
          {activeTab === 'liked' ? (
            <div className="text-center py-16 text-white/40 text-xs">
              Belum ada postingan yang disukai
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-white/40 text-xs">
              Belum ada video atau foto yang diunggah oleh akun ini
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {posts.map((post, idx) => {
                const mediaSrc = post.url || post.thumbnail || '';
                const isVid =
                  post.type === 'video' ||
                  mediaSrc.startsWith('data:video/') ||
                  /\.(mp4|webm|mov|ogv)(\?|$)/i.test(mediaSrc);
                return (
                  <div
                    key={post.id || idx}
                    className="aspect-[9/16] bg-black/40 backdrop-blur-md rounded-xl overflow-hidden relative cursor-pointer group border border-white/10 hover:border-white/25 transition"
                    onClick={() => setSelectedPost(post)}
                  >
                    {isVid ? (
                      <video
                        src={mediaSrc}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <img
                        src={mediaSrc}
                        alt={post.caption || ''}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/65 backdrop-blur-sm px-1.5 py-0.5 rounded text-white flex items-center gap-1 font-mono">
                      <span>▶</span>
                      <span>{post.views || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Post Viewer inside Profile Page */}
      {selectedPost && (
        <div className="fixed inset-0 z-[210] bg-black flex flex-col h-[100dvh] w-screen">
          <div className="flex-shrink-0 px-4 py-3 bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Kembali</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">@{displayUser.username}</span>
              <UserRoleBadge user={displayUser} size="xs" />
            </div>
            <div className="w-16" />
          </div>

          <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
            {(() => {
              const src = selectedPost.url || selectedPost.thumbnail || '';
              const isVid =
                selectedPost.type === 'video' ||
                src.startsWith('data:video/') ||
                /\.(mp4|webm|mov|ogv)(\?|$)/i.test(src);
              return isVid ? (
                <video
                  src={src}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain max-h-full"
                />
              ) : (
                <img
                  src={src}
                  alt={selectedPost.caption || ''}
                  className="w-full h-full object-contain max-h-full"
                />
              );
            })()}
          </div>

          {selectedPost.caption && (
            <div className="flex-shrink-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-zinc-950 border-t border-white/10 text-xs text-white">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-bold">@{displayUser.username}</span>
                <UserRoleBadge user={displayUser} size="xs" />
              </div>
              <p className="text-zinc-300 leading-relaxed">{selectedPost.caption}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// MODAL CREATE NOTE (IG NOTES)
// --------------------------------------------------------------------------
function CreateNoteModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (text: string, emoji: string) => void;
}) {
  const [text, setText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💭');

  const emojis = ['😊', '🔥', '💤', '🎧', '💭', '❤️', '😎', '🚀'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSave(text, selectedEmoji);
  };

  return (
    <div className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] bg-[#141414]/90 backdrop-blur-[30px] border border-white/10 rounded-[28px] p-6">
        <h3 className="text-white font-bold text-lg">Buat Catatan</h3>
        <p className="text-white/50 text-xs mt-1">Bagikan pemikiran singkat, hilang setelah 24 jam</p>

        <form onSubmit={handleSubmit} className="mt-5">
          <div className="bg-white text-black rounded-[20px] rounded-bl-[4px] px-4 py-3 shadow-lg">
            <input
              placeholder="Apa yang sedang dipikirkan?"
              maxLength={60}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-transparent outline-none text-[15px] placeholder:text-black/40 text-black font-medium"
              autoFocus
            />
          </div>

          <div className="mt-3 flex gap-2 flex-wrap justify-center">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-lg cursor-pointer transition ${
                  selectedEmoji === emoji ? 'bg-white text-black shadow' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 text-white rounded-full py-3 font-semibold text-xs active:scale-95 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex-1 bg-white text-black rounded-full py-3 font-semibold text-xs active:scale-95 transition disabled:opacity-40 cursor-pointer shadow"
            >
              Bagikan
            </button>
          </div>
          <p className="text-white/30 text-[11px] text-center mt-3 font-mono">
            {text.length}/60
          </p>
        </form>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// MODAL CREATE GROUP
// --------------------------------------------------------------------------
function CreateGroupModal({
  currentUser,
  friends,
  onClose,
  onCreated,
}: {
  currentUser: UserProfile;
  friends: UserProfile[];
  onClose: () => void;
  onCreated: (group: GroupItem) => void;
}) {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImage(file, 400, 400, 0.7);
    setPhoto(base64);
  };

  const toggleSelectFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const newGroupId = 'group_' + Date.now();
    const newGroup: GroupItem = {
      id: newGroupId,
      name: name.trim(),
      photo,
      members: Array.from(new Set([currentUser.id, ...selectedFriends])),
      admin: currentUser.id,
      createdAt: Date.now(),
    };

    fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: newGroup }),
    }).catch(() => {});

    if (db) {
      setDoc(doc(db, 'groups', newGroupId), newGroup).catch(() => {});
    }

    onCreated(newGroup);
  };

  return (
    <div className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#141414]/90 backdrop-blur-[30px] border border-white/10 rounded-[28px] p-6 max-h-[90vh] flex flex-col">
        <h3 className="text-lg font-bold text-white mb-4">Buat Grup Baru</h3>

        <div className="flex flex-col items-center mb-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-full bg-[#1E1E1E] border-2 border-dashed border-white/20 hover:border-white/50 flex items-center justify-center overflow-hidden cursor-pointer relative"
          >
            {photo ? (
              <img src={photo} alt="Group" className="w-full h-full object-cover" />
            ) : (
              <Camera size={24} className="text-white/40" />
            )}
          </div>
          <span className="text-[11px] text-white/50 mt-1">Foto Grup</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        <input
          type="text"
          placeholder="Nama Grup..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[#1E1E1E] border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/40 mb-4"
        />

        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          <p className="text-xs text-white/50 font-semibold mb-1">Pilih Anggota ({selectedFriends.length} dipilih)</p>
          {friends.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-4">Belum ada teman untuk ditambahkan</p>
          ) : (
            friends.map((f) => {
              const selected = selectedFriends.includes(f.id);
              return (
                <div
                  key={f.id}
                  onClick={() => toggleSelectFriend(f.id)}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    selected ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-white/5 text-white/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar photo={f.photo} name={f.name} size="sm" />
                    <span className="text-xs font-semibold">{f.name}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'bg-white text-black border-white' : 'border-white/20'}`}>
                    {selected && <Check size={12} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 active:scale-95 transition"
          >
            Batal
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 py-3 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 active:scale-95 transition disabled:opacity-40"
          >
            Buat Grup
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// MODAL CREATE COMMUNITY
// --------------------------------------------------------------------------
function CreateCommunityModal({
  currentUser,
  onClose,
  onCreated,
}: {
  currentUser: UserProfile;
  onClose: () => void;
  onCreated: (comm: CommunityItem) => void;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImage(file, 400, 400, 0.7);
    setPhoto(base64);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const newComm: CommunityItem = {
      id: 'comm_' + Date.now(),
      name: name.trim(),
      description: desc.trim() || 'Komunitas di ZE.io',
      photo,
      members: [currentUser.id],
      createdAt: Date.now(),
    };

    fetch('/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ community: newComm }),
    }).catch(() => {});

    onCreated(newComm);
  };

  return (
    <div className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#141414]/90 backdrop-blur-[30px] border border-white/10 rounded-[28px] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Buat Komunitas</h3>

        <div className="flex flex-col items-center mb-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-full bg-[#1E1E1E] border-2 border-dashed border-white/20 hover:border-white/50 flex items-center justify-center overflow-hidden cursor-pointer"
          >
            {photo ? (
              <img src={photo} alt="Community" className="w-full h-full object-cover" />
            ) : (
              <Globe size={24} className="text-white/40" />
            )}
          </div>
          <span className="text-[11px] text-white/50 mt-1">Ikon Komunitas</span>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </div>

        <input
          type="text"
          placeholder="Nama Komunitas..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[#1E1E1E] border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/40 mb-3"
        />

        <textarea
          placeholder="Deskripsi komunitas..."
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full bg-[#1E1E1E] border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-white/30 outline-none focus:border-white/40 resize-none mb-4"
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-full bg-white/10 text-white text-xs font-semibold">
            Batal
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 py-3 rounded-full bg-white text-black text-xs font-bold disabled:opacity-40"
          >
            Buat
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// MODAL ADD STORY (LEGACY)
// --------------------------------------------------------------------------
function OldLegacyAddStoryModal({
  currentUser,
  onClose,
  onStoryAdded,
}: {
  currentUser: UserProfile;
  onClose: () => void;
  onStoryAdded: (story: UserStory) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [type, setType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [storyError, setStoryError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStoryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoryError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setStoryError('Ukuran file maksimal 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      setType(file.type.startsWith('video') ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!preview || isUploading) return;
    setIsUploading(true);

    const newStory: UserStory = {
      id: 'story_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userPhoto: currentUser.photo,
      mediaUrl: preview,
      mediaType: type,
      caption: caption.trim(),
      createdAt: Date.now(),
      expiresAt: 0, // Permanent until manually deleted
    };

    await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStory),
    }).catch(() => {});

    if (db) {
      addDoc(collection(db, 'stories'), newStory).catch(() => {});
    }

    onStoryAdded(newStory);
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="bg-[#141414]/90 backdrop-blur-[30px] border border-white/[0.1] rounded-[28px] p-5 w-full max-w-sm flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Buat Story Baru</h3>
          <button onClick={onClose} className="p-1 text-white/60 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-64 rounded-2xl bg-[#1E1E1E] border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden cursor-pointer relative group"
        >
          {preview ? (
            type === 'video' ? (
              <video src={preview} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={preview} alt="Story Preview" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="text-center p-4">
              <Camera size={36} className="mx-auto text-white/40 mb-2 group-hover:text-white transition" />
              <p className="text-xs text-white/80 font-semibold">Pilih Foto atau Video dari Galeri</p>
              <p className="text-[10px] text-white/40 mt-1">Maksimal 10MB</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleStoryFile}
          className="hidden"
        />

        <input
          type="text"
          placeholder="Tulis keterangan (opsional)..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full bg-[#1E1E1E] border border-white/10 rounded-full px-4 py-2 text-xs text-white outline-none focus:border-white/30 mt-3"
        />

        {storyError && (
          <p className="text-xs text-red-400 text-center mt-2">{storyError}</p>
        )}

        <button
          onClick={handlePost}
          disabled={!preview || isUploading}
          className="w-full mt-4 py-2.5 rounded-full bg-white text-black font-bold text-xs disabled:opacity-40 hover:bg-white/90 active:scale-95 transition cursor-pointer"
        >
          {isUploading ? 'Mengunggah...' : 'Bagikan ke Story'}
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// STORY VIEWER MODAL (LEGACY)
// --------------------------------------------------------------------------
function OldLegacyStoryViewerModal({
  story,
  currentUser,
  onClose,
  onViewed,
  onDeleteStory,
}: {
  story: UserStory;
  currentUser?: UserProfile | null;
  onClose: () => void;
  onViewed: (id: string) => void;
  onDeleteStory?: (id: string) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isMyStory = currentUser && story.userId === currentUser.id;

  useEffect(() => {
    onViewed(story.id);
  }, [story.id]);

  useEffect(() => {
    if (isPaused) return;
    const duration = 8000;
    const stepTime = 50;
    const increment = (stepTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(prev + increment, 100);
      });
    }, stepTime);

    return () => clearInterval(timer);
  }, [isPaused, story.id]);

  const handleDelete = () => {
    if (onDeleteStory) {
      onDeleteStory(story.id);
    }
  };

  useEffect(() => {
    document.querySelector('.bottom-nav')?.classList.add('hidden');
    return () => {
      document.querySelector('.bottom-nav')?.classList.remove('hidden');
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[10005] bg-black flex flex-col justify-between items-center p-4">
      <div className="w-full max-w-md flex flex-col gap-2 pt-2 z-10">
        {/* Animated Progress Bar */}
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00FF88] rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2.5">
            <Avatar photo={story.userPhoto} name={story.userName} size="sm" />
            <div>
              <p className="text-sm font-semibold text-white leading-none">
                {story.userName} {isMyStory ? '(Anda)' : ''}
              </p>
              <p className="text-[10px] text-white/50 mt-0.5">Story ZE.io</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pause / Play toggle */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
              title={isPaused ? 'Lanjutkan' : 'Jeda'}
            >
              {isPaused ? <Play size={13} className="ml-0.5" /> : <Pause size={13} />}
            </button>

            {/* Manual Delete Button for Own Story */}
            {isMyStory && onDeleteStory && (
              <button
                onClick={handleDelete}
                className="bg-red-500/20 hover:bg-red-500/35 text-red-400 border border-red-500/40 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
                title="Hapus Story Secara Manual"
              >
                <Trash2 size={13} />
                <span>Hapus</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-white/20 active:scale-95 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="w-full max-w-md flex-1 my-3 rounded-[28px] overflow-hidden bg-[#1A1A1A] flex items-center justify-center relative shadow-2xl cursor-pointer select-none"
      >
        {story.mediaType === 'video' ? (
          <video
            src={story.mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={story.mediaUrl}
            alt="Story Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as any).style.display = 'none';
            }}
          />
        )}

        {isPaused && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/80 font-mono pointer-events-none">
            Dijeda
          </div>
        )}

        {progress >= 100 && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProgress(0);
                setIsPaused(false);
              }}
              className="bg-white text-black px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-white/90 active:scale-95 transition shadow-lg"
            >
              <RefreshCw size={14} /> Putar Ulang
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="bg-white/20 text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-white/30 active:scale-95 transition"
            >
              Tutup
            </button>
          </div>
        )}

        {story.caption && (
          <div className="absolute bottom-6 inset-x-4 bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center pointer-events-none">
            <p className="text-sm text-white font-medium">{story.caption}</p>
          </div>
        )}
      </div>

      <div className="w-full max-w-md pb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Balas story..."
          className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/40 outline-none focus:border-white/40"
        />
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-white/20 active:scale-95 transition">
          <Heart size={18} />
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// CALLS PAGE VIEW (CALLS TAB)
// --------------------------------------------------------------------------
function CallsPageView({
  currentUser,
  friends,
  onStartCall,
  onViewProfile,
}: {
  currentUser: UserProfile;
  friends: UserProfile[];
  onStartCall: (friend: UserProfile, type: 'audio' | 'video') => void;
  onViewProfile: (u: UserProfile) => void;
}) {
  return (
    <div className="min-h-screen bg-[#050505] pb-[120px]">
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Panggilan</h2>
        <span className="text-xs text-white/40">Suara &amp; Video HD</span>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2.5">
          Panggil Teman Anda
        </h3>
        {friends.length === 0 ? (
          <div className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-8 text-center shadow-xl">
            <Phone size={32} className="mx-auto text-white/20 mb-2" />
            <p className="text-white/60 text-sm font-semibold">Belum ada kontak</p>
            <p className="text-white/30 text-xs mt-1">Tambahkan teman untuk memulai panggilan video</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {friends.map((f) => (
              <div
                key={f.id}
                className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-3.5 flex items-center justify-between shadow-xl"
              >
                <div onClick={() => onViewProfile(f)} className="flex items-center gap-3 cursor-pointer min-w-0">
                  <Avatar photo={f.photo} name={f.name} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white truncate">{f.name}</p>
                      <UserRoleBadge user={f} size="sm" />
                    </div>
                    <p className="text-xs text-white/40 font-mono truncate">@{f.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartCall(f, 'audio')}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-95 transition cursor-pointer"
                  >
                    <Phone size={16} />
                  </button>
                  <button
                    onClick={() => onStartCall(f, 'video')}
                    className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition cursor-pointer shadow"
                  >
                    <Video size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// COMMUNITIES PAGE VIEW (COMM TAB)
// --------------------------------------------------------------------------
function CommunitiesPageView({
  currentUser,
  communities,
  onOpenCommunity,
  onCreateCommunity,
  onCreateGroup,
}: {
  currentUser: UserProfile;
  communities: CommunityItem[];
  onOpenCommunity: (id: string) => void;
  onCreateCommunity: () => void;
  onCreateGroup: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#050505] pb-[120px]">
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Komunitas &amp; Grup</h2>
        <div className="flex gap-2">
          <button
            onClick={onCreateGroup}
            className="text-xs bg-white/10 text-white px-3 py-1.5 rounded-full border border-white/10 font-semibold"
          >
            + Grup
          </button>
          <button
            onClick={onCreateCommunity}
            className="text-xs bg-white text-black px-3 py-1.5 rounded-full font-bold shadow"
          >
            + Komunitas
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3 max-w-md mx-auto">
        {communities.map((comm) => (
          <div
            key={comm.id}
            onClick={() => onOpenCommunity(comm.id)}
            className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-5 flex flex-col gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] cursor-pointer hover:border-white/20 transition active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar photo={comm.photo} name={comm.name} size="md" />
                <div>
                  <h4 className="text-base font-bold text-white">{comm.name}</h4>
                  <p className="text-xs text-white/50">{comm.members.length || 1} anggota aktif</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCommunity(comm.id);
                }}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 active:scale-95 transition"
              >
                Buka
              </button>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">{comm.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// PROFILE PAGE VIEW (YOU TAB)
// --------------------------------------------------------------------------
function ProfilePageView({
  currentUser,
  friendsCount,
  storiesCount,
  onEditProfile,
  onPhotoUpload,
  onLogout,
  onBack,
}: {
  currentUser: UserProfile;
  friendsCount: number;
  storiesCount: number;
  onEditProfile: () => void;
  onPhotoUpload: () => void;
  onLogout: () => void;
  onBack?: () => void;
}) {
  return (
    <YouPage
      currentUser={currentUser}
      friendsCount={friendsCount}
      storiesCount={storiesCount}
      onEditProfile={onEditProfile}
      onPhotoUpload={onPhotoUpload}
      onLogout={onLogout}
      onBack={onBack}
    />
  );
}


// --------------------------------------------------------------------------
// NOTIFICATIONS VIEW
// --------------------------------------------------------------------------
function NotificationsView({
  currentUser,
  friendRequests,
  onBack,
  onAccept,
  onReject,
  onUnreadChange,
}: {
  currentUser: UserProfile;
  friendRequests: FriendRequest[];
  onBack: () => void;
  onAccept: (fromId: string) => void;
  onReject: (fromId: string) => void;
  onUnreadChange?: (count: number) => void;
}) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'global' | 'requests'>('all');
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pushGranted, setPushGranted] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const onUnreadChangeRef = useRef(onUnreadChange);
  useEffect(() => {
    onUnreadChangeRef.current = onUnreadChange;
  }, [onUnreadChange]);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const computed = notifications.filter((item) => !item.read).length;
    onUnreadChangeRef.current?.(computed);
  }, [notifications]);

  const fetchNotifs = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}`);
      const data = await res.json();
      if (data && data.success) {
        const list = data.notifications || [];
        hasLoadedRef.current = true;
        setNotifications(list);
        if (typeof data.unreadCount === 'number') {
          onUnreadChangeRef.current?.(data.unreadCount);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifs();
    const onRecv = () => fetchNotifs();
    window.addEventListener('ze-notification-received', onRecv);
    window.addEventListener('ze-notifications-updated', onRecv);
    return () => {
      window.removeEventListener('ze-notification-received', onRecv);
      window.removeEventListener('ze-notifications-updated', onRecv);
    };
  }, [currentUser?.id]);

  const handleOpenDetail = async (notif: any) => {
    const targetNotifId = notif.notificationId || notif.id;
    const updatedNotif = { ...notif, read: true };
    setSelectedNotif(updatedNotif);

    if (!notif.read && currentUser?.id) {
      setNotifications((prev) =>
        prev.map((n) => ((n.notificationId || n.id) === targetNotifId ? { ...n, read: true } : n))
      );
      try {
        const res = await fetch('/api/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, notificationId: targetNotifId })
        });
        const data = await res.json();
        if (data && data.success && typeof data.unreadCount === 'number') {
          onUnreadChangeRef.current?.(data.unreadCount);
        }
      } catch {}
    }
  };

  const handleDeleteNotification = async (notif: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser?.id) return;
    const targetNotifId = notif.notificationId || notif.id;
    setDeletingId(targetNotifId);

    setNotifications((prev) => prev.filter((n) => (n.notificationId || n.id) !== targetNotifId));
    if (selectedNotif && (selectedNotif.notificationId || selectedNotif.id) === targetNotifId) {
      setSelectedNotif(null);
    }

    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, notificationId: targetNotifId })
      });
      const data = await res.json();
      if (data && data.success && typeof data.unreadCount === 'number') {
        onUnreadChangeRef.current?.(data.unreadCount);
      }
    } catch {} finally {
      setDeletingId(null);
    }
  };

  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setPushGranted(true);
        new Notification('ZE.io Notifikasi Aktif', {
          body: 'Anda akan menerima pengumuman terbaru langsung di perangkat ini.',
          icon: '/assets/ze_logo.png'
        });
      }
    }
  };

  const copyKey = (key: string) => {
    try {
      navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'global') return n.senderId === 'ZE-OWNER';
    return true;
  });

  const unreadListCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-transparent pb-[120px]">
      <div className="sticky top-0 z-40 glass-panel px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 text-white/80 hover:text-white cursor-pointer active:scale-95 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bell size={18} /> Notifikasi &amp; Pengumuman
            </h2>
            <p className="text-[10px] text-zinc-400">
              {unreadListCount > 0 ? `${unreadListCount} belum dibaca` : 'Semua notifikasi sudah dibaca'}
            </p>
          </div>
        </div>
        {!pushGranted && typeof window !== 'undefined' && 'Notification' in window && (
          <button
            onClick={requestPushPermission}
            className="text-[10px] font-bold bg-white text-black px-3 py-1 rounded-full shadow hover:bg-zinc-200 active:scale-95 transition cursor-pointer"
          >
            Aktifkan Push
          </button>
        )}
      </div>

      {/* FILTER TABS */}
      <div className="flex border-b border-white/10 bg-black/40 px-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2.5 text-xs font-semibold transition border-b-2 cursor-pointer ${
            activeTab === 'all' ? 'border-white text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Semua ({notifications.length + friendRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={`flex-1 py-2.5 text-xs font-semibold transition border-b-2 cursor-pointer ${
            activeTab === 'global' ? 'border-white text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Pengumuman ({notifications.filter((n) => n.senderId === 'ZE-OWNER').length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 text-xs font-semibold transition border-b-2 cursor-pointer ${
            activeTab === 'requests' ? 'border-white text-white font-bold' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Pertemanan ({friendRequests.length})
        </button>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* FRIEND REQUESTS SECTION */}
        {(activeTab === 'all' || activeTab === 'requests') && friendRequests.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-white/50 font-semibold mb-2">
              Permintaan Pertemanan ({friendRequests.length})
            </h3>
            {friendRequests.map((req) => (
              <div
                key={req.id}
                className="glass-panel rounded-[24px] p-4 flex items-center justify-between gap-3 shadow-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar photo={req.fromPhoto} name={req.fromName} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{req.fromName || req.from}</p>
                    <p className="text-xs text-white/40 truncate font-mono">
                      @{req.fromUsername || req.from} ingin berteman
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onAccept(req.from)}
                    className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-white/90 active:scale-95 transition cursor-pointer shadow"
                  >
                    Terima
                  </button>
                  <button
                    onClick={() => onReject(req.from)}
                    className="glass-input text-white/70 hover:text-white px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition cursor-pointer"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NOTIFICATIONS LIST (GLOBAL & PERSONAL — TETAP TERSIMPAN HINGGA DIHAPUS MANUAL) */}
        {activeTab !== 'requests' && (
          <div className="space-y-2.5">
            {filteredNotifs.length === 0 && friendRequests.length === 0 ? (
              <div className="glass-panel rounded-[28px] p-8 text-center my-8 shadow-xl">
                <Bell size={40} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/60 text-sm font-semibold">Belum ada notifikasi</p>
                <p className="text-white/30 text-xs mt-1">
                  Pengumuman resmi dari Owner dan pengiriman Key yang disetujui akan muncul di sini.
                </p>
              </div>
            ) : (
              filteredNotifs.map((n, idx) => {
                const isGlobal = n.senderId === 'ZE-OWNER';
                const notifKeyId = n.notificationId || n.id;
                return (
                  <div
                    key={notifKeyId ? `${notifKeyId}_${idx}` : `notif_${idx}`}
                    onClick={() => handleOpenDetail(n)}
                    className={`p-4 rounded-[24px] border cursor-pointer transition active:scale-[0.99] shadow-lg ${
                      !n.read
                        ? 'bg-white/12 border-white/35 shadow-[0_0_20px_rgba(255,255,255,0.08)]'
                        : 'glass-panel border-white/10 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isGlobal ? (
                          <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-[9px]">
                            ★
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-[9px]">
                            ✓
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">
                          {n.category || (isGlobal ? 'PENGUMUMAN' : 'SISTEM')}
                        </span>
                        {!n.read ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            BARU
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500">Dibaca</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                        <button
                          type="button"
                          disabled={deletingId === notifKeyId}
                          onClick={(e) => handleDeleteNotification(n, e)}
                          title="Hapus notifikasi ini secara manual"
                          className="w-7 h-7 rounded-full bg-red-500/15 hover:bg-red-500/30 border border-red-500/25 text-red-300 flex items-center justify-center transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-2 leading-tight">{n.title}</h4>
                    <p className="text-xs text-zinc-300 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>

                    {n.keyIssued && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-black/50 border border-emerald-500/30 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-300 truncate">{n.keyIssued}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyKey(n.keyIssued);
                          }}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-black hover:bg-zinc-200 transition shrink-0 cursor-pointer"
                        >
                          {copiedKey === n.keyIssued ? 'Tersalin' : 'Salin Key'}
                        </button>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Dari: {n.senderName || 'ZE.io OWNER'}</span>
                      <span className="text-zinc-300 hover:text-white font-semibold">Buka Detail →</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* DETAIL NOTIFICATION MODAL */}
      {selectedNotif && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel border border-white/20 rounded-[28px] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-black bg-white px-2.5 py-0.5 rounded-full">
                {selectedNotif.category || 'PENGUMUMAN'}
              </span>
              <button
                onClick={() => setSelectedNotif(null)}
                className="w-8 h-8 rounded-full glass-input flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-white leading-tight">{selectedNotif.title}</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-1">
                {selectedNotif.senderName || 'ZE.io OWNER'} • {new Date(selectedNotif.createdAt).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {selectedNotif.message}
            </div>

            {selectedNotif.keyIssued && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-center">
                <p className="text-[10px] text-emerald-300 uppercase tracking-widest font-mono font-bold">KODE KEY RESMI ANDA</p>
                <p className="text-base sm:text-lg font-mono font-bold text-white tracking-wider break-all">{selectedNotif.keyIssued}</p>
                <button
                  onClick={() => copyKey(selectedNotif.keyIssued)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-black hover:bg-zinc-200 transition inline-flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Copy size={13} /> {copiedKey === selectedNotif.keyIssued ? 'Tersalin!' : 'Salin Key'}
                </button>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleDeleteNotification(selectedNotif)}
                className="px-4 py-2.5 rounded-full bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-bold active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} /> Hapus
              </button>
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="flex-1 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 active:scale-95 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// SEARCH USERS VIEW (GLOBAL FIRESTORE SEARCH BY ID & NAME)
// --------------------------------------------------------------------------
function SearchUsersView({
  currentUser,
  allUsers,
  friends,
  onBack,
  onAddFriend,
  onOpenChat,
  onViewProfile,
}: {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  friends: UserProfile[];
  onBack: () => void;
  onAddFriend: (target: UserProfile) => void;
  onOpenChat: (target: UserProfile) => void;
  onViewProfile: (target: UserProfile) => void;
}) {
  const [queryText, setQueryText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [firestoreResults, setFirestoreResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const copyToClipboard = (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch (e) {}
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Realtime Firestore search whenever user enters queryText
  useEffect(() => {
    const q = queryText.trim();
    if (!q) {
      setFirestoreResults([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const resultsMap = new Map<string, UserProfile>();
        const cleanQ = q.toUpperCase();
        const cleanLower = q.toLowerCase().replace(/^ze-/, '').replace(/^@/, '');

        // 1. Query Server API directly (Instan & Sinkron Lintas Semua HP)
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.users)) {
              data.users.forEach((raw: any) => {
                const u = normalizeUser(raw);
                if (u.id && u.id.toUpperCase() !== currentUser.id.toUpperCase()) {
                  resultsMap.set(u.id, u);
                }
              });
            }
          }
        } catch (e) {}

        // 2. Fetch all users from server in case of partial query
        try {
          const allRes = await fetch('/api/users');
          if (allRes.ok) {
            const allData = await allRes.json();
            if (Array.isArray(allData.users)) {
              allData.users.forEach((raw: any) => {
                const u = normalizeUser(raw);
                if (u.id && u.id.toUpperCase() !== currentUser.id.toUpperCase()) {
                  const uId = String(u.id || '').toUpperCase();
                  const uCleanId = uId.replace(/^ZE-/, '');
                  const uName = String(u.name || '').toLowerCase();
                  const uUname = String(u.username || '').toLowerCase().replace(/^@/, '');
                  if (
                    uId.includes(cleanQ) ||
                    uCleanId.includes(cleanLower.toUpperCase()) ||
                    uName.includes(cleanLower) ||
                    uUname.includes(cleanLower)
                  ) {
                    resultsMap.set(u.id, u);
                  }
                }
              });
            }
          }
        } catch (e) {}

        // 3. Fallback matching in allUsers state
        allUsers.forEach((u) => {
          if (u.id.toUpperCase() !== currentUser.id.toUpperCase()) {
            const uId = u.id.toUpperCase();
            const uCleanId = uId.replace(/^ZE-/, '');
            const uName = (u.name || '').toLowerCase();
            const uUname = (u.username || '').toLowerCase().replace(/^@/, '');
            if (
              uId.includes(cleanQ) ||
              uCleanId.includes(cleanLower.toUpperCase()) ||
              uName.includes(cleanLower) ||
              uUname.includes(cleanLower)
            ) {
              if (!resultsMap.has(u.id)) {
                resultsMap.set(u.id, u);
              }
            }
          }
        });

        if (active) {
          setFirestoreResults(Array.from(resultsMap.values()));
          setIsSearching(false);
        }
      } catch (err) {
        if (active) setIsSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [queryText, currentUser.id, allUsers]);

  const displayList = queryText.trim()
    ? firestoreResults
    : allUsers.filter((u) => u.id !== currentUser.id);

  return (
    <div className="min-h-screen bg-transparent pb-[120px]">
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1 text-white/80 hover:text-white cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-2.5 text-white/40" />
          <input
            type="text"
            placeholder="Cari ID (ZE-XXXXXX), @username, atau nama..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className="w-full bg-[#1E1E1E] border border-white/[0.1] rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/40"
            autoFocus
          />
          {isSearching && (
            <Loader2 size={16} className="absolute right-3.5 top-2.5 text-white/50 animate-spin" />
          )}
        </div>
      </div>

      <div className="p-4 space-y-2.5 max-w-md mx-auto">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-white/40 font-medium">
            {isSearching
              ? 'Mencari di Firestore Global...'
              : `Ditemukan ${displayList.length} pengguna di ZE.io Global`}
          </p>
          <span className="text-[10px] text-green-400 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Global Firestore
          </span>
        </div>

        {queryText.trim() && !isSearching && displayList.length === 0 && (
          <div className="bg-[#1E1E1E] border border-white/10 rounded-[20px] p-6 text-center my-6">
            <p className="text-xs text-red-300 font-semibold mb-1">
              User tidak ditemukan, pastikan ID benar (contoh ZE-XM21NV)
            </p>
            <p className="text-[11px] text-white/40">
              Periksa kembali format ZE ID atau coba cari nama akun tersebut.
            </p>
          </div>
        )}

        {displayList.map((u) => {
          const isAlreadyFriend = friends.some((f) => f.id === u.id);
          return (
            <div
              key={u.id}
              className="bg-[#141414]/80 backdrop-blur-[20px] border border-white/[0.08] rounded-[28px] p-3.5 flex items-center justify-between gap-3 shadow-xl"
            >
              <div onClick={() => onViewProfile(u)} className="flex items-center gap-3 min-w-0 cursor-pointer">
                <Avatar photo={u.photo} name={u.name} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                    <UserRoleBadge user={u} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/50 font-mono">@{u.username}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(u.id);
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white/80 font-mono text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === u.id ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                      {u.id}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                {isAlreadyFriend ? (
                  <button
                    onClick={() => onOpenChat(u)}
                    className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-white/90 active:scale-95 transition flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <MessageCircle size={14} /> Chat
                  </button>
                ) : (
                  <button
                    onClick={() => onAddFriend(u)}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus size={14} /> Tambah
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// SETTINGS PAGE - 100% WHATSAPP STYLE WITH ALL FUNCTIONING SUBPAGES
// --------------------------------------------------------------------------
const SettingsPage = ({
  onBack,
  currentUser,
  friends = [],
  initialSetting = null,
  onConsumeInitialSetting,
  onUserUpdate,
  onDeleteAccount
}: {
  onBack?: () => void;
  currentUser?: UserProfile | null;
  friends?: UserProfile[];
  initialSetting?: string | null;
  onConsumeInitialSetting?: () => void;
  onUserUpdate?: (updated: UserProfile) => void;
  onDeleteAccount?: () => void;
}) => {
  const [activeSetting, setActiveSetting] = useState<string | null>(initialSetting);

  useEffect(() => {
    if (initialSetting) {
      setActiveSetting(initialSetting);
      onConsumeInitialSetting?.();
    }
  }, [initialSetting]);

  const [currentLang, setCurrentLang] = useState<string>(() => localStorage.getItem('ze_lang') || 'ID');
  const [fpsConfig] = useFpsConfig();

  const openSetting = (type: string) => setActiveSetting(type);

  if (activeSetting === 'home-ui') {
    return (
      <HomeAppearanceSettingPage
        onBack={() => setActiveSetting(null)}
      />
    );
  }
  if (activeSetting === 'account') {
    return (
      <AccountSettingPage
        currentUser={currentUser}
        onBack={() => setActiveSetting(null)}
        onUserUpdate={(u) => onUserUpdate && onUserUpdate(u)}
        onDeleteAccount={() => onDeleteAccount && onDeleteAccount()}
      />
    );
  }
  if (activeSetting === 'privacy') {
    return (
      <PrivacySettingPage
        friends={friends}
        onBack={() => setActiveSetting(null)}
      />
    );
  }
  if (activeSetting === 'avatar') {
    return (
      <AvatarSettingPage
        currentUser={currentUser}
        onBack={() => setActiveSetting(null)}
        onUserUpdate={(u) => onUserUpdate && onUserUpdate(u)}
      />
    );
  }
  if (activeSetting === 'tema' || activeSetting === 'lists') {
    return (
      <ThemeGlobalSettingPage
        onBack={() => setActiveSetting(null)}
      />
    );
  }
  if (activeSetting === 'chats') {
    return (
      <ChatsSettingPage
        onBack={() => setActiveSetting(null)}
      />
    );
  }
  if (activeSetting === 'notifications') {
    return (
      <NotificationsSettingPage
        onBack={() => setActiveSetting(null)}
      />
    );
  }
  if (activeSetting === 'storage') {
    return (
      <StorageSettingPage
        onBack={() => setActiveSetting(null)}
      />
    );
  }
  if (activeSetting === 'language') {
    return (
      <LanguageSettingPage
        currentLang={currentLang}
        onSelectLang={(l) => setCurrentLang(l)}
        onBack={() => setActiveSetting(null)}
      />
    );
  }
  if (activeSetting === 'help') {
    return (
      <HelpSettingPage
        onBack={() => setActiveSetting(null)}
      />
    );
  }
  if (activeSetting === 'invite') {
    return (
      <InviteFriendSettingPage
        currentUser={currentUser}
        onBack={() => setActiveSetting(null)}
      />
    );
  }

  return (
    <div className="bg-transparent min-h-screen pb-28">
      {/* HEADER */}
      <div className="p-5 pt-10 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back to home"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-white/80 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <h1 className="text-white text-[28px] font-bold">Settings</h1>
      </div>

      {/* PROFILE CARD KAYA WA */}
      <div
        onClick={() => openSetting('avatar')}
        className="mx-3 bg-[#1E1E1E] rounded-[20px] p-4 flex items-center gap-4 border border-white/5 cursor-pointer hover:bg-[#252525] transition"
      >
        <img
          src={currentUser?.photo || "https://i.pravatar.cc/100"}
          alt="Profile"
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-[18px] truncate">{currentUser?.name || 'ZE User'}</p>
          <p className="text-white/50 text-[13px] mt-0.5 truncate">{currentUser?.bio || 'Hey there! I am using ZE.io'}</p>
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            openSetting('invite');
          }}
          className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center shrink-0 hover:bg-white/20 transition"
          title="QR Code &amp; Invite"
        >
          <QrCode className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* MENU LIST KAYA WA */}
      <div className="mx-3 mt-4 bg-[#1E1E1E] rounded-[20px] overflow-hidden border border-white/5">
        <SettingItem onClick={() => openSetting('home-ui')} icon={<LayoutGrid className="w-5 h-5" />} title="UI Tampilan Beranda" desc="Tampilan & Tata Letak, Tema, Kotak & Video Atas" />
        <Divider />
        <SettingItem onClick={() => openSetting('account')} icon={<Key className="w-5 h-5" />} title="Account" desc="Security, change number" />
        <Divider />
        <SettingItem onClick={() => openSetting('privacy')} icon={<Lock className="w-5 h-5" />} title="Privacy" desc="Block contacts, disappearing" />
        <Divider />
        <SettingItem onClick={() => openSetting('avatar')} icon={<Smile className="w-5 h-5" />} title="Avatar" desc="Create, edit, profile photo" />
        <Divider />
        <SettingItem onClick={() => openSetting('lists')} icon={<List className="w-5 h-5" />} title="Tema Aplikasi" desc="Manage people and groups" />
        <Divider />
        <SettingItem onClick={() => openSetting('chats')} icon={<MessageCircle className="w-5 h-5" />} title="Chats" desc="Theme, wallpapers, history" />
        <Divider />
        <SettingItem onClick={() => openSetting('notifications')} icon={<Bell className="w-5 h-5" />} title="Notifications" desc="Message, group & call tones" />
        <Divider />
        <SettingItem onClick={() => openSetting('storage')} icon={<Database className="w-5 h-5" />} title="Storage and data" desc="Network usage, auto-download" />
      </div>

      <div className="mx-3 mt-3 bg-[#1E1E1E] rounded-[20px] overflow-hidden border border-white/5">
        <SettingItem onClick={() => openSetting('language')} icon={<Globe className="w-5 h-5" />} title="App language" desc="English (device's language)" />
        <Divider />
        <SettingItem onClick={() => openSetting('help')} icon={<HelpCircle className="w-5 h-5" />} title="Help" desc="Help center, contact us" />
        <Divider />
        <SettingItem
          onClick={() => openSetting('invite')}
          icon={<Zap className="w-5 h-5" />}
          title="Pengaturan FPS"
          desc={fpsConfig.enabled ? `FPS Lock Aktif • ${fpsConfig.targetFps} FPS` : 'FPS Lock Nonaktif (60 / 90 / 120 FPS)'}
        />
      </div>

      <div className="mx-3 mt-6 text-center pb-10 flex flex-col items-center">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 mb-2 bg-black flex items-center justify-center p-0.5">
          <img src="/assets/ze_logo.png" alt="ZE.io Logo" className="w-full h-full object-cover rounded-full" />
        </div>
        <p className="text-white/30 text-[12px] font-semibold">ZE.io v2.4.1</p>
        <p className="text-white/20 text-[11px] mt-0.5">Next-Gen Realtime Social &amp; AI</p>
      </div>
    </div>
  );
};

const SettingItem = ({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className="flex items-center gap-4 p-4 active:bg-white/5 cursor-pointer transition"
  >
    <div className="text-white/70">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-white text-[16px] font-medium">{title}</p>
      {desc && <p className="text-white/40 text-[13px] mt-0.5 truncate">{desc}</p>}
    </div>
  </div>
);

const Divider = () => <div className="h-[1px] bg-white/5 ml-14" />;

