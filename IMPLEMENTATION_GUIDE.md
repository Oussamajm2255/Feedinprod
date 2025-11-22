# 🚀 Smart Farm Enhancement: Implementation Guide

## Quick Start

This guide provides step-by-step instructions to implement the dynamic sensor-actuator mapping system.

---

## 📋 Prerequisites

- NestJS backend running
- TypeORM configured
- PostgreSQL database
- Device Simulator (for testing)

---

## 🔧 Step 1: Database Migration

### 1.1 Run Migration

```bash
cd smart-farm-backend

# Generate migration (if not using provided file)
npm run typeorm migration:generate -- -n AddSensorActuatorRules

# Or use the provided migration file
# Copy: src/migrations/1738200000000-AddSensorActuatorRules.ts

# Run migration
npm run typeorm migration:run
```

### 1.2 Verify Migration

```sql
-- Check table created
SELECT * FROM sensor_actuator_rules;

-- Should see 8 default rules
SELECT rule_name, sensor_type, violation_type, actuator_command, priority 
FROM sensor_actuator_rules 
ORDER BY priority DESC, sensor_type;
```

**Expected Output:**
```
rule_name                          | sensor_type      | violation_type | actuator_command | priority
-----------------------------------+------------------+----------------+------------------+----------
default_temp_high_fan              | temperature      | critical_high  | fan_on           | 10
default_temp_low_heater            | temperature      | critical_low   | heater_on        | 10
default_humidity_low_irrigation    | humidity         | critical_low   | irrigation_on    | 10
...
```

---

## 🏗️ Step 2: Register New Entity and Service

### 2.1 Update `mqtt.module.ts`

```typescript
// smart-farm-backend/src/modules/mqtt/mqtt.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Sensor } from '../../entities/sensor.entity';
import { SensorReading } from '../../entities/sensor-reading.entity';
import { ActionLog } from '../../entities/action-log.entity';
import { Device } from '../../entities/device.entity';
import { Farm } from '../farms/farm.entity';
import { SensorActuatorRule } from '../../entities/sensor-actuator-rule.entity';  // ← ADD THIS

import { MqttConnectionService } from './mqtt-connection.service';
import { SensorDataService } from './sensor-data.service';
import { SensorMessageParserService } from './services/sensor-message-parser.service';
import { SensorMatcherService } from './services/sensor-matcher.service';
import { ThresholdMonitorService } from './services/threshold-monitor.service';
import { ActionDispatcherService } from './services/action-dispatcher.service';
import { ActionResolverService } from './services/action-resolver.service';  // ← ADD THIS
import { DeviceAcknowledgmentService } from './services/device-acknowledgment.service';
import { DeviceAckRegistrationService } from './services/device-ack-registration.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sensor, 
      SensorReading, 
      ActionLog, 
      Device, 
      Farm,
      SensorActuatorRule  // ← ADD THIS
    ]),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 50,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    NotificationsModule,
  ],
  providers: [
    MqttConnectionService,
    SensorDataService,
    SensorMessageParserService,
    SensorMatcherService,
    ThresholdMonitorService,
    ActionDispatcherService,
    ActionResolverService,  // ← ADD THIS
    DeviceAcknowledgmentService,
    DeviceAckRegistrationService,
  ],
  exports: [
    MqttConnectionService,
    SensorDataService,
    SensorMessageParserService,
    SensorMatcherService,
    ThresholdMonitorService,
    ActionDispatcherService,
    ActionResolverService,  // ← ADD THIS (optional, if other modules need it)
  ],
})
export class MqttModule {}
```

---

## 🔄 Step 3: Update Threshold Monitor Service

### 3.1 Update Interface

```typescript
// smart-farm-backend/src/modules/mqtt/services/threshold-monitor.service.ts

// Update ThresholdViolation interface
export interface ThresholdViolation {
  sensor: Sensor;
  value: number;
  violationType: 'critical_low' | 'warning_low' | 'critical_high' | 'warning_high';
  actions: ResolvedAction[];  // ← CHANGED from 'action?: string' to 'actions: ResolvedAction[]'
  timestamp: Date;
}
```

### 3.2 Inject ActionResolverService

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Sensor } from '../../../entities/sensor.entity';
import { ActionResolverService, ResolvedAction } from './action-resolver.service';  // ← ADD THIS

@Injectable()
export class ThresholdMonitorService {
  private readonly logger = new Logger(ThresholdMonitorService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    private actionResolver: ActionResolverService  // ← ADD THIS
  ) {}
  
  // ... rest of the code
}
```

### 3.3 Update checkLowThresholds Method

```typescript
/**
 * Check low threshold violations
 */
