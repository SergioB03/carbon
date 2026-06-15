// CarbonBridge — CBAM regulatory constants.
// These reflect the ACTUAL phase-in so the demo survives a policy-literate judge.
// Sources named in docs/MOCK_DATA.md. All euro figures are illustrative.

/**
 * Illustrative CBAM certificate price (€/tCO2e).
 * The LEGAL number is the Commission's *quarterly average* EUA-linked price —
 * NOT a live spot price. We model it as a fixed quarterly average for the POC.
 */
export const CERT_PRICE_EUR = 78

/**
 * CBAM factor by year = the share of embedded emissions that must actually be
 * paid for, as free allocation phases out through 2034.
 * 2026 starts at just 2.5% — which is WHY 2026 net cost is small and the curve
 * climbs steeply later. Do not show a giant 2026 cash-out.
 */
export interface PhaseInYear {
  year: number
  cbamFactor: number
  /** 'accruing' = liability building, no cash out yet. 'first-payment' = first bill. */
  status: 'accruing' | 'first-payment' | 'scaling'
  note: string
}

export const PHASE_IN: PhaseInYear[] = [
  { year: 2026, cbamFactor: 0.025, status: 'accruing', note: 'Definitive phase begins. Liability accrues; no payment yet.' },
  { year: 2027, cbamFactor: 0.05, status: 'first-payment', note: 'First declaration + certificate surrender due 30 Sept 2027 (for 2026). Cert sales begin Feb 2027.' },
  { year: 2028, cbamFactor: 0.10, status: 'scaling', note: 'Free allocation continues to phase out.' },
  { year: 2029, cbamFactor: 0.225, status: 'scaling', note: '' },
  { year: 2030, cbamFactor: 0.485, status: 'scaling', note: '' },
  { year: 2031, cbamFactor: 0.61, status: 'scaling', note: '' },
  { year: 2032, cbamFactor: 0.735, status: 'scaling', note: '' },
  { year: 2033, cbamFactor: 0.86, status: 'scaling', note: '' },
  { year: 2034, cbamFactor: 1.0, status: 'scaling', note: 'Free allocation fully gone — CBAM at 100%.' },
]

/**
 * Mark-up applied to punitive default values, by year (Reg. (EU) 2025/2621):
 * 10% (2026), 20% (2027), 30% (2028+) for steel/aluminium/cement.
 * This is what makes defaults "double or triple" real costs over time.
 */
export function defaultMarkup(year: number): number {
  if (year <= 2026) return 0.10
  if (year === 2027) return 0.20
  return 0.30
}

/** Importers under this annual tonnage are exempt (Omnibus, Reg. (EU) 2025/2083). */
export const SMALL_IMPORTER_EXEMPTION_TONNES = 50

export function phaseFor(year: number): PhaseInYear {
  return PHASE_IN.find((p) => p.year === year) ?? PHASE_IN[PHASE_IN.length - 1]
}
