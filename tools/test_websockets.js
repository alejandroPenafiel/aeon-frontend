
import WebSocket from 'ws';

const listenToEndpoint = (uri, name, messageLimit, onDisconnect) => {
    const ws = new WebSocket(uri);
    let messageCount = 0;

    // Add timeout to wait longer for messages
    const timeout = setTimeout(() => {
        console.log(`[${name}] Timeout reached. Closing connection.`);
        ws.close();
    }, 10000); // 10 second timeout

    ws.on('open', () => {
        console.log(`[${name}] Successfully connected to ${uri}`);
    });

    ws.on('message', (message) => {
        if (messageCount >= messageLimit) return;

        try {
            const data = JSON.parse(message);
            console.log(`[${name}] Received:`);
            console.log(JSON.stringify(data, null, 2));
        } catch (error) {
            console.log(`[${name}] Received (raw): ${message}`);
        }

        messageCount++;
        if (messageCount >= messageLimit) {
            console.log(`[${name}] Received ${messageLimit} messages. Closing connection.`);
            clearTimeout(timeout);
            ws.close();
        }
    });

    ws.on('error', (error) => {
        console.error(`[${name}] An unexpected error occurred: ${error.message}.`);
        clearTimeout(timeout);
        onDisconnect();
    });

    ws.on('close', () => {
        console.log(`[${name}] Connection to ${uri} closed.`);
        clearTimeout(timeout);
        onDisconnect();
    });
};

const main = () => {
    const logsUri = 'ws://127.0.0.1:8000/ws/logs';
    const stateUri = 'ws://127.0.0.1:8000/ws/state';
    const messageLimit = 3; // Increased to 3 messages
    let openConnections = 2;

    const handleDisconnect = () => {
        openConnections--;
        if (openConnections === 0) {
            console.log('All WebSocket connections closed. Exiting.');
            process.exit(0);
        }
    };

    console.log('--- Starting WebSocket Test Client ---');
    console.log(`Fetching ${messageLimit} messages from each endpoint.`);
    console.log('Attempting to connect to:');
    console.log(`  - Logs: ${logsUri}`);
    console.log(`  - State: ${stateUri}`);
    console.log('------------------------------------');

    listenToEndpoint(logsUri, 'LOGS', messageLimit, handleDisconnect);
    listenToEndpoint(stateUri, 'STATE', messageLimit, handleDisconnect);
};

main();
