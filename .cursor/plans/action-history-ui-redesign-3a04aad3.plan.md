<!-- 3a04aad3-6c75-4f9f-9ad4-05c2e4ec80b6 dd167e31-542a-4793-b1bd-88c65939faa2 -->
# Action History Component - Complete UI/UX Redesign

## Overview

Redesign Tab 1 (Action History) with glassmorphic hybrid Table + Timeline views, persistent KPI header, and enhanced filters. Tabs 2 & 3 remain unchanged. Zero changes to core logic, services, or API calls.

## Architecture

### File Structure (No new files needed)

- **actions.component.ts** - Inline template enhancement + new animation triggers
- **actions.component.ts** - SCSS refactor with glassmorphic design system
- Preserve: All signals, computed properties, methods, and subscriptions

### Design System Integration

- Match existing `styles.scss` CSS variables (`--glass-bg`, `--text-primary`, etc.)
- Use `:host-context(body.dark-theme)` for dark mode
- Animation timing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design standard)
- Border radius: 16px for cards, 12px for chips, 8px for buttons

## Implementation Phases

### Phase 1: Component Structure Enhancement

**1.1 Add Angular Animations Module**

```typescript:81:actions.component.ts
// Add to imports array
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';

// Add animations array to @Component decorator
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
  ])
]
```

**1.2 Add New Signals for View State**

```typescript:990:actions.component.ts
// Add after existing signals around line 990
selectedView = signal<'table' | 'timeline'>('timeline'); // Default to timeline
showAdvancedFilters = signal(false);
selectedFarmFilter = signal<string>('all');
selectedActionTypeFilter = signal<string>('all');
searchQuery = signal<string>('');
```

**1.3 Add Computed Properties for KPIs**

```typescript:1068:actions.component.ts
// Add after stats computed property
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
```

### Phase 2: Template Redesign - KPI Header

**2.1 Replace Existing Header (lines 83-87)**

```html
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
```

### Phase 3: Template Redesign - Tab 1 Replacement

**3.1 Replace Action History Tab Content (lines 91-236)**

```html
<mat-tab [label]="languageService.t()('actions.history')">
  <div class="tab-content" [@tabSwitch]>
    
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
                  [matMenuTriggerFor]="dateRangeMenu"
                  matTooltip="{{ languageService.t()('actions.customRange') }}"
                  class="calendar-trigger">
            <mat-icon>date_range</mat-icon>
          </button>
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
      <button mat-button class="toggle-filters-btn" (click)="showAdvancedFilters.set(!showAdvancedFilters())">
        <mat-icon>{{ showAdvancedFilters() ? 'expand_less' : 'expand_more' }}</mat-icon>
        {{ showAdvancedFilters() ? languageService.t()('actions.lessFilters') : languageService.t()('actions.moreFilters') }}
      </button>
    </div>

    <!-- View Toggle: Table vs Timeline -->
    <div class="view-toggle-section">
      <mat-button-toggle-group [(value)]="selectedView" class="view-toggle-group">
        <mat-button-toggle value="table">
          <mat-icon>table_rows</mat-icon>
          {{ languageService.t()('actions.tableView') }}
        </mat-button-toggle>
        <mat-button-toggle value="timeline">
          <mat-icon>timeline</mat-icon>
          {{ languageService.t()('actions.timelineView') }}
        </mat-button-toggle>
      </mat-button-toggle-group>

      <!-- Export Actions -->
      <div class="action-buttons">
        <button mat-stroked-button (click)="exportToPDF()">
          <mat-icon>picture_as_pdf</mat-icon>
          {{ languageService.t()('actions.exportPDF') }}
        </button>
        <button mat-stroked-button (click)="exportToCSV()">
          <mat-icon>file_download</mat-icon>
          {{ languageService.t()('actions.exportCSV') }}
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
```

### Phase 4: SCSS Redesign (Glassmorphic Design System)

**4.1 Core Layout & Variables**

```scss
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
```

**4.2 Filters Section**

