import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';

interface CropAction {
  id: string;
  icon: string;
  labelKey: string;
  color: string;
  action: string;
}

@Component({
  selector: 'app-smart-actions-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="actions-panel">
      <div class="panel-header">
        <mat-icon>settings</mat-icon>
        <h2>{{ 'crops.dashboard.smartActions' | translate }}</h2>
      </div>

      <div class="actions-grid">
        @for (action of actions; track action.id) {
          <button 
            mat-raised-button 
            class="action-button"
            [class]="'action-' + action.color"
            [disabled]="disabled()"
            (click)="onActionClick(action)">
            <div class="button-content">
              <mat-icon>{{ action.icon }}</mat-icon>
              <span>{{ action.labelKey | translate }}</span>
            </div>
          </button>
        }
      </div>

      @if (disabled()) {
        <div class="disabled-message">
          <mat-icon>info</mat-icon>
          <p>{{ 'crops.dashboard.noCropSelected' | translate }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .actions-panel {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.1);
      contain: layout style paint;
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

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .action-button {
      height: 120px;
      border-radius: 16px;
      border: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.2));
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover:not([disabled]) {
        transform: translateY(-6px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);

        &::before {
          opacity: 1;
        }

        .button-content mat-icon {
          transform: scale(1.1);
        }
      }

      &:active:not([disabled]) {
        transform: translateY(-2px);
      }

      &[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .action-water {
      background: linear-gradient(135deg, #0ea5e9, #06b6d4);
      color: white;
    }

    .action-sun {
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      color: white;
    }

    .action-wind {
      background: linear-gradient(135deg, #8b5cf6, #a78bfa);
      color: white;
    }

    .action-fertilize {
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white;
    }

    .action-alert {
      background: linear-gradient(135deg, #ef4444, #f87171);
      color: white;
    }

    .button-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      position: relative;
      z-index: 1;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        transition: transform 0.3s ease;
      }

      span {
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
    }

    .disabled-message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 12px;
      color: #047857;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      p {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 500;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .actions-panel {
        padding: 1.5rem;
      }

      .actions-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }

      .action-button {
        height: 100px;

        .button-content {
          mat-icon {
            font-size: 36px;
            width: 36px;
            height: 36px;
          }

          span {
            font-size: 0.875rem;
          }
        }
      }
    }

    /* Dark theme */
    :host-context(body.dark-theme) {
      .actions-panel {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(16, 185, 129, 0.2);
      }

      .panel-header {
        border-bottom-color: rgba(16, 185, 129, 0.2);

        h2 {
          color: #f1f5f9;
        }
      }

      .action-button {
        &:hover:not([disabled]) {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        }
      }

      .disabled-message {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
      }
    }
  `]
})
export class SmartActionsPanelComponent {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private languageService = inject(LanguageService);

  disabled = input<boolean>(false);
  actionExecuted = output<string>();

  actions: CropAction[] = [
    {
      id: 'irrigate',
      icon: 'water_drop',
      labelKey: 'crops.actions.irrigateNow',
      color: 'water',
      action: 'irrigation_on'
    },
    {
      id: 'shading',
      icon: 'wb_sunny',
      labelKey: 'crops.actions.adjustShading',
      color: 'sun',
      action: 'adjust_shading'
    },
    {
      id: 'ventilation',
      icon: 'air',
      labelKey: 'crops.actions.activateVentilation',
      color: 'wind',
      action: 'ventilation_on'
    },
    {
      id: 'fertilize',
      icon: 'spa',
      labelKey: 'crops.actions.fertilize',
      color: 'fertilize',
      action: 'fertilize'
    },
    {
      id: 'alert',
      icon: 'notification_important',
      labelKey: 'crops.actions.alertTechnician',
      color: 'alert',
      action: 'alert_technician'
    }
  ];

  onActionClick(action: CropAction): void {
    // Show confirmation dialog
    const confirmed = confirm(this.languageService.translate('crops.actions.confirmTurnOnIrrigation'));
    
    if (confirmed) {
      this.actionExecuted.emit(action.action);
      
      // Show success message
      this.snackBar.open(
        this.languageService.translate('crops.actions.actionExecuted'),
        this.languageService.translate('common.close'),
        { duration: 3000, panelClass: 'success-snackbar' }
      );
    }
  }
}

