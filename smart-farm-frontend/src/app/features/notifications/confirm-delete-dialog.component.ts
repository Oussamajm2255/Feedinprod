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
      padding: var(--space-2);
      background: var(--glass-bg-strong);
      backdrop-filter: var(--glass-blur);
      border-radius: var(--radius-2xl);
    }

    .dialog-icon {
      position: relative;
      width: var(--space-20);
      height: var(--space-20);
      margin: 0 auto var(--space-5);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--danger-200) 0%, var(--danger-300) 100%);

      mat-icon {
        font-size: var(--space-10);
        width: var(--space-10);
        height: var(--space-10);
        color: var(--danger-800);
        z-index: 2;
        position: relative;
      }
    }

    .icon-pulse {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: var(--radius-full);
      background: var(--glow-danger);
      animation: pulse-dialog var(--duration-slower) var(--ease-in-out) infinite;
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
      font-size: var(--text-2xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin: 0 0 var(--space-4) 0;
    }

    .dialog-content {
      text-align: center;
      padding: 0 var(--space-5) var(--space-6);

      p {
        margin: 0;
        font-size: var(--text-sm);
        color: var(--text-secondary);
        line-height: var(--leading-normal);
      }
    }

    .dialog-actions {
      display: flex;
      gap: var(--space-3);
      padding: 0 var(--space-5) var(--space-5);
      justify-content: center;
    }

    .glass-button {
      border-radius: var(--radius-lg);
      padding: var(--space-2) var(--space-6);
      font-weight: var(--font-semibold);
      font-size: var(--text-sm);
      transition: all var(--duration-normal) var(--ease-in-out);

      &.cancel {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        border: 1px solid var(--border-secondary);

        &:hover {
          background: var(--bg-tertiary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
      }

      &.delete {
        background: var(--gradient-danger);
        color: white;
        border: none;
        display: flex;
        align-items: center;
        gap: var(--space-2);

        mat-icon {
          font-size: var(--text-lg);
          width: var(--text-lg);
          height: var(--text-lg);
        }

        &:hover {
          background: linear-gradient(135deg, var(--danger-600) 0%, var(--danger-700) 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px var(--glow-danger);
        }
      }
    }

    // Accessibility
    .glass-button:focus-visible {
      outline: 2px solid var(--border-focus);
      outline-offset: 2px;
    }

    // Mobile responsive
    @media (max-width: 480px) {
      .glass-dialog {
        padding: var(--space-1);
      }

      .dialog-icon {
        width: var(--space-16);
        height: var(--space-16);

        mat-icon {
          font-size: var(--space-8);
          width: var(--space-8);
          height: var(--space-8);
        }
      }

      .dialog-title {
        font-size: var(--text-xl);
      }

      .dialog-content {
        padding: 0 var(--space-4) var(--space-5);

        p {
          font-size: var(--text-xs);
        }
      }

      .dialog-actions {
        flex-direction: column;
        padding: 0 var(--space-4) var(--space-4);

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
