# Vivienne WebSocket Configuration Guide

This guide explains how to use WebSockets to dynamically update VivienneAgent configurations from your frontend application.

## 📋 Table of Contents

- [Overview](#overview)
- [WebSocket Connection](#websocket-connection)
- [Configuration Update Methods](#configuration-update-methods)
- [Message Formats](#message-formats)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## 🌐 Overview

VivienneAgent supports real-time configuration updates through multiple channels:

1. **WebSocket Messages** - Direct agent communication
2. **REST API + WebSocket** - API updates with real-time state sync
3. **Redis Channels** - Pub/sub pattern for configuration changes

## 🔌 WebSocket Connection

### Connection Setup

```javascript
// Connect to the dashboard WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/state');

ws.onopen = () => {
    console.log('WebSocket connected');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('WebSocket disconnected');
};
```

### Connection Management

```javascript
class VivienneWebSocketManager {
    constructor(url = 'ws://localhost:8000/ws/state') {
        this.url = url;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    connect() {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
            console.log('Vivienne WebSocket connected');
            this.reconnectAttempts = 0;
        };

        this.ws.onclose = () => {
            console.log('Vivienne WebSocket disconnected');
            this.handleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('Vivienne WebSocket error:', error);
        };
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}
```

## ⚙️ Configuration Update Methods

### Method 1: Direct WebSocket Messages (Legacy)

Send configuration updates directly to VivienneAgent via WebSocket:

```javascript
// Legacy flat configuration structure
const legacyConfig = {
    type: "config_update",
    agent: "VivienneAgent",
    asset: "BTC",
    config: {
        bang_threshold: 75.0,
        aim_threshold: 70.0,
        position_size_bang: 13,
        enable_trend_filter_for_entry: true,
        volatility_squeeze_threshold: 0.01425,
        signal_weights: {
            ema_cross: 0.75,
            macd: 0.75,
            rsi: 0.5
        }
    }
};

ws.send(JSON.stringify(legacyConfig));
```

### Method 2: REST API + WebSocket State Sync (Recommended)

Update via REST API and receive real-time state updates:

```javascript
// Update configuration via REST API
async function updateVivienneConfig(config) {
    try {
        const response = await fetch('/phoenix/config/vivienne/comprehensive/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Configuration updated:', result);
            return result;
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Failed to update configuration:', error);
        throw error;
    }
}

// WebSocket will automatically receive updated state
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'asset_data' && data.asset === 'BTC') {
        const vivienneData = data.agents?.VivienneAgent;
        if (vivienneData) {
            updateUI(vivienneData.config);
        }
    }
};
```

### Method 3: Redis Channel Communication

Send configuration updates via Redis channels:

```javascript
// Send to Redis control channel
const redisConfig = {
    type: "control",
    strategy: "general_parameters",
    params: {
        asset_symbol: "BTC",
        bang_threshold: 75.0,
        position_size_bang: 13
    }
};

ws.send(JSON.stringify(redisConfig));
```

## 📝 Message Formats

### 1. Comprehensive Configuration Structure

```javascript
const comprehensiveConfig = {
    settings: {
        description: "Top-level settings for the agent's state and position sizing.",
        state_threshold_bang: 80,
        state_threshold_aim: 70,
        state_threshold_loaded: 50,
        position_size_bang: 0.5,
        position_size_aim: 0.2,
        position_size_loaded: 0.1,
        position_size_idle: 0
    },
    filters: {
        volatility: {
            description: "Blocks trades based on market volatility using Bollinger Bands.",
            enable_bollinger_filter_for_entry: true,
            volatility_squeeze_threshold: 0.015,
            volatility_breakout_threshold: 0.025,
            bollinger_overextended_block: true
        },
        levels: {
            description: "Blocks trades based on support and resistance levels.",
            enable_levels_filter_for_entry: true,
            levels_buffer_percent: 0.003
        },
        underused_alpha: {
            description: "Blocks trades based on trading metrics.",
            retail_chop_trade_count_threshold: 100,
            retail_chop_avg_trade_size_threshold: 50
        },
        combined_vwap: {
            description: "Blocks trades based on VWAP scenarios.",
            weak_pump_trade_count_threshold: 50,
            weak_pump_avg_trade_size_threshold: 100,
            distribution_trade_count_threshold: 200,
            distribution_avg_trade_size_threshold: 500
        }
    },
    signal_weights: {
        ema_cross: 0.75,
        macd: 0.75,
        rsi: 0.5,
        bb_bounce: 0.6,
        bb_breakout: 0.8
    }
};
```

### 2. Partial Update Structure

```javascript
const partialUpdate = {
    settings: {
        state_threshold_bang: 85  // Only update this setting
    },
    filters: {
        volatility: {
            volatility_squeeze_threshold: 0.020  // Only update this filter
        }
    }
};
```

### 3. WebSocket State Response

```javascript
// Expected WebSocket response format
const wsResponse = {
    type: "asset_data",
    asset: "BTC",
    timestamp: "2024-01-01T00:00:00Z",
    agents: {
        VivienneAgent: {
            data: {
                clarity_level: "loaded",
                signal_confidence: 0.85,
                trend_direction: "bullish",
                volatility_status: "normal",
                levels_status: "active"
            },
            config: {
                settings: { /* current settings */ },
                filters: { /* current filters */ },
                signal_weights: { /* current weights */ }
            }
        }
    }
};
```

## 💡 Examples

### Example 1: React Hook for Vivienne Configuration

```javascript
import { useState, useEffect, useCallback } from 'react';

const useVivienneConfig = (assetSymbol = 'BTC') => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ws, setWs] = useState(null);

    // WebSocket connection
    useEffect(() => {
        const websocket = new WebSocket('ws://localhost:8000/ws/state');
        
        websocket.onopen = () => {
            console.log('Connected to Vivienne WebSocket');
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'asset_data' && data.asset === assetSymbol) {
                const vivienneData = data.agents?.VivienneAgent;
                if (vivienneData?.config) {
                    setConfig(vivienneData.config);
                }
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('WebSocket connection failed');
        };

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, [assetSymbol]);

    // Update configuration
    const updateConfig = useCallback(async (newConfig) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/phoenix/config/vivienne/comprehensive/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...newConfig,
                    asset_symbol: assetSymbol
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Configuration updated successfully:', result);
            
            // WebSocket will automatically update the state
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [assetSymbol]);

    // Partial update
    const updatePartialConfig = useCallback(async (partialConfig) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/phoenix/config/vivienne/comprehensive/partial-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...partialConfig,
                    asset_symbol: assetSymbol
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Partial configuration updated successfully:', result);
            
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [assetSymbol]);

    return {
        config,
        loading,
        error,
        updateConfig,
        updatePartialConfig
    };
};
```

### Example 2: Configuration Form Component

```javascript
import React, { useState } from 'react';
import { useVivienneConfig } from './useVivienneConfig';

const VivienneConfigForm = ({ assetSymbol = 'BTC' }) => {
    const { config, loading, error, updateConfig, updatePartialConfig } = useVivienneConfig(assetSymbol);
    const [formData, setFormData] = useState({});

    // Initialize form with current config
    useEffect(() => {
        if (config) {
            setFormData(config);
        }
    }, [config]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await updateConfig(formData);
            alert('Configuration updated successfully!');
        } catch (error) {
            alert(`Failed to update configuration: ${error.message}`);
        }
    };

    const handlePartialUpdate = async (section, key, value) => {
        try {
            await updatePartialConfig({
                [section]: {
                    [key]: value
                }
            });
        } catch (error) {
            alert(`Failed to update ${section}.${key}: ${error.message}`);
        }
    };

    if (loading) return <div>Loading configuration...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!config) return <div>No configuration available</div>;

    return (
        <form onSubmit={handleSubmit}>
            <h3>Vivienne Configuration - {assetSymbol}</h3>
            
            {/* Settings Section */}
            <div>
                <h4>Settings</h4>
                <label>
                    Bang Threshold:
                    <input
                        type="number"
                        value={formData.settings?.state_threshold_bang || ''}
                        onChange={(e) => {
                            const newValue = parseFloat(e.target.value);
                            setFormData(prev => ({
                                ...prev,
                                settings: {
                                    ...prev.settings,
                                    state_threshold_bang: newValue
                                }
                            }));
                            handlePartialUpdate('settings', 'state_threshold_bang', newValue);
                        }}
                    />
                </label>
                
                <label>
                    Position Size (Bang):
                    <input
                        type="number"
                        step="0.1"
                        value={formData.settings?.position_size_bang || ''}
                        onChange={(e) => {
                            const newValue = parseFloat(e.target.value);
                            setFormData(prev => ({
                                ...prev,
                                settings: {
                                    ...prev.settings,
                                    position_size_bang: newValue
                                }
                            }));
                            handlePartialUpdate('settings', 'position_size_bang', newValue);
                        }}
                    />
                </label>
            </div>

            {/* Filters Section */}
            <div>
                <h4>Filters</h4>
                
                {/* Volatility Filter */}
                <div>
                    <h5>Volatility Filter</h5>
                    <label>
                        <input
                            type="checkbox"
                            checked={formData.filters?.volatility?.enable_bollinger_filter_for_entry || false}
                            onChange={(e) => {
                                const newValue = e.target.checked;
                                setFormData(prev => ({
                                    ...prev,
                                    filters: {
                                        ...prev.filters,
                                        volatility: {
                                            ...prev.filters?.volatility,
                                            enable_bollinger_filter_for_entry: newValue
                                        }
                                    }
                                }));
                                handlePartialUpdate('filters', 'volatility', {
                                    ...formData.filters?.volatility,
                                    enable_bollinger_filter_for_entry: newValue
                                });
                            }}
                        />
                        Enable Bollinger Filter
                    </label>
                    
                    <label>
                        Volatility Squeeze Threshold:
                        <input
                            type="number"
                            step="0.001"
                            value={formData.filters?.volatility?.volatility_squeeze_threshold || ''}
                            onChange={(e) => {
                                const newValue = parseFloat(e.target.value);
                                setFormData(prev => ({
                                    ...prev,
                                    filters: {
                                        ...prev.filters,
                                        volatility: {
                                            ...prev.filters?.volatility,
                                            volatility_squeeze_threshold: newValue
                                        }
                                    }
                                }));
                                handlePartialUpdate('filters', 'volatility', {
                                    ...formData.filters?.volatility,
                                    volatility_squeeze_threshold: newValue
                                });
                            }}
                        />
                    </label>
                </div>

                {/* Levels Filter */}
                <div>
                    <h5>Levels Filter</h5>
                    <label>
                        <input
                            type="checkbox"
                            checked={formData.filters?.levels?.enable_levels_filter_for_entry || false}
                            onChange={(e) => {
                                const newValue = e.target.checked;
                                setFormData(prev => ({
                                    ...prev,
                                    filters: {
                                        ...prev.filters,
                                        levels: {
                                            ...prev.filters?.levels,
                                            enable_levels_filter_for_entry: newValue
                                        }
                                    }
                                }));
                                handlePartialUpdate('filters', 'levels', {
                                    ...formData.filters?.levels,
                                    enable_levels_filter_for_entry: newValue
                                });
                            }}
                        />
                        Enable Levels Filter
                    </label>
                </div>
            </div>

            {/* Signal Weights */}
            <div>
                <h4>Signal Weights</h4>
                {Object.entries(formData.signal_weights || {}).map(([key, value]) => (
                    <label key={key}>
                        {key}:
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={value}
                            onChange={(e) => {
                                const newValue = parseFloat(e.target.value);
                                setFormData(prev => ({
                                    ...prev,
                                    signal_weights: {
                                        ...prev.signal_weights,
                                        [key]: newValue
                                    }
                                }));
                                handlePartialUpdate('signal_weights', key, newValue);
                            }}
                        />
                    </label>
                ))}
            </div>

            <button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Configuration'}
            </button>
        </form>
    );
};
```

### Example 3: Real-time Configuration Monitor

```javascript
const VivienneConfigMonitor = ({ assetSymbol = 'BTC' }) => {
    const [configHistory, setConfigHistory] = useState([]);
    const [ws, setWs] = useState(null);

    useEffect(() => {
        const websocket = new WebSocket('ws://localhost:8000/ws/state');
        
        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'asset_data' && data.asset === assetSymbol) {
                const vivienneData = data.agents?.VivienneAgent;
                if (vivienneData?.config) {
                    setConfigHistory(prev => [
                        {
                            timestamp: new Date().toISOString(),
                            config: vivienneData.config
                        },
                        ...prev.slice(0, 9) // Keep last 10 updates
                    ]);
                }
            }
        };

        setWs(websocket);

        return () => websocket.close();
    }, [assetSymbol]);

    return (
        <div>
            <h3>Configuration History - {assetSymbol}</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {configHistory.map((entry, index) => (
                    <div key={index} style={{ border: '1px solid #ccc', margin: '5px', padding: '10px' }}>
                        <strong>Time:</strong> {new Date(entry.timestamp).toLocaleTimeString()}
                        <pre style={{ fontSize: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                            {JSON.stringify(entry.config, null, 2)}
                        </pre>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

## ⚠️ Error Handling

### WebSocket Error Handling

```javascript
const handleWebSocketError = (error) => {
    console.error('WebSocket error:', error);
    
    // Implement retry logic
    if (ws.readyState === WebSocket.CLOSED) {
        setTimeout(() => {
            console.log('Attempting to reconnect...');
            connectWebSocket();
        }, 5000);
    }
};

const handleConfigurationError = (error) => {
    console.error('Configuration update error:', error);
    
    // Show user-friendly error message
    const errorMessage = error.message || 'Failed to update configuration';
    alert(`Configuration Error: ${errorMessage}`);
    
    // Optionally retry the update
    if (error.message.includes('timeout')) {
        setTimeout(() => {
            retryConfigurationUpdate();
        }, 2000);
    }
};
```

### Validation

```javascript
const validateConfiguration = (config) => {
    const errors = [];

    // Validate settings
    if (config.settings) {
        const { state_threshold_bang, state_threshold_aim, state_threshold_loaded } = config.settings;
        
        if (state_threshold_bang < 0 || state_threshold_bang > 100) {
            errors.push('Bang threshold must be between 0 and 100');
        }
        
        if (state_threshold_aim < 0 || state_threshold_aim > 100) {
            errors.push('Aim threshold must be between 0 and 100');
        }
        
        if (state_threshold_loaded < 0 || state_threshold_loaded > 100) {
            errors.push('Loaded threshold must be between 0 and 100');
        }
    }

    // Validate filters
    if (config.filters?.volatility) {
        const { volatility_squeeze_threshold, volatility_breakout_threshold } = config.filters.volatility;
        
        if (volatility_squeeze_threshold < 0) {
            errors.push('Volatility squeeze threshold must be positive');
        }
        
        if (volatility_breakout_threshold < 0) {
            errors.push('Volatility breakout threshold must be positive');
        }
    }

    // Validate signal weights
    if (config.signal_weights) {
        Object.entries(config.signal_weights).forEach(([key, value]) => {
            if (value < 0 || value > 1) {
                errors.push(`Signal weight ${key} must be between 0 and 1`);
            }
        });
    }

    return errors;
};
```

## 🏆 Best Practices

### 1. Connection Management

```javascript
// Always handle connection lifecycle
const useWebSocketConnection = (url) => {
    const [isConnected, setIsConnected] = useState(false);
    const [ws, setWs] = useState(null);

    const connect = useCallback(() => {
        const websocket = new WebSocket(url);
        
        websocket.onopen = () => {
            setIsConnected(true);
            console.log('WebSocket connected');
        };

        websocket.onclose = () => {
            setIsConnected(false);
            console.log('WebSocket disconnected');
        };

        setWs(websocket);
    }, [url]);

    const disconnect = useCallback(() => {
        if (ws) {
            ws.close();
            setWs(null);
        }
    }, [ws]);

    useEffect(() => {
        connect();
        return disconnect;
    }, [connect, disconnect]);

    return { isConnected, ws, connect, disconnect };
};
```

### 2. Debounced Updates

```javascript
import { debounce } from 'lodash';

const debouncedUpdateConfig = debounce(async (config) => {
    try {
        await updateVivienneConfig(config);
    } catch (error) {
        console.error('Debounced update failed:', error);
    }
}, 1000); // Wait 1 second after last change
```

### 3. Configuration Caching

```javascript
const useConfigCache = () => {
    const [cache, setCache] = useState(new Map());

    const getCachedConfig = useCallback((assetSymbol) => {
        return cache.get(assetSymbol);
    }, [cache]);

    const setCachedConfig = useCallback((assetSymbol, config) => {
        setCache(prev => new Map(prev).set(assetSymbol, config));
    }, []);

    return { getCachedConfig, setCachedConfig };
};
```

### 4. Real-time Validation

```javascript
const useRealTimeValidation = (config) => {
    const [validationErrors, setValidationErrors] = useState([]);

    useEffect(() => {
        const errors = validateConfiguration(config);
        setValidationErrors(errors);
    }, [config]);

    return validationErrors;
};
```

## 📚 API Reference

### WebSocket Endpoints

- `ws://localhost:8000/ws/state` - Real-time state updates
- `ws://localhost:8000/ws/logs` - Real-time log streaming

### REST API Endpoints

- `POST /phoenix/config/vivienne/comprehensive/update` - Full configuration update
- `POST /phoenix/config/vivienne/comprehensive/partial-update` - Partial configuration update
- `GET /phoenix/config/vivienne/comprehensive/active` - Get active configuration
- `GET /phoenix/config/vivienne/comprehensive/all` - Get all configurations
- `DELETE /phoenix/config/vivienne/comprehensive/{config_id}` - Delete configuration

### Message Types

- `asset_data` - Real-time asset and agent data
- `config_update` - Configuration update messages
- `control` - Control messages for agent operations

This guide provides everything you need to implement real-time Vivienne configuration updates in your frontend application! 