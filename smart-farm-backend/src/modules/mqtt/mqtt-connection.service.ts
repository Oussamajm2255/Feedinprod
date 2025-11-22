// src/modules/mqtt/mqtt-connection.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttConnectionService implements OnModuleInit {
  private readonly logger = new Logger(MqttConnectionService.name);
  private client: mqtt.MqttClient;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 5000; // 5 seconds
  private isConnected = false;
  private messageHandlers: Map<string, (topic: string, payload: Buffer) => void> = new Map();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Use WebSocket over TLS for port 8084 - FIXED URL
    const MQTT_BROKER = process.env.MQTT_BROKER || 'wss://i37c1733.ala.us-east-1.emqxsl.com:8084/mqtt';
    const MQTT_USERNAME = process.env.MQTT_USERNAME || 'oussama2255';
    const MQTT_PASSWORD = process.env.MQTT_PASSWORD || 'Oussama2255';
    
    this.logger.log(`🔄 Attempting to connect to MQTT broker: ${MQTT_BROKER}`);
    this.logger.log(`👤 Username: ${MQTT_USERNAME || 'anonymous'}`);
    this.logger.log(`📋 Connection options: keepalive=60s, reconnectPeriod=${this.reconnectInterval}ms, maxReconnectAttempts=${this.maxReconnectAttempts}`);
    
    const connectOptions: mqtt.IClientOptions = {
      clientId: `mqttjs_${Math.random().toString(16).substr(2, 8)}`,
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      keepalive: 60,
      reconnectPeriod: this.reconnectInterval,
      connectTimeout: 30000, // 30 seconds - increased timeout
      clean: true,
      rejectUnauthorized: false, // For self-signed certificates
      protocol: 'wss', // WebSocket Secure protocol
    };

    this.client = mqtt.connect(MQTT_BROKER, connectOptions);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Connection successful
    this.client.on('connect', () => {
      this.connectionAttempts = 0;
      this.isConnected = true;
      this.logger.log(`✅ Successfully connected to MQTT broker`);
      this.logger.log(`📡 Client ID: ${this.client.options.clientId || 'auto-generated'}`);
      this.logger.log(`🔗 Connection state: ${this.client.connected ? 'CONNECTED' : 'DISCONNECTED'}`);
      
      // Note: Sensor topics are subscribed to by SensorDataService
      // this.subscribe('smartfarm/sensors/#') - handled by SensorDataService

      // Subscribe to device acknowledgment topics
      this.subscribe('smartfarm/devices/+/ack').catch(err => {
        this.logger.error('❌ Failed to subscribe to device ack topics:', err);
      });

      // Subscribe to device status topics
      this.subscribe('smartfarm/devices/+/status').catch(err => {
        this.logger.error('❌ Failed to subscribe to device status topics:', err);
      });
    });

    // Connection attempt failed
    this.client.on('error', (error) => {
      this.isConnected = false;
      this.logger.error(`❌ MQTT Connection error:`, error.message);
      
      // Check if error has a code property (for network errors, etc.)
      if ('code' in error && error.code) {
        this.logger.error(`📋 Error code: ${error.code}`);
      }
      
      // Check for common MQTT error types
      if (error.message) {
        if (error.message.includes('ECONNREFUSED')) {
          this.logger.error(`🚨 Connection refused - broker may be down or unreachable`);
        } else if (error.message.includes('ENOTFOUND')) {
          this.logger.error(`🚨 Host not found - check broker URL`);
        } else if (error.message.includes('ETIMEDOUT')) {
          this.logger.error(`🚨 Connection timeout - broker not responding`);
        } else if (error.message.includes('403') || error.message.includes('unauthorized')) {
          this.logger.error(`🚨 Authentication failed - check username/password`);
        } else if (error.message.includes('WebSocket')) {
          this.logger.error(`🚨 WebSocket connection failed - check protocol and path`);
        }
      }
    });

    // Connection closed
    this.client.on('close', () => {
      this.isConnected = false;
      this.logger.warn(`🔌 MQTT connection closed. Will attempt to reconnect...`);
    });

    // Reconnection attempt
    this.client.on('reconnect', () => {
      this.connectionAttempts++;
      this.logger.log(`🔄 Reconnecting to MQTT broker (attempt ${this.connectionAttempts}/${this.maxReconnectAttempts})`);
      
      // Stop reconnecting if max attempts reached
      if (this.connectionAttempts >= this.maxReconnectAttempts) {
        this.logger.error(`🚨 Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping reconnection.`);
        this.client.end(true);
        this.suggestTroubleshooting();
      }
    });

    // Connection offline
    this.client.on('offline', () => {
      this.isConnected = false;
      this.logger.warn(`📴 MQTT client went offline`);
    });

    // Message received - delegate to registered handlers
    this.client.on('message', (topic: string, payload: Buffer) => {
      this.logger.log(`📩 Message received on ${topic}: ${payload.toString()}`);
      this.logger.debug(`🔗 Connection status during message: ${this.isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);

      // Call all registered message handlers
      this.messageHandlers.forEach((handler, handlerId) => {
        try {
          handler(topic, payload);
        } catch (error) {
          this.logger.error(`❌ Error in message handler ${handlerId}:`, error);
        }
      });
    });

    // Log connection status periodically
    this.startConnectionMonitoring();
  }

  /**
   * Register a message handler
   */
  public registerMessageHandler(handlerId: string, handler: (topic: string, payload: Buffer) => void) {
    this.messageHandlers.set(handlerId, handler);
    this.logger.log(`📝 Registered message handler: ${handlerId}`);
  }

  /**
   * Unregister a message handler
   */
  public unregisterMessageHandler(handlerId: string) {
    this.messageHandlers.delete(handlerId);
    this.logger.log(`🗑️ Unregistered message handler: ${handlerId}`);
  }

  /**
   * Subscribe to MQTT topic
   */
  public subscribe(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      this.client.subscribe(topic, (err) => {
        if (err) {
          this.logger.error(`❌ Failed to subscribe to ${topic}`, err);
          reject(err);
        } else {
          this.logger.log(`📡 Successfully subscribed to ${topic}`);
          resolve();
        }
      });
    });
  }

  /**
   * Publish message to MQTT topic with QoS and Retain options
   */
  public publish(topic: string, message: string, options?: {
    qos?: 0 | 1 | 2;
    retain?: boolean;
    timeout?: number;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      const publishOptions = {
        qos: options?.qos ?? 1, // Default to QoS 1 for reliability
        retain: options?.retain ?? false, // Default to not retain
        ...options
      };

      const timeout = options?.timeout ?? 10000; // 10 second timeout
      let timeoutId: NodeJS.Timeout;

      // Set up timeout
      timeoutId = setTimeout(() => {
        reject(new Error(`Publish timeout after ${timeout}ms`));
      }, timeout);

      this.client.publish(topic, message, publishOptions, (err) => {
        clearTimeout(timeoutId);
        
        if (err) {
          this.logger.error(`❌ Failed to publish to ${topic}`, err);
          reject(err);
        } else {
          this.logger.log(`📤 Published to ${topic} (QoS: ${publishOptions.qos}, Retain: ${publishOptions.retain}): ${message}`);
          resolve();
        }
      });
    });
  }

  /**
   * Publish action command with production-ready settings
   */
  public publishAction(topic: string, message: string, actionType: 'critical' | 'important' | 'normal' = 'normal'): Promise<void> {
    const options = this.getActionPublishOptions(actionType);
    return this.publish(topic, message, options);
  }

  /**
   * Get publish options based on action criticality
   */
  private getActionPublishOptions(actionType: 'critical' | 'important' | 'normal'): {
    qos: 0 | 1 | 2;
    retain: boolean;
    timeout: number;
  } {
    switch (actionType) {
      case 'critical':
        return {
          qos: 2, // Exactly once delivery
          retain: true, // Retain for new subscribers
          timeout: 15000 // 15 second timeout
        };
      case 'important':
        return {
          qos: 1, // At least once delivery
          retain: false, // Don't retain
          timeout: 10000 // 10 second timeout
        };
      case 'normal':
      default:
        return {
          qos: 1, // At least once delivery
          retain: false, // Don't retain
          timeout: 8000 // 8 second timeout
        };
    }
  }

  /**
   * Start periodic connection monitoring
   */
  private startConnectionMonitoring() {
    setInterval(() => {
      const status = this.getConnectionStatus();
      this.logger.debug(`🔍 Connection health check: ${JSON.stringify(status)}`);
      
      // Alert if disconnected for too long
      if (!this.isConnected) {
        this.logger.warn(`⚠️ MQTT broker disconnected. Attempts: ${this.connectionAttempts}`);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus() {
    return {
      connected: this.client?.connected || false,
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      reconnecting: this.client?.reconnecting || false,
      clientId: this.client?.options?.clientId || null,
      brokerUrl: this.configService.get('MQTT_BROKER') || this.configService.get('MQTT_URL') || 'wss://i37c1733.ala.us-east-1.emqxsl.com:8084/mqtt'
    };
  }

  /**
   * Manual connection test method with detailed diagnostics
   */
  public async testConnection(): Promise<boolean> {
    const brokerUrl = this.configService.get('MQTT_BROKER') || 'wss://i37c1733.ala.us-east-1.emqxsl.com:8084/mqtt';
    const username = this.configService.get('MQTT_USERNAME');
    
    this.logger.log(`🧪 Testing MQTT connection to: ${brokerUrl}`);
    this.logger.log(`👤 Username: ${username || 'anonymous'}`);
    
    const status = this.getConnectionStatus();
    this.logger.log(`📊 Current status:`, status);
    
    // WebSocket connection test info
    this.logger.log(`🔍 Testing WebSocket connection over TLS`);
    this.logger.log(`💡 Protocol: WSS (WebSocket Secure)`);
    this.logger.log(`💡 Port: 8084 (WebSocket over TLS/SSL)`);
    
    if (this.client?.connected) {
      this.logger.log(`✅ Connection test PASSED - broker is reachable`);
      return true;
    } else {
      this.logger.error(`❌ Connection test FAILED - broker unreachable`);
      this.suggestTroubleshooting();
      return false;
    }
  }

  /**
   * Provide troubleshooting suggestions
   */
  private suggestTroubleshooting() {
    const brokerUrl = this.configService.get('MQTT_BROKER') || 'wss://i37c1733.ala.us-east-1.emqxsl.com:8084/mqtt';
    const username = this.configService.get('MQTT_USERNAME');
    
    this.logger.error(`\n🔧 TROUBLESHOOTING MQTT CONNECTION:`);
    this.logger.error(`📍 Broker URL: ${brokerUrl}`);
    this.logger.error(`👤 Username: ${username || 'anonymous'}`);
    this.logger.error(`🔌 Protocol: WebSocket over TLS (WSS)`);
    this.logger.error(`\n🔍 Check these items:`);
    this.logger.error(`   1. ✅ URL format: wss://hostname:8084/mqtt (FIXED)`);
    this.logger.error(`   2. 🔑 Are your EMQX Cloud credentials correct?`);
    this.logger.error(`   3. 🌐 Is your EMQX Cloud instance running?`);
    this.logger.error(`   4. 🔒 Check EMQX Cloud Authentication & ACL settings`);
    this.logger.error(`   5. 🚧 Check firewall/network connectivity`);
    this.logger.error(`   6. 📱 Try connecting with MQTT Explorer using WebSocket`);
    this.logger.error(`\n🧪 Test with MQTT Explorer:`);
    this.logger.error(`   - Protocol: ws://wss://`);
    this.logger.error(`   - Host: i37c1733.ala.us-east-1.emqxsl.com`);
    this.logger.error(`   - Port: 8084`);
    this.logger.error(`   - Path: /mqtt`);
    
    if (username) {
      this.logger.error(`   - Username: ${username}`);
      this.logger.error(`   - Password: [your_password]`);
    }
    
    this.logger.error(`\n💡 You can test connection manually by calling mqttConnectionService.testConnection()`);
  }

  onModuleDestroy() {
    this.logger.log(`🔌 Disconnecting from MQTT broker...`);
    if (this.client) {
      this.client.end(true);
      this.logger.log(`✅ MQTT client disconnected`);
    }
  }
}