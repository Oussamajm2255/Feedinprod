import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { ApiService } from '../../core/services/api.service';
import { FarmManagementService } from '../../core/services/farm-management.service';
import { ActionLog } from '../../core/models/action-log.model';
import { Device, Farm } from '../../core/models/farm.model';
import { ActionDetailsDialogComponent } from './components/action-details-dialog/action-details-dialog.component';
// import { ManualActionsV2Component } from '../dashboard/components/manual-actions-v2/manual-actions-v2.component';
import { ManualControlComponent } from './components/manual-control/manual-control.component';
import { ActionStreamComponent } from './components/action-stream/action-stream.component';
import { LanguageService } from '../../core/services/language.service';
import { DateRangePickerDialog } from './date-range-picker-dialog.component';

interface ActionFilters {
  device_id?: string;
  sensor_id?: string;
  trigger_source?: 'auto' | 'manual';
  status?: 'queued' | 'sent' | 'ack' | 'error';
  from?: string;
  to?: string;
}

interface ActionStats {
  total: number;
  auto: number;
  manual: number;
  successful: number;
  failed: number;
  pending: number;
}

@Component({
  selector: 'app-actions',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    MatExpansionModule,
    MatTabsModule,
    MatButtonToggleModule,
    ReactiveFormsModule,
    FormsModule,
    ManualControlComponent,
    ActionStreamComponent,
  ],
  animations: [
    // Tab switch animation
    trigger('tabSwitch', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    // Table row stagger animation
    trigger('rowAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(50, [
            animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    // Hover lift micro-interaction
    trigger('hoverLift', [
      state('default', style({ transform: 'translateY(0)' })),
      state('hover', style({ transform: 'translateY(-4px)' })),
      transition('default <=> hover', animate('200ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),
    // Slide in animation for filters
    trigger('slideIn', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ height: 0, opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="actions-container">
      <!-- Persistent KPI Header (Glassmorphic) -->
      <div class="kpi-header-section">
        <div class="kpi-cards-grid">
          <!-- Total Actions -->
          <div class="kpi-card glass-card hover-lift">
            <div class="kpi-icon-wrapper total-actions">
              <mat-icon>history</mat-icon>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ kpiStats().total }}</div>
              <div class="kpi-label">{{ languageService.t()('actions.totalActions') }}</div>
            </div>
          </div>

          <!-- Manual % -->
          <div class="kpi-card glass-card hover-lift">
            <div class="kpi-icon-wrapper manual-action">
              <mat-icon>touch_app</mat-icon>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ kpiStats().manualPercent }}%</div>
              <div class="kpi-label">{{ languageService.t()('actions.manualPercent') }}</div>
              <div class="kpi-sparkline manual"></div>
            </div>
          </div>

          <!-- Automated % -->
          <div class="kpi-card glass-card hover-lift">
            <div class="kpi-icon-wrapper auto-action">
              <mat-icon>settings_suggest</mat-icon>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ kpiStats().automatedPercent }}%</div>
              <div class="kpi-label">{{ languageService.t()('actions.automatedPercent') }}</div>
              <div class="kpi-sparkline auto"></div>
            </div>
          </div>

          <!-- Last Action -->
          <div class="kpi-card glass-card hover-lift last-action-card">
            <div class="kpi-icon-wrapper recent">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="kpi-content">
              <div class="kpi-value-small">{{ kpiStats().lastAction | date:'shortTime' }}</div>
              <div class="kpi-label">{{ languageService.t()('actions.lastAction') }}</div>
              <div class="kpi-sublabel" *ngIf="kpiStats().lastActionLabel">
                {{ kpiStats().lastActionLabel }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs: Trust → Awareness → Control -->
      <mat-tab-group class="actions-tabs glass-card" animationDuration="300ms">
        <!-- 1️⃣ Action History Tab (TRUST - The Hero Page) -->
        <mat-tab>
          <ng-template mat-tab-label>
            <div class="custom-tab-label">
              <mat-icon class="tab-icon">history</mat-icon>
              <span>{{ languageService.t()('actions.history') }}</span>
            </div>
          </ng-template>
          <div class="tab-content" [@tabSwitch]>
            <ng-template #loadingState>
              <div style="display:flex;align-items:center;justify-content:center;padding:2rem;">
                <mat-spinner diameter="32"></mat-spinner>
              </div>
            </ng-template>

            <!-- Advanced Filter Section -->
            <div class="filters-section glass-card">
              <div class="filters-header">
                <h3>
                  <mat-icon>filter_list</mat-icon>
                  {{ languageService.t()('actions.filters') }}
                </h3>

                <!-- Quick Time Filters -->
                <div class="time-filter-chips">
                  <button mat-flat-button
                          *ngFor="let filter of ['today', 'yesterday', 'week', 'month']"
                          [class.active]="selectedTimeFilter() === filter"
                          (click)="setTimeFilter(filter)"
                          class="time-chip">
                    <mat-icon>{{ getTimeFilterIcon(filter) }}</mat-icon>
                    {{ languageService.t()('actions.' + filter) }}
                      </button>

                  <!-- Advanced Date Range Picker -->
                  <button mat-icon-button
                          (click)="openDateRangePicker()"
                          matTooltip="{{ languageService.t()('actions.customRange') }}"
                          class="calendar-trigger">
                        <mat-icon>date_range</mat-icon>
                      </button>

                  <!-- Selected Date Range Display -->
                  <div class="selected-date-range" *ngIf="fromDateFilter.value && toDateFilter.value">
                    <mat-icon>event</mat-icon>
                    <span class="date-range-text">
                      {{ fromDateFilter.value | date:'shortDate' }} - {{ toDateFilter.value | date:'shortDate' }}
                    </span>
                    <button mat-icon-button 
                            class="clear-date-range"
                            (click)="clearDateRange()"
                            matTooltip="Clear date range">
                      <mat-icon>close</mat-icon>
                      </button>
                  </div>
                    </div>
                  </div>

              <!-- Advanced Filters Grid -->
              <div class="filters-grid" [@slideIn] *ngIf="showAdvancedFilters()">
                <!-- Farm Selector -->
                <mat-form-field appearance="outline" class="filter-field">
                  <mat-label>{{ languageService.t()('actions.farm') }}</mat-label>
                  <mat-select [(value)]="selectedFarmFilter">
                    <mat-option value="all">{{ languageService.t()('actions.allFarms') }}</mat-option>
                    <mat-option *ngFor="let farm of farms()" [value]="farm.farm_id">
                      {{ farm.name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Action Type Filter -->
                <mat-form-field appearance="outline" class="filter-field">
                  <mat-label>{{ languageService.t()('actions.actionType') }}</mat-label>
                  <mat-select [(value)]="selectedActionTypeFilter">
                    <mat-option value="all">{{ languageService.t()('actions.allTypes') }}</mat-option>
                    <mat-option value="irrigation">{{ languageService.t()('actions.actionTypes.irrigation') }}</mat-option>
                    <mat-option value="ventilation">{{ languageService.t()('actions.actionTypes.ventilation') }}</mat-option>
                    <mat-option value="lighting">{{ languageService.t()('actions.actionTypes.lighting') }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Search Input -->
                <mat-form-field appearance="outline" class="filter-field search-field">
                  <mat-label>{{ languageService.t()('actions.search') }}</mat-label>
                  <input matInput [(ngModel)]="searchQuery" placeholder="{{ languageService.t()('actions.searchPlaceholder') }}">
                  <mat-icon matPrefix>search</mat-icon>
                </mat-form-field>
                      </div>

              <!-- Toggle Advanced Filters -->
              <button mat-button class="toggle-filters-btn glass-btn" (click)="showAdvancedFilters.set(!showAdvancedFilters())">
                <mat-icon class="toggle-icon" [class.rotated]="showAdvancedFilters()">{{ showAdvancedFilters() ? 'expand_less' : 'expand_more' }}</mat-icon>
                <span class="toggle-text">{{ showAdvancedFilters() ? languageService.t()('actions.lessFilters') : languageService.t()('actions.moreFilters') }}</span>
              </button>
                      </div>

            <!-- View Toggle: Table vs Timeline -->
            <div class="view-toggle-section">
              <div class="view-toggle-container glass-card">
                <button
                  class="view-toggle-btn"
                  [class.active]="selectedView() === 'table'"
                  [class.inactive]="selectedView() !== 'table'"
                  (click)="selectedView.set('table')"
                  [attr.aria-label]="languageService.t()('actions.tableView')">
                  <div class="toggle-icon-wrapper">
                    <mat-icon class="toggle-icon">grid_view</mat-icon>
                    <mat-icon class="toggle-icon-active">table_chart</mat-icon>
                  </div>
                  <span class="toggle-label">{{ languageService.t()('actions.tableView') }}</span>
                  <div class="toggle-indicator"></div>
                </button>
                <button
                  class="view-toggle-btn"
                  [class.active]="selectedView() === 'timeline'"
                  [class.inactive]="selectedView() !== 'timeline'"
                  (click)="selectedView.set('timeline')"
                  [attr.aria-label]="languageService.t()('actions.timelineView')">
                  <div class="toggle-icon-wrapper">
                    <mat-icon class="toggle-icon">list</mat-icon>
                    <mat-icon class="toggle-icon-active">timeline</mat-icon>
                  </div>
                  <span class="toggle-label">{{ languageService.t()('actions.timelineView') }}</span>
                  <div class="toggle-indicator"></div>
                </button>
              </div>

              <!-- Export Actions -->
              <div class="export-buttons-container">
                <button
                  class="export-btn"
                  [class.pdf]="true"
                  (click)="exportToPDF()"
                  [disabled]="isExportingPDF() || filteredActions().length === 0"
                  [attr.aria-label]="languageService.t()('actions.exportPDF')">
                  <div class="export-icon-wrapper">
                    <mat-icon class="export-icon">picture_as_pdf</mat-icon>
                  </div>
                  <span class="export-label">{{ languageService.t()('actions.exportPDF') }}</span>
                  @if (isExportingPDF()) {
                    <mat-icon class="export-loading">hourglass_empty</mat-icon>
                  }
                </button>
                <button
                  class="export-btn"
                  [class.csv]="true"
                  (click)="exportToCSV()"
                  [disabled]="isExportingCSV() || filteredActions().length === 0"
                  [attr.aria-label]="languageService.t()('actions.exportCSV')">
                  <div class="export-icon-wrapper">
                    <mat-icon class="export-icon">file_download</mat-icon>
                  </div>
                  <span class="export-label">{{ languageService.t()('actions.exportCSV') }}</span>
                  @if (isExportingCSV()) {
                    <mat-icon class="export-loading">hourglass_empty</mat-icon>
                  }
                </button>
              </div>
                      </div>

            <!-- TABLE VIEW -->
            <div class="table-view-container glass-card" *ngIf="selectedView() === 'table'" [@tabSwitch]>
              <div class="table-wrapper" *ngIf="!isLoading(); else loadingState">
                <table mat-table [dataSource]="filteredActions()" class="actions-table" matSort [@rowAnimation]>

                  <!-- Timestamp Column -->
                  <ng-container matColumnDef="timestamp">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header class="sticky-header">
                      <mat-icon class="column-icon">schedule</mat-icon>
                      {{ languageService.t()('actions.timestamp') }}
                    </th>
                    <td mat-cell *matCellDef="let action" class="timestamp-cell">
                      <div class="timestamp-content">
                        <span class="date-primary">{{ action.created_at | date:'short' }}</span>
                        <span class="time-relative">{{ getRelativeTime(action.created_at) }}</span>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Action Type Column -->
                  <ng-container matColumnDef="actionType">
                    <th mat-header-cell *matHeaderCellDef class="sticky-header">
                      <mat-icon class="column-icon">settings</mat-icon>
                      {{ languageService.t()('actions.actionType') }}
                    </th>
                    <td mat-cell *matCellDef="let action">
                      <div class="action-type-cell">
                        <mat-icon [class]="'action-icon ' + getActionIconClass(action)">
                          {{ getActivityIcon(action) }}
                        </mat-icon>
                        <span>{{ getActionNameTranslation(getActionName(action.action_uri)) }}</span>
                    </div>
                    </td>
                  </ng-container>

                  <!-- Trigger Source Column -->
                  <ng-container matColumnDef="triggerSource">
                    <th mat-header-cell *matHeaderCellDef class="sticky-header">
                      <mat-icon class="column-icon">touch_app</mat-icon>
                      {{ languageService.t()('actions.triggerSource') }}
                    </th>
                    <td mat-cell *matCellDef="let action">
                      <mat-chip [class]="getSourceChipClass(action.trigger_source)" class="animated-chip">
                        <mat-icon>{{ action.trigger_source === 'auto' ? 'smart_toy' : 'touch_app' }}</mat-icon>
                        {{ getSourceText(action.trigger_source) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Status Column -->
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef class="sticky-header">
                      <mat-icon class="column-icon">info</mat-icon>
                      {{ languageService.t()('actions.status') }}
                    </th>
                    <td mat-cell *matCellDef="let action">
                      <mat-chip [class]="getStatusChipClass(action.status)" class="status-chip animated-chip">
                        <span class="status-indicator" [class]="action.status"></span>
                        {{ getStatusText(action.status) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Target Device Column -->
                  <ng-container matColumnDef="targetDevice">
                    <th mat-header-cell *matHeaderCellDef class="sticky-header">
                      <mat-icon class="column-icon">devices</mat-icon>
                      {{ languageService.t()('actions.targetDevice') }}
                    </th>
                    <td mat-cell *matCellDef="let action">
                      <div class="device-cell">
                        <mat-icon>hub</mat-icon>
                        <span>{{ getDeviceName(action.device_id) }}</span>
                      </div>
                    </td>
                  </ng-container>

                  <!-- Performed By Column -->
                  <ng-container matColumnDef="performedBy">
                    <th mat-header-cell *matHeaderCellDef class="sticky-header">
                      <mat-icon class="column-icon">person</mat-icon>
                      {{ languageService.t()('actions.performedBy') }}
                    </th>
                    <td mat-cell *matCellDef="let action">
                      <div class="user-cell">
                        <mat-icon>{{ action.trigger_source === 'auto' ? 'precision_manufacturing' : 'account_circle' }}</mat-icon>
                        <span>{{ action.trigger_source === 'auto' ? languageService.t()('actions.system') : languageService.t()('actions.operator') }}</span>
                      </div>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedTableColumns; sticky: true"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedTableColumns;"
                      class="table-row hover-row"
                      (click)="viewActionDetails(row)"></tr>
                </table>

                <!-- Pagination -->
                <mat-paginator [length]="totalActions()"
                               [pageSize]="pageSize"
                               [pageSizeOptions]="[10, 20, 50, 100]"
                               showFirstLastButtons
                               class="table-paginator">
                </mat-paginator>
                    </div>

              <!-- Empty State for Table -->
              <div class="empty-state" *ngIf="filteredActions().length === 0 && !isLoading()">
                <mat-icon class="empty-icon">event_busy</mat-icon>
                <h3>{{ languageService.t()('actions.noActionsFound') }}</h3>
                <p>{{ languageService.t()('actions.tryAdjustingFilters') }}</p>
                      </div>
            </div>

            <!-- TIMELINE VIEW (Enhanced Existing) -->
            <div class="timeline-view-container" *ngIf="selectedView() === 'timeline'" [@tabSwitch]>
              <div class="timeline-wrapper" *ngIf="!isLoading(); else loadingState">
                <div class="timeline-track"></div>
                <div class="timeline-item glass-timeline-node"
                     *ngFor="let action of filteredActions(); trackBy: trackByActionId; let i = index"
                     [@rowAnimation]
                     [style.animation-delay]="i * 50 + 'ms'">

                  <!-- Timeline Node Indicator -->
                  <div class="timeline-node-indicator" [class]="getNodeClass(action)">
                    <mat-icon>{{ getActivityIcon(action) }}</mat-icon>
                    <div class="pulse-ring" *ngIf="isRecent(action)"></div>
                  </div>

                  <!-- Timeline Content Card -->
                  <div class="timeline-content-card glass-card hover-lift">
                    <div class="timeline-header">
                      <div class="timeline-title">
                      <h4>{{ getActivityTitle(action) }}</h4>
                        <mat-chip [class]="getSourceChipClass(action.trigger_source)" size="small">
                          {{ getSourceText(action.trigger_source) }}
                        </mat-chip>
                    </div>
                      <span class="timeline-timestamp">{{ action.created_at | date:'short' }}</span>
                    </div>

                    <div class="timeline-body">
                      <p class="timeline-description">{{ getActivityDescription(action) }}</p>

                      <div class="timeline-meta">
                        <div class="meta-item">
                          <mat-icon>devices</mat-icon>
                          <span>{{ getDeviceName(action.device_id) }}</span>
                        </div>
                        <div class="meta-item">
                          <mat-chip [class]="getStatusChipClass(action.status)" size="small">
                            <span class="status-dot" [class]="action.status"></span>
                        {{ getStatusText(action.status) }}
                      </mat-chip>
                    </div>
                      </div>

                      <!-- Error Message -->
                      <div class="timeline-error" *ngIf="action.status === 'error' && action.error_message">
                      <mat-icon>warning</mat-icon>
                      <span>{{ action.error_message }}</span>
                      </div>
                    </div>

                    <!-- Show Details Button -->
                    <div class="timeline-footer">
                      <button mat-button (click)="viewActionDetails(action)" class="details-btn">
                        <mat-icon>visibility</mat-icon>
                        {{ languageService.t()('actions.showDetails') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State for Timeline -->
              <div class="empty-state" *ngIf="filteredActions().length === 0 && !isLoading()">
                <mat-icon class="empty-icon">event_busy</mat-icon>
                <h3>{{ getNoActivityMessage() }}</h3>
                <p>{{ languageService.t()('actions.noActivityDescription') }}</p>
                </div>

              <!-- Load More -->
              <div class="load-more-section" *ngIf="hasMoreActions() && !isLoading()">
                <button mat-raised-button color="primary" (click)="loadMoreActions()" [disabled]="loadingMore()">
                  <mat-icon *ngIf="!loadingMore()">expand_more</mat-icon>
                  <mat-spinner *ngIf="loadingMore()" diameter="20"></mat-spinner>
                  {{ loadingMore() ? languageService.t()('common.loading') : languageService.t()('actions.loadMore') }}
                </button>
              </div>
            </div>

            <!-- AI Insights (Optional) -->
            <div class="ai-insights-section glass-card" *ngIf="filteredActions().length > 0">
              <div class="insights-header">
                <mat-icon class="sparkle-icon">auto_awesome</mat-icon>
                <h3>{{ languageService.t()('actions.insights') }}</h3>
              </div>
              <div class="insights-content">
                <p>{{ languageService.t()('actions.mostFrequentAction', { action: 'Irrigation', percent: 63 }) }}</p>
              </div>
            </div>

          </div>
        </mat-tab>

        <!-- 2️⃣ Manual Control Tab (CONTROL) -->
        <mat-tab>
          <ng-template mat-tab-label>
            <div class="custom-tab-label">
              <mat-icon class="tab-icon">touch_app</mat-icon>
              <span>{{ languageService.t()('actions.manualControl') }}</span>
            </div>
          </ng-template>
          <div class="tab-content">
            <app-manual-control></app-manual-control>
          </div>
        </mat-tab>

        <!-- 3️⃣ Action Stream Tab (UNIFIED LIVE + HISTORICAL) -->
        <mat-tab>
          <ng-template mat-tab-label>
            <div class="custom-tab-label">
              <mat-icon class="tab-icon">stream</mat-icon>
              <span>{{ languageService.t()('actions.actionStream') }}</span>
            </div>
          </ng-template>
          <div class="tab-content">
            <app-action-stream></app-action-stream>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .actions-container {
      padding: 1.5rem 2rem;
      max-width: 1600px;
      margin: 0 auto;
      min-height: 100vh;
      background: transparent;
    }

    // KPI Header Section
    .kpi-header-section {
      margin-bottom: 2rem;
      animation: fadeInDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
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

    .kpi-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }

    .kpi-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--glass-bg, rgba(255, 255, 255, 0.7));
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 16px;
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.4));
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.6);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--primary-green), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 12px 24px rgba(16, 185, 129, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.7);
        border-color: rgba(16, 185, 129, 0.3);

        &::before {
          opacity: 1;
        }
      }
    }

    .kpi-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      &.total-actions {
        background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        color: #1e40af;
      }

      &.manual-action {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        color: #92400e;
      }

      &.auto-action {
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        color: #065f46;
      }

      &.recent {
        background: linear-gradient(135deg, #e9d5ff, #d8b4fe);
        color: #6b21a8;
      }
    }

    .kpi-card:hover .kpi-icon-wrapper {
      transform: scale(1.1) rotate(5deg);
    }

    .kpi-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .kpi-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    .kpi-value-small {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-sublabel {
      font-size: 0.7rem;
      color: var(--text-secondary);
      opacity: 0.8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    // Sparkline mini-chart
    .kpi-sparkline {
      height: 3px;
      width: 100%;
      margin-top: 0.5rem;
      border-radius: 2px;
      background: rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        border-radius: 2px;
      }

      &.manual::after {
        width: var(--manual-percent, 40%);
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
      }

      &.auto::after {
        width: var(--auto-percent, 60%);
        background: linear-gradient(90deg, #10b981, #34d399);
      }
    }

    // Filters Section
    .filters-section {
      margin-bottom: 1.5rem;
      padding: 1.5rem;
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      border: 1px solid var(--glass-border);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;

      h3 {
      display: flex;
      align-items: center;
        gap: 0.5rem;
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);

        mat-icon {
          color: var(--primary-green);
        }
      }
    }

    .time-filter-chips {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .time-chip {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      min-width: auto;
      background: transparent;
      border: 2px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 10px;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      &:hover {
        transform: translateY(-1px);
        background: rgba(16, 185, 129, 0.05);
        border-color: rgba(16, 185, 129, 0.2);

        &::before {
          opacity: 1;
        }

        mat-icon {
          transform: scale(1.08);
        }

        color: var(--primary-green);
      }

      &:active {
        transform: translateY(0) scale(0.97);
      }

      &.active {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08));
        border-color: var(--primary-green);
        box-shadow: 0 2px 12px rgba(16, 185, 129, 0.25), inset 0 1px 1px rgba(16, 185, 129, 0.2);
        color: var(--primary-green);
        font-weight: 700;

        &::before {
          opacity: 1;
        }

        mat-icon {
          transform: scale(1.1);
          color: var(--primary-green);
        }

        &:hover {
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3), inset 0 1px 1px rgba(16, 185, 129, 0.3);
        }
      }
    }

    .calendar-trigger {
      position: relative;
      border: 2px solid var(--glass-border, rgba(0, 0, 0, 0.1));
      border-radius: 10px;
      background: transparent;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 10px;
      }

      mat-icon {
        color: var(--primary-green);
        font-size: 22px;
        width: 22px;
        height: 22px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      &:hover {
        background: rgba(16, 185, 129, 0.05);
        border-color: var(--primary-green);
        transform: translateY(-1px);

        &::before {
          opacity: 1;
        }

        mat-icon {
          transform: scale(1.1) rotate(5deg);
        }
      }

      &:active {
        transform: translateY(0) scale(0.97);
      }

      &:focus {
        border-color: var(--primary-green);
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
      }
    }

    .selected-date-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
      border: 2px solid var(--primary-green);
      border-radius: 10px;
      margin-left: 0.5rem;
      animation: slideIn 0.3s ease;

      mat-icon {
        color: var(--primary-green);
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .date-range-text {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--primary-green);
        white-space: nowrap;
      }

      .clear-date-range {
        width: 24px;
        height: 24px;
        line-height: 24px;
        padding: 0;
        margin-left: 0.25rem;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }

        &:hover {
          background: rgba(239, 68, 68, 0.1);

          mat-icon {
            color: #ef4444;
            transform: scale(1.2);
          }
        }
      }
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .filter-field {
      width: 100%;
      margin-bottom: 0;

      ::ng-deep {
        // Form field wrapper - compact size with visible border
        .mat-mdc-text-field-wrapper {
          background: var(--glass-bg, #ffffff);
          border-radius: 10px;
          border: 2px solid var(--primary-green);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.1);
          padding: 0 !important;
          height: 48px !important;
        }

        // Reduce form field height
        .mat-mdc-form-field-flex {
          height: 48px !important;
          align-items: center;
        }

        // Infix padding reduction
        .mat-mdc-form-field-infix {
          padding-top: 10px !important;
          padding-bottom: 10px !important;
          min-height: 28px !important;
        }

        // Notched outline - make it visible (reduced border width)
        .mdc-notched-outline {
          .mdc-notched-outline__leading,
          .mdc-notched-outline__notch,
          .mdc-notched-outline__trailing {
            border-color: var(--primary-green) !important;
            border-width: 2px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }

          .mdc-notched-outline__leading {
            border-top-left-radius: 10px !important;
            border-bottom-left-radius: 10px !important;
            border-right: none !important;
          }

          .mdc-notched-outline__notch {
            border-left: none !important;
            border-right: none !important;
          }

          .mdc-notched-outline__trailing {
            border-top-right-radius: 10px !important;
            border-bottom-right-radius: 10px !important;
            border-left: none !important;
          }
        }

        // Hover state
        &:hover .mdc-notched-outline {
          .mdc-notched-outline__leading,
          .mdc-notched-outline__notch,
          .mdc-notched-outline__trailing {
            border-color: var(--primary-green) !important;
            border-width: 2.5px !important;
          }
        }

        // Focus state
        &.mat-focused {
          .mat-mdc-text-field-wrapper {
            box-shadow: 0 3px 12px rgba(16, 185, 129, 0.2), 0 0 0 2px rgba(16, 185, 129, 0.15);
          }

          .mdc-notched-outline {
            .mdc-notched-outline__leading,
            .mdc-notched-outline__notch,
            .mdc-notched-outline__trailing {
              border-color: var(--primary-green) !important;
              border-width: 2.5px !important;
            }
          }
        }

        // Label styling - clean and readable
        .mat-mdc-form-field-label {
          color: var(--text-primary, #374151) !important;
          font-weight: 500 !important;
          font-size: 0.875rem !important;
          line-height: 1.4 !important;
          letter-spacing: normal !important;
          text-transform: none !important;

          &.mdc-floating-label--float-above {
            color: var(--primary-green) !important;
            font-weight: 600 !important;
            font-size: 0.8125rem !important;
            letter-spacing: normal !important;
            text-transform: none !important;
            background: var(--glass-bg, #ffffff) !important;
            padding: 0 4px !important;
          }
        }

        // Input element styling - compact size
        .mat-mdc-input-element {
          color: var(--text-primary, #1f2937) !important;
          font-weight: 500 !important;
          font-size: 0.875rem !important;
          padding: 8px 12px !important;
          background: transparent !important;
          line-height: 1.4 !important;
          height: auto !important;

          &::placeholder {
            color: var(--text-secondary, #6b7280) !important;
            opacity: 0.7 !important;
            font-weight: 400 !important;
            font-size: 0.8125rem !important;
          }
        }

        // Select styling - compact size
        .mat-mdc-select {
          .mat-mdc-select-trigger {
            padding: 8px 12px !important;
            min-height: auto !important;
            height: 48px !important;
            display: flex !important;
            align-items: center !important;

            .mat-mdc-select-value {
              color: var(--text-primary, #1f2937) !important;
              font-weight: 500 !important;
              font-size: 0.875rem !important;
              line-height: 1.4 !important;
            }

            .mat-mdc-select-arrow-wrapper {
              transform: translateY(0) !important;
              
              .mat-mdc-select-arrow {
                color: var(--primary-green) !important;
                transition: all 0.3s ease !important;
                font-size: 20px !important;
                width: 20px !important;
                height: 20px !important;
              }
            }
          }
        }

        // Focused select
        &.mat-focused .mat-mdc-select .mat-mdc-select-trigger {
          .mat-mdc-select-arrow-wrapper .mat-mdc-select-arrow {
            transform: rotate(180deg) scale(1.05) !important;
          }
        }

        // Icon styling - enhanced visibility
        .mat-mdc-form-field-icon-prefix,
        .mat-mdc-form-field-icon-suffix {
          color: var(--primary-green) !important;
          margin: 0 8px 0 4px !important;
          display: flex !important;
          align-items: center !important;

          mat-icon {
            font-size: 22px !important;
            width: 22px !important;
            height: 22px !important;
            opacity: 0.8 !important;
            transition: opacity 0.2s ease !important;
          }
        }

        // Enhanced icon on focus
        &.mat-focused .mat-mdc-form-field-icon-prefix mat-icon {
          opacity: 1 !important;
          transform: scale(1.05) !important;
        }

        // Dropdown panel - reduced size
        .mat-mdc-select-panel {
          background: var(--glass-bg, #ffffff) !important;
          border: 2px solid var(--primary-green) !important;
          border-radius: 10px !important;
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.2) !important;
          margin-top: 6px !important;
          padding: 0.375rem 0 !important;
          max-height: 280px !important;

          .mat-mdc-option {
            padding: 0.625rem 1rem !important;
            margin: 0 0.375rem !important;
            border-radius: 8px !important;
            min-height: 40px !important;
            font-weight: 500 !important;
            font-size: 0.875rem !important;
            line-height: 1.5 !important;

            &:hover:not(.mdc-list-item--disabled) {
              background: rgba(16, 185, 129, 0.1) !important;
              color: var(--primary-green) !important;
            }

            &.mdc-list-item--selected:not(.mdc-list-item--disabled) {
              background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08)) !important;
              color: var(--primary-green) !important;
              font-weight: 600 !important;

              &::before {
                content: '✓';
                position: absolute;
                left: 0.625rem;
                color: var(--primary-green);
                font-weight: bold;
                font-size: 0.9375rem;
              }
            }
          }

          &::-webkit-scrollbar {
            width: 8px;
          }

          &::-webkit-scrollbar-track {
            background: rgba(16, 185, 129, 0.05);
            border-radius: 4px;
          }

          &::-webkit-scrollbar-thumb {
            background: var(--primary-green);
            border-radius: 4px;

            &:hover {
              background: #059669;
            }
          }
        }
      }
    }

    // Search Field - Special styling for prominence
    .search-field {
      ::ng-deep {
        .mat-mdc-form-field-icon-prefix mat-icon {
          font-size: 24px !important;
          width: 24px !important;
          height: 24px !important;
          opacity: 0.9 !important;
        }

        &.mat-focused {
          .mat-mdc-text-field-wrapper {
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25), 0 0 0 3px rgba(16, 185, 129, 0.12) !important;
          }
        }
      }
    }

    // Tab Group Styling - Simple like table/timeline view
    .actions-tabs {
      background: var(--glass-bg, rgba(255, 255, 255, 0.95));
      border-radius: 16px;
      border: 1px solid var(--glass-border, rgba(0, 0, 0, 0.08));
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      padding: 0.75rem;
      margin-bottom: 2rem;
      overflow: hidden;
      transition: all 0.3s ease;

      ::ng-deep {
        .mat-mdc-tab-header {
          border-bottom: 2px solid var(--glass-border, rgba(16, 185, 129, 0.2));
          background: transparent;
          padding: 0 0.5rem;
        }

        .mat-mdc-tab-labels {
          gap: 0.5rem;
          justify-content: center;
          align-items: center;
        }

        .mat-mdc-tab {
          min-width: 140px;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          background: transparent;
          border: 2px solid transparent;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
            opacity: 0;
            transition: opacity 0.3s ease;
            border-radius: 10px;
          }

          &:hover:not(.mdc-tab--active)::before {
            opacity: 1;
          }

          .mdc-tab__content {
            display: flex;
            justify-content: center;
            align-items: center;

            .custom-tab-label {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              font-weight: 500;
              color: var(--text-secondary);
              transition: all 0.3s ease;
              width: 100%;
              text-align: center;

              .tab-icon {
                font-size: 20px;
                width: 20px;
                height: 20px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                flex-shrink: 0;
              }

              span {
                font-size: 0.875rem;
                white-space: nowrap;
                text-align: center;
                flex: 1;
              }
            }
          }

          &:hover:not(.mdc-tab--active) {
            transform: translateY(-1px);
            background: rgba(16, 185, 129, 0.05);
            border-color: rgba(16, 185, 129, 0.2);

            &::before {
              opacity: 1;
            }

            .custom-tab-label {
              color: var(--primary-green);

              .tab-icon {
                transform: scale(1.08);
                color: var(--primary-green);
              }
            }
          }

          &.mdc-tab--active {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08));
            border-color: var(--primary-green);
            box-shadow: 0 2px 12px rgba(16, 185, 129, 0.25), inset 0 1px 1px rgba(16, 185, 129, 0.2);
            border: 2px solid var(--primary-green);

            &::before {
              opacity: 1;
            }

            .custom-tab-label {
              color: var(--primary-green);
              font-weight: 700;

              .tab-icon {
                color: var(--primary-green);
                transform: scale(1.1);
              }

              span {
                text-shadow: none;
              }
            }

            .mdc-tab-indicator__content {
              display: none;
            }
          }

          @keyframes gentlePulse {
            0%, 100% {
              transform: scale(1.04);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.9;
            }
          }

          &:not(.mdc-tab--active) {
            .custom-tab-label {
              .tab-icon {
                color: var(--text-secondary);
              }
            }
          }
        }

        .mat-mdc-ink-bar {
          display: none;
        }
      }

      @media (max-width: 768px) {
        padding: 0.25rem;

        ::ng-deep {
          .mat-mdc-tab {
            min-width: 100px;
            padding: 0.5rem 1rem;

            .mdc-tab__content {
              .custom-tab-label {
                gap: 0.375rem;

                .tab-icon {
                  font-size: 18px;
                  width: 18px;
                  height: 18px;
                }

                span {
                  font-size: 0.75rem;
                }
              }
            }
          }
        }
      }
    }

    .tab-content {
      padding: 1.5rem 0;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    // Toggle Filters Button - Simple like table/timeline view
    .toggle-filters-btn {
      margin-top: 1rem;
      padding: 0.75rem 1.25rem;
      border-radius: 16px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      background: var(--glass-bg, rgba(255, 255, 255, 0.95));
      border: 1.5px solid var(--glass-border, rgba(0, 0, 0, 0.1));
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.08), transparent);
        transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }

      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.2), transparent);
        transform: translate(-50%, -50%);
        transition: width 0.4s ease, height 0.4s ease;
        pointer-events: none;
      }

      &:hover::before {
        left: 100%;
      }

      &:active::after {
        width: 300px;
        height: 300px;
      }

      .toggle-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        color: var(--primary-green);
        transform-origin: center;
      }

      .toggle-text {
        font-weight: 500;
        transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 1;
        color: var(--text-primary);
      }

      &:hover {
        background: rgba(16, 185, 129, 0.08);
        border-color: var(--primary-green);
        color: var(--primary-green);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.12);

        .toggle-text {
          color: var(--primary-green);
        }

        .toggle-icon {
          transform: scale(1.08);
        }
      }

      &:active {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
      }

      .toggle-icon.rotated {
        transform: rotate(180deg) scale(1.05);
      }
    }

    // View Toggle Section
    .view-toggle-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .view-toggle-container {
      display: flex;
      gap: 0.375rem;
      padding: 0.25rem;
      background: var(--glass-bg, rgba(255, 255, 255, 0.7));
      backdrop-filter: blur(12px);
      border-radius: 12px;
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.4));
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .view-toggle-btn {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      min-width: auto;
      background: transparent;
      border: 2px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 12px;
      }

      .toggle-icon-wrapper {
        position: relative;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        .toggle-icon {
          position: absolute;
          font-size: 20px;
          width: 20px;
          height: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toggle-icon-active {
          position: absolute;
          font-size: 20px;
          width: 20px;
          height: 20px;
          opacity: 0;
          transform: scale(0.8) rotate(-90deg);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      }

      .toggle-label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-secondary);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
      }

      .toggle-indicator {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%) scaleX(0);
        width: 70%;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--primary-green), transparent);
        border-radius: 2px;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      &:hover {
        transform: translateY(-1px);
        background: rgba(16, 185, 129, 0.05);
        border-color: rgba(16, 185, 129, 0.2);

        &::before {
          opacity: 1;
        }

        .toggle-icon-wrapper {
          transform: scale(1.08);
        }

        .toggle-label {
          color: var(--primary-green);
        }
      }

      &:active {
        transform: translateY(0) scale(0.97);
      }

      &.active {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08));
        border-color: var(--primary-green);
        box-shadow: 0 2px 12px rgba(16, 185, 129, 0.25), inset 0 1px 1px rgba(16, 185, 129, 0.2);

        &::before {
          opacity: 1;
        }

        .toggle-icon-wrapper {
          transform: scale(1.1);

          .toggle-icon {
            opacity: 0;
            transform: scale(0.8) rotate(90deg);
          }

          .toggle-icon-active {
            opacity: 1;
            transform: scale(1) rotate(0deg);
            color: var(--primary-green);
          }
        }

        .toggle-label {
          color: var(--primary-green);
          font-weight: 700;
        }

        .toggle-indicator {
          transform: translateX(-50%) scaleX(1);
        }

        &:hover {
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3), inset 0 1px 1px rgba(16, 185, 129, 0.3);
        }
      }

      &.inactive {
        .toggle-icon {
          color: var(--text-secondary);
        }

        .toggle-label {
          color: var(--text-secondary);
        }
      }
    }

    .view-toggle-group {
      border-radius: 8px;
      overflow: hidden;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .export-buttons-container {
      display: flex;
      gap: 0.5rem;
    }

    .export-btn {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      min-width: auto;
      background: var(--glass-bg, rgba(255, 255, 255, 0.7));
      backdrop-filter: blur(12px);
      border: 2px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 10px;
      }

      .export-icon-wrapper {
        position: relative;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .export-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .export-label {
        font-size: 0.8125rem;
        font-weight: 600;
        white-space: nowrap;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .export-loading {
        position: absolute;
        right: 0.5rem;
        font-size: 16px;
        width: 16px;
        height: 16px;
        animation: spin 1s linear infinite;
        color: var(--primary-green);
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      &.pdf {
        &::before {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
        }

        .export-icon {
          color: #ef4444;
        }

        &:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);

          &::before {
            opacity: 1;
          }

          .export-icon-wrapper {
            transform: scale(1.1);
          }

          .export-label {
            color: #ef4444;
          }
        }

        &:active:not(:disabled) {
          transform: translateY(0) scale(0.97);
        }
      }

      &.csv {
        &::before {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
        }

        .export-icon {
          color: var(--primary-green);
        }

        &:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);

          &::before {
            opacity: 1;
          }

          .export-icon-wrapper {
            transform: scale(1.1);
          }

          .export-label {
            color: var(--primary-green);
          }
        }

        &:active:not(:disabled) {
          transform: translateY(0) scale(0.97);
        }
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
    }

    // Table View Styling
    .table-view-container {
      padding: 0;
      border-radius: 16px;
      overflow: hidden;
    }

    .table-wrapper {
      overflow-x: auto;
      position: relative;
    }

    .actions-table {
      width: 100%;
      background: transparent;

      th.sticky-header {
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--glass-bg);
        backdrop-filter: blur(12px);
        border-bottom: 2px solid var(--border-color);
        font-weight: 600;
        color: var(--text-primary);
        padding: 1rem;
        white-space: nowrap;

        .column-icon {
          vertical-align: middle;
          margin-right: 0.5rem;
          font-size: 18px;
          color: var(--primary-green);
        }
      }

      td {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
      }

      .table-row {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;

        &:hover {
          background: rgba(16, 185, 129, 0.05);
          transform: scale(1.005);
          box-shadow: inset 4px 0 0 var(--primary-green);
        }
      }
    }

    .timestamp-cell {
      .timestamp-content {
      display: flex;
      flex-direction: column;
        gap: 0.25rem;
    }

      .date-primary {
      font-weight: 500;
        color: var(--text-primary);
      }

      .time-relative {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }

    .action-type-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .action-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .animated-chip {
      position: relative;
      overflow: hidden;
      transition: all 0.2s ease;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transition: left 0.5s ease;
      }

      &:hover::before {
        left: 100%;
      }
    }

    .status-chip {
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 0.5rem;
        animation: statusPulse 2s ease-in-out infinite;

        &.ack, &.sent {
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }

        &.error, &.failed {
          background: #ef4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
        }

        &.queued {
          background: #f59e0b;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
        }
      }
    }

    @keyframes statusPulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }

    .table-paginator {
      background: transparent !important;
      border-top: 1px solid var(--border-color);
      margin-top: 1rem;
      padding: 1rem;
    }

    // Timeline View Styling
    .timeline-view-container {
      position: relative;
      padding: 2rem 0;
    }

    .timeline-track {
      position: absolute;
      left: 32px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(180deg,
        var(--primary-green) 0%,
        rgba(16, 185, 129, 0.3) 50%,
        transparent 100%);
    }

    .timeline-item {
      position: relative;
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-left: 3rem;
      animation: slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .timeline-node-indicator {
      position: absolute;
      left: 0;
      top: 0;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 2;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }

      &.success {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      &.manual {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      &.error {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }

      &.auto {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
      }
    }

    .pulse-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border: 2px solid var(--primary-green);
      border-radius: 50%;
      animation: pulseRing 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    @keyframes pulseRing {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(1.3);
        opacity: 0;
      }
    }

    .timeline-content-card {
      flex: 1;
      padding: 1.5rem;
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      border: 1px solid var(--glass-border);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateX(8px) translateY(-4px);
        box-shadow: 0 12px 24px rgba(16, 185, 129, 0.15);
        border-color: rgba(16, 185, 129, 0.3);
      }
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 1rem;

      .timeline-title {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        h4 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
          color: var(--text-primary);
        }
      }

      .timeline-timestamp {
        font-size: 0.875rem;
        color: var(--text-secondary);
      white-space: nowrap;
      }
    }

    .timeline-body {
      .timeline-description {
        margin: 0 0 1rem 0;
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .timeline-meta {
      display: flex;
      align-items: center;
        gap: 1rem;
      flex-wrap: wrap;

        .meta-item {
      display: flex;
      align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }

      .timeline-error {
        margin-top: 1rem;
        padding: 0.75rem;
        background: rgba(239, 68, 68, 0.1);
        border-left: 3px solid #ef4444;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #dc2626;
        font-size: 0.875rem;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .timeline-footer {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);

      .details-btn {
        font-size: 0.875rem;
        color: var(--primary-green);

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    // AI Insights Section
    .ai-insights-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
      backdrop-filter: blur(12px);
      border-radius: 16px;
      border: 1px solid rgba(139, 92, 246, 0.3);

      .insights-header {
      display: flex;
      align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;

        .sparkle-icon {
          color: #8b5cf6;
          animation: sparkle 2s ease-in-out infinite;
        }

        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }
      }

      .insights-content {
        p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
          line-height: 1.6;
        }
      }
    }

    @keyframes sparkle {
      0%, 100% {
        transform: scale(1) rotate(0deg);
      }
      50% {
        transform: scale(1.2) rotate(180deg);
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

    // Load More Section
    .load-more-section {
      text-align: center;
      padding: 2rem;
      margin-top: 1.5rem;
    }

    // Dark Theme Support
    :host-context(body.dark-theme) {
      .kpi-card, .glass-card, .view-toggle-container {
        background: var(--glass-bg, rgba(30, 41, 59, 0.7));
        border-color: var(--glass-border, rgba(100, 116, 139, 0.3));
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(100, 116, 139, 0.1);
      }

      .kpi-card:hover, .glass-card:hover {
        box-shadow: 0 12px 24px rgba(16, 185, 129, 0.2), inset 0 1px 1px rgba(100, 116, 139, 0.2);
      }

      .view-toggle-btn {
        &.active {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.15));
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35), inset 0 1px 2px rgba(16, 185, 129, 0.3);

          &:hover {
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4), inset 0 1px 2px rgba(16, 185, 129, 0.4);
          }
        }

        &:hover {
          background: rgba(16, 185, 129, 0.1);
        }
      }

      .export-btn {
        &.pdf {
          &:hover:not(:disabled) {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.4);
          }
        }

        &.csv {
          &:hover:not(:disabled) {
            background: rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.4);
          }
        }
      }

      .actions-table th.sticky-header {
        background: rgba(30, 41, 59, 0.9);
      }

      .timeline-track {
        background: linear-gradient(180deg,
          rgba(16, 185, 129, 0.5) 0%,
          rgba(16, 185, 129, 0.2) 50%,
          transparent 100%);
      }

      // Dark mode for time filter chips
      .time-chip {
        background: var(--card-bg, rgba(30, 41, 59, 0.8));
        border-color: var(--border-color, rgba(100, 116, 139, 0.3));
        color: var(--text-secondary, #cbd5e1);

        &:hover {
          background: rgba(16, 185, 129, 0.15);
          border-color: var(--primary-green);
          color: var(--primary-green);
        }

        &.active {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.15));
          border-color: var(--primary-green);
          color: var(--primary-green);
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35), inset 0 1px 2px rgba(16, 185, 129, 0.3);
        }
      }

      // Dark mode for calendar trigger
      .calendar-trigger {
        background: var(--card-bg, rgba(30, 41, 59, 0.8));
        border-color: var(--border-color, rgba(100, 116, 139, 0.3));

        &:hover {
          background: rgba(16, 185, 129, 0.15);
          border-color: var(--primary-green);
        }
      }

      // Dark mode for filter fields
      .filter-field ::ng-deep {
        .mat-mdc-text-field-wrapper {
          background: var(--card-bg, #1e293b) !important;
        }

        .mdc-notched-outline {
          .mdc-notched-outline__leading,
          .mdc-notched-outline__notch,
          .mdc-notched-outline__trailing {
            border-color: var(--primary-green) !important;
            border-width: 2px !important;
          }
        }

        &:hover .mdc-notched-outline {
          .mdc-notched-outline__leading,
          .mdc-notched-outline__notch,
          .mdc-notched-outline__trailing {
            border-width: 2.5px !important;
          }
        }

        &.mat-focused {
          .mat-mdc-text-field-wrapper {
            box-shadow: 0 3px 12px rgba(16, 185, 129, 0.3), 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
          }

          .mdc-notched-outline {
            .mdc-notched-outline__leading,
            .mdc-notched-outline__notch,
            .mdc-notched-outline__trailing {
              border-width: 2.5px !important;
            }
          }
        }

        .mat-mdc-form-field-label {
          color: var(--text-primary, #f1f5f9) !important;
          font-weight: 600 !important;
          font-size: 0.8125rem !important;

          &.mdc-floating-label--float-above {
            color: var(--primary-green) !important;
            font-weight: 700 !important;
            font-size: 0.75rem !important;
          }
        }

        .mat-mdc-input-element {
          color: var(--text-primary, #f1f5f9) !important;
          font-weight: 500 !important;
          font-size: 0.875rem !important;

          &::placeholder {
            color: var(--text-secondary, #94a3b8) !important;
            opacity: 0.7 !important;
          }
        }

        .mat-mdc-select-trigger .mat-mdc-select-value {
          color: var(--text-primary, #f1f5f9) !important;
          font-weight: 500 !important;
          font-size: 0.875rem !important;
        }

        .mat-mdc-select-panel {
          background: var(--card-bg, #1e293b) !important;
          border-color: var(--primary-green) !important;

          .mat-mdc-option {
            color: var(--text-primary, #f1f5f9) !important;
            font-weight: 500 !important;
            font-size: 0.875rem !important;

            &:hover:not(.mdc-list-item--disabled) {
              background: rgba(16, 185, 129, 0.15) !important;
            }

            &.mdc-list-item--selected:not(.mdc-list-item--disabled) {
              background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.15)) !important;
            }
          }
        }
      }

      // Dark mode for selected date range
      .selected-date-range {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
        border-color: var(--primary-green);
      }

      // Dark mode for toggle filters button text
      .toggle-filters-btn {
        .toggle-text {
          color: var(--text-primary, #f1f5f9);
        }

        &:hover .toggle-text {
          color: var(--primary-green);
        }
      }

      // Dark mode for dropdown panel
      ::ng-deep .mat-mdc-select-panel {
        background: var(--card-bg, rgba(30, 41, 59, 0.98));
        border-color: var(--border-color, rgba(16, 185, 129, 0.3));

        .mat-mdc-option {
          color: var(--text-primary, #f1f5f9);

          &:hover:not(.mdc-list-item--disabled) {
            background: rgba(16, 185, 129, 0.15);
            color: var(--primary-green);
          }

          &.mdc-list-item--selected:not(.mdc-list-item--disabled) {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.15));
            color: var(--primary-green);
          }
        }
      }

      // Dark mode for tabs
      .actions-tabs {
        background: var(--card-bg, rgba(30, 41, 59, 0.95));
        border-color: var(--border-color, rgba(100, 116, 139, 0.3));

        ::ng-deep .mat-mdc-tab {
          color: var(--text-secondary, #cbd5e1);

          &:hover:not(.mdc-tab--active) {
            background: rgba(16, 185, 129, 0.1);
          }

          &.mdc-tab--active {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.15));
            border-color: var(--primary-green);
            box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35), inset 0 1px 2px rgba(16, 185, 129, 0.3);
          }
        }
      }
    }

    // Responsive Design
    @media (max-width: 1200px) {
      .kpi-cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .filters-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .actions-container {
        padding: 1rem;
      }

      .kpi-cards-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .kpi-card {
        padding: 1rem;
      }

      .kpi-icon-wrapper {
        width: 40px;
        height: 40px;

        mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        }
      }

      .kpi-value {
        font-size: 1.5rem;
      }

      .time-filter-chips {
        width: 100%;
        flex-wrap: wrap;

        .time-chip {
          flex: 1 1 calc(50% - 0.5rem);
        }
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .view-toggle-section {
        flex-direction: column;
        gap: 1rem;
      }

      .view-toggle-container {
        width: 100%;
        justify-content: center;
      }

      .view-toggle-btn {
        flex: 1;
        min-width: 80px;
        padding: 0.5rem 0.75rem;
        gap: 0.375rem;

        .toggle-icon-wrapper {
          width: 18px;
          height: 18px;

          .toggle-icon, .toggle-icon-active {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }

        .toggle-label {
          font-size: 0.75rem;
        }
      }

      .timeline-item {
        padding-left: 2.5rem;
      }

      .timeline-track {
        left: 24px;
      }

      .timeline-node-indicator {
        width: 48px;
        height: 48px;

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }

      .actions-table {
        font-size: 0.875rem;

        th, td {
          padding: 0.75rem 0.5rem;
        }
      }
    }

    @media (max-width: 480px) {
      .kpi-value {
        font-size: 1.25rem;
      }

      .kpi-label {
        font-size: 0.7rem;
      }

      .timeline-content-card {
        padding: 1rem;
      }

      .timeline-header {
        flex-direction: column;
      }
    }

  `]
})
export class ActionsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private farmManagement = inject(FarmManagementService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  public languageService = inject(LanguageService);
  private refreshSubscription: Subscription | undefined;

  // Signals
  isLoading = signal(false);
  actions = signal<ActionLog[]>([]);
  devices = signal<Device[]>([]);
  isExportingPDF = signal(false);
  isExportingCSV = signal(false);
  farms = signal<Farm[]>([]);
  selectedTimeFilter = signal<'today' | 'yesterday' | 'week' | 'month'>('today');

  // New signals for view state
  selectedView = signal<'table' | 'timeline'>('timeline'); // Default to timeline
  showAdvancedFilters = signal(false);
  selectedFarmFilter = signal<string>('all');
  selectedActionTypeFilter = signal<string>('all');
  searchQuery = signal<string>('');

  // Pagination properties
  totalActions = signal(0);
  pageSize = 20;
  loadingMore = signal(false);
  hasMoreActions = signal(false);

  // Form controls
  deviceFilter = new FormControl('');
  sourceFilter = new FormControl('');
  statusFilter = new FormControl('');
  fromDateFilter = new FormControl<Date | null>(null);
  toDateFilter = new FormControl<Date | null>(null);
  searchFilter = new FormControl('');

  // Table configuration
  displayedColumns: string[] = [
    'created_at',
    'trigger_source',
    'device_id',
    'sensor_id',
    'action_uri',
    'status',
    'value',
    'actions'
  ];

  // New table columns for redesigned table
  displayedTableColumns: string[] = [
    'timestamp',
    'actionType',
    'triggerSource',
    'status',
    'targetDevice',
    'performedBy'
  ];

  // Computed properties
  filteredActions = computed(() => {
    let filtered = this.actions();

    // Apply time filter
    const timeFilter = this.selectedTimeFilter();
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(a => {
          const actionDate = new Date(a.created_at);
          return actionDate >= startDate && actionDate < endDate;
        });
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'week':
        const dayOfWeek = now.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start of week
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Filter by start date (yesterday case is already handled above)
    filtered = filtered.filter(a => new Date(a.created_at) >= startDate);

    // Sort by newest first
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

  stats = computed(() => {
    const actions = this.actions();
    return {
      total: actions.length,
      auto: actions.filter(a => a.trigger_source === 'auto').length,
      manual: actions.filter(a => a.trigger_source === 'manual').length,
      successful: actions.filter(a => a.status === 'sent' || a.status === 'ack').length,
      failed: actions.filter(a => a.status === 'error').length,
      pending: actions.filter(a => a.status === 'queued').length
    };
  });

  // KPI Stats for header
  kpiStats = computed(() => {
    const filtered = this.filteredActions();
    const total = filtered.length;
    const manual = filtered.filter(a => a.trigger_source === 'manual').length;
    const automated = filtered.filter(a => a.trigger_source === 'auto').length;
    const lastAction = filtered[0]; // Already sorted by newest first

    return {
      total,
      manualPercent: total > 0 ? Math.round((manual / total) * 100) : 0,
      automatedPercent: total > 0 ? Math.round((automated / total) * 100) : 0,
      lastAction: lastAction ? lastAction.created_at : null,
      lastActionLabel: lastAction ? this.getActivityTitle(lastAction) : null
    };
  });

  ngOnInit(): void {
    this.loadData();
    this.startRealTimeUpdates();

    // Subscribe to farm selection changes
    this.farmManagement.selectedFarm$.subscribe(selectedFarm => {
      if (selectedFarm) {
        console.log('🏡 [ACTIONS] Farm changed, reloading data for:', selectedFarm.name);
        this.loadData();
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  startRealTimeUpdates(): void {
    this.refreshSubscription = interval(30000).pipe( // Refresh every 30 seconds
      startWith(0),
      switchMap(() => this.loadActions())
    ).subscribe();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const selectedFarm = this.farmManagement.getSelectedFarm();
      if (!selectedFarm) {
        console.log('⚠️ [ACTIONS] No farm selected, skipping data load');
        this.isLoading.set(false);
        return;
      }

      console.log('🏡 [ACTIONS] Loading data for farm:', selectedFarm.name);

      // Load devices for selected farm only
      const devices = await this.apiService.getDevicesByFarm(selectedFarm.farm_id).toPromise();

      this.devices.set(devices || []);

      await this.loadActions();
    } catch (error) {
      console.error('Error loading data:', error);
      this.snackBar.open(this.languageService.t()('actions.loadDataError'), this.languageService.t()('common.close'), { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadActions(offset = 0, append = false): Promise<void> {
    try {
      if (append) {
        this.loadingMore.set(true);
      } else {
        this.isLoading.set(true);
      }

      const selectedFarm = this.farmManagement.getSelectedFarm();
      if (!selectedFarm) {
        console.log('⚠️ [ACTIONS] No farm selected, skipping actions load');
        this.isLoading.set(false);
        this.loadingMore.set(false);
        return;
      }

      // Load last 7 days of actions for selected farm only
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get devices for selected farm to filter actions
      const farmDevices = await this.apiService.getDevicesByFarm(selectedFarm.farm_id).toPromise();
      const farmDeviceIds = farmDevices?.map(device => device.device_id) || [];

      console.log('🏡 [ACTIONS] Loading actions for farm:', selectedFarm.name, 'Devices:', farmDeviceIds);

      // Load actions for each device separately since backend doesn't support multiple device_ids
      let allActions: any[] = [];
      let totalCount = 0;

      for (const deviceId of farmDeviceIds) {
        const response = await this.apiService.getActions({
          limit: 100, // Get more per device to ensure we have enough
          offset: 0,
          from: sevenDaysAgo.toISOString(),
          device_id: deviceId
        }).toPromise();

        if (response?.items) {
          allActions = [...allActions, ...response.items];
          totalCount += response.total || 0;
        }
      }

      // Sort by creation date and apply pagination
      allActions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const paginatedActions = allActions.slice(offset, offset + this.pageSize);

      if (append) {
        // Append to existing actions
        this.actions.set([...this.actions(), ...paginatedActions]);
      } else {
        // Replace actions
        this.actions.set(paginatedActions);
      }

      this.totalActions.set(totalCount);
      this.hasMoreActions.set(this.actions().length < totalCount);

    } catch (error: any) {
      console.error('Error loading actions:', error);
      if (error?.status === 401) {
        this.snackBar.open(this.languageService.t()('auth.sessionExpired'), this.languageService.t()('common.close'), { duration: 5000 });
        // The auth interceptor should handle the redirect
      } else {
        this.snackBar.open(this.languageService.t()('actions.loadActionsError'), this.languageService.t()('common.close'), { duration: 3000 });
      }
    } finally {
      this.isLoading.set(false);
      this.loadingMore.set(false);
    }
  }

  async loadMoreActions(): Promise<void> {
    if (this.loadingMore() || !this.hasMoreActions()) return;

    const currentOffset = this.actions().length;
    await this.loadActions(currentOffset, true);
  }

  refreshActions(): void {
    this.loadActions(0, false); // Reload from beginning
  }

  applyFilters(): void {
    // Filters are applied automatically through computed properties
  }

  clearFilters(): void {
    this.deviceFilter.setValue('');
    this.sourceFilter.setValue('');
    this.statusFilter.setValue('');
    this.fromDateFilter.setValue(null);
    this.toDateFilter.setValue(null);
    this.searchFilter.setValue('');
  }

  getDeviceName(deviceId: string): string {
    const device = this.devices().find(d => d.device_id === deviceId);
    if (device) {
      // Get the selected farm to show farm name
      const selectedFarm = this.farmManagement.getSelectedFarm();
      if (selectedFarm && device.location) {
        return `${selectedFarm.name} - ${device.location}`;
      } else if (device.location) {
        return device.location;
      } else if (selectedFarm) {
        return `${selectedFarm.name} - ${device.name}`;
      } else {
        return device.name;
      }
    }

    // Translate common device names/IDs if no device found
    const deviceMap: { [key: string]: string } = {
      'dht11 sensor': this.languageService.t()('devices.deviceTypes.dht11Sensor'),
      'dht22 sensor': this.languageService.t()('devices.deviceTypes.dht22Sensor'),
      'soil moisture sensor': this.languageService.t()('devices.deviceTypes.soilMoistureSensor'),
      'water pump': this.languageService.t()('devices.deviceTypes.waterPump'),
      'irrigation pump': this.languageService.t()('devices.deviceTypes.irrigationPump'),
      'fan': this.languageService.t()('devices.deviceTypes.fan'),
      'ventilator': this.languageService.t()('devices.deviceTypes.ventilator'),
      'heater': this.languageService.t()('devices.deviceTypes.heater'),
      'light': this.languageService.t()('devices.deviceTypes.light'),
      'led light': this.languageService.t()('devices.deviceTypes.ledLight'),
      'roof motor': this.languageService.t()('devices.deviceTypes.roofMotor'),
      'window motor': this.languageService.t()('devices.deviceTypes.windowMotor'),
      'gateway': this.languageService.t()('devices.deviceTypes.gateway'),
      'controller': this.languageService.t()('devices.deviceTypes.controller')
    };

    const translatedName = deviceMap[deviceId.toLowerCase()];
    return translatedName || deviceId;
  }

  getActionName(actionUri: string): string {
    const parts = actionUri.split('/');
    return parts[parts.length - 1].replace(/_/g, ' ').replace(/mqtt:/, '');
  }

  getActionIcon(actionUri: string): string {
    const action = actionUri.toLowerCase();
    if (action.includes('irrigation')) return 'water_drop';
    if (action.includes('fan') || action.includes('ventilation')) return 'air';
    if (action.includes('heater') || action.includes('heating')) return 'local_fire_department';
    if (action.includes('light')) return 'lightbulb';
    if (action.includes('roof')) return 'open_in_full';
    if (action.includes('alarm')) return 'security';
    if (action.includes('restart')) return 'restart_alt';
    if (action.includes('calibrate')) return 'tune';
    return 'settings';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      queued: 'schedule',
      sent: 'send',
      ack: 'check_circle',
      error: 'error'
    };
    return icons[status] || 'help_outline';
  }

  viewActionDetails(action: ActionLog): void {
    const dialogRef = this.dialog.open(ActionDetailsDialogComponent, {
      width: '600px',
      data: { action, devices: this.devices(), farms: this.farms() }
    });
  }

  retryAction(action: ActionLog): void {
    // TODO: Implement retry functionality
    this.snackBar.open(this.languageService.t()('actions.retryComingSoon'), this.languageService.t()('common.close'), { duration: 3000 });
  }

  exportActions(): void {
    // TODO: Implement export functionality
    this.snackBar.open(this.languageService.t()('actions.exportComingSoon'), this.languageService.t()('common.close'), { duration: 3000 });
  }

  // Farmer-friendly methods
  setTimeFilter(filter: string): void {
    this.selectedTimeFilter.set(filter as 'today' | 'yesterday' | 'week' | 'month');
  }

  openDateRangePicker(): void {
    // Create a simple dialog with date range picker with backdrop blur
    const dialogRef = this.dialog.open(DateRangePickerDialog, {
      width: '90%',
      maxWidth: '600px',
      data: {
        fromDate: this.fromDateFilter.value,
        toDate: this.toDateFilter.value
      },
      panelClass: 'date-range-picker-dialog',
      backdropClass: 'date-range-picker-backdrop',
      disableClose: false,
      hasBackdrop: true
    });

    dialogRef.afterClosed().subscribe((result: { fromDate: Date | null; toDate: Date | null } | undefined) => {
      if (result) {
        this.fromDateFilter.setValue(result.fromDate);
        this.toDateFilter.setValue(result.toDate);
        // Apply the date filter
        if (result.fromDate && result.toDate) {
          this.selectedTimeFilter.set('custom' as any);
        }
      }
    });
  }

  clearDateRange(): void {
    this.fromDateFilter.setValue(null);
    this.toDateFilter.setValue(null);
    this.selectedTimeFilter.set('today');
  }

  getTimeFilterLabel(): string {
    switch (this.selectedTimeFilter()) {
      case 'today': return this.languageService.t()('actions.today');
      case 'yesterday': return this.languageService.t()('actions.yesterday');
      case 'week': return this.languageService.t()('actions.thisWeek');
      case 'month': return this.languageService.t()('actions.thisMonth');
      default: return this.languageService.t()('actions.today');
    }
  }

  getSuccessfulCount(): number {
    return this.filteredActions().filter(a => a.status === 'sent' || a.status === 'ack').length;
  }

  getFailedCount(): number {
    return this.filteredActions().filter(a => a.status === 'error').length;
  }

  getManualCount(): number {
    return this.filteredActions().filter(a => a.trigger_source === 'manual').length;
  }

  getActivityIcon(action: ActionLog): string {
    if (action.status === 'error') return 'error';
    if (action.trigger_source === 'manual') return 'touch_app';

    const actionName = action.action_uri.toLowerCase();
    if (actionName.includes('irrigation') || actionName.includes('water')) return 'water_drop';
    if (actionName.includes('ventilator') || actionName.includes('fan')) return 'air';
    if (actionName.includes('light')) return 'lightbulb';
    if (actionName.includes('heater')) return 'local_fire_department';
    if (actionName.includes('roof')) return 'open_in_full';
    if (actionName.includes('humidifier')) return 'humidity_percentage';
    return 'settings';
  }

  getActivityIconClass(action: ActionLog): string {
    if (action.status === 'error') return 'error-icon';
    if (action.trigger_source === 'manual') return 'manual-icon';
    return 'auto-icon';
  }

  getActivityTitle(action: ActionLog): string {
    const actionName = this.getActionName(action.action_uri);
    const deviceName = this.getDeviceName(action.device_id);

    if (action.trigger_source === 'manual') {
      return this.languageService.t()('actions.manualActionTitle', {
        action: this.getActionNameTranslation(actionName),
        device: deviceName
      });
    } else {
      const reason = this.getAutomationReason(action);
      return this.languageService.t()('actions.automaticActionTitle', {
        action: this.getActionNameTranslation(actionName),
        device: deviceName,
        reason: reason
      });
    }
  }

  getActivityDescription(action: ActionLog): string {
    if (action.status === 'error') {
      return this.languageService.t()('actions.actionFailedDescription', { error: action.error_message || this.languageService.t()('actions.checkDeviceConnection') });
    }

    if (action.trigger_source === 'manual') {
      const time = new Date(action.created_at).toLocaleTimeString();
      return this.languageService.t()('actions.manualActionDescription', { time: time });
    } else {
      const sensorInfo = action.sensor_type && action.value
        ? this.languageService.t()('actions.automaticActionDescription', {
            sensor: this.getSensorTypeTranslation(action.sensor_type),
            value: action.value,
            unit: this.getUnitTranslation(action.unit || '')
          })
        : this.languageService.t()('actions.automaticActionDescriptionSimple');
      return sensorInfo;
    }
  }

  getAutomationReason(action: ActionLog): string {
    if (action.sensor_type && action.value) {
      return this.languageService.t()('actions.automationReason', {
        sensor: this.getSensorTypeTranslation(action.sensor_type),
        value: action.value,
        unit: this.getUnitTranslation(action.unit || '')
      });
    }
    return '';
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'sent': return this.languageService.t()('actions.statusSent');
      case 'ack': return this.languageService.t()('actions.statusConfirmed');
      case 'error': return this.languageService.t()('actions.statusFailed');
      case 'queued': return this.languageService.t()('actions.statusWaiting');
      default: return status;
    }
  }

  getStatusChipClass(status: string): string {
    switch (status) {
      case 'sent':
      case 'ack': return 'success-chip';
      case 'error': return 'error-chip';
      case 'queued': return 'pending-chip';
      default: return '';
    }
  }

  getSourceChipClass(source: string): string {
    return source === 'auto' ? 'auto-chip' : 'manual-chip';
  }

  getSourceText(source: string): string {
    switch (source) {
      case 'auto': return this.languageService.t()('actions.automatic');
      case 'manual': return this.languageService.t()('actions.manual');
      default: return source;
    }
  }

  getSensorTypeTranslation(sensorType: string): string {
    const sensorTypeMap: { [key: string]: string } = {
      'temperature': this.languageService.t()('sensors.sensorTypes.temperature'),
      'humidity': this.languageService.t()('sensors.sensorTypes.humidity'),
      'soil_moisture': this.languageService.t()('sensors.sensorTypes.soilMoisture'),
      'soil': this.languageService.t()('sensors.sensorTypes.soil'),
      'light': this.languageService.t()('sensors.sensorTypes.light'),
      'ph': this.languageService.t()('sensors.sensorTypes.ph'),
      'nutrients': this.languageService.t()('sensors.sensorTypes.nutrients'),
      'pressure': this.languageService.t()('sensors.sensorTypes.pressure'),
      'wind': this.languageService.t()('sensors.sensorTypes.wind'),
      'rain': this.languageService.t()('sensors.sensorTypes.rain'),
      'co2': this.languageService.t()('sensors.sensorTypes.co2')
    };
    return sensorTypeMap[sensorType.toLowerCase()] || sensorType;
  }

  getUnitTranslation(unit: string): string {
    const unitMap: { [key: string]: string } = {
      'celsius': this.languageService.t()('sensors.units.celsius'),
      'fahrenheit': this.languageService.t()('sensors.units.fahrenheit'),
      'percent': this.languageService.t()('sensors.units.percent'),
      'lux': this.languageService.t()('sensors.units.lux'),
      'ph': this.languageService.t()('sensors.units.ph'),
      'bar': this.languageService.t()('sensors.units.bar'),
      'kmh': this.languageService.t()('sensors.units.kmh'),
      'mm': this.languageService.t()('sensors.units.mm'),
      'ppm': this.languageService.t()('sensors.units.ppm')
    };
    return unitMap[unit.toLowerCase()] || unit;
  }

  getActionNameTranslation(actionName: string): string {
    const actionMap: { [key: string]: string } = {
      'irrigation': this.languageService.t()('actions.actionTypes.irrigation'),
      'fertilization': this.languageService.t()('actions.actionTypes.fertilization'),
      'pest control': this.languageService.t()('actions.actionTypes.pestControl'),
      'harvesting': this.languageService.t()('actions.actionTypes.harvesting'),
      'planting': this.languageService.t()('actions.actionTypes.planting'),
      'pruning': this.languageService.t()('actions.actionTypes.pruning'),
      'monitoring': this.languageService.t()('actions.actionTypes.monitoring'),
      'alert': this.languageService.t()('actions.actionTypes.alert'),
      'watering': this.languageService.t()('actions.actionTypes.watering'),
      'ventilation': this.languageService.t()('actions.actionTypes.ventilation'),
      'heating': this.languageService.t()('actions.actionTypes.heating'),
      'lighting': this.languageService.t()('actions.actionTypes.lighting'),
      'open roof': this.languageService.t()('actions.actionTypes.openRoof'),
      'close roof': this.languageService.t()('actions.actionTypes.closeRoof'),
      'open window': this.languageService.t()('actions.actionTypes.openWindow'),
      'close window': this.languageService.t()('actions.actionTypes.closeWindow'),
      'start pump': this.languageService.t()('actions.actionTypes.startPump'),
      'stop pump': this.languageService.t()('actions.actionTypes.stopPump'),
      'turn on fan': this.languageService.t()('actions.actionTypes.turnOnFan'),
      'turn off fan': this.languageService.t()('actions.actionTypes.turnOffFan'),
      'turn on heater': this.languageService.t()('actions.actionTypes.turnOnHeater'),
      'turn off heater': this.languageService.t()('actions.actionTypes.turnOffHeater'),
      'turn on light': this.languageService.t()('actions.actionTypes.turnOnLight'),
      'turn off light': this.languageService.t()('actions.actionTypes.turnOffLight'),
      'humidifier on': this.languageService.t()('actions.actionTypes.humidifierOn'),
      'humidifier off': this.languageService.t()('actions.actionTypes.humidifierOff'),
      'ventilator on': this.languageService.t()('actions.actionTypes.ventilatorOn'),
      'ventilator off': this.languageService.t()('actions.actionTypes.ventilatorOff'),
      'water pump on': this.languageService.t()('actions.actionTypes.waterPumpOn'),
      'water pump off': this.languageService.t()('actions.actionTypes.waterPumpOff'),
      'light on': this.languageService.t()('actions.actionTypes.lightOn'),
      'light off': this.languageService.t()('actions.actionTypes.lightOff')
    };

    return actionMap[actionName.toLowerCase()] || actionName;
  }

  getNoActivityMessage(): string {
    switch (this.selectedTimeFilter()) {
      case 'today': return this.languageService.t()('actions.noActivityToday');
      case 'yesterday': return this.languageService.t()('actions.noActivityYesterday');
      case 'week': return this.languageService.t()('actions.noActivityWeek');
      case 'month': return this.languageService.t()('actions.noActivityMonth');
      default: return this.languageService.t()('actions.noActivityFound');
    }
  }

  trackByActionId(index: number, action: ActionLog): string {
    return action.id || index.toString();
  }

  // New helper methods for redesigned UI
  getTimeFilterIcon(filter: string): string {
    const icons: {[key: string]: string} = {
      today: 'today',
      yesterday: 'history',
      week: 'date_range',
      month: 'calendar_month'
    };
    return icons[filter] || 'calendar_today';
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return this.languageService.t()('actions.justNow');
    if (diffMins < 60) return this.languageService.t()('actions.minutesAgo', { count: diffMins });
    if (diffHours < 24) return this.languageService.t()('actions.hoursAgo', { count: diffHours });
    if (diffDays < 7) return this.languageService.t()('actions.daysAgo', { count: diffDays });
    return this.languageService.t()('actions.weeksAgo');
  }

  isRecent(action: ActionLog): boolean {
    const now = new Date();
    const actionDate = new Date(action.created_at);
    const diffMins = (now.getTime() - actionDate.getTime()) / 60000;
    return diffMins < 5; // Recent if within 5 minutes
  }

  getNodeClass(action: ActionLog): string {
    if (action.status === 'error') return 'error';
    if (action.trigger_source === 'manual') return 'manual';
    if (action.trigger_source === 'auto') return 'auto';
    return 'success';
  }

  getActionIconClass(action: ActionLog): string {
    if (action.status === 'error') return 'error-icon';
    if (action.trigger_source === 'manual') return 'manual-icon';
    return 'auto-icon';
  }

  exportToPDF(): void {
    if (this.filteredActions().length === 0 || this.isExportingPDF()) return;

    this.isExportingPDF.set(true);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `actions-export-${timestamp}.pdf`;

      // Create HTML content for PDF
      const htmlContent = this.generatePDFHTML();

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();

        // Close window after print dialog
        setTimeout(() => {
          printWindow.close();
          this.isExportingPDF.set(false);
          this.snackBar.open(
            this.languageService.t()('actions.exportPDF') + ' ' + this.languageService.t()('common.success'),
            this.languageService.t()('common.close'),
            { duration: 3000, panelClass: ['success-snackbar'] }
          );
        }, 250);
      }, 500);
    } catch (error) {
      console.error('PDF export error:', error);
      this.isExportingPDF.set(false);
      this.snackBar.open(
        this.languageService.t()('common.error') + ': ' + (error instanceof Error ? error.message : 'Export failed'),
        this.languageService.t()('common.close'),
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    }
  }

  private generatePDFHTML(): string {
    const actions = this.filteredActions();
    const stats = this.kpiStats();
    const currentDate = new Date().toLocaleString();
    const farmName = this.selectedFarmFilter() !== 'all'
      ? this.farms().find(f => f.farm_id === this.selectedFarmFilter())?.name || ''
      : this.languageService.t()('actions.allFarms');

    // Calculate additional stats
    const successful = actions.filter(a => a.status === 'sent' || a.status === 'ack').length;
    const failed = actions.filter(a => a.status === 'error' || a.status === 'failed').length;
    const manual = actions.filter(a => a.trigger_source === 'manual').length;
    const auto = actions.filter(a => a.trigger_source === 'auto').length;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Actions Export</title>
  <style>
    @media print {
      @page { margin: 1cm; }
      body { margin: 0; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #10b981;
      padding-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      color: #10b981;
      font-size: 28px;
    }
    .header .meta {
      color: #666;
      font-size: 14px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #10b981;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 12px;
    }
    th {
      background: #10b981;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:hover {
      background: #f8f9fa;
    }
    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-sent { background: #d1fae5; color: #065f46; }
    .status-confirmed { background: #dbeafe; color: #1e40af; }
    .status-failed { background: #fee2e2; color: #991b1b; }
    .status-queued { background: #fef3c7; color: #92400e; }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #999;
      font-size: 11px;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.languageService.t()('actions.title')}</h1>
    <div class="meta">
      ${farmName} | ${currentDate} | ${actions.length} ${this.languageService.t()('actions.totalActions')}
    </div>
  </div>

    <div class="stats">
    <div class="stat-card">
      <div class="stat-value">${stats.total}</div>
      <div class="stat-label">${this.languageService.t()('actions.totalActions')}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${successful}</div>
      <div class="stat-label">${this.languageService.t()('actions.successful')}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${manual}</div>
      <div class="stat-label">${this.languageService.t()('actions.manual')}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${auto}</div>
      <div class="stat-label">${this.languageService.t()('actions.automatic')}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${this.languageService.t()('actions.timestamp')}</th>
        <th>${this.languageService.t()('actions.targetDevice')}</th>
        <th>${this.languageService.t()('actions.actionType')}</th>
        <th>${this.languageService.t()('actions.triggerSource')}</th>
        <th>${this.languageService.t()('actions.status')}</th>
        <th>${this.languageService.t()('actions.performedBy')}</th>
      </tr>
    </thead>
    <tbody>
      ${actions.map(action => `
        <tr>
          <td>${new Date(action.created_at).toLocaleString()}</td>
          <td>${this.getDeviceName(action.device_id)}</td>
          <td>${this.getActionName(action.action_uri)}</td>
          <td>${this.getSourceText(action.trigger_source)}</td>
          <td><span class="status-badge status-${action.status}">${this.getStatusText(action.status)}</span></td>
          <td>${action.trigger_source === 'manual' ? this.languageService.t()('actions.operator') : this.languageService.t()('actions.system')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    Generated by Smart Farm Management System | ${new Date().toLocaleString()}
  </div>
</body>
</html>
    `;
  }

  exportToCSV(): void {
    if (this.filteredActions().length === 0 || this.isExportingCSV()) return;

    this.isExportingCSV.set(true);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `actions-export-${timestamp}.csv`;

      const csvData = this.filteredActions().map(action => ({
        [this.languageService.t()('actions.timestamp')]: new Date(action.created_at).toLocaleString(),
        [this.languageService.t()('actions.targetDevice')]: this.getDeviceName(action.device_id),
        [this.languageService.t()('actions.actionType')]: this.getActionName(action.action_uri),
        [this.languageService.t()('actions.triggerSource')]: this.getSourceText(action.trigger_source),
        [this.languageService.t()('actions.status')]: this.getStatusText(action.status),
        [this.languageService.t()('actions.performedBy')]: action.trigger_source === 'manual'
          ? this.languageService.t()('actions.operator')
          : this.languageService.t()('actions.system'),
        [this.languageService.t()('actions.actionUri')]: action.action_uri || '',
        'Device ID': action.device_id || '',
        'Sensor ID': action.sensor_id || ''
      }));

      const csv = this.convertToCSV(csvData);
      this.downloadCSV(csv, filename);

      setTimeout(() => {
        this.isExportingCSV.set(false);
        this.snackBar.open(
          this.languageService.t()('actions.exportCSV') + ' ' + this.languageService.t()('common.success'),
          this.languageService.t()('common.close'),
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
      }, 300);
    } catch (error) {
      console.error('CSV export error:', error);
      this.isExportingCSV.set(false);
      this.snackBar.open(
        this.languageService.t()('common.error') + ': ' + (error instanceof Error ? error.message : 'Export failed'),
        this.languageService.t()('common.close'),
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    // Escape function for CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const headers = Object.keys(data[0]).map(escapeCSV).join(',');
    const rows = data.map(row =>
      Object.values(row).map(escapeCSV).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  private downloadCSV(csv: string, filename: string): void {
    // Add BOM for UTF-8 to ensure proper encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
