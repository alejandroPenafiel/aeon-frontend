import React from 'react';
import type { VivienneAgent as VivienneAgentData } from '../../websocketTypes';

interface VivienneAgentProps {
  data: VivienneAgentData;
}

export const VivienneAgent: React.FC<VivienneAgentProps> = ({ data }) => {
  return (
    <div className="terminal-block mb-4">
      <div className="title-bar">VivienneAgent</div>
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
    </div>
  );
};
