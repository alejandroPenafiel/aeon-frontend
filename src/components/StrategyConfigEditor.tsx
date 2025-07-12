import React, { useState, useEffect, useMemo } from 'react';
import { useConfigContext } from '../ConfigContext';

// Minimal accessible accordion
function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        className="w-full text-left font-bold py-2 px-3 bg-[#222] text-[#ffcc00] border-b border-[#333] focus:outline-none focus:ring"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {title}
      </button>
      {open && <div className="p-3 bg-[#181818]">{children}</div>}
    </div>
  );
}

const THRESHOLDS = [
  { key: 'bang_threshold', label: 'Bang Threshold' },
  { key: 'aim_threshold', label: 'Aim Threshold' },
  { key: 'loaded_threshold', label: 'Loaded Threshold' },
];
const FEATURE_FLAGS = [
  { key: 'enable_trend_filter_for_entry', label: 'Trend Filter for Entry' },
  { key: 'enable_bollinger_filter_for_entry', label: 'Bollinger Filter for Entry' },
  { key: 'bollinger_overextended_block', label: 'Bollinger Overextended Block' },
];

// Custom hook for hotkeys
function useHotkeys(handlers: { [combo: string]: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'Enter') handlers['ctrl+enter']?.();
      if (e.key === 'Escape') handlers['esc']?.();
      if (e.shiftKey && (e.key === '?' || e.key === '/')) handlers['shift+/']?.();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}

const StrategyConfigEditor: React.FC<{ onToggleDebug?: () => void }> = ({ onToggleDebug }) => {
  const { draftConfig, setDraftConfig, saveConfig, resetConfig, dirty } = useConfigContext();

  // Find all numeric fields that are not thresholds
  const weightFields = useMemo(() => {
    return Object.keys(draftConfig)
      .filter(
        (k) =>
          typeof draftConfig[k] === 'number' &&
          !THRESHOLDS.some((t) => t.key === k)
      )
      .map((k) => ({ key: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) }));
  }, [draftConfig]);

  // Hotkeys
  useHotkeys({
    'ctrl+enter': () => dirty && saveConfig(),
    'esc': () => dirty && resetConfig(),
    'shift+/': () => onToggleDebug?.(),
  });

  // Fallback UI for missing fields
  const hasThresholds = THRESHOLDS.every((t) => t.key in draftConfig);
  const hasFlags = FEATURE_FLAGS.every((f) => f.key in draftConfig);

  return (
    <div className="terminal-block max-w-xl mx-auto mt-4">
      <h2 className="title-bar">Strategy Config</h2>
      <Accordion title="Thresholds" defaultOpen>
        {hasThresholds ? (
          <div className="space-y-4">
            {THRESHOLDS.map(({ key, label }: { key: string; label: string }) => (
              <div key={key} className="flex items-center gap-4">
                <label className="w-48" htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type="range"
                  min={0}
                  max={100}
                  value={draftConfig[key] as number}
                  onChange={e => setDraftConfig({ ...draftConfig, [key]: Number(e.target.value) })}
                  className="flex-1 accent-green-400"
                />
                <span className="w-12 text-right">{draftConfig[key]}</span>
              </div>
            ))}
          </div>
        ) : <div className="text-yellow-400">Threshold fields missing from config.</div>}
      </Accordion>
      <Accordion title="Feature Flags">
        {hasFlags ? (
          <div className="space-y-3">
            {FEATURE_FLAGS.map(({ key, label }: { key: string; label: string }) => (
              <div key={key} className="flex items-center gap-4">
                <label className="w-64" htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type="checkbox"
                  checked={!!draftConfig[key]}
                  onChange={e => setDraftConfig({ ...draftConfig, [key]: e.target.checked })}
                  className="scale-125 accent-yellow-400"
                />
              </div>
            ))}
          </div>
        ) : <div className="text-yellow-400">Feature flag fields missing from config.</div>}
      </Accordion>
      <Accordion title="Weights">
        {weightFields.length > 0 ? (
          <div className="space-y-3">
            {weightFields.map(({ key, label }: { key: string; label: string }) => (
              <div key={key} className="flex items-center gap-4">
                <label className="w-64" htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type="number"
                  value={draftConfig[key] as number}
                  onChange={e => setDraftConfig({ ...draftConfig, [key]: Number(e.target.value) })}
                  className="config-input"
                />
              </div>
            ))}
          </div>
        ) : <div className="text-purple-400">No weight fields found.</div>}
      </Accordion>
      <div className="flex gap-4 mt-6">
        <button
          className={`save-button ${!dirty ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={saveConfig}
          disabled={!dirty}
        >
          Save (Ctrl+Enter)
        </button>
        <button
          className="save-button bg-[#222] border-[#ffcc00] text-[#ffcc00] hover:bg-[#333]"
          onClick={resetConfig}
          disabled={!dirty}
        >
          Reset (Esc)
        </button>
        <button
          className="save-button bg-[#222] border-[#a259ff] text-[#a259ff] hover:bg-[#333]"
          type="button"
          onClick={() => onToggleDebug?.()}
        >
          Toggle Debug (Shift+/)
        </button>
      </div>
    </div>
  );
};

export default StrategyConfigEditor; 