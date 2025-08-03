/**
 * Tempest Configuration WebSocket Message Utilities
 * 
 * This module provides utilities for sending Tempest configuration updates
 * via WebSocket following the exact message format specification.
 */

export interface TempestConfigUpdate {
  type: "tempest_config_update";
  asset: string;
  config: Record<string, any>;
}

export interface TempestStrategyConfig {
  // ROEThresholdStrategy
  ROEThresholdStrategy?: {
    roe_threshold?: number;
    roe_take_profit?: number;
  };
  
  // StopLossTakeProfitStrategy
  StopLossTakeProfitStrategy?: {
    stop_loss_pct?: number;
    take_profit_pct?: number;
  };
  
  // EMACrossoverStrategy
  EMACrossoverStrategy?: {
    min_ema_difference_pct?: number;
  };
  
  // ATRStopLossStrategy
  ATRStopLossStrategy?: {
    atr_multiplier?: number;
    move_to_breakeven?: boolean;
    breakeven_trigger?: number;
    use_trailing_stop?: boolean;
    trailing_activation?: number;
    trail_by_atr?: number;
  };
  
  // UnrealizedPnLStrategy
  UnrealizedPnLStrategy?: {
    stop_loss_multiplier?: number;
    threshold_1_multiplier?: number;
    threshold_2_multiplier?: number;
    threshold_3_multiplier?: number;
    threshold_1_retracement?: number;
    threshold_2_retracement?: number;
    threshold_3_retracement?: number;
  };
  
  // ResistanceExitStrategy
  ResistanceExitStrategy?: {
    resistance_threshold?: number;
    exit_percentage?: number;
  };
}

/**
 * Available strategy names for Tempest configuration
 */
export const TEMPEST_STRATEGIES = [
  'ROEThresholdStrategy',
  'StopLossTakeProfitStrategy',
  'EMACrossoverStrategy',
  'ATRStopLossStrategy',
  'UnrealizedPnLStrategy',
  'ResistanceExitStrategy'
] as const;

export type TempestStrategyName = typeof TEMPEST_STRATEGIES[number];

/**
 * Creates a Tempest configuration update message
 * 
 * @param asset - The asset symbol (e.g., "BTC", "ETH", "SOL")
 * @param config - The configuration object with strategy parameters
 * @returns The formatted WebSocket message
 */
export function createTempestConfigUpdate(
  asset: string, 
  config: TempestStrategyConfig
): TempestConfigUpdate {
  return {
    type: "tempest_config_update",
    asset: asset,
    config: config
  };
}

/**
 * Creates a single parameter update message
 * 
 * @param asset - The asset symbol
 * @param strategyName - The strategy name
 * @param paramName - The parameter name
 * @param value - The parameter value
 * @returns The formatted WebSocket message
 */
export function createSingleParameterUpdate(
  asset: string,
  strategyName: TempestStrategyName,
  paramName: string,
  value: any
): TempestConfigUpdate {
  return {
    type: "tempest_config_update",
    asset: asset,
    config: {
      [strategyName]: {
        [paramName]: value
      }
    }
  };
}

/**
 * Creates a ROE Threshold strategy update
 * 
 * @param asset - The asset symbol
 * @param roeThreshold - The ROE threshold value
 * @param roeTakeProfit - Optional ROE take profit value
 * @returns The formatted WebSocket message
 */
export function createROEThresholdUpdate(
  asset: string,
  roeThreshold: number,
  roeTakeProfit?: number
): TempestConfigUpdate {
  const config: TempestStrategyConfig = {
    ROEThresholdStrategy: {
      roe_threshold: roeThreshold
    }
  };
  
  if (roeTakeProfit !== undefined) {
    config.ROEThresholdStrategy!.roe_take_profit = roeTakeProfit;
  }
  
  return createTempestConfigUpdate(asset, config);
}

/**
 * Creates a Stop Loss Take Profit strategy update
 * 
 * @param asset - The asset symbol
 * @param stopLossPct - Stop loss percentage
 * @param takeProfitPct - Take profit percentage
 * @returns The formatted WebSocket message
 */
export function createStopLossTakeProfitUpdate(
  asset: string,
  stopLossPct: number,
  takeProfitPct: number
): TempestConfigUpdate {
  return createTempestConfigUpdate(asset, {
    StopLossTakeProfitStrategy: {
      stop_loss_pct: stopLossPct,
      take_profit_pct: takeProfitPct
    }
  });
}

/**
 * Creates an ATR Stop Loss strategy update
 * 
 * @param asset - The asset symbol
 * @param atrMultiplier - ATR multiplier value
 * @param moveToBreakeven - Whether to move to breakeven
 * @param useTrailingStop - Whether to use trailing stop
 * @returns The formatted WebSocket message
 */
