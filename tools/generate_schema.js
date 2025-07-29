/**
 * WebSocket Schema Generator
 * Connects to WebSocket endpoints and generates JSON schema from received data
 * Outputs schema to ../websocket_schema.json
 * 
 * DYNAMIC VERSION: Adapts to any backend structure automatically
 */
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
            processMessage(data, name); // Pass data to the callback
        } catch (error) {
            console.error(`[${name}] Error parsing message: ${error.message}. Raw message: ${message}`);
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
    const stateUri = 'ws://127.0.0.1:8000/ws/state';
    const messageLimit = 3; // Increased to 3 messages like test_websockets
    let openConnections = 1;
    let schemaGenerated = false;
    let allData = {}; // Store all received data for comprehensive schema

    const handleDisconnect = () => {
        openConnections--;
        if (openConnections === 0) {
            console.log('All WebSocket connections closed. Exiting.');
            process.exit(0);
        }
    };

    const processStateMessage = (data, name) => {
        console.log(`[${name}] Processing received data for schema generation.`);
        
        // Merge all received data to create comprehensive schema
        allData = { ...allData, ...data };
        
        // Generate schema from accumulated data
        const comprehensiveSchema = generateSchema(allData);
        
        const outputFilePath = './websocket_schema.json';
        fs.writeFile(outputFilePath, JSON.stringify(comprehensiveSchema, null, 2), (err) => {
            if (err) {
                console.error(`Error writing schema to file: ${err.message}`);
            } else {
                console.log(`✅ WebSocket schema written to ${outputFilePath}`);
                console.log(`📊 Schema generated from ${Object.keys(allData).length} top-level keys`);
                console.log(`🔍 Detected structure: ${JSON.stringify(Object.keys(allData), null, 2)}`);
            }
        });
        
        // Only mark as generated once to avoid overwriting
        if (!schemaGenerated) {
            schemaGenerated = true;
        }
    };

    console.log('--- Starting DYNAMIC WebSocket Schema Generator ---');
    console.log(`🔧 DYNAMIC MODE: Will adapt to any backend structure`);
    console.log(`📡 Fetching ${messageLimit} messages from state endpoint`);
    console.log(`🎯 Attempting to connect to: ${stateUri}`);
    console.log('------------------------------------');

    listenToEndpoint(stateUri, 'STATE', messageLimit, handleDisconnect, processStateMessage);
};

main();