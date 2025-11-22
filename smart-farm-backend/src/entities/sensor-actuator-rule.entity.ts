// src/entities/sensor-actuator-rule.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  Index 
} from 'typeorm';

/**
 * Sensor-Actuator Rule Entity
 * 
 * Provides dynamic, flexible mapping between sensor conditions and actuator actions.
 * Supports wildcards, priorities, and zone-based logic.
 * 
 * Example Use Cases:
 * 1. Type-based: All temperature sensors → fan_on when high
 * 2. Zone-based: Sensors in "north_zone" → specific actuators
 * 3. Multi-action: One trigger → multiple simultaneous actions
 * 
 * Priority System:
 * - Higher priority rules override lower priority
 * - Allows general defaults (priority 10) and specific overrides (priority 20+)
 */
@Entity('sensor_actuator_rules')
export class SensorActuatorRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  rule_name: string;

  /**
   * Sensor Matching Criteria (all nullable for wildcard support)
   * NULL = matches any value (wildcard)
   */

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  sensor_type: string | null;  // e.g., "temperature", "humidity", or NULL for all

  @Column({ type: 'varchar', length: 100, nullable: true })
  sensor_location: string | null;  // e.g., "north_zone", "greenhouse_a", or NULL

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  farm_id: string | null;  // Specific farm or NULL for all farms

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_id: string | null;  // Specific device or NULL for all devices

  /**
   * Trigger Condition
   * Specifies when this rule should activate
   */
  @Index()
  @Column({ type: 'varchar', length: 30 })
  violation_type: 'critical_high' | 'warning_high' | 'critical_low' | 'warning_low';

  /**
   * Action Specification
   * Defines what action to execute when triggered
   */
  @Column({ type: 'varchar', length: 50 })
  actuator_command: string;  // e.g., "fan_on", "heater_on", "irrigation_on"

  @Column({ type: 'varchar', length: 100, nullable: true })
  target_device_id: string | null;  // Device to send command to, or NULL to use sensor's device

  /**
   * Priority and Control
   */
  @Column({ type: 'int', default: 0 })
  priority: number;  // Higher priority rules take precedence

  @Index()
  @Column({ type: 'boolean', default: true })
  enabled: boolean;  // Allow rules to be temporarily disabled

  /**
   * Metadata
   */
  @Column({ type: 'text', nullable: true })
  description: string;  // Human-readable description of rule purpose

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

