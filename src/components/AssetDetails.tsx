import React from 'react';
import type { AssetData, Agents, WebSocketData } from '../websocketTypes';
import {
  OctaviaAgent,
  AgathaAgent,
  VivienneAgent,
  TempestAgent,
  VesperAgent,
  AuroraAgent,
} from './agents';

const agentComponentMap: Record<keyof Agents, React.FC<any>> = {
  AuroraAgent,
  OctaviaAgent,
  AgathaAgent,
  VivienneAgent,
  TempestAgent,
  VesperAgent,
};

interface AssetDetailsProps {
  symbol: string;
  assetData: AssetData;
  fullMessage: WebSocketData; // Add fullMessage prop
}

export const AssetDetails: React.FC<AssetDetailsProps> = ({ symbol, assetData, fullMessage }) => {
  if (!assetData) {
    return <div className="terminal-block">No data available for {symbol}.</div>;
  }

  return (
    <div className="terminal-block">
      <div className="title-bar">{symbol} DETAILS</div>
      {assetData.agents &&
        Object.keys(agentComponentMap).map((agentName) => {
          const agentData = assetData.agents[agentName as keyof Agents];
          const AgentComponent = agentComponentMap[agentName as keyof Agents];
          
          // Special handling for AuroraAgent which expects different props
          if (agentName === 'AuroraAgent' && agentData && AgentComponent) {
            return (
              <AgentComponent 
                key={`${agentName}-${symbol}`} 
                assetSymbol={symbol} 
                fullMessage={fullMessage} 
              />
            );
          }
          
          // Standard handling for other agents
          return agentData && AgentComponent ? (
            <AgentComponent key={agentName} data={agentData} fullMessage={fullMessage} assetSymbol={symbol} />
          ) : null;
        })}
    </div>
  );
};
