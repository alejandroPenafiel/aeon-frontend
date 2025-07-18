import React from 'react';
import type { OctaviaAgent as OctaviaAgentData } from '../../websocketTypes';

interface OctaviaAgentProps {
  data: OctaviaAgentData;
}

export const OctaviaAgent: React.FC<OctaviaAgentProps> = ({ data }) => {
  const { indicators, macd_trend, bollinger_context, resistance_levels, support_levels } = data.data || {};
  
  if (!data.data) {
    return (
      <div className="terminal-block mb-4">
        <div className="title-bar">OctaviaAgent</div>
        <div className="p-4 text-yellow-400">
          No data available yet. Waiting for technical analysis...
        </div>
      </div>
    );
  }

  // Helper function to get trend color
  const getTrendColor = (direction: string) => {
    if (!direction) return 'text-gray-400';
    switch (direction.toLowerCase()) {
      case 'bullish':
      case 'up':
      case 'positive':
        return 'text-green-400';
      case 'bearish':
      case 'down':
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  // Helper function to get RSI color
  const getRsiColor = (rsi: number) => {
    if (rsi > 70) return 'text-red-400';
    if (rsi < 30) return 'text-green-400';
    return 'text-white';
  };

  // Helper function to get MACD histogram color
  const getMacdHistogramColor = (histogram: number) => {
    return histogram >= 0 ? 'text-green-400' : 'text-red-400';
  };

  // Helper function to get Bollinger position color
  const getBbPositionColor = (position: string) => {
    switch (position?.toLowerCase()) {
      case 'upper':
        return 'text-red-400';
      case 'lower':
        return 'text-green-400';
      case 'middle':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="terminal-block mb-4">
      <div className="title-bar">OctaviaAgent - Technical Analysis</div>
      
      <div className="p-4 space-y-4">
        {/* Indicators Section */}
        <div className="space-y-2">
          <h3 className="text-purple-400 font-mono text-sm">📊 Indicators</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-purple-400">EMA3:</span>
              <span className="text-white">{indicators?.ema_3?.toFixed(4) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">EMA5:</span>
              <span className="text-white">{indicators?.ema_5?.toFixed(4) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">EMA21:</span>
              <span className="text-white">{indicators?.ema_21?.toFixed(4) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">EMA30:</span>
              <span className="text-white">{indicators?.ema_30?.toFixed(4) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">RSI:</span>
              <span className={getRsiColor(indicators?.rsi || 0)}>
                {indicators?.rsi?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">ATR:</span>
              <span className="text-white">{indicators?.atr?.toFixed(4) || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* MACD Analysis */}
        <div className="space-y-2">
          <h3 className="text-purple-400 font-mono text-sm">📈 MACD Analysis</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-purple-400">MACD Line:</span>
              <span className="text-white">{indicators?.macd?.toFixed(4) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Signal Line:</span>
              <span className="text-white">{indicators?.macd_signal?.toFixed(4) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Histogram:</span>
              <span className={getMacdHistogramColor(indicators?.macd_histogram || 0)}>
                {indicators?.macd_histogram?.toFixed(4) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Trend:</span>
              <span className={getTrendColor(macd_trend?.macd_trend_direction)}>
                {macd_trend?.macd_trend_direction || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div className="space-y-2">
          <h3 className="text-purple-400 font-mono text-sm">📊 Bollinger Bands</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-purple-400">Upper:</span>
              <span className="text-red-400">{indicators?.bb_upper?.toFixed(4) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Middle:</span>
              <span className="text-yellow-400">{indicators?.bb_middle?.toFixed(4) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Lower:</span>
              <span className="text-green-400">{indicators?.bb_lower?.toFixed(4) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Bandwidth:</span>
              <span className="text-white">{bollinger_context?.bb_bandwidth?.toFixed(4) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Position:</span>
              <span className={getBbPositionColor(bollinger_context?.bb_price_position)}>
                {bollinger_context?.bb_price_position || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Squeeze:</span>
              <span className={bollinger_context?.bb_is_in_squeeze ? 'text-yellow-400' : 'text-gray-400'}>
                {bollinger_context?.bb_is_in_squeeze ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="space-y-2">
          <h3 className="text-purple-400 font-mono text-sm">🎯 Support & Resistance</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-purple-400">Significant Support:</span>
              <span className="text-green-400">
                {support_levels?.significant_support?.toFixed(4) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Significant Resistance:</span>
              <span className="text-red-400">
                {resistance_levels?.significant_resistance?.toFixed(4) || 'N/A'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-purple-400">Support Levels:</span>
              <span className="text-green-400 ml-2">
                {support_levels?.support_levels?.length > 0 
                  ? support_levels.support_levels.map(level => level.toFixed(4)).join(', ')
                  : 'None'
                }
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-purple-400">Resistance Levels:</span>
              <span className="text-red-400 ml-2">
                {resistance_levels?.resistance_levels?.length > 0 
                  ? resistance_levels.resistance_levels.map(level => level.toFixed(4)).join(', ')
                  : 'None'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
