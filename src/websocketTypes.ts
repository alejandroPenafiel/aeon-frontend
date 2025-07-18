export interface WebSocketData {
  type: string;
  account_data?: AccountData;
  data: Record<string, AssetData>;
}

export interface AccountData {
  margin_summary: MarginSummary;
  assetPositions: any[]; // Define a more specific type if needed
  positions: any[]; // Define a more specific type if needed
  success: boolean;
  timestamp: number; // Assuming timestamp is a number
  account_address: string;
}

export interface MarginSummary {
  accountValue: string;
  totalNtlPos: string;
  totalRawUsd: string;
  totalMarginUsed: string;
}

export interface AssetData {
  metadata: AssetMetadata;
  agents: Agents;
}

export interface AssetMetadata {
  asset_symbol: string;
  last_updated: number; // Assuming timestamp is a number
  data_version: string;
}

export interface Agents {
  OctaviaAgent?: OctaviaAgent;
  AgathaAgent?: AgathaAgent;
  VivienneAgent?: VivienneAgent;
  TempestAgent?: TempestAgent;
  VesperAgent?: VesperAgent;
  AuroraAgent?: AuroraAgent;
}

export interface OctaviaAgent {
  data: OctaviaAgentData;
  config: OctaviaAgentConfig;
}

export interface OctaviaAgentData {
  indicators: Indicators;
  macd_trend: MacdTrend;
  bollinger_context: BollingerContext;
  resistance_levels: ResistanceLevels;
  support_levels: SupportLevels;
}

export interface Indicators {
  ts: number | null;
  asset_id: number;
  ema_3: PriceHistoryItem[];
  ema_5: PriceHistoryItem[];
  ema_21: PriceHistoryItem[];
  ema_30: PriceHistoryItem[];
  rsi: PriceHistoryItem[];
  macd: PriceHistoryItem[];
  macd_signal: PriceHistoryItem[];
  macd_histogram: PriceHistoryItem[];
  bb_upper: PriceHistoryItem[];
  bb_middle: PriceHistoryItem[];
  bb_lower: PriceHistoryItem[];
  atr: number;
}

export interface MacdTrend {
  asset_symbol: string;
  macd_trend_direction: string;
  macd_histogram_history_len: number;
}

export interface BollingerContext {
  asset_symbol: string;
  bb_bandwidth: number;
  bb_is_in_squeeze: boolean;
  bb_price_position: string;
  bb_is_overextended_top: boolean;
  bb_is_overextended_bottom: boolean;
}

export interface ResistanceLevels {
  asset_symbol: string;
  resistance_levels: number[];
  significant_resistance: number;
}

export interface SupportLevels {
  asset_symbol: string;
  support_levels: number[];
  significant_support: number;
}

export interface OctaviaAgentConfig {
  indicator_configs: IndicatorConfigs;
}

export interface IndicatorConfigs {
  RSI_config: RsiConfig;
  BB_config: BbConfig;
  ATR_config: AtrConfig;
  MACD_config: MacdConfig;
  RESISTANCE_config: ResistanceConfig;
}

export interface RsiConfig {
  period: number;
}

export interface BbConfig {
  bb_period: number;
  bb_multiplier: number;
  bb_squeeze_threshold: number;
}

export interface AtrConfig {
  length: number;
}

export interface MacdConfig {
  macd_long: number;
  macd_short: number;
  macd_signal: number;
  macd_histogram_dampening: number;
}

export interface ResistanceConfig {
  window: number;
  lookback: number;
}

export interface AgathaAgent {
  data: AgathaAgentData;
  config: AgathaAgentConfig;
}

export interface AgathaAgentData {
  processed_signals: ProcessedSignals;
}

export interface ProcessedSignals {
  price: number;
  status: string;
  signals: Signals;
  indicators: AgathaIndicators;
  support_analysis: SupportAnalysis;
  resistance_analysis: ResistanceAnalysis;
}

export interface Signals {
  bb_level: SignalDetails;
  bb_bounce: SignalDetails;
  ema_cross: SignalDetails;
  ema_level: SignalDetails;
  rsi_cross: SignalDetails;
  macd_cross: SignalDetails;
  macd_level: SignalDetails;
  bb_breakout: SignalDetails;
  bb_breakout_level: SignalDetails;
}

export interface SignalDetails {
  signal: string;
  details: string;
  confidence: number;
  near_support: boolean;
  breakout_signal: boolean;
  near_resistance: boolean;
  breakdown_signal: boolean;
  support_distance: number;
  resistance_distance: number;
}

