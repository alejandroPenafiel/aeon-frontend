/**
 * Tempest Configuration Cache System
 * 
 * This module provides a caching system to preserve unsaved configuration changes
 * even when the backend updates rapidly. It prevents local changes from being
 * overwritten by incoming WebSocket updates.
 */

export interface CachedConfig {
  [strategyName: string]: {
    [parameterName: string]: any;
  };
}

export interface CacheMetadata {
  lastModified: number;
  hasUnsavedChanges: boolean;
  originalConfig: CachedConfig;
  modifiedConfig: CachedConfig;
}

class TempestConfigCache {
  private cache: Map<string, CacheMetadata> = new Map();
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached configuration for an asset
   */
  getCachedConfig(asset: string): CachedConfig | null {
    const metadata = this.cache.get(asset);
    if (!metadata) return null;

    // Check if cache has expired
    if (Date.now() - metadata.lastModified > this.CACHE_EXPIRY_MS) {
      this.cache.delete(asset);
      return null;
    }

    return metadata.modifiedConfig;
  }

  /**
   * Get cache metadata for an asset
   */
  getCacheMetadata(asset: string): CacheMetadata | null {
    const metadata = this.cache.get(asset);
    if (!metadata) return null;

    // Check if cache has expired
    if (Date.now() - metadata.lastModified > this.CACHE_EXPIRY_MS) {
      this.cache.delete(asset);
      return null;
    }

    return metadata;
  }

  /**
   * Initialize cache with original configuration
   */
  initializeCache(asset: string, originalConfig: CachedConfig): void {
    const metadata: CacheMetadata = {
      lastModified: Date.now(),
      hasUnsavedChanges: false,
      originalConfig: this.deepClone(originalConfig),
      modifiedConfig: this.deepClone(originalConfig)
    };

    this.cache.set(asset, metadata);
    console.log(`📦 Cache initialized for ${asset}:`, originalConfig);
  }

  /**
   * Update a single parameter in the cache
   */
  updateParameter(asset: string, strategyName: string, paramName: string, value: any): void {
    const metadata = this.cache.get(asset);
    if (!metadata) {
      console.warn(`❌ No cache found for asset: ${asset}`);
      return;
    }

    // Update the modified config
    if (!metadata.modifiedConfig[strategyName]) {
      metadata.modifiedConfig[strategyName] = {};
    }
    metadata.modifiedConfig[strategyName][paramName] = value;

    // Mark as having unsaved changes
    metadata.hasUnsavedChanges = true;
    metadata.lastModified = Date.now();

    console.log(`📝 Cache updated for ${asset}: ${strategyName}.${paramName} = ${value}`);
  }

  /**
   * Update multiple parameters in the cache
   */
  updateParameters(asset: string, configUpdates: CachedConfig): void {
    const metadata = this.cache.get(asset);
    if (!metadata) {
      console.warn(`❌ No cache found for asset: ${asset}`);
      return;
    }

    // Merge the updates into the modified config
    Object.entries(configUpdates).forEach(([strategyName, strategyConfig]) => {
      if (!metadata.modifiedConfig[strategyName]) {
        metadata.modifiedConfig[strategyName] = {};
      }
      
      Object.entries(strategyConfig).forEach(([paramName, value]) => {
        metadata.modifiedConfig[strategyName][paramName] = value;
      });
    });

    metadata.hasUnsavedChanges = true;
    metadata.lastModified = Date.now();

    console.log(`📝 Cache updated for ${asset}:`, configUpdates);
  }

  /**
   * Check if there are unsaved changes for an asset
   */
  hasUnsavedChanges(asset: string): boolean {
    const metadata = this.cache.get(asset);
    return metadata?.hasUnsavedChanges || false;
  }

  /**
   * Get the difference between original and modified config
   */
  getChanges(asset: string): CachedConfig {
    const metadata = this.cache.get(asset);
    if (!metadata) return {};

    const changes: CachedConfig = {};

    Object.entries(metadata.modifiedConfig).forEach(([strategyName, strategyConfig]) => {
      const originalStrategy = metadata.originalConfig[strategyName] || {};
      const strategyChanges: { [key: string]: any } = {};

      Object.entries(strategyConfig).forEach(([paramName, value]) => {
        const originalValue = originalStrategy[paramName];
        if (value !== originalValue) {
          strategyChanges[paramName] = value;
        }
      });

      if (Object.keys(strategyChanges).length > 0) {
        changes[strategyName] = strategyChanges;
      }
    });

    return changes;
  }

  /**
   * Mark changes as saved (reset unsaved flag)
   */
  markAsSaved(asset: string): void {
    const metadata = this.cache.get(asset);
    if (metadata) {
      metadata.hasUnsavedChanges = false;
      metadata.originalConfig = this.deepClone(metadata.modifiedConfig);
      console.log(`✅ Changes marked as saved for ${asset}`);
    }
  }

  /**
   * Reset cache to original values
   */
  resetToOriginal(asset: string): void {
    const metadata = this.cache.get(asset);
    if (metadata) {
      metadata.modifiedConfig = this.deepClone(metadata.originalConfig);
      metadata.hasUnsavedChanges = false;
      metadata.lastModified = Date.now();
      console.log(`🔄 Cache reset to original for ${asset}`);
    }
  }

  /**
   * Clear cache for an asset
   */
  clearCache(asset: string): void {
    this.cache.delete(asset);
    console.log(`🗑️ Cache cleared for ${asset}`);
  }

  /**
   * Get all cached assets
   */
  getCachedAssets(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalAssets: number; assetsWithChanges: number } {
    const assets = Array.from(this.cache.keys());
    const assetsWithChanges = assets.filter(asset => this.hasUnsavedChanges(asset)).length;

    return {
      totalAssets: assets.length,
      assetsWithChanges
    };
  }

  /**
   * Deep clone an object
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}

// Export singleton instance
export const tempestConfigCache = new TempestConfigCache();

/**
 * React hook for managing cached configuration
 */
export function useTempestConfigCache(asset: string) {
  const getCachedConfig = () => tempestConfigCache.getCachedConfig(asset);
  const getCacheMetadata = () => tempestConfigCache.getCacheMetadata(asset);
  const hasUnsavedChanges = () => tempestConfigCache.hasUnsavedChanges(asset);
  const getChanges = () => tempestConfigCache.getChanges(asset);
  const markAsSaved = () => tempestConfigCache.markAsSaved(asset);
  const resetToOriginal = () => tempestConfigCache.resetToOriginal(asset);
  const clearCache = () => tempestConfigCache.clearCache(asset);

  const updateParameter = (strategyName: string, paramName: string, value: any) => {
    tempestConfigCache.updateParameter(asset, strategyName, paramName, value);
  };

  const updateParameters = (configUpdates: CachedConfig) => {
    tempestConfigCache.updateParameters(asset, configUpdates);
  };

  const initializeCache = (originalConfig: CachedConfig) => {
    tempestConfigCache.initializeCache(asset, originalConfig);
  };

  return {
    getCachedConfig,
    getCacheMetadata,
    hasUnsavedChanges,
    getChanges,
    markAsSaved,
    resetToOriginal,
    clearCache,
    updateParameter,
    updateParameters,
    initializeCache
  };
} 