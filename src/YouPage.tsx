import React, { useState, useRef, useEffect } from 'react';
import {
  Grid,
  Heart,
  Eye,
  Copy,
  Check,
  LogOut,
  Camera,
  Share2,
  Plus,
  X,
  Image as ImageIcon,
  Trash2,
  ArrowLeft,
  Video,
  Play,
  Loader2,
  Globe,
  Users,
  Lock
} from 'lucide-react';

import { useUserStore } from './contexts/userStore.ts';
import { UserRoleBadge } from './components/UserRoleBadge.tsx';

export interface TikTokPostItem {
  id: string;
  uid?: string;
  userId?: string;
  url?: string;
  thumbnail: string;
  type?: 'video' | 'photo';
  privacy?: 'public' | 'friends' | 'private';
  views: string | number;
  likes?: number;
  caption?: string;
  createdAt?: string;
}

export interface YouPageProps {
  currentUser?: any;
  friendsCount?: number;
  storiesCount?: number;
  onEditProfile: () => void;
  onPhotoUpload: () => void;
  onLogout: () => void;
  onBack?: () => void;
}

export function isVideoPostItem(post?: { type?: string; url?: string; thumbnail?: string } | null): boolean {
  if (!post) return false;
  if (post.type === 'video') return true;
  const src = String(post.url || post.thumbnail || '');
  return src.startsWith('data:video/') || /\.(mp4|webm|mov|ogv)(\?|$)/i.test(src);
}

