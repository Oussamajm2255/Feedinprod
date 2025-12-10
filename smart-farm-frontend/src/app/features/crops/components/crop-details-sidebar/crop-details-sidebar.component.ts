import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Crop } from '../../../../core/models/farm.model';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-crop-details-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sidebar-container">
      <div class="sidebar-header">
        <mat-icon>info</mat-icon>
        <h3>{{ 'crops.dashboard.cropDetails' | translate }}</h3>
      </div>

      @if (crop()) {
        <mat-accordion class="details-accordion">
          <!-- Basic Info -->
          <mat-expansion-panel [expanded]="true">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>eco</mat-icon>
                Basic Information
              </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="detail-content">
              <div class="detail-row">
                <span class="detail-label">{{ 'crops.cropName' | translate }}</span>
                <span class="detail-value">{{ crop()!.name }}</span>
              </div>
              @if (crop()!.variety) {
                <div class="detail-row">
                  <span class="detail-label">Variety</span>
                  <span class="detail-value">{{ crop()!.variety }}</span>
                </div>
              }
              <div class="detail-row">
                <span class="detail-label">{{ 'crops.status' | translate }}</span>
                <span class="detail-value status-badge" [class]="'status-' + crop()!.status">
                  {{ crop()!.status | titlecase }}
                </span>
              </div>
            </div>
          </mat-expansion-panel>

          <!-- Planting Info -->
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>event</mat-icon>
                Planting Information
              </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="detail-content">
              @if (crop()!.planting_date) {
                <div class="detail-row">
                  <span class="detail-label">{{ 'crops.plantingDate' | translate }}</span>
                  <span class="detail-value">{{ crop()!.planting_date | date: 'mediumDate' }}</span>
                </div>
              }
              @if (crop()!.expected_harvest_date) {
                <div class="detail-row">
                  <span class="detail-label">{{ 'crops.expectedHarvest' | translate }}</span>
                  <span class="detail-value">{{ crop()!.expected_harvest_date | date: 'mediumDate' }}</span>
                </div>
              }
              @if (crop()!.planting_date && crop()!.expected_harvest_date) {
                <div class="detail-row">
                  <span class="detail-label">Growth Duration</span>
                  <span class="detail-value">{{ getGrowthDuration() }} days</span>
                </div>
              }
            </div>
          </mat-expansion-panel>

          <!-- Notes -->
          @if (crop()!.notes) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>notes</mat-icon>
                  Notes
                </mat-panel-title>
              </mat-expansion-panel-header>
              <div class="detail-content">
                <p class="notes-text">{{ crop()!.notes }}</p>
              </div>
            </mat-expansion-panel>
          }

          <!-- Optimal Conditions -->
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>thermostat</mat-icon>
                Optimal Conditions
              </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="detail-content">
              <div class="detail-row">
                <span class="detail-label">Temperature</span>
                <span class="detail-value">18-25°C</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Soil Moisture</span>
                <span class="detail-value">60-80%</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Humidity</span>
                <span class="detail-value">50-70%</span>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-accordion>
      } @else {
        <div class="no-crop">
          <mat-icon>eco</mat-icon>
          <p>{{ 'crops.dashboard.noCropSelected' | translate }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .sidebar-container {
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.1);
      height: 100%;
      overflow-y: auto;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid rgba(16, 185, 129, 0.1);

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: #10b981;
      }

      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #1f2937;
      }
    }

    .details-accordion {
      ::ng-deep .mat-expansion-panel {
        background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
        border-radius: 12px;
        margin-bottom: 1rem;
        border: 1px solid rgba(16, 185, 129, 0.1);
        box-shadow: none;

        &:hover {
          border-color: rgba(16, 185, 129, 0.2);
        }
      }

      ::ng-deep .mat-expansion-panel-header {
        padding: 1rem;

        mat-panel-title {
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
      }
    }

    .detail-content {
      padding: 0.5rem 1rem 1rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(16, 185, 129, 0.1);

      &:last-child {
        border-bottom: none;
      }
    }

    .detail-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
    }

    .detail-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
      text-align: right;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-planted {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
    }

    .status-growing {
      background: rgba(16, 185, 129, 0.1);
      color: #047857;
    }

    .status-harvested {
      background: rgba(249, 115, 22, 0.1);
      color: #c2410c;
    }

    .status-failed {
      background: rgba(239, 68, 68, 0.1);
      color: #b91c1c;
    }

    .notes-text {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.6;
      color: #4b5563;
    }

    .no-crop {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
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

    /* Scrollbar */
    .sidebar-container::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar-container::-webkit-scrollbar-track {
      background: rgba(16, 185, 129, 0.1);
      border-radius: 3px;
    }

    .sidebar-container::-webkit-scrollbar-thumb {
      background: rgba(16, 185, 129, 0.3);
      border-radius: 3px;

      &:hover {
        background: rgba(16, 185, 129, 0.5);
      }
    }

    /* Dark theme */
    :host-context(body.dark-theme) {
      .sidebar-container {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(16, 185, 129, 0.2);
      }

      .sidebar-header {
        border-bottom-color: rgba(16, 185, 129, 0.2);

        h3 {
          color: #f1f5f9;
        }
      }

      .details-accordion ::ng-deep .mat-expansion-panel {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8));
        border-color: rgba(16, 185, 129, 0.2);
      }

      .details-accordion ::ng-deep .mat-expansion-panel-header mat-panel-title {
        color: #e2e8f0;
      }

      .detail-row {
        border-bottom-color: rgba(16, 185, 129, 0.1);
      }

      .detail-label {
        color: #94a3b8;
      }

      .detail-value {
        color: #e2e8f0;
      }

      .notes-text {
        color: #cbd5e1;
      }

      .no-crop {
        color: #64748b;
      }
    }
  `]
})
export class CropDetailsSidebarComponent {
  crop = input<Crop | null>(null);

  getGrowthDuration(): number {
    const crop = this.crop();
    if (!crop || !crop.planting_date || !crop.expected_harvest_date) {
      return 0;
    }

    const plantingDate = new Date(crop.planting_date);
    const harvestDate = new Date(crop.expected_harvest_date);
    const diffTime = Math.abs(harvestDate.getTime() - plantingDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
}

