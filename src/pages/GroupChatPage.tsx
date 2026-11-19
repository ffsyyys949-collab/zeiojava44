import { navigate } from '../App.tsx';
import React, { useState, useEffect } from 'react';
import { Users, Plus, ArrowLeft, MessageSquare, Search } from 'lucide-react';

interface GroupItem {
  id: string;
  name: string;
  photo?: string;
  members: string[];
  lastMessage?: string;
  createdAt: number;
}

interface GroupChatPageProps {
  onBack?: () => void;
  onCreateGroup?: () => void;
  onOpenGroup?: (groupId: string) => void;
  groups?: GroupItem[];
}

export default function GroupChatPage({
  onBack,
  onCreateGroup,
  onOpenGroup,
  groups = []
}: GroupChatPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocalCreateModal, setShowLocalCreateModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [localGroups, setLocalGroups] = useState<GroupItem[]>(() => {
    try {
      const saved = localStorage.getItem('vn_groups_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return groups || [];
  });

  useEffect(() => {
    if (Array.isArray(groups) && groups.length > 0) {
      setLocalGroups((prev) => {
        const map = new Map<string, GroupItem>();
        groups.forEach((g) => map.set(g.id, g));
        prev.forEach((g) => {
          if (!map.has(g.id)) map.set(g.id, g);
        });
        return Array.from(map.values());
      });
    }
  }, [groups]);

  const handleCreateNewGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameInput.trim()) return;

    const newGroup: GroupItem = {
      id: 'group_' + Date.now(),
      name: groupNameInput.trim(),
      members: [],
      lastMessage: 'Grup dibuat',
      createdAt: Date.now()
    };

    const updated = [newGroup, ...localGroups];
    setLocalGroups(updated);
    try {
      localStorage.setItem('vn_groups_list', JSON.stringify(updated));
    } catch {}

    setGroupNameInput('');
    setShowLocalCreateModal(false);
    if (onCreateGroup) {
      onCreateGroup();
    }
  };

  const filteredGroups = localGroups.filter(g =>
    (g.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen ze-transparent-page bg-transparent text-white pb-24 px-4 pt-4 max-w-lg mx-auto">
      {/* Header - Glass Panel */}
      <div className="glass-panel rounded-[24px] p-4 flex items-center justify-between gap-3 mb-4 shadow-xl">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                navigate('/');
              }
            }}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center active:scale-95 cursor-pointer pointer-events-auto relative z-[100] hover:bg-white/20 transition text-white shrink-0"
            style={{ touchAction: 'manipulation' }}
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-white tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">Group Chat</h1>
              <p className="text-[11px] text-white/50 whitespace-nowrap overflow-hidden text-ellipsis">Komunitas &amp; Obrolan Grup</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (onCreateGroup) onCreateGroup();
            else setShowLocalCreateModal(true);
          }}
          className="bg-white text-black hover:bg-white/90 active:scale-95 px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Buat Group</span>
        </button>
      </div>

      {/* Search Bar - Glass Input */}
      {localGroups.length > 0 && (
        <div className="glass-input rounded-full px-4 py-2 flex items-center gap-2 mb-4 shadow-sm">
          <Search className="w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari grup..."
            className="w-full bg-transparent text-xs text-white placeholder-white/30 outline-none"
          />
        </div>
      )}

      {/* List Group / Empty State */}
      {filteredGroups.length === 0 ? (
        <div className="glass-panel rounded-[28px] p-10 flex flex-col items-center justify-center text-center my-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-white/40" />
          </div>
          <h2 className="text-base font-bold text-white mb-1.5">Belum ada group</h2>
          <p className="text-xs text-white/50 max-w-[240px] leading-relaxed mb-6">
            Mulai obrolan bersama teman-temanmu dengan membuat group pertama sekarang.
          </p>
          <button
            onClick={() => {
              if (onCreateGroup) onCreateGroup();
              else setShowLocalCreateModal(true);
            }}
            className="bg-white text-black hover:bg-white/90 active:scale-95 px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Buat Group Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => onOpenGroup && onOpenGroup(group.id)}
              className="glass-panel hover:bg-white/[0.08] rounded-[22px] p-3.5 flex items-center justify-between transition cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-sm font-bold text-white">
                  {group.name.trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{group.name}</h3>
                  <p className="text-xs text-white/50 mt-0.5 line-clamp-1">
                    {group.lastMessage || 'Ketuk untuk membuka grup'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Buat Group */}
      {showLocalCreateModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel rounded-[28px] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Buat Group Baru</h3>
            <p className="text-xs text-white/50 mb-4">Beri nama untuk grup obrolan Anda</p>
            <form onSubmit={handleCreateNewGroup} className="space-y-4">
              <div>
                <label className="text-[11px] text-white/60 block mb-1">Nama Group</label>
                <input
                  type="text"
                  autoFocus
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  placeholder="Contoh: Komunitas ZE.io"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-white/30"
                />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLocalCreateModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-white/10 text-white font-semibold text-xs active:scale-95 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!groupNameInput.trim()}
                  className="flex-1 py-2.5 rounded-full bg-white text-black font-bold text-xs disabled:opacity-40 hover:bg-white/90 active:scale-95 transition cursor-pointer shadow-md"
                >
                  Buat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
