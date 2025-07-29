/**
 * Test script for AuroraAgent WebSocket data
 * Connects to the state WebSocket endpoint and specifically tests AuroraAgent data
 * including support and resistance levels
 */
import WebSocket from 'ws';

const ws = new WebSocket('ws://127.0.0.1:8000/ws/state');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('Received message type:', message.type);
    
    if (message.type === 'state_update' && message.data && message.data.BTC) {
      const btcData = message.data.BTC;
      console.log('BTC data keys:', Object.keys(btcData));
      
      if (btcData.agents && btcData.agents.AuroraAgent) {
        const auroraData = btcData.agents.AuroraAgent.data;
        console.log('AuroraAgent data keys:', Object.keys(auroraData));
        console.log('Support levels:', auroraData.support_levels);
        console.log('Resistance levels:', auroraData.resistance_levels);
        
        if (auroraData.support_levels) {
          console.log('Significant support:', auroraData.support_levels.significant_support);
        }
        if (auroraData.resistance_levels) {
          console.log('Significant resistance:', auroraData.resistance_levels.significant_resistance);
        }
      } else {
        console.log('No AuroraAgent data found');
      }
    }
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});

// Close after 10 seconds
setTimeout(() => {
  console.log('Closing connection...');
  ws.close();
  process.exit(0);
}, 10000); 