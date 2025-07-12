import React from 'react';
import type { Sentiment, TrendDirection } from '../types';

interface ChaosEnginePanelProps {
  reasoning: string;
  metrics: {
    numValidSignals: number;
    totalAdjWeight: number;
    avgConfidence: number;
    longConfidenceWeight: number;
    shortConfidenceWeight: number;
  };
  sentiment: Sentiment;
  macdTrend: TrendDirection;
}

const ChaosEnginePanel: React.FC<ChaosEnginePanelProps> = ({
  reasoning,
  metrics,
  sentiment,
  macdTrend,
}) => {
  return (
    <div className="terminal-block">
      <div className="terminal-block-header">Chaos Engine</div>
      <div className="p-4">
        <p className="font-bold">{sentiment} ({macdTrend})</p>
        <p className="text-sm italic my-2">{reasoning}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p><strong>Valid Signals:</strong> {metrics.numValidSignals}</p>
            <p><strong>Total Weight:</strong> {metrics.totalAdjWeight.toFixed(2)}</p>
            <p><strong>Avg. Confidence:</strong> {(metrics.avgConfidence * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p><strong>Long Weight:</strong> {metrics.longConfidenceWeight.toFixed(2)}</p>
            <p><strong>Short Weight:</strong> {metrics.shortConfidenceWeight.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChaosEnginePanel; 