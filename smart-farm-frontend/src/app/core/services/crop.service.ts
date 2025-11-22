import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { Observable, BehaviorSubject, forkJoin, of, combineLatest, timer } from 'rxjs';
import { map, tap, catchError, shareReplay, switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import { Crop, CropStatus, Sensor, SensorReading, Device } from '../models/farm.model';

/**
 * Extended Crop Dashboard Data - Optimized structure
 */
export interface CropDashboardData {
  crop: Crop;
  sensors: SensorWithReading[];
  devices: Device[];
  kpis: CropKPIs;
  healthStatus: HealthStatus;
  statistics: CropStatistics;
}

export interface CropKPIs {
  totalCrops: number;
  healthyCount: number;
  stressedCount: number;
  avgSoilMoisture: number | null;
  avgTemperature: number | null;
  avgHumidity: number | null;
  totalSensors: number;
  activeSensors: number;
  lastUpdated: Date | null;
  currentGrowthStage: string;
}

// Use intersection type for better TypeScript resolution
export type SensorWithReading = Sensor & {
  latestReading?: SensorReading;
  weeklyTrend?: number[]; // Last 7 readings for sparkline
  status: SensorStatus;
  isActive: boolean;
};

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export type SensorStatus = 'normal' | 'warning' | 'critical' | 'offline';
export type KPIFilter = 'all' | 'healthy' | 'stressed' | 'moisture' | 'temperature' | 'humidity';

export interface CropStatistics {
  last7Days: {
    avgMoisture: number | null;
    avgTemp: number | null;
    avgHumidity: number | null;
  };
  last30Days: {
    avgMoisture: number | null;
    avgTemp: number | null;
    avgHumidity: number | null;
  };
  trends: {
    moisture: 'up' | 'down' | 'stable';
    temperature: 'up' | 'down' | 'stable';
    humidity: 'up' | 'down' | 'stable';
  };
}

@Injectable({
  providedIn: 'root'
})
export class CropService {
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  // ============================================
  // SIGNALS - Single Source of Truth
  // ============================================
  private _selectedCropId = signal<string | null>(null);
  private _crops = signal<Crop[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _dashboardData = signal<CropDashboardData | null>(null);

  // Public readonly signals
  readonly selectedCropId = this._selectedCropId.asReadonly();
  readonly crops = this._crops.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly dashboardData = this._dashboardData.asReadonly();

  // ============================================
  // COMPUTED VALUES - Auto-memoized
  // ============================================
  readonly selectedCrop = computed(() => {
    const id = this._selectedCropId();
    return this._crops().find(c => c.crop_id === id) || null;
  });

  readonly healthyCrops = computed(() =>
    this._crops().filter(c =>
      c.status === CropStatus.GROWING || c.status === CropStatus.PLANTED
    )
  );

  readonly stressedCrops = computed(() =>
    this._crops().filter(c =>
      c.status === CropStatus.FAILED
    )
  );

  readonly totalCrops = computed(() => this._crops().length);

  readonly healthyRatio = computed(() => {
    const total = this.totalCrops();
    if (total === 0) return 0;
    return (this.healthyCrops().length / total) * 100;
  });

  readonly globalKPIs = computed((): CropKPIs => {
    const data = this._dashboardData();
    if (!data) {
      return {
        totalCrops: this.totalCrops(),
        healthyCount: this.healthyCrops().length,
        stressedCount: this.stressedCrops().length,
        avgSoilMoisture: null,
        avgTemperature: null,
        avgHumidity: null,
        totalSensors: 0,
        activeSensors: 0,
        lastUpdated: null,
        currentGrowthStage: 'Unknown'
      };
    }
    return data.kpis;
  });

  // ============================================
  // CACHE MANAGEMENT - Prevent Redundant Calls
  // ============================================
  private dashboardCache = new Map<string, Observable<CropDashboardData>>();
  private sensorReadingsCache = new Map<string, Observable<SensorReading[]>>();

  // Cache TTL (5 minutes)
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private cacheTimestamps = new Map<string, number>();

  constructor() {}

  /**
   * Load all crops - called once on init
   */
  loadCrops(): Observable<Crop[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.apiService.getCrops().pipe(
      tap(crops => {
        this._crops.set(crops);
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.message || 'Failed to load crops');
        this._loading.set(false);
        return of([]);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  /**
   * Select a crop by ID
   */
  selectCrop(cropId: string): void {
    this._selectedCropId.set(cropId);
  }

  /**
   * Clear selected crop
   */
  clearSelection(): void {
    this._selectedCropId.set(null);
    this._dashboardData.set(null);
  }

  /**
   * PRIMARY METHOD: Get full dashboard data
   * OPTIMIZED: Single batch request, cached, no nested calls
   */
  getCropDashboard(cropId: string, forceRefresh = false): Observable<CropDashboardData> {
    // Check cache validity
    const cacheKey = `dashboard_${cropId}`;
    const cachedTime = this.cacheTimestamps.get(cacheKey);
    const isCacheValid = cachedTime && (Date.now() - cachedTime) < this.CACHE_TTL;

    if (!forceRefresh && isCacheValid && this.dashboardCache.has(cacheKey)) {
      return this.dashboardCache.get(cacheKey)!;
    }

    this._loading.set(true);
    this._error.set(null);

    // CRITICAL: Use forkJoin for parallel requests (NOT sequential)
    const dashboard$ = forkJoin({
      crop: this.apiService.getCrop(cropId),
      sensors: this.apiService.getSensorsByCrop(cropId, false),
      allCrops: of(this._crops()) // Use cached crops
    }).pipe(
      // CRITICAL: Use switchMap to get sensor readings AFTER sensors load
      switchMap(({ crop, sensors, allCrops }) => {
        // Fetch latest reading for each sensor in PARALLEL
        const readingRequests = sensors.map(sensor =>
          this.apiService.getLatestReading(sensor.sensor_id).pipe(
            catchError(() => of(null)) // Don't fail entire request if one sensor fails
          )
        );

        return forkJoin({
          crop: of(crop),
          sensors: of(sensors),
          latestReadings: readingRequests.length > 0 ? forkJoin(readingRequests) : of([]),
          allCrops: of(allCrops)
        });
      }),
      // Transform raw data into dashboard structure
      map(({ crop, sensors, latestReadings, allCrops }) => {
        const sensorsWithReadings = this.enrichSensorsWithReadings(sensors, latestReadings);
        const kpis = this.calculateKPIs(crop, sensorsWithReadings, allCrops);
        const healthStatus = this.determineHealthStatus(crop, sensorsWithReadings);
        const statistics = this.calculateStatistics(sensorsWithReadings);

        return {
          crop,
          sensors: sensorsWithReadings,
          devices: [], // TODO: Fetch related devices if needed
          kpis,
          healthStatus,
          statistics
        } as CropDashboardData;
      }),
      tap(data => {
        this._dashboardData.set(data);
        this._loading.set(false);
        this.cacheTimestamps.set(cacheKey, Date.now());
      }),
      catchError(err => {
        this._error.set('Failed to load crop dashboard');
        this._loading.set(false);
        console.error('Dashboard error:', err);
        throw err;
      }),
      shareReplay(1), // Share result among multiple subscribers
      takeUntilDestroyed(this.destroyRef)
    );

    this.dashboardCache.set(cacheKey, dashboard$);
    return dashboard$;
  }

  /**
   * Get sensor readings for charts - with date range
   * OPTIMIZED: Cached, limited data points
   */
  getSensorReadingsForChart(
    sensorId: string,
    days: 7 | 30 = 7,
    forceRefresh = false
  ): Observable<SensorReading[]> {
    const cacheKey = `readings_${sensorId}_${days}`;
    const cachedTime = this.cacheTimestamps.get(cacheKey);
    const isCacheValid = cachedTime && (Date.now() - cachedTime) < this.CACHE_TTL;

    if (!forceRefresh && isCacheValid && this.sensorReadingsCache.has(cacheKey)) {
      return this.sensorReadingsCache.get(cacheKey)!;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // CRITICAL: Limit data points to prevent freeze
    const maxPoints = days === 7 ? 168 : 720; // 1 per hour for 7 days, or 1 per hour for 30 days

    const readings$ = this.apiService.getReadingsByDateRange(
      sensorId,
      startDate,
      endDate,
      maxPoints
    ).pipe(
      map(readings => {
        // Downsample if too many points (prevent chart freeze)
        if (readings.length > maxPoints) {
          return this.downsampleReadings(readings, maxPoints);
        }
        return readings;
      }),
      tap(() => this.cacheTimestamps.set(cacheKey, Date.now())),
      shareReplay(1),
      catchError(err => {
        console.error('Error loading sensor readings:', err);
        return of([]);
      }),
      takeUntilDestroyed(this.destroyRef)
    );

    this.sensorReadingsCache.set(cacheKey, readings$);
    return readings$;
  }

  /**
   * Get sensor statistics (pre-aggregated by backend)
   */
  getSensorStatistics(sensorId: string, days = 7): Observable<any> {
    return this.apiService.getSensorStatistics(sensorId, days).pipe(
      catchError(err => {
        console.error('Error loading sensor statistics:', err);
        return of(null);
      })
    );
  }

  /**
   * Update crop - invalidates cache
   */
  updateCrop(cropId: string, updates: Partial<Crop>): Observable<Crop> {
    return this.apiService.updateCrop(cropId, updates).pipe(
      tap(updatedCrop => {
        // Update local state
        const current = this._crops();
        const index = current.findIndex(c => c.crop_id === cropId);
        if (index >= 0) {
          current[index] = updatedCrop;
          this._crops.set([...current]);
        }
        // Invalidate cache
        this.invalidateCache(cropId);
      })
    );
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.dashboardCache.clear();
    this.sensorReadingsCache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Invalidate specific crop cache
   */
  private invalidateCache(cropId: string): void {
    const cacheKey = `dashboard_${cropId}`;
    this.dashboardCache.delete(cacheKey);
    this.cacheTimestamps.delete(cacheKey);
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Enrich sensors with latest readings and status
   */
  private enrichSensorsWithReadings(
    sensors: Sensor[],
    latestReadings: (SensorReading | null)[]
  ): SensorWithReading[] {
    return sensors.map((sensor, index) => {
      const reading = latestReadings[index];
      const status = this.getSensorStatus(sensor, reading);
      const isActive = reading !== null && this.isReadingRecent(reading);

      return {
        ...sensor,
        latestReading: reading || undefined,
        status,
        isActive,
        weeklyTrend: [] // Will be populated by chart component
      } as SensorWithReading;
    });
  }

  /**
   * Calculate comprehensive KPIs
   */
  private calculateKPIs(
    crop: Crop,
    sensors: SensorWithReading[],
    allCrops: Crop[]
  ): CropKPIs {
    const moistureSensors = sensors.filter(s => this.isSensorType(s, 'moisture'));
    const tempSensors = sensors.filter(s => this.isSensorType(s, 'temp'));
    const humiditySensors = sensors.filter(s => this.isSensorType(s, 'humidity'));

    const avgMoisture = this.calculateAverage(moistureSensors);
    const avgTemp = this.calculateAverage(tempSensors);
    const avgHumidity = this.calculateAverage(humiditySensors);

    const activeSensors = sensors.filter(s => s.isActive).length;
    const latestTimestamp = this.getLatestTimestamp(sensors);
    const growthStage = this.determineGrowthStage(crop);

    return {
      totalCrops: allCrops.length,
      healthyCount: allCrops.filter(c => c.status === CropStatus.GROWING || c.status === CropStatus.PLANTED).length,
      stressedCount: allCrops.filter(c => c.status === CropStatus.FAILED).length,
      avgSoilMoisture: avgMoisture,
      avgTemperature: avgTemp,
      avgHumidity: avgHumidity,
      totalSensors: sensors.length,
      activeSensors,
      lastUpdated: latestTimestamp,
      currentGrowthStage: growthStage
    };
  }

  /**
   * Calculate average from sensors with readings
   */
  private calculateAverage(sensors: SensorWithReading[]): number | null {
    const validReadings = sensors
      .filter(s => s.latestReading && s.latestReading.value1 !== undefined)
      .map(s => s.latestReading!.value1!);

    if (validReadings.length === 0) return null;

    const sum = validReadings.reduce((a, b) => a + b, 0);
    return sum / validReadings.length;
  }

  /**
   * Determine health status based on sensor thresholds
   */
  private determineHealthStatus(
    crop: Crop,
    sensors: SensorWithReading[]
  ): HealthStatus {
    if (sensors.length === 0) return 'unknown';

    const criticalSensors = sensors.filter(s => s.status === 'critical');
    const warningSensors = sensors.filter(s => s.status === 'warning');
    const offlineSensors = sensors.filter(s => s.status === 'offline');

    // If >50% sensors offline, unknown status
    if (offlineSensors.length > sensors.length * 0.5) return 'unknown';

    // If any critical
    if (criticalSensors.length > 0) return 'critical';

    // If >30% warning
    if (warningSensors.length > sensors.length * 0.3) return 'warning';

    return 'healthy';
  }

  /**
   * Get sensor status based on thresholds and latest reading
   */
  private getSensorStatus(sensor: Sensor, reading: SensorReading | null): SensorStatus {
    if (!reading || reading.value1 === undefined) return 'offline';

    const value = reading.value1;

    // Check critical thresholds
    if (sensor.min_critical !== null && sensor.min_critical !== undefined && value < sensor.min_critical) return 'critical';
    if (sensor.max_critical !== null && sensor.max_critical !== undefined && value > sensor.max_critical) return 'critical';

    // Check warning thresholds
    if (sensor.min_warning !== null && sensor.min_warning !== undefined && value < sensor.min_warning) return 'warning';
    if (sensor.max_warning !== null && sensor.max_warning !== undefined && value > sensor.max_warning) return 'warning';

    return 'normal';
  }

  /**
   * Check if reading is recent (within last hour)
   */
  private isReadingRecent(reading: SensorReading): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(reading.createdAt) > oneHourAgo;
  }

  /**
   * Check sensor type
   */
  private isSensorType(sensor: Sensor, type: string): boolean {
    return sensor.type.toLowerCase().includes(type.toLowerCase());
  }

  /**
   * Get latest timestamp from sensors
   */
  private getLatestTimestamp(sensors: SensorWithReading[]): Date | null {
    const timestamps = sensors
      .filter(s => s.latestReading)
      .map(s => new Date(s.latestReading!.createdAt));

    if (timestamps.length === 0) return null;

    return new Date(Math.max(...timestamps.map(d => d.getTime())));
  }

  /**
   * Determine growth stage based on planting date
   */
  private determineGrowthStage(crop: Crop): string {
    if (!crop.planting_date) return 'Unknown';

    const plantingDate = new Date(crop.planting_date);
    const daysSincePlanting = Math.floor((Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSincePlanting < 7) return 'Germination';
    if (daysSincePlanting < 30) return 'Seedling';
    if (daysSincePlanting < 60) return 'Vegetative';
    if (daysSincePlanting < 90) return 'Flowering';
    return 'Mature';
  }

  /**
   * Calculate statistics (placeholder)
   */
  private calculateStatistics(sensors: SensorWithReading[]): CropStatistics {
    // TODO: Implement trend calculation
    return {
      last7Days: {
        avgMoisture: null,
        avgTemp: null,
        avgHumidity: null
      },
      last30Days: {
        avgMoisture: null,
        avgTemp: null,
        avgHumidity: null
      },
      trends: {
        moisture: 'stable',
        temperature: 'stable',
        humidity: 'stable'
      }
    };
  }

  /**
   * Downsample readings to prevent chart freeze
   */
  private downsampleReadings(readings: SensorReading[], targetCount: number): SensorReading[] {
    if (readings.length <= targetCount) return readings;

    const step = Math.floor(readings.length / targetCount);
    return readings.filter((_, index) => index % step === 0);
  }
}
