/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useAppState } from '../state/appState';
import { SUPPLIERS } from '../data/suppliers';
import { 
  byMaterial, 
  calculateTimelineProjection, 
  calculateSummaries, 
  getLatestIntensity, 
  getEstimateRange, 
  getVerifiedIntensity 
} from '../lib/calc';
import { evaluateFlag } from '../lib/flag';
import { SectionTitle, Stat, Pill, Card, RangeBadge, VerifyBadge, FlagEmoji } from '../components/ui';
import { 
  ResponsiveContainer, 
  AreaChart, 
  XAxis, 
  YAxis, 
  Area, 
  Tooltip as ChartTooltip, 
  ReferenceLine, 
  Legend 
} from 'recharts';
import FacilityMap from './FacilityMap';
import ProvenanceCard from '../components/ProvenanceCard';
import { Calendar, CheckCircle2, ArrowRight, TrendingUp, AlertTriangle, HelpCircle } from 'lucide-react';

export default function Overview() {
  const { 
    mode, 
    material, 
    view, 
    setView, 
    verifyStatus, 
    requestVerification, 
    divergenceThreshold 
  } = useAppState();

  const [selectedYear, setSelectedYear] = useState<number>(2030); // Default to mid-phase 2030
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null); // null = whole book

  // Filter the central suppliers array through the global lens
  const scopedSuppliers = useMemo(() => {
    return byMaterial(SUPPLIERS, material);
  }, [material]);

  // Which supplier the Section 02 chart is inspecting (null = the entire book).
  const inspectedSupplier = useMemo(
    () => (selectedSupplierId ? scopedSuppliers.find((s) => s.id === selectedSupplierId) ?? null : null),
    [scopedSuppliers, selectedSupplierId],
  );
  const inspectedSet = useMemo(
    () => (inspectedSupplier ? [inspectedSupplier] : scopedSuppliers),
    [inspectedSupplier, scopedSuppliers],
  );

  // Summary + projection follow the inspected scope, so clicking a supplier
  // visibly redraws both the chart and the ledger panel.
  const yearStats = useMemo(() => {
    return calculateSummaries(inspectedSet, verifyStatus, selectedYear);
  }, [inspectedSet, verifyStatus, selectedYear]);

  const timelineData = useMemo(() => {
    return calculateTimelineProjection(inspectedSet, verifyStatus);
  }, [inspectedSet, verifyStatus]);

  // Suppliers categorized for the Attention Worklist
  const attentionList = useMemo(() => {
    // Rank non-pool unreceived suppliers
    return scopedSuppliers
      .filter((s) => verifyStatus[s.id] !== 'received' && !s.inSharedPool)
      .map((s) => {
        const flagState = evaluateFlag(s, divergenceThreshold);
        let rank = 2; // awaiting
        let statusText = 'Pending Estimate Verification';
        
        if (flagState.flagged) {
          rank = 0; // flagged verify priority
          statusText = 'Verification Scrutiny Match';
        } else if (verifyStatus[s.id] === 'requested') {
          rank = 1; // verification requested
          statusText = 'Awaiting Supplier Response';
        }

        return {
          supplier: s,
          flagState,
          rank,
          statusText,
        };
      })
      .sort((a, b) => a.rank - b.rank);
  }, [scopedSuppliers, verifyStatus, divergenceThreshold]);

  // Live countdown to the first CBAM declaration + certificate surrender: 30 Sep 2027.
  const daysRemaining = useMemo(() => {
    const target = new Date('2027-09-30T00:00:00');
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, []);

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Overview Headway Section */}
      <SectionTitle
        kicker={`${material.toUpperCase()} PERSPECTIVE`}
        title={`State of CBAM: ${material === 'all' ? 'Accruing Ledger' : material.charAt(0).toUpperCase() + material.slice(1)}`}
        subtitle="A complete tactical breakdown of estimated obligations, priority anomalies, and forward forecasts."
        rightSlot={mode === 'pitch' ? (
          <div className="backdrop-blur-md bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-amber-950 font-sans text-xs max-w-xs md:max-w-sm">
            <span className="font-mono text-[9px] uppercase tracking-wider text-amber-800 font-bold block mb-1 font-semibold">
              💡 JUDGE CONTEXT
            </span>
            Overview scopes the entire product via the <strong>Material Lens</strong>. Toggle material buttons in the sidebar to rewrite the numbers instantly!
          </div>
        ) : undefined}
      />

      {/* Dynamic interactive geographic pin map panel first for supreme UI/UX focus */}
      <FacilityMap
        suppliers={scopedSuppliers}
        divergenceThreshold={divergenceThreshold}
        selectedSupplierId={selectedSupplierId ?? scopedSuppliers[0]?.id ?? ''}
        setSelectedSupplierId={setSelectedSupplierId}
      />

      {/* KPI Stats Panel - Jitter-prooftabular-numerics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Days Until First Declaration"
          value={daysRemaining}
          subtext="30 Sep 2027 · first surrender (covers 2026)"
          tone="accent"
          suffix="days"
        />
        
        <Stat
          label="2026 Accruing Liability"
          value={Math.round(calculateSummaries(scopedSuppliers, verifyStatus, 2026).totalVerified).toLocaleString()}
          subtext="2.5% emission factor applied"
          tone="neutral"
          prefix="€"
        />

        <Stat
          label={`Cumulative Avoidable Cost (2026–2034)`}
          value={Math.round(
            timelineData.reduce((acc, curr) => acc + curr.avoidable, 0)
          ).toLocaleString()}
          subtext="Punitive default penalties avoidable"
          tone="danger"
          prefix="€"
        />

        <Stat
          label="Suppliers Requiring Attention"
          value={attentionList.length}
          subtext="Triage pipeline queue"
          tone={attentionList.length > 0 ? 'warn' : 'success'}
          suffix="nodes"
        />
      </div>

      {/* Actionable Work agenda list */}
      <Card className="border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-150 mb-6">
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase text-stone-400 font-semibold block">Triage Worklist</span>
            <h4 className="font-serif text-lg md:text-xl text-stone-900 font-normal">Needs Your Scrutiny First</h4>
          </div>
          <button 
            onClick={() => setView('suppliers')}
            className="font-mono text-[10px] text-emerald-800 hover:underline uppercase inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Launch Supplier Triage</span>
            <span>→</span>
          </button>
        </div>

        {attentionList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-mono text-[10px] uppercase">
                  <th className="pb-3 pt-1">Supplier / Installation</th>
                  <th className="pb-3 pt-1">Country</th>
                  <th className="pb-3 pt-1">Commodity / Route</th>
                  <th className="pb-3 pt-1">Estimate bounds</th>
                  <th className="pb-3 pt-1">Triage status</th>
                  <th className="pb-3 pt-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {attentionList.slice(0, 3).map(({ supplier, flagState, statusText, rank }) => {
                  const estRange = getEstimateRange(supplier);
                  return (
                    <tr key={supplier.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-4 font-serif text-sm font-medium text-stone-900">
                        {supplier.name}
                        <span className="block text-[11px] font-sans font-light text-stone-500 mt-0.5">{supplier.facilityName}</span>
                      </td>
                      <td className="py-4 font-mono text-xs">
                        <FlagEmoji countryCode={supplier.country} />
                        {supplier.country}
                      </td>
                      <td className="py-4">
                        <span className="font-mono text-[10px] uppercase block text-stone-500">{supplier.commodity}</span>
                        <span className="text-[11px] font-light">{supplier.productionRoute}</span>
                      </td>
                      <td className="py-4">
                        <RangeBadge low={estRange.low} high={estRange.high} level={supplier.estimateConfidence} />
                      </td>
                      <td className="py-4 pr-2">
                        {rank === 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-sm font-mono text-[9px] uppercase tracking-wider font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse shrink-0" />
                            CRITICAL DIVERGENCE
                          </span>
                        ) : rank === 1 ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-sm font-mono text-[9px] uppercase tracking-wider font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            AWAITING RESPONSE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-stone-500 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-sm font-mono text-[9px] uppercase tracking-wider font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                            ESTIMATE READY
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => requestVerification(supplier.id)}
                          className="font-mono text-[10px] bg-stone-900 text-[#F5F5F7] hover:bg-black px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium shadow-xs"
                        >
                          Request verified data
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {attentionList.length > 3 && (
              <div className="mt-4 pt-3 border-t border-stone-100 text-center">
                <button
                  onClick={() => setView('suppliers')}
                  className="font-mono text-xs text-stone-500 hover:text-stone-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>And {attentionList.length - 3} more. Track full list</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 bg-stone-50 border border-dashed border-stone-200 rounded-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-800 mx-auto mb-2" />
            <p className="font-serif text-stone-700 text-sm">Task Book Cleared</p>
            <p className="text-stone-500 text-xs mt-0.5">All supplier lines possess verified records in the database or active data submissions.</p>
          </div>
        )}
      </Card>

      {/* Cost Projections Forecast Visual Card */}
      <Card className="border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-stone-150 mb-8">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#b24c30] bg-[#b24c30]/10 px-2.5 py-0.5 rounded-xs font-semibold">
              Section 02 / Projections & Trajectories
            </span>
            <h4 className="font-serif text-xl md:text-2xl text-stone-900 mt-2 font-normal">
              Forward Cost Trajectory under CBAM (2026–2034)
            </h4>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Contrasting the punitive defaults scenario with actual verified emissions pathways. Pick a year, or <strong>click a supplier card below to redraw the curve for just that supplier</strong> (click again for the whole book).
            </p>
          </div>

          {/* Sync Year Selectors */}
          <div className="flex gap-1 bg-stone-200/50 p-1 border border-stone-200/30 rounded-full">
            {[2026, 2027, 2030, 2034].map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3.5 py-1 text-xs font-mono rounded-full transition-all cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-stone-900 text-[#F5F5F7] font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {yr} {yr === 2026 ? '(Accrual)' : yr === 2027 ? '(First Pay)' : yr === 2034 ? '(100% Rate)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Forecast Area Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8">
            <div className="h-72 w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 0, right: 10, bottom: 0, left: -25 }}>
                  <XAxis dataKey="year" stroke="#78716c" tickLine={false} />
                  <YAxis stroke="#78716c" tickLine={false} label={{ value: 'Cost (EUR)', angle: -90, position: 'insideLeft', style: { fill: '#78716c' } }} />
                  
                  {/* Avoidable area */}
                  <Area
                    type="monotone"
                    dataKey="defaultCost"
                    stroke="#b24c30"
                    strokeWidth={1.5}
                    fill="#fef2f2"
                    name="Punitive country default cost"
                  />
                  
                  {/* Verified area */}
                  <Area
                    type="monotone"
                    dataKey="verifiedCost"
                    stroke="#1f3d32"
                    strokeWidth={2}
                    fill="#f0fdf4"
                    name="Verified carbon pathway cost"
                  />

                  {/* Sync vertical line */}
                  <ReferenceLine
                    x={selectedYear}
                    stroke="#2E4A3F"
                    strokeDasharray="4 4"
                    label={{ value: `Inspecting ${selectedYear}`, fill: '#2E4A3F', position: 'top', fontStyle: 'italic', offset: 10 }}
                  />

                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-stone-900 text-stone-200 border border-stone-800 p-2 text-xs font-mono rounded-xs shadow-md">
                            <p className="border-b border-stone-800 pb-1 mb-1 font-bold text-stone-50">Year {payload[0].payload.year}</p>
                            <p className="text-rose-400">Default Cost: €{Math.round(payload[0].value as number).toLocaleString()}</p>
                            <p className="text-emerald-400">Verified Cost: €{Math.round(payload[1].value as number).toLocaleString()}</p>
                            <p className="text-amber-400">Avoidable Gap: €{Math.round((payload[0].value as number) - (payload[1].value as number)).toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown analysis of localized year liability split (4 cols) */}
          <div className="lg:col-span-4 bg-white/40 border border-white/50 p-6 rounded-2xl space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.01)] backdrop-blur-md">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-[9px] text-[#b24c30] uppercase block font-bold">
                Inspecting: {inspectedSupplier ? inspectedSupplier.name : `All ${inspectedSet.length} suppliers`} · {selectedYear}
              </span>
              {inspectedSupplier && (
                <button
                  onClick={() => setSelectedSupplierId(null)}
                  className="font-mono text-[9px] uppercase text-stone-400 hover:text-stone-800 cursor-pointer shrink-0 border border-stone-300 rounded-full px-2 py-0.5"
                >
                  ← all
                </button>
              )}
            </div>
            <h4 className="font-serif text-lg text-stone-900">
              Avoidable Premium Gap
            </h4>

            <div className="space-y-4 pt-1">
              <div>
                <span className="text-[10px] font-mono text-stone-400 uppercase block">UNVERIFIED DEFAULT DEBT</span>
                <span className="font-mono text-xl font-bold text-rose-800">
                  €{Math.round(yearStats.totalDefault).toLocaleString()}
                </span>
              </div>
              
              <div className="pb-3 border-b border-stone-200">
                <span className="text-[10px] font-mono text-stone-400 uppercase block">VERIFIED TARGET</span>
                <span className="font-mono text-xl font-medium text-[#2E4A3F]">
                  €{Math.round(yearStats.totalVerified).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-rose-800 font-bold uppercase block">AVOIDABLE SAVINGS GONE</span>
                <span className="font-mono text-2xl font-bold text-rose-800 block mt-0.5">
                  €{Math.round(yearStats.totalAvoidable).toLocaleString()}
                </span>
                <p className="text-[11px] font-sans text-stone-500 mt-2 font-light leading-relaxed">
                  By failing to obtain and submit verified actual supplier footprints, you incur a tariff inflation of <strong>{((yearStats.totalAvoidable / Math.max(1, yearStats.totalVerified)) * 100).toFixed(0)}%</strong>. This premium is fully avoidable.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* In-depth individual supplier details in the inspected year */}
        <div className="mt-8 pt-6 border-t border-stone-150">
          <span className="font-mono text-[10px] text-stone-400 tracking-wider uppercase block mb-4">
            SUPPLIER SHARE DETAILS DURING YEAR {selectedYear}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {scopedSuppliers.map((s) => {
              const sDefault = calculateSummaries([s], verifyStatus, selectedYear).totalDefault;
              const sVerified = calculateSummaries([s], verifyStatus, selectedYear).totalVerified;
              const sAvoidable = Math.max(0, sDefault - sVerified);
              
              return (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedSupplierId((prev) => (prev === s.id ? null : s.id))}
                  className={`p-4 border select-none cursor-pointer transition-all duration-300 rounded-xl ${
                    selectedSupplierId === s.id 
                      ? 'bg-stone-900 text-[#F5F5F7] border-stone-900 shadow-md scale-[1.02]' 
                      : 'bg-white/50 border-white/65 hover:bg-white/80 text-stone-950 hover:border-stone-300 shadow-[0_4px_18px_rgba(0,0,0,0.015)]'
                  }`}
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-serif text-sm font-semibold truncate max-w-[120px]">{s.name}</span>
                    <span className="font-mono text-[10px] uppercase opacity-70">{s.country}</span>
                  </div>
                  <div className="font-mono text-sm mt-2">
                    <span className="block text-[10px] text-stone-400 uppercase">AVOIDABLE PREMIUM:</span>
                    <span className={`font-semibold ${sAvoidable > 0 ? (selectedSupplierId === s.id ? 'text-rose-300' : 'text-rose-700') : 'text-stone-400'}`}>
                      €{Math.round(sAvoidable).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Dynamic Provenance Card with historic overlay details */}
      <ProvenanceCard
        suppliers={scopedSuppliers}
        selectedSupplierId={selectedSupplierId ?? scopedSuppliers[0]?.id ?? ''}
        setSelectedSupplierId={setSelectedSupplierId}
      />

      {/* Policy background and timing methodology details */}
      {mode === 'pitch' && (
        <Card className="bg-[#1C1E1B] text-stone-300 border-stone-900 p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-500 font-bold text-xs uppercase tracking-widest bg-amber-550/10 px-2 py-0.5 border border-amber-950/20">
              METHODOLOGY EXPLAINER
            </span>
          </div>
          <h4 className="font-serif text-xl text-stone-100 italic">
            Regulatory Timing Rules & Allocation Offsets
          </h4>
          <p className="font-sans text-xs leading-relaxed font-light text-stone-400">
            CBAM is governed heavily by the progressive phase-out of the EU ETS Free Allocation limits (starting at 2.5% in 2026, scaling rapidly past 48% in 2030 to absolute parity in 2034). 
            Our forecast model accurately tracks this progressive allocation factor, avoiding the mistake of billing full obligations on day one. 
            Default and unverified penalty indices are anchored direct to Reg. (EU) 2025/2621 country default statistics.
          </p>
        </Card>
      )}

      {/* The business + architecture pitch — for evaluators reading this as a company, not a CS project */}
      {mode === 'pitch' && (
        <Card className="bg-gradient-to-br from-[#11261d] via-[#13241d] to-[#1C1E1B] text-stone-200 border-emerald-950 p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-400 font-bold text-xs uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              ◇ THE PITCH
            </span>
            <span className="font-mono text-[9px] text-stone-500 uppercase tracking-wider">Why CarbonBridge wins</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <div className="font-serif text-base text-emerald-200 italic">The moat — a Verified Pool</div>
              <p className="text-[11.5px] font-light leading-relaxed text-stone-400">
                One supplier verifies <strong className="text-stone-200">once</strong> — by signing a data-sharing consent — and that figure is reused
                across every unaffiliated importer who sources from them. The pool compounds with the network; the independent
                estimate makes us useful to importer #1 on day one. <strong className="text-stone-200">Data ownership, not a feature list.</strong>
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="font-serif text-base text-emerald-200 italic">The market &amp; the money</div>
              <p className="text-[11.5px] font-light leading-relaxed text-stone-400">
                Target: <strong className="text-stone-200">mid-market EU importers above the 50 t Omnibus exemption</strong> — real, growing CBAM
                exposure, no in-house compliance team. The product quantifies the <strong className="text-stone-200">avoidable overpayment</strong>
                (punitive defaults vs verified actuals) above. Adoption is buyer-pull: CDP found suppliers <strong className="text-stone-200">52% more
                likely</strong> to cut emissions when buyers ask.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="font-serif text-base text-emerald-200 italic">Serverless by design</div>
              <p className="text-[11.5px] font-light leading-relaxed text-stone-400">
                No servers to bridge. CarbonBridge runs <strong className="text-stone-200">at the edge — serverless, keyless</strong>, hitting real public
                feeds (Climate TRACE, GLEIF, the UK grid) straight from the browser. Cheap to run, nothing to breach, ships
                anywhere. The only thing between a supplier and the EU border is a <strong className="text-stone-200">bridge</strong>.
              </p>
            </div>
          </div>

          <div className="border-t border-emerald-950/60 pt-4 flex items-start gap-2.5">
            <span className="font-mono text-[9px] text-emerald-500 uppercase tracking-wider font-bold mt-0.5 shrink-0">On defamation &amp; privacy →</span>
            <p className="text-[11px] font-light leading-relaxed text-stone-400">
              We never publish or accuse. The estimate is a <strong className="text-stone-200">private triage signal</strong> for the importer's own
              sourcing — like a credit check on a counterparty — built on <strong className="text-stone-200">already-public, independent</strong> observation
              data, always shown as a <strong className="text-stone-200">range + confidence</strong>, never a verdict. Suppliers opt in to the Verified
              Pool by consent. Defensible, because it's true.
            </p>
          </div>
        </Card>
      )}

    </div>
  );
}
