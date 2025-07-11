# Aeon - Trading Engine Frontend

This repository contains the frontend for Aeon, a real-time, single-page dashboard for monitoring a trading engine. The interface is designed to be a modular but condensed view of the engine's full state, inspired by the information density of a Bloomberg Terminal and the clean aesthetic of TradingView.

## 🎯 Vision

The core goal is to provide a high-performance, "at-a-glance" dashboard with zero visual overhead.

-   **Single-Page Interface**: No tabs, no reloads. All modules live on one page.
-   **Modularity**: Components are collapsible and can be rearranged.
-   **Data-First Design**: Minimal chrome, with a focus on price, indicators, and events.
-   **Aesthetic**: Dark theme, monospace fonts, and color-coded signals to convey meaning instantly.

## 🧱 Core Modules

The dashboard will be composed of several key modules:

-   **Live Chart**: Candlestick chart with indicators (BB, MACD, RSI, etc.).
-   **Signals Feed**: Real-time feed of agent calls and trade alerts.
-   **System Status**: Displays the state of various backend agents (e.g., Vivienne, Agatha).
-   **PnL Summary**: Real-time portfolio summary, including exposure, margin, and profit.
-   **Ticker/Log Feed**: A raw log or console-like feed of engine output.
-   **Time/Token Bar**: Dropdowns to select token, timeframe, and strategy.

## 🛠️ Tech Stack

-   **Framework**: React (with Vite)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Real-time Data**: WebSockets

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd aeon-frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
