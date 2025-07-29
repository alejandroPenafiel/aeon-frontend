import React, { useState, useMemo, useEffect } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import type { AssetData } from "./websocketTypes";
import { AccountSummary } from "./components/AccountSummary";
import { AssetSelector } from "./components/AssetSelector";
import { AssetDetails } from "./components/AssetDetails";
import { SignalsFeed } from "./components/SignalsFeed";
import AgentStatusPanel from "./components/AgentStatusPanel";

function App() {
  // Dynamic WebSocket URL that works for both local and network access
  const getWebSocketUrl = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${hostname}:8000/ws/state`;
  };

  const { accountData, fullMessage, sendMessage } = useWebSocket(
    getWebSocketUrl(),
  );

  const availableAssets = useMemo(
    () => (fullMessage?.data ? Object.keys(fullMessage.data) : []),
    [fullMessage],
  );
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  useEffect(() => {
    if (availableAssets.length > 0 && !selectedAsset) {
      setSelectedAsset(availableAssets[0]);
    }
  }, [availableAssets, selectedAsset]);

  const selectedAssetData: AssetData | null = useMemo(() => {
    if (!fullMessage?.data || !selectedAsset) return null;
    return fullMessage.data[selectedAsset];
  }, [fullMessage, selectedAsset]);

  return (
    <div className="min-h-screen bg-black text-green-400 p-2 sm:p-4">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400 mb-2">
            AEON TRADING DASHBOARD
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Real-time agent monitoring and signal analysis
          </p>
        </div>

        {/* Account Summary */}
        {accountData && <AccountSummary accountData={accountData} />}

        {/* Asset Selector */}
        <AssetSelector
          assets={availableAssets}
          selectedAsset={selectedAsset}
          onSelect={setSelectedAsset}
        />

        {/* Agent Status Panel */}
        <AgentStatusPanel
          assetData={selectedAssetData}
          selectedAsset={selectedAsset}
          sendMessage={sendMessage}
        />

        {/* Signals Feed - Hidden per user request */}
        {/* <SignalsFeed 
          fullMessage={fullMessage} 
          selectedAsset={selectedAsset} 
        /> */}

        {/* Asset Details */}
        {selectedAssetData && selectedAsset && fullMessage && (
          <AssetDetails
            assetData={selectedAssetData}
            symbol={selectedAsset}
            fullMessage={fullMessage}
            sendMessage={sendMessage}
          />
        )}
      </div>
    </div>
  );
}

export default App;
