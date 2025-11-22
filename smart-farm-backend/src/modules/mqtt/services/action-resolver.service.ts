// src/modules/mqtt/services/action-resolver.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from '../../../entities/sensor.entity';
import { SensorActuatorRule } from '../../../entities/sensor-actuator-rule.entity';

/**
 * Represents a resolved action ready for execution
 */
export interface ResolvedAction {
  command: string;           // Actuator command: 'fan_on', 'heater_on', etc.
  targetDeviceId: string;    // Device to send command to
  topic: string;             // Full MQTT topic path
  ruleName: string;          // Which rule triggered this action
  priority: number;          // Rule priority for logging/debugging
  ruleId: number;            // Rule database ID
}

/**
 * Action Resolver Service
 * 
 * Dynamically resolves sensor violations to actuator actions using flexible rules.
 * 
 * Key Features:
 * - Type-based resolution: All temperature sensors → fan control
 * - Zone-based resolution: Sensors in specific locations → specific actuators
 * - Priority system: Specific rules override general defaults
 * - Backward compatible: Falls back to sensor.action_low / action_high
 * - Multi-action support: One sensor can trigger multiple actuators
 * 
 * Example Resolution Flow:
 * 1. Sensor: type="temperature", location="north_zone", value=42°C
 * 2. Violation: critical_high
 * 3. Match rules: 
 *    - General: temperature + critical_high → fan_on (priority 10)
 *    - Specific: temperature + north_zone + critical_high → fan_north (priority 20)
 * 4. Result: Use priority 20 rule (more specific)
 */
@Injectable()
export class ActionResolverService {
  private readonly logger = new Logger(ActionResolverService.name);

  constructor(
    @InjectRepository(SensorActuatorRule)
    private rulesRepo: Repository<SensorActuatorRule>,
  ) {}

  /**
   * Resolve actions for a sensor violation
   * 
   * @param sensor - The sensor that triggered the violation
   * @param violationType - Type of threshold violation
   * @returns Array of resolved actions to execute
   */
  async resolveActions(
    sensor: Sensor, 
    violationType: 'critical_high' | 'warning_high' | 'critical_low' | 'warning_low'
  ): Promise<ResolvedAction[]> {
    try {
      this.logger.debug(
        `🔍 [ACTION-RESOLVER] Resolving actions for sensor ${sensor.sensor_id}:`,
        {
          type: sensor.type,
          location: sensor.location || 'unspecified',
          deviceId: sensor.device_id,
          farmId: sensor.farm_id,
          violationType
        }
      );

      // Query rules matching this sensor context
      const matchingRules = await this.findMatchingRules(sensor, violationType);

      if (matchingRules.length === 0) {
        this.logger.warn(
          `⚠️ [ACTION-RESOLVER] No rules found for ${sensor.type} (${violationType}), trying legacy fallback`
        );
        
        // Fallback to legacy sensor.action_low / action_high
        const legacyAction = this.resolveLegacyAction(sensor, violationType);
        return legacyAction ? [legacyAction] : [];
      }

      // Sort by priority (highest first) - already sorted by query but ensure it
      matchingRules.sort((a, b) => b.priority - a.priority);

      // Take all rules with the highest priority
      const highestPriority = matchingRules[0].priority;
      const topPriorityRules = matchingRules.filter(rule => rule.priority === highestPriority);

      this.logger.log(
        `✅ [ACTION-RESOLVER] Found ${topPriorityRules.length} action(s) at priority ${highestPriority} for ${sensor.type} (${violationType})`
      );

      // Convert rules to resolved actions
      const resolvedActions: ResolvedAction[] = topPriorityRules.map(rule => {
        const targetDevice = rule.target_device_id || sensor.device_id;
        const topic = `smartfarm/actuators/${targetDevice}/${rule.actuator_command}`;

        return {
          command: rule.actuator_command,
          targetDeviceId: targetDevice,
          topic,
          ruleName: rule.rule_name,
          priority: rule.priority,
          ruleId: rule.id
        };
      });

      this.logger.log(
        `📋 [ACTION-RESOLVER] Resolved actions: ${resolvedActions.map(a => `${a.command}@${a.targetDeviceId}`).join(', ')}`
      );

      return resolvedActions;

    } catch (error) {
      this.logger.error(
        `❌ [ACTION-RESOLVER] Error resolving actions for sensor ${sensor.sensor_id}:`,
        error
      );
      return [];
    }
  }

