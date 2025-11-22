/**
 * Readings Map Service
 * Indexes sensor readings for fast lookup and chart generation
 */

import { Injectable, signal, computed } from '@angular/core';
import { SensorReading } from '../../../../core/models/farm.model';

export interface ReadingsByTime {
  timestamp: number;
  readings: SensorReading[];
}

@Injectable({ providedIn: 'root' })
export class ReadingsMapService {
  // Raw readings signal
  private readingsSignal = signal<SensorReading[]>([]);

  // Indexed by sensor_id
  readonly readingsBySensorId = computed(() => {
    const map = new Map<string, SensorReading[]>();
    for (const reading of this.readingsSignal()) {
      const existing = map.get(reading.sensor_id) || [];
      existing.push(reading);
      map.set(reading.sensor_id, existing);
    }
    // Sort each sensor's readings by time (newest first)
    map.forEach((readings) => {
      readings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    return map;
  });

  // Latest reading per sensor
  readonly latestReadingsBySensorId = computed(() => {
    const map = new Map<string, SensorReading>();
    this.readingsBySensorId().forEach((readings, sensorId) => {
      if (readings.length > 0) {
        map.set(sensorId, readings[0]);
      }
    });
    return map;
  });

  /**
   * Update readings
   */
  setReadings(readings: SensorReading[]): void {
    this.readingsSignal.set(readings);
  }

  /**
   * Get readings for a specific sensor within time range
   */
  getReadingsForSensor(
    sensorId: string,
    timeRangeMs: number
  ): { timestamp: Date; value: number }[] {
    const now = Date.now();
    const cutoff = now - timeRangeMs;
    const readings = this.readingsBySensorId().get(sensorId) || [];

    return readings
      .filter((r) => new Date(r.createdAt).getTime() >= cutoff)
      .map((r) => ({
        timestamp: new Date(r.createdAt),
        value: r.value1 ?? 0,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get chart data for multiple sensors
   */
  getChartDataForSensors(
    sensorIds: string[],
    timeRangeMs: number,
    sensorNames: Map<string, string>
  ): Array<{ name: string; series: Array<{ name: Date; value: number }> }> {
    return sensorIds
      .map((sensorId) => {
        const readings = this.getReadingsForSensor(sensorId, timeRangeMs);
        if (readings.length === 0) return null;

        return {
          name: sensorNames.get(sensorId) || sensorId,
          series: readings.map((r) => ({ name: r.timestamp, value: r.value })),
        };
      })
      .filter((s) => s !== null) as Array<{
      name: string;
      series: Array<{ name: Date; value: number }>;
    }>;
  }
}

