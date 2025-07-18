import React from 'react';
import type { AgathaAgent as AgathaAgentData } from '../../websocketTypes';

interface AgathaAgentProps {
  data: AgathaAgentData;
}

export const AgathaAgent: React.FC<AgathaAgentProps> = ({ data }) => {
  const processedSignals = data.data?.processed_signals;
  
  if (!processedSignals) {
    return (
      <div className="terminal-block mb-4">
        <div className="title-bar">AgathaAgent</div>
        <div className="p-4 text-yellow-400">
          No processed signals available yet. Waiting for signal generation...
        </div>
      </div>
    );
  }

  const { signals, indicators, status, price } = processedSignals;

  // Helper function to get signal color based on signal type
  const getSignalColor = (signal: string) => {
    if (signal.includes('BUY') || signal.includes('BULLISH')) return 'text-green-400';
    if (signal.includes('SELL') || signal.includes('BEARISH')) return 'text-red-400';
    if (signal.includes('HOLD') || signal.includes('NEUTRAL')) return 'text-yellow-400';
    return 'text-gray-400';
  };

  // Helper function to get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="terminal-block mb-4">
      <div className="title-bar">AgathaAgent</div>
      <div className="p-4 space-y-4">
        {/* Status and Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-green-400 mb-2">Status</h4>
            <div className="bg-gray-800 p-2 rounded text-sm">
              <span className={`font-mono ${status === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400'}`}>
                {status}
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-green-400 mb-2">Current Price</h4>
            <div className="bg-gray-800 p-2 rounded text-sm">
              <span className="font-mono text-blue-400">${price?.toFixed(4) || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Key Indicators */}
        <div>
          <h4 className="font-semibold text-green-400 mb-2">Key Indicators</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400">RSI:</span>
              <span className="font-mono text-purple-400 ml-1">{indicators?.rsi?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400">MACD:</span>
              <span className="font-mono text-cyan-400 ml-1">{indicators?.macd?.toFixed(4) || 'N/A'}</span>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400">ATR:</span>
              <span className="font-mono text-orange-400 ml-1">{indicators?.atr?.toFixed(4) || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Signals */}
        <div>
          <h4 className="font-semibold text-green-400 mb-2">Active Signals</h4>
          <div className="space-y-2">
            {Object.entries(signals || {}).map(([signalName, signalDetails]) => (
              <div key={signalName} className="bg-gray-800 p-3 rounded border-l-4 border-gray-600">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-semibold text-blue-400 text-sm uppercase">{signalName.replace(/_/g, ' ')}</h5>
                  <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(signalDetails.confidence)}`}>
                    {Math.round(signalDetails.confidence * 100)}%
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className={`font-mono ${getSignalColor(signalDetails.signal)}`}>
                    Signal: {signalDetails.signal}
                  </div>
                  <div className="text-gray-400">
                    {signalDetails.details}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Support:</span>
                      <span className={`ml-1 ${signalDetails.near_support ? 'text-green-400' : 'text-gray-400'}`}>
                        {signalDetails.near_support ? 'Near' : 'Far'} ({signalDetails.support_distance?.toFixed(2) || 'N/A'})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Resistance:</span>
                      <span className={`ml-1 ${signalDetails.near_resistance ? 'text-red-400' : 'text-gray-400'}`}>
                        {signalDetails.near_resistance ? 'Near' : 'Far'} ({signalDetails.resistance_distance?.toFixed(2) || 'N/A'})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(!signals || Object.keys(signals).length === 0) && (
              <div className="bg-gray-800 p-3 rounded text-center text-yellow-400 text-sm">
                No active signals detected. Waiting for signal conditions...
              </div>
            )}
          </div>
        </div>

        {/* Support/Resistance Levels */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-green-400 mb-2">Support Levels</h4>
            <div className="bg-gray-800 p-2 rounded text-sm">
              <div className="font-mono text-green-400">
                Significant: {indicators?.significant_support?.toFixed(4) || 'N/A'}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                Levels: {indicators?.support_levels?.map(level => level.toFixed(4)).join(', ') || 'None'}
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-green-400 mb-2">Resistance Levels</h4>
            <div className="bg-gray-800 p-2 rounded text-sm">
              <div className="font-mono text-red-400">
                Significant: {indicators?.significant_resistance?.toFixed(4) || 'N/A'}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                Levels: {indicators?.resistance_levels?.map(level => level.toFixed(4)).join(', ') || 'None'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
