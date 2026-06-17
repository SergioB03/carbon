/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Supplier, HistoricEmission } from '../types';
import historyData from './history.json';

// CarbonBridge supplier book — built from a REAL static Climate TRACE extract
// (src/data/history.json, manufacturing v5.7.0, co2e_100yr, CC BY 4.0). The
// facility series (intensity, full cradle-to-gate intensity, emissions,
// production), the owner, the LEI and the confidence flag are REAL. The CBAM
// policy + commercial overlay (self-reported claim, country default value,
// benchmark, import volume, pool membership) is calibrated to published figures.
// Americas rows (illustrative:true) carry a real plant/owner/LEI with calibrated
// emissions — not from the extract. Where neither Climate TRACE nor GLEIF hold a
// public LEI (Angang, Vissai) we carry a placeholder identifier so the record
// resolves; every other LEI here is the real, GLEIF-verifiable code.

const ISO2: Record<string, string> = {
  KOR: 'KR', CHN: 'CN', IND: 'IN', TUR: 'TR', VNM: 'VN', ARE: 'AE', USA: 'US', BRA: 'BR',
};

// Placeholder LEIs ONLY for facilities with no public LEI in Climate TRACE or
// GLEIF. Real LEIs always win (see build step below).
const FALLBACK_LEI: Record<string, string> = {
  'angang-steel': '3003007W081R8JLD2281',
  'vissai-do-luong': '988411F882S8102LK291',
};

interface Overlay {
  ctId: number;            // Climate TRACE source_id → real facility in history.json
  name: string;
  facilityName: string;
  commodity: 'steel' | 'aluminium' | 'cement';
  productionRoute: string;
  cnCode: string;
  selfReported: number;
  countryDefaultValue: number;
  benchmark: number;
  annualTonnesImported: number;
  inSharedPool: boolean;
  sharedPoolCount?: number;
  matchConfidence: 'low' | 'medium' | 'high';
  matchBasis: string;
  illustrative?: boolean;
}

// Keyed by the stable GS id so app state / tour references keep working.
const OVERLAY: Record<string, Overlay> = {
  'posco-gwangyang': {
    ctId: 1566956, name: 'POSCO Steel Corp', facilityName: 'Gwangyang Integrated Steel Mill',
    commodity: 'steel', productionRoute: 'BF-BOF', cnCode: '7208.39',
    selfReported: 1.95, countryDefaultValue: 2.71, benchmark: 1.37, annualTonnesImported: 2600,
    inSharedPool: true, sharedPoolCount: 6, matchConfidence: 'high',
    matchBasis: 'country + CN code + named installation (verified in pool)',
  },
  'angang-steel': {
    ctId: 1566610, name: 'Angang Steel Co', facilityName: 'Anshan Integrated Blast Furnace',
    commodity: 'steel', productionRoute: 'BF-BOF', cnCode: '7207.11',
    selfReported: 1.25, countryDefaultValue: 3.167, benchmark: 1.37, annualTonnesImported: 4200,
    inSharedPool: false, matchConfidence: 'medium',
    matchBasis: 'country + CN code; named installation unconfirmed (trader-fronted)',
  },
  'tata-jamshedpur': {
    ctId: 1566853, name: 'Tata Steel Ltd', facilityName: 'Jamshedpur Works',
    commodity: 'steel', productionRoute: 'BF-BOF', cnCode: '7208.27',
    selfReported: 1.66, countryDefaultValue: 3.02, benchmark: 1.37, annualTonnesImported: 3100,
    inSharedPool: false, matchConfidence: 'medium',
    matchBasis: 'country + CN code + named installation (awaiting verification)',
  },
  'mmk-turkiye': {
    ctId: 1567076, name: 'MMK Metalurji', facilityName: 'Payas Scrap-EAF Plant',
    commodity: 'steel', productionRoute: 'EAF', cnCode: '7214.20',
    selfReported: 0.49, countryDefaultValue: 2.0, benchmark: 0.481, annualTonnesImported: 1900,
    inSharedPool: false, matchConfidence: 'high',
    matchBasis: 'country + CN code + named EAF installation',
  },
  'korfez-cement': {
    ctId: 1897887, name: 'Körfez Çimento', facilityName: 'Kocaeli Cement & Clinker Kiln',
    commodity: 'cement', productionRoute: 'cement-kiln', cnCode: '2523.29',
    selfReported: 0.80, countryDefaultValue: 1.584, benchmark: 0.7, annualTonnesImported: 5200,
    inSharedPool: false, matchConfidence: 'high',
    matchBasis: 'country + CN code + named clinker plant',
  },
  'vissai-do-luong': {
    ctId: 32439362, name: 'Vissai Cement Group', facilityName: 'Do Luong Plant',
    commodity: 'cement', productionRoute: 'cement-kiln', cnCode: '2523.29',
    selfReported: 0.55, countryDefaultValue: 0.95, benchmark: 0.7, annualTonnesImported: 3000,
    inSharedPool: false, matchConfidence: 'low',
    matchBasis: 'country + CN code; producing kiln inferred',
  },
  'ega-taweelah': {
    ctId: 3672937, name: 'Emirates Global Aluminium', facilityName: 'Taweelah Smelter Complex',
    commodity: 'aluminium', productionRoute: 'electrolysis', cnCode: '7601.10',
    selfReported: 2.1, countryDefaultValue: 4.0, benchmark: 1.514, annualTonnesImported: 1400,
    inSharedPool: false, matchConfidence: 'medium',
    matchBasis: 'country + CN code; smelter inferred from grid + GEM tracker',
  },
  'vedanta-jharsuguda': {
    ctId: 3673075, name: 'Vedanta Materials', facilityName: 'Jharsuguda Aluminium Smelter',
    commodity: 'aluminium', productionRoute: 'electrolysis', cnCode: '7601.20',
    selfReported: 2.4, countryDefaultValue: 4.0, benchmark: 1.514, annualTonnesImported: 1150,
    inSharedPool: true, sharedPoolCount: 5, matchConfidence: 'high',
    matchBasis: 'country + CN code + named smelter (verified in pool)',
  },
  'nucor-berkeley': {
    ctId: 90000001, name: 'Nucor Steel Co', facilityName: 'Berkeley Scrap-EAF Mill',
    commodity: 'steel', productionRoute: 'EAF', cnCode: '7214.20',
    selfReported: 0.43, countryDefaultValue: 2.0, benchmark: 0.481, annualTonnesImported: 1700,
    inSharedPool: false, matchConfidence: 'high',
    matchBasis: 'country + CN code + named EAF installation', illustrative: true,
  },
  'alcoa-warrick': {
    ctId: 90000002, name: 'Alcoa USA Corp', facilityName: 'Warrick Smelter Works',
    commodity: 'aluminium', productionRoute: 'electrolysis', cnCode: '7601.10',
    selfReported: 2.5, countryDefaultValue: 4.0, benchmark: 1.514, annualTonnesImported: 1300,
    inSharedPool: false, matchConfidence: 'medium',
    matchBasis: 'country + CN code; smelter inferred from grid + GEM tracker', illustrative: true,
  },
  'gerdau-ouro': {
    ctId: 90000003, name: 'Gerdau S.A.', facilityName: 'Ouro Branco Integrated Mill',
    commodity: 'steel', productionRoute: 'BF-BOF', cnCode: '7208.27',
    selfReported: 1.6, countryDefaultValue: 2.8, benchmark: 1.37, annualTonnesImported: 2200,
    inSharedPool: false, matchConfidence: 'medium',
    matchBasis: 'country + CN code + named installation', illustrative: true,
  },
  'albras-barcarena': {
    ctId: 90000004, name: 'Albras Aluminium', facilityName: 'Barcarena Electrolysis Smelter',
    commodity: 'aluminium', productionRoute: 'electrolysis', cnCode: '7601.10',
    selfReported: 2.0, countryDefaultValue: 4.0, benchmark: 1.514, annualTonnesImported: 1500,
    inSharedPool: true, sharedPoolCount: 4, matchConfidence: 'high',
    matchBasis: 'country + CN code + named smelter (verified in pool)', illustrative: true,
  },
};

