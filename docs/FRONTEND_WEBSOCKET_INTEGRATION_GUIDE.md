# Frontend WebSocket Integration Guide

## Overview

This guide provides the complete specification for integrating with the AEON trading system's WebSocket API and data structures. All agents follow consistent patterns for real-time data streaming and configuration management.

## WebSocket Connection

### Endpoint
```
ws://localhost:8000/ws/state
```

### Connection Pattern
```javascript
const websocket = new WebSocket('ws://localhost:8000/ws/state');

websocket.onopen = function(event) {
    console.log('Connected to AEON WebSocket');
};

websocket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
};

websocket.onerror = function(error) {
    console.error('WebSocket error:', error);
};

websocket.onclose = function(event) {
    console.log('WebSocket connection closed');
};
```

## WebSocket Message Structure

### Incoming Messages (Server → Frontend)

#### Asset Data Updates
```json
{
  "type": "asset_data",
  "asset": "BTC",
  "timestamp": "2024-01-01T12:00:00Z",
  "agents": {
    "AuroraAgent": {
      "data": {
        "metadata": {
          "asset_symbol": "BTC",
          "last_updated": "2024-01-01T12:00:00Z",
          "data_version": "2.0"
        },
        "candles": [
          {
            "time": 1704110400000,
            "open": 50000.0,
            "high": 51000.0,
            "low": 49000.0,
            "close": 50500.0,
            "volume": 1000.0,
            "vwap": 50250.0
          }
        ],
        "indicators": {
          "ema_3": 50400.0,
          "ema_21": 49800.0,
          "macd": 200.0,
          "rsi": 65.5
        },
        "signals": [
          {
            "name": "ema_cross",
            "value": true,
            "weight": 0.75,
            "confidence": 0.8,
            "is_bullish": true,
            "details": "Bullish: Fast EMA (3) is above Slow EMA (21)",
            "category": "TREND",
            "timestamp": "2024-01-01T12:00:00Z"
          }
        ],
        "filter_status": {
          "clarity_level": "BANG",
          "signal_confidence": 0.85,
          "trend_direction": "BULLISH",
          "volatility_status": "HIGH",
          "levels_status": "ACTIVE",
          "chaos_discerned": {
            "sentiment": "BULLISH",
            "state": "ACTIVE",
            "sorting_signals": {
              "long": [
                {
                  "name": "ema_cross",
                  "value": true,
                  "weight": 0.75,
                  "confidence": 0.8,
                  "is_bullish": true,
                  "details": "Bullish: Fast EMA (3) is above Slow EMA (21)",
                  "category": "TREND"
                }
              ],
              "short": [
                {
                  "name": "bb_bounce",
                  "value": false,
                  "weight": 0.5,
                  "confidence": 0.3,
                  "is_bullish": false,
                  "details": "No Bollinger Band bounce signal",
                  "category": "MEAN_REVERSION"
                }
              ],
              "neutral": []
            }
          }
        },
        "positions": {
          "current_position": {
            "size": 100,
            "entry_price": 50000.0,
            "current_price": 50500.0,
            "unrealized_pnl": 500.0,
            "roi_percent": 1.0
          }
        },
        "account": {
          "balance": 10000.0,
          "available_margin": 9500.0,
          "used_margin": 500.0
        }
      },
      "config": {
        "agatha_sync_interval": 30,
        "observation_window_octavia": 100,
        "observation_window_vivienne_events": 50,
        "observation_window_vesper_events": 50,
        "observation_window_tempest_events": 50,
        "broadcast_interval": 5,
        "last_updated": "2024-01-01T12:00:00Z"
      }
    },
    "VivienneAgent": {
      "data": {
        "clarity_level": "BANG",
        "signal_confidence": 0.85,
        "trend_direction": "BULLISH",
        "volatility_status": "HIGH",
        "levels_status": "ACTIVE",
        "signals": [
          {
            "name": "ema_cross",
            "value": true,
            "weight": 0.75,
            "confidence": 0.8,
            "is_bullish": true,
            "details": "Bullish: Fast EMA (3) is above Slow EMA (21)",
            "category": "TREND"
          }
        ],
        "summary": {
          "total_signals": 5,
          "bullish_signals": 3,
          "bearish_signals": 2,
          "neutral_signals": 0
        },
        "recommendation": {
          "action": "BUY",
          "confidence": 0.85,
          "reason": "Strong bullish trend with multiple confirming signals"
        },
        "chaos_discerned": {
          "sentiment": "BULLISH",
          "state": "ACTIVE",
          "sorting_signals": {
            "long": [...],
            "short": [...],
            "neutral": []
          }
        },
        "filter_analysis": {
          "volatility_filter": "PASSED",
          "confidence_filter": "PASSED",
          "trend_filter": "PASSED"
        }
      },
      "config": {
        "bang_threshold": 0.8,
        "aim_threshold": 0.6,
        "loaded_threshold": 0.4,
        "position_size_bang": 100,
        "volatility_threshold": 0.05,
        "confidence_threshold": 0.7,
        "trend_sensitivity": 0.8,
        "signal_weights": {
          "ema_cross": 0.75,
          "macd": 0.6,
          "rsi": 0.5
        },
        "last_updated": "2024-01-01T12:00:00Z"
      }
    },
    "VesperAgent": {
      "data": {
        "position": {
          "size": 100,
          "entry_price": 50000.0,
          "current_price": 50500.0,
          "unrealized_pnl": 500.0,
          "roi_percent": 1.0,
          "side": "LONG",
          "status": "OPEN"
        },
        "metrics": {
          "total_trades": 25,
          "winning_trades": 18,
          "losing_trades": 7,
          "win_rate": 0.72,
          "average_win": 250.0,
          "average_loss": -150.0,
          "profit_factor": 1.67
        }
      },
      "config": {
        "position_size": 100,
        "max_positions": 1,
        "stop_loss_percent": 0.02,
        "take_profit_percent": 0.05,
        "last_updated": "2024-01-01T12:00:00Z"
      }
    },
    "OctaviaAgent": {
      "data": {
        "market_data": {
          "current_price": 50500.0,
          "24h_change": 2.5,
          "24h_volume": 1500000.0
        },
        "indicators": {
          "ema_3": 50400.0,
          "ema_21": 49800.0,
          "macd": 200.0,
          "rsi": 65.5,
          "bollinger_bands": {
            "upper": 52000.0,
            "middle": 50500.0,
            "lower": 49000.0
          }
        },
        "levels": {
          "resistance": [51000.0, 52000.0, 53000.0],
          "support": [50000.0, 49000.0, 48000.0]
        }
      },
      "config": {
        "indicator_periods": {
          "ema_fast": 3,
          "ema_slow": 21,
          "macd_fast": 12,
          "macd_slow": 26,
          "rsi_period": 14
        },
        "update_interval": 5,
        "last_updated": "2024-01-01T12:00:00Z"
      }
    }
  }
}
```

