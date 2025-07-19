import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  ReferenceLine,
  Scatter,
} from 'recharts';


interface AuroraAgentProps {
  assetSymbol?: string; // e.g., 'BTC', default to 'BTC'
  fullMessage: any; // The full websocket message
}

const AuroraChart: React.FC<{
  chartData: any[];
  macdData: any[];
  rsiData: any[];
  atrData: any[];
  supportLevel: number | null;
  resistanceLevel: number | null;
  historicalSupportLevels: number[];
  historicalResistanceLevels: number[];
  allSignalTypes: string[];
  signalCounts: { [key: string]: number };
  signalCategories: { buy: string[]; sell: string[]; neutral: string[] };
}> = React.memo(({ chartData, macdData, rsiData, atrData, supportLevel, resistanceLevel, historicalSupportLevels, historicalResistanceLevels, allSignalTypes, signalCounts, signalCategories }) => {
  // State to track which lines are visible (dimmed or bright)
  const [visibleLines, setVisibleLines] = useState({
    close: true,
    ema3: true,
    ema5: true,
    ema21: true,
    ema30: true,
    bb_upper: true,
    bb_middle: true,
    bb_lower: true,
  });

  // State to track which signal types are visible
  const [visibleSignals, setVisibleSignals] = useState({
    buy: true,
    sell: true,
    neutral: true,
  });

  // Custom legend that looks like default Recharts but with click handlers
  const CustomLegend = ({ payload }: any) => {
    const handleLegendClick = (dataKey: string) => {
      setVisibleLines(prev => ({
        ...prev,
        [dataKey as keyof typeof prev]: !prev[dataKey as keyof typeof prev]
      }));
    };

    return (
      <div className="flex flex-wrap gap-4 p-2">
        {/* Chart line legend items */}
        {payload?.map((entry: any, index: number) => {
          const dataKey = entry.dataKey;
          const isVisible = visibleLines[dataKey as keyof typeof visibleLines];
          
          return (
            <div
              key={index}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleLegendClick(dataKey)}
              style={{ opacity: isVisible ? 1 : 0.3 }}
            >
              {/* Render the legend symbol based on the entry type */}
              {entry.type === 'line' ? (
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <line x1="2" y1="8" x2="14" y2="8" stroke={entry.color} strokeWidth="2" />
                  <circle cx="8" cy="8" r="2" fill={entry.color} />
                </svg>
              ) : entry.type === 'scatter' ? (
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="4" fill={entry.color} />
                </svg>
              ) : (
                <div
                  className="w-4 h-4"
                  style={{ backgroundColor: entry.color }}
                />
              )}
              <span className="text-xs text-gray-300">{entry.value}</span>
            </div>
          );
        })}

        {/* Signal legend items */}
        <div className="flex items-center gap-4 ml-4 border-l border-gray-600 pl-4">
          {/* Buy Signal Types */}
          {signalCategories.buy.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-semibold">Buy Signals:</span>
              {signalCategories.buy.map((signalType, index) => {
                const isVisible = visibleSignals.buy;
                const count = signalCounts[signalType] || 0;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setVisibleSignals(prev => ({ ...prev, buy: !prev.buy }))}
                    style={{ opacity: isVisible ? 1 : 0.3 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <circle cx="6" cy="6" r="5" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
                    </svg>
                    <span className="text-xs text-gray-300">{signalType} ({count})</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sell Signal Types */}
          {signalCategories.sell.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-semibold">Sell Signals:</span>
              {signalCategories.sell.map((signalType, index) => {
                const isVisible = visibleSignals.sell;
                const count = signalCounts[signalType] || 0;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setVisibleSignals(prev => ({ ...prev, sell: !prev.sell }))}
                    style={{ opacity: isVisible ? 1 : 0.3 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <circle cx="6" cy="6" r="5" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />
                    </svg>
                    <span className="text-xs text-gray-300">{signalType} ({count})</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Neutral Signal Types */}
          {signalCategories.neutral.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-semibold">Neutral Signals:</span>
              {signalCategories.neutral.map((signalType, index) => {
                const isVisible = visibleSignals.neutral;
                const count = signalCounts[signalType] || 0;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setVisibleSignals(prev => ({ ...prev, neutral: !prev.neutral }))}
                    style={{ opacity: isVisible ? 1 : 0.3 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <circle cx="6" cy="6" r="5" fill="#60a5fa" stroke="#3b82f6" strokeWidth="1" />
                    </svg>
                    <span className="text-xs text-gray-300">{signalType} ({count})</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Signal Count */}
          <div className="text-xs text-gray-400 ml-2">
            ({chartData.filter(d => d.signal).length})
          </div>
        </div>
      </div>
    );
  };

  const SignalDot: React.FC<any> = ({ cx, cy, payload }) => {
    const { signal } = payload;
    if (!signal) return null;

    console.log("AuroraAgent - SignalDot called with signal:", signal);

    const { type, strength, signal_type, direction } = signal; // Destructure new fields

    let fill = '#a1a1aa'; // Default color (zinc-500)
    let stroke = '#e4e4e7'; // zinc-200
    let signalCategory = 'neutral'; // Default category

    // Use the same improved categorization logic as the legend
    if (signal_type === 'BULLISH' || direction === 'LONG' || signal_type === 'BUY') {
      signalCategory = 'buy';
    } else if (signal_type === 'BEARISH' || direction === 'SHORT' || signal_type === 'SELL') {
      signalCategory = 'sell';
    } else {
      signalCategory = 'neutral';
    }

    console.log(`AuroraAgent - SignalDot categorization: type="${type}", signal_type="${signal_type}", direction="${direction}" -> category="${signalCategory}"`);

    // Check if this signal type should be visible
    if (!visibleSignals[signalCategory as keyof typeof visibleSignals]) {
      return null;
    }

    if (signalCategory === 'buy') {
      fill = strength === 'strong' ? '#22c55e' : '#86efac'; // green-500, green-300
      stroke = '#16a34a'; // green-600
    } else if (signalCategory === 'sell') {
      fill = strength === 'strong' ? '#ef4444' : '#fca5a5'; // red-500, red-300
      stroke = '#dc2626'; // red-600
    } else { // neutral
      fill = '#60a5fa'; // blue-400
      stroke = '#3b82f6'; // blue-500
    }

    // Make dots smaller - reduce radius from 10/7 to 4/3
    const radius = strength === 'strong' ? 4 : 3;

    return (
      <g>
        <circle cx={cx} cy={cy} r={radius} fill={fill} stroke={stroke} strokeWidth={1} />
      </g>
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Main Price Chart with EMAs and Bollinger Bands */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="time" tickFormatter={(unixTime) => new Date(unixTime * 1000).toUTCString().slice(17, 25)} />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip labelFormatter={(label) => new Date(label * 1000).toUTCString()} />
          <Legend content={<CustomLegend />} />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="#22d3ee" 
            strokeWidth={2} 
            dot={false} 
            strokeOpacity={visibleLines.close ? 1 : 0.1}
          />
          <Line 
            type="monotone" 
            dataKey="ema3" 
            stroke="#facc15" 
            strokeWidth={1} 
            dot={false} 
            strokeOpacity={visibleLines.ema3 ? 1 : 0.1}
          />
          <Line 
            type="monotone" 
            dataKey="ema5" 
            stroke="#a78bfa" 
            strokeWidth={1} 
            dot={false} 
            strokeOpacity={visibleLines.ema5 ? 1 : 0.1}
          />
          <Line 
            type="monotone" 
            dataKey="ema21" 
            stroke="#fb923c" 
            strokeWidth={1} 
            dot={false} 
            strokeOpacity={visibleLines.ema21 ? 1 : 0.1}
          />
          <Line 
            type="monotone" 
            dataKey="ema30" 
            stroke="#34d399" 
            strokeWidth={1} 
            dot={false} 
            strokeOpacity={visibleLines.ema30 ? 1 : 0.1}
          />
          <Line 
            type="monotone" 
            dataKey="bb_upper" 
            stroke="#e879f9" 
            strokeWidth={1} 
            dot={false} 
            strokeDasharray="3 3" 
            strokeOpacity={visibleLines.bb_upper ? 1 : 0.1}
          />
          <Line 
            type="monotone" 
            dataKey="bb_middle" 
            stroke="#818cf8" 
            strokeWidth={1} 
            dot={false} 
            strokeDasharray="3 3" 
            strokeOpacity={visibleLines.bb_middle ? 1 : 0.1}
          />
          <Line 
            type="monotone" 
            dataKey="bb_lower" 
            stroke="#f472b6" 
            strokeWidth={1} 
            dot={false} 
            strokeDasharray="3 3" 
            strokeOpacity={visibleLines.bb_lower ? 1 : 0.1}
          />
          
          {/* Debug: Log signal data for Scatter component */}
          {(() => {
            const signalsForScatter = chartData.filter(d => d.signal);
            console.log("AuroraAgent - Signals for Scatter component:", signalsForScatter.length);
            if (signalsForScatter.length > 0) {
              console.log("AuroraAgent - First 3 signals for Scatter:", signalsForScatter.slice(0, 3));
            }
            return null;
          })()}
          
          <Scatter
            name="Signals"
            data={chartData.filter(d => d.signal)}
            dataKey="close"
            shape={<SignalDot />}
            isAnimationActive={false}
          />
          {/* Current significant levels */}
          {supportLevel && (
            <ReferenceLine
              y={supportLevel}
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="2 2"
              label={{ value: `Current Support: ${supportLevel.toFixed(4)}`, position: "insideTopRight" }}
            />
          )}
          {resistanceLevel && (
            <ReferenceLine
              y={resistanceLevel}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="2 2"
              label={{ value: `Current Resistance: ${resistanceLevel.toFixed(4)}`, position: "insideBottomRight" }}
            />
          )}
          
          {/* Historical support levels - COMMENTED OUT FOR PERFORMANCE */}
          {/* {console.log("AuroraAgent - Rendering historical support levels:", historicalSupportLevels)}
          {historicalSupportLevels
            .filter(level => typeof level === 'number' && !isNaN(level))
            .map((level, index) => {
              console.log(`AuroraAgent - Rendering support level ${index}:`, level);
              return (
                <ReferenceLine
                  key={`support-${index}`}
                  y={level}
                  stroke="#22c55e"
                  strokeWidth={1}
                  strokeDasharray="1 1"
                  strokeOpacity={0.6}
                  label={{ value: `Support: ${level.toFixed(4)}`, position: "insideTopRight", fontSize: 10 }}
                />
              );
            })} */}
          
          {/* Historical resistance levels - COMMENTED OUT FOR PERFORMANCE */}
          {/* {console.log("AuroraAgent - Rendering historical resistance levels:", historicalResistanceLevels)}
          {historicalResistanceLevels
            .filter(level => typeof level === 'number' && !isNaN(level))
            .map((level, index) => {
              console.log(`AuroraAgent - Rendering resistance level ${index}:`, level);
              return (
                <ReferenceLine
                  key={`resistance-${index}`}
                  y={level}
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="1 1"
                  strokeOpacity={0.6}
                  label={{ value: `Resistance: ${level.toFixed(4)}`, position: "insideBottomRight", fontSize: 10 }}
                />
              );
            })} */}
        </LineChart>
      </ResponsiveContainer>

      {/* MACD Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={macdData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="time" tickFormatter={(unixTime) => new Date(unixTime * 1000).toUTCString().slice(17, 25)} />
          <YAxis />
          <Tooltip labelFormatter={(label) => new Date(label * 1000).toUTCString()} />
          <Legend />
          <Bar dataKey="macd_histogram" fill="#a78bfa" />
          <Line type="monotone" dataKey="macd_line" stroke="#22d3ee" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="macd_signal" stroke="#facc15" strokeWidth={1} dot={false} />
        </BarChart>
      </ResponsiveContainer>

      {/* RSI Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={rsiData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="time" tickFormatter={(unixTime) => new Date(unixTime * 1000).toUTCString().slice(17, 25)} />
          <YAxis domain={[0, 100]} /> {/* RSI typically ranges from 0 to 100 */}
          <Tooltip labelFormatter={(label) => new Date(label * 1000).toUTCString()} />
          <Legend />
          <Line type="monotone" dataKey="rsi" stroke="#34d399" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      {/* ATR Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={atrData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="time" tickFormatter={(unixTime) => new Date(unixTime * 1000).toUTCString().slice(17, 25)} />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip labelFormatter={(label) => new Date(label * 1000).toUTCString()} />
          <Legend />
          <Line type="monotone" dataKey="atr" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export const AuroraAgent: React.FC<AuroraAgentProps> = ({ assetSymbol = 'BTC', fullMessage }) => {
  const [showData, setShowData] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render every 30 seconds
  const lastDataVersionRef = useRef<string | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const lastFullRefreshTimeRef = useRef<number>(0);
  const cachedDataRef = useRef<{
    chartData: any[];
    macdData: any[];
    rsiData: any[];
    atrData: any[];
    supportLevel: number | null;
    resistanceLevel: number | null;
  } | null>(null);

  // Force chart update every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("AuroraAgent - Timer: Forcing chart update");
      setForceUpdate(prev => prev + 1);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const { chartData, macdData, rsiData, atrData, supportLevel, resistanceLevel, historicalSupportLevels, historicalResistanceLevels } = useMemo(() => {
    const processedChartData: any[] = [];
    const processedMacdData: any[] = [];
    const processedRsiData: any[] = [];
    const processedAtrData: any[] = [];
    let latestSupportLevel: number | null = null;
    let latestResistanceLevel: number | null = null;
    let historicalSupportLevels: number[] = [];
    let historicalResistanceLevels: number[] = [];

    try {
      const auroraAgentData = fullMessage?.data?.[assetSymbol]?.agents?.AuroraAgent?.data;
      const currentTime = Date.now();
      const currentDataVersion = auroraAgentData?.metadata?.data_version || auroraAgentData?.metadata?.last_updated;
      
      // Helper function to perform incremental update (only latest data)
      const performIncrementalUpdate = (auroraAgentData: any, cachedData: any) => {
        if (!auroraAgentData || !Array.isArray(auroraAgentData.candles) || auroraAgentData.candles.length === 0) {
          return cachedData;
        }

        // Get the latest candle timestamp from cached data
        const lastCachedTime = cachedData.chartData.length > 0 ? 
          cachedData.chartData[cachedData.chartData.length - 1].time : 0;
        
        // Find new candles (after the last cached time)
        const newCandles = auroraAgentData.candles.filter((candle: any) => candle.time > lastCachedTime);
        
        if (newCandles.length === 0) {
          console.log("AuroraAgent - No new candles found for incremental update");
          return cachedData;
        }

        console.log(`AuroraAgent - Found ${newCandles.length} new candles for incremental update`);

        // Process only the new candles
        const newChartData: any[] = [];
        const newMacdData: any[] = [];
        const newRsiData: any[] = [];
        const newAtrData: any[] = [];

        // Create indicator map for new data only
        const indicatorsByTime: { [key: number]: any } = {};
        
        if (auroraAgentData.indicators) {
          const indicators = auroraAgentData.indicators;
          
          // Helper function to populate indicator map for new timestamps only
          const populateIndicatorMap = (indicatorArray: any[], key: string) => {
            if (Array.isArray(indicatorArray)) {
              indicatorArray.forEach((item) => {
                if (item && typeof item.time === 'number' && item.time > lastCachedTime) {
                  if (!indicatorsByTime[item.time]) {
                    indicatorsByTime[item.time] = {};
                  }
                  indicatorsByTime[item.time][key] = item.value;
                }
              });
            }
          };

          // Populate indicator map for all indicators (new timestamps only)
          populateIndicatorMap(indicators.ema3, 'ema3');
          populateIndicatorMap(indicators.ema5, 'ema5');
          populateIndicatorMap(indicators.ema21, 'ema21');
          populateIndicatorMap(indicators.ema30, 'ema30');
          populateIndicatorMap(indicators.bb_upper, 'bb_upper');
          populateIndicatorMap(indicators.bb_middle, 'bb_middle');
          populateIndicatorMap(indicators.bb_lower, 'bb_lower');
          populateIndicatorMap(indicators.macd, 'macd_line');
          populateIndicatorMap(indicators.macd_signal, 'macd_signal');
          populateIndicatorMap(indicators.macd_histogram, 'macd_histogram');
          populateIndicatorMap(indicators.rsi, 'rsi');
          populateIndicatorMap(indicators.atr, 'atr');

          // Process signals for new timestamps only
          if (auroraAgentData.signals) {
            const populateSignalMap = (signalArray: any[]) => {
              if (Array.isArray(signalArray)) {
                signalArray.forEach((item) => {
                  if (item && typeof item.time === 'number' && item.time > lastCachedTime) {
                    if (!indicatorsByTime[item.time]) {
                      indicatorsByTime[item.time] = {};
                    }
                    indicatorsByTime[item.time].signal = { 
                      type: item.type, 
                      strength: item.strength || 'medium',
                      signal_type: item.signal_type, 
                      confidence: item.confidence, 
                      price: item.price, 
                      direction: item.direction 
                    };
                  }
                });
              }
            };

            for (const signalKey in auroraAgentData.signals) {
              if (Object.prototype.hasOwnProperty.call(auroraAgentData.signals, signalKey)) {
                const signalArray = auroraAgentData.signals[signalKey];
                populateSignalMap(signalArray);
              }
            }
          }
        }

        // Process new candles
        newCandles.forEach((candle: any) => {
          const time = candle.time;
          const indicators = indicatorsByTime[time] || {};

          const chartDataItem: any = {
            time: time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
            ema3: indicators.ema3,
            ema5: indicators.ema5,
            ema21: indicators.ema21,
            ema30: indicators.ema30,
            bb_upper: indicators.bb_upper,
            bb_middle: indicators.bb_middle,
            bb_lower: indicators.bb_lower,
            signal: indicators.signal,
          };

          const macdDataItem: any = {
            time: time,
            macd_line: indicators.macd_line,
            macd_signal: indicators.macd_signal,
            macd_histogram: indicators.macd_histogram,
          };

          const rsiDataItem: any = {
            time: time,
            rsi: indicators.rsi,
          };

          const atrDataItem: any = {
            time: time,
            atr: indicators.atr,
          };

          newChartData.push(chartDataItem);
          newMacdData.push(macdDataItem);
          newRsiData.push(rsiDataItem);
          newAtrData.push(atrDataItem);
        });

        // Extract latest support and resistance levels for reference lines
        let latestSupportLevel: number | null = cachedData.supportLevel;
        let latestResistanceLevel: number | null = cachedData.resistanceLevel;
        
        // New structure: filter_status.levels_filter.support_analysis.significant_support
        if (auroraAgentData.filter_status?.levels_filter?.support_analysis?.significant_support) {
          latestSupportLevel = auroraAgentData.filter_status.levels_filter.support_analysis.significant_support;
          console.log("AuroraAgent - Incremental update: Found significant support level:", latestSupportLevel);
        }
        // Fallback to old structure
        else if (auroraAgentData.support_levels?.significant_support) {
          latestSupportLevel = auroraAgentData.support_levels.significant_support;
          console.log("AuroraAgent - Incremental update: Found significant support level (fallback):", latestSupportLevel);
        }
        
        // New structure: filter_status.levels_filter.resistance_analysis.significant_resistance
        if (auroraAgentData.filter_status?.levels_filter?.resistance_analysis?.significant_resistance) {
          latestResistanceLevel = auroraAgentData.filter_status.levels_filter.resistance_analysis.significant_resistance;
          console.log("AuroraAgent - Incremental update: Found significant resistance level:", latestResistanceLevel);
        }
        // Fallback to old structure
        else if (auroraAgentData.resistance_levels?.significant_resistance) {
          latestResistanceLevel = auroraAgentData.resistance_levels.significant_resistance;
          console.log("AuroraAgent - Incremental update: Found significant resistance level (fallback):", latestResistanceLevel);
        }

        // Combine cached data with new data
        const result = {
          chartData: [...cachedData.chartData, ...newChartData],
          macdData: [...cachedData.macdData, ...newMacdData],
          rsiData: [...cachedData.rsiData, ...newRsiData],
          atrData: [...cachedData.atrData, ...newAtrData],
          supportLevel: latestSupportLevel,
          resistanceLevel: latestResistanceLevel,
          historicalSupportLevels: historicalSupportLevels,
          historicalResistanceLevels: historicalResistanceLevels
        };

        cachedDataRef.current = result;
        lastDataVersionRef.current = currentDataVersion;
        return result;
      };
      
      // Determine update strategy
      const timeSinceLastUpdate = currentTime - lastUpdateTimeRef.current;
      const timeSinceLastFullRefresh = currentTime - lastFullRefreshTimeRef.current;
      const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
      const thirtySeconds = 30 * 1000; // 30 seconds
      
      console.log(`AuroraAgent - Update check: timeSinceLastUpdate=${timeSinceLastUpdate}ms, timeSinceLastFullRefresh=${timeSinceLastFullRefresh}ms`);
      
      // Force full refresh if:
      // 1. No cached data exists
      // 2. More than 10 minutes since last full refresh
      // 3. Data version has changed significantly
      // 4. No auroraAgentData
      const shouldFullRefresh = !cachedDataRef.current || 
                               timeSinceLastFullRefresh > tenMinutes ||
                               (currentDataVersion !== lastDataVersionRef.current) ||
                               !auroraAgentData;
      
      // Incremental update if:
      // 1. We have cached data
      // 2. Less than 10 minutes since last full refresh
      // 3. At least 30 seconds since last update (changed from > to >=)
      // 4. New data is available
      const shouldIncrementalUpdate = cachedDataRef.current && 
                                     timeSinceLastFullRefresh <= tenMinutes &&
                                     timeSinceLastUpdate >= thirtySeconds &&
                                     auroraAgentData &&
                                     auroraAgentData.candles;
      
      console.log(`AuroraAgent - Update decisions: shouldFullRefresh=${shouldFullRefresh}, shouldIncrementalUpdate=${shouldIncrementalUpdate}`);
      
      if (shouldIncrementalUpdate) {
        console.log("AuroraAgent - Performing incremental update (latest data only)");
        lastUpdateTimeRef.current = currentTime;
        return performIncrementalUpdate(auroraAgentData, cachedDataRef.current!);
      }
      
      if (shouldFullRefresh) {
        console.log("AuroraAgent - Performing full refresh");
        lastFullRefreshTimeRef.current = currentTime;
        lastUpdateTimeRef.current = currentTime;
        lastDataVersionRef.current = currentDataVersion; // Update version only on full refresh
      } else if (cachedDataRef.current) {
        // If no full refresh and no incremental update, use cached data
        console.log("AuroraAgent - Using cached data, no update needed");
        return cachedDataRef.current;
      }

      if (auroraAgentData && Array.isArray(auroraAgentData.candles)) {
        // Debug: Log the entire AuroraAgent data structure
        console.log("AuroraAgent - Full data structure:", auroraAgentData);
        console.log("AuroraAgent - Available keys:", Object.keys(auroraAgentData));
        console.log("AuroraAgent - Support levels structure:", auroraAgentData.support_levels);
        console.log("AuroraAgent - Resistance levels structure:", auroraAgentData.resistance_levels);
        
        // Debug: Log the first candle to understand timestamp format
        if (auroraAgentData.candles.length > 0) {
          const rawTime = auroraAgentData.candles[0].time;
          console.log("AuroraAgent - First candle timestamp:", rawTime, "=", new Date(rawTime * 1000).toUTCString());
        }

        // Create a map of indicator values by time for efficient lookup
        const indicatorsByTime: { [key: number]: any } = {};
        
        if (auroraAgentData.indicators) {
          const indicators = auroraAgentData.indicators;
          
          // Helper function to populate indicator map
          const populateIndicatorMap = (indicatorArray: any[], key: string) => {
            if (Array.isArray(indicatorArray)) {
              indicatorArray.forEach((item) => {
                if (item && typeof item.time === 'number') {
                  if (!indicatorsByTime[item.time]) {
                    indicatorsByTime[item.time] = {};
                  }
                  indicatorsByTime[item.time][key] = item.value;
                }
              });
            }
          };

          // Populate indicator map for all indicators
          populateIndicatorMap(indicators.ema3, 'ema3');
          populateIndicatorMap(indicators.ema5, 'ema5');
          populateIndicatorMap(indicators.ema21, 'ema21');
          populateIndicatorMap(indicators.ema30, 'ema30');
          populateIndicatorMap(indicators.bb_upper, 'bb_upper');
          populateIndicatorMap(indicators.bb_middle, 'bb_middle');
          populateIndicatorMap(indicators.bb_lower, 'bb_lower');
          populateIndicatorMap(indicators.macd, 'macd_line');
          populateIndicatorMap(indicators.macd_signal, 'macd_signal');
          populateIndicatorMap(indicators.macd_histogram, 'macd_histogram');
          populateIndicatorMap(indicators.rsi, 'rsi');
          populateIndicatorMap(indicators.atr, 'atr');

          // Helper function to populate signal map
          const populateSignalMap = (signalArray: any[]) => {
            if (Array.isArray(signalArray)) {
              console.log(`AuroraAgent - populateSignalMap called with ${signalArray.length} signals`);
              signalArray.forEach((item, index) => {
                if (item && typeof item.time === 'number') {
                  if (index < 3) { // Log first 3 signals for debugging
                    console.log(`AuroraAgent - Signal ${index}:`, {
                      time: item.time,
                      timeAsDate: new Date(item.time * 1000).toUTCString(),
                      type: item.type,
                      signal_type: item.signal_type,
                      direction: item.direction,
                      price: item.price
                    });
                  }
                  if (!indicatorsByTime[item.time]) {
                    indicatorsByTime[item.time] = {};
                  }
                  indicatorsByTime[item.time].signal = { 
                    type: item.type, 
                    strength: item.strength || 'medium', // Default to medium if strength is not provided
                    signal_type: item.signal_type, 
                    confidence: item.confidence, 
                    price: item.price, 
                    direction: item.direction 
                  };
                }
              });
            }
          };

          // Populate signal map for all signals
          // Iterate over all properties of auroraAgentData.signals
          if (auroraAgentData.signals) {
            console.log("AuroraAgent - Raw signals object:", auroraAgentData.signals);
            console.log("AuroraAgent - Signal keys:", Object.keys(auroraAgentData.signals));
            
            // Check if signals is an array (new structure) or object (old structure)
            if (Array.isArray(auroraAgentData.signals)) {
              console.log(`AuroraAgent - Processing ${auroraAgentData.signals.length} signals from flat array`);
              
              auroraAgentData.signals.forEach((signal: any, index: number) => {
                if (signal && typeof signal.time === 'number') {
                  if (index < 5) { // Log first 5 signals for debugging
                    console.log(`AuroraAgent - Signal ${index}:`, {
                      time: signal.time,
                      timeAsDate: new Date(signal.time * 1000).toUTCString(),
                      type: signal.type,
                      signal_type: signal.signal_type,
                      direction: signal.direction,
                      price: signal.price
                    });
                  }
                  
                  if (!indicatorsByTime[signal.time]) {
                    indicatorsByTime[signal.time] = {};
                  }
                  indicatorsByTime[signal.time].signal = { 
                    type: signal.type, 
                    strength: signal.strength || 'medium',
                    signal_type: signal.signal_type, 
                    confidence: signal.confidence, 
                    price: signal.price, 
                    direction: signal.direction 
                  };
                }
              });
              
              console.log(`AuroraAgent - Total signals processed from array: ${auroraAgentData.signals.length}`);
            } else {
              // Old structure - categorized signals
              console.log("AuroraAgent - Processing signals from categorized structure");
              
              // Count total signals across all categories
              let totalSignals = 0;
              for (const signalKey in auroraAgentData.signals) {
                if (Object.prototype.hasOwnProperty.call(auroraAgentData.signals, signalKey)) {
                  const signalArray = auroraAgentData.signals[signalKey];
                  totalSignals += signalArray?.length || 0;
                  console.log(`AuroraAgent - Processing signals for key "${signalKey}":`, signalArray?.length || 0, "signals");
                  if (signalArray && signalArray.length > 0) {
                    console.log(`AuroraAgent - First signal in "${signalKey}":`, signalArray[0]);
                    console.log(`AuroraAgent - Last signal in "${signalKey}":`, signalArray[signalArray.length - 1]);
                  }
                  populateSignalMap(signalArray);
                }
              }
              
              console.log(`AuroraAgent - Total signals processed from categories: ${totalSignals}`);
            }
            
            // Debug: Show what timestamps have signals in the map
            const signalTimestamps = Object.keys(indicatorsByTime).filter(time => indicatorsByTime[Number(time)].signal);
            console.log("AuroraAgent - Timestamps with signals in map:", signalTimestamps.length);
            console.log("AuroraAgent - Total timestamps in indicatorsByTime:", Object.keys(indicatorsByTime).length);
            
            // Show sample signals that were processed
            if (signalTimestamps.length > 0) {
              console.log("AuroraAgent - Sample processed signals:");
              signalTimestamps.slice(0, 5).forEach(time => {
                console.log(`  Time ${time}:`, indicatorsByTime[Number(time)].signal);
              });
            }
          } else {
            console.log("AuroraAgent - No signals object found in data");
          }
          
          // Debug: Log signal data
          console.log("AuroraAgent - Signals data:", {
            buy: auroraAgentData.signals?.buy?.length || 0,
            sell: auroraAgentData.signals?.sell?.length || 0,
            hold: auroraAgentData.signals?.hold?.length || 0,
            totalSignals: (auroraAgentData.signals?.buy?.length || 0) + 
                         (auroraAgentData.signals?.sell?.length || 0) + 
                         (auroraAgentData.signals?.hold?.length || 0)
          });
          
          // Debug: Log the entire levels object structure
          console.log("AuroraAgent - Full levels object:", auroraAgentData.levels);
          console.log("AuroraAgent - Levels object type:", typeof auroraAgentData.levels);
          console.log("AuroraAgent - Levels object keys:", auroraAgentData.levels ? Object.keys(auroraAgentData.levels) : 'null/undefined');
          
          // Extract latest support and resistance levels for reference lines
          // New structure: filter_status.levels_filter.support_analysis.significant_support
          if (auroraAgentData.filter_status?.levels_filter?.support_analysis?.significant_support) {
            latestSupportLevel = auroraAgentData.filter_status.levels_filter.support_analysis.significant_support;
            console.log("AuroraAgent - Found significant support level:", latestSupportLevel);
          } 
          // Fallback to old structure (support_levels.significant_support)
          else if (auroraAgentData.support_levels?.significant_support) {
            latestSupportLevel = auroraAgentData.support_levels.significant_support;
            console.log("AuroraAgent - Found significant support level (fallback):", latestSupportLevel);
          }
          // Fallback to old structure (levels.support array)
          else if (Array.isArray(auroraAgentData.levels?.support) && auroraAgentData.levels.support.length > 0) {
            latestSupportLevel = auroraAgentData.levels.support[auroraAgentData.levels.support.length - 1];
            console.log("AuroraAgent - Found support level from old structure:", latestSupportLevel);
          } else {
            console.log("AuroraAgent - No significant support level found in data");
          }
          
          // Extract historical support levels
          console.log("AuroraAgent - About to extract historical support levels...");
          if (Array.isArray(auroraAgentData.levels?.support)) {
            console.log("AuroraAgent - Raw support levels array:", auroraAgentData.levels.support);
            // Handle both number format and {time, price} object format
            historicalSupportLevels = auroraAgentData.levels.support
              .filter((level: any) => {
                if (typeof level === 'number') {
                  return !isNaN(level);
                } else if (level && typeof level === 'object' && typeof level.price === 'number') {
                  return !isNaN(level.price);
                }
                return false;
              })
              .map((level: any) => {
                if (typeof level === 'number') {
                  return level;
                } else if (level && typeof level === 'object' && typeof level.price === 'number') {
                  return level.price;
                }
                return null;
              })
              .filter((price: number | null) => price !== null) as number[];
            console.log("AuroraAgent - Filtered historical support levels:", historicalSupportLevels);
          } else {
            console.log("AuroraAgent - No support levels array found or not an array:", auroraAgentData.levels?.support);
          }
          
          // New structure: filter_status.levels_filter.resistance_analysis.significant_resistance
          if (auroraAgentData.filter_status?.levels_filter?.resistance_analysis?.significant_resistance) {
            latestResistanceLevel = auroraAgentData.filter_status.levels_filter.resistance_analysis.significant_resistance;
            console.log("AuroraAgent - Found significant resistance level:", latestResistanceLevel);
          }
          // Fallback to old structure (resistance_levels.significant_resistance)
          else if (auroraAgentData.resistance_levels?.significant_resistance) {
            latestResistanceLevel = auroraAgentData.resistance_levels.significant_resistance;
            console.log("AuroraAgent - Found significant resistance level (fallback):", latestResistanceLevel);
          }
          // Fallback to old structure (levels.resistance array)
          else if (Array.isArray(auroraAgentData.levels?.resistance) && auroraAgentData.levels.resistance.length > 0) {
            latestResistanceLevel = auroraAgentData.levels.resistance[auroraAgentData.levels.resistance.length - 1];
            console.log("AuroraAgent - Found resistance level from old structure:", latestResistanceLevel);
          } else {
            console.log("AuroraAgent - No significant resistance level found in data");
          }
          
          // Extract historical resistance levels
          console.log("AuroraAgent - About to extract historical resistance levels...");
          if (Array.isArray(auroraAgentData.levels?.resistance)) {
            console.log("AuroraAgent - Raw resistance levels array:", auroraAgentData.levels.resistance);
            // Handle both number format and {time, price} object format
            historicalResistanceLevels = auroraAgentData.levels.resistance
              .filter((level: any) => {
                if (typeof level === 'number') {
                  return !isNaN(level);
                } else if (level && typeof level === 'object' && typeof level.price === 'number') {
                  return !isNaN(level.price);
                }
                return false;
              })
              .map((level: any) => {
                if (typeof level === 'number') {
                  return level;
                } else if (level && typeof level === 'object' && typeof level.price === 'number') {
                  return level.price;
                }
                return null;
              })
              .filter((price: number | null) => price !== null) as number[];
            console.log("AuroraAgent - Filtered historical resistance levels:", historicalResistanceLevels);
          } else {
            console.log("AuroraAgent - No resistance levels array found or not an array:", auroraAgentData.levels?.resistance);
          }
        }

        // Process candles and match with indicators by timestamp
        auroraAgentData.candles.forEach((candle: any) => {
          const time = candle.time;
          const indicators = indicatorsByTime[time] || {};

          // Debug: Check if this timestamp has any indicators or signals
          if (Object.keys(indicators).length > 0) {
            console.log(`AuroraAgent - Timestamp ${time} has indicators:`, Object.keys(indicators));
            if (indicators.signal) {
              console.log(`AuroraAgent - Signal found at timestamp ${time}:`, indicators.signal);
            }
          }

          const chartDataItem: any = {
            time: time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
            // Add indicator values if available
            ema3: indicators.ema3,
            ema5: indicators.ema5,
            ema21: indicators.ema21,
            ema30: indicators.ema30,
            bb_upper: indicators.bb_upper,
            bb_middle: indicators.bb_middle,
            bb_lower: indicators.bb_lower,
            signal: indicators.signal, // Add signal data to chartDataItem
          };

          // If there's a signal at this timestamp, use the chart's close price instead of signal's price
          if (indicators.signal) {
            console.log(`AuroraAgent - Signal matched to chart data at index ${processedChartData.length}. Signal time: ${time}, Chart time: ${time}`);
            console.log(`AuroraAgent - Signal price (${indicators.signal.price}) vs Chart close price (${candle.close})`);
            
            // Use the chart's close price for the signal position instead of the signal's own price
            indicators.signal.chartPrice = candle.close;
          }

          const macdDataItem: any = {
            time: time,
            macd_line: indicators.macd_line,
            macd_signal: indicators.macd_signal,
            macd_histogram: indicators.macd_histogram,
          };

          const rsiDataItem: any = {
            time: time,
            rsi: indicators.rsi,
          };

          const atrDataItem: any = {
            time: time,
            atr: indicators.atr,
          };

          processedChartData.push(chartDataItem);
          processedMacdData.push(macdDataItem);
          processedRsiData.push(rsiDataItem);
          processedAtrData.push(atrDataItem);
        });

        // Debug: Log timestamp info for last candle and signal count
        if (processedChartData.length > 0) {
          const lastTime = processedChartData[processedChartData.length - 1].time;
          const signalsWithData = processedChartData.filter(d => d.signal).length;
          console.log("AuroraAgent - Last candle timestamp:", lastTime, "=", new Date(lastTime * 1000).toUTCString());
          console.log("AuroraAgent - Current time (UTC):", new Date().toUTCString());
          console.log("AuroraAgent - Total candles processed:", processedChartData.length);
          console.log("AuroraAgent - Candles with signals:", signalsWithData);
          
          // Debug: Show first few signals if any exist
          if (signalsWithData > 0) {
            const firstSignal = processedChartData.find(d => d.signal);
            console.log("AuroraAgent - First signal example:", firstSignal?.signal);
            console.log("AuroraAgent - Signals for Scatter component:", processedChartData.filter(d => d.signal).slice(0, 3));
          }
        }
        
        // Cache the processed data
        const result = { 
          chartData: processedChartData, 
          macdData: processedMacdData, 
          rsiData: processedRsiData, 
          atrData: processedAtrData,
          supportLevel: latestSupportLevel,
          resistanceLevel: latestResistanceLevel,
          historicalSupportLevels: historicalSupportLevels,
          historicalResistanceLevels: historicalResistanceLevels
        };
        cachedDataRef.current = result;
        lastDataVersionRef.current = currentDataVersion;
        return result;
      }
    } catch (e) {
      console.error("Error processing AuroraAgent data:", e);
    }
    
    // Return cached data if available, otherwise empty arrays
    if (cachedDataRef.current) {
      return cachedDataRef.current;
    }
    return { 
      chartData: processedChartData, 
      macdData: processedMacdData, 
      rsiData: processedRsiData, 
      atrData: processedAtrData,
      supportLevel: latestSupportLevel,
      resistanceLevel: latestResistanceLevel,
      historicalSupportLevels: historicalSupportLevels,
      historicalResistanceLevels: historicalResistanceLevels
    };
  }, [fullMessage, assetSymbol, forceUpdate]); // Added forceUpdate to dependency array

  // Collect all unique signal types from the fullMessage
  const allSignalTypes = useMemo(() => {
    const types = new Set<string>();
    const typeDetails: { [key: string]: any[] } = {};
    
    const auroraAgentData = fullMessage?.data?.[assetSymbol]?.agents?.AuroraAgent?.data;
    
    if (auroraAgentData?.signals) {
      if (Array.isArray(auroraAgentData.signals)) {
        // New flat array structure
        console.log("AuroraAgent - Processing flat array signals:", auroraAgentData.signals.length);
        
        // Special debugging for vivienne_bang_dispatch
        const vivienneSignals = auroraAgentData.signals.filter((s: any) => s.type === 'vivienne_bang_dispatch');
        console.log("AuroraAgent - All vivienne_bang_dispatch signals:", vivienneSignals);
        
        auroraAgentData.signals.forEach((signal: any, index: number) => {
          if (signal && signal.type) {
            types.add(signal.type);
            if (!typeDetails[signal.type]) {
              typeDetails[signal.type] = [];
            }
            typeDetails[signal.type].push({
              signal_type: signal.signal_type,
              direction: signal.direction,
              index: index
            });
          }
        });
      } else {
        // Old categorized structure
        console.log("AuroraAgent - Processing categorized signals");
        for (const signalKey in auroraAgentData.signals) {
          if (Object.prototype.hasOwnProperty.call(auroraAgentData.signals, signalKey)) {
            const signalArray = auroraAgentData.signals[signalKey];
            if (Array.isArray(signalArray)) {
              signalArray.forEach((signal: any) => {
                if (signal && signal.type) {
                  types.add(signal.type);
                  if (!typeDetails[signal.type]) {
                    typeDetails[signal.type] = [];
                  }
                  typeDetails[signal.type].push({
                    signal_type: signal.signal_type,
                    direction: signal.direction,
                    category: signalKey
                  });
                }
              });
            }
          }
        }
      }
    }
    
    console.log("AuroraAgent - Found signal types:", Array.from(types));
    console.log("AuroraAgent - Signal type details:", typeDetails);
    
    return Array.from(types).sort();
  }, [fullMessage, assetSymbol]);

  // Group signal types by category (buy/sell/neutral)
  const signalCategories = useMemo(() => {
    const categories = {
      buy: [] as string[],
      sell: [] as string[],
      neutral: [] as string[]
    };

    const originalData = fullMessage?.data?.[assetSymbol]?.agents?.AuroraAgent?.data;
    
    console.log("AuroraAgent - Categorizing signal types:", allSignalTypes);
    console.log("AuroraAgent - Original signals data:", originalData?.signals);
    
    allSignalTypes.forEach(type => {
      // Find a sample signal of this type to determine category
      let sampleSignal = null;
      
      if (originalData?.signals) {
        if (Array.isArray(originalData.signals)) {
          sampleSignal = originalData.signals.find((s: any) => s.type === type);
        } else {
          // Search in all categories
          for (const signalKey in originalData.signals) {
            if (Object.prototype.hasOwnProperty.call(originalData.signals, signalKey)) {
              const signalArray = originalData.signals[signalKey];
              if (Array.isArray(signalArray)) {
                sampleSignal = signalArray.find((s: any) => s.type === type);
                if (sampleSignal) break;
              }
            }
          }
        }
      }
      
      if (sampleSignal) {
        const { signal_type, direction } = sampleSignal;
        
        // Special debugging for vivienne_bang_dispatch
        if (type === 'vivienne_bang_dispatch') {
          console.log(`AuroraAgent - VIVIENNE_BANG_DISPATCH DEBUG:`, {
            type: type,
            signal_type: signal_type,
            direction: direction,
            full_sample: sampleSignal
          });
        }
        
        console.log(`AuroraAgent - Signal type "${type}": signal_type="${signal_type}", direction="${direction}", full sample:`, sampleSignal);
        
        // More comprehensive categorization logic
        if (signal_type === 'BULLISH' || direction === 'LONG' || signal_type === 'BUY') {
          categories.buy.push(type);
          console.log(`AuroraAgent - Categorized "${type}" as BUY`);
        } else if (signal_type === 'BEARISH' || direction === 'SHORT' || signal_type === 'SELL') {
          categories.sell.push(type);
          console.log(`AuroraAgent - Categorized "${type}" as SELL`);
        } else {
          categories.neutral.push(type);
          console.log(`AuroraAgent - Categorized "${type}" as NEUTRAL`);
        }
      } else {
        // Default to neutral if we can't determine category
        categories.neutral.push(type);
        console.log(`AuroraAgent - Categorized "${type}" as NEUTRAL (no sample found)`);
      }
    });

    console.log("AuroraAgent - Final categories:", categories);
    return categories;
  }, [allSignalTypes, fullMessage, assetSymbol]);

  // Count signals by type
  const signalCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    const originalData = fullMessage?.data?.[assetSymbol]?.agents?.AuroraAgent?.data;
    
    if (originalData?.signals) {
      if (Array.isArray(originalData.signals)) {
        originalData.signals.forEach((signal: any) => {
          if (signal && signal.type) {
            counts[signal.type] = (counts[signal.type] || 0) + 1;
          }
        });
      } else {
        for (const signalKey in originalData.signals) {
          if (Object.prototype.hasOwnProperty.call(originalData.signals, signalKey)) {
            const signalArray = originalData.signals[signalKey];
            if (Array.isArray(signalArray)) {
              signalArray.forEach((signal: any) => {
                if (signal && signal.type) {
                  counts[signal.type] = (counts[signal.type] || 0) + 1;
                }
              });
            }
          }
        }
      }
    }
    
    return counts;
  }, [fullMessage, assetSymbol]);

  return (
    <div className="terminal-block mb-4">
      <div className="title-bar">AuroraAgent</div>
      
      {/* Debug Status */}
      <div className="px-4 py-2 bg-gray-900 border-b border-gray-600">
        <div className="text-xs text-green-400">
          Last Update: {new Date(lastUpdateTimeRef.current).toLocaleTimeString()} | 
          Last Full Refresh: {new Date(lastFullRefreshTimeRef.current).toLocaleTimeString()} | 
          Data Points: {chartData.length} | 
          Version: {fullMessage?.data?.[assetSymbol]?.agents?.AuroraAgent?.data?.metadata?.data_version || 'N/A'}
        </div>
      </div>
      
      {/* Full-width Chart Section */}
      <div className="p-4">
        <div className="h-[1000px] w-full bg-black rounded">
          {chartData.length > 0 ? (
            <AuroraChart
              chartData={chartData}
              macdData={macdData}
              rsiData={rsiData}
              atrData={atrData}
              supportLevel={supportLevel}
              resistanceLevel={resistanceLevel}
              historicalSupportLevels={historicalSupportLevels}
              historicalResistanceLevels={historicalResistanceLevels}
              allSignalTypes={allSignalTypes}
              signalCounts={signalCounts}
              signalCategories={signalCategories}
            />
          ) : (
            <div className="text-gray-500 p-4">No chart data available</div>
          )}
        </div>
      </div>

      {/* Collapsible Data Section */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setShowData(!showData)}
          className="flex items-center justify-between w-full p-2 bg-gray-800 hover:bg-gray-700 rounded text-blue-400 font-semibold transition-colors"
        >
          <span>Raw Data</span>
          <span className="text-sm">
            {showData ? '▼' : '▶'}
          </span>
        </button>
        
        {showData && (
          <div className="mt-2">
            <pre className="bg-gray-800 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(fullMessage, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};