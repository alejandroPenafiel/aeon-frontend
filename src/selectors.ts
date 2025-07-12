import type { Sentiment } from './types';

// Dummy usage to satisfy TypeScript linter
const _ = {} as Sentiment;

export function selectSummary(raw: any) {
  return {
    asset: raw?.asset ?? '',
    sentiment: raw?.summary?.sentiment ?? 'NEUTRAL',
    macdTrend: raw?.macd_trend_direction ?? 'FLAT',
    state: raw?.chaos_discerned?.state ?? '',
    longWeight: raw?.summary?.long_signals ?? 0,
    shortWeight: raw?.summary?.short_signals ?? 0,
    overallConfidence: raw?.summary?.overall_confidence ?? 0,
    position: raw?.summary?.position ?? '',
  };
}

export function selectChaos(raw: any) {
  return {
    reasoning: raw?.chaos_discerned?.reasoning ?? '',
    metrics: {
      numValidSignals: raw?.chaos_discerned?.num_valid_signals ?? 0,
      totalAdjWeight: raw?.chaos_discerned?.total_adj_weight ?? 0,
      avgConfidence: raw?.chaos_discerned?.avg_confidence ?? 0,
      longConfidenceWeight: raw?.chaos_discerned?.long_confidence_weight ?? 0,
      shortConfidenceWeight: raw?.chaos_discerned?.short_confidence_weight ?? 0,
    },
    sentiment: raw?.chaos_discerned?.sentiment ?? 'NEUTRAL',
    macdTrend: raw?.macd_trend_direction ?? 'FLAT',
  };
}

export function selectCategorisedSignals(raw: any) {
  return raw?.summary?.categorised_signals ?? {};
}

export function selectSortedSignals(raw: any) {
  return raw?.chaos_discerned?.sorting_signals ?? { LONG: [], SHORT: [], NEUTRAL: [] };
} 