export interface AgathaIndicators {
  atr: number;
  rsi: number;
  ema3: number;
  ema5: number;
  macd: number;
  ema21: number;
  ema30: number;
  asset_id: number;
  bb_lower: number;
  bb_upper: number;
  bb_middle: number;
  macd_signal: number;
  macd_histogram: number;
  support_levels: number[];
  resistance_levels: number[];
  significant_support: number;
  macd_trend_direction: string;
  significant_resistance: number;
}

export interface SupportAnalysis {
  analysis: string;
  near_support: boolean;
  support_count: number;
  buffer_percent: number;
  average_support: number;
  breakdown_signal: boolean;
  using_significant: boolean;
  distance_to_average: number;
  significant_support: number;
}

export interface ResistanceAnalysis {
  analysis: string;
  buffer_percent: number;
  breakout_signal: boolean;
  near_resistance: boolean;
  resistance_count: number;
  using_significant: boolean;
  average_resistance: number;
  distance_to_average: number;
  significant_resistance: number;
}

export interface AgathaAgentConfig {
  buffer_percent: number;
}

export interface VivienneAgent {
  data: VivienneAgentData;
  config: VivienneAgentConfig;
}

export interface VivienneAgentData {
  signals: Signal[];
  summary: Summary;
  recommendation: Recommendation;
  macd_trend_direction: string;
  chaos_discerned: Recommendation; // Reusing Recommendation interface as structure is similar
}

export interface Signal {
  name: string;
  value: boolean;
  weight: number;
  confidence: number;
  is_bullish: boolean | null;
  details: string;
  category: string;
  timestamp: number | null;
}

export interface Summary {
  sentiment: string;
  confidence: number;
  long_signals: number;
  short_signals: number;
  valid_long_signals: number;
  valid_short_signals: number;
  total_weight: number;
  categorized_signals: CategorizedSignals;
}

export interface CategorizedSignals {
  TREND: Signal[];
  VOLATILITY: Signal[];
  MOMENTUM: Signal[];
  OSCILLATOR: Signal[];
}

export interface Recommendation {
  sentiment: string;
  position_type: string;
  position_size: number;
  state: string;
  num_valid_signals: number;
  long_total_weight: number;
  short_total_weight: number;
  total_adjusted_weight: number;
  long_weighted_confidence: number;
  short_weighted_confidence: number;
  total_weighted_confidence: number;
  average_confidence: number;
  reasoning: string;
  sorting_signals: SortingSignals;
}

export interface SortingSignals {
  long: Signal[];
  short: Signal[];
  neutral: Signal[];
}

export interface VivienneAgentConfig {
  bang_threshold: number;
  aim_threshold: number;
  loaded_threshold: number;
  position_size_bang: number;
  position_size_aim: number;
  position_size_loaded: number;
  position_size_idle: number;
  enable_trend_filter_for_entry: boolean;
  macd: number;
  bb_level: number;
  bb_bounce: number;
  ema_cross: number;
  ema_level: number;
  rsi_cross: number;
  rsi_level: number;
  macd_level: number;
  bb_breakout: number;
  bb_breakout_level: number;
  state_threshold_aim: number;
  state_threshold_bang: number;
  state_threshold_loaded: number;
  enable_bollinger_filter_for_entry: boolean;
  bollinger_overextended_block: boolean;
  volatility_squeeze_threshold: number;
  volatility_breakout_threshold: number;
  signal_weights: SignalWeights;
}

export interface SignalWeights {
  ema_cross: number;
  ema_level: number;
  bb_bounce: number;
  bb_breakout: number;
  bb_level: number;
  bb_breakout_level: number;
  macd: number;
  macd_level: number;
  rsi_cross: number;
  rsi_level: number;
}

export interface TempestAgent {
  data: {};
  config: {};
}

export interface VesperAgent {
  data: {
    position: null;
  };
  config: {};
}

export interface AuroraAgent {
  data: AuroraAgentData;
  config: AuroraAgentConfig;
}

export interface AuroraAgentData {
  candles: CandleItem[];
  indicators: Indicators;
  macd_trend: MacdTrend;
  bollinger_context: BollingerContext;
  resistance_levels: ResistanceLevels;
  support_levels: SupportLevels;
  signals?: {
    buy?: SignalItem[];
    sell?: SignalItem[];
    hold?: SignalItem[];
  };
}

export interface SignalItem {
  time: number;
  type: string; // More generic to accommodate new signal names
  strength: 'strong' | 'medium' | 'weak';
  signal_type?: string; // e.g., "BULLISH", "LONG"
  confidence?: number;
  price?: number;
  direction?: string; // e.g., "LONG"
}

export interface CandleItem {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceHistoryItem {
  time: number;
  value: { time: number; value: number; };
}

export interface AuroraAgentConfig {
  // Add any specific config for AuroraAgent if available
}
