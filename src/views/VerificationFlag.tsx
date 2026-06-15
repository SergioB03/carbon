import { SUPPLIERS } from '../data/suppliers'
import { evaluateFlag, midpoint } from '../lib/flag'
import { NUM } from '../lib/calc'
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

/** Visual: independent range as a band, self-report as a marker. Shows divergence. */
function DivergenceBar({ s }: { s: Supplier }) {
  const lo = s.independentEstimate.low
  const hi = s.independentEstimate.high
  // Scale spans a little below the self-report to a little above the high bound.
  const min = Math.min(s.selfReported, lo) * 0.9
  const max = hi * 1.1
  const span = max - min || 1
  const pct = (v: number) => ((v - min) / span) * 100
  return (
    <div className="mt-3">
      <div className="relative h-8">
        {/* track */}
        <div className="absolute top-3 h-2 w-full rounded-full bg-panel2" />
        {/* independent range band */}
        <div
          className="absolute top-3 h-2 rounded-full bg-brand/40"
          style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
          title={`Independent estimate ${lo}–${hi}`}
        />
        {/* self-report marker */}
        <div
          className="absolute top-1.5 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${pct(s.selfReported)}%` }}
        >
          <div className="h-5 w-0.5 bg-warn" />
        </div>
        <div
          className="absolute -translate-x-1/2 text-[10px] text-warn"
          style={{ left: `${pct(s.selfReported)}%`, top: 0 }}
        >
          self {NUM(s.selfReported, 2)}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-mute">
        <span>independent range {lo}–{hi} tCO₂/t</span>
        <span>midpoint {NUM(midpoint(s), 2)}</span>
      </div>
    </div>
  )
}

export default function VerificationFlag() {
  const evaluated = SUPPLIERS.map((s) => ({ s, flag: evaluateFlag(s) }))
  const priority = evaluated.filter((e) => e.flag.flagged)
  const consistent = evaluated.filter((e) => !e.flag.flagged && e.s.estimateConfidence !== 'low')
  const cantAssess = evaluated.filter((e) => !e.flag.flagged && e.s.estimateConfidence === 'low')

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Verification priority"
        title="Where to spend your limited verification budget"
        sub="A private triage signal — visible only in your importer view. Not a public claim about any company."
      />

      {/* The framing banner — this is what neutralises the legal objection */}
      <div className="card border-l-4 border-l-warn p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <Pill tone="warn">🔒 Private — importer view only</Pill>
          <span>Triage signal, not an accusation</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-mute">
          Facility-level satellite and modelled data carry wide uncertainty, so we
          do not publicly call companies liars. We flag where a supplier's
          self-reported number <span className="text-text">diverges below an independent estimate</span>,
          so you know where to verify first. The estimate is always shown as a{' '}
          <span className="text-text">range + confidence</span> — never a single hard number.
        </p>
      </div>

      {/* Priority flags */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-warn">
          ⚑ Recommend verification ({priority.length})
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {priority.map(({ s, flag }) => (
            <Card key={s.id} className="border-warn/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FlagEmoji code={s.countryCode} />
                    <span className="font-semibold text-text">{s.name}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-mute">
                    {s.facilityName ?? 'Producing installation unresolved'} · {s.country}
                  </div>
                </div>
                <VerifyBadge severity={flag.severity === 'priority' ? 'priority' : 'watch'} />
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill>{s.commodity}</Pill>
                {s.productionRoute !== 'n/a' && <Pill>{s.productionRoute}</Pill>}
                <Pill title="Entity-resolution confidence">match: {s.matchConfidence}</Pill>
              </div>

              <DivergenceBar s={s} />

              <p className="mt-3 rounded-lg bg-panel2 p-3 text-xs text-mute">
                {flag.reason}
              </p>

              <div className="mt-3 flex items-center justify-between text-xs">
                <RangeBadge range={s.independentEstimate} confidence={s.estimateConfidence} />
                <button className="rounded-lg border border-warn/40 px-3 py-1.5 font-medium text-warn hover:bg-warn/10">
                  Request verified data →
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Consistent + can't-assess */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-brand">
            ✓ Consistent with independent estimate ({consistent.length})
          </h3>
          <ul className="space-y-2">
            {consistent.map(({ s }) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FlagEmoji code={s.countryCode} />
                  <span className="text-text">{s.name}</span>
                  {s.inSharedPool && <Pill tone="pool">◇ pool</Pill>}
                </span>
                <span className="text-xs text-mute">
                  self {NUM(s.selfReported, 2)} vs {s.independentEstimate.low}–
                  {s.independentEstimate.high}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-mute">
            ◌ Can't assess — low-confidence estimate ({cantAssess.length})
          </h3>
          <p className="mb-3 text-xs text-mute">
            We never flag on a low-confidence estimate. These stay "unverified," not
            "implausible."
          </p>
          <ul className="space-y-2">
            {cantAssess.map(({ s }) => (
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
