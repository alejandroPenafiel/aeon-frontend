// 1 · Enums & Primitive Types
export type Sentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export type TrendDirection = 'UP' | 'DOWN' | 'FLAT';

// 2 · Signal & Category Types
export interface Signal {
  name: string;
  weight: number;
  confidence: number;              // signal-level confidence
  bullish: boolean | null;
  details: string;
  category: string;                // ADDED
  timestamp: string | null;        // NEW
}

export type CategorisedSignals = Record<string, Signal[]>;

// 3 · Payload-Level Interfaces
export interface Summary {
  sentiment: Sentiment;
  long_signals: number;
  short_signals: number;
  overall_confidence: number;      // RENAMED
  position: string;
  categorised_signals: CategorisedSignals;
}

export interface ChaosDiscerned {
  sentiment: Sentiment;
  position_type: 'LONG' | 'SHORT' | 'NONE';
  position_size: number;
  state: string;
  num_valid_signals: number;
  total_adj_weight: number;
  avg_confidence: number;
  long_confidence_weight: number;
  short_confidence_weight: number;
  total_weighted_confidence: number;
  reasoning: string;
  sorting_signals: {
    LONG: Signal[];
    SHORT: Signal[];
    NEUTRAL: Signal[];
  };
}

export interface Recommendation {
  position_type: 'LONG' | 'SHORT' | 'NONE';
  position_size: number;
  sentiment: Sentiment;
  total_weighted_confidence: number;
  long_total_weight: number;
  short_total_weight: number;
  sorting_signals: {
    LONG: Signal[];
    SHORT: Signal[];
    NEUTRAL: Signal[];
  };
}

export interface StrategyConfig {
  // thresholds
  bang_threshold: number;
  aim_threshold: number;
  loaded_threshold: number;
  // feature flags
  enable_trend_filter_for_entry: boolean;
  enable_bollinger_filter_for_entry: boolean;
  bollinger_overextended_block: boolean;
  // dynamic/unlimited weights + extras
  [key: string]: number | boolean;
}

export interface AssetPayload {
  asset: string;
  summary: Summary;
  chaos_discerned: ChaosDiscerned;
  macd_trend_direction: TrendDirection;
  recommendation: Recommendation;
  config: StrategyConfig;
}

// 4 · Config Context Skeleton (for shared draftConfig)
export interface ConfigContextShape {
  draftConfig: StrategyConfig;
  setDraftConfig: (c: StrategyConfig) => void;
  saveConfig: () => void;
  resetConfig: () => void;
  dirty: boolean;
} 