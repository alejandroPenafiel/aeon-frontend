import React from 'react';
import type { AssetData } from '../websocketTypes';

interface AssetDetailsProps {
  symbol: string;
  assetData: AssetData;
}

export const AssetDetails: React.FC<AssetDetailsProps> = ({ symbol, assetData }) => {

  if (!assetData) {
    return <div className="terminal-block">No data available for {symbol}.</div>;
  }

  return (
    <div className="terminal-block">
      <div className="title-bar">{symbol} DETAILS</div>
      {assetData.agents && Object.entries(assetData.agents).map(([agentName, agentData]) => (
        <div key={agentName} className="mb-4">
          <h3 className="text-lg font-bold text-yellow-400">{agentName}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-400">Data:</h4>
              <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(agentData.data, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold text-green-400">Config:</h4>
              <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(agentData.config, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
