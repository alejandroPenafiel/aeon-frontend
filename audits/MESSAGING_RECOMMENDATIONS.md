# WebSocket Messaging Recommendations for Frontend Integration

**Version:** 1.0  
**Date:** August 4, 2025  
**Target Audience:** Frontend Developers  

This document provides comprehensive guidance for integrating with the Hyperlyquid Trading Dashboard API's WebSocket messaging system. It covers the unified protocol, best practices, and production-ready integration patterns.

## Table of Contents

- [Protocol Overview](#protocol-overview)
- [WebSocket Connection Management](#websocket-connection-management)
- [Message Schema Reference](#message-schema-reference)
- [Agent-Specific Integration](#agent-specific-integration)
- [Configuration Management](#configuration-management)
- [Real-Time Updates](#real-time-updates)
- [Error Handling](#error-handling)
- [Security & Authentication](#security--authentication)
- [Performance Optimization](#performance-optimization)
- [Migration Guide](#migration-guide)
- [TypeScript Integration](#typescript-integration)
- [React Integration Examples](#react-integration-examples)

## Protocol Overview

The Dashboard API implements a unified WebSocket protocol that provides consistent messaging patterns across all trading agents. The protocol supports:

- **Request/Response Correlation**: Every request includes a `request_id` for precise response matching
- **Type Safety**: All messages are validated using Pydantic schemas
- **Protocol Versioning**: Built-in versioning for gradual migration
- **Agent Agnostic**: Unified interface for all agents (Vivienne, Tempest, Vesper, Aurora)
- **Real-Time Updates**: Immediate cache invalidation and state broadcasting
- **Backward Compatibility**: Legacy message format support during transition

### Protocol Design Principles

1. **Consistency**: All messages follow the same base structure
2. **Type Safety**: Strong typing for all parameters and responses
3. **Correlation**: Request/response tracking with unique IDs
4. **Extensibility**: New fields and message types can be added without breaking changes
5. **Performance**: Optimized for high-frequency trading operations

## WebSocket Connection Management

### Connection Endpoints

```typescript
// State updates and configuration management
const WS_STATE_URL = "ws://localhost:8000/ws/state";

// Log streaming (read-only)
const WS_LOGS_URL = "ws://localhost:8000/ws/logs";
```

### Basic Connection Setup

```typescript
interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  timeout?: number;
}

class TradingWebSocket {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      timeout: 30000,
      ...config
    };
  }
  
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.ws.onmessage = this.handleMessage.bind(this);
        this.ws.onclose = this.handleClose.bind(this);
        this.ws.onerror = this.handleError.bind(this);
        
        // Connection timeout
        setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, this.config.timeout);
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private handleClose(): void {
    console.log('WebSocket disconnected');
    this.attemptReconnect();
  }
  
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(console.error);
    }, this.config.reconnectInterval);
  }
  
  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }
  
  close(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close();
  }
}
```

### React Hook for WebSocket Management

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const wsRef = useRef<TradingWebSocket | null>(null);
  const pendingRequests = useRef<Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>>(new Map());
  
  const connect = useCallback(async () => {
    if (wsRef.current) return;
    
    setConnectionState('connecting');
    
    try {
      wsRef.current = new TradingWebSocket({
        url: options.url,
        reconnectInterval: options.reconnectInterval
      });
      
      wsRef.current.onMessage = (data) => {
        // Handle request/response correlation
        if (data.request_id && pendingRequests.current.has(data.request_id)) {
          const { resolve, timeout } = pendingRequests.current.get(data.request_id)!;
          clearTimeout(timeout);
          pendingRequests.current.delete(data.request_id);
          resolve(data);
        } else {
          options.onMessage?.(data);
        }
      };
      
      await wsRef.current.connect();
      setIsConnected(true);
      setConnectionState('connected');
      
    } catch (error) {
      setIsConnected(false);
      setConnectionState('disconnected');
      options.onError?.(error as Event);
    }
  }, [options]);
  
  const sendMessage = useCallback((message: any, expectResponse = false, timeoutMs = 10000): Promise<any> => {
    if (!wsRef.current || !isConnected) {
      throw new Error('WebSocket not connected');
    }
    
    if (expectResponse) {
      return new Promise((resolve, reject) => {
        const requestId = message.request_id || generateRequestId();
        message.request_id = requestId;
        
        const timeout = setTimeout(() => {
          pendingRequests.current.delete(requestId);
          reject(new Error('Request timeout'));
        }, timeoutMs);
        
        pendingRequests.current.set(requestId, { resolve, reject, timeout });
        wsRef.current!.send(message);
      });
    } else {
      wsRef.current.send(message);
      return Promise.resolve();
    }
  }, [isConnected]);
  
  useEffect(() => {
    connect();
    
    return () => {
      // Clear pending requests
      pendingRequests.current.forEach(({ timeout }) => clearTimeout(timeout));
      pendingRequests.current.clear();
      
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);
  
  return {
    isConnected,
    connectionState,
    sendMessage,
    reconnect: connect
  };
}

function generateRequestId(): string {
  return crypto.randomUUID();
}
```

## Message Schema Reference

### Base Message Structure

All messages inherit from the base WebSocket message structure:

```typescript
interface BaseWebSocketMessage {
  type: MessageType;
  request_id?: string;
  timestamp?: string; // ISO 8601 UTC
  protocol_version?: string; // Default: "1.0"
}
```

### Message Types

```typescript
enum MessageType {
  // Configuration
  CONFIG_UPDATE = "config_update",
  CONFIG_UPDATE_RESPONSE = "config_update_response",
  
  // Data requests
  DATA_REQUEST = "data_request",
  DATA_RESPONSE = "data_response",
  
  // Agent control
  AGENT_CONTROL = "agent_control",
  AGENT_CONTROL_RESPONSE = "agent_control_response",
  
  // Status
  STATUS_REQUEST = "status_request",
  STATUS_RESPONSE = "status_response",
  
  // State updates
  STATE_UPDATE = "state_update",
  
  // Errors
  ERROR = "error"
}

enum AgentType {
  VIVIENNE = "vivienne",
  TEMPEST = "tempest",
  VESPER = "vesper",
  AURORA = "aurora"
}

enum ErrorType {
  VALIDATION_ERROR = "validation_error",
  PROTOCOL_ERROR = "protocol_error",
  INTERNAL_ERROR = "internal_error",
  AGENT_ERROR = "agent_error",
  TIMEOUT_ERROR = "timeout_error"
}
```

### Configuration Update Messages

#### Request Format

```typescript
interface ConfigUpdateMessage extends BaseWebSocketMessage {
  type: "config_update";
  agent: AgentType;
  asset?: string; // Asset symbol (e.g., "BTC", "ETH") or null for global
  parameters: Record<string, any>;
  update_type?: "partial" | "full"; // Default: "partial"
  validate_only?: boolean; // Default: false
}

// Example
const configUpdate: ConfigUpdateMessage = {
  type: "config_update",
  request_id: "550e8400-e29b-41d4-a716-446655440000",
  timestamp: "2025-08-04T02:30:00.000Z",
  protocol_version: "1.0",
  agent: "vivienne",
  asset: "BTC",
  parameters: {
    take_profit_percentage: 2.5,
    stop_loss_percentage: 1.5,
    min_trade_size: 100.0,
    max_position_size: 1000.0
  },
  update_type: "partial",
  validate_only: false
};
```

#### Response Format

```typescript
interface ConfigUpdateResponse extends BaseWebSocketMessage {
  type: "config_update_response";
  status: "success" | "error" | "warning";
  agent: AgentType;
  asset?: string;
  message: string;
  updated_parameters?: string[];
  validation_errors?: Record<string, string>;
  warnings?: Record<string, string>;
  corrected_values?: Record<string, any>;
  cache_refresh_triggered?: boolean;
  applied_config?: Record<string, any>;
}
```

### Data Request Messages

#### Request Format

```typescript
interface DataRequestMessage extends BaseWebSocketMessage {
  type: "data_request";
  agent: AgentType;
  asset?: string;
  data_types?: string[]; // ["config", "state", "clarity", "positions", etc.]
  include_config?: boolean;
  include_metadata?: boolean;
  filters?: Record<string, any>;
}

// Example
const dataRequest: DataRequestMessage = {
  type: "data_request",
  request_id: "req-123-456",
  agent: "vivienne",
  asset: "BTC",
  data_types: ["config", "clarity", "analysis"],
  include_config: true,
  include_metadata: true,
  filters: {
    timeframe: "1h",
    limit: 100
  }
};
```

#### Response Format

```typescript
interface DataResponse extends BaseWebSocketMessage {
  type: "data_response";
  agent: AgentType;
  asset?: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  data_timestamp?: string;
  cache_status?: "hit" | "miss" | "stale";
}
```

### Agent Control Messages

```typescript
enum ControlAction {
  START = "start",
  STOP = "stop",
  RESTART = "restart",
  PAUSE = "pause",
  RESUME = "resume",
  RESET_COOLDOWN = "reset_cooldown",
  FORCE_CLOSE_POSITION = "force_close_position",
  EMERGENCY_STOP = "emergency_stop"
}

interface AgentControlMessage extends BaseWebSocketMessage {
  type: "agent_control";
  agent: AgentType;
  action: ControlAction;
  asset?: string;
  parameters?: Record<string, any>;
  timeout_seconds?: number; // Max: 300
}

interface AgentControlResponse extends BaseWebSocketMessage {
  type: "agent_control_response";
  agent: AgentType;
  action: ControlAction;
  status: "success" | "error" | "timeout" | "pending";
  message: string;
  result_data?: Record<string, any>;
  execution_time_ms?: number;
}
```

### Status Request Messages

```typescript
interface StatusRequestMessage extends BaseWebSocketMessage {
  type: "status_request";
  target: "agent" | "system" | "all";
  agent?: AgentType; // Required if target === "agent"
  include_config?: boolean;
  include_metrics?: boolean;
}

interface StatusResponse extends BaseWebSocketMessage {
  type: "status_response";
  target: string;
  status: Record<string, any>;
  health_score?: number; // 0.0 - 1.0
  alerts?: string[];
}
```

### Error Messages

```typescript
interface ErrorMessage extends BaseWebSocketMessage {
  type: "error";
  error_type: ErrorType;
  error_code?: string;
  message: string;
  details?: Record<string, any>;
  original_request?: Record<string, any>;
  suggestion?: string;
  retry_after_seconds?: number;
}
```

### State Update Messages (Incoming Only)

```typescript
interface StateUpdateMessage extends BaseWebSocketMessage {
  type: "state_update";
  agent?: AgentType;
  asset?: string;
  update_type: string;
  state_data: Record<string, any>;
  affected_clients?: string[];
}
```

## Agent-Specific Integration

### VivienneAgent Integration

Vivienne is the primary analysis and configuration agent. It handles market analysis, signal generation, and trading parameters.

#### Key Configuration Parameters

```typescript
interface VivienneConfig {
  // Trading parameters
  take_profit_percentage: number;    // 0.1 - 10.0
  stop_loss_percentage: number;      // 0.1 - 5.0
  min_trade_size: number;           // Minimum trade size in USD
  max_position_size: number;        // Maximum position size in USD
  
  // Analysis parameters
  analysis_timeframe: string;        // "1m", "5m", "15m", "1h", "4h", "1d"
  signal_confidence_threshold: number; // 0.0 - 1.0
  
  // Risk management
  max_daily_trades: number;         // Maximum trades per day
  max_concurrent_positions: number; // Maximum open positions
  
  // Advanced settings
  use_dynamic_stop_loss: boolean;
  enable_trailing_stop: boolean;
  volatility_adjustment: boolean;
}

// Example configuration update
async function updateVivienneConfig(asset: string, config: Partial<VivienneConfig>) {
  const response = await sendMessage({
    type: "config_update",
    request_id: generateRequestId(),
    agent: "vivienne",
    asset: asset,
    parameters: config,
    validate_only: false
  }, true);
  
  if (response.status === "success") {
    console.log("Vivienne configuration updated successfully");
    if (response.cache_refresh_triggered) {
      console.log("Immediate cache refresh triggered");
    }
  } else {
    console.error("Configuration update failed:", response.message);
    if (response.validation_errors) {
      console.log("Validation errors:", response.validation_errors);
    }
  }
}
```

#### Vivienne Data Requests

```typescript
async function getVivienneAnalysis(asset: string) {
  const response = await sendMessage({
    type: "data_request",
    request_id: generateRequestId(),
    agent: "vivienne",
    asset: asset,
    data_types: ["clarity", "analysis", "signals"],
    include_config: true,
    include_metadata: true
  }, true);
  
  return {
    clarity: response.data.clarity,
    analysis: response.data.analysis,
    signals: response.data.signals,
    config: response.data.current_config,
    timestamp: response.data_timestamp
  };
}
```

### TempestAgent Integration

Tempest handles position management and strategy execution.

#### Key Configuration Parameters

```typescript
interface TempestConfig {
  // System-level parameters (nested in "top-level")
  "top-level": {
    pause_closure: boolean;              // Pause all position closures for this asset
  };
  
  // Strategy settings
  strategy_type: "momentum" | "mean_reversion" | "breakout";
  risk_level: "conservative" | "moderate" | "aggressive";
  
  // Position management
  position_sizing_method: "fixed" | "percentage" | "kelly";
  max_leverage: number;              // 1 - 100
  
  // Execution settings
  slippage_tolerance: number;        // 0.001 - 0.01
  execution_delay_ms: number;        // 0 - 5000
  
  // Risk controls
  max_drawdown_percentage: number;   // 1.0 - 20.0
  daily_loss_limit: number;         // Daily loss limit in USD
  
  // Advanced features
  enable_partial_fills: boolean;
  use_smart_routing: boolean;
}

// Example: Pause position closures for BTC
async function pauseTempestClosures(asset: string) {
  return await sendMessage({
    type: "config_update",
    agent: "tempest",
    asset: asset,
    parameters: {
      "top-level": {
        pause_closure: true  // System-level parameter
      }
    }
  }, true);
}

// Example: Resume position closures for BTC
async function resumeTempestClosures(asset: string) {
  return await sendMessage({
    type: "config_update", 
    agent: "tempest",
    asset: asset,
    parameters: {
      "top-level": {
        pause_closure: false  // System-level parameter
      }
    }
  }, true);
}

// Example: Update strategy parameters
async function updateTempestStrategy(asset: string, strategy: Partial<TempestConfig>) {
  return await sendMessage({
    type: "config_update",
    agent: "tempest", 
    asset: asset,
    parameters: strategy
  }, true);
}

// Example: Update both system and strategy parameters
async function updateTempestConfig(asset: string) {
  return await sendMessage({
    type: "config_update",
    agent: "tempest",
    asset: asset,
    parameters: {
      "top-level": {
        pause_closure: true
      },
      "roe_threshold_strategy": {
        min_roe_threshold: 0.15,
        max_roe_threshold: 2.0
      }
    }
  }, true);
}
```

#### Important Notes for TempestAgent

1. **System-Level Parameters**: System-level parameters like `pause_closure` are nested inside a `"top-level"` object within the `parameters`.

2. **Parameter Organization**: All parameters follow the same nesting pattern:
   - `"top-level"`: System-level parameters (pause_closure, etc.)
   - `"strategy_name"`: Strategy-specific parameters

3. **Validation**: The `pause_closure` parameter must be a boolean value. Other parameters follow standard validation rules.

4. **Real-Time Updates**: Changes to `pause_closure` take effect immediately and are broadcast to all connected clients.

```typescript
// ✅ CORRECT - pause_closure nested in "top-level"
const correctConfig = {
  type: "config_update",
  agent: "tempest",
  asset: "BTC",
  parameters: {
    "top-level": {
      pause_closure: true  // ✅ System-level parameter
    },
    "roe_threshold_strategy": {  // ✅ Strategy parameter
      min_roe_threshold: 0.15
    }
  }
};

// ❌ INCORRECT - Don't place pause_closure at the root level
const incorrectConfig = {
  type: "config_update", 
  agent: "tempest",
  asset: "BTC",
  parameters: {
    pause_closure: true,  // ❌ This won't work as expected
    "roe_threshold_strategy": {
      min_roe_threshold: 0.15
    }
  }
};

// ❌ INCORRECT - Don't nest pause_closure in a strategy
const alsoIncorrectConfig = {
  type: "config_update", 
  agent: "tempest",
  asset: "BTC",
  parameters: {
    "some_strategy": {
      pause_closure: true  // ❌ This won't work as expected
    }
  }
};
```

### VesperAgent Integration

Vesper manages cooldowns, position tracking, and trade execution coordination.

#### Key Configuration Parameters

```typescript
interface VesperConfig {
  // Cooldown settings
  cooldown_minutes_after_loss: number;    // 5 - 1440
  cooldown_minutes_after_profit: number;  // 1 - 60
  
  // Position settings
  max_position_hold_time: number;         // Hours: 1 - 168
  force_close_on_weekend: boolean;
  
  // Coordination settings
  sync_with_vivienne: boolean;
  sync_with_tempest: boolean;
  
  // Emergency controls
  emergency_stop_loss: number;            // Percentage: 5.0 - 50.0
  max_consecutive_losses: number;         // 3 - 10
}

// Vesper-specific control actions
async function resetVesperCooldown(asset: string) {
  return await sendMessage({
    type: "agent_control",
    agent: "vesper",
    action: "reset_cooldown",
    asset: asset
  }, true);
}

async function forceClosePosition(asset: string, reason?: string) {
  return await sendMessage({
    type: "agent_control",
    agent: "vesper",
    action: "force_close_position",
    asset: asset,
    parameters: { reason: reason || "Manual close" }
  }, true);
}
```

### AuroraAgent Integration

Aurora handles system-wide configuration and coordination.

#### Key Configuration Parameters

```typescript
interface AuroraConfig {
  // System settings
  observation_window_vivienne_filter_status: number; // 1 - 100
  
  // Coordination settings
  enable_inter_agent_communication: boolean;
  master_override_enabled: boolean;
  
  // System health
  health_check_interval: number;          // Seconds: 30 - 300
  auto_restart_on_failure: boolean;
  
  // Global risk settings
  global_position_limit: number;          // USD amount
  global_daily_limit: number;            // USD amount
  emergency_shutdown_trigger: number;     // Loss percentage
}

async function getSystemStatus() {
  return await sendMessage({
    type: "status_request",
    target: "system",
    include_metrics: true
  }, true);
}
```

## Configuration Management

### Parameter Validation

The system provides comprehensive parameter validation with automatic correction for common issues:

```typescript
// Configuration validation example
async function validateConfiguration(agent: AgentType, config: Record<string, any>) {
  const response = await sendMessage({
    type: "config_update",
    agent: agent,
    parameters: config,
    validate_only: true // Only validate, don't apply
  }, true);
  
  if (response.status === "error") {
    console.error("Validation failed:", response.validation_errors);
    return { valid: false, errors: response.validation_errors };
  }
  
  if (response.status === "warning") {
    console.warn("Validation warnings:", response.warnings);
    console.log("Corrected values:", response.corrected_values);
  }
  
  return { 
    valid: true, 
    warnings: response.warnings,
    corrections: response.corrected_values
  };
}
```

### Batch Configuration Updates

```typescript
async function updateMultipleAssetConfigs(
  agent: AgentType,
  configs: Array<{ asset: string; parameters: Record<string, any> }>
) {
  const results = await Promise.allSettled(
    configs.map(({ asset, parameters }) =>
      sendMessage({
        type: "config_update",
        agent: agent,
        asset: asset,
        parameters: parameters
      }, true)
    )
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.length - successful;
  
  console.log(`Batch update completed: ${successful} successful, ${failed} failed`);
  
  return results;
}
```

### Configuration Schemas

```typescript
// Get configuration schema for an agent
async function getConfigurationSchema(agent: AgentType) {
  try {
    const response = await fetch(`http://localhost:8000/control/config/${agent}/schema`);
    if (response.ok) {
      const schema = await response.json();
      return schema;
    } else {
      throw new Error(`Schema not available for ${agent}`);
    }
  } catch (error) {
    console.error("Failed to fetch schema:", error);
    return null;
  }
}

// Generate configuration form from schema
function generateConfigForm(schema: any) {
  const parameters = schema.parameters || {};
  
  return Object.entries(parameters).map(([key, definition]: [string, any]) => ({
    name: key,
    type: definition.type,
    description: definition.description,
    default: definition.default,
    constraints: {
      min: definition.minimum,
      max: definition.maximum,
      enum: definition.enum
    },
    required: schema.required?.includes(key) || false
  }));
}
```

## Real-Time Updates

### State Update Handling

The system broadcasts state updates automatically when configurations change or market conditions trigger updates:

```typescript
// Handle incoming state updates
function handleStateUpdate(message: StateUpdateMessage) {
  const { agent, asset, update_type, state_data } = message;
  
  switch (update_type) {
    case "config_update":
      // Configuration was updated
      console.log(`Configuration updated for ${agent}:${asset}`);
      updateUIConfiguration(agent, asset, state_data.updated_config);
      break;
      
    case "position_change":
      // Position status changed
      console.log(`Position changed for ${asset}`);
      updatePositionDisplay(asset, state_data);
      break;
      
    case "analysis_update":
      // New analysis available
      console.log(`Analysis update for ${asset}`);
      updateAnalysisCharts(asset, state_data);
      break;
      
    case "alert":
      // System alert
      console.log(`Alert: ${state_data.message}`);
      showAlert(state_data.message, state_data.severity);
      break;
      
    default:
      console.log(`Unknown update type: ${update_type}`);
  }
}
```

### Real-Time Dashboard Integration

```typescript
interface DashboardState {
  agents: Record<AgentType, any>;
  positions: Record<string, any>;
  alerts: any[];
  systemHealth: number;
  lastUpdate: string;
}

class RealTimeDashboard {
  private state: DashboardState = {
    agents: {} as Record<AgentType, any>,
    positions: {},
    alerts: [],
    systemHealth: 1.0,
    lastUpdate: new Date().toISOString()
  };
  
  private listeners: Set<(state: DashboardState) => void> = new Set();
  
  constructor(private webSocket: TradingWebSocket) {
    this.webSocket.onMessage = this.handleMessage.bind(this);
    this.initializeDashboard();
  }
  
  private async initializeDashboard() {
    // Get initial system status
    const systemStatus = await this.webSocket.sendMessage({
      type: "status_request",
      target: "all",
      include_config: true,
      include_metrics: true
    }, true);
    
    this.updateState({
      agents: systemStatus.status.agents,
      systemHealth: systemStatus.health_score,
      lastUpdate: new Date().toISOString()
    });
  }
  
  private handleMessage(message: any) {
    switch (message.type) {
      case "state_update":
        this.handleStateUpdate(message);
        break;
        
      case "error":
        this.handleError(message);
        break;
        
      default:
        // Handle other message types
        break;
    }
  }
  
  private handleStateUpdate(message: StateUpdateMessage) {
    const updates: Partial<DashboardState> = {
      lastUpdate: new Date().toISOString()
    };
    
    if (message.agent && message.state_data) {
      updates.agents = {
        ...this.state.agents,
        [message.agent]: {
          ...this.state.agents[message.agent],
          ...message.state_data
        }
      };
    }
    
    if (message.asset && message.update_type === "position_change") {
      updates.positions = {
        ...this.state.positions,
        [message.asset]: message.state_data
      };
    }
    
    this.updateState(updates);
  }
  
  private handleError(message: ErrorMessage) {
    const alert = {
      id: message.request_id || Date.now().toString(),
      type: "error",
      message: message.message,
      timestamp: message.timestamp,
      details: message.details
    };
    
    this.updateState({
      alerts: [...this.state.alerts, alert]
    });
  }
  
  private updateState(updates: Partial<DashboardState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }
  
  public subscribe(listener: (state: DashboardState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  public getState(): DashboardState {
    return { ...this.state };
  }
}
```

## Error Handling

### Comprehensive Error Handling Strategy

```typescript
interface ErrorHandlingConfig {
  retryAttempts: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  maxRetryDelay: number;
  timeout: number;
}

class RobustWebSocketClient {
  private errorConfig: ErrorHandlingConfig = {
    retryAttempts: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    maxRetryDelay: 10000,
    timeout: 10000
  };
  
  async sendMessageWithRetry(
    message: any,
    expectResponse = true,
    customConfig?: Partial<ErrorHandlingConfig>
  ): Promise<any> {
    const config = { ...this.errorConfig, ...customConfig };
    let lastError: Error;
    
    for (let attempt = 0; attempt < config.retryAttempts; attempt++) {
      try {
        return await this.sendMessage(message, expectResponse, config.timeout);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on validation errors
        if (error instanceof ValidationError) {
          throw error;
        }
        
        // Calculate delay for next retry
        const delay = config.exponentialBackoff
          ? Math.min(config.retryDelay * Math.pow(2, attempt), config.maxRetryDelay)
          : config.retryDelay;
        
        console.warn(`Request failed (attempt ${attempt + 1}/${config.retryAttempts}):`, error);
        
        if (attempt < config.retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Request failed after ${config.retryAttempts} attempts: ${lastError!.message}`);
  }
}

// Error categorization and handling
function handleWebSocketError(error: ErrorMessage) {
  switch (error.error_type) {
    case "validation_error":
      handleValidationError(error);
      break;
      
    case "protocol_error":
      handleProtocolError(error);
      break;
      
    case "internal_error":
      handleInternalError(error);
      break;
      
    case "timeout_error":
      handleTimeoutError(error);
      break;
      
    case "agent_error":
      handleAgentError(error);
      break;
      
    default:
      handleUnknownError(error);
      break;
  }
}

function handleValidationError(error: ErrorMessage) {
  console.error("Validation Error:", error.message);
  
  // Show user-friendly validation messages
  if (error.details?.field_errors) {
    Object.entries(error.details.field_errors).forEach(([field, message]) => {
      showFieldError(field, message as string);
    });
  }
  
  // Provide correction suggestions
  if (error.suggestion) {
    showSuggestion(error.suggestion);
  }
}

function handleProtocolError(error: ErrorMessage) {
  console.error("Protocol Error:", error.message);
  
  // Check if client needs to be updated
  if (error.message.includes("version")) {
    showUpdateNotification("Client version may be outdated");
  }
}

function handleInternalError(error: ErrorMessage) {
  console.error("Internal Error:", error.message);
  
  // Attempt automatic retry for transient errors
  if (error.retry_after_seconds) {
    setTimeout(() => {
      // Retry the original request
      retryLastRequest();
    }, error.retry_after_seconds * 1000);
  }
}
```

### Error Recovery Patterns

```typescript
interface ErrorRecoveryPattern {
  errorType: ErrorType;
  maxRetries: number;
  retryDelay: number;
  recoveryAction: () => Promise<void>;
}

const errorRecoveryPatterns: ErrorRecoveryPattern[] = [
  {
    errorType: "timeout_error",
    maxRetries: 3,
    retryDelay: 2000,
    recoveryAction: async () => {
      // Reconnect WebSocket
      await reconnectWebSocket();
    }
  },
  {
    errorType: "internal_error",
    maxRetries: 2,
    retryDelay: 5000,
    recoveryAction: async () => {
      // Check system health
      await checkSystemHealth();
    }
  },
  {
    errorType: "agent_error",
    maxRetries: 1,
    retryDelay: 10000,
    recoveryAction: async () => {
      // Restart agent
      await restartAgent();
    }
  }
];
```

## Security & Authentication

### Authentication Patterns

Currently, the API uses IP-based access control, but here are patterns for future authentication implementation:

```typescript
interface AuthenticationConfig {
  apiKey?: string;
  bearerToken?: string;
  sessionId?: string;
}

class AuthenticatedWebSocket extends TradingWebSocket {
  private authConfig: AuthenticationConfig;
  
  constructor(config: WebSocketConfig, auth: AuthenticationConfig) {
    super(config);
    this.authConfig = auth;
  }
  
  protected createConnection(): WebSocket {
    const ws = new WebSocket(this.config.url);
    
    // Add authentication headers when supported
    if (this.authConfig.bearerToken) {
      ws.addEventListener('open', () => {
        this.send({
          type: 'auth',
          token: this.authConfig.bearerToken
        });
      });
    }
    
    return ws;
  }
}
```

### Rate Limiting Considerations

```typescript
class RateLimitedWebSocket {
  private requestQueue: Array<() => void> = [];
  private lastRequestTime = 0;
  private minRequestInterval = 100; // ms between requests
  
  async sendMessage(message: any, expectResponse = true): Promise<any> {
    return new Promise((resolve, reject) => {
      const sendRequest = () => {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
          setTimeout(sendRequest, this.minRequestInterval - timeSinceLastRequest);
          return;
        }
        
        this.lastRequestTime = now;
        
        try {
          super.sendMessage(message, expectResponse)
            .then(resolve)
            .catch(reject);
        } catch (error) {
          reject(error);
        }
      };
      
      this.requestQueue.push(sendRequest);
      this.processQueue();
    });
  }
  
  private processQueue() {
    if (this.requestQueue.length > 0) {
      const nextRequest = this.requestQueue.shift()!;
      nextRequest();
    }
  }
}
```

## Performance Optimization

### Connection Pooling

```typescript
class WebSocketConnectionPool {
  private connections: Map<string, TradingWebSocket> = new Map();
  private maxConnections = 5;
  
  async getConnection(endpoint: string): Promise<TradingWebSocket> {
    if (this.connections.has(endpoint)) {
      const connection = this.connections.get(endpoint)!;
      if (connection.isConnected()) {
        return connection;
      } else {
        this.connections.delete(endpoint);
      }
    }
    
    if (this.connections.size >= this.maxConnections) {
      // Close oldest connection
      const [oldestEndpoint] = this.connections.keys();
      const oldestConnection = this.connections.get(oldestEndpoint)!;
      oldestConnection.close();
      this.connections.delete(oldestEndpoint);
    }
    
    const newConnection = new TradingWebSocket({ url: endpoint });
    await newConnection.connect();
    this.connections.set(endpoint, newConnection);
    
    return newConnection;
  }
  
  closeAll() {
    this.connections.forEach(connection => connection.close());
    this.connections.clear();
  }
}
```

### Message Batching

```typescript
class BatchedWebSocketClient {
  private batchQueue: any[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchSize = 10;
  private batchDelay = 100; // ms
  
  queueMessage(message: any) {
    this.batchQueue.push(message);
    
    if (this.batchQueue.length >= this.batchSize) {
      this.processBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.batchDelay);
    }
  }
  
  private processBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    if (this.batchQueue.length === 0) return;
    
    const batch = this.batchQueue.splice(0, this.batchSize);
    
    // Send batch as single message
    this.sendMessage({
      type: 'batch',
      messages: batch
    });
  }
}
```

### Memory Management

```typescript
class MemoryEfficientWebSocket {
  private messageHistory: Map<string, any> = new Map();
  private maxHistorySize = 1000;
  
  private addToHistory(message: any) {
    if (this.messageHistory.size >= this.maxHistorySize) {
      // Remove oldest entries
      const oldestKeys = Array.from(this.messageHistory.keys()).slice(0, 100);
      oldestKeys.forEach(key => this.messageHistory.delete(key));
    }
    
    this.messageHistory.set(message.request_id, {
      ...message,
      timestamp: Date.now()
    });
  }
  
  private cleanupOldMessages() {
    const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes
    
    for (const [key, message] of this.messageHistory.entries()) {
      if (message.timestamp < cutoffTime) {
        this.messageHistory.delete(key);
      }
    }
  }
}
```

## Migration Guide

### From Legacy Format to Unified Protocol

#### Legacy Vivienne Format

```typescript
// OLD FORMAT (deprecated)
const legacyVivienneMessage = {
  type: "vivienne_config_update",
  agent: "VivienneAgent",
  asset: "BTC",
  config: {
    take_profit_percentage: 2.5,
    stop_loss_percentage: 1.5
  }
};

// NEW UNIFIED FORMAT
const unifiedVivienneMessage = {
  type: "config_update",
  protocol_version: "1.0",
  request_id: generateRequestId(),
  timestamp: new Date().toISOString(),
  agent: "vivienne",
  asset: "BTC",
  parameters: {
    take_profit_percentage: 2.5,
    stop_loss_percentage: 1.5
  },
  update_type: "partial",
  validate_only: false
};
```

#### Migration Helper Functions

```typescript
function migrateLegacyMessage(legacyMessage: any): any {
  const legacyTypeMap: Record<string, AgentType> = {
    "vivienne_config_update": "vivienne",
    "tempest_config_update": "tempest",
    "vesper_config_update": "vesper",
    "config_update": "aurora"
  };
  
  const agent = legacyTypeMap[legacyMessage.type];
  if (!agent) {
    throw new Error(`Unknown legacy message type: ${legacyMessage.type}`);
  }
  
  return {
    type: "config_update",
    protocol_version: "1.0",
    request_id: generateRequestId(),
    timestamp: new Date().toISOString(),
    agent: agent,
    asset: legacyMessage.asset,
    parameters: legacyMessage.config || legacyMessage.params || {},
    update_type: "partial"
  };
}

class ProtocolMigrationHelper {
  private supportedVersions = ["1.0"];
  
  isLegacyFormat(message: any): boolean {
    const legacyTypes = [
      "vivienne_config_update",
      "tempest_config_update", 
      "vesper_config_update"
    ];
    
    return legacyTypes.includes(message.type);
  }
  
  migrateToUnified(message: any): any {
    if (this.isLegacyFormat(message)) {
      return migrateLegacyMessage(message);
    }
    
    // Add missing fields for partial unified messages
    return {
      protocol_version: "1.0",
      request_id: generateRequestId(),
      timestamp: new Date().toISOString(),
      ...message
    };
  }
  
  validateProtocolVersion(version: string): boolean {
    return this.supportedVersions.includes(version);
  }
}
```

### Gradual Migration Strategy

```typescript
class HybridWebSocketClient {
  private legacyMode = false;
  private migrationHelper = new ProtocolMigrationHelper();
  
  async sendMessage(message: any, expectResponse = true): Promise<any> {
    let processedMessage = message;
    
    // Auto-migrate legacy messages
    if (this.migrationHelper.isLegacyFormat(message)) {
      console.warn("Using legacy message format, consider upgrading to unified protocol");
      processedMessage = this.migrationHelper.migrateToUnified(message);
    }
    
    // Ensure unified format compliance
    if (!processedMessage.protocol_version) {
      processedMessage = this.migrationHelper.migrateToUnified(processedMessage);
    }
    
    try {
      return await super.sendMessage(processedMessage, expectResponse);
    } catch (error) {
      if (error.message.includes("protocol") && !this.legacyMode) {
        console.warn("Falling back to legacy mode");
        this.legacyMode = true;
        return await super.sendMessage(message, expectResponse);
      }
      throw error;
    }
  }
}
```

## TypeScript Integration

### Complete Type Definitions

```typescript
// Message type definitions
export type WebSocketMessage = 
  | ConfigUpdateMessage
  | ConfigUpdateResponse
  | DataRequestMessage
  | DataResponse
  | AgentControlMessage
  | AgentControlResponse
  | StatusRequestMessage
  | StatusResponse
  | StateUpdateMessage
  | ErrorMessage;

// Utility types
export type MessageHandler<T extends WebSocketMessage> = (message: T) => void | Promise<void>;

export interface TypedWebSocketHandlers {
  onConfigUpdateResponse?: MessageHandler<ConfigUpdateResponse>;
  onDataResponse?: MessageHandler<DataResponse>;
  onAgentControlResponse?: MessageHandler<AgentControlResponse>;
  onStatusResponse?: MessageHandler<StatusResponse>;
  onStateUpdate?: MessageHandler<StateUpdateMessage>;
  onError?: MessageHandler<ErrorMessage>;
}

// Type-safe WebSocket client
export class TypedWebSocketClient {
  private handlers: TypedWebSocketHandlers = {};
  
  constructor(private webSocket: TradingWebSocket) {
    this.webSocket.onMessage = this.handleMessage.bind(this);
  }
  
  private handleMessage(message: any) {
    const typedMessage = message as WebSocketMessage;
    
    switch (typedMessage.type) {
      case "config_update_response":
        this.handlers.onConfigUpdateResponse?.(typedMessage as ConfigUpdateResponse);
        break;
      case "data_response":
        this.handlers.onDataResponse?.(typedMessage as DataResponse);
        break;
      case "agent_control_response":
        this.handlers.onAgentControlResponse?.(typedMessage as AgentControlResponse);
        break;
      case "status_response":
        this.handlers.onStatusResponse?.(typedMessage as StatusResponse);
        break;
      case "state_update":
        this.handlers.onStateUpdate?.(typedMessage as StateUpdateMessage);
        break;
      case "error":
        this.handlers.onError?.(typedMessage as ErrorMessage);
        break;
    }
  }
  
  setHandlers(handlers: TypedWebSocketHandlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }
  
  // Type-safe message sending
  async sendConfigUpdate(message: ConfigUpdateMessage): Promise<ConfigUpdateResponse> {
    return await this.webSocket.sendMessage(message, true) as ConfigUpdateResponse;
  }
  
  async sendDataRequest(message: DataRequestMessage): Promise<DataResponse> {
    return await this.webSocket.sendMessage(message, true) as DataResponse;
  }
  
  async sendAgentControl(message: AgentControlMessage): Promise<AgentControlResponse> {
    return await this.webSocket.sendMessage(message, true) as AgentControlResponse;
  }
  
  async sendStatusRequest(message: StatusRequestMessage): Promise<StatusResponse> {
    return await this.webSocket.sendMessage(message, true) as StatusResponse;
  }
}
```

### Type Guards

```typescript
// Type guard functions
export function isConfigUpdateResponse(message: any): message is ConfigUpdateResponse {
  return message?.type === "config_update_response";
}

export function isDataResponse(message: any): message is DataResponse {
  return message?.type === "data_response";
}

export function isStateUpdate(message: any): message is StateUpdateMessage {
  return message?.type === "state_update";
}

export function isErrorMessage(message: any): message is ErrorMessage {
  return message?.type === "error";
}

// Message validation
export function validateMessage<T extends WebSocketMessage>(
  message: any,
  validator: (msg: any) => msg is T
): T {
  if (!validator(message)) {
    throw new Error(`Invalid message format: ${JSON.stringify(message)}`);
  }
  return message;
}
```

## React Integration Examples

### Custom Hooks

```typescript
// useAgentConfig hook
export function useAgentConfig(agent: AgentType, asset?: string) {
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { sendMessage } = useWebSocket({ url: WS_STATE_URL });
  
  const updateConfig = useCallback(async (parameters: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sendMessage({
        type: "config_update",
        request_id: generateRequestId(),
        agent: agent,
        asset: asset,
        parameters: parameters
      }, true) as ConfigUpdateResponse;
      
      if (response.status === "success") {
        setConfig(response.applied_config || parameters);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [agent, asset, sendMessage]);
  
  const validateConfig = useCallback(async (parameters: Record<string, any>) => {
    try {
      const response = await sendMessage({
        type: "config_update",
        request_id: generateRequestId(),
        agent: agent,
        asset: asset,
        parameters: parameters,
        validate_only: true
      }, true) as ConfigUpdateResponse;
      
      return {
        valid: response.status !== "error",
        errors: response.validation_errors,
        warnings: response.warnings,
        corrections: response.corrected_values
      };
    } catch (err) {
      return {
        valid: false,
        errors: { general: err instanceof Error ? err.message : "Validation failed" }
      };
    }
  }, [agent, asset, sendMessage]);
  
  // Fetch initial config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await sendMessage({
          type: "data_request",
          request_id: generateRequestId(),
          agent: agent,
          asset: asset,
          data_types: ["config"],
          include_config: true
        }, true) as DataResponse;
        
        setConfig(response.data.current_config || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch config");
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
  }, [agent, asset, sendMessage]);
  
  return {
    config,
    loading,
    error,
    updateConfig,
    validateConfig
  };
}

// useAgentStatus hook
export function useAgentStatus(agent: AgentType) {
  const [status, setStatus] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<number>(0);
  const { sendMessage, isConnected } = useWebSocket({ url: WS_STATE_URL });
  
  const refreshStatus = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      const response = await sendMessage({
        type: "status_request",
        request_id: generateRequestId(),
        target: "agent",
        agent: agent,
        include_config: true,
        include_metrics: true
      }, true) as StatusResponse;
      
      setStatus(response.status);
      setHealthScore(response.health_score || 0);
    } catch (error) {
      console.error("Failed to fetch agent status:", error);
    }
  }, [agent, sendMessage, isConnected]);
  
  // Auto-refresh status
  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [refreshStatus]);
  
  return {
    status,
    healthScore,
    refreshStatus
  };
}
```

### Configuration Form Component

```tsx
interface ConfigurationFormProps {
  agent: AgentType;
  asset?: string;
  onSave?: (config: Record<string, any>) => void;
}

export function ConfigurationForm({ agent, asset, onSave }: ConfigurationFormProps) {
  const { config, loading, error, updateConfig, validateConfig } = useAgentConfig(agent, asset);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  
  // Initialize form data when config loads
  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);
  
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear validation error when field is modified
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };
  
  const handleValidation = async () => {
    const validation = await validateConfig(formData);
    setValidationErrors(validation.errors || {});
    return validation.valid;
  };
  
  const handleSave = async () => {
    const isValid = await handleValidation();
    if (!isValid) return;
    
    try {
      await updateConfig(formData);
      setIsDirty(false);
      onSave?.(formData);
    } catch (err) {
      console.error("Failed to save configuration:", err);
    }
  };
  
  if (loading) {
    return <div>Loading configuration...</div>;
  }
  
  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  
  return (
    <div className="configuration-form">
      <h3>Configuration for {agent} {asset && `(${asset})`}</h3>
      
      {Object.entries(formData).map(([field, value]) => (
        <div key={field} className="form-field">
          <label>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
          <input
            type={typeof value === 'number' ? 'number' : 'text'}
            value={value}
            onChange={(e) => handleFieldChange(field, 
              typeof value === 'number' ? parseFloat(e.target.value) : e.target.value
            )}
            className={validationErrors[field] ? 'error' : ''}
          />
          {validationErrors[field] && (
            <span className="error-message">{validationErrors[field]}</span>
          )}
        </div>
      ))}
      
      <div className="form-actions">
        <button onClick={handleValidation}>Validate</button>
        <button 
          onClick={handleSave} 
          disabled={!isDirty || Object.keys(validationErrors).length > 0}
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
```

### Real-Time Dashboard Component

```tsx
interface DashboardProps {
  agents: AgentType[];
}

export function TradingDashboard({ agents }: DashboardProps) {
  const { isConnected, connectionState } = useWebSocket({ 
    url: WS_STATE_URL,
    onMessage: handleStateUpdate
  });
  
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    agents: {} as Record<AgentType, any>,
    positions: {},
    alerts: [],
    systemHealth: 1.0,
    lastUpdate: new Date().toISOString()
  });
  
  function handleStateUpdate(message: any) {
    if (isStateUpdate(message)) {
      setDashboardState(prev => ({
        ...prev,
        lastUpdate: new Date().toISOString(),
        agents: message.agent ? {
          ...prev.agents,
          [message.agent]: {
            ...prev.agents[message.agent],
            ...message.state_data
          }
        } : prev.agents
      }));
    }
  }
  
  return (
    <div className="trading-dashboard">
      <header className="dashboard-header">
        <h1>Trading Dashboard</h1>
        <div className="connection-status">
          <span className={`status ${connectionState}`}>
            {connectionState === 'connected' ? '🟢' : connectionState === 'connecting' ? '🟡' : '🔴'}
            {connectionState}
          </span>
          <span className="last-update">
            Last update: {new Date(dashboardState.lastUpdate).toLocaleTimeString()}
          </span>
        </div>
      </header>
      
      <div className="dashboard-grid">
        {agents.map(agent => (
          <AgentStatusPanel 
            key={agent}
            agent={agent}
            status={dashboardState.agents[agent]}
          />
        ))}
        
        <PositionsPanel positions={dashboardState.positions} />
        <AlertsPanel alerts={dashboardState.alerts} />
        <SystemHealthPanel health={dashboardState.systemHealth} />
      </div>
    </div>
  );
}
```

## Testing Strategies

### Unit Testing Message Handlers

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('WebSocket Message Handling', () => {
  let mockWebSocket: TradingWebSocket;
  let client: TypedWebSocketClient;
  
  beforeEach(() => {
    mockWebSocket = {
      sendMessage: vi.fn(),
      onMessage: vi.fn(),
      isConnected: vi.fn(() => true)
    } as any;
    
    client = new TypedWebSocketClient(mockWebSocket);
  });
  
  it('should handle config update responses correctly', async () => {
    const mockResponse: ConfigUpdateResponse = {
      type: 'config_update_response',
      request_id: 'test-123',
      timestamp: new Date().toISOString(),
      protocol_version: '1.0',
      status: 'success',
      agent: 'vivienne',
      asset: 'BTC',
      message: 'Configuration updated successfully'
    };
    
    mockWebSocket.sendMessage.mockResolvedValue(mockResponse);
    
    const result = await client.sendConfigUpdate({
      type: 'config_update',
      request_id: 'test-123',
      timestamp: new Date().toISOString(),
      protocol_version: '1.0',
      agent: 'vivienne',
      asset: 'BTC',
      parameters: { take_profit_percentage: 2.5 }
    });
    
    expect(result.status).toBe('success');
    expect(result.agent).toBe('vivienne');
  });
  
  it('should handle validation errors appropriately', async () => {
    const mockErrorResponse: ConfigUpdateResponse = {
      type: 'config_update_response',
      request_id: 'test-456',
      timestamp: new Date().toISOString(),
      protocol_version: '1.0',
      status: 'error',
      agent: 'vivienne',
      asset: 'BTC',
      message: 'Validation failed',
      validation_errors: {
        'take_profit_percentage': 'Value must be between 0.1 and 10.0'
      }
    };
    
    mockWebSocket.sendMessage.mockResolvedValue(mockErrorResponse);
    
    const result = await client.sendConfigUpdate({
      type: 'config_update',
      agent: 'vivienne',
      asset: 'BTC',
      parameters: { take_profit_percentage: -1.0 }
    });
    
    expect(result.status).toBe('error');
    expect(result.validation_errors).toBeDefined();
  });
});
```

### Integration Testing

```typescript
describe('WebSocket Integration Tests', () => {
  let webSocket: TradingWebSocket;
  
  beforeAll(async () => {
    webSocket = new TradingWebSocket({ url: 'ws://localhost:8000/ws/state' });
    await webSocket.connect();
  });
  
  afterAll(() => {
    webSocket.close();
  });
  
  it('should successfully update Vivienne configuration', async () => {
    const response = await webSocket.sendMessage({
      type: 'config_update',
      agent: 'vivienne',
      asset: 'BTC',
      parameters: {
        take_profit_percentage: 2.0,
        stop_loss_percentage: 1.0
      }
    }, true);
    
    expect(response.status).toBe('success');
    expect(response.cache_refresh_triggered).toBe(true);
  }, 10000);
  
  it('should receive real-time state updates', async () => {
    return new Promise((resolve) => {
      let updateReceived = false;
      
      webSocket.onMessage = (message) => {
        if (message.type === 'state_update' && !updateReceived) {
          updateReceived = true;
          expect(message.state_data).toBeDefined();
          resolve();
        }
      };
      
      setTimeout(() => {
        if (!updateReceived) {
          resolve(); // Timeout, but don't fail the test
        }
      }, 5000);
    });
  });
});
```

## Common Pitfalls and Solutions

### 1. Message Size Limits

**Problem**: Large messages being rejected with "message too big" error.

**Solution**: 
```typescript
const MAX_MESSAGE_SIZE = 64 * 1024; // 64KB

function splitLargeMessage(message: any): any[] {
  const serialized = JSON.stringify(message);
  if (serialized.length <= MAX_MESSAGE_SIZE) {
    return [message];
  }
  
  // Split large data into chunks
  const chunks = [];
  const data = message.data || {};
  const keys = Object.keys(data);
  
  for (let i = 0; i < keys.length; i += 10) {
    const chunkKeys = keys.slice(i, i + 10);
    const chunkData = {};
    chunkKeys.forEach(key => chunkData[key] = data[key]);
    
    chunks.push({
      ...message,
      data: chunkData,
      is_chunk: true,
      chunk_index: Math.floor(i / 10),
      total_chunks: Math.ceil(keys.length / 10)
    });
  }
  
  return chunks;
}
```

### 2. Request/Response Correlation Issues

**Problem**: Responses not matching original requests.

**Solution**:
```typescript
class CorrelationManager {
  private pendingRequests = new Map<string, {
    resolve: Function;
    reject: Function;
    timeout: NodeJS.Timeout;
    timestamp: number;
  }>();
  
  async sendCorrelatedMessage(message: any, timeoutMs = 10000): Promise<any> {
    const requestId = message.request_id || generateRequestId();
    message.request_id = requestId;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request ${requestId} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        timestamp: Date.now()
      });
      
      this.webSocket.send(message);
    });
  }
  
  handleResponse(response: any) {
    const requestId = response.request_id;
    if (!requestId || !this.pendingRequests.has(requestId)) {
      console.warn('Received response for unknown request:', requestId);
      return;
    }
    
    const { resolve, timeout } = this.pendingRequests.get(requestId)!;
    clearTimeout(timeout);
    this.pendingRequests.delete(requestId);
    resolve(response);
  }
}
```

### 3. Memory Leaks in Long-Running Connections

**Problem**: Memory usage growing over time due to accumulated message handlers.

**Solution**:
```typescript
class MemoryManagedWebSocket {
  private messageHandlers = new Set<Function>();
  private messageHistory = new Map<string, any>();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    // Regular cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }
  
  private cleanup() {
    const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
    
    // Remove old message history
    for (const [key, message] of this.messageHistory.entries()) {
      if (message.timestamp < cutoffTime) {
        this.messageHistory.delete(key);
      }
    }
    
    // Remove stale handlers
    this.messageHandlers.forEach(handler => {
      if (handler.isStale && handler.isStale()) {
        this.messageHandlers.delete(handler);
      }
    });
  }
  
  close() {
    clearInterval(this.cleanupInterval);
    this.messageHandlers.clear();
    this.messageHistory.clear();
    super.close();
  }
}
```

## Conclusion

This messaging recommendations document provides a comprehensive foundation for integrating with the Hyperlyquid Trading Dashboard API. The unified WebSocket protocol ensures consistency, type safety, and scalability across all trading operations.

### Key Takeaways

1. **Use the unified protocol** for all new integrations
2. **Implement proper error handling** with retry logic and user feedback
3. **Leverage TypeScript** for type safety and better development experience
4. **Handle real-time updates** properly to maintain UI consistency
5. **Implement connection resilience** for production robustness
6. **Follow security best practices** for authentication and data handling
7. **Optimize for performance** with batching and connection pooling
8. **Test thoroughly** with both unit and integration tests

### Next Steps

1. Review your current integration against these recommendations
2. Implement the unified protocol for new features
3. Gradually migrate legacy message formats
4. Set up comprehensive error handling and monitoring
5. Implement performance optimizations as needed

For additional support or questions about the messaging protocol, please refer to the API documentation or contact the development team.

---

**Document Version**: 1.1  
**Last Updated**: August 4, 2025  
**Compatibility**: Dashboard API v1.0+  
**Protocol Version**: 1.0