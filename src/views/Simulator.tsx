/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useAppState } from '../state/appState';
import { SUPPLIERS } from '../data/suppliers';
import { 
  byMaterial, 
  getLatestIntensity, 
  getEstimateRange, 
  calculateDefaultCost, 
  calculateVerifiedCost, 
  CERT_PRICE_EUR, 
  PHASE_IN 
} from '../lib/calc';
import { Card, SectionTitle, FlagEmoji } from '../components/ui';
import { RotateCcw, Sparkles, TrendingDown, ArrowUp, BarChart2, Zap, FlaskConical, Recycle } from 'lucide-react';

export default function Simulator() {
  const {
    mode,
    material,
    verifyStatus,
    sliderOverrides,
    setSliderOverride,
    resetSliders
  } = useAppState();

  const SIM_YEAR = 2030; // Hard-coded simulation target year

  // Local state for active tactile upgrades per supplier
  const [activeUpgrades, setActiveUpgrades] = useState<{
    [supplierId: string]: {
      greenPower: boolean;
      hydrogenKiln: boolean;
      scrapEaf: boolean;
    };
  }>({});

  const toggleUpgrade = (
    supplierId: string, 
    upgradeType: 'greenPower' | 'hydrogenKiln' | 'scrapEaf', 
    baseline: number, 
    floor: number
  ) => {
    const prev = activeUpgrades[supplierId] || { greenPower: false, hydrogenKiln: false, scrapEaf: false };
    const nextUpgrades = {
      ...prev,
      [upgradeType]: !prev[upgradeType]
    };

    // Calculate simulated carbon intensity drop based on physical upgrade profiles
    let targetIntensity = baseline;
    if (nextUpgrades.greenPower) {
      targetIntensity -= (baseline - floor) * 0.35; // 35% drop
    }
    if (nextUpgrades.hydrogenKiln) {
      targetIntensity -= (baseline - floor) * 0.60; // 60% drop
    }
    if (nextUpgrades.scrapEaf) {
      targetIntensity = floor; // Drops straight to benchmark best practice floor
    }

    // Ensure it doesn't go below floor
    targetIntensity = Math.max(floor, Math.min(baseline, targetIntensity));

    setActiveUpgrades({
      ...activeUpgrades,
      [supplierId]: nextUpgrades
    });
    setSliderOverride(supplierId, targetIntensity);
  };

  // Capital Expenditure (CapEx) simulator based on active green upgrades
  const totalCapex = useMemo(() => {
    let sum = 0;
    Object.keys(activeUpgrades).forEach((sid) => {
      const up = activeUpgrades[sid];
      if (up?.greenPower) sum += 350000;
      if (up?.hydrogenKiln) sum += 1500000;
      if (up?.scrapEaf) sum += 950000;
    });
    return sum;
  }, [activeUpgrades]);

  // Scoped supplier lines
  const scopedSuppliers = useMemo(() => {
    return byMaterial(SUPPLIERS, material);
  }, [material]);

  // Combined metrics per supplier in baseline vs simulated states
  const simulatedSuppliers = useMemo(() => {
    return scopedSuppliers.map((s) => {
      const baselineIntensity = getLatestIntensity(s);
      const overrideVal = sliderOverrides[s.id];
      const activeIntensity = overrideVal !== undefined ? overrideVal : baselineIntensity;
      
      const range = getEstimateRange(s);
      const floor = s.benchmark;
      const ceiling = range.high;

      // Savings calculations for this specific supplier in 2030
      const baseCost = calculateVerifiedCost(s, verifyStatus, SIM_YEAR, {});
      const simCost = calculateVerifiedCost(s, verifyStatus, SIM_YEAR, { [s.id]: activeIntensity });
      const saved2030 = Math.max(0, baseCost - simCost);

      // Percentage intensity reduction
      const pctReduction = ((baselineIntensity - activeIntensity) / baselineIntensity) * 100;

      // Carbon weight saved (tonnes CO2 per year)
      const co2SavedYr = Math.max(0, (baselineIntensity - activeIntensity) * s.annualTonnesImported);

      return {
        supplier: s,
        baselineIntensity,
        activeIntensity,
        floor,
        ceiling,
        saved2030,
        pctReduction,
        co2SavedYr,
      };
    });
  }, [scopedSuppliers, sliderOverrides, verifyStatus]);

  // Headline impact totals
  const impactTotals = useMemo(() => {
    let saved2030Total = 0;
    let totalCO2CutYr = 0;
    let improvedCount = 0;

    simulatedSuppliers.forEach((item) => {
      saved2030Total += item.saved2030;
      totalCO2CutYr += item.co2SavedYr;
      if (sliderOverrides[item.supplier.id] !== undefined) {
        improvedCount++;
      }
    });

    // Cumulative 2026-2034 savings is simulated by extrapolating the 2030 ratio across timeline phase factors
    // We can calculate precisely by running the timeline calculations loop over the timeline years
    let cumulativeSaved = 0;
    const years = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034];
    
    years.forEach((y) => {
      scopedSuppliers.forEach((s) => {
        const baseCost = calculateVerifiedCost(s, verifyStatus, y, {});
        // Extrapolate intensity override to other years if simulated
        const override = sliderOverrides[s.id];
        const activeIntensity = override !== undefined ? override : getLatestIntensity(s);
        const simCost = calculateVerifiedCost(s, verifyStatus, y, { [s.id]: activeIntensity });
        
        cumulativeSaved += Math.max(0, baseCost - simCost);
      });
    });

    return {
      saved2030: saved2030Total,
      cumulativeSaved,
      totalCO2CutYr,
      improvedCount,
    };
  }, [simulatedSuppliers, scopedSuppliers, sliderOverrides, verifyStatus]);

  // Carbon cost ratio rank shelf - sorts suppliers by their active carbon cost intensity
  // Displays ghost baseline positions and up/down rank movements
  const rankedShelf = useMemo(() => {
    // 1. Sort baseline order
    const baselineSorted = [...scopedSuppliers]
      .map((s) => {
        const intensity = getLatestIntensity(s);
        return { id: s.id, intensity };
      })
      .sort((a, b) => b.intensity - a.intensity); // Red high to clean green low

    const getBaseRankIndex = (id: string) => baselineSorted.findIndex(item => item.id === id);

    // 2. Sort active simulated order
    const activeSorted = simulatedSuppliers
      .map((item) => ({
        id: item.supplier.id,
        name: item.supplier.name,
        country: item.supplier.country,
        intensity: item.activeIntensity,
        benchmark: item.supplier.benchmark,
        baselineIndex: getBaseRankIndex(item.supplier.id),
      }))
      .sort((a, b) => b.intensity - a.intensity);

    return activeSorted.map((item, index) => {
      const activeRank = index;
      const baseRank = item.baselineIndex;
      // Climbing rank = moving towards cleaner lower intensity (which is lower values, meaning index moves higher/towards the end)
      // Rank shift: (baseRank - activeRank)
      const rankShift = baseRank - activeRank;

      return {
        ...item,
        activeRank,
        baseRank,
        rankShift,
      };
    });
  }, [simulatedSuppliers, scopedSuppliers]);

  // Dynamic D3-like scale converter from intensity ratio to premium colors
  const getIntensityColorClass = (intensity: number, benchmark: number) => {
    const ratio = intensity / benchmark;
    if (ratio <= 1.2) return 'bg-emerald-800 text-stone-100'; // Green clean
    if (ratio <= 2.2) return 'bg-amber-600 text-stone-100';  // Amber cautious
    return 'bg-rose-700 text-stone-100';                     // Red heavy
  };

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Overview Headway */}
      <SectionTitle
        kicker="SIMULATE DECARBONISATION BENEFIT"
        title="Carbon-Cut Payoffs Simulator (Target Year 2030)"
        subtitle="Model supplier performance improvements. Reduce grid coal dependency or upgrade kiln fuel blends and visualize immediate cash tariff drops."
        rightSlot={
          <button
            onClick={() => { resetSliders(); setActiveUpgrades({}); }}
            className="font-mono text-[9px] font-semibold border border-stone-305 hover:border-stone-500 text-stone-700 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer bg-white/40 shadow-xs shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET OVERRIDES</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side Sliders (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <span className="font-mono text-[10px] text-stone-400 block font-semibold uppercase">
            Supplier Decarbonisation Control Sliders
          </span>

          {simulatedSuppliers.map(({ supplier, baselineIntensity, activeIntensity, floor, ceiling, pctReduction, saved2030 }) => {
            return (
              <div key={supplier.id}>
                <Card className="border-stone-200/80 hover:border-stone-300">
                  <div className="flex justify-between items-start mb-4 pb-2 border-b border-stone-100">
                    <div>
                      <span className="font-mono text-[9px] uppercase text-stone-400 block">Route: {supplier.productionRoute}</span>
                      <h5 className="font-serif text-base font-semibold text-stone-900 mt-0.5">
                        <FlagEmoji countryCode={supplier.country} />
                        {supplier.name}
                      </h5>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[9px] text-stone-400 uppercase block">SIM 2030 SAVED</span>
                      <span className={`font-mono text-sm font-bold ${saved2030 > 0 ? 'text-emerald-800' : 'text-stone-400'}`}>
                        €{Math.round(saved2030).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Slider Drag Controller */}
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between font-mono text-[10px] text-stone-400">
                      <span>Floor (Benchmark): {floor.toFixed(2)}</span>
                      <span className="font-semibold text-stone-850">Active: {activeIntensity.toFixed(2)} t/t</span>
                      <span>Ceiling (Max Estimated): {ceiling.toFixed(2)}</span>
                    </div>

                    <input
                      type="range"
                      min={floor}
                      max={ceiling}
                      step="0.01"
                      value={activeIntensity}
                      onChange={(e) => setSliderOverride(supplier.id, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer focus:outline-hidden accent-emerald-800"
                    />

                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-stone-400">Tonnes: {supplier.annualTonnesImported.toLocaleString()} t</span>
                      {pctReduction > 0 ? (
                        <span className="text-emerald-800 font-bold whitespace-nowrap bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          ▲ {pctReduction.toFixed(0)}% Intensity Cut
                        </span>
                      ) : (
                        <span className="text-stone-400">Held at Baseline</span>
                      )}
                    </div>
                  </div>

                  {/* Tactile Retrofitting Playground */}
                  <div className="pt-3 mt-3 border-t border-stone-150/50">
                    <span className="font-mono text-[9px] text-stone-400 block mb-2 uppercase tracking-wide font-semibold">
                      Tactile Factory Upgrade Presets
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => toggleUpgrade(supplier.id, 'greenPower', baselineIntensity, floor)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                          activeUpgrades[supplier.id]?.greenPower
                            ? 'bg-emerald-50 border-emerald-500/30 text-emerald-800 font-semibold shadow-xs'
                            : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 border-dashed hover:border-stone-400'
                        }`}
                      >
                        <Zap className={`w-3.5 h-3.5 ${activeUpgrades[supplier.id]?.greenPower ? 'text-emerald-600 animate-pulse' : 'text-stone-400'}`} />
                        <span>Solar/Wind PPAs</span>
                      </button>

                      <button
                        onClick={() => toggleUpgrade(supplier.id, 'hydrogenKiln', baselineIntensity, floor)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                          activeUpgrades[supplier.id]?.hydrogenKiln
                            ? 'bg-sky-50 border-sky-500/30 text-sky-800 font-semibold shadow-xs'
                            : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 border-dashed hover:border-stone-400'
                        }`}
                      >
                        <FlaskConical className={`w-3.5 h-3.5 ${activeUpgrades[supplier.id]?.hydrogenKiln ? 'text-sky-600' : 'text-stone-400'}`} />
                        <span>H₂ Kiln Fusion</span>
                      </button>

                      <button
                        onClick={() => toggleUpgrade(supplier.id, 'scrapEaf', baselineIntensity, floor)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                          activeUpgrades[supplier.id]?.scrapEaf
                            ? 'bg-purple-50 border-purple-505/30 text-purple-800 font-semibold shadow-xs'
                            : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 border-dashed hover:border-stone-400'
                        }`}
                      >
                        <Recycle className={`w-3.5 h-3.5 ${activeUpgrades[supplier.id]?.scrapEaf ? 'text-purple-600' : 'text-stone-400'}`} />
                        <span>Scrap EAF Upgrade</span>
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Right Side Sticky Ledger / Cost Shelf (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-6">
          
          {/* Static ledger receipt card */}
          <Card className="border-stone-900 bg-stone-900 text-stone-200 p-6 md:p-8 space-y-4">
            <span className="font-mono text-[9px] text-amber-500 font-bold tracking-widest block uppercase">
              SIMULATED SAVINGS LEDGER
            </span>

            <h4 className="font-serif text-2xl text-stone-100 font-normal">
              Accumulated Payoff Benefits
            </h4>

            <div className="grid grid-cols-2 gap-6 pt-3 border-t border-stone-850">
              <div>
                <span className="block font-mono text-[9px] text-stone-400 uppercase">Tariff Cuts 2030</span>
                <span className="font-mono text-xl font-bold text-emerald-400">
                  €{Math.round(impactTotals.saved2030).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block font-mono text-[9px] text-stone-400 uppercase">Cumulative 26–34</span>
                <span className="font-mono text-xl font-bold text-emerald-400">
                  €{Math.round(impactTotals.cumulativeSaved).toLocaleString()}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-stone-850">
                <span className="block font-mono text-[9px] text-stone-400 uppercase">Illustrative CapEx (indicative)</span>
                <span className={`font-mono text-lg font-bold ${totalCapex > 0 ? 'text-amber-400' : 'text-stone-500'}`}>
                  ~€{totalCapex.toLocaleString()}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-stone-850 flex justify-between items-center">
                <div>
                  <span className="block font-mono text-[9px] text-stone-400 uppercase">Emissions Cut (CO₂e/yr)</span>
                  <span className="font-mono text-lg font-semibold text-stone-100">
                    {Math.round(impactTotals.totalCO2CutYr).toLocaleString()} tonnes
                  </span>
                </div>

                <div className="text-right">
                  <span className="block font-mono text-[9px] text-stone-400 uppercase">SUPPLIERS SHIFTED</span>
                  <span className="font-mono text-lg font-bold text-amber-400">
                    {impactTotals.improvedCount} / {scopedSuppliers.length}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Cost Benchmarking Shelf */}
          <Card className="border-stone-200">
            <div className="pb-3 border-b border-stone-150 mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] text-stone-400 block font-semibold tracking-wider">
                ACTIVE CARBON INTENSITY SHELF
              </span>
              <BarChart2 className="w-4 h-4 text-stone-300" />
            </div>

            <div className="space-y-2.5">
              {rankedShelf.map((item, idx) => {
                const colors = getIntensityColorClass(item.intensity, item.benchmark);
                const isBaselineTop = item.baseRank === 0;
                
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    
                    {/* Rank indicator */}
                    <div className="w-5 text-right font-mono text-xs font-semibold text-stone-400">
                      #{idx + 1}
                    </div>

                    {/* Bar visualization */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                        <span className="font-semibold text-stone-800">
                          <FlagEmoji countryCode={item.country} />
                          {item.name.substring(0, 15)}
                        </span>
                        <span>{item.intensity.toFixed(2)} t/t</span>
                      </div>

                      <div className="relative h-2.5 bg-stone-200/50 rounded-full overflow-hidden flex items-center">
                        {/* Shaded bar */}
                        <div 
                          className={`h-full rounded-full ${colors}`} 
                          style={{ width: `${Math.max(10, Math.min(100, (item.intensity / 4.0) * 100))}%` }} 
                        />
                        
                        {/* Ghost baseline marker */}
                        <div 
                          className="absolute w-0.5 h-full bg-stone-400 border-x border-white"
                          style={{ left: `${Math.max(10, Math.min(100, (SUPPLIERS.find(s => s.id === item.id)?.selfReported || 1) / 4.0 * 100))}%` }}
                          title="Baseline position anchor"
                        />
                      </div>
                    </div>

                    {/* Rank change indicator */}
                    <div className="w-10 text-right">
                      {item.rankShift > 0 ? (
                        <span className="font-mono text-[9px] font-bold text-emerald-800 bg-emerald-500/10 border border-emerald-550/20 px-2 py-0.5 rounded-full">
                          ▲ {item.rankShift}
                        </span>
                      ) : item.rankShift < 0 ? (
                        <span className="font-mono text-[9px] text-rose-700 bg-rose-500/10 border border-rose-550/20 px-2 py-0.5 rounded-full">
                          ▼ {Math.abs(item.rankShift)}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-stone-350">
                          —
                        </span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </Card>

        </div>

      </div>

      {mode === 'pitch' && (
        <Card className="bg-[#1C1E1B] text-stone-300 border-stone-900 p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-1.5 font-mono text-amber-500 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>EXPLAINING SIMULATOR DESIGN INTENT</span>
          </div>
          <h4 className="font-serif text-xl text-stone-100 italic">
            Visualizing the Payoff Model
          </h4>
          <p className="font-sans text-xs leading-relaxed font-light text-stone-400">
            Importers need actionable compliance arguments to drive supply chain changes.
            Each slider is constrained between the route's best-practice benchmark floor and the independent-estimate ceiling, so the <strong className="text-stone-300">intensity → cost</strong> mechanic is defensible. The retrofit presets and their CapEx figures (solar/wind PPA, H₂ kiln, scrap-EAF) are <strong className="text-stone-300">illustrative order-of-magnitude placeholders</strong>, not quoted capital costs.
            The live Cost Shelf illustrates the direct relational ranking shift of your supplier pool as physical factories embrace greener routes (e.g. pivoting blast furnace steel to EAF scrap recycling drops overall liability immediately).
          </p>
        </Card>
      )}

    </div>
  );
}
