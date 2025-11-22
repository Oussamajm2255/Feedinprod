# 🧠 Smart Farm: Sensor Separation & Manual Action System
## Deep Investigation & Enhancement Report

---

## 📊 Executive Summary

This report provides a comprehensive analysis of the Smart Farm IoT system's current sensor-reading separation logic and proposes an **enhanced, dynamic sensor-actuator mapping architecture** that maintains full compatibility with the Device Simulator MQTT protocol.

### Current System Status: ⚠️ **Functional but Limited**
- ✅ Works well for single-sensor scenarios
- ✅ MQTT protocol is well-designed
- ✅ Acknowledgment system is production-ready
- ❌ **Hardcoded sensor-to-action mappings** per sensor instance
- ❌ **No type-based action resolution**
- ❌ **Limited scalability** for multi-sensor deployments
- ❌ **No zone/location-aware logic**

---

## 🔍 Part 1: Current System Architecture Analysis

### 1.1 Current Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     MQTT Message Received                        │
│              Topic: smartfarm/sensors/{sensor_id}                │
│                  Payload: "25.5°C,60%" or "45.2"                │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SensorDataService.handleMqttMessage()               │
│  • Extracts sensor_id from topic                                │
│  • Queries DB: SELECT * FROM sensors WHERE sensor_id = ?        │
│  • Finds 1 or more sensors (composite support exists)           │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              ThresholdMonitorService.checkThresholds()           │
│  • Compares value against sensor.min_critical, max_critical     │
│  • Checks sensor.min_warning, max_warning                       │
│  • Returns violation with sensor.action_low or action_high      │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         EventEmitter: 'threshold.violation' emitted              │
│  Payload: { sensor, value, violationType, action }              │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│    ActionDispatcherService.handleThresholdViolation()           │
│  • Receives violation event with action string                  │
│  • Parses action: "mqtt:smartfarm/actuators/dht11h/fan_on"     │
│  • Calls executeAction() → processAction()                      │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│       ActionDispatcherService.publishMqttMessage()               │
│  • Generates actionId: action_1738123456789_abc123              │
│  • Publishes to: smartfarm/actuators/{device_id}/{command}      │
│  • QoS: 1-2 based on criticality                                │
│  • Logs to action_logs table with status='sent'                 │
│  • Sets up 30s timeout for acknowledgment                       │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Device Simulator (or real hardware)                 │
│  • Receives command on actuator topic                           │
│  • Executes hardware action (with delay simulation)             │
│  • Publishes ACK: smartfarm/devices/{device_id}/ack             │
│    Payload: { actionId, status: "success", ... }                │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│    DeviceAcknowledgmentService.handleDeviceAck()                │
│  • Matches actionId to action_logs entry                        │
│  • Updates status to 'ack' or 'failed'                          │
│  • Emits 'action.acknowledged' event                            │
│  • Frontend receives WebSocket notification                     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Critical Code Locations

#### **A. Sensor Entity (Current Schema)**

```typescript
// smart-farm-backend/src/entities/sensor.entity.ts
@Entity('sensors')
export class Sensor {
  @Column({ type: 'varchar', length: 36 })
  sensor_id: string;

  @Column({ type: 'varchar', length: 100 })
  farm_id: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;  // ← "temperature", "humidity", etc.

  @Column({ type: 'varchar', length: 20 })
  unit: string;  // ← "°C", "%", "lux", etc.

  @Column({ type: 'varchar', length: 100 })
  device_id: string;  // ← Device that actuators belong to

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;  // ← Zone/location (underutilized)

  // Threshold fields
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  min_critical: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  max_critical: number;

  // ⚠️ PROBLEM: Hardcoded per sensor instance
  @Column({ type: 'text', nullable: true })
  action_low: string;   // Example: "mqtt:smartfarm/actuators/dht11h/heater_on"

  @Column({ type: 'text', nullable: true })
  action_high: string;  // Example: "mqtt:smartfarm/actuators/dht11h/fan_on"
}
```

**🔴 Current Limitations:**
1. **Hardcoded per sensor**: Each sensor instance must have its own `action_low`/`action_high`
2. **No type-based logic**: Can't say "all temperature sensors → control fan"
3. **Device coupling**: Action includes full device_id path
4. **No multi-action support**: Can only trigger one action per threshold direction
5. **Manual configuration**: Must set actions for each sensor individually

#### **B. Threshold Monitor Service (Line 71-117)**

