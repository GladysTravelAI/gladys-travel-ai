import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

// ─── MAIN LOGO ────────────────────────────────────────────────────────────────

export default function Logo({
  size = 40,
  className = "",
  showText = true,
  variant = 'dark'
}: LogoProps) {
  // Scale the wordmark proportionally based on size
  const scale  = size / 40;
  const wWidth = Math.round(260 * scale);
  const wHeight= Math.round(56 * scale);

  return (
    <div className={`flex items-center ${className}`}>
      {showText ? (
        <Wordmark width={wWidth} height={wHeight} variant={variant} />
      ) : (
        <AppIcon size={size} />
      )}
    </div>
  );
}

// ─── WORDMARK ─────────────────────────────────────────────────────────────────
// Matches image top: GladysTravel.com + plane arc + smile arc

function Wordmark({ width = 260, height = 56, variant = 'dark' }: {
  width?: number; height?: number; variant?: 'light' | 'dark'
}) {
  const gladysColor = variant === 'light' ? '#FFFFFF'  : '#1A2D6B'  // Dark navy
  const travelColor = variant === 'light' ? '#7DD3FC'  : '#2B7FD4'  // Medium blue
  const dotComColor = variant === 'light' ? '#7DD3FC'  : '#2B7FD4'  // Same as Travel
  const smileColor  = variant === 'light' ? 'rgba(56,189,248,0.8)' : '#38BDF8'
  const planeColor  = variant === 'light' ? '#FFFFFF'  : '#1A2D6B'

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 260 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Orange → transparent trail going left to right, bottom to top */}
        <linearGradient id="wm_trail" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#F97316" stopOpacity="0"  />
          <stop offset="30%"  stopColor="#F97316" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#FBBF24" stopOpacity="1"  />
        </linearGradient>
        {/* Smile gradient */}
        <linearGradient id="wm_smile" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={smileColor} stopOpacity="0.2"/>
          <stop offset="40%"  stopColor={smileColor} stopOpacity="1"  />
          <stop offset="100%" stopColor={smileColor} stopOpacity="0.3"/>
        </linearGradient>
      </defs>

      {/* ── Smile arc — sits just below text baseline ── */}
      {/* Sweeps from left edge to right edge of full wordmark */}
      <path
        d="M 2 44 Q 115 58 228 44"
        stroke="url(#wm_smile)"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Orange trail — from ~midpoint sweeping to plane ── */}
      <path
        d="M 155 30 Q 178 15 198 2"
        stroke="url(#wm_trail)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Plane at top-right ── */}
      {/* Rotated ~-35deg, pointing top-right */}
      <g transform="translate(205, -2) rotate(-35)">
        {/* Fuselage */}
        <ellipse cx="0" cy="0" rx="10" ry="4.5" fill={planeColor} />
        {/* Top wing */}
        <path d="M -3 -1 L -12 -8 L -9 -8 L 1 -3 Z" fill={planeColor} />
        {/* Bottom wing */}
        <path d="M -3  1 L -12  8 L -9  8 L 1  3 Z" fill={planeColor} />
        {/* Tail */}
        <path d="M -7 -1 L -12 -5 L -10 -5 L -5 -1 Z" fill={planeColor} opacity="0.85" />
      </g>

      {/* ── Text: Gladys ── dark navy, heavy */}
      <text
        x="0"
        y="37"
        fontFamily="'DM Sans', 'Plus Jakarta Sans', -apple-system, sans-serif"
        fontWeight="900"
        fontSize="36"
        letterSpacing="-1.2"
        fill={gladysColor}
      >
        Gladys
      </text>

      {/* ── Text: Travel ── medium blue, regular weight */}
      <text
        x="128"
        y="37"
        fontFamily="'DM Sans', 'Plus Jakarta Sans', -apple-system, sans-serif"
        fontWeight="500"
        fontSize="36"
        letterSpacing="-0.8"
        fill={travelColor}
      >
        Travel
      </text>

      {/* ── Text: .com ── same blue, smaller, baseline-aligned */}
      <text
        x="231"
        y="37"
        fontFamily="'DM Sans', 'Plus Jakarta Sans', -apple-system, sans-serif"
        fontWeight="400"
        fontSize="22"
        letterSpacing="0"
        fill={dotComColor}
      >
        .com
      </text>
    </svg>
  );
}