export default function YouPage({
  currentUser: propCurrentUser,
  friendsCount = 0,
  onEditProfile,
  onPhotoUpload,
  onLogout,
  onBack
}: YouPageProps) {
  const { user, setUser } = useUserStore();
  const [serverVipPatch, setServerVipPatch] = useState<Record<string, any>>({});

  // Merge strictly when serverVipPatch matches current active UID
  const rawUid = propCurrentUser?.id || user?.id || '';
  const uIdUpper = String(rawUid || '').trim().toUpperCase();

  const effectiveUser = {
    ...user,
    ...(propCurrentUser || {}),
    ...(serverVipPatch._uid === uIdUpper ? serverVipPatch : {})
  };
  const userName =
    effectiveUser.name || user.name || effectiveUser.username || user.username || 'User';

  // Strictly per-UID avatar resolution (no global ze_avatar fallback)
  const avatarUrl =
    propCurrentUser?.photo ||
    propCurrentUser?.avatar ||
    (user?.id && String(user.id).toUpperCase() === uIdUpper ? user.photo || user.avatar : '') ||
    (uIdUpper ? localStorage.getItem(`ze_avatar_${uIdUpper}`) : '') ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(userName)}`;

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');

  // Postingan per-akun (Terkunci ke UID pemilik)
  const [posts, setPosts] = useState<TikTokPostItem[]>([]);
  const [likedPosts, setLikedPosts] = useState<TikTokPostItem[]>([]);

  // Modal create post & post detail viewer
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postMedia, setPostMedia] = useState<string>('');
  const [postMediaType, setPostMediaType] = useState<'video' | 'photo'>('photo');
  const [postPrivacy, setPostPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [postCaption, setPostCaption] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isUploadingPost, setIsUploadingPost] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<TikTokPostItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify App.tsx whenever viewing a post or opening upload modal so Bottom Nav is hidden
  useEffect(() => {
    const isOpen = Boolean(selectedPost || showCreateModal);
    window.dispatchEvent(new CustomEvent('ze-post-modal-toggle', { detail: { open: isOpen } }));
    return () => {
      window.dispatchEvent(new CustomEvent('ze-post-modal-toggle', { detail: { open: false } }));
    };
  }, [selectedPost, showCreateModal]);

  // Authoritative server role, VIP level & saved avatar check from database per UID
  useEffect(() => {
    setServerVipPatch({});
    if (!uIdUpper) return;
    let cancelled = false;

    const syncRoleFromDb = () => {
      fetch(`/api/auth/role/${encodeURIComponent(uIdUpper)}`)
        .then((r) => r.json())
        .then((roleData) => {
          if (cancelled || !roleData || !roleData.success) return;
          const patch = {
            _uid: uIdUpper,
            role: roleData.role,
            isOwner: Boolean(roleData.isOwner),
            isAdmin: Boolean(roleData.isAdmin),
            isVip: Boolean(roleData.isVip),
            vip: Boolean(roleData.isVip),
            vipLevel: roleData.isVip ? roleData.vipLevel || 'basic' : undefined,
            isVipExclusive: Boolean(
              roleData.isVip && (roleData.isVipExclusive || roleData.vipLevel === 'exclusive')
            ),
            vipExpiresAt: roleData.vipExpiresAt || 0
          };
          setServerVipPatch(patch);
          const { _uid, ...cleanPatch } = patch;
          setUser(cleanPatch);
        })
        .catch(() => {});
    };

    syncRoleFromDb();
    window.addEventListener('ze-vip-purchased', syncRoleFromDb);
    return () => {
      cancelled = true;
      window.removeEventListener('ze-vip-purchased', syncRoleFromDb);
    };
  }, [uIdUpper]);

  // SINKRONISASI VIDEO & POSTINGAN KHUSUS UID AKUN AKTIF (0 kebocoran antar akun)
  useEffect(() => {
    // 1. Bersihkan state akun sebelumnya seketika saat berganti UID
    setPosts([]);
    setLikedPosts([]);
    setSelectedPost(null);
    setShowCreateModal(false);

    if (!uIdUpper) {
      return;
    }

    let cancelled = false;

    // 2. Muat cache lokal yang terikat ketat ke UID ini
    try {
      const savedPosts = localStorage.getItem(`ze_user_posts_${uIdUpper}`);
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        if (Array.isArray(parsed)) {
          setPosts(
            parsed.filter(
              (p: any) => !p.uid || String(p.uid).toUpperCase() === uIdUpper
            )
          );
        }
      }
      const savedLikes = localStorage.getItem(`ze_user_likes_${uIdUpper}`);
      if (savedLikes) {
        const parsedLikes = JSON.parse(savedLikes);
        if (Array.isArray(parsedLikes)) {
          setLikedPosts(parsedLikes);
        }
      }
    } catch {
      setPosts([]);
    }

    // 3. Muat daftar video/postingan asli milik UID ini dari backend database
    const fetchAccountPosts = () => {
      fetch(
        `/api/posts?userId=${encodeURIComponent(uIdUpper)}&viewerId=${encodeURIComponent(uIdUpper)}`
      )
        .then((r) => r.json())
        .then((data) => {
          if (cancelled || !data?.success || !Array.isArray(data.posts)) return;
          const strictOwnedPosts: TikTokPostItem[] = data.posts
            .filter(
              (p: any) =>
                String(p.uid || p.userId || '').trim().toUpperCase() === uIdUpper
            )
            .map((p: any) => {
              const mediaSrc = p.url || p.thumbnail || '';
              const vid = isVideoPostItem({ type: p.type, url: mediaSrc });
              return {
                id: p.id,
                uid: uIdUpper,
                userId: uIdUpper,
                url: mediaSrc,
                thumbnail: mediaSrc,
                type: vid ? 'video' : 'photo',
                privacy: p.privacy || 'public',
                views: p.views ?? 0,
                likes: p.likes ?? 0,
                caption: p.caption || '',
                createdAt: p.createdAt
                  ? new Date(p.createdAt).toLocaleDateString('id-ID')
                  : ''
              };
            });
          setPosts(strictOwnedPosts);
          try {
            localStorage.setItem(`ze_user_posts_${uIdUpper}`, JSON.stringify(strictOwnedPosts));
          } catch {}
        })
        .catch(() => {});
    };

    fetchAccountPosts();
    return () => {
      cancelled = true;
    };
  }, [uIdUpper]);

  const copyId = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const idToCopy = uIdUpper || effectiveUser?.id || user?.id || '';
    if (!idToCopy) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(idToCopy).catch(() => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = idToCopy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      setUploadError('Format file harus berupa Video (MP4/WebM/MOV) atau Foto (JPG/PNG/WebP).');
      return;
    }
    if (isVideo && file.size > 48 * 1024 * 1024) {
      setUploadError('Ukuran video maksimal 48MB agar unggahan lancar.');
      return;
    }

    setPostMediaType(isVideo ? 'video' : 'photo');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPostMedia(reader.result);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postMedia) {
      setUploadError('Silakan pilih video atau foto terlebih dahulu.');
      return;
    }
    if (!uIdUpper || isUploadingPost) return;

    setIsUploadingPost(true);
    setUploadError('');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: uIdUpper,
          userId: uIdUpper,
          username: effectiveUser?.username || user?.username || '',
          userPhoto: avatarUrl,
          userName,
          url: postMedia,
          thumbnail: postMedia,
          type: postMediaType,
          privacy: postPrivacy,
          caption: postCaption.trim() || (postMediaType === 'video' ? 'Video baru' : 'Postingan baru'),
          views: 0,
          likes: 0,
          createdAt: Date.now()
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.post) {
        setUploadError(data?.message || 'Gagal mengunggah video/foto ke server.');
        setIsUploadingPost(false);
        return;
      }

      const srv = data.post;
      const savedItem: TikTokPostItem = {
        id: srv.id,
        uid: uIdUpper,
        userId: uIdUpper,
        url: srv.url || srv.thumbnail || '',
        thumbnail: srv.thumbnail || srv.url || '',
        type: srv.type === 'video' ? 'video' : 'photo',
        privacy: srv.privacy || postPrivacy,
        views: srv.views ?? 0,
        likes: srv.likes ?? 0,
        caption: srv.caption || '',
        createdAt: srv.createdAt
          ? new Date(srv.createdAt).toLocaleDateString('id-ID')
          : new Date().toLocaleDateString('id-ID')
      };

      setPosts((prev) => {
        const updated = [savedItem, ...prev.filter((p) => p.id !== savedItem.id)];
        try {
          localStorage.setItem(`ze_user_posts_${uIdUpper}`, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setPostMedia('');
      setPostCaption('');
      setPostPrivacy('public');
      setShowCreateModal(false);
    } catch {
      setUploadError('Gagal terhubung ke server saat menyimpan postingan.');
    } finally {
      setIsUploadingPost(false);
    }
  };

  const handleDeletePost = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!uIdUpper) return;
    const updated = posts.filter((p) => p.id !== id);
    setPosts(updated);
    try {
      localStorage.setItem(`ze_user_posts_${uIdUpper}`, JSON.stringify(updated));
    } catch {}
    fetch(
      `/api/posts/${encodeURIComponent(id)}?userId=${encodeURIComponent(uIdUpper)}`,
      { method: 'DELETE' }
    ).catch(() => {});
    setSelectedPost(null);
  };

  const handleToggleLike = (post: TikTokPostItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!uIdUpper) return;
    const isLiked = likedPosts.some((p) => p.id === post.id);
    const updatedLikes = isLiked
      ? likedPosts.filter((p) => p.id !== post.id)
      : [post, ...likedPosts];
    setLikedPosts(updatedLikes);
    try {
      localStorage.setItem(`ze_user_likes_${uIdUpper}`, JSON.stringify(updatedLikes));
    } catch {}
  };

  const currentDisplayPosts = activeTab === 'posts' ? posts : likedPosts;

  return (
    <div className="min-h-[100dvh] w-full bg-transparent text-white pb-36">
      {/* Full-Screen Top Bar with Back Button, Username & Logout */}
      <div className="sticky top-0 z-40 bg-white/[0.06] backdrop-blur-[40px] backdrop-saturate-[180%] border-b border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.4)] px-4 py-3 flex items-center justify-between gap-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            title="Kembali"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-black shrink-0 shadow-sm flex items-center justify-center p-0.5">
            <img src="/assets/ze_logo.png" alt="ZE.io Logo" className="w-full h-full object-cover rounded-full" />
          </div>
        )}
        <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-[200px] text-center min-w-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {effectiveUser?.username ? `@${effectiveUser.username}` : 'Profil'}
        </h2>
        <button
          type="button"
          onClick={onLogout}
          title="Keluar"
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-lg mx-auto pt-6 px-4">
        {/* TikTok Style Header */}
        <div className="flex flex-col items-center text-center">
          {/* Centered 110px Avatar with White Border */}
          <div
            onClick={onPhotoUpload}
            className="relative cursor-pointer group active:scale-95 transition"
            title="Klik untuk ganti foto profil"
          >
            <img
              src={avatarUrl}
              alt={userName}
              className="w-[110px] h-[110px] rounded-full object-cover border-2 border-white shadow-2xl bg-zinc-900"
            />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center text-white text-sm shadow">
              <Plus className="w-4 h-4" />
            </div>
          </div>

          {/* Name & Role Badges (OWNER / ADMIN / VIP BASIC / VIP EKSKLUSIF) */}
          <div className="flex items-center justify-center gap-1.5 mt-3.5 flex-wrap">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {userName}
            </h1>
            <UserRoleBadge user={{ ...user, ...effectiveUser }} size="md" />
          </div>
          <p className="text-xs text-white/50 font-medium mt-0.5">
            @{effectiveUser?.username || user?.username || 'user'}
          </p>

          {/* ZE ID Badge with Copy */}
          {uIdUpper && (
            <div
              onClick={copyId}
              className="mt-2.5 bg-white/10 hover:bg-white/15 border border-white/15 px-3.5 py-1 rounded-full flex items-center gap-2 cursor-pointer transition active:scale-95 shadow-sm"
            >
              <span className="text-[11px] font-mono font-bold text-white tracking-wider">
                {uIdUpper}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-white/70" />
              )}
            </div>
          )}

          {/* Centered Bio */}
          <p className="text-xs text-white/80 max-w-xs mt-3 leading-relaxed text-center font-normal px-2">
            {effectiveUser?.bio || user?.bio || 'Hey there! I am using ZE.io 🚀'}
          </p>

          {/* Centered Stats Row: Teman | Pengikut | Postingan */}
          {(() => {
            const isOwnerAccount =
              effectiveUser?.isOwner === true ||
              effectiveUser?.role === 'owner' ||
              effectiveUser?.username?.toLowerCase() === 'ze.io' ||
              uIdUpper === 'ZE-OWNER';

            const displayFollowers = isOwnerAccount
              ? '989M'
              : effectiveUser?.followers || user?.followers || 0;

            return (
              <div className="flex items-center justify-center gap-8 w-full mt-5 py-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{friendsCount || 0}</p>
                  <p className="text-[11px] text-white/50">Teman</p>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{displayFollowers}</p>
                  <p className="text-[11px] text-white/50">Pengikut</p>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{posts.length}</p>
                  <p className="text-[11px] text-white/50">Video / Post</p>
                </div>
              </div>
            );
          })()}

          {/* 2 Full-Width Action Buttons: Edit Profil & Salin ID */}
          <div className="flex items-center gap-3 w-full mt-5 relative z-[20]">
            <div className="flex-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProfile();
                }}
                className="w-full cursor-pointer bg-white text-black px-6 py-3 rounded-full font-bold active:scale-95 transition-all text-center text-xs shadow-md"
              >
                Edit Profil
              </button>
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={copyId}
                className="w-full cursor-pointer py-3 rounded-full bg-[#222222] hover:bg-[#2a2a2a] text-white font-semibold text-xs border border-white/10 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-md"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ID Tersalin</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-white/70" />
                    <span>Salin ID</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* POSTINGAN VIDEO & FOTO PER-UID */}
        <div className="mt-6">
          <div className="flex border-b border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 flex items-center justify-center gap-2 font-bold text-xs cursor-pointer transition ${
                activeTab === 'posts'
                  ? 'border-b-2 border-white text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Posts ({posts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('liked')}
              className={`flex-1 py-3 flex items-center justify-center gap-2 font-bold text-xs cursor-pointer transition ${
                activeTab === 'liked'
                  ? 'border-b-2 border-white text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Liked ({likedPosts.length})</span>
            </button>
          </div>

          {currentDisplayPosts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                {activeTab === 'posts' ? (
                  <Video className="w-8 h-8 text-white/40" />
                ) : (
                  <Heart className="w-8 h-8 text-white/40" />
                )}
              </div>
              <p className="text-sm font-bold text-white">
                {activeTab === 'posts' ? 'Belum ada video atau foto' : 'Belum ada video yang disukai'}
              </p>
              <p className="text-xs text-white/40 mt-1 max-w-[240px]">
                {activeTab === 'posts'
                  ? 'Video atau foto yang kamu unggah khusus muncul di akun ini. Klik tombol + untuk mengunggah.'
                  : 'Video atau foto yang kamu sukai akan muncul di sini.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[2px] mt-[2px]">
              {currentDisplayPosts.map((post) => {
                const mediaSrc = post.url || post.thumbnail || '';
                const isVid = isVideoPostItem(post);
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-[9/16] bg-zinc-900 overflow-hidden group cursor-pointer"
                  >
                    {mediaSrc ? (
                      isVid ? (
                        <video
                          src={mediaSrc}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <img
                          src={mediaSrc}
                          alt={post.caption || 'Post thumbnail'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-white/40 p-2 text-center">
                        {post.caption || 'Post'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-85 pointer-events-none" />
                    {isVid && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white pointer-events-none">
                        <Play className="w-3 h-3 fill-white" />
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white text-[11px] font-medium drop-shadow-md pointer-events-none">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{post.views}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Plus (+) Button for Video/Photo Upload */}
      {!selectedPost && !showCreateModal && (
        <div className="fixed bottom-28 right-6 z-[90] pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setUploadError('');
              setShowCreateModal(true);
            }}
            className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform cursor-pointer hover:bg-white/95"
            title="Unggah Video atau Foto Baru"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Full-Screen Modal Unggah Video / Foto Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[180] bg-[#07080d]/95 backdrop-blur-2xl flex flex-col overflow-y-auto">
          <div className="sticky top-0 z-20 px-4 py-3.5 bg-black/60 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setPostMedia('');
                setPostCaption('');
                setUploadError('');
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-white">Unggah Video / Foto</h3>
            <div className="w-9" />
          </div>

          <form onSubmit={handleCreatePost} className="w-full max-w-md mx-auto p-4 space-y-4 flex-1">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/14] max-h-[380px] rounded-3xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-white/40 transition relative group"
            >
              {postMedia ? (
                postMediaType === 'video' ? (
                  <video
                    src={postMedia}
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img src={postMedia} alt="Preview" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="flex flex-col items-center text-center p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Video className="w-9 h-9 text-white/60 group-hover:scale-110 transition-transform" />
                    <ImageIcon className="w-8 h-8 text-white/40 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-sm font-bold text-white">Pilih Video atau Foto</p>
                  <p className="text-xs text-white/45 mt-1">
                    Mendukung MP4, WebM, MOV, JPG, PNG (Tersimpan khusus di UID {uIdUpper})
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Pengaturan Privasi Video/Postingan */}
            <div>
              <label className="text-[11px] text-white/60 block mb-1.5 font-semibold">
                Siapa yang dapat melihat video ini?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'public', label: 'Publik', icon: Globe },
                    { id: 'friends', label: 'Teman', icon: Users },
                    { id: 'private', label: 'Hanya Saya', icon: Lock }
                  ] as const
                ).map((opt) => {
                  const IconComp = opt.icon;
                  const active = postPrivacy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPostPrivacy(opt.id)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        active
                          ? 'bg-white text-black border-white shadow'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-white/60 block mb-1 font-semibold">
                Keterangan / Caption
              </label>
              <textarea
                rows={3}
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                placeholder="Tulis caption video atau postingan kamu..."
                className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 outline-none resize-none"
              />
            </div>

            {uploadError && (
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 text-center">
                {uploadError}
              </div>
            )}

            <div className="flex gap-2.5 pt-2 pb-6">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setPostMedia('');
                  setPostCaption('');
                  setUploadError('');
                }}
                className="flex-1 py-3 rounded-full bg-white/10 text-white font-semibold text-xs active:scale-95 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!postMedia || isUploadingPost}
                className="flex-1 py-3 rounded-full bg-white text-black font-bold text-xs disabled:opacity-40 hover:bg-white/90 active:scale-95 transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                {isUploadingPost ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <span>Posting Sekarang</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Full-Screen Detail Postingan / Pemutar Video (Bottom Nav otomatis disembunyikan) */}
      {selectedPost && (
        <div className="fixed inset-0 z-[185] bg-black flex flex-col h-[100dvh] w-screen">
          <div className="flex-shrink-0 px-4 py-3 bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between z-20">
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">@{effectiveUser?.username || 'user'}</span>
              <UserRoleBadge user={{ ...user, ...effectiveUser }} size="xs" />
            </div>
            {activeTab === 'posts' ? (
              <button
                type="button"
                onClick={(e) => handleDeletePost(selectedPost.id, e)}
                className="w-9 h-9 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 flex items-center justify-center text-red-400 transition cursor-pointer"
                title="Hapus Postingan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-9" />
            )}
          </div>

          <div className="flex-1 bg-black flex items-center justify-center overflow-hidden relative">
            {(() => {
              const src = selectedPost.url || selectedPost.thumbnail || '';
              if (!src) {
                return (
                  <div className="text-white/40 text-xs">Media tidak tersedia</div>
                );
              }
              return isVideoPostItem(selectedPost) ? (
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
                  alt={selectedPost.caption || 'Post'}
                  className="w-full h-full object-contain max-h-full"
                />
              );
            })()}
          </div>

          <div className="flex-shrink-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-zinc-950/95 border-t border-white/10 space-y-2.5">
            {selectedPost.caption && (
              <p className="text-xs text-white leading-relaxed">{selectedPost.caption}</p>
            )}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => handleToggleLike(selectedPost, e)}
                className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white cursor-pointer bg-white/10 px-3.5 py-1.5 rounded-full"
              >
                <Heart
                  className={`w-4 h-4 ${
                    likedPosts.some((p) => p.id === selectedPost.id)
                      ? 'fill-red-500 text-red-500'
                      : ''
                  }`}
                />
                <span>
                  {likedPosts.some((p) => p.id === selectedPost.id) ? 'Disukai' : 'Suka'}
                </span>
              </button>

              <span className="text-[11px] text-white/45 font-mono">
                UID: {selectedPost.uid || uIdUpper}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
