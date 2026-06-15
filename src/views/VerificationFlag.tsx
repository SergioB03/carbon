import { useState } from 'react'
import { SUPPLIERS } from '../data/suppliers'
import { evaluateFlag, midpoint, DIVERGENCE_THRESHOLD } from '../lib/flag'
import { NUM } from '../lib/calc'
import { productFor } from '../data/products'
import { useAppState } from '../state/appState'
import type { Supplier } from '../types'
import {
  Card,
  SectionTitle,
  RangeBadge,
  Pill,
  VerifyBadge,
  ConfidenceChip,
  FlagEmoji,
} from '../components/ui'

/** Visual: independent range as a band, self-report as a marker, threshold gate. */
function DivergenceBar({ s, threshold }: { s: Supplier; threshold: number }) {
  const lo = s.independentEstimate.low
  const hi = s.independentEstimate.high
  const mid = midpoint(s)
  const gate = mid * (1 - threshold) // self below this = flagged
  const min = Math.min(s.selfReported, lo, gate) * 0.9
  const max = hi * 1.1
  const span = max - min || 1
  const pct = (v: number) => ((v - min) / span) * 100
  return (
    <div className="mt-3">
      <div className="relative h-8">
        <div className="absolute top-3 h-2 w-full rounded-full bg-panel2" />
        <div
          className="absolute top-3 h-2 rounded-full bg-brand/40"
          style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
          title={`Independent estimate ${lo}–${hi}`}
        />
        {/* live threshold gate marker */}
        <div
          className="absolute top-1 h-6 w-px bg-warn/70 transition-all duration-200"
          style={{ left: `${pct(gate)}%` }}
          title={`Flag gate at −${Math.round(threshold * 100)}%`}
        />
        <div
          className="absolute top-1.5 flex -translate-x-1/2 flex-col items-center transition-all duration-200"
          style={{ left: `${pct(s.selfReported)}%` }}
        >
          <div className="h-5 w-0.5 bg-text" />
        </div>
        <div
          className="absolute -translate-x-1/2 text-[10px] text-text transition-all duration-200"
          style={{ left: `${pct(s.selfReported)}%`, top: 0 }}
        >
          self {NUM(s.selfReported, 2)}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-mute">
        <span>independent {lo}–{hi} tCO₂/t</span>
        <span className="text-warn">gate −{Math.round(threshold * 100)}%</span>
      </div>
    </div>
  )
}

