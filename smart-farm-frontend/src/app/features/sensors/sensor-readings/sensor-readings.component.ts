import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  effect,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, combineLatest, EMPTY } from 'rxjs';
import { startWith, switchMap, catchError } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

// Services
import { ApiService } from '../../../core/services/api.service';
import { FarmManagementService } from '../../../core/services/farm-management.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { ReadingsMapService } from './services/readings-map.service';

// Models
import { Farm, Device, Sensor, SensorReading } from '../../../core/models/farm.model';

// Utils
import {
  calculateSensorStatus,
  SensorWithThresholds,
  SensorStatusResult,
} from './utils/sensor-status.util';
import { normalizeThresholds } from './utils/sensor-thresholds.util';
import { generateUniqueSensorId, parseUniqueSensorId, extractActionPurpose } from './utils/sensor-display.util';

// Child Components
import { GlobalFilterHeaderComponent, FilterState } from './components/global-filter-header/global-filter-header.component';
import { DeviceListPanelComponent, DeviceListItem } from './components/device-list-panel/device-list-panel.component';
import { DeviceDetailPanelComponent, DeviceDetail } from './components/device-detail-panel/device-detail-panel.component';
import { FooterSummaryComponent, SummaryCounts } from './components/footer-summary/footer-summary.component';

