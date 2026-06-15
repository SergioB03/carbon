import { useMemo, useState } from 'react'
import { SUPPLIERS } from '../data/suppliers'
import { CERT_PRICE_EUR } from '../data/cbam'
import {
  forecast,
  verifiedIntensity,
  supplierYearCost,
  EUR,
  NUM,
} from '../lib/calc'
import { Card, SectionTitle, Pill, RangeBadge, FlagEmoji } from '../components/ui'

const SIM_YEAR = 2030

export default function Simulator() {
  // Anchor on a supplier whose independent estimate is a real sourced range, so
  // the wow moment has a credible baseline rather than a made-up slider.
  const [selectedId, setSelectedId] = useState(SUPPLIERS[0].id)
  const selected = SUPPLIERS.find((s) => s.id === selectedId)!

  const baselineIntensity = verifiedIntensity(selected)
  const floor = +(selected.benchmark).toFixed(2)
  const ceil = +selected.independentEstimate.high.toFixed(2)
  const [intensity, setIntensity] = useState(baselineIntensity)

  // Reset slider when switching supplier.
  const onSelect = (id: string) => {
    setSelectedId(id)
    const s = SUPPLIERS.find((x) => x.id === id)!
    setIntensity(verifiedIntensity(s))
  }

  const sim = useMemo(() => {
    const overrides = { [selectedId]: intensity }
    const baseRows = forecast(SUPPLIERS)
    const simRows = forecast(SUPPLIERS, overrides)
    const cumSaved = baseRows.reduce(
      (a, r, i) => a + (r.verifiedCost - simRows[i].verifiedCost),
      0,
    )
    const co2CutPerYr = (baselineIntensity - intensity) * selected.annualTonnesImported
    const yearSaved =
      supplierYearCost(selected, SIM_YEAR).verifiedCost -
      supplierYearCost(selected, SIM_YEAR, intensity).verifiedCost

    // Ranking by per-tonne carbon cost in SIM_YEAR (cheapest = best, rank 1).
    const ranked = [...SUPPLIERS]
      .map((s) => {
        const intens = s.id === selectedId ? intensity : verifiedIntensity(s)
        const perTonne = intens * CERT_PRICE_EUR
        return { s, perTonne }
      })
      .sort((a, b) => a.perTonne - b.perTonne)
    const rank = ranked.findIndex((r) => r.s.id === selectedId) + 1
    return { cumSaved, co2CutPerYr, yearSaved, ranked, rank }
  }, [selectedId, intensity, baselineIntensity, selected])

  const improved = intensity < baselineIntensity
  const pctCut = Math.round(((baselineIntensity - intensity) / baselineIntensity) * 100)

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Green-payoff simulator"
        title="What if this supplier decarbonised?"
        sub="Drag their emissions intensity down (a what-if). Watch them climb the shelf, your CBAM cost fall, and the impact ledger tick. The starting point is the sourced independent estimate — not an arbitrary number."
        right={
          <select
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
            className="rounded-xl border border-edge bg-panel2 px-3 py-2 text-sm text-text"
          >
            {SUPPLIERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.country})
              </option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Slider + anchor */}
        <Card className="lg:col-span-3">
          <div className="flex items-center gap-2">
            <FlagEmoji code={selected.countryCode} />
            <span className="font-semibold text-text">{selected.name}</span>
            <Pill>{selected.commodity}</Pill>
            {selected.productionRoute !== 'n/a' && <Pill>{selected.productionRoute}</Pill>}
          </div>
          <div className="mt-2 text-xs text-mute">
            Sourced baseline:{' '}
            <RangeBadge range={selected.independentEstimate} confidence={selected.estimateConfidence} />
          </div>

          <div className="mt-6">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm text-mute">Emissions intensity (what-if)</span>
              <span className="stat-num text-2xl font-semibold text-brand">
                {NUM(intensity, 2)} <span className="text-sm text-mute">tCO₂/t</span>
              </span>
            </div>
            <input
              type="range"
              min={floor}
              max={ceil}
              step={0.01}
              value={intensity}
              onChange={(e) => setIntensity(+e.target.value)}
              className="w-full accent-brand"
            />
            <div className="flex justify-between text-[11px] text-mute">
              <span>benchmark {NUM(floor, 2)} (best practice)</span>
              <span>est. high {NUM(ceil, 2)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm">
            {improved ? (
              <Pill tone="good">↓ {pctCut}% below sourced baseline</Pill>
            ) : (
              <Pill>at sourced baseline</Pill>
            )}
            <span className="text-mute">
              baseline {NUM(baselineIntensity, 2)} tCO₂/t · {NUM(selected.annualTonnesImported)} t/yr
            </span>
          </div>
        </Card>

        {/* Impact ledger */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-panel to-panel2">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-mute">
            Impact ledger
          </h3>
          <p className="mb-4 text-xs text-mute">What-if, vs the sourced baseline.</p>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-mute">CBAM cost saved in {SIM_YEAR}</div>
              <div className="stat-num text-3xl font-bold text-brand">
                {EUR(Math.max(0, sim.yearSaved))}
              </div>
            </div>
            <div>
              <div className="text-xs text-mute">Cumulative saved 2026–2034</div>
              <div className="stat-num text-2xl font-semibold text-brand">
                {EUR(Math.max(0, sim.cumSaved))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-edge pt-3">
              <div>
                <div className="text-xs text-mute">CO₂ cut / yr</div>
                <div className="stat-num text-xl font-semibold text-accent">
                  {NUM(Math.max(0, sim.co2CutPerYr))} t
                </div>
              </div>
              <div>
                <div className="text-xs text-mute">Shelf rank</div>
                <div className="stat-num text-xl font-semibold text-text">
                  #{sim.rank}
                  <span className="text-sm text-mute"> / {SUPPLIERS.length}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Mini shelf — watch the selected supplier climb */}
      <Card>
        <SectionTitle
          title="Live shelf — cheapest carbon cost per tonne wins"
          sub={`Ranked by carbon cost per tonne in ${SIM_YEAR}. Drag the slider above and watch ${selected.name} move.`}
        />
        <div className="space-y-1.5">
          {sim.ranked.map(({ s, perTonne }, i) => {
            const isSel = s.id === selectedId
            const max = sim.ranked[sim.ranked.length - 1].perTonne
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition ${
                  isSel ? 'bg-brand/10 ring-1 ring-brand/30' : ''
                }`}
              >
                <span className="stat-num w-6 text-xs text-mute">#{i + 1}</span>
                <FlagEmoji code={s.countryCode} />
                <span className={`w-56 truncate text-sm ${isSel ? 'font-semibold text-text' : 'text-mute'}`}>
                  {s.name}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-panel2">
                  <div
                    className={`h-full rounded-full ${isSel ? 'bg-brand' : 'bg-mute/40'}`}
                    style={{ width: `${(perTonne / max) * 100}%` }}
                  />
                </div>
                <span className="stat-num w-20 text-right text-xs text-mute">
                  {EUR(perTonne, 0)}/t
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      <p className="text-xs text-mute">
        The slider is a what-if; the baseline it starts from is the sourced
        independent estimate shown above. CBAM factor and cert price per{' '}
        <code className="text-mute">src/data/cbam.ts</code>.
      </p>
    </div>
  )
}