private async checkLowThresholds(sensor: Sensor, value: number): Promise<ThresholdViolation | null> {
  if (sensor.min_critical !== null && value <= sensor.min_critical) {
    // ✨ NEW: Dynamically resolve actions using rules
    const resolvedActions = await this.actionResolver.resolveActions(
      sensor, 
      'critical_low'
    );

    return {
      sensor,
      value,
      violationType: 'critical_low',
      actions: resolvedActions,  // ← Array of resolved actions
      timestamp: new Date()
    };
  }

  if (sensor.min_warning !== null && value <= sensor.min_warning) {
    const resolvedActions = await this.actionResolver.resolveActions(
      sensor, 
      'warning_low'
    );

    return {
      sensor,
      value,
      violationType: 'warning_low',
      actions: resolvedActions,
      timestamp: new Date()
    };
  }

  return null;
}
```

### 3.4 Update checkHighThresholds Method

```typescript
/**
 * Check high threshold violations
 */
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
      actions: resolvedActions,
      timestamp: new Date()
    };
  }

  if (sensor.max_warning !== null && value >= sensor.max_warning) {
    const resolvedActions = await this.actionResolver.resolveActions(
      sensor, 
      'warning_high'
    );

    return {
      sensor,
      value,
      violationType: 'warning_high',
      actions: resolvedActions,
      timestamp: new Date()
    };
  }

  return null;
}
```

### 3.5 Make checkThresholds Async

```typescript
/**
 * Check all thresholds for a sensor value
 */
async checkThresholds(sensor: Sensor, value: number): Promise<ThresholdCheckResult> {
  const violations: ThresholdViolation[] = [];
  let status: ThresholdCheckResult['status'] = 'normal';

  // Check low thresholds
  const lowViolation = await this.checkLowThresholds(sensor, value);  // ← Add await
  if (lowViolation) {
    violations.push(lowViolation);
    if (lowViolation.violationType === 'critical_low') {
      status = 'critical';
    } else if (status === 'normal') {
      status = 'warning';
    }
  }

  // Check high thresholds
  const highViolation = await this.checkHighThresholds(sensor, value);  // ← Add await
  if (highViolation) {
    violations.push(highViolation);
    if (highViolation.violationType === 'critical_high') {
      status = 'critical';
    } else if (status === 'normal') {
      status = 'warning';
    }
  }

  // Emit events for violations
  violations.forEach(violation => {
    this.emitThresholdEvent(violation);
    this.logThresholdViolation(violation);
  });

  return {
    isWithinLimits: violations.length === 0,
    violations,
    status
  };
}
```

---

## ⚙️ Step 4: Update Action Dispatcher Service

### 4.1 Update Event Handler

```typescript
// smart-farm-backend/src/modules/mqtt/services/action-dispatcher.service.ts

/**
 * Event listener for threshold violations
 */