export default function VerificationFlag() {
  const [threshold, setThreshold] = useState(DIVERGENCE_THRESHOLD)
  const { mode, statusOf, requestVerification, resetVerification } = useAppState()

  const evaluated = SUPPLIERS.map((s) => ({ s, flag: evaluateFlag(s, threshold) }))
  const buckets = {
    priority: evaluated.filter((e) => e.flag.flagged && statusOf(e.s.id) === 'none'),
    consistent: evaluated.filter((e) => !e.flag.flagged && e.s.estimateConfidence !== 'low'),
    cantAssess: evaluated.filter((e) => !e.flag.flagged && e.s.estimateConfidence === 'low'),
  }
  const totalFlaggable = SUPPLIERS.filter((s) => evaluateFlag(s, threshold).flagged).length
  const requestedList = SUPPLIERS.filter((s) => statusOf(s.id) !== 'none')
  const request = (id: string) => requestVerification(id)
  const reset = () => resetVerification()

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Verification priority"
        title="Where to spend your limited verification budget"
        sub="A private triage signal — visible only in your importer view. Not a public claim about any company. Tune the sensitivity and work the queue."
      />

      {/* Framing banner */}
      <div className="card border-l-4 border-l-warn p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-text">
          <Pill tone="warn">🔒 Private — importer view only</Pill>
          <span>Triage signal, not an accusation</span>
        </div>
        {mode === 'pitch' && (
          <p className="mt-2 max-w-3xl text-sm text-mute">
            We flag where a supplier's self-reported number{' '}
            <span className="text-text">diverges below an independent estimate</span> by more than your
            chosen threshold — and only when the estimate is confident enough. The estimate is always a{' '}
            <span className="text-text">range + confidence</span>, never a single hard number.
          </p>
        )}
      </div>

      {/* Interactive control bar */}
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="lg:w-1/2">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm text-mute">Flag sensitivity — divergence threshold</span>
              <span className="stat-num text-lg font-semibold text-warn">
                −{Math.round(threshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.4}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(+e.target.value)}
              className="w-full accent-warn"
            />
            <div className="flex justify-between text-[11px] text-mute">
              <span>more sensitive (5%)</span>
              <span>stricter (40%)</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Metric label="To verify" value={buckets.priority.length} tone="warn" />
            <Metric label="Requested" value={requestedList.length} tone="good" />
            <Metric label="Consistent" value={buckets.consistent.length} tone="default" />
            <Metric label="Can't assess" value={buckets.cantAssess.length} tone="default" />
          </div>
        </div>
      </Card>

      {/* Priority queue */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-warn">
            ⚑ Recommend verification ({buckets.priority.length})
          </h3>
          {requestedList.length > 0 && (
            <button onClick={reset} className="text-xs text-mute hover:text-text">
              ↺ reset queue
            </button>
          )}
        </div>

        {buckets.priority.length === 0 ? (
          <Card>
            <p className="text-sm text-mute">
              {totalFlaggable === 0 && requestedList.length === 0
                ? 'Nothing exceeds the threshold — lower the sensitivity to surface borderline suppliers.'
                : 'Queue cleared 🎉 — every flagged supplier has a verification request out.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {buckets.priority.map(({ s, flag }) => (
              <Card key={s.id} className="border-warn/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FlagEmoji code={s.countryCode} />
                      <span className="font-semibold text-text">{s.name}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-mute">
                      {s.facilityName ?? 'installation unresolved'} · {s.country}
                    </div>
                  </div>
                  <VerifyBadge severity={flag.severity === 'priority' ? 'priority' : 'watch'} />
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Pill title={`CN ${productFor(s.cnCode).cn}`}>{productFor(s.cnCode).name}</Pill>
                  {s.productionRoute !== 'n/a' && <Pill>{s.productionRoute}</Pill>}
                  <Pill title="Entity-resolution confidence">match: {s.matchConfidence}</Pill>
                  <Pill tone="warn">diverges −{Math.round(flag.divergence * 100)}%</Pill>
                </div>

                <DivergenceBar s={s} threshold={threshold} />

                <p className="mt-3 rounded-lg bg-panel2 p-3 text-xs text-mute">{flag.reason}</p>

                <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                  <RangeBadge range={s.independentEstimate} confidence={s.estimateConfidence} />
                  <button
                    onClick={() => request(s.id)}
                    className="rounded-lg border border-warn/40 px-3 py-1.5 font-medium text-warn transition hover:bg-warn/10"
                  >
                    Request verified data →
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Requested (resolved) */}
      {requestedList.length > 0 && (
        <Card className="border-brand/30">
          <h3 className="mb-3 text-sm font-semibold text-brand">
            ✓ Verification requested ({requestedList.length})
          </h3>
          <ul className="space-y-2">
            {requestedList.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FlagEmoji code={s.countryCode} />
                  <span className="text-text">{s.name}</span>
                </span>
                <Pill tone={statusOf(s.id) === 'received' ? 'good' : 'accent'}>
                  {statusOf(s.id) === 'received' ? 'verified data received' : 'request sent · awaiting'}
                </Pill>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Consistent + can't-assess */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-brand">
            ✓ Consistent with independent estimate ({buckets.consistent.length})
          </h3>
          <ul className="space-y-2">
            {buckets.consistent.map(({ s }) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FlagEmoji code={s.countryCode} />
                  <span className="text-text">{s.name}</span>
                  {s.inSharedPool && <Pill tone="pool">◇ pool</Pill>}
                </span>
                <span className="text-xs text-mute">
                  self {NUM(s.selfReported, 2)} vs {s.independentEstimate.low}–{s.independentEstimate.high}
                </span>
              </li>
            ))}
            {buckets.consistent.length === 0 && <li className="text-xs text-mute">—</li>}
          </ul>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-mute">
            ◌ Can't assess — low-confidence estimate ({buckets.cantAssess.length})
          </h3>
          <p className="mb-3 text-xs text-mute">
            We never flag on a low-confidence estimate. These stay "unverified," not "implausible."
          </p>
          <ul className="space-y-2">
            {buckets.cantAssess.map(({ s }) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FlagEmoji code={s.countryCode} />
                  <span className="text-text">{s.name}</span>
                </span>
                <ConfidenceChip level={s.estimateConfidence} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'warn' | 'good' | 'default'
}) {
  const c = { warn: 'text-warn', good: 'text-brand', default: 'text-text' }[tone]
  return (
    <div className="text-center">
      <div className={`stat-num text-2xl font-bold ${c}`}>{value}</div>
      <div className="text-[11px] text-mute">{label}</div>
    </div>
  )
}
