-- ======================================================
-- Smart Farm IoT Backend - Complete PostgreSQL Schema
-- ======================================================
-- This script creates the complete database schema for the Smart Farm IoT system
-- including all tables, constraints, indexes, enums, and sample data.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- ENUM Types
-- =========================

-- Action Status Enum
CREATE TYPE action_status_enum AS ENUM (
    'queued',
    'sent',
    'ack',
    'error',
    'timeout',
    'failed'
);

-- User Role Enum
CREATE TYPE user_role_enum AS ENUM (
    'admin',
    'farmer',
    'moderator'
);

-- User Status Enum
CREATE TYPE user_status_enum AS ENUM (
    'active',
    'inactive',
    'suspended'
);

-- =========================
-- Tables
-- =========================

-- Users Table
CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role_enum NOT NULL DEFAULT 'farmer',
    status user_status_enum NOT NULL DEFAULT 'active',
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    profile_picture TEXT,
    last_login TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Farms Table
CREATE TABLE farms (
    farm_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location TEXT,
    owner_id VARCHAR(36),
    CONSTRAINT FK_farms_users FOREIGN KEY (owner_id) REFERENCES users(user_id)
);

-- Crops Table
CREATE TABLE crops (
    crop_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    variety VARCHAR(100),
    planting_date DATE,
    expected_harvest_date DATE,
    status VARCHAR(50) DEFAULT 'planted' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT crops_status_check CHECK (status IN ('planted', 'growing', 'harvested', 'failed'))
);

-- Devices Table
CREATE TABLE devices (
    device_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'offline',
    farm_id VARCHAR(36) NOT NULL,
    CONSTRAINT FK_devices_farms FOREIGN KEY (farm_id) REFERENCES farms(farm_id)
);

-- Sensors Table
CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    sensor_id VARCHAR(36) NOT NULL,
    farm_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    crop_id UUID,
    min_critical NUMERIC(10,2),
    min_warning NUMERIC(10,2),
    max_warning NUMERIC(10,2),
    max_critical NUMERIC(10,2),
    action_low TEXT,
    action_high TEXT,
    CONSTRAINT FK_sensors_farms FOREIGN KEY (farm_id) REFERENCES farms(farm_id),
    CONSTRAINT FK_sensors_crops FOREIGN KEY (crop_id) REFERENCES crops(crop_id),
    CONSTRAINT FK_sensors_devices FOREIGN KEY (device_id) REFERENCES devices(device_id)
);

-- Sensor Readings Table
CREATE TABLE sensor_readings (
    id SERIAL PRIMARY KEY,
    sensor_id VARCHAR(36) NOT NULL,
    value1 DOUBLE PRECISION,
    value2 DOUBLE PRECISION,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Action Logs Table
CREATE TABLE action_logs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    trigger_source VARCHAR(10) NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    sensor_id VARCHAR(100),
    sensor_type VARCHAR(50),
    value DOUBLE PRECISION,
    unit VARCHAR(20),
    violation_type VARCHAR(30),
    action_uri VARCHAR(255) NOT NULL,
    status action_status_enum NOT NULL,
    topic VARCHAR(255),
    error_message TEXT,
    payload JSONB,
    action_id VARCHAR(100),
    action_type VARCHAR(20),
    qos_level INTEGER,
    retain_flag BOOLEAN,
    sent_at TIMESTAMP,
    ack_at TIMESTAMP,
    timeout_at TIMESTAMP,
    failed_at TIMESTAMP,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 1
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) NOT NULL,
    level VARCHAR(10) NOT NULL,
    source VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    context JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Sensor-Actuator Rules Table
CREATE TABLE sensor_actuator_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    sensor_type VARCHAR(50),
    sensor_location VARCHAR(100),
    farm_id VARCHAR(100),
    device_id VARCHAR(100),
    violation_type VARCHAR(30) NOT NULL,
    actuator_command VARCHAR(50) NOT NULL,
    target_device_id VARCHAR(100),
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Migrations Table
CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL
);

