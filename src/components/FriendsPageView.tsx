import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  UserPlus,
  Users,
  Check,
  Clock,
  MessageCircle,
  Phone,
  Shield,
  Crown
} from 'lucide-react';
import { UserRoleBadge } from './UserRoleBadge.tsx';

interface FriendsPageViewProps {
  currentUser: any;
  friends: any[];
  allUsers: any[];
  onBack: () => void;
  onOpenChat: (user: any) => void;
  onViewProfile: (user: any) => void;
  onSendFriendRequest: (userId: string) => Promise<void>;
}

export function FriendsPageView({
  currentUser,
  friends = [],
  allUsers = [],
  onBack,
  onOpenChat,
  onViewProfile,
  onSendFriendRequest
}: FriendsPageViewProps) {
  const [activeTab, setActiveTab] = useState<'my-friends' | 'search'>('my-friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [requestSentMap, setRequestSentMap] = useState<Record<string, boolean>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Filter existing friends
  const filteredFriends = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return friends;
    return friends.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.username?.toLowerCase().includes(q) ||
        String(f.id).toLowerCase().includes(q)
    );
  }, [friends, searchQuery]);

  // Discover/search users from all registered accounts
  const discoverUsers = useMemo(() => {
    const friendIds = new Set(friends.map((f) => String(f.id).toLowerCase()));
    const myId = String(currentUser?.id || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    return allUsers.filter((u) => {
      const uId = String(u.id).toLowerCase();
      if (uId === myId) return false;
      if (friendIds.has(uId)) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        String(u.id).toLowerCase().includes(q)
      );
    });
  }, [allUsers, friends, currentUser?.id, searchQuery]);

  const handleAddFriend = async (targetId: string) => {
    if (sendingId) return;
    setSendingId(targetId);
    try {
      await onSendFriendRequest(targetId);
      setRequestSentMap((prev) => ({ ...prev, [targetId]: true }));
    } catch {}
    setSendingId(null);
  };

  return (
    <div className="min-h-screen bg-transparent text-white pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-40 glass-panel px-4 py-3 flex items-center justify-between border-b border-white/[0.12] gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full glass-input flex items-center justify-center text-white cursor-pointer active:scale-95 transition shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-white tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">Daftar Teman</h1>
            <p className="text-[11px] text-zinc-300 whitespace-nowrap overflow-hidden text-ellipsis">
              {friends.length} teman terhubung
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'my-friends' ? 'Cari di daftar teman...' : 'Cari akun ZE ID, username, nama...'}
            className="w-full glass-input rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-400 outline-none focus:border-white/40"
          />
        </div>

        {/* Tab Buttons */}
        <div className="flex rounded-2xl glass-panel p-1 border border-white/10">
          <button
            onClick={() => setActiveTab('my-friends')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'my-friends'
                ? 'bg-white text-black shadow-md font-bold'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Teman Saya ({friends.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-white text-black shadow-md font-bold'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <UserPlus size={14} />
            <span>Cari Akun Baru</span>
          </button>
        </div>

        {/* Tab 1: My Friends */}
        {activeTab === 'my-friends' && (
          <div className="space-y-2.5">
            {filteredFriends.length === 0 ? (
              <div className="glass-panel rounded-3xl p-8 text-center space-y-3">
                <Users size={32} className="mx-auto text-zinc-400 opacity-60" />
                <p className="text-sm font-semibold text-white">Belum ada teman ditemukan</p>
                <p className="text-xs text-zinc-300 max-w-xs mx-auto">
                  {searchQuery
                    ? `Tidak ada teman yang cocok dengan "${searchQuery}".`
                    : 'Gunakan tab "Cari Akun Baru" untuk menambah koneksi di ZE.io.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold shadow hover:bg-zinc-200 cursor-pointer transition"
                  >
                    Cari Pengguna Lain
                  </button>
                )}
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="glass-panel rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-white/20 transition cursor-pointer"
                  onClick={() => onViewProfile(friend)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-900 border border-white/20 shrink-0">
                      <img
                        src={
                          friend.photo ||
                          friend.avatar ||
                          `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(friend.name || 'Friend')}`
                        }
                        alt={friend.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate max-w-[140px]">
                          {friend.name}
                        </span>
                        <UserRoleBadge user={friend} size="xs" />
                      </div>
                      <p className="text-[11px] text-zinc-300 truncate font-mono">
                        @{friend.username || friend.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onOpenChat(friend)}
                      title="Mulai Chat"
                      className="w-8 h-8 rounded-xl glass-input flex items-center justify-center text-white hover:border-white/40 cursor-pointer active:scale-95 transition"
                    >
                      <MessageCircle size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Discover & Search Accounts */}
        {activeTab === 'search' && (
          <div className="space-y-2.5">
            {discoverUsers.length === 0 ? (
              <div className="glass-panel rounded-3xl p-8 text-center space-y-2">
                <Search size={32} className="mx-auto text-zinc-400 opacity-60" />
                <p className="text-sm font-semibold text-white">Tidak ada akun lain ditemukan</p>
                <p className="text-xs text-zinc-300">
                  {searchQuery ? `Tidak ada akun yang cocok dengan "${searchQuery}".` : 'Semua pengguna telah berteman dengan Anda.'}
                </p>
              </div>
            ) : (
              discoverUsers.map((user) => {
                const isSent = requestSentMap[user.id];
                const isSending = sendingId === user.id;

                return (
                  <div
                    key={user.id}
                    className="glass-panel rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-white/20 transition cursor-pointer"
                    onClick={() => onViewProfile(user)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-900 border border-white/20 shrink-0">
                        <img
                          src={
                            user.photo ||
                            user.avatar ||
                            `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`
                          }
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate max-w-[140px]">
                            {user.name}
                          </span>
                          <UserRoleBadge user={user} size="xs" />
                        </div>
                        <p className="text-[11px] text-zinc-300 truncate font-mono">
                          @{user.username || user.id}
                        </p>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleAddFriend(user.id)}
                        disabled={isSent || isSending}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                          isSent
                            ? 'bg-white/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white text-black hover:bg-zinc-200 shadow'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <Check size={13} className="text-emerald-400 stroke-[3]" />
                            <span>Terkirim</span>
                          </>
                        ) : isSending ? (
                          <span>Mengirim...</span>
                        ) : (
                          <>
                            <UserPlus size={13} />
                            <span>Tambah</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendsPageView;
