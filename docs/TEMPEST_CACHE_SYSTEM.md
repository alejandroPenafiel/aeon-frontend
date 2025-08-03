# Tempest Configuration Cache System

## Problem Solved

The backend updates configuration rapidly, which causes a critical UX issue:

1. **User starts editing** a parameter (e.g., ROE threshold)
2. **Backend sends update** with original/default values
3. **User's changes get overwritten** before they can save
4. **User cannot complete** their configuration changes

## Solution: Cache System

The cache system preserves unsaved changes even when the backend updates rapidly.

### Key Features

- ✅ **Preserves unsaved changes** from rapid backend updates
- ✅ **Visual indicators** show modified vs original values
- ✅ **Cache status display** with detailed change tracking
- ✅ **Reset functionality** to discard changes
- ✅ **Automatic cache expiry** (5 minutes)
- ✅ **Type-safe implementation** with TypeScript

## How It Works

### 1. Cache Initialization

```typescript
// When config data arrives from WebSocket
useEffect(() => {
  if (selectedAsset && tempestConfig) {
    const cachedConfig = cache.getCachedConfig();
    if (!cachedConfig) {
      cache.initializeCache(tempestConfig);
      console.log('📦 Cache initialized for', selectedAsset);
    }
  }
}, [selectedAsset, tempestConfig, cache]);
```

### 2. Parameter Updates

```typescript
const handleParameterChange = (strategyName: string, paramName: string, value: any) => {
  // Update local state
  setConfigValues({
    ...configValues,
    [`${strategyName}.${paramName}`]: value
  });

  // Update cache with the new value
  cache.updateParameter(strategyName, paramName, value);
  console.log(`📝 Parameter updated in cache: ${strategyName}.${paramName} = ${value}`);
};
```

### 3. Saving Changes

```typescript
const handleSaveChanges = () => {
  if (!sendMessage) return;

  // Get only the changes from cache
  const changes = cache.getChanges();
  
  if (Object.keys(changes).length === 0) {
    console.log('📝 No changes to save');
    return;
  }

  // Send only the modified parameters
  sendTempestConfigUpdate(sendMessage, selectedAsset, changes);
  cache.markAsSaved();
  console.log('✅ Changes saved successfully');
};
```

## Cache API

### Core Functions

```typescript
// Initialize cache with original configuration
cache.initializeCache(originalConfig);

// Update a single parameter
cache.updateParameter(strategyName, paramName, value);

// Update multiple parameters
cache.updateParameters(configUpdates);

// Check for unsaved changes
const hasChanges = cache.hasUnsavedChanges();

// Get only the modified parameters
const changes = cache.getChanges();

// Mark changes as saved
cache.markAsSaved();

// Reset to original values
cache.resetToOriginal();

// Clear cache completely
cache.clearCache();
```

### React Hook

```typescript
const cache = useTempestConfigCache(asset);

// All cache functions are available
cache.updateParameter('ROEThresholdStrategy', 'roe_threshold', 0.25);
```

## Visual Indicators

### 1. Unsaved Changes Indicator

```typescript
{cache.hasUnsavedChanges() && (
  <span className="px-2 py-1 text-xs font-mono bg-yellow-600 text-white animate-pulse">
    UNSAVED CHANGES
  </span>
)}
```

### 2. Modified Value Display

```typescript
const value = cachedConfig?.ROEThresholdStrategy?.roe_threshold ?? 
              tempestData?.config?.ROEThresholdStrategy?.roe_threshold ?? 'N/A';
const isModified = cache.getChanges()?.ROEThresholdStrategy?.roe_threshold !== undefined;

return (
  <span className={isModified ? 'text-yellow-400' : 'text-blue-400'}>
    {value}
    {isModified && ' *'}
  </span>
);
```

### 3. Cache Status Display

```typescript
{showCacheStatus && (
  <div className="p-3 bg-gray-900 border border-gray-600">
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
```

## Usage Examples

### Basic Usage

