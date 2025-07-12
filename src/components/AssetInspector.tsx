import React from "react";

export function AssetInspector({ data }: { data: any }) {
  if (!data) return <div className="terminal-box">No data available.</div>;

  // Get all asset keys from vivienne_clarity (or vivienne_config if that's more complete)
  const assetKeys = Object.keys(data.vivienne_clarity || data.vivienne_config || {});

  if (assetKeys.length === 0) {
    return <div className="terminal-box">No per-asset data found.</div>;
  }

  return (
    <div>
      {assetKeys.map((asset) => (
        <div key={asset} style={{ marginBottom: "2rem", border: "1px solid #333", padding: "1rem", borderRadius: "6px", background: "#111" }}>
          <h2 style={{ color: "#0f0", fontFamily: "monospace", marginBottom: "1rem" }}>{asset}</h2>
          <pre style={{ color: "#fff", background: "#181818", padding: "1rem", borderRadius: "4px", overflowX: "auto" }}>
            {JSON.stringify({
              ...data.vivienne_clarity?.[asset],
              config: data.vivienne_config?.[asset],
            }, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
} 