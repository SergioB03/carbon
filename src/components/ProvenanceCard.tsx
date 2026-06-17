/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  Legend, 
  ReferenceLine, 
  Area 
} from 'recharts';
import { Supplier } from '../types';
import { Card, SectionTitle } from './ui';
import { getEstimateRange, getEstimateMidpoint } from '../lib/calc';
import { Calendar, HelpCircle, Shield, Sparkle, ShieldCheck } from 'lucide-react';
import TrustPassport from './TrustPassport';

export default function ProvenanceCard({ 
  suppliers, 
  selectedSupplierId,
  setSelectedSupplierId
}: { 
  suppliers: Supplier[];
  selectedSupplierId: string;
  setSelectedSupplierId: (id: string) => void;
}) {
  const [showPassport, setShowPassport] = useState<boolean>(false);

  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];
  }, [suppliers, selectedSupplierId]);

  // Combine measured history + projected constant path to 2034
  const chartData = useMemo(() => {
    if (!selectedSupplier) return [];
    
    const history = selectedSupplier.history;
    const finalHistYear = history[history.length - 1].year;
    
    // Convert history
    const data = history.map((h) => {
      // Create uncertainty band around full intensity
      let spread = 0.08;
      if (selectedSupplier.estimateConfidence === 'medium') spread = 0.16;
      if (selectedSupplier.estimateConfidence === 'low') spread = 0.30;
      
      const low = Math.max(0, h.fullIntensity * (1 - spread));
      const high = h.fullIntensity * (1 + spread);

      return {
        year: h.year,
        intensity: h.intensity,
        fullIntensity: h.fullIntensity,
        measured: true,
        projected: false,
        uncertainty: [low, high],
      };
    });

    // Projected years (finalHistYear + 1 to 2034)
    const latestHist = history[history.length - 1];
    for (let yr = finalHistYear + 1; yr <= 2034; yr++) {
      let spread = 0.12;
      if (selectedSupplier.estimateConfidence === 'medium') spread = 0.22;
      if (selectedSupplier.estimateConfidence === 'low') spread = 0.35;
      
      const low = Math.max(0, latestHist.fullIntensity * (1 - spread));
      const high = latestHist.fullIntensity * (1 + spread);

      data.push({
        year: yr,
        // Projections hold direct and full constant
        intensity: latestHist.intensity,
        fullIntensity: latestHist.fullIntensity,
        measured: false,
        projected: true,
        uncertainty: [low, high],
      });
    }

    return data;
  }, [selectedSupplier]);

  const latestHistory = useMemo(() => {
    if (!selectedSupplier || selectedSupplier.history.length === 0) return null;
    return selectedSupplier.history[selectedSupplier.history.length - 1];
  }, [selectedSupplier]);

  // Calculation of priced proportion vs total footprint
  const stats = useMemo(() => {
    if (!selectedSupplier || !latestHistory) return { pricedPct: 0, outOfScope: 0 };
    const direct = latestHistory.intensity;
    const total = latestHistory.fullIntensity;
    const pricedPct = (direct / total) * 100;
    const outOfScope = total - direct;
    return { pricedPct, outOfScope };
  }, [selectedSupplier, latestHistory]);

  const hasElectricityLayer = selectedSupplier && selectedSupplier.commodity !== 'cement';

  return (
    <Card className="col-span-1 border-stone-200">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-stone-150">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#b24c30] bg-[#b24c30]/10 px-2.5 py-0.5 rounded-xs font-semibold">
            Section 05 / Provenance Blend
          </span>
          <h4 className="font-serif text-xl md:text-2xl text-stone-900 mt-2 font-normal">
            Measured History vs. Projected Blend
          </h4>
          <p className="text-xs text-stone-500 font-sans mt-1">
            Real Climate TRACE observations (2021–2025) coupled with a flat deterministic policy projection mapping to 2034.
          </p>
        </div>

        {/* Dropdown limited to active scoped material */}
        <div className="shrink-0">
          <label className="block font-mono text-[9px] text-stone-400 uppercase mb-1">Select Facility</label>
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="font-mono text-xs text-stone-800 bg-stone-50 border border-stone-300 p-2 rounded-xs focus:outline-hidden focus:border-stone-500"
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.country})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Chart View (8 cols) */}
        <div className="lg:col-span-8">
          <div className="h-64 sm:h-72 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                <XAxis dataKey="year" stroke="#78716c" tickLine={false} />
                <YAxis stroke="#78716c" tickLine={false} label={{ value: 'tCO₂e/t', angle: -90, position: 'insideLeft', style: { fill: '#78716c' } }} />
                
                {/* Confidence Band shading only */}
                <Area 
                  type="monotone" 
                  dataKey="uncertainty" 
                  stroke="none" 
                  fill="#e7e5e4" 
                  fillOpacity={0.45} 
                  name="Climate TRACE Uncertainty Band"
                />

                {/* CBAM scope line */}
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke="#2E4A3F"
                  strokeWidth={2}
                  dot={({ payload, cx, cy }) => payload.measured ? <circle cx={cx} cy={cy} r={3} fill="#2E4A3F" stroke="white" /> : null}
                  name="CBAM Priced direct footprint"
                />

                {/* Cradle-to-gate line (only if not cement) */}
                {hasElectricityLayer && (
                  <Line
                    type="monotone"
                    dataKey="fullIntensity"
                    stroke="#b24c30"
                    strokeWidth={1.5}
                    dot={({ payload, cx, cy }) => payload.measured ? <circle cx={cx} cy={cy} r={3} fill="#b24c30" stroke="white" /> : null}
                    name="Full Cradle-to-Gate emissions"
                  />
                )}

                <ReferenceLine x={2026} stroke="#b24c30" strokeDasharray="3 3" label={{ value: "CBAM 2026", position: "top", fill: "#b24c30", fontStyle: "italic", offset: 10 }} />
                
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-900 text-stone-200 border border-stone-800 p-2 text-xs font-mono rounded-xs shadow-md">
                          <p className="border-b border-stone-800 pb-1 mb-1 font-bold text-stone-50">Year {data.year} ({data.measured ? 'Measured' : 'Projected'})</p>
                          <p className="text-emerald-400">Priced Intensity: {data.intensity.toFixed(3)} t/t</p>
                          {hasElectricityLayer && <p className="text-orange-400">Full Intensity: {data.fullIntensity.toFixed(3)} t/t</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Framing & Legend Details (4 cols) */}
        <div className="lg:col-span-4 bg-stone-50 border border-stone-200 p-5 rounded-xs space-y-4">
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#243C32] uppercase font-bold">
            <Sparkle className="w-3.5 h-3.5" />
            <span>Honest Scope Story</span>
          </div>

          <h5 className="font-serif text-lg text-stone-900 leading-tight">
            How much footprint is actually priced?
          </h5>

          {hasElectricityLayer ? (
            <div className="space-y-3 font-sans text-xs text-stone-600">
              <p>
                In Aluminium & Steel, CBAM regulates predominantly <strong>direct scope + PFCs</strong> (e.g., <strong>{latestHistory?.intensity.toFixed(2)} tCO₂e/t</strong>).
              </p>
              <div className="bg-white border border-stone-200/60 p-3 rounded-xs flex items-center justify-between">
                <div>
                  <span className="block font-mono text-[10px] text-stone-400">CBAM-PRICED SHARE</span>
                  <span className="font-mono text-xl font-bold text-[#2E4A3F]">{stats.pricedPct.toFixed(0)}%</span>
                </div>
                <div className="text-right">
                  <span className="block font-mono text-[10px] text-stone-400">OUT OF SCOPE</span>
                  <span className="font-mono text-sm font-semibold text-stone-600">{(100 - stats.pricedPct).toFixed(0)}%</span>
                </div>
              </div>
              <p className="italic text-[11px] leading-relaxed text-stone-500">
                The remaining {stats.outOfScope.toFixed(2)} tCO₂e/t represents grid electrolysis electricity, which CBAM ignores. Highly critical when evaluating actual trade footprints!
              </p>
            </div>
          ) : (
            <div className="font-sans text-xs text-stone-600 space-y-2">
              <p>
                Cement manufacturing carries <strong>zero indirect electricity layer</strong> in Climate TRACE.
              </p>
              <div className="bg-white border border-stone-200/60 p-3 rounded-xs font-mono text-[11px]">
                <span className="text-[#2E4A3F] font-bold block mb-1">✓ TWO LINES COINCIDE EXACTLY</span>
                <span>Both CBAM priced and Cradle-to-Gate emissions are flat matched.</span>
              </div>
              <p className="italic text-[11px] leading-relaxed text-stone-500">
                This reflects the chemistry of calcination. Clinker is priced for direct kiln fuels and calcium carbonate decomposition only.
              </p>
            </div>
          )}

          {/* Verification Audit trigger button */}
          <div className="pt-2">
            <button
              onClick={() => setShowPassport(true)}
              className="w-full font-mono text-[11px] font-semibold tracking-wide bg-[#2E4A3F] hover:bg-emerald-900 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(46,74,63,0.15)] hover:scale-[1.01]"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verify Compliance Passport</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trust passport modal */}
      {showPassport && selectedSupplier && (
        <TrustPassport 
          supplier={selectedSupplier} 
          onClose={() => setShowPassport(false)} 
        />
      )}
    </Card>
  );
}
