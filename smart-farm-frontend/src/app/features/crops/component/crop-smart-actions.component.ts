import { Component, OnInit, input, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiService } from '../../../core/services/api.service';
import { Device, Sensor } from '../../../core/models/farm.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';

interface DeviceAction {
  device_id: string;
  device_name: string;
  action_type: DeviceActionTypeKey;
  current_status: 'on' | 'off' | 'auto';
  icon: string;
  color: string;
  description: string;
  available_actions: string[];
}

type DeviceActionTypeKey = 'irrigation' | 'ventilation' | 'lighting' | 'heating' | 'pump' | 'control';

@Component({
  selector: 'app-crop-smart-actions',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslatePipe
  ],
  template: `
    <mat-card class="smart-actions">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>touch_app</mat-icon>
          {{ 'crops.smartActions.title' | translate }}
        </mat-card-title>
        <mat-card-subtitle>
          {{ 'crops.smartActions.subtitle' | translate }}
        </mat-card-subtitle>
        <div class="header-actions">
          <mat-chip-set>
            <mat-chip
              [highlighted]="controlMode() === 'manual'"
              (click)="setControlMode('manual')">
              <mat-icon>pan_tool</mat-icon>
              {{ 'crops.smartActions.modes.manual' | translate }}
            </mat-chip>
            <mat-chip
              [highlighted]="controlMode() === 'auto'"
              (click)="setControlMode('auto')">
              <mat-icon>auto_mode</mat-icon>
              {{ 'crops.smartActions.modes.auto' | translate }}
            </mat-chip>
          </mat-chip-set>
        </div>
      </mat-card-header>

      <mat-card-content>
        <!-- Loading State -->
        <div *ngIf="loading()" class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>{{ 'crops.smartActions.loading' | translate }}</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && deviceActions().length === 0" class="empty-state">
          <mat-icon>devices_off</mat-icon>
          <h3>{{ 'crops.smartActions.empty.title' | translate }}</h3>
          <p>{{ 'crops.smartActions.empty.description' | translate }}</p>
        </div>

        <!-- Actions Grid -->
        <div *ngIf="!loading() && deviceActions().length > 0" class="actions-grid">
          <div *ngFor="let action of deviceActions()"
               class="action-card"
               [class.active]="action.current_status === 'on'"
               [class.disabled]="controlMode() === 'auto' || executing().has(action.device_id)">

            <div class="action-header">
              <div class="action-icon" [style.background]="action.color + '20'">
                <mat-icon [style.color]="action.color">{{ action.icon }}</mat-icon>
              </div>
              <div class="action-info">
                <h4>{{ action.device_name }}</h4>
                <span class="action-type">{{ getActionTypeLabel(action.action_type) }}</span>
              </div>
              <div class="action-status">
                <span class="status-badge" [class]="action.current_status">
                  {{ getStatusLabel(action.current_status) }}
                </span>
              </div>
            </div>

            <p class="action-description">{{ action.description }}</p>

            <div class="action-controls">
              <!-- Toggle Switch (Manual Mode) -->
              <mat-slide-toggle
                *ngIf="controlMode() === 'manual'"
                [checked]="action.current_status === 'on'"
                [disabled]="executing().has(action.device_id)"
                (change)="toggleDevice(action, $event.checked)"
                color="primary">
                {{ action.current_status === 'on' ? ('crops.smartActions.actions.turnOff' | translate) : ('crops.smartActions.actions.turnOn' | translate) }}
              </mat-slide-toggle>

              <!-- Auto Mode Indicator -->
              <div *ngIf="controlMode() === 'auto'" class="auto-indicator">
                <mat-icon>auto_mode</mat-icon>
                <span>{{ 'crops.smartActions.autoIndicator' | translate }}</span>
              </div>

              <!-- Executing Spinner -->
              <mat-spinner
                *ngIf="executing().has(action.device_id)"
                diameter="24"
                class="executing-spinner">
              </mat-spinner>
            </div>

            <!-- Available Actions (Advanced) -->
            <div *ngIf="action.available_actions.length > 1" class="advanced-actions">
              <button
                *ngFor="let availableAction of action.available_actions"
                mat-stroked-button
                size="small"
                [disabled]="controlMode() === 'auto' || executing().has(action.device_id)"
                (click)="executeCustomAction(action, availableAction)"
                [matTooltip]="getAvailableActionTooltip(availableAction)">
                {{ getAvailableActionLabel(availableAction) }}
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Actions Bar -->
        <div *ngIf="deviceActions().length > 0" class="quick-actions">
          <button
            mat-raised-button
            color="primary"
            [disabled]="controlMode() === 'auto' || executing().size > 0"
            (click)="executeAllOn()"
            [matTooltip]="'crops.smartActions.quickActions.allOnTooltip' | translate">
            <mat-icon>power_settings_new</mat-icon>
            {{ 'crops.smartActions.quickActions.allOn' | translate }}
          </button>
          <button
            mat-raised-button
            [disabled]="controlMode() === 'auto' || executing().size > 0"
            (click)="executeAllOff()"
            [matTooltip]="'crops.smartActions.quickActions.allOffTooltip' | translate">
            <mat-icon>power_off</mat-icon>
            {{ 'crops.smartActions.quickActions.allOff' | translate }}
          </button>
          <button
            mat-stroked-button
            (click)="refreshActions()"
            [matTooltip]="'crops.smartActions.quickActions.refreshTooltip' | translate">
            <mat-icon>refresh</mat-icon>
            {{ 'common.refresh' | translate }}
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .smart-actions {
      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-actions {
          mat-chip-set {
            mat-chip {
              cursor: pointer;
              transition: all 0.2s;

              &[highlighted] {
                background: rgba(16, 185, 129, 0.15);
                color: var(--primary-green, #10b981);
                font-weight: 600;
              }

              mat-icon {
                margin-right: 0.25rem;
              }
            }
          }
        }
      }

      mat-card-content {
        padding: 0 !important;
      }
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      color: rgba(0, 0, 0, 0.3);
      gap: 1rem;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      h3 {
        margin: 0;
        color: rgba(0, 0, 0, 0.5);
      }

      p {
        margin: 0;
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      padding: 1rem;

      .action-card {
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid rgba(0, 0, 0, 0.05);
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.3);
        }

        &.active {
          border-color: var(--primary-green, #10b981);
          background: rgba(16, 185, 129, 0.05);
        }

        &.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .action-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;

          .action-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 12px;
            flex-shrink: 0;

            mat-icon {
              font-size: 28px;
              width: 28px;
              height: 28px;
            }
          }

          .action-info {
            flex: 1;

            h4 {
              margin: 0 0 0.25rem 0;
              font-size: 1rem;
              font-weight: 600;
              color: rgba(0, 0, 0, 0.87);
            }

            .action-type {
              font-size: 0.75rem;
              color: rgba(0, 0, 0, 0.5);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          }

          .action-status {
            .status-badge {
              display: inline-block;
              padding: 0.25rem 0.75rem;
              border-radius: 12px;
              font-size: 0.7rem;
              font-weight: 600;
              text-transform: uppercase;

              &.on {
                background: rgba(16, 185, 129, 0.15);
                color: var(--primary-green, #10b981);
              }

              &.off {
                background: #ffebee;
                color: #c62828;
              }

              &.auto {
                background: #e3f2fd;
                color: #1976d2;
              }
            }
          }
        }

        .action-description {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          color: rgba(0, 0, 0, 0.6);
          line-height: 1.5;
        }

        .action-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          position: relative;

          mat-slide-toggle {
            flex: 1;
          }

          .auto-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #1976d2;
            font-size: 0.875rem;

            mat-icon {
              font-size: 20px;
              width: 20px;
              height: 20px;
            }
          }

          .executing-spinner {
            position: absolute;
            right: 0;
          }
        }

        .advanced-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;

          button {
            font-size: 0.75rem;
            padding: 0.25rem 0.75rem;
            height: 32px;
          }
        }
      }
    }

    .quick-actions {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.02);
      border-top: 1px solid rgba(0, 0, 0, 0.05);

      button {
        mat-icon {
          margin-right: 0.5rem;
        }
      }
    }

    /* === DARK MODE SUPPORT === */
    :host-context(body.dark-theme) {
      .smart-actions {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);
        
        mat-card-title {
          color: var(--text-primary, #f1f5f9);
        }
        
        mat-card-subtitle {
          color: var(--text-secondary, #94a3b8);
        }
        
        .header-actions mat-chip-set mat-chip[highlighted] {
          background: rgba(16, 185, 129, 0.15);
          color: var(--primary-green, #10b981);
        }
      }
      
      .loading-state, .empty-state {
        color: var(--text-secondary, #94a3b8);
        
        h3 {
          color: var(--text-primary, #f1f5f9);
        }
        
        p {
          color: var(--text-secondary, #94a3b8);
        }
      }
      
      .actions-grid .action-card {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);
        
        &:hover:not(.disabled) {
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.4);
        }
        
        &.active {
          background: rgba(16, 185, 129, 0.12);
          border-color: var(--primary-green, #10b981);
        }
        
        .action-header {
          .action-info h4 {
            color: var(--text-primary, #f1f5f9);
          }
          
          .action-info .action-type {
            color: var(--text-secondary, #94a3b8);
          }
        }
        
        .action-description {
          color: var(--text-secondary, #94a3b8);
        }
      }
      
      .quick-actions {
        background: var(--light-bg, #0f172a);
        border-top-color: var(--border-color, #334155);
      }
    }

    @media (max-width: 768px) {
      .actions-grid {
        grid-template-columns: 1fr;
      }

      .quick-actions {
        flex-wrap: wrap;

        button {
          flex: 1;
          min-width: 120px;
        }
      }
    }
  `]
})
export class CropSmartActionsComponent implements OnInit {
  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);

  // Inputs
  cropId = input.required<string>();
  sensors = input.required<Sensor[]>();

  // Local state
  controlMode = signal<'manual' | 'auto'>('manual');
  loading = signal(false);
  deviceActions = signal<DeviceAction[]>([]);
  executing = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadDeviceActions();
  }

  setControlMode(mode: 'manual' | 'auto'): void {
    this.controlMode.set(mode);
    this.snackBar.open(
      mode === 'auto'
        ? this.languageService.translate('crops.smartActions.snackbar.autoMode')
        : this.languageService.translate('crops.smartActions.snackbar.manualMode'),
      this.languageService.translate('common.ok'),
      { duration: 2000 }
    );
  }

  refreshActions(): void {
    this.loadDeviceActions(true);
  }

  private loadDeviceActions(forceRefresh = false): void {
    this.loading.set(true);
    const sensors = this.sensors();

    // Get unique device IDs from sensors
    const deviceIds = [...new Set(sensors.map(s => s.device_id).filter(Boolean))];

    if (deviceIds.length === 0) {
      this.deviceActions.set([]);
      this.loading.set(false);
      return;
    }

    // CRITICAL: Load devices and their actions in parallel
    import('rxjs').then(({ forkJoin, of }) => {
      import('rxjs/operators').then(({ catchError }) => {
        const deviceRequests = deviceIds.map(deviceId =>
          forkJoin({
            device: (this.apiService.getDevice(deviceId, false) as any),
            actions: (this.apiService.getDeviceActions(deviceId) as any).pipe(
              catchError(() => of([]))
            )
          }).pipe(
            catchError(() => of(null))
          )
        );

        forkJoin(deviceRequests)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (results: any[]) => {
              const actions = results
                .filter(r => r !== null)
                .map((result: any) => {
                  if (result && result.device) {
                    return this.mapDeviceToAction(result.device, result.actions);
                  }
                  return null;
                })
                .filter(a => a !== null) as DeviceAction[];

              this.deviceActions.set(actions);
              this.loading.set(false);
            },
            error: (err: any) => {
              console.error('Error loading device actions:', err);
              this.loading.set(false);
              this.snackBar.open(
                this.languageService.translate('crops.smartActions.snackbar.loadError'),
                this.languageService.translate('common.close'),
                { duration: 3000 }
              );
            }
          });
      });
    });
  }

  private mapDeviceToAction(device: Device, actions: any[]): DeviceAction {
    const actionType = this.getDeviceActionType(device);
    const icon = this.getDeviceIcon(device);
    const color = this.getDeviceColor(device);
    const availableActions = actions.map(a => a.action_type || a.type).filter(Boolean);

    return {
      device_id: device.device_id,
      device_name: device.name,
      action_type: actionType,
      current_status: this.getDeviceStatus(device),
      icon,
      color,
      description: device.description || this.languageService.translate('crops.smartActions.defaultDescription', { name: device.name }),
      available_actions: availableActions.length > 0 ? availableActions : ['on', 'off']
    };
  }

  toggleDevice(action: DeviceAction, turnOn: boolean): void {
    const actionType = turnOn ? 'on' : 'off';
    this.executeAction(action, actionType);
  }

  executeCustomAction(action: DeviceAction, actionType: string): void {
    this.executeAction(action, actionType);
  }

  private executeAction(action: DeviceAction, actionType: string): void {
    // Add to executing set
    const currentExecuting = this.executing();
    currentExecuting.add(action.device_id);
    this.executing.set(new Set(currentExecuting));

    (this.apiService.executeAction({
      deviceId: action.device_id,
      action: actionType,
      actionType: 'normal'
    }) as any)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response: any) => {
        // Remove from executing
        const updated = this.executing();
        updated.delete(action.device_id);
        this.executing.set(new Set(updated));

        // Update local state
        const actions = this.deviceActions();
        const index = actions.findIndex(a => a.device_id === action.device_id);
        if (index >= 0) {
          actions[index].current_status = actionType === 'on' ? 'on' : 'off';
          this.deviceActions.set([...actions]);
        }

        this.snackBar.open(
          this.languageService.translate('crops.smartActions.snackbar.deviceSuccess', {
            device: action.device_name,
            action: this.getAvailableActionLabel(actionType)
          }),
          this.languageService.translate('common.ok'),
          { duration: 2000 }
        );
      },
      error: (err: any) => {
        // Remove from executing
        const updated = this.executing();
        updated.delete(action.device_id);
        this.executing.set(new Set(updated));

        console.error('Error executing action:', err);
        this.snackBar.open(
          this.languageService.translate('crops.smartActions.snackbar.deviceError', {
            device: action.device_name
          }),
          this.languageService.translate('common.close'),
          { duration: 3000 }
        );
      }
    });
  }

  executeAllOn(): void {
    const actions = this.deviceActions();
    actions.forEach(action => {
      if (action.current_status !== 'on') {
        this.executeAction(action, 'on');
      }
    });
  }

  executeAllOff(): void {
    const actions = this.deviceActions();
    actions.forEach(action => {
      if (action.current_status !== 'off') {
        this.executeAction(action, 'off');
      }
    });
  }

  private getDeviceActionType(device: Device): DeviceActionTypeKey {
    const name = device.name.toLowerCase();
    if (name.includes('irrigation') || name.includes('water')) return 'irrigation';
    if (name.includes('fan') || name.includes('ventilation')) return 'ventilation';
    if (name.includes('light') || name.includes('lamp')) return 'lighting';
    if (name.includes('heater') || name.includes('heating')) return 'heating';
    if (name.includes('pump')) return 'pump';
    return 'control';
  }

  private getDeviceIcon(device: Device): string {
    const type = this.getDeviceActionType(device);
    switch (type) {
      case 'irrigation': return 'water_drop';
      case 'ventilation': return 'air';
      case 'lighting': return 'lightbulb';
      case 'heating': return 'local_fire_department';
      case 'pump': return 'water_pump';
      default: return 'power';
    }
  }

  private getDeviceColor(device: Device): string {
    const type = this.getDeviceActionType(device);
    switch (type) {
      case 'irrigation': return '#2196f3';
      case 'ventilation': return '#4caf50';
      case 'lighting': return '#ff9800';
      case 'heating': return '#f44336';
      case 'pump': return '#00bcd4';
      default: return '#9e9e9e';
    }
  }

  private getDeviceStatus(device: Device): 'on' | 'off' | 'auto' {
    // Map device status to action status
    // This is a simplification - adjust based on your backend
    if (device.status === 'active' || device.status === 'online') return 'on';
    return 'off';
  }

  getActionTypeLabel(type: string): string {
    const key = `crops.smartActions.actionTypes.${type}`;
    const translated = this.languageService.translate(key);
    return translated === key ? type : translated;
  }

  getStatusLabel(status: string): string {
    return this.languageService.translate(`crops.smartActions.status.${status}`);
  }

  getAvailableActionLabel(action: string): string {
    const normalized = action?.toLowerCase?.() || '';
    const key = `crops.smartActions.availableActions.${normalized}`;
    const translated = this.languageService.translate(key, { action });
    return translated === key ? action : translated;
  }

  getAvailableActionTooltip(action: string): string {
    return this.languageService.translate('crops.smartActions.availableActions.tooltip', {
      action: this.getAvailableActionLabel(action)
    });
  }
}
