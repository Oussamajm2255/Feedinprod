-- ============================================================================
-- Smart Farm: Example Sensor-Actuator Rules
-- ============================================================================
-- This file contains example rules for common smart farm scenarios.
-- Copy and modify these rules to match your farm's specific needs.
-- 
-- Rule Priority System:
-- - Priority 0-9:   Legacy/fallback rules
-- - Priority 10-19: Default type-based rules
-- - Priority 20-29: Zone-specific rules
-- - Priority 30-39: Farm-specific rules
-- - Priority 40+:   Critical override rules
-- ============================================================================

-- ============================================================================
-- 1. DEFAULT TYPE-BASED RULES (Priority 10)
-- ============================================================================
-- These rules apply to all sensors of a given type, regardless of location.
-- They serve as fallback behavior when no more specific rule matches.

-- Temperature Control
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority, description)
VALUES
  ('default_temp_high_fan', 'temperature', 'critical_high', 'fan_on', 10, 
   'Turn on fan when any temperature sensor reads critically high'),
  ('default_temp_low_heater', 'temperature', 'critical_low', 'heater_on', 10,
   'Turn on heater when any temperature sensor reads critically low'),
  ('default_temp_warning_high', 'temperature', 'warning_high', 'ventilator_on', 10,
   'Moderate ventilation for warning-level high temperature'),
  ('default_temp_warning_low', 'temperature', 'warning_low', 'heater_on', 10,
   'Gentle heating for warning-level low temperature');

-- Humidity Control
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority, description)
VALUES
  ('default_humidity_low', 'humidity', 'critical_low', 'irrigation_on', 10,
   'Turn on irrigation when humidity is critically low'),
  ('default_humidity_high', 'humidity', 'critical_high', 'fan_on', 10,
   'Turn on fan/dehumidifier when humidity is critically high'),
  ('default_humidity_warning_low', 'humidity', 'warning_low', 'misting_on', 10,
   'Gentle misting for warning-level low humidity');

-- Soil Moisture Control
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority, description)
VALUES
  ('default_soil_dry', 'soil_moisture', 'critical_low', 'irrigation_on', 10,
   'Turn on irrigation when soil is critically dry'),
  ('default_soil_wet', 'soil_moisture', 'critical_high', 'irrigation_off', 10,
   'Stop irrigation when soil is too wet'),
  ('default_soil_warning_dry', 'soil_moisture', 'warning_low', 'irrigation_on', 10,
   'Start irrigation for warning-level dry soil');

-- Light Intensity Control
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority, description)
VALUES
  ('default_light_low', 'light_intensity', 'critical_low', 'lights_on', 10,
   'Turn on grow lights when light is insufficient'),
  ('default_light_high', 'light_intensity', 'critical_high', 'lights_off', 10,
   'Turn off lights when natural light is sufficient'),
  ('default_light_warning_low', 'light_intensity', 'warning_low', 'lights_on', 10,
   'Turn on lights at warning level for optimal growth');

-- CO2 Level Control
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority, description)
VALUES
  ('default_co2_low', 'co2_level', 'critical_low', 'co2_generator_on', 10,
   'Turn on CO2 generator when levels are too low'),
  ('default_co2_high', 'co2_level', 'critical_high', 'ventilator_on', 10,
   'Increase ventilation when CO2 is too high');

-- ============================================================================
-- 2. ZONE-SPECIFIC RULES (Priority 20)
-- ============================================================================
-- These rules override defaults for specific zones/locations.
-- They allow different areas of your farm to have specialized behavior.

-- North Zone (Greenhouse A) - Cooler climate zone
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, sensor_location, violation_type, actuator_command, target_device_id, priority, description)
VALUES
  ('north_zone_temp_high', 'temperature', 'north_zone', 'critical_high', 'fan_on', 'fan_north', 20,
   'Use north zone fan for temperature control'),
  ('north_zone_temp_low', 'temperature', 'north_zone', 'critical_low', 'heater_on', 'heater_north', 20,
   'Use north zone heater for temperature control'),
  ('north_zone_humidity_low', 'humidity', 'north_zone', 'critical_low', 'irrigation_on', 'irrigation_north', 20,
   'Use north zone irrigation for humidity control');

