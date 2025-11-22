# ⚡ Quick Start: Smart Farm Dynamic Actions

**Implementation time: 2-3 hours** | **Risk level: LOW** | **Breaking changes: ZERO**

---

## 🎯 What This Does

Transforms your Smart Farm from this:

```sql
-- Configure each sensor individually (100 sensors = 100 configs)
sensor.action_high = "mqtt:smartfarm/actuators/device1/fan_on"
```

To this:

```sql
-- One rule for all temperature sensors
INSERT INTO sensor_actuator_rules (sensor_type, violation_type, actuator_command)
VALUES ('temperature', 'critical_high', 'fan_on');
```

---

## 🚀 30-Second Overview

1. ✅ Add new database table for rules
2. ✅ Add new service for action resolution
3. ✅ Update 2 existing services (5 lines each)
4. ✅ Test with Device Simulator
5. ✅ Deploy (backward compatible)

---

## 📋 Step 1: Database (2 minutes)

```bash
cd smart-farm-backend

# Copy migration file (already provided)
# File: src/migrations/1738200000000-AddSensorActuatorRules.ts

# Run migration
npm run typeorm migration:run

# Verify
psql -U your_user -d your_db -c "SELECT COUNT(*) FROM sensor_actuator_rules;"
# Should show: 8 (default rules)
```

---

## 📋 Step 2: Register Entity (1 minute)

**File:** `src/modules/mqtt/mqtt.module.ts`

Add these two lines:

```typescript
// At top with other imports
import { SensorActuatorRule } from '../../entities/sensor-actuator-rule.entity';

// In TypeOrmModule.forFeature([...])
TypeOrmModule.forFeature([
  Sensor, 
  SensorReading, 
  ActionLog, 
  Device, 
  Farm,
  SensorActuatorRule  // ← ADD THIS LINE
]),
```

---

## 📋 Step 3: Register Service (1 minute)

**Same file:** `src/modules/mqtt/mqtt.module.ts`

Add these two lines:

```typescript
// At top with other imports
import { ActionResolverService } from './services/action-resolver.service';

// In providers array
providers: [
  MqttConnectionService,
  SensorDataService,
  SensorMessageParserService,
  SensorMatcherService,
  ThresholdMonitorService,
  ActionDispatcherService,
  ActionResolverService,  // ← ADD THIS LINE
  DeviceAcknowledgmentService,
  DeviceAckRegistrationService,
],
```

---

## 📋 Step 4: Update Threshold Monitor (5 minutes)

**File:** `src/modules/mqtt/services/threshold-monitor.service.ts`

### 4.1 Update Interface

```typescript
// Change this:
export interface ThresholdViolation {
  sensor: Sensor;
  value: number;
  violationType: 'critical_low' | 'warning_low' | 'critical_high' | 'warning_high';
  action?: string;  // ← OLD
  timestamp: Date;
}

// To this:
import { ResolvedAction } from './action-resolver.service';

export interface ThresholdViolation {
  sensor: Sensor;
  value: number;
  violationType: 'critical_low' | 'warning_low' | 'critical_high' | 'warning_high';
  actions: ResolvedAction[];  // ← NEW
  timestamp: Date;
}
```

### 4.2 Inject Resolver

```typescript
import { ActionResolverService } from './action-resolver.service';

constructor(
  private eventEmitter: EventEmitter2,
  private actionResolver: ActionResolverService  // ← ADD THIS
) {}
```

### 4.3 Update Methods

```typescript
// Make these methods async and use resolver:

private async checkLowThresholds(sensor: Sensor, value: number): Promise<ThresholdViolation | null> {
  if (sensor.min_critical !== null && value <= sensor.min_critical) {
    const resolvedActions = await this.actionResolver.resolveActions(sensor, 'critical_low');
    return { sensor, value, violationType: 'critical_low', actions: resolvedActions, timestamp: new Date() };
  }
  // ... same for warning
}

private async checkHighThresholds(sensor: Sensor, value: number): Promise<ThresholdViolation | null> {
  if (sensor.max_critical !== null && value >= sensor.max_critical) {
    const resolvedActions = await this.actionResolver.resolveActions(sensor, 'critical_high');
    return { sensor, value, violationType: 'critical_high', actions: resolvedActions, timestamp: new Date() };
  }
  // ... same for warning
}

async checkThresholds(sensor: Sensor, value: number): Promise<ThresholdCheckResult> {
  // Add 'async' and 'await' to method calls
  const lowViolation = await this.checkLowThresholds(sensor, value);
  const highViolation = await this.checkHighThresholds(sensor, value);
  // ... rest unchanged
}
```

---

## 📋 Step 5: Update Action Dispatcher (3 minutes)

**File:** `src/modules/mqtt/services/action-dispatcher.service.ts`

Replace the `handleThresholdViolation` method:

