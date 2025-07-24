import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface AuroraAgentProps {
  assetSymbol?: string; // e.g., 'BTC', default to 'BTC'
  fullMessage: any; // The full websocket message
  sendMessage?: (message: any) => void; // WebSocket send function
}

export const AuroraAgent: React.FC<AuroraAgentProps> = ({ assetSymbol = 'BTC', fullMessage, sendMessage }) => {
  // Extract AuroraAgent data from the websocket message
  const auroraData = fullMessage?.data?.[assetSymbol]?.agents?.AuroraAgent;
  const metadata = auroraData?.data?.metadata;
  const candles = auroraData?.data?.candles || [];
  const indicators = auroraData?.data?.indicators || {};
  const signals = auroraData?.data?.signals || [];
  const filterStatus = auroraData?.data?.filter_status;
  const config = auroraData?.config;
  
  // Extract VivienneAgent data for significant support/resistance
  const vivienneData = fullMessage?.data?.[assetSymbol]?.agents?.VivienneAgent;
  const vivienneSignificantSupport = vivienneData?.data?.filter_analysis?.levels_filter?.support_analysis?.significant_support;
  const vivienneSignificantResistance = vivienneData?.data?.filter_analysis?.levels_filter?.resistance_analysis?.significant_resistance;

  // Process chart data
  const chartData = useMemo(() => {
    if (!candles || candles.length === 0) return [];

    return candles.map((candle: any, index: number) => {
      // Ensure candle exists and has required properties
      if (!candle || typeof candle.time === 'undefined') {
        console.warn('Invalid candle data:', candle);
        return null;
      }

      const dataPoint = {
        index: index, // Add index for better tooltip handling
        timestamp: new Date(candle.time * 1000).toUTCString().split(' ')[4], // Convert Unix timestamp to UTC time
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        price: candle.price,
        volume: candle.volume,
        // Technical indicators
        rsi: candle.rsi,
        ema3: candle.ema3,
        ema5: candle.ema5,
        ema21: candle.ema21,
        ema30: candle.ema30,
        macd: candle.macd,
        macd_signal: candle.macd_signal,
        macd_histogram: candle.macd_histogram,
        bb_lower: candle.bb_lower,
        bb_upper: candle.bb_upper,
        bb_middle: candle.bb_middle,
        // Additional fields that might exist
        vwap: candle.vwap,
        vivienne_significant_support: candle.vivienne_significant_support,
        vivienne_significant_resistance: candle.vivienne_significant_resistance,
        atr: candle.atr,
      };

      return dataPoint;
    }).filter(Boolean); // Remove any null entries
  }, [candles, indicators, vivienneSignificantSupport, vivienneSignificantResistance]);

  // State for managing line visibility
  const [visibleLines, setVisibleLines] = useState({
    price: true,
    vwap: true,
    bb_upper: true,
    bb_middle: true,
    bb_lower: true,
    vivienne_support: true,
    vivienne_resistance: true,
    ema3: true,
    ema5: true,
    ema21: true,
    ema30: true,
    rsi: true,
    macd: true,
    macd_signal: true,
    atr: true,
    volume: true
  });

  // Function to toggle line visibility
  const toggleLine = (lineKey: string) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey as keyof typeof prev]
    }));
  };

  // Function to toggle all lines
  const toggleAllLines = (show: boolean) => {
    setVisibleLines(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        newState[key as keyof typeof newState] = show;
      });
      return newState;
    });
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-gray-600 p-2 rounded shadow-lg">
          <p className="text-gray-300 text-xs mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(5) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom legend component with click functionality
  const CustomLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null;

    // Map legend names to state keys
    const nameToKeyMap: { [key: string]: string } = {
      'Price': 'price',
      'VWAP': 'vwap',
      'BB Upper': 'bb_upper',
      'BB Middle': 'bb_middle',
      'BB Lower': 'bb_lower',
      'Vivienne Support': 'vivienne_support',
      'Vivienne Resistance': 'vivienne_resistance',
      'EMA3': 'ema3',
      'EMA5': 'ema5',
      'EMA21': 'ema21',
      'EMA30': 'ema30',
      'RSI': 'rsi',
      'MACD': 'macd',
      'Signal': 'macd_signal',
      'ATR': 'atr',
      'Volume': 'volume'
    };

    return (
      <div className="flex flex-wrap gap-2 p-2 bg-black border border-gray-700 rounded">
        {payload.map((entry: any, index: number) => {
          const lineKey = nameToKeyMap[entry.value] || entry.dataKey || entry.value;
          const isVisible = visibleLines[lineKey as keyof typeof visibleLines];
          
          return (
            <div
              key={index}
              className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-opacity ${
                isVisible ? 'opacity-100' : 'opacity-40'
              }`}
              onClick={() => toggleLine(lineKey)}
              style={{ color: entry.color }}
            >
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs">{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Render all charts stacked vertically
  const renderAllCharts = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No chart data available
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Main Price Chart with Overlays */}
        <div className="bg-black border border-gray-700 p-2">
          <div className="flex justify-between items-center mb-2">
            <div className="text-green-400 font-bold">MAIN CHART - PRICE, EMAs, VWAP & BOLLINGER BANDS</div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleAllLines(true)}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Show All
              </button>
              <button
                onClick={() => toggleAllLines(false)}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Hide All
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={0.5} />
              <XAxis 
                dataKey="index" 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(value) => chartData[value]?.timestamp || ''}
              />
                            <YAxis
                stroke="#9CA3AF"
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
                domain={['dataMin - 0.00001', 'dataMax + 0.00001']}
                tickFormatter={(value) => typeof value === 'number' ? value.toFixed(5) : value}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              
              {/* Bollinger Bands - Background bands */}
              <Area 
                dataKey="bb_upper" 
                stroke="none" 
                fill="#EF4444" 
                fillOpacity={0.1}
                name="BB Upper"
              />
              <Area 
                dataKey="bb_lower" 
                stroke="none" 
                fill="#10B981" 
                fillOpacity={0.1}
                name="BB Lower"
              />
              
              {/* Bollinger Bands - Lines */}
              {visibleLines.bb_upper && (
                <Line 
                  type="monotone" 
                  dataKey="bb_upper" 
                  stroke="#EF4444" 
                  strokeWidth={0.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="BB Upper"
                />
              )}
              {visibleLines.bb_middle && (
                <Line 
                  type="monotone" 
                  dataKey="bb_middle" 
                  stroke="#F59E0B" 
                  strokeWidth={0.5}
                  strokeDasharray="3 3"
                  dot={false}
                  name="BB Middle"
                />
              )}
              {visibleLines.bb_lower && (
                <Line 
                  type="monotone" 
                  dataKey="bb_lower" 
                  stroke="#10B981" 
                  strokeWidth={0.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="BB Lower"
                />
              )}
              
              {/* VWAP Line */}
              {visibleLines.vwap && (
                <Line 
                  type="monotone" 
                  dataKey="vwap" 
                  stroke="#8B5CF6" 
                  strokeWidth={1}
                  strokeDasharray="8 4"
                  dot={false}
                  name="VWAP"
                />
              )}
              
              {/* Price Line - Main */}
              {visibleLines.price && (
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#FFFFFF" 
                  strokeWidth={1}
                  dot={false}
                  name="Price"
                />
              )}
              
              {/* EMAs */}
              {visibleLines.ema3 && (
                <Line 
                  type="monotone" 
                  dataKey="ema3" 
                  stroke="#F59E0B" 
                  strokeWidth={0.5}
                  dot={false}
                  name="EMA3"
                />
              )}
              {visibleLines.ema5 && (
                <Line 
                  type="monotone" 
                  dataKey="ema5" 
                  stroke="#EF4444" 
                  strokeWidth={0.5}
                  dot={false}
                  name="EMA5"
                />
              )}
              {visibleLines.ema21 && (
                <Line 
                  type="monotone" 
                  dataKey="ema21" 
                  stroke="#06B6D4" 
                  strokeWidth={0.5}
                  dot={false}
                  name="EMA21"
                />
              )}
              {visibleLines.ema30 && (
                <Line 
                  type="monotone" 
                  dataKey="ema30" 
                  stroke="#EC4899" 
                  strokeWidth={0.5}
                  dot={false}
                  name="EMA30"
                />
              )}
              
              {/* Vivienne Support/Resistance levels */}
              {visibleLines.vivienne_support && (
                <Line 
                  type="monotone" 
                  dataKey="vivienne_significant_support" 
                  stroke="#10B981" 
                  strokeWidth={0.5}
                  strokeDasharray="10 5"
                  dot={false}
                  name="Vivienne Support"
                />
              )}
              {visibleLines.vivienne_resistance && (
                <Line 
                  type="monotone" 
                  dataKey="vivienne_significant_resistance" 
                  stroke="#EF4444" 
                  strokeWidth={0.5}
                  strokeDasharray="10 5"
                  dot={false}
                  name="Vivienne Resistance"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* RSI Chart */}
        <div className="bg-black border border-gray-700 p-2">
          <div className="text-green-400 font-bold mb-2">RSI</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={0.5} />
              <XAxis 
                dataKey="index" 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(value) => chartData[value]?.timestamp || ''}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              {visibleLines.rsi && (
                <Line 
                  type="monotone" 
                  dataKey="rsi" 
                  stroke="#F59E0B" 
                  strokeWidth={0.5}
                  dot={false}
                />
              )}
              <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* MACD Chart */}
        <div className="bg-black border border-gray-700 p-2">
          <div className="text-green-400 font-bold mb-2">MACD</div>
          <ResponsiveContainer width="100%" height={150}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={0.5} />
              <XAxis 
                dataKey="index" 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(value) => chartData[value]?.timestamp || ''}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
              />
                              <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                {visibleLines.macd && (
                <Line 
                  type="monotone" 
                  dataKey="macd" 
                  stroke="#10B981" 
                  strokeWidth={0.5}
                  dot={false}
                  name="MACD"
                />
              )}
              {visibleLines.macd_signal && (
                <Line 
                  type="monotone" 
                  dataKey="macd_signal" 
                  stroke="#EF4444" 
                  strokeWidth={0.5}
                  dot={false}
                  name="Signal"
                />
              )}
              <Bar 
                dataKey="macd_histogram" 
                fill="#8B5CF6" 
                name="Histogram"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>



        {/* Volume Chart */}
        <div className="bg-black border border-gray-700 p-2">
          <div className="text-green-400 font-bold mb-2">VOLUME</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={0.5} />
              <XAxis 
                dataKey="index" 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(value) => chartData[value]?.timestamp || ''}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {visibleLines.volume && (
                <Bar 
                  dataKey="volume" 
                  fill="#8B5CF6" 
                  fillOpacity={0.5}
                  name="Volume"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>



        {/* ATR Chart */}
        <div className="bg-black border border-gray-700 p-2">
          <div className="text-green-400 font-bold mb-2">ATR (AVERAGE TRUE RANGE)</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeWidth={0.5} />
              <XAxis 
                dataKey="index" 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(value) => chartData[value]?.timestamp || ''}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={10}
                tick={{ fill: '#9CA3AF' }}
              />
                              <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                {visibleLines.atr && (
                <Line 
                  type="monotone" 
                  dataKey="atr" 
                  stroke="#06B6D4" 
                  strokeWidth={0.5}
                  dot={false}
                  name="ATR"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black text-green-400 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-green-400 mb-2">AURORA AGENT</h2>
        <div className="text-sm text-gray-400">
          {metadata && (
            <div>
              <p>Asset: {metadata.asset_symbol}</p>
              <p>Last Updated: {new Date(metadata.last_updated).toLocaleString()}</p>
              <p>Data Version: {metadata.data_version}</p>
              <p>Size: {metadata.size_mb?.toFixed(2)} MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="mb-4">
        {renderAllCharts()}
      </div>

      {/* Signals */}
      {signals.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-bold text-green-400 mb-2">SIGNALS</h3>
          <div className="space-y-2">
            {signals.slice(-5).map((signal: any, index: number) => (
                                 <div key={index} className="bg-black border border-gray-700 p-2 rounded">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-mono">{signal.type}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    signal.direction === 'BULLISH' ? 'bg-green-900 text-green-300' :
                    signal.direction === 'BEARISH' ? 'bg-red-900 text-red-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {signal.direction}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{signal.text}</p>
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {(signal.confidence * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Status */}
      {filterStatus && (
        <div className="mb-4">
          <h3 className="text-lg font-bold text-green-400 mb-2">FILTER STATUS</h3>
          <div className="space-y-2">
            {Object.entries(filterStatus).map(([filterName, filterData]: [string, any]) => (
                                 <div key={filterName} className="bg-black border border-gray-700 p-2 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono capitalize">{filterName.replace(/_/g, ' ')}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    filterData.status === 'Passed' ? 'bg-green-900 text-green-300' :
                    filterData.status === 'Blocked' ? 'bg-red-900 text-red-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {filterData.status}
                  </span>
                </div>
                {filterData.reason && (
                  <p className="text-xs text-gray-400 mt-1">{filterData.reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration */}
      {config && (
        <div className="mb-4">
          <h3 className="text-lg font-bold text-green-400 mb-2">CONFIGURATION</h3>
          <div className="space-y-2">
            {config.indicator_configs && (
                                       <div className="bg-black border border-gray-700 p-2 rounded">
                <h4 className="text-sm font-bold text-green-400 mb-2">INDICATOR CONFIGS</h4>
                <div className="space-y-1">
                  {Object.entries(config.indicator_configs).map(([indicatorName, indicatorConfig]: [string, any]) => (
                    <div key={indicatorName} className="text-xs">
                      <span className="text-gray-400 font-mono">{indicatorName}:</span>
                      <div className="ml-4 text-gray-500">
                        {Object.entries(indicatorConfig).map(([paramName, paramValue]: [string, any]) => (
                          <div key={paramName}>
                            <span className="text-gray-400">{paramName}:</span> {paramValue}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
