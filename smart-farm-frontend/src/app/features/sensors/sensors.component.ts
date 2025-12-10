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
import { Sensor, SensorReading } from '../../core/models/farm.model';
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
  recentReadings: SensorReading[] = [];
  isLoading = true;
  displayedColumns: string[] = ['sensor_id', 'type', 'unit', 'location', 'device_id']; // Removed 'actions' column
  readingColumns: string[] = ['sensor_id', 'value1', 'value2', 'createdAt'];

  ngOnInit(): void {
    this.loadSensors();
    this.loadRecentReadings();
    
    // Subscribe to farm selection changes
    this.farmManagement.selectedFarm$.subscribe(selectedFarm => {
      if (selectedFarm) {
        console.log('🏡 [SENSORS] Farm changed, reloading sensors for:', selectedFarm.name);
        this.loadSensors();
        this.loadRecentReadings();
      }
    });
  }

  private loadSensors(): void {
    this.isLoading = true;
    
    const selectedFarm = this.farmManagement.getSelectedFarm();
    if (!selectedFarm) {
      console.log('⚠️ [SENSORS] No farm selected, skipping sensors load');
      this.isLoading = false;
      return;
    }
    
    console.log('🏡 [SENSORS] Loading sensors for farm:', selectedFarm.name);
    
    this.apiService.getSensors().subscribe({
      next: (sensors) => {
        // Filter sensors by selected farm
        this.sensors = sensors.filter(sensor => sensor.farm_id === selectedFarm.farm_id);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sensors:', error);
        this.isLoading = false;
        this.snackBar.open(this.languageService.t()('errors.networkError'), this.languageService.t()('common.close'), { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
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
    this.loadRecentReadings();
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
