#!/usr/bin/env node
/**
 * Quick MQTT Connection Test
 * Tests if the backend can connect to the same MQTT broker as the device simulator
 */

const mqtt = require('mqtt');

const MQTT_BROKER = 'wss://i37c1733.ala.us-east-1.emqxsl.com:8084/mqtt';
const MQTT_USERNAME = 'oussama2255';
const MQTT_PASSWORD = 'Oussama2255';

console.log('🧪 Testing MQTT Connection...');
console.log(`📡 Broker: ${MQTT_BROKER}`);
console.log(`👤 Username: ${MQTT_USERNAME}`);

const client = mqtt.connect(MQTT_BROKER, {
  clientId: `test_client_${Math.random().toString(16).substr(2, 8)}`,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  keepalive: 60,
  reconnectPeriod: 5000,
  connectTimeout: 30000,
  clean: true,
  rejectUnauthorized: false,
  protocol: 'wss',
});

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker successfully!');
  
  // Subscribe to acknowledgment topics
  client.subscribe('smartfarm/devices/+/ack', (err) => {
    if (err) {
      console.error('❌ Failed to subscribe to ack topics:', err);
    } else {
      console.log('📡 Successfully subscribed to smartfarm/devices/+/ack');
    }
  });
  
  // Subscribe to status topics
  client.subscribe('smartfarm/devices/+/status', (err) => {
    if (err) {
      console.error('❌ Failed to subscribe to status topics:', err);
    } else {
      console.log('📡 Successfully subscribed to smartfarm/devices/+/status');
    }
  });
  
  console.log('🎯 Listening for device messages...');
  console.log('💡 Execute an action from the dashboard to test!');
});

client.on('message', (topic, payload) => {
  console.log(`📨 Message received on ${topic}:`);
  console.log(`📦 Payload: ${payload.toString()}`);
  
  try {
    const parsed = JSON.parse(payload.toString());
    console.log(`🔍 Parsed JSON:`, parsed);
    
    if (topic.includes('/ack')) {
      console.log(`🎯 This is an acknowledgment message!`);
      console.log(`   Action ID: ${parsed.actionId}`);
      console.log(`   Status: ${parsed.status}`);
      console.log(`   Device ID: ${parsed.deviceId}`);
    }
  } catch (e) {
    console.log(`⚠️ Could not parse as JSON`);
  }
  
  console.log('---');
});

client.on('error', (error) => {
  console.error('❌ MQTT Error:', error.message);
});

client.on('close', () => {
  console.log('🔌 MQTT connection closed');
});

client.on('offline', () => {
  console.log('📴 MQTT client went offline');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  client.end();
  process.exit(0);
});

// Keep the script running
console.log('🔄 Press Ctrl+C to stop');
