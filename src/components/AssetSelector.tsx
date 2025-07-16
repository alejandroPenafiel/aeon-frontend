import React from 'react';

interface AssetSelectorProps {
  assets: string[];
  selectedAsset: string | null;
  onSelect: (asset: string) => void;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({ assets, selectedAsset, onSelect }) => {
  return (
    <nav className="asset-selector">
      {assets.map(asset => (
        <button
          key={asset}
          className={`asset-button ${selectedAsset === asset ? 'active' : ''}`}
          onClick={() => onSelect(asset)}
        >
          {asset}
        </button>
      ))}
    </nav>
  );
};
