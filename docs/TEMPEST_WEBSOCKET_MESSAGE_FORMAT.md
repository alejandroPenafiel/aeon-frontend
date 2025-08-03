# Tempest WebSocket Message Format

This document provides comprehensive examples and guidelines for sending Tempest configuration updates via WebSocket.

## Message Format Specification

All Tempest configuration updates must follow this exact format:

```typescript
{
  type: "tempest_config_update",
  asset: string,        // Asset symbol (e.g., "BTC", "ETH", "SOL")
  config: {            // Configuration object with strategy parameters
    [strategyName]: {
      [parameterName]: value
    }
  }
}
```

## Available Strategy Names

- `ROEThresholdStrategy`
- `StopLossTakeProfitStrategy`
- `EMACrossoverStrategy`
- `ATRStopLossStrategy`
- `UnrealizedPnLStrategy`
- `ResistanceExitStrategy`

## Complete Message Examples

### 1. ROE Threshold Update

```javascript
const updateTempestConfig = (asset, configUpdates) => {
    const message = {
        type: "tempest_config_update",
        asset: asset,
        config: configUpdates
    };

    ws.send(JSON.stringify(message));
};

// Example usage:
updateTempestConfig("BTC", {
    "ROEThresholdStrategy": {
        "roe_threshold": 0.20
    }
});
```

**Message sent:**
```json
{
    "type": "tempest_config_update",
    "asset": "BTC",
    "config": {
        "ROEThresholdStrategy": {
            "roe_threshold": 0.20
        }
    }
}
```

### 2. Multiple Strategy Update

```javascript
const sendTempestConfigUpdate = () => {
    const message = {
        type: "tempest_config_update",
        asset: "BTC",
        config: {
            "ROEThresholdStrategy": {
                "roe_threshold": 0.25,
                "roe_take_profit": 0.30
            },
            "ATRStopLossStrategy": {
                "atr_multiplier": 2.5
            }
        }
    };

    websocket.send(JSON.stringify(message));
};
```

**Message sent:**
```json
{
    "type": "tempest_config_update",
    "asset": "BTC",
    "config": {
        "ROEThresholdStrategy": {
            "roe_threshold": 0.25,
            "roe_take_profit": 0.30
        },
        "ATRStopLossStrategy": {
            "atr_multiplier": 2.5
        }
    }
}
```

### 3. ATR Strategy Update

```javascript
const updateATRStrategy = () => {
    const message = {
        type: "tempest_config_update",
        asset: "ETH",
        config: {
            "ATRStopLossStrategy": {
                "atr_multiplier": 2.5,
                "move_to_breakeven": false,
                "use_trailing_stop": true
            }
        }
    };

    websocket.send(JSON.stringify(message));
};
```

**Message sent:**
```json
{
    "type": "tempest_config_update",
    "asset": "ETH",
    "config": {
        "ATRStopLossStrategy": {
            "atr_multiplier": 2.5,
            "move_to_breakeven": false,
            "use_trailing_stop": true
        }
    }
}
```

## Strategy Parameter Reference

### ROEThresholdStrategy
```typescript
{
    roe_threshold: number,      // ROE threshold for closure
    roe_take_profit?: number    // Optional ROE take profit level
}
```

### StopLossTakeProfitStrategy
```typescript
{
    stop_loss_pct: number,      // Stop loss percentage
    take_profit_pct: number     // Take profit percentage
}
```

### EMACrossoverStrategy
```typescript
{
    min_ema_difference_pct: number  // Minimum EMA difference percentage
}
```

### ATRStopLossStrategy
```typescript
{
    atr_multiplier: number,         // ATR multiplier for stop loss
    move_to_breakeven?: boolean,    // Whether to move to breakeven
    breakeven_trigger?: number,     // Breakeven trigger level
    use_trailing_stop?: boolean,    // Whether to use trailing stop
    trailing_activation?: number,    // Trailing stop activation level
    trail_by_atr?: number          // ATR value for trailing
}
```

### UnrealizedPnLStrategy
```typescript
{
    stop_loss_multiplier: number,   // Stop loss multiplier
    threshold_1_multiplier: number, // Threshold 1 multiplier
    threshold_2_multiplier: number, // Threshold 2 multiplier
    threshold_3_multiplier: number, // Threshold 3 multiplier
    threshold_1_retracement: number, // Threshold 1 retracement
    threshold_2_retracement: number, // Threshold 2 retracement
    threshold_3_retracement: number  // Threshold 3 retracement
}
```

