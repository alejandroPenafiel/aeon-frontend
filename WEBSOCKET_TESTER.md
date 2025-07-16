# WebSocket Test Client

This document outlines the usage of the Node.js WebSocket test client located at `scripts/test_websockets.js`.

## Overview

The test client is a simple command-line tool designed to connect to the backend's WebSocket endpoints (`/ws/logs` and `/ws/state`). It allows developers to quickly inspect the data being broadcasted by the backend service without needing to interact with the main frontend application.

This is particularly useful for:
-   Verifying the structure and content of the real-time data payloads.
-   Debugging connection issues with the WebSocket server.
-   Confirming that the backend is broadcasting updates as expected.

## How to Use

To run the test client, execute the following command from the project's root directory:

```bash
node scripts/test_websockets.js
```

### Behavior

By default, the script will:
1.  Attempt to connect to `ws://127.0.0.1:8000/ws/logs` and `ws://127.0.0.1:8000/ws/state`.
2.  Print the first two messages it receives from each endpoint to the console.
3.  Automatically disconnect from both endpoints and terminate the process.

This behavior is designed to give you a quick snapshot of the data without leaving a persistent connection open.

## When to Use This Tool

This tool is most effective during the following scenarios:

-   **Initial Backend Setup:** When you first bring up the backend service and want to confirm that the WebSocket endpoints are active and broadcasting.
-   **Payload Inspection:** When you are developing a new feature on the frontend that consumes WebSocket data and need to see the exact structure of the JSON objects being sent.
-   **Backend Changes:** After making changes to the backend's data models or broadcasting logic, you can use this tool to quickly verify that the changes are reflected correctly in the WebSocket stream.
-   **Troubleshooting:** If the frontend is not receiving or displaying data as expected, this tool can help you isolate whether the issue is in the backend (not sending data) or the frontend (not correctly processing it).
