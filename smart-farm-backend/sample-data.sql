-- ============================================================================
-- Smart Farm IoT - Realistic Sample Data
-- ============================================================================
-- This file contains realistic sample data for development and testing
-- Excludes: users, audit_logs, action_logs (sensitive data)
-- 
-- Usage: Run this AFTER running smart_farm_schema.sql
-- ============================================================================

-- ============================================================================
-- FARMS (Realistic Farm Names)
-- ============================================================================

-- Note: These farms reference user_id which should exist in your users table
-- For testing, you can use any valid user_id from your users table
-- Example: Replace 'user-farmer-001' with an actual user_id from your database

-- Farm 1: Green Valley Organic Farm (Sacramento Valley, CA)
INSERT INTO farms (farm_id, name, location, latitude, longitude, owner_id, created_at, updated_at) VALUES
('farm-green-valley-001', 'Green Valley Organic Farm', 'Sacramento Valley, California, USA', 38.5816, -121.4944, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Farm 2: Sunset Orchards (Fresno County, CA)
INSERT INTO farms (farm_id, name, location, latitude, longitude, owner_id, created_at, updated_at) VALUES
('farm-sunset-orchards-001', 'Sunset Orchards', 'Fresno County, California, USA', 36.7378, -119.7871, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Farm 3: Highland Greenhouse Complex (Denver, CO)
INSERT INTO farms (farm_id, name, location, latitude, longitude, owner_id, created_at, updated_at) VALUES
('farm-highland-greenhouse-001', 'Highland Greenhouse Complex', 'Denver, Colorado, USA', 39.7392, -104.9903, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Farm 4: Coastal Hydroponics (San Diego, CA)
INSERT INTO farms (farm_id, name, location, latitude, longitude, owner_id, created_at, updated_at) VALUES
('farm-coastal-hydroponics-001', 'Coastal Hydroponics', 'San Diego, California, USA', 32.7157, -117.1611, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================================
-- CROPS (Realistic Crop Varieties)
-- ============================================================================
-- Note: crop_id is UUID type, so we use gen_random_uuid() or let it auto-generate
-- We'll store UUIDs in variables to reference them in sensors table

DO $$
DECLARE
    crop_tomato_id UUID;
    crop_lettuce_id UUID;
    crop_corn_id UUID;
    crop_pepper_id UUID;
    crop_basil_id UUID;
BEGIN
    -- Green Valley Organic Farm - Tomatoes
    INSERT INTO crops (crop_id, name, description, variety, planting_date, expected_harvest_date, status, notes, created_at, updated_at) 
    VALUES (gen_random_uuid(), 'Heirloom Tomatoes', 'Organic heirloom tomatoes for farmers market', 'Brandywine', '2025-04-15', '2025-08-20', 'growing', 'Planted in greenhouse section A, using organic compost', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING crop_id INTO crop_tomato_id;

    -- Green Valley Organic Farm - Lettuce
    INSERT INTO crops (crop_id, name, description, variety, planting_date, expected_harvest_date, status, notes, created_at, updated_at) 
    VALUES (gen_random_uuid(), 'Buttercrunch Lettuce', 'Leaf lettuce for spring harvest', 'Buttercrunch', '2025-03-10', '2025-05-15', 'growing', 'Succession planting every 2 weeks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING crop_id INTO crop_lettuce_id;

    -- Sunset Orchards - Sweet Corn
    INSERT INTO crops (crop_id, name, description, variety, planting_date, expected_harvest_date, status, notes, created_at, updated_at) 
    VALUES (gen_random_uuid(), 'Sweet Corn', 'Sweet corn for summer market', 'Silver Queen', '2025-05-01', '2025-09-15', 'growing', 'Planted in 4-acre field, using drip irrigation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING crop_id INTO crop_corn_id;

    -- Highland Greenhouse - Bell Peppers
    INSERT INTO crops (crop_id, name, description, variety, planting_date, expected_harvest_date, status, notes, created_at, updated_at) 
    VALUES (gen_random_uuid(), 'Bell Peppers', 'Colorful bell peppers for year-round production', 'California Wonder', '2025-02-20', '2025-07-30', 'growing', 'Growing in climate-controlled greenhouse', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING crop_id INTO crop_pepper_id;

    -- Coastal Hydroponics - Basil
    INSERT INTO crops (crop_id, name, description, variety, planting_date, expected_harvest_date, status, notes, created_at, updated_at) 
    VALUES (gen_random_uuid(), 'Basil', 'Genovese basil for pesto production', 'Genovese', '2025-01-15', '2025-12-31', 'growing', 'Hydroponic system, continuous harvest', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING crop_id INTO crop_basil_id;

END $$;

-- ============================================================================
-- DEVICES (Real IoT Device Names)
-- ============================================================================

-- Green Valley Organic Farm Devices
INSERT INTO devices (device_id, name, location, status, farm_id, created_at, updated_at) VALUES
('device-rpi-greenhouse-a-001', 'Raspberry Pi 4 Model B - Greenhouse A', 'Greenhouse A - North Section', 'online', 'farm-green-valley-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('device-arduino-field-1-001', 'Arduino Mega 2560 - Field Section 1', 'Field Section 1 - Irrigation Control', 'online', 'farm-green-valley-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('device-esp32-sensor-hub-001', 'ESP32 Sensor Hub - Greenhouse B', 'Greenhouse B - Central Hub', 'online', 'farm-green-valley-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('device-rpi-main-control-001', 'Raspberry Pi 4 - Main Control Room', 'Main Control Room - Building 1', 'online', 'farm-green-valley-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sunset Orchards Devices
INSERT INTO devices (device_id, name, location, status, farm_id, created_at, updated_at) VALUES
('device-arduino-orchard-zone-1', 'Arduino Uno - Orchard Zone 1', 'Orchard Zone 1 - East Side', 'online', 'farm-sunset-orchards-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('device-esp8266-weather-station', 'ESP8266 Weather Station', 'Central Weather Monitoring Station', 'online', 'farm-sunset-orchards-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('device-rpi-irrigation-master', 'Raspberry Pi Zero W - Irrigation Master', 'Irrigation Control Center', 'maintenance', 'farm-sunset-orchards-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Highland Greenhouse Devices
INSERT INTO devices (device_id, name, location, status, farm_id, created_at, updated_at) VALUES
('device-rpi-greenhouse-climate-001', 'Raspberry Pi 4 - Climate Control', 'Greenhouse 1 - Climate Control Room', 'online', 'farm-highland-greenhouse-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('device-arduino-nano-sensors', 'Arduino Nano - Sensor Array', 'Greenhouse 2 - Sensor Network', 'online', 'farm-highland-greenhouse-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('device-esp32-actuator-controller', 'ESP32 - Actuator Controller', 'Greenhouse 3 - Actuator Hub', 'online', 'farm-highland-greenhouse-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Coastal Hydroponics Devices
INSERT INTO devices (device_id, name, location, status, farm_id, created_at, updated_at) VALUES
('device-rpi-hydroponic-system-1', 'Raspberry Pi 4 - Hydroponic System 1', 'Hydroponic Bay 1 - Nutrient Control', 'online', 'farm-coastal-hydroponics-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('device-arduino-ph-controller', 'Arduino Mega - pH Controller', 'Hydroponic Bay 2 - pH Monitoring', 'online', 'farm-coastal-hydroponics-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================================
-- SENSORS (Realistic Sensor Types and Configurations)
-- ============================================================================

-- Green Valley - Greenhouse A Sensors
-- Note: Using crop IDs from crops table (querying by name)
INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) 
SELECT 
    'sensor-temp-greenhouse-a-001', 'farm-green-valley-001', 'temperature', '°C', 'device-rpi-greenhouse-a-001', 'Greenhouse A - North Wall', 
    (SELECT crop_id FROM crops WHERE name = 'Heirloom Tomatoes' LIMIT 1), 
    10.0, 15.0, 28.0, 35.0, 'mqtt:smartfarm/actuators/heater_on', 'mqtt:smartfarm/actuators/fan_on', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM crops WHERE name = 'Heirloom Tomatoes');

INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) 
SELECT 
    'sensor-humidity-greenhouse-a-001', 'farm-green-valley-001', 'humidity', '%', 'device-rpi-greenhouse-a-001', 'Greenhouse A - Central', 
    (SELECT crop_id FROM crops WHERE name = 'Heirloom Tomatoes' LIMIT 1), 
    40.0, 50.0, 70.0, 80.0, 'mqtt:smartfarm/actuators/humidifier_on', 'mqtt:smartfarm/actuators/dehumidifier_on', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM crops WHERE name = 'Heirloom Tomatoes');

INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) 
SELECT 
    'sensor-soil-moisture-field-1-001', 'farm-green-valley-001', 'soil_moisture', '%', 'device-arduino-field-1-001', 'Field Section 1 - Row 3', 
    (SELECT crop_id FROM crops WHERE name = 'Buttercrunch Lettuce' LIMIT 1), 
    20.0, 30.0, 70.0, 80.0, 'mqtt:smartfarm/actuators/irrigation_on', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM crops WHERE name = 'Buttercrunch Lettuce');

INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) VALUES
('sensor-light-greenhouse-b-001', 'farm-green-valley-001', 'light_intensity', 'lux', 'device-esp32-sensor-hub-001', 'Greenhouse B - Grow Light Zone', NULL, 200.0, 500.0, 2000.0, 3000.0, 'mqtt:smartfarm/actuators/lights_on', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sunset Orchards Sensors
INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) 
SELECT 
    'sensor-temp-orchard-zone-1', 'farm-sunset-orchards-001', 'temperature', '°C', 'device-arduino-orchard-zone-1', 'Orchard Zone 1 - Tree Row 5', 
    (SELECT crop_id FROM crops WHERE name = 'Sweet Corn' LIMIT 1), 
    5.0, 10.0, 32.0, 38.0, 'mqtt:smartfarm/actuators/frost_protection_on', 'mqtt:smartfarm/actuators/shade_on', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM crops WHERE name = 'Sweet Corn');

INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) 
SELECT 
    'sensor-soil-moisture-orchard-001', 'farm-sunset-orchards-001', 'soil_moisture', '%', 'device-arduino-orchard-zone-1', 'Orchard Zone 1 - Irrigation Point 3', 
    (SELECT crop_id FROM crops WHERE name = 'Sweet Corn' LIMIT 1), 
    25.0, 35.0, 75.0, 85.0, 'mqtt:smartfarm/actuators/irrigation_on', 'mqtt:smartfarm/actuators/irrigation_off', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM crops WHERE name = 'Sweet Corn');

INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) VALUES
('sensor-wind-speed-weather-001', 'farm-sunset-orchards-001', 'wind_speed', 'km/h', 'device-esp8266-weather-station', 'Central Weather Station', NULL, NULL, NULL, 40.0, 60.0, NULL, 'mqtt:smartfarm/actuators/wind_protection_on', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Highland Greenhouse Sensors
INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) 
SELECT 
    'sensor-temp-greenhouse-1-001', 'farm-highland-greenhouse-001', 'temperature', '°C', 'device-rpi-greenhouse-climate-001', 'Greenhouse 1 - Zone A', 
    (SELECT crop_id FROM crops WHERE name = 'Bell Peppers' LIMIT 1), 
    12.0, 18.0, 30.0, 35.0, 'mqtt:smartfarm/actuators/heater_on', 'mqtt:smartfarm/actuators/cooling_on', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM crops WHERE name = 'Bell Peppers');

INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) 
SELECT 
    'sensor-co2-greenhouse-1-001', 'farm-highland-greenhouse-001', 'co2', 'ppm', 'device-rpi-greenhouse-climate-001', 'Greenhouse 1 - Zone B', 
    (SELECT crop_id FROM crops WHERE name = 'Bell Peppers' LIMIT 1), 
    200.0, 300.0, 1200.0, 1500.0, 'mqtt:smartfarm/actuators/co2_inject_on', 'mqtt:smartfarm/actuators/ventilation_on', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM crops WHERE name = 'Bell Peppers');

INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) VALUES
('sensor-humidity-greenhouse-2-001', 'farm-highland-greenhouse-001', 'humidity', '%', 'device-arduino-nano-sensors', 'Greenhouse 2 - Sensor Array 1', NULL, 45.0, 55.0, 75.0, 85.0, 'mqtt:smartfarm/actuators/humidifier_on', 'mqtt:smartfarm/actuators/dehumidifier_on', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Coastal Hydroponics Sensors
INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) 
SELECT 
    'sensor-ph-hydroponic-1-001', 'farm-coastal-hydroponics-001', 'ph', 'pH', 'device-arduino-ph-controller', 'Hydroponic Bay 1 - Nutrient Tank', 
    (SELECT crop_id FROM crops WHERE name = 'Basil' LIMIT 1), 
    5.0, 5.5, 6.5, 7.0, 'mqtt:smartfarm/actuators/ph_adjust_down', 'mqtt:smartfarm/actuators/ph_adjust_up', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM crops WHERE name = 'Basil');

INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) 
SELECT 
    'sensor-ec-hydroponic-1-001', 'farm-coastal-hydroponics-001', 'ec', 'mS/cm', 'device-rpi-hydroponic-system-1', 'Hydroponic Bay 1 - Solution Monitor', 
    (SELECT crop_id FROM crops WHERE name = 'Basil' LIMIT 1), 
    0.5, 1.0, 2.5, 3.0, 'mqtt:smartfarm/actuators/nutrient_add', 'mqtt:smartfarm/actuators/water_dilute', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM crops WHERE name = 'Basil');

INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high, created_at, updated_at) 
SELECT 
    'sensor-water-temp-hydroponic-001', 'farm-coastal-hydroponics-001', 'water_temperature', '°C', 'device-rpi-hydroponic-system-1', 'Hydroponic Bay 1 - Reservoir', 
    (SELECT crop_id FROM crops WHERE name = 'Basil' LIMIT 1), 
    15.0, 18.0, 24.0, 28.0, 'mqtt:smartfarm/actuators/water_heater_on', 'mqtt:smartfarm/actuators/water_cooler_on', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM crops WHERE name = 'Basil');

-- ============================================================================
-- SENSOR READINGS (Realistic Time-Series Data)
-- ============================================================================

-- Recent readings for Greenhouse A Temperature (last 2 hours, every 5 minutes)
INSERT INTO sensor_readings (sensor_id, value1, value2, created_at) VALUES
('sensor-temp-greenhouse-a-001', 24.5, NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
('sensor-temp-greenhouse-a-001', 25.2, NULL, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
('sensor-temp-greenhouse-a-001', 24.8, NULL, CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
('sensor-temp-greenhouse-a-001', 25.5, NULL, CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
('sensor-temp-greenhouse-a-001', 26.1, NULL, CURRENT_TIMESTAMP - INTERVAL '25 minutes'),
('sensor-temp-greenhouse-a-001', 25.9, NULL, CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
('sensor-temp-greenhouse-a-001', 24.3, NULL, CURRENT_TIMESTAMP - INTERVAL '35 minutes'),
('sensor-temp-greenhouse-a-001', 23.8, NULL, CURRENT_TIMESTAMP - INTERVAL '40 minutes'),
('sensor-temp-greenhouse-a-001', 24.0, NULL, CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
('sensor-temp-greenhouse-a-001', 24.7, NULL, CURRENT_TIMESTAMP - INTERVAL '50 minutes'),
('sensor-temp-greenhouse-a-001', 25.3, NULL, CURRENT_TIMESTAMP - INTERVAL '55 minutes'),
('sensor-temp-greenhouse-a-001', 25.8, NULL, CURRENT_TIMESTAMP - INTERVAL '60 minutes'),
('sensor-temp-greenhouse-a-001', 26.2, NULL, CURRENT_TIMESTAMP - INTERVAL '65 minutes'),
('sensor-temp-greenhouse-a-001', 25.6, NULL, CURRENT_TIMESTAMP - INTERVAL '70 minutes'),
('sensor-temp-greenhouse-a-001', 24.9, NULL, CURRENT_TIMESTAMP - INTERVAL '75 minutes'),
('sensor-temp-greenhouse-a-001', 24.4, NULL, CURRENT_TIMESTAMP - INTERVAL '80 minutes'),
('sensor-temp-greenhouse-a-001', 23.9, NULL, CURRENT_TIMESTAMP - INTERVAL '85 minutes'),
('sensor-temp-greenhouse-a-001', 24.1, NULL, CURRENT_TIMESTAMP - INTERVAL '90 minutes'),
('sensor-temp-greenhouse-a-001', 24.6, NULL, CURRENT_TIMESTAMP - INTERVAL '95 minutes'),
('sensor-temp-greenhouse-a-001', 25.0, NULL, CURRENT_TIMESTAMP - INTERVAL '100 minutes'),
('sensor-temp-greenhouse-a-001', 25.4, NULL, CURRENT_TIMESTAMP - INTERVAL '105 minutes'),
('sensor-temp-greenhouse-a-001', 25.7, NULL, CURRENT_TIMESTAMP - INTERVAL '110 minutes'),
('sensor-temp-greenhouse-a-001', 26.0, NULL, CURRENT_TIMESTAMP - INTERVAL '115 minutes'),
('sensor-temp-greenhouse-a-001', 25.1, NULL, CURRENT_TIMESTAMP - INTERVAL '120 minutes');

-- Humidity readings for Greenhouse A
INSERT INTO sensor_readings (sensor_id, value1, value2, created_at) VALUES
('sensor-humidity-greenhouse-a-001', 62.3, NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
('sensor-humidity-greenhouse-a-001', 63.1, NULL, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
('sensor-humidity-greenhouse-a-001', 61.8, NULL, CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
('sensor-humidity-greenhouse-a-001', 64.2, NULL, CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
('sensor-humidity-greenhouse-a-001', 63.5, NULL, CURRENT_TIMESTAMP - INTERVAL '25 minutes'),
('sensor-humidity-greenhouse-a-001', 62.9, NULL, CURRENT_TIMESTAMP - INTERVAL '30 minutes');

-- Soil moisture readings for Field Section 1
INSERT INTO sensor_readings (sensor_id, value1, value2, created_at) VALUES
('sensor-soil-moisture-field-1-001', 45.0, NULL, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
('sensor-soil-moisture-field-1-001', 44.8, NULL, CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
('sensor-soil-moisture-field-1-001', 45.2, NULL, CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
('sensor-soil-moisture-field-1-001', 44.5, NULL, CURRENT_TIMESTAMP - INTERVAL '40 minutes'),
('sensor-soil-moisture-field-1-001', 45.5, NULL, CURRENT_TIMESTAMP - INTERVAL '50 minutes');

-- Light intensity readings
INSERT INTO sensor_readings (sensor_id, value1, value2, created_at) VALUES
('sensor-light-greenhouse-b-001', 1200.0, NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
('sensor-light-greenhouse-b-001', 1350.0, NULL, CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
('sensor-light-greenhouse-b-001', 1180.0, NULL, CURRENT_TIMESTAMP - INTERVAL '25 minutes'),
('sensor-light-greenhouse-b-001', 1420.0, NULL, CURRENT_TIMESTAMP - INTERVAL '35 minutes');

-- Orchard temperature readings
INSERT INTO sensor_readings (sensor_id, value1, value2, created_at) VALUES
('sensor-temp-orchard-zone-1', 22.5, NULL, CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
('sensor-temp-orchard-zone-1', 23.1, NULL, CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
('sensor-temp-orchard-zone-1', 21.8, NULL, CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
('sensor-temp-orchard-zone-1', 22.9, NULL, CURRENT_TIMESTAMP - INTERVAL '60 minutes');

-- Orchard soil moisture
INSERT INTO sensor_readings (sensor_id, value1, value2, created_at) VALUES
('sensor-soil-moisture-orchard-001', 58.5, NULL, CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
('sensor-soil-moisture-orchard-001', 57.2, NULL, CURRENT_TIMESTAMP - INTERVAL '40 minutes'),
('sensor-soil-moisture-orchard-001', 59.1, NULL, CURRENT_TIMESTAMP - INTERVAL '60 minutes');

-- Wind speed readings
INSERT INTO sensor_readings (sensor_id, value1, value2, created_at) VALUES
('sensor-wind-speed-weather-001', 12.5, NULL, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
('sensor-wind-speed-weather-001', 15.3, NULL, CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
('sensor-wind-speed-weather-001', 11.8, NULL, CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
('sensor-wind-speed-weather-001', 14.2, NULL, CURRENT_TIMESTAMP - INTERVAL '40 minutes');

-- Greenhouse 1 temperature and CO2
INSERT INTO sensor_readings (sensor_id, value1, value2, created_at) VALUES
('sensor-temp-greenhouse-1-001', 26.5, NULL, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
('sensor-temp-greenhouse-1-001', 27.1, NULL, CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
('sensor-co2-greenhouse-1-001', 850.0, NULL, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
('sensor-co2-greenhouse-1-001', 920.0, NULL, CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
('sensor-humidity-greenhouse-2-001', 68.5, NULL, CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
('sensor-humidity-greenhouse-2-001', 69.2, NULL, CURRENT_TIMESTAMP - INTERVAL '30 minutes');

-- Hydroponic system readings
INSERT INTO sensor_readings (sensor_id, value1, value2, created_at) VALUES
('sensor-ph-hydroponic-1-001', 6.2, NULL, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
('sensor-ph-hydroponic-1-001', 6.1, NULL, CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
('sensor-ec-hydroponic-1-001', 1.8, NULL, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
('sensor-ec-hydroponic-1-001', 1.9, NULL, CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
('sensor-water-temp-hydroponic-001', 21.5, NULL, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
('sensor-water-temp-hydroponic-001', 21.8, NULL, CURRENT_TIMESTAMP - INTERVAL '20 minutes');

-- ============================================================================
-- SENSOR ACTUATOR RULES (Realistic Automation Rules)
-- ============================================================================

-- Temperature Rules (Global)
INSERT INTO sensor_actuator_rules (rule_name, sensor_type, sensor_location, farm_id, device_id, violation_type, actuator_command, target_device_id, priority, enabled, description, created_at, updated_at) VALUES
('global_temp_high_fan', 'temperature', NULL, NULL, NULL, 'critical_high', 'fan_on', NULL, 90, TRUE, 'Turn on fan when any temperature sensor reads critically high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('global_temp_low_heater', 'temperature', NULL, NULL, NULL, 'critical_low', 'heater_on', NULL, 90, TRUE, 'Turn on heater when any temperature sensor reads critically low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('global_temp_warning_high', 'temperature', NULL, NULL, NULL, 'warning_high', 'ventilator_on', NULL, 50, TRUE, 'Moderate ventilation for warning-level high temperature', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('global_temp_warning_low', 'temperature', NULL, NULL, NULL, 'warning_low', 'heater_on', NULL, 50, TRUE, 'Gentle heating for warning-level low temperature', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Humidity Rules
INSERT INTO sensor_actuator_rules (rule_name, sensor_type, sensor_location, farm_id, device_id, violation_type, actuator_command, target_device_id, priority, enabled, description, created_at, updated_at) VALUES
('global_humidity_low', 'humidity', NULL, NULL, NULL, 'critical_low', 'humidifier_on', NULL, 80, TRUE, 'Turn on humidifier when humidity is critically low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('global_humidity_high', 'humidity', NULL, NULL, NULL, 'critical_high', 'dehumidifier_on', NULL, 80, TRUE, 'Turn on dehumidifier when humidity is critically high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('global_humidity_warning_low', 'humidity', NULL, NULL, NULL, 'warning_low', 'misting_on', NULL, 40, TRUE, 'Gentle misting for warning-level low humidity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Soil Moisture Rules
INSERT INTO sensor_actuator_rules (rule_name, sensor_type, sensor_location, farm_id, device_id, violation_type, actuator_command, target_device_id, priority, enabled, description, created_at, updated_at) VALUES
('global_soil_dry', 'soil_moisture', NULL, NULL, NULL, 'critical_low', 'irrigation_on', NULL, 95, TRUE, 'Turn on irrigation when soil is critically dry', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('global_soil_wet', 'soil_moisture', NULL, NULL, NULL, 'critical_high', 'irrigation_off', NULL, 95, TRUE, 'Stop irrigation when soil is too wet', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('global_soil_warning_dry', 'soil_moisture', NULL, NULL, NULL, 'warning_low', 'irrigation_on', NULL, 60, TRUE, 'Start irrigation for warning-level dry soil', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Light Intensity Rules
INSERT INTO sensor_actuator_rules (rule_name, sensor_type, sensor_location, farm_id, device_id, violation_type, actuator_command, target_device_id, priority, enabled, description, created_at, updated_at) VALUES
('global_light_low', 'light_intensity', NULL, NULL, NULL, 'critical_low', 'lights_on', NULL, 70, TRUE, 'Turn on grow lights when light is insufficient', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('global_light_high', 'light_intensity', NULL, NULL, NULL, 'critical_high', 'lights_off', NULL, 70, TRUE, 'Turn off lights when natural light is sufficient', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('global_light_warning_low', 'light_intensity', NULL, NULL, NULL, 'warning_low', 'lights_on', NULL, 30, TRUE, 'Turn on lights at warning level for optimal growth', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Farm-Specific Rules (Higher Priority)
INSERT INTO sensor_actuator_rules (rule_name, sensor_type, sensor_location, farm_id, device_id, violation_type, actuator_command, target_device_id, priority, enabled, description, created_at, updated_at) VALUES
('greenvalley_greenhouse_a_temp_high', 'temperature', 'Greenhouse A', 'farm-green-valley-001', NULL, 'critical_high', 'fan_on', 'device-rpi-greenhouse-a-001', 100, TRUE, 'Priority fan control for Greenhouse A temperature', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('greenvalley_field_section_1_soil_dry', 'soil_moisture', 'Field Section 1', 'farm-green-valley-001', NULL, 'critical_low', 'irrigation_on', 'device-arduino-field-1-001', 100, TRUE, 'Priority irrigation for Field Section 1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sunset_orchard_zone_1_frost_protection', 'temperature', 'Orchard Zone 1', 'farm-sunset-orchards-001', NULL, 'critical_low', 'frost_protection_on', 'device-arduino-orchard-zone-1', 100, TRUE, 'Frost protection for Orchard Zone 1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('highland_greenhouse_1_co2_inject', 'co2', 'Greenhouse 1', 'farm-highland-greenhouse-001', NULL, 'critical_low', 'co2_inject_on', 'device-rpi-greenhouse-climate-001', 100, TRUE, 'CO2 injection for Greenhouse 1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('coastal_hydroponic_ph_adjust', 'ph', 'Hydroponic Bay 1', 'farm-coastal-hydroponics-001', NULL, 'critical_high', 'ph_adjust_down', 'device-arduino-ph-controller', 100, TRUE, 'pH adjustment for Hydroponic Bay 1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================================
-- NOTIFICATIONS (Generic System Notifications - No User IDs)
-- ============================================================================

-- Note: These notifications don't have user_id set (NULL)
-- In production, you would link these to actual users
-- For testing, you can update these with valid user_ids

-- System notifications (these would typically be linked to users in production)
-- Leaving user_id as NULL for now - you can update with actual user_ids

-- ============================================================================
-- MIGRATIONS (Sample Migration Records)
-- ============================================================================

INSERT INTO migrations (timestamp, name, applied_at) VALUES
(1738123456789, 'AddProductionFieldsToActionLogs1738123456789', CURRENT_TIMESTAMP),
(1738200000000, 'AddSensorActuatorRules1738200000000', CURRENT_TIMESTAMP),
(1738300000000, 'EnhancedSchemaV3Migration1738300000000', CURRENT_TIMESTAMP);

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify data)
-- ============================================================================

-- Uncomment to verify data was inserted:

-- SELECT COUNT(*) as farm_count FROM farms;
-- SELECT COUNT(*) as crop_count FROM crops;
-- SELECT COUNT(*) as device_count FROM devices;
-- SELECT COUNT(*) as sensor_count FROM sensors;
-- SELECT COUNT(*) as reading_count FROM sensor_readings;
-- SELECT COUNT(*) as rule_count FROM sensor_actuator_rules;

-- View recent sensor readings
-- SELECT * FROM v_recent_sensor_readings LIMIT 10;

-- View farm statistics
-- SELECT * FROM v_farm_statistics;

-- View sensor health
-- SELECT * FROM v_sensor_health LIMIT 10;

-- ============================================================================
-- SAMPLE DATA COMPLETE
-- ============================================================================