// ─── APP ICON ─────────────────────────────────────────────────────────────────
// Matches image bottom: gradient blue square, stacked Gladys/Travel/.com + plane + orange smile

function AppIcon({ size = 40 }: { size?: number }) {
  const id = `ai_${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Sky blue gradient — lighter top-right, deeper bottom-left, matches image */}
        <linearGradient id={`${id}_bg`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#4FC3F7" />
          <stop offset="40%"  stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
        {/* Orange trail */}
        <linearGradient id={`${id}_trail`} x1="0%" y1="100%" x2="85%" y2="0%">
          <stop offset="0%"   stopColor="#F97316" stopOpacity="0"  />
          <stop offset="40%"  stopColor="#F97316" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#FBBF24"                  />
        </linearGradient>
        {/* Orange smile */}
        <linearGradient id={`${id}_smile`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#F97316" stopOpacity="0.3"/>
          <stop offset="50%"  stopColor="#FBBF24"                  />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.3"/>
        </linearGradient>
        <clipPath id={`${id}_clip`}>
          <rect width="100" height="100" rx="22" />
        </clipPath>
      </defs>

      {/* Background */}
      <rect width="100" height="100" rx="22" fill={`url(#${id}_bg)`} />
      {/* Subtle border */}
      <rect width="100" height="100" rx="22" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

      {/* Orange trail sweeping from bottom-left area up to plane */}
      <path
        d="M 14 75 Q 45 45 72 14"
        stroke={`url(#${id}_trail)`}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        clipPath={`url(#${id}_clip)`}
      />

      {/* Plane at top-right */}
      <g transform="translate(74, 12) rotate(-38)">
        <ellipse cx="0" cy="0" rx="9" ry="4" fill="white" />
        <path d="M -2 -0.5 L -10 -7 L -7.5 -7 L 1 -2.5 Z" fill="white" />
        <path d="M -2  0.5 L -10  7 L -7.5  7 L 1  2.5 Z" fill="white" />
        <path d="M -6 -0.5 L -10 -4 L -8.5 -4 L -4.5 -0.5 Z" fill="white" opacity="0.8" />
      </g>

      {/* Orange smile arc at bottom */}
      <path
        d="M 12 82 Q 50 96 88 82"
        stroke={`url(#${id}_smile)`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        clipPath={`url(#${id}_clip)`}
      />

      {/* Text: Gladys — white bold, left-aligned */}
      <text
        x="12"
        y="52"
        fontFamily="'DM Sans', 'Plus Jakarta Sans', -apple-system, sans-serif"
        fontWeight="800"
        fontSize="22"
        letterSpacing="-0.5"
        fill="white"
      >
        Gladys
      </text>

      {/* Text: Travel — light cyan, below Gladys */}
      <text
        x="12"
        y="68"
        fontFamily="'DM Sans', 'Plus Jakarta Sans', -apple-system, sans-serif"
        fontWeight="500"
        fontSize="18"
        letterSpacing="-0.3"
        fill="#7DD3FC"
      >
        Travel
      </text>

      {/* Text: .com — small, below Travel */}
      <text
        x="12"
        y="81"
        fontFamily="'DM Sans', 'Plus Jakarta Sans', -apple-system, sans-serif"
        fontWeight="400"
        fontSize="12"
        letterSpacing="0"
        fill="rgba(125,211,252,0.8)"
      >
        .com
      </text>
    </svg>
  );
}

// ─── COMPACT (favicon / small) ────────────────────────────────────────────────

export function LogoCompact({ size = 32 }: { size?: number }) {
  return <AppIcon size={size} />;
}