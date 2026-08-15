import React from "react";

interface LanguageTwinLogoProps {
  className?: string;
  size?: number;
}

/**
 * LanguageTwinLogo: A high-fidelity visual mashup of Google Translate & the Gemini AI 4-point sparkle.
 * Features the signature Google Translate dual-language badge ('文' / 'A') 
 * fused with Gemini's curved celestial 4-point star burst and gradient glow.
 */
export const LanguageTwinLogo: React.FC<LanguageTwinLogoProps> = ({
  className = "w-10 h-10",
  size,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-200/50 ${className}`}
      style={style}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full rounded-[14px] overflow-hidden"
      >
        <defs>
          {/* Google Translate Blue Tile Gradient */}
          <linearGradient id="gtBgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1A73E8" />
            <stop offset="60%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>

          {/* Secondary Translation Plate */}
          <linearGradient id="plateGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.06" />
          </linearGradient>

          {/* Gemini Sparkle Gradient */}
          <linearGradient id="geminiGrad" x1="18" y1="6" x2="44" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#93C5FD" />
            <stop offset="70%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>

          {/* Soft Glow Filter */}
          <filter id="geminiGlow" x="14" y="2" width="34" height="34" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base Background Rounded Square */}
        <rect width="48" height="48" rx="13" fill="url(#gtBgGrad)" />

        {/* Google Translate Left/Back Plate (White Translucent) with '文' glyph */}
        <rect
          x="6"
          y="13"
          width="24"
          height="28"
          rx="6"
          fill="url(#plateGrad)"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
        />

        {/* Stylized Google Translate '文' (Language) Glyph */}
        <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
          {/* Top dot & horizontal bar */}
          <circle cx="18" cy="18" r="1" fill="#FFFFFF" stroke="none" />
          <path d="M11 22H25" />
          {/* Lower cross/legs of 文 */}
          <path d="M21 24L14 36" />
          <path d="M15 26Q22 30 25 36" fill="none" />
        </g>

        {/* Google Translate Latin 'A' / Dialogue Glyph on right card */}
        <path
          d="M33 26L28 39H31L32 36H36L37 39H40L35 26H33ZM33.8 31.5L34.8 29L35.8 31.5H33.8Z"
          fill="#FFFFFF"
          opacity="0.85"
        />

        {/* Gemini Signature 4-Point Curved Sparkle / Star (Top-Right Nexus) */}
        <g filter="url(#geminiGlow)">
          {/* Main Gemini Star */}
          <path
            d="M36 6 C36 13 43 13 43 13 C43 13 36 13 36 20 C36 13 29 13 29 13 C29 13 36 13 36 6 Z"
            fill="url(#geminiGrad)"
          />
          {/* Mini companion satellite Gemini spark */}
          <path
            d="M27 7 C27 9.5 29.5 9.5 29.5 9.5 C29.5 9.5 27 9.5 27 12 C27 9.5 24.5 9.5 24.5 9.5 C24.5 9.5 27 9.5 27 7 Z"
            fill="#FFFFFF"
            opacity="0.9"
          />
        </g>

        {/* Tiny lower accent sparkle */}
        <circle cx="39" cy="22" r="1" fill="#93C5FD" />
      </svg>
    </div>
  );
};
