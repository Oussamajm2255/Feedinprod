import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { ApiService } from '../../../../core/services/api.service';
import { FarmManagementService } from '../../../../core/services/farm-management.service';
import { ActionLog } from '../../../../core/models/action-log.model';
import { Device, Farm } from '../../../../core/models/farm.model';
import { LanguageService } from '../../../../core/services/language.service';
import { ThemeService } from '../../../../core/services/theme.service';

interface ActionCluster {
  period: string;
  actions: ActionLog[];
  summary: {
    total: number;
    manual: number;
    automated: number;
    warnings: number;
  };
}

interface ActionFilters {
  farm: string;
  device: string;
  user: string;
  dateRange: string;
}

@Component({
  selector: 'app-recent-actions',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatMenuModule,
  ],
  animations: [
    // Timeline item animation
    trigger('timelineItem', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    // Stagger animation for action clusters
    trigger('clusterStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(150, [
            animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    // Action bubble animation
    trigger('actionBubble', [
      state('default', style({ transform: 'scale(1)' })),
      state('hover', style({ transform: 'scale(1.05)' })),
      transition('default <=> hover', animate('200ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),
    // Glow animation for new actions
    trigger('newActionGlow', [
      state('new', style({
        boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 0.8)'
      })),
      state('normal', style({
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        borderColor: 'var(--glass-border)'
      })),
      transition('new => normal', animate('2000ms ease-out'))
    ]),
    // Filter slide animation
    trigger('filterSlide', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ height: 0, opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="recent-actions-container">
      <!-- Top Filter Bar -->
      <div class="filter-bar-section">
        <div class="filter-bar glass-card">
          <div class="filter-header">
            <h2>
              <mat-icon>timeline</mat-icon>
              {{ languageService.t()('recentActions.title') }}
            </h2>
            <p>{{ languageService.t()('recentActions.subtitle') }}</p>
          </div>

          <div class="filter-controls">
            <!-- Farm Filter -->
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>{{ languageService.t()('recentActions.farm') }}</mat-label>
              <mat-select [(value)]="filters().farm" (selectionChange)="applyFilters()">
                <mat-option value="all">{{ languageService.t()('recentActions.allFarms') }}</mat-option>
                <mat-option *ngFor="let farm of farms()" [value]="farm.farm_id">
                  {{ farm.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Device Filter -->
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>{{ languageService.t()('recentActions.device') }}</mat-label>
              <mat-select [(value)]="filters().device" (selectionChange)="applyFilters()">
                <mat-option value="all">{{ languageService.t()('recentActions.allDevices') }}</mat-option>
                <mat-option *ngFor="let device of devices()" [value]="device.device_id">
                  {{ device.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <!-- User Filter -->
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>{{ languageService.t()('recentActions.user') }}</mat-label>
              <mat-select [(value)]="filters().user" (selectionChange)="applyFilters()">
                <mat-option value="all">{{ languageService.t()('recentActions.allUsers') }}</mat-option>
                <mat-option value="manual">{{ languageService.t()('recentActions.manual') }}</mat-option>
                <mat-option value="auto">{{ languageService.t()('recentActions.automated') }}</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Quick Date Filter -->
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>{{ languageService.t()('recentActions.timeRange') }}</mat-label>
              <mat-select [(value)]="filters().dateRange" (selectionChange)="applyFilters()">
                <mat-option value="today">{{ languageService.t()('recentActions.today') }}</mat-option>
                <mat-option value="yesterday">{{ languageService.t()('recentActions.yesterday') }}</mat-option>
                <mat-option value="week">{{ languageService.t()('recentActions.thisWeek') }}</mat-option>
                <mat-option value="month">{{ languageService.t()('recentActions.thisMonth') }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>
      </div>

      <!-- Timeline Stream -->
      <div class="timeline-section">
        <div class="timeline-wrapper" *ngIf="!isLoading(); else loadingState">
          <div class="timeline-track"></div>

          <div class="action-clusters" [@clusterStagger]>
            <div class="action-cluster"
                 *ngFor="let cluster of actionClusters(); trackBy: trackByClusterPeriod; let i = index"
                 [style.animation-delay]="i * 150 + 'ms'">

              <!-- Cluster Header -->
              <div class="cluster-header glass-card">
                <div class="cluster-period">
                  <mat-icon>schedule</mat-icon>
                  <h3>{{ cluster.period }}</h3>
                </div>
                <div class="cluster-summary">
                  <div class="summary-item">
                    <mat-icon>history</mat-icon>
                    <span>{{ cluster.summary.total }}</span>
                  </div>
                  <div class="summary-item">
                    <mat-icon>touch_app</mat-icon>
                    <span>{{ cluster.summary.manual }}</span>
                  </div>
                  <div class="summary-item">
                    <mat-icon>smart_toy</mat-icon>
                    <span>{{ cluster.summary.automated }}</span>
                  </div>
                  <div class="summary-item" *ngIf="cluster.summary.warnings > 0">
                    <mat-icon>warning</mat-icon>
                    <span>{{ cluster.summary.warnings }}</span>
                  </div>
                </div>
              </div>

              <!-- Actions in Cluster -->
              <div class="cluster-actions">
                <div class="action-bubble glass-card hover-lift"
                     *ngFor="let action of cluster.actions; trackBy: trackByActionId; let j = index"
                     [@actionBubble]
                     [@newActionGlow]="isNewAction(action) ? 'new' : 'normal'"
                     [style.animation-delay]="j * 100 + 'ms'"
                     (click)="expandAction(action)"
                     [class.expanded]="expandedAction() === action.id">

                  <!-- Action Icon -->
                  <div class="action-icon-wrapper" [class]="getActionStatusClass(action)">
                    <mat-icon>{{ getActionIcon(action) }}</mat-icon>
                    <div class="pulse-ring" *ngIf="isNewAction(action)"></div>
                  </div>

                  <!-- Action Content -->
                  <div class="action-content">
                    <div class="action-header">
                      <h4>{{ getActionTitle(action) }}</h4>
                      <div class="action-tags">
                        <mat-chip [class]="getSourceChipClass(action.trigger_source)" size="small">
                          {{ getSourceText(action.trigger_source) }}
                        </mat-chip>
                        <mat-chip [class]="getStatusChipClass(action.status)" size="small">
                          <span class="status-dot" [class]="action.status"></span>
                          {{ getStatusText(action.status) }}
                        </mat-chip>
                      </div>
                    </div>

                    <div class="action-description">
                      <p>{{ getActionDescription(action) }}</p>
                    </div>

                    <div class="action-meta">
                      <div class="meta-item">
                        <mat-icon>devices</mat-icon>
                        <span>{{ getDeviceName(action.device_id) }}</span>
                      </div>
                      <div class="meta-item">
                        <mat-icon>schedule</mat-icon>
                        <span>{{ action.created_at | date:'short' }}</span>
                      </div>
                      <div class="meta-item" *ngIf="action.value != null">
                        <mat-icon>speed</mat-icon>
                        <span>{{ getValueDisplay(action.value, action.unit || '') }}</span>
                      </div>
                    </div>

                    <!-- Expanded Details -->
                    <div class="action-details" *ngIf="expandedAction() === action.id">
                      <div class="details-section">
                        <h5>{{ languageService.t()('recentActions.details') }}</h5>
                        <div class="detail-item">
                          <span class="detail-label">{{ languageService.t()('recentActions.actionUri') }}:</span>
                          <span class="detail-value">{{ action.action_uri }}</span>
                        </div>
                        <div class="detail-item" *ngIf="action.sensor_id">
                          <span class="detail-label">{{ languageService.t()('recentActions.sensorId') }}:</span>
                          <span class="detail-value">{{ action.sensor_id }}</span>
                        </div>
                        <div class="detail-item" *ngIf="action.error_message">
                          <span class="detail-label">{{ languageService.t()('recentActions.error') }}:</span>
                          <span class="detail-value error">{{ action.error_message }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Action Time -->
                  <div class="action-time">
                    <span class="time-primary">{{ action.created_at | date:'shortTime' }}</span>
                    <span class="time-relative">{{ getRelativeTime(action.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="actionClusters().length === 0 && !isLoading()">
          <mat-icon class="empty-icon">event_busy</mat-icon>
          <h3>{{ languageService.t()('recentActions.noActions') }}</h3>
          <p>{{ languageService.t()('recentActions.noActionsDescription') }}</p>
        </div>
      </div>

      <!-- Summary Footer -->
      <div class="summary-footer glass-card" *ngIf="actionClusters().length > 0">
        <div class="summary-content">
          <div class="summary-text">
            <mat-icon>info</mat-icon>
            <span>{{ getSummaryText() }}</span>
          </div>
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-value">{{ getTotalActions() }}</span>
              <span class="stat-label">{{ languageService.t()('recentActions.total') }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ getManualActions() }}</span>
              <span class="stat-label">{{ languageService.t()('recentActions.manual') }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ getAutomatedActions() }}</span>
              <span class="stat-label">{{ languageService.t()('recentActions.automated') }}</span>
            </div>
            <div class="stat-item" *ngIf="getWarningActions() > 0">
              <span class="stat-value warning">{{ getWarningActions() }}</span>
              <span class="stat-label">{{ languageService.t()('recentActions.warnings') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <ng-template #loadingState>
      <div class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ languageService.t()('recentActions.loading') }}</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .recent-actions-container {
      padding: 1.5rem 2rem;
      max-width: 1600px;
      margin: 0 auto;
      min-height: 100vh;
      background: transparent;
    }

    // Filter Bar Section
    .filter-bar-section {
      margin-bottom: 2rem;
      animation: fadeInDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .filter-bar {
      padding: 1.5rem;
      background: var(--glass-bg, rgba(255, 255, 255, 0.7));
      backdrop-filter: blur(12px);
      border-radius: 16px;
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.4));
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .filter-header {
      text-align: center;
      margin-bottom: 1.5rem;

      h2 {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);

        mat-icon {
          color: var(--primary-green);
        }
      }

      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 1rem;
      }
    }

    .filter-controls {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .filter-field {
      width: 100%;
    }

    // Timeline Section
    .timeline-section {
      position: relative;
      margin-bottom: 2rem;
    }

    .timeline-wrapper {
      position: relative;
      padding: 2rem 0;
    }

    .timeline-track {
      position: absolute;
      left: 32px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(180deg,
        var(--primary-green) 0%,
        rgba(16, 185, 129, 0.3) 50%,
        transparent 100%);
    }

    .action-clusters {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .action-cluster {
      position: relative;
      padding-left: 3rem;
    }

    .cluster-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      margin-bottom: 1rem;
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      border-radius: 12px;
      border: 1px solid var(--glass-border);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

      .cluster-period {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        mat-icon {
          color: var(--primary-green);
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
        }
      }

      .cluster-summary {
        display: flex;
        gap: 1rem;

        .summary-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 8px;
          font-size: 0.875rem;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: var(--primary-green);
          }

          span {
            font-weight: 600;
            color: var(--text-primary);
          }
        }
      }
    }

    .cluster-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .action-bubble {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      border: 1px solid var(--glass-border);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;

      &:hover {
        transform: translateX(8px) translateY(-4px);
        box-shadow: 0 12px 24px rgba(16, 185, 129, 0.15);
        border-color: rgba(16, 185, 129, 0.3);
      }

      &.expanded {
        transform: translateX(8px);
        box-shadow: 0 12px 24px rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.4);
      }
    }

    .action-icon-wrapper {
      position: relative;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.3s ease;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }

      &.success {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      &.warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      &.error {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }

      &.manual {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
      }

      &.auto {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      }

      .pulse-ring {
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 2px solid var(--primary-green);
        border-radius: 50%;
        animation: pulseRing 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }
    }

    @keyframes pulseRing {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(1.3);
        opacity: 0;
      }
    }

    .action-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .action-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;

      h4 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
        flex: 1;
      }

      .action-tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
    }

    .action-description {
      p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.6;
        font-size: 0.875rem;
      }
    }

    .action-meta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-secondary);

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .action-details {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);

      .details-section {
        h5 {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .detail-item {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;

          .detail-label {
            color: var(--text-secondary);
            font-weight: 500;
            min-width: 80px;
          }

          .detail-value {
            color: var(--text-primary);
            font-family: monospace;

            &.error {
              color: #ef4444;
            }
          }
        }
      }
    }

    .action-time {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
      min-width: 80px;

      .time-primary {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .time-relative {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }

    // Summary Footer
    .summary-footer {
      margin-top: 2rem;
      padding: 1.5rem;
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      border: 1px solid var(--glass-border);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

      .summary-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2rem;

        .summary-text {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1rem;
          color: var(--text-primary);

          mat-icon {
            color: var(--primary-green);
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }

        .summary-stats {
          display: flex;
          gap: 1.5rem;

          .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;

            .stat-value {
              font-size: 1.5rem;
              font-weight: 700;
              color: var(--text-primary);
              font-variant-numeric: tabular-nums;

              &.warning {
                color: #f59e0b;
              }
            }

            .stat-label {
              font-size: 0.75rem;
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          }
        }
      }
    }

    // Empty State
    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      color: var(--text-secondary);

      .empty-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
        color: var(--primary-green);
      }

      h3 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
        font-size: 1.25rem;
      }

      p {
        margin: 0;
        font-size: 1rem;
      }
    }

    // Loading State
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: var(--text-secondary);

      p {
        margin-top: 1rem;
        font-size: 1rem;
      }
    }

    // Chip Styles
    .mat-mdc-chip {
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;

      &.success-chip {
        background: rgba(16, 185, 129, 0.1);
        color: #065f46;
      }

      &.error-chip {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }

      &.pending-chip {
        background: rgba(245, 158, 11, 0.1);
        color: #92400e;
      }

      &.manual-chip {
        background: rgba(59, 130, 246, 0.1);
        color: #1e40af;
      }

      &.auto-chip {
        background: rgba(139, 92, 246, 0.1);
        color: #6b21a8;
      }

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 0.25rem;

        &.ack, &.sent {
          background: #10b981;
        }

        &.error {
          background: #ef4444;
        }

        &.queued {
          background: #f59e0b;
        }
      }
    }

    // Dark Theme Support
    :host-context(body.dark-theme) {
      .filter-bar, .cluster-header, .action-bubble, .summary-footer {
        background: var(--glass-bg, rgba(30, 41, 59, 0.7));
        border-color: var(--glass-border, rgba(100, 116, 139, 0.3));
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(100, 116, 139, 0.1);
      }

      .action-bubble:hover, .action-bubble.expanded {
        box-shadow: 0 12px 24px rgba(16, 185, 129, 0.2), inset 0 1px 1px rgba(100, 116, 139, 0.2);
      }

      .timeline-track {
        background: linear-gradient(180deg,
          rgba(16, 185, 129, 0.5) 0%,
          rgba(16, 185, 129, 0.2) 50%,
          transparent 100%);
      }
    }

    // Responsive Design
    @media (max-width: 1200px) {
      .filter-controls {
        grid-template-columns: repeat(2, 1fr);
      }

      .summary-content {
        flex-direction: column;
        gap: 1rem;
      }
    }

    @media (max-width: 768px) {
      .recent-actions-container {
        padding: 1rem;
      }

      .filter-controls {
        grid-template-columns: 1fr;
      }

      .action-cluster {
        padding-left: 2rem;
      }

      .timeline-track {
        left: 16px;
      }

      .action-bubble {
        padding: 1rem;
      }

      .action-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .action-tags {
        width: 100%;
      }

      .action-meta {
        flex-direction: column;
        gap: 0.5rem;
      }

      .summary-stats {
        flex-wrap: wrap;
        gap: 1rem;
      }
    }

    @media (max-width: 480px) {
      .action-bubble {
        padding: 0.75rem;
      }

      .action-icon-wrapper {
        width: 40px;
        height: 40px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .summary-stats {
        gap: 0.75rem;
      }

      .stat-item {
        .stat-value {
          font-size: 1.25rem;
        }
      }
    }
  `]
})
export class RecentActionsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private farmManagement = inject(FarmManagementService);
  public languageService = inject(LanguageService);
  public themeService = inject(ThemeService);
  private refreshSubscription: Subscription | undefined;

  // Signals
  isLoading = signal(false);
  actions = signal<ActionLog[]>([]);
  devices = signal<Device[]>([]);
  farms = signal<Farm[]>([]);
  expandedAction = signal<string | null>(null);
  filters = signal<ActionFilters>({
    farm: 'all',
    device: 'all',
    user: 'all',
    dateRange: 'today'
  });

  // Computed properties
  actionClusters = computed((): ActionCluster[] => {
    const actions = this.getFilteredActions();
    const clusters: ActionCluster[] = [];

    // Group actions by time periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Group by periods
    const todayActions = actions.filter(a => new Date(a.created_at) >= today);
    const yesterdayActions = actions.filter(a => {
      const actionDate = new Date(a.created_at);
      return actionDate >= yesterday && actionDate < today;
    });
    const weekActions = actions.filter(a => {
      const actionDate = new Date(a.created_at);
      return actionDate >= weekAgo && actionDate < yesterday;
    });
    const monthActions = actions.filter(a => {
      const actionDate = new Date(a.created_at);
      return actionDate >= monthAgo && actionDate < weekAgo;
    });

    // Create clusters
    if (todayActions.length > 0) {
      clusters.push(this.createCluster(this.languageService.t()('recentActions.todayMorning'), todayActions));
    }
    if (yesterdayActions.length > 0) {
      clusters.push(this.createCluster(this.languageService.t()('recentActions.yesterday'), yesterdayActions));
    }
    if (weekActions.length > 0) {
      clusters.push(this.createCluster(this.languageService.t()('recentActions.thisWeek'), weekActions));
    }
    if (monthActions.length > 0) {
      clusters.push(this.createCluster(this.languageService.t()('recentActions.thisMonth'), monthActions));
    }

    return clusters;
  });

  ngOnInit(): void {
    this.loadData();
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  startRealTimeUpdates(): void {
    this.refreshSubscription = interval(15000).pipe( // Refresh every 15 seconds
      startWith(0),
      switchMap(() => this.loadActions())
    ).subscribe();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const selectedFarm = this.farmManagement.getSelectedFarm();
      if (!selectedFarm) {
        console.log('⚠️ [RECENT ACTIONS] No farm selected, skipping data load');
        this.isLoading.set(false);
        return;
      }

      console.log('🏡 [RECENT ACTIONS] Loading data for farm:', selectedFarm.name);

      // Load devices and farms
      const devices = await this.apiService.getDevicesByFarm(selectedFarm.farm_id).toPromise();
      this.devices.set(devices || []);

      const farms = await this.apiService.getFarms().toPromise();
      this.farms.set(farms || []);

      // Load actions
      await this.loadActions();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadActions(): Promise<void> {
    try {
      const selectedFarm = this.farmManagement.getSelectedFarm();
      if (!selectedFarm) return;

      // Load last 30 days of actions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const farmDevices = await this.apiService.getDevicesByFarm(selectedFarm.farm_id).toPromise();
      const farmDeviceIds = farmDevices?.map(device => device.device_id) || [];

      let allActions: ActionLog[] = [];
      for (const deviceId of farmDeviceIds) {
        const response = await this.apiService.getActions({
          limit: 50,
          offset: 0,
          from: thirtyDaysAgo.toISOString(),
          device_id: deviceId
        }).toPromise();

        if (response?.items) {
          allActions = [...allActions, ...response.items];
        }
      }

      // Sort by newest first
      allActions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      this.actions.set(allActions);
    } catch (error) {
      console.error('Error loading actions:', error);
    }
  }

  getFilteredActions(): ActionLog[] {
    let filtered = this.actions();
    const filters = this.filters();

    // Apply filters
    if (filters.device !== 'all') {
      filtered = filtered.filter(a => a.device_id === filters.device);
    }

    if (filters.user !== 'all') {
      filtered = filtered.filter(a => a.trigger_source === filters.user);
    }

    // Date range filter is handled in actionClusters computed property
    return filtered;
  }

  createCluster(period: string, actions: ActionLog[]): ActionCluster {
    return {
      period,
      actions: actions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      summary: {
        total: actions.length,
        manual: actions.filter(a => a.trigger_source === 'manual').length,
        automated: actions.filter(a => a.trigger_source === 'auto').length,
        warnings: actions.filter(a => a.status === 'error').length
      }
    };
  }

  applyFilters(): void {
    // Filters are applied automatically through computed properties
  }

  expandAction(action: ActionLog): void {
    if (this.expandedAction() === action.id) {
      this.expandedAction.set(null);
    } else {
      this.expandedAction.set(action.id);
    }
  }

  isNewAction(action: ActionLog): boolean {
    const now = new Date();
    const actionDate = new Date(action.created_at);
    const diffMins = (now.getTime() - actionDate.getTime()) / 60000;
    return diffMins < 5; // New if within 5 minutes
  }

  getActionIcon(action: ActionLog): string {
    const actionName = action.action_uri.toLowerCase();
    if (actionName.includes('irrigation') || actionName.includes('water')) return 'water_drop';
    if (actionName.includes('ventilator') || actionName.includes('fan')) return 'air';
    if (actionName.includes('light')) return 'lightbulb';
    if (actionName.includes('heater')) return 'local_fire_department';
    if (actionName.includes('roof')) return 'open_in_full';
    if (actionName.includes('alarm')) return 'security';
    return 'settings';
  }

  getActionStatusClass(action: ActionLog): string {
    if (action.status === 'error') return 'error';
    if (action.trigger_source === 'manual') return 'manual';
    if (action.trigger_source === 'auto') return 'auto';
    return 'success';
  }

  getActionTitle(action: ActionLog): string {
    const actionName = this.getActionName(action.action_uri);
    const deviceName = this.getDeviceName(action.device_id);

    if (action.trigger_source === 'manual') {
      return this.languageService.t()('recentActions.manualActionTitle', {
        action: this.getActionNameTranslation(actionName),
        device: deviceName
      });
    } else {
      return this.languageService.t()('recentActions.automaticActionTitle', {
        action: this.getActionNameTranslation(actionName),
        device: deviceName
      });
    }
  }

  getActionDescription(action: ActionLog): string {
    if (action.status === 'error') {
      return this.languageService.t()('recentActions.actionFailedDescription', {
        error: action.error_message || this.languageService.t()('recentActions.checkDeviceConnection')
      });
    }

    if (action.trigger_source === 'manual') {
      const time = new Date(action.created_at).toLocaleTimeString();
      return this.languageService.t()('recentActions.manualActionDescription', { time: time });
    } else {
      const sensorInfo = action.sensor_type && action.value
        ? this.languageService.t()('recentActions.automaticActionDescription', {
            sensor: this.getSensorTypeTranslation(action.sensor_type),
            value: action.value,
            unit: this.getUnitTranslation(action.unit || '')
          })
        : this.languageService.t()('recentActions.automaticActionDescriptionSimple');
      return sensorInfo;
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'sent': return this.languageService.t()('recentActions.statusSent');
      case 'ack': return this.languageService.t()('recentActions.statusConfirmed');
      case 'error': return this.languageService.t()('recentActions.statusFailed');
      case 'queued': return this.languageService.t()('recentActions.statusWaiting');
      default: return status;
    }
  }

  getStatusChipClass(status: string): string {
    switch (status) {
      case 'sent':
      case 'ack': return 'success-chip';
      case 'error': return 'error-chip';
      case 'queued': return 'pending-chip';
      default: return '';
    }
  }

  getSourceChipClass(source: string): string {
    return source === 'auto' ? 'auto-chip' : 'manual-chip';
  }

  getSourceText(source: string): string {
    switch (source) {
      case 'auto': return this.languageService.t()('recentActions.automatic');
      case 'manual': return this.languageService.t()('recentActions.manual');
      default: return source;
    }
  }

  getDeviceName(deviceId: string): string {
    const device = this.devices().find(d => d.device_id === deviceId);
    return device?.name || deviceId;
  }

  getActionName(actionUri: string): string {
    const parts = actionUri.split('/');
    return parts[parts.length - 1].replace(/_/g, ' ').replace(/mqtt:/, '');
  }

  getActionNameTranslation(actionName: string): string {
    const actionMap: { [key: string]: string } = {
      'irrigation': this.languageService.t()('recentActions.actionTypes.irrigation'),
      'ventilation': this.languageService.t()('recentActions.actionTypes.ventilation'),
      'lighting': this.languageService.t()('recentActions.actionTypes.lighting'),
      'heating': this.languageService.t()('recentActions.actionTypes.heating'),
      'watering': this.languageService.t()('recentActions.actionTypes.watering'),
      'fan': this.languageService.t()('recentActions.actionTypes.fan'),
      'pump': this.languageService.t()('recentActions.actionTypes.pump'),
      'light': this.languageService.t()('recentActions.actionTypes.light'),
    };

    return actionMap[actionName.toLowerCase()] || actionName;
  }

  getSensorTypeTranslation(sensorType: string): string {
    const sensorTypeMap: { [key: string]: string } = {
      'temperature': this.languageService.t()('reensors.sensorTypes.temperature'),
      'humidity': this.languageService.t()('sensors.sensorTypes.humidity'),
      'soil_moisture': this.languageService.t()('sensors.sensorTypes.soilMoisture'),
      'light': this.languageService.t()('sensors.sensorTypes.light'),
    };
    return sensorTypeMap[sensorType.toLowerCase()] || sensorType;
  }

  getUnitTranslation(unit: string): string {
    const unitMap: { [key: string]: string } = {
      'celsius': this.languageService.t()('sensors.units.celsius'),
      'percent': this.languageService.t()('sensors.units.percent'),
      'lux': this.languageService.t()('sensors.units.lux'),
    };
    return unitMap[unit.toLowerCase()] || unit;
  }

  getValueDisplay(value: number, unit?: string): string {
    if (unit) {
      return `${value} ${this.getUnitTranslation(unit)}`;
    }
    return value.toString();
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return this.languageService.t()('recentActions.justNow');
    if (diffMins < 60) return this.languageService.t()('recentActions.minutesAgo', { count: diffMins });
    if (diffHours < 24) return this.languageService.t()('recentActions.hoursAgo', { count: diffHours });
    if (diffDays < 7) return this.languageService.t()('recentActions.daysAgo', { count: diffDays });
    return this.languageService.t()('recentActions.weeksAgo');
  }

  getSummaryText(): string {
    const total = this.getTotalActions();
    const manual = this.getManualActions();
    const automated = this.getAutomatedActions();
    const warnings = this.getWarningActions();

    return this.languageService.t()('recentActions.summaryText', {
      total,
      manual,
      automated,
      warnings
    });
  }

  getTotalActions(): number {
    return this.getFilteredActions().length;
  }

  getManualActions(): number {
    return this.getFilteredActions().filter(a => a.trigger_source === 'manual').length;
  }

  getAutomatedActions(): number {
    return this.getFilteredActions().filter(a => a.trigger_source === 'auto').length;
  }

  getWarningActions(): number {
    return this.getFilteredActions().filter(a => a.status === 'error').length;
  }

  trackByClusterPeriod(index: number, cluster: ActionCluster): string {
    return cluster.period;
  }

  trackByActionId(index: number, action: ActionLog): string {
    return action.id || index.toString();
  }
}
