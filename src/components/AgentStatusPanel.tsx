import React from "react";
import type { AssetData } from "../websocketTypes";

interface AgentStatusPanelProps {
  assetData: AssetData | null;
  selectedAsset: string | null;
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
}

export const AgentStatusPanel: React.FC<AgentStatusPanelProps> = ({
  assetData,
  selectedAsset,
}) => {
  // State for managing dropdown visibility
  const [expandedSections, setExpandedSections] = React.useState<{
    [key: string]: boolean;
  }>({});

  // Toggle dropdown visibility
  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };
  const getAgentStatuses = (): AgentStatus[] => {
    if (!assetData?.agents) return [];

    const statuses: AgentStatus[] = [];

    // Octavia Agent - Technical Analysis (FIRST - will appear on the left)
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

    // Agatha Agent - Signal Processing (SECOND - will appear in the middle)
    const agathaData = assetData.agents.AgathaAgent?.data;
    if (agathaData?.processed_signals) {
      const signals = agathaData.processed_signals;
      const indicators = signals.indicators;

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

    // Vivienne Agent - Focus on chaos_discerned data (THIRD - will appear on the right)
    const vivienneData = assetData.agents.VivienneAgent?.data;
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
        },
      });
    }

    // Aurora Agent
    const auroraData = assetData.agents.AuroraAgent?.data;
    if (auroraData?.signals) {
      const buySignals = auroraData.signals.buy?.length || 0;
      const sellSignals = auroraData.signals.sell?.length || 0;
      statuses.push({
        name: "Aurora",
        state: "ANALYZING",
        confidence: 30,
        details: `${buySignals} buy, ${sellSignals} sell signals`,
        isActive: true,
        priority: "medium",
      });
    } else {
      statuses.push({
        name: "Aurora",
        state: "STANDBY",
        confidence: 0,
        details: "No signals available",
        isActive: false,
        priority: "low",
      });
    }

    return statuses;
  };

  return (
    <div className="mb-6">
      <div className="text-lg font-bold text-yellow-400 mb-4 font-mono">
        AGENT STATUS
      </div>
      <div className="grid grid-cols-3 gap-4 w-full">
        {getAgentStatuses().map((status, index) => (
          <div
            key={index}
            className={`terminal-block p-4 min-w-0 flex-shrink-0 w-full ${
              status.isActive
                ? "border-green-500 bg-green-900 bg-opacity-20"
                : "border-gray-600"
            }`}
          >
            {/* Agent Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🎯</span>
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
            )}

            {/* Breakline separator between header and chaos analysis */}
            {status.name === "Vivienne" && status.chaosData && (
              <div className="mt-3 pt-3 border-t border-gray-600"></div>
            )}

            {/* Clickable dropdown for Vivienne chaos data */}
            {status.name === "Vivienne" && status.chaosData && (
              <div className="mt-3">
                <button
                  onClick={() => toggleSection("vivienne-chaos")}
                  className="w-full text-left text-xs text-gray-400 mb-2 font-mono hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>CHAOS ANALYSIS</span>
                  <span className="text-gray-500">
                    {expandedSections["vivienne-chaos"] ? "▼" : "▶"}
                  </span>
                </button>

                {/* Compact 2-column table format for chaos data */}
                {expandedSections["vivienne-chaos"] && (
                  <div className="text-[10px] font-mono">
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

                        {/* Current Filter Analysis */}
                        {status.chaosData.filter_analysis?.trend_filter && (
                          <div className="mb-2 p-1 border border-purple-700 rounded bg-purple-900/20">
                            <div className="text-[9px] text-purple-400 font-mono mb-1">
                              TREND FILTER ANALYSIS
                            </div>
                            <div className="text-[8px] text-gray-300">
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
                          <div className="mb-2 p-1 border border-cyan-700 rounded bg-cyan-900/20">
                            <div className="text-[9px] text-cyan-400 font-mono mb-1">
                              VOLATILITY FILTER ANALYSIS
                            </div>
                            <div className="text-[8px] text-gray-300">
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
                          <div className="mb-2 p-1 border border-blue-700 rounded bg-blue-900/20">
                            <div className="text-[9px] text-blue-400 font-mono mb-1">
                              LEVELS FILTER
                            </div>
                            <div className="text-[8px] text-gray-300">
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
                                  <div className="text-[8px] text-gray-500 mb-1">
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
                                  <div className="text-[8px] text-gray-500 mb-1">
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

                    {/* Compact 2-column table format for technical data */}
                    {expandedSections["octavia-technical"] && (
                      <div className="text-[10px] font-mono">
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
                      className="w-full text-left text-[9px] text-gray-500 mb-1 font-mono hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>INDIVIDUAL SIGNALS</span>
                      <span className="text-gray-500">
                        {expandedSections["agatha-signals"] ? "▼" : "▶"}
                      </span>
                    </button>
                    {expandedSections["agatha-signals"] && (
                      <>
                        {Object.entries(status.signalData.signals).map(
                          ([signalName, signalData]: [string, any]) => (
                            <div
                              key={signalName}
                              className="mb-2 p-1 border border-gray-700 rounded"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] text-gray-400 font-mono uppercase">
                                  {signalName.replace(/_/g, " ")}
                                </span>
                                <span
                                  className={`text-[9px] font-mono ${
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

                              <div className="grid grid-cols-1 gap-1 text-[8px]">
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
                                <div className="mt-1 text-[8px] text-gray-400 font-mono">
                                  {signalData.details}
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </>
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
