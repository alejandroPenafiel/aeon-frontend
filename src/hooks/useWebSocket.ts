import { useEffect, useState } from "react";

export function useWebSocket<T>(url: string) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log("✅ WebSocket connection established");
      socket.send(JSON.stringify({ message: "Requesting state updates" }));
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Log a deep copy to prevent the console from showing a live reference
        console.log("📡 Incoming WebSocket data:", JSON.parse(JSON.stringify(msg)));
        setData(msg);
      } catch (err) {
        console.error("WebSocket error:", err);
      }
    };
    return () => {
        socket.close();
    }
  }, [url]);

  return { data };
} 