import React from 'react';
import type { VivienneAgent as VivienneAgentData } from '../../websocketTypes';

interface VivienneAgentProps {
  data: VivienneAgentData;
}

export const VivienneAgent: React.FC<VivienneAgentProps> = ({ data }) => {
  const { chaos_discerned, filter_analysis, final_trade_decision } = data.data;
  
  if (!data.data) {
    return (
      <div className="terminal-block mb-4">
        <div className="title-bar">VivienneAgent</div>
        <div className="p-4 text-yellow-400">
          No data available yet. Waiting for signal generation...
        </div>
      </div>
    );
  }

  if (!chaos_discerned) {
    return (
      <div className="terminal-block mb-4">
        <div className="title-bar">VivienneAgent - Chaos Analysis</div>
        <div className="p-4 text-yellow-400">
          No chaos discerned data available. Waiting for analysis...
        </div>
      </div>
    );
  }

  const chaos = chaos_discerned;
  const state = chaos.state || 'idle';

  // Helper function to get state styling
  const getStateStyling = (state: string) => {
    const stateLower = state.toLowerCase();
    switch (stateLower) {
      case 'bang':
        return {
          bgColor: 'state-bang',
          textColor: 'text-white',
          borderColor: 'border-red-500',
          icon: '🚨',
          title: 'CHAOS ANALYSIS - BANG'
        };
      case 'aim':
        return {
          bgColor: 'state-aim',
          textColor: 'text-white',
          borderColor: 'border-orange-500',
          icon: '🎯',
          title: 'CHAOS ANALYSIS - AIM'
        };
      case 'loaded':
        return {
          bgColor: 'state-loaded',
          textColor: 'text-black',
          borderColor: 'border-yellow-500',
          icon: '⚡',
          title: 'CHAOS ANALYSIS - LOADED'
        };
      default:
        return {
          bgColor: 'bg-gray-800 bg-opacity-30',
          textColor: 'text-gray-300',
          borderColor: 'border-gray-600',
          icon: '🌀',
          title: 'CHAOS ANALYSIS - IDLE'
        };
    }
  };

  const styling = getStateStyling(state);

  return (
    <div className="terminal-block mb-4">
      <div className={`title-bar ${styling.bgColor} ${styling.textColor} ${styling.borderColor}`}>
        <span className="mr-2">{styling.icon}</span>
        {styling.title}
      </div>
      
      <div className="p-4">
        {/* Primary Chaos Data - The 4 key fields you requested */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Position Type */}
          <div className="chaos-data-item">
            <div className="chaos-label">Position Type</div>
            <div className={`chaos-value ${chaos.position_type === 'LONG' ? 'text-green-400' : chaos.position_type === 'SHORT' ? 'text-red-400' : 'text-yellow-400'}`}>
              {chaos.position_type || 'NONE'}
            </div>
          </div>

          {/* Sentiment */}
          <div className="chaos-data-item">
            <div className="chaos-label">Sentiment</div>
            <div className={`chaos-value ${chaos.sentiment === 'BULLISH' ? 'text-green-400' : chaos.sentiment === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'}`}>
              {chaos.sentiment || 'NEUTRAL'}
            </div>
          </div>

          {/* Confidence */}
          <div className="chaos-data-item">
            <div className="chaos-label">Confidence</div>
            <div className="chaos-value text-blue-400">
              {chaos.total_weighted_confidence ? `${chaos.total_weighted_confidence.toFixed(2)}%` : '0.00%'}
            </div>
          </div>

          {/* Size */}
          <div className="chaos-data-item">
            <div className="chaos-label">Size</div>
            <div className="chaos-value text-purple-400">
              {chaos.position_size ? `${chaos.position_size}%` : '0%'}
            </div>
          </div>
        </div>

        {/* Detailed Chaos Analysis */}
        <div className="space-y-4">
          {/* State and Signal Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="chaos-data-item">
              <div className="chaos-label">State</div>
              <div className={`chaos-value ${styling.textColor}`}>
                {chaos.state || 'idle'}
              </div>
            </div>
            <div className="chaos-data-item">
              <div className="chaos-label">Valid Signals</div>
              <div className="chaos-value text-cyan-400">
                {chaos.num_valid_signals || 0}
              </div>
            </div>
          </div>

          {/* Weight Analysis */}
          <div className="grid grid-cols-3 gap-4">
            <div className="chaos-data-item">
              <div className="chaos-label">Long Weight</div>
              <div className="chaos-value text-green-400">
                {chaos.long_total_weight ? chaos.long_total_weight.toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="chaos-data-item">
              <div className="chaos-label">Short Weight</div>
              <div className="chaos-value text-red-400">
                {chaos.short_total_weight ? chaos.short_total_weight.toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="chaos-data-item">
              <div className="chaos-label">Total Weight</div>
              <div className="chaos-value text-blue-400">
                {chaos.total_adjusted_weight ? chaos.total_adjusted_weight.toFixed(2) : '0.00'}
              </div>
            </div>
          </div>

          {/* Confidence Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="chaos-data-item">
              <div className="chaos-label">Long Confidence</div>
              <div className="chaos-value text-green-400">
                {chaos.long_weighted_confidence ? `${chaos.long_weighted_confidence.toFixed(2)}%` : '0.00%'}
              </div>
            </div>
            <div className="chaos-data-item">
              <div className="chaos-label">Short Confidence</div>
              <div className="chaos-value text-red-400">
                {chaos.short_weighted_confidence ? `${chaos.short_weighted_confidence.toFixed(2)}%` : '0.00%'}
              </div>
            </div>
            <div className="chaos-data-item">
              <div className="chaos-label">Average Confidence</div>
              <div className="chaos-value text-yellow-400">
                {chaos.average_confidence ? `${chaos.average_confidence.toFixed(2)}%` : '0.00%'}
              </div>
            </div>
          </div>

          {/* Signal Sorting */}
          {chaos.sorting_signals && (
            <div className="grid grid-cols-3 gap-4">
              <div className="chaos-data-item">
                <div className="chaos-label">Long Signals</div>
                <div className="chaos-value text-green-400">
                  {chaos.sorting_signals.long?.length || 0}
                </div>
              </div>
              <div className="chaos-data-item">
                <div className="chaos-label">Short Signals</div>
                <div className="chaos-value text-red-400">
                  {chaos.sorting_signals.short?.length || 0}
                </div>
              </div>
              <div className="chaos-data-item">
                <div className="chaos-label">Neutral Signals</div>
                <div className="chaos-value text-yellow-400">
                  {chaos.sorting_signals.neutral?.length || 0}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reasoning */}
        {chaos.reasoning && (
          <div className="mt-6 p-4 bg-black bg-opacity-30 rounded border border-gray-700">
            <div className="text-sm text-gray-400 mb-2 font-bold">Chaos Analysis Reasoning:</div>
            <div className="text-xs text-gray-300 font-mono leading-relaxed">
              {chaos.reasoning}
            </div>
          </div>
        )}

        {/* Final Trade Decision */}
        {final_trade_decision && (
          <div className="mt-6 p-4 bg-black bg-opacity-30 rounded border border-gray-700">
            <div className="text-sm text-gray-400 mb-2 font-bold">Final Trade Decision:</div>
            <div className={`text-xs font-mono leading-relaxed ${
              final_trade_decision === 'BLOCKED' ? 'text-red-400' : 
              final_trade_decision === 'PASSED' ? 'text-green-400' : 
              'text-yellow-400'
            }`}>
              {final_trade_decision}
            </div>
          </div>
        )}

        {/* Filter Analysis */}
        {filter_analysis && (
          <div className="mt-6 space-y-4">
            <div className="text-sm text-gray-400 font-bold">Filter Analysis:</div>
            
            {/* Trend Filter */}
            <div className="p-3 bg-black bg-opacity-30 rounded border border-gray-700">
              <div className="text-xs text-gray-400 mb-1 font-bold">Trend Filter:</div>
              <div className={`text-xs font-mono ${filter_analysis.trend_filter.status === 'Blocked' ? 'text-red-400' : 'text-green-400'}`}>
                {filter_analysis.trend_filter.status} - {filter_analysis.trend_filter.reason}
              </div>
            </div>

            {/* Volatility Filter */}
            <div className="p-3 bg-black bg-opacity-30 rounded border border-gray-700">
              <div className="text-xs text-gray-400 mb-1 font-bold">Volatility Filter:</div>
              <div className={`text-xs font-mono ${filter_analysis.volatility_filter.status === 'Blocked' ? 'text-red-400' : 'text-green-400'}`}>
                {filter_analysis.volatility_filter.status} - {filter_analysis.volatility_filter.reason}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                BB Bandwidth: {filter_analysis.volatility_filter.bollinger_bandwidth?.toFixed(4)}
              </div>
            </div>

            {/* Levels Filter */}
            <div className="p-3 bg-black bg-opacity-30 rounded border border-gray-700">
              <div className="text-xs text-gray-400 mb-1 font-bold">Levels Filter:</div>
              <div className={`text-xs font-mono ${filter_analysis.levels_filter.status === 'Blocked' ? 'text-red-400' : 'text-green-400'}`}>
                {filter_analysis.levels_filter.status} - {filter_analysis.levels_filter.reason}
              </div>
            </div>

            {/* Underused Alpha Filter */}
            <div className="p-3 bg-black bg-opacity-30 rounded border border-gray-700">
              <div className="text-xs text-gray-400 mb-1 font-bold">Underused Alpha Filter:</div>
              <div className={`text-xs font-mono ${filter_analysis.underused_alpha_filter.status === 'Blocked' ? 'text-red-400' : 'text-green-400'}`}>
                {filter_analysis.underused_alpha_filter.status} - {filter_analysis.underused_alpha_filter.reason}
              </div>
            </div>

            {/* Combined VWAP Filter */}
            <div className="p-3 bg-black bg-opacity-30 rounded border border-gray-700">
              <div className="text-xs text-gray-400 mb-1 font-bold">Combined VWAP Filter:</div>
              <div className={`text-xs font-mono ${filter_analysis.combined_vwap_filter.status === 'Blocked' ? 'text-red-400' : 'text-green-400'}`}>
                {filter_analysis.combined_vwap_filter.status} - {filter_analysis.combined_vwap_filter.reason}
              </div>
            </div>

            {/* Final Trade Decision */}
            {filter_analysis.final_trade_decision && (
              <div className="p-3 bg-black bg-opacity-30 rounded border border-gray-700">
                <div className="text-xs text-gray-400 mb-1 font-bold">Final Trade Decision:</div>
                <div className={`text-xs font-mono ${
                  filter_analysis.final_trade_decision === 'BLOCKED' ? 'text-red-400' : 
                  filter_analysis.final_trade_decision === 'ALLOWED' ? 'text-green-400' : 
                  'text-yellow-400'
                }`}>
                  {filter_analysis.final_trade_decision}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
