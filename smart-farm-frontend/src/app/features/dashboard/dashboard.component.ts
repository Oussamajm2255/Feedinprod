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
import { TranslatePipe } from '../../core/pipes/translate.pipe';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Farm, Device, SensorReading, Sensor } from '../../core/models/farm.model';
import { NotificationService } from '../../core/services/notification.service';
import { LanguageService } from '../../core/services/language.service';
import { FarmManagementService } from '../../core/services/farm-management.service';
import { WeatherService } from '../../core/services/weather.service';
import { WeatherResponse } from '../../core/models/weather.model';
import { User } from '../../core/models/user.model';
import { interval, Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private notifications = inject(NotificationService);
  private authService = inject(AuthService);
  private farmManagement = inject(FarmManagementService);
  private weatherService = inject(WeatherService);
  private router = inject(Router);
  public languageService = inject(LanguageService);

  isLoading = true;
  user = this.authService.user;
  showFab = false;

  // Dashboard data
  devices: Device[] = [];
  recentReadings: SensorReading[] = [];
  statistics: any = {};

  // Farm details
  farmerName: string = '';
  farmDetails: Farm | null = null;

  // Weather data from OpenWeatherMap
  weatherData: WeatherResponse | null = null;
  weatherLoading = false;
  weatherError: string | null = null;

  // Optional sensor data (for enhanced insights)
  sensorTemperature: number | null = null;
  sensorHumidity: number | null = null;

  // AI Insights
  aiInsights: string[] = [];

  // Map
  private map: any = null;
  private mapInitialized = false;

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
      labelKey: 'dashboard.fab.liveReadings',
      gradient: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)',
      iconColor: '#ffffff'
    },
    {
      route: '/devices',
      icon: 'devices',
      labelKey: 'dashboard.fab.devices',
      gradient: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)',
      iconColor: '#ffffff'
    },
    {
      route: '/actions',
      icon: 'settings_remote',
      labelKey: 'dashboard.fab.actionsCenter',
      gradient: 'linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)',
      iconColor: '#ffffff'
    },
    {
      route: '/sensors',
      icon: 'sensors',
      labelKey: 'dashboard.fab.sensorInfo',
      gradient: 'linear-gradient(135deg, #AB47BC 0%, #8E24AA 100%)',
      iconColor: '#ffffff'
    },
    {
      route: '/crops',
      icon: 'grass',
      labelKey: 'dashboard.fab.crops',
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
      } else {
        // Load data for currently selected farm if available
        const currentFarm = this.farmManagement.getSelectedFarm();
        if (currentFarm) {
          this.loadFarmData(currentFarm);
        }
      }
    });

    // Load initial farm data if available
    const initialFarm = this.farmManagement.getSelectedFarm();
    if (initialFarm) {
      this.loadFarmData(initialFarm);
    }

    // Start real-time updates
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
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
    this.farmDetails = farm;
    
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

    // Initialize map if coordinates available
    if (farm.latitude && farm.longitude) {
      setTimeout(() => {
        this.initializeMap(farm.latitude!, farm.longitude!, farm.name, '', farm.location || '');
      }, 100);
    }

    // Load farmer name
    if (farm.owner_id) {
      this.apiService.getUser(farm.owner_id).subscribe({
        next: (user) => {
          this.farmerName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown';
          // Update map popup with farmer name if map is already initialized
          if (this.map && this.mapInitialized) {
            this.updateMapPopup(farm.name, this.farmerName, farm.location || '');
          }
        },
        error: (error) => {
          console.error('Error loading farmer:', error);
          this.farmerName = 'Unknown';
        }
      });
    }

    // Load weather data from OpenWeatherMap API
    if (farm.latitude && farm.longitude) {
      this.loadWeatherData(farm.latitude, farm.longitude);
    } else {
      this.weatherError = 'Farm coordinates not available';
    }

    // Optionally load sensor data for enhanced insights (non-blocking)
    this.loadSensorData(farm.farm_id);
  }

  initializeMap(lat: number, lng: number, farmName: string, ownerName: string = '', description: string = ''): void {
    // Check if Leaflet is available
    if (typeof (window as any).L === 'undefined') {
      console.warn('Leaflet not loaded yet');
      return;
    }

    const L = (window as any).L;
    const mapContainer = document.getElementById('farm-map');
    if (!mapContainer) {
      return;
    }

    // Remove existing map if any
    if (this.map) {
      this.map.remove();
    }

    // Initialize map
    this.map = L.map('farm-map').setView([lat, lng], 15);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Build popup content
    let popupContent = `<strong>${farmName}</strong>`;
    if (ownerName && ownerName !== 'Unknown') {
      popupContent += `<br><strong>Owner:</strong> ${ownerName}`;
    }
    if (description) {
      popupContent += `<br><strong>Description:</strong> ${description}`;
    }
    popupContent += `<br><small>${lat}, ${lng}</small>`;

    // Add marker
    L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(popupContent)
      .openPopup();

    this.mapInitialized = true;
  }

  updateMapPopup(farmName: string, ownerName: string, description: string): void {
    if (!this.map) return;

    // Find the marker and update its popup
    this.map.eachLayer((layer: any) => {
      if (layer instanceof (window as any).L.Marker) {
        let popupContent = `<strong>${farmName}</strong>`;
        if (ownerName && ownerName !== 'Unknown') {
          popupContent += `<br><strong>Owner:</strong> ${ownerName}`;
        }
        if (description) {
          popupContent += `<br><strong>Description:</strong> ${description}`;
        }
        const latlng = layer.getLatLng();
        popupContent += `<br><small>${latlng.lat}, ${latlng.lng}</small>`;
        layer.setPopupContent(popupContent);
      }
    });
  }

  loadWeatherData(lat: number, lon: number): void {
    this.weatherLoading = true;
    this.weatherError = null;

    this.weatherService.getWeather(lat, lon).pipe(
      catchError((error) => {
        console.error('Error loading weather data:', error);
        this.weatherError = error.message || 'Failed to load weather data';
        this.weatherLoading = false;
        return of(null);
      })
    ).subscribe({
      next: (data) => {
        if (data) {
          this.weatherData = data;
          // Generate AI insights after weather data loads
          this.generateAIInsights();
        }
        this.weatherLoading = false;
      }
    });
  }

  loadSensorData(farmId: string): void {
    // Optional: Load sensor data for enhanced insights (non-blocking)
    this.apiService.getSensorsByFarm(farmId).subscribe({
      next: (sensors) => {
        const tempSensor = sensors.find(s => 
          s.type.toLowerCase().includes('temp') || 
          s.unit.toLowerCase().includes('c') ||
          s.unit.toLowerCase().includes('°')
        );
        const humiditySensor = sensors.find(s => 
          s.type.toLowerCase().includes('humid') || 
          s.unit.toLowerCase().includes('%')
        );

        const tempRequest = tempSensor 
          ? this.apiService.getLatestReading(tempSensor.sensor_id).pipe(catchError(() => of(null)))
          : of(null);
        
        const humidityRequest = humiditySensor
          ? this.apiService.getLatestReading(humiditySensor.sensor_id).pipe(catchError(() => of(null)))
          : of(null);

        forkJoin([tempRequest, humidityRequest]).subscribe({
          next: (readings) => {
            const tempReading = (readings[0] || null) as SensorReading | null;
            const humidityReading = (readings[1] || null) as SensorReading | null;

            if (tempReading && tempSensor) {
              const typeLower = tempSensor.type.toLowerCase();
              const unitLower = tempSensor.unit.toLowerCase();
              if (typeLower.includes('temp') || unitLower.includes('c') || unitLower.includes('°')) {
                this.sensorTemperature = tempReading.value1 || tempReading.value2 || null;
              } else {
                this.sensorTemperature = tempReading.value1 || null;
              }
            }

            if (humidityReading && humiditySensor) {
              const typeLower = humiditySensor.type.toLowerCase();
              const unitLower = humiditySensor.unit.toLowerCase();
              if (typeLower.includes('humid') || unitLower.includes('%')) {
                this.sensorHumidity = humidityReading.value2 || humidityReading.value1 || null;
              } else {
                this.sensorHumidity = humidityReading.value1 || null;
              }
            }

            // Regenerate insights with sensor data
            this.generateAIInsights();
          },
          error: (error) => {
            console.error('Error loading sensor data:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error loading sensors:', error);
      }
    });
  }

  generateAIInsights(): void {
    this.aiInsights = [];
    
    if (!this.weatherData) {
      return;
    }

    const current = this.weatherData.current;
    const temp = current.temp;
    const feelsLike = current.feels_like;
    const humidity = current.humidity;
    const windSpeed = current.wind_speed;
    const clouds = current.clouds;
    const pop = this.weatherData.hourly[0]?.pop || 0;
    
    // Use sensor data if available, otherwise use weather API data
    const actualTemp = this.sensorTemperature ?? temp;
    const actualHumidity = this.sensorHumidity ?? humidity;

    // Temperature-based insights
    if (temp > 35) {
      this.aiInsights.push('High temperature warning. Ensure adequate water supply and consider shade protection for sensitive crops.');
    } else if (temp < 10) {
      this.aiInsights.push('Low temperature detected. Protect crops from potential frost damage.');
    } else if (feelsLike > temp + 3) {
      this.aiInsights.push('High heat index. Crops may experience additional stress. Increase irrigation frequency.');
    }

    // Humidity-based insights
    if (actualHumidity < 40 && temp > 25) {
      this.aiInsights.push('Low humidity and high temperature detected. Consider irrigation to maintain optimal soil moisture.');
    } else if (actualHumidity < 30) {
      this.aiInsights.push('Very low humidity detected. Irrigation recommended to prevent crop stress.');
    } else if (actualHumidity > 80) {
      this.aiInsights.push('High humidity detected. Monitor for potential fungal issues and ensure proper ventilation.');
    }

    // Wind-based insights
    if (windSpeed > 15) {
      this.aiInsights.push('High wind speed detected. Secure any loose equipment and monitor for potential crop damage.');
    }

    // Precipitation probability
    if (pop > 0.7) {
      this.aiInsights.push('High probability of rain in the next hour. Consider adjusting irrigation schedules.');
    } else if (pop > 0.5) {
      this.aiInsights.push('Moderate chance of rain. Monitor weather conditions closely.');
    }

    // Cloud cover
    if (clouds > 80) {
      this.aiInsights.push('Heavy cloud cover. Reduced sunlight may affect photosynthesis. Monitor crop growth.');
    } else if (clouds < 20 && temp > 30) {
      this.aiInsights.push('Clear skies and high temperature. Ensure adequate irrigation and consider shade for sensitive crops.');
    }

    // Combined conditions
    if (actualHumidity > 70 && temp > 30) {
      this.aiInsights.push('High humidity and temperature combination. Monitor for heat stress and ensure proper ventilation.');
    }

    // Daily forecast insights
    if (this.weatherData.daily && this.weatherData.daily.length > 0) {
      const tomorrow = this.weatherData.daily[1];
      if (tomorrow) {
        if (tomorrow.pop > 0.7) {
          this.aiInsights.push(`Tomorrow: High chance of rain (${Math.round(tomorrow.pop * 100)}%). Plan irrigation accordingly.`);
        }
        if (tomorrow.temp.max > 35) {
          this.aiInsights.push(`Tomorrow: Very high temperature expected (${Math.round(tomorrow.temp.max)}°C). Prepare cooling measures.`);
        }
        if (tomorrow.temp.min < 5) {
          this.aiInsights.push(`Tomorrow: Low temperature expected (${Math.round(tomorrow.temp.min)}°C). Protect crops from frost.`);
        }
      }
    }

    if (this.aiInsights.length === 0) {
      this.aiInsights.push('Weather conditions are within normal ranges. Continue monitoring.');
    }
  }

  // Helper methods for weather display
  getWeatherIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  getGoogleMapsUrl(): string {
    const farm = this.selectedFarm;
    if (farm?.latitude && farm?.longitude) {
      return `https://www.google.com/maps?q=${farm.latitude},${farm.longitude}`;
    }
    return '';
  }

  hasMapData(): boolean {
    const farm = this.selectedFarm;
    return !!(farm?.latitude && farm?.longitude);
  }

  openInGoogleMaps(): void {
    const url = this.getGoogleMapsUrl();
    if (url) {
      window.open(url, '_blank');
    }
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
