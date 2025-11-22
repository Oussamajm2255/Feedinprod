import {
  extractValueFromReading,
  findLatestReading,
  calculateSensorStatus,
  getStatusIcon,
  getStatusColorClass,
  SensorWithThresholds,
} from './sensor-status.util';
import { SensorReading } from '../../../../core/models/farm.model';

describe('SensorStatusUtil', () => {
  describe('extractValueFromReading', () => {
    it('should extract value1 for temperature sensors', () => {
      const reading: SensorReading = {
        id: 1,
        sensor_id: 'T1',
        value1: 25,
        value2: 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(extractValueFromReading(reading, 'temperature', '°C')).toBe(25);
    });

    it('should extract value2 for humidity sensors', () => {
      const reading: SensorReading = {
        id: 1,
        sensor_id: 'H1',
        value1: 25,
        value2: 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(extractValueFromReading(reading, 'humidity', '%')).toBe(60);
    });

    it('should fallback to value1 when only one value present', () => {
      const reading: SensorReading = {
        id: 1,
        sensor_id: 'T1',
        value1: 25,
        value2: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(extractValueFromReading(reading, 'temperature', '°C')).toBe(25);
    });

    it('should return 0 when no values present', () => {
      const reading: SensorReading = {
        id: 1,
        sensor_id: 'T1',
        value1: null,
        value2: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(extractValueFromReading(reading, 'temperature', '°C')).toBe(0);
    });
  });

  describe('findLatestReading', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const twoMinutesAgo = new Date(now.getTime() - 120000);

    const readings: SensorReading[] = [
      {
        id: 1,
        sensor_id: 'T1',
        value1: 20,
        value2: null,
        createdAt: twoMinutesAgo.toISOString(),
        updatedAt: twoMinutesAgo.toISOString(),
      },
      {
        id: 2,
        sensor_id: 'T1',
        value1: 25,
        value2: 60,
        createdAt: oneMinuteAgo.toISOString(),
        updatedAt: oneMinuteAgo.toISOString(),
      },
      {
        id: 3,
        sensor_id: 'T1',
        value1: 30,
        value2: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 4,
        sensor_id: 'T2',
        value1: 15,
        value2: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    it('should return null when no readings for sensor', () => {
      expect(findLatestReading('T999', readings, 'temperature', '°C')).toBeNull();
    });

    it('should prefer composite readings (both value1 and value2)', () => {
      const latest = findLatestReading('T1', readings, 'temperature', '°C');
      expect(latest?.id).toBe(2);
      expect(latest?.value1).toBe(25);
      expect(latest?.value2).toBe(60);
    });

    it('should return latest reading when no composite available', () => {
      const latest = findLatestReading('T2', readings, 'temperature', '°C');
      expect(latest?.id).toBe(4);
    });
  });

  describe('calculateSensorStatus', () => {
    const i18nMessages = {
      offline: 'No data',
      optimal: 'Optimal',
      belowMin: 'Below minimum',
      aboveMax: 'Above maximum',
      belowOptimal: 'Below optimal',
      aboveOptimal: 'Above optimal',
    };

    const sensor: SensorWithThresholds = {
      id: 1,
      sensor_id: 'T1',
      device_id: 'D1',
      type: 'temperature',
      unit: '°C',
      min_critical: 0,
      max_critical: 50,
      min_warning: 18,
      max_warning: 28,
    };

    it('should return offline status when no readings', () => {
      const result = calculateSensorStatus(sensor, [], i18nMessages);
      expect(result.status).toBe('offline');
      expect(result.message).toBe('No data');
      expect(result.value).toBe(0);
    });

    it('should return normal status for values in optimal range', () => {
      const readings: SensorReading[] = [
        {
          id: 1,
          sensor_id: 'T1',
          value1: 22,
          value2: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const result = calculateSensorStatus(sensor, readings, i18nMessages);
      expect(result.status).toBe('normal');
      expect(result.message).toBe('Optimal');
      expect(result.value).toBe(22);
    });

    it('should return warning status for values outside optimal but within critical', () => {
      const readings: SensorReading[] = [
        {
          id: 1,
          sensor_id: 'T1',
          value1: 15,
          value2: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const result = calculateSensorStatus(sensor, readings, i18nMessages);
      expect(result.status).toBe('warning');
      expect(result.message).toBe('Below optimal');
    });

    it('should return critical status for values below minimum', () => {
      const readings: SensorReading[] = [
        {
          id: 1,
          sensor_id: 'T1',
          value1: -5,
          value2: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const result = calculateSensorStatus(sensor, readings, i18nMessages);
      expect(result.status).toBe('critical');
      expect(result.message).toBe('Below minimum');
    });

    it('should return critical status for values above maximum', () => {
      const readings: SensorReading[] = [
        {
          id: 1,
          sensor_id: 'T1',
          value1: 55,
          value2: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const result = calculateSensorStatus(sensor, readings, i18nMessages);
      expect(result.status).toBe('critical');
      expect(result.message).toBe('Above maximum');
    });

    it('should calculate percentage correctly', () => {
      const readings: SensorReading[] = [
        {
          id: 1,
          sensor_id: 'T1',
          value1: 25,
          value2: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const result = calculateSensorStatus(sensor, readings, i18nMessages);
      expect(result.percentage).toBe(50);
    });
  });

  describe('getStatusIcon', () => {
    it('should return correct icons for each status', () => {
      expect(getStatusIcon('normal')).toBe('check_circle');
      expect(getStatusIcon('warning')).toBe('warning');
      expect(getStatusIcon('critical')).toBe('error');
      expect(getStatusIcon('offline')).toBe('sensors_off');
    });
  });

  describe('getStatusColorClass', () => {
    it('should return correct CSS classes for each status', () => {
      expect(getStatusColorClass('normal')).toBe('status-normal');
      expect(getStatusColorClass('warning')).toBe('status-warning');
      expect(getStatusColorClass('critical')).toBe('status-critical');
      expect(getStatusColorClass('offline')).toBe('status-offline');
    });
  });
});

