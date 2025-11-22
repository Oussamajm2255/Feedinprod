import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SensorStatus } from '../../utils/sensor-status.util';

export interface SummaryCounts {
  normal: number;
  warning: number;
  critical: number;
  offline: number;
}

@Component({
  selector: 'app-footer-summary',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="summary-footer" [class]="overallStatus()">
      <div class="footer-content">
        <!-- Left: Overall Status -->
        <div class="status-overview">
          <div class="status-icon">
            <mat-icon>{{ getOverallIcon() }}</mat-icon>
          </div>
          <div class="status-text">
            <div class="status-title">{{ overallTitle() }}</div>
            <div class="status-subtitle">{{ subtitle() }}</div>
          </div>
        </div>

        <!-- Right: Counts -->
        <div class="counts-section">
          <div class="count-pill normal">
            <mat-icon>check_circle</mat-icon>
            <span class="count">{{ counts().normal }}</span>
            <span class="label">Normal</span>
          </div>

          <div class="count-pill warning">
            <mat-icon>warning</mat-icon>
            <span class="count">{{ counts().warning }}</span>
            <span class="label">Warning</span>
          </div>

          <div class="count-pill critical">
            <mat-icon>error</mat-icon>
            <span class="count">{{ counts().critical }}</span>
            <span class="label">Critical</span>
          </div>

          <div class="count-pill offline">
            <mat-icon>sensors_off</mat-icon>
            <span class="count">{{ counts().offline }}</span>
            <span class="label">Offline</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .summary-footer {
        position: sticky;
        bottom: 0;
        background: var(--glass-bg, rgba(255, 255, 255, 0.85));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 20px;
        border: 1px solid var(--glass-border, rgba(16, 185, 129, 0.2));
        box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.08),
                    0 8px 32px rgba(0, 0, 0, 0.04),
                    inset 0 1px 1px rgba(255, 255, 255, 0.9);
        padding: 1.25rem 2rem;
        margin: 1.5rem 2rem 2rem 2rem;
        animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .summary-footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, transparent, #10b981, #34d399, #10b981, transparent);
        transition: opacity 0.3s ease;
        opacity: 0.7;
      }

      @keyframes slideUp {
        from {
          transform: translateY(120%) scale(0.9);
          opacity: 0;
        }
        to {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }

      .summary-footer:hover {
        box-shadow: 0 -4px 40px rgba(16, 185, 129, 0.15),
                    0 8px 40px rgba(16, 185, 129, 0.08),
                    inset 0 1px 1px rgba(255, 255, 255, 1);
        border-color: rgba(16, 185, 129, 0.4);
      }

      .summary-footer:hover::before {
        opacity: 1;
      }

      .summary-footer.normal::before {
        background: linear-gradient(90deg, transparent, #10b981, #34d399, #10b981, transparent);
      }

      .summary-footer.warning::before {
        background: linear-gradient(90deg, transparent, #f59e0b, #fbbf24, #f59e0b, transparent);
      }

      .summary-footer.critical::before {
        background: linear-gradient(90deg, transparent, #ef4444, #f87171, #ef4444, transparent);
        animation: pulseWarning 2s ease-in-out infinite;
      }

      @keyframes pulseWarning {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }

      .summary-footer.offline::before {
        background: linear-gradient(90deg, transparent, #6b7280, #9ca3af, #6b7280, transparent);
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        flex-wrap: wrap;
      }

      .status-overview {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .status-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
      }

      .normal .status-icon {
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        color: #065f46;
      }

      .warning .status-icon {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        color: #92400e;
      }

      .critical .status-icon {
        background: linear-gradient(135deg, #fee2e2, #fecaca);
        color: #991b1b;
      }

      .offline .status-icon {
        background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        color: #4b5563;
      }

      .status-icon mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .status-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .status-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1f2937;
      }

      .status-subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
      }

      .counts-section {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .count-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: default;
        backdrop-filter: blur(8px);
        border: 1px solid transparent;
        position: relative;
        overflow: hidden;
      }

      .count-pill::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(255, 255, 255, 0.3), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .count-pill:hover {
        transform: translateY(-4px) scale(1.05);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      }

      .count-pill:hover::before {
        opacity: 1;
      }

      .count-pill mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .count {
        font-size: 1.125rem;
        font-weight: 700;
        min-width: 24px;
        text-align: center;
      }

      .label {
        font-size: 0.875rem;
      }

      .count-pill.normal {
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        color: #065f46;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2),
                    inset 0 1px 1px rgba(255, 255, 255, 0.5);
      }

      .count-pill.normal:hover {
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35),
                    inset 0 1px 1px rgba(255, 255, 255, 0.7);
      }

      .count-pill.warning {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        color: #92400e;
        box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2),
                    inset 0 1px 1px rgba(255, 255, 255, 0.5);
      }

      .count-pill.warning:hover {
        box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35),
                    inset 0 1px 1px rgba(255, 255, 255, 0.7);
      }

      .count-pill.critical {
        background: linear-gradient(135deg, #fee2e2, #fecaca);
        color: #991b1b;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2),
                    inset 0 1px 1px rgba(255, 255, 255, 0.5);
        animation: criticalPulse 2s ease-in-out infinite;
      }

      @keyframes criticalPulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2),
                      inset 0 1px 1px rgba(255, 255, 255, 0.5);
        }
        50% {
          transform: scale(1.03);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35),
                      inset 0 1px 1px rgba(255, 255, 255, 0.6);
        }
      }

      .count-pill.critical:hover {
        animation: none;
        box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4),
                    inset 0 1px 1px rgba(255, 255, 255, 0.7);
      }

      .count-pill.offline {
        background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        color: #4b5563;
        box-shadow: 0 4px 16px rgba(107, 114, 128, 0.15),
                    inset 0 1px 1px rgba(255, 255, 255, 0.5);
      }

      .count-pill.offline:hover {
        box-shadow: 0 8px 24px rgba(107, 114, 128, 0.25),
                    inset 0 1px 1px rgba(255, 255, 255, 0.7);
      }

      @media (max-width: 1024px) {
        .summary-footer {
          padding: 12px 16px;
          border-radius: 16px 16px 0 0;
        }

        .status-icon {
          width: 40px;
          height: 40px;
        }

        .status-icon mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        .status-title {
          font-size: 1rem;
        }

        .count-pill {
          padding: 6px 12px;
        }
      }

      @media (max-width: 768px) {
        .summary-footer {
          margin: 1rem;
          padding: 1rem;
          border-radius: 16px;
        }

        .footer-content {
          flex-direction: column;
          align-items: stretch;
        }

        .status-overview {
          justify-content: center;
        }

        .counts-section {
          justify-content: center;
        }

        .count-pill .label {
          display: none;
        }
      }

      /* Dark theme support */
      :host-context(body.dark-theme) .summary-footer {
        background: var(--glass-bg, rgba(30, 41, 59, 0.85));
        border-color: var(--glass-border, rgba(100, 116, 139, 0.3));
        box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.4),
                    0 8px 32px rgba(0, 0, 0, 0.3),
                    inset 0 1px 1px rgba(100, 116, 139, 0.2);
      }

      :host-context(body.dark-theme) .summary-footer:hover {
        box-shadow: 0 -4px 40px rgba(16, 185, 129, 0.25),
                    0 8px 40px rgba(16, 185, 129, 0.15),
                    inset 0 1px 1px rgba(100, 116, 139, 0.3);
      }

      :host-context(body.dark-theme) .status-title {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .status-subtitle {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .count-pill.normal {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2));
        color: #34d399;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3),
                    inset 0 1px 1px rgba(255, 255, 255, 0.1);
      }

      :host-context(body.dark-theme) .count-pill.warning {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(251, 191, 36, 0.2));
        color: #fbbf24;
        box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3),
                    inset 0 1px 1px rgba(255, 255, 255, 0.1);
      }

      :host-context(body.dark-theme) .count-pill.critical {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(248, 113, 113, 0.2));
        color: #f87171;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3),
                    inset 0 1px 1px rgba(255, 255, 255, 0.1);
      }

      :host-context(body.dark-theme) .count-pill.offline {
        background: linear-gradient(135deg, rgba(107, 114, 128, 0.25), rgba(156, 163, 175, 0.2));
        color: #9ca3af;
        box-shadow: 0 4px 16px rgba(107, 114, 128, 0.25),
                    inset 0 1px 1px rgba(255, 255, 255, 0.1);
      }

      :host-context(body.dark-theme) .normal .status-icon {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(167, 243, 208, 0.2));
        color: #6ee7b7;
        border: 1px solid rgba(16, 185, 129, 0.4);
      }

      :host-context(body.dark-theme) .warning .status-icon {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(253, 230, 138, 0.2));
        color: #fcd34d;
        border: 1px solid rgba(245, 158, 11, 0.4);
      }

      :host-context(body.dark-theme) .critical .status-icon {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(254, 202, 202, 0.2));
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.4);
      }

      :host-context(body.dark-theme) .offline .status-icon {
        background: linear-gradient(135deg, rgba(107, 114, 128, 0.3), rgba(229, 231, 235, 0.15));
        color: #cbd5e1;
        border: 1px solid rgba(107, 114, 128, 0.4);
      }
    `,
  ],
})
export class FooterSummaryComponent {
  // Inputs
  counts = input<SummaryCounts>({ normal: 0, warning: 0, critical: 0, offline: 0 });
  overallStatus = input<SensorStatus>('normal');
  overallTitle = input<string>('All Systems Normal');
  subtitle = input<string>('All sensors operating within optimal ranges');

  getOverallIcon(): string {
    const status = this.overallStatus();
    const icons: Record<SensorStatus, string> = {
      normal: 'check_circle',
      warning: 'warning',
      critical: 'error',
      offline: 'sensors_off',
    };
    return icons[status];
  }
}