  /**
   * Find matching rules with flexible wildcard criteria
   * 
   * Matching Strategy:
   * - Exact match OR NULL (wildcard) for each field
   * - Returns all matching rules, sorted by priority
   * 
   * @param sensor - Sensor to match against
   * @param violationType - Violation type to match
   * @returns Array of matching rules, sorted by priority (descending)
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
      // If sensor has no location, only match rules without location requirement
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

    // Sort by priority (highest first), then by ID for deterministic ordering
    queryBuilder.orderBy('rule.priority', 'DESC');
    queryBuilder.addOrderBy('rule.id', 'ASC');

    const rules = await queryBuilder.getMany();

    if (rules.length > 0) {
      this.logger.debug(
        `🔍 [ACTION-RESOLVER] Found ${rules.length} matching rules:`,
        rules.map(r => `${r.rule_name} (priority ${r.priority})`)
      );
    }

    return rules;
  }

  /**
   * Resolve legacy action from sensor.action_low / action_high
   * 
   * Provides backward compatibility for sensors without rules configured.
   * Parses legacy MQTT URI format: "mqtt:smartfarm/actuators/device123/fan_on"
   * 
   * @param sensor - Sensor with legacy action fields
   * @param violationType - Violation type to determine which action to use
   * @returns Resolved action or null if no legacy action configured
   */
  private resolveLegacyAction(
    sensor: Sensor, 
    violationType: string
  ): ResolvedAction | null {
    let actionUri: string | null = null;

    // Determine which legacy action to use based on violation type
    if (violationType.includes('high')) {
      actionUri = sensor.action_high;
    } else if (violationType.includes('low')) {
      actionUri = sensor.action_low;
    }

    if (!actionUri) {
      this.logger.debug(
        `🔍 [ACTION-RESOLVER] No legacy action configured for ${sensor.sensor_id} (${violationType})`
      );
      return null;
    }

    // Parse legacy format: "mqtt:smartfarm/actuators/device123/fan_on"
    const match = actionUri.match(/mqtt:smartfarm\/actuators\/([^/]+)\/(.+)/);
    if (!match) {
      this.logger.warn(
        `⚠️ [ACTION-RESOLVER] Invalid legacy action format: ${actionUri}`
      );
      return null;
    }

    const [, deviceId, command] = match;

    this.logger.log(
      `🔄 [ACTION-RESOLVER] Using legacy action mapping: ${sensor.sensor_id} → ${command}@${deviceId}`
    );

    return {
      command,
      targetDeviceId: deviceId,
      topic: `smartfarm/actuators/${deviceId}/${command}`,
      ruleName: 'legacy_sensor_action',
      priority: 0,
      ruleId: -1  // Sentinel value for legacy actions
    };
  }

  /**
   * Get all active rules (for admin/debugging)
   */
  async getAllRules(): Promise<SensorActuatorRule[]> {
    return this.rulesRepo.find({
      where: { enabled: true },
      order: { priority: 'DESC', id: 'ASC' }
    });
  }

  /**
   * Get rules for a specific sensor type
   */
  async getRulesForSensorType(sensorType: string): Promise<SensorActuatorRule[]> {
    return this.rulesRepo.find({
      where: [
        { sensor_type: sensorType, enabled: true },
        { sensor_type: null, enabled: true }  // Wildcard rules
      ],
      order: { priority: 'DESC', id: 'ASC' }
    });
  }

  /**
   * Get rules for a specific location/zone
   */
  async getRulesForLocation(location: string): Promise<SensorActuatorRule[]> {
    return this.rulesRepo.find({
      where: [
        { sensor_location: location, enabled: true },
        { sensor_location: null, enabled: true }  // Wildcard rules
      ],
      order: { priority: 'DESC', id: 'ASC' }
    });
  }

  /**
   * Test action resolution without executing (for debugging)
   */
  async dryRunResolve(sensor: Sensor, violationType: string): Promise<{
    actions: ResolvedAction[];
    matchedRules: SensorActuatorRule[];
    usedLegacy: boolean;
  }> {
    const matchedRules = await this.findMatchingRules(
      sensor, 
      violationType as any
    );
    
    const actions = await this.resolveActions(sensor, violationType as any);
    
    return {
      actions,
      matchedRules,
      usedLegacy: actions.some(a => a.ruleId === -1)
    };
  }
}

