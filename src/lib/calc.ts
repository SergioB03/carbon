/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Supplier, MaterialLens, VerifyStatus, HistoricEmission } from '../types';

export const CERT_PRICE_EUR = 78;

export const PHASE_IN: { [year: number]: number } = {
  2026: 0.025,  // 2.5%
  2027: 0.050,  // 5% (First payment due Sep 30, 2027)
  2028: 0.100,  // 10%
  2029: 0.225,  // 22.5%
  2030: 0.485,  // 48.5%
  2031: 0.610,  // 61%
  2032: 0.735,  // 73.5%
  2033: 0.860,  // 86%
  2034: 1.000,  // 100% (Full rate)
};

export const DEFAULT_MARKUP: { [year: number]: number } = {
  2026: 0.10, // 10% markup
  2027: 0.20, // 20% markup
  2028: 0.30, // 30% markup
  2029: 0.30,
  2030: 0.30,
  2031: 0.30,
  2032: 0.30,
  2033: 0.30,
  2034: 0.30,
};

// Filters supplier list based on global lens
export function byMaterial(suppliers: Supplier[], material: MaterialLens): Supplier[] {
  if (material === 'all') return suppliers;
  return suppliers.filter((s) => s.commodity === material);
}

// Estimates of Climate TRACE based on confidence widths
export function getLatestIntensity(supplier: Supplier): number {
  if (supplier.history.length === 0) return supplier.selfReported;
  // Get 2025 emissions
  const index = supplier.history.findIndex(h => h.year === 2025);
  return index !== -1 ? supplier.history[index].intensity : supplier.history[supplier.history.length - 1].intensity;
}

export function getEstimateRange(supplier: Supplier): { low: number; high: number } {
  const latest = getLatestIntensity(supplier);
  let spread = 0.10; // high confidence
  if (supplier.estimateConfidence === 'medium') spread = 0.20;
  if (supplier.estimateConfidence === 'low') spread = 0.35;
  
  return {
    low: Math.max(0.05, latest * (1 - spread)),
    high: latest * (1 + spread),
  };
}

export function getEstimateMidpoint(supplier: Supplier): number {
  return getLatestIntensity(supplier);
}

// Determines intensity based on self-reported check
export function getVerifiedIntensity(supplier: Supplier, status: 'none' | 'requested' | 'received' | string): number {
  const isVerified = status === 'received' || supplier.inSharedPool;
  const midpoint = getEstimateMidpoint(supplier);
  
  if (isVerified) {
    // If verified, can bank lower self-reported number
    return Math.min(supplier.selfReported, midpoint);
  }
  
  // Otherwise, forced on independent estimate midpoint
  return midpoint;
}

// Calculates raw carbon cost with specified intensity and year
export function calculateCost(
  tonnes: number,
  intensity: number,
  year: number
): number {
  const phaseFactor = PHASE_IN[year] || PHASE_IN[2034];
  return tonnes * intensity * phaseFactor * CERT_PRICE_EUR;
}

// Calculates default cost with punitive markup
export function calculateDefaultCost(
  supplier: Supplier,
  year: number
): number {
  const markup = DEFAULT_MARKUP[year] || DEFAULT_MARKUP[2034];
  const punitiveIntensity = supplier.countryDefaultValue * (1 + markup);
  return calculateCost(supplier.annualTonnesImported, punitiveIntensity, year);
}

// Calculates actual verified cost (incorporates shared pool & active state checks)
export function calculateVerifiedCost(
  supplier: Supplier,
  verifyStatus: VerifyStatus,
  year: number,
  sliderOverrides: { [id: string]: number } = {}
): number {
  // A simulator slider override represents the supplier operating at that
  // intensity going forward, so it must apply to EVERY projected year — not just
  // 2030 — otherwise the cumulative 2026–2034 savings are badly undercounted.
  const overrideVal = sliderOverrides[supplier.id];

  const intensity = overrideVal !== undefined
    ? overrideVal
    : getVerifiedIntensity(supplier, verifyStatus[supplier.id] || 'none');

  return calculateCost(supplier.annualTonnesImported, intensity, year);
}

// Calculates complete ledger projections
export function calculateSummaries(
  suppliers: Supplier[],
  verifyStatus: VerifyStatus,
  year: number,
  sliderOverrides: { [id: string]: number } = {}
) {
  let totalDefault = 0;
  let totalVerified = 0;
  let totalAvoidable = 0;
  let totalTonnesImported = 0;

  suppliers.forEach((s) => {
    const sDefault = calculateDefaultCost(s, year);
    const sVerified = calculateVerifiedCost(s, verifyStatus, year, sliderOverrides);
    
    totalDefault += sDefault;
    totalVerified += sVerified;
    totalAvoidable += Math.max(0, sDefault - sVerified);
    totalTonnesImported += s.annualTonnesImported;
  });

  return {
    totalDefault,
    totalVerified,
    totalAvoidable,
    totalTonnesImported,
  };
}

// Projected timeline ledger totals (2026-2034)
export function calculateTimelineProjection(
  suppliers: Supplier[],
  verifyStatus: VerifyStatus,
  sliderOverrides: { [id: string]: number } = {}
): { year: number; defaultCost: number; verifiedCost: number; avoidable: number }[] {
  const years = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034];
  return years.map((y) => {
    const { totalDefault, totalVerified, totalAvoidable } = calculateSummaries(
      suppliers,
      verifyStatus,
      y,
      sliderOverrides
    );
    return {
      year: y,
      defaultCost: totalDefault,
      verifiedCost: totalVerified,
      avoidable: totalAvoidable,
    };
  });
}
