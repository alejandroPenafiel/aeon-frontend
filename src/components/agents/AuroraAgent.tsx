import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { mapSignals } from '../../utils/mapSignals'; // Keep this for now, but won't use directly in chart

interface AuroraAgentProps {
  assetSymbol?: string; // e.g., 'BTC', default to 'BTC'
  fullMessage: any; // The full websocket message
}

const AuroraChart: React.FC<{
  chartData: any[];
  macdData: any[];
  rsiData: any[];
  atrData: any[];
}> = React.memo(({ chartData, macdData, rsiData, atrData }) => {
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
  const lastDataVersionRef = useRef<string | null>(null);
  const cachedDataRef = useRef<{
    chartData: any[];
    macdData: any[];
    rsiData: any[];
    atrData: any[];
  } | null>(null);

  const { chartData, macdData, rsiData, atrData } = useMemo(() => {
    const processedChartData: any[] = [];
    const processedMacdData: any[] = [];
    const processedRsiData: any[] = [];
    const processedAtrData: any[] = [];

    try {
      const auroraAgentData = fullMessage?.data?.[assetSymbol]?.agents?.AuroraAgent?.data;
      
      // Check if we have cached data and if the data version hasn't changed
      const currentDataVersion = auroraAgentData?.metadata?.data_version || auroraAgentData?.metadata?.last_updated;
      if (currentDataVersion && 
          currentDataVersion === lastDataVersionRef.current && 
          cachedDataRef.current) {
        return cachedDataRef.current;
      }
      
      if (auroraAgentData && Array.isArray(auroraAgentData.candles)) {
        // Debug: Log timestamp info for first candle only
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
        }

        // Process candles and match with indicators by timestamp
        auroraAgentData.candles.forEach((candle: any) => {
          const time = candle.time;
          const indicators = indicatorsByTime[time] || {};

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

          processedChartData.push(chartDataItem);
          processedMacdData.push(macdDataItem);
          processedRsiData.push(rsiDataItem);
          processedAtrData.push(atrDataItem);
        });

        // Debug: Log timestamp info for last candle
        if (processedChartData.length > 0) {
          const lastTime = processedChartData[processedChartData.length - 1].time;
          console.log("AuroraAgent - Last candle timestamp:", lastTime, "=", new Date(lastTime * 1000).toUTCString());
          console.log("AuroraAgent - Current time (UTC):", new Date().toUTCString());
          console.log("AuroraAgent - Total candles processed:", processedChartData.length);
        }
        
        // Cache the processed data
        const result = { chartData: processedChartData, macdData: processedMacdData, rsiData: processedRsiData, atrData: processedAtrData };
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
    return { chartData: processedChartData, macdData: processedMacdData, rsiData: processedRsiData, atrData: processedAtrData };
  }, [fullMessage, assetSymbol]);

  return (
    <div className="terminal-block mb-4">
      <div className="title-bar">AuroraAgent</div>
      
      {/* Full-width Chart Section */}
      <div className="p-4">
        <div className="h-[1000px] w-full bg-black rounded">
          {chartData.length > 0 ? (
            <AuroraChart
              chartData={chartData}
              macdData={macdData}
              rsiData={rsiData}
              atrData={atrData}
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