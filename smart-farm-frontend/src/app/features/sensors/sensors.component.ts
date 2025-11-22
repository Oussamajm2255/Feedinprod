import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApiService } from '../../core/services/api.service';
import { FarmManagementService } from '../../core/services/farm-management.service';
import { Sensor, SensorReading, Device } from '../../core/models/farm.model';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-sensors',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule
  ],
  templateUrl: './sensors.component.html',
  styleUrl: './sensors.component.scss'
})
export class SensorsComponent implements OnInit {
  private apiService = inject(ApiService);
  private farmManagement = inject(FarmManagementService);
  private snackBar = inject(MatSnackBar);
  public languageService = inject(LanguageService);

  sensors: Sensor[] = [];
  devices: Device[] = [];
  recentReadings: SensorReading[] = [];
  isLoading = true;
  displayedColumns: string[] = ['sensor_id', 'type', 'unit', 'device', 'location']; // Show parent device
  readingColumns: string[] = ['sensor_id', 'value1', 'value2', 'createdAt'];

  ngOnInit(): void {
    this.loadSensors();
    this.loadDevicesForReference();
    this.loadRecentReadings();

    // Subscribe to farm selection changes
    this.farmManagement.selectedFarm$.subscribe(selectedFarm => {
      if (selectedFarm) {
        console.log('🏡 [SENSORS] Farm changed, reloading sensors for:', selectedFarm.name);
        this.loadSensors();
        this.loadDevicesForReference();
        this.loadRecentReadings();
      }
    });
  }

  private loadSensors(): void {
    this.isLoading = true;

    const selectedFarm = this.farmManagement.getSelectedFarm();
    if (!selectedFarm) {
      console.log('⚠️ [SENSORS] No farm selected, skipping sensors load');
      this.sensors = [];
      this.isLoading = false;
      return;
    }

    console.log('🏡 [SENSORS] Loading sensors for farm:', selectedFarm.name);

    // ✅ Use farm-specific endpoint instead of filtering all sensors
    this.apiService.getSensorsByFarm(selectedFarm.farm_id).subscribe({
      next: (sensors) => {
        this.sensors = sensors;
        this.isLoading = false;
        console.log('✅ [SENSORS] Loaded', sensors.length, 'sensors for farm');
      },
      error: (error) => {
        console.error('❌ [SENSORS] Error loading sensors:', error);
        this.sensors = [];
        this.isLoading = false;
        this.snackBar.open(this.languageService.t()('errors.networkError'), this.languageService.t()('common.close'), {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Load devices for reference to show parent device names
   */
  private loadDevicesForReference(): void {
    const selectedFarm = this.farmManagement.getSelectedFarm();
    if (!selectedFarm) {
      console.log('⚠️ [SENSORS] No farm selected, skipping devices load');
      this.devices = [];
      return;
    }

    console.log('🏡 [SENSORS] Loading devices for reference');

    this.apiService.getDevicesByFarm(selectedFarm.farm_id).subscribe({
      next: (devices) => {
        this.devices = devices;
        console.log('✅ [SENSORS] Loaded', devices.length, 'devices for reference');
      },
      error: (error) => {
        console.error('❌ [SENSORS] Error loading devices:', error);
        this.devices = [];
      }
    });
  }

  private loadRecentReadings(): void {
    const selectedFarm = this.farmManagement.getSelectedFarm();
    if (!selectedFarm) {
      console.log('⚠️ [SENSORS] No farm selected, skipping recent readings load');
      return;
    }

    console.log('🏡 [SENSORS] Loading recent readings for farm:', selectedFarm.name);

    this.apiService.getSensorReadings(20, 0).subscribe({
      next: (readings) => {
        // Filter readings by selected farm's sensors
        const farmSensorIds = this.sensors.map(sensor => sensor.sensor_id);
        this.recentReadings = readings.filter(reading =>
          farmSensorIds.includes(reading.sensor_id)
        );
      },
      error: (error) => {
        console.error('Error loading sensor readings:', error);
        this.snackBar.open(this.languageService.t()('errors.networkError'), this.languageService.t()('common.close'), {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getSensorTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'temperature':
        return 'thermostat';
      case 'humidity':
        return 'water_drop';
      case 'soil':
        return 'grass';
      case 'light':
        return 'light_mode';
      case 'ph':
        return 'science';
      default:
        return 'sensors';
    }
  }

  getSensorTypeColor(type: string): string {
    switch (type.toLowerCase()) {
      case 'temperature':
        return 'warn';
      case 'humidity':
        return 'primary';
      case 'soil':
        return 'accent';
      case 'light':
        return 'basic';
      case 'ph':
        return 'primary';
      default:
        return 'basic';
    }
  }

  refreshData(): void {
    this.loadSensors();
    this.loadDevicesForReference();
    this.loadRecentReadings();
  }

  /**
   * Get device name by device_id
   */
  getDeviceName(deviceId: string): string {
    const device = this.devices.find(d => d.device_id === deviceId);
    return device ? device.name : this.languageService.t()('sensors.unknownDevice');
  }

  /**
   * Check if sensor has a valid parent device
   */
  hasValidDevice(deviceId: string): boolean {
    return this.devices.some(d => d.device_id === deviceId);
  }

  /**
   * Get orphaned sensors (sensors without a valid parent device)
   */
  getOrphanedSensors(): Sensor[] {
    return this.sensors.filter(sensor =>
      !this.devices.find(device => device.device_id === sensor.device_id)
    );
  }

  /**
   * Check if there are any orphaned sensors
   */
  hasOrphanedSensors(): boolean {
    return this.getOrphanedSensors().length > 0;
  }

  // Translation helper methods
  getSensorTypeTranslation(sensorType: string): string {
    if (!sensorType) {
      return this.languageService.t()('common.none');
    }

    const typeKey = sensorType.toLowerCase();
    const translationKey = `sensors.sensorTypes.${typeKey}`;
    const translation = this.languageService.t()(translationKey);

    // If translation not found, return the original sensor type
    return translation === translationKey ? sensorType : translation;
  }

  getUnitTranslation(unit: string): string {
    if (!unit) {
      return this.languageService.t()('common.none');
    }

    const unitKey = unit.toLowerCase();
    const translationKey = `sensors.units.${unitKey}`;
    const translation = this.languageService.t()(translationKey);

    // If translation not found, return the original unit
    return translation === translationKey ? unit : translation;
  }
}