-- =========================
-- Indexes
-- =========================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);

-- Farms indexes
CREATE INDEX idx_farms_owner ON farms(owner_id);

-- Sensors indexes
CREATE INDEX idx_sensors_farm_id ON sensors(farm_id);
CREATE INDEX idx_sensors_crop_id ON sensors(crop_id);
CREATE INDEX idx_sensors_device_id ON sensors(device_id);
CREATE INDEX idx_sensors_sensor_id ON sensors(sensor_id);

-- Sensor Readings indexes
CREATE INDEX idx_sensor_readings_sensor_id ON sensor_readings(sensor_id);
CREATE INDEX idx_sensor_readings_created_at ON sensor_readings(created_at);

-- Action Logs indexes
CREATE INDEX idx_action_logs_device ON action_logs(device_id);
CREATE INDEX idx_action_logs_sensor ON action_logs(sensor_id);
CREATE INDEX idx_action_logs_action_id ON action_logs(action_id);
CREATE INDEX idx_action_logs_status ON action_logs(status);
CREATE INDEX idx_action_logs_created_at ON action_logs(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Sensor-Actuator Rules indexes
CREATE INDEX idx_sensor_actuator_rules_sensor_type ON sensor_actuator_rules(sensor_type);
CREATE INDEX idx_sensor_actuator_rules_violation_type ON sensor_actuator_rules(violation_type);
CREATE INDEX idx_sensor_actuator_rules_enabled ON sensor_actuator_rules(enabled);
CREATE INDEX idx_sensor_actuator_rules_farm_id ON sensor_actuator_rules(farm_id);
CREATE INDEX idx_sensor_actuator_rules_priority ON sensor_actuator_rules(priority);

-- =========================
-- Sample Data
-- =========================

-- Sample Users
INSERT INTO users (user_id, email, password, first_name, last_name, phone, role, status, city, country)
VALUES 
    ('user-admin-001', 'admin@smartfarm.com', '$2b$10$examplehashadmin', 'Admin', 'User', '+1234567890', 'admin', 'active', 'San Francisco', 'USA'),
    ('user-farmer-001', 'farmer@smartfarm.com', '$2b$10$examplehashfarmer', 'John', 'Farmer', '+1234567891', 'farmer', 'active', 'Sacramento', 'USA'),
    ('user-moderator-001', 'moderator@smartfarm.com', '$2b$10$examplehashmoderator', 'Jane', 'Moderator', '+1234567892', 'moderator', 'active', 'Los Angeles', 'USA');

-- Sample Farms
INSERT INTO farms (farm_id, name, location, owner_id)
VALUES 
    ('farm-001', 'Green Valley Farm', 'Sacramento, CA', 'user-farmer-001'),
    ('farm-002', 'Sunset Orchards', 'Fresno, CA', 'user-farmer-001');

-- Sample Crops
INSERT INTO crops (crop_id, name, description, variety, planting_date, expected_harvest_date, status)
VALUES 
    ('crop-tomato-001', 'Tomatoes', 'Heirloom tomatoes for summer harvest', 'Brandywine', '2025-04-15', '2025-08-20', 'growing'),
    ('crop-lettuce-001', 'Lettuce', 'Leaf lettuce for spring harvest', 'Buttercrunch', '2025-03-10', '2025-05-15', 'planted');

-- Sample Devices
INSERT INTO devices (device_id, name, location, status, farm_id)
VALUES 
    ('device-dht11-001', 'DHT11 Sensor Hub', 'Greenhouse A', 'online', 'farm-001'),
    ('device-soil-001', 'Soil Moisture Sensor Array', 'Field Section 1', 'online', 'farm-001'),
    ('device-light-001', 'Light Sensor Network', 'Greenhouse B', 'offline', 'farm-001'),
    ('device-actuator-001', 'Actuator Controller', 'Main Control Room', 'online', 'farm-001');

-- Sample Sensors
INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, crop_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high)
VALUES 
    ('sensor-temp-001', 'farm-001', 'temperature', '°C', 'device-dht11-001', 'Greenhouse A', 'crop-tomato-001', 10.00, 15.00, 28.00, 35.00, 'mqtt:smartfarm/actuators/heater_on', 'mqtt:smartfarm/actuators/fan_on'),
    ('sensor-humid-001', 'farm-001', 'humidity', '%', 'device-dht11-001', 'Greenhouse A', 'crop-tomato-001', 40.00, 50.00, 70.00, 80.00, 'mqtt:smartfarm/actuators/humidifier_on', 'mqtt:smartfarm/actuators/dehumidifier_on'),
    ('sensor-soil-001', 'farm-001', 'soil_moisture', '%', 'device-soil-001', 'Field Section 1', 'crop-lettuce-001', 0.20, 0.30, 0.70, 0.80, 'mqtt:smartfarm/actuators/irrigation_on', NULL),
    ('sensor-light-001', 'farm-001', 'light_intensity', 'lux', 'device-light-001', 'Greenhouse B', NULL, 200.00, 500.00, 2000.00, 3000.00, 'mqtt:smartfarm/actuators/lights_on', NULL);

