# Agent Configuration Editing Implementation Guide

This document outlines how to implement real-time configuration editing for trading agents in the Aurora Frontend.

## Overview

The config editing system allows users to modify agent configuration parameters in real-time through a WebSocket interface. The system includes:

- **Frontend**: React components with inline editing capabilities
- **Backend**: WebSocket message handling for config updates
- **Caching**: Local state management to preserve unsaved changes
- **Debugging**: Comprehensive logging for troubleshooting

## Frontend Implementation

### 1. Component Structure

```typescript
interface AgentProps {
  assetSymbol?: string;
  fullMessage: any; // Full WebSocket message
  sendMessage?: (message: any) => void; // WebSocket send function
}
```

### 2. Required State Management

```typescript
// State for editable config
const [editableConfig, setEditableConfig] = useState<Record<string, any>>({});
const [hasChanges, setHasChanges] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [showConfigModal, setShowConfigModal] = useState(false);
const [editingKey, setEditingKey] = useState<string | null>(null);

// Cache for unsaved changes - persists across WebSocket updates
const unsavedChangesRef = useRef<Record<string, any>>({});
const lastConfigRef = useRef<Record<string, any>>({});
const lastSaveTimeRef = useRef<number>(0);
```

### 3. Config Data Extraction

```typescript
// Extract agent data from WebSocket message
const agentData = fullMessage?.data?.[assetSymbol]?.agents?.AgentName;
const metadata = agentData?.data?.metadata;
const config = agentData?.config;
```

### 4. Config Update Effect

```typescript
useEffect(() => {
  if (config) {
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;
    
    console.log('🔄 AgentName: New config received:', {
      config,
      lastConfig: lastConfigRef.current,
      unsavedChanges: unsavedChangesRef.current,
      timeSinceLastSave: `${timeSinceLastSave}ms`,
      hasUnsavedChanges: Object.keys(unsavedChangesRef.current).length > 0
    });
    
    // Store incoming config for comparison
    lastConfigRef.current = config;
    
    // Merge incoming config with unsaved changes
    const mergedConfig = { ...config };
    Object.keys(unsavedChangesRef.current).forEach(key => {
      if (unsavedChangesRef.current[key] !== undefined) {
        mergedConfig[key] = unsavedChangesRef.current[key];
      }
    });
    
    setEditableConfig(mergedConfig);
    setHasChanges(Object.keys(unsavedChangesRef.current).length > 0);
    
    // Warn if backend sent old values after save
    if (timeSinceLastSave < 5000 && Object.keys(unsavedChangesRef.current).length > 0) {
      console.warn('⚠️ AgentName: Backend may have sent old config values after save!', {
        savedChanges: unsavedChangesRef.current,
        receivedConfig: config
      });
    }
  }
}, [config]);
```

### 5. Config Change Handler

```typescript
const handleConfigChange = (key: string, value: string) => {
  const newConfig = { ...editableConfig };
  
  // Parse as number if it looks like a number
  const numValue = parseFloat(value);
  const parsedValue = isNaN(numValue) ? value : numValue;
  
  newConfig[key] = parsedValue;
  setEditableConfig(newConfig);
  
  // Store change in cache
  if (parsedValue !== lastConfigRef.current[key]) {
    unsavedChangesRef.current[key] = parsedValue;
  } else {
    delete unsavedChangesRef.current[key];
  }
  
  setHasChanges(Object.keys(unsavedChangesRef.current).length > 0);
};
```

### 6. Save Handler

```typescript
const handleSaveSingleConfig = async (key: string) => {
  if (!sendMessage) {
    console.error('❌ sendMessage function not available');
    return;
  }

  setIsSaving(true);
  lastSaveTimeRef.current = Date.now();
  
  try {
    const configUpdateMessage = {
      type: 'config_update',
      agent: 'AgentName', // Replace with actual agent name
      asset: assetSymbol,
      config: { [key]: editableConfig[key] }
    };
    
    sendMessage(configUpdateMessage);
    console.log('📤 AgentName: Config update sent:', configUpdateMessage);
    
    // Remove from unsaved changes cache
    delete unsavedChangesRef.current[key];
    setHasChanges(Object.keys(unsavedChangesRef.current).length > 0);
    
    setEditingKey(null);
  } catch (error) {
    console.error('❌ AgentName: Failed to save config:', error);
  } finally {
    setIsSaving(false);
  }
};
```

### 7. Cancel Handlers

```typescript
// Cancel all changes
const handleCancelEdit = () => {
  unsavedChangesRef.current = {};
  setEditableConfig(lastConfigRef.current);
  setEditingKey(null);
  setHasChanges(false);
};

// Cancel single edit
const handleCancelSingleEdit = (key: string) => {
  if (unsavedChangesRef.current[key] !== undefined) {
    delete unsavedChangesRef.current[key];
    setEditableConfig(prev => ({
      ...prev,
      [key]: lastConfigRef.current[key]
    }));
    setHasChanges(Object.keys(unsavedChangesRef.current).length > 0);
  }
  setEditingKey(null);
};
```

## Backend Requirements

### 1. WebSocket Message Handling

The backend must handle `config_update` messages:

