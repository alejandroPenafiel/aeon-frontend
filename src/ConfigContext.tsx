import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ConfigContextShape } from './types';
import type { StrategyConfig } from './types';

const ConfigContext = createContext<ConfigContextShape | undefined>(undefined);

export const ConfigProvider: React.FC<{
  initialConfig: StrategyConfig;
  children: React.ReactNode;
}> = ({ initialConfig, children }) => {
  const [draftConfig, setDraftConfig] = useState<StrategyConfig>(initialConfig);
  const [dirty, setDirty] = useState(false);

  // Example save/reset handlers (replace with real backend logic)
  const saveConfig = useCallback(() => {
    // TODO: POST draftConfig to backend
    setDirty(false);
  }, [draftConfig]);

  const resetConfig = useCallback(() => {
    setDraftConfig(initialConfig);
    setDirty(false);
  }, [initialConfig]);

  // Mark dirty on any config change
  const handleSetDraftConfig = (c: StrategyConfig) => {
    setDraftConfig(c);
    setDirty(true);
  };

  return (
    <ConfigContext.Provider
      value={{
        draftConfig,
        setDraftConfig: handleSetDraftConfig,
        saveConfig,
        resetConfig,
        dirty,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfigContext = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfigContext must be used within ConfigProvider');
  return ctx;
}; 