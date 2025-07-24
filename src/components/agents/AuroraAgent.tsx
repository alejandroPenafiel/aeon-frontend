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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 p-2 rounded shadow-lg">
          <p className="text-gray-300 text-xs mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(6) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
        <div className="bg-gray-900 border border-gray-700 p-2">
          <div className="text-green-400 font-bold mb-2">MAIN CHART - PRICE, EMAs, VWAP & BOLLINGER BANDS</div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
                domain={['dataMin - 0.001', 'dataMax + 0.001']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
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
              <Line 
                type="monotone" 
                dataKey="bb_upper" 
                stroke="#EF4444" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="BB Upper"
              />
              <Line 
                type="monotone" 
                dataKey="bb_middle" 
                stroke="#F59E0B" 
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="BB Middle"
              />
              <Line 
                type="monotone" 
                dataKey="bb_lower" 
                stroke="#10B981" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="BB Lower"
              />
              
              {/* VWAP Line */}
              <Line 
                type="monotone" 
                dataKey="vwap" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                name="VWAP"
              />
              
              {/* Price Line - Main */}
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#FFFFFF" 
                strokeWidth={3}
                dot={false}
                name="Price"
              />
              
              {/* EMAs */}
              <Line 
                type="monotone" 
                dataKey="ema3" 
                stroke="#F59E0B" 
                strokeWidth={1}
                dot={false}
                name="EMA3"
              />
              <Line 
                type="monotone" 
                dataKey="ema5" 
                stroke="#EF4444" 
                strokeWidth={1}
                dot={false}
                name="EMA5"
              />
              <Line 
                type="monotone" 
                dataKey="ema21" 
                stroke="#06B6D4" 
                strokeWidth={1}
                dot={false}
                name="EMA21"
              />
              <Line 
                type="monotone" 
                dataKey="ema30" 
                stroke="#EC4899" 
                strokeWidth={1}
                dot={false}
                name="EMA30"
              />
              
              {/* Support/Resistance levels */}
              {vivienneSignificantSupport && typeof vivienneSignificantSupport === 'number' && (
                <ReferenceLine y={vivienneSignificantSupport} stroke="#10B981" strokeDasharray="3 3" name="Vivienne Support" />
              )}
              {vivienneSignificantResistance && typeof vivienneSignificantResistance === 'number' && (
                <ReferenceLine y={vivienneSignificantResistance} stroke="#EF4444" strokeDasharray="3 3" name="Vivienne Resistance" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* RSI Chart */}
        <div className="bg-gray-900 border border-gray-700 p-2">
          <div className="text-green-400 font-bold mb-2">RSI</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
              <Line 
                type="monotone" 
                dataKey="rsi" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={false}
              />
              <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* MACD Chart */}
        <div className="bg-gray-900 border border-gray-700 p-2">
          <div className="text-green-400 font-bold mb-2">MACD</div>
          <ResponsiveContainer width="100%" height={150}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
              <Legend />
              <Line 
                type="monotone" 
                dataKey="macd" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={false}
                name="MACD"
              />
              <Line 
                type="monotone" 
                dataKey="macd_signal" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={false}
                name="Signal"
              />
              <Bar 
                dataKey="macd_histogram" 
                fill="#8B5CF6" 
                name="Histogram"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>



        {/* Volume Chart */}
        <div className="bg-gray-900 border border-gray-700 p-2">
          <div className="text-green-400 font-bold mb-2">VOLUME</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
              <Bar 
                dataKey="volume" 
                fill="#8B5CF6" 
                name="Volume"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>



        {/* ATR Chart */}
        <div className="bg-gray-900 border border-gray-700 p-2">
          <div className="text-green-400 font-bold mb-2">ATR (AVERAGE TRUE RANGE)</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
              <Legend />
              <Line 
                type="monotone" 
                dataKey="atr" 
                stroke="#06B6D4" 
                strokeWidth={2}
                dot={false}
                name="ATR"
              />
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
              <div key={index} className="bg-gray-900 border border-gray-700 p-2 rounded">
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
              <div key={filterName} className="bg-gray-900 border border-gray-700 p-2 rounded">
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
              <div className="bg-gray-900 border border-gray-700 p-2 rounded">
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