```typescript
import { useTempestConfigCache } from '../utils/tempestConfigCache';

const MyComponent = ({ selectedAsset, tempestConfig }) => {
  const cache = useTempestConfigCache(selectedAsset);

  // Initialize cache when config changes
  useEffect(() => {
    if (selectedAsset && tempestConfig) {
      const cachedConfig = cache.getCachedConfig();
      if (!cachedConfig) {
        cache.initializeCache(tempestConfig);
      }
    }
  }, [selectedAsset, tempestConfig, cache]);

  const handleParameterChange = (strategyName, paramName, value) => {
    cache.updateParameter(strategyName, paramName, value);
  };

  const handleSave = () => {
    const changes = cache.getChanges();
    sendTempestConfigUpdate(sendMessage, selectedAsset, changes);
    cache.markAsSaved();
  };

  return (
    <div>
      {/* Your UI components */}
      {cache.hasUnsavedChanges() && (
        <div className="unsaved-changes-indicator">
          You have unsaved changes
        </div>
      )}
    </div>
  );
};
```

### Advanced Usage with UI

```typescript
const TempestConfigEditor = ({ selectedAsset, tempestConfig, sendMessage }) => {
  const cache = useTempestConfigCache(selectedAsset);
  const [showCacheStatus, setShowCacheStatus] = useState(false);

  // Initialize cache
  useEffect(() => {
    if (selectedAsset && tempestConfig) {
      const cachedConfig = cache.getCachedConfig();
      if (!cachedConfig) {
        cache.initializeCache(tempestConfig);
      }
    }
  }, [selectedAsset, tempestConfig, cache]);

  return (
    <div>
      {/* Header with cache status */}
      <div className="flex justify-between items-center">
        <h3>Tempest Configuration</h3>
        <div className="flex items-center space-x-2">
          {cache.hasUnsavedChanges() && (
            <span className="bg-yellow-600 text-white px-2 py-1 text-xs">
              UNSAVED
            </span>
          )}
          <button onClick={() => setShowCacheStatus(!showCacheStatus)}>
            📦 Cache
          </button>
        </div>
      </div>

      {/* Cache status display */}
      {showCacheStatus && (
        <div className="cache-status-panel">
          <h4>Cache Status</h4>
          <div>Has Changes: {cache.hasUnsavedChanges() ? 'Yes' : 'No'}</div>
          {cache.hasUnsavedChanges() && (
            <pre>{JSON.stringify(cache.getChanges(), null, 2)}</pre>
          )}
          <div className="flex space-x-2">
            <button onClick={() => cache.resetToOriginal()}>
              Reset
            </button>
            <button onClick={() => cache.clearCache()}>
              Clear Cache
            </button>
          </div>
        </div>
      )}

      {/* Configuration controls */}
      <div className="config-controls">
        {/* Your parameter inputs here */}
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        <button 
          onClick={() => {
            const changes = cache.getChanges();
            sendTempestConfigUpdate(sendMessage, selectedAsset, changes);
            cache.markAsSaved();
          }}
          disabled={!cache.hasUnsavedChanges()}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
```

## Benefits

### 1. **Prevents Data Loss**
- User changes are preserved even when backend updates rapidly
- No more losing work due to WebSocket updates

### 2. **Clear Visual Feedback**
- Users can see which values are modified vs original
- Unsaved changes indicator prevents confusion

### 3. **Flexible Control**
- Users can reset to original values
- Users can clear cache completely
- Users can save only modified parameters

### 4. **Performance Optimized**
- Only sends changed parameters to backend
- Automatic cache expiry prevents memory leaks
- Efficient change detection

### 5. **Developer Friendly**
- Type-safe implementation
- Comprehensive logging
- Easy to integrate into existing components

## Integration with Existing Components

The cache system is designed to work seamlessly with existing components:

1. **MarketClosurePanel** - Already updated to use cache
2. **TempestConfigExample** - Demonstrates cache usage
3. **TempestConfigCacheExample** - Simple example for testing

## Testing the Cache System

1. **Start editing** a parameter value
2. **Notice the "UNSAVED CHANGES"** indicator appears
3. **Simulate backend update** (or wait for real update)
4. **Verify your changes are preserved**
5. **Save changes** to send to backend
6. **Reset or clear cache** to test other functions

The cache system ensures that users can complete their configuration changes without interference from rapid backend updates. 