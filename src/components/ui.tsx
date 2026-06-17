/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

// Card with a classic editorial feel - keyline borders, subtle background, clean margins
export function Card({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  // If the caller supplies its own background (e.g. a dark pitch/ledger card),
  // don't layer the default white bg under it — Tailwind can't reliably resolve
  // two competing bg-* utilities, which was silently rendering dark cards light
  // and hiding their light text.
  const hasOwnBg = /(?:^|\s)!?bg-/.test(className);
  const bgClasses = hasOwnBg
    ? ''
    : 'bg-white/70 hover:bg-white/85';
  return (
    <div
      id={id}
      className={`backdrop-blur-lg ${bgClasses} border border-white/60 rounded-2xl p-6 md:p-8 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] relative ${className}`}
    >
      {children}
    </div>
  );
}

// Section Header with elegant premium layouts
export function SectionTitle({
  kicker,
  title,
  subtitle,
  rightSlot,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 justify-start text-left mb-6 w-full">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          {kicker && (
            <span className="font-mono text-[9px] tracking-widest text-[#2E4A3F] uppercase font-bold block">
              {kicker}
            </span>
          )}
          <h3 className="font-sans text-2xl md:text-3xl font-light text-stone-900 tracking-tight leading-tight">
            {title}
          </h3>
        </div>
        {rightSlot && <div className="shrink-0 self-start md:self-auto">{rightSlot}</div>}
      </div>
      {subtitle && (
        <p className="text-stone-500 font-sans text-xs md:text-sm font-light max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Numerical Stat - glass panel, mono font, no-vibration values, clean layout
export function Stat({
  label,
  value,
  subtext,
  tone = 'neutral',
  prefix,
  suffix,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger';
  prefix?: string;
  suffix?: string;
}) {
  const toneColors = {
    neutral: 'bg-white/50 text-stone-950 border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:bg-white/75',
    accent: 'bg-sky-50/40 text-sky-950 border-sky-100/50 hover:bg-sky-50/60 shadow-[0_8px_30px_rgb(0,0,0,0.012)]',
    success: 'bg-emerald-50/40 text-emerald-950 border-emerald-100/50 hover:bg-emerald-50/60 shadow-[0_8px_30px_rgb(0,0,0,0.012)]',
    warn: 'bg-amber-50/40 text-amber-950 border-amber-100/50 hover:bg-amber-50/60 shadow-[0_8px_30px_rgb(0,0,0,0.012)]',
    danger: 'bg-rose-50/40 text-rose-950 border-rose-100/50 hover:bg-rose-50/60 shadow-[0_8px_30px_rgb(0,0,0,0.012)]',
  };

  return (
    <div className={`p-6 border backdrop-blur-md rounded-2xl text-left transition-all duration-300 ${toneColors[tone]}`}>
      <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest block mb-2 font-medium">
        {label}
      </span>
      <div className="flex items-baseline gap-0.5">
        {prefix && <span className="font-sans text-lg font-light text-stone-300 mr-0.5">{prefix}</span>}
        <span className="font-mono text-3.5xl font-normal tracking-tight tabular-nums text-stone-900">
          {value}
        </span>
        {suffix && <span className="font-sans text-xs font-light text-stone-405 ml-1">{suffix}</span>}
      </div>
      {subtext && <p className="text-[11px] font-sans text-stone-400 mt-2 font-light leading-snug">{subtext}</p>}
    </div>
  );
}

// ISO Country Flag map converter - upgraded to clean historic-geographic visual emblems
export function FlagEmoji({ countryCode }: { countryCode: string }) {
  const code = countryCode.toUpperCase().substring(0, 2);
  return (
    <span 
      className="inline-flex items-center justify-center px-1.5 py-0.5 bg-stone-950 border border-stone-850 text-emerald-400 font-mono text-[8.5px] font-bold tracking-wider rounded-xs mr-1.5 select-none hover:border-emerald-500/30 transition-colors cursor-help shrink-0 aline-middle"
      title={`Origin: ${code}`}
    >
      {code}
    </span>
  );
}

// Simple Pill badge
export function Pill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'accent';
}) {
  const styles = {
    neutral: 'bg-stone-100 text-stone-700 border-stone-250',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-150',
    warn: 'bg-amber-50/80 text-amber-800 border-amber-150',
    danger: 'bg-rose-50/80 text-rose-800 border-rose-150',
    accent: 'bg-blue-50 text-blue-800 border-blue-150',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-xs border text-[10px] font-mono tracking-wide ${styles[tone]}`}>
      {label}
    </span>
  );
}

// Confidence Chip: color codes independent estimates
export function ConfidenceChip({ level }: { level: 'low' | 'medium' | 'high' }) {
  const configs = {
    high: { text: 'high certainty', style: 'text-emerald-800 bg-emerald-500/10 border-emerald-500/20' },
    medium: { text: 'moderate uncertainty', style: 'text-amber-800 bg-amber-500/10 border-amber-500/20' },
    low: { text: 'high uncertainty', style: 'text-rose-700 bg-rose-500/10 border-rose-500/20' },
  };

  const current = configs[level];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-mono whitespace-nowrap font-medium ${current.style}`}>
      {current.text}
    </span>
  );
}

// Range Badge bounds component - Ensures that every single independent estimate on any view is rendered as a range
export function RangeBadge({
  low,
  high,
  level = 'high',
}: {
  low: number;
  high: number;
  level?: 'low' | 'medium' | 'high';
}) {
  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <span className="font-mono text-xs font-semibold text-stone-800 whitespace-nowrap bg-white/40 border border-stone-200/50 px-2.5 py-0.5 rounded-full">
        {low.toFixed(2)}–{high.toFixed(2)} <span className="text-[10px] font-light text-stone-400">tCO₂/t</span>
      </span>
      <ConfidenceChip level={level} />
    </div>
  );
}

// The core private watch / alarm item
export function VerifyBadge({ severity, explanation }: { severity: 'watch' | 'priority'; explanation?: string }) {
  const configs = {
    watch: {
      bg: 'bg-amber-500/10 text-amber-900 border-amber-550/20',
      text: 'Triage Watch',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-700" />,
    },
    priority: {
      bg: 'bg-rose-500/10 text-rose-900 border-rose-550/20',
      text: 'Verification Priority',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-700 animate-pulse" />,
    },
  };

  const current = configs[severity];

  return (
    <div className="inline-flex items-center gap-1.5 relative group">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-xs font-medium cursor-help transition-all ${current.bg}`}>
        {current.icon}
        <span>{current.text}</span>
      </span>
      {/* Tooltip highlighting the privacy boundary to comply with audit specifications */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-72 bg-stone-900/90 backdrop-blur-md text-[#f5f5f7] text-[10.5px] font-sans leading-relaxed p-4 rounded-xl border border-white/20 shadow-xl transition-all">
        <span className="text-amber-400 font-mono text-[9px] tracking-wider font-bold block mb-1">🔒 IMPORTER PRIVATE SIGNAL</span>
        {explanation || 'Divergence metrics indicate likely risk. This signal is restricted to importers and is not a public claim.'}
      </span>
    </div>
  );
}
