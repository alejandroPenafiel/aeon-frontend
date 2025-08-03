import React, { useState, useEffect } from 'react';
import { useTempestConfigCache } from '../utils/tempestConfigCache';
import { sendTempestConfigUpdate } from '../utils/tempestConfigUtils';

interface TempestConfigCacheExampleProps {
  sendMessage?: (message: any) => void;
  selectedAsset?: string;
  tempestConfig?: any; // Original config from WebSocket
}

/**
 * Example component demonstrating the cache system for Tempest configuration
 * 
 * This component shows how the cache preserves unsaved changes even when
 * the backend updates rapidly.
 */
export const TempestConfigCacheExample: React.FC<TempestConfigCacheExampleProps> = ({ 
  sendMessage, 
  selectedAsset = "BTC",
  tempestConfig 
}) => {
  const [roeThreshold, setRoeThreshold] = useState(0.20);
  const [atrMultiplier, setAtrMultiplier] = useState(2.5);
  const [showCacheStatus, setShowCacheStatus] = useState(false);

  // Initialize cache hook
  const cache = useTempestConfigCache(selectedAsset);

  // Initialize cache when config data changes
  useEffect(() => {
    if (selectedAsset && tempestConfig) {
      const cachedConfig = cache.getCachedConfig();
      if (!cachedConfig) {
        cache.initializeCache(tempestConfig);
        console.log('📦 Cache initialized for', selectedAsset);
      }
    }
  }, [selectedAsset, tempestConfig, cache]);

  // Update local state when cache changes
  useEffect(() => {
    const cachedConfig = cache.getCachedConfig();
    if (cachedConfig) {
      setRoeThreshold(cachedConfig.ROEThresholdStrategy?.roe_threshold ?? 0.20);
      setAtrMultiplier(cachedConfig.ATRStopLossStrategy?.atr_multiplier ?? 2.5);
    }
  }, [cache]);

  const handleROEThresholdChange = (value: number) => {
    setRoeThreshold(value);
    cache.updateParameter('ROEThresholdStrategy', 'roe_threshold', value);
    console.log(`📝 ROE threshold updated in cache: ${value}`);
  };

  const handleATRMultiplierChange = (value: number) => {
    setAtrMultiplier(value);
    cache.updateParameter('ATRStopLossStrategy', 'atr_multiplier', value);
    console.log(`📝 ATR multiplier updated in cache: ${value}`);
  };

  const handleSaveChanges = () => {
    if (!sendMessage) return;

    const changes = cache.getChanges();
    if (Object.keys(changes).length === 0) {
      console.log('📝 No changes to save');
      return;
    }

    sendTempestConfigUpdate(sendMessage, selectedAsset, changes);
    cache.markAsSaved();
    console.log('✅ Changes saved successfully');
  };

  const handleResetToOriginal = () => {
    cache.resetToOriginal();
    console.log('🔄 Reset to original values');
  };

  const handleClearCache = () => {
    cache.clearCache();
    console.log('🗑️ Cache cleared');
  };

  return (
    <div className="w-full bg-black border border-gray-700 p-4 mb-4">
      <h3 className="text-lg font-bold text-orange-400 mb-4">TEMPEST CACHE EXAMPLE</h3>
      
      {/* Cache Status Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Asset:</span>
          <span className="text-blue-400 font-bold">{selectedAsset}</span>
          
          {cache.hasUnsavedChanges() && (
            <span className="px-2 py-1 text-xs font-mono bg-yellow-600 text-white animate-pulse">
              UNSAVED CHANGES
            </span>
          )}
        </div>
        
        <button
          onClick={() => setShowCacheStatus(!showCacheStatus)}
          className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
        >
          📦 Cache Status
        </button>
      </div>

      {/* Cache Status Display */}
      {showCacheStatus && (
        <div className="mb-4 p-3 bg-gray-900 border border-gray-600">
          <h4 className="text-cyan-400 font-semibold mb-2">Cache Status</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Has Unsaved Changes:</span>
              <span className={`font-bold ${cache.hasUnsavedChanges() ? 'text-yellow-400' : 'text-green-400'}`}>
                {cache.hasUnsavedChanges() ? 'YES' : 'NO'}
              </span>
            </div>
            {cache.hasUnsavedChanges() && (
              <div className="mt-2 p-2 bg-yellow-900 border border-yellow-600">
                <div className="text-yellow-300 text-xs mb-1">Changes:</div>
                <pre className="text-yellow-200 text-xs">
                  {JSON.stringify(cache.getChanges(), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Controls */}
      <div className="space-y-4">
        {/* ROE Threshold Control */}
        <div className="bg-gray-900 p-4 border border-gray-600">
          <h4 className="text-orange-400 font-semibold mb-2">ROE Threshold Strategy</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-gray-400 text-sm">ROE Threshold:</label>
              <input
                type="number"
                step="0.01"
                value={roeThreshold}
                onChange={(e) => handleROEThresholdChange(parseFloat(e.target.value))}
                className="w-24 bg-gray-700 border border-gray-600 px-2 py-1 text-white text-sm"
              />
              <span className="text-xs text-gray-500">
                {(() => {
                  const isModified = cache.getChanges()?.ROEThresholdStrategy?.roe_threshold !== undefined;
                  return isModified ? '(Modified)' : '(Original)';
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* ATR Multiplier Control */}
        <div className="bg-gray-900 p-4 border border-gray-600">
          <h4 className="text-blue-400 font-semibold mb-2">ATR Stop Loss Strategy</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-gray-400 text-sm">ATR Multiplier:</label>
              <input
                type="number"
                step="0.1"
                value={atrMultiplier}
                onChange={(e) => handleATRMultiplierChange(parseFloat(e.target.value))}
                className="w-24 bg-gray-700 border border-gray-600 px-2 py-1 text-white text-sm"
              />
              <span className="text-xs text-gray-500">
                {(() => {
                  const isModified = cache.getChanges()?.ATRStopLossStrategy?.atr_multiplier !== undefined;
                  return isModified ? '(Modified)' : '(Original)';
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-900 p-4 border border-gray-600">
          <h4 className="text-green-400 font-semibold mb-2">Actions</h4>
          <div className="flex space-x-2">
            <button
              onClick={handleSaveChanges}
              disabled={!cache.hasUnsavedChanges()}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
            <button
              onClick={handleResetToOriginal}
              disabled={!cache.hasUnsavedChanges()}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Reset to Original
            </button>
            <button
              onClick={handleClearCache}
              className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
            >
              Clear Cache
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-900 p-4 border border-gray-600">
          <h4 className="text-purple-400 font-semibold mb-2">How to Test</h4>
          <div className="text-xs space-y-1 text-gray-300">
            <p>1. Change the ROE Threshold or ATR Multiplier values</p>
            <p>2. Notice the "UNSAVED CHANGES" indicator appears</p>
            <p>3. Even if the backend updates rapidly, your changes are preserved</p>
            <p>4. Click "Save Changes" to send the modified config to the backend</p>
            <p>5. Click "Reset to Original" to discard changes</p>
            <p>6. Click "Clear Cache" to remove all cached data</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 