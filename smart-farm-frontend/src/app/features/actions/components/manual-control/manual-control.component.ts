import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AlertService } from '../../../../core/services/alert.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { ApiService } from '../../../../core/services/api.service';
import { FarmManagementService } from '../../../../core/services/farm-management.service';
import { Device, Farm, DeviceStatus, Sensor, SensorReading } from '../../../../core/models/farm.model';
import { LanguageService } from '../../../../core/services/language.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { ActionConfirmationDialogComponent, ActionConfirmationData } from './action-confirmation-dialog/action-confirmation-dialog.component';

interface DeviceControl {
  device: Device;
  isOn: boolean;
  automationRules?: string[];
  thresholds?: { [key: string]: number };
  sensor?: Sensor;
  sensorReading?: SensorReading;
}

interface ControlKPIs {
  devicesControlled: number;
  safeMode: boolean;
}

@Component({
  selector: 'app-manual-control',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
  ],
  animations: [
    // Automation status fade transition
    trigger('automationFade', [
      transition('* => *', [
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ]),
    // Automation pulse animation
    trigger('automationPulse', [
      state('active', style({ 
        transform: 'scale(1)',
        boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
      })),
      state('inactive', style({ 
        transform: 'scale(1)',
        boxShadow: '0 0 0px rgba(16, 185, 129, 0)'
      })),
      transition('inactive => active', [
        animate('1000ms ease-in-out', style({ 
          transform: 'scale(1.05)',
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)'
        })),
        animate('1000ms ease-in-out', style({ 
          transform: 'scale(1)',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
        }))
      ]),
      transition('active => inactive', animate('300ms ease-in-out'))
    ]),
    // Tile hover animation
    trigger('tileHover', [
      state('default', style({ transform: 'scale(1)' })),
      state('hover', style({ transform: 'scale(1.05)' })),
      transition('default <=> hover', animate('200ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),
    // Glow animation for active devices
    trigger('deviceGlow', [
      state('inactive', style({ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' })),
      state('active', style({ boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)' })),
      transition('inactive <=> active', animate('300ms ease-in-out'))
    ]),
    // Stagger animation for tiles
    trigger('tileStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    // Log item animation
    trigger('logItem', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    // Slide in animation for automation banner
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="manual-control-container">
      <!-- 1️⃣ Automation Status Header (always visible) -->
      <div class="automation-status-header" [@slideIn]>
        <div class="automation-banner glass-card" [@automationPulse]="automationEnabled() ? 'active' : 'inactive'">
          <div class="automation-content">
            <div class="automation-info">
              <div class="automation-icon">
                <mat-icon>{{ automationEnabled() ? 'smart_toy' : 'pause_circle' }}</mat-icon>
              </div>
              <div class="automation-text">
                <h3>{{ languageService.t()('manualControl.automationStatus') }}: {{ automationEnabled() ? languageService.t()('manualControl.on') : languageService.t()('manualControl.off') }}</h3>
                <p>{{ automationEnabled() ? languageService.t()('manualControl.automationOnSubtext') : languageService.t()('manualControl.automationOffSubtext') }}</p>
              </div>
            </div>
            <div class="automation-toggle">
              <mat-slide-toggle
                [checked]="automationEnabled()"
                [disabled]="isLoading()"
                (change)="toggleAutomation($event.checked)"
                class="automation-switch">
                <span class="toggle-label">
                  {{ automationEnabled() ? languageService.t()('manualControl.enabled') : languageService.t()('manualControl.disabled') }}
                </span>
              </mat-slide-toggle>
            </div>
          </div>
        </div>
      </div>

      <!-- 2️⃣ Conditional Sections -->
      <div class="conditional-content" [@automationFade]>
        <!-- When Automation = ON -->
        <div class="automation-active-section" *ngIf="automationEnabled()">
          <div class="automation-info-card glass-card">
            <div class="automation-icon-large">
              <mat-icon>🌿⚙️</mat-icon>
            </div>
            <h2>{{ languageService.t()('manualControl.automationActive') }}</h2>
            <p>{{ languageService.t()('manualControl.automationActiveDescription') }}</p>
            
            <!-- Safe Mode Toggle (always visible) -->
            <div class="safe-mode-section">
              <mat-slide-toggle
                [checked]="safeModeEnabled()"
                [disabled]="isLoading()"
                (change)="toggleSafeMode($event.checked)"
                class="safe-mode-toggle">
                <span class="safe-mode-label">
                  <mat-icon>security</mat-icon>
                  {{ languageService.t()('manualControl.safeMode') }}: {{ safeModeEnabled() ? languageService.t()('manualControl.on') : languageService.t()('manualControl.off') }}
                </span>
              </mat-slide-toggle>
            </div>
          </div>
        </div>

        <!-- When Automation = OFF - Direct Action Panel -->
        <div class="manual-control-section" *ngIf="!automationEnabled()">
          <!-- Direct Action Panel Header -->
          <div class="action-panel-header">
            <h2>
              <mat-icon>touch_app</mat-icon>
              {{ languageService.t()('manualControl.directActionPanel') }}
              </h2>
            <p>{{ languageService.t()('manualControl.actionPanelDescription') }}</p>
            </div>

          <!-- Direct Action Buttons Grid -->
          <div class="action-buttons-grid" [@tileStagger] *ngIf="!isLoading(); else loadingState">
            <div class="action-button glass-card"
                   *ngFor="let control of filteredDeviceControls(); trackBy: trackByDeviceId; let i = index"
                   [@tileHover]
                   [@deviceGlow]="control.isOn ? 'active' : 'inactive'"
                   [style.animation-delay]="i * 100 + 'ms'"
                 [class.disabled]="safeModeEnabled()"
                 (click)="executeDeviceAction(control.device, !control.isOn)">

              <!-- Device Icon -->
              <div class="action-icon">
                <mat-icon>{{ getDeviceIcon(control.device) }}</mat-icon>
              </div>

              <!-- Device Info -->
              <div class="action-info">
                <!-- Device Name with Sensor Type/Value Title -->
                <div class="device-title-row">
                  <h3 class="device-name">{{ control.device.name }}</h3>
                  <div class="sensor-value-title">
                    <span class="sensor-type-label">{{ getConcernedValueType(control) }}</span>
                    <span class="sensor-value" *ngIf="getConcernedValue(control) !== null">
                      {{ getConcernedValue(control) }} {{ getConcernedValueUnit(control) }}
                    </span>
                    <span class="sensor-value no-data" *ngIf="getConcernedValue(control) === null">
                      {{ languageService.t()('alerts.noRecentReading') || 'No reading' }}
                    </span>
                  </div>
                </div>
                <p class="device-location">{{ control.device.location || languageService.t()('manualControl.noLocation') }}</p>
                <div class="device-details">
                  <div class="device-type">
                    <mat-icon>{{ getDeviceTypeIcon(control.device) }}</mat-icon>
                    <span>{{ getDeviceTypeName(control.device) }}</span>
                    </div>
                  <div class="device-specs" *ngIf="getDeviceSpecs(control.device)">
                    <span class="spec-item" *ngFor="let spec of getDeviceSpecs(control.device)">
                      {{ spec.label }}: {{ spec.value }}
                    </span>
                  </div>
                  </div>
                </div>

              <!-- Status Badge -->
              <div class="status-badge" [class]="getStatusBadgeClass(control)">
                <mat-icon>{{ getStatusIcon(control) }}</mat-icon>
                <span>{{ control.isOn ? languageService.t()('manualControl.on') : languageService.t()('manualControl.off') }}</span>
                </div>

              <!-- Action Button -->
              <div class="action-control">
                <button mat-raised-button 
                        [class]="control.isOn ? 'action-button-on' : 'action-button-off'"
                        [disabled]="isLoading() || safeModeEnabled()">
                  <mat-icon>{{ control.isOn ? 'power_off' : 'power' }}</mat-icon>
                  {{ control.isOn ? languageService.t()('manualControl.turnOff') : languageService.t()('manualControl.turnOn') }}
                </button>
              </div>

              <!-- Last Action Timestamp -->
              <div class="last-action-timestamp">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ getLastUpdatedText(control) }}</span>
                </div>
              </div>
            </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="filteredDeviceControls().length === 0 && !isLoading()">
            <mat-icon class="empty-icon">devices_other</mat-icon>
            <h3>{{ languageService.t()('manualControl.noDevices') }}</h3>
            <p>{{ languageService.t()('manualControl.noDevicesDescription') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <ng-template #loadingState>
      <div class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ languageService.t()('manualControl.loadingDevices') }}</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .manual-control-container {
      padding: 1.5rem 2rem;
      max-width: 1600px;
      margin: 0 auto;
      min-height: 100vh;
      background: transparent;
    }

    // 1️⃣ Automation Status Header
    .automation-status-header {
      margin-bottom: 2rem;
    }

    .automation-banner {
      padding: 1.5rem 2rem;
      background: var(--glass-bg, rgba(255, 255, 255, 0.7));
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 20px;
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.4));
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.6);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, transparent, var(--primary-green), transparent);
        opacity: 0.8;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(16, 185, 129, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.7);
        border-color: rgba(16, 185, 129, 0.3);
      }
    }

    .automation-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
    }

    .automation-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .automation-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      color: #065f46;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    .automation-text {
      flex: 1;

      h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
        line-height: 1.5;
      }
    }

    .automation-toggle {
      .automation-switch {
        transform: scale(1.1);

        .toggle-label {
          font-size: 1rem;
          font-weight: 600;
          margin-left: 0.75rem;
          color: var(--text-primary);
        }
      }
    }

    // 2️⃣ Conditional Content
    .conditional-content {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    // Automation Active Section
    .automation-active-section {
      display: flex;
      justify-content: center;
      padding: 3rem 2rem;
    }

    .automation-info-card {
      max-width: 600px;
      padding: 3rem;
      text-align: center;
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      border-radius: 24px;
      border: 1px solid var(--glass-border);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 32px rgba(16, 185, 129, 0.15);
        border-color: rgba(16, 185, 129, 0.3);
      }

      .automation-icon-large {
        font-size: 4rem;
        margin-bottom: 1.5rem;
        animation: automationPulse 2s ease-in-out infinite;
      }

      h2 {
        margin: 0 0 1rem 0;
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      p {
        margin: 0 0 2rem 0;
        font-size: 1rem;
        color: var(--text-secondary);
        line-height: 1.6;
      }
    }

    .safe-mode-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);

      .safe-mode-toggle {
        transform: scale(1.1);

        .safe-mode-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }
      }
    }

    @keyframes automationPulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.8;
      }
    }

    // Manual Control Section - Direct Action Panel
    .manual-control-section {
      // Direct Action Panel Header
      .action-panel-header {
      margin-bottom: 2rem;
        text-align: center;
      animation: fadeInDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);

        h2 {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin: 0 0 0.5rem 0;
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--text-primary);

          mat-icon {
            color: var(--primary-green);
            font-size: 2rem;
            width: 2rem;
            height: 2rem;
          }
        }

        p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 1.1rem;
          line-height: 1.5;
        }
      }

      // Action Buttons Grid
      .action-buttons-grid {
      display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
        margin-bottom: 2rem;
    }

      .action-button {
      padding: 1.5rem;
      background: var(--glass-bg, rgba(255, 255, 255, 0.7));
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
        border-radius: 20px;
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.4));
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.6);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1rem;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
          height: 3px;
        background: linear-gradient(90deg, transparent, var(--primary-green), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 16px 32px rgba(16, 185, 129, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.7);
        border-color: rgba(16, 185, 129, 0.3);

        &::before {
          opacity: 1;
          }

          .action-icon {
      transform: scale(1.1) rotate(5deg);
    }

          .action-control button {
            transform: scale(1.05);
        }
      }

      &.disabled {
        opacity: 0.6;
        pointer-events: none;
        background: rgba(0, 0, 0, 0.05);
        border-color: rgba(0, 0, 0, 0.1);

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
          pointer-events: none;
        }
        }
      }

      .action-icon {
        width: 64px;
        height: 64px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        color: #065f46;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }
      }

      .action-info {
        .device-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        h3.device-name {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
          min-width: 0;
        }

        .sensor-value-title {
          display: flex !important;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
          padding: 0.5rem 0.75rem;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1)) !important;
          border-radius: 12px;
          border: 2px solid rgba(16, 185, 129, 0.3) !important;
          min-width: fit-content;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
          visibility: visible !important;
          opacity: 1 !important;

          .sensor-type-label {
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--primary-green);
            opacity: 0.9;
            white-space: nowrap;
          }

          .sensor-value {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--primary-green);
            line-height: 1.2;
            white-space: nowrap;

            &.no-data {
              font-size: 0.75rem;
              font-weight: 500;
              color: var(--text-secondary);
              font-style: italic;
              opacity: 0.7;
            }
          }
        }

        .device-location {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .device-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .device-type {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--primary-green);

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }

        .device-specs {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          .spec-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.7rem;
            color: var(--text-secondary);
            padding: 0.125rem 0;

            &:not(:last-child) {
              border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            }

            &:last-child {
              font-weight: 600;
              color: var(--text-primary);
            }
          }
        }
      }

      .status-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
        transition: all 0.3s ease;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

          &.active {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          color: #065f46;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }

          &.inactive {
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            color: #6b7280;
          }

          &.safe-mode {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
      }

      .action-control {
        button {
          padding: 0.75rem 1.5rem;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          &.action-button-on {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);

            &:hover {
              background: linear-gradient(135deg, #059669, #047857);
              box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
            }
          }

          &.action-button-off {
            background: linear-gradient(135deg, #6b7280, #4b5563);
      color: white;
            box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);

            &:hover {
              background: linear-gradient(135deg, #4b5563, #374151);
              box-shadow: 0 6px 16px rgba(107, 114, 128, 0.5);
            }
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
          }
        }
      }

      .last-action-timestamp {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
          color: var(--text-secondary);

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
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

    // Dark Theme Support
    :host-context(body.dark-theme) {
      .automation-banner, .automation-info-card, .action-button, .log-item {
        background: var(--glass-bg, rgba(30, 41, 59, 0.7));
        border-color: var(--glass-border, rgba(100, 116, 139, 0.3));
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(100, 116, 139, 0.1);
      }

      .automation-banner:hover, .automation-info-card:hover, .action-button:hover, .log-item:hover {
        box-shadow: 0 16px 32px rgba(16, 185, 129, 0.2), inset 0 1px 1px rgba(100, 116, 139, 0.2);
      }

      .action-icon, .log-icon {
        background: linear-gradient(135deg, #1e293b, #334155);
        color: #94a3b8;
      }

      .status-badge {
        &.active {
          background: linear-gradient(135deg, #1e293b, #334155);
          color: #22c55e;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        &.inactive {
          background: linear-gradient(135deg, #374151, #4b5563);
          color: #9ca3af;
        }

        &.safe-mode {
          background: linear-gradient(135deg, #451a03, #78350f);
          color: #fbbf24;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
        }
      }

      .action-control button {
        &.action-button-on {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);

          &:hover {
            background: linear-gradient(135deg, #16a34a, #15803d);
            box-shadow: 0 6px 16px rgba(34, 197, 94, 0.5);
          }
        }

        &.action-button-off {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);

          &:hover {
            background: linear-gradient(135deg, #4b5563, #374151);
            box-shadow: 0 6px 16px rgba(107, 114, 128, 0.5);
          }
        }
      }
    }

    // RTL Support
    :host-context([dir="rtl"]) {
      .automation-content {
        flex-direction: row-reverse;
      }

      .automation-info {
        flex-direction: row-reverse;
      }

      .action-button {
        text-align: right;

        .action-icon {
          order: 2;
        }

        .action-info {
          order: 1;
        }

        .status-badge {
          order: 3;
        }

        .action-control {
          order: 4;
        }

        .last-action-timestamp {
          order: 5;
        }
      }

    }

    // Responsive Design
    @media (max-width: 1200px) {
      .action-buttons-grid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }

      .automation-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
    }

    @media (max-width: 768px) {
      .manual-control-container {
        padding: 1rem;
      }

      .automation-banner {
        padding: 1rem 1.5rem;
      }

      .automation-info {
        flex-direction: column;
        text-align: center;
        gap: 0.75rem;
      }

      .automation-icon {
        width: 48px;
        height: 48px;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .automation-text h3 {
        font-size: 1.1rem;
      }

      .automation-info-card {
        padding: 2rem 1.5rem;
        margin: 0 1rem;

        .automation-icon-large {
          font-size: 3rem;
        }

        h2 {
          font-size: 1.5rem;
        }
      }

      .action-panel-header {
        h2 {
          font-size: 1.5rem;

        mat-icon {
            font-size: 1.5rem;
            width: 1.5rem;
            height: 1.5rem;
          }
        }

        p {
          font-size: 1rem;
        }
      }

      .action-buttons-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .action-button {
        padding: 1rem;
        gap: 0.75rem;
      }

      .action-icon {
        width: 56px;
        height: 56px;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }

      .action-info {
        .device-title-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .sensor-value-title {
          width: 100%;
          align-items: flex-start;
        }

        h3.device-name {
          font-size: 1.1rem;
        }
      }

      .action-info .device-details {
        gap: 0.375rem;
      }

      .action-info .device-type {
        font-size: 0.7rem;
        padding: 0.2rem 0.4rem;
      }

      .action-info .device-specs .spec-item {
        font-size: 0.65rem;
      }

      .action-control button {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      }
    }

    @media (max-width: 480px) {
      .automation-banner {
        padding: 0.75rem 1rem;
      }

      .automation-text h3 {
        font-size: 1rem;
      }

      .automation-text p {
        font-size: 0.8rem;
      }

      .automation-info-card {
        padding: 1.5rem 1rem;

        .automation-icon-large {
          font-size: 2.5rem;
        }

        h2 {
          font-size: 1.25rem;
        }

        p {
          font-size: 0.9rem;
        }
      }

      .action-panel-header {
        h2 {
        font-size: 1.25rem;

          mat-icon {
            font-size: 1.25rem;
            width: 1.25rem;
            height: 1.25rem;
          }
        }

        p {
          font-size: 0.9rem;
        }
      }

      .action-button {
        padding: 0.75rem;
        gap: 0.5rem;
      }

      .action-icon {
        width: 48px;
        height: 48px;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .action-info {
        .device-title-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .sensor-value-title {
          width: 100%;
          align-items: flex-start;
          padding: 0.4rem 0.6rem;
        }

        .sensor-value-title .sensor-type-label {
          font-size: 0.65rem;
        }

        .sensor-value-title .sensor-value {
          font-size: 1rem;
        }

        h3.device-name {
          font-size: 1rem;
        }
      }

      .action-info .device-details {
        gap: 0.25rem;
      }

      .action-info .device-type {
        font-size: 0.65rem;
        padding: 0.15rem 0.3rem;
      }

      .action-info .device-specs .spec-item {
        font-size: 0.6rem;
      }

      .action-control button {
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
      }

    }
  `]
})
export class ManualControlComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private farmManagement = inject(FarmManagementService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  public languageService = inject(LanguageService);
  public themeService = inject(ThemeService);
  private refreshSubscription: Subscription | undefined;

  // Signals
  isLoading = signal(false);
  devices = signal<Device[]>([]);
  deviceControls = signal<DeviceControl[]>([]);
  selectedFilter = signal<'all' | 'zone' | 'type'>('all');
  
  // Automation signals
  automationEnabled = signal(true); // Default to ON for safety
  safeModeEnabled = signal(false);

  // Computed properties
  kpiStats = computed((): ControlKPIs => {
    const controls = this.deviceControls();

    return {
      devicesControlled: controls.length,
      safeMode: this.safeModeEnabled()
    };
  });

  filteredDeviceControls = computed(() => {
    const controls = this.deviceControls();
    const filter = this.selectedFilter();

    if (filter === 'all') return controls;

    // For now, return all controls since we don't have zone/type data
    // This would be enhanced based on actual device data structure
    return controls;
  });

  ngOnInit(): void {
    this.loadData();
    // Removed startRealTimeUpdates since we deleted the mini log section
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }


  async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const selectedFarm = this.farmManagement.getSelectedFarm();
      if (!selectedFarm) {
        console.log('⚠️ [MANUAL CONTROL] No farm selected, skipping data load');
        this.isLoading.set(false);
        return;
      }

      console.log('🏡 [MANUAL CONTROL] Loading data for farm:', selectedFarm.name);

      // Load devices for selected farm
      const devices = await this.apiService.getDevicesByFarm(selectedFarm.farm_id).toPromise();
      this.devices.set(devices || []);

      // Create device controls with sensor data
      const controls: DeviceControl[] = await Promise.all(
        (devices || []).map(async (device) => {
          let sensor: Sensor | undefined;
          let sensorReading: SensorReading | undefined;

          try {
            // Fetch device with sensors
            const deviceWithSensors = await this.apiService.getDevice(device.device_id, true).toPromise();
            if (deviceWithSensors?.sensors && deviceWithSensors.sensors.length > 0) {
              sensor = deviceWithSensors.sensors[0];
              // Fetch latest reading
              try {
                sensorReading = await this.apiService.getLatestReading(sensor.sensor_id).toPromise() || undefined;
              } catch (err) {
                console.warn(`Could not fetch reading for sensor ${sensor.sensor_id}:`, err);
              }
            }
          } catch (error) {
            console.warn(`Could not fetch sensor data for device ${device.device_id}:`, error);
          }

          return {
            device,
            isOn: false, // This would be determined by actual device state
            automationRules: this.getAutomationRules(device),
            thresholds: this.getDeviceThresholds(device),
            sensor,
            sensorReading
          };
        })
      );

      this.deviceControls.set(controls);

      // Load recent actions - REMOVED since we deleted the mini log section
    } catch (error) {
      console.error('Error loading data:', error);
      this.alertService.error(
        this.languageService.t()('common.error'),
        this.languageService.t()('manualControl.loadDataError'),
        5000
      );
    } finally {
      this.isLoading.set(false);
    }
  }


  async toggleAutomation(enabled: boolean): Promise<void> {
    if (!enabled) {
      // Show confirmation dialog when turning OFF automation
      const confirmed = await this.showAutomationConfirmation();
      if (!confirmed) {
        return; // User cancelled, don't toggle
      }
    }

    this.automationEnabled.set(enabled);
    
    // Show success message with glassmorphic snackbar
    const alertTexts = this.languageService.t()('alerts') as any;
    this.showSuccessSnackbar(
      alertTexts[enabled ? 'automationEnabled' : 'automationDisabled']
    );
  }

  async toggleSafeMode(enabled: boolean): Promise<void> {
    // Show confirmation dialog
    const confirmed = await this.showSafeModeConfirmation(enabled);
    if (!confirmed) {
      return;
    }

    this.safeModeEnabled.set(enabled);
    
    // Show success message with glassmorphic snackbar
    const alertTexts = this.languageService.t()('alerts') as any;
    this.showSuccessSnackbar(
      alertTexts[enabled ? 'safeModeEnabled' : 'safeModeDisabled']
    );
  }

  private showSuccessSnackbar(message: string): void {
    // Ensure message is never empty - provide fallback
    const safeMessage = message && message.trim() 
      ? message 
      : this.languageService.t()('common.operationSuccess');
    
    // Use AlertService with title and message
    this.alertService.success(
      this.languageService.t()('common.success'),
      safeMessage,
      4000
    );
  }

  private showErrorSnackbar(message: string): void {
    // Ensure message is never empty - provide fallback
    const safeMessage = message && message.trim() 
      ? message 
      : this.languageService.t()('common.operationError');
    
    // Use AlertService with title and message
    this.alertService.error(
      this.languageService.t()('common.error'),
      safeMessage,
      5000
    );
  }

  private async showAutomationConfirmation(): Promise<boolean> {
    const dialogRef = this.dialog.open(ActionConfirmationDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'glass-dialog',
      data: {
        actionType: 'disableAutomation',
        context: 'warning'
      } as ActionConfirmationData
    });

    return dialogRef.afterClosed().toPromise().then(result => result === true);
  }

  private async showSafeModeConfirmation(enabled: boolean): Promise<boolean> {
    const dialogRef = this.dialog.open(ActionConfirmationDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'glass-dialog',
      data: {
        actionType: 'safeMode',
        context: enabled ? 'warning' : 'info'
      } as ActionConfirmationData
    });

    return dialogRef.afterClosed().toPromise().then(result => result === true);
  }

  private async showActionConfirmation(device: Device, isOn: boolean): Promise<boolean> {
    // Try to get sensor data from existing controls first
    const controls = this.deviceControls();
    const existingControl = controls.find(c => c.device.device_id === device.device_id);
    
    let sensor = existingControl?.sensor || null;
    let sensorReading = existingControl?.sensorReading || null;
    
    // If not found in controls, fetch from API
    if (!sensor) {
      try {
        const deviceWithSensors = await this.apiService.getDevice(device.device_id, true).toPromise();
        if (deviceWithSensors?.sensors && deviceWithSensors.sensors.length > 0) {
          sensor = deviceWithSensors.sensors[0];
          // Get latest reading if not already available
          if (!sensorReading && sensor) {
            try {
              sensorReading = await this.apiService.getLatestReading(sensor.sensor_id).toPromise() || null;
            } catch (err) {
              console.warn(`Could not fetch reading for sensor ${sensor.sensor_id}:`, err);
            }
          }
        }
      } catch (error) {
        console.warn('Could not fetch sensor data for device:', error);
      }
    }

    const dialogRef = this.dialog.open(ActionConfirmationDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'glass-dialog',
      data: {
        actionType: isOn ? 'turnOn' : 'turnOff',
        device: device,
        sensor: sensor,
        sensorReading: sensorReading,
        deviceZone: device.location,
        thresholdMin: 20, // These would come from actual automation rules
        thresholdMax: 80,
        lastUpdateTime: sensorReading?.createdAt ? new Date(sensorReading.createdAt) : (device.last_seen ? new Date(device.last_seen) : undefined),
        context: isOn ? 'success' : 'warning'
      } as ActionConfirmationData
    });

    return dialogRef.afterClosed().toPromise().then(result => result === true);
  }

  getStatusBadgeClass(control: DeviceControl): string {
    if (control.device.device_type === 'safety') return 'safe-mode';
    return control.isOn ? 'active' : 'inactive';
  }

  getDeviceTypeIcon(device: Device): string {
    const type = device.device_type?.toLowerCase() || '';
    if (type.includes('humidity') || type.includes('humidifier')) return 'water_drop';
    if (type.includes('temperature') || type.includes('heater')) return 'thermostat';
    if (type.includes('light') || type.includes('lamp')) return 'lightbulb';
    if (type.includes('fan') || type.includes('ventilation')) return 'air';
    if (type.includes('pump') || type.includes('irrigation')) return 'water_pump';
    if (type.includes('sensor')) return 'sensors';
    if (type.includes('motor')) return 'settings';
    return 'devices';
  }

  getDeviceTypeName(device: Device): string {
    const type = device.device_type?.toLowerCase() || '';
    if (type.includes('humidity')) return this.languageService.t()('manualControl.humidityController');
    if (type.includes('humidifier')) return this.languageService.t()('manualControl.humidifier');
    if (type.includes('temperature')) return this.languageService.t()('manualControl.temperatureController');
    if (type.includes('heater')) return this.languageService.t()('manualControl.heater');
    if (type.includes('light')) return this.languageService.t()('manualControl.lightController');
    if (type.includes('fan')) return this.languageService.t()('manualControl.fanController');
    if (type.includes('ventilation')) return this.languageService.t()('manualControl.ventilationSystem');
    if (type.includes('pump')) return this.languageService.t()('manualControl.waterPump');
    if (type.includes('irrigation')) return this.languageService.t()('manualControl.irrigationSystem');
    if (type.includes('sensor')) return this.languageService.t()('manualControl.sensor');
    return this.languageService.t()('manualControl.device');
  }

  getDeviceSpecs(device: Device): { label: string; value: string }[] | null {
    const specs: { label: string; value: string }[] = [];
    const type = device.device_type?.toLowerCase() || '';

    // Add device-specific specifications
    if (type.includes('humidity') || type.includes('humidifier')) {
      specs.push({
        label: this.languageService.t()('manualControl.humidityRange'),
        value: '30-80%'
      });
      specs.push({
        label: this.languageService.t()('manualControl.capacity'),
        value: '5L/hour'
      });
    }

    if (type.includes('temperature') || type.includes('heater')) {
      specs.push({
        label: this.languageService.t()('manualControl.temperatureRange'),
        value: '15-35°C'
      });
      specs.push({
        label: this.languageService.t()('manualControl.power'),
        value: '2000W'
      });
    }

    if (type.includes('light')) {
      specs.push({
        label: this.languageService.t()('manualControl.lightIntensity'),
        value: '1000-5000 lux'
      });
      specs.push({
        label: this.languageService.t()('manualControl.wattage'),
        value: '100W LED'
      });
    }

    if (type.includes('fan') || type.includes('ventilation')) {
      specs.push({
        label: this.languageService.t()('manualControl.airflow'),
        value: '500 CFM'
      });
      specs.push({
        label: this.languageService.t()('manualControl.speed'),
        value: '3 speeds'
      });
    }

    if (type.includes('pump') || type.includes('irrigation')) {
      specs.push({
        label: this.languageService.t()('manualControl.flowRate'),
        value: '10L/min'
      });
      specs.push({
        label: this.languageService.t()('manualControl.pressure'),
        value: '2.5 bar'
      });
    }

    // Add connection status
    if (device.status) {
      const isOnline = device.status === DeviceStatus.ONLINE || device.status === DeviceStatus.ACTIVE;
      specs.push({
        label: this.languageService.t()('manualControl.connection'),
        value: isOnline ? this.languageService.t()('manualControl.online') : this.languageService.t()('manualControl.offline')
      });
    }

    // Add last seen if available
    if (device.last_seen) {
      const lastSeen = new Date(device.last_seen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeen.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        specs.push({
          label: this.languageService.t()('manualControl.lastSeen'),
          value: this.languageService.t()('manualControl.justNow')
        });
      } else if (diffMins < 60) {
        specs.push({
          label: this.languageService.t()('manualControl.lastSeen'),
          value: this.languageService.t()('manualControl.minutesAgo', { count: diffMins })
        });
      } else {
        specs.push({
          label: this.languageService.t()('manualControl.lastSeen'),
          value: this.languageService.t()('manualControl.hoursAgo', { count: Math.floor(diffMins / 60) })
        });
      }
    }

    return specs.length > 0 ? specs : null;
  }

  async executeDeviceAction(device: Device, isOn: boolean): Promise<void> {
    // Check if manual control is allowed
    if (this.automationEnabled()) {
      this.showErrorSnackbar(
        this.languageService.t()('manualControl.automationActiveError')
      );
      return;
    }

    // Check safe mode
    if (this.safeModeEnabled()) {
      this.showErrorSnackbar(
        this.languageService.t()('manualControl.safeModeActiveError')
      );
      return;
    }

    // Show confirmation dialog with real sensor data
    const confirmed = await this.showActionConfirmation(device, isOn);
    if (!confirmed) {
      return; // User cancelled
    }

    try {
      // Execute action via API
      await this.apiService.executeAction({
        deviceId: device.device_id,
        action: isOn ? 'mqtt:/devices/' + device.device_id + '/on' : 'mqtt:/devices/' + device.device_id + '/off',
        actionType: 'normal',
        context: {
          value: isOn ? 1 : 0
        }
      }).toPromise();

      // Update local state
      const controls = this.deviceControls();
      const updatedControls = controls.map(control =>
        control.device.device_id === device.device_id
          ? { ...control, isOn }
          : control
      );
      this.deviceControls.set(updatedControls);

      // Show success message with glassmorphic snackbar
      const alertTexts = this.languageService.t()('alerts') as any;
      this.showSuccessSnackbar(
        alertTexts[isOn ? 'deviceTurnedOn' : 'deviceTurnedOff'].replace('{{device}}', device.name)
      );
    } catch (error) {
      console.error('Error executing device action:', error);
      const alertTexts = this.languageService.t()('alerts') as any;
      this.showErrorSnackbar(alertTexts.actionError);
    }
  }

  async toggleDevice(device: Device, isOn: boolean): Promise<void> {
    // Legacy method for backward compatibility
    return this.executeDeviceAction(device, isOn);
  }

  setFilter(filter: 'all' | 'zone' | 'type'): void {
    this.selectedFilter.set(filter);
  }

  getDeviceIcon(device: Device): string {
    const type = device.device_type?.toLowerCase() || '';
    if (type.includes('pump') || type.includes('irrigation')) return 'water_drop';
    if (type.includes('fan') || type.includes('ventilation')) return 'air';
    if (type.includes('heater') || type.includes('heating')) return 'local_fire_department';
    if (type.includes('light')) return 'lightbulb';
    if (type.includes('sensor')) return 'sensors';
    if (type.includes('motor')) return 'settings';
    return 'devices';
  }

  getStatusIcon(control: DeviceControl): string {
    if (control.device.device_type === 'safety') return 'security';
    return control.isOn ? 'power' : 'power_off';
  }

  getStatusIconClass(control: DeviceControl): string {
    if (control.device.device_type === 'safety') return 'safe-mode';
    return control.isOn ? 'active' : 'inactive';
  }

  getLastUpdatedText(control: DeviceControl): string {
    // Since we removed the lastAction property, we'll use a generic message
    return this.languageService.t()('manualControl.never');
  }

  getAutomationRules(device: Device): string[] {
    // This would be based on actual automation configuration
    const rules: string[] = [];

    if (device.device_type?.includes('pump')) {
      rules.push(this.languageService.t()('manualControl.soilMoistureRule'));
    }
    if (device.device_type?.includes('fan')) {
      rules.push(this.languageService.t()('manualControl.temperatureRule'));
    }
    if (device.device_type?.includes('heater')) {
      rules.push(this.languageService.t()('manualControl.temperatureRule'));
    }

    return rules;
  }

  getDeviceThresholds(device: Device): { [key: string]: number } | undefined {
    // This would be based on actual device configuration
    if (device.device_type?.includes('sensor')) {
      return {
        'min': 20,
        'max': 80
      };
    }
    return undefined;
  }

  getThresholdEntries(thresholds: { [key: string]: number }): { key: string; value: number }[] {
    return Object.entries(thresholds).map(([key, value]) => ({ key, value }));
  }

  trackByDeviceId(index: number, control: DeviceControl): string {
    return control.device.device_id;
  }

  getSensorTypeDisplayName(sensor: Sensor): string {
    if (!sensor) return '';
    
    const type = sensor.type?.toLowerCase() || '';
    
    if (type.includes('temperature')) return this.languageService.t()('sensors.temperature') || 'Temperature';
    if (type.includes('humidity')) return this.languageService.t()('sensors.humidity') || 'Humidity';
    if (type.includes('soil') && type.includes('moisture')) return this.languageService.t()('sensors.soilMoisture') || 'Soil Moisture';
    if (type.includes('light')) return this.languageService.t()('sensors.lightLevel') || 'Light';
    if (type.includes('ph')) return this.languageService.t()('sensors.phLevel') || 'pH';
    if (type.includes('pressure')) return this.languageService.t()('sensors.pressure') || 'Pressure';
    
    // Fallback to the sensor type itself
    return sensor.type || '';
  }

  getSensorCurrentValue(reading: SensorReading, sensor: Sensor): string {
    if (!reading || !sensor) return '—';
    
    const value1 = reading.value1;
    const value2 = reading.value2;
    
    // Return the primary value, or value2 if value1 is not available
    const value = value1 !== undefined ? value1 : value2;
    
    if (value === undefined || value === null) return '—';
    
    // Format based on sensor type
    const type = sensor.type?.toLowerCase() || '';
    if (type.includes('temperature')) {
      return value.toFixed(1);
    }
    if (type.includes('humidity') || type.includes('moisture')) {
      return value.toFixed(0);
    }
    if (type.includes('ph')) {
      return value.toFixed(2);
    }
    if (type.includes('light')) {
      return value.toFixed(0);
    }
    
    // Default formatting
    return value.toFixed(1);
  }

  getSensorUnit(sensor: Sensor): string {
    if (!sensor) return '';
    
    const type = sensor.type?.toLowerCase() || '';
    
    if (type.includes('temperature')) return '°C';
    if (type.includes('humidity') || type.includes('moisture')) return '%';
    if (type.includes('light')) return 'lux';
    if (type.includes('ph')) return 'pH';
    if (type.includes('pressure')) return 'Pa';
    
    return sensor.unit || '';
  }

  getConcernedValueType(control: DeviceControl): string {
    // If sensor exists, use sensor type
    if (control.sensor) {
      return this.getSensorTypeDisplayName(control.sensor);
    }
    
    // Otherwise, infer from device type
    const deviceType = control.device.device_type?.toLowerCase() || '';
    const deviceName = control.device.name?.toLowerCase() || '';
    
    if (deviceType.includes('humidity') || deviceName.includes('humid') || deviceType.includes('humidifier')) {
      return this.languageService.t()('sensors.humidity') || 'Humidity';
    }
    if (deviceType.includes('temperature') || deviceName.includes('temp') || deviceType.includes('heater') || deviceType.includes('thermostat')) {
      return this.languageService.t()('sensors.temperature') || 'Temperature';
    }
    if (deviceType.includes('light') || deviceName.includes('light') || deviceType.includes('lamp')) {
      return this.languageService.t()('sensors.lightLevel') || 'Light';
    }
    if (deviceType.includes('fan') || deviceName.includes('fan') || deviceType.includes('ventilation') || deviceName.includes('vent')) {
      return this.languageService.t()('sensors.temperature') || 'Temperature'; // Fans control temperature
    }
    if (deviceType.includes('pump') || deviceName.includes('pump') || deviceType.includes('irrigation') || deviceName.includes('water')) {
      return this.languageService.t()('sensors.soilMoisture') || 'Soil Moisture'; // Pumps control soil moisture
    }
    
    // Fallback to device type name
    return this.getDeviceTypeName(control.device);
  }

  getConcernedValue(control: DeviceControl): string | null {
    // If sensor reading exists, use it
    if (control.sensor && control.sensorReading) {
      const value1 = control.sensorReading.value1;
      const value2 = control.sensorReading.value2;
      const value = value1 !== undefined ? value1 : value2;
      
      if (value !== undefined && value !== null) {
        return this.getSensorCurrentValue(control.sensorReading, control.sensor);
      }
    }
    
    // No sensor reading available
    return null;
  }

  getConcernedValueUnit(control: DeviceControl): string {
    // If sensor exists, use sensor unit
    if (control.sensor) {
      return this.getSensorUnit(control.sensor);
    }
    
    // Otherwise, infer from device type
    const deviceType = control.device.device_type?.toLowerCase() || '';
    const deviceName = control.device.name?.toLowerCase() || '';
    
    if (deviceType.includes('humidity') || deviceName.includes('humid') || deviceType.includes('humidifier')) {
      return '%';
    }
    if (deviceType.includes('temperature') || deviceName.includes('temp') || deviceType.includes('heater') || deviceType.includes('thermostat') || deviceType.includes('fan') || deviceType.includes('ventilation')) {
      return '°C';
    }
    if (deviceType.includes('light') || deviceName.includes('light') || deviceType.includes('lamp')) {
      return 'lux';
    }
    if (deviceType.includes('pump') || deviceName.includes('pump') || deviceType.includes('irrigation') || deviceName.includes('water')) {
      return '%';
    }
    
    return '';
  }

}
