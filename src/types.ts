/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MaterialLens = 'all' | 'steel' | 'aluminium' | 'cement';
export type ViewMode = 'operator' | 'pitch';
export type AppView = 'overview' | 'suppliers' | 'simulator' | 'evidence';

export interface OwnerInfo {
  parent: string;
  lei: string;
  hq: string;
}

export interface EstimateRange {
  low: number;
  high: number;
}

export interface HistoricEmission {
  year: number;
  intensity: number;       // direct in-scope (tCO2e/t)
  fullIntensity: number;   // full cradle-to-gate (incl. electricity) (tCO2e/t)
  emissions: number;       // total tonnes CO2e
  production: number;      // total tonnes produced
}

export interface Supplier {
  id: string;
  name: string;
  facilityName: string;
  country: string;
  lat: number;
  lon: number;
  commodity: 'steel' | 'aluminium' | 'cement';
  subsector: string;       // Climate TRACE subsector match e.g. 'iron-and-steel'
  productionRoute: string; // 'BF-BOF' | 'EAF' | 'cement-kiln' | etc.
  
  // Custom metrics of the CarbonBridge layout
  selfReported: number;          // Supplier self-reported intensity
  countryDefaultValue: number;   // Punitive EU-published country default
  benchmark: number;             // Best-practice target benchmark
  cnCode: string;                // product classification code
  annualTonnesImported: number;  // input material volume from Meridian
  
  // Real Climate TRACE extracted statistics
  estimateConfidence: 'low' | 'medium' | 'high';
  fullFootprint: number;         // full cradle-to-gate footprint
  history: HistoricEmission[];
  
  // Metadata layers
  owner: OwnerInfo;
  inSharedPool: boolean;         // Verified by other importers?
  sharedPoolCount?: number;      // How many other importers verified this
  matchConfidence: 'low' | 'medium' | 'high';
  matchBasis: string;            // Explanation of record resolve matching
  illustrative?: boolean;        // true for calibrated Americas comparable rows
}

export interface VerifyStatus {
  [id: string]: 'none' | 'requested' | 'received';
}

export interface AppState {
  mode: ViewMode;
  material: MaterialLens;
  view: AppView;
  verifyStatus: VerifyStatus;
  divergenceThreshold: number; // Slider 5%-40% (default 20%)
  sliderOverrides: { [supplierId: string]: number }; // Simulator sliders
}