#### Configuration Update Response
```json
{
  "type": "config_update_response",
  "status": "success",
  "message": "Configuration updated successfully",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Outgoing Messages (Frontend → Server)

#### Configuration Update
```json
{
  "type": "config_update",
  "agent": "VivienneAgent",
  "asset": "BTC",
  "config": {
    "bang_threshold": 0.85,
    "aim_threshold": 0.7,
    "loaded_threshold": 0.5,
    "position_size_bang": 150,
    "volatility_threshold": 0.06,
    "confidence_threshold": 0.75,
    "trend_sensitivity": 0.9
  }
}
```

## Agent Data Structures

### AuroraAgent
**Purpose**: Frontend data aggregator and chart provider

**Key Data Fields**:
- `candles`: OHLCV chart data with indicators
- `signals`: Array of trading signals with metadata
- `filter_status`: Vivienne's analysis results including `chaos_discerned`
- `positions`: Current position information
- `account`: Account balance and margin data

**Key Config Fields**:
- `agatha_sync_interval`: How often to sync with Agatha (seconds)
- `observation_window_*`: How many historical events to keep
- `broadcast_interval`: How often to broadcast updates (seconds)

### VivienneAgent
**Purpose**: Signal processing and trade decision making

**Key Data Fields**:
- `clarity_level`: "BANG", "AIM", "LOADED", or "IDLE"
- `signal_confidence`: Overall confidence score (0-1)
- `trend_direction`: "BULLISH", "BEARISH", or "NEUTRAL"
- `signals`: Array of individual trading signals
- `chaos_discerned`: Advanced signal analysis with `sorting_signals`
- `filter_analysis`: Status of various filters

**Key Config Fields**:
- `bang_threshold`: Threshold for "BANG" clarity level
- `aim_threshold`: Threshold for "AIM" clarity level
- `position_size_bang`: Position size for "BANG" signals
- `signal_weights`: Weights for different signal types

### VesperAgent
**Purpose**: Position management and execution

**Key Data Fields**:
- `position`: Current position details (size, entry price, PnL)
- `metrics`: Trading performance statistics

**Key Config Fields**:
- `position_size`: Default position size
- `stop_loss_percent`: Stop loss percentage
- `take_profit_percent`: Take profit percentage

### OctaviaAgent
**Purpose**: Market data collection and indicator calculation

**Key Data Fields**:
- `market_data`: Current price and volume data
- `indicators`: Technical indicators (EMA, MACD, RSI, etc.)
- `levels`: Support and resistance levels

**Key Config Fields**:
- `indicator_periods`: Periods for various indicators
- `update_interval`: How often to update data

## Frontend Implementation Examples

### React Hook for WebSocket
```javascript
import { useState, useEffect, useRef } from 'react';

