import { useWebSocket } from './hooks/useWebSocket';
import { PnLSummary } from './components/PnLSummary';
import { SystemStatus } from './components/SystemStatus';
import { SignalsFeed } from './components/SignalsFeed';
import { AssetInspector } from './components/AssetInspector';
import './App.css'

function App() {
  const { data: payload }: { data: any } = useWebSocket("ws://localhost:8000/ws/state");

  return (
    <div style={{ backgroundColor: "#000", minHeight: "100vh", padding: "2rem", color: "#eee" }}>
      <PnLSummary data={payload?.data?.artemis_user_state} />
      <SignalsFeed data={payload?.data?.vivienne_clarity} />
      <SystemStatus data={payload?.data} />
      <AssetInspector data={payload?.data} />
    </div>
  );
}

export default App
