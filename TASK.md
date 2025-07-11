# ✅ Task Board — Frontend Only

This board is exclusively for `react-dev` and `creative-ui`.  
Backend systems (WebSocket, Redis, FastAPI, Postgres) are managed externally.  
If data is missing, request it explicitly (e.g. "Need WebSocket event for strategy state").

---

## 📅 Active Sprint Goals

- [ ] Set up the base frontend layout with placeholder modules
- [ ] Connect to live WebSocket stream (when available)
- [ ] Confirm data contracts and shape from `socket-dev`
- [ ] Begin styling modules to match Bloomberg aesthetic

---

## 🎨 `creative-ui` Tasks

- [ ] Wireframe layout (in Figma, Excalidraw, or Markdown ASCII)
- [ ] Finalize grid system: layout modules in visual hierarchy
- [ ] Design CRT/Terminal toggle (visual only)
- [ ] Select color scheme for signal types (gain/loss/warning/info)
- [ ] Define spacing, font scale, and typography rules

---

## 💻 `react-dev` Tasks

### 🔧 Project Setup
- [ ] Create new React project with Vite + TypeScript
- [ ] Add TailwindCSS + base config
- [ ] Define folder structure: `components/`, `hooks/`, `layouts/`, `contexts/`

### 📦 Module Placeholders
- [ ] `<LiveChart />` – Chart placeholder (no data yet)
- [ ] `<SignalsFeed />` – Event ticker placeholder
- [ ] `<AgentStatus />` – Box showing states (e.g. “Vivienne: LOADED”)
- [ ] `<PnLSummary />` – Equity, PnL, exposure panel
- [ ] `<TokenSelector />` – Dropdown for token/timeframe

### 📡 WebSocket Setup
- [ ] Create `useWebSocket.ts` hook
- [ ] Log incoming data (once socket-dev provides events)
- [ ] Update context or store with real-time updates

---

## 📩 Data Requests

| Needed Data | Who to Ask | Notes |
|-------------|------------|-------|
| Agent state format (`Vivienne`, `Tempest`, etc) | `socket-dev` | e.g., `{ agent: "Vivienne", state: "BANG" }` |
| PnL & position metrics | `socket-dev` | Needed for `<PnLSummary />` |
| Strategy signal payload | `socket-dev` | Needed for `<SignalsFeed />` |
| Historical candles | `api-dev` or `socket-dev` | For `<LiveChart />` |

---

## 🔄 Feedback Loop

- Post visual feedback, mockups, and layout iterations in `design.md`
- Use comments in this file to note blocked tasks or pending reviews
- Keep changes local to frontend code — never touch Python backend

