#!/usr/bin/env python3
"""
WebSocket Test Client
=====================

This script connects to the FastAPI WebSocket endpoints for both logs and state
to display the real-time data being broadcasted.

Usage:
    python scripts/test_websockets.py

You must have the main `dashboard_api.py` running in another terminal for this
script to connect successfully.
"""
import asyncio
import json
import websockets

async def listen_to_endpoint(uri, name):
    """A generic function to connect to a WebSocket endpoint and print messages."""
    while True:
        try:
            async with websockets.connect(uri) as websocket:
                print(f"[{name}] Successfully connected to {uri}")
                while True:
                    message = await websocket.recv()
                    try:
                        # Pretty-print JSON if possible
                        data = json.loads(message)
                        print(f"[{name}] Received:")
                        print(json.dumps(data, indent=2))
                    except json.JSONDecodeError:
                        print(f"[{name}] Received (raw): {message}")
        except (websockets.exceptions.ConnectionClosed, ConnectionRefusedError) as e:
            print(f"[{name}] Connection to {uri} lost: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)
        except Exception as e:
            print(f"[{name}] An unexpected error occurred: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)


async def main():
    """Runs the two listeners concurrently."""
    logs_uri = "ws://127.0.0.1:8000/ws/logs"
    state_uri = "ws://127.0.0.1:8000/ws/state"
    
    print("--- Starting WebSocket Test Client ---")
    print(f"Attempting to connect to:")
    print(f"  - Logs: {logs_uri}")
    print(f"  - State: {state_uri}")
    print("------------------------------------")

    log_listener = listen_to_endpoint(logs_uri, "LOGS")
    state_listener = listen_to_endpoint(state_uri, "STATE")

    await asyncio.gather(
        log_listener,
        state_listener
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nClient stopped by user.") 