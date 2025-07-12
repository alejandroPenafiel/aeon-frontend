
import React from 'react';

// --- TYPE DEFINITIONS ---
interface Signal {
  name: string;
  value: boolean;
  weight: number;
  confidence: number;
  is_bullish: boolean | null;
  details: string;
  category: string;
  timestamp: string | null;
}

interface Decision {
  sentiment: string;
  position_type: string;
  position_size: number;
  state: string;
  reasoning: string;
}

interface AssetData {
  signals: Signal[];
  decision: Decision;
  // Add other properties from the payload if needed, like summary, etc.
}

interface SignalsFeedProps {
  data: {
    [assetName: string]: AssetData;
  } | null;
}

const formatKey = (key: string) => {
    return key.replace(/_/g, ' ').toUpperCase();
};

const SentimentIndicator = ({ sentiment }: { sentiment: string }) => {
    const color = sentiment === 'bullish' ? 'text-green-400' : sentiment === 'bearish' ? 'text-red-400' : 'text-yellow-400';
    const indicator = sentiment === 'bullish' ? '▲' : sentiment === 'bearish' ? '▼' : '●';
    return <span className={color}>{indicator} {sentiment.toUpperCase()}</span>;
};

// --- MAIN COMPONENT ---
export function SignalsFeed({ data }: SignalsFeedProps) {
  console.log("SignalsFeed received data:", data); // <-- DEBUG LOG
  if (!data) {
    return <div className="terminal-block">Waiting for Signal Feed...</div>;
  }

  // Filter out non-asset keys like 'vivienne_config' or 'artemis_user_state'
  const assetKeys = Object.keys(data).filter(key => 
    typeof data[key] === 'object' && data[key] !== null && 'signals' in data[key] && 'decision' in data[key]
  );

  if (assetKeys.length === 0) {
    return <div className="terminal-block">No asset signals detected in payload.</div>;
  }

  return (
    <div>
      {assetKeys.map((assetName) => {
        const assetData = data[assetName];
        const { decision, signals } = assetData;

        return (
          <div key={assetName} className="terminal-block mb-8">
            <div className="title-bar">📈 {assetName} SIGNALS</div>
            
            {/* Recommendation Section */}
            <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-bold mb-2 text-purple-400">Recommendation: <SentimentIndicator sentiment={decision.sentiment} /></h3>
                <p className="font-mono text-sm"><span className="text-yellow-400">STATE:</span> {decision.state.toUpperCase()} | <span className="text-yellow-400">POSITION:</span> {decision.position_type} ({decision.position_size}%)</p>
                <p className="mt-2 text-xs text-gray-400">{decision.reasoning}</p>
            </div>

            {/* Signals Table */}
            <table className="terminal-body w-full">
              <thead>
                <tr>
                  <th className="text-left">CATEGORY</th>
                  <th className="text-left">SIGNAL</th>
                  <th className="text-left">BULLISH?</th>
                  <th className="text-left">CONF</th>
                  <th className="text-left">DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((signal) => (
                  <tr key={signal.name}>
                    <td className="text-purple-400">{signal.category}</td>
                    <td>{formatKey(signal.name)}</td>
                    <td><SentimentIndicator sentiment={signal.is_bullish ? 'bullish' : (signal.is_bullish === false ? 'bearish' : 'neutral')} /></td>
                    <td>{(signal.confidence * 100).toFixed(0)}%</td>
                    <td className="text-xs text-gray-500">{signal.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
} 