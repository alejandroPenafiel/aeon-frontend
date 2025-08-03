import React, { useState } from 'react';
import { 
  sendTempestConfigUpdate, 
  sendSingleParameterUpdate, 
  TempestConfigExamples,
  createROEThresholdUpdate,
  createStopLossTakeProfitUpdate,
  createATRStopLossUpdate,
  createUnrealizedPnLUpdate,
  type TempestStrategyName 
} from '../utils/tempestConfigUtils';

interface TempestConfigExampleProps {
  sendMessage?: (message: any) => void;
  selectedAsset?: string;
}

/**
 * Example component demonstrating Tempest WebSocket message format
 * 
 * This component shows how to send various types of Tempest configuration
 * updates using the exact message format specified.
 */
export const TempestConfigExample: React.FC<TempestConfigExampleProps> = ({ 
  sendMessage, 
  selectedAsset = "BTC" 
}) => {
  const [roeThreshold, setRoeThreshold] = useState(0.20);
  const [roeTakeProfit, setRoeTakeProfit] = useState(0.25);
  const [stopLossPct, setStopLossPct] = useState(0.03);
  const [takeProfitPct, setTakeProfitPct] = useState(0.05);
  const [atrMultiplier, setAtrMultiplier] = useState(2.5);
  const [useTrailingStop, setUseTrailingStop] = useState(true);

  const handleROEThresholdUpdate = () => {
    if (!sendMessage) return;
    
    // Example 1: ROE Threshold Update
    const message = createROEThresholdUpdate(selectedAsset, roeThreshold, roeTakeProfit);
    sendMessage(message);
    console.log('📤 ROE Threshold Update sent:', message);
  };

  const handleStopLossTakeProfitUpdate = () => {
    if (!sendMessage) return;
    
    // Example 2: Multiple Strategy Update
    const message = createStopLossTakeProfitUpdate(selectedAsset, stopLossPct, takeProfitPct);
    sendMessage(message);
    console.log('📤 Stop Loss Take Profit Update sent:', message);
  };

  const handleATRStrategyUpdate = () => {
    if (!sendMessage) return;
    
    // Example 3: ATR Strategy Update
    const message = createATRStopLossUpdate(selectedAsset, atrMultiplier, false, useTrailingStop);
    sendMessage(message);
    console.log('📤 ATR Strategy Update sent:', message);
  };

  const handleUnrealizedPnLUpdate = () => {
    if (!sendMessage) return;
    
    // Example 4: UnrealizedPnL Strategy Update
    const message = createUnrealizedPnLUpdate(
      selectedAsset,
      1.5, // stop_loss_multiplier
      [1.2, 1.5, 2.0], // threshold multipliers
      [0.001, 0.002, 0.003] // retracement values
    );
    sendMessage(message);
    console.log('📤 UnrealizedPnL Strategy Update sent:', message);
  };

  const handleMultipleStrategiesUpdate = () => {
    if (!sendMessage) return;
    
    // Example 5: Multiple Strategies Update
    const message = {
      type: "tempest_config_update",
      asset: selectedAsset,
      config: {
        ROEThresholdStrategy: {
          roe_threshold: roeThreshold,
          roe_take_profit: roeTakeProfit
        },
        StopLossTakeProfitStrategy: {
          stop_loss_pct: stopLossPct,
          take_profit_pct: takeProfitPct
        },
        ATRStopLossStrategy: {
          atr_multiplier: atrMultiplier,
          move_to_breakeven: false,
          use_trailing_stop: useTrailingStop
        }
      }
    };
    
    sendMessage(message);
    console.log('📤 Multiple Strategies Update sent:', message);
  };

  const handleSingleParameterUpdate = (strategyName: TempestStrategyName, paramName: string, value: any) => {
    if (!sendMessage) return;
    
    sendSingleParameterUpdate(sendMessage, selectedAsset, strategyName, paramName, value);
  };

  const handleExampleUpdates = () => {
    if (!sendMessage) return;
    
    // Use the example functions from TempestConfigExamples
    TempestConfigExamples.updateROEThreshold(sendMessage);
    TempestConfigExamples.updateMultipleStrategies(sendMessage);
    TempestConfigExamples.updateATRStrategy(sendMessage);
  };

  return (
    <div className="w-full bg-black border border-gray-700 p-4 mb-4">
      <h3 className="text-lg font-bold text-orange-400 mb-4">TEMPEST CONFIG EXAMPLES</h3>
      
      <div className="space-y-4">
        {/* ROE Threshold Section */}
        <div className="bg-gray-900 p-4 border border-gray-600">
          <h4 className="text-orange-400 font-semibold mb-2">ROE Threshold Strategy</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-400">ROE Threshold:</label>
              <input
                type="number"
                step="0.01"
                value={roeThreshold}
                onChange={(e) => setRoeThreshold(parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="text-gray-400">ROE Take Profit:</label>
              <input
                type="number"
                step="0.01"
                value={roeTakeProfit}
                onChange={(e) => setRoeTakeProfit(parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
              />
            </div>
          </div>
          <button
            onClick={handleROEThresholdUpdate}
            className="mt-2 px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
          >
            Update ROE Threshold
          </button>
        </div>

        {/* Stop Loss Take Profit Section */}
        <div className="bg-gray-900 p-4 border border-gray-600">
          <h4 className="text-blue-400 font-semibold mb-2">Stop Loss Take Profit Strategy</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-400">Stop Loss %:</label>
              <input
                type="number"
                step="0.01"
                value={stopLossPct}
                onChange={(e) => setStopLossPct(parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="text-gray-400">Take Profit %:</label>
              <input
                type="number"
                step="0.01"
                value={takeProfitPct}
                onChange={(e) => setTakeProfitPct(parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
              />
            </div>
          </div>
          <button
            onClick={handleStopLossTakeProfitUpdate}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Update Stop Loss Take Profit
          </button>
        </div>

        {/* ATR Strategy Section */}
        <div className="bg-gray-900 p-4 border border-gray-600">
          <h4 className="text-purple-400 font-semibold mb-2">ATR Stop Loss Strategy</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-400">ATR Multiplier:</label>
              <input
                type="number"
                step="0.1"
                value={atrMultiplier}
                onChange={(e) => setAtrMultiplier(parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
              />
            </div>
            <div>
              <label className="text-gray-400">Use Trailing Stop:</label>
              <select
                value={useTrailingStop.toString()}
                onChange={(e) => setUseTrailingStop(e.target.value === 'true')}
                className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleATRStrategyUpdate}
            className="mt-2 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
          >
            Update ATR Strategy
          </button>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-900 p-4 border border-gray-600">
          <h4 className="text-green-400 font-semibold mb-2">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleUnrealizedPnLUpdate}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            >
              Update UnrealizedPnL
            </button>
            <button
              onClick={handleMultipleStrategiesUpdate}
              className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
            >
              Update Multiple Strategies
            </button>
            <button
              onClick={handleExampleUpdates}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Run All Examples
            </button>
            <button
              onClick={() => handleSingleParameterUpdate('ROEThresholdStrategy', 'roe_threshold', 0.15)}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Single Parameter Update
            </button>
          </div>
        </div>

        {/* Message Format Display */}
        <div className="bg-gray-900 p-4 border border-gray-600">
          <h4 className="text-cyan-400 font-semibold mb-2">Message Format Examples</h4>
          <div className="space-y-2 text-xs">
            <div className="bg-gray-800 p-2">
              <div className="text-gray-400 mb-1">ROE Threshold Update:</div>
              <pre className="text-green-400">
{`{
  "type": "tempest_config_update",
  "asset": "${selectedAsset}",
  "config": {
    "ROEThresholdStrategy": {
      "roe_threshold": ${roeThreshold}
    }
  }
}`}
              </pre>
            </div>
            <div className="bg-gray-800 p-2">
              <div className="text-gray-400 mb-1">Multiple Strategy Update:</div>
              <pre className="text-blue-400">
{`{
  "type": "tempest_config_update",
  "asset": "${selectedAsset}",
  "config": {
    "ROEThresholdStrategy": {
      "roe_threshold": ${roeThreshold},
      "roe_take_profit": ${roeTakeProfit}
    },
    "StopLossTakeProfitStrategy": {
      "stop_loss_pct": ${stopLossPct},
      "take_profit_pct": ${takeProfitPct}
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 