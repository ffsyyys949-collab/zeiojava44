import React, { useId } from 'react';
import { Crown } from 'lucide-react';

export interface UserLike {
  id?: string | number;
  username?: string;
  name?: string;
  role?: string;
  isOwner?: boolean;
  isAdmin?: boolean;
  admin?: boolean;
  isVip?: boolean;
  vip?: boolean;
  vipLevel?: 'basic' | 'exclusive';
  isVipExclusive?: boolean;
  vipExpiresAt?: number;
  verified?: boolean;
  isVerified?: boolean;
  blueTick?: boolean;
  isBlueTick?: boolean;
  [key: string]: any;
}

export function isUserOwner(user?: UserLike | null): boolean {
  if (!user) return false;
  const idStr = String(user.id || '').toUpperCase();
  const unameStr = String(user.username || '').toLowerCase().replace(/^@/, '');
  return (
    idStr === 'ZE-OWNER' ||
    idStr === 'OWNER' ||
    unameStr === 'ze.io' ||
    user.role === 'owner' ||
    user.isOwner === true
  );
}

export function isUserAdmin(user?: UserLike | null): boolean {
  if (!user) return false;
  if (isUserOwner(user)) return false;
  return (
    user.role === 'admin' ||
    user.isAdmin === true ||
    user.admin === true
  );
}

export function isUserVip(user?: UserLike | null): boolean {
  if (!user) return false;
  if (isUserOwner(user)) return true;
  const hasVipFlag = Boolean(
    user.vip ||
      user.isVip ||
      user.role === 'vip' ||
      user.vipLevel === 'basic' ||
      user.vipLevel === 'exclusive' ||
      user.isVipExclusive === true
  );
  if (!hasVipFlag) return false;
  if (user.vipExpiresAt && user.vipExpiresAt > 0) {
    return user.vipExpiresAt > Date.now();
  }
  return true;
}

export function isUserVipExclusive(user?: UserLike | null): boolean {
  if (!user) return false;
  if (isUserOwner(user)) return true;
  if (!isUserVip(user)) return false;
  return (
    String(user.vipLevel || '').toLowerCase() === 'exclusive' ||
    user.isVipExclusive === true
  );
}

/**
 * Custom-designed Royal Blue 5-Pointed Star Badge Icon (non-emoji, non-checkmark)
 * Consistent across VIP BASIC and VIP EKSKLUSIF, positioned to the right of the VIP pill.
 */
function VipBlueStarIcon({ size }: { size: 'xs' | 'sm' | 'md' | 'lg' }) {
  const uid = useId().replace(/:/g, '');
  const dimClass =
    size === 'xs'
      ? 'w-3.5 h-3.5'
      : size === 'sm'
      ? 'w-4 h-4'
      : size === 'md'
      ? 'w-[19px] h-[19px]'
      : 'w-[22px] h-[22px]';

  return (
    <span
      className={`${dimClass} inline-flex items-center justify-center shrink-0 drop-shadow-[0_0_5px_rgba(29,155,240,0.65)]`}
      title="Member Resmi VIP ZE.io"
      aria-label="VIP Blue Star"
    >
      <svg viewBox="0 0 24 24" className="w-full h-full overflow-visible" fill="none">
        <defs>
          <linearGradient id={`vipStarGrad_${uid}`} x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="45%" stopColor="#1D9BF0" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id={`vipStarRim_${uid}`} x1="6" y1="2" x2="18" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        {/* Outer 5-pointed star body */}
        <path
          d="M12 1.85L14.92 8.06L21.75 8.94L16.74 13.7L18.02 20.48L12 17.18L5.98 20.48L7.26 13.7L2.25 8.94L9.08 8.06L12 1.85Z"
          fill={`url(#vipStarGrad_${uid})`}
          stroke={`url(#vipStarRim_${uid})`}
          strokeWidth="1.15"
          strokeLinejoin="round"
        />
        {/* Crisp inner specular facet */}
        <path
          d="M12 5.1L13.78 8.9L17.92 9.44L14.88 12.33L15.65 16.44L12 14.44L8.35 16.44L9.12 12.33L6.08 9.44L10.22 8.9L12 5.1Z"
          fill="#BAE6FD"
          fillOpacity="0.32"
        />
      </svg>
    </span>
  );
}

/**
 * Distinct VIP Crown Icon (separate design from Owner's Crown)
 */
