import React from 'react';
import type { VesperAgent as VesperAgentData } from '../../websocketTypes';

interface VesperAgentProps {
  data: VesperAgentData;
}

export const VesperAgent: React.FC<VesperAgentProps> = ({ data }) => {
  return (
    <div className="terminal-block mb-4">
      <div className="title-bar">VesperAgent</div>
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
