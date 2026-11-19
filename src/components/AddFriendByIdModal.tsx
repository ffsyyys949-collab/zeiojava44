import React, { useState } from 'react';
import { UserPlus, Search, Check, Copy, X, UserCheck, MessageCircle, Loader2, Zap } from 'lucide-react';
import { db, collection, query, where, getDocs, getDocsFromServer, doc, setDoc } from '../firebase.ts';
import { UserRoleBadge } from './UserRoleBadge.tsx';

export function AddFriendByIdModal({
  currentUser,
  allUsers,
  friends,
  onClose,
  onSendRequest,
  onOpenChat,
}: {
  currentUser: { id: string; name: string; username: string; photo?: string; username_lower?: string; id_upper?: string };
  allUsers: Array<{ id: string; name: string; username: string; photo?: string }>;
  friends: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSendRequest: (targetId: string, targetName: string) => Promise<void> | void;
  onOpenChat?: (target: { id: string; name: string; username: string; photo?: string; bio?: string }) => void;
}) {
  const [inputId, setInputId] = useState('');
  const [searchedUser, setSearchedUser] = useState<{
    id: string;
    name: string;
    username: string;
    photo?: string;
    bio?: string;
    verified?: boolean;
    blueTick?: boolean;
    isVerified?: boolean;
    id_upper?: string;
    username_lower?: string;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [copiedOwnId, setCopiedOwnId] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setSearchedUser(null);
    setRequestSent(false);

    const cleanInput = inputId.trim();
    if (!cleanInput) return;

    const cleanId = cleanInput.toUpperCase();
    if (cleanId === (currentUser.id || '').toUpperCase()) {
      setSearchError('Ini adalah ID akun Anda sendiri.');
      return;
    }

    setIsSearching(true);

    try {
      let foundUser: any = null;

      // 1. CARI KE DATABASE ONLINE CENTRAL SERVER
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(cleanInput)}`);
        if (res.ok) {
          const uData = await res.json();
          const serverUsers = uData.users || [];
          const match = serverUsers.find((u: any) =>
            (u.id && String(u.id).toUpperCase() === cleanId) ||
            (u.username && u.username.toLowerCase() === cleanInput.toLowerCase().replace('@', '')) ||
            (u.name && u.name.toLowerCase().includes(cleanInput.toLowerCase()))
          );
          if (match) {
            foundUser = {
              ...match,
              id: match.id,
              id_upper: String(match.id).toUpperCase(),
              name: match.name,
              username: match.username || match.name,
              photo: match.photo || match.avatar || '',
              avatar: match.photo || match.avatar || '',
              bio: match.bio || 'Hey there! I am using ZE.io',
              isVerified: match.isVerified || match.role === 'owner',
              verified: match.isVerified || match.role === 'owner',
            };
          }
        }
      } catch (err) {}

      // 2. Scan all backend users if search query didn't match directly
      if (!foundUser) {
        try {
          const res = await fetch('/api/users');
          if (res.ok) {
            const uData = await res.json();
            const serverUsers = uData.users || [];
            const match = serverUsers.find((u: any) =>
              (u.id && String(u.id).toUpperCase() === cleanId) ||
              (u.username && u.username.toLowerCase() === cleanInput.toLowerCase().replace('@', '')) ||
              (u.name && u.name.toLowerCase().includes(cleanInput.toLowerCase()))
            );
            if (match) {
              foundUser = {
                ...match,
                id: match.id,
                id_upper: String(match.id).toUpperCase(),
                name: match.name,
                username: match.username || match.name,
                photo: match.photo || match.avatar || '',
                avatar: match.photo || match.avatar || '',
                bio: match.bio || 'Hey there! I am using ZE.io',
                isVerified: match.isVerified || match.role === 'owner',
                verified: match.isVerified || match.role === 'owner',
              };
            }
          }
        } catch {}
      }

      // 3. Fallback: Firestore check if configured
      if (!foundUser && db) {
        try {
          const k = cleanInput;
          const ref = collection(db, 'ze_users');
          const q1 = query(ref, where('id_upper', '==', k.toUpperCase()));
          const q2 = query(ref, where('username_lower', '==', k.toLowerCase().replace('@', '')));
          const [s1, s2] = await Promise.all([
            getDocs(q1).catch(() => ({ docs: [] })),
            getDocs(q2).catch(() => ({ docs: [] })),
          ]);
          const foundDocs = [...(s1 as any).docs, ...(s2 as any).docs];
          if (foundDocs.length > 0) {
            const docData = foundDocs[0].data();
            foundUser = {
              ...docData,
              id: docData.id || docData.id_upper,
              id_upper: docData.id_upper || docData.id,
              name: docData.name || 'ZE User',
              username: docData.username || docData.id.toLowerCase().replace('-', '_'),
              photo: docData.photo || docData.avatar || '',
              bio: docData.about || docData.bio || 'Hey there! I am using ZE.io',
              isVerified: docData.isVerified || docData.verified || docData.role === 'owner',
            };
          }
        } catch (err) {}
      }

      // 4. Fallback to local allUsers state
      if (!foundUser && allUsers && allUsers.length > 0) {
        const localFound = allUsers.find(
          (u) =>
            String(u.id).toUpperCase() === cleanId ||
            (u.username && u.username.toUpperCase() === cleanId.replace('@', '')) ||
            u.name.toLowerCase().includes(cleanInput.toLowerCase())
        );
        if (localFound) {
          foundUser = localFound;
        }
      }

      if (foundUser) {
        setSearchedUser(foundUser);
      } else {
        setSearchError('User tidak ditemukan, pastikan ID benar (contoh ZE-XM21NV)');
      }
    } catch (err) {
      setSearchError('Gagal mencari pengguna. Silakan coba lagi.');
    } finally {
      setIsSearching(false);
    }
  };

  // KLIK CHAT DI HASIL SEARCH - LANGSUNG JADI TEMAN GLOBAL
  const handleDirectChat = async () => {
    if (!searchedUser) return;
    const myUname = (currentUser.username_lower || currentUser.username || currentUser.id).toLowerCase();
    const targetUname = (searchedUser.username_lower || searchedUser.username || searchedUser.id).toLowerCase();
    const myIdUpper = (currentUser.id_upper || currentUser.id).toUpperCase();
    const targetIdUpper = (searchedUser.id_upper || searchedUser.id).toUpperCase();

    const chatId = [myUname, targetUname].sort().join('_');

    if (db) {
      try {
        await setDoc(doc(db, 'friendships', chatId), {
          id: chatId,
          users: [myUname, targetUname],
          users_id: [myIdUpper, targetIdUpper],
          status: 'accepted',
          createdAt: Date.now()
        }, { merge: true });

        await setDoc(doc(db, 'private_chats', chatId), {
          id: chatId,
          participants: [myUname, targetUname],
          participants_id: [myIdUpper, targetIdUpper],
          updatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore direct chat setup error:', err);
      }
    }

    if (onOpenChat) {
      onOpenChat(searchedUser);
    }
    onClose();
  };

  const handleSend = async () => {
    if (!searchedUser || isSending) return;
    setIsSending(true);
    await onSendRequest(searchedUser.id, searchedUser.name);
    setIsSending(false);
    setRequestSent(true);
  };

  const copyMyId = () => {
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
    setCopiedOwnId(true);
    setTimeout(() => setCopiedOwnId(false), 2000);
  };

  const isAlreadyFriend = searchedUser && friends.some((f) => f.id === searchedUser.id);

  return (
    <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-panel rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <UserPlus size={18} className="text-white shrink-0" strokeWidth={1.5} />
            <h3 className="text-base font-bold text-white tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">Cari &amp; Tambah Teman Global</h3>
          </div>
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white cursor-pointer shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="space-y-3 mb-4">
          <div>
            <label className="text-[11px] text-white/70 block mb-1.5 font-medium">
              Masukkan ZE ID (Contoh: ZE-XM21NV) atau Nama
            </label>
            <div className="glass-input rounded-full px-4 py-2.5 flex items-center gap-2">
              <Search size={16} className="text-white/40 shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="ZE-XXXXXX atau nama..."
                value={inputId}
                onChange={(e) => {
                  setInputId(e.target.value);
                  setSearchError(null);
                }}
                className="bg-transparent flex-1 text-xs text-white placeholder-white/30 outline-none uppercase font-mono"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!inputId.trim() || isSearching}
            className="w-full py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition disabled:opacity-40 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
          >
            {isSearching ? (
              <>
                <Loader2 size={14} className="animate-spin text-black" />
                <span>Mencari di Database Online...</span>
              </>
            ) : (
              <>
                <Search size={14} />
                <span>Cari User Global</span>
              </>
            )}
          </button>
        </form>

        {searchError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-2xl p-3 mb-4 text-center">
            {searchError}
          </div>
        )}

        {/* Search Result Card */}
        {searchedUser && (
          <div className="glass-panel rounded-[20px] p-4 mb-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                {searchedUser.photo ? (
                  <img src={searchedUser.photo} alt={searchedUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-base">{searchedUser.name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-bold text-white truncate">{searchedUser.name}</p>
                  <UserRoleBadge user={searchedUser} size="sm" />
                </div>
                <p className="text-[11px] text-white/50 font-mono">@{searchedUser.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-white/10 text-white/80 font-mono px-2 py-0.5 rounded-full">
                    {searchedUser.id}
                  </span>
                  <span className="text-[10px] text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Global
                  </span>
                </div>
              </div>
            </div>

            {searchedUser.bio && (
              <p className="text-[11px] text-white/60 mb-3 bg-white/5 p-2 rounded-xl">
                {searchedUser.bio}
              </p>
            )}

            {isAlreadyFriend ? (
              <div className="flex gap-2">
                <div className="flex-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs py-2 rounded-full text-center font-medium flex items-center justify-center gap-1.5">
                  <UserCheck size={14} /> Teman
                </div>
                <button
                  type="button"
                  onClick={handleDirectChat}
                  className="flex-1 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                >
                  <MessageCircle size={14} /> Chat
                </button>
              </div>
            ) : requestSent ? (
              <div className="space-y-2">
                <div className="bg-white/10 text-white text-xs py-2 rounded-full text-center font-medium flex items-center justify-center gap-1.5">
                  <Check size={14} className="text-green-400" /> Permintaan Terkirim!
                </div>
                <button
                  type="button"
                  onClick={handleDirectChat}
                  className="w-full py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition cursor-pointer shadow flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={14} />
                  <span>Chat Langsung Global</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDirectChat}
                  className="w-full py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition cursor-pointer shadow flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={14} />
                  <span>Chat Langsung (Otomatis Berteman)</span>
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending}
                  className="w-full py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserPlus size={13} />
                  <span>{isSending ? 'Mengirim...' : 'Kirim Permintaan Pertemanan'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Share/Copy Own ID Section */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/40 block">ID Akun Anda (Tersinkron Global):</span>
            <span className="text-xs font-mono font-bold text-white">{currentUser.id}</span>
          </div>
          <button
            type="button"
            onClick={copyMyId}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            {copiedOwnId ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            <span>{copiedOwnId ? 'Tersalin' : 'Salin ID'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
