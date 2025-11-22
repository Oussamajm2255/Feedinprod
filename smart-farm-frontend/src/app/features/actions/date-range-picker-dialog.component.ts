import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-date-range-picker-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
  ],
  template: `
    <div class="date-range-dialog">
      <h2 mat-dialog-title>
        <mat-icon>date_range</mat-icon>
        <span>Select Date Range</span>
      </h2>
      <mat-dialog-content>
        <div class="date-range-content">
          <div class="date-field-wrapper">
            <mat-form-field appearance="outline" class="date-field">
              <mat-label>
                <mat-icon>event</mat-icon>
                From Date
              </mat-label>
              <input matInput [matDatepicker]="fromPicker" [(ngModel)]="fromDate" placeholder="Select start date">
              <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
              <mat-datepicker #fromPicker></mat-datepicker>
              <mat-hint>Start of the date range</mat-hint>
            </mat-form-field>
          </div>

          <div class="date-field-wrapper">
            <mat-form-field appearance="outline" class="date-field">
              <mat-label>
                <mat-icon>event</mat-icon>
                To Date
              </mat-label>
              <input matInput [matDatepicker]="toPicker" [(ngModel)]="toDate" placeholder="Select end date">
              <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
              <mat-datepicker #toPicker></mat-datepicker>
              <mat-hint>End of the date range</mat-hint>
            </mat-form-field>
          </div>

          <div class="date-range-summary" *ngIf="fromDate && toDate">
            <mat-icon>calendar_today</mat-icon>
            <span>
              <strong>{{ fromDate | date:'mediumDate' }}</strong>
              <mat-icon>arrow_forward</mat-icon>
              <strong>{{ toDate | date:'mediumDate' }}</strong>
            </span>
          </div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button (click)="cancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="primary" (click)="apply()" [disabled]="!fromDate || !toDate" class="apply-btn">
          <mat-icon>check</mat-icon>
          Apply Filter
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .date-range-dialog {
      padding: 0;
      min-width: 480px;
      max-width: 600px;
      background: var(--glass-bg, rgba(255, 255, 255, 0.98));
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0;
      padding: 2rem 2rem 1.5rem 2rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), transparent);
      border-bottom: 2px solid var(--glass-border, rgba(16, 185, 129, 0.2));

      mat-icon {
        color: var(--primary-green);
        font-size: 28px;
        width: 28px;
        height: 28px;
        animation: pulse 2s ease-in-out infinite;
      }

      span {
        flex: 1;
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.9;
      }
    }

    mat-dialog-content {
      padding: 2rem;
      margin: 0;
      max-height: 500px;
      overflow-y: auto;
      background: var(--glass-bg, rgba(255, 255, 255, 0.98));
    }

    .date-range-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .date-field-wrapper {
      position: relative;
    }

    .date-field {
      width: 100%;

      ::ng-deep {
        .mat-mdc-form-field {
          background: var(--glass-bg, rgba(255, 255, 255, 0.95));
          border-radius: 14px;
          border: 3px solid var(--glass-border, rgba(16, 185, 129, 0.5));
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
          position: relative;
          overflow: hidden;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            border-radius: 14px;
          }

          &:hover {
            border-color: var(--primary-green);
            border-width: 3px;
            box-shadow: 0 6px 18px rgba(16, 185, 129, 0.2);
            transform: translateY(-2px);

            &::before {
              opacity: 1;
            }
          }

          &.mat-focused {
            border-color: var(--primary-green);
            border-width: 3.5px;
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3), 0 0 0 4px rgba(16, 185, 129, 0.2);
            transform: translateY(-2px);

            &::before {
              opacity: 1;
              background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), transparent);
            }
          }
        }

        .mat-mdc-text-field-wrapper {
          border-radius: 14px;
          padding: 0 18px;
          background: transparent;
        }

        .mat-mdc-form-field-label {
          color: var(--text-primary);
          font-weight: 700;
          font-size: 0.9375rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
            color: var(--primary-green);
          }

          &.mdc-floating-label--float-above {
            color: var(--primary-green);
            font-weight: 700;
            font-size: 0.8125rem;

            mat-icon {
              color: var(--primary-green);
            }
          }
        }

        .mat-mdc-input-element {
          color: var(--text-primary);
          font-weight: 600;
          font-size: 1rem;
          padding: 14px 0;
        }

        .mat-datepicker-toggle {
          color: var(--primary-green);
          transition: transform 0.3s ease;

          &:hover {
            transform: scale(1.15);
          }
        }

        .mat-mdc-form-field-hint-wrapper {
          padding: 0.5rem 0 0 0;

          .mat-mdc-form-field-hint {
            color: var(--text-secondary);
            font-size: 0.8125rem;
            font-weight: 500;
          }
        }
      }
    }

    .date-range-summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
      border: 2px solid var(--primary-green);
      border-radius: 12px;
      margin-top: 0.5rem;
      animation: slideIn 0.3s ease;

      mat-icon {
        color: var(--primary-green);
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      span {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-primary);
        font-size: 0.9375rem;
        font-weight: 600;

        strong {
          color: var(--primary-green);
          font-weight: 700;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          opacity: 0.6;
        }
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    mat-dialog-actions {
      padding: 1.5rem 2rem 2rem 2rem;
      margin: 0;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      background: var(--glass-bg, rgba(255, 255, 255, 0.98));
      border-top: 2px solid var(--glass-border, rgba(16, 185, 129, 0.2));

      button {
        border-radius: 12px;
        font-weight: 600;
        text-transform: none;
        padding: 0.75rem 2rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9375rem;
        min-width: 120px;
        justify-content: center;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        &.cancel-btn {
          background: transparent;
          border: 2px solid var(--glass-border, rgba(0, 0, 0, 0.1));
          color: var(--text-secondary);

          &:hover {
            background: rgba(239, 68, 68, 0.1);
            border-color: #ef4444;
            color: #ef4444;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
          }
        }

        &.apply-btn {
          background: linear-gradient(135deg, var(--primary-green), #059669);
          color: white;
          border: 2px solid var(--primary-green);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #059669, #047857);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }
    }

    // Dark theme support
    :host-context(body.dark-theme) {
      .date-range-dialog {
        background: var(--card-bg, rgba(30, 41, 59, 0.98));
        border: 1px solid var(--border-color, rgba(16, 185, 129, 0.3));
      }

      h2[mat-dialog-title] {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), transparent);
        border-bottom-color: var(--border-color, rgba(16, 185, 129, 0.3));
        color: var(--text-primary, #f1f5f9);
      }

      mat-dialog-content {
        background: var(--card-bg, rgba(30, 41, 59, 0.98));
      }

      .date-field ::ng-deep .mat-mdc-form-field {
        background: var(--card-bg, rgba(30, 41, 59, 0.95));
        border-color: var(--glass-border, rgba(16, 185, 129, 0.5));
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);

        &:hover {
          border-color: var(--primary-green);
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.25);
        }

        &.mat-focused {
          border-color: var(--primary-green);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35), 0 0 0 4px rgba(16, 185, 129, 0.25);
        }
      }

      .date-range-summary {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
        border-color: var(--primary-green);
        color: var(--text-primary, #f1f5f9);
      }

      mat-dialog-actions {
        background: var(--card-bg, rgba(30, 41, 59, 0.98));
        border-top-color: var(--border-color, rgba(16, 185, 129, 0.3));

        .cancel-btn {
          border-color: var(--border-color, rgba(100, 116, 139, 0.3));
          color: var(--text-secondary, #cbd5e1);

          &:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: #ef4444;
            color: #ef4444;
          }
        }
      }
    }
  `]
})
export class DateRangePickerDialog {
  fromDate: Date | null = null;
  toDate: Date | null = null;

  constructor(
    public dialogRef: MatDialogRef<DateRangePickerDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { fromDate: Date | null; toDate: Date | null }
  ) {
    this.fromDate = data.fromDate || null;
    this.toDate = data.toDate || null;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  apply(): void {
    if (this.fromDate && this.toDate) {
      this.dialogRef.close({ fromDate: this.fromDate, toDate: this.toDate });
    }
  }
}
