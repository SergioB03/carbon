import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * LogoIcon - A highly crafted, crisp geometric inline SVG logo mark.
 * Combines a botanical leaf (decarbonization) with a structure reminiscent of
 * both an orbital satellite dish and an elegant arched bridge deck.
 */
export function LogoIcon({ className = '', size = 24 }: LogoProps) {
  return (
    <svg
      id="cb-logo-svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none transition-transform duration-300 hover:scale-105 active:scale-95 ${className}`}
    >
      <defs>
        {/* Soft emerald ecological leaf gradient */}
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="40%" stopColor="#059669" />
          <stop offset="100%" stopColor="#115E59" />
        </linearGradient>

        {/* Technical verification/satellite blue gradient */}
        <linearGradient id="techGrad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>

        {/* High-end signature rust/amber focal point */}
        <linearGradient id="beaconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E11D48" />
          <stop offset="50%" stopColor="#b24c30" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        
        {/* Soft drop shadow for subtle depth */}
        <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.06" />
        </filter>
      </defs>

      {/* SATELLITE RANGE GRID (Top outer arcs, indicating space observations scanning down) */}
      <path
        d="M 15 35 A 42 42 0 0 1 85 35"
        stroke="url(#techGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="3 4"
        className="opacity-30 origin-center animate-pulse"
      />
      <path
        d="M 28 42 A 28 28 0 0 1 72 42"
        stroke="url(#techGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 3"
        className="opacity-50"
      />

      {/* THE BRIDGE STRUCTURE (Swooping arc bridging the terrestrial to the celestial) */}
      <path
        d="M 12 75 C 30 45, 70 45, 88 75"
        stroke="#E2E8F0"
        strokeWidth="6.5"
        strokeLinecap="round"
        className="opacity-90"
      />
      {/* Highlighting verified corridor flow within the bridge */}
      <path
        d="M 20 72 C 35 51, 65 51, 80 72"
        stroke="url(#techGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="opacity-70"
      />

      {/* THE BIOSPHERE LEAF (Botanical carbon sink backdrop, angled beautifully at 45 degrees) */}
      <g filter="url(#subtleShadow)">
        {/* Leaf blade */}
        <path
          d="M 50 32 C 64 32, 74 42, 74 56 C 74 70, 64 80, 50 80 C 36 80, 26 70, 26 56 C 26 42, 36 32, 50 32 Z"
          fill="url(#leafGrad)"
          fillOpacity="0.12"
          stroke="url(#leafGrad)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Central stem/rib tracking upward */}
        <path
          d="M 50 80 C 50 64, 53 50, 63 38"
          stroke="url(#leafGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* METEOROLOGICAL OBSERVED BEACON (The Ground Truth Node - shining and pulsing) */}
      <g>
        {/* Radar ping ring */}
        <circle
          cx="63"
          cy="38"
          r="9"
          stroke="url(#beaconGrad)"
          strokeWidth="1"
          className="opacity-40 animate-ping origin-center"
          style={{ transformOrigin: '63px 38px', animationDuration: '2.5s' }}
        />
        {/* Inner solid core */}
        <circle
          cx="63"
          cy="38"
          r="4.2"
          fill="url(#beaconGrad)"
          className="shadow-sm"
        />
        {/* Secondary helper node */}
        <circle
          cx="37"
          cy="62"
          r="3"
          fill="#115E59"
          className="opacity-80"
        />
        {/* Link line */}
        <path
          d="M 37 62 L 50 56"
          stroke="#115E59"
          strokeWidth="1.2"
          strokeDasharray="2 2"
          className="opacity-50"
        />
      </g>
    </svg>
  );
}

/**
 * LogoFull - The visual brand asset, pairing the LogoIcon with custom
 * display typography. Ideal for headers, splash screens, or navigation rails.
 */
export function LogoFull({ className = '', size = 26 }: LogoProps) {
  return (
    <div id="cb-logo-full" className={`flex items-center gap-3 select-none group ${className}`}>
      <LogoIcon size={size} className="shrink-0" />
      <div className="leading-none mt-0.5">
        <span className="font-sans text-lg tracking-tight text-stone-900 uppercase font-bold leading-none block transition-colors group-hover:text-emerald-950">
          CARBONBRIDGE<span className="text-[#b24c30] italic font-semibold">.</span>
        </span>
        <span className="font-mono text-[8.5px] text-stone-400 block tracking-widest uppercase mt-1 font-medium group-hover:text-stone-500 transition-colors">
          EORI NL812493579
        </span>
      </div>
    </div>
  );
}
