import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Farm, Device, SensorReading } from '../../core/models/farm.model';
import { NotificationService } from '../../core/services/notification.service';
import { LanguageService } from '../../core/services/language.service';
import { FarmManagementService } from '../../core/services/farm-management.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatChipsModule,
    MatTableModule,
    MatTabsModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private notifications = inject(NotificationService);
  private authService = inject(AuthService);
  private farmManagement = inject(FarmManagementService);
  private router = inject(Router);
  public languageService = inject(LanguageService);

  isLoading = true;
  user = this.authService.user;
  showFab = false;

  // Dashboard data
  devices: Device[] = [];
  recentReadings: SensorReading[] = [];
  statistics: any = {};

  // FAB Configuration with circular positioning
  circularDistance = 110; // Distance from center in pixels

  /**
   * FAB action buttons configuration
   * Each button has: route, icon, label, gradient colors for stunning visuals
   */
  fabActions = [
    {
      route: '/sensor-readings',
      icon: 'timeline',
      label: 'Live Readings',
      gradient: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)',
      iconColor: '#ffffff'
    },
    {
      route: '/devices',
      icon: 'devices',
      label: 'Devices',
      gradient: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)',
      iconColor: '#ffffff'
    },
    {
      route: '/actions',
      icon: 'settings_remote',
      label: 'Actions Center',
      gradient: 'linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)',
      iconColor: '#ffffff'
    },
    {
      route: '/sensors',
      icon: 'sensors',
      label: 'Sensor Info',
      gradient: 'linear-gradient(135deg, #AB47BC 0%, #8E24AA 100%)',
      iconColor: '#ffffff'
    },
    {
      route: '/crops',
      icon: 'grass',
      label: 'Crops',
      gradient: 'linear-gradient(135deg, #26A69A 0%, #00897B 100%)',
      iconColor: '#ffffff'
    }
  ];

  // Real-time updates
  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 300000; // 5 minutes (300,000 milliseconds)

  // Farm management - now using global service
  get farms() { return this.farmManagement.farms(); }
  get selectedFarm() { return this.farmManagement.selectedFarm(); }
  get hasMultipleFarms() { return this.farmManagement.hasMultipleFarms(); }

  // Displayed columns for tables (kept for potential future use)
  displayedColumns: string[] = ['sensor_id', 'value1', 'unit', 'createdAt'];
  deviceColumns: string[] = ['name', 'status', 'location', 'last_seen'];

  ngOnInit(): void {
    this.loadDashboardData();

    // Subscribe to farm selection changes
    this.farmManagement.selectedFarm$.subscribe(selectedFarm => {
      if (selectedFarm) {
        this.loadFarmData(selectedFarm);
      }
    });

    // Start real-time updates
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private startRealTimeUpdates(): void {
    // Refresh data every 5 minutes
    this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
      this.refreshDeviceStatus();
    });
  }

  private refreshDeviceStatus(): void {
    // Only refresh device status, not all data
    const selectedFarm = this.farmManagement.getSelectedFarm();
    if (selectedFarm) {
      this.apiService.getDevicesByFarm(selectedFarm.farm_id).subscribe({
        next: (devices) => {
          this.devices = devices;
          this.notifyOfflineDevices(devices);
        },
        error: (error) => {
          console.error('Error refreshing device status:', error);
        }
      });
    } else {
      this.apiService.getDevices(true).subscribe({
        next: (devices) => {
          this.devices = devices;
          this.notifyOfflineDevices(devices);
        },
        error: (error) => {
          console.error('Error refreshing device status:', error);
        }
      });
    }
  }

  private loadDashboardData(): void {
    this.isLoading = true;

    // Load devices for selected farm
    const selectedFarm = this.farmManagement.getSelectedFarm();
    if (selectedFarm) {
      this.loadFarmData(selectedFarm);
    } else {
      // Load all devices if no farm selected
      this.apiService.getDevices(true).subscribe({
        next: (devices) => {
          this.devices = devices;
          this.notifyOfflineDevices(devices);
        },
        error: (error) => {
          console.error('Error loading devices:', error);
        }
      });
    }

    // Load recent sensor readings
    this.apiService.getSensorReadings(10, 0).subscribe({
      next: (readings) => {
        this.recentReadings = readings;
      },
      error: (error) => {
        console.error('Error loading sensor readings:', error);
      }
    });

    // Load device statistics
    this.apiService.getDeviceStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.isLoading = false;
      }
    });
  }

  private notifyOfflineDevices(devices: Device[]): void {
    const offline = devices.filter(d => d.status?.toLowerCase?.() === 'offline');
    for (const d of offline) {
      const key = `device:${d.device_id}:offline`;
      if (this.notifications.shouldNotify(key, 'warning')) {
        this.notifications.notify('warning', this.languageService.t()('devices.statusOffline'), `${d.name || d.device_id}`, { source: 'device', context: d });
      }
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'online':
        return 'primary';
      case 'offline':
        return 'warn';
      case 'maintenance':
        return 'accent';
      default:
        return 'basic';
    }
  }

  getDeviceStatusCount(status: string): number {
    return this.devices.filter(device => device.status?.toLowerCase() === status.toLowerCase()).length;
  }

  getOnlinePercentage(): number {
    if (this.devices.length === 0) return 0;
    const onlineCount = this.getDeviceStatusCount('online');
    return Math.round((onlineCount / this.devices.length) * 100);
  }

  getOfflinePercentage(): number {
    if (this.devices.length === 0) return 0;
    const offlineCount = this.getDeviceStatusCount('offline');
    return Math.round((offlineCount / this.devices.length) * 100);
  }

  getMaintenancePercentage(): number {
    if (this.devices.length === 0) return 0;
    const maintenanceCount = this.getDeviceStatusCount('maintenance');
    return Math.round((maintenanceCount / this.devices.length) * 100);
  }

  getOnlineRateColor(): string {
    const percentage = this.getOnlinePercentage();
    if (percentage >= 90) return 'primary';
    if (percentage >= 70) return 'accent';
    return 'warn';
  }

  getOnlineRateIcon(): string {
    const percentage = this.getOnlinePercentage();
    if (percentage >= 90) return 'trending_up';
    if (percentage >= 70) return 'trending_flat';
    return 'trending_down';
  }

  getDeviceStatusSummary(): { online: number; offline: number; maintenance: number; total: number } {
    return {
      online: this.getDeviceStatusCount('online'),
      offline: this.getDeviceStatusCount('offline'),
      maintenance: this.getDeviceStatusCount('maintenance'),
      total: this.devices.length
    };
  }

  getLastUpdateTime(): Date {
    return new Date();
  }

  isDeviceRecentlyOnline(device: Device): boolean {
    if (!device.last_seen) return false;
    const lastSeen = new Date(device.last_seen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    return diffMinutes <= 5; // Consider "recently online" if seen within 5 minutes
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  trackByReadingId(index: number, reading: SensorReading): string {
    return reading.id;
  }

  getReadingStatus(reading: SensorReading): string {
    // Simple status based on value ranges - can be enhanced with actual thresholds
    const value = reading.value1 || 0;
    if (value < 10) return this.languageService.t()('sensorReadings.belowMinimum');
    if (value > 35) return this.languageService.t()('sensorReadings.aboveMaximum');
    return this.languageService.t()('sensorReadings.normal');
  }

  getReadingStatusClass(reading: SensorReading): string {
    const value = reading.value1 || 0;
    if (value < 10) return 'status-low';
    if (value > 35) return 'status-high';
    return 'status-normal';
  }

  // Farm selection methods
  selectFarm(farm: Farm): void {
    this.farmManagement.selectFarm(farm);
  }

  loadFarmData(farm: Farm): void {
    // Load devices for selected farm
    this.apiService.getDevicesByFarm(farm.farm_id).subscribe({
      next: (devices) => {
        this.devices = devices;
        this.notifyOfflineDevices(devices);
      },
      error: (error) => {
        console.error('Error loading farm devices:', error);
      }
    });

    // Load sensor readings for selected farm
    this.apiService.getSensorReadings(10, 0).subscribe({
      next: (readings) => {
        this.recentReadings = readings;
      },
      error: (error) => {
        console.error('Error loading farm readings:', error);
      }
    });
  }

  getFarmDisplayName(): string {
    return this.farmManagement.getFarmDisplayName();
  }

  getFarmLocation(): string {
    return this.farmManagement.getFarmLocation();
  }

  getFarmDeviceCount(): number {
    if (this.selectedFarm) {
      return this.devices.filter(d => d.farm_id === this.selectedFarm!.farm_id).length;
    }
    return this.devices.length;
  }

  // FAB Methods

  /**
   * Calculate angle for circular positioning
   * Distributes buttons evenly in a 360° circle
   *
   * Formula: angle = startAngle + (360 / totalButtons) * index
   * - startAngle: 90° (top position, pointing upward)
   * - This creates a perfect circular distribution
   *
   * Example with 5 buttons:
   * - Button 0: 90° (top)
   * - Button 1: 162° (top-left)
   * - Button 2: 234° (left)
   * - Button 3: 306° (bottom-left)
   * - Button 4: 18° (top-right)
   */
  getAngle(index: number): number {
    const totalButtons = this.fabActions.length;
    const startAngle = 90; // Start from top (12 o'clock position)
    const angleStep = 360 / totalButtons; // Divide circle evenly
    return startAngle + (angleStep * index);
  }

  toggleFab(): void {
    this.showFab = !this.showFab;

    // Update circular distance based on screen size
    this.updateCircularDistance();

    if (this.showFab) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeFab(): void {
    this.showFab = false;
    document.body.style.overflow = '';
  }

  navigateAndCloseFab(route: string): void {
    this.closeFab();
    this.router.navigate([route]);
  }

  /**
   * Update circular distance based on screen width
   * Ensures buttons don't go off-screen on smaller devices
   */
  private updateCircularDistance(): void {
    const screenWidth = window.innerWidth;

    if (screenWidth < 480) {
      this.circularDistance = 75; // Small mobile
    } else if (screenWidth < 768) {
      this.circularDistance = 85; // Tablet/large mobile
    } else {
      this.circularDistance = 110; // Desktop
    }
  }
}
