import React from 'react';
import type { Sentiment, TrendDirection } from '../types';

interface AssetSummaryBlockProps {
  asset: string;
  sentiment: Sentiment;
  macdTrend: TrendDirection;
  state: string;
  longWeight: number;
  shortWeight: number;
  overallConfidence: number;
  position: string;
}

const AssetSummaryBlock: React.FC<AssetSummaryBlockProps> = ({
  asset,
  sentiment,
  macdTrend,
  state,
  longWeight,
  shortWeight,
  overallConfidence,
  position,
}) => {
  if (!asset) {
    return <div className="terminal-block">No summary available for this asset.</div>;
  }

  return (
    <div className="terminal-block">
      <div className="terminal-block-header">{asset} Summary</div>
      <div className="grid grid-cols-2 gap-4 p-4">
        <div>
          <p><strong>Sentiment:</strong> {sentiment}</p>
          <p><strong>MACD Trend:</strong> {macdTrend}</p>
          <p><strong>State:</strong> {state}</p>
          <p><strong>Position:</strong> {position || 'N/A'}</p>
        </div>
        <div>
          <p><strong>Long Weight:</strong> {longWeight.toFixed(2)}</p>
          <p><strong>Short Weight:</strong> {shortWeight.toFixed(2)}</p>
          <p><strong>Overall Confidence:</strong> {(overallConfidence * 100).toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
};

export default AssetSummaryBlock; 