-- South Zone (Greenhouse B) - Warmer climate zone
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, sensor_location, violation_type, actuator_command, target_device_id, priority, description)
VALUES
  ('south_zone_temp_high', 'temperature', 'south_zone', 'critical_high', 'fan_on', 'fan_south', 20,
   'Use south zone fan (more powerful due to warmer climate)'),
  ('south_zone_temp_low', 'temperature', 'south_zone', 'critical_low', 'heater_on', 'heater_south', 20,
   'Use south zone heater'),
  ('south_zone_humidity_high', 'humidity', 'south_zone', 'critical_high', 'dehumidifier_on', 'dehumidifier_south', 20,
   'Use dehumidifier in humid south zone');

-- Seedling Area - Requires more precise control
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, sensor_location, violation_type, actuator_command, target_device_id, priority, description)
VALUES
  ('seedling_temp_high', 'temperature', 'seedling_area', 'critical_high', 'cooling_mat_on', 'cooling_mat_seedling', 20,
   'Use gentle cooling for sensitive seedlings'),
  ('seedling_humidity_low', 'humidity', 'seedling_area', 'critical_low', 'misting_on', 'misting_seedling', 20,
   'Use gentle misting for seedlings instead of heavy irrigation'),
  ('seedling_light_low', 'light_intensity', 'seedling_area', 'critical_low', 'grow_lights_on', 'grow_lights_seedling', 20,
   'Use specialized grow lights for seedlings');

-- Outdoor Sensors - Different actions
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, sensor_location, violation_type, actuator_command, target_device_id, priority, description)
VALUES
  ('outdoor_temp_high', 'temperature', 'outdoor', 'critical_high', 'misting_on', 'misting_outdoor', 20,
   'Use misting system for outdoor temperature control'),
  ('outdoor_soil_dry', 'soil_moisture', 'outdoor', 'critical_low', 'sprinkler_on', 'sprinkler_outdoor', 20,
   'Use sprinkler system for outdoor irrigation');

-- ============================================================================
-- 3. MULTI-ACTION RULES (Same Priority)
-- ============================================================================
-- Multiple rules with the same priority will ALL execute.
-- Use this for scenarios requiring multiple simultaneous actions.

-- Critical Temperature: Alert + Action
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority, description)
VALUES
  ('critical_temp_high_action', 'temperature', 'critical_high', 'fan_on', 15,
   'Turn on fan for critical high temperature'),
  ('critical_temp_high_alert', 'temperature', 'critical_high', 'alarm_on', 15,
   'Sound alarm for critical high temperature');

-- Critical Soil Moisture: Irrigation + Notification
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority, description)
VALUES
  ('critical_soil_irrigation', 'soil_moisture', 'critical_low', 'irrigation_on', 15,
   'Start irrigation for critical dry soil'),
  ('critical_soil_alert', 'soil_moisture', 'critical_low', 'alarm_on', 15,
   'Alert for critical soil moisture');

-- ============================================================================
-- 4. FARM-SPECIFIC RULES (Priority 30)
-- ============================================================================
-- Rules that apply only to specific farms.
-- Useful for multi-tenant systems.

-- Example: Organic farm with different thresholds
INSERT INTO sensor_actuator_rules 
  (rule_name, farm_id, sensor_type, violation_type, actuator_command, priority, description)
VALUES
  ('organic_farm_temp_control', 'organic_farm_001', 'temperature', 'critical_high', 'natural_ventilation_on', 30,
   'Use natural ventilation only for organic certification'),
  ('organic_farm_pest_alert', 'organic_farm_001', 'pest_detection', 'critical_high', 'alarm_on', 30,
   'Alert for pest detection in organic farm');

-- ============================================================================
-- 5. EMERGENCY OVERRIDE RULES (Priority 40+)
-- ============================================================================
-- Highest priority rules for emergency situations.
-- These always take precedence.

-- Fire/Heat Emergency
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority, description)
VALUES
  ('emergency_extreme_heat', 'temperature', 'critical_high', 'emergency_shutdown', 40,
   'Emergency shutdown at extreme temperatures'),
  ('emergency_fire_alarm', 'temperature', 'critical_high', 'fire_alarm_on', 40,
   'Activate fire alarm at extreme temperatures');

-- ============================================================================
-- 6. CONDITIONAL RULES (Examples for Future Enhancement)
-- ============================================================================
-- These are conceptual examples showing how conditional rules might work
-- if you implement the advanced features mentioned in the investigation report.

-- Time-based rules (requires enhancement)
/*
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority, description, conditions)
VALUES
  ('nighttime_lights', 'light_intensity', 'critical_low', 'lights_on', 25,
   'Turn on lights only during nighttime hours',
   '{"time_range": {"start": "18:00", "end": "06:00"}}');
*/