```typescript
// smart-farm-backend/src/modules/mqtt/services/threshold-monitor.service.ts
private checkLowThresholds(sensor: Sensor, value: number): ThresholdViolation | null {
  if (sensor.min_critical !== null && value <= sensor.min_critical) {
    return {
      sensor,
      value,
      violationType: 'critical_low',
      action: sensor.action_low,  // ← Directly from sensor entity
      timestamp: new Date()
    };
  }
  // ... similar for warning thresholds
}

private checkHighThresholds(sensor: Sensor, value: number): ThresholdViolation | null {
  if (sensor.max_critical !== null && value >= sensor.max_critical) {
    return {
      sensor,
      value,
      violationType: 'critical_high',
      action: sensor.action_high,  // ← Directly from sensor entity
      timestamp: new Date()
    };
  }
  // ...
}
```

**🔴 Problem:** Action resolution happens **statically** from database column, not **dynamically** from sensor type/context.

#### **C. Action Dispatcher Service (Line 608-623)**

```typescript
// smart-farm-backend/src/modules/mqtt/services/action-dispatcher.service.ts
@OnEvent('threshold.violation')
async handleThresholdViolation(violation: ThresholdViolation) {
  if (violation.action) {  // ← Action comes directly from sensor entity
    const context: ActionContext = {
      sensorId: violation.sensor.sensor_id,
      sensorType: violation.sensor.type,  // ← Type is available but not used for mapping
      deviceId: violation.sensor.device_id,
      value: violation.value,
      unit: violation.sensor.unit,
      violationType: violation.violationType,
      timestamp: violation.timestamp
    };

    await this.executeAction(violation.action, context);
  }
}
```

**🔴 Problem:** The dispatcher receives the action **pre-determined** by the sensor entity, missing opportunity for dynamic resolution.

---

## 🚨 Part 2: Current System Limitations

### 2.1 Scalability Issues

**Scenario:** Farm with 10 temperature sensors across 5 greenhouses.

**Current Approach:**
```sql
-- Must configure EACH sensor individually
INSERT INTO sensors VALUES 
  ('temp_001', 'greenhouse1', 'temperature', '°C', 'device1', 'north', 35, 40, 
   'mqtt:smartfarm/actuators/device1/fan_on',    -- action_high
   'mqtt:smartfarm/actuators/device1/heater_on'), -- action_low
  ('temp_002', 'greenhouse1', 'temperature', '°C', 'device1', 'south', 35, 40, 
   'mqtt:smartfarm/actuators/device1/fan_on',    -- DUPLICATE
   'mqtt:smartfarm/actuators/device1/heater_on'), -- DUPLICATE
  -- ... 8 more repetitive entries
```

**Problems:**
- ❌ 80% redundancy (8 sensors × 2 actions = 16 duplicate configurations)
- ❌ If you change fan logic, must update 10 database rows
- ❌ No way to say "all temp sensors in north zone → fan_01"
- ❌ Device ID is hardcoded in action string

### 2.2 Type-Based Action Resolution (Missing)

**What We WANT:**
```typescript
const sensorActionMap = {
  temperature: {
    high: 'fan_on',      // Generic action command
    low: 'heater_on'
  },
  humidity: {
    low: 'irrigation_on',
    high: 'ventilator_on'
  },
  soil_moisture: {
    low: 'irrigation_on',
    high: 'drainage_on'
  }
};
```

**What We HAVE:**
```typescript
// Each sensor stores full MQTT topic including device ID
sensor.action_high = "mqtt:smartfarm/actuators/dht11h/fan_on"
```

### 2.3 Zone/Location Awareness (Missing)

**Desired Behavior:**
- Temperature sensor in **"north_zone"** high → activate **"fan_north"**
- Temperature sensor in **"south_zone"** high → activate **"fan_south"**

**Current Behavior:**
- Must hardcode the specific fan for each sensor
- No automatic zone-based actuator selection

### 2.4 Manual vs Automatic Action Unification

**Current State:** ✅ **Already unified!**
- Manual actions from dashboard call `ActionDispatcherService.executeManual()`
- Automatic actions call `ActionDispatcherService.executeAction()`
- Both flow through `publishMqttMessage()` with same MQTT protocol
- Both generate actionId and wait for acknowledgments

**This is actually well-designed** and doesn't need changes.

---

## 🎯 Part 3: Proposed Enhancement Architecture

### 3.1 New Database Schema: Sensor-Actuator Rules

Create a new **centralized rules table** to manage sensor-to-actuator mappings:

