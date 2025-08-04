import React, { useState, useEffect } from 'react';
import type { TempestAgent as TempestAgentData } from '../websocketTypes';
import { 
  sendTempestConfigUpdate, 
  sendSingleParameterUpdate, 
  TEMPEST_STRATEGIES,
  validateTempestConfig 
} from '../utils/tempestConfigUtils';
import type { TempestStrategyName } from '../utils/tempestConfigUtils';
import { useTempestConfigCache } from '../utils/tempestConfigCache';

interface MarketClosurePanelProps {
  tempestData: TempestAgentData | undefined;
  sendMessage?: (message: any) => void;
  selectedAsset?: string;
}

// Define the strategy types that can be in the pipeline
const ALL_STRATEGIES = [
  'ROEThresholdStrategy',
  'StopLossTakeProfitStrategy',
  'EMACrossoverStrategy',
  'ATRStopLossStrategy',
  'UnrealizedPnLStrategy',
  'VolatilityStrategy',
  'TrendReversalStrategy'
];

interface TechnicalData {
  current_price: number;
  entry_price: number;
  ema3: number;
  ema21: number;
  atr: number;
  rsi: number;
  macd: number;
  position: any;
  // UnrealizedPnL specific fields
  price_movement?: number;
  max_favorable?: number;
  retracement_from_peak?: number;
  retracement_threshold?: number;
  active_threshold?: string;
  unrealized_pnl?: number;
  is_threshold_1_active?: boolean;
  is_threshold_2_active?: boolean;
  is_threshold_3_active?: boolean;
  is_retracing?: boolean;
  max_favorable_movement?: number;
}

interface StrategyParameters {
  // ROEThresholdStrategy
  min_roe_threshold?: number;
  max_roe_threshold?: number;
  // StopLossTakeProfitStrategy
  stop_loss_percentage?: number;
  take_profit_percentage?: number;
  // EMACrossoverStrategy
  short_ema_period?: number;
  long_ema_period?: number;
  min_difference_percentage?: number;
  // ATRStopLossStrategy
  atr_multiplier?: number;
  move_to_breakeven?: boolean;
  breakeven_trigger?: number;
  use_trailing_stop?: boolean;
  trailing_activation?: number;
  trail_by_atr?: number;
  // UnrealizedPnLStrategy
  stop_loss_multiplier?: number;
  threshold_1_multiplier?: number;
  threshold_2_multiplier?: number;
  threshold_3_multiplier?: number;
  threshold_1_retracement?: number;
  threshold_2_retracement?: number;
  threshold_3_retracement?: number;
}

interface StrategyResult {
  name: string;
  should_close: boolean;
  reason_code: string | null;
  details: string | null;
  confidence: number;
  technical_data: TechnicalData;
  parameters: StrategyParameters;
}

interface ClosureRecommendation {
  should_close: boolean;
  winning_strategy: string;
  reason_code: string;
  details: string;
  confidence: number;
}

interface PositionAnalysis {
  asset: string;
  position_type: string;
  size: number;
  entry_price: number;
  mark_price: number;
  unrealized_pnl: number;
  roe: number;
}

interface TempestAgentDataLocal {
  position_analysis?: PositionAnalysis;
  strategy_results?: StrategyResult[];
  closure_recommendation?: ClosureRecommendation;
  winning_strategy?: string;
  reason_code?: string;
  should_close?: boolean;
  analysis_timestamp?: string;
  execution_status?: string;
  metadata?: {
    asset_symbol: string;
    last_updated: string;
    data_version: string;
  };
}

