import React, { useState, useEffect, useRef } from 'react';

const formatKey = (key: string) => {
  return key.replace(/_/g, ' ').toUpperCase();
};

const ConfigInput = ({ value, onChange }: { value: any; onChange: (newValue: any) => void }) => {
  const type = typeof value;

  if (type === 'boolean') {
    return <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="config-input" />;
  }

  if (type === 'number') {
    return <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="config-input" />;
  }

  return <input type="text" value={String(value)} onChange={(e) => onChange(e.target.value)} className="config-input" />;
};

export function SystemStatus({ data }: { data: any }) {
  const vivienneConfig = data?.vivienne_config;
  const assetNames = vivienneConfig ? Object.keys(vivienneConfig) : [];
  const firstAssetName = assetNames[0] || null;

  // Track which asset is selected
  const [activeAsset, setActiveAsset] = useState(firstAssetName);
  // Track the config for the selected asset
  const [config, setConfig] = useState(firstAssetName ? vivienneConfig[firstAssetName] : null);
  // Track which asset's config is currently loaded in local state
  const lastLoadedAsset = useRef<string | null>(firstAssetName);

  // Only update local config if the asset changes, or on first load
  useEffect(() => {
    if (
      vivienneConfig &&
      activeAsset &&
      (config == null || lastLoadedAsset.current !== activeAsset)
    ) {
      setConfig(vivienneConfig[activeAsset]);
      lastLoadedAsset.current = activeAsset;
    }
    // Do NOT update config if the user is editing!
  }, [vivienneConfig, activeAsset]);

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAsset = e.target.value;
    setActiveAsset(newAsset);
  };

  if (!config || !activeAsset) {
    return <div className="terminal-block">Waiting for System Status...</div>;
  }

  const handleParamChange = (key: string, newValue: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: newValue }));
  };

  const handleSignalWeightChange = (key: string, newValue: any) => {
    setConfig((prev: any) => ({
      ...prev,
      signal_weights: { ...prev.signal_weights, [key]: newValue },
    }));
  };

  const handleSave = async () => {
    // Create an updated version of the entire vivienne_config object
    const updatedVivienneConfig = {
      ...vivienneConfig, // Start with the original full config from props
      [activeAsset]: config, // Overwrite the active asset's config with the edited state
    };

    try {
      const response = await fetch('/api/vivienne/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVivienneConfig),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("💾 Configuration saved successfully:", result);
      alert(`Configuration for ${activeAsset} saved successfully.`);

    } catch (error) {
      console.error("❌ Error saving configuration:", error);
      alert("Failed to save configuration. See console for details.");
    }
  };

  const { signal_weights, ...general_parameters } = config || {};

  return (
    <div className="terminal-block">
      <div className="title-bar">
        <span>⚙️ VIVIENNE CONFIG</span>
        <select onChange={handleAssetChange} value={activeAsset || ''} className="bg-gray-800 border border-gray-600 rounded ml-4 p-1">
          {vivienneConfig && Object.keys(vivienneConfig).map(assetName => (
            <option key={assetName} value={assetName}>{assetName}</option>
          ))}
        </select>
      </div>
      {config ? (
        <>
          <table className="terminal-body">
            <tbody>
              {Object.entries(general_parameters).map(([key, value]) => (
                <tr key={key}>
                  <td>{formatKey(key)}</td>
                  <td>:</td>
                  <td><ConfigInput value={value} onChange={(newValue) => handleParamChange(key, newValue)} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="title-bar" style={{ marginTop: '1.5rem' }}>⚙️ VIVIENNE CONFIG - SIGNAL WEIGHTS</div>
          <table className="terminal-body">
            <tbody>
              {Object.entries(signal_weights || {}).map(([key, value]) => (
                <tr key={key}>
                  <td>{formatKey(key)}</td>
                  <td>:</td>
                  <td><ConfigInput value={value} onChange={(newValue) => handleSignalWeightChange(key, newValue)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSave} className="save-button">Save Changes for {activeAsset}</button>
        </>
      ) : (
        <div className="terminal-body p-4">Select an asset to view its configuration.</div>
      )}
    </div>
  );
} 