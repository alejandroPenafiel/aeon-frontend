import React from 'react';
import type { AgathaAgent as AgathaAgentData } from '../../websocketTypes';

interface AgathaAgentProps {
  data: AgathaAgentData;
}

// Remove AgathaChart and all chart-related code

export const AgathaAgent: React.FC<AgathaAgentProps> = ({ data }) => {
  // Remove price extraction and chart rendering
  return (
    <div className="terminal-block mb-4">
      <div className="title-bar">AgathaAgent</div>
      <div className="grid grid-cols-2 gap-4 p-4">
        <div>
          <h4 className="font-semibold text-green-400">Data:</h4>
          <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(data.data, null, 2)}
          </pre>
        </div>
        <div>
          <h4 className="font-semibold text-green-400">Config:</h4>
          <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(data.config, null, 2)}
          </pre>
        </div>
      </div>
      {/* Chart removed */}
    </div>
  );
};
