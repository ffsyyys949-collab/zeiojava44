import React from 'react';
import {
  Settings,
  ShoppingCart,
  Users,
  FileCode2,
  PhoneCall,
  Cloud,
  Info,
  X,
  ChevronRight,
  Clock
} from 'lucide-react';
import { UserRoleBadge, isUserOwner } from './UserRoleBadge.tsx';
import DiamondPlusIcon from './DiamondPlusIcon.tsx';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenKeranjang: () => void;
  onOpenTeman: () => void;
  onOpenHistory?: () => void;
  onComingSoon: (featureName: string) => void;
}

export function AppSidebar({
  isOpen,
  onClose,
  currentUser,
  onOpenProfile,
  onOpenSettings,
  onOpenKeranjang,
  onOpenTeman,
  onOpenHistory,
  onComingSoon
}: AppSidebarProps) {
  if (!isOpen) return null;

  const isOwner = isUserOwner(currentUser);

  return (
    <div className="fixed inset-0 z-[10020] flex select-none ze-transparent-page bg-transparent">
      {/* Subtle dark separating scrim so Beranda Utama stays clearly visible on the right yet never merges into the drawer */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/45 backdrop-blur-[1.5px] transition-opacity"
        aria-label="Tutup Menu"
      />

      {/* Separated Floating Transparent Android Drawer — crisp gap, border & deep outer shadow */}
      <aside
        className="relative z-10 my-2.5 ml-2.5 w-[66vw] max-w-[244px] min-w-[206px] h-[calc(100dvh-20px)] flex flex-col justify-between overflow-y-auto overflow-x-hidden rounded-[26px] border border-white/25 ring-1 ring-black/80 bg-[#0b0d13]/72 shadow-[22px_0_56px_rgba(0,0,0,0.96),0_12px_40px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.22)] animate-in slide-in-from-left duration-250 ease-out no-scrollbar"
        style={{
          backdropFilter: 'blur(20px) saturate(175%)',
          WebkitBackdropFilter: 'blur(20px) saturate(175%)'
        }}
      >
        {/* Top & corner inner light accent */}
        <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

        {/* TOP SECTION */}
        <div className="flex flex-col">
          {/* Header */}
          <div className="px-3 py-3 flex items-center justify-between gap-2 border-b border-white/14">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl overflow-hidden bg-black/70 border border-white/25 p-0.5 shadow-md shrink-0 flex items-center justify-center">
                <img src="/assets/ze_logo.png" alt="ZE.io" className="w-full h-full object-cover rounded-lg" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-black tracking-wider text-white uppercase leading-tight truncate">
                  ZE.io MENU
                </h2>
                <p className="text-[9px] text-zinc-300 leading-tight truncate">Navigasi Utama</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/90 hover:text-white cursor-pointer active:scale-90 transition shrink-0 shadow-md"
              title="Tutup Menu"
            >
              <X size={14} />
            </button>
          </div>

          {/* 1. PROFIL AKUN (Stacked cleanly for compact Android width — zero clipping) */}
          <div className="p-2.5 border-b border-white/14">
            <div
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className="p-2.5 rounded-2xl bg-black/45 border border-white/18 hover:border-white/35 shadow-[0_8px_22px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.14)] transition cursor-pointer flex flex-col gap-2 group active:scale-[0.98] overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-900 border border-white/30 shrink-0 shadow-md">
                  <img
                    src={
                      currentUser?.avatar ||
                      currentUser?.photo ||
                      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'User')}`
                    }
                    alt={currentUser?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <ChevronRight size={14} className="text-zinc-300 group-hover:text-white shrink-0" />
              </div>

              <div className="min-w-0 space-y-1">
                <div className="text-[12px] font-extrabold text-white truncate leading-tight">
                  {currentUser?.name || 'Pengguna ZE.io'}
                </div>
                <UserRoleBadge user={currentUser} size="xs" className="max-w-full" />
                <p className="text-[10px] text-zinc-300 truncate font-mono leading-tight">
                  @{currentUser?.username || currentUser?.id || 'ze.user'}
                </p>
                {isOwner && (
                  <div className="pt-0.5 flex items-center gap-1 text-[9px] font-black text-amber-300 tracking-wider uppercase">
                    <DiamondPlusIcon size={11} />
                    <span className="truncate">UNLIMITED DIAMOND+</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NAVIGATION LIST — Berderet ke bawah rapi tanpa timpa-menimpa */}
          <nav className="p-2.5 flex flex-col gap-1.5">
            {/* 2. SETTING */}
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-full p-2.5 rounded-2xl bg-black/26 border border-white/14 hover:border-white/30 shadow-[0_6px_18px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] transition cursor-pointer flex items-center justify-between gap-2 text-left active:scale-[0.98] group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Settings size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white leading-tight truncate">Setting</p>
                  <p className="text-[9px] text-zinc-300 leading-tight truncate mt-0.5">Akun &amp; privasi</p>
                </div>
              </div>
              <ChevronRight size={13} className="text-zinc-300 group-hover:text-white shrink-0" />
            </button>

            {/* 3. KERANJANG */}
            <button
              onClick={() => {
                onClose();
                onOpenKeranjang();
              }}
              className="w-full p-2.5 rounded-2xl bg-black/26 border border-white/14 hover:border-white/30 shadow-[0_6px_18px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] transition cursor-pointer flex items-center justify-between gap-2 text-left active:scale-[0.98] group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <ShoppingCart size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white leading-tight truncate">Keranjang</p>
                  <p className="text-[9px] text-zinc-300 leading-tight truncate mt-0.5">Beli KEY &amp; VIP Pass</p>
                </div>
              </div>
              <ChevronRight size={13} className="text-zinc-300 group-hover:text-white shrink-0" />
            </button>

            {/* 4. TEMAN */}
            <button
              onClick={() => {
                onClose();
                onOpenTeman();
              }}
              className="w-full p-2.5 rounded-2xl bg-black/26 border border-white/14 hover:border-white/30 shadow-[0_6px_18px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] transition cursor-pointer flex items-center justify-between gap-2 text-left active:scale-[0.98] group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Users size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white leading-tight truncate">Teman</p>
                  <p className="text-[9px] text-zinc-300 leading-tight truncate mt-0.5">Kontak &amp; cari akun</p>
                </div>
              </div>
              <ChevronRight size={13} className="text-zinc-300 group-hover:text-white shrink-0" />
            </button>

            {/* 4B. HISTORY / RIWAYAT */}
            {onOpenHistory && (
              <button
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
                className="w-full p-2.5 rounded-2xl bg-black/26 border border-white/14 hover:border-white/30 shadow-[0_6px_18px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] transition cursor-pointer flex items-center justify-between gap-2 text-left active:scale-[0.98] group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Clock size={15} className="ze-logo-anim ze-logo-history" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white leading-tight truncate">History / Riwayat</p>
                    <p className="text-[9px] text-zinc-300 leading-tight truncate mt-0.5">Video, chat, download &amp; topup</p>
                  </div>
                </div>
                <ChevronRight size={13} className="text-zinc-300 group-hover:text-white shrink-0" />
              </button>
            )}

            {/* 5. SOON: WEB TO APK */}
            <div
              onClick={() => onComingSoon('Web To APK')}
              className="w-full p-2.5 rounded-2xl bg-black/22 border border-white/12 opacity-85 hover:opacity-100 shadow-[0_6px_18px_rgba(0,0,0,0.55)] transition cursor-pointer flex items-center justify-between gap-1.5 text-left active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/8 border border-white/15 flex items-center justify-center text-zinc-200 shrink-0">
                  <FileCode2 size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white leading-tight truncate">Web To APK</p>
                  <p className="text-[9px] text-zinc-300 leading-tight truncate mt-0.5">App Compiler</p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded-md bg-white/12 text-[8px] font-bold text-zinc-200 border border-white/15 shrink-0">
                SOON
              </span>
            </div>

            {/* 6. SOON: TAG NO */}
            <div
              onClick={() => onComingSoon('Tag No')}
              className="w-full p-2.5 rounded-2xl bg-black/22 border border-white/12 opacity-85 hover:opacity-100 shadow-[0_6px_18px_rgba(0,0,0,0.55)] transition cursor-pointer flex items-center justify-between gap-1.5 text-left active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/8 border border-white/15 flex items-center justify-center text-zinc-200 shrink-0">
                  <PhoneCall size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white leading-tight truncate">Tag No</p>
                  <p className="text-[9px] text-zinc-300 leading-tight truncate mt-0.5">Caller ID</p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded-md bg-white/12 text-[8px] font-bold text-zinc-200 border border-white/15 shrink-0">
                SOON
              </span>
            </div>

            {/* 7. SOON: CLOUD VAULT */}
            <div
              onClick={() => onComingSoon('Cloud Vault')}
              className="w-full p-2.5 rounded-2xl bg-black/22 border border-white/12 opacity-85 hover:opacity-100 shadow-[0_6px_18px_rgba(0,0,0,0.55)] transition cursor-pointer flex items-center justify-between gap-1.5 text-left active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/8 border border-white/15 flex items-center justify-center text-zinc-200 shrink-0">
                  <Cloud size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white leading-tight truncate">Cloud Vault</p>
                  <p className="text-[9px] text-zinc-300 leading-tight truncate mt-0.5">Cloud Storage</p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded-md bg-white/12 text-[8px] font-bold text-zinc-200 border border-white/15 shrink-0">
                SOON
              </span>
            </div>
          </nav>
        </div>

        {/* BOTTOM SECTION: TENTANG APLIKASI */}
        <div className="p-3 border-t border-white/12 mt-auto bg-black/25">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 mt-0.5">
              <Info size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white leading-tight truncate">Tentang Aplikasi</p>
              <p className="text-[9px] text-zinc-300 leading-tight mt-0.5">ZE.io • Versi 2.4.2</p>
              <p className="text-[8px] text-zinc-400 leading-tight mt-0.5 truncate">© 2026 ZE.io by zvn3</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AppSidebar;