```sql
-- New table: sensor_actuator_rules
CREATE TABLE sensor_actuator_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(100) NOT NULL,
  
  -- Matching criteria (flexible, optional fields)
  sensor_type VARCHAR(50),        -- 'temperature', 'humidity', NULL for wildcard
  sensor_location VARCHAR(100),   -- 'north_zone', 'greenhouse1', NULL for wildcard
  farm_id VARCHAR(100),           -- Specific farm or NULL for all farms
  device_id VARCHAR(100),         -- Specific device or NULL
  
  -- Threshold trigger
  violation_type VARCHAR(30) NOT NULL,  -- 'critical_high', 'warning_low', etc.
  
  -- Action to execute
  actuator_command VARCHAR(50) NOT NULL,  -- 'fan_on', 'heater_on', 'irrigation_on'
  target_device_id VARCHAR(100),          -- Which device to send command to
  
  -- Priority and metadata
  priority INT DEFAULT 0,         -- Higher priority rules override lower
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example rules
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority) 
VALUES
  ('temp_high_fan', 'temperature', 'critical_high', 'fan_on', 10),
  ('temp_low_heater', 'temperature', 'critical_low', 'heater_on', 10),
  ('humidity_low_irrigation', 'humidity', 'critical_low', 'irrigation_on', 10),
  ('humidity_high_ventilator', 'humidity', 'critical_high', 'ventilator_on', 10),
  ('soil_dry_irrigation', 'soil_moisture', 'critical_low', 'irrigation_on', 10);

-- Zone-specific rules (higher priority)
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, sensor_location, violation_type, actuator_command, target_device_id, priority) 
VALUES
  ('temp_high_north_zone', 'temperature', 'north_zone', 'critical_high', 'fan_on', 'fan_controller_north', 20),
  ('temp_high_south_zone', 'temperature', 'south_zone', 'critical_high', 'fan_on', 'fan_controller_south', 20);
```

### 3.2 New Service: Dynamic Action Resolver

```typescript
// smart-farm-backend/src/modules/mqtt/services/action-resolver.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from '../../../entities/sensor.entity';
import { SensorActuatorRule } from '../../../entities/sensor-actuator-rule.entity';

export interface ResolvedAction {
  command: string;           // 'fan_on', 'heater_on'
  targetDeviceId: string;    // Device to send command to
  topic: string;             // Full MQTT topic
  ruleName: string;          // Which rule triggered this
  priority: number;
}

@Injectable()
export class ActionResolverService {
  private readonly logger = new Logger(ActionResolverService.name);

  constructor(
    @InjectRepository(SensorActuatorRule)
    private rulesRepo: Repository<SensorActuatorRule>,
  ) {}

  /**
   * Dynamically resolve action based on sensor context and violation type
   */
  async resolveActions(
    sensor: Sensor, 
    violationType: 'critical_high' | 'warning_high' | 'critical_low' | 'warning_low'
  ): Promise<ResolvedAction[]> {
    try {
      this.logger.debug(
        `🔍 Resolving actions for sensor ${sensor.sensor_id} (${sensor.type}) in ${sensor.location || 'any location'}`
      );

      // Query rules matching this sensor context
      const matchingRules = await this.findMatchingRules(sensor, violationType);

      if (matchingRules.length === 0) {
        // Fallback to legacy sensor.action_low / action_high if no rules found
        const legacyAction = this.resolveLegacyAction(sensor, violationType);
        return legacyAction ? [legacyAction] : [];
      }

      // Sort by priority (highest first)
      matchingRules.sort((a, b) => b.priority - a.priority);

      // Convert rules to resolved actions
      const resolvedActions: ResolvedAction[] = matchingRules.map(rule => {
        const targetDevice = rule.target_device_id || sensor.device_id;
        const topic = `smartfarm/actuators/${targetDevice}/${rule.actuator_command}`;

        return {
          command: rule.actuator_command,
          targetDeviceId: targetDevice,
          topic,
          ruleName: rule.rule_name,
          priority: rule.priority
        };
      });

      this.logger.log(
        `✅ Resolved ${resolvedActions.length} action(s) for ${sensor.type} ${violationType}: ${resolvedActions.map(a => a.command).join(', ')}`
      );

      return resolvedActions;

    } catch (error) {
      this.logger.error(`❌ Error resolving actions for sensor ${sensor.sensor_id}:`, error);
      return [];
    }
  }

  /**
   * Find matching rules with flexible criteria
   */
  private async findMatchingRules(
    sensor: Sensor, 
    violationType: string
  ): Promise<SensorActuatorRule[]> {
    const queryBuilder = this.rulesRepo.createQueryBuilder('rule');

    queryBuilder
      .where('rule.enabled = :enabled', { enabled: true })
      .andWhere('rule.violation_type = :violationType', { violationType });

    // Match sensor type (exact match or wildcard)
    queryBuilder.andWhere(
      '(rule.sensor_type = :sensorType OR rule.sensor_type IS NULL)',
      { sensorType: sensor.type }
    );

    // Match location (exact match or wildcard)
    if (sensor.location) {
      queryBuilder.andWhere(
        '(rule.sensor_location = :location OR rule.sensor_location IS NULL)',
        { location: sensor.location }
      );
    } else {
      queryBuilder.andWhere('rule.sensor_location IS NULL');
    }

    // Match farm (exact match or wildcard)
    queryBuilder.andWhere(
      '(rule.farm_id = :farmId OR rule.farm_id IS NULL)',
      { farmId: sensor.farm_id }
    );

    // Match device (exact match or wildcard)
    queryBuilder.andWhere(
      '(rule.device_id = :deviceId OR rule.device_id IS NULL)',
      { deviceId: sensor.device_id }
    );

    queryBuilder.orderBy('rule.priority', 'DESC');

    const rules = await queryBuilder.getMany();

    this.logger.debug(
      `🔍 Found ${rules.length} matching rules for ${sensor.type} (${violationType})`
    );

    return rules;
  }

  /**
   * Fallback to legacy sensor.action_low / action_high for backward compatibility
   */
  private resolveLegacyAction(
    sensor: Sensor, 
    violationType: string
  ): ResolvedAction | null {
    let actionUri: string | null = null;

    if (violationType.includes('high')) {
      actionUri = sensor.action_high;
    } else if (violationType.includes('low')) {
      actionUri = sensor.action_low;
    }

    if (!actionUri) {
      return null;
    }

    // Parse legacy format: "mqtt:smartfarm/actuators/device123/fan_on"
    const match = actionUri.match(/mqtt:smartfarm\/actuators\/([^/]+)\/(.+)/);
    if (!match) {
      return null;
    }

    const [, deviceId, command] = match;

    this.logger.warn(
      `⚠️ Using legacy action mapping for ${sensor.sensor_id}: ${actionUri}`
    );

    return {
      command,
      targetDeviceId: deviceId,
      topic: `smartfarm/actuators/${deviceId}/${command}`,
      ruleName: 'legacy_action',
      priority: 0
    };
  }
}
```