-- Weather-based rules (requires enhancement)
/*
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority, description, conditions)
VALUES
  ('rainy_day_ventilation', 'humidity', 'critical_high', 'ventilator_on', 25,
   'Use ventilation instead of opening roof during rain',
   '{"weather_condition": "rain"}');
*/

-- ============================================================================
-- 7. TESTING AND DEBUGGING RULES
-- ============================================================================
-- Temporary rules for testing specific devices or scenarios.

-- Test rule (can be disabled after testing)
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, target_device_id, priority, description, enabled)
VALUES
  ('test_rule_dht11h', 'temperature', 'critical_high', 'fan_on', 'dht11h', 50,
   'Test rule for simulator - can be disabled after testing', true);

-- ============================================================================
-- 8. MAINTENANCE QUERIES
-- ============================================================================

-- View all active rules by priority
-- SELECT rule_name, sensor_type, sensor_location, violation_type, actuator_command, priority, enabled
-- FROM sensor_actuator_rules
-- WHERE enabled = true
-- ORDER BY priority DESC, sensor_type, violation_type;

-- Disable all rules for a specific actuator (maintenance mode)
-- UPDATE sensor_actuator_rules 
-- SET enabled = false 
-- WHERE actuator_command LIKE 'irrigation%'
-- AND description LIKE '%maintenance%';

-- Enable all rules after maintenance
-- UPDATE sensor_actuator_rules 
-- SET enabled = true 
-- WHERE actuator_command LIKE 'irrigation%';

-- Find rules affecting a specific location
-- SELECT * FROM sensor_actuator_rules
-- WHERE sensor_location = 'north_zone' OR sensor_location IS NULL
-- ORDER BY priority DESC;

-- Find duplicate rules (same conditions and action)
-- SELECT sensor_type, sensor_location, violation_type, actuator_command, COUNT(*)
-- FROM sensor_actuator_rules
-- WHERE enabled = true
-- GROUP BY sensor_type, sensor_location, violation_type, actuator_command
-- HAVING COUNT(*) > 1;

-- ============================================================================
-- 9. RULE TEMPLATES FOR COMMON SCENARIOS
-- ============================================================================

-- Template: Add new greenhouse zone
/*
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, sensor_location, violation_type, actuator_command, target_device_id, priority, description)
VALUES
  ('YOUR_ZONE_temp_high', 'temperature', 'YOUR_ZONE', 'critical_high', 'fan_on', 'fan_YOUR_ZONE', 20,
   'Temperature control for YOUR_ZONE'),
  ('YOUR_ZONE_temp_low', 'temperature', 'YOUR_ZONE', 'critical_low', 'heater_on', 'heater_YOUR_ZONE', 20,
   'Heating control for YOUR_ZONE'),
  ('YOUR_ZONE_humidity_low', 'humidity', 'YOUR_ZONE', 'critical_low', 'irrigation_on', 'irrigation_YOUR_ZONE', 20,
   'Humidity control for YOUR_ZONE');
*/

-- Template: Add new sensor type
/*
INSERT INTO sensor_actuator_rules 
  (rule_name, sensor_type, violation_type, actuator_command, priority, description)
VALUES
  ('default_YOUR_SENSOR_high', 'YOUR_SENSOR_TYPE', 'critical_high', 'YOUR_ACTION', 10,
   'Action when YOUR_SENSOR_TYPE is critically high'),
  ('default_YOUR_SENSOR_low', 'YOUR_SENSOR_TYPE', 'critical_low', 'YOUR_ACTION', 10,
   'Action when YOUR_SENSOR_TYPE is critically low');
*/

-- ============================================================================
-- Notes:
-- 
-- 1. Priority System Matters:
--    - Higher priority rules override lower priority rules
--    - Multiple rules at the SAME priority ALL execute
--    - Use priority ranges: 10=defaults, 20=zones, 30=farms, 40+=emergency
--
-- 2. NULL = Wildcard:
--    - sensor_type IS NULL     → matches all sensor types
--    - sensor_location IS NULL → matches all locations
--    - farm_id IS NULL         → matches all farms
--    - target_device_id IS NULL → uses sensor's device
--
-- 3. Testing:
--    - Test new rules with enabled=false first
--    - Enable one rule at a time
--    - Monitor action_logs table for results
--
-- 4. Maintenance:
--    - Use enabled=false instead of deleting rules
--    - Add descriptive rule_name and description
--    - Document priority ranges in comments
--
-- 5. Performance:
--    - Keep total rules under 1000 for best performance
--    - Use specific matches over wildcards when possible
--    - Create indexes on frequently queried columns
-- ============================================================================

