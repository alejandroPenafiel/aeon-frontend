# 📌 Planning Document

## 🎯 Project Goal

Build a modular, high-density, single-page financial dashboard frontend in React that connects to a Python trading engine via WebSocket + Redis. The interface should resemble Bloomberg Terminal, TradingView, and a UNIX-style terminal.

## 🧱 Core Structure

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Redis Pub/Sub
- **Realtime Bridge**: WebSocket (Redis → FastAPI → React)

## 🎨 Design Guidelines (from `design.mdc`)

- One-page layout (no tabs)
- Bloomberg-style data density
- Modules: Chart, Feed, Agent Status, PnL, Logs, Dropdown Controls
- Monospaced font, dark theme, color-coded signals
- Responsive on 1920×1080; no mobile focus

## 🧭 Roadmap / Phases

| Phase | Objective                               |
|-------|------------------------------------------|
| 1     | Scaffold React app (Vite + Tailwind)     |
| 4     | Implement socket consumer in React       |
| 5     | Design + build first UI modules          |
| 6     | Connect modules to live WebSocket feed   |
| 7     | Polish and condense layout               |

## 📎 Dependencies

- `task setup` → installs deps
- `task frontend` → launches Vite dev server
- Redis running locally (`localhost:6379`)
- FastAPI listening on `localhost:8000`