### 3.3 Updated Threshold Monitor Integration

```typescript
// smart-farm-backend/src/modules/mqtt/services/threshold-monitor.service.ts
@Injectable()
export class ThresholdMonitorService {
  constructor(
    private eventEmitter: EventEmitter2,
    private actionResolver: ActionResolverService  // ← NEW: Inject resolver
  ) {}

  async checkThresholds(sensor: Sensor, value: number): Promise<ThresholdCheckResult> {
    const violations: ThresholdViolation[] = [];
    
    // Check low thresholds
    const lowViolation = await this.checkLowThresholds(sensor, value);
    if (lowViolation) {
      violations.push(lowViolation);
    }

    // Check high thresholds
    const highViolation = await this.checkHighThresholds(sensor, value);
    if (highViolation) {
      violations.push(highViolation);
    }

    // Emit events for violations
    for (const violation of violations) {
      await this.emitThresholdEvent(violation);
      this.logThresholdViolation(violation);
    }

    return {
      isWithinLimits: violations.length === 0,
      violations,
      status: this.determineOverallStatus(violations)
    };
  }

  /**
   * Updated to resolve actions dynamically
   */
  private async checkLowThresholds(sensor: Sensor, value: number): Promise<ThresholdViolation | null> {
    if (sensor.min_critical !== null && value <= sensor.min_critical) {
      // ✨ NEW: Dynamically resolve actions
      const resolvedActions = await this.actionResolver.resolveActions(
        sensor, 
        'critical_low'
      );

      return {
        sensor,
        value,
        violationType: 'critical_low',
        actions: resolvedActions,  // ← Changed from single 'action' to array 'actions'
        timestamp: new Date()
      };
    }
    // ... similar for warning thresholds
  }

  private async checkHighThresholds(sensor: Sensor, value: number): Promise<ThresholdViolation | null> {
    if (sensor.max_critical !== null && value >= sensor.max_critical) {
      const resolvedActions = await this.actionResolver.resolveActions(
        sensor, 
        'critical_high'
      );

      return {
        sensor,
        value,
        violationType: 'critical_high',
        actions: resolvedActions,  // ← Array of resolved actions
        timestamp: new Date()
      };
    }
    // ...
  }
}
```

### 3.4 Updated Action Dispatcher

