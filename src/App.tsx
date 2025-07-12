import { useState, useMemo } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import AssetSelector from './components/AssetSelector';
import AssetDashboard from './AssetDashboard';
import { PnLSummary } from './components/PnLSummary';
import { ConfigProvider } from './ConfigContext'; // Import ConfigProvider
import './App.css';

const defaultStrategyConfig = {
  bang_threshold: 0.5,
  aim_threshold: 0.5,
  loaded_threshold: 0.5,
  enable_trend_filter_for_entry: true,
  enable_bollinger_filter_for_entry: true,
  bollinger_overextended_block: false,
};

function App() {
  const { data: payload } = useWebSocket("ws://localhost:8000/ws/state");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const vivienneClarity = payload?.data?.vivienne_clarity;
  const artemisUserState = payload?.data?.artemis_user_state;

  const availableAssets = useMemo(() => {
    if (!vivienneClarity) return [];
    return Object.keys(vivienneClarity);
  }, [vivienneClarity]);

  // Automatically select the first asset once available
  if (!selectedAsset && availableAssets.length > 0) {
    setSelectedAsset(availableAssets[0]);
  }

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
        <PnLSummary data={artemisUserState} />
        <ConfigProvider initialConfig={defaultStrategyConfig}> {/* Wrap with ConfigProvider */}
          {selectedAsset ? (
            <AssetDashboard
              key={selectedAsset}
              symbol={selectedAsset}
              fullPayload={vivienneClarity}
            />
          ) : (
            <div className="terminal-block">
              {availableAssets.length > 0 ? 'Select an asset to view its data.' : 'Waiting for asset data...'}
            </div>
          )}
        </ConfigProvider>
      </main>
    </div>
  );
}

export default App;
