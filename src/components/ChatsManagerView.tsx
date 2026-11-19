import React, { useState, useEffect, useMemo } from 'react';
import { UserRoleBadge } from './UserRoleBadge.tsx';
import {
  MessageCircle,
  Users,
  Search,
  UserPlus,
  Globe,
  Camera,
  Check,
  Plus,
  ChevronRight,
  Bell,
  Clock,
  Radio
} from 'lucide-react';
import { renderMessageContent } from './EmojiStickerPicker.tsx';

export function ChatsManagerView({
  currentUser,
  friends,
  chats,
  allUsers,
  notesMap,
  friendRequestsCount,
  onOpenPrivateChat,
  onOpenGlobalChat,
  onOpenAddFriendById,
  onNavigateRequests,
  onCreateNote,
  onViewNote,
  onViewProfile,
  renderGlobalChat,
}: {
  currentUser: any;
  friends: any[];
  chats: any[];
  allUsers: any[];
  notesMap: Record<string, any>;
  friendRequestsCount: number;
  onOpenPrivateChat: (partner: any) => void;
  onOpenGlobalChat: () => void;
  onOpenAddFriendById: () => void;
  onNavigateRequests: () => void;
  onCreateNote: () => void;
  onViewNote: (note: any) => void;
  onViewProfile: (user: any) => void;
  renderGlobalChat: (onBack?: () => void) => React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<'chats' | 'directory'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineSearchResults, setOnlineSearchResults] = useState<any[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineUsersList, setOnlineUsersList] = useState<string[]>([]);

  // Fetch online presence list for real-time active indicators across devices
  useEffect(() => {
    let isMounted = true;
    const fetchOnline = async () => {
      try {
        const res = await fetch('/api/presence/online');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.onlineUsers)) {
            setOnlineUsersList(data.onlineUsers.map((u: string) => String(u).toUpperCase()));
          }
        }
      } catch {}
    };

    fetchOnline();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchOnline();
    }, 12000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const isUserOnline = (user: any) => {
    if (!user) return false;
    const uId = String(user.id || '').toUpperCase();
    const uName = String(user.username || '').toUpperCase().replace(/^@/, '');
    return onlineUsersList.includes(uId) || onlineUsersList.includes(uName);
  };

  // Online Database Search whenever searchQuery changes
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setOnlineSearchResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.users)) {
            const cleanMatches = data.users.filter(
              (u: any) => String(u.id).toUpperCase() !== String(currentUser?.id).toUpperCase()
            );
            setOnlineSearchResults(cleanMatches);
          }
        }
      } catch (err) {
        console.warn('Online user search error:', err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.id]);

  const myNote = notesMap[currentUser?.id];

  // Map active conversations with partner details
  const activeConversations = useMemo(() => {
    const myIdClean = String(currentUser?.id || '').toUpperCase();
    const list: Array<{
      chat: any;
      partner: any;
      lastMsg: string;
      lastTime: number;
      isUnread: boolean;
      isOnline: boolean;
    }> = [];

    const processedChatIds = new Set<string>();

    for (const c of chats) {
      const cId = c.id || c.chatId;
      if (!cId || processedChatIds.has(cId)) continue;
      processedChatIds.add(cId);

      const parts: string[] = (Array.isArray(c.participants) && c.participants.length > 0)
        ? c.participants
        : (cId.includes('_') ? cId.split('_') : []);

      const partnerId = parts.find((p) => String(p).toUpperCase() !== myIdClean);
      if (!partnerId) continue;

      const partnerClean = String(partnerId).toUpperCase();
      const partner = allUsers.find(
        (u) =>
          String(u.id).toUpperCase() === partnerClean ||
          String(u.phone || '').toUpperCase() === partnerClean ||
          String(u.username || '').toUpperCase().replace(/^@/, '') === partnerClean.replace(/^@/, '')
      ) || {
        id: partnerId,
        name: partnerId.startsWith('ZE-') ? `User ${partnerId}` : partnerId,
        username: partnerId.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        photo: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(partnerId)}`,
      };

      const isUnread = Boolean(
        c.lastSenderId &&
        String(c.lastSenderId).toUpperCase() !== myIdClean
      );

      list.push({
        chat: c,
        partner,
        lastMsg: c.lastMessage || 'Mulai percakapan',
        lastTime: c.lastTime || c.updatedAt || Date.now(),
        isUnread,
        isOnline: isUserOnline(partner),
      });
    }

    // Sort by most recent activity
    return list.sort((a, b) => b.lastTime - a.lastTime);
  }, [chats, allUsers, currentUser?.id, onlineUsersList]);

  // Filter friends list
  const filteredFriends = useMemo(() => {
    return friends.filter((f) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        f.name?.toLowerCase().includes(q) ||
        f.username?.toLowerCase().includes(q) ||
        f.id?.toLowerCase().includes(q)
      );
    });
  }, [friends, searchQuery]);

  // Registered User Directory (All users except currentUser)
  const registeredUsersDirectory = useMemo(() => {
    const myIdClean = String(currentUser?.id || '').toUpperCase();
    const q = searchQuery.toLowerCase().trim();

    return allUsers
      .filter((u) => String(u.id).toUpperCase() !== myIdClean)
      .filter((u) => {
        if (!q) return true;
        return (
          u.name?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.id?.toLowerCase().includes(q)
        );
      });
  }, [allUsers, currentUser?.id, searchQuery]);

  // Non-friend online search results
  const nonFriendOnlineUsers = useMemo(() => {
    return onlineSearchResults.filter(
      (u) => !friends.some((f) => String(f.id).toUpperCase() === String(u.id).toUpperCase())
    );
  }, [onlineSearchResults, friends]);

  const formatChatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-transparent pb-[130px]">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white/[0.06] backdrop-blur-[36px] backdrop-saturate-[180%] border-b border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.4)] px-4 pt-3 pb-2.5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-black shrink-0 shadow-sm flex items-center justify-center p-0.5">
              <img src="/assets/ze_logo.png" alt="ZE.io Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">Chats</h2>
            <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-white/80 font-bold border border-white/10 shrink-0 whitespace-nowrap">
              {currentUser?.id}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onNavigateRequests}
              className="relative p-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer shrink-0"
              title="Permintaan Pertemanan"
            >
              <Bell size={17} strokeWidth={1.5} />
              {friendRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {friendRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenAddFriendById}
              className="bg-white text-black px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold hover:bg-white/90 active:scale-95 transition flex items-center gap-1.5 cursor-pointer shadow shrink-0 whitespace-nowrap"
            >
              <UserPlus size={14} className="shrink-0" />
              <span>+ Tambah Teman</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Chat (Aktif) vs Pengguna (Direktori) vs Global Chat */}
        <div className="bg-white/[0.06] backdrop-blur-2xl p-1 rounded-full flex gap-1 border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'chats'
                ? 'bg-white text-black shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <MessageCircle size={13} strokeWidth={1.8} />
            <span>Chat</span>
            {activeConversations.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'chats' ? 'bg-black/10 text-black' : 'bg-white/10 text-white/70'}`}>
                {activeConversations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-white text-black shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users size={13} strokeWidth={1.8} />
            <span>Pengguna</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'directory' ? 'bg-black/10 text-black' : 'bg-white/10 text-white/70'}`}>
              {registeredUsersDirectory.length}
            </span>
          </button>

          <button
            onClick={() => onOpenGlobalChat()}
            className="flex-1 py-1.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-white/60 hover:text-white active:scale-95"
          >
            <Globe size={13} strokeWidth={1.8} />
            <span>Global</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Render selected tab */}
      <div>
          {/* Friend Requests Notification Banner if any */}
          {friendRequestsCount > 0 && (
            <div
              onClick={onNavigateRequests}
              className="mx-4 mt-3 p-3 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between cursor-pointer hover:bg-white/15 transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <UserPlus size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {friendRequestsCount} Permintaan Pertemanan Baru
                  </p>
                  <p className="text-[10px] text-white/50">Klik untuk melihat dan menerima</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/50" />
            </div>
          )}

          {/* Search Bar */}
          <div className="px-4 mt-3 mb-2">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-2.5 text-white/40" />
              <input
                type="text"
                placeholder={
                  activeTab === 'directory'
                    ? 'Cari di direktori pengguna ZE.io...'
                    : 'Cari pesan, teman, atau ketik ZE ID...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181818] border border-white/[0.08] rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-white/20 transition-all"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: CHATS (ACTIVE CONVERSATIONS + FRIENDS)            */}
          {/* ======================================================== */}
          {activeTab === 'chats' && (
            <div>
              {/* Notes Row (IG Style) */}
              <div className="px-4 py-2 border-b border-white/[0.05]">
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {/* User Note */}
                  <div className="flex flex-col items-center flex-shrink-0 cursor-pointer relative">
                    <div onClick={myNote ? () => onViewNote(myNote) : onCreateNote} className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center">
                        {currentUser?.photo ? (
                          <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-sm">{(currentUser?.name || 'Z').charAt(0)}</span>
                        )}
                      </div>
                      {myNote ? (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black rounded-full px-2 py-0.5 text-[9px] font-bold shadow-md truncate max-w-[80px]">
                          {myNote.text}
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
                    <span className="text-[10px] text-white/60 mt-1">Catatan Anda</span>
                  </div>

                  {/* Friends Notes */}
                  {friends.map((f) => {
                    const fNote = notesMap[f.id];
                    const online = isUserOnline(f);
                    return (
                      <div
                        key={f.id}
                        className="flex flex-col items-center flex-shrink-0 cursor-pointer relative"
                        onClick={fNote ? () => onViewNote(fNote) : () => onOpenPrivateChat(f)}
                      >
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full p-[2px] ${fNote ? 'border border-[#00FF88]' : 'border border-white/20'}`}>
                            <div className="w-full h-full rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                              {f.photo ? (
                                <img src={f.photo} alt={f.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white font-bold text-sm">{(f.name || 'U').charAt(0)}</span>
                              )}
                            </div>
                          </div>
                          {fNote && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black rounded-full px-2 py-0.5 text-[9px] font-bold shadow-md truncate max-w-[80px]">
                              {fNote.text}
                            </div>
                          )}
                          {online && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black animate-pulse" />
                          )}
                        </div>
                        <span className="text-[10px] text-white/70 mt-1 max-w-[55px] truncate text-center">
                          {f.name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: ACTIVE CONVERSATIONS (1-ON-1 THREADS SYNCED IN CLOUD) */}
              <div className="divide-y divide-white/[0.04]">
                {activeConversations.length > 0 && !searchQuery.trim() && (
                  <div>
                    <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-white/40 font-bold bg-white/[0.02] flex items-center justify-between">
                      <span>Percakapan Aktif ({activeConversations.length})</span>
                      <span className="flex items-center gap-1 text-green-400 font-mono text-[9px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Real-time
                      </span>
                    </div>

                    {activeConversations.map(({ chat, partner, lastMsg, lastTime, isUnread, isOnline }) => (
                      <div
                        key={chat.id || chat.chatId}
                        onClick={() => onOpenPrivateChat(partner)}
                        className={`px-4 py-3 flex items-center gap-3.5 hover:bg-white/[0.05] transition active:bg-white/[0.08] cursor-pointer ${
                          isUnread ? 'bg-white/[0.04]' : ''
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className="relative flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewProfile(partner);
                          }}
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/15 flex items-center justify-center">
                            {partner.photo || partner.avatar ? (
                              <img src={partner.photo || partner.avatar} alt={partner.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-base">{(partner.name || 'U').charAt(0)}</span>
                            )}
                          </div>
                          {isOnline ? (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                          ) : (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-white/30 rounded-full border border-black" />
                          )}
                        </div>

                        {/* Info & Last Message */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className={`text-sm truncate ${isUnread ? 'text-white font-bold' : 'text-white font-semibold'}`}>
                                {partner.name}
                              </p>
                              <UserRoleBadge user={partner} size="sm" />
                              <span className="text-[10px] text-white/40 font-mono truncate px-1 py-0.2 rounded bg-white/5 border border-white/10">
                                {partner.id}
                              </span>
                            </div>
                            <span className="text-[10px] text-white/40 shrink-0 font-mono">
                              {formatChatTime(lastTime)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className={`text-xs truncate ${isUnread ? 'text-white font-medium' : 'text-white/50'}`}>
                              {renderMessageContent(lastMsg)}
                            </p>
                            {isUnread && (
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_#22d3ee]" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SECTION: FRIENDS LIST */}
                {filteredFriends.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-white/40 font-bold bg-white/[0.02] flex items-center justify-between">
                      <span>Teman Terhubung ({filteredFriends.length})</span>
                    </div>

                    {filteredFriends.map((friend) => {
                      const online = isUserOnline(friend);
                      return (
                        <div
                          key={friend.id}
                          className="px-4 py-3 flex items-center gap-3.5 hover:bg-white/[0.04] transition active:bg-white/[0.08] cursor-pointer"
                          onClick={() => onOpenPrivateChat(friend)}
                        >
                          {/* Avatar */}
                          <div
                            className="relative flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewProfile(friend);
                            }}
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/15 flex items-center justify-center">
                              {friend.photo ? (
                                <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white font-bold text-base">{friend.name.charAt(0)}</span>
                              )}
                            </div>
                            {online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                            )}
                          </div>

                          {/* Name & ID */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{friend.name}</p>
                                <UserRoleBadge user={friend} size="sm" />
                                <span className="text-[10px] text-white/50 font-mono truncate px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                  {friend.id}
                                </span>
                              </div>
                              <span className={`text-[10px] font-mono ${online ? 'text-green-400' : 'text-white/40'}`}>
                                {online ? 'Online' : 'Aktif'}
                              </span>
                            </div>
                            <p className="text-white/50 text-xs truncate leading-relaxed font-mono">
                              @{friend.username}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State when no chats and no friends */}
                {activeConversations.length === 0 && friends.length === 0 && !searchQuery.trim() && (
                  <div className="p-8 text-center my-8 flex flex-col items-center max-w-sm mx-auto">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-4 shadow-xl">
                      <MessageCircle size={36} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Mulai Chat di ZE.io</h3>
                    <p className="text-xs text-white/50 max-w-xs mb-6 leading-relaxed">
                      Kirim pesan langsung ke pengguna lain di seluruh dunia atau buka direktori pengguna untuk mulai mengobrol.
                    </p>
                    <div className="flex flex-col gap-2.5 w-full">
                      <button
                        onClick={() => setActiveTab('directory')}
                        className="w-full py-3 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Users size={16} />
                        <span>Buka Direktori Pengguna ({registeredUsersDirectory.length})</span>
                      </button>
                      <button
                        onClick={onOpenAddFriendById}
                        className="w-full py-2.5 rounded-full bg-white/10 text-white font-semibold text-xs hover:bg-white/15 active:scale-95 transition border border-white/15 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserPlus size={15} />
                        <span>+ Tambah Teman Pakai ID</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Online Database Search Results */}
                {searchQuery.trim() && nonFriendOnlineUsers.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-green-400 font-bold bg-green-500/5 border-t border-b border-white/[0.04] flex items-center justify-between">
                      <span>Ditemukan di Database Online ({nonFriendOnlineUsers.length})</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    </div>
                    {nonFriendOnlineUsers.map((targetUser) => (
                      <div
                        key={targetUser.id}
                        className="px-4 py-3 flex items-center gap-3.5 hover:bg-white/[0.05] transition bg-white/[0.01]"
                      >
                        <div
                          className="relative flex-shrink-0 cursor-pointer"
                          onClick={() => onViewProfile(targetUser)}
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center">
                            {targetUser.photo || targetUser.avatar ? (
                              <img
                                src={targetUser.photo || targetUser.avatar}
                                alt={targetUser.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-bold text-base">
                                {(targetUser.name || targetUser.username || 'Z').charAt(0)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-white font-bold text-sm truncate">{targetUser.name}</p>
                            <UserRoleBadge user={targetUser} size="sm" />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-white/50 truncate font-mono">
                              @{targetUser.username || targetUser.id}
                            </span>
                            <span className="text-[10px] text-white/70 font-mono bg-white/10 px-1.5 py-0.2 rounded border border-white/10">
                              {targetUser.id}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenPrivateChat(targetUser)}
                          className="px-3.5 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
                        >
                          <MessageCircle size={13} />
                          <span>Kirim Pesan</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PENGGUNA (GLOBAL REGISTERED USER DIRECTORY)        */}
          {/* ======================================================== */}
          {activeTab === 'directory' && (
            <div className="divide-y divide-white/[0.04]">
              <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-white/40 font-bold bg-white/[0.02] flex items-center justify-between">
                <span>Direktori Pengguna ZE.io ({registeredUsersDirectory.length})</span>
                <span className="text-white/40 text-[9px] font-mono">Ketuk untuk mulai chat</span>
              </div>

              {registeredUsersDirectory.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-xs">
                  {searchQuery ? 'Tidak ada pengguna yang cocok dengan pencarian.' : 'Belum ada pengguna lain yang terdaftar.'}
                </div>
              ) : (
                registeredUsersDirectory.map((user) => {
                  const online = isUserOnline(user);
                  return (
                    <div
                      key={user.id}
                      className="px-4 py-3 flex items-center gap-3.5 hover:bg-white/[0.04] transition active:bg-white/[0.07] cursor-pointer"
                      onClick={() => onOpenPrivateChat(user)}
                    >
                      {/* Avatar */}
                      <div
                        className="relative flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewProfile(user);
                        }}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/15 flex items-center justify-center">
                          {user.photo || user.avatar ? (
                            <img src={user.photo || user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-base">{(user.name || 'U').charAt(0)}</span>
                          )}
                        </div>
                        {online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-white font-bold text-sm truncate">{user.name}</p>
                          <UserRoleBadge user={user} size="sm" />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-white/50 truncate font-mono">
                            @{user.username || user.id}
                          </span>
                          <span className="text-[10px] text-white/60 font-mono bg-white/5 px-1.5 py-0.2 rounded border border-white/10">
                            {user.id}
                          </span>
                        </div>
                        {user.bio && (
                          <p className="text-[11px] text-white/40 truncate mt-0.5">{user.bio}</p>
                        )}
                      </div>

                      {/* Quick Chat Action */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPrivateChat(user);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow"
                      >
                        <MessageCircle size={13} />
                        <span>Chat</span>
                      </button>
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

export default ChatsManagerView;