```typescript
// smart-farm-backend/src/modules/mqtt/services/action-dispatcher.service.ts
@OnEvent('threshold.violation')
async handleThresholdViolation(violation: EnhancedThresholdViolation) {
  if (!violation.actions || violation.actions.length === 0) {
    this.logger.warn(
      `⚠️ No actions resolved for sensor ${violation.sensor.sensor_id} (${violation.violationType})`
    );
    return;
  }

  const context: ActionContext = {
    sensorId: violation.sensor.sensor_id,
    sensorType: violation.sensor.type,
    deviceId: violation.sensor.device_id,
    value: violation.value,
    unit: violation.sensor.unit,
    violationType: violation.violationType,
    timestamp: violation.timestamp
  };

  // Execute all resolved actions
  for (const action of violation.actions) {
    this.logger.log(
      `⚙️ Executing action: ${action.command} on device ${action.targetDeviceId} (rule: ${action.ruleName})`
    );

    // Convert resolved action to MQTT URI format for existing execute flow
    const actionUri = `mqtt:${action.topic}`;
    
    await this.executeAction(actionUri, {
      ...context,
      deviceId: action.targetDeviceId  // Use resolved target device
    });
  }
}
```

---

## 📋 Part 4: Implementation Strategy

### Phase 1: Database Migration (Non-Breaking)

```typescript
// smart-farm-backend/src/migrations/1738200000000-AddSensorActuatorRules.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddSensorActuatorRules1738200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sensor_actuator_rules',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'rule_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'sensor_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'sensor_location',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'farm_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'device_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'violation_type',
            type: 'varchar',
            length: '30',
            isNullable: false,
          },
          {
            name: 'actuator_command',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'target_device_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'priority',
            type: 'int',
            default: 0,
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        indices: [
          {
            columnNames: ['sensor_type', 'violation_type'],
          },
          {
            columnNames: ['enabled'],
          },
          {
            columnNames: ['farm_id'],
          },
        ],
      }),
      true
    );

    // Insert default rules
    await queryRunner.query(`
      INSERT INTO sensor_actuator_rules 
        (rule_name, sensor_type, violation_type, actuator_command, priority)
      VALUES
        ('default_temp_high_fan', 'temperature', 'critical_high', 'fan_on', 10),
        ('default_temp_low_heater', 'temperature', 'critical_low', 'heater_on', 10),
        ('default_humidity_low_irrigation', 'humidity', 'critical_low', 'irrigation_on', 10),
        ('default_humidity_high_ventilator', 'humidity', 'critical_high', 'fan_on', 10),
        ('default_soil_low_irrigation', 'soil_moisture', 'critical_low', 'irrigation_on', 10),
        ('default_light_low_lights', 'light_intensity', 'critical_low', 'lights_on', 10),
        ('default_light_high_lights_off', 'light_intensity', 'critical_high', 'lights_off', 10)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sensor_actuator_rules');
  }
}
```

### Phase 2: Entity Creation

```typescript
// smart-farm-backend/src/entities/sensor-actuator-rule.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('sensor_actuator_rules')
export class SensorActuatorRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  rule_name: string;

  // Matching criteria (all nullable for wildcard support)
  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  sensor_type: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sensor_location: string | null;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  farm_id: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_id: string | null;

  // Trigger condition
  @Index()
  @Column({ type: 'varchar', length: 30 })
  violation_type: 'critical_high' | 'warning_high' | 'critical_low' | 'warning_low';

  // Action specification
  @Column({ type: 'varchar', length: 50 })
  actuator_command: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  target_device_id: string | null;

  // Priority and control
  @Column({ type: 'int', default: 0 })
  priority: number;

  @Index()
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

### Phase 3: Service Integration

1. ✅ Create `ActionResolverService` (shown in Section 3.2)
2. ✅ Update `ThresholdMonitorService` (shown in Section 3.3)
3. ✅ Update `ActionDispatcherService` (shown in Section 3.4)
4. ✅ Register services in `MqttModule`

### Phase 4: Backward Compatibility

**Key principle:** System must work with or without rules configured.

```typescript
// Fallback logic in ActionResolverService
if (matchingRules.length === 0) {
  // Use legacy sensor.action_low / action_high
  const legacyAction = this.resolveLegacyAction(sensor, violationType);
  return legacyAction ? [legacyAction] : [];
}
```

**Migration path:**
1. Deploy new code (rules table exists but empty except defaults)
2. System continues using sensor.action_low/action_high
3. Gradually add rules to override specific sensors
4. Eventually remove action_low/action_high columns (optional)

---

## 🧪 Part 5: Testing with Device Simulator

