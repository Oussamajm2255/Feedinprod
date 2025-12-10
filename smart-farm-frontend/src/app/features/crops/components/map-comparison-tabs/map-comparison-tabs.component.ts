import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-map-comparison-tabs',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatTableModule,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs-panel">
      <div class="panel-header">
        <mat-icon>map</mat-icon>
        <h2>{{ 'crops.dashboard.mapComparison' | translate }}</h2>
      </div>

      <mat-tab-group class="comparison-tabs" animationDuration="300ms">
        <!-- Map View Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>map</mat-icon>
            <span>Map View</span>
          </ng-template>
          <div class="tab-content">
            <div class="map-placeholder">
              <mat-icon>location_on</mat-icon>
              <h3>Interactive Map Coming Soon</h3>
              <p>Real-time sensor locations and field monitoring will be available in the next update.</p>
            </div>
          </div>
        </mat-tab>

        <!-- Comparison Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>compare</mat-icon>
            <span>Comparison</span>
          </ng-template>
          <div class="tab-content">
            @if (comparisonData() && comparisonData()!.length > 0) {
              <div class="comparison-table-container">
                <table mat-table [dataSource]="comparisonData()!" class="comparison-table">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Crop Name</th>
                    <td mat-cell *matCellDef="let crop">{{ crop.name }}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let crop">
                      <span class="status-badge" [class]="'status-' + crop.status">
                        {{ crop.status | titlecase }}
                      </span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="planted">
                    <th mat-header-cell *matHeaderCellDef>Planted</th>
                    <td mat-cell *matCellDef="let crop">
                      {{ crop.planted ? (crop.planted | date: 'shortDate') : 'N/A' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="harvest">
                    <th mat-header-cell *matHeaderCellDef>Expected Harvest</th>
                    <td mat-cell *matCellDef="let crop">
                      {{ crop.expectedHarvest ? (crop.expectedHarvest | date: 'shortDate') : 'N/A' }}
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>
            } @else {
              <div class="no-data">
                <mat-icon>compare_arrows</mat-icon>
                <p>No crops available for comparison</p>
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .tabs-panel {
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

    .comparison-tabs {
      ::ng-deep .mat-mdc-tab-labels {
        background: rgba(16, 185, 129, 0.05);
        border-radius: 12px;
        padding: 4px;
      }

      ::ng-deep .mat-mdc-tab-label {
        border-radius: 8px;
        transition: all 0.3s ease;

        .mat-mdc-tab-label-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }

        &:hover {
          background: rgba(16, 185, 129, 0.1);
        }
      }

      ::ng-deep .mat-mdc-tab-label-active {
        background: rgba(16, 185, 129, 0.15);
        font-weight: 600;
      }
    }

    .tab-content {
      padding: 2rem 0;
      min-height: 300px;
    }

    .map-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
      border-radius: 16px;
      border: 2px dashed rgba(16, 185, 129, 0.3);

      mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: #10b981;
        margin-bottom: 1rem;
        opacity: 0.7;
      }

      h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
      }

      p {
        margin: 0;
        font-size: 1rem;
        color: #6b7280;
        max-width: 400px;
      }
    }

    .comparison-table-container {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid rgba(16, 185, 129, 0.1);
    }

    .comparison-table {
      width: 100%;

      th {
        background: linear-gradient(135deg, #f8fafb, #f0fdf4);
        font-weight: 700;
        color: #1f2937;
        padding: 1rem;
        border-bottom: 2px solid rgba(16, 185, 129, 0.2);
      }

      td {
        padding: 1rem;
        color: #374151;
        border-bottom: 1px solid rgba(16, 185, 129, 0.1);
      }

      tr:hover {
        background: rgba(16, 185, 129, 0.05);
      }
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
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

    .no-data {
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
      .tabs-panel {
        padding: 1.5rem;
      }

      .tab-content {
        padding: 1.5rem 0;
      }

      .comparison-table {
        th, td {
          padding: 0.75rem;
          font-size: 0.875rem;
        }
      }
    }

    /* Dark theme */
    :host-context(body.dark-theme) {
      .tabs-panel {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(16, 185, 129, 0.2);
      }

      .panel-header {
        border-bottom-color: rgba(16, 185, 129, 0.2);

        h2 {
          color: #f1f5f9;
        }
      }

      .map-placeholder {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8));
        border-color: rgba(16, 185, 129, 0.4);

        h3 {
          color: #f1f5f9;
        }

        p {
          color: #94a3b8;
        }
      }

      .comparison-table {
        th {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
          color: #f1f5f9;
          border-bottom-color: rgba(16, 185, 129, 0.3);
        }

        td {
          color: #e2e8f0;
          border-bottom-color: rgba(16, 185, 129, 0.1);
        }

        tr:hover {
          background: rgba(16, 185, 129, 0.1);
        }
      }

      .no-data {
        color: #64748b;
      }
    }
  `]
})
export class MapComparisonTabsComponent {
  comparisonData = input<any[] | null>(null);

  displayedColumns = ['name', 'status', 'planted', 'harvest'];
}

