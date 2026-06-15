import { useMemo } from 'react'
import { SUPPLIERS } from '../data/suppliers'
import { evaluateFlag } from '../lib/flag'
import { productFor, poolVerifierCount } from '../data/products'
import { useAppState, type VerifyStatus } from '../state/appState'
import { Card, SectionTitle, RangeBadge, Pill, VerifyBadge, FlagEmoji } from '../components/ui'

type Stage = 'pool' | 'received' | 'requested' | 'flagged' | 'unverified'

function stageOf(s: (typeof SUPPLIERS)[number], status: VerifyStatus): Stage {
  if (s.inSharedPool) return 'pool'
  if (status === 'received') return 'received'
  if (status === 'requested') return 'requested'
  if (evaluateFlag(s).flagged) return 'flagged'
  return 'unverified'
}

const ORDER: Record<Stage, number> = { flagged: 0, unverified: 1, requested: 2, received: 3, pool: 4 }

export default function Suppliers() {
  const { statusOf, requestVerification, markReceived, resetVerification } = useAppState()

  const rows = useMemo(
    () =>
      [...SUPPLIERS]
        .map((s) => ({ s, status: statusOf(s.id), stage: stageOf(s, statusOf(s.id)) }))
        .sort((a, b) => ORDER[a.stage] - ORDER[b.stage]),
    [statusOf],
  )

  const counts = rows.reduce(
    (a, r) => ((a[r.stage] = (a[r.stage] ?? 0) + 1), a),
    {} as Record<Stage, number>,
  )
  const verified = (counts.pool ?? 0) + (counts.received ?? 0)

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Suppliers"
        title="Supplier data — verification workflow"
        sub="Track who's verified, who you've asked, and who still sits on punitive default values. Requesting data here, on the dashboard, or on the Verification page all stay in sync."
        right={
          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="stat-num text-xl font-semibold text-brand">
                {verified}/{SUPPLIERS.length}
              </div>
              <div className="text-[11px] text-mute">verified or in pool</div>
            </div>
            <button
              onClick={resetVerification}
              className="rounded-lg border border-edge bg-panel2 px-3 py-2 text-xs text-mute hover:text-text"
            >
              ↺ reset
            </button>
          </div>
        }
      />

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wide text-mute">
                <th className="px-5 py-2.5 font-medium">Supplier</th>
                <th className="px-3 py-2.5 font-medium">Product · CN</th>
                <th className="px-3 py-2.5 font-medium">Independent estimate</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, stage }) => {
                const p = productFor(s.cnCode)
                return (
                  <tr key={s.id} className="border-b border-edge/50 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FlagEmoji code={s.countryCode} />
                        <span className="font-medium text-text">{s.name}</span>
                        {stage === 'flagged' && (
                          <VerifyBadge
                            severity={evaluateFlag(s).severity === 'priority' ? 'priority' : 'watch'}
                          />
                        )}
                      </div>
                      <div className="mt-0.5 pl-7 text-[11px] text-mute">{s.country}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-text">{p.name}</div>
                      <div className="stat-num text-[11px] text-mute">CN {p.cn}</div>
                    </td>
                    <td className="px-3 py-3">
                      <RangeBadge range={s.independentEstimate} confidence={s.estimateConfidence} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusCell stage={stage} id={s.id} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {stage === 'flagged' || stage === 'unverified' ? (
                        <button
                          onClick={() => requestVerification(s.id)}
                          className="rounded-lg border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/10"
                        >
                          Request data
                        </button>
                      ) : stage === 'requested' ? (
                        <button
                          onClick={() => markReceived(s.id)}
                          className="rounded-lg border border-edge px-3 py-1.5 text-xs font-medium text-mute hover:text-text"
                        >
                          Mark received
                        </button>
                      ) : (
                        <span className="text-xs text-mute">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-mute">
        "In pool" suppliers reuse verified data shared by other unaffiliated importers — the
        cross-company moat. Status here is local to this session (a real deployment persists it
        and emails the supplier the request).
      </p>
    </div>
  )
}

function StatusCell({ stage, id }: { stage: Stage; id: string }) {
  if (stage === 'pool')
    return (
      <Pill tone="pool" title="Reuses verified data from the shared cross-company pool">
        ◇ in pool · verified by {poolVerifierCount(id)} importers
      </Pill>
    )
  if (stage === 'received') return <Pill tone="good">✓ verified data received</Pill>
  if (stage === 'requested') return <Pill tone="accent">↗ requested · awaiting</Pill>
  if (stage === 'flagged') return <Pill tone="warn">⚑ verify first</Pill>
  return <Pill>on default values</Pill>
}