export const MarketClosurePanel: React.FC<MarketClosurePanelProps> = ({ tempestData, sendMessage, selectedAsset }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [selectedConfigStrategy, setSelectedConfigStrategy] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCacheStatus, setShowCacheStatus] = useState(false);

  // Initialize cache hook
  const cache = useTempestConfigCache(selectedAsset || '');

  // Initialize cache when config data changes
  useEffect(() => {
    if (selectedAsset && tempestData?.config) {
      // Initialize cache with current config if not already cached
      const cachedConfig = cache.getCachedConfig();
      if (!cachedConfig) {
        cache.initializeCache(tempestData.config as any);
        console.log('📦 Cache initialized for', selectedAsset);
      }
    }
  }, [selectedAsset, tempestData?.config]);

  // Initialize config values when editing starts
  useEffect(() => {
    if (editingConfig && selectedAsset) {
      // Use cached config if available, otherwise use original config
      const cachedConfig = cache.getCachedConfig();
      const configToUse = cachedConfig || tempestData?.config;
      
      if (configToUse) {
        const initialValues: Record<string, any> = {};
        
        // Flatten the nested config structure
        Object.entries(configToUse).forEach(([key, value]) => {
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            // This is a strategy object
            Object.entries(value).forEach(([paramName, paramValue]) => {
              initialValues[`${key}.${paramName}`] = paramValue;
            });
          } else {
            // This is a top-level parameter like pause_closure
            initialValues[key] = value;
          }
        });
        
        setConfigValues(initialValues);
      }
    }
  }, [editingConfig, tempestData?.config, selectedAsset]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSaveConfig = () => {
    if (!sendMessage || !selectedAsset) return;

    // Get changes from cache
    const changesFromCache = cache.getChanges();
    
    if (Object.keys(changesFromCache).length === 0) {
      console.log('📝 No changes to save');
      setEditingConfig(false);
      return;
    }

    // Separate top-level changes from strategy changes
    const { 'top-level': topLevelChanges, ...strategyChanges } = changesFromCache;
    const finalChanges: Record<string, any> = { ...strategyChanges };
    if (topLevelChanges) {
      // Add top-level changes to the root of the config
      Object.assign(finalChanges, topLevelChanges);
    }

    // Validate the config before sending
    if (validateTempestConfig(finalChanges)) {
      sendTempestConfigUpdate(sendMessage, selectedAsset, finalChanges);
      cache.markAsSaved();
      setEditingConfig(false);
      console.log('✅ Configuration saved successfully');
    } else {
      console.error('❌ Invalid Tempest configuration');
    }
  };

  const updateSingleParameter = (strategyName: string, paramName: string, value: any) => {
    if (!sendMessage || !selectedAsset) return;

    setIsUpdating(true);

    // Validate that the strategy name is valid
    if (TEMPEST_STRATEGIES.includes(strategyName as TempestStrategyName)) {
      sendSingleParameterUpdate(sendMessage, selectedAsset, strategyName as TempestStrategyName, paramName, value);
    } else {
      console.error(`❌ Invalid strategy name: ${strategyName}`);
    }
    
    // Clear the updating indicator after a short delay
    setTimeout(() => setIsUpdating(false), 1000);
  };

  const handleParameterChange = (strategyNameOrParam: string, paramNameOrValue: string, value?: string) => {
    let processedValue: any;
    let paramPath: string;

    // Handle top-level parameters like pause_closure, called as handleParameterChange('pause_closure', 'true')
    if (value === undefined) {
      paramPath = strategyNameOrParam;
      const val = paramNameOrValue;
      if (val === 'true' || val === 'false') {
        processedValue = val === 'true';
      } else {
        processedValue = val === '' ? undefined : parseFloat(val);
      }
    } else {
      // Handle nested strategy parameters, called as handleParameterChange('Strategy', 'param', 'value')
      const strategyName = strategyNameOrParam;
      const paramName = paramNameOrValue;
      paramPath = `${strategyName}.${paramName}`;
      
      if (value === 'true' || value === 'false') {
        processedValue = value === 'true';
      } else {
        processedValue = value === '' ? undefined : parseFloat(value);
      }
    }
    
    // Update local state
    setConfigValues({
      ...configValues,
      [paramPath]: processedValue
    });

    // Update cache with the new value
    if (processedValue !== undefined && (typeof processedValue === 'boolean' || !isNaN(processedValue))) {
      if (value !== undefined) {
        const strategyName = strategyNameOrParam;
        const paramName = paramNameOrValue;
        cache.updateParameter(strategyName, paramName, processedValue);
        console.log(`📝 Parameter updated in cache: ${strategyName}.${paramName} = ${processedValue}`);
      } else {
        // For top-level params, use the new 'top-level' format
        cache.updateParameter('top-level', strategyNameOrParam, processedValue);
        console.log(`📝 Parameter updated in cache: top-level.${strategyNameOrParam} = ${processedValue}`);
      }
    }
  };

  

  // Safe check for data availability
  if (!tempestData) {
    return (
      <div className="w-full bg-black border border-gray-700 p-4 mb-4">
        <h2 className="text-xl font-bold text-white mb-4">Market Closure Panel</h2>
        <div className="text-gray-400">No Tempest data available</div>
      </div>
    );
  }

  const hasData = tempestData.data && Object.keys(tempestData.data).length > 0;
  const hasConfig = tempestData.config && Object.keys(tempestData.config).length > 0;

  // Extract data from the real structure - tempestData.data contains the rich metadata
  const tempestDataActual = tempestData.data as TempestAgentDataLocal;
  const isClosurePaused = (tempestData.data as any)?.is_closure_paused ?? tempestData.config?.pause_closure ?? false;
  const positionAnalysis = tempestDataActual?.position_analysis;
  const strategyResults = tempestDataActual?.strategy_results || [];
  const closureRecommendation = tempestDataActual?.closure_recommendation;
  const shouldClose = closureRecommendation?.should_close || tempestDataActual?.should_close || false;
  const winningStrategy = closureRecommendation?.winning_strategy || tempestDataActual?.winning_strategy;
  const reasonCode = closureRecommendation?.reason_code || tempestDataActual?.reason_code;
  const details = closureRecommendation?.details;
  const confidence = closureRecommendation?.confidence;
  const analysisTimestamp = tempestDataActual?.analysis_timestamp;
  const executionStatus = tempestDataActual?.execution_status;
  const metadata = tempestDataActual?.metadata;

  // Create a map of active strategies
  const activeStrategies = new Set(strategyResults.map(s => s.name));
  
  // Determine which strategy caused the closure
  const closureStrategy = shouldClose && strategyResults.length > 0 
    ? strategyResults.find(s => s.should_close)?.name || winningStrategy
    : winningStrategy;

  // Get detailed info for selected strategy
  const selectedStrategyData = selectedStrategy 
    ? strategyResults.find(s => s.name === selectedStrategy)
    : null;

  const renderPositionSummary = () => {
    if (!positionAnalysis) return null;

    const position = positionAnalysis;
    const unrealizedPnl = position.unrealized_pnl ?? 0;
    const roe = position.roe ?? 0;
    const isPositive = unrealizedPnl >= 0;

    return (
      <div className="bg-gray-800 p-4 border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold text-white mb-3">Position Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400 text-sm">Asset:</span>
            <div className="text-white font-mono">{position.asset}</div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Type:</span>
            <div className={`font-mono ${position.position_type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
              {position.position_type}
            </div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Size:</span>
            <div className="text-white font-mono">{position.size?.toFixed(6) ?? '0.000000'}</div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Entry Price:</span>
            <div className="text-white font-mono">${position.entry_price?.toFixed(2) ?? '0.00'}</div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Mark Price:</span>
            <div className="text-white font-mono">${position.mark_price?.toFixed(2) ?? '0.00'}</div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Unrealized PnL:</span>
            <div className={`font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              ${unrealizedPnl.toFixed(4)}
            </div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">ROE:</span>
            <div className={`font-mono ${roe >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(roe * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStrategyDetails = (strategy: StrategyResult) => {
    if (!strategy) return null;

    const technicalData = strategy.technical_data;
    const parameters = strategy.parameters;
    
    return (
      <div className="bg-gray-900 p-4 border border-gray-600">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-semibold text-white">{strategy.name}</h4>
          <div className={`px-3 py-1 text-xs font-bold ${
            strategy.should_close ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}>
            {strategy.should_close ? 'CLOSURE' : 'ACTIVE'}
          </div>
        </div>

        {/* Strategy Status */}
        <div className="mb-4">
          <div className="text-gray-400 text-sm">Status:</div>
          <div className="text-white font-mono text-sm">
            {strategy.reason_code || 'No reason code'}
          </div>
          {strategy.details && (
            <div className="text-gray-300 text-xs mt-1">{strategy.details}</div>
          )}
        </div>

        {/* Technical Data */}
        {technicalData && (
          <div className="mb-4">
            <div className="text-gray-400 text-sm mb-2">Technical Data:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Current Price:</span>
                <div className="text-white font-mono">${technicalData.current_price?.toFixed(2) ?? '0.00'}</div>
              </div>
              <div>
                <span className="text-gray-500">Entry Price:</span>
                <div className="text-white font-mono">${technicalData.entry_price?.toFixed(2) ?? '0.00'}</div>
              </div>
              <div>
                <span className="text-gray-500">EMA3:</span>
                <div className="text-white font-mono">{technicalData.ema3?.toFixed(2) ?? '0.00'}</div>
              </div>
              <div>
                <span className="text-gray-500">EMA21:</span>
                <div className="text-white font-mono">{technicalData.ema21?.toFixed(2) ?? '0.00'}</div>
              </div>
              <div>
                <span className="text-gray-500">ATR:</span>
                <div className="text-white font-mono">{technicalData.atr?.toFixed(2) ?? '0.00'}</div>
              </div>
              <div>
                <span className="text-gray-500">RSI:</span>
                <div className="text-white font-mono">{technicalData.rsi?.toFixed(2) ?? '0.00'}</div>
              </div>
              <div>
                <span className="text-gray-500">MACD:</span>
                <div className="text-white font-mono">{technicalData.macd?.toFixed(2) ?? '0.00'}</div>
              </div>
              {technicalData.price_movement !== undefined && (
                <div>
                  <span className="text-gray-500">Price Movement:</span>
                  <div className="text-white font-mono">{(technicalData.price_movement ?? 0).toFixed(2)}</div>
                </div>
              )}
              {technicalData.max_favorable !== undefined && (
                <div>
                  <span className="text-gray-500">Max Favorable:</span>
                  <div className="text-white font-mono">{(technicalData.max_favorable ?? 0).toFixed(2)}</div>
                </div>
              )}
              {technicalData.retracement_from_peak !== undefined && (
                <div>
                  <span className="text-gray-500">Retracement:</span>
                  <div className="text-white font-mono">{(technicalData.retracement_from_peak ?? 0).toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Parameters */}
        {parameters && (
          <div>
            <div className="text-gray-400 text-sm mb-2">Parameters:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(parameters).map(([key, value]) => (
                <div key={key}>
                  <span className="text-gray-500">{key}:</span>
                  <div className="text-white font-mono">
                    {typeof value === 'number' ? value.toFixed(2) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence */}
        {strategy.confidence !== undefined && (
          <div className="mt-3">
            <div className="text-gray-400 text-sm">Confidence:</div>
            <div className="text-white font-mono">{(strategy.confidence * 100).toFixed(1)}%</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-black border border-gray-700 p-4 mb-4">
      {/* Header */}
      <div 
        className="flex justify-between items-center cursor-pointer hover:bg-gray-800 transition-colors p-2 -m-2"
        onClick={toggleExpanded}
      >
        <h3 className="text-lg font-bold text-orange-400">MARKET CLOSURE PIPELINE</h3>
        <div className="flex items-center space-x-2">
          {/* Cache Status Indicator */}
          {selectedAsset && (
            <div className="flex items-center space-x-1">
              {cache.hasUnsavedChanges() && (
                <span className="px-2 py-1 text-xs font-mono bg-yellow-600 text-white animate-pulse">
                  UNSAVED
                </span>
              )}
              <span 
                className="px-1 py-1 text-xs cursor-pointer hover:bg-gray-700 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCacheStatus(!showCacheStatus);
                }}
                title="Cache Status"
              >
                📦
              </span>
            </div>
          )}
          <span className={`px-2 py-1 text-xs font-mono ${
            hasData || hasConfig 
              ? 'bg-orange-600 text-white' 
              : 'bg-gray-600 text-gray-300'
          }`}>
            {hasData || hasConfig ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <span className="text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {/* Cache Status Display */}
      {showCacheStatus && selectedAsset && (
        <div className="mt-2 p-3 bg-gray-900 border border-gray-600">
          <h4 className="text-cyan-400 font-semibold mb-2">Cache Status</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Asset:</span>
              <span className="text-blue-400 font-bold">{selectedAsset}</span>
            </div>
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
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => {
                  cache.resetToOriginal();
                  setShowCacheStatus(false);
                }}
                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              >
                Reset to Original
              </button>
              <button
                onClick={() => {
                  cache.clearCache();
                  setShowCacheStatus(false);
                }}
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          {/* Top Row: Position Analysis and Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            {/* Position Analysis - 60% width (3/5 columns) */}
            {positionAnalysis && (
              <div className="md:col-span-3 bg-gray-900 border border-gray-600 p-4">
                <h4 className="font-semibold text-orange-400 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-orange-400 mr-2"></span>
                  Position Analysis
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Asset:</span>
                    <span className="font-bold text-blue-400">
                      {positionAnalysis.asset}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className={`font-bold ${
                      positionAnalysis.position_type === 'LONG' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {positionAnalysis.position_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size:</span>
                    <span className="font-bold text-blue-400">
                      {positionAnalysis.size ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Entry Price:</span>
                    <span className="font-bold text-green-400">
                      {positionAnalysis.entry_price ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mark Price:</span>
                    <span className="font-bold text-blue-400">
                      {positionAnalysis.mark_price ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unrealized PnL:</span>
                    <span className={`font-bold ${
                      (positionAnalysis.unrealized_pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {(positionAnalysis.unrealized_pnl ?? 0).toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ROE:</span>
                    <span className={`font-bold ${
                      (positionAnalysis.roe ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {((positionAnalysis.roe ?? 0) * 100).toFixed(4)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Closure Status & Recommendation - 40% width (2/5 columns) */}
            <div className="md:col-span-2 bg-gray-900 border border-gray-600 p-4">
              <h4 className="font-semibold text-orange-400 mb-3 flex items-center">
                <span className="w-2 h-2 bg-orange-400 mr-2"></span>
                Closure Status
              </h4>
              
              {/* Primary Closure Info */}
              <div className="space-y-3">
                <div className="p-3 bg-gray-800 border border-gray-600">
                  <div className="text-sm font-semibold text-orange-400 mb-2">Recommendation</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Should Close:</span>
                      <span className={`font-bold ${shouldClose ? 'text-red-400' : 'text-green-400'}`}>
                        {shouldClose ? 'YES' : 'NO'}
                      </span>
                    </div>
                    {confidence !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Confidence:</span>
                        <span className="font-bold text-blue-400">
                          {(confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {reasonCode && (
                      <div className="mt-2 p-2 bg-gray-700 border-l-2 border-orange-400">
                        <div className="text-gray-400 text-xs mb-1">Reason Code:</div>
                        <div className="text-yellow-300 text-xs">{reasonCode}</div>
                      </div>
                    )}
                    {details && (
                      <div className="mt-2 p-2 bg-gray-700 border-l-2 border-blue-400">
                        <div className="text-gray-400 text-xs mb-1">Details:</div>
                        <div className="text-blue-300 text-xs">{details}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Strategy Summary */}
                <div className="p-3 bg-gray-800 border border-gray-600">
                  <div className="text-sm font-semibold text-orange-400 mb-2">Strategy Summary</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Strategies:</span>
                      <span className="font-bold text-blue-400">
                        {strategyResults.length}
                      </span>
                    </div>
                    {shouldClose && closureStrategy && (
                      <div className="mt-2 p-2 bg-red-900 border border-red-600">
                        <div className="text-gray-400 text-xs mb-1">Closure Trigger:</div>
                        <div className="text-red-300 text-xs font-bold">{closureStrategy}</div>
                      </div>
                    )}
                    {winningStrategy && (
                      <div className="mt-2 p-2 bg-green-900 border border-green-600">
                        <div className="text-gray-400 text-xs mb-1">Winning Strategy:</div>
                        <div className="text-green-300 text-xs font-bold">{winningStrategy}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Execution Status */}
                {executionStatus && (
                  <div className="p-3 bg-gray-800 border border-gray-600">
                    <div className="text-sm font-semibold text-orange-400 mb-2">Execution Status</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`font-bold ${
                          executionStatus === 'completed' ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {executionStatus.toUpperCase()}
                        </span>
                      </div>
                      {analysisTimestamp && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Analysis Time:</span>
                          <span className="font-bold text-blue-400">
                            {new Date(analysisTimestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Strategy Status Section */}
          <div className="bg-gray-900 border border-gray-600 p-4 mb-6">
            <h4 className="font-semibold text-orange-400 mb-3 flex items-center">
              <span className="w-2 h-2 bg-orange-400 mr-2"></span>
              Strategy Status
            </h4>
            
            {/* Shared Technical Data */}
            {tempestData && strategyResults && strategyResults.length > 0 && (
              <div className="mb-4 p-3 bg-gray-800 border border-gray-600">
                <h5 className="text-blue-400 text-base font-semibold mb-2">TECHNICAL DATA</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {/* Get technical data from the first available strategy result */}
                  {(() => {
                    const firstStrategy = strategyResults.find(s => s.technical_data);
                    const techData = firstStrategy?.technical_data;
                    
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Current Price:</span>
                          <span className="text-green-400 font-bold">
                            {techData?.current_price?.toFixed(5) ?? '0.00000'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Entry Price:</span>
                          <span className="text-blue-400 font-bold">
                            {techData?.entry_price?.toFixed(5) ?? '0.00000'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">EMA3:</span>
                          <span className="text-purple-400 font-bold">
                            {techData?.ema3?.toFixed(5) ?? '0.00000'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">EMA21:</span>
                          <span className="text-purple-400 font-bold">
                            {techData?.ema21?.toFixed(5) ?? '0.00000'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">ATR:</span>
                          <span className="text-yellow-400 font-bold">
                            {techData?.atr?.toFixed(5) ?? '0.00000'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">RSI:</span>
                          <span className="text-orange-400 font-bold">
                            {techData?.rsi?.toFixed(2) ?? '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">MACD:</span>
                          <span className="text-blue-400 font-bold">
                            {techData?.macd?.toFixed(2) ?? '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Position:</span>
                          <span className="text-gray-300 font-bold">
                            {positionAnalysis?.position_type ?? 'N/A'}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            
            {/* Strategy Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ALL_STRATEGIES.map((strategyName) => {
                const isActive = activeStrategies.has(strategyName);
                const isClosureStrategy = strategyName === closureStrategy;
                const strategyResult = strategyResults.find(s => s.name === strategyName);
                const isSelected = selectedStrategy === strategyName;
                
                // Determine border color based on strategy type
                let borderColor = 'border-gray-600';
                let titleColor = 'text-gray-400';
                
                if (strategyName.includes('ROE') || strategyName.includes('PnL')) {
                  borderColor = 'border-orange-500';
                  titleColor = 'text-orange-400';
                } else if (strategyName.includes('EMA') || strategyName.includes('Trend')) {
                  borderColor = 'border-purple-500';
                  titleColor = 'text-purple-400';
                } else {
                  borderColor = 'border-blue-500';
                  titleColor = 'text-blue-400';
                }

                // Determine status and colors
                let statusText = 'IDLE';
                let statusColor = 'text-gray-500';
                
                if (isClosureStrategy) {
                  statusText = 'CLOSURE';
                  statusColor = 'text-red-400';
                } else if (isActive) {
                  statusText = 'ACTIVE';
                  statusColor = 'text-green-400';
                } else if (strategyResult?.should_close) {
                  statusText = 'CLOSE';
                  statusColor = 'text-yellow-400';
                }

                return (
                  <div
                    key={strategyName}
                    className={`p-3 border ${borderColor} bg-gray-900 cursor-pointer transition-all duration-200 hover:border-opacity-80 ${
                      isSelected ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
                    }`}
                    onClick={() => setSelectedStrategy(isSelected ? null : strategyName)}
                  >
                    {/* Strategy Header */}
                    <div className="mb-3">
                      <h5 className={`${titleColor} text-sm font-bold uppercase mb-2`}>
                        {strategyName}
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className={`font-bold ${statusColor}`}>
                            {statusText}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Confidence:</span>
                          <span className="text-blue-400 font-bold">
                            {strategyResult?.confidence?.toFixed(1) ?? 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Always Show Detailed Information */}
                    <div className="space-y-3">
                      {/* Details Section */}
                      {strategyResult?.details && (
                        <div className="bg-gray-700 p-2">
                          <div className="text-gray-400 text-sm mb-1">Details:</div>
                          <div className="text-sm text-gray-300">{strategyResult.details}</div>
                        </div>
                      )}

                      {/* Reason Code */}
                      {strategyResult?.reason_code && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Reason:</span>
                          <span className="text-yellow-400 font-bold text-sm">
                            {strategyResult.reason_code}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Strategy Details */}
          {selectedStrategyData && (
            <div className="mt-4 p-4 bg-gray-800 border border-gray-600">
              <h5 className="font-semibold text-orange-400 mb-3">{selectedStrategyData.name} Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Basic Info */}
                <div>
                  <div className="text-gray-400 mb-2">Basic Information</div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className={`ml-2 font-bold ${
                        selectedStrategyData.should_close ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {selectedStrategyData.should_close ? 'CLOSE' : 'MONITOR'}
                      </span>
                    </div>
                    {selectedStrategyData.confidence !== undefined && (
                      <div>
                        <span className="text-gray-400">Confidence:</span>
                        <span className="ml-2 font-bold text-blue-400">
                          {(selectedStrategyData.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {selectedStrategyData.reason_code && (
                      <div>
                        <span className="text-gray-400">Reason Code:</span>
                        <span className="ml-2 text-yellow-300">
                          {selectedStrategyData.reason_code}
                        </span>
                      </div>
                    )}
                    {selectedStrategyData.details && (
                      <div>
                        <span className="text-gray-400">Details:</span>
                        <span className="ml-2 text-yellow-300">
                          {selectedStrategyData.details}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Data */}
                <div>
                  <div className="text-gray-400 mb-2">Technical Data</div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-gray-400">Current Price:</span>
                      <span className="ml-2 font-bold text-green-300">
                        {selectedStrategyData.technical_data.current_price ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Entry Price:</span>
                      <span className="ml-2 font-bold text-blue-300">
                        {selectedStrategyData.technical_data.entry_price ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">EMA3:</span>
                      <span className="ml-2 font-bold text-purple-300">
                        {(selectedStrategyData.technical_data.ema3 ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">EMA21:</span>
                      <span className="ml-2 font-bold text-purple-300">
                        {(selectedStrategyData.technical_data.ema21 ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">ATR:</span>
                      <span className="ml-2 font-bold text-blue-300">
                        {(selectedStrategyData.technical_data.atr ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">RSI:</span>
                      <span className="ml-2 font-bold text-orange-300">
                        {(selectedStrategyData.technical_data.rsi ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">MACD:</span>
                      <span className="ml-2 font-bold text-green-300">
                        {(selectedStrategyData.technical_data.macd ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* UnrealizedPnL Specific Data */}
                {selectedStrategyData.name === 'UnrealizedPnLStrategy' && selectedStrategyData.technical_data.unrealized_pnl !== undefined && (
                  <div className="md:col-span-2">
                    <div className="text-gray-400 mb-2">UnrealizedPnL Metrics</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div>
                          <span className="text-gray-400">Unrealized PnL:</span>
                          <span className={`ml-2 font-bold ${
                            selectedStrategyData.technical_data.unrealized_pnl >= 0 
                              ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {selectedStrategyData.technical_data.unrealized_pnl.toFixed(6)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Price Movement:</span>
                          <span className={`ml-2 font-bold ${
                            (selectedStrategyData.technical_data.price_movement ?? 0) >= 0 
                              ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {selectedStrategyData.technical_data.price_movement ?? 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Max Favorable:</span>
                          <span className="ml-2 font-bold text-green-400">
                            {selectedStrategyData.technical_data.max_favorable ?? 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Retracement from Peak:</span>
                          <span className="ml-2 font-bold text-red-400">
                            {selectedStrategyData.technical_data.retracement_from_peak ?? 0}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-gray-400">Retracement Threshold:</span>
                          <span className="ml-2 font-bold text-orange-400">
                            {selectedStrategyData.technical_data.retracement_threshold?.toFixed(6)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Active Threshold:</span>
                          <span className="ml-2 font-bold text-blue-400">
                            {selectedStrategyData.technical_data.active_threshold ?? 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Is Retracing:</span>
                          <span className={`ml-2 font-bold ${
                            (selectedStrategyData.technical_data.is_retracing ?? false) ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {(selectedStrategyData.technical_data.is_retracing ?? false) ? 'YES' : 'NO'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Max Favorable Movement:</span>
                          <span className="ml-2 font-bold text-green-400">
                            {selectedStrategyData.technical_data.max_favorable_movement ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                </div>
              )}

                {/* Parameters */}
                <div className="md:col-span-2">
                  <div className="text-gray-400 mb-2">Parameters</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {Object.entries(selectedStrategyData.parameters).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-400">{key}:</span>
                        <span className="ml-2 font-bold text-blue-300">
                          {typeof value === 'boolean' ? (value ? 'YES' : 'NO') : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Section */}
          {hasConfig && (
            <div className="mt-6 p-4 bg-gray-900 border border-gray-600">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className="w-3 h-3 bg-orange-500 mr-2"></span>
                  Pipeline Configuration
                  {isUpdating && (
                    <span className="ml-2 text-xs text-yellow-400 animate-pulse">
                      🔄 Updating...
                    </span>
                  )}
                </h3>
                <div className="flex space-x-2">
                  {editingConfig ? (
                    <>
                      <button
                        onClick={handleSaveConfig}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        SAVE CONFIGURATION
                      </button>
                      <button
                        onClick={() => setEditingConfig(false)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        CANCEL
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingConfig(true)}
                      className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                    >
                      EDIT CONFIG
                    </button>
                  )}
                </div>
              </div>

              {editingConfig ? (
                // Configuration Edit Mode
                <div className="space-y-4">
                  {/* ROE Threshold Strategy */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-orange-400 text-sm font-semibold mb-2">ROE Threshold Strategy</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-gray-400">ROE Threshold:</label>
                        <input
                          type="number"
                          step="0.01"
                          value={configValues['ROEThresholdStrategy.roe_threshold'] ?? ''}
                          onChange={(e) => handleParameterChange('ROEThresholdStrategy', 'roe_threshold', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400">ROE Take Profit:</label>
                        <input
                          type="number"
                          step="0.01"
                          value={configValues['ROEThresholdStrategy.roe_take_profit'] ?? ''}
                          onChange={(e) => handleParameterChange('ROEThresholdStrategy', 'roe_take_profit', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stop Loss Take Profit Strategy */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-blue-400 text-sm font-semibold mb-2">Stop Loss Take Profit Strategy</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-gray-400">Stop Loss %:</label>
                        <input
                          type="number"
                          step="0.01"
                          value={configValues['StopLossTakeProfitStrategy.stop_loss_pct'] ?? ''}
                          onChange={(e) => handleParameterChange('StopLossTakeProfitStrategy', 'stop_loss_pct', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400">Take Profit %:</label>
                        <input
                          type="number"
                          step="0.01"
                          value={configValues['StopLossTakeProfitStrategy.take_profit_pct'] ?? ''}
                          onChange={(e) => handleParameterChange('StopLossTakeProfitStrategy', 'take_profit_pct', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* EMA Crossover Strategy */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-purple-400 text-sm font-semibold mb-2">EMA Crossover Strategy</h5>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div>
                        <label className="text-gray-400">Min EMA Difference %:</label>
                        <input
                          type="number"
                          step="0.01"
                          value={configValues['EMACrossoverStrategy.min_ema_difference_pct'] ?? ''}
                          onChange={(e) => handleParameterChange('EMACrossoverStrategy', 'min_ema_difference_pct', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ATR Stop Loss Strategy */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-blue-400 text-sm font-semibold mb-2">ATR Stop Loss Strategy</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-gray-400">ATR Multiplier:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={configValues['ATRStopLossStrategy.atr_multiplier'] ?? ''}
                          onChange={(e) => handleParameterChange('ATRStopLossStrategy', 'atr_multiplier', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400">Move to Breakeven:</label>
                        <select
                          value={configValues['ATRStopLossStrategy.move_to_breakeven'] ?? ''}
                          onChange={(e) => handleParameterChange('ATRStopLossStrategy', 'move_to_breakeven', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400">Breakeven Trigger:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={configValues['ATRStopLossStrategy.breakeven_trigger'] ?? ''}
                          onChange={(e) => handleParameterChange('ATRStopLossStrategy', 'breakeven_trigger', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400">Use Trailing Stop:</label>
                        <select
                          value={configValues['ATRStopLossStrategy.use_trailing_stop'] ?? ''}
                          onChange={(e) => handleParameterChange('ATRStopLossStrategy', 'use_trailing_stop', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400">Trailing Activation:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={configValues['ATRStopLossStrategy.trailing_activation'] ?? ''}
                          onChange={(e) => handleParameterChange('ATRStopLossStrategy', 'trailing_activation', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400">Trail by ATR:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={configValues['ATRStopLossStrategy.trail_by_atr'] ?? ''}
                          onChange={(e) => handleParameterChange('ATRStopLossStrategy', 'trail_by_atr', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* UnrealizedPnL Strategy */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-orange-400 text-sm font-semibold mb-2">UnrealizedPnL Strategy</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-gray-400">Stop Loss Multiplier:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={configValues['UnrealizedPnLStrategy.stop_loss_multiplier'] ?? ''}
                          onChange={(e) => handleParameterChange('UnrealizedPnLStrategy', 'stop_loss_multiplier', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400">Threshold 1 Multiplier:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={configValues['UnrealizedPnLStrategy.threshold_1_multiplier'] ?? ''}
                          onChange={(e) => handleParameterChange('UnrealizedPnLStrategy', 'threshold_1_multiplier', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400">Threshold 2 Multiplier:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={configValues['UnrealizedPnLStrategy.threshold_2_multiplier'] ?? ''}
                          onChange={(e) => handleParameterChange('UnrealizedPnLStrategy', 'threshold_2_multiplier', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400">Threshold 3 Multiplier:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={configValues['UnrealizedPnLStrategy.threshold_3_multiplier'] ?? ''}
                          onChange={(e) => handleParameterChange('UnrealizedPnLStrategy', 'threshold_3_multiplier', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400">Threshold 1 Retracement:</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={configValues['UnrealizedPnLStrategy.threshold_1_retracement'] ?? ''}
                          onChange={(e) => handleParameterChange('UnrealizedPnLStrategy', 'threshold_1_retracement', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400">Threshold 2 Retracement:</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={configValues['UnrealizedPnLStrategy.threshold_2_retracement'] ?? ''}
                          onChange={(e) => handleParameterChange('UnrealizedPnLStrategy', 'threshold_2_retracement', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400">Threshold 3 Retracement:</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={configValues['UnrealizedPnLStrategy.threshold_3_retracement'] ?? ''}
                          onChange={(e) => handleParameterChange('UnrealizedPnLStrategy', 'threshold_3_retracement', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resistance Exit Strategy */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-green-400 text-sm font-semibold mb-2">Resistance Exit Strategy</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-gray-400">Resistance Threshold:</label>
                        <input
                          type="number"
                          step="0.01"
                          value={configValues['ResistanceExitStrategy.resistance_threshold'] ?? ''}
                          onChange={(e) => handleParameterChange('ResistanceExitStrategy', 'resistance_threshold', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400">Profit Taking Percentage:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={configValues['ResistanceExitStrategy.profit_taking_percentage'] ?? ''}
                          onChange={(e) => handleParameterChange('ResistanceExitStrategy', 'profit_taking_percentage', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pause Closure Control */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-red-400 text-sm font-semibold mb-2">Closure Control</h5>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">Pause Closure Pipeline:</span>
                      <select
                        value={configValues.pause_closure ?? (isClosurePaused ? 'true' : 'false')}
                        onChange={(e) => handleParameterChange('pause_closure', e.target.value)}
                        className="px-3 py-1 text-xs font-bold rounded bg-gray-700 border border-gray-600 text-white"
                      >
                        <option value="false">🟢 ACTIVE</option>
                        <option value="true">🔴 PAUSED</option>
                      </select>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveConfig}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm"
                    >
                      SAVE CONFIGURATION
                    </button>
                  </div>
                </div>
              ) : (
                // Configuration Display Mode
                <div className="space-y-4">
                  {/* ROE Threshold Strategy */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-orange-400 text-sm font-semibold mb-2">ROE Threshold Strategy</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">ROE Threshold:</span>
                        <span className="text-blue-400 font-bold">
                          {(() => {
                            const cachedConfig = cache.getCachedConfig();
                            const value = cachedConfig?.ROEThresholdStrategy?.roe_threshold ?? 
                                        tempestData?.config?.ROEThresholdStrategy?.roe_threshold ?? 'N/A';
                            const isModified = cache.getChanges()?.ROEThresholdStrategy?.roe_threshold !== undefined;
                            return (
                              <span className={isModified ? 'text-yellow-400' : 'text-blue-400'}>
                                {value}
                                {isModified && ' *'}
                              </span>
                            );
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">ROE Take Profit:</span>
                        <span className="text-blue-400 font-bold">
                          {(() => {
                            const cachedConfig = cache.getCachedConfig();
                            const value = cachedConfig?.ROEThresholdStrategy?.roe_take_profit ?? 
                                        tempestData?.config?.ROEThresholdStrategy?.roe_take_profit ?? 'N/A';
                            const isModified = cache.getChanges()?.ROEThresholdStrategy?.roe_take_profit !== undefined;
                            return (
                              <span className={isModified ? 'text-yellow-400' : 'text-blue-400'}>
                                {value}
                                {isModified && ' *'}
                              </span>
                            );
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stop Loss Take Profit Strategy */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-blue-400 text-sm font-semibold mb-2">Stop Loss Take Profit Strategy</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stop Loss %:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.StopLossTakeProfitStrategy?.stop_loss_pct ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Take Profit %:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.StopLossTakeProfitStrategy?.take_profit_pct ?? 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* EMA Crossover Strategy */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-purple-400 text-sm font-semibold mb-2">EMA Crossover Strategy</h5>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Min EMA Difference %:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.EMACrossoverStrategy?.min_ema_difference_pct ?? 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ATR Stop Loss Strategy */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-blue-400 text-sm font-semibold mb-2">ATR Stop Loss Strategy</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">ATR Multiplier:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.ATRStopLossStrategy?.atr_multiplier ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Move to Breakeven:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.ATRStopLossStrategy?.move_to_breakeven ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Breakeven Trigger:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.ATRStopLossStrategy?.breakeven_trigger ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Use Trailing Stop:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.ATRStopLossStrategy?.use_trailing_stop ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trailing Activation:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.ATRStopLossStrategy?.trailing_activation ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trail by ATR:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.ATRStopLossStrategy?.trail_by_atr ?? 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* UnrealizedPnL Strategy */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-orange-400 text-sm font-semibold mb-2">UnrealizedPnL Strategy</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stop Loss Multiplier:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.UnrealizedPnLStrategy?.stop_loss_multiplier ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Threshold 1 Multiplier:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.UnrealizedPnLStrategy?.threshold_1_multiplier ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Threshold 2 Multiplier:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.UnrealizedPnLStrategy?.threshold_2_multiplier ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Threshold 3 Multiplier:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.UnrealizedPnLStrategy?.threshold_3_multiplier ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Threshold 1 Retracement:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.UnrealizedPnLStrategy?.threshold_1_retracement ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Threshold 2 Retracement:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.UnrealizedPnLStrategy?.threshold_2_retracement ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Threshold 3 Retracement:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.UnrealizedPnLStrategy?.threshold_3_retracement ?? 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resistance Exit Strategy */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-green-400 text-sm font-semibold mb-2">Resistance Exit Strategy</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Resistance Threshold:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.ResistanceExitStrategy?.resistance_threshold ?? 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Profit Taking Percentage:</span>
                        <span className="text-blue-400 font-bold">
                          {tempestData?.config?.ResistanceExitStrategy?.profit_taking_percentage ?? 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pause Closure Control Display */}
                  <div className="p-3 border border-gray-600 bg-gray-800">
                    <h5 className="text-red-400 text-sm font-semibold mb-2">Closure Control</h5>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">Pause Closure:</span>
                      <span className={`text-xs font-bold ${
                        isClosurePaused 
                          ? 'text-red-400' 
                          : 'text-green-400'
                      }`}>
                        {isClosurePaused ? 'PAUSED' : 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};