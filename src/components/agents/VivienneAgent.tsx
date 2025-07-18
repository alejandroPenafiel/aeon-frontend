import React from 'react';
import type { VivienneAgent as VivienneAgentData } from '../../websocketTypes';

interface VivienneAgentProps {
  data: VivienneAgentData;
}

export const VivienneAgent: React.FC<VivienneAgentProps> = ({ data }) => {
  const { signals, summary, recommendation, macd_trend_direction, chaos_discerned } = data.data;
  
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

  // Helper function to get signal color based on bullish/bearish
  const getSignalColor = (isBullish: boolean | null) => {
    if (isBullish === true) return 'text-green-400';
    if (isBullish === false) return 'text-red-400';
    return 'text-yellow-400';
  };

  // Helper function to get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Helper function to get sentiment color
  const getSentimentColor = (sentiment: string) => {
    if (sentiment.includes('BULLISH') || sentiment.includes('LONG')) return 'text-green-400';
    if (sentiment.includes('BEARISH') || sentiment.includes('SHORT')) return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="terminal-block mb-4">
      <div className="title-bar">VivienneAgent</div>
      
      {/* Debug Section */}
      <div className="p-2 bg-gray-900 border-b border-gray-600">
        <details className="text-xs" open>
          <summary className="text-yellow-400 cursor-pointer">Debug: Raw Vivienne Data</summary>
          <div className="mt-2 space-y-1">
            <div>Has signals: {signals ? signals.length : 0}</div>
            <div>Has summary: {summary ? 'Yes' : 'No'}</div>
            <div>Has recommendation: {recommendation ? 'Yes' : 'No'}</div>
            <div>Recommendation state: {recommendation?.state || 'N/A'}</div>
            <div>MACD trend: {macd_trend_direction || 'N/A'}</div>
            <div>Raw data: {JSON.stringify(data.data, null, 2)}</div>
          </div>
        </details>
      </div>
      
      <div className="p-4 space-y-4">
        {/* MACD Trend Direction */}
        <div>
          <h4 className="font-semibold text-green-400 mb-2">MACD Trend</h4>
          <div className="bg-gray-800 p-2 rounded text-sm">
            <span className={`font-mono ${macd_trend_direction === 'BULLISH' ? 'text-green-400' : 'text-red-400'}`}>
              {macd_trend_direction || 'N/A'}
            </span>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div>
            <h4 className="font-semibold text-green-400 mb-2">Signal Summary</h4>
            <div className="bg-gray-800 p-3 rounded space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Sentiment:</span>
                <span className={`font-mono ${getSentimentColor(summary.sentiment)}`}>
                  {summary.sentiment}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Confidence:</span>
                <span className={`font-mono ${getConfidenceColor(summary.confidence)}`}>
                  {Math.round(summary.confidence * 100)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400">Long Signals:</span>
                  <span className="font-mono text-green-400 ml-1">{summary.long_signals}</span>
                </div>
                <div>
                  <span className="text-gray-400">Short Signals:</span>
                  <span className="font-mono text-red-400 ml-1">{summary.short_signals}</span>
                </div>
                <div>
                  <span className="text-gray-400">Valid Long:</span>
                  <span className="font-mono text-green-400 ml-1">{summary.valid_long_signals}</span>
                </div>
                <div>
                  <span className="text-gray-400">Valid Short:</span>
                  <span className="font-mono text-red-400 ml-1">{summary.valid_short_signals}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendation */}
        {recommendation && (
          <div>
            <h4 className="font-semibold text-green-400 mb-2">Recommendation</h4>
            <div className="bg-gray-800 p-3 rounded space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">State:</span>
                <span className={`font-mono ${getSentimentColor(recommendation.state)}`}>
                  {recommendation.state}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Position Type:</span>
                <span className={`font-mono ${getSentimentColor(recommendation.position_type)}`}>
                  {recommendation.position_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Position Size:</span>
                <span className="font-mono text-blue-400">{recommendation.position_size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Confidence:</span>
                <span className={`font-mono ${getConfidenceColor(recommendation.total_weighted_confidence)}`}>
                  {Math.round(recommendation.total_weighted_confidence * 100)}%
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                <div className="font-semibold mb-1">Reasoning:</div>
                <div className="text-gray-300">{recommendation.reasoning}</div>
              </div>
            </div>
          </div>
        )}

        {/* Active Signals */}
        <div>
          <h4 className="font-semibold text-green-400 mb-2">Active Signals</h4>
          <div className="space-y-2">
            {signals && signals.length > 0 ? (
              signals.map((signal, index) => (
                <div key={index} className="bg-gray-800 p-3 rounded border-l-4 border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-blue-400 text-sm">{signal.name}</h5>
                    <div className="flex space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(signal.confidence)}`}>
                        {Math.round(signal.confidence * 100)}%
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-700">
                        W: {signal.weight}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className={`font-mono ${getSignalColor(signal.is_bullish)}`}>
                      Direction: {signal.is_bullish === true ? 'BULLISH' : signal.is_bullish === false ? 'BEARISH' : 'NEUTRAL'}
                    </div>
                    <div className="text-gray-400">
                      {signal.details}
                    </div>
                    <div className="text-gray-500">
                      Category: {signal.category}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 p-3 rounded text-center text-yellow-400 text-sm">
                No active signals detected. Waiting for signal conditions...
              </div>
            )}
          </div>
        </div>

        {/* Chaos Discerned (if available) */}
        {chaos_discerned && (
          <div>
            <h4 className="font-semibold text-green-400 mb-2">Chaos Analysis</h4>
            <div className="bg-gray-800 p-3 rounded space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Sentiment:</span>
                <span className={`font-mono ${getSentimentColor(chaos_discerned.sentiment)}`}>
                  {chaos_discerned.sentiment}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                <div className="font-semibold mb-1">Reasoning:</div>
                <div className="text-gray-300">{chaos_discerned.reasoning}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
