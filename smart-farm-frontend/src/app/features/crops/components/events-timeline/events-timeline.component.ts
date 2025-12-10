import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { CropEvent } from '../../services/crop-dashboard.service';

@Component({
  selector: 'app-events-timeline',
  standalone: true,
  imports: [
    CommonModule,
    ScrollingModule,
    MatIconModule,
    TranslatePipe,
    TimeAgoPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="timeline-panel">
      <div class="panel-header">
        <mat-icon>timeline</mat-icon>
        <h2>{{ 'crops.dashboard.eventsTimeline' | translate }}</h2>
      </div>

      @if (events() && events()!.length > 0) {
        <cdk-virtual-scroll-viewport itemSize="80" class="timeline-container">
          <div class="timeline-track"></div>
          @for (event of events(); track event.id; let i = $index) {
            <div class="timeline-entry">
              <div class="timeline-marker" [class]="'marker-' + event.status">
                <mat-icon>{{ getEventIcon(event.type) }}</mat-icon>
              </div>
              <div class="timeline-content" [class]="'content-' + event.status">
                <div class="event-header">
                  <span class="event-type">{{ event.description }}</span>
                  <span class="event-time">{{ event.timestamp | timeAgo }}</span>
                </div>
                <span class="event-status" [class]="'status-' + event.status">
                  {{ event.status | titlecase }}
                </span>
              </div>
            </div>
          }
        </cdk-virtual-scroll-viewport>
      } @else {
        <div class="no-events">
          <mat-icon>event_available</mat-icon>
          <p>{{ 'crops.timeline.noEvents' | translate }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .timeline-panel {
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

    .timeline-container {
      position: relative;
      padding: 1rem 0 1rem 3rem;
      height: 500px;
      contain: layout style paint;
    }

    .timeline-track {
      position: absolute;
      left: 20px;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(180deg, #10b981, #34d399, #10b981);
      border-radius: 2px;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
    }

    .timeline-entry {
      position: relative;
      margin-bottom: 2rem;
      min-height: 80px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .timeline-marker {
      position: absolute;
      left: -38px;
      top: 4px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 2;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: white;
      }
    }

    .marker-success {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .marker-warning {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      animation: pulse 2s ease-in-out infinite;
    }

    .marker-error {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      50% {
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.5);
      }
    }

    .timeline-content {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid rgba(16, 185, 129, 0.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        border-color: rgba(16, 185, 129, 0.3);
      }
    }

    .content-success {
      border-left: 4px solid #10b981;
    }

    .content-warning {
      border-left: 4px solid #f59e0b;
    }

    .content-error {
      border-left: 4px solid #ef4444;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .event-type {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.9375rem;
    }

    .event-time {
      font-size: 0.75rem;
      color: #6b7280;
      font-weight: 500;
    }

    .event-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .status-success {
      background: rgba(16, 185, 129, 0.1);
      color: #047857;
    }

    .status-warning {
      background: rgba(245, 158, 11, 0.1);
      color: #b45309;
    }

    .status-error {
      background: rgba(239, 68, 68, 0.1);
      color: #b91c1c;
    }

    .no-events {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1rem;
      text-align: center;
      color: #9ca3af;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }

    /* Scrollbar */
    .timeline-container::-webkit-scrollbar {
      width: 6px;
    }

    .timeline-container::-webkit-scrollbar-track {
      background: rgba(16, 185, 129, 0.1);
      border-radius: 3px;
    }

    .timeline-container::-webkit-scrollbar-thumb {
      background: rgba(16, 185, 129, 0.3);
      border-radius: 3px;

      &:hover {
        background: rgba(16, 185, 129, 0.5);
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .timeline-panel {
        padding: 1.5rem;
      }

      .timeline-container {
        padding-left: 2.5rem;
      }

      .timeline-marker {
        width: 32px;
        height: 32px;
        left: -34px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    /* Dark theme */
    :host-context(body.dark-theme) {
      .timeline-panel {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(16, 185, 129, 0.2);
      }

      .panel-header {
        border-bottom-color: rgba(16, 185, 129, 0.2);

        h2 {
          color: #f1f5f9;
        }
      }

      .timeline-track {
        background: linear-gradient(180deg, rgba(16, 185, 129, 0.6), rgba(52, 211, 153, 0.5), rgba(16, 185, 129, 0.6));
      }

      .timeline-marker {
        border-color: rgba(30, 41, 59, 0.9);
      }

      .timeline-content {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(16, 185, 129, 0.2);

        &:hover {
          border-color: rgba(16, 185, 129, 0.4);
        }
      }

      .event-type {
        color: #e2e8f0;
      }

      .event-time {
        color: #94a3b8;
      }

      .no-events {
        color: #64748b;
      }
    }
  `]
})
export class EventsTimelineComponent {
  events = input<CropEvent[] | null>(null);

  getEventIcon(type: string): string {
    const icons: Record<string, string> = {
      irrigation: 'water_drop',
      fertilizer: 'spa',
      disease: 'warning',
      action: 'settings'
    };
    return icons[type] || 'event';
  }
}

