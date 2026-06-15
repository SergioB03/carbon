import type { Supplier, ForecastYear } from '../types'
import { CERT_PRICE_EUR, PHASE_IN, defaultMarkup, phaseFor } from '../data/cbam'

// CarbonBridge — CBAM cost math.
//
// Story we tell (accurately): liability ACCRUES in 2026 at a 2.5% factor, the
// FIRST payment lands 30 Sept 2027, and the curve climbs steeply through 2034
// as free allocation phases out. The avoidable slice is the gap between being
// stuck on punitive DEFAULT values vs using VERIFIED actual supplier data.

export interface IntensityChoice {
  /** Override the intensity used for the "verified" path (e.g. simulator). */
  [supplierId: string]: number | undefined
}

/** Embedded emissions (tCO2e/yr) for a supplier at a given intensity. */
export function embeddedEmissions(s: Supplier, intensity: number): number {
  return s.annualTonnesImported * intensity
}

/** Cert cost (€) for one supplier, one year, at a given intensity. */
export function yearCost(
  s: Supplier,
  intensity: number,
  year: number,
): number {
  const factor = phaseFor(year).cbamFactor
  return embeddedEmissions(s, intensity) * factor * CERT_PRICE_EUR
}

/** The punitive default intensity for a year, including the annual mark-up. */
export function effectiveDefault(s: Supplier, year: number): number {
  return s.countryDefaultValue * (1 + defaultMarkup(year))
}

/**
 * The intensity we'd actually declare with verified data. We use the lower of
 * the supplier's self-report and the independent estimate midpoint ONLY if the
 * supplier is in the verified pool; otherwise we conservatively use the
 * independent estimate midpoint (you can't bank an unverified self-report).
 */
export function verifiedIntensity(
  s: Supplier,
  override?: number,
): number {
  if (typeof override === 'number') return override
  const mid = (s.independentEstimate.low + s.independentEstimate.high) / 2
  return s.inSharedPool ? Math.min(s.selfReported, mid) : mid
}

/** Full 2026–2034 forecast for the whole book, with an optional per-supplier override. */
export function forecast(
  suppliers: Supplier[],
  overrides: IntensityChoice = {},
): ForecastYear[] {
  return PHASE_IN.map((p) => {
    let defaultCost = 0
    let verifiedCost = 0
    for (const s of suppliers) {
      defaultCost += yearCost(s, effectiveDefault(s, p.year), p.year)
      verifiedCost += yearCost(s, verifiedIntensity(s, overrides[s.id]), p.year)
    }
    return {
      year: p.year,
      cbamFactor: p.cbamFactor,
      status: p.status,
      defaultCost,
      verifiedCost,
      avoidable: defaultCost - verifiedCost,
    }
  })
}

/** Per-supplier carbon cost in a single year (for shelf ranking). */
export function supplierYearCost(
  s: Supplier,
  year: number,
  override?: number,
): { defaultCost: number; verifiedCost: number; avoidable: number } {
  const defaultCost = yearCost(s, effectiveDefault(s, year), year)
  const verifiedCost = yearCost(s, verifiedIntensity(s, override), year)
  return { defaultCost, verifiedCost, avoidable: defaultCost - verifiedCost }
}

/** Totals across a forecast — used for headline stats. */
export function forecastTotals(rows: ForecastYear[]) {
  const cumulativeAvoidable = rows.reduce((a, r) => a + r.avoidable, 0)
  const firstPaymentYear = rows.find((r) => r.status === 'first-payment')?.year
  const peak = rows[rows.length - 1]
  return { cumulativeAvoidable, firstPaymentYear, peak }
}

export const EUR = (n: number, frac = 0) =>
  new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: frac,
    minimumFractionDigits: frac,
  }).format(n)

export const NUM = (n: number, frac = 0) =>
  new Intl.NumberFormat('en-IE', {
    maximumFractionDigits: frac,
    minimumFractionDigits: frac,
  }).format(n)