export function createATRStopLossUpdate(
  asset: string,
  atrMultiplier: number,
  moveToBreakeven?: boolean,
  useTrailingStop?: boolean
): TempestConfigUpdate {
  const config: TempestStrategyConfig = {
    ATRStopLossStrategy: {
      atr_multiplier: atrMultiplier
    }
  };
  
  if (moveToBreakeven !== undefined) {
    config.ATRStopLossStrategy!.move_to_breakeven = moveToBreakeven;
  }
  
  if (useTrailingStop !== undefined) {
    config.ATRStopLossStrategy!.use_trailing_stop = useTrailingStop;
  }
  
  return createTempestConfigUpdate(asset, config);
}

/**
 * Creates an UnrealizedPnL strategy update
 * 
 * @param asset - The asset symbol
 * @param stopLossMultiplier - Stop loss multiplier
 * @param thresholdMultipliers - Array of threshold multipliers [1, 2, 3]
 * @param retracementValues - Array of retracement values [1, 2, 3]
 * @returns The formatted WebSocket message
 */
export function createUnrealizedPnLUpdate(
  asset: string,
  stopLossMultiplier: number,
  thresholdMultipliers: [number, number, number],
  retracementValues: [number, number, number]
): TempestConfigUpdate {
  return createTempestConfigUpdate(asset, {
    UnrealizedPnLStrategy: {
      stop_loss_multiplier: stopLossMultiplier,
      threshold_1_multiplier: thresholdMultipliers[0],
      threshold_2_multiplier: thresholdMultipliers[1],
      threshold_3_multiplier: thresholdMultipliers[2],
      threshold_1_retracement: retracementValues[0],
      threshold_2_retracement: retracementValues[1],
      threshold_3_retracement: retracementValues[2]
    }
  });
}

/**
 * Sends a Tempest configuration update via WebSocket
 * 
 * @param sendMessage - The WebSocket send function
 * @param asset - The asset symbol
 * @param config - The configuration object
 * @returns Promise that resolves when message is sent
 */
export function sendTempestConfigUpdate(
  sendMessage: (message: any) => void,
  asset: string,
  config: TempestStrategyConfig
): void {
  const message = createTempestConfigUpdate(asset, config);
  sendMessage(message);
  console.log('📤 Tempest config update sent:', message);
}

/**
 * Sends a single parameter update via WebSocket
 * 
 * @param sendMessage - The WebSocket send function
 * @param asset - The asset symbol
 * @param strategyName - The strategy name
 * @param paramName - The parameter name
 * @param value - The parameter value
 * @returns Promise that resolves when message is sent
 */
export function sendSingleParameterUpdate(
  sendMessage: (message: any) => void,
  asset: string,
  strategyName: TempestStrategyName,
  paramName: string,
  value: any
): void {
  const message = createSingleParameterUpdate(asset, strategyName, paramName, value);
  sendMessage(message);
  console.log('📤 Tempest single parameter update sent:', message);
}

/**
 * Validates a Tempest configuration object
 * 
 * @param config - The configuration object to validate
 * @returns True if valid, false otherwise
 */
export function validateTempestConfig(config: any): boolean {
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  // Check that all strategy names are valid
  for (const strategyName of Object.keys(config)) {
    if (!TEMPEST_STRATEGIES.includes(strategyName as TempestStrategyName)) {
      console.warn(`Invalid strategy name: ${strategyName}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Example usage functions for common scenarios
 */
export const TempestConfigExamples = {
  /**
   * Example: Update ROE threshold for BTC
   */
  updateROEThreshold: (sendMessage: (message: any) => void) => {
    sendTempestConfigUpdate(sendMessage, "BTC", {
      ROEThresholdStrategy: {
        roe_threshold: 0.20
      }
    });
  },

  /**
   * Example: Update multiple strategies for BTC
   */
  updateMultipleStrategies: (sendMessage: (message: any) => void) => {
    sendTempestConfigUpdate(sendMessage, "BTC", {
      ROEThresholdStrategy: {
        roe_threshold: 0.15,
        roe_take_profit: 0.25
      },
      StopLossTakeProfitStrategy: {
        stop_loss_pct: 0.03,
        take_profit_pct: 0.05
      }
    });
  },

  /**
   * Example: Update ATR strategy for ETH
   */
  updateATRStrategy: (sendMessage: (message: any) => void) => {
    sendTempestConfigUpdate(sendMessage, "ETH", {
      ATRStopLossStrategy: {
        atr_multiplier: 2.5,
        move_to_breakeven: false,
        use_trailing_stop: true
      }
    });
  }
}; 