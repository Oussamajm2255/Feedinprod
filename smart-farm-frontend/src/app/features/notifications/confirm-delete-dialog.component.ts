// confirm-delete-dialog.component.ts - REDESIGNED

import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="glass-dialog">
      <div class="dialog-icon">
        <mat-icon>delete</mat-icon>
        <div class="icon-pulse"></div>
      </div>

      <h3 mat-dialog-title class="dialog-title">
        {{ languageService.t()('notifications.deleteDialog.title') }}
      </h3>

      <div mat-dialog-content class="dialog-content">
        <p>{{ languageService.t()('notifications.deleteDialog.message') }}</p>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button
                class="glass-button cancel"
                (click)="onCancel()">
          {{ languageService.t()('notifications.deleteDialog.cancel') }}
        </button>
        <button mat-raised-button
                class="glass-button delete"
                (click)="onConfirm()">
          <mat-icon>delete</mat-icon>
          {{ languageService.t()('notifications.deleteDialog.delete') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .glass-dialog {
      padding: 8px;
      background: linear-gradient(135deg,
        rgba(255, 255, 255, 0.9) 0%,
        rgba(248, 250, 252, 0.9) 100%
      );
      backdrop-filter: blur(12px);
      border-radius: 20px;
    }

    .dialog-icon {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #991b1b;
        z-index: 2;
        position: relative;
      }
    }

    .icon-pulse {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: rgba(244, 63, 94, 0.3);
      animation: pulse-dialog 2s ease-in-out infinite;
    }

    @keyframes pulse-dialog {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.15);
        opacity: 0.7;
      }
    }

    .dialog-title {
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
    }

    .dialog-content {
      text-align: center;
      padding: 0 20px 24px;

      p {
        margin: 0;
        font-size: 15px;
        color: #475569;
        line-height: 1.6;
      }
    }

    .dialog-actions {
      display: flex;
      gap: 12px;
      padding: 0 20px 20px;
      justify-content: center;
    }

    .glass-button {
      border-radius: 12px;
      padding: 10px 24px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &.cancel {
        background: rgba(241, 245, 249, 0.8);
        color: #475569;
        border: 1px solid rgba(203, 213, 225, 0.5);

        &:hover {
          background: rgba(226, 232, 240, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      }

      &.delete {
        background: linear-gradient(135deg, #f43f5e 0%, #dc2626 100%);
        color: white;
        border: none;
        display: flex;
        align-items: center;
        gap: 6px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover {
          background: linear-gradient(135deg, #e11d48 0%, #b91c1c 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(244, 63, 94, 0.4);
        }
      }
    }

    // Dark mode support
    .dark-theme .glass-dialog {
      background: linear-gradient(135deg,
        rgba(30, 35, 50, 0.95) 0%,
        rgba(20, 25, 40, 0.95) 100%
      );

      .dialog-title {
        color: #f1f5f9;
      }

      .dialog-content p {
        color: #cbd5e1;
      }

      .glass-button.cancel {
        background: rgba(51, 65, 85, 0.8);
        color: #cbd5e1;
        border-color: rgba(71, 85, 105, 0.5);

        &:hover {
          background: rgba(71, 85, 105, 0.9);
        }
      }
    }

    // Accessibility
    .glass-button:focus-visible {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }

    // Mobile responsive
    @media (max-width: 480px) {
      .glass-dialog {
        padding: 4px;
      }

      .dialog-icon {
        width: 64px;
        height: 64px;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }
      }

      .dialog-title {
        font-size: 20px;
      }

      .dialog-content {
        padding: 0 16px 20px;

        p {
          font-size: 14px;
        }
      }

      .dialog-actions {
        flex-direction: column;
        padding: 0 16px 16px;

        .glass-button {
          width: 100%;
        }
      }
    }
  `]
})
export class ConfirmDeleteDialogComponent {
  public languageService = inject(LanguageService);

  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  onCancel() {
    this.dialogRef.close(false);
  }

  onConfirm() {
    this.dialogRef.close(true);
  }
}
