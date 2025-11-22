/**
 * Sensor Status Utility
 * Pure functions for sensor status computation
 */

import { SensorReading, Sensor } from '../../../../core/models/farm.model';
import {
  ThresholdConfig,
  normalizeThresholds,
  isInOptimalRange,
  isInCriticalRange,
  calculatePercentage,
} from './sensor-thresholds.util';

export type SensorStatus = 'normal' | 'warning' | 'critical' | 'offline';

export interface SensorStatusResult {
  status: SensorStatus;
  message: string;
  value: number;
  percentage: number;
  lastReading: SensorReading | null;
}

export interface SensorWithThresholds extends Sensor {
  min_threshold?: number;
  max_threshold?: number;
  optimal_min?: number;
  optimal_max?: number;
  name?: string;
  sensor_type?: string;
}

/**
 * Extract the correct value from a reading based on sensor type
 */
export function extractValueFromReading(
  reading: SensorReading,
  sensorType: string,
  unit: string
): number {
  const typeLower = sensorType.toLowerCase();
  const unitLower = unit.toLowerCase();

  // If both values present, choose based on type/unit
  if (reading.value1 != null && reading.value2 != null) {
    if (typeLower === 'temperature' || unitLower.includes('c')) {
      return reading.value1;
    } else if (typeLower === 'humidity' || unitLower.includes('%')) {
      return reading.value2;
    }
    // Default to value1 for composite readings
    return reading.value1;
  }

  // Single value fallback
  return reading.value1 ?? reading.value2 ?? 0;
}

/**
 * Find the most recent reading for a sensor
 */
export function findLatestReading(
  sensorId: string,
  readings: SensorReading[],
  sensorType: string,
  unit: string
): SensorReading | null {
  const filtered = readings
    .filter((r) => r.sensor_id === sensorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (filtered.length === 0) return null;

  // Prefer composite readings (both value1 and value2)
  const composite = filtered.find((r) => r.value1 != null && r.value2 != null);
  if (composite) return composite;

  // Match by type/unit if available
  const matched = filtered.find((r) => {
    const relType = r.sensor?.type?.toLowerCase() || '';
    const relUnit = r.sensor?.unit?.toLowerCase() || '';
    return relType === sensorType.toLowerCase() || relUnit === unit.toLowerCase();
  });

  return matched || filtered[0];
}

/**
 * Calculate sensor status based on thresholds
 */
export function calculateSensorStatus(
  sensor: SensorWithThresholds,
  readings: SensorReading[],
  i18nMessages: {
    offline: string;
    optimal: string;
    belowMin: string;
    aboveMax: string;
    belowOptimal: string;
    aboveOptimal: string;
  }
): SensorStatusResult {
  const sensorType = sensor.sensor_type || sensor.type || '';
  const unit = sensor.unit || '';

  const latestReading = findLatestReading(sensor.sensor_id, readings, sensorType, unit);

  if (!latestReading) {
    return {
      status: 'offline',
      message: i18nMessages.offline,
      value: 0,
      percentage: 0,
      lastReading: null,
    };
  }

  const value = extractValueFromReading(latestReading, sensorType, unit);

  const thresholds = normalizeThresholds(sensorType, {
    min: sensor.min_threshold ?? sensor.min_critical,
    max: sensor.max_threshold ?? sensor.max_critical,
    optimal_min: sensor.optimal_min ?? sensor.min_warning,
    optimal_max: sensor.optimal_max ?? sensor.max_warning,
  });

  const percentage = calculatePercentage(value, thresholds.min, thresholds.max);

  let status: SensorStatus = 'normal';
  let message = i18nMessages.optimal;

  if (isInCriticalRange(value, thresholds.min, thresholds.max)) {
    status = 'critical';
    message = value < thresholds.min ? i18nMessages.belowMin : i18nMessages.aboveMax;
  } else if (!isInOptimalRange(value, thresholds.optimal_min, thresholds.optimal_max)) {
    status = 'warning';
    message =
      value < thresholds.optimal_min ? i18nMessages.belowOptimal : i18nMessages.aboveOptimal;
  }

  return {
    status,
    message,
    value,
    percentage,
    lastReading: latestReading,
  };
}

/**
 * Get status icon name
 */
export function getStatusIcon(status: SensorStatus): string {
  const icons: Record<SensorStatus, string> = {
    normal: 'check_circle',
    warning: 'warning',
    critical: 'error',
    offline: 'sensors_off',
  };
  return icons[status];
}

/**
 * Get status color class
 */
export function getStatusColorClass(status: SensorStatus): string {
  return `status-${status}`;
}

