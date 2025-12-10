import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { SustainabilityMetrics } from '../../services/crop-dashboard.service';

@Component({
  selector: 'app-sustainability-metrics',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressBarModule,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sustainability-panel">
      <div class="panel-header">
        <mat-icon>eco</mat-icon>
        <h2>{{ 'crops.dashboard.sustainability' | translate }}</h2>
      </div>

      @if (metrics()) {
        <div class="metrics-grid">
          <!-- Water Saved -->
          <div class="metric-card metric-water">
            <div class="metric-icon">
              <mat-icon>water_drop</mat-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">{{ 'crops.sustainability.waterSaved' | translate }}</span>
              <div class="metric-value-row">
                <span class="metric-value">{{ metrics()!.waterSaved | number: '1.0-0' }}</span>
                <span class="metric-unit">{{ 'crops.sustainability.liters' | translate }}</span>
              </div>
            </div>
          </div>

          <!-- Energy Saved -->
          <div class="metric-card metric-energy">
            <div class="metric-icon">
              <mat-icon>flash_on</mat-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">{{ 'crops.sustainability.energySaved' | translate }}</span>
              <div class="metric-value-row">
                <span class="metric-value">{{ metrics()!.energySaved | number: '1.0-1' }}</span>
                <span class="metric-unit">{{ 'crops.sustainability.kwh' | translate }}</span>
              </div>
            </div>
          </div>

          <!-- CO2 Reduction -->
          <div class="metric-card metric-co2">
            <div class="metric-icon">
              <mat-icon>cloud</mat-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">{{ 'crops.sustainability.co2Reduction' | translate }}</span>
              <div class="metric-value-row">
                <span class="metric-value">{{ metrics()!.co2Reduction | number: '1.0-1' }}</span>
                <span class="metric-unit">{{ 'crops.sustainability.kg' | translate }}</span>
              </div>
            </div>
          </div>

          <!-- Irrigation Efficiency -->
          <div class="metric-card metric-efficiency">
            <div class="metric-icon">
              <mat-icon>insights</mat-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">{{ 'crops.sustainability.irrigationEfficiency' | translate }}</span>
              <div class="efficiency-display">
                <span class="efficiency-value">{{ metrics()!.irrigationEfficiency }}%</span>
                <mat-progress-bar 
                  mode="determinate" 
                  [value]="metrics()!.irrigationEfficiency"
                  class="efficiency-bar">
                </mat-progress-bar>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="no-metrics">
          <mat-icon>eco</mat-icon>
          <p>No sustainability data available</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .sustainability-panel {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.1);
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

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .metric-card {
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
      }
    }

    .metric-water {
      background: linear-gradient(135deg, #0ea5e9, #06b6d4);
      color: white;
    }

    .metric-energy {
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      color: white;
    }

    .metric-co2 {
      background: linear-gradient(135deg, #8b5cf6, #a78bfa);
      color: white;
    }

    .metric-efficiency {
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white;
    }

    .metric-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: white;
      }
    }

    .metric-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .metric-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.9;
    }

    .metric-value-row {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .metric-unit {
      font-size: 1rem;
      font-weight: 600;
      opacity: 0.8;
    }

    .efficiency-display {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .efficiency-value {
      font-size: 1.75rem;
      font-weight: 700;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .efficiency-bar {
      height: 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.2);

      ::ng-deep .mdc-linear-progress__bar-inner {
        background: white;
        border-radius: 4px;
      }
    }

    .no-metrics {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1rem;
      color: #9ca3af;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sustainability-panel {
        padding: 1.5rem;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .metric-value {
        font-size: 1.5rem;
      }

      .efficiency-value {
        font-size: 1.25rem;
      }
    }

    /* Dark theme */
    :host-context(body.dark-theme) {
      .sustainability-panel {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(16, 185, 129, 0.2);
      }

      .panel-header {
        border-bottom-color: rgba(16, 185, 129, 0.2);

        h2 {
          color: #f1f5f9;
        }
      }

      .metric-card {
        &:hover {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        }
      }

      .no-metrics {
        color: #64748b;
      }
    }
  `]
})
export class SustainabilityMetricsComponent {
  metrics = input<SustainabilityMetrics | null>(null);
}

