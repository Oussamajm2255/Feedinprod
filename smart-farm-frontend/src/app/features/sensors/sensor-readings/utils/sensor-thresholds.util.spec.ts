import {
  getThresholdConfig,
  getThresholdValue,
  normalizeThresholds,
  calculatePercentage,
  isInOptimalRange,
  isInCriticalRange,
} from './sensor-thresholds.util';

describe('SensorThresholdsUtil', () => {
  describe('getThresholdConfig', () => {
    it('should return temperature thresholds', () => {
      const config = getThresholdConfig('temperature');
      expect(config).toEqual({
        min: 0,
        max: 50,
        optimal_min: 18,
        optimal_max: 28,
      });
    });

    it('should return humidity thresholds', () => {
      const config = getThresholdConfig('humidity');
      expect(config).toEqual({
        min: 0,
        max: 100,
        optimal_min: 40,
        optimal_max: 70,
      });
    });

    it('should return default thresholds for unknown type', () => {
      const config = getThresholdConfig('unknown_type');
      expect(config).toEqual({
        min: 0,
        max: 100,
        optimal_min: 30,
        optimal_max: 70,
      });
    });

    it('should be case-insensitive', () => {
      const config1 = getThresholdConfig('TEMPERATURE');
      const config2 = getThresholdConfig('Temperature');
      expect(config1).toEqual(config2);
    });
  });

  describe('getThresholdValue', () => {
    it('should return specific threshold value', () => {
      const minTemp = getThresholdValue('temperature', 'min');
      expect(minTemp).toBe(0);

      const maxTemp = getThresholdValue('temperature', 'max');
      expect(maxTemp).toBe(50);
    });
  });

  describe('normalizeThresholds', () => {
    it('should use defaults when no custom thresholds provided', () => {
      const normalized = normalizeThresholds('temperature');
      expect(normalized).toEqual({
        min: 0,
        max: 50,
        optimal_min: 18,
        optimal_max: 28,
      });
    });

    it('should merge custom thresholds with defaults', () => {
      const normalized = normalizeThresholds('temperature', {
        min: 5,
        optimal_min: 20,
      });
      expect(normalized).toEqual({
        min: 5,
        max: 50,
        optimal_min: 20,
        optimal_max: 28,
      });
    });

    it('should override all defaults when custom values provided', () => {
      const normalized = normalizeThresholds('temperature', {
        min: 10,
        max: 40,
        optimal_min: 15,
        optimal_max: 30,
      });
      expect(normalized).toEqual({
        min: 10,
        max: 40,
        optimal_min: 15,
        optimal_max: 30,
      });
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(25, 0, 100)).toBe(25);
      expect(calculatePercentage(50, 0, 100)).toBe(50);
      expect(calculatePercentage(100, 0, 100)).toBe(100);
    });

    it('should clamp values below 0', () => {
      expect(calculatePercentage(-10, 0, 100)).toBe(0);
    });

    it('should clamp values above 100', () => {
      expect(calculatePercentage(150, 0, 100)).toBe(100);
    });

    it('should handle equal min and max', () => {
      expect(calculatePercentage(50, 50, 50)).toBe(0);
    });

    it('should work with different ranges', () => {
      expect(calculatePercentage(25, 0, 50)).toBe(50);
      expect(calculatePercentage(15, 10, 20)).toBe(50);
    });
  });

  describe('isInOptimalRange', () => {
    it('should return true when value is in optimal range', () => {
      expect(isInOptimalRange(25, 20, 30)).toBe(true);
      expect(isInOptimalRange(20, 20, 30)).toBe(true);
      expect(isInOptimalRange(30, 20, 30)).toBe(true);
    });

    it('should return false when value is outside optimal range', () => {
      expect(isInOptimalRange(19, 20, 30)).toBe(false);
      expect(isInOptimalRange(31, 20, 30)).toBe(false);
    });
  });

  describe('isInCriticalRange', () => {
    it('should return true when value is below min', () => {
      expect(isInCriticalRange(-5, 0, 50)).toBe(true);
    });

    it('should return true when value is above max', () => {
      expect(isInCriticalRange(55, 0, 50)).toBe(true);
    });

    it('should return false when value is within range', () => {
      expect(isInCriticalRange(25, 0, 50)).toBe(false);
      expect(isInCriticalRange(0, 0, 50)).toBe(false);
      expect(isInCriticalRange(50, 0, 50)).toBe(false);
    });
  });
});