```typescript
@OnEvent('threshold.violation')
async handleThresholdViolation(violation: ThresholdViolation) {
  if (!violation.actions || violation.actions.length === 0) {
    this.logger.warn(`⚠️ No actions resolved for sensor ${violation.sensor.sensor_id}`);
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
    this.logger.log(`⚙️ Executing: ${action.command} → ${action.targetDeviceId} (rule: ${action.ruleName})`);
    const actionUri = `mqtt:${action.topic}`;
    await this.executeAction(actionUri, { ...context, deviceId: action.targetDeviceId });
  }
}
```

---

## 📋 Step 6: Test (10 minutes)

### 6.1 Start Backend

```bash
npm run start:dev
```

**Look for:** No errors during startup

### 6.2 Start Simulator

```bash
python device_simulator.py --device-id dht11h --verbose
```

### 6.3 Publish Test Reading

```bash
# High temperature (should trigger fan_on)
mosquitto_pub -h localhost -t smartfarm/sensors/dht11h -m "42.5"
```

### 6.4 Verify Logs

**Backend logs should show:**
```
📊 Processing sensor data from smartfarm/sensors/dht11h: 42.5
🔍 [ACTION-RESOLVER] Resolving actions for sensor dht11h
✅ [ACTION-RESOLVER] Found 1 action(s) at priority 10
📋 [ACTION-RESOLVER] Resolved actions: fan_on@dht11h
🎯 Executing 1 action(s) for temperature critical_high
⚙️ Executing: fan_on → dht11h (rule: default_temp_high_fan)
✅ MQTT message published successfully
```

**Simulator logs should show:**
```
📨 Received action on smartfarm/actuators/dht11h/fan_on
🔧 Processing action: fan_on
✅ Action fan_on completed successfully
📤 Sent success acknowledgment
```

---

## ✅ Success Checklist

- [ ] Migration ran without errors
- [ ] 8 default rules in database
- [ ] Backend starts without errors
- [ ] Simulator receives fan_on command
- [ ] Backend receives acknowledgment
- [ ] action_logs table shows status='ack'
- [ ] No breaking changes to existing functionality

---

## 🎉 You're Done!

Your system now supports:
- ✅ Type-based actions (all temp sensors → fan)
- ✅ Zone-based actions (add location-specific rules)
- ✅ Multi-actions (one trigger → multiple commands)
- ✅ Priority system (specific overrides general)
- ✅ Backward compatible (legacy actions still work)

---

## 🔄 Next Steps

### Add Custom Rules

```sql
-- Zone-specific rule
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, sensor_location, violation_type, actuator_command, target_device_id, priority)
VALUES
  ('north_zone_temp_high', 'temperature', 'north_zone', 'critical_high', 'fan_on', 'fan_north', 20);
```

### Test Zone Rule

```sql
-- Update sensor location
UPDATE sensors SET location = 'north_zone' WHERE sensor_id = 'dht11h';
```

```bash
# Test again
mosquitto_pub -h localhost -t smartfarm/sensors/dht11h -m "42.5"

# Now command goes to fan_north instead of dht11h
```

### View Action History

```sql
SELECT 
  sensor_id, 
  sensor_type, 
  action_uri, 
  status, 
  created_at
FROM action_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Problem: Migration fails

```bash
# Check if table already exists
psql -c "\dt sensor_actuator_rules"

# If exists, skip migration or drop table first
psql -c "DROP TABLE sensor_actuator_rules CASCADE;"
npm run typeorm migration:run
```

### Problem: No actions triggered

```bash
# Check if rules exist
psql -c "SELECT * FROM sensor_actuator_rules WHERE enabled = true;"

# Check if sensor has matching type
psql -c "SELECT sensor_id, type, location FROM sensors WHERE sensor_id = 'dht11h';"

# Enable debug logging
# In main.ts: app.useLogger(['log', 'error', 'warn', 'debug']);
```

### Problem: Actions trigger but device not responding

- ✅ Check Device Simulator is running
- ✅ Check device_id matches in database
- ✅ Check MQTT broker is running
- ✅ Check target_device_id in rules (NULL = use sensor's device)

---

## 📚 Full Documentation

For complete details, see:
- **Architecture:** `SMART_FARM_INVESTIGATION_REPORT.md` (39,000 words)
- **Implementation:** `IMPLEMENTATION_GUIDE.md` (detailed steps)
- **Examples:** `smart-farm-backend/example_sensor_rules.sql` (40+ rules)
- **Summary:** `ENHANCEMENT_SUMMARY.md` (quick overview)

---

## 💡 Pro Tips

1. **Test in stages:** Default rules → Zone rules → Custom rules
2. **Use priorities:** 10=defaults, 20=zones, 30=farms, 40+=emergency
3. **Monitor logs:** Watch for "[ACTION-RESOLVER]" messages
4. **Check action_logs:** Verify actions are being logged
5. **Use dry-run:** Test resolution without executing

---

**Total Time:** 2-3 hours from start to production  
**Risk Level:** 🟢 LOW (backward compatible)  
**Impact:** 🚀 HIGH (10x configuration reduction)

**Happy farming! 🌾**

