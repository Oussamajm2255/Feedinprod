import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../../../core/services/language.service';
import { Device, Sensor, SensorReading } from '../../../../../core/models/farm.model';

export interface ActionConfirmationData {
  actionType: 'turnOn' | 'turnOff' | 'disableAutomation' | 'enableAutomation' | 'safeMode';
  device?: Device;
  sensor?: Sensor;
  sensorReading?: SensorReading;
  deviceZone?: string;
  thresholdMin?: number;
  thresholdMax?: number;
  targetValue?: number;
  lastUpdateTime?: Date;
  context?: 'info' | 'warning' | 'success' | 'error';
}

@Component({
  selector: 'app-action-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirmation-dialog">
      <!-- Dialog Header with Icon -->
      <div class="dialog-header" [class]="dialogContext()">
        <div class="header-icon">
          <mat-icon>{{ getContextIcon() }}</mat-icon>
        </div>
        <h2 mat-dialog-title>{{ getTitle() }}</h2>
      </div>

      <!-- Dialog Content -->
      <mat-dialog-content class="dialog-content">
        <div class="confirmation-message">
          <p class="main-message">{{ getMainMessage() }}</p>
        </div>

        <!-- Device & Sensor Details -->
        <div class="details-section" *ngIf="data.device">
          <div class="detail-group">
            <div class="detail-item">
              <mat-icon class="detail-icon">devices</mat-icon>
              <div class="detail-content">
                <span class="detail-label">{{ languageService.t()('alerts.deviceName') }}</span>
                <span class="detail-value">{{ data.device.name || languageService.t()('alerts.unknown') }}</span>
              </div>
            </div>

            <div class="detail-item" *ngIf="data.deviceZone || data.device.location">
              <mat-icon class="detail-icon">location_on</mat-icon>
              <div class="detail-content">
                <span class="detail-label">{{ languageService.t()('alerts.zone') }}</span>
                <span class="detail-value">{{ data.deviceZone || data.device.location }}</span>
              </div>
            </div>
          </div>

          <!-- Sensor Information -->
          <div class="detail-group" *ngIf="data.sensor">
            <div class="detail-item">
              <mat-icon class="detail-icon">sensors</mat-icon>
              <div class="detail-content">
                <span class="detail-label">{{ languageService.t()('alerts.sensorType') }}</span>
                <span class="detail-value">{{ getSensorTypeName() }}</span>
              </div>
            </div>

            <!-- Current Value -->
            <div class="detail-item" *ngIf="data.sensorReading && (data.sensorReading.value1 !== undefined || data.sensorReading.value2 !== undefined)">
              <mat-icon class="detail-icon">analytics</mat-icon>
              <div class="detail-content">
                <span class="detail-label">{{ languageService.t()('alerts.measuredValue') }}</span>
                <span class="detail-value highlight">
                  {{ data.sensorReading.value1 ?? data.sensorReading.value2 }} {{ getSensorUnit() }}
                </span>
              </div>
            </div>

            <!-- No Reading Available -->
            <div class="detail-item" *ngIf="!data.sensorReading || (data.sensorReading.value1 === undefined && data.sensorReading.value2 === undefined)">
              <mat-icon class="detail-icon">analytics</mat-icon>
              <div class="detail-content">
                <span class="detail-label">{{ languageService.t()('alerts.measuredValue') }}</span>
                <span class="detail-value no-data">
                  {{ languageService.t()('alerts.noRecentReading') }}
                </span>
              </div>
            </div>

            <!-- Threshold Range -->
            <div class="detail-item" *ngIf="data.thresholdMin !== undefined || data.thresholdMax !== undefined">
              <mat-icon class="detail-icon">straighten</mat-icon>
              <div class="detail-content">
                <span class="detail-label">{{ languageService.t()('alerts.thresholdRange') }}</span>
                <span class="detail-value">
                  {{ data.thresholdMin ?? '—' }} - {{ data.thresholdMax ?? '—' }} {{ getSensorUnit() }}
                </span>
              </div>
            </div>

            <!-- Target Value -->
            <div class="detail-item" *ngIf="data.targetValue !== undefined">
              <mat-icon class="detail-icon">adjust</mat-icon>
              <div class="detail-content">
                <span class="detail-label">{{ languageService.t()('alerts.targetValue') }}</span>
                <span class="detail-value">{{ data.targetValue }} {{ getSensorUnit() }}</span>
              </div>
            </div>
          </div>

          <!-- No Sensor Data Available -->
          <div class="detail-group no-sensor-data" *ngIf="!data.sensor">
            <div class="detail-item">
              <mat-icon class="detail-icon warning-icon">info</mat-icon>
              <div class="detail-content">
                <span class="detail-value no-data">
                  {{ languageService.t()('alerts.noSensorData') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Last Update -->
          <div class="detail-group">
            <div class="detail-item">
              <mat-icon class="detail-icon">schedule</mat-icon>
              <div class="detail-content">
                <span class="detail-label">{{ languageService.t()('alerts.lastUpdate') }}</span>
                <span class="detail-value">
                  {{ data.lastUpdateTime ? (data.lastUpdateTime | date:'medium') : languageService.t()('alerts.notAvailable') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Type Badge -->
        <div class="action-badge" [class]="getActionBadgeClass()">
          <mat-icon>{{ getActionIcon() }}</mat-icon>
          <span>{{ getActionText() }}</span>
        </div>
      </mat-dialog-content>

      <!-- Dialog Actions -->
      <mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-button">
          <mat-icon>close</mat-icon>
          {{ languageService.t()('common.cancel') }}
        </button>
        <button mat-raised-button (click)="onConfirm()" class="confirm-button" [class]="dialogContext()">
          <mat-icon>{{ getConfirmIcon() }}</mat-icon>
          {{ languageService.t()('common.confirm') }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      max-width: 600px;
      min-width: 400px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 16px 16px 0 0;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.1;
        z-index: 0;
      }

      &.info::before {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
      }

      &.warning::before {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      &.success::before {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      &.error::before {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }

      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        z-index: 1;
      }
    }

    .header-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }
    }

    .dialog-header.info .header-icon {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .dialog-header.warning .header-icon {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .dialog-header.success .header-icon {
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .dialog-header.error .header-icon {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .dialog-content {
      padding: 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
    }

    .confirmation-message {
      margin-bottom: 1.5rem;
      
      .main-message {
        font-size: 1.1rem;
        line-height: 1.6;
        color: var(--text-primary);
        margin: 0;
      }
    }

    .details-section {
      background: var(--glass-bg, rgba(255, 255, 255, 0.5));
      backdrop-filter: blur(8px);
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.3));
      margin-bottom: 1.5rem;
    }

    .detail-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      &:not(:last-child) {
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
      }

      &.no-sensor-data {
        text-align: center;
        padding: 1rem;
        background: rgba(245, 158, 11, 0.05);
        border-radius: 8px;
        border: 1px dashed var(--warning-color, #f59e0b);

        .detail-item {
          justify-content: center;
        }
      }
    }

    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;

      .detail-icon {
        color: var(--primary-green);
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-top: 2px;

        &.warning-icon {
          color: var(--warning-color, #f59e0b);
        }
      }

      .detail-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .detail-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .detail-value {
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-primary);

        &.highlight {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary-green);
        }

        &.no-data {
          color: var(--text-secondary);
          font-style: italic;
          opacity: 0.8;
        }
      }
    }

    .action-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 24px;
      font-size: 0.9rem;
      font-weight: 600;
      margin-top: 1rem;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &.turn-on {
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        color: #065f46;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      }

      &.turn-off {
        background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        color: #374151;
        box-shadow: 0 4px 12px rgba(107, 114, 128, 0.2);
      }

      &.automation {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        color: #92400e;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
      }
    }

    .dialog-actions {
      padding: 1rem 1.5rem 1.5rem;
      gap: 0.75rem;
      justify-content: flex-end;

      button {
        min-width: 120px;
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-right: 0.5rem;
        }
      }

      .cancel-button {
        border: 1px solid var(--border-color);
        color: var(--text-secondary);

        &:hover {
          background: rgba(0, 0, 0, 0.05);
          border-color: var(--text-secondary);
        }
      }

      .confirm-button {
        color: white;

        &.info {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

          &:hover {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
          }
        }

        &.warning {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);

          &:hover {
            background: linear-gradient(135deg, #d97706, #b45309);
            box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
          }
        }

        &.success {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

          &:hover {
            background: linear-gradient(135deg, #059669, #047857);
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
          }
        }

        &.error {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

          &:hover {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
          }
        }
      }
    }

    /* Dark Theme Support */
    :host-context(body.dark-theme) {
      .details-section {
        background: var(--glass-bg, rgba(30, 41, 59, 0.5));
        border-color: var(--glass-border, rgba(100, 116, 139, 0.3));
      }

      .action-badge.turn-on {
        background: linear-gradient(135deg, #064e3b, #065f46);
        color: #6ee7b7;
      }

      .action-badge.turn-off {
        background: linear-gradient(135deg, #374151, #4b5563);
        color: #e5e7eb;
      }

      .action-badge.automation {
        background: linear-gradient(135deg, #78350f, #92400e);
        color: #fde68a;
      }
    }

    /* Responsive Design */
    @media (max-width: 600px) {
      .confirmation-dialog {
        min-width: 100%;
      }

      .dialog-header h2 {
        font-size: 1.25rem;
      }

      .header-icon {
        width: 48px;
        height: 48px;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .confirmation-message .main-message {
        font-size: 1rem;
      }

      .dialog-actions button {
        min-width: 100px;
        padding: 0.5rem 1rem;
      }
    }
  `]
})
export class ActionConfirmationDialogComponent {
  dialogContext = signal<'info' | 'warning' | 'success' | 'error'>('info');

  constructor(
    public dialogRef: MatDialogRef<ActionConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ActionConfirmationData,
    public languageService: LanguageService
  ) {
    this.dialogContext.set(data.context || 'info');
  }

  getTitle(): string {
    switch (this.data.actionType) {
      case 'turnOn':
        return this.languageService.translate('alerts.confirmTurnOn');
      case 'turnOff':
        return this.languageService.translate('alerts.confirmTurnOff');
      case 'disableAutomation':
        return this.languageService.translate('alerts.confirmDisableAutomation');
      case 'enableAutomation':
        return this.languageService.translate('alerts.confirmEnableAutomation');
      case 'safeMode':
        return this.languageService.translate('alerts.confirmSafeMode');
      default:
        return this.languageService.translate('alerts.confirmAction');
    }
  }

  getMainMessage(): string {
    const deviceName = this.data.device?.name || this.languageService.translate('alerts.device');
    
    switch (this.data.actionType) {
      case 'turnOn':
        return this.languageService.translate('alerts.turnOnMessage').replace('{{device}}', deviceName);
      case 'turnOff':
        return this.languageService.translate('alerts.turnOffMessage').replace('{{device}}', deviceName);
      case 'disableAutomation':
        return this.languageService.translate('alerts.disableAutomationMessage');
      case 'enableAutomation':
        return this.languageService.translate('alerts.enableAutomationMessage');
      case 'safeMode':
        return this.languageService.translate('alerts.safeModeMessage');
      default:
        return this.languageService.translate('alerts.genericActionMessage');
    }
  }

  getContextIcon(): string {
    const ctx = this.dialogContext();
    switch (ctx) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'success': return 'check_circle';
      case 'error': return 'error';
      default: return 'help';
    }
  }

  getActionIcon(): string {
    switch (this.data.actionType) {
      case 'turnOn': return 'power';
      case 'turnOff': return 'power_off';
      case 'disableAutomation': return 'pause_circle';
      case 'enableAutomation': return 'play_circle';
      case 'safeMode': return 'security';
      default: return 'settings';
    }
  }

  getActionText(): string {
    return this.languageService.translate('alerts.actionToPerform');
  }

  getActionBadgeClass(): string {
    switch (this.data.actionType) {
      case 'turnOn': return 'turn-on';
      case 'turnOff': return 'turn-off';
      case 'disableAutomation':
      case 'enableAutomation':
      case 'safeMode':
        return 'automation';
      default: return 'turn-on';
    }
  }

  getSensorTypeName(): string {
    if (!this.data.sensor) return '—';
    
    const type = this.data.sensor.type?.toLowerCase() || '';
    
    if (type.includes('temperature')) return this.languageService.translate('sensors.temperature');
    if (type.includes('humidity')) return this.languageService.translate('sensors.humidity');
    if (type.includes('soil')) return this.languageService.translate('sensors.soilMoisture');
    if (type.includes('light')) return this.languageService.translate('sensors.lightLevel');
    if (type.includes('ph')) return this.languageService.translate('sensors.phLevel');
    
    return this.data.sensor.type || '—';
  }

  getSensorUnit(): string {
    if (!this.data.sensor) return '';
    
    const type = this.data.sensor.type?.toLowerCase() || '';
    
    if (type.includes('temperature')) return '°C';
    if (type.includes('humidity')) return '%';
    if (type.includes('soil')) return '%';
    if (type.includes('light')) return 'lux';
    if (type.includes('ph')) return 'pH';
    
    return this.data.sensor.unit || '';
  }

  getConfirmIcon(): string {
    switch (this.data.actionType) {
      case 'turnOn': return 'power_settings_new';
      case 'turnOff': return 'power_settings_new';
      default: return 'check';
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
