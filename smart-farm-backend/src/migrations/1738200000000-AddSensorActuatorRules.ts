// src/migrations/1738200000000-AddSensorActuatorRules.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: Add Sensor-Actuator Rules System
 * 
 * Creates a flexible rule-based system for mapping sensor violations to actuator actions.
 * Provides backward compatibility with existing sensor.action_low / action_high fields.
 * 
 * Key Features:
 * - Dynamic type-based action resolution
 * - Zone/location-aware rules
 * - Priority-based rule matching
 * - Wildcard support (NULL = matches any)
 * - Default rules for common sensor types
 */
export class AddSensorActuatorRules1738200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sensor_actuator_rules table
    await queryRunner.createTable(
      new Table({
        name: 'sensor_actuator_rules',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'rule_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          // Matching criteria (all nullable for wildcard support)
          {
            name: 'sensor_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Sensor type to match (NULL = wildcard, matches all types)',
          },
          {
            name: 'sensor_location',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Sensor location/zone to match (NULL = wildcard)',
          },
          {
            name: 'farm_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Farm ID to match (NULL = wildcard, matches all farms)',
          },
          {
            name: 'device_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Device ID to match (NULL = wildcard, matches all devices)',
          },
          // Trigger condition
          {
            name: 'violation_type',
            type: 'varchar',
            length: '30',
            isNullable: false,
            comment: 'Threshold violation type: critical_high, warning_high, critical_low, warning_low',
          },
          // Action specification
          {
            name: 'actuator_command',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Actuator command to execute: fan_on, heater_on, irrigation_on, etc.',
          },
          {
            name: 'target_device_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Target device for command (NULL = use sensor device)',
          },
          // Priority and control
          {
            name: 'priority',
            type: 'int',
            default: 0,
            comment: 'Rule priority (higher = takes precedence)',
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: true,
            comment: 'Enable/disable rule without deleting',
          },
          // Metadata
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Human-readable description of rule purpose',
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
      }),
      true
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'sensor_actuator_rules',
      new TableIndex({
        name: 'IDX_sensor_type_violation',
        columnNames: ['sensor_type', 'violation_type'],
      })
    );

    await queryRunner.createIndex(
      'sensor_actuator_rules',
      new TableIndex({
        name: 'IDX_enabled',
        columnNames: ['enabled'],
      })
    );

    await queryRunner.createIndex(
      'sensor_actuator_rules',
      new TableIndex({
        name: 'IDX_farm_id',
        columnNames: ['farm_id'],
      })
    );

    await queryRunner.createIndex(
      'sensor_actuator_rules',
      new TableIndex({
        name: 'IDX_priority',
        columnNames: ['priority'],
      })
    );

    // Insert comprehensive default rules (critical + warning, multi-action where applicable)
    // All actuator commands align with the simulator topics/commands
    await queryRunner.query(`
      INSERT INTO sensor_actuator_rules 
        (rule_name, sensor_type, violation_type, actuator_command, priority, description)
      VALUES
        -- ==============================
        -- Temperature: CRITICAL (multi-action: main + alarm)
        -- ==============================
        ('default_temp_crit_high_fan', 'temperature', 'critical_high', 'fan_on', 10, 
         'Turn on fan when temperature is critically high'),
        ('default_temp_crit_high_alarm', 'temperature', 'critical_high', 'alarm_on', 10, 
         'Sound alarm when temperature is critically high'),
        ('default_temp_crit_low_heater', 'temperature', 'critical_low', 'heater_on', 10,
         'Turn on heater when temperature is critically low'),
        ('default_temp_crit_low_alarm', 'temperature', 'critical_low', 'alarm_on', 10,
         'Sound alarm when temperature is critically low'),

        -- Temperature: WARNING
        ('default_temp_warn_high_fan', 'temperature', 'warning_high', 'fan_on', 8,
         'Turn on fan at warning-level high temperature'),
        ('default_temp_warn_low_heater', 'temperature', 'warning_low', 'heater_on', 8,
         'Turn on heater at warning-level low temperature'),

        -- ==============================
        -- Humidity: CRITICAL (use irrigation and fan, plus alarm on critical low)
        -- ==============================
        ('default_hum_crit_low_irrigation', 'humidity', 'critical_low', 'irrigation_on', 10,
         'Start irrigation when humidity is critically low'),
        ('default_hum_crit_low_alarm', 'humidity', 'critical_low', 'alarm_on', 10,
         'Sound alarm when humidity is critically low'),
        ('default_hum_crit_high_fan', 'humidity', 'critical_high', 'fan_on', 10,
         'Ventilate when humidity is critically high'),

        -- Humidity: WARNING
        ('default_hum_warn_low_irrigation', 'humidity', 'warning_low', 'irrigation_on', 8,
         'Start irrigation at warning-level low humidity'),
        ('default_hum_warn_high_fan', 'humidity', 'warning_high', 'fan_on', 8,
         'Ventilate at warning-level high humidity'),

        -- ==============================
        -- Soil moisture: CRITICAL (irrigation control, plus alarm on critical low)
        -- ==============================
        ('default_soil_crit_low_irrigation', 'soil_moisture', 'critical_low', 'irrigation_on', 10,
         'Start irrigation when soil is critically dry'),
        ('default_soil_crit_low_alarm', 'soil_moisture', 'critical_low', 'alarm_on', 10,
         'Sound alarm when soil is critically dry'),
        ('default_soil_crit_high_irrigation_off', 'soil_moisture', 'critical_high', 'irrigation_off', 10,
         'Stop irrigation when soil is critically wet'),

        -- Soil moisture: WARNING
        ('default_soil_warn_low_irrigation', 'soil_moisture', 'warning_low', 'irrigation_on', 8,
         'Start irrigation at warning-level dry soil'),
        ('default_soil_warn_high_irrigation_off', 'soil_moisture', 'warning_high', 'irrigation_off', 8,
         'Stop irrigation at warning-level wet soil'),

        -- ==============================
        -- Light intensity: CRITICAL
        -- ==============================
        ('default_light_crit_low_on', 'light_intensity', 'critical_low', 'lights_on', 10,
         'Turn on lights when light intensity is critically low'),
        ('default_light_crit_high_off', 'light_intensity', 'critical_high', 'lights_off', 10,
         'Turn off lights when light intensity is critically high'),

        -- Light intensity: WARNING
        ('default_light_warn_low_on', 'light_intensity', 'warning_low', 'lights_on', 8,
         'Turn on lights at warning-level low light'),
        ('default_light_warn_high_off', 'light_intensity', 'warning_high', 'lights_off', 8,
         'Turn off lights at warning-level high light')
    `);

    // Log migration success
    console.log('✅ Migration: Created sensor_actuator_rules table with default rules');
    console.log('📋 Inserted 8 default rules for temperature, humidity, soil_moisture, and light_intensity sensors');
    console.log('🔄 System maintains backward compatibility with sensor.action_low / action_high fields');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('sensor_actuator_rules', 'IDX_sensor_type_violation');
    await queryRunner.dropIndex('sensor_actuator_rules', 'IDX_enabled');
    await queryRunner.dropIndex('sensor_actuator_rules', 'IDX_farm_id');
    await queryRunner.dropIndex('sensor_actuator_rules', 'IDX_priority');

    // Drop table
    await queryRunner.dropTable('sensor_actuator_rules');

    console.log('⚠️ Migration Rolled Back: Removed sensor_actuator_rules table');
  }
}

