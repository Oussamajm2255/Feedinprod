import { TestBed } from '@angular/core/testing';
import { ReadingsMapService } from './readings-map.service';
import { SensorReading } from '../../../../core/models/farm.model';

describe('ReadingsMapService', () => {
  let service: ReadingsMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReadingsMapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setReadings and readingsBySensorId', () => {
    it('should index readings by sensor_id', () => {
      const now = new Date();
      const readings: SensorReading[] = [
        {
          id: 1,
          sensor_id: 'T1',
          value1: 20,
          value2: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: 2,
          sensor_id: 'T1',
          value1: 25,
          value2: null,
          createdAt: new Date(now.getTime() + 1000).toISOString(),
          updatedAt: new Date(now.getTime() + 1000).toISOString(),
        },
        {
          id: 3,
          sensor_id: 'T2',
          value1: 30,
          value2: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];

      service.setReadings(readings);

      const indexed = service.readingsBySensorId();
      expect(indexed.size).toBe(2);
      expect(indexed.get('T1')?.length).toBe(2);
      expect(indexed.get('T2')?.length).toBe(1);
    });

    it('should sort readings by time (newest first)', () => {
      const now = new Date();
      const readings: SensorReading[] = [
        {
          id: 1,
          sensor_id: 'T1',
          value1: 20,
          value2: null,
          createdAt: new Date(now.getTime() - 2000).toISOString(),
          updatedAt: new Date(now.getTime() - 2000).toISOString(),
        },
        {
          id: 2,
          sensor_id: 'T1',
          value1: 25,
          value2: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: 3,
          sensor_id: 'T1',
          value1: 22,
          value2: null,
          createdAt: new Date(now.getTime() - 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 1000).toISOString(),
        },
      ];

      service.setReadings(readings);

      const indexed = service.readingsBySensorId();
      const t1Readings = indexed.get('T1')!;
      expect(t1Readings[0].id).toBe(2); // newest
      expect(t1Readings[1].id).toBe(3);
      expect(t1Readings[2].id).toBe(1); // oldest
    });
  });

  describe('latestReadingsBySensorId', () => {
    it('should return latest reading per sensor', () => {
      const now = new Date();
      const readings: SensorReading[] = [
        {
          id: 1,
          sensor_id: 'T1',
          value1: 20,
          value2: null,
          createdAt: new Date(now.getTime() - 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 1000).toISOString(),
        },
        {
          id: 2,
          sensor_id: 'T1',
          value1: 25,
          value2: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: 3,
          sensor_id: 'T2',
          value1: 30,
          value2: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];

      service.setReadings(readings);

      const latest = service.latestReadingsBySensorId();
      expect(latest.get('T1')?.id).toBe(2);
      expect(latest.get('T2')?.id).toBe(3);
    });
  });

  describe('getReadingsForSensor', () => {
    it('should filter readings by time range', () => {
      const now = Date.now();
      const readings: SensorReading[] = [
        {
          id: 1,
          sensor_id: 'T1',
          value1: 20,
          value2: null,
          createdAt: new Date(now - 5000).toISOString(),
          updatedAt: new Date(now - 5000).toISOString(),
        },
        {
          id: 2,
          sensor_id: 'T1',
          value1: 25,
          value2: null,
          createdAt: new Date(now - 2000).toISOString(),
          updatedAt: new Date(now - 2000).toISOString(),
        },
        {
          id: 3,
          sensor_id: 'T1',
          value1: 30,
          value2: null,
          createdAt: new Date(now - 10000).toISOString(),
          updatedAt: new Date(now - 10000).toISOString(),
        },
      ];

      service.setReadings(readings);

      const result = service.getReadingsForSensor('T1', 6000);
      expect(result.length).toBe(2);
      expect(result[0].value).toBe(20);
      expect(result[1].value).toBe(25);
    });

    it('should return empty array for unknown sensor', () => {
      service.setReadings([]);
      const result = service.getReadingsForSensor('UNKNOWN', 60000);
      expect(result).toEqual([]);
    });

    it('should sort results by time (oldest first)', () => {
      const now = Date.now();
      const readings: SensorReading[] = [
        {
          id: 2,
          sensor_id: 'T1',
          value1: 25,
          value2: null,
          createdAt: new Date(now - 2000).toISOString(),
          updatedAt: new Date(now - 2000).toISOString(),
        },
        {
          id: 1,
          sensor_id: 'T1',
          value1: 20,
          value2: null,
          createdAt: new Date(now - 5000).toISOString(),
          updatedAt: new Date(now - 5000).toISOString(),
        },
      ];

      service.setReadings(readings);

      const result = service.getReadingsForSensor('T1', 10000);
      expect(result[0].value).toBe(20); // oldest
      expect(result[1].value).toBe(25); // newest
    });
  });

  describe('getChartDataForSensors', () => {
    it('should format data for ngx-charts', () => {
      const now = Date.now();
      const readings: SensorReading[] = [
        {
          id: 1,
          sensor_id: 'T1',
          value1: 20,
          value2: null,
          createdAt: new Date(now - 2000).toISOString(),
          updatedAt: new Date(now - 2000).toISOString(),
        },
        {
          id: 2,
          sensor_id: 'T1',
          value1: 25,
          value2: null,
          createdAt: new Date(now).toISOString(),
          updatedAt: new Date(now).toISOString(),
        },
      ];

      service.setReadings(readings);

      const names = new Map([['T1', 'Temperature Sensor']]);
      const chartData = service.getChartDataForSensors(['T1'], 10000, names);

      expect(chartData.length).toBe(1);
      expect(chartData[0].name).toBe('Temperature Sensor');
      expect(chartData[0].series.length).toBe(2);
      expect(chartData[0].series[0].value).toBe(20);
      expect(chartData[0].series[1].value).toBe(25);
    });

    it('should filter out sensors with no data', () => {
      service.setReadings([]);
      const names = new Map([
        ['T1', 'Temp 1'],
        ['T2', 'Temp 2'],
      ]);
      const chartData = service.getChartDataForSensors(['T1', 'T2'], 10000, names);
      expect(chartData.length).toBe(0);
    });

    it('should use sensor_id as fallback name', () => {
      const now = Date.now();
      const readings: SensorReading[] = [
        {
          id: 1,
          sensor_id: 'T1',
          value1: 20,
          value2: null,
          createdAt: new Date(now).toISOString(),
          updatedAt: new Date(now).toISOString(),
        },
      ];

      service.setReadings(readings);

      const names = new Map();
      const chartData = service.getChartDataForSensors(['T1'], 10000, names);

      expect(chartData[0].name).toBe('T1');
    });
  });
});