### ResistanceExitStrategy
```typescript
{
    resistance_threshold: number,    // Resistance threshold
    exit_percentage: number         // Exit percentage
}
```

## React Component Implementation

### Using the Utility Functions

```typescript
import { 
    sendTempestConfigUpdate, 
    sendSingleParameterUpdate,
    createROEThresholdUpdate,
    createATRStopLossUpdate 
} from '../utils/tempestConfigUtils';

// Send a complete configuration update
const handleConfigUpdate = () => {
    sendTempestConfigUpdate(sendMessage, "BTC", {
        ROEThresholdStrategy: {
            roe_threshold: 0.20,
            roe_take_profit: 0.25
        },
        ATRStopLossStrategy: {
            atr_multiplier: 2.5,
            use_trailing_stop: true
        }
    });
};

// Send a single parameter update
const handleSingleParameterUpdate = () => {
    sendSingleParameterUpdate(
        sendMessage, 
        "BTC", 
        "ROEThresholdStrategy", 
        "roe_threshold", 
        0.15
    );
};

// Use predefined update functions
const handleROEUpdate = () => {
    const message = createROEThresholdUpdate("BTC", 0.20, 0.25);
    sendMessage(message);
};
```

### Direct WebSocket Usage

```typescript
const sendTempestUpdate = (asset: string, config: any) => {
    const message = {
        type: "tempest_config_update",
        asset: asset,
        config: config
    };
    
    websocket.send(JSON.stringify(message));
    console.log('📤 Tempest config update sent:', message);
};

// Example usage
sendTempestUpdate("BTC", {
    ROEThresholdStrategy: {
        roe_threshold: 0.20
    }
});
```

## Key Points

### ✅ Required Format
- **Message Type**: Must be `"tempest_config_update"`
- **Asset**: Specify the asset symbol (e.g., `"BTC"`, `"ETH"`, `"SOL"`)
- **Config Structure**: Use exact strategy names and parameter names
- **WebSocket Endpoint**: Should connect to `/ws/state`
- **Merging**: Only specified parameters will be updated, others preserved

### ✅ Available Strategy Names
- `ROEThresholdStrategy`
- `StopLossTakeProfitStrategy`
- `EMACrossoverStrategy`
- `ATRStopLossStrategy`
- `UnrealizedPnLStrategy`
- `ResistanceExitStrategy`

### ✅ Validation
- All strategy names must be from the approved list
- Parameter names must match exactly
- Asset symbols should be valid trading pairs
- WebSocket connection must be established

### ✅ Error Handling
```typescript
const sendConfigUpdate = (asset: string, config: any) => {
    try {
        // Validate config before sending
        if (!validateTempestConfig(config)) {
            console.error('❌ Invalid Tempest configuration');
            return;
        }
        
        const message = {
            type: "tempest_config_update",
            asset: asset,
            config: config
        };
        
        websocket.send(JSON.stringify(message));
        console.log('✅ Config update sent successfully');
        
    } catch (error) {
        console.error('❌ Failed to send config update:', error);
    }
};
```

## Testing Examples

### Test 1: Basic ROE Threshold
```javascript
{
    "type": "tempest_config_update",
    "asset": "BTC",
    "config": {
        "ROEThresholdStrategy": {
            "roe_threshold": 0.20
        }
    }
}
```

### Test 2: Multiple Strategies
```javascript
{
    "type": "tempest_config_update",
    "asset": "BTC",
    "config": {
        "ROEThresholdStrategy": {
            "roe_threshold": 0.15,
            "roe_take_profit": 0.25
        },
        "StopLossTakeProfitStrategy": {
            "stop_loss_pct": 0.03,
            "take_profit_pct": 0.05
        }
    }
}
```

### Test 3: ATR Strategy
```javascript
{
    "type": "tempest_config_update",
    "asset": "ETH",
    "config": {
        "ATRStopLossStrategy": {
            "atr_multiplier": 2.5,
            "move_to_breakeven": false,
            "use_trailing_stop": true
        }
    }
}
```

## Integration with Existing Components

The `MarketClosurePanel` component already implements this format correctly. The `TempestConfigExample` component provides interactive examples for testing.

### Usage in Components
```typescript
// In your React component
const { sendMessage } = useWebSocket('ws://localhost:8000/ws/state');

const handleConfigUpdate = () => {
    if (sendMessage) {
        sendTempestConfigUpdate(sendMessage, selectedAsset, {
            ROEThresholdStrategy: {
                roe_threshold: 0.20
            }
        });
    }
};
```

This format ensures consistent communication with the Tempest agent and allows for real-time configuration updates across all supported strategies. 