function VipCrownIcon({
  variant,
  size
}: {
  variant: 'basic' | 'exclusive';
  size: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const uid = useId().replace(/:/g, '');
  const px = size === 'xs' || size === 'sm' ? 10 : size === 'md' ? 11.5 : 13;

  if (variant === 'exclusive') {
    return (
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0 drop-shadow-[0_0_4px_rgba(251,191,36,0.85)]"
      >
        <defs>
          <linearGradient id={`vipGoldCrown_${uid}`} x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <path
          d="M3 18.5H21V20.5H3V18.5ZM2.5 7L7.5 11.5L12 4.5L16.5 11.5L21.5 7L19.8 16.5H4.2L2.5 7Z"
          fill={`url(#vipGoldCrown_${uid})`}
          stroke="#FEF9C3"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={`vipSilverCrown_${uid}`} x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="55%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      <path
        d="M3 18.5H21V20.5H3V18.5ZM2.5 7L7.5 11.5L12 4.5L16.5 11.5L21.5 7L19.8 16.5H4.2L2.5 7Z"
        fill={`url(#vipSilverCrown_${uid})`}
      />
    </svg>
  );
}

interface UserRoleBadgeProps {
  user?: UserLike | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function UserRoleBadge({
  user,
  size = 'sm',
  showLabel = true,
  className = ''
}: UserRoleBadgeProps) {
  if (!user) return null;

  const isOwner = isUserOwner(user);
  const isAdmin = isUserAdmin(user);
  const isVip = isUserVip(user);
  const isExclusive = isUserVipExclusive(user);

  const hasLegacyVerified =
    !isOwner &&
    !isAdmin &&
    !isVip &&
    Boolean(user.isVerified || user.verified || user.blueTick || user.isBlueTick);

  if (!isOwner && !isAdmin && !isVip && !hasLegacyVerified) return null;

  const circleSize =
    size === 'xs'
      ? 'w-3.5 h-3.5 text-[8px]'
      : size === 'sm'
      ? 'w-4 h-4 text-[9px]'
      : size === 'md'
      ? 'w-5 h-5 text-[11px]'
      : 'w-6 h-6 text-[13px]';

  const labelSize =
    size === 'xs'
      ? 'text-[8px] px-1.5 py-0.2'
      : size === 'sm'
      ? 'text-[9px] px-1.5 py-0.5'
      : size === 'md'
      ? 'text-[10px] px-2 py-0.5'
      : 'text-[11px] px-2.5 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1 select-none align-middle flex-wrap max-w-full ${className}`}>
      {/* 1. PRIMARY ROLE: OWNER (Centang Biru Resmi + Badge OWNER — TIDAK DIUBAH) */}
      {isOwner && (
        <span className="inline-flex items-center gap-1">
          <span
            className={`${circleSize} bg-[#1D9BF0] rounded-full inline-flex items-center justify-center text-white font-black shadow-sm ring-1 ring-white/25`}
            title="ZE.io Official Owner (Centang Biru)"
          >
            ✓
          </span>
          {showLabel && (
            <span
              className={`${labelSize} bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black uppercase rounded-full shadow-sm inline-flex items-center gap-1 border border-sky-300/40 tracking-wider`}
            >
              <Crown size={size === 'xs' || size === 'sm' ? 9 : 11} />
              OWNER
            </span>
          )}
        </span>
      )}

      {/* 2. PRIMARY ROLE: ADMIN (Centang Perak Resmi + Badge ADMIN) */}
      {isAdmin && (
        <span className="inline-flex items-center gap-1">
          <span
            className={`${circleSize} rounded-full bg-gradient-to-tr from-zinc-400 via-white to-slate-300 text-zinc-950 font-black inline-flex items-center justify-center shadow-[0_0_8px_rgba(226,232,240,0.45)] border border-white/80`}
            title="Administrator Resmi ZE.io (Centang Perak)"
          >
            ✓
          </span>
          {showLabel && size !== 'xs' && (
            <span
              className={`${labelSize} bg-gradient-to-r from-slate-200 via-white to-zinc-300 text-zinc-950 font-extrabold uppercase rounded-full shadow-sm border border-white/60 tracking-wider`}
            >
              ADMIN
            </span>
          )}
        </span>
      )}

      {/* 3. VIP BADGE (VIP BASIC & VIP EKSKLUSIF — Bentuk Pill seperti Owner + Bintang Biru di Kanan) */}
      {!isOwner && isVip && (
        <span className="inline-flex items-center gap-1.5">
          {isExclusive ? (
            <>
              {showLabel ? (
                <span
                  className={`${labelSize} bg-gradient-to-r from-[#3B2500] via-[#6B4400] to-[#3B2500] border border-amber-400/90 rounded-full shadow-[0_0_14px_rgba(251,191,36,0.48),inset_0_1px_1px_rgba(254,240,138,0.35)] inline-flex items-center gap-1 whitespace-nowrap leading-none`}
                  title="VIP EKSKLUSIF ZE.io"
                >
                  <VipCrownIcon variant="exclusive" size={size} />
                  <span className="bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-400 bg-clip-text text-transparent font-black uppercase tracking-wider">
                    VIP EKSKLUSIF
                  </span>
                </span>
              ) : (
                <span
                  className={`${labelSize} bg-gradient-to-r from-[#3B2500] via-[#6B4400] to-[#3B2500] border border-amber-400/90 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.45)] inline-flex items-center justify-center`}
                  title="VIP EKSKLUSIF ZE.io"
                >
                  <VipCrownIcon variant="exclusive" size={size} />
                </span>
              )}
              <VipBlueStarIcon size={size} />
            </>
          ) : (
            <>
              {showLabel ? (
                <span
                  className={`${labelSize} bg-gradient-to-r from-slate-300 via-white to-sky-200 text-slate-900 font-black uppercase rounded-full shadow-[0_0_10px_rgba(56,189,248,0.28),inset_0_1px_0_rgba(255,255,255,0.95)] inline-flex items-center gap-1 border border-sky-400/85 tracking-wider whitespace-nowrap leading-none`}
                  title="VIP BASIC ZE.io"
                >
                  <VipCrownIcon variant="basic" size={size} />
                  <span>VIP BASIC</span>
                </span>
              ) : (
                <span
                  className={`${labelSize} bg-gradient-to-r from-slate-300 via-white to-sky-200 border border-sky-400/85 rounded-full shadow-sm inline-flex items-center justify-center`}
                  title="VIP BASIC ZE.io"
                >
                  <VipCrownIcon variant="basic" size={size} />
                </span>
              )}
              <VipBlueStarIcon size={size} />
            </>
          )}
        </span>
      )}

      {/* 4. LEGACY VERIFIED (Centang biru akun terverifikasi asli, tidak diubah) */}
      {hasLegacyVerified && (
        <span
          className={`${circleSize} bg-[#1D9BF0] rounded-full inline-flex items-center justify-center text-white font-black shadow-sm`}
          title="Terverifikasi"
        >
          ✓
        </span>
      )}
    </span>
  );
}

export default UserRoleBadge;
