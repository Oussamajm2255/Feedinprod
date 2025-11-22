// src/modules/mqtt/sensor-data.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from '../../entities/sensor.entity';
import { SensorReading } from '../../entities/sensor-reading.entity';
import { MqttConnectionService } from './mqtt-connection.service';
import { ThresholdMonitorService } from './services/threshold-monitor.service';
import { Farm } from '../farms/farm.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SensorDataService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SensorDataService.name);

  constructor(
    @InjectRepository(Sensor)
    private sensorRepository: Repository<Sensor>,
    @InjectRepository(Farm)
    private farmRepository: Repository<Farm>,
    @InjectRepository(SensorReading)
    private sensorReadingRepository: Repository<SensorReading>,
    private mqttConnectionService: MqttConnectionService,
    private thresholdMonitor: ThresholdMonitorService,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    // Register this service to handle MQTT messages
    this.mqttConnectionService.registerMessageHandler(
      'sensor-data-handler',
      this.handleMqttMessage.bind(this)
    );

    // Wait for MQTT connection and then subscribe
    this.subscribeWhenConnected();
  }

  /**
   * Subscribe to topics when MQTT connection is established
   */
  private async subscribeWhenConnected() {
    try {
      // Wait for MQTT connection with timeout
      await this.waitForMqttConnection(30000); // 30 second timeout
      
      // Subscribe to all sensor topics: smartfarm/sensors/{sensorId}
      await this.mqttConnectionService.subscribe('smartfarm/sensors/+');
      this.logger.log('📡 Successfully subscribed to sensor topics (smartfarm/sensors/{sensorId})');
      
    } catch (error) {
      this.logger.error('❌ Failed to subscribe to sensor topics:', error);
      
      // Retry subscription after a delay
      setTimeout(() => {
        this.logger.log('🔄 Retrying subscription to sensor topics...');
        this.subscribeWhenConnected();
      }, 10000); // Retry after 10 seconds
    }
  }

  /**
   * Wait for MQTT connection to be established
   */
  private async waitForMqttConnection(timeoutMs: number = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for MQTT connection'));
      }, timeoutMs);

      const checkConnection = () => {
        const status = this.mqttConnectionService.getConnectionStatus();
        
        if (status.connected) {
          clearTimeout(timeout);
          this.logger.log('✅ MQTT connection established, proceeding with subscription');
          resolve();
        } else {
          this.logger.debug(`🔍 Waiting for MQTT connection... Current status:`, status);
          setTimeout(checkConnection, 1000);
        }
      };

      checkConnection();
    });
  }

  /**
   * Main MQTT message handler - updated to support composite sensors
   */
  private async handleMqttMessage(topic: string, payload: Buffer) {
    try {
      // Only process sensor data topics, ignore device acknowledgments and other topics
      if (!topic.startsWith('smartfarm/sensors/')) {
        this.logger.debug(`🔍 [SENSOR-DATA] Ignoring non-sensor topic: ${topic}`);
        return;
      }

      const message = payload.toString();
      this.logger.log(`📊 Processing sensor data from ${topic}: ${message}`);

      // Step 1: Extract sensor ID from topic
      const sensorId = this.extractSensorId(topic);
      
      if (!sensorId) {
        this.logger.warn(`⚠️ Invalid topic format: ${topic}. Expected: smartfarm/sensors/{sensorId}`);
        return;
      }

      // Step 2: Find all sensors with this sensor_id (could be multiple for composite sensors)
      const sensors = await this.findAllSensorsByIds(sensorId);
      
      if (sensors.length === 0) {
        this.logger.warn(`⚠️ No sensors found with sensor_id: ${sensorId}`);
        return;
      }

      if (sensors.length === 1) {
        // Single sensor - use original logic
        this.logger.debug(`🔍 Single sensor found: ${sensors[0].sensor_id} (${sensors[0].type}, ${sensors[0].unit})`);
        
        const value = this.parseMessageValue(message);
        if (value === null) {
          this.logger.warn(`⚠️ Invalid message format: ${message}. Expected numeric value.`);
          return;
        }

        await this.processSensorReading(sensors[0], value);
      } else {
        // Multiple sensors - handle composite message
        this.logger.log(`🔄 Composite sensor detected: ${sensors.length} sensors found for ID '${sensorId}'`);
        await this.handleCompositeSensorMessage(sensors, message);
      }

    } catch (error) {
      this.logger.error('❌ Error processing sensor data:', error);
    }
  }

  /**
   * Find all sensors by sensor_id (supports multiple sensors with same ID)
   */
  private async findAllSensorsByIds(sensorId: string): Promise<Sensor[]> {
    try {
      const sensors = await this.sensorRepository.find({
        where: { sensor_id: sensorId }
      });
      
      if (sensors.length > 0) {
        this.logger.debug(`🔍 Found ${sensors.length} sensor(s) with ID '${sensorId}': ${sensors.map(s => `${s.type}(${s.unit})`).join(', ')}`);
      }
      
      return sensors;
    } catch (error) {
      this.logger.error(`❌ Error finding sensors with ID ${sensorId}:`, error);
      return [];
    }
  }

  /**
   * Handle composite sensor message with dynamic separator detection
   * Supports various formats: "25.5°C,60%", "26.0°C;48.0%", "25.5°C|60%", "25.5°C 60%", etc.
   */
  private async handleCompositeSensorMessage(sensors: Sensor[], message: string): Promise<void> {
    try {
      // Parse composite message into individual values
      const parsedValues = this.parseCompositeMessage(message);
      
      if (parsedValues.length === 0) {
        this.logger.warn(`⚠️ Could not parse any values from composite message: ${message}`);
        return;
      }

      this.logger.log(`📊 Parsed ${parsedValues.length} values from composite message: ${parsedValues.map(v => v.originalText).join(', ')}`);

      // Derive composite values by unit (temperature -> value1, humidity -> value2)
      let temperatureValue: number | null = null;
      let humidityValue: number | null = null;

      for (const pv of parsedValues) {
        const unit = (pv.extractedUnit || '').toLowerCase();
        if (temperatureValue === null && (unit.includes('°') || unit.includes('c'))) {
          temperatureValue = pv.value;
        } else if (humidityValue === null && unit.includes('%')) {
          humidityValue = pv.value;
        }
      }

      // Save a single combined reading row for this sensor_id to avoid ambiguity in the frontend
      const compositeSensorId = sensors[0]?.sensor_id;
      if (compositeSensorId) {
        await this.saveCompositeSensorReading(compositeSensorId, temperatureValue, humidityValue);
      }

      // Still run threshold checks and actions individually per sensor (without double-saving)
      for (const sensor of sensors) {
        const matched = this.findMatchingValueForSensor(sensor, parsedValues);
        if (matched !== null) {
          const thresholdResult = this.thresholdMonitor.checkThresholds(sensor, matched);
          if (thresholdResult.violations.length > 0) {
            this.logger.warn(`⚠️ Threshold violations detected for sensor ${sensor.sensor_id} (${sensor.type}): ${thresholdResult.violations.length} violations`);
            try {
              const level = thresholdResult.violations.some(v => (v.violationType || '').includes('critical')) ? 'critical' : 'warning';
              let userId: string | undefined;
              const farm = await this.farmRepository.findOne({ where: { farm_id: sensor.farm_id } });
              userId = (farm as any)?.owner_id;
              await this.notificationsService.create({
                user_id: userId || sensor.farm_id,
                level: level as any,
                source: 'sensor' as any,
                title: `Threshold ${level}`,
                message: `${sensor.sensor_id} (${sensor.type}) = ${matched}${sensor.unit || ''}`,
                context: { sensor_id: sensor.sensor_id, type: sensor.type, value: matched, unit: sensor.unit },
              });
            } catch {}
          } else {
            this.logger.debug(`✅ Sensor ${sensor.sensor_id} within normal limits: ${matched}${sensor.unit || ''}`);
          }
        }
      }

    } catch (error) {
      this.logger.error(`❌ Error handling composite sensor message:`, error);
    }
  }

  /**
   * Save a combined composite reading (value1 for temperature, value2 for humidity)
   */
  private async saveCompositeSensorReading(sensorId: string, temperature: number | null, humidity: number | null): Promise<SensorReading> {
    try {
      const reading = this.sensorReadingRepository.create({
        sensor_id: sensorId,
        value1: typeof temperature === 'number' ? temperature : null,
        value2: typeof humidity === 'number' ? humidity : null,
      });

      const saved = await this.sensorReadingRepository.save(reading);
      const parts: string[] = [];
      if (typeof temperature === 'number') parts.push(`${temperature}°C`);
      if (typeof humidity === 'number') parts.push(`${humidity}%`);
      this.logger.log(`💾 Saved composite reading: ${sensorId} = ${parts.join(', ')}`);
      return saved;

    } catch (error) {
      this.logger.error(`❌ Failed to save composite reading for sensor ${sensorId}:`, error);
      throw error;
    }
  }

  /**
   * Parse composite message into individual values with their original text
   * Dynamically handles various separators: comma, semicolon, pipe, space, etc.
   */
  private parseCompositeMessage(message: string): Array<{value: number, originalText: string, extractedUnit?: string}> {
    const values: Array<{value: number, originalText: string, extractedUnit?: string}> = [];
    
    try {
      // Dynamic separator detection - try multiple common separators
      const separators = [',', ';', '|', ' ', '\t', ':', '&'];
      let parts: string[] = [];
      let usedSeparator = '';
      
      // Try each separator and use the one that produces the most valid parts
      for (const sep of separators) {
        const testParts = message.split(sep).map(p => p.trim()).filter(p => p.length > 0);
        
        // Check if this separator produces valid sensor readings
        const validParts = testParts.filter(part => {
          const match = part.match(/(-?\d+\.?\d*)([°%A-Za-z]*)/);
          return match && !isNaN(parseFloat(match[1]));
        });
        
        // Use this separator if it produces more valid parts than previous attempts
        if (validParts.length > parts.length) {
          parts = testParts;
          usedSeparator = sep;
        }
      }
      
      // If no separator worked well, try splitting by common patterns
      if (parts.length <= 1) {
        // Try splitting by common sensor value patterns
        const patternMatch = message.match(/(-?\d+\.?\d*[°%A-Za-z]*)/g);
        if (patternMatch) {
          parts = patternMatch.map(p => p.trim());
          usedSeparator = 'pattern';
        }
      }
      
      this.logger.debug(`🔍 Parsing message "${message}" using separator "${usedSeparator}" → ${parts.length} parts: [${parts.join(', ')}]`);
      
      for (const part of parts) {
        // Extract numeric value and potential unit
        const match = part.match(/(-?\d+\.?\d*)([°%A-Za-z]*)/);
        
        if (match) {
          const numericValue = parseFloat(match[1]);
          const unitPart = match[2] || '';
          
          if (!isNaN(numericValue)) {
            values.push({
              value: numericValue,
              originalText: part,
              extractedUnit: unitPart.toLowerCase()
            });
          }
        }
      }

      return values;

    } catch (error) {
      this.logger.error(`❌ Error parsing composite message: ${message}`, error);
      return [];
    }
  }

  /**
   * Find the matching value for a specific sensor based on unit matching
   */
  private findMatchingValueForSensor(
    sensor: Sensor, 
    parsedValues: Array<{value: number, originalText: string, extractedUnit?: string}>
  ): number | null {
    
    const sensorUnit = sensor.unit.toLowerCase();
    const sensorType = sensor.type.toLowerCase();
    
    this.logger.debug(`🔍 Looking for match: sensor(${sensor.type}/${sensor.unit}) in values: ${parsedValues.map(v => v.originalText).join(', ')}`);
    
    // Strategy 1: Direct unit matching in extracted unit
    for (const parsedValue of parsedValues) {
      const extractedUnit = parsedValue.extractedUnit || '';
      
      // Temperature matching - handle character encoding issues
      const isTemperatureSensor = sensorUnit.includes('°') || sensorUnit.toLowerCase().includes('celsius') || sensorType.includes('temp');
      const hasTemperatureUnit = extractedUnit.includes('°') || extractedUnit.includes('c') || extractedUnit.includes('�'); // Handle corrupted degree symbol
      
      if (isTemperatureSensor && hasTemperatureUnit) {
        this.logger.debug(`🌡️ Direct unit match: Temperature sensor matched with ${parsedValue.originalText}`);
        return parsedValue.value;
      }
      
      // Humidity matching
      if ((sensorUnit.includes('%') || sensorType.includes('hum')) &&
          extractedUnit.includes('%')) {
        this.logger.debug(`💧 Direct unit match: Humidity sensor matched with ${parsedValue.originalText}`);
        return parsedValue.value;
      }
      
      // Pressure matching
      if ((sensorUnit.includes('pa') || sensorUnit.includes('bar') || sensorType.includes('press')) &&
          (extractedUnit.includes('pa') || extractedUnit.includes('bar'))) {
        this.logger.debug(`🔘 Direct unit match: Pressure sensor matched with ${parsedValue.originalText}`);
        return parsedValue.value;
      }
    }

    // Strategy 2: Position-based matching for known patterns (DHT11: temp first, humidity second)
    if (parsedValues.length === 2) {
      const firstValue = parsedValues[0];
      const secondValue = parsedValues[1];
      
      // Check if first value looks like temperature (has °C or corrupted symbol)
      const firstIsTemp = firstValue.extractedUnit?.includes('°') || firstValue.extractedUnit?.includes('c') || firstValue.extractedUnit?.includes('�');
      // Check if second value looks like humidity (has %)
      const secondIsHum = secondValue.extractedUnit?.includes('%');
      
      if (firstIsTemp && secondIsHum) {
        // Classic DHT11 pattern: "25.5°C,60%"
        if (sensorType.includes('temp') || sensorUnit.includes('°') || sensorUnit.includes('c')) {
          this.logger.debug(`🌡️ Position-based: Using first value (${firstValue.originalText}) for temperature sensor`);
          return firstValue.value;
        }
        if (sensorType.includes('hum') || sensorUnit.includes('%')) {
          this.logger.debug(`💧 Position-based: Using second value (${secondValue.originalText}) for humidity sensor`);
          return secondValue.value;
        }
      }
    }

    // Strategy 3: Fallback - match by sensor characteristics
    if (sensorUnit.includes('°') || sensorUnit.includes('c') || sensorType.includes('temp')) {
      // Temperature sensor - look for value with temperature unit (including corrupted symbols)
      const tempValue = parsedValues.find(v => 
        v.extractedUnit?.includes('°') || 
        v.extractedUnit?.includes('c') ||
        v.extractedUnit?.includes('�') || // Handle corrupted degree symbol
        v.originalText.toLowerCase().includes('temp')
      );
      if (tempValue) {
        this.logger.debug(`🌡️ Fallback: Matched temperature sensor with ${tempValue.originalText}`);
        return tempValue.value;
      }
    }
    
    if (sensorUnit.includes('%') || sensorType.includes('hum')) {
      // Humidity sensor - look for value with % unit
      const humValue = parsedValues.find(v => 
        v.extractedUnit?.includes('%') ||
        v.originalText.toLowerCase().includes('hum')
      );
      if (humValue) {
        this.logger.debug(`💧 Fallback: Matched humidity sensor with ${humValue.originalText}`);
        return humValue.value;
      }
    }

    this.logger.warn(`⚠️ No matching value found for sensor ${sensor.sensor_id} (${sensor.type}/${sensor.unit})`);
    return null;
  }

  /**
   * Extract sensor ID from topic: smartfarm/sensors/{sensorId}
   */
  private extractSensorId(topic: string): string | null {
    try {
      // Expected format: smartfarm/sensors/{sensorId}
      const parts = topic.split('/');
      
      if (parts.length !== 3 || parts[0] !== 'smartfarm' || parts[1] !== 'sensors') {
        return null;
      }

      return parts[2];
    } catch (error) {
      this.logger.error(`❌ Error extracting sensor ID from topic ${topic}:`, error);
      return null;
    }
  }

  /**
   * Updated parseMessageValue method to handle both simple and composite messages
   */
  private parseMessageValue(message: string): number | null {
    try {
      const trimmed = message.trim();
      
      // Check if this looks like a composite message (contains comma)
      if (trimmed.includes(',')) {
        this.logger.debug(`🔍 Detected composite message format: ${trimmed}`);
        // For composite messages in single sensor context, try to extract first numeric value
        const firstPart = trimmed.split(',')[0].trim();
        const match = firstPart.match(/(-?\d+\.?\d*)/);
        if (match) {
          return parseFloat(match[1]);
        }
      }
      
      // Try to parse as simple number first
      const numValue = parseFloat(trimmed);
      if (!isNaN(numValue)) {
        return numValue;
      }

      // Handle JSON format: {"value": 23.5} or {"reading": 23.5}
      if (trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed.value === 'number') return parsed.value;
        if (typeof parsed.reading === 'number') return parsed.reading;
        if (typeof parsed.data === 'number') return parsed.data;
      }

      // Handle key:value format: "temperature:23.5"
      const keyValueMatch = trimmed.match(/^[^:]+:(-?\d+\.?\d*)$/);
      if (keyValueMatch) {
        return parseFloat(keyValueMatch[1]);
      }

      // Handle value with unit: "23.5°C" or "65.2%"
      const valueUnitMatch = trimmed.match(/^(-?\d+\.?\d*)/);
      if (valueUnitMatch) {
        return parseFloat(valueUnitMatch[1]);
      }

      return null;
    } catch (error) {
      this.logger.error(`❌ Error parsing message: ${message}`, error);
      return null;
    }
  }

  /**
   * Find sensor by sensor ID (returns first match - used for single sensors)
   */
  private async findSensorById(sensorId: string): Promise<Sensor | null> {
    try {
      const sensor = await this.sensorRepository.findOne({
        where: { sensor_id: sensorId }
      });
      
      if (sensor) {
        this.logger.debug(`🔍 Found sensor: ${sensor.sensor_id} (${sensor.type})`);
      }
      
      return sensor;
    } catch (error) {
      this.logger.error(`❌ Error finding sensor ${sensorId}:`, error);
      return null;
    }
  }

  /**
   * Process a single sensor reading
   */
  private async processSensorReading(sensor: Sensor, value: number) {
    try {
      // Step 1: Save the reading to database
      await this.saveSensorReading(sensor, value);

      // Step 2: Check thresholds and trigger actions if needed
      const thresholdResult = this.thresholdMonitor.checkThresholds(sensor, value);
      
      // Log threshold status
      if (thresholdResult.violations.length > 0) {
        this.logger.warn(`⚠️ Threshold violations detected for sensor ${sensor.sensor_id} (${sensor.type}): ${thresholdResult.violations.length} violations`);
      } else {
        this.logger.debug(`✅ Sensor ${sensor.sensor_id} within normal limits: ${value}${sensor.unit || ''}`);
      }

    } catch (error) {
      this.logger.error(`❌ Error processing reading for sensor ${sensor.sensor_id}:`, error);
    }
  }

  /**
   * Save sensor reading to database
   */
  private async saveSensorReading(sensor: Sensor, value: number): Promise<SensorReading> {
    try {
      const reading = this.sensorReadingRepository.create({
        sensor_id: sensor.sensor_id,
        value1: value,
        value2: null, // Reserved for future use
      });

      const savedReading = await this.sensorReadingRepository.save(reading);
      
      this.logger.log(`💾 Saved reading: ${sensor.sensor_id} (${sensor.type}) = ${value}${sensor.unit || ''}`);
      return savedReading;
      
    } catch (error) {
      this.logger.error(`❌ Failed to save reading for sensor ${sensor.sensor_id}:`, error);
      throw error;
    }
  }

  /**
   * Get all sensors for a specific device
   */
  private async getSensorsForDevice(deviceId: string): Promise<Sensor[]> {
    try {
      const sensors = await this.sensorRepository.find({
        where: { device_id: deviceId },
      });
      
      this.logger.debug(`🔍 Found ${sensors.length} sensors for device ${deviceId}`);
      return sensors;
    } catch (error) {
      this.logger.error(`❌ Error fetching sensors for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Get recent sensor readings for a device
   */
  async getRecentReadings(deviceId: string, limit: number = 10): Promise<any[]> {
    try {
      const sensors = await this.getSensorsForDevice(deviceId);
      const sensorIds = sensors.map(s => s.sensor_id);

      if (sensorIds.length === 0) {
        return [];
      }

      const readings = await this.sensorReadingRepository
        .createQueryBuilder('reading')
        .innerJoinAndSelect('reading.sensor', 'sensor')
        .where('reading.sensor_id IN (:...sensorIds)', { sensorIds })
        .orderBy('reading.created_at', 'DESC')
        .limit(limit)
        .getMany();

      return readings.map(reading => ({
        sensorId: reading.sensor_id,
        sensorType: reading.sensor?.type,
        unit: reading.sensor?.unit,
        value: reading.value1,
        timestamp: reading.created_at,
        topic: `smartfarm/sensors/${reading.sensor_id}` // New topic format
      }));

    } catch (error) {
      this.logger.error(`❌ Error fetching recent readings for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Get recent readings for a specific sensor
   */
  async getRecentReadingsForSensor(sensorId: string, limit: number = 10): Promise<any[]> {
    try {
      const readings = await this.sensorReadingRepository
        .createQueryBuilder('reading')
        .innerJoinAndSelect('reading.sensor', 'sensor')
        .where('reading.sensor_id = :sensorId', { sensorId })
        .orderBy('reading.created_at', 'DESC')
        .limit(limit)
        .getMany();

      return readings.map(reading => ({
        sensorId: reading.sensor_id,
        sensorType: reading.sensor?.type,
        unit: reading.sensor?.unit,
        value: reading.value1,
        timestamp: reading.created_at,
        topic: `smartfarm/sensors/${reading.sensor_id}`
      }));

    } catch (error) {
      this.logger.error(`❌ Error fetching readings for sensor ${sensorId}:`, error);
      return [];
    }
  }

  /**
   * Get sensor statistics for a device
   */
  async getDeviceStats(deviceId: string): Promise<any> {
    try {
      const sensors = await this.getSensorsForDevice(deviceId);
      
      const stats = await Promise.all(
        sensors.map(async (sensor) => {
          const lastReading = await this.sensorReadingRepository
            .findOne({
              where: { sensor_id: sensor.sensor_id },
              order: { created_at: 'DESC' }
            });

          const readingCount = await this.sensorReadingRepository
            .count({ where: { sensor_id: sensor.sensor_id } });

          return {
            sensor: {
              id: sensor.sensor_id,
              type: sensor.type,
              unit: sensor.unit,
              deviceId: sensor.device_id,
              topic: `smartfarm/sensors/${sensor.sensor_id}` // New topic format
            },
            lastReading: lastReading ? {
              value: lastReading.value1,
              timestamp: lastReading.created_at
            } : null,
            totalReadings: readingCount,
            thresholds: this.thresholdMonitor.getThresholdSummary(sensor)
          };
        })
      );

      return {
        deviceId,
        sensorCount: sensors.length,
        sensors: stats,
        lastUpdate: stats.reduce((latest: Date | null, stat) => {
          if (!stat.lastReading) return latest;
          if (!latest) return stat.lastReading.timestamp;
          return stat.lastReading.timestamp > latest ? stat.lastReading.timestamp : latest;
        }, null as Date | null)
      };

    } catch (error) {
      this.logger.error(`❌ Error getting device stats for ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * Subscribe to specific sensor by ID
   */
  async subscribeToSensor(sensorId: string): Promise<void> {
    try {
      const topic = `smartfarm/sensors/${sensorId}`;
      await this.mqttConnectionService.subscribe(topic);
      this.logger.log(`📡 Subscribed to sensor: ${topic}`);
    } catch (error) {
      this.logger.error(`❌ Failed to subscribe to sensor ${sensorId}:`, error);
    }
  }

  /**
   * Subscribe to multiple sensors by IDs
   */
  async subscribeToSensors(sensorIds: string[]): Promise<void> {
    try {
      const subscriptionPromises = sensorIds.map(sensorId => 
        this.subscribeToSensor(sensorId)
      );
      
      await Promise.all(subscriptionPromises);
      this.logger.log(`📡 Subscribed to ${sensorIds.length} individual sensors`);
    } catch (error) {
      this.logger.error(`❌ Failed to subscribe to multiple sensors:`, error);
    }
  }

  /**
   * Subscribe to all sensors for a specific device
   */
  async subscribeToDeviceSensors(deviceId: string): Promise<void> {
    try {
      const sensors = await this.getSensorsForDevice(deviceId);
      const sensorIds = sensors.map(s => s.sensor_id);
      
      if (sensorIds.length > 0) {
        await this.subscribeToSensors(sensorIds);
        this.logger.log(`📡 Subscribed to all sensors for device ${deviceId}: ${sensorIds.join(', ')}`);
      } else {
        this.logger.warn(`⚠️ No sensors found for device ${deviceId}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to subscribe to device ${deviceId} sensors:`, error);
    }
  }

  /**
   * Manually process a sensor message (for testing)
   */
  async processTestMessage(sensorId: string, message: string): Promise<any> {
    try {
      this.logger.log(`🧪 Processing test message for sensor ${sensorId}: ${message}`);
      
      // Simulate MQTT message processing with sensor ID topic
      const topic = `smartfarm/sensors/${sensorId}`;
      await this.handleMqttMessage(topic, Buffer.from(message));
      
      // Return recent readings for this sensor
      return await this.getRecentReadingsForSensor(sensorId, 5);
      
    } catch (error) {
      this.logger.error(`❌ Error processing test message:`, error);
      throw error;
    }
  }

  /**
   * Updated health check to show composite sensor support
   */
  async healthCheck(): Promise<any> {
    try {
      const sensorCount = await this.sensorRepository.count();
      const readingCount = await this.sensorReadingRepository.count();
      
      // Get sensor ID statistics
      const sensorIdStats = await this.sensorRepository
        .createQueryBuilder('sensor')
        .select('sensor.sensor_id', 'sensorId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('sensor.sensor_id')
        .getRawMany();
      
      const compositeSensors = sensorIdStats.filter(stat => parseInt(stat.count) > 1);
      
      // Get reading count from last 24 hours
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      
      const recentReadingCount = await this.sensorReadingRepository
        .createQueryBuilder('reading')
        .where('reading.created_at >= :yesterday', { yesterday })
        .getCount();

      const mqttStatus = this.mqttConnectionService.getConnectionStatus();

      return {
        status: 'healthy',
        timestamp: new Date(),
        topicStructure: 'smartfarm/sensors/{sensorId}',
        messageFormat: 'Supports both simple values and composite messages (e.g., "25.5°C,60%")',
        metrics: {
          totalSensors: sensorCount,
          uniqueSensorIds: sensorIdStats.length,
          compositeSensorIds: compositeSensors.length,
          totalReadings: readingCount,
          readingsLast24h: recentReadingCount,
          avgReadingsPerHour: Math.round(recentReadingCount / 24)
        },
        compositeSensors: compositeSensors.map(cs => ({
          sensorId: cs.sensorId,
          sensorCount: parseInt(cs.count)
        })),
        services: {
          thresholdMonitor: 'active',
          mqttConnection: mqttStatus.connected ? 'connected' : 'disconnected'
        },
        subscriptionPattern: 'smartfarm/sensors/+'
      };

    } catch (error) {
      this.logger.error('❌ Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  onModuleDestroy() {
    try {
      // Unregister the message handler
      this.mqttConnectionService.unregisterMessageHandler('sensor-data-handler');
      this.logger.log('🔌 Sensor data service disconnected successfully');
    } catch (error) {
      this.logger.error('❌ Error during service shutdown:', error);
    }
  }
}