function useAEONWebSocket() {
  const [data, setData] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const websocketRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/state');
    websocketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to AEON WebSocket');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'asset_data') {
        setData(message);
      } else if (message.type === 'config_update_response') {
        console.log('Config update response:', message);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket connection closed');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const updateConfig = (agent, asset, config) => {
    if (websocketRef.current && isConnected) {
      const message = {
        type: 'config_update',
        agent,
        asset,
        config
      };
      websocketRef.current.send(JSON.stringify(message));
    }
  };

  return { data, isConnected, updateConfig };
}
```

### React Component Example
```javascript
import React from 'react';
import { useAEONWebSocket } from './useAEONWebSocket';

function TradingDashboard() {
  const { data, isConnected, updateConfig } = useAEONWebSocket();

  const handleConfigUpdate = () => {
    updateConfig('VivienneAgent', 'BTC', {
      bang_threshold: 0.85,
      position_size_bang: 150
    });
  };

  if (!isConnected) {
    return <div>Connecting to AEON...</div>;
  }

  const auroraData = data.agents?.AuroraAgent?.data;
  const vivienneData = data.agents?.VivienneAgent?.data;
  const vesperData = data.agents?.VesperAgent?.data;

  return (
    <div>
      <h1>AEON Trading Dashboard</h1>
      
      {/* Aurora Data - Charts */}
      <div>
        <h2>Market Data</h2>
        <p>Current Price: ${auroraData?.candles?.[0]?.close}</p>
        <p>Clarity Level: {auroraData?.filter_status?.clarity_level}</p>
      </div>

      {/* Vivienne Data - Signals */}
      <div>
        <h2>Signal Analysis</h2>
        <p>Trend: {vivienneData?.trend_direction}</p>
        <p>Confidence: {(vivienneData?.signal_confidence * 100).toFixed(1)}%</p>
        
        {/* Sorting Signals */}
        <div>
          <h3>Signal Distribution</h3>
          <p>Bullish Signals: {vivienneData?.chaos_discerned?.sorting_signals?.long?.length || 0}</p>
          <p>Bearish Signals: {vivienneData?.chaos_discerned?.sorting_signals?.short?.length || 0}</p>
        </div>
      </div>

      {/* Vesper Data - Positions */}
      <div>
        <h2>Position</h2>
        <p>Size: {vesperData?.position?.size}</p>
        <p>PnL: ${vesperData?.position?.unrealized_pnl}</p>
        <p>ROI: {vesperData?.position?.roi_percent}%</p>
      </div>

      {/* Configuration Controls */}
      <div>
        <h2>Configuration</h2>
        <button onClick={handleConfigUpdate}>
          Update Vivienne Config
        </button>
      </div>
    </div>
  );
}
```

## Data Update Patterns

### Real-time Updates
- **Frequency**: Every 5 seconds (configurable via `broadcast_interval`)
- **Structure**: Complete agent data and configuration
- **Optimization**: Only send changed data (implemented in backend)

### Configuration Updates
- **Immediate**: Changes applied instantly via WebSocket
- **Persistence**: Stored in Redis for asset-specific and global configs
- **Validation**: Backend validates configuration values before applying

## Error Handling

### Connection Issues
```javascript
websocket.onclose = function(event) {
  if (event.code === 1006) {
    console.log('Connection lost, attempting to reconnect...');
    setTimeout(connectWebSocket, 5000);
  }
};
```

### Message Parsing
```javascript
websocket.onmessage = function(event) {
  try {
    const data = JSON.parse(event.data);
    handleMessage(data);
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
  }
};
```

### Configuration Errors
```javascript
// Handle configuration update responses
if (data.type === 'config_update_response') {
  if (data.status === 'error') {
    console.error('Configuration update failed:', data.message);
    // Show error to user
  } else {
    console.log('Configuration updated successfully');
    // Update UI to reflect changes
  }
}
```

## Best Practices

### 1. Connection Management
- Implement automatic reconnection with exponential backoff
- Handle connection state in UI (loading, connected, disconnected)
- Gracefully handle network interruptions

### 2. Data Handling
- Use React state management for WebSocket data
- Implement proper cleanup in useEffect hooks
- Handle missing or incomplete data gracefully

### 3. Configuration Updates
- Validate configuration values before sending
- Provide immediate UI feedback for configuration changes
- Handle configuration update failures gracefully

### 4. Performance
- Debounce rapid configuration updates
- Use React.memo for components that don't need frequent updates
- Implement virtual scrolling for large data sets

### 5. User Experience
- Show connection status to users
- Provide loading states during configuration updates
- Display error messages for failed operations

## Testing

### WebSocket Testing
```javascript
// Test WebSocket connection
const testWebSocket = () => {
  const ws = new WebSocket('ws://localhost:8000/ws/state');
  
  ws.onopen = () => {
    console.log('WebSocket connected successfully');
    ws.close();
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket connection failed:', error);
  };
};
```

### Configuration Testing
```javascript
// Test configuration update
const testConfigUpdate = async () => {
  const ws = new WebSocket('ws://localhost:8000/ws/state');
  
  ws.onopen = () => {
    const message = {
      type: 'config_update',
      agent: 'VivienneAgent',
      asset: 'BTC',
      config: {
        bang_threshold: 0.9
      }
    };
    ws.send(JSON.stringify(message));
  };
  
  ws.onmessage = (event) => {
    const response = JSON.parse(event.data);
    if (response.type === 'config_update_response') {
      console.log('Config update test result:', response);
      ws.close();
    }
  };
};
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Fails**
   - Check if the backend server is running on port 8000
   - Verify WebSocket endpoint is available
   - Check network connectivity

2. **No Data Received**
   - Verify agents are running and broadcasting data
   - Check Redis connection in backend
   - Review agent configuration

3. **Configuration Updates Don't Persist**
   - Check Redis connection
   - Verify agent is loading config from Redis
   - Review configuration validation

4. **Performance Issues**
   - Reduce broadcast frequency if needed
   - Implement data filtering on frontend
   - Use React optimization techniques

### Debug Commands
```bash
# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" http://localhost:8000/ws/state

# Check Redis data
redis-cli get "asset:btc:aurora_data" | jq .
redis-cli get "config:vivienne:btc" | jq .

# Check agent status
curl http://localhost:8000/health
```

## Conclusion

This guide provides everything needed to integrate with the AEON trading system's WebSocket API. The system follows consistent patterns across all agents, making it easy to build comprehensive trading dashboards and monitoring tools.

For questions or updates to this specification, please refer to the backend development team or create an issue in the project repository. 