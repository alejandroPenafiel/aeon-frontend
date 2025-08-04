import React, { useState, useEffect } from "react";
import type { AssetData } from "../websocketTypes";

interface AgentStatusPanelProps {
  assetData: AssetData | null;
  selectedAsset: string | null; // Add missing selectedAsset prop
  sendMessage?: (message: any) => void; // Add WebSocket send function
}

interface AgentStatus {
  name: string;
  state: string;
  confidence?: number;
  details?: string;
  isActive: boolean;
  priority: "high" | "medium" | "low";
  chaosData?: any; // Add chaos data for Vivienne
  technicalData?: any; // Add technical data for Octavia
  signalData?: any; // Add signal data for Agatha
  configData?: any; // Add config data for Configurations
}

export const AgentStatusPanel: React.FC<AgentStatusPanelProps> = ({
  assetData,
  selectedAsset, // Add selectedAsset to destructuring
  sendMessage,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [editingConfig, setEditingConfig] = useState<boolean>(false);
  const [configValues, setConfigValues] = useState<any>({});

  // Clear configValues when not editing to ensure fresh data from WebSocket updates
  useEffect(() => {
    if (!editingConfig) {
      setConfigValues({});
    }
  }, [editingConfig, assetData]);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const toggleConfigEditing = () => {
    if (editingConfig) {
      // When exiting edit mode, clear any unsaved changes
      setConfigValues({});
    }
    setEditingConfig(!editingConfig);
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfigValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveConfigChanges = () => {
    if (!sendMessage) {
      console.error('❌ sendMessage function not available');
      return;
    }

    if (!selectedAsset) {
      console.error('❌ No asset selected');
      return;
    }

    if (!assetData?.agents?.VivienneAgent?.config) {
      console.error('❌ VivienneAgent config not available');
      return;
    }

    try {
      // Get the current config from the asset data
      const currentConfig = assetData.agents.VivienneAgent.config;
      
      // Build flattened parameters object for ferrywheel format
      const params: Record<string, any> = {};
      
      // General parameters
      if (configValues.bang_threshold !== undefined) params.bang_threshold = configValues.bang_threshold;
      if (configValues.aim_threshold !== undefined) params.aim_threshold = configValues.aim_threshold;
      if (configValues.loaded_threshold !== undefined) params.loaded_threshold = configValues.loaded_threshold;
      if (configValues.position_size_bang !== undefined) params.position_size_bang = configValues.position_size_bang;
      if (configValues.position_size_aim !== undefined) params.position_size_aim = configValues.position_size_aim;
      if (configValues.position_size_loaded !== undefined) params.position_size_loaded = configValues.position_size_loaded;
      if (configValues.position_size_idle !== undefined) params.position_size_idle = configValues.position_size_idle;
      
      // Volatility filter parameters
      if (configValues.enable_bollinger_filter_for_entry !== undefined) params.enable_bollinger_filter_for_entry = configValues.enable_bollinger_filter_for_entry;
      if (configValues.bollinger_overextended_block !== undefined) params.bollinger_overextended_block = configValues.bollinger_overextended_block;
      if (configValues.volatility_squeeze_threshold !== undefined) params.volatility_squeeze_threshold = configValues.volatility_squeeze_threshold;
      if (configValues.volatility_breakout_threshold !== undefined) params.volatility_breakout_threshold = configValues.volatility_breakout_threshold;
      
      // Trend filter parameters
      if (configValues.enable_trend_filter_for_entry !== undefined) params.enable_trend_filter_for_entry = configValues.enable_trend_filter_for_entry;
      
      // Levels filter parameters
      if (configValues.enable_levels_filter_for_entry !== undefined) params.enable_levels_filter_for_entry = configValues.enable_levels_filter_for_entry;
      if (configValues.levels_buffer_percent !== undefined) params.levels_buffer_percent = configValues.levels_buffer_percent;
      
      // Underused alpha filter parameters
      if (configValues.retail_chop_trade_count_threshold !== undefined) params.retail_chop_trade_count_threshold = configValues.retail_chop_trade_count_threshold;
      if (configValues.retail_chop_avg_trade_size_threshold !== undefined) params.retail_chop_avg_trade_size_threshold = configValues.retail_chop_avg_trade_size_threshold;
      
      // Combined VWAP filter parameters
      if (configValues.weak_pump_trade_count_threshold !== undefined) params.weak_pump_trade_count_threshold = configValues.weak_pump_trade_count_threshold;
      if (configValues.weak_pump_avg_trade_size_threshold !== undefined) params.weak_pump_avg_trade_size_threshold = configValues.weak_pump_avg_trade_size_threshold;
      if (configValues.distribution_trade_count_threshold !== undefined) params.distribution_trade_count_threshold = configValues.distribution_trade_count_threshold;
      if (configValues.distribution_avg_trade_size_threshold !== undefined) params.distribution_avg_trade_size_threshold = configValues.distribution_avg_trade_size_threshold;
      
      // Signal weights parameters
      if (configValues.ema_cross !== undefined) params.ema_cross = configValues.ema_cross;
      if (configValues.ema_level !== undefined) params.ema_level = configValues.ema_level;
      if (configValues.vwap_anchor !== undefined) params.vwap_anchor = configValues.vwap_anchor;
      if (configValues.combined_vwap !== undefined) params.combined_vwap = configValues.combined_vwap;
      if (configValues.bb_bounce !== undefined) params.bb_bounce = configValues.bb_bounce;
      if (configValues.bb_breakout !== undefined) params.bb_breakout = configValues.bb_breakout;
      if (configValues.bb_level !== undefined) params.bb_level = configValues.bb_level;
      if (configValues.bb_breakout_level !== undefined) params.bb_breakout_level = configValues.bb_breakout_level;
      if (configValues.volume_confirmation !== undefined) params.volume_confirmation = configValues.volume_confirmation;
      if (configValues.macd !== undefined) params.macd = configValues.macd;
      if (configValues.macd_level !== undefined) params.macd_level = configValues.macd_level;
      if (configValues.rsi_cross !== undefined) params.rsi_cross = configValues.rsi_cross;
      if (configValues.rsi_level !== undefined) params.rsi_level = configValues.rsi_level;
      if (configValues.underused_alpha !== undefined) params.underused_alpha = configValues.underused_alpha;

      // Create WebSocket format message for VivienneAgent
      const configUpdateMessage = {
        type: "vivienne_config_update",
        asset: selectedAsset,
        config: params
      };
      
      sendMessage(configUpdateMessage);
      console.log('📤 VivienneAgent: Config update sent:', configUpdateMessage);
      
      // Clear the config values and exit editing mode
      setConfigValues({});
      setEditingConfig(false);
    } catch (error) {
      console.error('❌ VivienneAgent: Failed to save config:', error);
    }
  };
  const getAgentStatuses = (): AgentStatus[] => {
    if (!assetData?.agents) return [];

    const statuses: AgentStatus[] = [];

    // Vivienne Agent - Focus on chaos_discerned data (FIRST - will appear on the left)
    const vivienneData = assetData.agents.VivienneAgent?.data;
    const vivienneConfig = assetData.agents.VivienneAgent?.config;
    if (vivienneData?.chaos_discerned) {
      const chaos = vivienneData.chaos_discerned;
      statuses.push({
        name: "Vivienne",
        state: "", // Removed redundant state display
        confidence: chaos.total_weighted_confidence || 0,
        details: "", // Removed redundant details display
        isActive: chaos.state !== "idle",
        priority:
          chaos.state === "bang"
            ? "high"
            : chaos.state === "aim"
              ? "medium"
              : "low",
        chaosData: {
          // MACD trend direction at top level
          macd_trend_direction: vivienneData.macd_trend_direction || "neutral",
          // Chaos discerned data (nested structure)
          chaos_discerned: {
            sentiment: vivienneData.chaos_discerned?.sentiment || "NEUTRAL",
            position_type:
              vivienneData.chaos_discerned?.position_type || "NONE",
            position_size: vivienneData.chaos_discerned?.position_size || 0,
            state: vivienneData.chaos_discerned?.state || "idle",
            num_valid_signals:
              vivienneData.chaos_discerned?.num_valid_signals || 0,
            long_total_weight:
              vivienneData.chaos_discerned?.long_total_weight || 0,
            short_total_weight:
              vivienneData.chaos_discerned?.short_total_weight || 0,
            total_adjusted_weight:
              vivienneData.chaos_discerned?.total_adjusted_weight || 0,
            long_weighted_confidence:
              vivienneData.chaos_discerned?.long_weighted_confidence || 0,
            short_weighted_confidence:
              vivienneData.chaos_discerned?.short_weighted_confidence || 0,
            total_weighted_confidence:
              vivienneData.chaos_discerned?.total_weighted_confidence || 0,
            average_confidence:
              vivienneData.chaos_discerned?.average_confidence || 0,
            reasoning:
              vivienneData.chaos_discerned?.reasoning ||
              "No reasoning available",
            sorting_signals: {
              long: vivienneData.chaos_discerned?.sorting_signals?.long || [],
              short: vivienneData.chaos_discerned?.sorting_signals?.short || [],
              neutral:
                vivienneData.chaos_discerned?.sorting_signals?.neutral || [],
            },
          },
          // Filter data (nested structure)
          latest_trend_filter_blocked: vivienneData.latest_trend_filter_blocked,
          latest_volatility_filter_blocked:
            vivienneData.latest_volatility_filter_blocked,
          // New levels filter data
          filter_analysis: vivienneData.filter_analysis,
          // Configuration data - Updated to match actual WebSocket structure
          config: vivienneConfig ? {
            // General config (thresholds and position sizes)
            general: vivienneConfig.general || {},
            // Individual config sections
            volatility_filter: vivienneConfig.volatility_filter || {},
            trend_filter: vivienneConfig.trend_filter || {},
            levels_filter: vivienneConfig.levels_filter || {},
            underused_alpha_filter: vivienneConfig.underused_alpha_filter || {},
            combined_vwap_filter: vivienneConfig.combined_vwap_filter || {},
            signal_weights: vivienneConfig.signal_weights || {},
            // Legacy flat access for backward compatibility
            bang_threshold: vivienneConfig.general?.bang_threshold || 0,
            aim_threshold: vivienneConfig.general?.aim_threshold || 0,
            loaded_threshold: vivienneConfig.general?.loaded_threshold || 0,
            position_size_bang: vivienneConfig.general?.position_size_bang || 0,
            position_size_aim: vivienneConfig.general?.position_size_aim || 0,
            position_size_loaded: vivienneConfig.general?.position_size_loaded || 0,
            position_size_idle: vivienneConfig.general?.position_size_idle || 0,
            enable_trend_filter_for_entry: vivienneConfig.trend_filter?.enable_trend_filter_for_entry || false,
            enable_bollinger_filter_for_entry: vivienneConfig.volatility_filter?.enable_bollinger_filter_for_entry || false,
            bollinger_overextended_block: vivienneConfig.volatility_filter?.bollinger_overextended_block || false,
            volatility_squeeze_threshold: vivienneConfig.volatility_filter?.volatility_squeeze_threshold || 0,
            volatility_breakout_threshold: vivienneConfig.volatility_filter?.volatility_breakout_threshold || 0,
            enable_levels_filter_for_entry: vivienneConfig.levels_filter?.enable_levels_filter_for_entry || false,
            levels_buffer_percent: vivienneConfig.levels_filter?.levels_buffer_percent || 0,
            retail_chop_trade_count_threshold: vivienneConfig.underused_alpha_filter?.retail_chop_trade_count_threshold || 0,
            retail_chop_avg_trade_size_threshold: vivienneConfig.underused_alpha_filter?.retail_chop_avg_trade_size_threshold || 0,
            weak_pump_trade_count_threshold: vivienneConfig.combined_vwap_filter?.weak_pump_trade_count_threshold || 0,
            weak_pump_avg_trade_size_threshold: vivienneConfig.combined_vwap_filter?.weak_pump_avg_trade_size_threshold || 0,
            distribution_trade_count_threshold: vivienneConfig.combined_vwap_filter?.distribution_trade_count_threshold || 0,
            distribution_avg_trade_size_threshold: vivienneConfig.combined_vwap_filter?.distribution_avg_trade_size_threshold || 0,
            // Signal weights
            ema_cross: vivienneConfig.signal_weights?.ema_cross || 0,
            ema_level: vivienneConfig.signal_weights?.ema_level || 0,
            vwap_anchor: vivienneConfig.signal_weights?.vwap_anchor || 0,
            combined_vwap: vivienneConfig.signal_weights?.combined_vwap || 0,
            bb_bounce: vivienneConfig.signal_weights?.bb_bounce || 0,
            bb_breakout: vivienneConfig.signal_weights?.bb_breakout || 0,
            bb_level: vivienneConfig.signal_weights?.bb_level || 0,
            bb_breakout_level: vivienneConfig.signal_weights?.bb_breakout_level || 0,
            volume_confirmation: vivienneConfig.signal_weights?.volume_confirmation || 0,
            macd: vivienneConfig.signal_weights?.macd || 0,
            macd_level: vivienneConfig.signal_weights?.macd_level || 0,
            rsi_cross: vivienneConfig.signal_weights?.rsi_cross || 0,
            rsi_level: vivienneConfig.signal_weights?.rsi_level || 0,
            underused_alpha: vivienneConfig.signal_weights?.underused_alpha || 0,
          } : null,
        },
      });
    }

    // Agatha Agent - Signal Processing (SECOND - will appear in the middle)
    const agathaData = assetData.agents.AgathaAgent?.data;
    if (agathaData?.processed_signals) {
      const signals = agathaData.processed_signals;

      // Count active signals (signals with confidence > 0)
      const activeSignals = Object.values(signals.signals || {}).filter(
        (signal: any) => signal.confidence > 0,
      ).length;

      statuses.push({
        name: "Agatha",
        state: "", // Removed redundant status display
        confidence:
          activeSignals > 0 ? Math.round((activeSignals / 9) * 100) : 0, // 9 total signal types
        details: "", // Removed redundant signal count display
        isActive: activeSignals > 0,
        priority: activeSignals > 0 ? "high" : "low",
        signalData: {
          status: signals.status || "STANDBY",
          price: signals.price || 0,
          active_signals: activeSignals,
          total_signals: 9, // Total possible signal types
          long_signals: Object.values(signals.signals || {}).filter(
            (s: any) =>
              (s.signal === "buy" ||
                s.signal?.toUpperCase().includes("BULLISH")) &&
              s.confidence > 0,
          ).length,
          short_signals: Object.values(signals.signals || {}).filter(
            (s: any) =>
              (s.signal === "sell" ||
                s.signal?.toUpperCase().includes("BEARISH")) &&
              s.confidence > 0,
          ).length,
          neutral_signals: Object.values(signals.signals || {}).filter(
            (s: any) => s.signal === "hold" && s.confidence > 0,
          ).length,
          // Individual signal details
          signals: signals.signals || {},
        },
      });
    } else {
      statuses.push({
        name: "Agatha",
        state: "STANDBY",
        confidence: 0,
        details: "", // Removed redundant signal count display
        isActive: false,
        priority: "low",
      });
    }

    // Octavia Agent - Technical Analysis (THIRD - will appear on the right)
    const octaviaData = assetData.agents.OctaviaAgent?.data;
    if (octaviaData?.indicators) {
      const indicators = octaviaData.indicators;
      const macdTrend = octaviaData.macd_trend;
      const bollingerContext = octaviaData.bollinger_context;
      const resistanceLevels = octaviaData.resistance_levels;
      const supportLevels = octaviaData.support_levels;

      // Helper function to get latest value from PriceHistoryItem array or direct number
      const getLatestValue = (data: any) => {
        // If it's an array (PriceHistoryItem[]), extract the latest value
        if (Array.isArray(data)) {
          if (!data || data.length === 0) {
            console.log("Array is empty or null:", data);
            return 0;
          }
          const latest = data[data.length - 1];
          console.log("Latest item:", latest);
          console.log("Latest value structure:", latest?.value);
          const result = latest?.value?.value || 0;
          console.log("Extracted value:", result);
          return result;
        }
        // If it's a direct number, return it
        if (typeof data === "number") {
          return data;
        }
        // If it's undefined/null, return 0
        return 0;
      };

      // Helper function to format number to 4 decimal places
      const formatValue = (value: number) => {
        return value.toFixed(4);
      };

      statuses.push({
        name: "Octavia",
        state: "", // Remove redundant state text
        confidence: 0, // Remove meaningless confidence
        details: "", // Remove redundant summary - we show everything in the header table
        isActive: true,
        priority: "medium",
        technicalData: {
          // EMAs
          ema3: formatValue(getLatestValue(indicators?.ema_3)),
          ema5: formatValue(getLatestValue(indicators?.ema_5)),
          ema21: formatValue(getLatestValue(indicators?.ema_21)),
          ema30: formatValue(getLatestValue(indicators?.ema_30)),
          // RSI
          rsi: formatValue(getLatestValue(indicators?.rsi)),
          // MACD
          macdLine: formatValue(getLatestValue(indicators?.macd)),
          macdSignal: formatValue(getLatestValue(indicators?.macd_signal)),
          macdHistogram: formatValue(
            getLatestValue(indicators?.macd_histogram),
          ),
          macdTrend: macdTrend?.macd_trend_direction || "neutral",
          // Bollinger Bands
          bbUpper: formatValue(getLatestValue(indicators?.bb_upper)),
          bbMiddle: formatValue(getLatestValue(indicators?.bb_middle)),
          bbLower: formatValue(getLatestValue(indicators?.bb_lower)),
          bbBandwidth: formatValue(bollingerContext?.bb_bandwidth || 0),
          bbSqueeze: bollingerContext?.bb_is_in_squeeze ? "Yes" : "No",
          bbPosition: bollingerContext?.bb_price_position || "unknown",
          // ATR
          atr: formatValue(getLatestValue(indicators?.atr)),
          // Support & Resistance
          sigSupport: formatValue(
            getLatestValue(supportLevels?.significant_support),
          ),
          sigResistance: formatValue(
            getLatestValue(resistanceLevels?.significant_resistance),
          ),
        },
      });
    }

    return statuses;
  };

  return (
    <div className="mb-6">
      <div className="text-lg font-bold text-yellow-400 mb-4 font-mono">
        MARKET OPEN PIPELINE
      </div>
      <div className="grid grid-cols-3 gap-4 w-full">
        {getAgentStatuses().map((status, index) => (
          <div
            key={index}
            className={`terminal-block p-4 min-w-0 flex-shrink-0 w-full relative ${
              status.isActive
                ? "border-green-500 bg-green-900 bg-opacity-20"
                : "border-gray-600"
            }`}
          >
            {/* Agent Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {status.name === "Vivienne" && "🎲"}
                  {status.name === "Agatha" && "📊"}
                  {status.name === "Octavia" && "⚡"}
                  {status.name === "Configurations" && "⚙️"}
                </span>
                <span className="font-bold text-white font-mono">
                  {status.name}
                </span>
              </div>
              {status.confidence && status.confidence > 0 && (
                <div className="text-yellow-400 font-mono">
                  {status.confidence.toFixed(2)}%
                </div>
              )}
            </div>

            {/* Special header info for Configurations */}
            {status.name === "Configurations" && status.configData && (
              <div className="text-[10px] font-mono mb-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bang Threshold:</span>
                  <span className="text-yellow-400">
                    {status.configData.general?.bang_threshold || status.configData.bang_threshold}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Aim Threshold:</span>
                  <span className="text-yellow-400">
                    {status.configData.general?.aim_threshold || status.configData.aim_threshold}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Loaded Threshold:</span>
                  <span className="text-yellow-400">
                    {status.configData.general?.loaded_threshold || status.configData.loaded_threshold}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bang Size:</span>
                  <span className="text-green-400">
                    {status.configData.general?.position_size_bang || status.configData.position_size_bang}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Aim Size:</span>
                  <span className="text-green-400">
                    {status.configData.general?.position_size_aim || status.configData.position_size_aim}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Loaded Size:</span>
                  <span className="text-green-400">
                    {status.configData.general?.position_size_loaded || status.configData.position_size_loaded}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Idle Size:</span>
                  <span className="text-gray-400">
                    {status.configData.general?.position_size_idle || status.configData.position_size_idle}%
                  </span>
                </div>
              </div>
            )}

            {/* Special header info for Octavia */}
            {status.name === "Octavia" && status.technicalData && (
              <div className="text-[10px] font-mono mb-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">BB Bandwidth:</span>
                  <span className="text-yellow-400">
                    {status.technicalData.bbBandwidth}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">BB Squeeze:</span>
                  <span className="text-yellow-400">
                    {status.technicalData.bbSqueeze}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">BB Position:</span>
                  <span className="text-yellow-400">
                    {status.technicalData.bbPosition}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sig Support:</span>
                  <span className="text-yellow-400">
                    {status.technicalData.sigSupport}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sig Resistance:</span>
                  <span className="text-yellow-400">
                    {status.technicalData.sigResistance}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">MACD Trend:</span>
                  <span
                    className={`${
                      status.technicalData.macdTrend === "increasing"
                        ? "text-green-400"
                        : status.technicalData.macdTrend === "decreasing"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {status.technicalData.macdTrend}
                  </span>
                </div>
              </div>
            )}

            {/* Special header info for Agatha */}
            {status.name === "Agatha" && status.signalData && (
              <div className="text-[10px] font-mono mb-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-yellow-400">
                    {status.signalData.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-yellow-400">
                    {status.signalData.price}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Signals:</span>
                  <span className="text-green-400">
                    {status.signalData.active_signals}/
                    {status.signalData.total_signals}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Long Signals:</span>
                  <span className="text-green-400">
                    {status.signalData.long_signals}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Short Signals:</span>
                  <span className="text-red-400">
                    {status.signalData.short_signals}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Neutral Signals:</span>
                  <span className="text-yellow-400">
                    {status.signalData.neutral_signals}
                  </span>
                </div>
              </div>
            )}

            {/* Agent Details */}
            <div className="text-sm text-gray-300 font-mono mb-3">
              {status.details}
            </div>

            {/* Special header info for Vivienne */}
            {status.name === "Vivienne" && status.chaosData && (
              <>
                <div className="text-[10px] font-mono mb-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Final Decision:</span>
                    <span
                      className={`${
                        status.chaosData.filter_analysis?.final_trade_decision ===
                        "allowed"
                          ? "text-green-400"
                          : status.chaosData.filter_analysis
                                ?.final_trade_decision === "blocked"
                            ? "text-red-400"
                            : "text-yellow-400"
                      }`}
                    >
                      {status.chaosData.filter_analysis?.final_trade_decision?.toUpperCase() ||
                        "NONE"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Position Type:</span>
                    <span
                      className={`${
                        status.chaosData.chaos_discerned?.position_type === "LONG"
                          ? "text-green-400"
                          : status.chaosData.chaos_discerned?.position_type ===
                              "SHORT"
                            ? "text-red-400"
                            : "text-yellow-400"
                      }`}
                    >
                      {status.chaosData.chaos_discerned?.position_type || "NONE"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">State:</span>
                    <span className="text-yellow-400">
                      {status.chaosData.chaos_discerned?.state || "idle"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trend Filter:</span>
                    <span
                      className={`${
                        status.chaosData.filter_analysis?.trend_filter?.status ===
                        "blocked"
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {status.chaosData.filter_analysis?.trend_filter?.status?.toUpperCase() ||
                        "NONE"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Volatility Filter:</span>
                    <span
                      className={`${
                        status.chaosData.filter_analysis?.volatility_filter
                          ?.status === "blocked"
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {status.chaosData.filter_analysis?.volatility_filter?.status?.toUpperCase() ||
                        "NONE"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Levels Filter:</span>
                    <span
                      className={`${
                        status.chaosData.filter_analysis?.levels_filter
                          ?.status === "blocked"
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {status.chaosData.filter_analysis?.levels_filter?.status?.toUpperCase() ||
                        "NONE"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <button
                    onClick={() => toggleSection("vivienne-chaos")}
                    className="w-full text-left text-xs text-gray-400 mb-2 font-mono hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>CHAOS ANALYSIS</span>
                    <span className="text-gray-500">
                      {expandedSections["vivienne-chaos"] ? "▼" : "▶"}
                    </span>
                  </button>
                                  {expandedSections["vivienne-chaos"] && (
                  <div className="text-[12px] font-mono absolute z-10 bg-gray-900 border border-gray-600 p-3 shadow-lg" style={{ top: '100%', left: 0, right: 0 }}>
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="text-gray-400 pr-2">MACD Trend:</td>
                            <td
                              className={`text-right ${
                                status.chaosData.macd_trend_direction ===
                                "increasing"
                                  ? "text-green-400"
                                  : status.chaosData.macd_trend_direction ===
                                      "decreasing"
                                    ? "text-red-400"
                                    : "text-yellow-400"
                              }`}
                            >
                              {status.chaosData.macd_trend_direction}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Position Type:</td>
                            <td
                              className={`text-right ${
                                status.chaosData.chaos_discerned
                                  ?.position_type === "LONG"
                                  ? "text-green-400"
                                  : status.chaosData.chaos_discerned
                                        ?.position_type === "SHORT"
                                    ? "text-red-400"
                                    : "text-yellow-400"
                              }`}
                            >
                              {status.chaosData.chaos_discerned?.position_type}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Sentiment:</td>
                            <td
                              className={`text-right ${
                                status.chaosData.chaos_discerned?.sentiment ===
                                "BULLISH"
                                  ? "text-green-400"
                                  : status.chaosData.chaos_discerned
                                        ?.sentiment === "BEARISH"
                                    ? "text-red-400"
                                    : "text-red-400"
                              }`}
                            >
                              {status.chaosData.chaos_discerned?.sentiment}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Position Size:</td>
                            <td className="text-yellow-400 text-right">
                              {status.chaosData.chaos_discerned?.position_size}%
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">State:</td>
                            <td className="text-yellow-400 text-right">
                              {status.chaosData.chaos_discerned?.state}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Valid Signals:</td>
                            <td className="text-yellow-400 text-right">
                              {
                                status.chaosData.chaos_discerned
                                  ?.num_valid_signals
                              }
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Long Weight:</td>
                            <td className="text-green-400 text-right">
                              {status.chaosData.chaos_discerned?.long_total_weight?.toFixed(
                                2,
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Short Weight:</td>
                            <td className="text-red-400 text-right">
                              {status.chaosData.chaos_discerned?.short_total_weight?.toFixed(
                                2,
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Total Weight:</td>
                            <td className="text-yellow-400 text-right">
                              {status.chaosData.chaos_discerned?.total_adjusted_weight?.toFixed(
                                2,
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Long Conf:</td>
                            <td className="text-green-400 text-right">
                              {status.chaosData.chaos_discerned?.long_weighted_confidence?.toFixed(
                                2,
                              )}
                              %
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Short Conf:</td>
                            <td className="text-red-400 text-right">
                              {status.chaosData.chaos_discerned?.short_weighted_confidence?.toFixed(
                                2,
                              )}
                              %
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Total Conf:</td>
                            <td className="text-yellow-400 text-right">
                              {status.chaosData.chaos_discerned?.total_weighted_confidence?.toFixed(
                                2,
                              )}
                              %
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Avg Conf:</td>
                            <td className="text-yellow-400 text-right">
                              {status.chaosData.chaos_discerned?.average_confidence?.toFixed(
                                2,
                              )}
                              %
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Long Signals:</td>
                            <td className="text-green-400 text-right">
                              {status.chaosData.chaos_discerned?.sorting_signals
                                ?.long?.length || 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">Short Signals:</td>
                            <td className="text-red-400 text-right">
                              {status.chaosData.chaos_discerned?.sorting_signals
                                ?.short?.length || 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-gray-400 pr-2">
                              Neutral Signals:
                            </td>
                            <td className="text-yellow-400 text-right">
                              {status.chaosData.chaos_discerned?.sorting_signals
                                ?.neutral?.length || 0}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Chaos Analysis Reasoning */}
                      <div className="mt-3 pt-2 border-t border-gray-700">
                        <div className="text-[9px] text-gray-500 mb-1 font-mono">
                          CHAOS ANALYSIS REASONING
                        </div>
                        <div className="text-[8px] text-gray-300 font-mono">
                          {status.chaosData.chaos_discerned?.reasoning}
                        </div>
                      </div>

                      {/* Filter Information */}
                      {status.chaosData.filter_analysis && (
                        <div className="mt-3 pt-2 border-t border-gray-700">
                          <div className="text-[9px] text-gray-500 mb-1 font-mono">
                            FILTER STATUS
                          </div>

                          {/* Final Trade Decision - MOST IMPORTANT */}
                          {status.chaosData.filter_analysis?.final_trade_decision && (
                            <div className="mb-2 p-1 border border-yellow-700 bg-yellow-900/20">
                              <div className="text-[11px] text-yellow-400 font-mono mb-1">
                                FINAL TRADE DECISION
                              </div>
                              <div className="text-[10px] text-gray-300">
                                <div>
                                  Decision:{" "}
                                  <span
                                    className={`${
                                      status.chaosData.filter_analysis.final_trade_decision === "BLOCKED" ? "text-red-400" : 
                                      status.chaosData.filter_analysis.final_trade_decision === "ALLOWED" ? "text-green-400" : 
                                      "text-yellow-400"
                                    }`}
                                  >
                                    {status.chaosData.filter_analysis.final_trade_decision}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Underused Alpha Filter */}
                          {status.chaosData.filter_analysis?.underused_alpha_filter && (
                            <div className="mb-2 p-1 border border-orange-700 bg-orange-900/20">
                              <div className="text-[11px] text-orange-400 font-mono mb-1">
                                UNDERUSED ALPHA FILTER
                              </div>
                              <div className="text-[10px] text-gray-300">
                                <div>
                                  Status:{" "}
                                  <span
                                    className={`${status.chaosData.filter_analysis.underused_alpha_filter.status === "blocked" ? "text-red-400" : "text-green-400"}`}
                                  >
                                    {status.chaosData.filter_analysis.underused_alpha_filter.status?.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  Reason:{" "}
                                  <span className="text-orange-400">
                                    {
                                      status.chaosData.filter_analysis
                                        .underused_alpha_filter.reason
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Combined VWAP Filter */}
                          {status.chaosData.filter_analysis?.combined_vwap_filter && (
                            <div className="mb-2 p-1 border border-indigo-700 bg-indigo-900/20">
                              <div className="text-[11px] text-indigo-400 font-mono mb-1">
                                COMBINED VWAP FILTER
                              </div>
                              <div className="text-[10px] text-gray-300">
                                <div>
                                  Status:{" "}
                                  <span
                                    className={`${status.chaosData.filter_analysis.combined_vwap_filter.status === "blocked" ? "text-red-400" : "text-green-400"}`}
                                  >
                                    {status.chaosData.filter_analysis.combined_vwap_filter.status?.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  Reason:{" "}
                                  <span className="text-indigo-400">
                                    {
                                      status.chaosData.filter_analysis
                                        .combined_vwap_filter.reason
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Current Filter Analysis */}
                          {status.chaosData.filter_analysis?.trend_filter && (
                            <div className="mb-2 p-1 border border-purple-700 bg-purple-900/20">
                              <div className="text-[11px] text-purple-400 font-mono mb-1">
                                TREND FILTER ANALYSIS
                              </div>
                              <div className="text-[10px] text-gray-300">
                                <div>
                                  Enabled:{" "}
                                  <span
                                    className={`${status.chaosData.filter_analysis.trend_filter.filter_enabled ? "text-green-400" : "text-gray-400"}`}
                                  >
                                    {status.chaosData.filter_analysis.trend_filter
                                      .filter_enabled
                                      ? "Yes"
                                      : "No"}
                                  </span>
                                </div>
                                <div>
                                  Trade Direction:{" "}
                                  <span className="text-purple-400">
                                    {
                                      status.chaosData.filter_analysis
                                        .trend_filter.trade_direction
                                    }
                                  </span>
                                </div>
                                <div>
                                  MACD Trend:{" "}
                                  <span className="text-purple-400">
                                    {
                                      status.chaosData.filter_analysis
                                        .trend_filter.macd_trend
                                    }
                                  </span>
                                </div>
                                <div>
                                  Status:{" "}
                                  <span
                                    className={`${status.chaosData.filter_analysis.trend_filter.status === "blocked" ? "text-red-400" : "text-green-400"}`}
                                  >
                                    {status.chaosData.filter_analysis.trend_filter.status?.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  Reason:{" "}
                                  <span className="text-gray-400">
                                    {
                                      status.chaosData.filter_analysis
                                        .trend_filter.reason
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {status.chaosData.filter_analysis
                            ?.volatility_filter && (
                            <div className="mb-2 p-1 border border-cyan-700 bg-cyan-900/20">
                              <div className="text-[11px] text-cyan-400 font-mono mb-1">
                                VOLATILITY FILTER ANALYSIS
                              </div>
                              <div className="text-[10px] text-gray-300">
                                <div>
                                  Enabled:{" "}
                                  <span
                                    className={`${status.chaosData.filter_analysis.volatility_filter.filter_enabled ? "text-green-400" : "text-gray-400"}`}
                                  >
                                    {status.chaosData.filter_analysis
                                      .volatility_filter.filter_enabled
                                      ? "Yes"
                                      : "No"}
                                  </span>
                                </div>
                                <div>
                                  BB Bandwidth:{" "}
                                  <span className="text-yellow-400">
                                    {status.chaosData.filter_analysis.volatility_filter.bollinger_bandwidth?.toFixed(
                                      4,
                                    ) || "0.0000"}
                                  </span>
                                </div>
                                <div>
                                  Squeeze Threshold:{" "}
                                  <span className="text-cyan-400">
                                    {status.chaosData.filter_analysis.volatility_filter.squeeze_threshold?.toFixed(
                                      4,
                                    ) || "0.0000"}
                                  </span>
                                </div>
                                <div>
                                  Breakout Threshold:{" "}
                                  <span className="text-cyan-400">
                                    {status.chaosData.filter_analysis.volatility_filter.breakout_threshold?.toFixed(
                                      4,
                                    ) || "0.0000"}
                                  </span>
                                </div>
                                <div>
                                  Strategy Context:{" "}
                                  <span className="text-gray-400">
                                    {
                                      status.chaosData.filter_analysis
                                        .volatility_filter.strategy_context
                                    }
                                  </span>
                                </div>
                                <div>
                                  Status:{" "}
                                  <span
                                    className={`${status.chaosData.filter_analysis.volatility_filter.status === "blocked" ? "text-red-400" : "text-green-400"}`}
                                  >
                                    {status.chaosData.filter_analysis.volatility_filter.status?.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  Reason:{" "}
                                  <span className="text-gray-400">
                                    {
                                      status.chaosData.filter_analysis
                                        .volatility_filter.reason
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* New Levels Filter Display */}
                          {status.chaosData.filter_analysis?.levels_filter && (
                            <div className="mb-2 p-1 border border-blue-700 bg-blue-900/20">
                              <div className="text-[11px] text-blue-400 font-mono mb-1">
                                LEVELS FILTER
                              </div>
                              <div className="text-[10px] text-gray-300">
                                <div>
                                  Status:{" "}
                                  <span
                                    className={`${status.chaosData.filter_analysis.levels_filter.status === "blocked" ? "text-red-400" : "text-green-400"}`}
                                  >
                                    {status.chaosData.filter_analysis.levels_filter.status?.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  Reason:{" "}
                                  <span className="text-blue-400">
                                    {
                                      status.chaosData.filter_analysis
                                        .levels_filter.reason
                                    }
                                  </span>
                                </div>

                                {/* Support Analysis */}
                                {status.chaosData.filter_analysis.levels_filter
                                  .support_analysis && (
                                  <div className="mt-2 pt-1 border-t border-gray-600">
                                    <div className="text-[10px] text-gray-500 mb-1">
                                      SUPPORT ANALYSIS
                                    </div>
                                    <div>
                                      Near Support:{" "}
                                      <span
                                        className={`${status.chaosData.filter_analysis.levels_filter.support_analysis.near_support ? "text-green-400" : "text-gray-400"}`}
                                      >
                                        {status.chaosData.filter_analysis
                                          .levels_filter.support_analysis
                                          .near_support
                                          ? "Yes"
                                          : "No"}
                                      </span>
                                    </div>
                                    <div>
                                      Breakdown Signal:{" "}
                                      <span
                                        className={`${status.chaosData.filter_analysis.levels_filter.support_analysis.breakdown_signal ? "text-red-400" : "text-gray-400"}`}
                                      >
                                        {status.chaosData.filter_analysis
                                          .levels_filter.support_analysis
                                          .breakdown_signal
                                          ? "Yes"
                                          : "No"}
                                      </span>
                                    </div>
                                    <div>
                                      Distance:{" "}
                                      <span className="text-yellow-400">
                                        {status.chaosData.filter_analysis.levels_filter.support_analysis.distance_to_average?.toFixed(
                                          4,
                                        ) || "0.0000"}
                                      </span>
                                    </div>
                                    <div>
                                      Avg Support:{" "}
                                      <span className="text-green-400">
                                        {status.chaosData.filter_analysis.levels_filter.support_analysis.average_support?.toFixed(
                                          4,
                                        ) || "0.0000"}
                                      </span>
                                    </div>
                                    <div>
                                      Sig Support:{" "}
                                      <span className="text-green-400">
                                        {status.chaosData.filter_analysis.levels_filter.support_analysis.significant_support?.toFixed(
                                          4,
                                        ) || "0.0000"}
                                      </span>
                                    </div>
                                    <div>
                                      Buffer:{" "}
                                      <span className="text-gray-400">
                                        {status.chaosData.filter_analysis
                                          .levels_filter.support_analysis
                                          .buffer_percent || 0}
                                        %
                                      </span>
                                    </div>
                                    <div>
                                      Count:{" "}
                                      <span className="text-gray-400">
                                        {status.chaosData.filter_analysis
                                          .levels_filter.support_analysis
                                          .support_count || 0}
                                      </span>
                                    </div>
                                    <div>
                                      Using Sig:{" "}
                                      <span
                                        className={`${status.chaosData.filter_analysis.levels_filter.support_analysis.using_significant ? "text-green-400" : "text-gray-400"}`}
                                      >
                                        {status.chaosData.filter_analysis
                                          .levels_filter.support_analysis
                                          .using_significant
                                          ? "Yes"
                                          : "No"}
                                      </span>
                                    </div>
                                    <div>
                                      Analysis:{" "}
                                      <span className="text-gray-400">
                                        {
                                          status.chaosData.filter_analysis
                                            .levels_filter.support_analysis
                                            .analysis
                                        }
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Resistance Analysis */}
                                {status.chaosData.filter_analysis.levels_filter
                                  .resistance_analysis && (
                                  <div className="mt-2 pt-1 border-t border-gray-600">
                                    <div className="text-[10px] text-gray-500 mb-1">
                                      RESISTANCE ANALYSIS
                                    </div>
                                    <div>
                                      Near Resistance:{" "}
                                      <span
                                        className={`${status.chaosData.filter_analysis.levels_filter.resistance_analysis.near_resistance ? "text-green-400" : "text-gray-400"}`}
                                      >
                                        {status.chaosData.filter_analysis
                                          .levels_filter.resistance_analysis
                                          .near_resistance
                                          ? "Yes"
                                          : "No"}
                                      </span>
                                    </div>
                                    <div>
                                      Breakout Signal:{" "}
                                      <span
                                        className={`${status.chaosData.filter_analysis.levels_filter.resistance_analysis.breakout_signal ? "text-green-400" : "text-gray-400"}`}
                                      >
                                        {status.chaosData.filter_analysis
                                          .levels_filter.resistance_analysis
                                          .breakout_signal
                                          ? "Yes"
                                          : "No"}
                                      </span>
                                    </div>
                                    <div>
                                      Distance:{" "}
                                      <span className="text-yellow-400">
                                        {status.chaosData.filter_analysis.levels_filter.resistance_analysis.distance_to_average?.toFixed(
                                          4,
                                        ) || "0.0000"}
                                      </span>
                                    </div>
                                    <div>
                                      Avg Resistance:{" "}
                                      <span className="text-red-400">
                                        {status.chaosData.filter_analysis.levels_filter.resistance_analysis.average_resistance?.toFixed(
                                          4,
                                        ) || "0.0000"}
                                      </span>
                                    </div>
                                    <div>
                                      Sig Resistance:{" "}
                                      <span className="text-red-400">
                                        {status.chaosData.filter_analysis.levels_filter.resistance_analysis.significant_resistance?.toFixed(
                                          4,
                                        ) || "0.0000"}
                                      </span>
                                    </div>
                                    <div>
                                      Buffer:{" "}
                                      <span className="text-gray-400">
                                        {status.chaosData.filter_analysis
                                          .levels_filter.resistance_analysis
                                          .buffer_percent || 0}
                                        %
                                      </span>
                                    </div>
                                    <div>
                                      Count:{" "}
                                      <span className="text-gray-400">
                                        {status.chaosData.filter_analysis
                                          .levels_filter.resistance_analysis
                                          .resistance_count || 0}
                                      </span>
                                    </div>
                                    <div>
                                      Using Sig:{" "}
                                      <span
                                        className={`${status.chaosData.filter_analysis.levels_filter.resistance_analysis.using_significant ? "text-green-400" : "text-gray-400"}`}
                                      >
                                        {status.chaosData.filter_analysis
                                          .levels_filter.resistance_analysis
                                          .using_significant
                                          ? "Yes"
                                          : "No"}
                                      </span>
                                    </div>
                                    <div>
                                      Analysis:{" "}
                                      <span className="text-gray-400">
                                        {
                                          status.chaosData.filter_analysis
                                            .levels_filter.resistance_analysis
                                            .analysis
                                        }
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Clickable dropdown for Vivienne configurations */}
            {status.name === "Vivienne" && status.chaosData?.config && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <button
                  onClick={() => toggleSection("vivienne-config")}
                  className="w-full text-left text-xs text-gray-400 mb-2 font-mono hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>CONFIGURATIONS</span>
                  <span className="text-gray-500">
                    {expandedSections["vivienne-config"] ? "▼" : "▶"}
                  </span>
                </button>
                {expandedSections["vivienne-config"] && (
                  <div className="text-[12px] font-mono absolute z-10 bg-gray-900 border border-gray-600 p-3 shadow-lg" style={{ top: '100%', left: 0, right: 0 }}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-gray-400">Configuration Settings</span>
                      <button
                        onClick={toggleConfigEditing}
                        className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        {editingConfig ? "Cancel" : "Edit"}
                      </button>
                    </div>
                    
                    <table className="w-full">
                      <tbody>
                        {/* State Thresholds Section */}
                        <tr>
                          <td colSpan={2} className="text-[11px] text-purple-400 font-mono py-1 border-b border-gray-700">
                            STATE THRESHOLDS
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Bang Threshold:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.bang_threshold ?? status.chaosData.config.general?.bang_threshold ?? status.chaosData.config.bang_threshold}
                                onChange={(e) => handleConfigChange('bang_threshold', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.general?.bang_threshold ?? status.chaosData.config.bang_threshold
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Aim Threshold:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.aim_threshold ?? status.chaosData.config.general?.aim_threshold ?? status.chaosData.config.aim_threshold}
                                onChange={(e) => handleConfigChange('aim_threshold', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.general?.aim_threshold ?? status.chaosData.config.aim_threshold
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Loaded Threshold:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.loaded_threshold ?? status.chaosData.config.general?.loaded_threshold ?? status.chaosData.config.loaded_threshold}
                                onChange={(e) => handleConfigChange('loaded_threshold', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.general?.loaded_threshold ?? status.chaosData.config.loaded_threshold
                            )}
                          </td>
                        </tr>

                        {/* Position Sizes Section */}
                        <tr>
                          <td colSpan={2} className="text-[11px] text-green-400 font-mono py-1 border-b border-gray-700">
                            POSITION SIZES
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Bang Size:</td>
                          <td className="text-green-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.position_size_bang ?? status.chaosData.config.general?.position_size_bang ?? status.chaosData.config.position_size_bang}
                                onChange={(e) => handleConfigChange('position_size_bang', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-green-400 border border-gray-600 px-1"
                              />
                            ) : (
                              `${status.chaosData.config.general?.position_size_bang ?? status.chaosData.config.position_size_bang}%`
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Aim Size:</td>
                          <td className="text-green-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.position_size_aim ?? status.chaosData.config.general?.position_size_aim ?? status.chaosData.config.position_size_aim}
                                onChange={(e) => handleConfigChange('position_size_aim', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-green-400 border border-gray-600 px-1"
                              />
                            ) : (
                              `${status.chaosData.config.general?.position_size_aim ?? status.chaosData.config.position_size_aim}%`
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Loaded Size:</td>
                          <td className="text-green-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.position_size_loaded ?? status.chaosData.config.general?.position_size_loaded ?? status.chaosData.config.position_size_loaded}
                                onChange={(e) => handleConfigChange('position_size_loaded', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-green-400 border border-gray-600 px-1"
                              />
                            ) : (
                              `${status.chaosData.config.general?.position_size_loaded ?? status.chaosData.config.position_size_loaded}%`
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Idle Size:</td>
                          <td className="text-gray-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.position_size_idle ?? status.chaosData.config.general?.position_size_idle ?? status.chaosData.config.position_size_idle}
                                onChange={(e) => handleConfigChange('position_size_idle', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-gray-400 border border-gray-600 px-1"
                              />
                            ) : (
                              `${status.chaosData.config.general?.position_size_idle ?? status.chaosData.config.position_size_idle}%`
                            )}
                          </td>
                        </tr>

                        {/* Volatility Filter Section */}
                        <tr>
                          <td colSpan={2} className="text-[11px] text-blue-400 font-mono py-1 border-b border-gray-700">
                            VOLATILITY FILTER
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Bollinger Filter:</td>
                          <td className={`text-right ${(status.chaosData.config.volatility_filter?.enable_bollinger_filter_for_entry ?? status.chaosData.config.enable_bollinger_filter_for_entry) ? 'text-green-400' : 'text-red-400'}`}>
                            {editingConfig ? (
                              <select
                                value={configValues.enable_bollinger_filter_for_entry ?? status.chaosData.config.volatility_filter?.enable_bollinger_filter_for_entry ?? status.chaosData.config.enable_bollinger_filter_for_entry}
                                onChange={(e) => handleConfigChange('enable_bollinger_filter_for_entry', e.target.value === 'true')}
                                className="w-20 text-right bg-gray-800 border border-gray-600 px-1"
                              >
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                              </select>
                            ) : (
                              (status.chaosData.config.volatility_filter?.enable_bollinger_filter_for_entry ?? status.chaosData.config.enable_bollinger_filter_for_entry) ? 'Enabled' : 'Disabled'
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Overextended Block:</td>
                          <td className={`text-right ${(status.chaosData.config.volatility_filter?.bollinger_overextended_block ?? status.chaosData.config.bollinger_overextended_block) ? 'text-red-400' : 'text-green-400'}`}>
                            {editingConfig ? (
                              <select
                                value={configValues.bollinger_overextended_block ?? status.chaosData.config.volatility_filter?.bollinger_overextended_block ?? status.chaosData.config.bollinger_overextended_block}
                                onChange={(e) => handleConfigChange('bollinger_overextended_block', e.target.value === 'true')}
                                className="w-20 text-right bg-gray-800 border border-gray-600 px-1"
                              >
                                <option value="true">Blocked</option>
                                <option value="false">Allowed</option>
                              </select>
                            ) : (
                              (status.chaosData.config.volatility_filter?.bollinger_overextended_block ?? status.chaosData.config.bollinger_overextended_block) ? 'Blocked' : 'Allowed'
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Squeeze Threshold:</td>
                          <td className="text-blue-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.volatility_squeeze_threshold ?? status.chaosData.config.volatility_filter?.volatility_squeeze_threshold ?? status.chaosData.config.volatility_squeeze_threshold}
                                onChange={(e) => handleConfigChange('volatility_squeeze_threshold', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-blue-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.volatility_filter?.volatility_squeeze_threshold ?? status.chaosData.config.volatility_squeeze_threshold
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Breakout Threshold:</td>
                          <td className="text-blue-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.volatility_breakout_threshold ?? status.chaosData.config.volatility_filter?.volatility_breakout_threshold ?? status.chaosData.config.volatility_breakout_threshold}
                                onChange={(e) => handleConfigChange('volatility_breakout_threshold', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-blue-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.volatility_filter?.volatility_breakout_threshold ?? status.chaosData.config.volatility_breakout_threshold
                            )}
                          </td>
                        </tr>

                        {/* Trend Filter Section */}
                        <tr>
                          <td colSpan={2} className="text-[11px] text-cyan-400 font-mono py-1 border-b border-gray-700">
                            TREND FILTER
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Trend Filter Entry:</td>
                          <td className={`text-right ${(status.chaosData.config.trend_filter?.enable_trend_filter_for_entry ?? status.chaosData.config.enable_trend_filter_for_entry) ? 'text-green-400' : 'text-red-400'}`}>
                            {editingConfig ? (
                              <select
                                value={configValues.enable_trend_filter_for_entry ?? status.chaosData.config.trend_filter?.enable_trend_filter_for_entry ?? status.chaosData.config.enable_trend_filter_for_entry}
                                onChange={(e) => handleConfigChange('enable_trend_filter_for_entry', e.target.value === 'true')}
                                className="w-20 text-right bg-gray-800 border border-gray-600 px-1"
                              >
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                              </select>
                            ) : (
                              (status.chaosData.config.trend_filter?.enable_trend_filter_for_entry ?? status.chaosData.config.enable_trend_filter_for_entry) ? 'Enabled' : 'Disabled'
                            )}
                          </td>
                        </tr>

                        {/* Levels Filter Section */}
                        <tr>
                          <td colSpan={2} className="text-[11px] text-orange-400 font-mono py-1 border-b border-gray-700">
                            LEVELS FILTER
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Levels Filter Entry:</td>
                          <td className="text-orange-400 text-right">
                            {editingConfig ? (
                              <select
                                value={configValues.enable_levels_filter_for_entry ?? status.chaosData.config.levels_filter?.enable_levels_filter_for_entry ?? status.chaosData.config.enable_levels_filter_for_entry}
                                onChange={(e) => handleConfigChange('enable_levels_filter_for_entry', e.target.value === 'true')}
                                className="w-20 text-right bg-gray-800 border border-gray-600 px-1"
                              >
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                              </select>
                            ) : (
                              (status.chaosData.config.levels_filter?.enable_levels_filter_for_entry ?? status.chaosData.config.enable_levels_filter_for_entry) ? 'Enabled' : 'Disabled'
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Levels Buffer %:</td>
                          <td className="text-orange-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.levels_buffer_percent ?? status.chaosData.config.levels_filter?.levels_buffer_percent ?? status.chaosData.config.levels_buffer_percent}
                                onChange={(e) => handleConfigChange('levels_buffer_percent', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-orange-400 border border-gray-600 px-1"
                              />
                            ) : (
                              `${status.chaosData.config.levels_filter?.levels_buffer_percent ?? status.chaosData.config.levels_buffer_percent}%`
                            )}
                          </td>
                        </tr>

                        {/* Underused Alpha Filter Section */}
                        <tr>
                          <td colSpan={2} className="text-[11px] text-pink-400 font-mono py-1 border-b border-gray-700">
                            UNDERUSED ALPHA FILTER
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Retail Chop Trade Count:</td>
                          <td className="text-pink-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.retail_chop_trade_count_threshold ?? status.chaosData.config.retail_chop_trade_count_threshold}
                                onChange={(e) => handleConfigChange('retail_chop_trade_count_threshold', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-pink-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.retail_chop_trade_count_threshold
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Retail Chop Avg Trade Size:</td>
                          <td className="text-pink-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.retail_chop_avg_trade_size_threshold ?? status.chaosData.config.retail_chop_avg_trade_size_threshold}
                                onChange={(e) => handleConfigChange('retail_chop_avg_trade_size_threshold', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-pink-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.retail_chop_avg_trade_size_threshold
                            )}
                          </td>
                        </tr>

                        {/* Combined VWAP Filter Section */}
                        <tr>
                          <td colSpan={2} className="text-[11px] text-indigo-400 font-mono py-1 border-b border-gray-700">
                            COMBINED VWAP FILTER
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Weak Pump Trade Count:</td>
                          <td className="text-indigo-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.weak_pump_trade_count_threshold ?? status.chaosData.config.weak_pump_trade_count_threshold}
                                onChange={(e) => handleConfigChange('weak_pump_trade_count_threshold', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-indigo-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.weak_pump_trade_count_threshold
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Weak Pump Avg Trade Size:</td>
                          <td className="text-indigo-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.weak_pump_avg_trade_size_threshold ?? status.chaosData.config.weak_pump_avg_trade_size_threshold}
                                onChange={(e) => handleConfigChange('weak_pump_avg_trade_size_threshold', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-indigo-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.weak_pump_avg_trade_size_threshold
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Distribution Trade Count:</td>
                          <td className="text-indigo-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.distribution_trade_count_threshold ?? status.chaosData.config.distribution_trade_count_threshold}
                                onChange={(e) => handleConfigChange('distribution_trade_count_threshold', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-indigo-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.distribution_trade_count_threshold
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Distribution Avg Trade Size:</td>
                          <td className="text-indigo-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.distribution_avg_trade_size_threshold ?? status.chaosData.config.distribution_avg_trade_size_threshold}
                                onChange={(e) => handleConfigChange('distribution_avg_trade_size_threshold', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-indigo-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.distribution_avg_trade_size_threshold
                            )}
                          </td>
                        </tr>

                        {/* Signal Weights Section */}
                        <tr>
                          <td colSpan={2} className="text-[11px] text-yellow-400 font-mono py-1 border-b border-gray-700">
                            SIGNAL WEIGHTS
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">EMA Cross:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.ema_cross ?? status.chaosData.config.signal_weights?.ema_cross ?? status.chaosData.config.ema_cross}
                                onChange={(e) => handleConfigChange('ema_cross', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.signal_weights?.ema_cross ?? status.chaosData.config.ema_cross
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">EMA Level:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.ema_level ?? status.chaosData.config.signal_weights?.ema_level ?? status.chaosData.config.ema_level}
                                onChange={(e) => handleConfigChange('ema_level', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.signal_weights?.ema_level ?? status.chaosData.config.ema_level
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">VWAP Anchor:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.vwap_anchor ?? status.chaosData.config.vwap_anchor}
                                onChange={(e) => handleConfigChange('vwap_anchor', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.vwap_anchor
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Combined VWAP:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.combined_vwap ?? status.chaosData.config.combined_vwap}
                                onChange={(e) => handleConfigChange('combined_vwap', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.combined_vwap
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">BB Bounce:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.bb_bounce ?? status.chaosData.config.bb_bounce}
                                onChange={(e) => handleConfigChange('bb_bounce', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.bb_bounce
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">BB Breakout:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.bb_breakout ?? status.chaosData.config.bb_breakout}
                                onChange={(e) => handleConfigChange('bb_breakout', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.bb_breakout
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">BB Level:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.bb_level ?? status.chaosData.config.bb_level}
                                onChange={(e) => handleConfigChange('bb_level', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.bb_level
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">BB Breakout Level:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.bb_breakout_level ?? status.chaosData.config.bb_breakout_level}
                                onChange={(e) => handleConfigChange('bb_breakout_level', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.bb_breakout_level
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Volume Confirmation:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.volume_confirmation ?? status.chaosData.config.volume_confirmation}
                                onChange={(e) => handleConfigChange('volume_confirmation', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.volume_confirmation
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">MACD:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.macd ?? status.chaosData.config.macd}
                                onChange={(e) => handleConfigChange('macd', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.macd
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">MACD Level:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.macd_level ?? status.chaosData.config.macd_level}
                                onChange={(e) => handleConfigChange('macd_level', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.macd_level
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">RSI Cross:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.rsi_cross ?? status.chaosData.config.rsi_cross}
                                onChange={(e) => handleConfigChange('rsi_cross', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.rsi_cross
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">RSI Level:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.rsi_level ?? status.chaosData.config.rsi_level}
                                onChange={(e) => handleConfigChange('rsi_level', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.rsi_level
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">Underused Alpha:</td>
                          <td className="text-yellow-400 text-right">
                            {editingConfig ? (
                              <input
                                type="number"
                                value={configValues.underused_alpha ?? status.chaosData.config.underused_alpha}
                                onChange={(e) => handleConfigChange('underused_alpha', parseFloat(e.target.value))}
                                className="w-16 text-right bg-gray-800 text-yellow-400 border border-gray-600 px-1"
                              />
                            ) : (
                              status.chaosData.config.underused_alpha
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {editingConfig && (
                      <div className="mt-3 pt-3 border-t border-gray-600 flex justify-end space-x-2">
                        <button
                          onClick={saveConfigChanges}
                          className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={toggleConfigEditing}
                          className="text-xs px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Clickable dropdown for Octavia technical data */}
            {status.name === "Octavia" && status.technicalData && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <button
                  onClick={() => toggleSection("octavia-technical")}
                  className="w-full text-left text-xs text-gray-400 mb-2 font-mono hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>TECHNICAL ANALYSIS</span>
                  <span className="text-gray-500">
                    {expandedSections["octavia-technical"] ? "▼" : "▶"}
                  </span>
                </button>
                {expandedSections["octavia-technical"] && (
                  <div className="text-[12px] font-mono absolute z-10 bg-gray-900 border border-gray-600 p-3 shadow-lg" style={{ top: '100%', left: 0, right: 0 }}>
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="text-gray-400 pr-2">EMA3:</td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.ema3}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">EMA5:</td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.ema5}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">EMA21:</td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.ema21}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">EMA30:</td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.ema30}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">RSI:</td>
                          <td
                            className={`text-right ${
                              parseFloat(status.technicalData.rsi) > 70
                                ? "text-yellow-400"
                                : parseFloat(status.technicalData.rsi) < 30
                                  ? "text-yellow-400"
                                  : "text-yellow-400"
                            }`}
                          >
                            {status.technicalData.rsi}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">MACD Line:</td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.macdLine}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">
                            MACD Signal:
                          </td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.macdSignal}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">
                            MACD Histogram:
                          </td>
                          <td
                            className={`text-right ${
                              parseFloat(
                                status.technicalData.macdHistogram,
                              ) > 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {status.technicalData.macdHistogram}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">
                            MACD Trend:
                          </td>
                          <td
                            className={`text-right ${
                              status.technicalData.macdTrend ===
                              "increasing"
                                ? "text-green-400"
                                : status.technicalData.macdTrend ===
                                    "decreasing"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                            }`}
                          >
                            {status.technicalData.macdTrend}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">BB Upper:</td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.bbUpper}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">BB Middle:</td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.bbMiddle}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">BB Lower:</td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.bbLower}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">
                            BB Bandwidth:
                          </td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.bbBandwidth}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">
                            BB Squeeze:
                          </td>
                          <td
                            className={`text-right ${
                              status.technicalData.bbSqueeze === "Yes"
                                ? "text-yellow-400"
                                : "text-gray-400"
                            }`}
                          >
                            {status.technicalData.bbSqueeze}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">
                            BB Position:
                          </td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.bbPosition}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">ATR:</td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.atr}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">
                            Sig Support:
                          </td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.sigSupport}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pr-2">
                            Sig Resistance:
                          </td>
                          <td className="text-yellow-400 text-right">
                            {status.technicalData.sigResistance}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Clickable dropdown for Agatha individual signals */}
            {status.name === "Agatha" && status.signalData && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <button
                  onClick={() => toggleSection("agatha-signals")}
                  className="w-full text-left text-xs text-gray-400 mb-2 font-mono hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>INDIVIDUAL SIGNALS</span>
                  <span className="text-gray-500">
                    {expandedSections["agatha-signals"] ? "▼" : "▶"}
                  </span>
                </button>
                {expandedSections["agatha-signals"] && (
                  <div className="absolute z-10 bg-gray-900 border border-gray-600 p-3 shadow-lg" style={{ top: '100%', left: 0, right: 0 }}>
                    {Object.entries(status.signalData.signals).map(
                      ([signalName, signalData]: [string, any]) => (
                        <div
                          key={signalName}
                          className="mb-2 p-1 border border-gray-700"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] text-gray-400 font-mono uppercase">
                              {signalName.replace(/_/g, " ")}
                            </span>
                            <span
                              className={`text-[11px] font-mono ${
                                signalData.confidence > 0
                                  ? "text-green-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {signalData.confidence > 0
                                ? `${Math.round(signalData.confidence)}%`
                                : "0%"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-1 text-[10px]">
                            <div>
                              <span className="text-gray-500">Signal:</span>
                              <span
                                className={`ml-1 ${
                                  signalData.signal
                                    ?.toUpperCase()
                                    .includes("BUY") ||
                                  signalData.signal
                                    ?.toUpperCase()
                                    .includes("BULLISH")
                                    ? "text-green-400"
                                    : signalData.signal
                                          ?.toUpperCase()
                                          .includes("SELL") ||
                                        signalData.signal
                                          ?.toUpperCase()
                                          .includes("BEARISH")
                                      ? "text-red-400"
                                      : "text-yellow-400"
                                }`}
                              >
                                {signalData.signal?.toUpperCase() || "NONE"}
                              </span>
                            </div>
                          </div>

                          {signalData.details && (
                            <div className="mt-1 text-[10px] text-gray-400 font-mono">
                              {signalData.details}
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentStatusPanel;