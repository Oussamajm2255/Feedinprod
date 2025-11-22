import { Component, Inject, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';

import { ActionLog } from '../../../../core/models/action-log.model';
import { Device, Farm } from '../../../../core/models/farm.model';
import { LanguageService } from '../../../../core/services/language.service';

interface DialogData {
  action: ActionLog;
  devices: Device[];
  farms: Farm[];
}

@Component({
  selector: 'app-action-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  animations: [
    // Dialog entrance animation
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8) translateY(20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'scale(0.9) translateY(-10px)' }))
      ])
    ]),
    // Content stagger animation
    trigger('contentAnimation', [
      transition(':enter', [
        query('.detail-item, .metric-item', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(100, [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    // Status pulse animation
    trigger('statusPulse', [
      state('active', style({ transform: 'scale(1.05)' })),
      state('inactive', style({ transform: 'scale(1)' })),
      transition('inactive <=> active', animate('200ms ease-in-out'))
    ])
  ],
  template: `
    <div class="action-details-dialog glass-dialog" [@dialogAnimation]>
      <!-- Header Section -->
      <div class="dialog-header">
        <div class="action-icon-wrapper" [@statusPulse]="isStatusActive() ? 'active' : 'inactive'">
          <mat-icon class="action-icon" [ngClass]="getActionIconClass()">{{ getActionIcon() }}</mat-icon>
          <div class="pulse-ring" *ngIf="isRecentAction()"></div>
        </div>
        <div class="header-content">
          <h2 class="dialog-title">{{ getActionTitle() }}</h2>
          <p class="dialog-subtitle">{{ getActionDescription() }}</p>
        </div>
        <button mat-icon-button 
                (click)="onClose()" 
                class="close-header-btn"
                [attr.aria-label]="languageService.t()('common.close')">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content Section -->
      <mat-dialog-content class="dialog-content" [@contentAnimation]>
        <!-- Key Details Grid -->
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-icon">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="detail-content">
              <span class="detail-label">{{ languageService.t()('actions.executedAt') }}</span>
              <span class="detail-value">{{ data.action.created_at | date:'short' }}</span>
              <span class="detail-time">{{ getRelativeTime(data.action.created_at) }}</span>
            </div>
          </div>

          <div class="detail-item">
            <div class="detail-icon">
              <mat-icon>{{ data.action.trigger_source === 'auto' ? 'smart_toy' : 'touch_app' }}</mat-icon>
            </div>
            <div class="detail-content">
              <span class="detail-label">{{ languageService.t()('actions.performedBy') }}</span>
              <mat-chip [ngClass]="getSourceChipClass()" class="source-chip">
                <mat-icon>{{ data.action.trigger_source === 'auto' ? 'precision_manufacturing' : 'account_circle' }}</mat-icon>
                {{ getSourceText() }}
              </mat-chip>
            </div>
          </div>

          <div class="detail-item">
            <div class="detail-icon">
              <mat-icon>devices</mat-icon>
            </div>
            <div class="detail-content">
              <span class="detail-label">{{ languageService.t()('actions.targetDevice') }}</span>
              <span class="detail-value">{{ getDeviceName() }}</span>
              <span class="detail-location">{{ getDeviceLocation() }}</span>
            </div>
          </div>

          <div class="detail-item">
            <div class="detail-icon">
              <mat-icon>{{ getStatusIcon() }}</mat-icon>
            </div>
            <div class="detail-content">
              <span class="detail-label">{{ languageService.t()('actions.status') }}</span>
              <mat-chip [ngClass]="getStatusChipClass()" class="status-chip">
                <span class="status-indicator" [ngClass]="data.action.status"></span>
                {{ getStatusText() }}
              </mat-chip>
            </div>
          </div>
        </div>

        <!-- Metrics Section (if available) -->
        <div class="metrics-section" *ngIf="hasMetrics()">
          <div class="metrics-header">
            <mat-icon>analytics</mat-icon>
            <h3>{{ languageService.t()('actions.metrics') }}</h3>
          </div>
          <div class="metrics-grid">
            <div class="metric-item" *ngIf="data.action.sensor_type">
              <div class="metric-icon">
                <mat-icon>{{ getSensorIcon() }}</mat-icon>
              </div>
              <div class="metric-content">
                <span class="metric-label">{{ getSensorTypeTranslation() }}</span>
                <span class="metric-value" *ngIf="data.action.value">
                  {{ data.action.value }} {{ getUnitTranslation() }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Section (if error) -->
        <div class="error-section" *ngIf="data.action.status === 'error' && data.action.error_message">
          <div class="error-header">
            <mat-icon>warning</mat-icon>
            <h3>{{ languageService.t()('actions.errorDetails') }}</h3>
          </div>
          <div class="error-content">
            <p>{{ data.action.error_message }}</p>
          </div>
        </div>

        <!-- Additional Details (Expandable) -->
        <div class="additional-details">
          <mat-expansion-panel class="glass-panel" *ngIf="hasAdditionalDetails()">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>info</mat-icon>
                {{ languageService.t()('actions.additionalDetails') }}
              </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="panel-content">
              <div class="detail-item" *ngIf="data.action.action_uri">
                <span class="label">{{ languageService.t()('actions.actionUri') }}</span>
                <span class="value code">{{ data.action.action_uri }}</span>
              </div>
              <div class="detail-item" *ngIf="data.action.topic">
                <span class="label">{{ languageService.t()('actions.mqttTopic') }}</span>
                <span class="value code">{{ data.action.topic }}</span>
              </div>
              <div class="detail-item" *ngIf="data.action.payload">
                <span class="label">{{ languageService.t()('actions.payload') }}</span>
                <pre class="payload-json">{{ formatPayload() }}</pre>
              </div>
            </div>
          </mat-expansion-panel>
        </div>
      </mat-dialog-content>
      
      <!-- Actions Section -->
      <mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button 
                (click)="onClose()" 
                class="close-btn"
                [attr.aria-label]="languageService.t()('common.close')">
          <mat-icon>close</mat-icon>
          {{ languageService.t()('common.close') }}
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="viewLogs()" 
                class="action-btn"
                [attr.aria-label]="languageService.t()('actions.viewLogs')">
          <mat-icon>visibility</mat-icon>
          {{ languageService.t()('actions.viewLogs') }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    // Glassmorphic Dialog Container - Responsive
    .action-details-dialog {
      width: 100%;
      max-width: 90vw;
      max-height: 90vh;
      min-width: 320px;
      background: var(--glass-bg, rgba(255, 255, 255, 0.6));
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 20px;
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.15));
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.1),
        inset 0 1px 1px rgba(255, 255, 255, 0.6);
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(34, 255, 153, 0.5), transparent);
        opacity: 0.8;
      }
    }

    // Dialog Header - Responsive
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, rgba(34, 255, 153, 0.05), rgba(59, 130, 246, 0.05));
      border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
      flex-shrink: 0;
      min-height: 80px;
    }

    .action-icon-wrapper {
      position: relative;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-green, #22FF99), var(--primary-blue, #3B82F6));
      box-shadow: 0 4px 12px rgba(34, 255, 153, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      .action-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }

      .pulse-ring {
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 2px solid var(--primary-green, #22FF99);
        border-radius: 16px;
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

    .header-content {
      flex: 1;
      min-width: 0;

      .dialog-title {
        margin: 0 0 0.25rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dialog-subtitle {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
        line-height: 1.4;
        opacity: 0.8;
      }
    }

    .close-header-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: var(--text-secondary);
      transition: all 0.2s ease;
      flex-shrink: 0;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        color: var(--text-primary);
        transform: scale(1.05);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    // Dialog Content - Responsive
    .dialog-content {
      padding: 1.5rem;
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(34, 255, 153, 0.3);
        border-radius: 3px;
        transition: background 0.2s ease;

        &:hover {
          background: rgba(34, 255, 153, 0.5);
        }
      }
    }

    // Details Grid - Responsive
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.2s ease;

      &:hover {
        background: rgba(34, 255, 153, 0.05);
        border-color: rgba(34, 255, 153, 0.2);
        transform: translateY(-1px);
      }
    }

    .detail-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(34, 255, 153, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--primary-green, #22FF99);
      }
    }

    .detail-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;

      .detail-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .detail-value {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
        line-height: 1.3;
      }

      .detail-time {
        font-size: 0.75rem;
        color: var(--text-secondary);
        opacity: 0.8;
      }

      .detail-location {
        font-size: 0.75rem;
        color: var(--text-secondary);
        opacity: 0.7;
      }
    }

    // Chips
    .source-chip, .status-chip {
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      max-width: fit-content;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .source-chip {
      &.auto-chip {
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
        border: 1px solid rgba(59, 130, 246, 0.2);
      }

      &.manual-chip {
        background: rgba(245, 158, 11, 0.1);
        color: #d97706;
        border: 1px solid rgba(245, 158, 11, 0.2);
      }
    }

    .status-chip {
      .status-indicator {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 0.25rem;
        animation: statusPulse 2s ease-in-out infinite;

        &.ack, &.sent {
          background: #10b981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
        }

        &.error {
          background: #ef4444;
          box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
        }

        &.queued {
          background: #f59e0b;
          box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
        }
      }

      &.success-chip {
        background: rgba(16, 185, 129, 0.1);
        color: #059669;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }

      &.error-chip {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
        border: 1px solid rgba(239, 68, 68, 0.2);
      }

      &.pending-chip {
        background: rgba(245, 158, 11, 0.1);
        color: #d97706;
        border: 1px solid rgba(245, 158, 11, 0.2);
      }
    }

    @keyframes statusPulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }

    // Metrics Section
    .metrics-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: rgba(34, 255, 153, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(34, 255, 153, 0.1);

      .metrics-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: var(--primary-green, #22FF99);
        }

        h3 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }
      }

      .metrics-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .metric-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;

        .metric-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(34, 255, 153, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: var(--primary-green, #22FF99);
          }
        }

        .metric-content {
          flex: 1;

          .metric-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
            display: block;
            margin-bottom: 0.125rem;
          }

          .metric-value {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-primary);
          }
        }
      }
    }

    // Error Section
    .error-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: rgba(239, 68, 68, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(239, 68, 68, 0.2);

      .error-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #ef4444;
        }

        h3 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #dc2626;
        }
      }

      .error-content {
        p {
          margin: 0;
          font-size: 0.875rem;
          color: #dc2626;
          line-height: 1.4;
        }
      }
    }

    // Additional Details
    .additional-details {
      .glass-panel {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);

        .mat-expansion-panel-header {
          padding: 0.75rem 1rem;
          background: transparent;
          border-radius: 12px;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: var(--primary-green, #22FF99);
            margin-right: 0.5rem;
          }
        }

        .panel-content {
          padding: 0 1rem 1rem 1rem;

          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);

            &:last-child {
              border-bottom: none;
            }

            .label {
              font-size: 0.75rem;
              font-weight: 500;
              color: var(--text-secondary);
              min-width: 80px;
            }

            .value {
              font-size: 0.75rem;
              color: var(--text-primary);
              text-align: right;
              flex: 1;
              margin-left: 1rem;

              &.code {
                font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                background: rgba(0, 0, 0, 0.05);
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                word-break: break-all;
              }
            }
          }

          .payload-json {
            background: rgba(0, 0, 0, 0.05);
            padding: 0.75rem;
            border-radius: 8px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            font-size: 0.75rem;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-word;
            color: var(--text-primary);
            margin-top: 0.5rem;
          }
        }
      }
    }

    // Dialog Actions - Responsive
    .dialog-actions {
      padding: 1rem 1.5rem 1.5rem 1.5rem;
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
      min-height: 70px;
      align-items: center;

      .close-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: var(--text-secondary);
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          color: var(--text-primary);
        }

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          margin-right: 0.25rem;
        }
      }

      .action-btn {
        background: linear-gradient(135deg, var(--primary-green, #22FF99), var(--primary-blue, #3B82F6));
        border: none;
        color: white;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(34, 255, 153, 0.3);
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(34, 255, 153, 0.4);
        }

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          margin-right: 0.25rem;
        }
      }
    }

    // Dark Theme Support
    :host-context(body.dark-theme) {
      .action-details-dialog {
        background: var(--glass-bg, rgba(30, 30, 30, 0.7));
        border-color: var(--glass-border, rgba(100, 116, 139, 0.3));
        box-shadow: 
          0 8px 32px rgba(0, 0, 0, 0.3),
          inset 0 1px 1px rgba(100, 116, 139, 0.1);
      }

      .dialog-header {
        background: linear-gradient(135deg, rgba(34, 255, 153, 0.1), rgba(59, 130, 246, 0.1));
        border-bottom-color: rgba(100, 116, 139, 0.2);
      }

      .detail-item {
        background: rgba(100, 116, 139, 0.1);
        border-color: rgba(100, 116, 139, 0.2);

        &:hover {
          background: rgba(34, 255, 153, 0.1);
          border-color: rgba(34, 255, 153, 0.3);
        }
      }

      .metrics-section {
        background: rgba(34, 255, 153, 0.05);
        border-color: rgba(34, 255, 153, 0.2);
      }

      .error-section {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.3);
      }

      .additional-details .glass-panel {
        background: rgba(100, 116, 139, 0.1);
        border-color: rgba(100, 116, 139, 0.2);
      }

      .dialog-actions {
        background: rgba(100, 116, 139, 0.05);
        border-top-color: rgba(100, 116, 139, 0.2);
      }
    }

    // Responsive Design - Enhanced
    @media (max-width: 1200px) {
      .action-details-dialog {
        max-width: 95vw;
        max-height: 95vh;
      }

      .details-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .action-details-dialog {
        max-width: 98vw;
        max-height: 98vh;
        border-radius: 16px;
        margin: 0.5rem;
      }

      .dialog-header {
        padding: 1rem;
        gap: 0.75rem;
        min-height: 70px;

        .action-icon-wrapper {
          width: 44px;
          height: 44px;

          .action-icon {
            font-size: 22px;
            width: 22px;
            height: 22px;
          }
        }

        .header-content {
          .dialog-title {
            font-size: 1.125rem;
            white-space: normal;
            line-height: 1.2;
          }

          .dialog-subtitle {
            font-size: 0.8rem;
          }
        }

        .close-header-btn {
          width: 36px;
          height: 36px;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }

      .dialog-content {
        padding: 1rem;
      }

      .details-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .dialog-actions {
        padding: 1rem;
        flex-direction: row;
        gap: 0.5rem;

        .close-btn, .action-btn {
          flex: 1;
          justify-content: center;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
        }
      }
    }

    @media (max-width: 480px) {
      .action-details-dialog {
        max-width: 100vw;
        max-height: 100vh;
        border-radius: 0;
        margin: 0;
        min-width: 100vw;
      }

      .dialog-header {
        padding: 0.75rem;
        gap: 0.5rem;
        min-height: 60px;

        .action-icon-wrapper {
          width: 40px;
          height: 40px;

          .action-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }

        .header-content {
          .dialog-title {
            font-size: 1rem;
          }

          .dialog-subtitle {
            font-size: 0.75rem;
          }
        }

        .close-header-btn {
          width: 32px;
          height: 32px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }

      .dialog-content {
        padding: 0.75rem;
      }

      .detail-item {
        padding: 0.5rem;
        gap: 0.5rem;

        .detail-icon {
          width: 28px;
          height: 28px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }

        .detail-content {
          .detail-label {
            font-size: 0.7rem;
          }

          .detail-value {
            font-size: 0.8rem;
          }

          .detail-time, .detail-location {
            font-size: 0.7rem;
          }
        }
      }

      .metrics-section, .error-section {
        padding: 0.75rem;
        margin-bottom: 1rem;

        .metrics-header, .error-header {
          margin-bottom: 0.5rem;

          h3 {
            font-size: 0.8rem;
          }
        }
      }

      .dialog-actions {
        padding: 0.75rem;
        flex-direction: column;
        gap: 0.5rem;
        min-height: 80px;

        .close-btn, .action-btn {
          width: 100%;
          justify-content: center;
          padding: 0.75rem;
          font-size: 0.9rem;
        }
      }
    }

    // Landscape orientation for mobile
    @media (max-width: 768px) and (orientation: landscape) {
      .action-details-dialog {
        max-height: 100vh;
      }

      .dialog-header {
        min-height: 50px;
        padding: 0.5rem 1rem;
      }

      .dialog-content {
        padding: 0.75rem 1rem;
      }

      .dialog-actions {
        min-height: 60px;
        padding: 0.5rem 1rem;
      }
    }

    // RTL Support
    :host-context([dir="rtl"]) {
      .dialog-header {
        flex-direction: row-reverse;
      }

      .detail-item {
        flex-direction: row-reverse;
      }

      .detail-content {
        text-align: right;
      }

      .dialog-actions {
        flex-direction: row-reverse;
      }
    }
  `]
})
export class ActionDetailsDialogComponent implements OnInit, OnDestroy {
  public languageService = inject(LanguageService);
  
  // Signals for reactive state
  isLoading = signal(false);
  isStatusActive = signal(false);

  constructor(
    public dialogRef: MatDialogRef<ActionDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit(): void {
    // Start status pulse animation for active statuses
    if (this.data.action.status === 'ack' || this.data.action.status === 'sent') {
      this.isStatusActive.set(true);
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  onClose(): void {
    this.dialogRef.close();
  }

  viewLogs(): void {
    // Placeholder for view logs functionality
    this.dialogRef.close();
  }

  // Action Icon Methods
  getActionIcon(): string {
    const actionName = this.data.action.action_uri.toLowerCase();
    if (actionName.includes('irrigation') || actionName.includes('water')) return 'water_drop';
    if (actionName.includes('ventilator') || actionName.includes('fan')) return 'air';
    if (actionName.includes('light')) return 'lightbulb';
    if (actionName.includes('heater')) return 'local_fire_department';
    if (actionName.includes('roof')) return 'open_in_full';
    if (actionName.includes('humidifier')) return 'humidity_percentage';
    if (actionName.includes('pump')) return 'water_pump';
    return 'settings';
  }

  getActionIconClass(): string {
    if (this.data.action.status === 'error') return 'error-icon';
    if (this.data.action.trigger_source === 'manual') return 'manual-icon';
    return 'auto-icon';
  }

  getActionTitle(): string {
    const actionName = this.getActionName();
    const deviceName = this.getDeviceName();
    
    if (this.data.action.trigger_source === 'manual') {
      return this.languageService.t()('actions.manualActionTitle', {
        action: this.getActionNameTranslation(actionName),
        device: deviceName
      });
    } else {
      return this.languageService.t()('actions.automaticActionTitle', {
        action: this.getActionNameTranslation(actionName),
        device: deviceName
      });
    }
  }

  getActionDescription(): string {
    if (this.data.action.status === 'error') {
      return this.languageService.t()('actions.actionFailedDescription', { 
        error: this.data.action.error_message || this.languageService.t()('actions.checkDeviceConnection') 
      });
    }

    if (this.data.action.trigger_source === 'manual') {
      const time = new Date(this.data.action.created_at).toLocaleTimeString();
      return this.languageService.t()('actions.manualActionDescription', { time: time });
    } else {
      const sensorInfo = this.data.action.sensor_type && this.data.action.value
        ? this.languageService.t()('actions.automaticActionDescription', {
            sensor: this.getSensorTypeTranslation(this.data.action.sensor_type),
            value: this.data.action.value,
            unit: this.getUnitTranslation(this.data.action.unit || '')
          })
        : this.languageService.t()('actions.automaticActionDescriptionSimple');
      return sensorInfo;
    }
  }

  // Status Methods
  getStatusIcon(): string {
    const icons: { [key: string]: string } = {
      queued: 'schedule',
      sent: 'send',
      ack: 'check_circle',
      error: 'error'
    };
    return icons[this.data.action.status] || 'help_outline';
  }

  getStatusText(): string {
    switch (this.data.action.status) {
      case 'sent': return this.languageService.t()('actions.statusSent');
      case 'ack': return this.languageService.t()('actions.statusConfirmed');
      case 'error': return this.languageService.t()('actions.statusFailed');
      case 'queued': return this.languageService.t()('actions.statusWaiting');
      default: return this.data.action.status;
    }
  }

  getStatusChipClass(): string {
    switch (this.data.action.status) {
      case 'sent':
      case 'ack': return 'success-chip';
      case 'error': return 'error-chip';
      case 'queued': return 'pending-chip';
      default: return '';
    }
  }

  // Source Methods
  getSourceText(): string {
    switch (this.data.action.trigger_source) {
      case 'auto': return this.languageService.t()('actions.automatic');
      case 'manual': return this.languageService.t()('actions.manual');
      default: return this.data.action.trigger_source;
    }
  }

  getSourceChipClass(): string {
    return this.data.action.trigger_source === 'auto' ? 'auto-chip' : 'manual-chip';
  }

  // Device Methods
  getDeviceName(): string {
    const device = this.data.devices.find(d => d.device_id === this.data.action.device_id);
    return device ? device.name : this.data.action.device_id;
  }

  getDeviceLocation(): string {
    const device = this.data.devices.find(d => d.device_id === this.data.action.device_id);
    return device ? device.location : this.languageService.t()('common.unknown');
  }

  getFarmName(): string {
    const device = this.data.devices.find(d => d.device_id === this.data.action.device_id);
    if (!device) return this.languageService.t()('common.unknown');
    
    const farm = this.data.farms.find(f => f.farm_id === device.farm_id);
    return farm ? farm.name : this.languageService.t()('common.unknown');
  }

  // Action Methods
  getActionName(): string {
    const parts = this.data.action.action_uri.split('/');
    return parts[parts.length - 1].replace(/_/g, ' ').replace(/mqtt:/, '');
  }

  getActionNameTranslation(actionName: string): string {
    const actionMap: { [key: string]: string } = {
      'irrigation': this.languageService.t()('actions.actionTypes.irrigation'),
      'fertilization': this.languageService.t()('actions.actionTypes.fertilization'),
      'pest control': this.languageService.t()('actions.actionTypes.pestControl'),
      'harvesting': this.languageService.t()('actions.actionTypes.harvesting'),
      'planting': this.languageService.t()('actions.actionTypes.planting'),
      'pruning': this.languageService.t()('actions.actionTypes.pruning'),
      'monitoring': this.languageService.t()('actions.actionTypes.monitoring'),
      'alert': this.languageService.t()('actions.actionTypes.alert'),
      'watering': this.languageService.t()('actions.actionTypes.watering'),
      'ventilation': this.languageService.t()('actions.actionTypes.ventilation'),
      'heating': this.languageService.t()('actions.actionTypes.heating'),
      'lighting': this.languageService.t()('actions.actionTypes.lighting'),
      'open roof': this.languageService.t()('actions.actionTypes.openRoof'),
      'close roof': this.languageService.t()('actions.actionTypes.closeRoof'),
      'open window': this.languageService.t()('actions.actionTypes.openWindow'),
      'close window': this.languageService.t()('actions.actionTypes.closeWindow'),
      'start pump': this.languageService.t()('actions.actionTypes.startPump'),
      'stop pump': this.languageService.t()('actions.actionTypes.stopPump'),
      'turn on fan': this.languageService.t()('actions.actionTypes.turnOnFan'),
      'turn off fan': this.languageService.t()('actions.actionTypes.turnOffFan'),
      'turn on heater': this.languageService.t()('actions.actionTypes.turnOnHeater'),
      'turn off heater': this.languageService.t()('actions.actionTypes.turnOffHeater'),
      'turn on light': this.languageService.t()('actions.actionTypes.turnOnLight'),
      'turn off light': this.languageService.t()('actions.actionTypes.turnOffLight'),
      'humidifier on': this.languageService.t()('actions.actionTypes.humidifierOn'),
      'humidifier off': this.languageService.t()('actions.actionTypes.humidifierOff'),
      'ventilator on': this.languageService.t()('actions.actionTypes.ventilatorOn'),
      'ventilator off': this.languageService.t()('actions.actionTypes.ventilatorOff'),
      'water pump on': this.languageService.t()('actions.actionTypes.waterPumpOn'),
      'water pump off': this.languageService.t()('actions.actionTypes.waterPumpOff'),
      'light on': this.languageService.t()('actions.actionTypes.lightOn'),
      'light off': this.languageService.t()('actions.actionTypes.lightOff')
    };

    return actionMap[actionName.toLowerCase()] || actionName;
  }

  // Sensor Methods
  getSensorIcon(): string {
    const sensorType = this.data.action.sensor_type?.toLowerCase();
    if (sensorType?.includes('temperature')) return 'thermostat';
    if (sensorType?.includes('humidity')) return 'water_drop';
    if (sensorType?.includes('soil')) return 'grass';
    if (sensorType?.includes('light')) return 'lightbulb';
    if (sensorType?.includes('ph')) return 'science';
    if (sensorType?.includes('pressure')) return 'speed';
    if (sensorType?.includes('wind')) return 'air';
    if (sensorType?.includes('rain')) return 'grain';
    if (sensorType?.includes('co2')) return 'eco';
    return 'sensors';
  }

  getSensorTypeTranslation(sensorType?: string): string {
    if (!sensorType) return '';
    
    const sensorTypeMap: { [key: string]: string } = {
      'temperature': this.languageService.t()('sensors.sensorTypes.temperature'),
      'humidity': this.languageService.t()('sensors.sensorTypes.humidity'),
      'soil_moisture': this.languageService.t()('sensors.sensorTypes.soilMoisture'),
      'soil': this.languageService.t()('sensors.sensorTypes.soil'),
      'light': this.languageService.t()('sensors.sensorTypes.light'),
      'ph': this.languageService.t()('sensors.sensorTypes.ph'),
      'nutrients': this.languageService.t()('sensors.sensorTypes.nutrients'),
      'pressure': this.languageService.t()('sensors.sensorTypes.pressure'),
      'wind': this.languageService.t()('sensors.sensorTypes.wind'),
      'rain': this.languageService.t()('sensors.sensorTypes.rain'),
      'co2': this.languageService.t()('sensors.sensorTypes.co2')
    };
    return sensorTypeMap[sensorType.toLowerCase()] || sensorType;
  }

  getUnitTranslation(unit?: string): string {
    if (!unit) return '';
    
    const unitMap: { [key: string]: string } = {
      'celsius': this.languageService.t()('sensors.units.celsius'),
      'fahrenheit': this.languageService.t()('sensors.units.fahrenheit'),
      'percent': this.languageService.t()('sensors.units.percent'),
      'lux': this.languageService.t()('sensors.units.lux'),
      'ph': this.languageService.t()('sensors.units.ph'),
      'bar': this.languageService.t()('sensors.units.bar'),
      'kmh': this.languageService.t()('sensors.units.kmh'),
      'mm': this.languageService.t()('sensors.units.mm'),
      'ppm': this.languageService.t()('sensors.units.ppm')
    };
    return unitMap[unit.toLowerCase()] || unit;
  }

  // Utility Methods
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return this.languageService.t()('actions.justNow');
    if (diffMins < 60) return this.languageService.t()('actions.minutesAgo', { count: diffMins });
    if (diffHours < 24) return this.languageService.t()('actions.hoursAgo', { count: diffHours });
    if (diffDays < 7) return this.languageService.t()('actions.daysAgo', { count: diffDays });
    return this.languageService.t()('actions.weeksAgo');
  }

  isRecentAction(): boolean {
    const now = new Date();
    const actionDate = new Date(this.data.action.created_at);
    const diffMins = (now.getTime() - actionDate.getTime()) / 60000;
    return diffMins < 5; // Recent if within 5 minutes
  }

  hasMetrics(): boolean {
    return !!(this.data.action.sensor_type || this.data.action.value);
  }

  hasAdditionalDetails(): boolean {
    return !!(this.data.action.action_uri || this.data.action.topic || this.data.action.payload);
  }

  formatPayload(): string {
    if (!this.data.action.payload) return '';
    return JSON.stringify(this.data.action.payload, null, 2);
  }
}
