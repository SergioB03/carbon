import type { Supplier, FlagResult } from '../types'

// CarbonBridge — Verification Priority Flag (formerly "greenwashing detector").
//
// CRITICAL FRAMING (see docs/SPEC.md): this is a PRIVATE TRIAGE SIGNAL shown
// only in the importer's own view. It is NOT a public accusation. Facility-level
// satellite / modeled data carries wide uncertainty (Climate TRACE power-plant
// CO2 ran ~50% low vs an established inventory; satellites can't attribute CO2
// to a single facility). So we never say "false" or "implausible" — we say
// "diverges from the independent estimate, recommend verification."

/** Under-reporting must exceed this fraction (of the estimate midpoint) to flag. */
export const DIVERGENCE_THRESHOLD = 0.2

export function midpoint(s: Supplier): number {
  return (s.independentEstimate.low + s.independentEstimate.high) / 2
}

export function evaluateFlag(
  s: Supplier,
  threshold: number = DIVERGENCE_THRESHOLD,
): FlagResult {
  const mid = midpoint(s)
  const divergence = (mid - s.selfReported) / mid

  // We only ever flag when the independent estimate is itself credible
  // (medium/high confidence). Low-confidence estimates can't justify a flag.
  const confidentEnough = s.estimateConfidence !== 'low'
  const clearlyBelowRange = s.selfReported < s.independentEstimate.low

  const flagged = confidentEnough && clearlyBelowRange && divergence > threshold

  // Priority kicks in well above the chosen threshold; watch is the band just over it.
  let severity: FlagResult['severity'] = 'none'
  if (flagged) severity = divergence > Math.max(0.33, threshold * 1.5) ? 'priority' : 'watch'

  const reason = flagged
    ? `Self-reported ${s.selfReported.toFixed(2)} sits below the independent estimate ` +
      `(${s.independentEstimate.low}–${s.independentEstimate.high} tCO₂/t, ` +
      `${s.estimateConfidence} confidence) by ~${Math.round(divergence * 100)}%. ` +
      `Recommend verification — not an accusation.`
    : confidentEnough
      ? 'Self-reported figure is consistent with the independent estimate.'
      : 'Independent estimate confidence too low to flag; treat as unverified.'

  return { flagged, divergence, reason, severity }
}

/** Convenience: all suppliers carrying a priority/watch flag, importer-view only. */
export function flaggedSuppliers(
  suppliers: Supplier[],
  threshold: number = DIVERGENCE_THRESHOLD,
): Supplier[] {
  return suppliers.filter((s) => evaluateFlag(s, threshold).flagged)
}
