import { useEffect, useState, useCallback } from 'react';
import type { AccountData, AssetData, WebSocketData } from '../websocketTypes';

interface CleanedData {
  accountData: AccountData | null;
  assets: Record<string, AssetData>;
}

export function useWebSocket(url: string) {
  const [cleanedData, setCleanedData] = useState<CleanedData>({
    accountData: null,
    assets: {},
  });

  const processMessage = useCallback((message: any) => {
    // Per user feedback, the correct structure is { type, account_data, data: { assets... } }
    const accountData = message.account_data || null;
    const assets = message.data || {};

    setCleanedData({
      accountData: accountData,
      assets: assets,
    });
  }, []);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('✅ WebSocket connection established');
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        processMessage(msg);
      } catch (err) {
        console.error('WebSocket data parsing error:', err);
      }
    };

    socket.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
    };

    return () => {
      socket.close();
    };
  }, [url, processMessage]);

  return cleanedData;
}
