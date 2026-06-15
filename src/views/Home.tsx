import { SUPPLIERS, IMPORTER } from '../data/suppliers'
import { forecast, forecastTotals, EUR, NUM } from '../lib/calc'
import { evaluateFlag } from '../lib/flag'
import { productFor } from '../data/products'
import { useAppState } from '../state/appState'
import { Card, SectionTitle, Stat, Pill, VerifyBadge } from '../components/ui'

const DECLARATION_DUE = new Date('2027-09-30T00:00:00Z')

export default function Home() {
  const { statusOf, requestVerification, setView } = useAppState()
  const rows = forecast(SUPPLIERS)
  const { cumulativeAvoidable } = forecastTotals(rows)
  const y2026 = rows.find((r) => r.year === 2026)!

  const daysToDue = Math.max(
    0,
    Math.ceil((DECLARATION_DUE.getTime() - new Date().getTime()) / 86_400_000),
  )

  // What needs the importer's attention, ranked.
  type Item = {
    id: string
    name: string
    product: string
    reason: string
    kind: 'verify' | 'request' | 'awaiting'
    severity?: 'priority' | 'watch'
    rank: number
  }
  const items: Item[] = []
  for (const s of SUPPLIERS) {
    if (s.inSharedPool) continue // already verified via the pool
    const st = statusOf(s.id)
    if (st === 'received') continue
    const flag = evaluateFlag(s)
    const product = productFor(s.cnCode).name
    if (st === 'requested') {
      items.push({ id: s.id, name: s.name, product, reason: 'Verified data requested — awaiting supplier', kind: 'awaiting', rank: 2 })
    } else if (flag.flagged) {
      items.push({
        id: s.id,
        name: s.name,
        product,
        reason: `Self-report diverges −${Math.round(flag.divergence * 100)}% below the independent estimate`,
        kind: 'verify',
        severity: flag.severity === 'priority' ? 'priority' : 'watch',
        rank: 0,
      })
    } else {
      items.push({ id: s.id, name: s.name, product, reason: 'No verified data on file — on punitive default values', kind: 'request', rank: 1 })
    }
  }
  items.sort((a, b) => a.rank - b.rank)
  const open = items.filter((i) => i.kind !== 'awaiting').length

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker={`${IMPORTER.name} · EORI ${IMPORTER.eori}`}
        title="CBAM workspace"
        sub="Your obligations, exposure, and what needs doing — at a glance."
      />

      {/* Owe / due / attention */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card relative overflow-hidden p-4">
          <span className="absolute inset-x-0 top-0 h-1 bg-warn" />
          <div className="text-xs font-medium uppercase tracking-wide text-mute">First declaration due</div>
          <div className="stat-num mt-1 text-2xl font-semibold text-warn">{NUM(daysToDue)} days</div>
          <div className="mt-1 text-xs text-mute">30 Sep 2027 · covers 2026 imports</div>
        </div>
        <Stat label="2026 liability accruing" value={EUR(y2026.defaultCost)} sub="No cash out yet — building" tone="accent" />
        <Stat label="Avoidable 2026–2034" value={EUR(cumulativeAvoidable)} sub="With verified supplier data" tone="good" />
        <Stat
          label="Suppliers needing action"
          value={open}
          sub={`${items.length - open} awaiting data`}
          tone={open > 0 ? 'danger' : 'good'}
        />
      </div>

      {/* Attention queue */}
      <Card className="!p-0">
        <div className="flex items-center justify-between px-5 pt-5">
          <SectionTitle title="Needs your attention" sub="Work the queue — request verified data where it cuts cost or clears a flag." />
          <button onClick={() => setView('verify')} className="shrink-0 text-xs text-accent hover:underline">
            open verification →
          </button>
        </div>
        {items.length === 0 ? (
          <div className="px-5 pb-5 text-sm text-mute">All clear — every supplier is verified or in the pool. 🎉</div>
        ) : (
          <div className="divide-y divide-edge border-t border-edge">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        it.kind === 'verify' ? 'bg-warn' : it.kind === 'request' ? 'bg-accent' : 'bg-mute'
                      }`}
                    />
                    <span className="truncate text-sm font-medium text-text">{it.name}</span>
                    {it.kind === 'verify' && it.severity && <VerifyBadge severity={it.severity} />}
                    {it.kind === 'awaiting' && <Pill tone="good">requested</Pill>}
                  </div>
                  <div className="mt-0.5 pl-4 text-xs text-mute">
                    <span className="text-text">{it.product}</span> · {it.reason}
                  </div>
                </div>
                {it.kind !== 'awaiting' ? (
                  <button
                    onClick={() => requestVerification(it.id)}
                    className="shrink-0 rounded-lg border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/10"
                  >
                    Request verified data
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-mute">awaiting supplier</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick jumps */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { v: 'dashboard', label: 'Cost & forecast', icon: '▦' },
          { v: 'suppliers', label: 'Suppliers', icon: '◷' },
          { v: 'simulator', label: 'What-if a switch', icon: '∿' },
          { v: 'evidence', label: 'Evidence', icon: '▤' },
        ].map((q) => (
          <button
            key={q.v}
            onClick={() => setView(q.v)}
            className="card flex items-center gap-3 p-4 text-left hover:bg-panel2"
          >
            <span className="text-lg text-brand">{q.icon}</span>
            <span className="text-sm font-medium text-text">{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
