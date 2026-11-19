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
  Video
} from 'lucide-react';
import { db, collection, addDoc, onSnapshot, query, where, orderBy } from '../firebase.ts';
import { UserRoleBadge } from './UserRoleBadge.tsx';

export interface TikTokPostItem {
  id: string;
  thumbnail: string;
  views: string | number;
  likes?: number;
  caption?: string;
  createdAt?: string;
}

export default function TikTokProfileView({
  currentUser,
  friendsCount,
  storiesCount,
  onEditProfile,
  onPhotoUpload,
  onLogout
}: {
  currentUser: any;
  friendsCount: number;
  storiesCount: number;
  onEditProfile: () => void;
  onPhotoUpload: () => void;
  onLogout: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  
  const scopedUid = String(currentUser?.id || '').trim().toUpperCase();

  // Empty state by default - strictly scoped by UID
  const [posts, setPosts] = useState<TikTokPostItem[]>(() => {
    if (!scopedUid) return [];
    try {
      const saved = localStorage.getItem(`ze_tiktok_posts_${scopedUid}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [likedPosts, setLikedPosts] = useState<TikTokPostItem[]>(() => {
    if (!scopedUid) return [];
    try {
      const saved = localStorage.getItem(`ze_tiktok_liked_posts_${scopedUid}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Realtime load posts from Firestore ze_posts
  useEffect(() => {
    if (!currentUser?.id) return;
    const myId = (currentUser.id || '').toUpperCase();
    const myUser = (currentUser.username || '').toLowerCase();

    // 1. Load from Firestore
    if (db) {
      try {
        const qPosts = query(
          collection(db, 'ze_posts'),
          where('userId', '==', myId),
          orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(qPosts, (snap) => {
          if (!snap.empty) {
            const list: TikTokPostItem[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                thumbnail: data.url || data.thumbnail,
                views: data.views || 0,
                likes: data.likes || 0,
                caption: data.caption,
                createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString('id-ID') : 'Baru saja'
              };
            });
            setPosts(list);
          }
        });
        return () => unsub();
      } catch (e) {
        console.warn('Firestore posts query error:', e);
      }
    }

    // 2. Fallback fetch from server API
    fetch(`/api/posts?userId=${encodeURIComponent(myId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.success && Array.isArray(d.posts) && d.posts.length > 0) {
          const mapped: TikTokPostItem[] = d.posts.map((p: any) => ({
            id: p.id,
            thumbnail: p.url || p.thumbnail,
            views: p.views || 0,
            likes: p.likes || 0,
            caption: p.caption,
            createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('id-ID') : 'Baru saja'
          }));
          setPosts((prev) => (prev.length === 0 ? mapped : prev));
        }
      })
      .catch(() => {});
  }, [currentUser?.id, currentUser?.username]);

  // Modal create post
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postMedia, setPostMedia] = useState<string>('');
  const [postCaption, setPostCaption] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<TikTokPostItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyId = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentUser.id).catch(() => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = currentUser.id;
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

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPostMedia(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postMedia && !postCaption.trim()) return;

    const isOwner = currentUser.username === 'ZE.io' || currentUser.isOwner || (currentUser as any).owner;
    const isVerified = Boolean(isOwner || currentUser.isVerified || (currentUser as any).verified || (currentUser as any).blueTick);
    const isVideo = postMedia.startsWith('data:video') || postMedia.includes('.mp4');

    const newPost: TikTokPostItem = {
      id: 'post_' + Date.now(),
      thumbnail: postMedia || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      views: '0',
      likes: 0,
      caption: postCaption.trim() || 'Postingan baru',
      createdAt: new Date().toLocaleDateString('id-ID')
    };

    const updated = [newPost, ...posts];
    setPosts(updated);
    if (scopedUid) {
      try {
        localStorage.setItem(`ze_tiktok_posts_${scopedUid}`, JSON.stringify(updated));
      } catch {}
    }

    const myIdUpper = (currentUser.id_upper || currentUser.id || '').toUpperCase();
    const myUserLower = (currentUser.username_lower || currentUser.username || '').toLowerCase();

    // 1. Simpan ke Firestore ze_posts - KELIATAN SEMUA ORANG
    if (db) {
      try {
        await addDoc(collection(db, 'ze_posts'), {
          userId: myIdUpper,
          username: myUserLower,
          name: currentUser.name,
          avatar: currentUser.avatar || currentUser.photo,
          url: postMedia,
          thumbnail: postMedia,
          type: isVideo ? 'video' : 'photo',
          caption: postCaption.trim() || 'Postingan baru',
          createdAt: Date.now(),
          views: 0,
          verified: isVerified
        });
      } catch (err) {
        console.warn('Firestore addDoc ze_posts error:', err);
      }
    }

    // 2. Simpan ke backend server API
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newPost.id,
        userId: myIdUpper,
        username: myUserLower,
        name: currentUser.name,
        url: postMedia,
        thumbnail: postMedia,
        type: isVideo ? 'video' : 'photo',
        caption: postCaption.trim() || 'Postingan baru',
        createdAt: Date.now(),
        views: 0,
        verified: isVerified
      })
    }).catch(() => {});

    setPostMedia('');
    setPostCaption('');
    setShowCreateModal(false);
  };

  const handleDeletePost = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    if (scopedUid) {
      try {
        localStorage.setItem(`ze_tiktok_posts_${scopedUid}`, JSON.stringify(updated));
      } catch {}
    }
    setSelectedPost(null);
  };

  const handleToggleLike = (post: TikTokPostItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isLiked = likedPosts.some(p => p.id === post.id);
    let updatedLikes: TikTokPostItem[];
    if (isLiked) {
      updatedLikes = likedPosts.filter(p => p.id !== post.id);
    } else {
      updatedLikes = [post, ...likedPosts];
    }
    setLikedPosts(updatedLikes);
    if (scopedUid) {
      try {
        localStorage.setItem(`ze_tiktok_liked_posts_${scopedUid}`, JSON.stringify(updatedLikes));
      } catch {}
    }
  };

  const currentDisplayPosts = activeTab === 'posts' ? posts : likedPosts;

  return (
    <div className="min-h-screen bg-transparent text-white pb-36">
      {/* Top Bar with Logout & Username */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-black shrink-0 shadow-sm flex items-center justify-center p-0.5">
          <img src="/assets/ze_logo.png" alt="ZE.io Logo" className="w-full h-full object-cover rounded-full" />
        </div>
        <h2 className="text-sm font-bold text-white tracking-wide">
          {currentUser?.username ? `@${currentUser.username}` : 'Profil'}
        </h2>
        <button
          onClick={onLogout}
          title="Keluar"
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-md mx-auto pt-6 px-4">
        {/* TikTok Style Header */}
        <div className="flex flex-col items-center text-center">
          {/* Centered 110px Avatar with White Border */}
          <div
            onClick={onPhotoUpload}
            className="relative cursor-pointer group active:scale-95 transition"
            title="Klik untuk ganti foto profil"
          >
            <img
              src={currentUser?.avatar || currentUser?.photo || (currentUser?.name ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}` : 'https://api.dicebear.com/9.x/initials/svg?seed=bhhhh')}
              alt={currentUser?.name || 'User Avatar'}
              className="w-[110px] h-[110px] rounded-full object-cover border-2 border-white shadow-2xl bg-zinc-900"
            />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-500 border-2 border-black flex items-center justify-center text-white text-sm shadow">
              <Plus className="w-4 h-4" />
            </div>
          </div>

          {/* Name & Username */}
          <div className="flex items-center justify-center gap-1.5 mt-3.5 flex-wrap">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {currentUser?.name || 'ZE User'}
            </h1>
            <UserRoleBadge user={currentUser} size="md" />
          </div>
          <p className="text-xs text-white/50 font-medium mt-0.5">
            @{currentUser?.username || 'jslo'}
          </p>

          {/* ZE ID Badge with Copy */}
          <div
            onClick={copyId}
            className="mt-2.5 bg-white/10 hover:bg-white/15 border border-white/15 px-3.5 py-1 rounded-full flex items-center gap-2 cursor-pointer transition active:scale-95 shadow-sm"
          >
            <span className="text-[11px] font-mono font-bold text-white tracking-wider">
              {currentUser?.id || 'ZE-2BAU0B'}
            </span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-white/70" />
            )}
          </div>

          {/* Centered Bio */}
          <p className="text-xs text-white/80 max-w-xs mt-3 leading-relaxed text-center font-normal px-2">
            {currentUser?.bio || 'Hey there! I am using ZE.io 🚀'}
          </p>

          {/* Centered Stats Row: Teman | Pengikut | Global ID */}
          {(() => {
            const isOwnerAccount =
              currentUser?.isOwner === true ||
              currentUser?.role === 'owner' ||
              currentUser?.username === 'ZE.io' ||
              currentUser?.username?.toLowerCase() === 'ze.io' ||
              currentUser?.name === 'zvn3' ||
              currentUser?.id === 'ZE-OWNER';

            const displayFollowers = isOwnerAccount ? '989M' : (currentUser?.followers || 0);

            return (
              <div className="flex items-center justify-center gap-8 w-full mt-5 py-2">
                <div className="text-center cursor-pointer">
                  <p className="text-lg font-bold text-white">{friendsCount || 0}</p>
                  <p className="text-[11px] text-white/50">Teman</p>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div className="text-center cursor-pointer">
                  <p className="text-lg font-bold text-white">{displayFollowers}</p>
                  <p className="text-[11px] text-white/50">Pengikut</p>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div className="text-center cursor-pointer">
                  <p className="text-lg font-bold text-white">ZE.io</p>
                  <p className="text-[11px] text-white/50">Global ID</p>
                </div>
              </div>
            );
          })()}

          {/* 2 Full-Width Action Buttons: Edit Profil & Salin ID */}
          {/* Note: Explicit relative z-[100] and pointer-events-auto with zero blocking overlays */}
          <div className="flex items-center gap-3 w-full mt-5 relative z-[100]">
            <div className="relative z-[100] pointer-events-auto flex-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProfile();
                }}
                className="w-full relative z-[100] pointer-events-auto cursor-pointer bg-white text-black px-6 py-3 rounded-full font-bold active:scale-95 transition-all text-center text-xs shadow-md"
                style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
              >
                Edit Profil
              </button>
            </div>
            <div className="relative z-[100] pointer-events-auto flex-1">
              <button
                type="button"
                onClick={copyId}
                className="w-full relative z-[100] pointer-events-auto cursor-pointer py-3 rounded-full bg-[#222222] hover:bg-[#2a2a2a] text-white font-semibold text-xs border border-white/10 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-md"
                style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
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

        {/* 3. POSTINGAN ALA TIKTOK */}
        <div className="mt-6">
          {/* TikTok Navigation Tabs: Posts & Liked */}
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

          {/* Empty State / 3-Column Posts Grid */}
          {currentDisplayPosts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                {activeTab === 'posts' ? (
                  <Camera className="w-8 h-8 text-white/40" />
                ) : (
                  <Heart className="w-8 h-8 text-white/40" />
                )}
              </div>
              <p className="text-sm font-bold text-white">
                {activeTab === 'posts' ? 'Belum ada postingan' : 'Belum ada video yang disukai'}
              </p>
              <p className="text-xs text-white/40 mt-1 max-w-[220px]">
                {activeTab === 'posts'
                  ? 'Video atau foto kamu akan muncul di sini. Klik tombol + untuk mengunggah.'
                  : 'Video atau foto yang kamu sukai akan muncul di sini.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[2px] mt-[2px]">
              {currentDisplayPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-[3/4] bg-zinc-900 overflow-hidden group cursor-pointer"
                >
                  <img
                    src={post.thumbnail}
                    alt={post.caption || 'Post thumbnail'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white text-[11px] font-medium drop-shadow-md">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{post.views}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Plus (+) Button on Profile Page (Fixed above bottom nav) */}
      <div className="fixed bottom-28 right-6 z-[90] pointer-events-auto">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform cursor-pointer hover:bg-white/95"
          title="Buat Postingan Baru"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Modal Buat Postingan Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141414] border border-white/10 rounded-[28px] p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Buat Postingan</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setPostMedia('');
                  setPostCaption('');
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="mt-4 space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-56 rounded-2xl bg-zinc-900 border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-white/40 transition relative group"
              >
                {postMedia ? (
                  postMedia.startsWith('data:video') || postMedia.includes('.mp4') ? (
                    <video src={postMedia} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={postMedia} alt="Preview" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="flex gap-2 text-white/40 mb-2 group-hover:scale-110 transition-transform">
                      <Video className="w-8 h-8" />
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-bold text-white">Pilih Video atau Foto</p>
                    <p className="text-[10px] text-white/40 mt-1">Ketuk untuk mengambil dari galeri</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div>
                <label className="text-[11px] text-white/50 block mb-1">Keterangan / Caption</label>
                <textarea
                  rows={3}
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Tulis caption postingan kamu..."
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-white/30 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setPostMedia('');
                    setPostCaption('');
                  }}
                  className="flex-1 py-3 rounded-full bg-white/10 text-white font-semibold text-xs active:scale-95 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!postMedia && !postCaption.trim()}
                  className="flex-1 py-3 rounded-full bg-white text-black font-bold text-xs disabled:opacity-40 hover:bg-white/90 active:scale-95 transition cursor-pointer shadow-lg"
                >
                  Posting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Postingan */}
      {selectedPost && (
        <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141414] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl relative">
            <div className="p-3 bg-black/40 flex items-center justify-between border-b border-white/10">
              <span className="text-xs font-bold text-white">Detail Postingan</span>
              <button
                onClick={() => setSelectedPost(null)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-[3/4] bg-black">
              <img
                src={selectedPost.thumbnail}
                alt={selectedPost.caption || 'Post'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-white leading-relaxed">{selectedPost.caption}</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  onClick={(e) => handleToggleLike(selectedPost, e)}
                  className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      likedPosts.some(p => p.id === selectedPost.id)
                        ? 'fill-red-500 text-red-500'
                        : ''
                    }`}
                  />
                  <span>
                    {likedPosts.some(p => p.id === selectedPost.id) ? 'Disukai' : 'Suka'}
                  </span>
                </button>
                {activeTab === 'posts' && (
                  <button
                    onClick={(e) => handleDeletePost(selectedPost.id, e)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Post</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
