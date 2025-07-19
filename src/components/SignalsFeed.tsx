import React from 'react';
import type { WebSocketData, AssetData } from '../websocketTypes';

interface SignalsFeedProps {
  fullMessage: WebSocketData | null;
  selectedAsset: string | null;
}

interface SignalEvent {
  id: string;
  timestamp: number;
  agent: string;
  signal: string;
  confidence: number;
  details: string;
  type: 'buy' | 'sell' | 'hold' | 'info' | 'state';
  priority: 'high' | 'medium' | 'low';
}

export const SignalsFeed: React.FC<SignalsFeedProps> = ({ fullMessage, selectedAsset }) => {
  const [signals, setSignals] = React.useState<SignalEvent[]>([]);

  React.useEffect(() => {
    if (!fullMessage || !selectedAsset) return;

    const assetData: AssetData | null = fullMessage.data?.[selectedAsset];
    if (!assetData?.agents) return;

    const newSignals: SignalEvent[] = [];
    const timestamp = Date.now();

    // Process Agatha signals
    const agathaData = assetData.agents.AgathaAgent?.data;
    if (agathaData?.processed_signals?.signals) {
      Object.entries(agathaData.processed_signals.signals).forEach(([signalName, signalDetails]) => {
        if (signalDetails.signal && signalDetails.signal !== 'NEUTRAL') {
          const signalType = signalDetails.signal.includes('BUY') || signalDetails.signal.includes('BULLISH') 
            ? 'buy' 
            : signalDetails.signal.includes('SELL') || signalDetails.signal.includes('BEARISH') 
            ? 'sell' 
            : 'hold';

          newSignals.push({
            id: `agatha-${signalName}-${timestamp}`,
            timestamp,
            agent: 'Agatha',
            signal: signalDetails.signal,
            confidence: signalDetails.confidence,
            details: signalDetails.details,
            type: signalType,
            priority: signalDetails.confidence > 0.7 ? 'medium' : 'low'
          });
        }
      });
    }

    // Process Vivienne signals
    const vivienneData = assetData.agents.VivienneAgent?.data;
    if (vivienneData?.signals) {
      vivienneData.signals.forEach((signal, index) => {
        if (signal.value && signal.is_bullish !== null) {
          const signalType = signal.is_bullish ? 'buy' : 'sell';
          newSignals.push({
            id: `vivienne-${signal.name}-${timestamp}-${index}`,
            timestamp,
            agent: 'Vivienne',
            signal: signal.name,
            confidence: signal.confidence,
            details: signal.details,
            type: signalType,
            priority: signal.confidence > 0.7 ? 'medium' : 'low'
          });
        }
      });
    }

    // Process Vivienne recommendation - Make this more prominent
    if (vivienneData?.recommendation?.state && vivienneData.recommendation.state !== 'IDLE') {
      console.log('Vivienne recommendation found:', vivienneData.recommendation);
      const state = vivienneData.recommendation.state.toLowerCase();
      const isBang = state === 'bang';
      const isAim = state === 'aim';
      const isLoaded = state === 'loaded';
      
      newSignals.push({
        id: `vivienne-recommendation-${timestamp}`,
        timestamp,
        agent: 'Vivienne',
        signal: `🚨 ${vivienneData.recommendation.state.toUpperCase()} 🚨`,
        confidence: vivienneData.recommendation.total_weighted_confidence,
        details: vivienneData.recommendation.reasoning,
        type: 'state',
        priority: isBang ? 'high' : isAim ? 'medium' : 'low'
      });
    } else {
      console.log('Vivienne recommendation check:', {
        hasRecommendation: !!vivienneData?.recommendation,
        state: vivienneData?.recommendation?.state,
        isIdle: vivienneData?.recommendation?.state === 'IDLE'
      });
    }

    // Add new signals to the feed
    if (newSignals.length > 0) {
      setSignals(prev => [...newSignals, ...prev].slice(0, 50)); // Keep last 50 signals
    }
  }, [fullMessage, selectedAsset]);

  const getSignalColor = (type: string, priority: string) => {
    // Special styling for state signals
    if (type === 'state') {
      switch (priority) {
        case 'high': return 'signal-high-priority';
        case 'medium': return 'signal-medium-priority';
        case 'low': return 'text-yellow-400 border-yellow-500 bg-yellow-900 bg-opacity-20';
        default: return 'text-blue-400 border-blue-500 bg-blue-900 bg-opacity-20';
      }
    }
    
    // Regular signal styling
    switch (type) {
      case 'buy': return 'text-green-400 border-green-500';
      case 'sell': return 'text-red-400 border-red-500';
      case 'hold': return 'text-yellow-400 border-yellow-500';
      default: return 'text-blue-400 border-blue-500';
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'Agatha': return 'text-purple-400';
      case 'Vivienne': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityIcon = (priority: string, type: string) => {
    if (type === 'state') {
      switch (priority) {
        case 'high': return '🚨';
        case 'medium': return '🎯';
        case 'low': return '⚡';
        default: return '📊';
      }
    }
    return '';
  };

  return (
    <div className="terminal-block mb-4">
      <div className="title-bar">SIGNALS FEED</div>
      <div className="p-4">
        {signals.length === 0 ? (
          <div className="text-center text-yellow-400 text-sm py-8">
            No signals detected yet. Waiting for agent signal generation...
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {signals.map((signal) => (
              <div 
                key={signal.id} 
                className={`bg-gray-800 p-3 rounded border-l-4 transition-all duration-300 ${
                  getSignalColor(signal.type, signal.priority)
                } ${signal.priority === 'high' ? 'ring-2 ring-red-400 ring-opacity-50 animate-pulse' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold text-sm ${getAgentColor(signal.agent)}`}>
                      {signal.agent}
                    </span>
                    {getPriorityIcon(signal.priority, signal.type) && (
                      <span className="text-lg">{getPriorityIcon(signal.priority, signal.type)}</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {Math.round(signal.confidence * 100)}%
                  </span>
                </div>
                <div className={`font-mono text-sm mb-1 ${signal.type === 'state' ? 'font-bold text-lg' : ''}`}>
                  {signal.signal}
                </div>
                <div className="text-xs text-gray-400">
                  {signal.details}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 