### 5.1 Current MQTT Protocol (Unchanged)

**✅ The simulator protocol remains 100% compatible:**

**Incoming Commands:**
```
Topic: smartfarm/actuators/{device_id}/{command}
Payload: {
  "event": "action_triggered",
  "actionId": "action_1738123456789_abc123",
  "sensor": "temperature",
  "sensorId": "temp_001",
  "deviceId": "dht11h",
  "value": 42.5,
  "unit": "°C",
  "violationType": "critical_high",
  "timestamp": "2025-01-10T08:45:02Z",
  "action": "fan_on"
}
```

**Outgoing Acknowledgments:**
```
Topic: smartfarm/devices/{device_id}/ack
Payload: {
  "actionId": "action_1738123456789_abc123",
  "status": "success",
  "timestamp": "2025-01-10T08:45:04Z",
  "deviceId": "dht11h",
  "message": "Fan turned on successfully",
  "executionTime": 2.1,
  "action": "fan_on"
}
```

**No changes needed to:**
- Device simulator code
- MQTT topic structure
- Acknowledgment protocol
- Frontend WebSocket handling

### 5.2 Testing Scenarios

#### **Test 1: Default Type-Based Rules**

```bash
# Start simulator
python device_simulator.py --device-id dht11h

# Simulate high temperature reading
mosquitto_pub -h localhost -t smartfarm/sensors/temp_001 -m "42.5"

# Expected:
# 1. Backend resolves: temperature + critical_high → fan_on
# 2. Publishes: smartfarm/actuators/dht11h/fan_on
# 3. Simulator receives command
# 4. Simulator sends ACK
# 5. Backend updates action_logs.status = 'ack'
```

#### **Test 2: Zone-Specific Rules**

```sql
-- Add zone-specific rule
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, sensor_location, violation_type, actuator_command, target_device_id, priority)
VALUES
  ('north_zone_fan', 'temperature', 'north_zone', 'critical_high', 'fan_on', 'fan_north', 20);
```

```bash
# Temperature sensor in north_zone triggers specific fan
mosquitto_pub -h localhost -t smartfarm/sensors/temp_north_001 -m "43.0"

# Expected: Command sent to fan_north device, not default dht11h
```

#### **Test 3: Multiple Actions**

```sql
-- Add multiple actions for same trigger
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority)
VALUES
  ('temp_high_fan', 'temperature', 'critical_high', 'fan_on', 10),
  ('temp_high_alert', 'temperature', 'critical_high', 'alarm_on', 10);
```

```bash
# Expected: Both fan_on AND alarm_on commands sent
mosquitto_pub -h localhost -t smartfarm/sensors/temp_001 -m "45.0"
```

#### **Test 4: Manual Actions (Unchanged)**

```bash
# Manual action from dashboard still works identically
curl -X POST http://localhost:3000/actions/execute \
  -H "Content-Type: application/json" \
  -d '{
    "action": "mqtt:smartfarm/actuators/dht11h/fan_on",
    "deviceId": "dht11h",
    "actionType": "important"
  }'

# Expected: Same MQTT flow, same ACK handling
```

---

## 📊 Part 6: Comparison Matrix

| Feature | **Current System** | **Enhanced System** |
|---------|-------------------|-------------------|
| **Sensor-Action Mapping** | Hardcoded per sensor | Dynamic rule-based |
| **Type-Based Logic** | ❌ Not supported | ✅ Fully supported |
| **Zone-Based Actions** | ❌ Manual config per sensor | ✅ Automatic via rules |
| **Multiple Actions per Trigger** | ❌ One action per threshold | ✅ Multiple actions |
| **Centralized Configuration** | ❌ Distributed in sensors table | ✅ Centralized rules |
| **Scalability** | ⚠️ Poor (N sensors = N configs) | ✅ Excellent (1 rule = N sensors) |
| **Priority System** | ❌ No prioritization | ✅ Rule priority support |
| **Backward Compatible** | N/A | ✅ Fallback to sensor.action_* |
| **MQTT Protocol** | ✅ Well-designed | ✅ **Unchanged** |
| **Device Simulator** | ✅ Works perfectly | ✅ **No changes needed** |
| **Manual Actions** | ✅ Fully functional | ✅ **No changes needed** |
| **Acknowledgment Flow** | ✅ Production-ready | ✅ **No changes needed** |

---

## 🚀 Part 7: Implementation Roadmap

### Week 1: Foundation
- [ ] Create `sensor_actuator_rules` table migration
- [ ] Create `SensorActuatorRule` entity
- [ ] Write unit tests for rule matching logic
- [ ] Implement `ActionResolverService` with tests

