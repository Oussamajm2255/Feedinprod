import { Component, Inject, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

import { Device, Sensor, SensorReading } from '../../../../core/models/farm.model';
import { ApiService } from '../../../../core/services/api.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { AlertService } from '../../../../core/services/alert.service';
import * as DeviceUtils from '../../device.utils';

export interface DeviceDetailsDialogData {
  device: Device;
}

@Component({
  selector: 'app-device-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './device-details-dialog.component.html',
  styleUrls: ['./device-details-dialog.component.scss'],
  animations: [
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }))
      ])
    ]),
    trigger('contentAnimation', [
      transition(':enter', [
        query('.detail-item, .metric-card', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(50, [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class DeviceDetailsDialogComponent implements OnInit {
  private apiService = inject(ApiService);
  private alertService = inject(AlertService);
  public languageService = inject(LanguageService);
  public themeService = inject(ThemeService);
  private readonly sensorTypeMap: Record<string, string> = {
    temperature: 'sensors.sensorTypes.temperature',
    humidity: 'sensors.sensorTypes.humidity',
    soil_moisture: 'sensors.sensorTypes.soilMoisture',
    soil: 'sensors.sensorTypes.soil',
    light: 'sensors.sensorTypes.light',
    ph: 'sensors.sensorTypes.ph'
  };
  private readonly actionStatusPalette: Record<string, { bg: string; color: string }> = {
    ack: { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669' },
    pending: { bg: 'rgba(234, 179, 8, 0.15)', color: '#b45309' },
    queued: { bg: 'rgba(59, 130, 246, 0.15)', color: '#1d4ed8' },
    sent: { bg: 'rgba(59, 130, 246, 0.15)', color: '#1d4ed8' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', color: '#b91c1c' },
    failed: { bg: 'rgba(239, 68, 68, 0.15)', color: '#b91c1c' }
  };

  device: Device;
  dialogTitleId = '';
  dialogContentId = '';
  sensors = signal<Sensor[]>([]);
  recentReadings = signal<SensorReading[]>([]);
  deviceActions = signal<any[]>([]);
  
  isLoadingSensors = signal(false);
  isLoadingReadings = signal(false);
  isLoadingActions = signal(false);
  isLoadingStats = signal(false);
  
  deviceStatistics: any = null;

  // Computed properties
  readonly isDarkTheme = computed(() => this.themeService.currentTheme === 'dark');
  readonly sensorCount = computed(() => this.sensors().length);
  readonly hasReadings = computed(() => this.recentReadings().length > 0);
  readonly recentActionsCount = computed(() => this.deviceActions().length);

  constructor(
    public dialogRef: MatDialogRef<DeviceDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeviceDetailsDialogData
  ) {
    this.device = data.device;
    this.dialogTitleId = `device-details-title-${this.device.device_id}`;
    this.dialogContentId = `${this.dialogTitleId}-body`;
  }

  ngOnInit(): void {
    this.loadDeviceSensors();
    this.loadRecentReadings();
    this.loadDeviceActions();
    this.loadDeviceStatistics();
  }

  private loadDeviceSensors(): void {
    this.isLoadingSensors.set(true);
    this.apiService.getSensorsByDevice(this.device.device_id).subscribe({
      next: (sensors) => {
        this.sensors.set(sensors || []);
        this.isLoadingSensors.set(false);
      },
      error: (error) => {
        console.error('Error loading device sensors:', error);
        this.isLoadingSensors.set(false);
        this.alertService.error('errors.networkError', 'devices.errorLoadingSensors');
      }
    });
  }

  private loadRecentReadings(): void {
    this.isLoadingReadings.set(true);
    this.apiService.getReadingsByDevice(this.device.device_id, 10, 0).subscribe({
      next: (readings) => {
        this.recentReadings.set(readings || []);
        this.isLoadingReadings.set(false);
      },
      error: (error) => {
        console.error('Error loading recent readings:', error);
        this.isLoadingReadings.set(false);
      }
    });
  }

  private loadDeviceActions(): void {
    this.isLoadingActions.set(true);
    this.apiService.getDeviceActions(this.device.device_id).subscribe({
      next: (actions) => {
        this.deviceActions.set(actions || []);
        this.isLoadingActions.set(false);
      },
      error: (error) => {
        console.error('Error loading device actions:', error);
        this.isLoadingActions.set(false);
      }
    });
  }

  private loadDeviceStatistics(): void {
    this.isLoadingStats.set(true);
    this.apiService.getDeviceStatistics().subscribe({
      next: (stats) => {
        // Try to find device-specific stats
        if (stats && Array.isArray(stats)) {
          this.deviceStatistics = stats.find((s: any) => s.device_id === this.device.device_id) || null;
        } else {
          this.deviceStatistics = stats;
        }
        this.isLoadingStats.set(false);
      },
      error: (error) => {
        console.error('Error loading device statistics:', error);
        this.isLoadingStats.set(false);
      }
    });
  }

  // Utility methods
  getDeviceIcon(type: string): string {
    return DeviceUtils.getDeviceTypeIcon(type || 'unknown');
  }

  getDeviceTypeTranslation(type: string): string {
    return DeviceUtils.getDeviceTypeTranslation(type || 'unknown', this.languageService.t());
  }

  getStatusTranslation(status: string): string {
    return DeviceUtils.getStatusTranslation(status, this.languageService.t());
  }

  getStatusIcon(status: string): string {
    return DeviceUtils.getStatusIcon(status);
  }

  getDeviceTypeGradient(type: string): string {
    return DeviceUtils.getDeviceTypeGradient(type || 'unknown');
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return this.languageService.t()('common.never');
    const d = typeof date === 'string' ? new Date(date) : date;
    const lang = this.languageService.currentLanguage();
    return d.toLocaleString(lang, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatRelativeTime(date: Date | string | undefined): string {
    if (!date) return this.languageService.t()('common.never');
    return DeviceUtils.formatTimeAgo(date as any, this.languageService.t());
  }

  getSensorTypeIcon(sensorType: string): string {
    switch (sensorType?.toLowerCase()) {
      case 'temperature':
        return 'thermostat';
      case 'humidity':
        return 'water_drop';
      case 'soil_moisture':
      case 'soil':
        return 'water';
      case 'light':
        return 'light_mode';
      case 'ph':
        return 'science';
      default:
        return 'sensors';
    }
  }

  getSensorTypeColor(sensorType: string): string {
    switch (sensorType?.toLowerCase()) {
      case 'temperature':
        return '#ef4444';
      case 'humidity':
        return '#3b82f6';
      case 'soil_moisture':
      case 'soil':
        return '#10b981';
      case 'light':
        return '#f59e0b';
      case 'ph':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'online':
        return '#10b981';
      case 'offline':
        return '#ef4444';
      case 'maintenance':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  }

  calculateUptime(): string {
    if (!this.device.last_seen || !this.device.created_at) {
      return this.languageService.t()('devices.notAvailableShort');
    }

    const created = new Date(this.device.created_at);
    const now = new Date();
    const diff = now.getTime() - created.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return this.languageService.t()('devices.uptimeDaysHours', { days, hours });
    }

    if (hours > 0) {
      return this.languageService.t()('devices.uptimeHoursMinutes', { hours, minutes });
    }

    return this.languageService.t()('devices.uptimeMinutes', { minutes });
  }

  getSensorTypeLabel(sensorType: string | undefined): string {
    if (!sensorType) {
      return this.languageService.t()('sensors.sensorTypes.unknown');
    }

    const key = this.sensorTypeMap[sensorType.toLowerCase()];
    if (!key) {
      return sensorType;
    }

    const translation = this.languageService.translate(key);
    return translation === key ? sensorType : translation;
  }

  getActionStatusTranslation(status: string): string {
    if (!status) {
      return this.languageService.t()('devices.actionStatus.unknown');
    }

    const key = `devices.actionStatus.${status.toLowerCase()}`;
    const translation = this.languageService.translate(key);
    return translation === key ? status : translation;
  }

  getActionStatusStyle(status: string): { [key: string]: string } {
    const palette = this.actionStatusPalette[status?.toLowerCase()] || { bg: 'rgba(148, 163, 184, 0.2)', color: '#475569' };
    return {
      background: palette.bg,
      color: palette.color
    };
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onEdit(): void {
    this.dialogRef.close({ action: 'edit', device: this.device });
  }

  onDelete(): void {
    this.dialogRef.close({ action: 'delete', device: this.device });
  }

  onRestart(): void {
    this.alertService.info('devices.restartInitiated', 'devices.restartDeviceMessage');
  }

  onUpdateFirmware(): void {
    this.alertService.info('devices.firmwareUpdateInitiated', 'devices.firmwareUpdateMessage');
  }
}