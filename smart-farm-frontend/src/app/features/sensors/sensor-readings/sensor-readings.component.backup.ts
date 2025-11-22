import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { interval, Subscription, combineLatest } from 'rxjs';
import { curveBasis, curveLinear } from 'd3-shape';
import { switchMap, startWith } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { FarmManagementService } from '../../../core/services/farm-management.service';
import { SensorReading, Sensor, Device, Farm } from '../../../core/models/farm.model';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';

interface SensorWithThresholds extends Sensor {
  min_threshold?: number;
  max_threshold?: number;
  optimal_min?: number;
  optimal_max?: number;
  name?: string;
  sensor_type?: string;
}

interface SensorStatus {
  sensor: SensorWithThresholds;
  latestReading: SensorReading | null;
  status: 'normal' | 'warning' | 'critical' | 'offline';
  message: string;
  percentage: number;
  displayValue: number;
}

interface ChartData {
  name: string;
  series: { name: string; value: number }[];
}

@Component({
  selector: 'app-sensor-readings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    NgxChartsModule
  ],
  template: `
    <div class="sensor-readings-container">
      <!-- Simple Title -->
      <div class="page-title">
        <h1>{{ languageService.t()('sensorReadings.title') }}</h1>
        <p>{{ languageService.t()('sensorReadings.liveData') }}</p>
      </div>


      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>{{ languageService.t()('common.loading') }}</p>
      </div>

      <!-- Farm Overview Cards -->
      <div *ngIf="!loading() && farms().length > 0" class="farm-overview">
        <div *ngFor="let farm of filteredFarms()" class="farm-card">
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ farm.name }}</mat-card-title>
              <mat-card-subtitle>{{ farm.location }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="farm-status">
                <div class="status-indicator" [ngClass]="getFarmStatus(farm.farm_id).class">
                  <mat-icon>{{ getFarmStatus(farm.farm_id).icon }}</mat-icon>
                  <span>{{ getFarmStatus(farm.farm_id).text }}</span>
                </div>
                <div class="sensor-summary">
                  <span>{{ getSensorCount(farm.farm_id) }} {{ languageService.t()('sensors.title') }}</span>
                  <span>{{ getActiveReadings(farm.farm_id) }} {{ languageService.t()('sensorReadings.active') }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Sensor Status Grid -->
      <div *ngIf="!loading() && sensorStatuses().length > 0" class="sensors-grid">
        <div *ngFor="let sensorStatus of filteredSensorStatuses()" class="sensor-card">
          <mat-card [ngClass]="'status-' + sensorStatus.status">
            <mat-card-header>
              <div class="sensor-header">
                <div class="sensor-info">
                  <h3>{{ sensorStatus.sensor.name }}</h3>
                  <p>{{ sensorStatus.sensor.sensor_type }}</p>
                </div>
                <div class="status-badge" [ngClass]="'badge-' + sensorStatus.status">
                  <mat-icon>{{ getStatusIcon(sensorStatus.status) }}</mat-icon>
                </div>
              </div>
            </mat-card-header>
            <mat-card-content>
              <div class="reading-display">
                <div class="current-value">
                  <span class="value">{{ sensorStatus.displayValue }}</span>
                  <span class="unit">{{ sensorStatus.sensor.unit }}</span>
                </div>
                <div class="threshold-bar">
                  <div class="bar-container">
                    <div class="threshold-range optimal" 
                         [style.left.%]="getThresholdPosition(sensorStatus.sensor, sensorStatus.sensor.optimal_min || 0)"
                         [style.width.%]="getThresholdWidth(sensorStatus.sensor, sensorStatus.sensor.optimal_min || 0, sensorStatus.sensor.optimal_max || 100)">
                    </div>
                    <div class="current-position" 
                         [style.left.%]="getThresholdPosition(sensorStatus.sensor, sensorStatus.displayValue)">
                    </div>
                  </div>
                  <div class="threshold-labels">
                    <span>{{ sensorStatus.sensor.min_threshold ?? getThresholdForSensor(sensorStatus.sensor.sensor_type || sensorStatus.sensor.type, 'min') }}</span>
                    <span>{{ sensorStatus.sensor.max_threshold ?? getThresholdForSensor(sensorStatus.sensor.sensor_type || sensorStatus.sensor.type, 'max') }}</span>
                  </div>
                </div>
              </div>
              <div class="status-message">
                <mat-chip [ngClass]="'chip-' + sensorStatus.status">
                  {{ sensorStatus.message }}
                </mat-chip>
              </div>
              <div class="last-updated" *ngIf="sensorStatus.latestReading">
                {{ languageService.t()('sensorReadings.lastUpdated') }}: {{ sensorStatus.latestReading.createdAt | date:'short' }}
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Farm Health Summary (moved to bottom) -->
      <div *ngIf="!loading() && sensorStatuses().length > 0" class="health-summary">
        <mat-card class="health-hero" [ngClass]="overallHealthClass()">
          <div class="hero-left">
            <mat-icon class="hero-icon">{{ overallHealthIcon() }}</mat-icon>
            <div>
              <div class="hero-title">{{ overallHealthText() }}</div>
              <div class="hero-sub">{{ getHealthSummarySubtitle() }}</div>
            </div>
          </div>
          <div class="hero-right">
            <div class="pill normal">{{ summaryCounts().normal }} {{ languageService.t()('sensorReadings.normal') }}</div>
            <div class="pill warning">{{ summaryCounts().warning }} {{ languageService.t()('sensorReadings.warning') }}</div>
            <div class="pill critical">{{ summaryCounts().critical }} {{ languageService.t()('sensorReadings.critical') }}</div>
            <div class="pill offline">{{ summaryCounts().offline }} {{ languageService.t()('sensorReadings.offline') }}</div>
          </div>
        </mat-card>
      </div>

      <!-- No Data State -->
      <div *ngIf="!loading() && sensorStatuses().length === 0" class="no-data">
        <mat-icon>sensors_off</mat-icon>
        <h3>{{ languageService.t()('sensorReadings.noData') }}</h3>
        <p>{{ languageService.t()('sensorReadings.noData') }}</p>
        <button mat-raised-button color="primary" (click)="refreshData()">
          {{ languageService.t()('common.refresh') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sensor-readings-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-title {
      margin-bottom: 24px;
      text-align: center;
    }

    .page-title h1 {
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-size: 2rem;
      font-weight: 600;
    }

    .page-title p {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      gap: 16px;
    }

    .farm-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .farm-card .mat-card {
      height: 100%;
    }

    .farm-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 20px;
      font-weight: 500;
    }

    .status-indicator.normal {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-indicator.warning {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .status-indicator.critical {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .sensor-summary {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      font-size: 0.9em;
      color: #666;
    }

    .sensors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .sensor-card .mat-card {
      height: 100%;
      transition: all 0.3s ease;
    }

    .sensor-card .mat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    }

    .sensor-card.status-critical .mat-card {
      border-left: 4px solid #d32f2f;
    }

    .sensor-card.status-warning .mat-card {
      border-left: 4px solid #f57c00;
    }

    .sensor-card.status-normal .mat-card {
      border-left: 4px solid #2e7d32;
    }

    .sensor-card.status-offline .mat-card {
      border-left: 4px solid #757575;
    }

    .sensor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .sensor-info h3 {
      margin: 0;
      font-size: 1.1em;
      color: #2c3e50;
    }

    .sensor-info p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 0.9em;
    }

    .status-badge {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .badge-normal {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .badge-warning {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .badge-critical {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .badge-offline {
      background-color: #f5f5f5;
      color: #757575;
    }

    .reading-display {
      margin: 16px 0;
    }

    .current-value {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 12px;
    }

    .current-value .value {
      font-size: 2em;
      font-weight: 600;
      color: #2c3e50;
    }

    .current-value .unit {
      font-size: 1.1em;
      color: #666;
    }

    .threshold-bar {
      margin: 16px 0;
    }

    .bar-container {
      height: 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
      position: relative;
      margin-bottom: 8px;
    }

    .threshold-range.optimal {
      background-color: #4caf50;
      height: 100%;
      border-radius: 4px;
      position: absolute;
    }

    .current-position {
      width: 3px;
      height: 12px;
      background-color: #2196f3;
      position: absolute;
      top: -2px;
      border-radius: 2px;
    }

    .threshold-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.8em;
      color: #666;
    }

    .status-message {
      margin: 12px 0;
    }

    .chip-normal {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .chip-warning {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .chip-critical {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .chip-offline {
      background-color: #f5f5f5;
      color: #757575;
    }

    .last-updated {
      font-size: 0.8em;
      color: #999;
      margin-top: 8px;
    }

    .charts-section {
      margin-top: 24px;
    }

    .charts-section .mat-card-content {
      height: 400px;
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-data mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-data h3 {
      margin: 0 0 8px 0;
      color: #2c3e50;
    }

    .no-data p {
      margin: 0 0 24px 0;
    }

    /* Compact Summary (horizontal, minimal height) */
    .health-summary { margin: 8px 0 12px; }
    .health-hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      min-height: 56px;
    }
    .health-hero.normal { border-left: 6px solid #2e7d32; background: #f6fbf6; }
    .health-hero.warning { border-left: 6px solid #f57c00; background: #fff7ed; }
    .health-hero.critical { border-left: 6px solid #d32f2f; background: #fff1f1; }
    .health-hero.offline { border-left: 6px solid #757575; background: #fafafa; }

    .hero-left { display: flex; align-items: center; gap: 8px; }
    .hero-icon { font-size: 28px; width: 28px; height: 28px; }
    .hero-title { font-weight: 700; font-size: 1rem; margin: 0; }
    .hero-sub { color: #6b7280; font-size: 0.8rem; margin-top: 2px; }

    .hero-right { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
    .pill { padding: 2px 10px; border-radius: 14px; font-weight: 600; font-size: 0.8rem; line-height: 20px; }
    .pill.normal { background: #eaf5ea; color: #2e7d32; }
    .pill.warning { background: #ffedd5; color: #c2410c; }
    .pill.critical { background: #fee2e2; color: #b91c1c; }
    .pill.offline { background: #eeeeee; color: #555; }


    @media (max-width: 768px) {
      .page-title h1 {
        font-size: 1.5rem;
      }

      .page-title p {
        font-size: 0.9rem;
      }

      .sensor-readings-container {
        padding: 16px;
      }

      .sensors-grid {
        grid-template-columns: 1fr;
      }

      .health-hero { padding: 8px 10px; }
      .hero-sub { display: none; }
      .hero-right { gap: 4px; }
      .pill { font-size: 0.75rem; padding: 2px 8px; }
    }
  `]
})
export class SensorReadingsComponent implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private farmManagement = inject(FarmManagementService);
  public languageService = inject(LanguageService);
  
  // Signals
  loading = signal(false);
  farms = signal<Farm[]>([]);
  devices = signal<Device[]>([]);
  sensors = signal<SensorWithThresholds[]>([]);
  sensorReadings = signal<SensorReading[]>([]);
  selectedFarmId = signal<string>('');

  // Computed properties
  filteredFarms = computed(() => {
    const farmId = this.selectedFarmId();
    return farmId ? this.farms().filter(f => f.farm_id === farmId) : this.farms();
  });

  sensorStatuses = computed(() => {
    return this.sensors().map(sensor => this.calculateSensorStatus(sensor));
  });

  filteredSensorStatuses = computed(() => {
    const farmId = this.selectedFarmId();
    if (!farmId) return this.sensorStatuses();
    
    return this.sensorStatuses().filter(status => 
      this.devices().find(d => d.device_id === status.sensor.device_id)?.farm_id === farmId
    );
  });

  chartData = computed(() => {
    const statuses = this.filteredSensorStatuses();
    if (statuses.length === 0) return [];

    const groupedByType: { [key: string]: SensorStatus[] } = {};
    statuses.forEach(status => {
      const type = status.sensor.sensor_type || 'unknown';
      if (!groupedByType[type]) groupedByType[type] = [];
      groupedByType[type].push(status);
    });

    return Object.keys(groupedByType).map(type => ({
      name: type,
      series: groupedByType[type].map(status => ({
        name: status.sensor.name,
        value: status.displayValue ?? status.latestReading?.value1 ?? 0
      }))
    }));
  });

  // Chart configuration
  colorScheme: any = {
    domain: ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4']
  };

  // Enhanced charts state
  typeFilter: 'all' | 'temperature' | 'humidity' = 'all';
  timeRange: '15m' | '1h' | '6h' | '24h' = '15m';
  smoothLines = true;
  autoRefresh = true;
  lineChartData: any[] = [];
  curveBasis = curveBasis;
  curveLinear = curveLinear;

  constructor(private apiService: ApiService, private notifications: NotificationService) {}

  ngOnInit() {
    // Perform a full initial load so farms/devices/sensors are ready
    this.loadAllData().then(() => {
      this.startRealTimeUpdates();
    });
    
    // Subscribe to farm selection changes
    this.farmManagement.selectedFarm$.subscribe((selectedFarm: Farm | null) => {
      if (selectedFarm) {
        console.log('🏡 [SENSOR-READINGS] Farm changed, reloading data for:', selectedFarm.name);
        this.selectedFarmId.set(selectedFarm.farm_id);
        this.loadAllData();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  startRealTimeUpdates() {
    // Update every 10 seconds
    this.subscription = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.softRefresh())
    ).subscribe();
  }

  async loadAllData() {
    this.loading.set(true);
    try {
      console.log('Loading sensor data...');
      const [farms, devices, sensors, readings] = await Promise.all([
        this.apiService.getFarms().toPromise(),
        this.apiService.getDevices(true).toPromise(),
        this.apiService.getSensors().toPromise(),
        this.apiService.getSensorReadings(200).toPromise()
      ]);

      console.log('Loaded data:', { farms, devices, sensors, readings });
      this.farms.set(farms || []);
      this.devices.set(devices || []);
      this.sensors.set(this.addThresholds(sensors || []));
      this.sensorReadings.set(readings || []);
      this.buildLineChartData();

      // Emit notifications for sensors in warning/critical states (rate-limited)
      const statuses = this.sensorStatuses();
      for (const status of statuses) {
        const sensorKey = `sensor:${status.sensor.sensor_id}`;
        if (status.status === 'critical') {
          if (this.notifications.shouldNotify(`${sensorKey}:critical`, 'critical')) {
            this.notifications.notify(
              'critical',
              `${status.sensor.sensor_type} critical`,
              `${status.sensor.sensor_id} = ${status.displayValue}${status.sensor.unit || ''}`,
              { source: 'sensor', context: status }
            );
          }
        } else if (status.status === 'warning') {
          if (this.notifications.shouldNotify(`${sensorKey}:warning`, 'warning')) {
            this.notifications.notify(
              'warning',
              `${status.sensor.sensor_type} warning`,
              `${status.sensor.sensor_id} = ${status.displayValue}${status.sensor.unit || ''}`,
              { source: 'sensor', context: status }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // Soft refresh only for readings/charts to avoid page flicker
  private async softRefresh() {
    try {
      const readings = await this.apiService.getSensorReadings(200).toPromise();
      this.sensorReadings.set(readings || []);
      this.buildLineChartData();
    } catch (e) {
      // silent; keep prior data
    }
  }

  private buildLineChartData() {
    const now = Date.now();
    const rangeMs = this.timeRange === '15m' ? 15 * 60 * 1000 : this.timeRange === '1h' ? 60 * 60 * 1000 : this.timeRange === '6h' ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const cutoff = now - rangeMs;

    const sensors = this.sensors();
    const readings = this.sensorReadings();

    const filteredSensors = sensors.filter(s => this.typeFilter === 'all' || (s.sensor_type || s.type)?.toLowerCase() === this.typeFilter);

    const seriesMap: Record<string, { name: string; series: { name: Date; value: number }[] }> = {};
    for (const s of filteredSensors) {
      const labelType = (s.sensor_type || s.type) || '';
      seriesMap[s.sensor_id] = { name: `${s.sensor_id} (${labelType})`, series: [] };
    }

    for (const r of readings) {
      const s = sensors.find(ss => ss.sensor_id === r.sensor_id);
      if (!s) continue;
      const stype = (s.sensor_type || s.type || '').toLowerCase();
      if (this.typeFilter !== 'all' && stype !== this.typeFilter) continue;
      const ts = new Date(r.createdAt).getTime();
      if (ts < cutoff) continue;
      const value = stype === 'humidity' ? (r.value2 ?? r.value1 ?? 0) : (r.value1 ?? r.value2 ?? 0);
      if (!seriesMap[r.sensor_id]) continue;
      seriesMap[r.sensor_id].series.push({ name: new Date(r.createdAt), value });
    }

    Object.values(seriesMap).forEach(s => s.series.sort((a, b) => a.name.getTime() - b.name.getTime()));
    this.lineChartData = Object.values(seriesMap).filter(s => s.series.length > 0);
  }

  setTypeFilter(type: 'all' | 'temperature' | 'humidity') {
    this.typeFilter = type;
    this.buildLineChartData();
  }

  setTimeRange(range: '15m' | '1h' | '6h' | '24h') {
    this.timeRange = range;
    this.buildLineChartData();
  }

  toggleSmooth() {
    this.smoothLines = !this.smoothLines;
  }

  toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      if (!this.subscription) this.startRealTimeUpdates();
    } else {
      if (this.subscription) { this.subscription.unsubscribe(); this.subscription = undefined; }
    }
  }

  private addThresholds(sensors: Sensor[]): SensorWithThresholds[] {
    return sensors.map(sensor => {
      const defMin = this.getThresholdForSensor(sensor.type, 'min');
      const defMax = this.getThresholdForSensor(sensor.type, 'max');
      const defOptMin = this.getThresholdForSensor(sensor.type, 'optimal_min');
      const defOptMax = this.getThresholdForSensor(sensor.type, 'optimal_max');

      const minCritical = sensor.min_critical ?? defMin;
      const maxCritical = sensor.max_critical ?? defMax;
      const minWarning = sensor.min_warning ?? defOptMin ?? minCritical;
      const maxWarning = sensor.max_warning ?? defOptMax ?? maxCritical;

      return {
        ...sensor,
        name: `Sensor ${sensor.id}`,
        sensor_type: sensor.type,
        // Use critical bounds for min/max, and warning bounds for optimal band
        min_threshold: minCritical,
        max_threshold: maxCritical,
        optimal_min: Math.max(minCritical, Math.min(minWarning, maxCritical)),
        optimal_max: Math.max(minCritical, Math.min(maxWarning, maxCritical))
      } as SensorWithThresholds;
    });
  }

  getThresholdForSensor(sensorType: string, thresholdType: string): number {
    const thresholds: { [key: string]: { [key: string]: number } } = {
      'temperature': { min: 0, max: 50, optimal_min: 18, optimal_max: 28 },
      'humidity': { min: 0, max: 100, optimal_min: 40, optimal_max: 70 },
      'soil_moisture': { min: 0, max: 100, optimal_min: 30, optimal_max: 80 },
      'ph': { min: 0, max: 14, optimal_min: 6, optimal_max: 7.5 },
      'light': { min: 0, max: 100000, optimal_min: 10000, optimal_max: 50000 },
      'pressure': { min: 900, max: 1100, optimal_min: 1000, optimal_max: 1020 }
    };

    return thresholds[sensorType.toLowerCase()]?.[thresholdType] || 0;
  }

  private calculateSensorStatus(sensor: SensorWithThresholds): SensorStatus {
    console.log('Calculating status for sensor:', sensor.sensor_id, 'type:', sensor.type, 'unit:', sensor.unit, 'id:', sensor.id);
    console.log('Available readings:', this.sensorReadings());
    
    // Get all readings for this sensor_id
    const allReadings = this.sensorReadings().filter(r => r.sensor_id === sensor.sensor_id);
    console.log('All readings for sensor_id', sensor.sensor_id, ':', allReadings);
    
    // Since we have multiple sensors with same sensor_id but different types,
    // we need to find the reading that corresponds to this specific sensor type
    // The backend saves readings in pairs per MQTT message. We'll group by time bucket (same second)
    // to reconstruct pairs deterministically and then pick per sensor type.
    const sortedReadings = allReadings
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Find the latest time and cluster readings within a 3s window to reconstruct a pair
    let latestPair: SensorReading[] | null = null;
    if (sortedReadings.length > 0) {
      const latestTs = new Date(sortedReadings[0].createdAt).getTime();
      const windowMs = 3000; // 3 seconds window to capture both values from the same publish
      const cluster = sortedReadings.filter(r => Math.abs(new Date(r.createdAt).getTime() - latestTs) <= windowMs);
      if (cluster.length >= 2) {
        latestPair = cluster.slice(0, 2);
      }
    }
    
    let latestReading: SensorReading | null = null;

    const sensorTypeLower = sensor.type?.toLowerCase() || '';
    const unitLower = sensor.unit?.toLowerCase() || '';
    const duplicateSensorsCount = this.sensors().filter(s => s.sensor_id === sensor.sensor_id).length;
    const hasDuplicateSensorId = duplicateSensorsCount > 1;

    // Prefer a combined composite row (value1+value2) first for this sensor_id
    const combinedRow = sortedReadings.find(r => r.value1 != null && r.value2 != null);
    if (combinedRow) {
      latestReading = combinedRow;
    }

    // If no combined row, try exact match: same sensor_id + record id or matching unit/type
    if (!latestReading) latestReading = sortedReadings.find(r => {
      const relSensorId = r.sensor?.sensor_id;
      const relatedId = (r.sensor as any)?.id;
      const relatedType = r.sensor?.type?.toLowerCase() || '';
      const relatedUnit = r.sensor?.unit?.toLowerCase() || '';
      return relSensorId === sensor.sensor_id && (
        (relatedId && relatedId === sensor.id) ||
        (relatedUnit && relatedUnit === unitLower) ||
        (relatedType && relatedType === sensorTypeLower)
      );
    }) || null;

    // If duplicates exist and strict match failed, try unit-only match within same sensor_id
    if (!latestReading && hasDuplicateSensorId) {
      latestReading = sortedReadings.find(r => {
        const relSensorId = r.sensor?.sensor_id;
        const relatedUnit = r.sensor?.unit?.toLowerCase() || '';
        return relSensorId === sensor.sensor_id && relatedUnit === unitLower;
      }) || null;
    }

    // Fallback 1: if a combined composite row exists (value1+value2), use it directly
    // Note: combined row already preferred

    // Fallback 2: use latest pair batch and choose by proximity to sensor's optimal midpoint
    if (!latestReading && latestPair) {
      const a = latestPair[0];
      const b = latestPair[1];
      const av = (a.value1 ?? 0);
      const bv = (b.value1 ?? 0);
      const min = sensor.min_threshold || this.getThresholdForSensor(sensorTypeLower, 'min');
      const max = sensor.max_threshold || this.getThresholdForSensor(sensorTypeLower, 'max');
      const optMin = sensor.optimal_min || this.getThresholdForSensor(sensorTypeLower, 'optimal_min') || min;
      const optMax = sensor.optimal_max || this.getThresholdForSensor(sensorTypeLower, 'optimal_max') || max;
      const midpoint = (optMin + optMax) / 2;

      const distA = Math.abs(av - midpoint);
      const distB = Math.abs(bv - midpoint);
      latestReading = distA <= distB ? a : b;
    }

    // Fallback 3: take the latest two readings and split deterministically
    if (!latestReading) {
      const latestTwo = sortedReadings.slice(0, 2);
      if (latestTwo.length === 2) {
        const a = latestTwo[0];
        const b = latestTwo[1];
        const av = (a.value1 ?? 0);
        const bv = (b.value1 ?? 0);

        if (sensorTypeLower === 'temperature' || unitLower.includes('c')) {
          // Use the smaller value as temperature
          latestReading = av <= bv ? a : b;
        } else if (sensorTypeLower === 'humidity' || unitLower.includes('%')) {
          // Use the larger value as humidity
          latestReading = av >= bv ? a : b;
        }
      } else {
        latestReading = latestTwo[0] || null;
      }
    }
    
    console.log('Latest reading for sensor type', sensor.type, 'id:', sensor.id, ':', latestReading);

    if (!latestReading) {
      return {
        sensor,
        latestReading: null,
        status: 'offline',
        message: this.languageService.t()('sensorReadings.noRecentData'),
        percentage: 0,
        displayValue: 0
      };
    }

    // Determine value per sensor type, prioritizing combined rows (value1/value2) if present
    let value = latestReading.value1 ?? 0;
    const hasValue2 = latestReading.value2 != null;
    if (hasValue2) {
      if (sensorTypeLower === 'temperature' || unitLower.includes('c')) {
        value = latestReading.value1 ?? value;
      } else if (sensorTypeLower === 'humidity' || unitLower.includes('%')) {
        value = (latestReading.value2 as number) ?? value;
      }
    }
    // Resolve per-sensor thresholds with safe fallbacks
    const defMin = this.getThresholdForSensor(sensor.type, 'min');
    const defMax = this.getThresholdForSensor(sensor.type, 'max');
    const defOptMin = this.getThresholdForSensor(sensor.type, 'optimal_min');
    const defOptMax = this.getThresholdForSensor(sensor.type, 'optimal_max');

    const minCritical = sensor.min_threshold ?? defMin;
    const maxCritical = sensor.max_threshold ?? defMax;
    const minWarning = sensor.optimal_min ?? defOptMin ?? minCritical;
    const maxWarning = sensor.optimal_max ?? defOptMax ?? maxCritical;

    const min = minCritical;
    const max = maxCritical;
    const optimalMin = Math.max(min, Math.min(minWarning, max));
    const optimalMax = Math.max(min, Math.min(maxWarning, max));

    const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

    let status: 'normal' | 'warning' | 'critical' | 'offline' = 'normal';
    let message = this.languageService.t()('sensorReadings.optimalRange');

    if (value < min || value > max) {
      status = 'critical';
      message = value < min ? this.languageService.t()('sensorReadings.belowMinimum') : this.languageService.t()('sensorReadings.aboveMaximum');
    } else if (value < optimalMin || value > optimalMax) {
      status = 'warning';
      message = value < optimalMin ? this.languageService.t()('sensorReadings.belowOptimal') : this.languageService.t()('sensorReadings.aboveOptimal');
    }

    return {
      sensor,
      latestReading,
      status,
      message,
      percentage,
      displayValue: value
    };
  }

  refreshData() {
    this.loadAllData();
  }

  getFarmStatus(farmId: string) {
    const farmSensors = this.sensorStatuses().filter(status => 
      this.devices().find(d => d.device_id === status.sensor.device_id)?.farm_id === farmId
    );

    if (farmSensors.length === 0) {
      return { class: 'offline', icon: 'sensors_off', text: this.languageService.t()('sensorReadings.noData') };
    }

    const criticalCount = farmSensors.filter(s => s.status === 'critical').length;
    const warningCount = farmSensors.filter(s => s.status === 'warning').length;

    if (criticalCount > 0) {
      return { class: 'critical', icon: 'error', text: `${criticalCount} ${this.languageService.t()('sensorReadings.critical')}` };
    } else if (warningCount > 0) {
      return { class: 'warning', icon: 'warning', text: `${warningCount} ${this.languageService.t()('sensorReadings.warning')}` };
    } else {
      return { class: 'normal', icon: 'check_circle', text: this.languageService.t()('sensorReadings.allGood') };
    }
  }

  getSensorCount(farmId: string): number {
    return this.sensors().filter(sensor => 
      this.devices().find(d => d.device_id === sensor.device_id)?.farm_id === farmId
    ).length;
  }

  getActiveReadings(farmId: string): number {
    const farmSensors = this.sensors().filter(sensor => 
      this.devices().find(d => d.device_id === sensor.device_id)?.farm_id === farmId
    );
    
    return farmSensors.filter(sensor => 
      this.sensorReadings().some(r => r.sensor_id === sensor.sensor_id)
    ).length;
  }

  // Summary helpers - now filtered by selected farm
  summaryCounts() {
    const s = this.filteredSensorStatuses(); // Use filtered instead of all
    return {
      normal: s.filter(x => x.status === 'normal').length,
      warning: s.filter(x => x.status === 'warning').length,
      critical: s.filter(x => x.status === 'critical').length,
      offline: s.filter(x => x.status === 'offline').length,
    };
  }

  overallHealthClass(): string {
    const c = this.summaryCounts();
    const totalSensors = this.filteredSensorStatuses().length; // Use filtered count
    if (c.critical > 0) return 'critical';
    if (c.warning > 0) return 'warning';
    if (c.offline === totalSensors && totalSensors > 0) return 'offline';
    return 'normal';
  }

  overallHealthIcon(): string {
    const cls = this.overallHealthClass();
    return cls === 'critical' ? 'error' : cls === 'warning' ? 'warning' : cls === 'offline' ? 'sensors_off' : 'check_circle';
  }

  overallHealthText(): string {
    const cls = this.overallHealthClass();
    const selectedFarm = this.farmManagement.getSelectedFarm();
    const farmName = selectedFarm ? ` - ${selectedFarm.name}` : '';
    return cls === 'critical' ? `${this.languageService.t()('sensorReadings.criticalConditions')}${farmName}` : 
           cls === 'warning' ? `${this.languageService.t()('sensorReadings.attentionNeeded')}${farmName}` : 
           cls === 'offline' ? `${this.languageService.t()('sensorReadings.noData')}${farmName}` : 
           `${this.languageService.t()('sensorReadings.allGood')}${farmName}`;
  }

  getHealthSummarySubtitle(): string {
    const selectedFarm = this.farmManagement.getSelectedFarm();
    const totalSensors = this.filteredSensorStatuses().length;
    
    if (selectedFarm) {
      return `${totalSensors} ${this.languageService.t()('sensors.title')} ${this.languageService.t()('common.in')} ${selectedFarm.name}`;
    } else {
      return `${totalSensors} ${this.languageService.t()('sensors.title')} ${this.languageService.t()('sensorReadings.acrossAllFarms')}`;
    }
  }


  getStatusIcon(status: string): string {
    const icons = {
      normal: 'check_circle',
      warning: 'warning',
      critical: 'error',
      offline: 'sensors_off'
    };
    return icons[status as keyof typeof icons] || 'help';
  }

  getThresholdPosition(sensor: any, value: number): number {
    const type = (sensor?.sensor_type || sensor?.type) || '';
    const min = sensor?.min_threshold ?? this.getThresholdForSensor(type, 'min');
    const max = sensor?.max_threshold ?? this.getThresholdForSensor(type, 'max');
    if (typeof value !== 'number' || max === min) return 0;
    const pct = ((value - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  getThresholdWidth(sensor: any, minVal: number, maxVal: number): number {
    const type = (sensor?.sensor_type || sensor?.type) || '';
    const min = sensor?.min_threshold ?? this.getThresholdForSensor(type, 'min');
    const max = sensor?.max_threshold ?? this.getThresholdForSensor(type, 'max');
    if (max === min) return 0;
    return Math.max(0, Math.min(100, ((maxVal - minVal) / (max - min)) * 100));
  }
}