### Week 2: Integration
- [ ] Update `ThresholdMonitorService` to use resolver
- [ ] Update `ActionDispatcherService` to handle multiple actions
- [ ] Add backward compatibility layer
- [ ] Integration tests with mock MQTT

### Week 3: API & Admin
- [ ] Create REST API endpoints for rule management:
  - `GET /sensor-rules` - List rules
  - `POST /sensor-rules` - Create rule
  - `PUT /sensor-rules/:id` - Update rule
  - `DELETE /sensor-rules/:id` - Delete rule
- [ ] Add validation and error handling

### Week 4: Frontend & Testing
- [ ] Frontend rule management UI (optional Phase 2)
- [ ] End-to-end testing with Device Simulator
- [ ] Load testing with multiple sensors
- [ ] Documentation updates

### Week 5: Migration & Deployment
- [ ] Create data migration scripts (sensor.action_* → rules)
- [ ] Staging environment deployment
- [ ] Production deployment with monitoring
- [ ] Performance optimization

---

## 🎓 Part 8: Advanced Features (Future)

### 8.1 Conditional Rules with Expressions

```typescript
// Future enhancement: Add conditions field to rules
@Column({ type: 'jsonb', nullable: true })
conditions: {
  time_range?: { start: string; end: string };  // "08:00-18:00"
  days_of_week?: string[];                      // ["Mon", "Wed", "Fri"]
  weather_condition?: string;                   // External API integration
  crop_stage?: string;                          // "germination", "flowering"
}
```

### 8.2 Action Chains

```typescript
// Sequential action execution with delays
@Column({ type: 'jsonb', nullable: true })
action_chain: [
  { command: 'alarm_on', delay_ms: 0 },
  { command: 'fan_on', delay_ms: 5000 },
  { command: 'irrigation_on', delay_ms: 10000 }
]
```

### 8.3 Machine Learning Integration

```typescript
// AI-suggested rules based on historical data
class MLActionSuggester {
  async suggestRules(sensor: Sensor): Promise<SensorActuatorRule[]> {
    // Analyze historical sensor readings and manual interventions
    // Suggest optimal thresholds and actions
  }
}
```

---

## 📝 Part 9: Code Examples for Common Use Cases

### Use Case 1: Add New Sensor Type (Soil pH)

**Old Way (Current):**
```sql
-- Must manually configure each sensor
INSERT INTO sensors (sensor_id, type, unit, device_id, min_critical, max_critical, action_low, action_high)
VALUES ('ph_001', 'soil_ph', 'pH', 'device1', 5.5, 7.5, 
  'mqtt:smartfarm/actuators/device1/acidifier_on',
  'mqtt:smartfarm/actuators/device1/alkalizer_on');
```

**New Way (Enhanced):**
```sql
-- One rule applies to all soil_ph sensors
INSERT INTO sensor_actuator_rules (rule_name, sensor_type, violation_type, actuator_command, priority)
VALUES 
  ('ph_low_acidifier', 'soil_ph', 'critical_low', 'acidifier_on', 10),
  ('ph_high_alkalizer', 'soil_ph', 'critical_high', 'alkalizer_on', 10);

-- Just add sensors without action configuration
INSERT INTO sensors (sensor_id, type, unit, device_id, min_critical, max_critical)
VALUES 
  ('ph_001', 'soil_ph', 'pH', 'device1', 5.5, 7.5),
  ('ph_002', 'soil_ph', 'pH', 'device2', 5.5, 7.5),
  ('ph_003', 'soil_ph', 'pH', 'device3', 5.5, 7.5);
  -- Actions automatically resolved via rules!
```

### Use Case 2: Multi-Zone Farm

```sql
-- Setup zones with priority
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, sensor_location, violation_type, actuator_command, target_device_id, priority)
VALUES
  -- Default rules (low priority)
  ('default_temp_high', 'temperature', NULL, 'critical_high', 'fan_on', NULL, 10),
  
  -- Zone-specific overrides (high priority)
  ('greenhouse_a_temp_high', 'temperature', 'greenhouse_a', 'critical_high', 'fan_on', 'fan_greenhouse_a', 20),
  ('greenhouse_b_temp_high', 'temperature', 'greenhouse_b', 'critical_high', 'fan_on', 'fan_greenhouse_b', 20),
  ('outdoor_temp_high', 'temperature', 'outdoor', 'critical_high', 'misting_on', 'misting_system', 20);

-- All temperature sensors automatically use correct actuator based on location
```

### Use Case 3: Emergency Override

