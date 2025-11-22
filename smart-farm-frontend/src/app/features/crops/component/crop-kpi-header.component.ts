import { Component, input, output, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CropKPIs, HealthStatus, KPIFilter } from '../../../core/services/crop.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-crop-kpi-header',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe
  ],
  template: `
    <section class="kpi-header">
      <!-- Total Crops -->
      <mat-card
        class="kpi-card clickable"
        [class.active]="activeFilter() === 'all'"
        (click)="onCardClick('all')"
        [matTooltip]="'crops.kpi.tooltips.all' | translate">
        <mat-card-content>
          <div class="kpi-icon" [class.pulse]="kpis().totalCrops > 0">
            <mat-icon>agriculture</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-label">{{ 'crops.kpi.labels.total' | translate }}</span>
            <span class="kpi-value">{{ kpis().totalCrops }}</span>
          </div>
          <div class="ripple"></div>
        </mat-card-content>
      </mat-card>

      <!-- Healthy vs Stressed Ratio -->
      <mat-card
        class="kpi-card clickable health-ratio"
        [class.active]="activeFilter() === 'healthy' || activeFilter() === 'stressed'"
        (click)="onCardClick('healthy')"
        [matTooltip]="'crops.kpi.tooltips.healthRatio' | translate">
        <mat-card-content>
          <div class="kpi-icon success">
            <mat-icon>eco</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-label">{{ 'crops.kpi.labels.healthRatio' | translate }}</span>
            <div class="ratio-display">
              <span class="healthy">{{ kpis().healthyCount }}</span>
              <span class="divider">/</span>
              <span class="stressed">{{ kpis().stressedCount }}</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                [style.width.%]="healthRatio()">
              </div>
            </div>
          </div>
          <div class="ripple"></div>
        </mat-card-content>
      </mat-card>

      <!-- Growth Stage -->
      <mat-card
        class="kpi-card growth-stage"
        [matTooltip]="'crops.kpi.tooltips.growthStage' | translate">
        <mat-card-content>
          <div class="kpi-icon">
            <mat-icon>{{ getGrowthStageIcon() }}</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-label">{{ 'crops.kpi.labels.growthStage' | translate }}</span>
            <span class="kpi-value stage">{{ kpis().currentGrowthStage }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Soil Moisture Average -->
      <mat-card
        class="kpi-card clickable"
        [class.active]="activeFilter() === 'moisture'"
        [class.critical]="isCritical('moisture')"
        [class.warning]="isWarning('moisture')"
        (click)="onCardClick('moisture')"
        [matTooltip]="'crops.kpi.tooltips.soilMoisture' | translate">
        <mat-card-content>
          <div class="kpi-icon" [class.warning]="isWarning('moisture')">
            <mat-icon>water_drop</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-label">{{ 'crops.kpi.labels.soilMoisture' | translate }}</span>
            <span class="kpi-value">
              {{ kpis().avgSoilMoisture !== null ? (kpis().avgSoilMoisture | number:'1.1-1') + '%' : '--' }}
            </span>
            <span class="kpi-trend" *ngIf="kpis().avgSoilMoisture !== null">
              <mat-icon>{{ getMoistureStatus() === 'low' ? 'trending_down' : 'trending_up' }}</mat-icon>
            </span>
          </div>
          <div class="ripple"></div>
        </mat-card-content>
      </mat-card>

      <!-- Temperature Average -->
      <mat-card
        class="kpi-card clickable"
        [class.active]="activeFilter() === 'temperature'"
        [class.warning]="isWarning('temperature')"
        (click)="onCardClick('temperature')"
        [matTooltip]="'crops.kpi.tooltips.temperature' | translate">
        <mat-card-content>
          <div class="kpi-icon warm">
            <mat-icon>thermostat</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-label">{{ 'crops.kpi.labels.temperature' | translate }}</span>
            <span class="kpi-value">
              {{ kpis().avgTemperature !== null ? (kpis().avgTemperature | number:'1.1-1') + '°C' : '--' }}
            </span>
          </div>
          <div class="ripple"></div>
        </mat-card-content>
      </mat-card>

      <!-- Humidity Average -->
      <mat-card
        class="kpi-card clickable"
        [class.active]="activeFilter() === 'humidity'"
        (click)="onCardClick('humidity')"
        [matTooltip]="'crops.kpi.tooltips.humidity' | translate">
        <mat-card-content>
          <div class="kpi-icon">
            <mat-icon>cloud</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-label">{{ 'crops.kpi.labels.humidity' | translate }}</span>
            <span class="kpi-value">
              {{ kpis().avgHumidity !== null ? (kpis().avgHumidity | number:'1.1-1') + '%' : '--' }}
            </span>
          </div>
          <div class="ripple"></div>
        </mat-card-content>
      </mat-card>

      <!-- Last Updated -->
      <mat-card class="kpi-card last-updated">
        <mat-card-content>
          <div class="kpi-icon">
            <mat-icon>schedule</mat-icon>
          </div>
          <div class="kpi-data">
            <span class="kpi-label">{{ 'crops.kpi.labels.lastUpdated' | translate }}</span>
            <span class="kpi-value small">
              {{ kpis().lastUpdated ? getRelativeTime(kpis().lastUpdated!) : ('crops.kpi.relative.never' | translate) }}
            </span>
          </div>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`
    .kpi-header {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .kpi-card {
      position: relative;
      overflow: hidden;
      background: var(--card-bg, #ffffff);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &.clickable {
        cursor: pointer;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);

          .ripple {
            opacity: 0.3;
            transform: scale(2);
          }
        }

        &.active {
          border-color: var(--primary-green, #10b981);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
          background: rgba(16, 185, 129, 0.05);
        }
      }

      &.warning {
        border-color: rgba(255, 152, 0, 0.3);

        .kpi-icon {
          background: rgba(255, 152, 0, 0.1);

          mat-icon {
            color: #ff9800;
          }
        }
      }

      &.critical {
        border-color: rgba(244, 67, 54, 0.3);
        animation: pulse-critical 2s infinite;

        .kpi-icon {
          background: rgba(244, 67, 54, 0.1);

          mat-icon {
            color: #f44336;
          }
        }
      }

      mat-card-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem !important;
        position: relative;
      }

      .kpi-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: rgba(16, 185, 129, 0.1);
        flex-shrink: 0;
        transition: all 0.3s;

        &.pulse {
          animation: pulse 2s infinite;
        }

        &.success {
          background: rgba(16, 185, 129, 0.15);

          mat-icon {
            color: var(--primary-green, #10b981);
          }
        }

        &.warm {
          background: rgba(255, 152, 0, 0.1);

          mat-icon {
            color: #ff9800;
          }
        }

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
          color: var(--primary-green, #10b981);
        }
      }

      .kpi-data {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;

        .kpi-label {
          font-size: 0.75rem;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .kpi-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary, #1f2937);
          display: flex;
          align-items: center;
          gap: 0.5rem;

          &.small {
            font-size: 1rem;
          }

          &.stage {
            font-size: 1.1rem;
            color: #1976d2;
          }
        }

        .kpi-trend {
          display: inline-flex;
          align-items: center;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }

        .ratio-display {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: 600;

          .healthy {
            color: #4caf50;
          }

          .stressed {
            color: #f44336;
          }

          .divider {
            color: rgba(0, 0, 0, 0.3);
          }
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 0.5rem;

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4caf50, #66bb6a);
            transition: width 0.5s ease;
          }
        }
      }

      .ripple {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
        transition: all 0.6s;
        pointer-events: none;
      }
    }

    /* === DARK MODE SUPPORT === */
    :host-context(body.dark-theme) {
      .kpi-card {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);
        
        &.clickable {
          &:hover {
            box-shadow: 0 8px 30px rgba(16, 185, 129, 0.2);
            border-color: rgba(16, 185, 129, 0.4);
          }
          
          &.active {
            background: rgba(16, 185, 129, 0.12);
            border-color: var(--primary-green, #10b981);
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
          }
        }
        
        .kpi-label {
          color: var(--text-secondary, #94a3b8);
        }
        
        .kpi-value {
          color: var(--text-primary, #f1f5f9);
        }
        
        .progress-bar {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .divider {
          color: rgba(255, 255, 255, 0.3);
        }
      }
    }

    .growth-stage {
      grid-column: span 1;
    }

    .last-updated {
      background: rgba(33, 150, 243, 0.05);
      border-color: rgba(33, 150, 243, 0.2);
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    @keyframes pulse-critical {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
      }
      50% {
        box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
      }
    }

    @media (max-width: 768px) {
      .kpi-header {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.75rem;
      }

      .kpi-card {
        mat-card-content {
          padding: 0.75rem !important;
        }

        .kpi-icon {
          width: 40px;
          height: 40px;

          mat-icon {
            font-size: 24px;
            width: 24px;
            height: 24px;
          }
        }

        .kpi-data .kpi-value {
          font-size: 1.25rem;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CropKpiHeaderComponent {
  private languageService = inject(LanguageService);
  // Inputs
  kpis = input.required<CropKPIs>();
  healthStatus = input<HealthStatus>('unknown');
  activeFilter = input<KPIFilter>('all');

  // Outputs
  filterChange = output<KPIFilter>();

  // Computed
  healthRatio = computed(() => {
    const kpis = this.kpis();
    if (kpis.totalCrops === 0) return 0;
    return (kpis.healthyCount / kpis.totalCrops) * 100;
  });

  onCardClick(filter: KPIFilter): void {
    this.filterChange.emit(filter);
  }

  getGrowthStageIcon(): string {
    const stage = this.kpis().currentGrowthStage.toLowerCase();
    if (stage.includes('germination')) return 'spa';
    if (stage.includes('seedling')) return 'grass';
    if (stage.includes('vegetative')) return 'forest';
    if (stage.includes('flowering')) return 'local_florist';
    if (stage.includes('mature')) return 'agriculture';
    return 'help_outline';
  }

  getMoistureStatus(): 'low' | 'normal' | 'high' {
    const moisture = this.kpis().avgSoilMoisture;
    if (moisture === null) return 'normal';
    if (moisture < 30) return 'low';
    if (moisture > 70) return 'high';
    return 'normal';
  }

  isCritical(type: 'moisture' | 'temperature' | 'humidity'): boolean {
    const kpis = this.kpis();
    if (type === 'moisture') {
      return kpis.avgSoilMoisture !== null && (kpis.avgSoilMoisture < 20 || kpis.avgSoilMoisture > 90);
    }
    if (type === 'temperature') {
      return kpis.avgTemperature !== null && (kpis.avgTemperature < 5 || kpis.avgTemperature > 40);
    }
    return false;
  }

  isWarning(type: 'moisture' | 'temperature' | 'humidity'): boolean {
    const kpis = this.kpis();
    if (type === 'moisture') {
      return kpis.avgSoilMoisture !== null &&
             ((kpis.avgSoilMoisture >= 20 && kpis.avgSoilMoisture < 30) ||
              (kpis.avgSoilMoisture > 70 && kpis.avgSoilMoisture <= 90));
    }
    if (type === 'temperature') {
      return kpis.avgTemperature !== null &&
             ((kpis.avgTemperature >= 5 && kpis.avgTemperature < 10) ||
              (kpis.avgTemperature > 35 && kpis.avgTemperature <= 40));
    }
    return false;
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return this.languageService.translate('crops.common.relative.justNow');
    }
    if (minutes < 60) {
      return this.languageService.translate('crops.common.relative.minutesAgo', { count: minutes });
    }
    if (hours < 24) {
      return this.languageService.translate('crops.common.relative.hoursAgo', { count: hours });
    }
    if (days === 1) {
      return this.languageService.translate('crops.common.relative.yesterday');
    }
    if (days < 7) {
      return this.languageService.translate('crops.common.relative.daysAgo', { count: days });
    }

    const formatter = new Intl.DateTimeFormat(this.languageService.getCurrentLanguageCode(), {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    return formatter.format(new Date(date));
  }
}
