import React from 'react';
import type { Signal } from '../types';

interface SortedSignalsGridProps {
  sortingSignals: {
    LONG: Signal[];
    SHORT: Signal[];
    NEUTRAL: Signal[];
  };
}

const SignalCard: React.FC<{ signal: Signal }> = ({ signal }) => (
  <div className="border border-gray-700 p-2 text-xs">
    <p><strong>{signal.name}</strong></p>
    <p>Sentiment: {signal.sentiment}</p>
    <p>Weight: {signal.weight.toFixed(2)}</p>
    <p>Confidence: {(signal.confidence * 100).toFixed(1)}%</p>
  </div>
);

const SortedSignalsGrid: React.FC<SortedSignalsGridProps> = ({ sortingSignals }) => {
  const { LONG = [], SHORT = [], NEUTRAL = [] } = sortingSignals || {};

  return (
    <div className="terminal-block">
      <div className="terminal-block-header">Sorted Signals</div>
      <div className="grid grid-cols-3 gap-4 p-4">
        <div>
          <h3 className="font-bold text-lg text-green-400">Long</h3>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {LONG.map((s) => <SignalCard key={s.id} signal={s} />)}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-lg text-red-400">Short</h3>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {SHORT.map((s) => <SignalCard key={s.id} signal={s} />)}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-400">Neutral</h3>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {NEUTRAL.map((s) => <SignalCard key={s.id} signal={s} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortedSignalsGrid; 