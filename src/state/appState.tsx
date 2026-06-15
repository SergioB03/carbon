import { createContext, useContext, useState, type ReactNode } from 'react'

// CarbonBridge — shared app state.
// - mode: 'operator' (the importer's working app, clean) vs 'pitch' (shows the
//   judge-facing methodology / "why this matters" framing).
// - view: which screen is active (lifted here so any view can navigate).
// - verifyStatus: per-supplier verification workflow, shared between the
//   Verification Priority page, the Suppliers tracker, and Home.

export type Mode = 'operator' | 'pitch'
export type VerifyStatus = 'none' | 'requested' | 'received'

interface AppState {
  mode: Mode
  setMode: (m: Mode) => void
  view: string
  setView: (v: string) => void
  verifyStatus: Record<string, VerifyStatus>
  statusOf: (id: string) => VerifyStatus
  requestVerification: (id: string) => void
  markReceived: (id: string) => void
  resetVerification: () => void
}

const Ctx = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('operator')
  const [view, setView] = useState('home')
  const [verifyStatus, setVerify] = useState<Record<string, VerifyStatus>>({})

  const statusOf = (id: string): VerifyStatus => verifyStatus[id] ?? 'none'
  const requestVerification = (id: string) =>
    setVerify((p) => (p[id] === 'received' ? p : { ...p, [id]: 'requested' }))
  const markReceived = (id: string) => setVerify((p) => ({ ...p, [id]: 'received' }))
  const resetVerification = () => setVerify({})

  return (
    <Ctx.Provider
      value={{
        mode,
        setMode,
        view,
        setView,
        verifyStatus,
        statusOf,
        requestVerification,
        markReceived,
        resetVerification,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useAppState(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAppState must be used within AppStateProvider')
  return v
}

export const useMode = () => useAppState().mode