```python
# Example Python/FastAPI implementation
async def handle_websocket_message(websocket, message):
    if message.get("type") == "config_update":
        agent = message.get("agent")
        asset = message.get("asset")
        config = message.get("config")
        
        # Update agent configuration
        success = await update_agent_config(agent, asset, config)
        
        # Send response
        response = {
            "type": "config_update_response",
            "status": "success" if success else "error",
            "agent": agent,
            "asset": asset,
            "config": config
        }
        await websocket.send_json(response)
        
        # IMPORTANT: Update internal state immediately
        await refresh_agent_state(agent, asset)
```

### 2. State Persistence

The backend must persist config changes:

```python
async def update_agent_config(agent: str, asset: str, config: dict):
    try:
        # Update configuration in database/storage
        await db.update_agent_config(agent, asset, config)
        
        # Update in-memory state immediately
        await update_agent_in_memory_config(agent, asset, config)
        
        return True
    except Exception as e:
        logger.error(f"Failed to update config for {agent}: {e}")
        return False
```

### 3. State Update Messages

Ensure `state_update` messages include the updated config:

```python
async def send_state_update(websocket, asset: str):
    # Get fresh state including updated config
    state = await get_current_state(asset)
    
    message = {
        "type": "state_update",
        "data": {
            asset: {
                "agents": {
                    "AgentName": {
                        "config": state.agents.AgentName.config,  # Updated config
                        "data": state.agents.AgentName.data
                    }
                }
            }
        }
    }
    
    await websocket.send_json(message)
```

## UI Design Standards

### 1. Terminal Aesthetic

Follow the Bloomberg Terminal / bash terminal design:

```css
/* Component container */
.bg-black border border-gray-700 font-mono text-xs

/* Header */
.bg-gray-900 border-b border-gray-700

/* Config boxes */
.bg-gray-800 border border-gray-700

/* Color coding */
.text-green-400    /* Agent name */
.text-yellow-400   /* Config section */
.text-purple-400   /* Timestamps */
.text-gray-400     /* Labels */
.text-gray-300     /* Values */
```

### 2. Layout Structure

```jsx
<div className="bg-black border border-gray-700 font-mono text-xs relative">
  {/* Header with inline metadata */}
  <div className="bg-gray-900 border-b border-gray-700 px-2 py-1">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <span className="text-green-400 font-bold">AGENT_NAME</span>
        <span className="text-gray-500">|</span>
        <span className="text-gray-400">Metadata here</span>
      </div>
      <button className="text-yellow-400">CONFIG</button>
    </div>
  </div>
  
  {/* Config modal dropdown */}
  {showConfigModal && (
    <div className="absolute top-full right-0 z-50 bg-gray-900 border border-gray-600 shadow-lg min-w-80">
      {/* Config boxes */}
    </div>
  )}
</div>
```

## Debugging and Troubleshooting

### 1. Console Logs

The system provides comprehensive logging:

- `🔄 AgentName: New config received` - Shows incoming config data
- `📤 AgentName: Config update sent` - Confirms save was sent
- `⚠️ AgentName: Backend may have sent old config values` - Warns of backend issues
- `❌ AgentName: Failed to save config` - Error logging

### 2. Common Issues

#### Issue: Config reverts to defaults after save
**Symptoms**: Save succeeds, but values revert in next state update
**Cause**: Backend not persisting or sending old cached values
**Solution**: Ensure backend updates internal state immediately after config update

#### Issue: Unsaved changes lost on WebSocket reconnect
**Symptoms**: Changes disappear when connection drops
**Cause**: Local cache not persisting across reconnections
**Solution**: Consider localStorage for critical unsaved changes

#### Issue: Multiple agents conflicting
**Symptoms**: Changes from one agent affect another
**Cause**: Shared state or incorrect agent identification
**Solution**: Ensure proper agent isolation in backend

### 3. Testing Checklist

- [ ] Config values can be edited
- [ ] Changes persist across WebSocket updates
- [ ] Save sends correct message format
- [ ] Backend responds with success
- [ ] Next state_update includes updated values
- [ ] Cancel restores original values
- [ ] Multiple agents don't interfere
- [ ] UI follows design standards

## Integration Steps

### 1. Add to New Agent

1. Copy the state management code
2. Update agent name in all references
3. Add config extraction logic
4. Implement UI following design standards
5. Test with backend integration

### 2. Backend Integration

1. Add `config_update` message handler
2. Implement config persistence
3. Update state update messages
4. Test with frontend

### 3. Testing

1. Test individual config changes
2. Test multiple simultaneous changes
3. Test WebSocket reconnection scenarios
4. Verify backend persistence
5. Check error handling

## File Structure

```
src/
├── components/
│   └── agents/
│       ├── AuroraAgent.tsx          # Example implementation
│       ├── NewAgent.tsx             # New agent with config editing
│       └── index.ts                 # Export all agents
├── hooks/
│   └── useWebSocket.ts              # WebSocket with sendMessage
└── websocketTypes.ts                # Type definitions
```

## Message Format

### Config Update Request
```json
{
  "type": "config_update",
  "agent": "AgentName",
  "asset": "BTC",
  "config": {
    "parameter_name": 123
  }
}
```

### Config Update Response
```json
{
  "type": "config_update_response",
  "status": "success",
  "agent": "AgentName",
  "asset": "BTC",
  "config": {
    "parameter_name": 123
  }
}
```

This implementation provides a robust, user-friendly way to edit agent configurations in real-time while maintaining data integrity and providing comprehensive debugging capabilities. 