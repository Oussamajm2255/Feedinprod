// notifications.component.ts - REDESIGNED FOR 2025

import { Component, inject, OnInit, OnDestroy, computed, signal, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { NotificationService } from '../../core/services/notification.service';
import { ApiService } from '../../core/services/api.service';
import { FarmManagementService } from '../../core/services/farm-management.service';
import { LanguageService } from '../../core/services/language.service';
import { AppNotification } from '../../core/models/notification.model';

// Date grouping helper
type DateGroup = 'today-morning' | 'today-afternoon' | 'yesterday' | 'this-week' | 'older';

interface GroupedNotifications {
  group: DateGroup;
  label: string;
  notifications: AppNotification[];
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="insight-stream-container" [attr.dir]="currentDirection()">

      <!-- 1️⃣ KPI HEADER BAR - Enhanced with better empty states -->
      <div class="kpi-bar glass-panel">
        <div class="kpi-stats">
          <div class="kpi-item" 
               [class.zero-state]="kpiStats().total === 0"
               [matTooltip]="kpiStats().total === 0 ? languageService.t()('notifications.noNotificationsYet') : languageService.t()('notifications.totalNotifications')">
            <mat-icon>{{ kpiStats().total === 0 ? 'notifications_none' : 'notifications' }}</mat-icon>
            <div class="kpi-value">
              <span class="number">{{ kpiStats().total }}</span>
              <span class="label">{{ languageService.t()('notifications.total') }}</span>
              <span class="status-text" *ngIf="kpiStats().total === 0">{{ languageService.t()('notifications.allClear') }}</span>
            </div>
          </div>

          <div class="kpi-item unread" 
               [class.zero-state]="kpiStats().unread === 0"
               [matTooltip]="kpiStats().unread === 0 ? languageService.t()('notifications.allCaughtUp') : languageService.t()('notifications.unread')">
            <mat-icon>{{ kpiStats().unread === 0 ? 'mark_email_read' : 'mark_email_unread' }}</mat-icon>
            <div class="kpi-value">
              <span class="number">{{ kpiStats().unread }}</span>
              <span class="label">{{ languageService.t()('notifications.unread') }}</span>
              <span class="status-text" *ngIf="kpiStats().unread === 0">{{ languageService.t()('notifications.upToDate') }}</span>
            </div>
          </div>

          <div class="kpi-item critical" 
               [class.zero-state]="kpiStats().critical === 0"
               [matTooltip]="kpiStats().critical === 0 ? languageService.t()('notifications.noCriticalIssues') : languageService.t()('notifications.critical')">
            <mat-icon>{{ kpiStats().critical === 0 ? 'check_circle' : 'priority_high' }}</mat-icon>
            <div class="kpi-value">
              <span class="number">{{ kpiStats().critical }}</span>
              <span class="label">{{ languageService.t()('notifications.critical') }}</span>
              <span class="status-text" *ngIf="kpiStats().critical === 0">{{ languageService.t()('notifications.allGood') }}</span>
            </div>
          </div>

          <div class="kpi-item updated" [matTooltip]="languageService.t()('notifications.lastUpdated')">
            <mat-icon>schedule</mat-icon>
            <div class="kpi-value">
              <span class="time-label">{{ kpiStats().lastUpdated }}</span>
            </div>
          </div>
        </div>

        <div class="kpi-actions">
          <button mat-raised-button
                  class="glass-button primary"
                  (click)="markAllRead()"
                  *ngIf="kpiStats().unread > 0"
                  [matTooltip]="languageService.t()('notifications.markAllRead')">
            <mat-icon>done_all</mat-icon>
            {{ languageService.t()('notifications.markAllRead') }}
          </button>
        </div>
      </div>

      <!-- 2️⃣ COMPACT FILTER & VIEW MODE SECTION -->
      <div class="filter-section" *ngIf="cacheReady">
        <!-- Compact Horizontal Filter Bar -->
        <div class="filter-bar">
          <!-- Quick Filter Chips -->
          <div class="filter-chips">
            <mat-chip-listbox [(ngModel)]="activeFilters" [multiple]="false" class="glass-chips">
              <mat-chip-option
                *ngFor="let filter of availableFilters()"
                [value]="filter.value"
                [selected]="activeFilters === filter.value"
                (click)="onFilterChange(filter.value)">
                <mat-icon>{{ filter.icon }}</mat-icon>
                {{ filter.label }}
                <span class="chip-badge" *ngIf="filter.count && filter.count > 0">{{ filter.count }}</span>
              </mat-chip-option>
            </mat-chip-listbox>
          </div>

          <!-- View Switcher (Map view removed) -->
          <div class="view-switcher">
            <button mat-icon-button
                    class="view-button"
                    [class.active]="activeView() === 'list'"
                    (click)="setView('list')"
                    [matTooltip]="languageService.t()('notifications.listView')">
              <mat-icon>view_list</mat-icon>
            </button>
            <button mat-icon-button
                    class="view-button"
                    [class.active]="activeView() === 'timeline'"
                    (click)="setView('timeline')"
                    [matTooltip]="languageService.t()('notifications.timelineView')">
              <mat-icon>timeline</mat-icon>
            </button>
          </div>

          <!-- Enhanced Refresh Button with Status Centered at Bottom -->
          <button mat-button
                  class="refresh-button enhanced"
                  (click)="refreshNotifications()"
                  [disabled]="loading"
                  [matTooltip]="languageService.t()('notifications.refresh')">
            <div class="refresh-icon-wrapper">
              <mat-icon [class.spinning]="loading">refresh</mat-icon>
            </div>
            <span class="refresh-time" *ngIf="getLastRefreshTime() && !loading">{{ getLastRefreshTime() }}</span>
          </button>

          <!-- Advanced Filters Toggle -->
          <button class="filter-toggle"
                  [class.expanded]="filterPanelExpanded()"
                  (click)="toggleFilterPanel()">
            <mat-icon>{{ filterPanelExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            <span>{{ languageService.t()('notifications.advanced') }}</span>
          </button>
        </div>

        <!-- Collapsible Advanced Filter Panel - Enhanced like Actions -->
        <div class="filter-panel" [class.expanded]="filterPanelExpanded()">
          <div class="filter-controls-wrapper">
            <!-- Filter Inputs Row -->
            <div class="filter-controls">
              <mat-form-field appearance="outline" class="filter-field" *ngIf="availableFarms().length > 0">
                <mat-label>{{ languageService.t()('notifications.farm') }}</mat-label>
                <mat-select [(ngModel)]="selectedFarm" (selectionChange)="onFarmChange()">
                  <mat-option [value]="null">{{ languageService.t()('notifications.allFarms') }}</mat-option>
                  <mat-option *ngFor="let farm of availableFarms()" [value]="farm">
                    {{ farm }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field" *ngIf="availableDevices().length > 0">
                <mat-label>{{ languageService.t()('notifications.device') }}</mat-label>
                <mat-select [(ngModel)]="selectedDevice" (selectionChange)="onDeviceChange()">
                  <mat-option [value]="null">{{ languageService.t()('notifications.allDevices') }}</mat-option>
                  <mat-option *ngFor="let device of availableDevices()" [value]="device">
                    {{ device }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field search-field">
                <mat-label>{{ languageService.t()('notifications.search') }}</mat-label>
                <mat-icon matPrefix>search</mat-icon>
                <input matInput
                       [(ngModel)]="searchQuery"
                       (ngModelChange)="onSearchChange()"
                       [placeholder]="languageService.t()('notifications.searchPlaceholder')">
                <button mat-icon-button matSuffix *ngIf="searchQuery" (click)="clearSearch()">
                  <mat-icon>close</mat-icon>
                </button>
              </mat-form-field>

              <!-- Clear All Filters Button - Same Level as Filter Inputs -->
              <button mat-raised-button
                      class="clear-filters-button"
                      (click)="clearAllFilters()"
                      [matTooltip]="languageService.t()('notifications.clearAllFilters')">
                <mat-icon>clear_all</mat-icon>
                <span>{{ languageService.t()('notifications.clearAllFilters') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- LOADING STATE -->
      <div class="loading-state glass-panel" *ngIf="!cacheReady">
        <div class="loading-spinner">
          <mat-spinner diameter="60"></mat-spinner>
        </div>
        <p class="loading-text">{{ languageService.t()('notifications.loadingFarmData') }}</p>
        <p class="loading-subtext">{{ languageService.t()('notifications.preparingInsights') }}</p>
      </div>

      <!-- 3️⃣ NOTIFICATION STREAM - LIST VIEW -->
      <div class="notification-stream" *ngIf="cacheReady && activeView() === 'list'">
        <div *ngFor="let group of groupedNotifications()" class="date-group">
          <div class="date-group-header">
            <span class="date-label">{{ group.label }}</span>
            <span class="date-count">{{ group.notifications.length }}</span>
          </div>

          <div class="notifications-grid">
            <div *ngFor="let n of group.notifications; trackBy: trackById"
                 class="notification-card glass-card"
                 [class.unread]="!n.read"
                 [class.expanded]="expandedCardId() === n.id"
                 [attr.data-level]="n.level"
                 (click)="toggleCardExpansion(n.id)">

              <!-- Card Glow Effect -->
              <div class="card-glow" [attr.data-level]="n.level"></div>

              <!-- Left Icon -->
              <div class="card-icon" [class]="getIconClass(n)">
                <mat-icon>{{ getFarmerIcon(n) }}</mat-icon>
                <div class="pulse-ring" *ngIf="!n.read"></div>
              </div>

              <!-- Middle Content -->
              <div class="card-content">
                <div class="card-header">
                  <h3 class="card-title">{{ getFarmerTitle(n) }}</h3>
                  <span class="card-time">{{ getFarmerTime(n.createdAt) }}</span>
                </div>

                <p class="card-message">{{ getFarmerMessage(n) }}</p>

                <div class="card-action" *ngIf="getFarmerAction(n) && expandedCardId() !== n.id">
                  <mat-icon>lightbulb</mat-icon>
                  <span>{{ getFarmerAction(n) }}</span>
                </div>

                <div class="card-meta">
                  <mat-chip [class]="getPriorityChipClass(n)" size="small">
                    {{ getFarmerPriority(n) }}
                  </mat-chip>
                  <span class="meta-location" *ngIf="getLocation(n) as location">
                    <mat-icon>location_on</mat-icon>
                    {{ location }}
                  </span>
                </div>

                <!-- EXPANDED DETAILS -->
                <div class="card-expanded" *ngIf="expandedCardId() === n.id">
                  <mat-divider></mat-divider>

                  <div class="expanded-content">
                    <div class="expanded-row">
                      <mat-icon>schedule</mat-icon>
                      <span class="expanded-label">{{ languageService.t()('notifications.created') }}:</span>
                      <span class="expanded-value">{{ formatFullDate(n.createdAt) }}</span>
                    </div>

                    <div class="expanded-row" *ngIf="getLocation(n) as location">
                      <mat-icon>location_on</mat-icon>
                      <span class="expanded-label">{{ languageService.t()('notifications.location') }}:</span>
                      <span class="expanded-value">{{ location }}</span>
                    </div>

                    <div class="expanded-row" *ngIf="n.source">
                      <mat-icon>source</mat-icon>
                      <span class="expanded-label">{{ languageService.t()('notifications.source') }}:</span>
                      <span class="expanded-value">{{ n.source }}</span>
                    </div>

                    <div class="expanded-action" *ngIf="getFarmerAction(n)">
                      <mat-icon>lightbulb</mat-icon>
                      <div>
                        <strong>{{ languageService.t()('notifications.suggestedAction') }}:</strong>
                        <p>{{ getFarmerAction(n) }}</p>
                      </div>
                    </div>

                    <div class="expanded-context" *ngIf="n.context">
                      <mat-icon>info</mat-icon>
                      <div>
                        <strong>{{ languageService.t()('notifications.context') }}:</strong>
                        <p>{{ formatContext(n.context) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Actions -->
              <div class="card-actions">
                <button mat-icon-button
                        class="action-button"
                        (click)="markRead(n); $event.stopPropagation()"
                        *ngIf="!n.read"
                        [matTooltip]="languageService.t()('notifications.markAsRead')">
                  <mat-icon>check</mat-icon>
                </button>
                <button mat-icon-button
                        class="action-button delete"
                        (click)="remove(n); $event.stopPropagation()"
                        [matTooltip]="languageService.t()('notifications.dismiss')">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3️⃣ NOTIFICATION STREAM - TIMELINE VIEW -->
      <div class="notification-timeline" *ngIf="cacheReady && activeView() === 'timeline'">
        <div class="timeline-container">
          <div *ngFor="let n of filteredNotifications(); let i = index; trackBy: trackById"
               class="timeline-item"
               [class.unread]="!n.read"
               [attr.data-level]="n.level">

            <div class="timeline-marker">
              <div class="marker-dot" [attr.data-level]="n.level">
                <mat-icon>{{ getFarmerIcon(n) }}</mat-icon>
              </div>
              <div class="timeline-line" *ngIf="i < filteredNotifications().length - 1"></div>
            </div>

            <div class="timeline-content glass-card">
              <div class="timeline-time">{{ getFarmerTime(n.createdAt) }}</div>
              <h4>{{ getFarmerTitle(n) }}</h4>
              <p>{{ getFarmerMessage(n) }}</p>

              <div class="timeline-meta">
                <mat-chip [class]="getPriorityChipClass(n)" size="small">
                  {{ getFarmerPriority(n) }}
                </mat-chip>
                <span *ngIf="getLocation(n) as location">
                  <mat-icon>location_on</mat-icon>
                  {{ location }}
                </span>
              </div>

              <div class="timeline-actions">
                <button mat-icon-button (click)="markRead(n)" *ngIf="!n.read">
                  <mat-icon>check</mat-icon>
                </button>
                <button mat-icon-button (click)="remove(n)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4️⃣ INFINITE SCROLL SENTINEL -->
      <div #scrollSentinel class="scroll-sentinel" *ngIf="hasMoreNotifications && !loading"></div>

      <!-- LOAD MORE BUTTON (Fallback) -->
      <div class="load-more-section" *ngIf="hasMoreNotifications && !loading">
        <button mat-raised-button
                class="glass-button load-more"
                (click)="loadMore()"
                [disabled]="loadingMore">
          <mat-spinner *ngIf="loadingMore" diameter="20"></mat-spinner>
          <mat-icon *ngIf="!loadingMore">expand_more</mat-icon>
          {{ loadingMore ? languageService.t()('notifications.loading') : languageService.t()('notifications.showMore') }}
        </button>
        <p class="load-info">
          {{ languageService.t()('notifications.showing') }} {{ list.length }} {{ languageService.t()('notifications.of') }} {{ total }}
        </p>
      </div>

      <!-- LOADING MORE SPINNER -->
      <div class="loading-more-spinner" *ngIf="loadingMore">
        <div class="gradient-spinner"></div>
      </div>

      <!-- 6️⃣ EMPTY STATE -->
      <div class="empty-state glass-panel" *ngIf="cacheReady && filteredNotifications().length === 0 && !loading">
        <div class="empty-icon">
          <mat-icon>notifications_off</mat-icon>
          <div class="icon-glow"></div>
        </div>
        <h3>{{ languageService.t()('notifications.noNotifications') }}</h3>
        <p class="calm-message">{{ languageService.t()('notifications.everythingCalm') }} 🌿</p>

        <div class="empty-tips" *ngIf="list.length === 0">
          <p>{{ languageService.t()('notifications.youWillGetNotified') }}</p>
        </div>
      </div>

      <!-- THEME/LANGUAGE TRANSITION OVERLAY -->
      <div class="transition-overlay" *ngIf="showTransition"></div>
    </div>
  `,
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  constructor() {
    console.log('🏗️ [NOTIFICATIONS] Component constructor called');

    // React to language changes
    effect(() => {
      const lang = this.languageService.currentLanguage();
      this.triggerTransition();
      console.log('🌐 Language changed to:', lang);
    });
  }

  // INJECTED SERVICES (PRESERVED)
  private svc = inject(NotificationService);
  private api = inject(ApiService);
  private farmManagement = inject(FarmManagementService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  public languageService = inject(LanguageService);

  // EXISTING DATA STATE (PRESERVED)
  list: AppNotification[] = [];
  total = 0;
  pageSize = 20;
  loading = false;
  loadingMore = false;
  hasMoreNotifications = false;
  cacheReady = false;

  private farmDeviceCache = new Map<string, string>();
  private deviceLocationCache = new Map<string, string>();
  private locationCache = new Map<string, string>();

  // NEW UI STATE SIGNALS
  activeView = signal<'list' | 'timeline' | 'map'>('list');
  activeFilters = 'all';
  selectedFarm = signal<string | null>(null);
  selectedDevice = signal<string | null>(null);
  searchQuery = '';
  expandedCardId = signal<string | null>(null);
  showTransition = signal(false);
  filterPanelExpanded = signal(false); // Default: collapsed

  @ViewChild('scrollSentinel') scrollSentinel?: ElementRef;
  private intersectionObserver?: IntersectionObserver;
  
  // Auto-refresh functionality
  private autoRefreshInterval?: number;
  public autoRefreshEnabled = signal(true);
  private lastRefreshTime = signal<Date | null>(null);
  
  // Search debouncing
  private searchTimeout?: number;

  // COMPUTED SIGNALS FOR UI
  kpiStats = computed(() => {
    const notifications = this.list;
    const unread = notifications.filter(n => !n.read).length;
    const critical = notifications.filter(n => n.level === 'critical').length;
    const lastNotification = notifications[0];
    const lastUpdated = lastNotification
      ? this.getFarmerTime(lastNotification.createdAt)
      : this.languageService.t()('notifications.never');

    return {
      total: notifications.length,
      unread,
      critical,
      lastUpdated
    };
  });

  availableFilters = computed(() => {
    const t = this.languageService.t();
    return [
      { value: 'all', label: t('notifications.all'), icon: 'apps', count: this.list.length },
      { value: 'critical', label: t('notifications.critical'), icon: 'priority_high', count: this.list.filter(n => n.level === 'critical').length },
      { value: 'warning', label: t('notifications.warning'), icon: 'warning', count: this.list.filter(n => n.level === 'warning').length },
      { value: 'unread', label: t('notifications.unread'), icon: 'mark_email_unread', count: this.list.filter(n => !n.read).length },
      { value: 'read', label: t('notifications.read'), icon: 'mark_email_read', count: this.list.filter(n => n.read).length },
    ];
  });

  availableFarms = computed(() => {
    const farms = new Set<string>();
    this.farmDeviceCache.forEach(farmName => farms.add(farmName));
    return Array.from(farms).sort();
  });

  availableDevices = computed(() => {
    const devices = new Set<string>();
    this.farmDeviceCache.forEach((_, deviceId) => devices.add(deviceId));
    return Array.from(devices).sort();
  });

  filteredNotifications = computed(() => {
    let filtered = [...this.list];

    // Filter by level or read status
    if (this.activeFilters !== 'all') {
      if (this.activeFilters === 'unread') {
        filtered = filtered.filter(n => !n.read);
      } else if (this.activeFilters === 'read') {
        filtered = filtered.filter(n => n.read);
      } else {
        filtered = filtered.filter(n => n.level === this.activeFilters);
      }
    }

    // Filter by farm
    const farm = this.selectedFarm();
    if (farm) {
      filtered = filtered.filter(n => {
        const location = this.getLocation(n);
        return location?.includes(farm);
      });
    }

    // Filter by device
    const device = this.selectedDevice();
    if (device) {
      filtered = filtered.filter(n => {
        const deviceId = n.context?.deviceId || n.context?.device_id;
        return deviceId === device;
      });
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(n => {
        const title = this.getFarmerTitle(n).toLowerCase();
        const message = this.getFarmerMessage(n).toLowerCase();
        return title.includes(query) || message.includes(query);
      });
    }

    return filtered;
  });

  groupedNotifications = computed(() => {
    const notifications = this.filteredNotifications();
    const groups: GroupedNotifications[] = [];
    const t = this.languageService.t();

    const todayMorning: AppNotification[] = [];
    const todayAfternoon: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const thisWeek: AppNotification[] = [];
    const older: AppNotification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    notifications.forEach(n => {
      const date = new Date(n.createdAt);
      const hours = date.getHours();

      if (date >= todayStart) {
        if (hours < 12) {
          todayMorning.push(n);
        } else {
          todayAfternoon.push(n);
        }
      } else if (date >= yesterdayStart) {
        yesterday.push(n);
      } else if (date >= weekStart) {
        thisWeek.push(n);
      } else {
        older.push(n);
      }
    });

    if (todayMorning.length > 0) {
      groups.push({
        group: 'today-morning',
        label: t('notifications.todayMorning'),
        notifications: todayMorning
      });
    }

    if (todayAfternoon.length > 0) {
      groups.push({
        group: 'today-afternoon',
        label: t('notifications.todayAfternoon'),
        notifications: todayAfternoon
      });
    }

    if (yesterday.length > 0) {
      groups.push({
        group: 'yesterday',
        label: t('notifications.yesterday'),
        notifications: yesterday
      });
    }

    if (thisWeek.length > 0) {
      groups.push({
        group: 'this-week',
        label: t('notifications.thisWeek'),
        notifications: thisWeek
      });
    }

    if (older.length > 0) {
      groups.push({
        group: 'older',
        label: t('notifications.older'),
        notifications: older
      });
    }

    return groups;
  });

  currentDirection = computed(() => {
    return this.languageService.currentLanguage().startsWith('ar') ? 'rtl' : 'ltr';
  });

  // PRESERVED LIFECYCLE
  async ngOnInit() {
    console.log('🏗️ [NOTIFICATIONS] ngOnInit called');

    if (this.list.length > 0) {
      console.log('🏗️ [NOTIFICATIONS] Notifications already loaded, skipping');
      return;
    }

    this.locationCache.clear();
    this.farmDeviceCache.clear();
    this.deviceLocationCache.clear();
    this.cacheReady = false;

    console.log('🏗️ [NOTIFICATIONS] Building farm device cache...');
    await this.buildFarmDeviceCache();

    console.log('🏗️ [NOTIFICATIONS] Cache ready:', this.cacheReady);
    if (this.cacheReady) {
      console.log('🏗️ [NOTIFICATIONS] Loading notifications with default farm...');
      await this.loadDefaultNotifications();
      this.setupIntersectionObserver();
    } else {
      console.log('🏗️ [NOTIFICATIONS] Cache not ready, notifications not loaded');
    }

    this.svc.newNotification$.subscribe(n => {
      console.log('🔔 [NOTIFICATIONS] New notification received:', n);
      this.locationCache.delete(n.id);
      this.list = [n, ...this.list];
      this.showNotificationSnackbar(n);
    });

    // Setup auto-refresh (every 30 seconds)
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    // Clean up auto-refresh
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }

  // PRESERVED CACHE BUILD LOGIC
  private async buildFarmDeviceCache() {
    try {
      console.log('🏗️ [NOTIFICATIONS] Building farm device cache...');
      this.locationCache.clear();

      const farms = await this.farmManagement.farms();
      console.log('🏗️ [NOTIFICATIONS] Farms from farm management:', farms);

      if (!farms || farms.length === 0) {
        console.log('🏗️ [NOTIFICATIONS] No farms from farm management, trying API...');
        try {
          const directFarms = await this.api.getFarms().toPromise();
          console.log('🏗️ [NOTIFICATIONS] Farms from API:', directFarms);

          if (directFarms && directFarms.length > 0) {
            await this.processFarmsForCache(directFarms);
          } else {
            console.log('🏗️ [NOTIFICATIONS] No farms found, marking cache ready');
            this.cacheReady = true;
            return;
          }
        } catch (apiError) {
          console.error('🏗️ [NOTIFICATIONS] Error getting farms from API:', apiError);
          this.cacheReady = true;
          return;
        }
      } else {
        await this.processFarmsForCache(farms);
      }

      this.cacheReady = true;
      console.log('🏗️ [NOTIFICATIONS] Farm device cache built successfully');

    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error building farm-device cache:', error);
      this.cacheReady = false;
    }
  }

  private async processFarmsForCache(farms: any[]) {
    for (const farm of farms) {
      try {
        const farmDevices = await this.api.getDevicesByFarm(farm.farm_id).toPromise();

        if (farmDevices && farmDevices.length > 0) {
          farmDevices.forEach(device => {
            this.farmDeviceCache.set(device.device_id, farm.name);
            if (device.location) {
              this.deviceLocationCache.set(device.device_id, device.location);
            }
          });
        }
      } catch (deviceError) {
        console.error(`Error getting devices for farm ${farm.name}:`, deviceError);
      }
    }
  }

  // PRESERVED LOAD LOGIC
  async load(offset = 0, append = false) {
    if (!this.cacheReady) {
      console.log('🚫 [NOTIFICATIONS] Cache not ready, skipping load');
      return;
    }

    if (append) {
      this.loadingMore = true;
    } else {
      this.loading = true;
    }

    try {
      console.log('📡 [NOTIFICATIONS] Loading notifications from API...');
      const res = await this.api.getNotifications({ limit: this.pageSize, offset }).toPromise();
      console.log('📡 [NOTIFICATIONS] API response:', res);

      const items = res?.items ?? [];
      console.log('📡 [NOTIFICATIONS] Raw items:', items);

      const mappedItems = items.map((n: any) => ({
        id: n.id,
        level: n.level,
        title: n.title,
        message: n.message,
        createdAt: n.created_at || n.createdAt,
        read: !!(n.is_read ?? n.read),
        source: n.source,
        context: n.context,
      }));

      console.log('📡 [NOTIFICATIONS] Mapped items:', mappedItems);

      if (append) {
        this.list = [...this.list, ...mappedItems];
      } else {
        this.list = mappedItems;
      }

      this.total = res?.total ?? 0;
      this.hasMoreNotifications = this.list.length < this.total;

      console.log('📡 [NOTIFICATIONS] Final list length:', this.list.length);
      console.log('📡 [NOTIFICATIONS] Total notifications:', this.total);

    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error loading notifications:', error);
    } finally {
      this.loading = false;
      this.loadingMore = false;
    }
  }

  async loadMore() {
    if (this.loadingMore || !this.hasMoreNotifications) return;
    const currentOffset = this.list.length;
    await this.load(currentOffset, true);
  }

  // NEW: Auto-load with default farm selection
  async loadDefaultNotifications() {
    try {
      // Check if there's a selected farm from farm management service
      const farms = await this.farmManagement.farms();
      if (farms && farms.length > 0) {
        // Use the first farm as default if no specific farm is selected
        const defaultFarm = farms[0];
        this.selectedFarm.set(defaultFarm.name);
        console.log('🏗️ [NOTIFICATIONS] Auto-loading with default farm:', defaultFarm.name);
      } else {
        console.log('🏗️ [NOTIFICATIONS] No farms available, loading all notifications');
        this.selectedFarm.set(null);
      }
      
      // Load notifications with the selected farm filter
      await this.load();
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error in loadDefaultNotifications:', error);
      // Fallback to loading all notifications
      this.selectedFarm.set(null);
      await this.load();
    }
  }

  async refreshNotifications() {
    await this.load(0, false);
    this.lastRefreshTime.set(new Date());
    this.scrollToTop();
  }

  // Auto-refresh functionality
  private setupAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    // Auto-refresh every 30 seconds
    this.autoRefreshInterval = window.setInterval(() => {
      if (this.autoRefreshEnabled() && !this.loading) {
        this.refreshNotifications();
      }
    }, 30000);
  }

  toggleAutoRefresh() {
    this.autoRefreshEnabled.set(!this.autoRefreshEnabled());
    this.setupAutoRefresh();
  }

  getLastRefreshTime(): string {
    const lastRefresh = this.lastRefreshTime();
    if (!lastRefresh) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}m ago`;
    } else {
      return lastRefresh.toLocaleTimeString();
    }
  }

  notifications() { return this.list; }
  trackById(index: number, n: AppNotification) { return n.id; }

  // PRESERVED FARMER-FRIENDLY METHODS
  getUrgentCount(): number {
    return this.list.filter(n => n.level === 'critical').length;
  }

  getUnreadCount(): number {
    return this.list.filter(n => !n.read).length;
  }

  getNotificationClass(n: AppNotification): string {
    const classes = [];
    if (!n.read) classes.push('unread');
    if (n.level === 'critical') classes.push('urgent');
    else if (n.level === 'warning') classes.push('warning');
    else if (n.level === 'success') classes.push('success');
    return classes.join(' ');
  }

  getFarmerIcon(n: AppNotification): string {
    if (n.source === 'sensor') {
      if (n.title?.toLowerCase().includes('temperature')) return 'thermostat';
      if (n.title?.toLowerCase().includes('humidity')) return 'water_drop';
      if (n.title?.toLowerCase().includes('light')) return 'wb_sunny';
      return 'sensors';
    }

    if (n.source === 'device') {
      if (n.title?.toLowerCase().includes('irrigation')) return 'water';
      if (n.title?.toLowerCase().includes('ventilator') || n.title?.toLowerCase().includes('fan')) return 'air';
      if (n.title?.toLowerCase().includes('heater')) return 'local_fire_department';
      return 'devices';
    }

    if (n.source === 'action') {
      if (n.level === 'critical') return 'error';
      if (n.level === 'success') return 'check_circle';
      return 'play_arrow';
    }

    switch (n.level) {
      case 'critical': return 'warning';
      case 'warning': return 'info';
      case 'success': return 'check_circle';
      default: return 'notifications';
    }
  }

  getIconClass(n: AppNotification): string {
    switch (n.level) {
      case 'critical': return 'icon-urgent';
      case 'warning': return 'icon-warning';
      case 'success': return 'icon-success';
      default: return 'icon-info';
    }
  }

  getFarmerTitle(n: AppNotification): string {
    const title = n.title || '';

    if (title.includes('temperature') || title.includes('Temperature')) {
      if (title.includes('high') || title.includes('HIGH')) {
        return this.languageService.t()('notifications.temperatureTooHigh');
      }
      if (title.includes('low') || title.includes('LOW')) {
        return this.languageService.t()('notifications.temperatureTooLow');
      }
      return this.languageService.t()('notifications.temperatureAlert');
    }

    if (title.includes('humidity') || title.includes('Humidity')) {
      if (title.includes('high') || title.includes('HIGH')) {
        return this.languageService.t()('notifications.humidityTooHigh');
      }
      if (title.includes('low') || title.includes('LOW')) {
        return this.languageService.t()('notifications.humidityTooLow');
      }
      return this.languageService.t()('notifications.humidityAlert');
    }

    if (title.includes('device') || title.includes('Device')) {
      if (title.includes('offline') || title.includes('disconnected')) {
        return this.languageService.t()('notifications.deviceConnectionLost');
      }
      if (title.includes('online') || title.includes('connected')) {
        return this.languageService.t()('notifications.deviceConnected');
      }
      return this.languageService.t()('notifications.deviceUpdate');
    }

    if (title.includes('Action') || title.includes('action')) {
      if (title.includes('failed') || title.includes('error')) {
        return this.languageService.t()('notifications.actionFailed');
      }
      if (title.includes('success') || title.includes('executed')) {
        return this.languageService.t()('notifications.actionCompleted');
      }
      return this.languageService.t()('notifications.actionUpdate');
    }

    if (title.includes('System') || title.includes('system')) {
      return this.languageService.t()('notifications.systemUpdate');
    }

    if (title.includes('threshold') || title.includes('Threshold') || title.includes('warning') || title.includes('Warning')) {
      return this.languageService.t()('notifications.thresholdWarning');
    }

    return title.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getFarmerMessage(n: AppNotification): string {
    const message = n.message || '';
    const title = n.title || '';

    if (title.includes('temperature') || title.includes('Temperature')) {
      if (message.includes('°C') || message.includes('°F')) {
        const temp = message.match(/(\d+\.?\d*)\s*°[CF]/)?.[0];
        if (title.includes('high')) {
          return this.languageService.t()('notifications.temperatureHigh', { temp: temp });
        }
        if (title.includes('low')) {
          return this.languageService.t()('notifications.temperatureLow', { temp: temp });
        }
        return this.languageService.t()('notifications.temperatureNormal', { temp: temp });
      }
      return this.languageService.t()('notifications.temperatureAttention');
    }

    if (title.includes('humidity') || title.includes('Humidity')) {
      if (message.includes('%')) {
        const humidity = message.match(/(\d+\.?\d*)\s*%/)?.[0];
        if (title.includes('high')) {
          return this.languageService.t()('notifications.humidityHigh', { humidity: humidity });
        }
        if (title.includes('low')) {
          return this.languageService.t()('notifications.humidityLow', { humidity: humidity });
        }
        return this.languageService.t()('notifications.humidityNormal', { humidity: humidity });
      }
      return this.languageService.t()('notifications.humidityAttention');
    }

    if (title.includes('device') || title.includes('Device')) {
      if (message.includes('offline') || message.includes('disconnected')) {
        return this.languageService.t()('notifications.deviceOffline');
      }
      if (message.includes('online') || message.includes('connected')) {
        return this.languageService.t()('notifications.deviceOnline');
      }
      return this.languageService.t()('notifications.deviceUpdate');
    }

    if (title.includes('Action') || title.includes('action')) {
      if (message.includes('failed') || message.includes('error')) {
        return this.languageService.t()('notifications.actionFailed');
      }
      if (message.includes('success') || message.includes('executed')) {
        return this.languageService.t()('notifications.actionSuccess');
      }
      return this.languageService.t()('notifications.actionUpdate');
    }

    let cleanMessage = message
      .replace(/mqtt:/g, '')
      .replace(/smartfarm\//g, '')
      .replace(/actuators\//g, '')
      .replace(/sensors\//g, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    return cleanMessage || this.languageService.t()('notifications.somethingHappened');
  }

  getFarmerAction(n: AppNotification): string | null {
    const title = n.title || '';
    const message = n.message || '';

    if (title.includes('temperature') && title.includes('high')) {
      return 'Check if ventilation is working. Consider opening windows if it\'s cooler outside.';
    }
    if (title.includes('temperature') && title.includes('low')) {
      return 'Check if heating is working. Consider closing windows or adding insulation.';
    }

    if (title.includes('humidity') && title.includes('high')) {
      return 'Improve air circulation. Check if dehumidifier is working properly.';
    }
    if (title.includes('humidity') && title.includes('low')) {
      return 'Check water levels. Consider misting plants or adding a humidifier.';
    }

    if (title.includes('device') && (message.includes('offline') || message.includes('disconnected'))) {
      return 'Check device power and WiFi connection. Try restarting the device.';
    }

    if (title.includes('Action') && message.includes('failed')) {
      return 'Try the action again in a few minutes. Check if the device is responding.';
    }

    return null;
  }

  getFarmerTime(dateStr: string): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }

  getFarmerPriority(n: AppNotification): string {
    switch (n.level) {
      case 'critical': return this.languageService.t()('notifications.urgent');
      case 'warning': return this.languageService.t()('notifications.important');
      case 'success': return this.languageService.t()('notifications.success');
      default: return this.languageService.t()('notifications.normal');
    }
  }

  getPriorityChipClass(n: AppNotification): string {
    switch (n.level) {
      case 'critical': return 'priority-urgent';
      case 'warning': return 'priority-important';
      case 'success': return 'priority-low';
      default: return 'priority-normal';
    }
  }

  extractDeviceIdFromMessage(message: string): string | null {
    if (!message) return null;

    const cacheKeys = Array.from(this.farmDeviceCache.keys());
    for (const deviceId of cacheKeys) {
      if (message.includes(deviceId)) {
        return deviceId;
      }
    }

    const extractedId = this.extractPartialDeviceId(message);
    if (extractedId) {
      for (const deviceId of cacheKeys) {
        if (deviceId.toLowerCase().startsWith(extractedId.toLowerCase())) {
          return deviceId;
        }
      }
      return extractedId;
    }

    return null;
  }

  private extractPartialDeviceId(message: string): string | null {
    const deviceIdMatch = message.match(/([a-zA-Z0-9]+[Hh]?)\s*[•·]\s*/);
    if (deviceIdMatch) {
      return deviceIdMatch[1];
    }

    const startMatch = message.match(/^([a-zA-Z0-9]+[Hh]?)\s*\(/);
    if (startMatch) {
      return startMatch[1];
    }

    const fallbackMatch = message.match(/^([a-zA-Z0-9]+[Hh]?)/);
    if (fallbackMatch) {
      return fallbackMatch[1];
    }

    return null;
  }

  getLocation(n: AppNotification): string | null {
    if (!this.cacheReady) {
      return null;
    }

    if (this.locationCache.has(n.id)) {
      const cached = this.locationCache.get(n.id)!;
      if (cached.startsWith('Device ')) {
        this.locationCache.delete(n.id);
      } else {
        return cached;
      }
    }

    const notificationDeviceId = n.context?.deviceId ||
                               n.context?.device_id ||
                               this.extractDeviceIdFromMessage(n.message || '');

    if (!notificationDeviceId) {
      this.locationCache.set(n.id, 'System');
      return 'System';
    }

    const farmName = this.farmDeviceCache.get(notificationDeviceId);
    const deviceLocation = this.deviceLocationCache.get(notificationDeviceId);

    let result: string;
    if (farmName && deviceLocation) {
      result = `${farmName} - ${deviceLocation}`;
    } else if (farmName) {
      result = farmName;
    } else if (deviceLocation) {
      result = deviceLocation;
    } else {
      result = `Device ${notificationDeviceId}`;
    }

    this.locationCache.set(n.id, result);
    return result;
  }

  // PRESERVED ACTIONS
  async markRead(n: AppNotification) {
    await this.api.markNotificationsRead([n.id]).toPromise();
    n.read = true;
    this.svc.decrementUnread(1);
    this.snackBar.open(
      this.languageService.t()('notifications.markedAsRead'),
      '',
      { duration: 2000, panelClass: 'success-snackbar' }
    );
  }

  async remove(n: AppNotification) {
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, { width: '360px' });
    const confirmed = await ref.afterClosed().toPromise();
    if (!confirmed) return;
    await this.api.deleteNotification(n.id).toPromise();
    this.list = this.list.filter(x => x.id !== n.id);
    this.snackBar.open(
      this.languageService.t()('notifications.dismissed'),
      '',
      { duration: 2000, panelClass: 'success-snackbar' }
    );
  }

  async markAllRead() {
    await this.api.markAllNotificationsRead().toPromise();
    this.list = this.list.map(n => ({ ...n, read: true }));
    this.svc.setUnreadCountFromApi(0);
    this.snackBar.open(
      this.languageService.t()('notifications.allMarkedRead'),
      '',
      { duration: 2000, panelClass: 'success-snackbar' }
    );
  }

  // NEW UI METHODS
  toggleCardExpansion(id: string) {
    this.expandedCardId.set(this.expandedCardId() === id ? null : id);
  }

  setView(view: 'list' | 'timeline' | 'map') {
    this.activeView.set(view);
  }

  onFilterChange(filter: string) {
    this.activeFilters = filter;
    console.log('🔍 [FILTER] Active filter changed to:', filter);
    
    // Scroll to top when filter changes for better UX
    this.scrollToTop();
    
    // Show filter feedback
    this.snackBar.open(
      this.languageService.t()('notifications.filterApplied', { filter: this.getFilterLabel(filter) }),
      '',
      { duration: 1500, panelClass: 'info-snackbar' }
    );
  }

  onFarmChange() {
    console.log('🏡 [FILTER] Farm changed to:', this.selectedFarm());
    
    // Scroll to top when farm filter changes
    this.scrollToTop();
    
    // Show farm filter feedback
    const farmName = this.selectedFarm() || this.languageService.t()('notifications.allFarms');
    this.snackBar.open(
      this.languageService.t()('notifications.farmFilterApplied', { farm: farmName }),
      '',
      { duration: 1500, panelClass: 'info-snackbar' }
    );
  }

  onDeviceChange() {
    console.log('📱 [FILTER] Device changed to:', this.selectedDevice());
    
    // Scroll to top when device filter changes
    this.scrollToTop();
    
    // Show device filter feedback
    const deviceName = this.selectedDevice() || this.languageService.t()('notifications.allDevices');
    this.snackBar.open(
      this.languageService.t()('notifications.deviceFilterApplied', { device: deviceName }),
      '',
      { duration: 1500, panelClass: 'info-snackbar' }
    );
  }

  onSearchChange() {
    console.log('🔍 [FILTER] Search query changed to:', this.searchQuery);
    
    // Debounce search to avoid too many updates
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      if (this.searchQuery.trim()) {
        this.snackBar.open(
          this.languageService.t()('notifications.searchResults', { query: this.searchQuery }),
          '',
          { duration: 1500, panelClass: 'info-snackbar' }
        );
      }
    }, 300);
  }

  clearSearch() {
    this.searchQuery = '';
    console.log('🔍 [FILTER] Search cleared');
    
    // Clear any pending search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.snackBar.open(
      this.languageService.t()('notifications.searchCleared'),
      '',
      { duration: 1000, panelClass: 'info-snackbar' }
    );
  }

  // Helper method to get filter label
  private getFilterLabel(filter: string): string {
    const filterMap: { [key: string]: string } = {
      'all': this.languageService.t()('notifications.all'),
      'critical': this.languageService.t()('notifications.critical'),
      'warning': this.languageService.t()('notifications.warning'),
      'unread': this.languageService.t()('notifications.unread'),
      'read': this.languageService.t()('notifications.read')
    };
    return filterMap[filter] || filter;
  }

  // Clear all filters
  clearAllFilters() {
    this.activeFilters = 'all';
    this.selectedFarm.set(null);
    this.selectedDevice.set(null);
    this.searchQuery = '';
    
    console.log('🔍 [FILTER] All filters cleared');
    
    this.snackBar.open(
      this.languageService.t()('notifications.allFiltersCleared'),
      '',
      { duration: 1500, panelClass: 'success-snackbar' }
    );
    
    this.scrollToTop();
  }

  toggleFilterPanel() {
    this.filterPanelExpanded.set(!this.filterPanelExpanded());
  }

  formatFullDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString(this.languageService.currentLanguage(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatContext(context: any): string {
    if (!context) return '';
    return JSON.stringify(context, null, 2);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  triggerTransition() {
    this.showTransition.set(true);
    setTimeout(() => this.showTransition.set(false), 300);
  }

  showNotificationSnackbar(n: AppNotification) {
    this.snackBar.open(
      this.getFarmerTitle(n),
      this.languageService.t()('notifications.view'),
      { duration: 4000, panelClass: 'new-notification-snackbar' }
    );
  }

  setupIntersectionObserver() {
    if (!this.scrollSentinel) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.loadingMore && this.hasMoreNotifications) {
            this.loadMore();
          }
        });
      },
      { threshold: 0.1 }
    );

    this.intersectionObserver.observe(this.scrollSentinel.nativeElement);
  }
}