```scss
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
  border-radius: 24px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  mat-icon {
    font-size: 16px;
    width: 16px;
    height: 16px;
    margin-right: 0.25rem;
  }

  &:hover {
    background: rgba(16, 185, 129, 0.1);
    border-color: var(--primary-green);
    transform: translateY(-2px);
  }

  &.active {
    background: var(--primary-green);
    color: white;
    border-color: var(--primary-green);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
}

.calendar-trigger {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(16, 185, 129, 0.1);
    border-color: var(--primary-green);
  }
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.filter-field {
  width: 100%;
}

.toggle-filters-btn {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);

  mat-icon {
    transition: transform 0.3s ease;
  }
}
```

**4.3 Table View Styling**

```scss
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
```

**4.4 Timeline View Styling**

```scss
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
```

**4.5 AI Insights & Responsive**

```scss
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

// Dark Theme Support
:host-context(body.dark-theme) {
  .kpi-card, .glass-card {
    background: var(--glass-bg, rgba(30, 41, 59, 0.7));
    border-color: var(--glass-border, rgba(100, 116, 139, 0.3));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(100, 116, 139, 0.1);
  }

  .kpi-card:hover, .glass-card:hover {
    box-shadow: 0 12px 24px rgba(16, 185, 129, 0.2), inset 0 1px 1px rgba(100, 116, 139, 0.2);
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
```

### Phase 5: Helper Methods & Logic

**5.1 Add New Methods (No Logic Changes)**

```typescript
// Add these methods to the component class

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
  // Placeholder for PDF export
  this.snackBar.open(
    this.languageService.t()('actions.exportPDFComingSoon'), 
    this.languageService.t()('common.close'), 
    { duration: 3000 }
  );
}

exportToCSV(): void {
  // Simple CSV export implementation
  const csvData = this.filteredActions().map(action => ({
    timestamp: action.created_at,
    action: this.getActionName(action.action_uri),
    trigger: action.trigger_source,
    status: action.status,
    device: this.getDeviceName(action.device_id)
  }));

  const csv = this.convertToCSV(csvData);
  this.downloadCSV(csv, 'actions-export.csv');
}

private convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  return [headers, ...rows].join('\n');
}

private downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

// Update displayedColumns for table
displayedTableColumns: string[] = [
  'timestamp',
  'actionType',
  'triggerSource',
  'status',
  'targetDevice',
  'performedBy'
];
```

### Phase 6: i18n Translation Keys

**6.1 Add Translation Keys** (tell user to add these)

```typescript
// Add to language files (en.json, ar.json, he.json)
{
  "actions": {
    "filters": "Filters",
    "moreFilters": "Show More Filters",
    "lessFilters": "Show Less Filters",
    "tableView": "Table View",
    "timelineView": "Timeline View",
    "customRange": "Custom Date Range",
    "allFarms": "All Farms",
    "allTypes": "All Action Types",
    "searchPlaceholder": "Search actions...",
    "exportPDF": "Export PDF",
    "exportCSV": "Export CSV",
    "noActionsFound": "No Actions Found",
    "tryAdjustingFilters": "Try adjusting your filters or time range",
    "showDetails": "Show Details",
    "insights": "AI Insights",
    "mostFrequentAction": "Most frequent action: {{action}} – {{percent}}% of last 7 days",
    "justNow": "Just now",
    "minutesAgo": "{{count}} min ago",
    "hoursAgo": "{{count}}h ago",
    "daysAgo": "{{count}}d ago",
    "weeksAgo": "Weeks ago",
    "system": "System",
    "operator": "Operator",
    "manualPercent": "Manual Actions",
    "automatedPercent": "Automated",
    "farm": "Farm",
    "actionType": "Action Type",
    "search": "Search",
    "timestamp": "Timestamp",
    "triggerSource": "Trigger Source",
    "targetDevice": "Target Device",
    "performedBy": "Performed By",
    "exportPDFComingSoon": "PDF export coming soon",
    "noActivityDescription": "Actions will appear here once devices start operating"
  }
}
```

