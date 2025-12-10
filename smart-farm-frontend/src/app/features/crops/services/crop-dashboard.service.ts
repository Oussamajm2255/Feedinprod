import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Crop, Sensor, SensorReading } from '../../../core/models/farm.model';
import { ActionLog } from '../../../core/models/action-log.model';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export interface CropKPIs {
  yield: number;
  yieldUnit: string;
  growthStage: string;
  irrigationStatus: string;
  healthScore: number;
}

export interface CropAnalytics {
  soilMoisture: { timestamp: Date; value: number }[];
  temperature: { timestamp: Date; value: number }[];
  humidity: { timestamp: Date; value: number }[];
  sunlight: { timestamp: Date; value: number }[];
}

export interface CropEvent {
  id: string;
  timestamp: Date;
  type: 'irrigation' | 'fertilizer' | 'disease' | 'action';
  description: string;
  status: 'success' | 'warning' | 'error';
}

export interface SustainabilityMetrics {
  waterSaved: number;
  energySaved: number;
  co2Reduction: number;
  irrigationEfficiency: number;
}

@Injectable({
  providedIn: 'root'
})
export class CropDashboardService {
  private apiService = inject(ApiService);
  private readonly STORAGE_KEY = 'selected-crop-id';

  // Signals for reactive state
  selectedCropId = signal<string | null>(this.loadSelectedCropFromStorage());
  crops = signal<Crop[]>([]);
  selectedCrop = computed(() => {
    const id = this.selectedCropId();
    if (!id) return null;
    return this.crops().find(c => c.crop_id === id) || null;
  });

  constructor() {
    // Crops will be loaded by the component when needed
  }

