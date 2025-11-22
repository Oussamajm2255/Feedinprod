/**
 * Sensor Thresholds Utility
 * Pure functions for threshold calculations and defaults
 */

export interface ThresholdConfig {
  min: number;
  max: number;
  optimal_min: number;
  optimal_max: number;
}

const DEFAULT_THRESHOLDS: Record<string, ThresholdConfig> = {
  temperature: { min: 0, max: 50, optimal_min: 18, optimal_max: 28 },
  humidity: { min: 0, max: 100, optimal_min: 40, optimal_max: 70 },
  soil_moisture: { min: 0, max: 100, optimal_min: 30, optimal_max: 80 },
  ph: { min: 0, max: 14, optimal_min: 6, optimal_max: 7.5 },
  light: { min: 0, max: 100000, optimal_min: 10000, optimal_max: 50000 },
  pressure: { min: 900, max: 1100, optimal_min: 1000, optimal_max: 1020 },
};

export function getThresholdConfig(sensorType: string): ThresholdConfig {
  return DEFAULT_THRESHOLDS[sensorType.toLowerCase()] || {
    min: 0,
    max: 100,
    optimal_min: 30,
    optimal_max: 70,
  };
}

export function getThresholdValue(
  sensorType: string,
  key: keyof ThresholdConfig
): number {
  return getThresholdConfig(sensorType)[key];
}

export function normalizeThresholds(
  sensorType: string,
  customThresholds?: Partial<ThresholdConfig>
): ThresholdConfig {
  const defaults = getThresholdConfig(sensorType);
  return {
    min: customThresholds?.min ?? defaults.min,
    max: customThresholds?.max ?? defaults.max,
    optimal_min: customThresholds?.optimal_min ?? defaults.optimal_min,
    optimal_max: customThresholds?.optimal_max ?? defaults.optimal_max,
  };
}

export function calculatePercentage(
  value: number,
  min: number,
  max: number
): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export function isInOptimalRange(
  value: number,
  optimalMin: number,
  optimalMax: number
): boolean {
  return value >= optimalMin && value <= optimalMax;
}

export function isInCriticalRange(
  value: number,
  min: number,
  max: number
): boolean {
  return value < min || value > max;
}

