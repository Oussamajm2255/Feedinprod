import { Component, OnInit, signal, computed, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';

import { CropService, CropDashboardData, KPIFilter } from '../../core/services/crop.service';
import { CropKpiHeaderComponent } from './component/crop-kpi-header.component';
import { CropHealthAnalyticsComponent } from './component/crop-health-analytics.component';
import { CropSmartActionsComponent } from './component/crop-smart-actions.component';
import { CropEventsTimelineComponent } from './component/crop-events-timeline.component';
import { Crop } from '../../core/models/farm.model';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

/**
 * 🌾 Crops Dashboard Component - TerraFlow Design System
 * 
 * A modern, responsive dashboard for crop monitoring with real-time analytics.
 * Features:
 * - Clean TerraFlow-inspired design with primary green (#10b981) theme
 * - Inline template & styles for better component encapsulation
 * - OnPush change detection for optimal performance
 * - Dark/Light mode support via CSS variables
 * - Full i18n support (ready for translation pipes)
 * - Accessible with ARIA labels and focus indicators
 * - Smooth animations and micro-interactions
 */
@Component({
  selector: 'app-crop-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatRippleModule,
    MatChipsModule,
    CropKpiHeaderComponent,
    CropHealthAnalyticsComponent,
    CropSmartActionsComponent,
    CropEventsTimelineComponent,
    TranslatePipe
  ],
  animations: [
    // Fade in animation for container
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    // Slide in animation for content
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        opacity: '0',
        overflow: 'hidden'
      })),
      state('expanded', style({
        height: '*',
        opacity: '1',
        overflow: 'visible'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ],
  template: `
    <!-- 🎨 Main Container - TerraFlow Theme -->
    <div class="crop-dashboard-container" [@fadeIn] [attr.dir]="languageService.getCurrentLanguage().direction">
      
      <!-- ⏳ Loading State - Elegant Spinner -->
      <div *ngIf="loading()" class="state-container loading-state" role="status" aria-live="polite">
        <div class="spinner-wrapper">
          <mat-spinner [diameter]="60" color="primary"></mat-spinner>
          <div class="loading-pulse"></div>
        </div>
        <h3 class="state-title">{{ 'crops.dashboard.states.loading.title' | translate }}</h3>
        <p class="state-subtitle">{{ 'crops.dashboard.states.loading.subtitle' | translate }}</p>
      </div>

      <!-- ❌ Error State - User-Friendly Error Display -->
      <div *ngIf="error() && !loading()" class="state-container error-state" role="alert" aria-live="assertive">
        <div class="error-icon-wrapper">
          <mat-icon class="error-icon">error_outline</mat-icon>
        </div>
        <h3 class="state-title">{{ 'crops.dashboard.states.error.title' | translate }}</h3>
        <p class="state-subtitle">{{ error() }}</p>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="refreshDashboard()"
          [attr.aria-label]="'crops.dashboard.states.error.retryAria' | translate">
          <mat-icon>refresh</mat-icon>
          {{ 'crops.dashboard.states.error.cta' | translate }}
        </button>
      </div>

      <!-- 📭 Empty State - Onboarding Experience -->
      <div *ngIf="!loading() && !error() && !hasCrops()" class="state-container empty-state">
        <div class="empty-icon-wrapper">
          <mat-icon class="empty-icon">agriculture</mat-icon>
          <div class="icon-decoration"></div>
        </div>
        <h2 class="state-title">{{ 'crops.dashboard.states.empty.title' | translate }}</h2>
        <p class="state-subtitle">{{ 'crops.dashboard.states.empty.subtitle' | translate }}</p>
        <button 
          mat-raised-button 
          color="primary" 
          routerLink="/crops/create"
          class="cta-button"
          [attr.aria-label]="'crops.dashboard.states.empty.ctaAria' | translate">
          <mat-icon>add_circle</mat-icon>
          {{ 'crops.dashboard.states.empty.cta' | translate }}
        </button>
      </div>

      <!-- 📊 Main Dashboard Content - Data-Rich Interface -->
      <div *ngIf="!loading() && !error() && dashboardData()" class="dashboard-content" [@slideIn]>

        <!-- 🎯 Header Section - Crop Selector & Actions -->
        <header class="dashboard-header" role="banner">
          <div class="header-content">
            
            <!-- Left: Crop Selector & Info -->
            <div class="header-left">
              <mat-form-field appearance="outline" class="crop-selector" subscriptSizing="dynamic">
                <mat-label>
                  <mat-icon class="selector-icon">agriculture</mat-icon>
                  {{ 'crops.dashboard.header.selectCrop' | translate }}
                </mat-label>
                <mat-select
                  [value]="selectedCropId()"
                  (selectionChange)="onCropChange($event.value)"
                  [attr.aria-label]="'crops.dashboard.header.selectAria' | translate">
                  <mat-option 
                    *ngFor="let crop of crops(); trackBy: trackByCropId" 
                    [value]="crop.crop_id">
                    <div class="crop-option">
                      <span class="crop-name">{{ crop.name }}</span>
                      <span class="crop-variety" *ngIf="crop.variety">({{ crop.variety }})</span>
                    </div>
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Crop Title & Status Badge -->
              <div class="crop-header-info" *ngIf="dashboardData()?.crop">
                <h1 class="crop-title">
                  <mat-icon class="title-icon">eco</mat-icon>
                  {{ dashboardData()!.crop.name }}
                </h1>
                <mat-chip 
                  [class]="'status-chip status-' + dashboardData()!.crop.status"
                [attr.aria-label]="('crops.dashboard.aria.status' | translate:{ status: getStatusLabel(dashboardData()!.crop.status) })">
                  <mat-icon class="chip-icon">{{ getStatusIcon(dashboardData()!.crop.status) }}</mat-icon>
                  {{ getStatusLabel(dashboardData()!.crop.status) }}
                </mat-chip>
              </div>
            </div>

            <!-- Right: Quick Actions -->
            <div class="header-actions">
              <button 
                mat-icon-button 
                (click)="refreshDashboard()" 
                [matTooltip]="'crops.dashboard.header.actions.refresh' | translate"
                class="action-btn refresh-btn"
                [attr.aria-label]="'crops.dashboard.header.actions.refreshAria' | translate">
                <mat-icon>refresh</mat-icon>
              </button>
              <button 
                mat-icon-button 
                (click)="editCrop()" 
                [matTooltip]="'crops.dashboard.header.actions.edit' | translate"
                class="action-btn edit-btn"
                [attr.aria-label]="'crops.dashboard.header.actions.editAria' | translate">
                <mat-icon>edit</mat-icon>
              </button>
              <button 
                mat-stroked-button 
                color="primary" 
                routerLink="/crops"
                class="view-all-btn"
                [attr.aria-label]="'crops.dashboard.header.actions.viewAllAria' | translate">
                <mat-icon>view_list</mat-icon>
                {{ 'crops.dashboard.header.actions.viewAll' | translate }}
              </button>
            </div>
          </div>
        </header>

        <!-- 📈 KPI Header - Key Performance Indicators -->
        <section class="kpi-section" role="region" [attr.aria-label]="'crops.dashboard.kpi.ariaLabel' | translate">
          <app-crop-kpi-header
            [kpis]="dashboardData()!.kpis"
            [healthStatus]="dashboardData()!.healthStatus"
            [activeFilter]="activeKPIFilter()"
            (filterChange)="onKPIFilterChange($event)">
          </app-crop-kpi-header>
        </section>

        <!-- 🏗️ Main Grid Layout - Analytics & Details -->
        <section class="main-grid" role="main">
          
          <!-- Left: Health Analytics Panel -->
          <div class="health-panel">
            <app-crop-health-analytics
              [cropId]="selectedCropId()!"
              [sensors]="dashboardData()!.sensors">
            </app-crop-health-analytics>
          </div>

          <!-- Right: Details Sidebar -->
          <aside class="details-sidebar" role="complementary" [attr.aria-label]="'crops.dashboard.details.ariaLabel' | translate">
            
            <!-- Crop Details Card -->
            <mat-card class="details-card" appearance="outlined">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon class="card-icon">info</mat-icon>
                  {{ 'crops.dashboard.details.title' | translate }}
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <dl class="details-list">
                  <div class="detail-row">
                    <dt class="detail-label">{{ 'crops.dashboard.details.variety' | translate }}</dt>
                    <dd class="detail-value">{{ dashboardData()?.crop?.variety || ('crops.dashboard.details.notAvailable' | translate) }}</dd>
                  </div>
                  <div class="detail-row">
                    <dt class="detail-label">{{ 'crops.dashboard.details.planted' | translate }}</dt>
                    <dd class="detail-value">
                      {{ dashboardData()?.crop?.planting_date ? (dashboardData()!.crop.planting_date | date:'mediumDate') : ('crops.dashboard.details.notAvailable' | translate) }}
                    </dd>
                  </div>
                  <div class="detail-row">
                    <dt class="detail-label">{{ 'crops.dashboard.details.expectedHarvest' | translate }}</dt>
                    <dd class="detail-value">
                      {{ dashboardData()?.crop?.expected_harvest_date ? (dashboardData()!.crop.expected_harvest_date | date:'mediumDate') : ('crops.dashboard.details.notAvailable' | translate) }}
                    </dd>
                  </div>
                  <div class="detail-row">
                    <dt class="detail-label">{{ 'crops.dashboard.details.status' | translate }}</dt>
                    <dd class="detail-value">
                      <span class="status-badge" *ngIf="dashboardData()?.crop" [class]="'status-' + dashboardData()!.crop.status">
                        {{ getStatusLabel(dashboardData()!.crop.status) }}
                      </span>
                    </dd>
                  </div>
                  <div class="detail-row full-width" *ngIf="dashboardData()?.crop?.description">
                    <dt class="detail-label">{{ 'crops.dashboard.details.description' | translate }}</dt>
                    <dd class="detail-value description-text">{{ dashboardData()!.crop.description }}</dd>
                  </div>
                  <div class="detail-row full-width" *ngIf="dashboardData()?.crop?.notes">
                    <dt class="detail-label">{{ 'crops.dashboard.details.notes' | translate }}</dt>
                    <dd class="detail-value notes-text">{{ dashboardData()!.crop.notes }}</dd>
                  </div>
                </dl>
              </mat-card-content>
            </mat-card>

            <!-- Connected Sensors Card -->
            <mat-card class="sensors-card" appearance="outlined">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon class="card-icon sensors-icon">sensors</mat-icon>
                  {{ 'crops.dashboard.sensors.title' | translate }}
                  <span class="sensor-count" *ngIf="dashboardData()?.sensors?.length">
                    ({{ dashboardData()!.sensors.length }})
                  </span>
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                
                <!-- No Sensors State -->
                <div *ngIf="dashboardData()?.sensors?.length === 0" class="no-sensors">
                  <mat-icon class="no-sensors-icon">sensors_off</mat-icon>
                  <p class="no-sensors-text">{{ 'crops.dashboard.sensors.empty' | translate }}</p>
                </div>

                <!-- Sensors List -->
                <ul class="sensor-list" *ngIf="dashboardData()?.sensors?.length" role="list">
                  <li 
                    *ngFor="let sensor of dashboardData()!.sensors; trackBy: trackBySensorId" 
                    class="sensor-item"
                    matRipple
                    [matRippleColor]="'rgba(16, 185, 129, 0.1)'"
                    role="listitem">
                    <mat-icon class="sensor-icon" [class]="'sensor-type-' + getSensorIconClass(sensor.type)">
                      {{ getSensorIcon(sensor.type) }}
                    </mat-icon>
                    <div class="sensor-info">
                      <span class="sensor-type">{{ sensor.type }}</span>
                      <span class="sensor-location">{{ sensor.location || ('crops.common.noLocation' | translate) }}</span>
                    </div>
                    <span class="sensor-unit">{{ sensor.unit }}</span>
                  </li>
                </ul>
              </mat-card-content>
            </mat-card>
          </aside>
        </section>

        <!-- 🎮 Smart Actions Section -->
        <section class="actions-section" role="region" [attr.aria-label]="'crops.dashboard.actions.ariaLabel' | translate">
          <app-crop-smart-actions
            [cropId]="selectedCropId()!"
            [sensors]="dashboardData()!.sensors">
          </app-crop-smart-actions>
        </section>

        <!-- 📅 Events Timeline Section with Collapsible Wrapper -->
        <section class="events-wrapper" role="region" [attr.aria-label]="'crops.dashboard.timeline.ariaLabel' | translate">
          <div class="section-header collapsible" (click)="toggleTimeline()">
            <div class="header-left">
              <mat-icon class="section-icon">history</mat-icon>
              <h2>{{ 'crops.dashboard.timeline.title' | translate }}</h2>
            </div>
            <button 
              mat-icon-button 
              class="toggle-btn" 
              [attr.aria-label]="timelineExpanded() ? ('crops.dashboard.timeline.hideAria' | translate) : ('crops.dashboard.timeline.showAria' | translate)"
              [attr.aria-expanded]="timelineExpanded()">
              <mat-icon>{{ timelineExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
          </div>
          
          <div class="timeline-content" [@expandCollapse]="timelineExpanded() ? 'expanded' : 'collapsed'">
            <app-crop-events-timeline
              [cropId]="selectedCropId()!"
              [sensors]="dashboardData()!.sensors">
            </app-crop-events-timeline>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    /* ========================================
       🎨 TERRAFLOW DESIGN SYSTEM - CROPS DASHBOARD
       ======================================== */

    /* === ANIMATIONS === */
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* === MAIN CONTAINER === */
    .crop-dashboard-container {
      padding: 2rem;
      max-width: 1600px;
      margin: 0 auto;
      min-height: calc(100vh - 80px);
      background: var(--light-bg, #f9fafb);
      animation: fadeIn 0.4s ease;
    }

    /* === STATE CONTAINERS (Loading, Error, Empty) === */
    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      gap: 1.5rem;
      padding: 3rem;
      animation: fadeIn 0.6s ease;
    }

    .state-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary, #1f2937);
    }

    .state-subtitle {
      margin: 0;
      font-size: 1rem;
      color: var(--text-secondary, #6b7280);
      max-width: 500px;
      line-height: 1.6;
    }

    /* Loading State */
    .loading-state {
      .spinner-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .loading-pulse {
        position: absolute;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.2), transparent);
        animation: pulse 2s infinite;
      }
    }

    /* Error State */
    .error-state {
      .error-icon-wrapper {
        position: relative;
        width: 100px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
        border-radius: 50%;
        border: 2px solid rgba(239, 68, 68, 0.2);
      }

      .error-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: var(--danger, #ef4444);
      }
    }

    /* Empty State */
    .empty-state {
      .empty-icon-wrapper {
        position: relative;
        width: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-icon {
        font-size: 72px;
        width: 72px;
        height: 72px;
        color: var(--primary-green, #10b981);
        z-index: 1;
      }

      .icon-decoration {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.15), transparent 70%);
        border-radius: 50%;
        animation: pulse 3s infinite;
      }

      .cta-button {
        margin-top: 1rem;
        padding: 0.75rem 2rem;
        font-size: 1.05rem;
        box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }
      }
    }

    /* === DASHBOARD HEADER === */
    .dashboard-header {
      margin-bottom: 2rem;
      animation: slideIn 0.5s ease;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: var(--card-bg, #ffffff);
      border-radius: 16px;
      border: 1px solid var(--border-color, #e5e7eb);
      box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.12);
      }
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 2rem;
      flex: 1;
    }

    /* Crop Selector */
    .crop-selector {
      min-width: 280px;
      margin: 0;

      .selector-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-right: 0.5rem;
        vertical-align: middle;
        color: var(--primary-green, #10b981);
      }

      ::ng-deep .mat-mdc-form-field-focus-overlay {
        background-color: rgba(16, 185, 129, 0.05);
      }

      /* Form Field Outline */
      ::ng-deep .mat-mdc-text-field-wrapper {
        background: var(--card-bg, #ffffff);
        border-radius: 12px;
        transition: all 0.3s ease;
      }

      ::ng-deep .mdc-notched-outline__leading,
      ::ng-deep .mdc-notched-outline__notch,
      ::ng-deep .mdc-notched-outline__trailing {
        border-color: var(--border-color, #e5e7eb) !important;
        transition: border-color 0.3s ease;
      }

      /* Focused State */
      ::ng-deep .mat-focused .mdc-notched-outline__leading,
      ::ng-deep .mat-focused .mdc-notched-outline__notch,
      ::ng-deep .mat-focused .mdc-notched-outline__trailing {
        border-color: var(--primary-green, #10b981) !important;
        border-width: 2px !important;
      }

      /* Label */
      ::ng-deep .mat-mdc-form-field-label {
        color: var(--text-secondary, #6b7280);
      }

      ::ng-deep .mat-focused .mat-mdc-form-field-label {
        color: var(--primary-green, #10b981) !important;
      }

      /* Input Text */
      ::ng-deep .mat-mdc-select-value,
      ::ng-deep .mat-mdc-select-placeholder {
        color: var(--text-primary, #1f2937);
      }

      /* Arrow Icon */
      ::ng-deep .mat-mdc-select-arrow {
        color: var(--primary-green, #10b981);
      }
    }

    /* Dropdown Panel Styles */
    ::ng-deep .mat-mdc-select-panel {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      margin-top: 8px;
    }

    /* Option Styles */
    ::ng-deep .mat-mdc-option {
      color: var(--text-primary, #1f2937);
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(16, 185, 129, 0.08);
      }

      &.mat-mdc-option-active,
      &.mdc-list-item--selected {
        background: rgba(16, 185, 129, 0.12);
        color: var(--primary-green, #10b981);
        
        .crop-name {
          font-weight: 600;
        }
      }
    }

    .crop-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .crop-name {
        font-weight: 500;
        color: var(--text-primary, #1f2937);
      }

      .crop-variety {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
      }
    }

    /* Crop Header Info */
    .crop-header-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .crop-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary, #1f2937);
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .title-icon {
        color: var(--primary-green, #10b981);
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    /* Status Chip */
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      border-radius: 16px;
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 2px solid transparent;
      transition: all 0.2s ease;

      .chip-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.status-planted {
        background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        color: #1e40af;
        border-color: #93c5fd;
      }

      &.status-growing {
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        color: #065f46;
        border-color: #6ee7b7;
      }

      &.status-harvested {
        background: linear-gradient(135deg, #fed7aa, #fdba74);
        color: #92400e;
        border-color: #fb923c;
      }

      &.status-failed {
        background: linear-gradient(135deg, #fecaca, #fca5a5);
        color: #991b1b;
        border-color: #f87171;
      }
    }

    /* Header Actions */
    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .action-btn {
      transition: all 0.2s ease;

      &:hover {
        background: rgba(16, 185, 129, 0.1);
        color: var(--primary-green, #10b981);
        transform: scale(1.05);
      }

      &.refresh-btn:hover mat-icon {
        animation: spin 0.6s ease;
      }
    }

    .view-all-btn {
      border-color: var(--primary-green, #10b981);
      color: var(--primary-green, #10b981);
      transition: all 0.2s ease;

      &:hover {
        background: var(--primary-green, #10b981);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
    }

    /* === KPI SECTION === */
    .kpi-section {
      margin-bottom: 2rem;
      animation: slideIn 0.6s ease 0.1s both;
    }

    /* === MAIN GRID LAYOUT === */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
      margin-bottom: 2rem;
      animation: slideIn 0.7s ease 0.2s both;
    }

    .health-panel {
      min-width: 0; /* Prevent grid overflow */
    }

    /* === DETAILS SIDEBAR === */
    .details-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Details Card */
    .details-card,
    .sensors-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 16px;
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
      transition: all 0.3s ease;

      &:hover {
        box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
        border-color: rgba(16, 185, 129, 0.3);
      }

      mat-card-header {
        padding: 1.25rem 1.25rem 0;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #1f2937);

          .card-icon {
            color: var(--primary-green, #10b981);
            font-size: 22px;
            width: 22px;
            height: 22px;
          }

          .sensors-icon {
            color: var(--primary-blue, #3b82f6);
          }

          .sensor-count {
            font-size: 0.875rem;
            color: var(--text-secondary, #6b7280);
            font-weight: 500;
          }
        }
      }

      mat-card-content {
        padding: 1.25rem;
      }
    }

    /* Details List */
    .details-list {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color, #e5e7eb);

      &:last-child {
        border-bottom: none;
      }

      &.full-width {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }

    .detail-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary, #6b7280);
      margin: 0;
    }

    .detail-value {
      font-weight: 600;
      color: var(--text-primary, #1f2937);
      margin: 0;

      &.description-text,
      &.notes-text {
        font-weight: 400;
        line-height: 1.6;
        color: var(--text-secondary, #6b7280);
      }
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.status-planted {
        background: #dbeafe;
        color: #1e40af;
      }

      &.status-growing {
        background: #d1fae5;
        color: #065f46;
      }

      &.status-harvested {
        background: #fed7aa;
        color: #92400e;
      }

      &.status-failed {
        background: #fecaca;
        color: #991b1b;
      }
    }

    /* === SENSORS CARD === */
    .no-sensors {
      text-align: center;
      padding: 2.5rem 1rem;
      color: var(--text-secondary, #6b7280);

      .no-sensors-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        margin-bottom: 0.75rem;
        opacity: 0.4;
      }

      .no-sensors-text {
        margin: 0;
        font-size: 0.9375rem;
      }
    }

    .sensor-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .sensor-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.03), rgba(16, 185, 129, 0.01));
      border-radius: 12px;
      border: 1px solid rgba(16, 185, 129, 0.15);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;

      &:hover {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.04));
        border-color: rgba(16, 185, 129, 0.3);
        transform: translateX(4px);
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
      }

      .sensor-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: var(--primary-green, #10b981);
        flex-shrink: 0;

        &.sensor-type-temperature {
          color: #f59e0b;
        }

        &.sensor-type-humidity {
          color: #3b82f6;
        }

        &.sensor-type-light {
          color: #eab308;
        }
      }

      .sensor-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;

        .sensor-type {
          font-weight: 600;
          font-size: 0.9375rem;
          color: var(--text-primary, #1f2937);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sensor-location {
          font-size: 0.8125rem;
          color: var(--text-secondary, #6b7280);
        }
      }

      .sensor-unit {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        font-weight: 500;
        flex-shrink: 0;
      }
    }

    /* === ACTIONS & EVENTS SECTIONS === */
    .actions-section,
    .events-section {
      margin-bottom: 1.5rem;
      animation: slideIn 0.8s ease 0.3s both;
    }

    /* === RESPONSIVE DESIGN === */
    @media (max-width: 1200px) {
      .main-grid {
        grid-template-columns: 1fr;

        .details-sidebar {
          order: -1;
        }
      }
    }

    /* === DARK MODE SUPPORT === */
    :host-context(body.dark-theme) {
      .crop-dashboard-container {
        background: var(--light-bg, #0f172a);
      }

      /* Header */
      .header-content {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);

        &:hover {
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
        }
      }

      /* Crop Selector - Dark Mode */
      .crop-selector {
        ::ng-deep .mat-mdc-text-field-wrapper {
          background: var(--card-bg, #1e293b);
        }

        ::ng-deep .mdc-notched-outline__leading,
        ::ng-deep .mdc-notched-outline__notch,
        ::ng-deep .mdc-notched-outline__trailing {
          border-color: var(--border-color, #334155) !important;
        }

        ::ng-deep .mat-mdc-form-field-label {
          color: var(--text-secondary, #94a3b8);
        }

        ::ng-deep .mat-mdc-select-value {
          color: var(--text-primary, #f1f5f9);
        }

        ::ng-deep .mat-mdc-select-arrow {
          color: var(--primary-green, #10b981);
        }
      }

      /* Dropdown Panel - Dark Mode */
      ::ng-deep .mat-mdc-select-panel {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }

      /* Options - Dark Mode */
      ::ng-deep .mat-mdc-option {
        color: var(--text-primary, #f1f5f9);

        &:hover {
          background: rgba(16, 185, 129, 0.15);
        }

        &.mat-mdc-option-active,
        &.mdc-list-item--selected {
          background: rgba(16, 185, 129, 0.2);
          color: var(--primary-green, #10b981);
        }
      }

      .crop-option {
        .crop-name {
          color: var(--text-primary, #f1f5f9);
        }

        .crop-variety {
          color: var(--text-secondary, #94a3b8);
        }
      }

      /* Crop Title */
      .crop-title {
        color: var(--text-primary, #f1f5f9);
      }

      /* State Containers */
      .state-title {
        color: var(--text-primary, #f1f5f9);
      }

      .state-subtitle {
        color: var(--text-secondary, #94a3b8);
      }

      /* Cards */
      .details-card,
      .sensors-card {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);

        .card-title {
          color: var(--text-primary, #f1f5f9);
        }

        dt {
          color: var(--text-secondary, #94a3b8);
        }

        dd {
          color: var(--text-primary, #f1f5f9);
        }
      }

      /* Sensor Items */
      .sensor-item {
        background: rgba(16, 185, 129, 0.08);
        border-color: var(--border-color, #334155);

        &:hover {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
        }

        .sensor-name {
          color: var(--text-primary, #f1f5f9);
        }

        .sensor-location {
          color: var(--text-secondary, #94a3b8);
        }

        .sensor-value {
          color: var(--primary-green, #10b981);
        }
      }
    }

    /* === RESPONSIVE DESIGN === */
    @media (max-width: 768px) {
      .crop-dashboard-container {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }

      .header-left {
        flex-direction: column;
        width: 100%;
        gap: 1rem;
      }

      .crop-selector {
        width: 100%;
        min-width: auto;
      }

      .crop-header-info {
        width: 100%;
        flex-direction: column;
        align-items: flex-start;
      }

      .crop-title {
        font-size: 1.5rem;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .view-all-btn {
        flex: 1;
      }

      .state-container {
        padding: 2rem 1rem;
      }

      .state-title {
        font-size: 1.5rem;
      }
    }

    /* === DARK THEME SUPPORT === */
    :host-context(body.dark-theme) {
      .crop-dashboard-container {
        background: var(--light-bg, #0f172a);
      }

      .header-content,
      .details-card,
      .sensors-card {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);
      }

      .crop-title,
      .state-title,
      .detail-value {
        color: var(--text-primary, #f1f5f9);
      }

      .state-subtitle,
      .detail-label,
      .sensor-location {
        color: var(--text-secondary, #94a3b8);
      }

      .sensor-item {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.04));
        border-color: rgba(16, 185, 129, 0.2);

        &:hover {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08));
          border-color: rgba(16, 185, 129, 0.4);
        }
      }
    }

    /* === ACCESSIBILITY ENHANCEMENTS === */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    /* === COLLAPSIBLE TIMELINE WRAPPER === */
    .events-wrapper {
      margin-top: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 16px 16px 0 0;
      cursor: pointer;
      transition: all 0.3s ease;
      user-select: none;
      
      &.collapsible:hover {
        background: rgba(16, 185, 129, 0.05);
        border-color: rgba(16, 185, 129, 0.3);
      }
      
      .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
        
        .section-icon {
          color: var(--primary-green, #10b981);
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
        
        h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary, #1f2937);
        }
      }
      
      .toggle-btn {
        mat-icon {
          transition: transform 0.3s ease;
          color: var(--primary-green, #10b981);
        }
      }
    }

    .timeline-content {
      border: 1px solid var(--border-color, #e5e7eb);
      border-top: none;
      border-radius: 0 0 16px 16px;
      overflow: hidden;
    }

    :host-context(body.dark-theme) {
      .section-header {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);
        
        &.collapsible:hover {
          background: rgba(16, 185, 129, 0.12);
        }
        
        h2 {
          color: var(--text-primary, #f1f5f9);
        }
      }
      
      .timeline-content {
        border-color: var(--border-color, #334155);
      }
    }

    /* Focus visible for keyboard navigation */
    button:focus-visible,
    .sensor-item:focus-visible {
      outline: 2px solid var(--primary-green, #10b981);
      outline-offset: 2px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush // CRITICAL: OnPush for performance
})
export class CropDashboardComponent implements OnInit {
  private cropService: CropService = inject(CropService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private destroyRef: DestroyRef = inject(DestroyRef);
  protected languageService = inject(LanguageService);

  // Local component state (Signals)
  dashboardData = signal<CropDashboardData | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  selectedCropId = signal<string | null>(null);
  activeKPIFilter = signal<KPIFilter>('all');
  timelineExpanded = signal<boolean>(true);

  // Expose service state (with proper typing)
  crops = computed<Crop[]>(() => this.cropService.crops());
  totalCrops = computed<number>(() => this.cropService.totalCrops());

  // Computed helpers
  hasCrops = computed(() => this.crops().length > 0);
  isHealthy = computed(() =>
    this.dashboardData()?.healthStatus === 'healthy'
  );

  ngOnInit(): void {
    // Load all crops first
    this.loadInitialData();

    // Listen to route params for crop selection
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const cropId = params.get('id');
        if (cropId) {
          this.loadCropDashboard(cropId);
        }
      });
  }

  /**
   * Load initial data (all crops)
   */
  private loadInitialData(): void {
    (this.cropService.loadCrops() as Observable<Crop[]>)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (crops: Crop[]) => {
          console.log('Crops loaded:', crops.length);

          // If no crop selected but crops exist, select first one
          if (crops.length > 0 && !this.selectedCropId()) {
            const firstCropId = crops[0].crop_id;
            this.router.navigate(['/crops', firstCropId, 'dashboard']);
          }
        },
        error: (err: any) => {
          this.error.set(this.languageService.translate('crops.dashboard.errors.loadCrops'));
          console.error('Error loading crops:', err);
        }
      });
  }

  /**
   * Load dashboard data for specific crop
   */
  private loadCropDashboard(cropId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedCropId.set(cropId);

    (this.cropService.getCropDashboard(cropId, false) as Observable<CropDashboardData>) // Use cache
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: CropDashboardData) => {
          this.dashboardData.set(data);
          this.loading.set(false);
          console.log('Dashboard data loaded:', data);
        },
        error: (err: any) => {
          this.error.set(this.languageService.translate('crops.dashboard.errors.loadDashboard'));
          this.loading.set(false);
          console.error('Error loading dashboard:', err);
        }
      });
  }

  /**
   * Handle crop selection change
   */
  onCropChange(cropId: string): void {
    this.router.navigate(['/crops', cropId, 'dashboard']);
  }

  /**
   * Handle KPI filter change
   */
  onKPIFilterChange(filter: KPIFilter): void {
    this.activeKPIFilter.set(filter);
    // TODO: Implement filtering logic for child components
    console.log('KPI filter changed:', filter);
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    const cropId = this.selectedCropId();
    if (cropId) {
      // Clear cache and reload
      this.cropService.clearCache();
      this.loadCropDashboard(cropId);
    }
  }

  /**
   * Toggle timeline visibility
   */
  toggleTimeline(): void {
    this.timelineExpanded.update(v => !v);
  }

  /**
   * Navigate to crop edit
   */
  editCrop(): void {
    const cropId = this.selectedCropId();
    if (cropId) {
      this.router.navigate(['/crops', cropId, 'edit']);
    }
  }

  /**
   * Get health status icon
   */
  getHealthIcon(status: string): string {
    switch (status) {
      case 'healthy': return 'check_circle';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'help_outline';
    }
  }

  /**
   * Get health status color
   */
  getHealthColor(status: string): string {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warn';
      case 'critical': return 'error';
      default: return 'default';
    }
  }

  /**
   * 🎨 UX Helper: Get status icon for visual feedback
   */
  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'planted': return 'spa';
      case 'growing': return 'eco';
      case 'harvested': return 'check_circle';
      case 'failed': return 'error';
      default: return 'help_outline';
    }
  }

  /**
   * 🌍 Translation Helper: Get translated status label
   */
  getStatusLabel(status: string): string {
    if (!status) return '';
    const statusKey = status.toLowerCase();
    const translationKey = `crops.statuses.${statusKey}`;
    const translated = this.languageService.translate(translationKey);
    // If translation not found, return the original status with titlecase as fallback
    return translated !== translationKey ? translated : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  /**
   * 🎨 UX Helper: Get sensor icon based on type
   */
  getSensorIcon(type: string): string {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('temp')) return 'thermostat';
    if (lowerType.includes('moisture') || lowerType.includes('water')) return 'water_drop';
    if (lowerType.includes('humidity') || lowerType.includes('humid')) return 'cloud';
    if (lowerType.includes('light')) return 'wb_sunny';
    if (lowerType.includes('ph')) return 'science';
    if (lowerType.includes('ec') || lowerType.includes('conductivity')) return 'electrical_services';
    return 'sensors';
  }

  /**
   * 🎨 UX Helper: Get sensor icon class for color coding
   */
  getSensorIconClass(type: string): string {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('temp')) return 'temperature';
    if (lowerType.includes('humidity') || lowerType.includes('humid')) return 'humidity';
    if (lowerType.includes('light')) return 'light';
    return 'default';
  }

  /**
   * 🚀 Performance: TrackBy function for crops list
   */
  trackByCropId(index: number, crop: Crop): string {
    return crop.crop_id;
  }

  /**
   * 🚀 Performance: TrackBy function for sensors list
   */
  trackBySensorId(index: number, sensor: any): string {
    return sensor.sensor_id;
  }
}