  private loadSelectedCropFromStorage(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private saveSelectedCropToStorage(cropId: string | null): void {
    try {
      if (cropId) {
        localStorage.setItem(this.STORAGE_KEY, cropId);
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  loadCrops(): Observable<Crop[]> {
    console.log('[CropDashboardService] Loading crops...');
    return this.apiService.getCrops().pipe(
      map(crops => {
        console.log('[CropDashboardService] Crops loaded:', crops.length);
        this.crops.set(crops);
        return crops;
      }),
      catchError((err) => {
        console.error('[CropDashboardService] Error loading crops:', err);
        this.crops.set([]);
        return of([]);
      })
    );
  }

  selectCrop(cropId: string | null): void {
    this.selectedCropId.set(cropId);
    this.saveSelectedCropToStorage(cropId);
  }

  /**
   * Get KPIs for selected crop
   */
  getCropKPIs(cropId: string): Observable<CropKPIs> {
    return this.apiService.getCrop(cropId).pipe(
      map(crop => {
        // Calculate KPIs from crop data
        const kpis: CropKPIs = {
          yield: 0, // Would be calculated from actual data
          yieldUnit: 'kg',
          growthStage: crop.status || 'growing',
          irrigationStatus: 'Active',
          healthScore: 85 // Would be calculated from sensor readings
        };
        return kpis;
      }),
      catchError(() => of({
        yield: 0,
        yieldUnit: 'kg',
        growthStage: 'unknown',
        irrigationStatus: 'Unknown',
        healthScore: 0
      }))
    );
  }

  /**
   * Get sensors associated with the crop
   */
  getCropSensors(cropId: string): Observable<Sensor[]> {
    return this.apiService.getSensors().pipe(
      map(sensors => sensors.filter(s => s.crop_id === cropId)),
      catchError(() => of([]))
    );
  }

  /**
   * Get analytics data for crop sensors
   * PERFORMANCE FIX: Limited to last 50 readings to prevent freeze
   */
  getCropAnalytics(cropId: string, limit: number = 50): Observable<CropAnalytics> {
    console.log('[CropDashboardService] Getting analytics with limit:', limit);
    return this.getCropSensors(cropId).pipe(
      map(sensors => {
        console.log('[CropDashboardService] Processing', sensors.length, 'sensors');
        
        // Group sensors by type
        const soilSensor = sensors.find(s => s.type.toLowerCase().includes('soil') || s.type.toLowerCase().includes('moisture'));
        const tempSensor = sensors.find(s => s.type.toLowerCase().includes('temp'));
        const humiditySensor = sensors.find(s => s.type.toLowerCase().includes('humid'));
        const lightSensor = sensors.find(s => s.type.toLowerCase().includes('light'));

        // Create analytics structure with limited readings
        const analytics: CropAnalytics = {
          soilMoisture: this.extractReadings(soilSensor, limit),
          temperature: this.extractReadings(tempSensor, limit),
          humidity: this.extractReadings(humiditySensor, limit),
          sunlight: this.extractReadings(lightSensor, limit)
        };

        console.log('[CropDashboardService] Analytics processed:', {
          soil: analytics.soilMoisture.length,
          temp: analytics.temperature.length,
          humidity: analytics.humidity.length,
          light: analytics.sunlight.length
        });

        return analytics;
      }),
      catchError((err) => {
        console.error('[CropDashboardService] Error in getCropAnalytics:', err);
        return of({
          soilMoisture: [],
          temperature: [],
          humidity: [],
          sunlight: []
        });
      })
    );
  }

  /**
   * Extract and limit sensor readings to prevent performance issues
   * CRITICAL FIX: Only processes last N readings to avoid freezing
   */
  private extractReadings(sensor: Sensor | undefined, limit: number = 50): { timestamp: Date; value: number }[] {
    if (!sensor || !sensor.readings || sensor.readings.length === 0) {
      return [];
    }

    const totalReadings = sensor.readings.length;
    console.log(`[CropDashboardService] Sensor ${sensor.sensor_id}: ${totalReadings} readings (limiting to ${limit})`);

    // CRITICAL: Only take the last N readings to prevent freezing with large datasets
    const recentReadings = sensor.readings.slice(-limit);

    const processed = recentReadings.map(r => ({
      timestamp: new Date(r.createdAt),
      value: r.value1 || 0
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return processed;
  }

  /**
   * Get recent events/actions for the crop
   */
  getCropEvents(cropId: string, limit: number = 20): Observable<CropEvent[]> {
    // Get sensors for this crop first
    return this.getCropSensors(cropId).pipe(
      map(sensors => {
        const sensorIds = sensors.map(s => s.sensor_id);
        
        // In a real implementation, we'd fetch actions filtered by these sensor IDs
        // For now, return empty array as placeholder
        const events: CropEvent[] = [];
        
        return events;
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Calculate sustainability metrics
   */
  getSustainabilityMetrics(cropId: string): Observable<SustainabilityMetrics> {
    return of({
      waterSaved: 150, // L - would be calculated from actual irrigation data
      energySaved: 12, // kWh - would be calculated from device usage
      co2Reduction: 8, // kg - would be calculated based on efficiency
      irrigationEfficiency: 82 // % - would be calculated from sensor data
    });
  }

  /**
   * Execute an action for the crop
   */
  executeAction(cropId: string, action: string): Observable<any> {
    // Get the first sensor associated with this crop to determine device
    return this.getCropSensors(cropId).pipe(
      switchMap(sensors => {
        if (sensors.length === 0) {
          throw new Error('No sensors found for this crop');
        }
        
        const sensor = sensors[0];
        return this.apiService.executeAction({
          deviceId: sensor.device_id,
          action: action,
          actionType: 'normal',
          context: {
            sensorId: sensor.sensor_id,
            sensorType: sensor.type
          }
        });
      }),
      catchError(err => {
        console.error('Error executing action:', err);
        return of({ ok: false });
      })
    );
  }

  /**
   * Get crop comparison data
   */
  getCropComparison(): Observable<any[]> {
    return this.apiService.getCrops().pipe(
      map(crops => {
        // Return comparison data structure
        return crops.map(crop => ({
          crop_id: crop.crop_id,
          name: crop.name,
          status: crop.status,
          planted: crop.planting_date,
          expectedHarvest: crop.expected_harvest_date
        }));
      }),
      catchError(() => of([]))
    );
  }
}