@OnEvent('threshold.violation')
async handleThresholdViolation(violation: ThresholdViolation) {
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

  this.logger.log(
    `🎯 Executing ${violation.actions.length} action(s) for ${violation.sensor.type} ${violation.violationType}`
  );

  // Execute all resolved actions
  for (const action of violation.actions) {
    this.logger.log(
      `⚙️ Action: ${action.command} → device ${action.targetDeviceId} (rule: ${action.ruleName}, priority: ${action.priority})`
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

## 🧪 Step 5: Testing

### 5.1 Start Device Simulator

```bash
cd smart-farm-backend
python device_simulator.py --device-id dht11h --verbose
```

### 5.2 Test Default Rules

**Scenario 1: Temperature High → Fan On**

```bash
# Publish high temperature reading
mosquitto_pub -h localhost -t smartfarm/sensors/dht11h -m "42.5"

# Expected flow:
# 1. Backend receives reading
# 2. Checks thresholds → critical_high
# 3. ActionResolver finds rule: temperature + critical_high → fan_on
# 4. Publishes to: smartfarm/actuators/dht11h/fan_on
# 5. Simulator receives command
# 6. Simulator sends ACK
# 7. Backend updates action_logs
```

**Expected Backend Logs:**
```
📊 Processing sensor data from smartfarm/sensors/dht11h: 42.5
🔍 [ACTION-RESOLVER] Resolving actions for sensor dht11h
✅ [ACTION-RESOLVER] Found 1 action(s) at priority 10
📋 [ACTION-RESOLVER] Resolved actions: fan_on@dht11h
🎯 Executing 1 action(s) for temperature critical_high
⚙️ Action: fan_on → device dht11h (rule: default_temp_high_fan, priority: 10)
✅ MQTT message published successfully
```

**Expected Simulator Output:**
```
📨 Received action on smartfarm/actuators/dht11h/fan_on
🔧 Processing action: fan_on (ID: action_1738...)
✅ Action fan_on completed successfully
📤 Sent success acknowledgment
```

### 5.3 Test Zone-Specific Rules

**Add zone-specific rule:**

```sql
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, sensor_location, violation_type, actuator_command, target_device_id, priority)
VALUES
  ('north_zone_temp_high_fan', 'temperature', 'north_zone', 'critical_high', 'fan_on', 'fan_north', 20);
```

**Update sensor location:**

```sql
UPDATE sensors 
SET location = 'north_zone' 
WHERE sensor_id = 'dht11h';
```

**Test again:**

```bash
mosquitto_pub -h localhost -t smartfarm/sensors/dht11h -m "43.0"

# Expected: Command sent to fan_north (priority 20 overrides default priority 10)
```

### 5.4 Test Backward Compatibility

**Disable all rules:**

```sql
UPDATE sensor_actuator_rules SET enabled = false;
```

**Test legacy action:**

```bash
mosquitto_pub -h localhost -t smartfarm/sensors/dht11h -m "42.5"

# Expected: Falls back to sensor.action_high
# Backend logs: "Using legacy action mapping"
```

---

## 📊 Step 6: Verify Data

### 6.1 Check Action Logs

```sql
SELECT 
  id,
  trigger_source,
  sensor_id,
  sensor_type,
  action_uri,
  status,
  created_at
FROM action_logs
ORDER BY created_at DESC
LIMIT 10;
```

### 6.2 Check Rule Usage

```sql
-- View all active rules
SELECT 
  rule_name,
  sensor_type,
  sensor_location,
  violation_type,
  actuator_command,
  priority,
  enabled
FROM sensor_actuator_rules
ORDER BY priority DESC, sensor_type;
```

---

## 🔍 Step 7: Debugging

### 7.1 Enable Debug Logging

```typescript
// In any service
this.logger.debug('Your debug message');
```

Or set log level in `main.ts`:

```typescript
app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
```

### 7.2 Test Action Resolution Manually

```typescript
// In a controller or test file
import { ActionResolverService } from './modules/mqtt/services/action-resolver.service';

// Inject the service
constructor(private actionResolver: ActionResolverService) {}

// Test resolution
async testResolution() {
  const sensor = await this.sensorRepo.findOne({ where: { sensor_id: 'dht11h' }});
  const result = await this.actionResolver.dryRunResolve(sensor, 'critical_high');
  
  console.log('Resolved Actions:', result.actions);
  console.log('Matched Rules:', result.matchedRules);
  console.log('Used Legacy:', result.usedLegacy);
}
```

---

## ✅ Step 8: Production Checklist

- [ ] Migration applied to production database
- [ ] Entity registered in TypeORM config
- [ ] Service registered in MqttModule
- [ ] Default rules verified in database
- [ ] Threshold monitor updated and async
- [ ] Action dispatcher handles multiple actions
- [ ] Backward compatibility tested
- [ ] Device simulator tested
- [ ] Manual actions still work
- [ ] Acknowledgment flow verified
- [ ] Logs monitored for errors
- [ ] Performance benchmarked (should be <10ms per resolution)

---

## 🚨 Rollback Plan

If issues occur, rollback is safe:

```bash
# Revert migration
npm run typeorm migration:revert

# Or disable rules table temporarily
UPDATE sensor_actuator_rules SET enabled = false;

# System falls back to sensor.action_low / action_high automatically
```

---

## 📚 Additional Resources

- **Main Investigation Report:** `SMART_FARM_INVESTIGATION_REPORT.md`
- **Device Simulator Guide:** `smart-farm-backend/Device_Simulator_Guide.md`
- **Entity File:** `src/entities/sensor-actuator-rule.entity.ts`
- **Resolver Service:** `src/modules/mqtt/services/action-resolver.service.ts`
- **Migration File:** `src/migrations/1738200000000-AddSensorActuatorRules.ts`

---

## 💡 Common Use Cases

### Add Rule for New Sensor Type

```sql
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority, description)
VALUES
  ('co2_high_ventilator', 'co2_level', 'critical_high', 'ventilator_on', 10, 
   'Turn on ventilator when CO2 is too high');
```

### Add Zone-Specific Override

```sql
-- General rule (priority 10)
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority)
VALUES
  ('general_temp_high', 'temperature', 'critical_high', 'fan_on', 10);

-- Zone-specific override (priority 20)
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, sensor_location, violation_type, actuator_command, target_device_id, priority)
VALUES
  ('greenhouse_a_temp_high', 'temperature', 'greenhouse_a', 'critical_high', 'fan_on', 'fan_greenhouse_a', 20);
```

### Temporarily Disable Automation

```sql
-- Disable all irrigation during maintenance
UPDATE sensor_actuator_rules 
SET enabled = false 
WHERE actuator_command LIKE 'irrigation%';

-- Re-enable
UPDATE sensor_actuator_rules 
SET enabled = true 
WHERE actuator_command LIKE 'irrigation%';
```

---

## 🎉 Success Indicators

After implementation, you should observe:

✅ **Reduced Configuration:** Add 10 sensors with 2 rules instead of 20 configurations  
✅ **Flexible Actions:** Change behavior by updating rules, not sensor records  
✅ **Zone Support:** Automatic device selection based on location  
✅ **Zero Breaking Changes:** Existing functionality unchanged  
✅ **Better Logs:** Clear indication of which rule triggered which action  

**Happy Farming! 🌾**

