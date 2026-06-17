/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useAppState } from '../state/appState';
import { SUPPLIERS } from '../data/suppliers';
import { byMaterial, getLatestIntensity, getEstimateRange, getEstimateMidpoint } from '../lib/calc';
import { evaluateFlag } from '../lib/flag';
import { SectionTitle, Card, VerifyBadge, Pill, FlagEmoji, RangeBadge } from '../components/ui';
import { Shield, HelpCircle, Sliders, CheckCircle, ArrowRight, Layers, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import TrustPassport from '../components/TrustPassport';
import { Supplier } from '../types';

export default function Suppliers() {
  const {
    mode,
    material,
    verifyStatus,
    requestVerification,
    markReceived,
    divergenceThreshold,
    setDivergenceThreshold,
  } = useAppState();

  const [selectedPassportSupplier, setSelectedPassportSupplier] = useState<Supplier | null>(null);

  // Scoped supplier lines
  const scopedSuppliers = useMemo(() => {
    return byMaterial(SUPPLIERS, material);
  }, [material]);

  // Identify Triage Flags
  const flaggedSuppliers = useMemo(() => {
    return scopedSuppliers
      .map((s) => ({
        supplier: s,
        flag: evaluateFlag(s, divergenceThreshold),
      }))
      .filter((item) => item.flag.flagged && verifyStatus[item.supplier.id] !== 'received');
  }, [scopedSuppliers, divergenceThreshold, verifyStatus]);

  // Orders full table database by active stage lists
  const orderedSuppliers = useMemo(() => {
    // Stage ranks: 0 = priority flagged, 1 = unverified (none), 2 = requested, 3 = received, 4 = shared pool
    return [...scopedSuppliers].sort((a, b) => {
      const flagA = evaluateFlag(a, divergenceThreshold).flagged;
      const flagB = evaluateFlag(b, divergenceThreshold).flagged;
      
      const statusA = verifyStatus[a.id] || 'none';
      const statusB = verifyStatus[b.id] || 'none';

      let rankA = 1;
      let rankB = 1;

      if (a.inSharedPool && statusA === 'received') rankA = 4;
      else if (statusA === 'received') rankA = 3;
      else if (statusA === 'requested') rankA = 2;
      else if (flagA) rankA = 0;

      if (b.inSharedPool && statusB === 'received') rankB = 4;
      else if (statusB === 'received') rankB = 3;
      else if (statusB === 'requested') rankB = 2;
      else if (flagB) rankB = 0;

      return rankA - rankB;
    });
  }, [scopedSuppliers, verifyStatus, divergenceThreshold]);

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Triage settings section */}
      <SectionTitle
        kicker="SCUTINY THRESHOLDS"
        title="Triage & Threshold Verification"
        subtitle="Audit self-reported declarations against independent Climate TRACE ranges on a sliding risk tolerance."
        rightSlot={
          <div className="backdrop-blur-md bg-stone-900/90 text-[#F5F5F7] px-4 py-2 rounded-full font-mono text-[9px] font-semibold tracking-wider flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-white/10 shrink-0">
            <Shield className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>🔒 PRIVATE IMPORTER VIEW ONLY</span>
          </div>
        }
      />

      {/* Threshold Controller Slider and visual cue */}
      <Card className="border-white/50 bg-white/30 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-4 space-y-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#2E4A3F] block font-bold">Risk Parameter</span>
            <h4 className="font-sans text-lg text-stone-900 font-normal">Sensitivity threshold: {(divergenceThreshold * 100).toFixed(0)}%</h4>
            <p className="font-sans text-xs text-stone-500 leading-relaxed font-light">
              We compare self-reports with Climate TRACE. Under-reports diverging more than this sliding indicator trigger a private priority warning.
            </p>
          </div>

          {/* Slider input */}
          <div className="md:col-span-5 flex items-center gap-6">
            <Sliders className="w-5 h-5 text-stone-400" />
            <div className="flex-1 space-y-1">
              <input
                type="range"
                min="0.05"
                max="0.40"
                step="0.01"
                value={divergenceThreshold}
                onChange={(e) => setDivergenceThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer focus:outline-hidden accent-emerald-800"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-400 font-medium">
                <span>5% (Hyper Audit)</span>
                <span>40% (Loose Tolerances)</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 bg-white/50 border border-white/60 p-5 rounded-2xl text-center shadow-xs backdrop-blur-md">
            <span className="font-mono text-[9px] text-stone-400 block mb-1 font-semibold tracking-wider">LIVE FLAGS IN FIELD</span>
            <span className="font-mono text-3xl font-bold text-[#b24c30] block">{flaggedSuppliers.length}</span>
            <span className="text-[10px] text-stone-500 font-sans block mt-1 leading-none">facilities flagged</span>
          </div>
        </div>
      </Card>

      {/* Flag priority queue */}
      {flaggedSuppliers.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-serif text-xl text-stone-900 border-b border-stone-200 pb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            Priority Verification Queue ({flaggedSuppliers.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flaggedSuppliers.map(({ supplier, flag }) => {
              const range = getEstimateRange(supplier);
              const midpoint = getEstimateMidpoint(supplier);
              
              // Map percentage visualization layout:
              // Let's draw a slider path: range min is left, max is right.
              // Slider range context width: benchmark (e.g. 0) to standard default value (e.g. 4)
              // Let's plot proportional positions
              const scaleMax = Math.max(supplier.countryDefaultValue, range.high) * 1.1;
              const selfPct = (supplier.selfReported / scaleMax) * 100;
              const lowPct = (range.low / scaleMax) * 100;
              const highPct = (range.high / scaleMax) * 100;
              const midPct = (midpoint / scaleMax) * 100;

              return (
                <div key={supplier.id}>
                  <Card className="border-rose-150/50 relative bg-linear-to-b from-rose-500/5 to-transparent shadow-[0_8px_30px_rgba(239,68,68,0.01)] rounded-2xl">
                    <div className="flex justify-between items-start mb-4 pb-3 border-b border-stone-100">
                      <div>
                        <span className="font-mono text-[9px] uppercase text-stone-400 block">{supplier.productionRoute} • {supplier.commodity.toUpperCase()}</span>
                        <h5 className="font-serif text-base font-semibold text-stone-950 mt-0.5">
                          <FlagEmoji countryCode={supplier.country} />
                          {supplier.name}
                        </h5>
                      </div>
                      <VerifyBadge severity={flag.severity === 'priority' ? 'priority' : 'watch'} explanation={flag.reason} />
                    </div>

                    {/* Graphical Divergence Bar */}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-[10px] font-mono text-stone-400">
                        <span>0.0 t/t</span>
                        <span>{scaleMax.toFixed(1)} t/t</span>
                      </div>

                      <div className="relative h-4 bg-stone-100 rounded-sm border border-stone-200 overflow-visible flex items-center">
                        {/* Estimate range strip */}
                        <div 
                          className="absolute h-full bg-emerald-100 border-x border-emerald-300 opacity-60"
                          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
                        />

                        {/* Estimate midpoint marker */}
                        <div 
                          className="absolute w-1 h-6 bg-emerald-800 -top-1"
                          style={{ left: `${midPct}%` }}
                          title={`TRACE estimate midpoint: ${midpoint.toFixed(2)}`}
                        />

                        {/* Active self-reported dot */}
                        <div 
                          className="absolute w-3 h-3 bg-rose-600 rounded-full border border-white -top-0.5 shadow-sm transform -translate-x-1.5"
                          style={{ left: `${selfPct}%` }}
                          title={`Supplier self-report: ${supplier.selfReported.toFixed(2)}`}
                        />
                      </div>

                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-rose-700 font-bold" style={{ marginLeft: `${Math.max(0, selfPct - 10)}%` }}>
                          Self-report: {supplier.selfReported} t/t
                        </span>
                        <span className="text-emerald-800 font-bold" style={{ marginRight: `${Math.max(0, 100 - midPct)}%` }}>
                          TRACE midpoint: {midpoint.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed font-sans font-light mb-4 lg:min-h-[48px]">
                      {flag.reason}
                    </p>

                    <div className="flex justify-end pt-3 border-t border-stone-100">
                      <button
                        onClick={() => requestVerification(supplier.id)}
                        className="font-mono text-xs bg-stone-900 hover:bg-black text-[#F5F5F7] px-4 py-2 rounded-full cursor-pointer transition-all duration-200 shadow-xs"
                      >
                        Request audited verification
                      </button>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Complete Tracker Database Grid */}
      <Card className="border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-150 mb-6 gap-2">
          <div>
            <span className="font-mono text-[9px] uppercase text-stone-400 font-semibold block">Full Ledger database</span>
            <h4 className="font-serif text-lg md:text-xl text-stone-900 font-normal">Tracking & Requests registry</h4>
          </div>
          
          <div className="flex items-center gap-1.5 font-mono text-[9px] font-semibold text-stone-400 bg-stone-200/50 border border-stone-200/30 px-3 py-1 rounded-full">
            <FileSpreadsheet className="w-4 h-4 text-stone-300" />
            <span>Format XLS verified parity matching</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 font-mono text-[10px] uppercase">
                <th className="pb-3 pt-1">Company / Installation</th>
                <th className="pb-3 pt-1">CN Code</th>
                <th className="pb-3 pt-1">Commodity / Route</th>
                <th className="pb-3 pt-1">Self-Report</th>
                <th className="pb-3 pt-1">Climate TRACE Range</th>
                <th className="pb-3 pt-1">Workflow Stage</th>
                <th className="pb-3 pt-1 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orderedSuppliers.map((s) => {
                const range = getEstimateRange(s);
                const flagState = evaluateFlag(s, divergenceThreshold);
                const status = verifyStatus[s.id] || 'none';

                let stageLabel = 'Unverified (Estimated midpoint)';
                let stageTone: 'neutral' | 'accent' | 'success' | 'warn' | 'danger' = 'neutral';
                
                if (s.inSharedPool && status === 'received') {
                  stageLabel = `Shared Pool (Verified by ${s.sharedPoolCount ?? 3} importers)`;
                  stageTone = 'accent';
                } else if (status === 'received') {
                  stageLabel = 'Verified actual coordinates saved';
                  stageTone = 'success';
                } else if (status === 'requested') {
                  stageLabel = 'Audited report requested';
                  stageTone = 'warn';
                } else if (flagState.flagged) {
                  stageLabel = 'Triage flag: priority audit required';
                  stageTone = 'danger';
                }

                return (
                  <tr key={s.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-4">
                      <div className="font-serif text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                        <FlagEmoji countryCode={s.country} />
                        {s.name}
                      </div>
                      <span className="block text-[11px] font-sans font-light text-stone-500 mt-0.5">{s.facilityName}</span>
                    </td>
                    <td className="py-4 font-mono text-xs">{s.cnCode}</td>
                    <td className="py-4">
                      <span className="font-mono text-[9px] uppercase block text-stone-400">{s.commodity}</span>
                      <span className="text-[11px] font-light text-stone-600">{s.productionRoute}</span>
                    </td>
                    <td className="py-4 font-mono text-stone-700 font-semibold">{s.selfReported.toFixed(2)}</td>
                    <td className="py-4">
                      <RangeBadge low={range.low} high={range.high} level={s.estimateConfidence} />
                    </td>
                    <td className="py-4">
                      <Pill label={stageLabel} tone={stageTone} />
                    </td>
                    <td className="py-4 text-right">
                      {status === 'none' && (
                        <button
                          onClick={() => requestVerification(s.id)}
                          className="font-mono text-[10px] bg-stone-900 text-[#F5F5F7] hover:bg-black px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium shadow-xs"
                        >
                          Request data
                        </button>
                      )}
                      {status === 'requested' && (
                        <button
                          onClick={() => markReceived(s.id)}
                          className="font-mono text-[10px] bg-emerald-850 hover:bg-emerald-900 text-[#F5F5F7] px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium shadow-xs"
                        >
                          Mark as received
                        </button>
                      )}
                      {status === 'received' && (
                        <button
                          onClick={() => setSelectedPassportSupplier(s)}
                          className="font-mono text-[10px] bg-emerald-805/10 text-emerald-800 hover:bg-[#2E4A3F] hover:text-[#F5F5F7] border border-emerald-500/20 px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-semibold whitespace-nowrap inline-flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 group-hover:text-[#F5F5F7]" />
                          <span>View Passport</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Shared Verification Pool pitch explainer */}
      {mode === 'pitch' && (
        <Card className="bg-[#1C1E1B] text-stone-300 border-stone-900 p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-1.5 font-mono text-amber-500 font-bold text-xs">
            <Layers className="w-4 h-4" />
            <span>STRATEGIC THEORY OF SHARED DATA</span>
          </div>
          <h4 className="font-serif text-xl text-stone-100 italic">
            The Shared Verification Pool Moat
          </h4>
          <p className="font-sans text-xs leading-relaxed font-light text-stone-400">
            For mid-market importers, compliance holds extreme overhead. By structuring a <strong>Shared Pool</strong> approach, any verified emissions record generated by our tool (with explicit consent from the producing steel mills or cement kilns) is immediately contributed to the pool directory. 
            Once contributed, sub-importers sharing those same transport lanes inherit the verified metrics automatically (e.g., <strong>POSCO Gwangyang is already verified by 6 other importers</strong> in this pool). 
            This drastically eliminates redundant audits, reduces audit friction for exporting plants, and lowers barrier expenses immediately.
          </p>
        </Card>
      )}

      {selectedPassportSupplier && (
        <TrustPassport 
          supplier={selectedPassportSupplier} 
          onClose={() => setSelectedPassportSupplier(null)} 
        />
      )}

    </div>
  );
}
