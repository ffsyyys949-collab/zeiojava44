import React from 'react';

interface DiamondPlusIconProps {
  size?: number;
  className?: string;
  showPlus?: boolean;
}

/**
 * Custom Geometric Diamond+ Icon (White/Silver Faceted Gem with Specular Highlight)
 * Designed strictly as an original vector mark (never a keyboard emoji).
 */
export function DiamondPlusIcon({
  size = 20,
  className = '',
  showPlus = false
}: DiamondPlusIconProps) {
  const gradientId = React.useId();
  const facetTopId = React.useId();
  const facetSideId = React.useId();

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle select-none relative ${className}`}
      style={{ width: size, height: size }}
      aria-label="Diamond+"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
      >
        <defs>
          {/* Main brilliant silver/white gradient */}
          <linearGradient id={gradientId} x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#E2E8F0" />
            <stop offset="70%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>

          {/* Top table facet highlight */}
          <linearGradient id={facetTopId} x1="32" y1="8" x2="32" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.7" />
          </linearGradient>

          {/* Side pavilion facet shading */}
          <linearGradient id={facetSideId} x1="10" y1="24" x2="54" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F1F5F9" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#64748B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Outer Faceted Diamond Contour */}
        {/* Points: Crown Top (18,10) to (46,10), Upper Girdle (58,24), Culet (32,56), Upper Left (6,24) */}
        
        {/* Lower Pavilion Center */}
        <polygon points="32,24 20,24 32,56" fill="url(#facetSideId)" stroke="#FFFFFF" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="32,24 44,24 32,56" fill="url(#gradientId)" stroke="#FFFFFF" strokeWidth="1" strokeLinejoin="round" />

        {/* Lower Pavilion Wings */}
        <polygon points="6,24 20,24 32,56" fill="#64748B" fillOpacity="0.8" stroke="#FFFFFF" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="58,24 44,24 32,56" fill="#94A3B8" fillOpacity="0.9" stroke="#FFFFFF" strokeWidth="1" strokeLinejoin="round" />

        {/* Crown Table (Top center) */}
        <polygon points="22,10 42,10 48,24 16,24" fill="url(#facetTopId)" stroke="#FFFFFF" strokeWidth="1.2" strokeLinejoin="round" />

        {/* Crown Upper Left Facet */}
        <polygon points="22,10 16,24 6,24" fill="#E2E8F0" fillOpacity="0.9" stroke="#FFFFFF" strokeWidth="1" strokeLinejoin="round" />

        {/* Crown Upper Right Facet */}
        <polygon points="42,10 48,24 58,24" fill="#CBD5E1" fillOpacity="0.85" stroke="#FFFFFF" strokeWidth="1" strokeLinejoin="round" />

        {/* Specular Glint Highlight (Upper Table) */}
        <path
          d="M 28 14 L 36 14 L 32 18 Z"
          fill="#FFFFFF"
          fillOpacity="0.9"
        />

        {/* Optional Micro Plus Tag embedded inside icon if requested */}
        {showPlus && (
          <g transform="translate(42, 38)">
            <circle cx="9" cy="9" r="8" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M 9 5 L 9 13 M 5 9 L 13 9" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </span>
  );
}

export default DiamondPlusIcon;
