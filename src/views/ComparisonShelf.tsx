import { useState } from 'react'
import { SUPPLIERS } from '../data/suppliers'
import { supplierYearCost, verifiedIntensity, effectiveDefault, EUR, NUM } from '../lib/calc'
import { evaluateFlag } from '../lib/flag'
import {
  Card,
  SectionTitle,
  RangeBadge,
  Pill,
  VerifyBadge,
  FlagEmoji,
} from '../components/ui'

const YEARS = [2026, 2027, 2030, 2034]

export default function ComparisonShelf() {
  const [year, setYear] = useState(2030)

  const ranked = [...SUPPLIERS]
    .map((s) => ({ s, cost: supplierYearCost(s, year) }))
    .sort((a, b) => b.cost.avoidable - a.cost.avoidable)

  const maxCost = Math.max(...ranked.map((r) => r.cost.defaultCost))

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Comparison shelf"
        title="Suppliers ranked by avoidable carbon cost"
        sub="Each bar splits the unavoidable verified cost (green) from the avoidable overpayment you'd incur on default values (red). The independent estimate is always shown as a range + confidence — never a single hard number."
        right={
          <div className="flex items-center gap-1 rounded-xl border border-edge bg-panel2 p-1">
            {YEARS.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`rounded-lg px-3 py-1 text-sm transition ${
                  y === year ? 'bg-brand/15 text-brand' : 'text-mute hover:text-text'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        }
      />

      <Card className="!p-0">
        <div className="divide-y divide-edge">
          {ranked.map(({ s, cost }, i) => {
            const flag = evaluateFlag(s)
            const vIntensity = verifiedIntensity(s)
            const dIntensity = effectiveDefault(s, year)
            const verifiedPct = (cost.verifiedCost / maxCost) * 100
            const avoidablePct = (cost.avoidable / maxCost) * 100
            return (
              <div key={s.id} className="grid grid-cols-12 items-center gap-4 px-5 py-4">
                {/* Rank + identity */}
                <div className="col-span-12 lg:col-span-4">
                  <div className="flex items-center gap-2">
                    <span className="stat-num w-6 text-sm text-mute">#{i + 1}</span>
                    <FlagEmoji code={s.countryCode} />
                    <span className="font-medium text-text">{s.name}</span>
                    {flag.flagged && (
                      <VerifyBadge severity={flag.severity === 'priority' ? 'priority' : 'watch'} />
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-8">
                    <Pill>{s.commodity}</Pill>
                    {s.productionRoute !== 'n/a' && <Pill>{s.productionRoute}</Pill>}
                    <Pill title="CBAM CN code">CN {s.cnCode}</Pill>
                    {s.inSharedPool && (
                      <Pill tone="pool" title="Verified data already in the shared cross-company pool">
                        ◇ in pool
                      </Pill>
                    )}
                  </div>
                </div>

                {/* Cost bar */}
                <div className="col-span-12 lg:col-span-5">
                  <div className="flex h-7 w-full overflow-hidden rounded-lg bg-panel2">
                    <div
                      className="h-full bg-brand/60"
                      style={{ width: `${verifiedPct}%` }}
                      title={`Verified cost: ${EUR(cost.verifiedCost)}`}
                    />
                    <div
                      className="h-full bg-danger/55"
                      style={{ width: `${avoidablePct}%` }}
                      title={`Avoidable overpayment: ${EUR(cost.avoidable)}`}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-mute">
                    <span>
                      verified <span className="text-brand">{EUR(cost.verifiedCost)}</span>
                    </span>
                    <span>
                      avoidable <span className="text-danger">{EUR(cost.avoidable)}</span>
                    </span>
                  </div>
                </div>

                {/* Estimate range + intensities */}
                <div className="col-span-12 lg:col-span-3 lg:text-right">
                  <div className="lg:flex lg:justify-end">
                    <RangeBadge range={s.independentEstimate} confidence={s.estimateConfidence} />
                  </div>
                  <div className="mt-1 text-[11px] text-mute">
                    self-report{' '}
                    <span className={flag.flagged ? 'text-warn' : 'text-text'}>
                      {NUM(s.selfReported, 2)}
                    </span>{' '}
                    · default{' '}
                    <span className="text-danger">{NUM(dIntensity, 2)}</span>{' '}
                    · verified-basis{' '}
                    <span className="text-brand">{NUM(vIntensity, 2)}</span> tCO₂/t
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-4 text-xs text-mute">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-brand/60" /> unavoidable
          (verified) cost
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-danger/55" /> avoidable
          overpayment on defaults
        </span>
        <span className="ml-auto">
          Ranked by avoidable cost in {year}. Verified-basis uses the independent
          estimate midpoint unless the supplier is in the verified pool.
        </span>
      </div>
    </div>
  )
}
