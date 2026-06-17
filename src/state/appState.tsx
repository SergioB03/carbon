/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MaterialLens, ViewMode, AppView, VerifyStatus } from '../types';

interface AppStateContextProps {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  material: MaterialLens;
  setMaterial: (material: MaterialLens) => void;
  view: AppView;
  setView: (view: AppView) => void;
  verifyStatus: VerifyStatus;
  requestVerification: (id: string) => void;
  markReceived: (id: string) => void;
  resetVerification: () => void;
  divergenceThreshold: number;
  setDivergenceThreshold: (val: number) => void;
  sliderOverrides: { [id: string]: number };
  setSliderOverride: (id: string, val: number) => void;
  resetSliders: () => void;
}

const AppStateContext = createContext<AppStateContextProps | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>('pitch'); // Default to pitch to show contextual guidance first for judges
  const [material, setMaterial] = useState<MaterialLens>('all');
  const [view, setView] = useState<AppView>('overview');
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>({
    'posco-gwangyang': 'received', // Sourced & verified immediately
    'vedanta-jharsuguda': 'received', // Sourced & verified immediately
  });
  const [divergenceThreshold, setDivergenceThreshold] = useState<number>(0.20); // 20%
  const [sliderOverrides, setSliderOverrides] = useState<{ [id: string]: number }>({});

  const requestVerification = (id: string) => {
    setVerifyStatus((prev) => ({ ...prev, [id]: 'requested' }));
  };

  const markReceived = (id: string) => {
    setVerifyStatus((prev) => ({ ...prev, [id]: 'received' }));
  };

  const resetVerification = () => {
    setVerifyStatus({
      'posco-gwangyang': 'received',
      'vedanta-jharsuguda': 'received',
    });
  };

  const setSliderOverride = (id: string, val: number) => {
    setSliderOverrides((prev) => ({ ...prev, [id]: val }));
  };

  const resetSliders = () => {
    setSliderOverrides({});
  };

  return (
    <AppStateContext.Provider
      value={{
        mode,
        setMode,
        material,
        setMaterial,
        view,
        setView,
        verifyStatus,
        requestVerification,
        markReceived,
        resetVerification,
        divergenceThreshold,
        setDivergenceThreshold,
        sliderOverrides,
        setSliderOverride,
        resetSliders,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
