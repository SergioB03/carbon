/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Supplier } from '../types';
import { getEstimateRange, getEstimateMidpoint } from './calc';

export interface FlagResult {
  flagged: boolean;
  divergence: number; // percentage (decimal e.g. 0.25)
  severity: 'none' | 'watch' | 'priority';
  reason: string;
}

export function evaluateFlag(supplier: Supplier, threshold: number): FlagResult {
  const midpoint = getEstimateMidpoint(supplier);
  const range = getEstimateRange(supplier);
  
  // Divergence check
  const divergence = (midpoint - supplier.selfReported) / midpoint;
  
  // 1. Low confidence filter: A low-confidence estimate CAN NEVER trigger a flag.
  // Those suppliers are labelled "unverified/can't assess", not flagged.
  const isConfident = supplier.estimateConfidence !== 'low';
  
  // 2. Clearly below range: selfReported is lower than the estimate range's low value
  const isClearlyBelowRange = supplier.selfReported < range.low;
  
  // 3. Exceeds the sliding threshold
  const exceedsThreshold = divergence > threshold;
  
  const flagged = isConfident && isClearlyBelowRange && exceedsThreshold;
  
  let severity: 'none' | 'watch' | 'priority' = 'none';
  let reason = '';
  
  if (flagged) {
    const isPriorityLimit = divergence > Math.max(0.33, threshold * 1.5);
    severity = isPriorityLimit ? 'priority' : 'watch';
    
    reason = `Self-reported intensity of ${supplier.selfReported} tCO₂/t sits clearly below our independent Climate TRACE estimate range of ${range.low.toFixed(2)}–${range.high.toFixed(2)} tCO₂/t (divergence of ${(divergence * 100).toFixed(0)}%). Recommend formal verification prior to customs filing.`;
  } else if (!isConfident) {
    reason = 'Independent Climate TRACE estimate carries low confidence. Baseline triage cannot reliably assess divergence risk. Scrap validation recommended.';
  } else {
    reason = 'No significant divergence found relative to historical Climate TRACE emissions range.';
  }
  
  return {
    flagged,
    divergence,
    severity,
    reason,
  };
}
