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
}> = React.memo(({ chartData, macdData, rsiData, atrData, supportLevel, resistanceLevel }) => {
  const SignalDot: React.FC<any> = ({ cx, cy, payload }) => {
    const { signal } = payload;
    if (!signal) return null;

    const { type, strength, signal_type, direction } = signal; // Destructure new fields

    let fill = '#a1a1aa'; // Default color (zinc-500)
    let stroke = '#e4e4e7'; // zinc-200
    let text = '';
    let mappedType = type; // Use the original type as a fallback

    // Map new signal types/directions to 'buy', 'sell', 'hold' for consistent coloring
    if (signal_type === 'BULLISH' || direction === 'LONG') {
      mappedType = 'buy';
    } else if (signal_type === 'BEARISH' || direction === 'SHORT') {
      mappedType = 'sell';
    } else if (type.includes('hold')) { // Check if original type contains 'hold'
      mappedType = 'hold';
    }

    if (mappedType === 'buy') {
      fill = strength === 'strong' ? '#22c55e' : '#86efac'; // green-500, green-300
      stroke = '#16a34a'; // green-600
      text = 'B';
    } else if (mappedType === 'sell') {
      fill = strength === 'strong' ? '#ef4444' : '#fca5a5'; // red-500, red-300
      stroke = '#dc2626'; // red-600
      text = 'S';
    } else if (mappedType === 'hold') {
      fill = '#71717a'; // zinc-500
      stroke = '#52525b'; // zinc-600
      text = 'H';
    } else { // For other new signal types, use a generic color and the first letter of the type
      fill = '#60a5fa'; // blue-400
      stroke = '#3b82f6'; // blue-500
      text = type.charAt(0).toUpperCase(); // Use first letter of the signal type
    }

    return (
      <g>
        <circle cx={cx} cy={cy} r={strength === 'strong' ? 8 : 5} fill={fill} stroke={stroke} strokeWidth={1} />
        <text x={cx} y={cy} dy=".3em" textAnchor="middle" fontSize={strength === 'strong' ? 9 : 7} fill="#ffffff" fontWeight="bold">
          {text}
        </text>
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
          <Legend />
          <Line type="monotone" dataKey="close" stroke="#22d3ee" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ema3" stroke="#facc15" strokeWidth={1} dot={false} />
          <Line type="monotone" dataKey="ema5" stroke="#a78bfa" strokeWidth={1} dot={false} />
          <Line type="monotone" dataKey="ema21" stroke="#fb923c" strokeWidth={1} dot={false} />
          <Line type="monotone" dataKey="ema30" stroke="#34d399" strokeWidth={1} dot={false} />
          <Line type="monotone" dataKey="bb_upper" stroke="#e879f9" strokeWidth={1} dot={false} strokeDasharray="3 3" />
          <Line type="monotone" dataKey="bb_middle" stroke="#818cf8" strokeWidth={1} dot={false} strokeDasharray="3 3" />
          <Line type="monotone" dataKey="bb_lower" stroke="#f472b6" strokeWidth={1} dot={false} strokeDasharray="3 3" />
          <Line type="monotone" dataKey="significant_support" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="significant_resistance" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
          <Scatter
            name="Signals"
            data={chartData.filter(d => d.signal)}
            dataKey="close"
            shape={<SignalDot />}
            isAnimationActive={false}
          />
          {supportLevel && (
            <ReferenceLine
              y={supportLevel}
              stroke="#22c55e"
              strokeWidth={1}
              strokeDasharray="2 2"
              label={{ value: `Current Support: ${supportLevel.toFixed(2)}`, position: "insideTopRight" }}
            />
          )}
          {resistanceLevel && (
            <ReferenceLine
              y={resistanceLevel}
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="2 2"
              label={{ value: `Current Resistance: ${resistanceLevel.toFixed(2)}`, position: "insideBottomRight" }}
            />
          )}
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

  const { chartData, macdData, rsiData, atrData, supportLevel, resistanceLevel } = useMemo(() => {
    const processedChartData: any[] = [];
    const processedMacdData: any[] = [];
    const processedRsiData: any[] = [];
    const processedAtrData: any[] = [];
    let latestSupportLevel: number | null = null;
    let latestResistanceLevel: number | null = null;

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
          populateIndicatorMap(indicators.significant_support, 'significant_support');
          populateIndicatorMap(indicators.significant_resistance, 'significant_resistance');

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
            significant_support: indicators.significant_support,
            significant_resistance: indicators.significant_resistance,
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

        // Combine cached data with new data
        const result = {
          chartData: [...cachedData.chartData, ...newChartData],
          macdData: [...cachedData.macdData, ...newMacdData],
          rsiData: [...cachedData.rsiData, ...newRsiData],
          atrData: [...cachedData.atrData, ...newAtrData],
          supportLevel: cachedData.supportLevel,
          resistanceLevel: cachedData.resistanceLevel
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
          populateIndicatorMap(indicators.significant_support, 'significant_support');
          populateIndicatorMap(indicators.significant_resistance, 'significant_resistance');

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
            
            for (const signalKey in auroraAgentData.signals) {
              if (Object.prototype.hasOwnProperty.call(auroraAgentData.signals, signalKey)) {
                const signalArray = auroraAgentData.signals[signalKey];
                console.log(`AuroraAgent - Processing signals for key "${signalKey}":`, signalArray?.length || 0, "signals");
                if (signalArray && signalArray.length > 0) {
                  console.log(`AuroraAgent - First signal in "${signalKey}":`, signalArray[0]);
                }
                populateSignalMap(signalArray);
              }
            }
            
            // Debug: Show what timestamps have signals in the map
            const signalTimestamps = Object.keys(indicatorsByTime).filter(time => indicatorsByTime[Number(time)].signal);
            console.log("AuroraAgent - Timestamps with signals in map:", signalTimestamps);
            console.log("AuroraAgent - Total timestamps in indicatorsByTime:", Object.keys(indicatorsByTime).length);
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
          
          // Extract latest support and resistance levels for reference lines
          if (Array.isArray(indicators.significant_support) && indicators.significant_support.length > 0) {
            const lastSupport = indicators.significant_support[indicators.significant_support.length - 1];
            latestSupportLevel = lastSupport?.value || null;
          }
          if (Array.isArray(indicators.significant_resistance) && indicators.significant_resistance.length > 0) {
            const lastResistance = indicators.significant_resistance[indicators.significant_resistance.length - 1];
            latestResistanceLevel = lastResistance?.value || null;
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
            significant_support: indicators.significant_support,
            significant_resistance: indicators.significant_resistance,
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
          resistanceLevel: latestResistanceLevel
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
      resistanceLevel: latestResistanceLevel
    };
  }, [fullMessage, assetSymbol, forceUpdate]); // Added forceUpdate to dependency array

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