```sql
-- Disable all automated irrigation during maintenance
UPDATE sensor_actuator_rules 
SET enabled = false 
WHERE actuator_command IN ('irrigation_on', 'irrigation_off');

-- Re-enable after maintenance
UPDATE sensor_actuator_rules 
SET enabled = true 
WHERE actuator_command IN ('irrigation_on', 'irrigation_off');
```

---

## ✅ Part 10: Summary & Recommendations

### ✅ What to Implement

1. **Priority 1 (Core):**
   - ✅ Create `sensor_actuator_rules` table
   - ✅ Implement `ActionResolverService`
   - ✅ Update `ThresholdMonitorService` integration
   - ✅ Add backward compatibility layer

2. **Priority 2 (Enhancement):**
   - ✅ REST API for rule management
   - ✅ Default rules for common sensor types
   - ✅ Zone-based rule examples

3. **Priority 3 (Future):**
   - ⏳ Frontend admin UI for rules
   - ⏳ Conditional rules with time/weather
   - ⏳ ML-based rule suggestions

### ✅ What NOT to Change

- ❌ **MQTT Protocol** - Perfect as-is
- ❌ **Device Simulator** - No changes needed
- ❌ **Acknowledgment System** - Production-ready
- ❌ **Manual Action API** - Works perfectly
- ❌ **Action Dispatcher Core Logic** - Well-designed

### ✅ Key Benefits

1. **Scalability:** 1 rule replaces 100 sensor configurations
2. **Flexibility:** Change behavior without touching database sensors
3. **Maintainability:** Centralized logic, easier debugging
4. **Extensibility:** Add new sensor types in seconds
5. **Backward Compatible:** Zero breaking changes
6. **Production Safe:** Gradual migration path

### ✅ Migration Strategy

```
Phase 1: Deploy new code (rules table empty) → Uses legacy sensor.action_*
    ↓
Phase 2: Add default rules → Affects only new sensors
    ↓
Phase 3: Migrate existing sensors → Gradually override with rules
    ↓
Phase 4: Deprecate sensor.action_* columns → Optional cleanup
```

---

## 📚 Part 11: Additional Resources

### Code Files to Modify

```
smart-farm-backend/
├── src/
│   ├── entities/
│   │   ├── sensor-actuator-rule.entity.ts          [NEW]
│   │   └── sensor.entity.ts                        [KEEP - backward compat]
│   ├── modules/
│   │   └── mqtt/
│   │       ├── services/
│   │       │   ├── action-resolver.service.ts       [NEW]
│   │       │   ├── threshold-monitor.service.ts     [MODIFY]
│   │       │   └── action-dispatcher.service.ts     [MODIFY]
│   │       └── mqtt.module.ts                       [MODIFY - register new service]
│   └── migrations/
│       └── 17382000000000-AddSensorActuatorRules.ts [NEW]
```

### Testing Strategy

1. **Unit Tests:** `ActionResolverService` rule matching
2. **Integration Tests:** Full flow with mock MQTT
3. **E2E Tests:** With Device Simulator
4. **Load Tests:** 100 sensors, 1000 rules

### Monitoring Metrics

```typescript
// Add to action-resolver.service.ts
metrics: {
  rulesEvaluated: number;
  legacyFallbacks: number;
  averageResolutionTime: number;
  ruleHitRate: number;
}
```

---

## 🎯 Final Recommendation

**Implement this enhancement in phases:**

1. ✅ **Phase 1 (Week 1-2):** Core infrastructure (minimal risk)
   - Database migration
   - Service creation
   - Backward compatibility

2. ✅ **Phase 2 (Week 3-4):** Testing & Validation
   - Device Simulator integration
   - Load testing
   - Documentation

3. ✅ **Phase 3 (Week 5+):** Gradual Migration
   - Deploy to production (no impact)
   - Add rules for new sensors
   - Migrate critical sensors
   - Monitor performance

**Risk Level:** 🟢 **LOW** (thanks to backward compatibility)

**ROI:** 🟢 **HIGH** (10x reduction in configuration complexity)

**Complexity:** 🟡 **MEDIUM** (2-3 weeks development)

---

## 📧 Questions & Next Steps

Ready to proceed? Next steps:

1. Review and approve architectural design
2. Prioritize features (core vs. optional)
3. Create implementation tickets
4. Set up development environment
5. Begin Phase 1 implementation

**This enhancement transforms your Smart Farm from a hardcoded system to a flexible, scalable IoT platform while maintaining 100% compatibility with existing infrastructure.**

---

**Generated:** 2025-01-12  
**Version:** 1.0  
**Status:** Ready for Implementation Review

