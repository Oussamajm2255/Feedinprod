import { Component, ChangeDetectionStrategy, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Farm } from '../../../../../core/models/farm.model';
import { LanguageService } from '../../../../../core/services/language.service';

export interface FilterState {
  farmId: string;
  sensorType: 'all' | 'temperature' | 'humidity' | 'soil_moisture' | 'light' | 'ph' | 'pressure';
  timeRange: '15m' | '1h' | '6h' | '24h';
  searchQuery: string;
}

@Component({
  selector: 'app-global-filter-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ width: 0, opacity: 0, overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ width: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ width: '*', opacity: 1, overflow: 'hidden' }),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ width: 0, opacity: 0 }))
      ])
    ])
  ],
  template: `
    <header class="filter-header">
      <div class="header-container">
        <!-- Left: Title -->
        <div class="title-content">
          <mat-icon class="title-icon">sensors</mat-icon>
          <div class="title-text">
            <h1>{{ title() }}</h1>
            <p>{{ subtitle() }}</p>
          </div>
        </div>

        <!-- Center: Filters (collapsible) -->
        @if (filtersVisible()) {
          <div class="filters-inline" @slideIn>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Type</mat-label>
              <mat-select
                [ngModel]="filters().sensorType"
                (ngModelChange)="onFilterChange('sensorType', $event)"
              >
                <mat-option value="all">All</mat-option>
                <mat-option value="temperature">🌡️ Temp</mat-option>
                <mat-option value="humidity">💧 Humidity</mat-option>
                <mat-option value="soil_moisture">🌱 Soil</mat-option>
                <mat-option value="light">☀️ Light</mat-option>
                <mat-option value="ph">⚗️ pH</mat-option>
                <mat-option value="pressure">🌀 Pressure</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Range</mat-label>
              <mat-select
                [ngModel]="filters().timeRange"
                (ngModelChange)="onFilterChange('timeRange', $event)"
              >
                <mat-option value="15m">15min</mat-option>
                <mat-option value="1h">1h</mat-option>
                <mat-option value="6h">6h</mat-option>
                <mat-option value="24h">24h</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field search-field">
              <mat-label>Search</mat-label>
              <mat-icon matPrefix class="search-icon">search</mat-icon>
              <input
                matInput
                type="text"
                [ngModel]="filters().searchQuery"
                (ngModelChange)="onFilterChange('searchQuery', $event)"
                placeholder="Search..."
              />
              @if (filters().searchQuery) {
                <button
                  matSuffix
                  mat-icon-button
                  (click)="onFilterChange('searchQuery', '')"
                  matTooltip="Clear"
                  class="clear-btn"
                >
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>
          </div>
        }

        <!-- Right: Actions -->
        <div class="header-actions">
          <button
            mat-icon-button
            [class.active]="filtersVisible()"
            (click)="toggleFilters()"
            [matTooltip]="filtersVisible() ? 'Hide Filters' : 'Show Filters'"
            class="icon-btn filter-toggle"
          >
            <mat-icon>{{ filtersVisible() ? 'filter_list_off' : 'filter_list' }}</mat-icon>
          </button>

          <div class="divider"></div>
          <button
            mat-icon-button
            (click)="refresh.emit()"
            matTooltip="Refresh"
            class="icon-btn"
          >
            <mat-icon [class.spinning]="loading()">refresh</mat-icon>
          </button>

          <button
            mat-icon-button
            [class.active]="autoRefresh()"
            (click)="autoRefreshToggle.emit(!autoRefresh())"
            [matTooltip]="autoRefresh() ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'"
            class="icon-btn"
          >
            <mat-icon>{{ autoRefresh() ? 'sync' : 'sync_disabled' }}</mat-icon>
          </button>

          <button
            mat-icon-button
            [class.active]="density() === 'compact'"
            (click)="densityToggle.emit(density() === 'compact' ? 'comfortable' : 'compact')"
            [matTooltip]="density() === 'compact' ? 'Comfortable' : 'Compact'"
            class="icon-btn"
          >
            <mat-icon>{{ density() === 'compact' ? 'view_comfortable' : 'view_compact' }}</mat-icon>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .filter-header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: var(--glass-bg, rgba(255, 255, 255, 0.8));
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--glass-border, rgba(16, 185, 129, 0.2));
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06),
                    inset 0 1px 0 rgba(255, 255, 255, 0.8);
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Header Container */
      .header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.875rem 1.5rem;
        gap: 1.5rem;
      }

      /* Title Section */
      .title-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .title-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #10b981;
      }

      .title-text h1 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #1f2937;
        letter-spacing: -0.5px;
        white-space: nowrap;
      }

      .title-text p {
        margin: 2px 0 0 0;
        font-size: 0.8rem;
        color: #6b7280;
        font-weight: 500;
      }

      /* Inline Filters */
      .filters-inline {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
        justify-content: center;
        padding: 0 1rem;
      }

      /* Header Actions */
      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .divider {
        width: 1px;
        height: 24px;
        background: linear-gradient(to bottom, transparent, rgba(16, 185, 129, 0.3), transparent);
      }

      .icon-btn {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        color: #6b7280;
        background: transparent;
        position: relative;
        overflow: hidden;
      }

      .icon-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(16, 185, 129, 0.1), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .icon-btn:hover::before {
        opacity: 1;
      }

      .icon-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .icon-btn:hover {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.08));
        color: #10b981;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      }

      .icon-btn.active {
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        color: #065f46;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25),
                    inset 0 1px 1px rgba(255, 255, 255, 0.5);
      }

      .filter-toggle.active {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35),
                    inset 0 1px 1px rgba(255, 255, 255, 0.2);
      }

      .filter-toggle.active:hover {
        background: linear-gradient(135deg, #059669, #047857);
      }

      .spinning {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* Filter Fields */
      .filter-field {
        flex: 0 0 auto;
        width: 130px;
      }

      .search-field {
        flex: 0 0 auto;
        width: 200px;
      }

      /* Compact form fields */
      .filter-field ::ng-deep .mat-mdc-form-field-infix {
        padding-top: 6px;
        padding-bottom: 6px;
        min-height: 36px;
      }

      .filter-field ::ng-deep .mat-mdc-floating-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #6b7280;
      }

      .filter-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      .filter-field ::ng-deep .mat-mdc-text-field-wrapper {
        height: 42px;
      }

      .filter-field ::ng-deep input.mat-mdc-input-element {
        color: #1f2937;
        caret-color: #10b981;
      }

      .filter-field ::ng-deep .mat-mdc-select-value {
        color: #1f2937;
      }

      .filter-field ::ng-deep .mat-mdc-select-arrow {
        color: #6b7280;
      }

      /* Field styling */
      .filter-field ::ng-deep .mat-mdc-text-field-wrapper {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 14px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transition: all 0.2s ease;
      }

      .filter-field ::ng-deep:hover .mat-mdc-text-field-wrapper {
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
      }

      .filter-field ::ng-deep .mdc-notched-outline__leading,
      .filter-field ::ng-deep .mdc-notched-outline__notch,
      .filter-field ::ng-deep .mdc-notched-outline__trailing {
        border-color: rgba(229, 231, 235, 0.8);
        transition: border-color 0.2s ease;
      }

      .filter-field ::ng-deep .mdc-notched-outline__leading {
        border-top-left-radius: 14px;
        border-bottom-left-radius: 14px;
        border-right: none;
      }

      .filter-field ::ng-deep .mdc-notched-outline__trailing {
        border-top-right-radius: 14px;
        border-bottom-right-radius: 14px;
        border-left: none;
      }

      .filter-field ::ng-deep .mdc-notched-outline__notch {
        border-bottom: none;
      }

      /* Hover state */
      .filter-field ::ng-deep:hover .mdc-notched-outline__leading,
      .filter-field ::ng-deep:hover .mdc-notched-outline__notch,
      .filter-field ::ng-deep:hover .mdc-notched-outline__trailing {
        border-color: rgba(16, 185, 129, 0.4);
      }

      /* Focus state */
      .filter-field ::ng-deep .mdc-text-field--focused .mdc-notched-outline__leading,
      .filter-field ::ng-deep .mdc-text-field--focused .mdc-notched-outline__notch,
      .filter-field ::ng-deep .mdc-text-field--focused .mdc-notched-outline__trailing {
        border-color: #10b981;
        border-width: 2px;
      }

      .filter-field ::ng-deep .mdc-text-field--focused .mat-mdc-floating-label {
        color: #10b981;
      }

      /* Search icon */
      .search-icon {
        color: #10b981;
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .clear-btn {
        width: 28px;
        height: 28px;
      }

      .clear-btn mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #9ca3af;
      }

      .clear-btn:hover mat-icon {
        color: #ef4444;
      }

      /* Responsive */
      @media (max-width: 1280px) {
        .header-container {
          padding: 0.75rem 1rem;
          gap: 1rem;
        }

        .filter-field {
          width: 110px;
        }

        .search-field {
          width: 180px;
        }

        .title-text h1 {
          font-size: 1.125rem;
        }
      }

      @media (max-width: 1024px) {
        .title-text p {
          display: none;
        }

        .filters-inline {
          gap: 12px;
          padding: 0 0.75rem;
        }

        .filter-field {
          width: 100px;
        }

        .search-field {
          width: 150px;
        }
      }

      @media (max-width: 768px) {
        .header-container {
          flex-wrap: wrap;
          padding: 0.75rem 1rem;
        }

        .title-content {
          order: 1;
          flex: 1;
        }

        .header-actions {
          order: 2;
        }

        .filters-inline {
          order: 3;
          width: 100%;
          justify-content: flex-start;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(16, 185, 129, 0.1);
        }

        .filter-field,
        .search-field {
          width: auto;
          flex: 1;
          min-width: 90px;
        }

        .title-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        .title-text h1 {
          font-size: 1rem;
        }
      }

      /* Dark theme support */
      :host-context(body.dark-theme) .filter-header {
        background: var(--glass-bg, rgba(30, 41, 59, 0.8));
        border-bottom-color: var(--glass-border, rgba(100, 116, 139, 0.3));
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(100, 116, 139, 0.2);
      }


      :host-context(body.dark-theme) .title-text h1 {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .title-text p {
        color: #94a3b8;
      }


      :host-context(body.dark-theme) .filter-field ::ng-deep .mat-mdc-text-field-wrapper {
        background: rgba(30, 41, 59, 0.9);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      :host-context(body.dark-theme) .filter-field ::ng-deep:hover .mat-mdc-text-field-wrapper {
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
      }

      :host-context(body.dark-theme) .filter-field ::ng-deep .mdc-notched-outline__leading,
      :host-context(body.dark-theme) .filter-field ::ng-deep .mdc-notched-outline__notch,
      :host-context(body.dark-theme) .filter-field ::ng-deep .mdc-notched-outline__trailing {
        border-color: rgba(100, 116, 139, 0.4);
      }

      :host-context(body.dark-theme) .filter-field ::ng-deep:hover .mdc-notched-outline__leading,
      :host-context(body.dark-theme) .filter-field ::ng-deep:hover .mdc-notched-outline__notch,
      :host-context(body.dark-theme) .filter-field ::ng-deep:hover .mdc-notched-outline__trailing {
        border-color: rgba(16, 185, 129, 0.6);
      }

      :host-context(body.dark-theme) .filter-field ::ng-deep .mat-mdc-floating-label {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .filter-field ::ng-deep input.mat-mdc-input-element {
        color: #f1f5f9;
        caret-color: #34d399;
      }

      :host-context(body.dark-theme) .filter-field ::ng-deep input.mat-mdc-input-element::placeholder {
        color: #64748b;
      }

      :host-context(body.dark-theme) .filter-field ::ng-deep .mat-mdc-select-value {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .filter-field ::ng-deep .mat-mdc-select-arrow {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .filter-field ::ng-deep .mdc-text-field--focused .mat-mdc-floating-label {
        color: #34d399;
      }

      :host-context(body.dark-theme) .search-icon {
        color: #34d399;
      }

      :host-context(body.dark-theme) .divider {
        background: linear-gradient(to bottom, transparent, rgba(52, 211, 153, 0.4), transparent);
      }

      :host-context(body.dark-theme) .icon-btn {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .icon-btn:hover {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.12));
        color: #10b981;
      }

      :host-context(body.dark-theme) .icon-btn.active {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2));
        color: #34d399;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3),
                    inset 0 1px 1px rgba(255, 255, 255, 0.1);
      }

      :host-context(body.dark-theme) .filter-toggle.active {
        background: linear-gradient(135deg, #059669, #047857);
        color: #34d399;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4),
                    inset 0 1px 1px rgba(255, 255, 255, 0.15);
      }
    `,
  ],
})
export class GlobalFilterHeaderComponent {
  // Services
  languageService = inject(LanguageService);

  // Inputs
  title = input<string>('Sensor Readings');
  subtitle = input<string>('Real-time monitoring & insights');
  farms = input<Farm[]>([]);
  filters = input<FilterState>({
    farmId: '',
    sensorType: 'all',
    timeRange: '1h',
    searchQuery: '',
  });
  loading = input<boolean>(false);
  autoRefresh = input<boolean>(true);
  density = input<'comfortable' | 'compact'>('comfortable');

  // Local state
  filtersVisible = signal<boolean>(true);

  // Outputs
  filterChange = output<Partial<FilterState>>();
  refresh = output<void>();
  autoRefreshToggle = output<boolean>();
  densityToggle = output<'comfortable' | 'compact'>();

  onFilterChange(key: keyof FilterState, value: any): void {
    this.filterChange.emit({ [key]: value });
  }

  toggleFilters(): void {
    this.filtersVisible.update(v => !v);
  }
}

