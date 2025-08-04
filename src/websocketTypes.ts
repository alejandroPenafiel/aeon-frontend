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
  latest_trend_filter_blocked?: TrendFilterBlocked;
  latest_volatility_filter_blocked?: VolatilityFilterBlocked;
  filter_analysis?: FilterAnalysis;
  final_trade_decision?: string;
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
  // Updated to match actual WebSocket data structure
  state_thresholds: {
    bang_threshold: number;
    aim_threshold: number;
    loaded_threshold: number;
  };
  position_sizing: {
    position_size_bang: number;
    position_size_aim: number;
    position_size_loaded: number;
    position_size_idle: number;
  };
  filters: {
    volatility_filter: {
      enable_bollinger_filter_for_entry: boolean;
      bollinger_overextended_block: boolean;
      volatility_squeeze_threshold: number;
      volatility_breakout_threshold: number;
    };
    trend_filter: {
      enable_trend_filter_for_entry: boolean;
    };
    levels_filter: {
      enable_levels_filter_for_entry: boolean;
      levels_buffer_percent: number;
    };
    underused_alpha_filter: {
      retail_chop_trade_count_threshold: number;
      retail_chop_avg_trade_size_threshold: number;
    };
    combined_vwap_filter: {
      weak_pump_trade_count_threshold: number;
      weak_pump_avg_trade_size_threshold: number;
      distribution_trade_count_threshold: number;
      distribution_avg_trade_size_threshold: number;
    };
  };
  signal_weights: {
    ema_cross: number;
    ema_level: number;
    vwap_anchor: number;
    combined_vwap: number;
    bb_bounce: number;
    bb_breakout: number;
    bb_level: number;
    bb_breakout_level: number;
    volume_confirmation: number;
    macd: number;
    macd_level: number;
    rsi_cross: number;
    rsi_level: number;
    underused_alpha: number;
  };
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
  data: TempestAgentData;
  config: TempestAgentConfig;
}

export interface TempestAgentData {
  position_analysis?: PositionAnalysis;
  strategy_results?: StrategyResult[];
  closure_recommendation?: ClosureRecommendation;
  winning_strategy?: string;
  reason_code?: string;
  should_close?: boolean;
  analysis_timestamp?: string;
  execution_status?: string;
  metadata?: {
    asset_symbol: string;
    last_updated: string;
    data_version: string;
  };
}

export interface TechnicalData {
  current_price: number;
  entry_price: number;
  ema3: number;
  ema21: number;
  atr: number;
  rsi: number;
  macd: number;
  position: any;
  // UnrealizedPnL specific fields
  price_movement?: number;
  max_favorable?: number;
  retracement_from_peak?: number;
  retracement_threshold?: number;
  active_threshold?: string;
  unrealized_pnl?: number;
  is_threshold_1_active?: boolean;
  is_threshold_2_active?: boolean;
  is_threshold_3_active?: boolean;
  is_retracing?: boolean;
  max_favorable_movement?: number;
}

export interface StrategyParameters {
  // ROEThresholdStrategy
  min_roe_threshold?: number;
  max_roe_threshold?: number;
  // StopLossTakeProfitStrategy
  stop_loss_percentage?: number;
  take_profit_percentage?: number;
  // EMACrossoverStrategy
  short_ema_period?: number;
  long_ema_period?: number;
  min_difference_percentage?: number;
  // ATRStopLossStrategy
  atr_multiplier?: number;
  move_to_breakeven?: boolean;
  breakeven_trigger?: number;
  use_trailing_stop?: boolean;
  trailing_activation?: number;
  trail_by_atr?: number;
  // UnrealizedPnLStrategy
  stop_loss_multiplier?: number;
  threshold_1_multiplier?: number;
  threshold_2_multiplier?: number;
  threshold_3_multiplier?: number;
  threshold_1_retracement?: number;
  threshold_2_retracement?: number;
  threshold_3_retracement?: number;
}

export interface StrategyResult {
  name: string;
  should_close: boolean;
  reason_code: string | null;
  details: string | null;
  confidence: number;
  technical_data: TechnicalData;
  parameters: StrategyParameters;
}

export interface ClosureRecommendation {
  should_close: boolean;
  winning_strategy: string;
  reason_code: string;
  details: string;
  confidence: number;
}

export interface PositionAnalysis {
  asset: string;
  position_type: string;
  size: number;
  entry_price: number;
  mark_price: number;
  unrealized_pnl: number;
  roe: number;
}

export interface TempestAgentConfig {
  // Strategy configurations
  ROEThresholdStrategy?: {
    roe_threshold: number;
    roe_take_profit: number;
  };
  StopLossTakeProfitStrategy?: {
    stop_loss_pct: number;
    take_profit_pct: number;
  };
  EMACrossoverStrategy?: {
    min_ema_difference_pct: number;
  };
  ATRStopLossStrategy?: {
    atr_multiplier: number;
    move_to_breakeven: boolean;
    breakeven_trigger: number;
    use_trailing_stop: boolean;
    trailing_activation: number;
    trail_by_atr: number;
  };
  UnrealizedPnLStrategy?: {
    stop_loss_multiplier: number;
    threshold_1_multiplier: number;
    threshold_2_multiplier: number;
    threshold_3_multiplier: number;
    threshold_1_retracement: number;
    threshold_2_retracement: number;
    threshold_3_retracement: number;
  };
  ResistanceExitStrategy?: {
    resistance_threshold: number;
    profit_taking_percentage: number;
  };
  // Global control
  pause_closure?: boolean;
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

export interface TrendFilterBlocked {
  asset: string;
  action: string;
  block_reason: string;
  size_percentage: number;
  triggering_state: string;
  reasoning_summary: string;
  macd_trend_direction: string;
}

export interface VolatilityFilterBlocked {
  asset: string;
  action: string;
  bb_bandwidth: number;
  block_reasons: string[];
  size_percentage: number;
  triggering_state: string;
  reasoning_summary: string;
}

export interface FilterAnalysis {
  trend_filter: TrendFilter;
  volatility_filter: VolatilityFilter;
  levels_filter: LevelsFilter;
  underused_alpha_filter: UnderusedAlphaFilter;
  combined_vwap_filter: CombinedVwapFilter;
  final_trade_decision: string;
}

export interface TrendFilter {
  filter_enabled: boolean;
  trade_direction: string;
  macd_trend: string;
  status: string;
  reason: string;
}

export interface VolatilityFilter {
  filter_enabled: boolean;
  bollinger_bandwidth: number;
  squeeze_threshold: number;
  breakout_threshold: number;
  strategy_context: string;
  status: string;
  reason: string;
}

export interface LevelsFilter {
  status: string;
  reason: string;
  resistance_analysis: ResistanceAnalysis;
  support_analysis: SupportAnalysis;
}

export interface UnderusedAlphaFilter {
  filter_enabled: boolean;
  status: string;
  reason: string;
}

export interface CombinedVwapFilter {
  filter_enabled: boolean;
  status: string;
  reason: string;
}