## Testing Checklist

- [ ] KPI header displays correctly across all tabs
- [ ] Time filter buttons work (Today/Yesterday/Week/Month)
- [ ] Advanced filters toggle smoothly
- [ ] Table view displays with sticky header
- [ ] Table rows animate on load (stagger effect)
- [ ] Table hover effects work
- [ ] Timeline view shows glassmorphic nodes
- [ ] Timeline pulse animation on recent actions
- [ ] Dark/Light theme transitions smooth
- [ ] CSV export downloads correctly
- [ ] Responsive layout works on mobile (< 768px)
- [ ] All i18n translations display correctly
- [ ] No console errors
- [ ] Existing Tab 2 & 3 still work
- [ ] Pagination works in table view
- [ ] Load more works in timeline view

## Rollback Plan

If issues occur, restore from:

```bash
git checkout HEAD -- src/app/features/actions/actions.component.ts
```

The entire component is self-contained (inline template/styles), so rollback is instant.

## Performance Notes

- OnPush change detection preserved
- Signals used for reactive state
- Animations use GPU-accelerated properties (transform, opacity)
- Backdrop-filter may be expensive on low-end devices (consider feature detection)
- Large action lists use virtual scrolling consideration for future

## Success Criteria

✅ Glassmorphic design matches dashboard

✅ Smooth 60fps animations

✅ Dark/Light theme support

✅ Fully responsive (mobile-first)

✅ All existing functionality preserved

✅ Zero API/service changes

✅ Production-ready code quality

✅ Comprehensive i18n support

### To-dos

- [ ] Import @angular/animations and add animation triggers (tabSwitch, rowAnimation, hoverLift) to component decorator
- [ ] Add new signals for selectedView, showAdvancedFilters, selectedFarmFilter, selectedActionTypeFilter, searchQuery
- [ ] Create kpiStats computed property for Total Actions, Manual %, Automated %, Last Action calculations
- [ ] Replace existing header with glassmorphic KPI cards grid (4 cards: Total, Manual %, Auto %, Last Action)
- [ ] Create advanced filter section with time chips, farm selector, action type filter, and search input above tabs
- [ ] Add mat-button-toggle-group for Table/Timeline view switching with export buttons
- [ ] Create table view with mat-table, 6 columns (Timestamp, Action Type, Trigger Source, Status, Target Device, Performed By), sticky header, hover animations
- [ ] Redesign timeline view with glassmorphic nodes, vertical track line, pulse animation for recent actions, hover lift effects
- [ ] Add AI Insights section at bottom with sparkle icon and placeholder insights text
- [ ] Write SCSS for KPI header: glassmorphic cards, hover effects, sparkline mini-charts, icon gradients
- [ ] Write SCSS for filter section: time chips with active state, toggle animations, grid layout
- [ ] Write SCSS for table view: sticky header, row hover effects, animated chips, status indicators with pulse
- [ ] Write SCSS for timeline view: vertical track, node indicators, glassmorphic cards, pulse ring animation
- [ ] Add dark theme support using :host-context(body.dark-theme) for all components
- [ ] Add responsive breakpoints for mobile (768px), tablet (1200px), and phone (480px)
- [ ] Add helper methods: getTimeFilterIcon, getRelativeTime, isRecent, getNodeClass, getActionIconClass
- [ ] Implement exportToPDF (placeholder) and exportToCSV (working CSV download) methods
- [ ] Update displayedTableColumns array with new column definitions
- [ ] Document all new translation keys needed for en.json, ar.json, he.json files
- [ ] Test KPI header displays correctly, hover animations work, values update with time filter changes
- [ ] Test table/timeline view toggle works smoothly with animations
- [ ] Test all filter combinations work, advanced filters toggle smoothly
- [ ] Test dark/light theme transitions are smooth, all colors adapt correctly
- [ ] Test responsive layout on mobile (< 768px), tablet (< 1200px), ensure touch-friendly
- [ ] Verify Tabs 2 (Recent Actions Feed) and 3 (Manual Control) still work correctly