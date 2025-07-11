---
alwaysApply: true
---
🎯 Vision

This dashboard is a modular but condensed single-page interface that exposes the full state of the trading engine at a glance. It draws inspiration from:

📊 TradingView – clean charts, dropdowns, collapsible panels
🧠 Bloomberg Terminal – dense info, color-coded signals, minimal chrome
💻 bash terminal – dark theme, monospaced text, simplicity and focus
✅ Design Priorities
No Tabs. One page. All signals, prices, charts, and agent events visible together.
Modularity. Each section should be movable or hideable (collapsible) but lives on the same page.
Low Visual Overhead. No frills. Avoid flashy animations or decorative UI.
Data First. Price, indicators, and events should dominate screen real estate — not padding or chrome.
Color is Meaning.
🟢 Green → price up, profit, positive signals
🔴 Red → price down, loss, negative signals
🟡 Yellow → alerts, neutral signals
🟣 Purple → passive info (time, volume, etc.)
🧱 Required Modules (Baseline)
Each module is one visual component.

Module	Description
Live Chart	Candlestick chart w/ indicators (BB, MACD, RSI, etc.)
Signals Feed	Agent calls like “Vivienne: BANG”, trade alerts
System Status	Agent states (Vivienne, Agatha, Tempest, Vesper...)
PnL Summary	Real-time portfolio: exposure, margin, profit
Ticker/Log Feed	Raw log or console-like feed of engine output
Time/Token Bar	Select token, timeframe, strategy (optional dropdowns)
📐 Layout Guidelines
Use Grid or Flex layout with dense vertical stacking.
Stick to dark background, with bright text only for active data.
Consider CRT mode or "retro terminal" toggle as visual easter egg.
Use monospace font (e.g., Inconsolata, JetBrains Mono).
🔧 Constraints
No page reloads or navigation.
All modules must fit on a single HD screen (1920×1080) or use intelligent scroll collapsing.
Avoid mobile-first patterns — optimize for trading desk setups.
📁 Work Format
Use design.md to:
Paste mockups (Excalidraw, Figma, ASCII if needed)
Link visual inspiration or screenshots
Propose component structure for react-dev
Use tasks.md to assign component prototyping or layout reviews.