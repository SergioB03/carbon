/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppStateProvider, useAppState } from './state/appState';
import { MaterialLens, AppView } from './types';
import { LogoFull } from './components/Logo';
import Overview from './views/Overview';
import Suppliers from './views/Suppliers';
import Simulator from './views/Simulator';
import Evidence from './views/Evidence';
import Copilot from './components/Copilot';
import JudgeTour from './components/JudgeTour';
import { 
  BarChart4, 
  Users, 
  Settings2, 
  Compass, 
  Layers, 
  Database,
  Anchor,
  Sparkle
} from 'lucide-react';

// Central Router View Map Sourced from PDF guides
const VIEWS: Record<AppView, React.ComponentType> = {
  overview: Overview,
  suppliers: Suppliers,
  simulator: Simulator,
  evidence: Evidence,
};

// Sidebar navigation specifications
const NAV_ITEMS = [
  { id: 'overview' as AppView, label: 'Overview', icon: Compass, hint: 'Cost, tasks & maps' },
  { id: 'suppliers' as AppView, label: 'Suppliers', icon: Users, hint: 'Priority triage & track' },
  { id: 'simulator' as AppView, label: 'Simulator', icon: Settings2, hint: 'What-if decabs payoff' },
  { id: 'evidence' as AppView, label: 'Evidence', icon: Database, hint: 'TRACE observations' },
];

function MainLayout() {
  const { 
    mode, 
    setMode, 
    material, 
    setMaterial, 
    view, 
    setView 
  } = useAppState();

  const ActiveComponent = VIEWS[view];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-stone-900 flex selection:bg-stone-200 selection:text-stone-950 font-sans relative overflow-x-hidden">
      
      {/* Decorative Ambient Glass Blobs in the Background (Mac-style background art) */}
      <div className="absolute top-12 left-1/4 w-[500px] h-[500px] bg-emerald-200/20 rounded-full filter blur-[120px] pointer-events-none mix-blend-multiply animate-pulse" />
      <div className="absolute bottom-24 right-1/4 w-[400px] h-[400px] bg-amber-100/25 rounded-full filter blur-[100px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-2/3 left-1/3 w-[450px] h-[450px] bg-sky-200/15 rounded-full filter blur-[110px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '14s' }} />

      {/* 1. STICKY SIDEBAR (64 / 280px wide) */}
      <aside className="w-72 bg-white/50 backdrop-blur-xl border-r border-[#E5E5EA] h-screen sticky top-0 flex flex-col justify-between shrink-0 select-none z-45">
        
        {/* Brand / Logo Section */}
        <div className="p-6 pb-2.5">
          <LogoFull size={28} />
          
          {/* Material Switcher lens selection */}
          <div className="mt-6 pt-5 border-t border-stone-200/60 space-y-2">
            <span className="font-mono text-[9px] text-stone-400 block font-bold uppercase tracking-widest">
              MATERIAL LENS
            </span>
            <div className="grid grid-cols-2 gap-1 bg-stone-200/40 p-1 border border-stone-200/30 rounded-xl">
              {(['all', 'steel', 'aluminium', 'cement'] as MaterialLens[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMaterial(m)}
                  className={`py-1.5 px-2 text-[10px] font-mono rounded-lg cursor-pointer transition-all ${
                    material === m
                      ? 'bg-white text-stone-900 font-semibold shadow-sm'
                      : 'text-stone-500 hover:text-stone-850'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.substring(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Nav Buttons */}
        <nav className="flex-1 px-4 py-4 space-y-1.5">
          <span className="font-mono text-[9px] text-stone-405 block font-bold uppercase tracking-widest px-2 mb-2">
            Workspace Nav
          </span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSelected = view === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all text-left cursor-pointer group ${
                  isSelected
                    ? 'bg-stone-900/95 text-[#F5F5F7] font-medium shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                    : 'text-stone-505 hover:bg-stone-200/40 hover:text-stone-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform duration-250 group-hover:scale-105 ${isSelected ? 'text-emerald-400' : 'text-stone-400 group-hover:text-stone-900'}`} />
                <div className="leading-none mt-0.5">
                  <span className="text-xs font-semibold block">{item.label}</span>
                  <span className={`text-[8.5px] font-sans font-light opacity-70 block mt-1 ${isSelected ? 'text-stone-300' : 'text-stone-400 group-hover:text-stone-500'}`}>
                    {item.hint}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Pitch Mode Switcher controls */}
        <div className="p-4 bg-stone-100/50 border-t border-stone-200/60 space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="font-mono text-[9px] text-stone-400 block font-bold uppercase tracking-wider">
              App Mode View
            </span>
            <span className="font-mono text-[9px] text-emerald-800 font-bold bg-emerald-500/15 border border-emerald-500/10 px-1.5 py-0.5 rounded-full">
              V1.2
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-stone-200/50 p-1 rounded-xl">
            <button
              onClick={() => setMode('operator')}
              className={`py-1 text-[9px] font-mono rounded-lg cursor-pointer transition-all ${
                mode === 'operator'
                  ? 'bg-white text-stone-900 shadow-sm font-semibold'
                  : 'text-stone-500'
              }`}
            >
              Operator
            </button>
            <button
              onClick={() => setMode('pitch')}
              className={`py-1 text-[9px] font-mono rounded-lg cursor-pointer transition-all ${
                mode === 'pitch'
                  ? 'bg-stone-900 text-stone-100 shadow-sm font-semibold'
                  : 'text-stone-500'
              }`}
            >
              Pitch / Judge
            </button>
          </div>
          
          <div className="text-[9px] text-stone-450 leading-tight font-sans font-light px-1">
            {mode === 'operator' 
              ? 'Working importer mode. Methodology metadata is safely hidden.' 
              : 'Pitch mode enabled. Visual details and design rationale visible.'}
          </div>
        </div>

      </aside>

      {/* 2. MAIN CONTAINER AREA */}
      <main className="flex-1 overflow-y-auto h-screen p-8 md:p-12 relative z-10 flex flex-col items-center">
        <div className="max-w-5xl w-full">
          <ActiveComponent />
        </div>
      </main>

      {/* 3. FLOATABLE COPILOT ASSIST (FAB) */}
      <Copilot />

      {/* 4. GUIDED JUDGE PRESENTATION TOUR PLAYBOOK */}
      <JudgeTour />

    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <MainLayout />
    </AppStateProvider>
  );
}
