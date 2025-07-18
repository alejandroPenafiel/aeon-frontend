import WebSocket from 'ws';
import fs from 'fs';

// Helper to infer type
const inferType = (value) => {
    if (typeof value === 'string') {
        // Check if it's a valid date string (basic check)
        if (!isNaN(new Date(value).getTime()) && value.length > 0) {
            return 'timestamp';
        }
        return 'string';
    }
    if (typeof value === 'number') {
        return 'number';
    }
    if (typeof value === 'boolean') {
        return 'boolean';
    }
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return 'array';
    }
    if (typeof value === 'object') {
        return 'object';
    }
    return 'unknown';
};

// Helper to generate schema recursively
const generateSchema = (data) => {
    if (inferType(data) !== 'object' && inferType(data) !== 'array') {
        return inferType(data);
    }

    if (Array.isArray(data)) {
        if (data.length > 0) {
            // For arrays, we'll just take the schema of the first element
            return [generateSchema(data[0])];
        }
        return [];
    }

    const schema = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            schema[key] = generateSchema(data[key]);
        }
    }
    return schema;
};

const listenToEndpoint = (uri, name, messageLimit, onDisconnect, processMessage) => {
    const ws = new WebSocket(uri);
    let messageCount = 0;

    ws.on('open', () => {
        console.log(`[${name}] Successfully connected to ${uri}`);
    });

    ws.on('message', (message) => {
        if (messageCount >= messageLimit) return;

        try {
            const data = JSON.parse(message);
            processMessage(data, name); // Pass data to the new callback
        } catch (error) {
            console.error(`[${name}] Error parsing message: ${error.message}. Raw message: ${message}`);
        }

        messageCount++;
        if (messageCount >= messageLimit) {
            console.log(`[${name}] Received ${messageLimit} messages. Closing connection.`);
            ws.close();
        }
    });

    ws.on('error', (error) => {
        console.error(`[${name}] An unexpected error occurred: ${error.message}.`);
        onDisconnect();
    });

    ws.on('close', () => {
        console.log(`[${name}] Connection to ${uri} closed.`);
        onDisconnect();
    });
};

const main = () => {
    const stateUri = 'ws://127.0.0.1:8000/ws/state';
    const messageLimit = 1; // Only need one message to get the schema
    let openConnections = 1; // Only connecting to stateUri

    let schemaGenerated = false;

    const handleDisconnect = () => {
        openConnections--;
        if (openConnections === 0) {
            console.log('All WebSocket connections closed. Exiting.');
            process.exit(0);
        }
    };

    const processStateMessage = (data, name) => {
        if (schemaGenerated) return; // Process only the first message

        console.log(`[${name}] Processing received data for schema generation.`);

        const simplifiedSchema = {};
        let assetSymbol = null;

        // Extract account_data if present
        if (data.account_data) {
            simplifiedSchema.account_data = generateSchema(data.account_data);
        }

        // Check for the new structure with 'type' and nested 'data'
        if (data.type === "state_update" && data.data) {
            const btcSymbol = "BTC";
            if (data.data[btcSymbol]) {
                simplifiedSchema[btcSymbol] = generateSchema(data.data[btcSymbol]);
            } else {
                console.warn(`[${name}] No BTC data found under 'data.${btcSymbol}' in the message for schema generation.`);
            }
        } else {
            console.warn(`[${name}] Message does not conform to expected 'state_update' structure or missing 'data' key.`);
            // Fallback to previous logic if the new structure is not found, though it might not yield BTC data
            const btcSymbol = "BTC";
            if (data[btcSymbol]) {
                simplifiedSchema[btcSymbol] = generateSchema(data[btcSymbol]);
            } else {
                console.warn(`[${name}] No BTC data found as top-level key in the message for schema generation.`);
            }
        }

        const outputFilePath = './websocket_schema.json';
        fs.writeFile(outputFilePath, JSON.stringify(simplifiedSchema, null, 2), (err) => {
            if (err) {
                console.error(`Error writing schema to file: ${err.message}`);
            } else {
                console.log(`WebSocket schema written to ${outputFilePath}`);
            }
            schemaGenerated = true; // Mark as generated
        });
    };

    console.log('--- Starting WebSocket Schema Generator ---');
    console.log(`Fetching ${messageLimit} message from state endpoint.`);
    console.log('Attempting to connect to:');
    console.log(`  - State: ${stateUri}`);
    console.log('------------------------------------');

    listenToEndpoint(stateUri, 'STATE', messageLimit, handleDisconnect, processStateMessage);
};

main();