import { Component, input, computed, signal, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { CropAnalytics } from '../../services/crop-dashboard.service';

@Component({
  selector: 'app-health-analytics-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    NgxChartsModule,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="analytics-panel">
      <div class="panel-header">
        <mat-icon>insights</mat-icon>
        <h2>{{ 'crops.dashboard.healthAnalytics' | translate }}</h2>
      </div>

      <div class="charts-grid">
        <!-- Soil Moisture Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">
              <mat-icon>water_drop</mat-icon>
              <span>{{ 'crops.kpis.soilMoisture' | translate }}</span>
            </div>
            @if (analytics()?.soilMoisture && analytics()!.soilMoisture.length > 0) {
              <span class="current-value">
                {{ analytics()!.soilMoisture[analytics()!.soilMoisture.length - 1].value | number: '1.0-1' }}%
              </span>
            }
          </div>
          <div class="chart-container">
            @if (soilMoistureChartData().length > 0) {
              <ngx-charts-area-chart
                [results]="soilMoistureChartData()"
                [xAxis]="true"
                [yAxis]="true"
                [showXAxisLabel]="false"
                [showYAxisLabel]="false"
                [timeline]="true"
                [autoScale]="true"
                [animations]="enableAnimations()"
                [scheme]="moistureColorScheme"
                [gradient]="true">
              </ngx-charts-area-chart>
            } @else {
              <div class="no-data">
                <mat-icon>warning</mat-icon>
                <p>No data available</p>
              </div>
            }
          </div>
        </div>

        <!-- Temperature Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">
              <mat-icon>thermostat</mat-icon>
              <span>{{ 'crops.kpis.temperature' | translate }}</span>
            </div>
            @if (analytics()?.temperature && analytics()!.temperature.length > 0) {
              <span class="current-value">
                {{ analytics()!.temperature[analytics()!.temperature.length - 1].value | number: '1.0-1' }}°C
              </span>
            }
          </div>
          <div class="chart-container">
            @if (temperatureChartData().length > 0) {
              <ngx-charts-line-chart
                [results]="temperatureChartData()"
                [xAxis]="true"
                [yAxis]="true"
                [showXAxisLabel]="false"
                [showYAxisLabel]="false"
                [timeline]="true"
                [autoScale]="true"
                [animations]="enableAnimations()"
                [scheme]="temperatureColorScheme"
                [gradient]="true">
              </ngx-charts-line-chart>
            } @else {
              <div class="no-data">
                <mat-icon>warning</mat-icon>
                <p>No data available</p>
              </div>
            }
          </div>
        </div>

        <!-- Humidity Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">
              <mat-icon>opacity</mat-icon>
              <span>{{ 'crops.kpis.humidity' | translate }}</span>
            </div>
            @if (analytics()?.humidity && analytics()!.humidity.length > 0) {
              <span class="current-value">
                {{ analytics()!.humidity[analytics()!.humidity.length - 1].value | number: '1.0-1' }}%
              </span>
            }
          </div>
          <div class="chart-container">
            @if (humidityChartData().length > 0) {
              <ngx-charts-area-chart
                [results]="humidityChartData()"
                [xAxis]="true"
                [yAxis]="true"
                [showXAxisLabel]="false"
                [showYAxisLabel]="false"
                [timeline]="true"
                [autoScale]="true"
                [animations]="enableAnimations()"
                [scheme]="humidityColorScheme"
                [gradient]="true">
              </ngx-charts-area-chart>
            } @else {
              <div class="no-data">
                <mat-icon>warning</mat-icon>
                <p>No data available</p>
              </div>
            }
          </div>
        </div>

        <!-- Sunlight Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">
              <mat-icon>wb_sunny</mat-icon>
              <span>{{ 'crops.kpis.sunlight' | translate }}</span>
            </div>
            @if (analytics()?.sunlight && analytics()!.sunlight.length > 0) {
              <span class="current-value">
                {{ analytics()!.sunlight[analytics()!.sunlight.length - 1].value | number: '1.0-0' }} lux
              </span>
            }
          </div>
          <div class="chart-container">
            @if (sunlightChartData().length > 0) {
              <ngx-charts-line-chart
                [results]="sunlightChartData()"
                [xAxis]="true"
                [yAxis]="true"
                [showXAxisLabel]="false"
                [showYAxisLabel]="false"
                [timeline]="true"
                [autoScale]="true"
                [animations]="enableAnimations()"
                [scheme]="sunlightColorScheme"
                [gradient]="true">
              </ngx-charts-line-chart>
            } @else {
              <div class="no-data">
                <mat-icon>warning</mat-icon>
                <p>No data available</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-panel {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.1);
      contain: layout style paint;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid rgba(16, 185, 129, 0.1);

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #10b981;
      }

      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
      }
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .chart-card {
      background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid rgba(16, 185, 129, 0.1);
      transition: all 0.3s ease;
    }

    .chart-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.3);
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .chart-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #1f2937;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #10b981;
      }
    }

    .current-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #10b981;
    }

    .chart-container {
      height: 200px;
      width: 100%;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #9ca3af;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 0.5rem;
        opacity: 0.5;
      }

      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .analytics-panel {
        padding: 1.5rem;
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }

      .chart-container {
        height: 180px;
      }
    }

    /* Dark theme */
    :host-context(body.dark-theme) {
      .analytics-panel {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(16, 185, 129, 0.2);
      }

      .panel-header {
        border-bottom-color: rgba(16, 185, 129, 0.2);

        h2 {
          color: #f1f5f9;
        }
      }

      .chart-card {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8));
        border-color: rgba(16, 185, 129, 0.2);
      }

      .chart-title {
        color: #e2e8f0;
      }

      .no-data {
        color: #64748b;
      }
    }
  `]
})
export class HealthAnalyticsPanelComponent implements AfterViewInit {
  analytics = input<CropAnalytics | null>(null);
  enableAnimations = signal(false);

  // Color schemes for different charts
  moistureColorScheme: any = { domain: ['#06b6d4', '#0ea5e9'] };
  temperatureColorScheme: any = { domain: ['#ef4444', '#f59e0b'] };
  humidityColorScheme: any = { domain: ['#8b5cf6', '#a78bfa'] };
  sunlightColorScheme: any = { domain: ['#f59e0b', '#fbbf24'] };

  ngAfterViewInit(): void {
    // Enable animations after initial render for better performance
    setTimeout(() => this.enableAnimations.set(true), 150);
  }

  // Memoization cache for chart data
  private chartDataCache = new Map<string, any>();

  // Computed chart data in ngx-charts format with memoization
  soilMoistureChartData = computed(() => {
    const data = this.analytics()?.soilMoisture || [];
    if (data.length === 0) return [];
    
    const cacheKey = `soil-${data.length}-${data[0]?.timestamp}`;
    if (!this.chartDataCache.has(cacheKey)) {
      this.chartDataCache.set(cacheKey, [{
        name: 'Soil Moisture',
        series: data.map(d => ({ name: d.timestamp, value: d.value }))
      }]);
    }
    return this.chartDataCache.get(cacheKey)!;
  });

  temperatureChartData = computed(() => {
    const data = this.analytics()?.temperature || [];
    if (data.length === 0) return [];
    
    const cacheKey = `temp-${data.length}-${data[0]?.timestamp}`;
    if (!this.chartDataCache.has(cacheKey)) {
      this.chartDataCache.set(cacheKey, [{
        name: 'Temperature',
        series: data.map(d => ({ name: d.timestamp, value: d.value }))
      }]);
    }
    return this.chartDataCache.get(cacheKey)!;
  });

  humidityChartData = computed(() => {
    const data = this.analytics()?.humidity || [];
    if (data.length === 0) return [];
    
    const cacheKey = `humidity-${data.length}-${data[0]?.timestamp}`;
    if (!this.chartDataCache.has(cacheKey)) {
      this.chartDataCache.set(cacheKey, [{
        name: 'Humidity',
        series: data.map(d => ({ name: d.timestamp, value: d.value }))
      }]);
    }
    return this.chartDataCache.get(cacheKey)!;
  });

  sunlightChartData = computed(() => {
    const data = this.analytics()?.sunlight || [];
    if (data.length === 0) return [];
    
    const cacheKey = `sunlight-${data.length}-${data[0]?.timestamp}`;
    if (!this.chartDataCache.has(cacheKey)) {
      this.chartDataCache.set(cacheKey, [{
        name: 'Sunlight',
        series: data.map(d => ({ name: d.timestamp, value: d.value }))
      }]);
    }
    return this.chartDataCache.get(cacheKey)!;
  });
}

