// CarbonBridge — CN-code → real product, so the app speaks in materials an
// importer actually declares (per CN code) rather than bare "steel/aluminium".
// CBAM obligations, default values and declaration lines are all per CN code.

export interface CnProduct {
  cn: string // dotted CN code, e.g. 7208.27
  name: string
  group: 'steel' | 'aluminium' | 'cement'
}

export const CN_PRODUCTS: Record<string, CnProduct> = {
  '72071100': { cn: '7207.11', name: 'Semi-finished steel (slab/billet)', group: 'steel' },
  '72082700': { cn: '7208.27', name: 'Hot-rolled coil', group: 'steel' },
  '72083900': { cn: '7208.39', name: 'Hot-rolled sheet', group: 'steel' },
  '72142000': { cn: '7214.20', name: 'Rebar (EAF long product)', group: 'steel' },
  '25232900': { cn: '2523.29', name: 'Portland cement', group: 'cement' },
  '76011000': { cn: '7601.10', name: 'Unwrought aluminium (unalloyed)', group: 'aluminium' },
  '76012000': { cn: '7601.20', name: 'Unwrought aluminium alloys', group: 'aluminium' },
}

export function productFor(cnCode: string): CnProduct {
  return CN_PRODUCTS[cnCode] ?? { cn: cnCode, name: 'Product', group: 'steel' }
}

/** Deterministic "verified by N other importers" count for shared-pool suppliers. */
export function poolVerifierCount(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return 2 + (h % 5) // 2–6
}
