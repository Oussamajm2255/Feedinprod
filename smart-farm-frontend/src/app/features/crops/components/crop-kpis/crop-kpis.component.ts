import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { CropKPIs } from '../../services/crop-dashboard.service';

@Component({
  selector: 'app-crop-kpis',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpis-container">
      <!-- Yield KPI -->
      <div class="kpi-card kpi-primary">
        <div class="kpi-icon">
          <mat-icon>trending_up</mat-icon>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">{{ 'crops.kpis.yield' | translate }}</span>
          <div class="kpi-value-row">
            <span class="kpi-value">{{ kpis()?.yield || 0 }}</span>
            <span class="kpi-unit">{{ kpis()?.yieldUnit || 'kg' }}</span>
          </div>
        </div>
      </div>

      <!-- Growth Stage KPI -->
      <div class="kpi-card">
        <div class="kpi-icon kpi-icon-secondary">
          <mat-icon>eco</mat-icon>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">{{ 'crops.kpis.growthStage' | translate }}</span>
          <span class="kpi-text">{{ getGrowthStageDisplay(kpis()?.growthStage) }}</span>
        </div>
      </div>

      <!-- Irrigation Status KPI -->
      <div class="kpi-card">
        <div class="kpi-icon kpi-icon-tertiary">
          <mat-icon>water_drop</mat-icon>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">{{ 'crops.kpis.irrigationStatus' | translate }}</span>
          <span class="kpi-text">{{ kpis()?.irrigationStatus || 'Unknown' }}</span>
        </div>
      </div>

      <!-- Health Score KPI -->
      <div class="kpi-card">
        <div class="kpi-icon kpi-icon-health">
          <mat-icon>favorite</mat-icon>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">{{ 'crops.kpis.healthScore' | translate }}</span>
          <div class="health-score">
            <span class="score-value">{{ kpis()?.healthScore || 0 }}%</span>
            <div class="score-bar">
              <div class="score-fill" [style.width.%]="kpis()?.healthScore || 0"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpis-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .kpi-card {
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      contain: layout style paint;
    }

    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.3);
    }

    .kpi-primary {
      background: linear-gradient(135deg, #047857, #10b981);
      color: white;
      grid-column: 1 / -1;
    }

    .kpi-icon {
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
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }
    }

    .kpi-icon-secondary {
      background: linear-gradient(135deg, #10b981, #34d399);
    }

    .kpi-icon-tertiary {
      background: linear-gradient(135deg, #0ea5e9, #06b6d4);
    }

    .kpi-icon-health {
      background: linear-gradient(135deg, #f59e0b, #ef4444);
    }

    .kpi-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.9;
    }

    .kpi-primary .kpi-label {
      color: rgba(255, 255, 255, 0.9);
    }

    .kpi-card:not(.kpi-primary) .kpi-label {
      color: #6b7280;
    }

    .kpi-value-row {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .kpi-value {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .kpi-unit {
      font-size: 1.125rem;
      font-weight: 600;
      opacity: 0.8;
    }

    .kpi-text {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
    }

    .health-score {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .score-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #10b981;
    }

    .score-bar {
      height: 8px;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #34d399);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .kpis-container {
        grid-template-columns: 1fr;
      }

      .kpi-primary {
        grid-column: 1;
      }
    }

    /* Dark theme */
    :host-context(body.dark-theme) {
      .kpi-card {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(16, 185, 129, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .kpi-card:hover {
        box-shadow: 0 12px 40px rgba(16, 185, 129, 0.2);
      }

      .kpi-primary {
        background: linear-gradient(135deg, rgba(4, 120, 87, 0.9), rgba(16, 185, 129, 0.9));
      }

      .kpi-text {
        color: #e2e8f0;
      }

      .kpi-card:not(.kpi-primary) .kpi-label {
        color: #94a3b8;
      }
    }
  `]
})
export class CropKpisComponent {
  kpis = input<CropKPIs | null>(null);

  getGrowthStageDisplay(stage: string | undefined): string {
    if (!stage) return 'Unknown';
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  }
}

