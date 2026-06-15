import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { HISTORY } from '../lib/history'
import { NUM } from '../lib/calc'
import { Card, SectionTitle, Stat, Pill, ConfidenceChip } from '../components/ui'

const FULL_YEARS = [2021, 2022, 2023, 2024, 2025]
const COMMODITY: Record<string, string> = {
  'iron-and-steel': 'Steel',
  cement: 'Cement',
  aluminum: 'Aluminium',
}
const COMMODITY_COLOR: Record<string, string> = {
  Steel: '#60a5fa',
  Cement: '#7d8aa5',
  Aluminium: '#f59e0b',
}

const short = (n: string) =>
  n.replace(/\b(steel plant|aluminium plant|Cement Plant|plant)\b/gi, '').replace(/\s+/g, ' ').trim()

export default function Evidence() {
  const [metric, setMetric] = useState<'emissions' | 'production'>('emissions')

  // Chart 1: real measured emissions/production by year, stacked by commodity.
  const byYear = FULL_YEARS.map((y) => {
    const row: Record<string, number | string> = { year: y, Steel: 0, Cement: 0, Aluminium: 0 }
    for (const f of HISTORY.facilities) {
      const s = f.series.find((x) => x.year === y && !x.partial)
      if (!s) continue
      const label = COMMODITY[f.subsector] ?? 'Steel'
      const v = (metric === 'emissions' ? s.emissions : s.production) / 1e6
      row[label] = (row[label] as number) + v
    }
    return row
  })

  // Chart 2: CBAM-scope vs out-of-scope footprint, per facility.
  const scopeRows = HISTORY.facilities
    .map((f) => {
      const priced = f.latest.intensity
      const full = f.latest.fullIntensity ?? priced
      return { name: short(f.name), priced, outScope: Math.max(0, full - priced), full, route: f.route }
    })
    .sort((a, b) => b.full - a.full)

  const latestTotal = HISTORY.facilities.reduce(
    (a, f) => a + (f.series.find((s) => s.year === 2025 && !s.partial)?.emissions ?? 0),
    0,
  )
  const cumulative = HISTORY.facilities.reduce(
    (a, f) => a + f.series.filter((s) => !s.partial).reduce((b, s) => b + s.emissions, 0),
    0,
  )

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Evidence — real measured data"
        title="Before any forecast: this is the ground truth we're standing on"
        sub="Every estimate, flag and cost in CarbonBridge traces back to this — real, named-facility emissions measured by Climate TRACE. No model output, no guesses."
        right={<Pill tone="good">● real data</Pill>}
      />

      {/* Provenance headline */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Named facilities" value={HISTORY.facilities.length} sub="steel · cement · aluminium" tone="accent" />
        <Stat label="Years measured" value={`${FULL_YEARS[0]}–${FULL_YEARS[FULL_YEARS.length - 1]}`} sub="annual, + partial 2026" />
        <Stat label="CO₂e measured 2025" value={`${NUM(latestTotal / 1e6, 1)} Mt`} sub="across the book" tone="warn" />
        <Stat label="Cumulative 21–25" value={`${NUM(cumulative / 1e6, 0)} Mt`} sub="real observed total" tone="danger" />
      </div>

      {/* Why it matters NOW */}
      <div className="card border-l-4 border-l-brand p-4">
        <div className="text-sm font-semibold text-text">Why this matters right now (no prediction needed)</div>
        <ul className="mt-2 grid gap-1.5 text-sm text-mute sm:grid-cols-3">
          <li>→ It sets each supplier's <span className="text-text">independent estimate range + confidence</span> — measured, not invented.</li>
          <li>→ It's the baseline the <span className="text-text">Verification Priority</span> flag diverges from.</li>
          <li>→ It anchors the <span className="text-text">cost</span> — real intensity × the legislated CBAM schedule.</li>
        </ul>
      </div>

      {/* Chart 1 — real measured volume over time */}
      <Card>
        <SectionTitle
          title={`Real measured ${metric} by year`}
          sub="Stacked by commodity. This is the actual tonnage moving through the book — it genuinely varies year to year (the part of the data that moves)."
          right={
            <div className="flex items-center gap-1 rounded-xl border border-edge bg-panel2 p-1">
              {(['emissions', 'production'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`rounded-lg px-3 py-1 text-sm capitalize transition ${
                    m === metric ? 'bg-brand/15 text-brand' : 'text-mute hover:text-text'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          }
        />
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byYear} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243049" vertical={false} />
              <XAxis dataKey="year" stroke="#7d8aa5" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#7d8aa5"
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v) => `${v} Mt`}
              />
              <Tooltip
                contentStyle={{ background: '#121a2b', border: '1px solid #243049', borderRadius: 12, color: '#e6ecf7' }}
                formatter={(v: number, n) => [`${NUM(v, 2)} Mt`, n]}
                labelFormatter={(l) => `${l} · measured`}
              />
              {(['Steel', 'Cement', 'Aluminium'] as const).map((k) => (
                <Bar key={k} dataKey={k} stackId="a" fill={COMMODITY_COLOR[k]} radius={[0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-mute">
          {(['Steel', 'Cement', 'Aluminium'] as const).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded-sm" style={{ background: COMMODITY_COLOR[k] }} /> {k}
            </span>
          ))}
        </div>
      </Card>

      {/* Chart 2 — CBAM scope vs out-of-scope footprint */}
      <Card>
        <SectionTitle
          title="What's actually priced: CBAM-scope vs full footprint"
          sub="Green is the CBAM-priced intensity (steel: direct; aluminium: direct+PFCs). Grey is the cradle-to-gate remainder — mostly electricity — that CBAM does NOT price. The aluminium smelters make the point: most of their footprint is out of scope."
        />
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={scopeRows}
              margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#243049" horizontal={false} />
              <XAxis type="number" stroke="#7d8aa5" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#7d8aa5"
                tickLine={false}
                axisLine={false}
                width={150}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ background: '#121a2b', border: '1px solid #243049', borderRadius: 12, color: '#e6ecf7' }}
                formatter={(v: number, n) => [
                  `${NUM(v, 2)} tCO₂e/t`,
                  n === 'priced' ? 'CBAM-priced' : 'Out of scope (electricity etc.)',
                ]}
              />
              <Bar dataKey="priced" stackId="s" fill="#34d399" radius={[3, 0, 0, 3]}>
                {scopeRows.map((_, i) => (
                  <Cell key={i} />
                ))}
              </Bar>
              <Bar dataKey="outScope" stackId="s" fill="#3a4a6a" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-mute">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm bg-brand" /> CBAM-priced intensity</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm bg-[#3a4a6a]" /> out of CBAM scope (mostly grid electricity)</span>
        </div>
      </Card>

      {/* Provenance table */}
      <Card className="!p-0 overflow-hidden">
        <div className="border-b border-edge px-5 py-3 text-sm font-semibold text-text">
          Facility provenance — every row is auditable
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wide text-mute">
                <th className="px-5 py-2 font-medium">Facility</th>
                <th className="px-3 py-2 font-medium">Route</th>
                <th className="px-3 py-2 text-right font-medium">CBAM int.</th>
                <th className="px-3 py-2 text-right font-medium">Full</th>
                <th className="px-3 py-2 font-medium">Owner · LEI</th>
                <th className="px-3 py-2 font-medium">Conf.</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.facilities.map((f) => (
                <tr key={f.id} className="border-b border-edge/50 last:border-0">
                  <td className="px-5 py-2.5">
                    <div className="font-medium text-text">{short(f.name)}</div>
                    <div className="text-[11px] text-mute">{f.country}</div>
                  </td>
                  <td className="px-3 py-2.5 text-mute">{f.route}</td>
                  <td className="stat-num px-3 py-2.5 text-right text-brand">{NUM(f.latest.intensity, 2)}</td>
                  <td className="stat-num px-3 py-2.5 text-right text-mute">
                    {f.latest.fullIntensity ? NUM(f.latest.fullIntensity, 2) : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-text">{f.owner.parent}</div>
                    {f.owner.lei && <div className="stat-num text-[11px] text-accent">{f.owner.lei}</div>}
                  </td>
                  <td className="px-3 py-2.5">
                    <ConfidenceChip level={f.confidence as 'low' | 'medium' | 'high'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-mute">
        {HISTORY.source} · {HISTORY.release}. Modelled satellite + ML estimates, not
        audited installation reports — a credible baseline for triage and costing,
        not a compliance filing. This is the present-day value of the data; the
        forecast is a separate, deliberately conservative step.
      </p>
    </div>
  )
}
