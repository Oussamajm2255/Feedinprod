import { Component, OnInit, input, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiService } from '../../../core/services/api.service';
import { ActionLog } from '../../../core/models/action-log.model';
import { AppNotification } from '../../../core/models/notification.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';

interface TimelineEvent {
  id: string;
  type: 'action' | 'alert' | 'notification';
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  icon: string;
  color: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  metadata?: any;
}

interface TimelineGroup {
  label: string;
  date: Date;
  events: TimelineEvent[];
}

@Component({
  selector: 'app-crop-events-timeline',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    TranslatePipe
  ],
  template: `
    <mat-card class="events-timeline">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>history</mat-icon>
          {{ 'crops.timeline.title' | translate }}
        </mat-card-title>
        <mat-card-subtitle>
          {{ 'crops.timeline.subtitle' | translate }}
        </mat-card-subtitle>
        <div class="header-actions">
          <button
            mat-icon-button
            (click)="refreshEvents()"
            [matTooltip]="'common.refresh' | translate">
            <mat-icon>refresh</mat-icon>
          </button>
          <button
            mat-icon-button
            [matBadge]="unreadCount()"
            [matBadgeHidden]="unreadCount() === 0"
            matBadgeColor="warn"
            (click)="markAllRead()"
            [matTooltip]="'crops.timeline.actions.markAllRead' | translate">
            <mat-icon>done_all</mat-icon>
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <!-- Filter Chips -->
        <div class="filter-chips">
          <mat-chip-set>
            <mat-chip
              [highlighted]="activeFilter() === 'all'"
              (click)="setFilter('all')">
              {{ 'crops.timeline.filters.all' | translate }}
            </mat-chip>
            <mat-chip
              [highlighted]="activeFilter() === 'actions'"
              (click)="setFilter('actions')">
              <mat-icon>touch_app</mat-icon>
              {{ 'crops.timeline.filters.actions' | translate }}
            </mat-chip>
            <mat-chip
              [highlighted]="activeFilter() === 'alerts'"
              (click)="setFilter('alerts')">
              <mat-icon>warning</mat-icon>
              {{ 'crops.timeline.filters.alerts' | translate }}
            </mat-chip>
            <mat-chip
              [highlighted]="activeFilter() === 'notifications'"
              (click)="setFilter('notifications')">
              <mat-icon>notifications</mat-icon>
              {{ 'crops.timeline.filters.notifications' | translate }}
            </mat-chip>
          </mat-chip-set>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>{{ 'crops.timeline.loading' | translate }}</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && filteredGroups().length === 0" class="empty-state">
          <mat-icon>event_busy</mat-icon>
          <h3>{{ 'crops.timeline.empty.title' | translate }}</h3>
          <p>{{ getEmptyDescription() }}</p>
        </div>

        <!-- Timeline -->
        <div *ngIf="!loading() && filteredGroups().length > 0" class="timeline">
          <div *ngFor="let group of filteredGroups()" class="timeline-group">
            <div class="group-header">
              <span class="group-label">{{ group.label }}</span>
              <span class="group-count">{{ 'crops.timeline.groups.count' | translate:{ count: group.events.length } }}</span>
            </div>

            <div class="timeline-events">
              <div *ngFor="let event of group.events; let last = last"
                   class="timeline-event"
                   [class.last]="last"
                   [class]="'status-' + event.status">

                <div class="event-line"></div>

                <div class="event-icon" [style.background]="event.color + '20'">
                  <mat-icon [style.color]="event.color">{{ event.icon }}</mat-icon>
                </div>

                <div class="event-content">
                  <div class="event-header">
                    <h4>{{ event.title }}</h4>
                    <span class="event-time">{{ getRelativeTime(event.timestamp) }}</span>
                  </div>

                  <p class="event-description">{{ event.description }}</p>

                  <div class="event-meta">
                    <span class="event-source">
                      <mat-icon>{{ event.type === 'action' ? 'touch_app' : 'info' }}</mat-icon>
                      {{ event.source }}
                    </span>
                    <span class="event-timestamp">
                      {{ event.timestamp | date:'short' }}
                    </span>
                  </div>

                  <!-- Action Status Badge -->
                  <mat-chip *ngIf="event.status" [class]="'chip-' + event.status">
                    {{ getEventStatusLabel(event.status) }}
                  </mat-chip>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More Button -->
        <div *ngIf="hasMore() && !loading()" class="load-more">
          <button mat-stroked-button (click)="loadMore()">
            <mat-icon>expand_more</mat-icon>
            {{ 'crops.timeline.actions.loadMore' | translate }}
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    /* === TERRAFLOW DESIGN - EVENTS TIMELINE === */
    .events-timeline {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      transition: all 0.3s ease;

      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-primary, #1f2937);
        }

        .header-actions {
          display: flex;
          gap: 0.25rem;
        }
      }

      mat-card-content {
        padding: 0 !important;
      }
    }

    .filter-chips {
      padding: 1rem;
      background: var(--light-bg, #f9fafb);
      border-bottom: 1px solid var(--border-color, #e5e7eb);

      mat-chip-set {
        mat-chip {
          cursor: pointer;
          transition: all 0.2s;
          background: var(--card-bg, #ffffff);
          color: var(--text-primary, #1f2937);

          &[highlighted] {
            background: rgba(16, 185, 129, 0.15);
            color: var(--primary-green, #10b981);
            font-weight: 600;
          }

          mat-icon {
            margin-right: 0.25rem;
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: var(--text-secondary, #6b7280);
      gap: 1rem;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.5;
      }

      h3 {
        margin: 0;
        color: var(--text-primary, #1f2937);
      }

      p {
        margin: 0;
        color: var(--text-secondary, #6b7280);
      }
    }

    .timeline {
      padding: 1rem;

      .timeline-group {
        margin-bottom: 2rem;

        &:last-child {
          margin-bottom: 0;
        }

        .group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(16, 185, 129, 0.08);
          border-radius: 8px;
          margin-bottom: 1rem;

          .group-label {
            font-weight: 600;
            color: var(--primary-green, #10b981);
            font-size: 0.95rem;
          }

          .group-count {
            font-size: 0.8rem;
            color: var(--text-secondary, #6b7280);
          }
        }

        .timeline-events {
          position: relative;
          padding-left: 2rem;

          .timeline-event {
            position: relative;
            padding-bottom: 1.5rem;

            &.last {
              padding-bottom: 0;

              .event-line {
                display: none;
              }
            }

            .event-line {
              position: absolute;
              left: 20px;
              top: 48px;
              bottom: 0;
              width: 2px;
              background: var(--border-color, #e5e7eb);
            }

            .event-icon {
              position: absolute;
              left: 0;
              top: 0;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--card-bg, #ffffff);
              border: 2px solid var(--border-color, #e5e7eb);
              z-index: 1;

              mat-icon {
                font-size: 20px;
                width: 20px;
                height: 20px;
              }
            }

            .event-content {
              margin-left: 3rem;
              padding: 1rem;
              background: var(--card-bg, #ffffff);
              border-radius: 8px;
              border: 1px solid var(--border-color, #e5e7eb);
              transition: all 0.2s;

              &:hover {
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
                border-color: rgba(16, 185, 129, 0.3);
              }

              .event-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.5rem;

                h4 {
                  margin: 0;
                  font-size: 0.95rem;
                  font-weight: 600;
                  color: var(--text-primary, #1f2937);
                }

                .event-time {
                  font-size: 0.75rem;
                  color: var(--text-secondary, #6b7280);
                  white-space: nowrap;
                }
              }

              .event-description {
                margin: 0 0 0.75rem 0;
                font-size: 0.875rem;
                color: var(--text-secondary, #6b7280);
                line-height: 1.5;
              }

              .event-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
                margin-bottom: 0.5rem;

                .event-source {
                  display: flex;
                  align-items: center;
                  gap: 0.25rem;
                  font-size: 0.75rem;
                  color: var(--text-secondary, #6b7280);

                  mat-icon {
                    font-size: 16px;
                    width: 16px;
                    height: 16px;
                  }
                }

                .event-timestamp {
                  font-size: 0.7rem;
                  color: var(--text-secondary, #6b7280);
                  opacity: 0.7;
                }
              }

              mat-chip {
                height: 24px;
                font-size: 0.7rem;

                &.chip-success {
                  background: #e8f5e9;
                  color: #2e7d32;
                }

                &.chip-warning {
                  background: #fff3e0;
                  color: #f57c00;
                }

                &.chip-error {
                  background: #ffebee;
                  color: #c62828;
                }

                &.chip-info {
                  background: #e3f2fd;
                  color: #1976d2;
                }
              }
            }

            &.status-warning {
              .event-icon {
                border-color: #ff9800;
              }
            }

            &.status-error {
              .event-icon {
                border-color: #f44336;
              }
            }
          }
        }
      }
    }

    .load-more {
      display: flex;
      justify-content: center;
      padding: 1rem;
      border-top: 1px solid var(--border-color, #e5e7eb);

      button {
        mat-icon {
          margin-right: 0.5rem;
        }
      }
    }

    /* === DARK MODE SUPPORT === */
    :host-context(body.dark-theme) {
      .events-timeline {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);
      }

      .filter-chips {
        background: var(--light-bg, #0f172a);
        border-bottom-color: var(--border-color, #334155);
      }

      .timeline .timeline-group {
        .group-header {
          background: rgba(16, 185, 129, 0.12);
        }

        .timeline-events .timeline-event {
          .event-content {
            background: var(--card-bg, #1e293b);
            border-color: var(--border-color, #334155);

            &:hover {
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
              border-color: rgba(16, 185, 129, 0.4);
            }
          }

          .event-icon {
            background: var(--card-bg, #1e293b);
            border-color: var(--border-color, #334155);
          }
        }
      }
    }

    @media (max-width: 768px) {
      .timeline .timeline-group .timeline-events {
        padding-left: 1.5rem;

        .timeline-event {
          .event-icon {
            width: 32px;
            height: 32px;

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }

          .event-content {
            margin-left: 2.5rem;
          }
        }
      }
    }
  `]
})
export class CropEventsTimelineComponent implements OnInit {
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);

  // Inputs
  cropId = input.required<string>();
  sensors = input.required<any[]>();

  // Local state
  activeFilter = signal<'all' | 'actions' | 'alerts' | 'notifications'>('all');
  loading = signal(false);
  events = signal<TimelineEvent[]>([]);
  limit = signal(20);
  offset = signal(0);
  hasMore = signal(true);
  unreadCount = signal(0);

  // Computed
  groupedEvents = computed(() => {
    return this.groupEventsByDate(this.events());
  });

  filteredGroups = computed(() => {
    const filter = this.activeFilter();
    const groups = this.groupedEvents();

    if (filter === 'all') return groups;

    return groups
      .map(group => ({
        ...group,
        events: group.events.filter(e => {
          if (filter === 'actions') return e.type === 'action';
          if (filter === 'alerts') return e.type === 'alert';
          if (filter === 'notifications') return e.type === 'notification';
          return true;
        })
      }))
      .filter(group => group.events.length > 0);
  });

  ngOnInit(): void {
    this.loadEvents();
    this.loadUnreadCount();
  }

  setFilter(filter: 'all' | 'actions' | 'alerts' | 'notifications'): void {
    this.activeFilter.set(filter);
  }

  refreshEvents(): void {
    this.offset.set(0);
    this.loadEvents(true);
  }

  loadMore(): void {
    this.offset.set(this.offset() + this.limit());
    this.loadEvents(false, true);
  }

  markAllRead(): void {
    (this.apiService.markAllNotificationsRead() as any)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.unreadCount.set(0);
          // Update local state
          const updated = this.events().map(e => ({
            ...e,
            metadata: { ...(e.metadata || {}), is_read: true }
          }));
          this.events.set(updated);
        },
        error: (err: any) => console.error('Error marking all as read:', err)
      });
  }

  private loadEvents(refresh = false, append = false): void {
    this.loading.set(true);

    const sensors = this.sensors();
    const sensorIds = sensors.map(s => s.sensor_id);

    // Load both actions and notifications in parallel
    import('rxjs').then(({ forkJoin }) => {
      forkJoin({
        actions: (this.apiService.getActions({
          limit: this.limit(),
          offset: refresh ? 0 : this.offset()
        }) as any),
        notifications: (this.apiService.getNotifications({
          limit: this.limit(),
          offset: refresh ? 0 : this.offset()
        }) as any)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ actions, notifications }: any) => {
          const actionEvents = this.mapActionsToEvents(actions.items || []);
          const notificationEvents = this.mapNotificationsToEvents(notifications.items || []);

          const allEvents = [...actionEvents, ...notificationEvents]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

          if (append) {
            this.events.set([...this.events(), ...allEvents]);
          } else {
            this.events.set(allEvents);
          }

          this.hasMore.set(allEvents.length === this.limit());
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error loading events:', err);
          this.loading.set(false);
        }
      });
    });
  }

  private loadUnreadCount(): void {
    (this.apiService.getNotificationsUnreadCount() as any)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.unreadCount.set(response.count || 0);
        },
        error: (err: any) => console.error('Error loading unread count:', err)
      });
  }

  private mapActionsToEvents(actions: ActionLog[]): TimelineEvent[] {
    return actions.map(action => {
      // Safely parse the date
      const timestamp = action.created_at ? new Date(action.created_at) : new Date();
      const actionLabel = action.action_type || this.languageService.translate('crops.timeline.events.actionDefault');
      const deviceLabel = action.device_id || this.languageService.translate('crops.timeline.events.deviceDefault');
      const sourceLabel = action.trigger_source || this.languageService.translate('crops.timeline.events.systemSource');
      
      return {
        id: action.id,
        type: 'action' as const,
        title: this.languageService.translate('crops.timeline.events.actionTitle', {
          action: actionLabel,
          device: deviceLabel
        }),
        description: this.languageService.translate('crops.timeline.events.actionDescription', {
          source: sourceLabel
        }),
        timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
        source: sourceLabel,
        icon: this.getActionIcon(action.action_type || ''),
        color: this.getActionColor(action.status),
        status: this.mapActionStatus(action.status),
        metadata: action
      };
    });
  }

  private mapNotificationsToEvents(notifications: AppNotification[]): TimelineEvent[] {
    return notifications.map(notification => {
      // Safely parse the date
      const timestamp = notification.createdAt ? new Date(notification.createdAt) : new Date();
      const sourceLabel = notification.source || this.languageService.translate('crops.timeline.events.systemSource');
      
      return {
        id: notification.id,
        type: (notification.level === 'warning' || notification.level === 'critical' ? 'alert' : 'notification') as 'action' | 'alert' | 'notification',
        title: notification.title,
        description: notification.message || this.languageService.translate('crops.timeline.events.noDescription'),
        timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
        source: sourceLabel,
        icon: this.getNotificationIcon(notification.level),
        color: this.getNotificationColor(notification.level),
        status: this.mapNotificationStatus(notification.level),
        metadata: notification
      };
    });
  }

  private groupEventsByDate(events: TimelineEvent[]): TimelineGroup[] {
    const groups = new Map<string, TimelineEvent[]>();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    events.forEach(event => {
      const eventDate = new Date(event.timestamp);
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

      let label: string;
      if (eventDay.getTime() === today.getTime()) {
        label = this.languageService.translate('crops.timeline.groups.today');
      } else if (eventDay.getTime() === yesterday.getTime()) {
        label = this.languageService.translate('crops.timeline.groups.yesterday');
      } else {
        const formatter = new Intl.DateTimeFormat(this.languageService.getCurrentLanguageCode(), {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        });
        label = formatter.format(eventDate);
      }

      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(event);
    });

    return Array.from(groups.entries()).map(([label, events]) => ({
      label,
      date: events[0].timestamp,
      events
    }));
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return this.languageService.translate('crops.common.relative.justNow');
    }
    if (minutes < 60) {
      return this.languageService.translate('crops.common.relative.minutesAgo', { count: minutes });
    }
    if (hours < 24) {
      return this.languageService.translate('crops.common.relative.hoursAgo', { count: hours });
    }
    if (days === 1) {
      return this.languageService.translate('crops.common.relative.yesterday');
    }
    if (days < 7) {
      return this.languageService.translate('crops.common.relative.daysAgo', { count: days });
    }

    const formatter = new Intl.DateTimeFormat(this.languageService.getCurrentLanguageCode(), {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
    return formatter.format(new Date(date));
  }

  getEmptyDescription(): string {
    const filterLabel = this.getFilterLabel(this.activeFilter());
    return this.languageService.translate('crops.timeline.empty.description', { filter: filterLabel });
  }

  getEventStatusLabel(status: string): string {
    return this.languageService.translate(`crops.timeline.status.${status}`);
  }

  private getFilterLabel(filter: 'all' | 'actions' | 'alerts' | 'notifications'): string {
    const key = `crops.timeline.filters.${filter}`;
    return this.languageService.translate(key);
  }

  private getActionIcon(actionType: string): string {
    const type = actionType?.toLowerCase() || '';
    if (type.includes('on') || type.includes('start')) return 'power_settings_new';
    if (type.includes('off') || type.includes('stop')) return 'power_off';
    if (type.includes('water') || type.includes('irrigation')) return 'water_drop';
    return 'touch_app';
  }

  private getActionColor(status?: string): string {
    switch (status) {
      case 'ack': return '#4caf50';
      case 'error': return '#f44336';
      case 'sent': return '#2196f3';
      default: return '#9e9e9e';
    }
  }

  private getNotificationIcon(level: string): string {
    switch (level) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'notifications';
    }
  }

  private getNotificationColor(level: string): string {
    switch (level) {
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'info': return '#2196f3';
      default: return '#9e9e9e';
    }
  }

  private mapActionStatus(status?: string): 'success' | 'warning' | 'error' | 'info' {
    switch (status) {
      case 'ack': return 'success';
      case 'error': return 'error';
      case 'sent': return 'info';
      default: return 'info';
    }
  }

  private mapNotificationStatus(level: string): 'success' | 'warning' | 'error' | 'info' {
    switch (level) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }
}
