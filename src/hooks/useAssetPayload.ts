import { useState, useEffect } from 'react';
import type { AssetPayload } from '../types';

export function useAssetPayload(symbol?: string, fullPayload?: any): AssetPayload | null {
  const [payload, setPayload] = useState<AssetPayload | null>(null);

  useEffect(() => {
    if (!symbol || !fullPayload || !fullPayload[symbol]) {
      setPayload(null);
      return;
    }

    const assetData = { ...fullPayload[symbol] };

    // Ensure chaos_discerned and sorting_signals exist to prevent crashes
    if (!assetData.chaos_discerned) {
      assetData.chaos_discerned = {};
    }
    if (!assetData.chaos_discerned.sorting_signals) {
      assetData.chaos_discerned.sorting_signals = { LONG: [], SHORT: [], NEUTRAL: [] };
    }

    setPayload(assetData);
  }, [symbol, fullPayload]);

  return payload;
} 