import React, { useState, useMemo, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import type { AssetData } from './websocketTypes';
import { AccountSummary } from './components/AccountSummary';
import { AssetSelector } from './components/AssetSelector';
import { AssetDetails } from './components/AssetDetails';
import { SignalsFeed } from './components/SignalsFeed';

function App() {
  const { accountData, fullMessage } = useWebSocket("ws://127.0.0.1:8000/ws/state");

  const availableAssets = useMemo(() => fullMessage?.data ? Object.keys(fullMessage.data) : [], [fullMessage]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  useEffect(() => {
    if (availableAssets.length > 0 && !selectedAsset) {
      setSelectedAsset(availableAssets[0]);
    }
  }, [availableAssets, selectedAsset]);

  const assetData: AssetData | null = useMemo(() => {
    if (!selectedAsset || !fullMessage?.data?.[selectedAsset]) return null;
    return fullMessage.data[selectedAsset];
  }, [fullMessage, selectedAsset]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Aeon Frontend</h1>
        <AssetSelector
          assets={availableAssets}
          selectedAsset={selectedAsset}
          onSelect={setSelectedAsset}
        />
      </header>
      <main className="app-main">
        <AccountSummary accountData={accountData} />
        
        {/* Signals Feed - Show real-time signals from all agents */}
        <SignalsFeed fullMessage={fullMessage} selectedAsset={selectedAsset} />

        {selectedAsset && assetData && fullMessage ? (
          <AssetDetails symbol={selectedAsset} assetData={assetData} fullMessage={fullMessage} />
        ) : (
          <div className="terminal-block">
            {availableAssets.length > 0 ? 'Select an asset to view its data.' : 'Waiting for asset data...'}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
