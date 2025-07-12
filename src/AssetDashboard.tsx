import React, { useMemo, useState } from 'react';
import { useAssetPayload } from './hooks/useAssetPayload';
import { selectSummary, selectChaos, selectCategorisedSignals, selectSortedSignals } from './selectors';
import AssetSummaryBlock from './components/AssetSummaryBlock';
import ChaosEnginePanel from './components/ChaosEnginePanel';
import SignalsByCategory from './components/SignalsByCategory';
import SortedSignalsGrid from './components/SortedSignalsGrid';
import StrategyConfigEditor from './components/StrategyConfigEditor';
import RawJsonDebug from './components/RawJsonDebug';

const AssetDashboard: React.FC<{ symbol: string; fullPayload: any }> = ({ symbol, fullPayload }) => {
  const raw = useAssetPayload(symbol, fullPayload);
  const summaryProps = useMemo(() => selectSummary(raw), [raw]);
  const chaosProps = useMemo(() => selectChaos(raw), [raw]);
  const categorisedSignals = useMemo(() => selectCategorisedSignals(raw), [raw]);
  const sortedSignals = useMemo(() => selectSortedSignals(raw), [raw]);
  const [debugCollapsed, setDebugCollapsed] = useState(true);

  if (!raw) {
    return <div className="terminal-block">Loading {symbol} dashboard...</div>;
  }
  console.log(`AssetDashboard for ${symbol} received raw data:`, raw); // Debug log

  return (
    <main className="grid-dashboard">
      <section style={{ gridArea: 'summary' }}>
        <AssetSummaryBlock {...summaryProps} />
      </section>
      <section style={{ gridArea: 'chaos' }}>
        <ChaosEnginePanel {...chaosProps} />
      </section>
      <section style={{ gridArea: 'signals' }}>
        <SignalsByCategory categorisedSignals={categorisedSignals} />
      </section>
      <section style={{ gridArea: 'sorted' }}>
        <SortedSignalsGrid sortingSignals={sortedSignals} />
      </section>
      <section style={{ gridArea: 'config' }}>
        <StrategyConfigEditor onToggleDebug={() => setDebugCollapsed((v) => !v)} />
      </section>
      <section style={{ gridArea: 'debug' }}>
        <RawJsonDebug rawPayload={raw} collapsed={debugCollapsed} onToggle={() => setDebugCollapsed((v) => !v)} />
      </section>
    </main>
  );
};

export default AssetDashboard; 