@Component({
  selector: 'app-sensor-readings',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    GlobalFilterHeaderComponent,
    DeviceListPanelComponent,
    DeviceDetailPanelComponent,
    FooterSummaryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sensor-readings-layout">
      <!-- Header -->
      <app-global-filter-header
        [title]="languageService.t()('sensorReadings.title')"
        [subtitle]="languageService.t()('sensorReadings.liveData')"
        [farms]="farms()"
        [filters]="filterState()"
        [loading]="loading()"
        [autoRefresh]="autoRefreshEnabled()"
        [density]="density()"
        (filterChange)="onFilterChange($event)"
        (refresh)="refreshData()"
        (autoRefreshToggle)="toggleAutoRefresh($event)"
        (densityToggle)="toggleDensity($event)"
      />

      <!-- KPI Dashboard Header -->
      <div class="kpi-dashboard" [class.compact]="density() === 'compact'">
        <div class="kpi-card-mini" [class.status-critical]="summaryCounts().critical > 0">
          <div class="kpi-icon-mini critical">
            <mat-icon>error</mat-icon>
          </div>
          <div class="kpi-content-mini">
            <span class="kpi-value-mini">{{ summaryCounts().critical }}</span>
            <span class="kpi-label-mini">Critical</span>
          </div>
        </div>

        <div class="kpi-card-mini" [class.status-warning]="summaryCounts().warning > 0">
          <div class="kpi-icon-mini warning">
            <mat-icon>warning</mat-icon>
          </div>
          <div class="kpi-content-mini">
            <span class="kpi-value-mini">{{ summaryCounts().warning }}</span>
            <span class="kpi-label-mini">Warning</span>
          </div>
        </div>

        <div class="kpi-card-mini" [class.status-normal]="summaryCounts().normal > 0">
          <div class="kpi-icon-mini normal">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="kpi-content-mini">
            <span class="kpi-value-mini">{{ summaryCounts().normal }}</span>
            <span class="kpi-label-mini">Normal</span>
          </div>
        </div>

        <div class="kpi-card-mini" [class.status-offline]="summaryCounts().offline > 0">
          <div class="kpi-icon-mini offline">
            <mat-icon>sensors_off</mat-icon>
          </div>
          <div class="kpi-content-mini">
            <span class="kpi-value-mini">{{ summaryCounts().offline }}</span>
            <span class="kpi-label-mini">Offline</span>
          </div>
        </div>

        <div class="kpi-card-mini highlight">
          <div class="kpi-icon-mini info">
            <mat-icon>sensors</mat-icon>
          </div>
          <div class="kpi-content-mini">
            <span class="kpi-value-mini">{{ deviceListItems().length }}</span>
            <span class="kpi-label-mini">Total Sensors</span>
          </div>
        </div>

        <div class="kpi-card-mini">
          <div class="kpi-icon-mini success">
            <mat-icon>speed</mat-icon>
          </div>
          <div class="kpi-content-mini">
            <span class="kpi-value-mini">{{ getOnlinePercentage() }}%</span>
            <span class="kpi-label-mini">Online Rate</span>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content" [class.compact]="density() === 'compact'">
        <!-- Left Panel: Device List -->
        <app-device-list-panel
          [items]="deviceListItems()"
          [selectedId]="selectedSensorId()"
          [loading]="loading()"
          [density]="density()"
          (itemClick)="selectSensor($event)"
          (pinToggle)="togglePin($event)"
        />

        <!-- Right Panel: Device Detail -->
        <app-device-detail-panel
          [device]="selectedDeviceDetail()"
          [loading]="loading()"
        />
      </div>

      <!-- Footer Summary -->
      <app-footer-summary
        [counts]="summaryCounts()"
        [overallStatus]="overallStatus()"
        [overallTitle]="overallTitle()"
        [subtitle]="summarySubtitle()"
      />
    </div>
  `,
  styles: [
    `
      .sensor-readings-layout {
        min-height: 100vh;
        background: linear-gradient(135deg, #f8fafb 0%, #f0fdf4 100%);
        padding: 0;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow-x: hidden;
      }

      /* KPI Dashboard Header */
      .kpi-dashboard {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
        padding: 24px 32px;
        max-width: 1600px;
        width: 100%;
        margin: 0 auto;
        animation: fadeInDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .kpi-dashboard.compact {
        gap: 12px;
        padding: 16px 24px;
      }

      .kpi-card-mini {
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        background: var(--glass-bg, rgba(255, 255, 255, 0.75));
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 16px;
        border: 1px solid var(--glass-border, rgba(16, 185, 129, 0.2));
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06),
                    inset 0 1px 1px rgba(255, 255, 255, 0.6);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }

      .kpi-card-mini::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .kpi-card-mini:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 12px 32px rgba(16, 185, 129, 0.2),
                    0 0 20px rgba(16, 185, 129, 0.1),
                    inset 0 1px 1px rgba(255, 255, 255, 0.7);
        border-color: rgba(16, 185, 129, 0.4);
      }

      .kpi-card-mini:hover::before {
        opacity: 1;
      }

      .kpi-card-mini.highlight {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1));
        border-color: rgba(16, 185, 129, 0.4);
      }

      .kpi-card-mini.status-critical {
        animation: pulseGlow 2s ease-in-out infinite;
      }

      @keyframes pulseGlow {
        0%, 100% {
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2),
                      inset 0 1px 1px rgba(255, 255, 255, 0.6);
        }
        50% {
          box-shadow: 0 4px 24px rgba(239, 68, 68, 0.4),
                      inset 0 1px 1px rgba(255, 255, 255, 0.6);
        }
      }

      .kpi-icon-mini {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .kpi-card-mini:hover .kpi-icon-mini {
        transform: scale(1.1) rotate(5deg);
      }

      .kpi-icon-mini.critical {
        background: linear-gradient(135deg, #fee2e2, #fecaca);
        color: #991b1b;
      }

      .kpi-icon-mini.warning {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        color: #92400e;
      }

      .kpi-icon-mini.normal {
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        color: #065f46;
      }

      .kpi-icon-mini.offline {
        background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        color: #4b5563;
      }

      .kpi-icon-mini.info {
        background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        color: #1e40af;
      }

      .kpi-icon-mini.success {
        background: linear-gradient(135deg, #d1fae5, #34d399);
        color: #065f46;
      }

      .kpi-icon-mini mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .kpi-content-mini {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }

      .kpi-value-mini {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary, #1f2937);
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }

      .kpi-label-mini {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.9;
      }

      /* Main Content Grid */
      .main-content {
        flex: 1;
        display: grid;
        grid-template-columns: minmax(460px, 520px) minmax(0, 1fr);
        gap: 24px;
        padding: 0 32px 32px 32px;
        max-width: 1600px;
        width: 100%;
        margin: 0 auto;
      }

      .main-content.compact {
        grid-template-columns: minmax(420px, 480px) minmax(0, 1fr);
        gap: 16px;
      }

      /* Responsive Breakpoints */
      @media (max-width: 1439px) {
        .main-content {
          grid-template-columns: minmax(420px, 480px) minmax(0, 1fr);
        }
        .kpi-dashboard {
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }
      }

      @media (max-width: 1279px) {
        .main-content {
          grid-template-columns: minmax(380px, 440px) minmax(0, 1fr);
        }
      }

      @media (max-width: 1023px) {
        .main-content {
          grid-template-columns: 300px minmax(0, 1fr);
          gap: 16px;
          padding: 0 24px 24px 24px;
        }
        .kpi-dashboard {
          padding: 16px 24px;
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (max-width: 768px) {
        .main-content {
          grid-template-columns: 1fr;
          padding: 0 16px 16px 16px;
        }
        .kpi-dashboard {
          padding: 16px;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .kpi-card-mini {
          padding: 14px 16px;
          gap: 10px;
        }
        .kpi-icon-mini {
          width: 36px;
          height: 36px;
        }
        .kpi-icon-mini mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
        .kpi-value-mini {
          font-size: 1.25rem;
        }
        .kpi-label-mini {
          font-size: 0.7rem;
        }
      }

      @media (max-width: 480px) {
        .kpi-dashboard {
          grid-template-columns: 1fr;
        }
      }

      /* Dark theme support */
      :host-context(body.dark-theme) .sensor-readings-layout {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      }

      :host-context(body.dark-theme) .kpi-card-mini {
        background: var(--glass-bg, rgba(30, 41, 59, 0.75));
        border-color: var(--glass-border, rgba(100, 116, 139, 0.3));
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3),
                    inset 0 1px 1px rgba(100, 116, 139, 0.15);
      }

      :host-context(body.dark-theme) .kpi-card-mini:hover {
        box-shadow: 0 12px 32px rgba(16, 185, 129, 0.25),
                    0 0 20px rgba(16, 185, 129, 0.15),
                    inset 0 1px 1px rgba(100, 116, 139, 0.2);
      }

      :host-context(body.dark-theme) .kpi-card-mini.highlight {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15));
      }

      :host-context(body.dark-theme) .kpi-icon-mini.critical {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(254, 202, 202, 0.2));
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.4);
      }

      :host-context(body.dark-theme) .kpi-icon-mini.warning {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(253, 230, 138, 0.2));
        color: #fcd34d;
        border: 1px solid rgba(245, 158, 11, 0.4);
      }

      :host-context(body.dark-theme) .kpi-icon-mini.normal {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(167, 243, 208, 0.2));
        color: #6ee7b7;
        border: 1px solid rgba(16, 185, 129, 0.4);
      }

      :host-context(body.dark-theme) .kpi-icon-mini.offline {
        background: linear-gradient(135deg, rgba(107, 114, 128, 0.3), rgba(229, 231, 235, 0.15));
        color: #cbd5e1;
        border: 1px solid rgba(107, 114, 128, 0.4);
      }

      :host-context(body.dark-theme) .kpi-icon-mini.info {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(191, 219, 254, 0.2));
        color: #93c5fd;
        border: 1px solid rgba(59, 130, 246, 0.4);
      }

      :host-context(body.dark-theme) .kpi-icon-mini.success {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(52, 211, 153, 0.25));
        color: #6ee7b7;
        border: 1px solid rgba(16, 185, 129, 0.5);
      }

      :host-context(body.dark-theme) .kpi-value-mini {
        color: var(--text-primary, #f1f5f9);
      }

      :host-context(body.dark-theme) .kpi-label-mini {
        color: var(--text-secondary, #cbd5e1);
      }

      /* Smooth scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(16, 185, 129, 0.3);
        border-radius: 4px;
        transition: background 0.2s;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(16, 185, 129, 0.5);
      }

      :host-context(body.dark-theme) ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
      }

      :host-context(body.dark-theme) ::-webkit-scrollbar-thumb {
        background: rgba(16, 185, 129, 0.4);
      }
    `,
  ],
})
export class SensorReadingsComponent implements OnInit {
  // Injected services
  private apiService = inject(ApiService);
  private farmManagement = inject(FarmManagementService);
  private notifications = inject(NotificationService);
  public languageService = inject(LanguageService);
  private readingsMap = inject(ReadingsMapService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // State signals
  loading = signal(false);
  farms = signal<Farm[]>([]);
  devices = signal<Device[]>([]);
  sensors = signal<SensorWithThresholds[]>([]);
  sensorReadings = signal<SensorReading[]>([]);

  filterState = signal<FilterState>({
    farmId: '',
    sensorType: 'all',
    timeRange: '1h',
    searchQuery: '',
  });

  selectedSensorId = signal<string | null>(null);
  pinnedSensorIds = signal<Set<string>>(new Set());
  autoRefreshEnabled = signal(true);
  density = signal<'comfortable' | 'compact'>('comfortable');

  // Computed: Sensor statuses
  sensorStatuses = computed(() => {
    const sensorsData = this.sensors();
    const readings = this.sensorReadings();

    return sensorsData.map((sensor) =>
      calculateSensorStatus(sensor, readings, {
        offline: this.languageService.t()('sensorReadings.noRecentData'),
        optimal: this.languageService.t()('sensorReadings.optimalRange'),
        belowMin: this.languageService.t()('sensorReadings.belowMinimum'),
        aboveMax: this.languageService.t()('sensorReadings.aboveMaximum'),
        belowOptimal: this.languageService.t()('sensorReadings.belowOptimal'),
        aboveOptimal: this.languageService.t()('sensorReadings.aboveOptimal'),
      })
    );
  });

  // Computed: Filtered & sorted device list items
  deviceListItems = computed(() => {
    const statuses = this.sensorStatuses();
    const filters = this.filterState();
    const pinned = this.pinnedSensorIds();
    const devicesData = this.devices();
    const sensorsData = this.sensors();

    let filtered = statuses.map((statusResult, idx) => {
      const sensor = sensorsData[idx];
      const device = devicesData.find((d) => d.device_id === sensor.device_id);

      return {
        statusResult,
        sensor,
        device,
      };
    });

    // Apply farm filter
    if (filters.farmId) {
      filtered = filtered.filter((item) => item.device?.farm_id === filters.farmId);
    }

    // Apply type filter
    if (filters.sensorType !== 'all') {
      filtered = filtered.filter(
        (item) => item.sensor.type?.toLowerCase() === filters.sensorType
      );
    }

    // Apply search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.sensor.sensor_id?.toLowerCase().includes(query) ||
          item.sensor.type?.toLowerCase().includes(query) ||
          item.device?.name?.toLowerCase().includes(query)
      );
    }

    // Map to DeviceListItem with unique IDs
    // Track seen IDs to ensure absolute uniqueness (prevents Angular tracking errors)
    const seenIds = new Set<string>();
    const items: DeviceListItem[] = filtered.map((item, index) => {
      // Generate unique ID that includes sensor type (for composite sensors like DHT11)
      let uniqueId = generateUniqueSensorId(
        item.sensor.sensor_id,
        item.sensor.type || 'unknown',
        item.sensor.unit
      );

      // Ensure absolute uniqueness by adding index if duplicate found
      // This prevents Angular NG0955 tracking errors
      if (seenIds.has(uniqueId)) {
        uniqueId = `${uniqueId}-${index}`;
      }
      seenIds.add(uniqueId);

      return {
        id: uniqueId,
        name: item.sensor.sensor_id || 'Unknown',
        type: item.sensor.type || 'Unknown',
        status: item.statusResult.status,
        value: item.statusResult.value,
        unit: item.sensor.unit || '',
        lastUpdate: item.statusResult.lastReading?.createdAt
          ? new Date(item.statusResult.lastReading.createdAt)
          : null,
        isPinned: pinned.has(uniqueId),
        actionPurpose: extractActionPurpose(item.sensor.action_low, item.sensor.action_high),
        sensorDbId: item.sensor.id, // Store database ID for direct matching
      };
    });

    // Additional deduplication by ID to prevent tracking errors (keep first occurrence)
    const uniqueItems = new Map<string, DeviceListItem>();
    items.forEach(item => {
      if (!uniqueItems.has(item.id)) {
        uniqueItems.set(item.id, item);
      }
    });

    // Sort: pinned first, then by status priority (critical > warning > offline > normal)
    const statusPriority = { critical: 0, warning: 1, offline: 2, normal: 3 };
    return Array.from(uniqueItems.values()).sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return statusPriority[a.status] - statusPriority[b.status];
    });
  });

  // Signal to store historical data for selected sensor
  private historicalReadings = signal<Map<string, SensorReading[]>>(new Map());

  // Computed: Selected device detail
  selectedDeviceDetail = computed(() => {
    const uniqueSensorId = this.selectedSensorId();
    if (!uniqueSensorId) return null;

    // First, try to find the sensor by database ID from the device list items
    // This handles cases where duplicate sensors have index suffixes (e.g., "dht11-humidity-1")
    const items = this.deviceListItems();
    const selectedItem = items.find(item => item.id === uniqueSensorId);
    
    let sensor: SensorWithThresholds | undefined;
    
    if (selectedItem?.sensorDbId) {
      // Direct match by database ID (most reliable for duplicate sensors)
      sensor = this.sensors().find(s => s.id === selectedItem.sensorDbId);
    }
    
    if (!sensor) {
      // Fallback: Parse the unique ID to get base sensor ID and type
      const { baseSensorId, type } = parseUniqueSensorId(uniqueSensorId);
      
      // Find the sensor that matches both the base ID and type
      const sensors = this.sensors();
      sensor = sensors.find((s) => {
        const matches = s.sensor_id === baseSensorId;
        const typeMatches = s.type?.toLowerCase().replace(/\s+/g, '-') === type;
        return matches && typeMatches;
      });
    }

    if (!sensor) return null;

    const statuses = this.sensorStatuses();
    const sensors = this.sensors();
    const statusIndex = sensors.findIndex((s) => s === sensor);
    const statusResult = statusIndex >= 0 ? statuses[statusIndex] : null;

    if (!statusResult) return null;

    const timeRangeMs = this.getTimeRangeMs(this.filterState().timeRange);

    // Get historical data if available, otherwise use in-memory readings
    const historicalData = this.historicalReadings().get(sensor.sensor_id) || [];
    const inMemoryData = this.readingsMap.getReadingsForSensor(sensor.sensor_id, timeRangeMs);

    // Combine and deduplicate by timestamp
    const allReadings = new Map<number, { timestamp: Date; value: number }>();

    // Add historical data
    historicalData.forEach(reading => {
      const timestamp = new Date(reading.createdAt).getTime();
      const cutoff = Date.now() - timeRangeMs;
      if (timestamp >= cutoff) {
        allReadings.set(timestamp, {
          timestamp: new Date(reading.createdAt),
          value: reading.value1 ?? 0
        });
      }
    });

    // Add in-memory data (may override historical if same timestamp)
    inMemoryData.forEach(reading => {
      const timestamp = reading.timestamp.getTime();
      allReadings.set(timestamp, reading);
    });

    // Convert to array and sort by timestamp
    const chartData = Array.from(allReadings.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const thresholds = normalizeThresholds(sensor.type || '', {
      min: sensor.min_threshold ?? sensor.min_critical,
      max: sensor.max_threshold ?? sensor.max_critical,
      optimal_min: sensor.optimal_min ?? sensor.min_warning,
      optimal_max: sensor.optimal_max ?? sensor.max_warning,
    });

    // Calculate delta (1h ago vs now)
    let delta1h: number | undefined;
    if (chartData.length > 1) {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const oldReading = chartData.find((r) => r.timestamp.getTime() <= oneHourAgo);
      if (oldReading) {
        delta1h = statusResult.value - oldReading.value;
      }
    }

    const detail: DeviceDetail = {
      id: uniqueSensorId,
      name: sensor.sensor_id || 'Unknown',
      type: sensor.type || 'Unknown',
      status: statusResult.status,
      currentValue: statusResult.value,
      unit: sensor.unit || '',
      lastUpdate: statusResult.lastReading?.createdAt
        ? new Date(statusResult.lastReading.createdAt)
        : null,
      delta1h,
      thresholds: {
        min: thresholds.min,
        max: thresholds.max,
        optimalMin: thresholds.optimal_min,
        optimalMax: thresholds.optimal_max,
      },
      chartData: chartData.map((r) => ({ name: r.timestamp, value: r.value })),
    };

    return detail;
  });

  // Computed: Summary counts
  summaryCounts = computed(() => {
    const items = this.deviceListItems();
    return items.reduce(
      (acc, item) => {
        acc[item.status]++;
        return acc;
      },
      { normal: 0, warning: 0, critical: 0, offline: 0 } as SummaryCounts
    );
  });

  // Computed: Overall status
  overallStatus = computed(() => {
    const counts = this.summaryCounts();
    if (counts.critical > 0) return 'critical';
    if (counts.warning > 0) return 'warning';
    if (counts.offline === counts.normal + counts.warning + counts.critical + counts.offline && counts.offline > 0)
      return 'offline';
    return 'normal';
  });

  overallTitle = computed(() => {
    const status = this.overallStatus();
    const messages = {
      critical: this.languageService.t()('sensorReadings.criticalConditions'),
      warning: this.languageService.t()('sensorReadings.attentionNeeded'),
      offline: this.languageService.t()('sensorReadings.noData'),
      normal: this.languageService.t()('sensorReadings.allGood'),
    };
    return messages[status];
  });

  summarySubtitle = computed(() => {
    const total = this.deviceListItems().length;
    const selectedFarm = this.farmManagement.getSelectedFarm();
    if (selectedFarm) {
      return `${total} ${this.languageService.t()('sensors.title')} ${this.languageService.t()('common.in')} ${selectedFarm.name}`;
    }
    return `${total} ${this.languageService.t()('sensors.title')} ${this.languageService.t()('sensorReadings.acrossAllFarms')}`;
  });

  constructor() {
    // Sync URL to selection
    effect(() => {
      const sensorId = this.selectedSensorId();
      if (sensorId) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { sensor: sensorId },
          queryParamsHandling: 'merge',
        });
      }
    });

    // Load historical data when sensor is selected or time range changes
    effect(() => {
      const uniqueSensorId = this.selectedSensorId();
      const timeRange = this.filterState().timeRange;

      if (uniqueSensorId) {
        const { baseSensorId } = parseUniqueSensorId(uniqueSensorId);
        // Load historical data asynchronously
        this.loadHistoricalData(baseSensorId, timeRange);
      }
    });
  }

  ngOnInit() {
    // Initial data load
    this.loadAllData();

    // Listen to farm selection changes
    this.farmManagement.selectedFarm$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedFarm: Farm | null) => {
        if (selectedFarm) {
          this.filterState.update((state) => ({ ...state, farmId: selectedFarm.farm_id }));
          this.loadAllData();
        }
      });

    // Auto-refresh setup
    interval(10000)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (this.autoRefreshEnabled()) {
            return this.softRefresh();
          }
          return EMPTY;
        }),
        catchError((err) => {
          console.error('Auto-refresh error:', err);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // Restore selection from URL with backward compatibility
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['sensor']) {
        const queryParam = params['sensor'];
        const items = this.deviceListItems();

        // First, try to find exact match (new format: "dht11-temperature")
        let matchingItem = items.find(item => item.id === queryParam);

        // If no exact match, try to find a sensor that starts with the query param
        // This provides backward compatibility for URLs like "?sensor=dht11"
        if (!matchingItem) {
          matchingItem = items.find(item => item.id.startsWith(queryParam + '-'));
        }

        // Set the selected sensor ID (will be the unique ID)
        if (matchingItem) {
          this.selectedSensorId.set(matchingItem.id);
        } else {
          this.selectedSensorId.set(queryParam); // Fallback to original param
        }
      }
    });
  }

  async loadAllData() {
    this.loading.set(true);
    try {
      const [farms, devices, sensors, readings] = await Promise.all([
        firstValueFrom(this.apiService.getFarms()),
        firstValueFrom(this.apiService.getDevices(true)),
        firstValueFrom(this.apiService.getSensors()),
        firstValueFrom(this.apiService.getSensorReadings(200)),
      ]);

      this.farms.set(farms || []);
      this.devices.set(devices || []);
      this.sensors.set(this.enhanceSensorsWithThresholds(sensors || []));
      this.sensorReadings.set(readings || []);
      this.readingsMap.setReadings(readings || []);

      // Auto-select first item if none selected (using unique ID)
      if (!this.selectedSensorId() && this.deviceListItems().length > 0) {
        const firstItem = this.deviceListItems()[0];
        this.selectedSensorId.set(firstItem.id); // Already uses unique ID format
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.notifications.notify('critical', 'Error', 'Failed to load sensor data');
    } finally {
      this.loading.set(false);
    }
  }

  private async softRefresh() {
    try {
      const readings = await firstValueFrom(this.apiService.getSensorReadings(200));
      this.sensorReadings.set(readings || []);
      this.readingsMap.setReadings(readings || []);
    } catch (error) {
      console.error('Soft refresh error:', error);
    }
  }

  private enhanceSensorsWithThresholds(sensors: Sensor[]): SensorWithThresholds[] {
    return sensors.map((sensor) => ({
      ...sensor,
      name: `Sensor ${sensor.id}`,
      sensor_type: sensor.type,
    }));
  }

  private getTimeRangeMs(range: FilterState['timeRange']): number {
    const ranges = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    };
    return ranges[range];
  }

  // Event handlers
  onFilterChange(changes: Partial<FilterState>) {
    this.filterState.update((state) => ({ ...state, ...changes }));
  }

  refreshData() {
    this.loadAllData();
  }

  toggleAutoRefresh(enabled: boolean) {
    this.autoRefreshEnabled.set(enabled);
  }

  toggleDensity(density: 'comfortable' | 'compact') {
    this.density.set(density);
  }

  selectSensor(sensorId: string) {
    this.selectedSensorId.set(sensorId);
  }

  togglePin(sensorId: string) {
    this.pinnedSensorIds.update((pinned) => {
      const newSet = new Set(pinned);
      if (newSet.has(sensorId)) {
        newSet.delete(sensorId);
      } else {
        newSet.add(sensorId);
      }
      return newSet;
    });
  }

  getOnlinePercentage(): number {
    const items = this.deviceListItems();
    if (items.length === 0) return 0;
    const online = items.filter(item => item.status !== 'offline').length;
    return Math.round((online / items.length) * 100);
  }

  /**
   * Load historical data for a sensor based on the selected time range
   */
  private async loadHistoricalData(sensorId: string, timeRange: FilterState['timeRange']) {
    try {
      const timeRangeMs = this.getTimeRangeMs(timeRange);
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - timeRangeMs);

      // Fetch historical data from API
      const historicalReadings = await firstValueFrom(
        this.apiService.getReadingsByDateRange(sensorId, startDate, endDate, 1000)
      );

      // Update historical readings map
      this.historicalReadings.update((map) => {
        const newMap = new Map(map);
        newMap.set(sensorId, historicalReadings || []);
        return newMap;
      });

      console.log(`[SensorReadings] Loaded ${historicalReadings?.length || 0} historical readings for ${sensorId}`);
    } catch (error) {
      console.error(`[SensorReadings] Error loading historical data for ${sensorId}:`, error);
      // Don't show error notification - just log it, historical data is optional
    }
  }
}