-- Sample Sensor Readings
INSERT INTO sensor_readings (sensor_id, value1, value2, created_at)
VALUES 
    ('sensor-temp-001', 24.5, NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
    ('sensor-temp-001', 25.2, NULL, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
    ('sensor-humid-001', 62.3, NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
    ('sensor-soil-001', 0.45, NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
    ('sensor-light-001', 1200.0, NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes');

-- Sample Action Logs
INSERT INTO action_logs (trigger_source, device_id, sensor_id, sensor_type, value, unit, violation_type, action_uri, status, topic)
VALUES 
    ('auto', 'device-dht11-001', 'sensor-temp-001', 'temperature', 36.5, '°C', 'critical_high', 'mqtt:smartfarm/actuators/fan_on', 'sent', 'smartfarm/actuators/fan_on'),
    ('manual', 'device-actuator-001', NULL, NULL, NULL, NULL, NULL, 'mqtt:smartfarm/actuators/irrigation_on', 'ack', 'smartfarm/actuators/irrigation_on');

-- Sample Notifications
INSERT INTO notifications (user_id, level, source, title, message, is_read)
VALUES 
    ('user-farmer-001', 'warning', 'sensor', 'High Temperature Alert', 'Temperature in Greenhouse A reached 36.5°C', FALSE),
    ('user-farmer-001', 'info', 'system', 'Irrigation Completed', 'Scheduled irrigation for Field Section 1 completed successfully', TRUE);

-- Sample Sensor-Actuator Rules
INSERT INTO sensor_actuator_rules (rule_name, sensor_type, violation_type, actuator_command, priority, description)
VALUES
    -- Temperature rules
    ('default_temp_high_fan', 'temperature', 'critical_high', 'fan_on', 10, 'Turn on fan when any temperature sensor reads critically high'),
    ('default_temp_low_heater', 'temperature', 'critical_low', 'heater_on', 10, 'Turn on heater when any temperature sensor reads critically low'),
    ('default_temp_warning_high', 'temperature', 'warning_high', 'ventilator_on', 10, 'Moderate ventilation for warning-level high temperature'),
    ('default_temp_warning_low', 'temperature', 'warning_low', 'heater_on', 10, 'Gentle heating for warning-level low temperature'),
    
    -- Humidity rules
    ('default_humidity_low', 'humidity', 'critical_low', 'irrigation_on', 10, 'Turn on irrigation when humidity is critically low'),
    ('default_humidity_high', 'humidity', 'critical_high', 'fan_on', 10, 'Turn on fan/dehumidifier when humidity is critically high'),
    ('default_humidity_warning_low', 'humidity', 'warning_low', 'misting_on', 10, 'Gentle misting for warning-level low humidity'),
    
    -- Soil moisture rules
    ('default_soil_dry', 'soil_moisture', 'critical_low', 'irrigation_on', 10, 'Turn on irrigation when soil is critically dry'),
    ('default_soil_wet', 'soil_moisture', 'critical_high', 'irrigation_off', 10, 'Stop irrigation when soil is too wet'),
    ('default_soil_warning_dry', 'soil_moisture', 'warning_low', 'irrigation_on', 10, 'Start irrigation for warning-level dry soil'),
    
    -- Light intensity rules
    ('default_light_low', 'light_intensity', 'critical_low', 'lights_on', 10, 'Turn on grow lights when light is insufficient'),
    ('default_light_high', 'light_intensity', 'critical_high', 'lights_off', 10, 'Turn off lights when natural light is sufficient'),
    ('default_light_warning_low', 'light_intensity', 'warning_low', 'lights_on', 10, 'Turn on lights at warning level for optimal growth'),
    
    -- Zone-specific rules
    ('greenhouse_a_temp_high', 'temperature', 'critical_high', 'fan_on', 20, 'Use greenhouse A fan for temperature control'),
    ('field_section_1_soil_dry', 'soil_moisture', 'critical_low', 'irrigation_on', 20, 'Use field section 1 irrigation for soil moisture control');

-- Sample Migrations
INSERT INTO migrations (timestamp, name)
VALUES 
    (1738123456789, 'AddProductionFieldsToActionLogs1738123456789'),
    (1738200000000, 'AddSensorActuatorRules1738200000000');

-- =========================
-- Views (Optional)
-- =========================

-- View for recent sensor readings
CREATE OR REPLACE VIEW v_recent_sensor_readings AS
SELECT 
    s.sensor_id,
    s.type,
    s.unit,
    s.location,
    sr.value1,
    sr.created_at
FROM sensors s
JOIN sensor_readings sr ON s.sensor_id = sr.sensor_id
WHERE sr.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY sr.created_at DESC;

-- View for active alerts
CREATE OR REPLACE VIEW v_active_alerts AS
SELECT 
    al.id,
    al.device_id,
    al.sensor_id,
    al.sensor_type,
    al.value,
    al.unit,
    al.violation_type,
    al.status,
    al.created_at
FROM action_logs al
WHERE al.status IN ('queued', 'sent', 'error', 'timeout', 'failed')
AND al.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY al.created_at DESC;

-- =========================
-- Functions and Triggers (Optional)
-- =========================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON farms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON crops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_action_logs_updated_at BEFORE UPDATE ON action_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sensor_actuator_rules_updated_at BEFORE UPDATE ON sensor_actuator_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- Permissions (Optional)
-- =========================

-- Grant appropriate permissions (adjust as needed for your setup)
GRANT ALL PRIVILEGES ON TABLE users TO postgres;
GRANT ALL PRIVILEGES ON TABLE farms TO postgres;
GRANT ALL PRIVILEGES ON TABLE crops TO postgres;
GRANT ALL PRIVILEGES ON TABLE devices TO postgres;
GRANT ALL PRIVILEGES ON TABLE sensors TO postgres;
GRANT ALL PRIVILEGES ON TABLE sensor_readings TO postgres;
GRANT ALL PRIVILEGES ON TABLE action_logs TO postgres;
GRANT ALL PRIVILEGES ON TABLE notifications TO postgres;
GRANT ALL PRIVILEGES ON TABLE sensor_actuator_rules TO postgres;
GRANT ALL PRIVILEGES ON TABLE migrations TO postgres;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- =========================
-- Schema Information
-- =========================
-- Version: 1.0
-- Created: 2025-11-14
-- Description: Complete Smart Farm IoT Backend Schema for PostgreSQL
-- Compatible with: PostgreSQL 17+