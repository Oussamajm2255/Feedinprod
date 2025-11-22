import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SensorStatus } from '../../utils/sensor-status.util';

export interface DeviceDetail {
  id: string;
  name: string;
  type: string;
  status: SensorStatus;
  currentValue: number;
  unit: string;
  lastUpdate: Date | null;
  delta1h?: number;
  thresholds: {
    min: number;
    max: number;
    optimalMin: number;
    optimalMax: number;
  };
  chartData: Array<{ name: Date; value: number }>;
}

@Component({
  selector: 'app-device-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatMenuModule,
    NgxChartsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="detail-panel">
      @if (loading()) {
        <!-- Loading Skeleton -->
        <div class="loading-detail">
          <div class="skeleton-header">
            <div class="skeleton-circle large"></div>
            <div class="skeleton-content">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>
          <div class="skeleton-chart"></div>
        </div>
      } @else if (device()) {
        <!-- Device Header -->
        <div class="detail-header" [class]="'status-' + device()!.status">
          <div class="header-left">
            <div class="status-icon" [class]="'icon-' + device()!.status">
              <mat-icon>{{ getStatusIcon(device()!.status) }}</mat-icon>
            </div>
            <div class="header-info">
              <h2>{{ device()!.name }}</h2>
              <p class="device-type">{{ device()!.type }}</p>
            </div>
          </div>
          <div class="status-chip" [class]="'chip-' + device()!.status">
            {{ device()!.status | uppercase }}
          </div>
        </div>

        <!-- KPIs -->
        <div class="kpi-section">
          <div class="kpi-card primary">
            <div class="kpi-icon">
              <mat-icon>thermostat</mat-icon>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Current Value</span>
              <div class="kpi-value-row">
                <span class="kpi-value">{{ device()!.currentValue | number: '1.0-2' }}</span>
                <span class="kpi-unit">{{ device()!.unit }}</span>
                @if (device()!.delta1h !== undefined && device()!.delta1h !== null) {
                  <span class="kpi-delta" [class.positive]="device()!.delta1h! > 0" [class.negative]="device()!.delta1h! < 0">
                    <mat-icon>{{ device()!.delta1h! > 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                    {{ device()!.delta1h! > 0 ? '+' : '' }}{{ device()!.delta1h | number: '1.0-1' }}
                  </span>
                }
              </div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon secondary">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Last Update</span>
              <span class="kpi-text">{{ formatDateTime(device()!.lastUpdate) }}</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon tertiary">
              <mat-icon>insights</mat-icon>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Optimal Range</span>
              <span class="kpi-text">{{ device()!.thresholds.optimalMin }} – {{ device()!.thresholds.optimalMax }} {{ device()!.unit }}</span>
            </div>
          </div>
        </div>

        <!-- Threshold Visual -->
        <div class="threshold-section">
          <div class="threshold-header">
            <mat-icon>tune</mat-icon>
            <span>Threshold Zones</span>
          </div>
          <div class="threshold-bar">
            <div class="bar-track">
              <div
                class="optimal-zone"
                [style.left.%]="getPosition(device()!.thresholds.optimalMin)"
                [style.width.%]="getWidth(device()!.thresholds.optimalMin, device()!.thresholds.optimalMax)"
              ></div>
              <div
                class="current-marker"
                [style.left.%]="getPosition(device()!.currentValue)"
                [matTooltip]="'Current: ' + device()!.currentValue + ' ' + device()!.unit"
              >
                <div class="marker-pulse"></div>
              </div>
            </div>
            <div class="threshold-labels">
              <span class="label-min">{{ device()!.thresholds.min }}</span>
              <span class="label-optimal-min">{{ device()!.thresholds.optimalMin }}</span>
              <span class="label-optimal-max">{{ device()!.thresholds.optimalMax }}</span>
              <span class="label-max">{{ device()!.thresholds.max }}</span>
            </div>
          </div>
        </div>

        <!-- Chart -->
        <div class="chart-section">
          <div class="chart-header">
            <div class="chart-header-left">
              <mat-icon>show_chart</mat-icon>
              <span>Historical Data</span>
            </div>
            <div class="chart-controls">
              <!-- View Toggle -->
              <mat-button-toggle-group [(value)]="viewMode" class="view-toggle-group" [appearance]="'standard'">
                <mat-button-toggle value="chart" matTooltip="Chart View">
                  <mat-icon>show_chart</mat-icon>
                </mat-button-toggle>
                <mat-button-toggle value="table" matTooltip="Table View">
                  <mat-icon>table_rows</mat-icon>
                </mat-button-toggle>
                <mat-button-toggle value="timeline" matTooltip="Timeline View">
                  <mat-icon>timeline</mat-icon>
                </mat-button-toggle>
              </mat-button-toggle-group>

              <!-- Export Menu -->
              <button mat-stroked-button [matMenuTriggerFor]="exportMenu" class="export-btn">
                <mat-icon>download</mat-icon>
                Export
              </button>
              <mat-menu #exportMenu="matMenu" class="export-menu">
                <button mat-menu-item (click)="exportToCSV()">
                  <mat-icon>description</mat-icon>
                  <span>Export CSV</span>
                </button>
                <button mat-menu-item (click)="exportToPDF()">
                  <mat-icon>picture_as_pdf</mat-icon>
                  <span>Export PDF</span>
                </button>
              </mat-menu>
            </div>
          </div>
          @if (chartSeriesData().length > 0) {
            <!-- Chart View -->
            @if (viewMode() === 'chart') {
              <div class="chart-container">
                <ngx-charts-line-chart
                  [results]="chartSeriesData()"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="false"
                  [showYAxisLabel]="false"
                  [timeline]="true"
                  [autoScale]="true"
                  [curve]="curveFunction"
                  [animations]="true"
                  [scheme]="colorScheme"
                  [showGridLines]="true"
                  [gradient]="true"
                >
                </ngx-charts-line-chart>
              </div>
            }

            <!-- Table View -->
            @if (viewMode() === 'table') {
              <div class="data-table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (point of device()!.chartData; track point.name) {
                      <tr>
                        <td>{{ point.name | date:'short' }}</td>
                        <td>{{ point.value | number: '1.0-2' }} {{ device()!.unit }}</td>
                        <td>
                          <span class="table-status-badge" [class]="getValueStatus(point.value)">
                            {{ getValueStatus(point.value) | uppercase }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- Timeline View -->
            @if (viewMode() === 'timeline') {
              <div class="timeline-container">
                <div class="timeline-track"></div>
                @for (point of device()!.chartData; track point.name; let i = $index) {
                  <div class="timeline-entry" [style.animation-delay]="i * 30 + 'ms'">
                    <div class="timeline-marker" [class]="getValueStatus(point.value)">
                      <div class="timeline-dot"></div>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-time">{{ point.name | date:'short' }}</div>
                      <div class="timeline-value">
                        <span class="value-text">{{ point.value | number: '1.0-2' }}</span>
                        <span class="value-unit">{{ device()!.unit }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          } @else {
            <div class="no-chart-data">
              <mat-icon>timeline</mat-icon>
              <p>No historical data available</p>
            </div>
          }
        </div>
      } @else {
        <!-- Empty State -->
        <div class="empty-detail">
          <div class="empty-icon">
            <mat-icon>touch_app</mat-icon>
          </div>
          <h3>Select a Sensor</h3>
          <p>Choose a sensor from the list to view detailed information and charts</p>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .detail-panel {
        height: 100%;
        background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        overflow: auto;
        animation: fadeInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      @keyframes fadeInRight {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .loading-detail {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .skeleton-header {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .skeleton-circle {
        border-radius: 50%;
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }

      .skeleton-circle.large {
        width: 64px;
        height: 64px;
      }

      .skeleton-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .skeleton-line {
        height: 16px;
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
        background-size: 200% 100%;
        border-radius: 8px;
        animation: shimmer 1.5s infinite;
      }

      .skeleton-line.short {
        width: 60%;
      }

      .skeleton-chart {
        height: 300px;
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
        background-size: 200% 100%;
        border-radius: 16px;
        animation: shimmer 1.5s infinite;
      }

      /* Dark theme skeleton loading */
      :host-context(body.dark-theme) .skeleton-circle,
      :host-context(body.dark-theme) .skeleton-line,
      :host-context(body.dark-theme) .skeleton-chart {
        background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
        background-size: 200% 100%;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        border-left: 4px solid transparent;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .detail-header.status-critical {
        border-left-color: #ef4444;
        background: linear-gradient(to right, rgba(239, 68, 68, 0.05), white);
      }

      .detail-header.status-warning {
        border-left-color: #f59e0b;
        background: linear-gradient(to right, rgba(245, 158, 11, 0.05), white);
      }

      .detail-header.status-normal {
        border-left-color: #10b981;
        background: linear-gradient(to right, rgba(16, 185, 129, 0.05), white);
      }

      .detail-header.status-offline {
        border-left-color: #6b7280;
        background: linear-gradient(to right, rgba(107, 114, 128, 0.05), white);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .status-icon {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
        border: 1px solid transparent;
      }

      .status-icon mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .icon-normal {
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        color: #065f46;
        border-color: #a7f3d0;
      }

      .icon-warning {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        color: #92400e;
        border-color: #fde68a;
      }

      .icon-critical {
        background: linear-gradient(135deg, #fee2e2, #fecaca);
        color: #991b1b;
        animation: pulse 2s infinite;
        border-color: #fecaca;
      }

      .icon-offline {
        background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        color: #4b5563;
        border-color: #e5e7eb;
      }

      .header-info h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
      }

      .device-type {
        margin: 4px 0 0 0;
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
        text-transform: capitalize;
      }

      .status-chip {
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        border: 1px solid transparent;
      }

      .chip-normal {
        background: #d1fae5;
        color: #065f46;
        border-color: #a7f3d0;
      }

      .chip-warning {
        background: #fef3c7;
        color: #92400e;
        border-color: #fde68a;
      }

      .chip-critical {
        background: #fee2e2;
        color: #991b1b;
        border-color: #fecaca;
      }

      .chip-offline {
        background: #f3f4f6;
        color: #4b5563;
        border-color: #e5e7eb;
      }

      .kpi-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .kpi-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        display: flex;
        align-items: center;
        gap: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .kpi-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
      }

      .kpi-card.primary {
        background: linear-gradient(135deg, #005f5b, #047857);
        color: white;
        grid-column: 1 / -1;
        box-shadow: 0 8px 24px rgba(0, 95, 91, 0.25),
                    inset 0 1px 1px rgba(255, 255, 255, 0.2);
      }

      .kpi-card.primary:hover {
        box-shadow: 0 12px 32px rgba(0, 95, 91, 0.35),
                    inset 0 1px 1px rgba(255, 255, 255, 0.3);
        transform: translateY(-4px) scale(1.01);
      }

      .kpi-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .kpi-card.primary .kpi-icon {
        background: rgba(255, 255, 255, 0.25);
      }

      .kpi-icon mat-icon {
        color: white;
      }

      .kpi-icon.secondary {
        background: linear-gradient(135deg, #667eea, #764ba2);
      }

      .kpi-icon.tertiary {
        background: linear-gradient(135deg, #f59e0b, #ef4444);
      }

      .kpi-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      }

      .kpi-label {
        font-size: 0.75rem;
        font-weight: 600;
        opacity: 0.9;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .kpi-card.primary .kpi-label {
        color: rgba(255, 255, 255, 0.9);
      }

      .kpi-card:not(.primary) .kpi-label {
        color: #6b7280;
      }

      .kpi-value-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }

      .kpi-value {
        font-size: 2rem;
        font-weight: 700;
        line-height: 1;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .kpi-unit {
        font-size: 1rem;
        font-weight: 600;
        opacity: 0.8;
      }

      .kpi-text {
        font-size: 0.9375rem;
        font-weight: 600;
        color: #1f2937;
      }

      .kpi-delta {
        display: flex;
        align-items: center;
        gap: 2px;
        font-size: 0.875rem;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.2);
      }

      .kpi-delta mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .kpi-delta.positive {
        color: #10b981;
      }

      .kpi-delta.negative {
        color: #ef4444;
      }

      .threshold-section {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      }

      .threshold-header,
      .chart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-weight: 700;
        font-size: 1rem;
        color: #1f2937;
        margin-bottom: 16px;
      }

      .chart-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .chart-header mat-icon {
        color: #667eea;
      }

      .chart-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      /* View Toggle Group - Enhanced */
      .view-toggle-group {
        display: inline-flex;
        border-radius: 14px;
        overflow: hidden;
        border: 2px solid rgba(16, 185, 129, 0.15);
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.08),
          0 0 0 1px rgba(255, 255, 255, 0.5) inset,
          0 1px 2px rgba(0, 0, 0, 0.05) inset;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9));
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        position: relative;
        gap: 2px;
        padding: 2px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .view-toggle-group:hover {
        border-color: rgba(16, 185, 129, 0.3);
        box-shadow: 
          0 6px 16px rgba(16, 185, 129, 0.15),
          0 0 0 1px rgba(255, 255, 255, 0.6) inset,
          0 1px 2px rgba(0, 0, 0, 0.05) inset;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle {
        border: none;
        background: transparent;
        color: #64748b;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        margin: 0;
        min-width: 48px;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.1);
        transform: translate(-50%, -50%);
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle:hover::before {
        width: 100%;
        height: 100%;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle-button {
        padding: 10px 18px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
        border-radius: 10px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: #64748b;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 2;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle:hover {
        background: rgba(16, 185, 129, 0.08);
        transform: translateY(-1px);
      }

      .view-toggle-group ::ng-deep .mat-button-toggle:hover mat-icon {
        color: #10b981;
        transform: scale(1.15) rotate(5deg);
      }

      .view-toggle-group ::ng-deep .mat-button-toggle-checked {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 
          0 4px 12px rgba(16, 185, 129, 0.3),
          0 2px 4px rgba(0, 0, 0, 0.1) inset,
          0 0 0 1px rgba(255, 255, 255, 0.2) inset;
        transform: translateY(-1px);
        position: relative;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle-checked::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
        border-radius: 10px;
        pointer-events: none;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle-checked mat-icon {
        color: white;
        transform: scale(1.15);
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
      }

      /* Hide Material's pseudo-checkbox checkmark - but keep the actual icons */
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-pseudo-checkbox,
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-pseudo-checkbox-checked,
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-pseudo-checkbox-minimal,
      .view-toggle-group ::ng-deep .mat-pseudo-checkbox,
      .view-toggle-group ::ng-deep .mat-pseudo-checkbox-checked,
      .view-toggle-group ::ng-deep .mat-pseudo-checkbox-minimal,
      .view-toggle-group ::ng-deep *[class*="pseudo-checkbox"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        pointer-events: none !important;
      }

      /* Hide any checkmark SVG or icon elements - specifically target check icons only */
      .view-toggle-group ::ng-deep .mat-button-toggle svg[data-mat-icon-name="check"],
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-icon svg:has(path[d*="M9 16.17"]),
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-icon svg:has(path[d*="M21 7"]),
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[data-mat-icon-name="check"],
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[data-mat-icon-type="check"],
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon:has-text("check") {
        display: none !important;
        visibility: hidden !important;
      }

      /* Hide checkmark icons but preserve our actual icons */
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[class*="check"]:not([class*="show_chart"]):not([class*="table_rows"]):not([class*="timeline"]),
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[aria-label*="check" i],
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[aria-label*="Check" i] {
        display: none !important;
        visibility: hidden !important;
      }

      /* Target any element that contains a checkmark path in SVG */
      .view-toggle-group ::ng-deep .mat-button-toggle svg path[d*="M9 16.17"],
      .view-toggle-group ::ng-deep .mat-button-toggle svg path[d*="M21 7"],
      .view-toggle-group ::ng-deep .mat-button-toggle svg path[d*="L4.83 12"] {
        display: none !important;
        visibility: hidden !important;
      }

      /* Ensure our actual icons stay visible */
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[class*="show_chart"],
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[class*="table_rows"],
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[class*="timeline"] {
        display: inline-flex !important;
        visibility: visible !important;
      }

      /* Nuclear option: Hide any mat-icon that contains "check" in its text content or innerHTML */
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-button-toggle-button {
        position: relative;
      }

      /* Hide checkmark by targeting the specific Material check icon */
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon:not([class*="show_chart"]):not([class*="table_rows"]):not([class*="timeline"]) {
        /* Only hide if it's not one of our icons */
      }

      /* More aggressive: Hide any second icon element or checkmark */
      .view-toggle-group ::ng-deep .mat-button-toggle-checked .mat-button-toggle-button > mat-icon:nth-child(2),
      .view-toggle-group ::ng-deep .mat-button-toggle-checked .mat-button-toggle-button > mat-icon:last-child:not(:first-child),
      .view-toggle-group ::ng-deep .mat-button-toggle-checked .mat-button-toggle-button mat-icon + mat-icon {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }

      /* Universal checkmark hiding - target any element that might be a checkmark */
      .view-toggle-group ::ng-deep .mat-button-toggle *::before,
      .view-toggle-group ::ng-deep .mat-button-toggle *::after {
        content: none !important;
      }

      /* Hide any element with checkmark-related content */
      .view-toggle-group ::ng-deep .mat-button-toggle [class*="check"]:not([class*="show_chart"]):not([class*="table_rows"]):not([class*="timeline"]),
      .view-toggle-group ::ng-deep .mat-button-toggle [aria-label*="check" i]:not([class*="show_chart"]):not([class*="table_rows"]):not([class*="timeline"]) {
        display: none !important;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle-checked:hover {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        box-shadow: 
          0 6px 16px rgba(16, 185, 129, 0.4),
          0 2px 4px rgba(0, 0, 0, 0.15) inset,
          0 0 0 1px rgba(255, 255, 255, 0.25) inset;
        transform: translateY(-2px);
      }

      .view-toggle-group ::ng-deep .mat-button-toggle-checked:hover mat-icon {
        transform: scale(1.2) rotate(-5deg);
      }

      /* Ripple effect enhancement */
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-ripple-element {
        background-color: rgba(16, 185, 129, 0.2);
        animation-duration: 0.6s;
      }

      /* Focus states for accessibility */
      .view-toggle-group ::ng-deep .mat-button-toggle:focus-visible {
        outline: 2px solid rgba(16, 185, 129, 0.5);
        outline-offset: 2px;
        border-radius: 10px;
      }

      /* Smooth transition between states */
      .view-toggle-group ::ng-deep .mat-button-toggle:not(.mat-button-toggle-checked) {
        animation: fadeIn 0.2s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0.7;
        }
        to {
          opacity: 1;
        }
      }

      /* Responsive - View Toggle Group */
      @media (max-width: 768px) {
        .view-toggle-group {
          border-radius: 12px;
          padding: 1px;
          gap: 1px;
        }

        .view-toggle-group ::ng-deep .mat-button-toggle-button {
          padding: 8px 12px;
          height: 40px;
          min-width: 44px;
        }

        .view-toggle-group ::ng-deep .mat-button-toggle mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      @media (max-width: 480px) {
        .chart-controls {
          flex-wrap: wrap;
          gap: 8px;
        }

        .view-toggle-group {
          width: 100%;
          justify-content: stretch;
        }

        .view-toggle-group ::ng-deep .mat-button-toggle {
          flex: 1;
        }

        .view-toggle-group ::ng-deep .mat-button-toggle-button {
          padding: 10px 8px;
          height: 38px;
        }

        .view-toggle-group ::ng-deep .mat-button-toggle mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      /* Export Button */
      .export-btn {
        border-radius: 12px;
        border: 2px solid rgba(16, 185, 129, 0.3);
        background: rgba(255, 255, 255, 0.9);
        color: #10b981;
        font-weight: 600;
        padding: 0 16px;
        height: 40px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .export-btn mat-icon {
        margin-right: 6px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .export-btn:hover {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1));
        border-color: #10b981;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      }

      .export-btn:active {
        transform: translateY(0);
      }

      .threshold-bar {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .bar-track {
        position: relative;
        height: 12px;
        background: linear-gradient(to right, #fee2e2, #fef3c7, #d1fae5, #fef3c7, #fee2e2);
        border-radius: 6px;
        overflow: visible;
      }

      .optimal-zone {
        position: absolute;
        height: 100%;
        background: linear-gradient(135deg, #10b981, #34d399);
        border-radius: 6px;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
      }

      .current-marker {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        cursor: pointer;
        z-index: 10;
      }

      .marker-pulse {
        position: absolute;
        inset: -4px;
        border: 2px solid #667eea;
        border-radius: 50%;
        animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      @keyframes pulse-ring {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }

      .threshold-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 600;
      }

      .chart-section {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        flex: 1;
        min-height: 300px;
      }

      .chart-container {
        height: 300px;
      }

      /* Data Table View */
      .data-table-container {
        max-height: 300px;
        overflow-y: auto;
        border-radius: 12px;
        border: 1px solid rgba(229, 231, 235, 0.8);
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
      }

      .data-table thead {
        position: sticky;
        top: 0;
        z-index: 10;
        background: linear-gradient(135deg, #f8fafb, #f0fdf4);
      }

      .data-table th {
        padding: 12px 16px;
        text-align: left;
        font-weight: 700;
        font-size: 0.875rem;
        color: #1f2937;
        border-bottom: 2px solid rgba(16, 185, 129, 0.3);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .data-table tbody tr {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border-bottom: 1px solid rgba(229, 231, 235, 0.6);
      }

      .data-table tbody tr:hover {
        background: rgba(16, 185, 129, 0.05);
        transform: scale(1.005);
        box-shadow: inset 4px 0 0 #10b981;
      }

      .data-table td {
        padding: 12px 16px;
        font-size: 0.875rem;
        color: #374151;
      }

      .table-status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .table-status-badge.normal {
        background: #d1fae5;
        color: #065f46;
      }

      .table-status-badge.warning {
        background: #fef3c7;
        color: #92400e;
      }

      .table-status-badge.critical {
        background: #fee2e2;
        color: #991b1b;
      }

      .table-status-badge.offline {
        background: #f3f4f6;
        color: #4b5563;
      }

      /* Timeline View */
      .timeline-container {
        max-height: 300px;
        overflow-y: auto;
        position: relative;
        padding: 16px 0 16px 40px;
      }

      .timeline-track {
        position: absolute;
        left: 16px;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #10b981, #34d399, #10b981);
        border-radius: 2px;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
      }

      .timeline-entry {
        position: relative;
        margin-bottom: 24px;
        animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .timeline-marker {
        position: absolute;
        left: -32px;
        top: 4px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 2;
      }

      .timeline-marker.normal {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      .timeline-marker.warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      .timeline-marker.critical {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        animation: pulse 2s ease-in-out infinite;
      }

      .timeline-marker.offline {
        background: linear-gradient(135deg, #6b7280, #4b5563);
      }

      .timeline-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: white;
      }

      .timeline-content {
        background: white;
        border-radius: 12px;
        padding: 12px 16px;
        border: 1px solid rgba(229, 231, 235, 0.8);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .timeline-content:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        border-color: rgba(16, 185, 129, 0.4);
      }

      .timeline-time {
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 4px;
        font-weight: 500;
      }

      .timeline-value {
        display: flex;
        align-items: baseline;
        gap: 4px;
      }

      .value-text {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1f2937;
      }

      .value-unit {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
      }

      .no-chart-data {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #9ca3af;
      }

      .no-chart-data mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
        opacity: 0.5;
      }

      .empty-detail {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 60px 20px;
      }

      .empty-icon {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
        animation: float 3s ease-in-out infinite;
      }

      @keyframes float {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      .empty-icon mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #667eea;
      }

      .empty-detail h3 {
        margin: 0 0 8px 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
      }

      .empty-detail p {
        margin: 0;
        font-size: 1rem;
        color: #6b7280;
        max-width: 400px;
      }

      @media (max-width: 768px) {
        .detail-panel {
          padding: 16px;
          gap: 16px;
        }

        .kpi-section {
          grid-template-columns: 1fr;
        }

        .kpi-card.primary {
          grid-column: 1;
        }

        .chart-container {
          height: 250px;
        }
      }

      /* ========================================
         🌙 DARK THEME STYLES
      ======================================== */
      :host-context(body.dark-theme) .detail-panel {
        background: linear-gradient(
          to bottom,
          rgba(15, 23, 42, 0.75),
          rgba(30, 41, 59, 0.7)
        );
        backdrop-filter: blur(16px);
        border-color: rgba(100, 116, 139, 0.4);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5),
                    inset 0 1px 1px rgba(100, 116, 139, 0.25);
      }

      :host-context(body.dark-theme) .detail-panel::before {
        background: linear-gradient(
          90deg,
          rgba(16, 185, 129, 0.5),
          rgba(52, 211, 153, 0.4),
          rgba(16, 185, 129, 0.5)
        );
      }

      :host-context(body.dark-theme) .detail-header {
        background: rgba(30, 41, 59, 0.6) !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      :host-context(body.dark-theme) .detail-header.status-critical {
        border-left-color: #f87171;
        background: linear-gradient(to right, rgba(239, 68, 68, 0.15), rgba(30, 41, 59, 0.6)) !important;
      }

      :host-context(body.dark-theme) .detail-header.status-warning {
        border-left-color: #fbbf24;
        background: linear-gradient(to right, rgba(245, 158, 11, 0.15), rgba(30, 41, 59, 0.6)) !important;
      }

      :host-context(body.dark-theme) .detail-header.status-normal {
        border-left-color: #34d399;
        background: linear-gradient(to right, rgba(16, 185, 129, 0.15), rgba(30, 41, 59, 0.6)) !important;
      }

      :host-context(body.dark-theme) .detail-header.status-offline {
        border-left-color: #9ca3af;
        background: linear-gradient(to right, rgba(107, 114, 128, 0.15), rgba(30, 41, 59, 0.6)) !important;
      }

      :host-context(body.dark-theme) .header-info h2 {
        color: #ffffff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }

      :host-context(body.dark-theme) .device-type {
        color: #cbd5e1;
      }

      :host-context(body.dark-theme) .icon-normal {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(167, 243, 208, 0.2));
        color: #6ee7b7;
        border: 1px solid rgba(16, 185, 129, 0.4);
      }

      :host-context(body.dark-theme) .icon-warning {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(253, 230, 138, 0.2));
        color: #fcd34d;
        border: 1px solid rgba(245, 158, 11, 0.4);
      }

      :host-context(body.dark-theme) .icon-critical {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(254, 202, 202, 0.2));
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.4);
      }

      :host-context(body.dark-theme) .icon-offline {
        background: linear-gradient(135deg, rgba(107, 114, 128, 0.3), rgba(229, 231, 235, 0.15));
        color: #cbd5e1;
        border: 1px solid rgba(107, 114, 128, 0.4);
      }

      :host-context(body.dark-theme) .chip-normal {
        background: rgba(16, 185, 129, 0.25);
        color: #6ee7b7;
        border-color: rgba(16, 185, 129, 0.4);
      }

      :host-context(body.dark-theme) .chip-warning {
        background: rgba(245, 158, 11, 0.25);
        color: #fcd34d;
        border-color: rgba(245, 158, 11, 0.4);
      }

      :host-context(body.dark-theme) .chip-critical {
        background: rgba(239, 68, 68, 0.25);
        color: #fca5a5;
        border-color: rgba(239, 68, 68, 0.4);
      }

      :host-context(body.dark-theme) .chip-offline {
        background: rgba(107, 114, 128, 0.25);
        color: #cbd5e1;
        border-color: rgba(107, 114, 128, 0.4);
      }

      :host-context(body.dark-theme) .kpi-card {
        background: rgba(30, 41, 59, 0.7);
        border-color: rgba(100, 116, 139, 0.3);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3),
                    inset 0 1px 1px rgba(100, 116, 139, 0.15);
      }

      :host-context(body.dark-theme) .kpi-card:hover {
        background: rgba(30, 41, 59, 0.85);
        border-color: rgba(52, 211, 153, 0.5);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4),
                    0 0 32px rgba(16, 185, 129, 0.15),
                    inset 0 1px 1px rgba(52, 211, 153, 0.25);
      }

      :host-context(body.dark-theme) .kpi-card.primary {
        background: linear-gradient(
          135deg,
          rgba(128, 203, 196, 0.25),
          rgba(0, 95, 91, 0.2)
        );
        border-color: rgba(128, 203, 196, 0.4);
        box-shadow: 0 8px 24px rgba(128, 203, 196, 0.2),
                    inset 0 1px 1px rgba(128, 203, 196, 0.15);
      }

      :host-context(body.dark-theme) .kpi-card.primary:hover {
        background: linear-gradient(
          135deg,
          rgba(128, 203, 196, 0.35),
          rgba(0, 95, 91, 0.3)
        );
        box-shadow: 0 12px 32px rgba(128, 203, 196, 0.3),
                    0 0 32px rgba(128, 203, 196, 0.15),
                    inset 0 1px 1px rgba(128, 203, 196, 0.25);
      }

      :host-context(body.dark-theme) .kpi-label {
        color: #cbd5e1;
      }

      :host-context(body.dark-theme) .kpi-value {
        color: #80cbc4;
        text-shadow: 0 2px 8px rgba(128, 203, 196, 0.4), 0 0 16px rgba(128, 203, 196, 0.2);
      }

      :host-context(body.dark-theme) .kpi-unit {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .kpi-text {
        color: #e2e8f0;
      }

      :host-context(body.dark-theme) .threshold-section {
        background: rgba(30, 41, 59, 0.7);
        border-color: rgba(100, 116, 139, 0.3);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3),
                    inset 0 1px 1px rgba(100, 116, 139, 0.15);
      }

      :host-context(body.dark-theme) .threshold-section:hover {
        background: rgba(30, 41, 59, 0.85);
        border-color: rgba(52, 211, 153, 0.4);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4),
                    0 0 24px rgba(16, 185, 129, 0.1),
                    inset 0 1px 1px rgba(52, 211, 153, 0.2);
      }

      :host-context(body.dark-theme) .chart-header {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .threshold-labels {
        color: #cbd5e1;
      }

      /* Dark Theme - View Toggle - Enhanced */
      :host-context(body.dark-theme) .view-toggle-group {
        border-color: rgba(100, 116, 139, 0.25);
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.9));
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.3),
          0 0 0 1px rgba(100, 116, 139, 0.2) inset,
          0 1px 2px rgba(0, 0, 0, 0.2) inset;
      }

      :host-context(body.dark-theme) .view-toggle-group:hover {
        border-color: rgba(16, 185, 129, 0.4);
        box-shadow: 
          0 6px 16px rgba(16, 185, 129, 0.2),
          0 0 0 1px rgba(100, 116, 139, 0.3) inset,
          0 1px 2px rgba(0, 0, 0, 0.2) inset;
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle {
        background: transparent;
        color: #cbd5e1;
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle::before {
        background: rgba(16, 185, 129, 0.15);
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle mat-icon {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle:hover {
        background: rgba(16, 185, 129, 0.12);
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle:hover mat-icon {
        color: #34d399;
        transform: scale(1.15) rotate(5deg);
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle-checked {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 
          0 4px 12px rgba(16, 185, 129, 0.4),
          0 2px 4px rgba(0, 0, 0, 0.3) inset,
          0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle-checked::after {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), transparent);
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle-checked mat-icon {
        color: white;
        filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4));
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle-checked:hover {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        box-shadow: 
          0 6px 16px rgba(16, 185, 129, 0.5),
          0 2px 4px rgba(0, 0, 0, 0.4) inset,
          0 0 0 1px rgba(255, 255, 255, 0.15) inset;
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle-checked:hover mat-icon {
        transform: scale(1.2) rotate(-5deg);
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle .mat-ripple-element {
        background-color: rgba(16, 185, 129, 0.3);
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle:focus-visible {
        outline-color: rgba(16, 185, 129, 0.6);
      }

      /* Dark Theme - Export Button */
      :host-context(body.dark-theme) .export-btn {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(16, 185, 129, 0.5);
        color: #34d399;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      :host-context(body.dark-theme) .export-btn:hover {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2));
        border-color: #34d399;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      /* Dark Theme - Data Table */
      :host-context(body.dark-theme) .data-table-container {
        border-color: rgba(100, 116, 139, 0.4);
      }

      :host-context(body.dark-theme) .data-table {
        background: rgba(30, 41, 59, 0.7);
      }

      :host-context(body.dark-theme) .data-table thead {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
      }

      :host-context(body.dark-theme) .data-table th {
        color: #f1f5f9;
        border-bottom-color: rgba(16, 185, 129, 0.4);
      }

      :host-context(body.dark-theme) .data-table tbody tr {
        border-bottom-color: rgba(100, 116, 139, 0.3);
      }

      :host-context(body.dark-theme) .data-table tbody tr:hover {
        background: rgba(16, 185, 129, 0.1);
        box-shadow: inset 4px 0 0 #34d399;
      }

      :host-context(body.dark-theme) .data-table td {
        color: #e2e8f0;
      }

      :host-context(body.dark-theme) .table-status-badge.normal {
        background: rgba(16, 185, 129, 0.25);
        color: #6ee7b7;
      }

      :host-context(body.dark-theme) .table-status-badge.warning {
        background: rgba(245, 158, 11, 0.25);
        color: #fcd34d;
      }

      :host-context(body.dark-theme) .table-status-badge.critical {
        background: rgba(239, 68, 68, 0.25);
        color: #fca5a5;
      }

      :host-context(body.dark-theme) .table-status-badge.offline {
        background: rgba(107, 114, 128, 0.25);
        color: #cbd5e1;
      }

      /* Dark Theme - Timeline */
      :host-context(body.dark-theme) .timeline-track {
        background: linear-gradient(180deg, rgba(16, 185, 129, 0.6), rgba(52, 211, 153, 0.5), rgba(16, 185, 129, 0.6));
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
      }

      :host-context(body.dark-theme) .timeline-marker {
        border-color: rgba(30, 41, 59, 0.9);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      }

      :host-context(body.dark-theme) .timeline-content {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(100, 116, 139, 0.4);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      :host-context(body.dark-theme) .timeline-content:hover {
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.5);
      }

      :host-context(body.dark-theme) .timeline-time {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .value-text {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .value-unit {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .chart-section {
        background: rgba(30, 41, 59, 0.7);
        border-color: rgba(100, 116, 139, 0.3);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3),
                    inset 0 1px 1px rgba(100, 116, 139, 0.15);
      }

      :host-context(body.dark-theme) .chart-section:hover {
        background: rgba(30, 41, 59, 0.85);
        border-color: rgba(52, 211, 153, 0.4);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4),
                    0 0 24px rgba(16, 185, 129, 0.1),
                    inset 0 1px 1px rgba(52, 211, 153, 0.2);
      }

      :host-context(body.dark-theme) .chart-header {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .empty-detail {
        color: #cbd5e1;
      }

      :host-context(body.dark-theme) .empty-detail h3 {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .empty-detail p {
        color: #94a3b8;
      }
    `,
  ],
})
export class DeviceDetailPanelComponent {
  // Inputs
  device = input<DeviceDetail | null>(null);
  loading = input<boolean>(false);

  // View mode state
  viewMode = signal<'chart' | 'table' | 'timeline'>('chart');

  // Chart config
  colorScheme: any = {
    domain: ['#667eea', '#764ba2', '#f59e0b'],
  };
  curveFunction: any = null; // Will use default curve

  // Computed chart data in ngx-charts format
  chartSeriesData = computed(() => {
    const dev = this.device();
    if (!dev || !dev.chartData || dev.chartData.length === 0) return [];
    return [
      {
        name: dev.name,
        series: dev.chartData,
      },
    ];
  });

  getStatusIcon(status: SensorStatus): string {
    const icons: Record<SensorStatus, string> = {
      normal: 'check_circle',
      warning: 'warning',
      critical: 'error',
      offline: 'sensors_off',
    };
    return icons[status];
  }

  formatDateTime(date: Date | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  getPosition(value: number): number {
    const dev = this.device();
    if (!dev) return 0;
    const { min, max } = dev.thresholds;
    if (max === min) return 0;
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  }

  getWidth(start: number, end: number): number {
    const dev = this.device();
    if (!dev) return 0;
    const { min, max } = dev.thresholds;
    if (max === min) return 0;
    return Math.max(0, Math.min(100, ((end - start) / (max - min)) * 100));
  }

  getValueStatus(value: number): SensorStatus {
    const dev = this.device();
    if (!dev) return 'offline';

    const { min, max, optimalMin, optimalMax } = dev.thresholds;

    if (value < min || value > max) return 'critical';
    if (value < optimalMin || value > optimalMax) return 'warning';
    return 'normal';
  }

  exportToCSV(): void {
    const dev = this.device();
    if (!dev || !dev.chartData || dev.chartData.length === 0) {
      console.warn('No data available for export');
      return;
    }

    // Generate CSV content
    const headers = ['Timestamp', 'Value', 'Unit', 'Status'];
    const rows = dev.chartData.map(point => {
      const status = this.getValueStatus(point.value);
      return [
        new Date(point.name).toLocaleString(),
        point.value.toFixed(2),
        dev.unit,
        status.toUpperCase()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${dev.name}_data_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToPDF(): void {
    const dev = this.device();
    if (!dev) {
      console.warn('No device data available for export');
      return;
    }

    // Simple PDF export using browser print
    // For a production app, consider using libraries like jsPDF or pdfmake
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sensor Data - ${dev.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #10b981; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #10b981; color: white; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .header-info { margin-bottom: 20px; }
          .status-badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          .normal { background: #d1fae5; color: #065f46; }
          .warning { background: #fef3c7; color: #92400e; }
          .critical { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <h1>Sensor Data Report</h1>
        <div class="header-info">
          <p><strong>Sensor:</strong> ${dev.name}</p>
          <p><strong>Type:</strong> ${dev.type}</p>
          <p><strong>Current Value:</strong> ${dev.currentValue.toFixed(2)} ${dev.unit}</p>
          <p><strong>Status:</strong> ${dev.status.toUpperCase()}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${dev.chartData.map(point => {
              const status = this.getValueStatus(point.value);
              return `
                <tr>
                  <td>${new Date(point.name).toLocaleString()}</td>
                  <td>${point.value.toFixed(2)} ${dev.unit}</td>
                  <td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }
}

