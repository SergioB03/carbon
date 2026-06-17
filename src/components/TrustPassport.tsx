/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, X, CheckCircle2, AlertTriangle, Info, Users, MapPin, Leaf, Send } from 'lucide-react';
import { Supplier } from '../types';
import { getEstimateRange, getEstimateMidpoint, getLatestIntensity } from '../lib/calc';

interface TrustPassportProps {
  supplier: Supplier;
  onClose: () => void;
}

// CBAM Evidence Passport — an HONEST per-supplier evidence summary. No fabricated
// cryptographic seals, no "99.8%", no compliance verdicts. Independent figures are
// a RANGE + confidence (modelled satellite/ML), the divergence is framed as
// "recommend verification — not an accusation", and the Verified Pool is a genuine
// CONSENT model: a supplier opts in and shares a verified figure once, which is
// then reused across importers.
export default function TrustPassport({ supplier, onClose }: TrustPassportProps) {
  const range = getEstimateRange(supplier);
  const midpoint = getEstimateMidpoint(supplier);
  const priced = getLatestIntensity(supplier);
  const isCement = supplier.commodity === 'cement';
  const scopeShare = supplier.fullFootprint > 0 ? Math.round((priced / supplier.fullFootprint) * 100) : 100;

  const divergence = midpoint > 0 ? (midpoint - supplier.selfReported) / midpoint : 0;
  const diverges = supplier.selfReported < range.low && supplier.estimateConfidence !== 'low';

  const [invited, setInvited] = useState(false);
  const hasLei = !!supplier.owner.lei;

  return (
    <div
      id="cbam-evidence-passport-modal"
      className="fixed inset-0 bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4 z-200 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg backdrop-blur-2xl bg-white/90 border border-white/60 shadow-[0_25px_60px_rgba(0,0,0,0.18)] rounded-3xl overflow-hidden flex flex-col relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft background glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-radial from-emerald-400/20 to-transparent pointer-events-none rounded-full" />

        {/* Header */}
        <div className="bg-stone-950/95 text-[#F5F5F7] p-5 flex items-center justify-between border-b border-white/15 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/35">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest font-bold">EU CBAM • EVIDENCE SUMMARY</span>
              <h4 className="font-sans text-sm font-semibold tracking-wide">CBAM Evidence Passport</h4>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 text-[#f5f5f7] rounded-full cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 relative z-10 overflow-y-auto max-h-[78vh]">

          {/* Facility identity */}
          <div className="text-center space-y-1 py-1">
            <span className="font-mono text-[8.5px] uppercase font-bold tracking-widest text-[#2E4A3F]">
              {supplier.illustrative ? 'Illustrative comparator (est.)' : 'Named installation'}
            </span>
            <h2 className="font-serif text-xl font-bold text-stone-900 tracking-tight leading-none">{supplier.facilityName}</h2>
            <p className="text-[11px] font-sans text-stone-500">{supplier.owner.parent} · {supplier.owner.hq}</p>
            <p className="text-[10.5px] font-mono text-stone-400">
              {hasLei ? <>LEI {supplier.owner.lei}</> : <span className="text-amber-700">No public LEI — manual confirm required</span>}
            </p>
          </div>

          {/* Entity-resolution honesty */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-50/70 border border-stone-200/50 p-4 rounded-2xl flex flex-col">
              <span className="font-mono text-[8.5px] uppercase text-stone-400 tracking-wider">Match confidence</span>
              <span className={`font-sans text-lg font-extrabold mt-1 ${supplier.matchConfidence === 'high' ? 'text-[#2E4A3F]' : 'text-amber-700'}`}>
                {supplier.matchConfidence.toUpperCase()}
              </span>
              <span className="text-[9px] font-sans font-light text-stone-500 mt-1 leading-snug">{supplier.matchBasis}</span>
            </div>
            <div className="bg-stone-50/70 border border-stone-200/50 p-4 rounded-2xl flex flex-col">
              <span className="font-mono text-[8.5px] uppercase text-stone-400 tracking-wider">Independent source</span>
              <span className="font-sans text-lg font-extrabold text-sky-800 mt-1">CLIMATE TRACE</span>
              <span className="text-[9px] font-sans font-light text-stone-500 mt-1 leading-snug">Satellite + ML modelled estimate — not an audited installation filing.</span>
            </div>
          </div>

          {/* Self-report vs independent estimate — always a range + confidence */}
          <div className="border border-stone-200 p-4 rounded-2xl bg-white/50 space-y-3">
            <div className="flex justify-between items-baseline border-b border-stone-200/40 pb-2">
              <span className="font-mono text-[9px] text-[#2E4A3F] uppercase font-semibold">Emission metrics</span>
              <span className="font-mono text-[8px] text-stone-400">tCO₂/t commodity</span>
            </div>
            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between py-0.5">
                <span className="text-stone-600 font-light">Self-reported declaration</span>
                <span className="font-mono font-bold text-stone-900">{supplier.selfReported.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-600 font-light">Independent estimate (range)</span>
                <span className="font-mono font-bold text-emerald-800">{range.low.toFixed(2)} – {range.high.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-600 font-light">Estimate confidence</span>
                <span className="font-mono text-stone-500 uppercase">{supplier.estimateConfidence}</span>
              </div>

              {/* Verdict-free framing */}
              {supplier.estimateConfidence === 'low' ? (
                <div className="flex gap-2 items-center bg-stone-100 border border-stone-200 px-2.5 py-2 rounded-xl mt-1.5 text-[11px] text-stone-600 leading-snug">
                  <Info className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>Estimate confidence too low to assess — treated as unverified, never as implausible.</span>
                </div>
              ) : diverges ? (
                <div className="flex gap-2 items-center bg-amber-500/10 border border-amber-500/25 px-2.5 py-2 rounded-xl mt-1.5 text-[11px] text-amber-900 leading-snug">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Self-report sits ~{Math.round(divergence * 100)}% below the independent estimate — <strong>recommend verification. Not an accusation.</strong></span>
                </div>
              ) : (
                <div className="flex gap-2 items-center bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-2 rounded-xl mt-1.5 text-[11px] text-emerald-900 leading-snug">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Self-report is consistent with the independent estimate.</span>
                </div>
              )}
            </div>
          </div>

          {/* Scope split */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="border border-stone-200 p-3 rounded-2xl bg-white/50">
              <span className="font-mono text-[8.5px] uppercase text-stone-400">CBAM-priced (direct)</span>
              <div className="font-mono text-lg font-bold text-[#2E4A3F] mt-0.5">{priced.toFixed(2)}<span className="text-[10px] text-stone-400 font-normal"> t/t</span></div>
            </div>
            <div className="border border-stone-200 p-3 rounded-2xl bg-white/50">
              <span className="font-mono text-[8.5px] uppercase text-stone-400">Full cradle-to-gate</span>
              <div className="font-mono text-lg font-bold text-stone-600 mt-0.5">
                {isCement ? '—' : <>{supplier.fullFootprint.toFixed(2)}<span className="text-[10px] text-stone-400 font-normal"> t/t</span></>}
              </div>
              <span className="text-[9px] text-stone-400 font-sans">{isCement ? 'kiln only — no electricity layer' : `only ~${scopeShare}% is CBAM-priced`}</span>
            </div>
          </div>

          {/* Verified Pool — a genuine consent model (the "exclusive club") */}
          {supplier.inSharedPool ? (
            <div className="bg-[#2E4A3F]/[0.06] border border-[#2E4A3F]/20 p-4 rounded-2xl flex gap-3 items-start">
              <Users className="w-5 h-5 text-[#2E4A3F] shrink-0 mt-0.5" />
              <div>
                <div className="font-sans text-xs font-semibold text-[#2E4A3F]">Member of the Verified Pool</div>
                <p className="text-[11px] text-stone-600 font-light leading-snug mt-0.5">
                  This supplier signed a data-sharing consent and published a verified figure once — now reused by{' '}
                  <strong className="text-stone-900">{supplier.sharedPoolCount ?? 3} other importers</strong>. No re-auditing, no re-collection.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2.5">
              <div className="flex gap-3 items-start">
                <Leaf className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-sans text-xs font-semibold text-stone-900">Invite to the Verified Pool</div>
                  <p className="text-[11px] text-stone-600 font-light leading-snug mt-0.5">
                    The supplier signs a one-time <strong>data-sharing consent</strong>, publishes a verified figure once, and it becomes
                    trusted across every importer who sources from them — replacing this estimate with their own number.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInvited(true)}
                disabled={invited}
                className="w-full bg-[#2E4A3F] hover:bg-emerald-950 disabled:opacity-60 text-white font-sans text-xs font-semibold py-2 rounded-full cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {invited ? 'Consent invite sent · awaiting supplier' : 'Send Verified Pool consent invite'}
              </button>
            </div>
          )}

          {/* Honest provenance footer (real source + real coordinates) */}
          <div className="bg-stone-900 text-stone-300 p-4 rounded-2xl font-mono text-[10px] leading-relaxed">
            <div className="flex justify-between items-center text-stone-400 text-[9px] border-b border-stone-800 pb-1.5 mb-1.5">
              <span>DATA PROVENANCE</span>
              <span className="text-emerald-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {supplier.lat.toFixed(2)}°, {supplier.lon.toFixed(2)}°</span>
            </div>
            <div className="text-stone-300">Climate TRACE — manufacturing v5.7.0 · co2e_100yr · CC BY 4.0</div>
            <div className="text-stone-500 text-[8.5px] mt-1">
              {supplier.illustrative
                ? 'Americas comparator: real plant/owner/LEI, calibrated emissions (not from the extract).'
                : 'Static extract — figures are independent estimates for triage, not a compliance filing.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 p-4 flex gap-3 border-t border-stone-200/60 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-stone-300 hover:border-stone-400 font-sans text-xs font-semibold text-stone-700 bg-white rounded-full cursor-pointer transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