interface CtFacility {
  id: number;
  country: string;
  subsector: string;
  lat: number | null;
  lon: number | null;
  owner: { parent: string; lei: string | null; hq: string | null };
  confidence: string;
  latest: { year: number; intensity: number; fullIntensity: number | null };
  series: { year: number; intensity: number; fullIntensity: number | null; emissions: number; production: number; partial: boolean }[];
}

const FACILITIES = (historyData as { facilities: CtFacility[] }).facilities;
const r2 = (n: number) => Math.round(n * 100) / 100;

export const SUPPLIERS: Supplier[] = Object.entries(OVERLAY).map(([id, o]) => {
  const f = FACILITIES.find((x) => x.id === o.ctId)!;
  const fullYears = f.series.filter((s) => !s.partial);
  const history: HistoricEmission[] = fullYears.map((s) => ({
    year: s.year,
    intensity: s.intensity,
    fullIntensity: s.fullIntensity ?? s.intensity, // cement has no electricity layer
    emissions: s.emissions,
    production: s.production,
  }));
  const fullFootprint = f.latest.fullIntensity ?? f.latest.intensity;
  const country = ISO2[f.country] ?? f.country;

  return {
    id,
    name: o.name,
    facilityName: o.facilityName,
    country,
    lat: f.lat ?? 0,
    lon: f.lon ?? 0,
    commodity: o.commodity,
    subsector: f.subsector,
    productionRoute: o.productionRoute,
    selfReported: o.selfReported,
    countryDefaultValue: o.countryDefaultValue,
    benchmark: o.benchmark,
    cnCode: o.cnCode,
    annualTonnesImported: o.annualTonnesImported,
    estimateConfidence: f.confidence as 'low' | 'medium' | 'high',
    fullFootprint: r2(fullFootprint),
    history,
    owner: {
      parent: f.owner.parent,
      lei: f.owner.lei ?? FALLBACK_LEI[id] ?? '', // real LEI wins; placeholder only where none exists publicly
      hq: f.owner.hq ?? country,
    },
    inSharedPool: o.inSharedPool,
    sharedPoolCount: o.sharedPoolCount,
    matchConfidence: o.matchConfidence,
    matchBasis: o.matchBasis,
    illustrative: o.illustrative,
  };
});
