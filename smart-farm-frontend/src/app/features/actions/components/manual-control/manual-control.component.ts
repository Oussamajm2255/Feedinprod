import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, state, style, transition, animate, query, stagger, keyframes } from '@angular/animations';

import { ApiService } from '../../../../core/services/api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FarmManagementService } from '../../../../core/services/farm-management.service';
import { LanguageService } from '../../../../core/services/language.service';
import { Device, Farm, DeviceStatus } from '../../../../core/models/farm.model';
import { ExecuteActionRequest } from '../../../../core/models/action-log.model';
import { Subject, takeUntil } from 'rxjs';

interface ActionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  actionUri: string;
  actionType: 'critical' | 'important' | 'normal';
  category: string;
}

interface PendingAction {
  actionId: string;
  deviceId: string;
  actionName: string;
  status: 'pending' | 'success' | 'failed' | 'timeout';
  timestamp: Date;
  error?: string;
}

@Component({
  selector: 'app-manual-control',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideInRight', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
          stagger(100, [
            animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('pulse', [
      state('normal', style({ transform: 'scale(1)' })),
      state('pulse', style({ transform: 'scale(1.05)' })),
      transition('normal <=> pulse', animate('300ms ease-in-out'))
    ]),
    trigger('statusChange', [
      transition('* => success', [
        animate('500ms ease-out', keyframes([
          style({ transform: 'scale(1)', offset: 0 }),
          style({ transform: 'scale(1.2)', offset: 0.5 }),
          style({ transform: 'scale(1)', offset: 1 })
        ]))
      ]),
      transition('* => failed', [
        animate('500ms ease-out', keyframes([
          style({ transform: 'translateX(0)', offset: 0 }),
          style({ transform: 'translateX(-10px)', offset: 0.25 }),
          style({ transform: 'translateX(10px)', offset: 0.5 }),
          style({ transform: 'translateX(-10px)', offset: 0.75 }),
          style({ transform: 'translateX(0)', offset: 1 })
        ]))
      ])
    ]),
    trigger('buttonHover', [
      state('default', style({ transform: 'translateY(0) scale(1)' })),
      state('hover', style({ transform: 'translateY(-4px) scale(1.02)' })),
      transition('default <=> hover', animate('200ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ],
  template: `
    <div class="manual-actions-container">
      <!-- Enhanced Header with Gradient -->
      <div class="header" [@fadeInUp]>
        <div class="header-content">
          <div class="header-icon-wrapper">
            <mat-icon class="header-icon">gamepad</mat-icon>
          </div>
          <h2>{{ languageService.t()('manualControl.title') }}</h2>
          <p class="header-subtitle">{{ languageService.t()('manualControl.subtitle') }}</p>
        </div>
      </div>

      <!-- Enhanced Quick Stats with Glassmorphism -->
      <div class="stats-grid" [@staggerCards]>
        <mat-card class="stat-card glass-card" [@fadeInUp]>
          <div class="stat-icon-wrapper online">
            <mat-icon>devices</mat-icon>
            <div class="pulse-ring" *ngIf="onlineDevicesCount() > 0"></div>
          </div>
          <div class="stat-content">
            <span class="stat-number">{{ onlineDevicesCount() }}</span>
            <span class="stat-label">{{ languageService.t()('manualControl.onlineDevices') }}</span>
          </div>
        </mat-card>

        <mat-card class="stat-card glass-card pending" *ngIf="pendingActionsCount() > 0" [@slideInRight]>
          <div class="stat-icon-wrapper pending-icon">
            <mat-icon>schedule</mat-icon>
            <div class="pulse-ring"></div>
          </div>
          <div class="stat-content">
            <span class="stat-number">{{ pendingActionsCount() }}</span>
            <span class="stat-label">{{ languageService.t()('manualControl.pendingActions') }}</span>
          </div>
        </mat-card>
      </div>

      <!-- Enhanced Pending Actions with Animations -->
      <mat-card *ngIf="pendingActionsCount() > 0" class="pending-actions-card glass-card" [@fadeInUp]>
        <mat-card-header class="pending-header">
          <div class="header-title-wrapper">
            <mat-icon class="header-title-icon">schedule</mat-icon>
            <mat-card-title [matBadge]="pendingActionsCount()" [matBadgeHidden]="pendingActionsCount() === 0" matBadgeColor="accent" matBadgePosition="above after" class="pending-badge">
              {{ languageService.t()('manualControl.pendingActions') }}
            </mat-card-title>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="pending-actions-list">
            <div
              *ngFor="let action of pendingActionsArray(); trackBy: trackByActionId"
              class="pending-action-item"
              [@slideInRight]
              [@statusChange]="action.status">
              <div class="action-info">
                <div class="action-icon-wrapper" [class]="'status-' + action.status">
                  <mat-icon class="action-icon">{{ getActionIcon(action.actionName) }}</mat-icon>
                  <div class="status-indicator" [class]="action.status"></div>
                </div>
                <div class="action-details">
                  <h4>{{ getActionNameTranslation(action.actionName) }}</h4>
                  <p>
                    <mat-icon class="detail-icon">devices</mat-icon>
                    {{ getDeviceDisplayName(action.deviceId) }}
                    <span class="separator">•</span>
                    <mat-icon class="detail-icon">schedule</mat-icon>
                    {{ action.timestamp | date:'short' }}
                  </p>
                </div>
              </div>
              <div class="action-status">
                <div class="status-animation-wrapper">
                  <mat-spinner *ngIf="action.status === 'pending'" diameter="24" class="status-spinner"></mat-spinner>
                  <mat-icon *ngIf="action.status === 'success'" class="status-icon status-success">check_circle</mat-icon>
                  <mat-icon *ngIf="action.status === 'failed'" class="status-icon status-error">error</mat-icon>
                  <mat-icon *ngIf="action.status === 'timeout'" class="status-icon status-warning">schedule</mat-icon>
                </div>
                <mat-chip [color]="getStatusColor(action.status)" class="status-chip">
                  {{ getStatusText(action.status) }}
                </mat-chip>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Enhanced Device Cards with Stagger Animation -->
      <div class="devices-grid" [@staggerCards]>
        <mat-card
          *ngFor="let device of devices(); trackBy: trackByDeviceId"
          class="device-card glass-card"
          [class.offline]="device.status !== DeviceStatus.ONLINE && device.status !== DeviceStatus.ACTIVE">
          <mat-card-header class="device-header">
            <div class="device-title-wrapper">
              <div class="device-icon-wrapper" [class]="'status-' + device.status">
                <mat-icon>{{ getDeviceIcon(device) }}</mat-icon>
                <div class="device-status-dot" [class]="device.status"></div>
              </div>
              <div class="device-title-content">
                <mat-card-title>{{ getDeviceDisplayName(device.name) }}</mat-card-title>
                <mat-card-subtitle>
                  <mat-chip
                    [color]="(device.status === DeviceStatus.ONLINE || device.status === DeviceStatus.ACTIVE) ? 'accent' : 'warn'"
                    class="device-status-chip">
                    <div class="chip-indicator" [class]="device.status"></div>
                    {{ getDeviceStatusTranslation(device.status) }}
                  </mat-chip>
                </mat-card-subtitle>
              </div>
            </div>
          </mat-card-header>

          <mat-card-content class="device-content">
            <div class="actions-grid">
              <button
                *ngFor="let action of getActionsForDevice(device); trackBy: trackByActionTemplateId"
                mat-raised-button
                [color]="getActionColor(action.actionType)"
                [disabled]="isActionExecuting(action.id) || (device.status !== DeviceStatus.ONLINE && device.status !== DeviceStatus.ACTIVE)"
                (click)="executeAction(device, action)"
                (mouseenter)="onButtonHover($event)"
                (mouseleave)="onButtonLeave($event)"
                class="action-button"
                [class.executing]="isActionExecuting(action.id)"
                [class.disabled]="device.status !== DeviceStatus.ONLINE && device.status !== DeviceStatus.ACTIVE"
                [matTooltip]="getButtonTooltip(action, device)">

                <div class="button-content">
                  <div class="icon-wrapper">
                    <mat-icon *ngIf="!isActionExecuting(action.id)" class="action-icon">{{ action.icon }}</mat-icon>
                    <mat-spinner *ngIf="isActionExecuting(action.id)" diameter="24" class="button-spinner"></mat-spinner>
                  </div>
                  <span class="action-label">{{ getActionNameTranslation(action.name) }}</span>
                </div>
                <div class="button-ripple"></div>
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Empty State -->
      <div *ngIf="devices().length === 0" class="empty-state" [@fadeInUp]>
        <mat-icon class="empty-icon">devices_off</mat-icon>
        <h3>No Devices Available</h3>
        <p>Please select a farm to view available devices</p>
      </div>
    </div>
  `,
  styles: [`
    /* ===== Container & Layout ===== */
    .manual-actions-container {
      padding: 32px 24px;
      max-width: 1400px;
      margin: 0 auto;
      background: var(--header-bg-gradient, linear-gradient(135deg, #f8fafb 0%, #f0fdf4 100%));
      min-height: 100vh;
    }

    /* ===== Enhanced Header ===== */
    .header {
      text-align: center;
      margin-bottom: 40px;
      position: relative;
    }

    .header-content {
      position: relative;
      z-index: 1;
    }

    .header-icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #2e7d32 0%, #10b981 100%);
      border-radius: 50%;
      box-shadow: 0 10px 30px rgba(46, 125, 50, 0.3);
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    .header-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: white;
    }

    .header h2 {
      margin: 0 0 12px 0;
      font-size: 32px;
      font-weight: 700;
      background: linear-gradient(135deg, #2e7d32 0%, #10b981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }

    .header-subtitle {
      margin: 0;
      font-size: 16px;
      color: #64748b;
      font-weight: 400;
    }

    /* ===== Glassmorphism Cards ===== */
    .glass-card {
      background: var(--glass-bg, rgba(255, 255, 255, 0.7));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid var(--glass-border, rgba(16, 185, 129, 0.2));
      box-shadow: var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.1));
      border-radius: 20px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .glass-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg, 0 12px 40px rgba(0, 0, 0, 0.15));
      border-color: rgba(16, 185, 129, 0.3);
    }

    /* ===== Stats Cards ===== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      padding: 24px;
      gap: 20px;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #2e7d32 0%, #10b981 100%);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s ease;
    }

    .stat-card:hover::before {
      transform: scaleX(1);
    }

    .stat-icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: linear-gradient(135deg, #2e7d32 0%, #10b981 100%);
      box-shadow: 0 4px 15px rgba(46, 125, 50, 0.3);
    }

    .stat-icon-wrapper.online {
      background: linear-gradient(135deg, #047857 0%, #10b981 100%);
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }

    .stat-icon-wrapper.pending-icon {
      background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
    }

    .stat-icon-wrapper mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
      z-index: 1;
    }

    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 16px;
      border: 2px solid rgba(255, 255, 255, 0.6);
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse-ring {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .stat-number {
      font-size: 32px;
      font-weight: 700;
      background: linear-gradient(135deg, #2e7d32 0%, #10b981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
      margin-top: 4px;
    }

    /* ===== Pending Actions Card ===== */
    .pending-actions-card {
      margin-bottom: 32px;
    }

    .pending-header {
      padding: 24px 24px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .header-title-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-title-icon {
      color: #f5576c;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .pending-badge {
      position: relative;
    }

    .pending-actions-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }

    .pending-action-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .pending-action-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #2e7d32 0%, #10b981 100%);
      transform: scaleY(0);
      transform-origin: bottom;
      transition: transform 0.3s ease;
    }

    .pending-action-item:hover {
      background: rgba(255, 255, 255, 0.8);
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .pending-action-item:hover::before {
      transform: scaleY(1);
    }

    .action-info {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .action-icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(46, 125, 50, 0.1);
    }

    .action-icon-wrapper.status-success {
      background: rgba(56, 239, 125, 0.1);
    }

    .action-icon-wrapper.status-failed {
      background: rgba(245, 87, 108, 0.1);
    }

    .action-icon-wrapper.status-timeout {
      background: rgba(255, 152, 0, 0.1);
    }

    .action-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #2e7d32;
      z-index: 1;
    }

    .action-icon-wrapper.status-success .action-icon {
      color: #38ef7d;
    }

    .action-icon-wrapper.status-failed .action-icon {
      color: #f5576c;
    }

    .action-icon-wrapper.status-timeout .action-icon {
      color: #ff9800;
    }

    .status-indicator {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
    }

    .status-indicator.pending {
      background: #10b981;
      animation: pulse 2s ease-in-out infinite;
    }

    .status-indicator.success {
      background: #38ef7d;
    }

    .status-indicator.failed {
      background: #f5576c;
    }

    .status-indicator.timeout {
      background: #ff9800;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .action-details h4 {
      margin: 0 0 6px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .action-details p {
      margin: 0;
      font-size: 14px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .detail-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #94a3b8;
    }

    .separator {
      color: #cbd5e1;
      margin: 0 4px;
    }

    .action-status {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-animation-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
    }

    .status-spinner {
      width: 24px !important;
      height: 24px !important;
    }

    .status-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .status-success { color: #38ef7d; }
    .status-error { color: #f5576c; }
    .status-warning { color: #ff9800; }

    .status-chip {
      font-weight: 500;
    }

    /* ===== Device Cards ===== */
    .devices-grid {
      display: grid;
      /* Flexible grid: auto-fit with responsive min-width */
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 350px), 1fr));
      gap: 24px;
      width: 100%;
      justify-items: stretch;
    }

    /* Optimize for different device counts using :has() selector (modern browsers) */
    @supports selector(:has(*)) {
      .devices-grid:has(.device-card:nth-child(1):nth-last-child(1)) {
        /* Single device: center it with max width */
        grid-template-columns: minmax(auto, 600px);
        justify-content: center;
      }

      .devices-grid:has(.device-card:nth-child(1):nth-last-child(2)) {
        /* Two devices: equal columns */
        grid-template-columns: repeat(2, 1fr);
      }

      .devices-grid:has(.device-card:nth-child(1):nth-last-child(3)) {
        /* Three devices: three columns on large screens */
        grid-template-columns: repeat(3, 1fr);
      }

      .devices-grid:has(.device-card:nth-child(4):nth-last-child(n+1)) {
        /* Four or more: auto-fit with minimum constraint */
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 350px), 1fr));
      }
    }

    /* Fallback for browsers without :has() support - use auto-fit as default */
    @supports not selector(:has(*)) {
      .devices-grid {
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 350px), 1fr));
      }
    }

    .device-card {
      min-height: 320px;
      width: 100%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .device-card.offline {
      opacity: 0.7;
    }

    .device-card:hover {
      transform: translateY(-8px);
    }

    .device-header {
      padding: 24px 24px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .device-title-wrapper {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .device-icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #2e7d32 0%, #10b981 100%);
      box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
    }

    .device-icon-wrapper.status-online,
    .device-icon-wrapper.status-active {
      background: linear-gradient(135deg, #047857 0%, #10b981 100%);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .device-icon-wrapper mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
      z-index: 1;
    }

    .device-status-dot {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .device-status-dot.online,
    .device-status-dot.active {
      background: #38ef7d;
      animation: pulse-dot 2s ease-in-out infinite;
    }

    .device-status-dot.offline,
    .device-status-dot.inactive {
      background: #f5576c;
    }

    @keyframes pulse-dot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }

    .device-title-content {
      flex: 1;
    }

    .device-title-content mat-card-title {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
    }

    .device-status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .chip-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .chip-indicator.online,
    .chip-indicator.active {
      background: #38ef7d;
      box-shadow: 0 0 8px rgba(56, 239, 125, 0.6);
    }

    .chip-indicator.offline,
    .chip-indicator.inactive {
      background: #f5576c;
    }

    .device-content {
      padding: 24px;
    }

    /* ===== Action Buttons ===== */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
    }

    .action-button {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 20px 12px;
      min-height: 100px;
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .action-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .action-button:hover:not(.disabled):not(:disabled) {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .action-button:hover:not(.disabled):not(:disabled)::before {
      opacity: 1;
    }

    .action-button.executing {
      animation: pulse-button 1.5s ease-in-out infinite;
    }

    @keyframes pulse-button {
      0%, 100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
      50% { box-shadow: 0 4px 20px rgba(46, 125, 50, 0.4); }
    }

    .action-button.disabled,
    .action-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      position: relative;
    }

    .action-button.disabled::after,
    .action-button:disabled::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 16px;
      pointer-events: none;
    }

    .button-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 1;
    }

    .icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    .action-button:hover:not(.disabled):not(:disabled) .icon-wrapper {
      transform: scale(1.1) rotate(5deg);
      background: rgba(255, 255, 255, 0.3);
    }

    .action-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
    }

    .button-spinner {
      width: 24px !important;
      height: 24px !important;
    }

    .button-spinner ::ng-deep circle {
      stroke: white;
    }

    .action-label {
      font-size: 13px;
      font-weight: 500;
      text-align: center;
      line-height: 1.3;
      color: white;
      max-width: 100%;
      word-wrap: break-word;
    }

    .button-ripple {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    .action-button:active:not(.disabled):not(:disabled) .button-ripple {
      width: 200px;
      height: 200px;
    }

    /* ===== Empty State ===== */
    .empty-state {
      text-align: center;
      padding: 80px 24px;
      color: #64748b;
    }

    .empty-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #cbd5e1;
      margin-bottom: 24px;
    }

    .empty-state h3 {
      margin: 0 0 12px 0;
      font-size: 24px;
      font-weight: 600;
      color: #475569;
    }

    .empty-state p {
      margin: 0;
      font-size: 16px;
      color: #94a3b8;
    }

    /* ===== Responsive Design ===== */
    @media (max-width: 1440px) {
      .devices-grid {
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
      }

      @supports selector(:has(*)) {
        /* Two devices on large screens */
        .devices-grid:has(.device-card:nth-child(1):nth-last-child(2)) {
          grid-template-columns: repeat(2, 1fr);
          max-width: 100%;
        }

        /* Three devices on large screens */
        .devices-grid:has(.device-card:nth-child(1):nth-last-child(3)) {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    }

    @media (max-width: 1200px) {
      .devices-grid {
        /* Reduce min size for medium screens */
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
      }

      @supports selector(:has(*)) {
        /* Three devices on medium screens: show 2 per row */
        .devices-grid:has(.device-card:nth-child(1):nth-last-child(3)) {
          grid-template-columns: repeat(2, 1fr);
        }

        /* Single device: full width but centered */
        .devices-grid:has(.device-card:nth-child(1):nth-last-child(1)) {
          grid-template-columns: minmax(auto, 500px);
          justify-content: center;
        }
      }
    }

    @media (max-width: 1024px) {
      .devices-grid {
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
        gap: 20px;
      }

      @supports selector(:has(*)) {
        /* Two devices on tablet: flexible layout */
        .devices-grid:has(.device-card:nth-child(1):nth-last-child(2)) {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
        }
      }
    }

    @media (max-width: 768px) {
      .manual-actions-container {
        padding: 20px 16px;
      }

      .header h2 {
        font-size: 28px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .devices-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      @supports selector(:has(*)) {
        /* Single device: full width on mobile */
        .devices-grid:has(.device-card:nth-child(1):nth-last-child(1)) {
          grid-template-columns: 1fr;
          justify-content: stretch;
        }

        /* Two devices: stack on mobile */
        .devices-grid:has(.device-card:nth-child(1):nth-last-child(2)) {
          grid-template-columns: 1fr;
        }

        /* Three or more: stack on mobile */
        .devices-grid:has(.device-card:nth-child(1):nth-last-child(3)),
        .devices-grid:has(.device-card:nth-child(4):nth-last-child(n+1)) {
          grid-template-columns: 1fr;
        }
      }

      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .action-button {
        min-height: 90px;
        padding: 16px 8px;
      }

      .header-icon-wrapper {
        width: 64px;
        height: 64px;
      }

      .header-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }
    }

    @media (max-width: 480px) {
      .actions-grid {
        grid-template-columns: 1fr;
      }

      .pending-action-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .action-status {
        width: 100%;
        justify-content: space-between;
      }
    }
  `]
})
export class ManualControlComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);
  private farmManagement = inject(FarmManagementService);
  private snackBar = inject(MatSnackBar);
  public languageService = inject(LanguageService);
  private destroy$ = new Subject<void>();

  // Expose enum for template access
  DeviceStatus = DeviceStatus;

  // Signals
  devices = signal<Device[]>([]);
  farms = signal<Farm[]>([]);
  deviceActions = signal<Map<string, ActionTemplate[]>>(new Map()); // deviceId -> actions
  pendingActions = signal<Map<string, PendingAction>>(new Map());
  executingActions = signal<Set<string>>(new Set()); // execution IDs
  executingTemplates = signal<Set<string>>(new Set()); // template IDs

  // Computed
  onlineDevicesCount = computed(() => {
    const devices = this.devices();
    const onlineDevices = devices.filter(d => d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.ACTIVE);
    console.log('🔍 [MANUAL-ACTIONS-V2] Computing online devices:', {
      totalDevices: devices.length,
      onlineDevices: onlineDevices.length,
      deviceStatuses: devices.map(d => ({ id: d.device_id, name: d.name, status: d.status }))
    });
    return onlineDevices.length;
  });

  pendingActionsCount = computed(() => this.pendingActions().size);

  pendingActionsArray = computed(() => Array.from(this.pendingActions().values()));

  // Dynamic actions are now loaded from the backend based on sensor configurations

  ngOnInit(): void {
    this.loadData();
    this.setupWebSocketListeners();

    // Subscribe to farm selection changes
    this.farmManagement.selectedFarm$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(selectedFarm => {
      if (selectedFarm) {
        console.log('🏡 [MANUAL-ACTIONS-V2] Farm changed, reloading data for:', selectedFarm.name);
        this.loadData();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadData(): Promise<void> {
    try {
      console.log('🔄 [MANUAL-ACTIONS-V2] Loading data...');

      const selectedFarm = this.farmManagement.getSelectedFarm();
      if (!selectedFarm) {
        console.log('⚠️ [MANUAL-ACTIONS-V2] No farm selected, skipping data load');
        return;
      }

      console.log('🏡 [MANUAL-ACTIONS-V2] Loading data for farm:', selectedFarm.name);

      // Load devices for selected farm only
      const devices = await this.apiService.getDevicesByFarm(selectedFarm.farm_id).toPromise();

      console.log('📊 [MANUAL-ACTIONS-V2] Loaded devices for farm:', devices);

      this.devices.set(devices || []);

      // Load actions for each device
      await this.loadDeviceActions(devices || []);

      console.log('✅ [MANUAL-ACTIONS-V2] Data loaded successfully. Devices count:', this.devices().length);
      console.log('🔍 [MANUAL-ACTIONS-V2] Online devices count:', this.onlineDevicesCount());

    } catch (error) {
      console.error('❌ [MANUAL-ACTIONS-V2] Error loading data:', error);
      this.snackBar.open(this.languageService.t()('manualControl.loadDevicesError'), this.languageService.t()('common.close'), { duration: 3000 });
    }
  }

  private async loadDeviceActions(devices: Device[]): Promise<void> {
    try {
      console.log('🔄 [MANUAL-ACTIONS-V2] Loading device actions...');

      const actionsMap = new Map<string, ActionTemplate[]>();

      // Load actions for each device
      for (const device of devices) {
        try {
          const actions = await this.apiService.getDeviceActions(device.device_id).toPromise();
          console.log(`📋 [MANUAL-ACTIONS-V2] Loaded ${actions?.length || 0} actions for device ${device.device_id}:`, actions);
          actionsMap.set(device.device_id, actions || []);
        } catch (error) {
          console.error(`❌ [MANUAL-ACTIONS-V2] Error loading actions for device ${device.device_id}:`, error);
          actionsMap.set(device.device_id, []);
        }
      }

      this.deviceActions.set(actionsMap);
      console.log('✅ [MANUAL-ACTIONS-V2] Device actions loaded successfully');

    } catch (error) {
      console.error('❌ [MANUAL-ACTIONS-V2] Error loading device actions:', error);
    }
  }

  private setupWebSocketListeners(): void {
    this.notificationService.initSocket();
    console.log('🔧 [MANUAL-ACTIONS-V2] Setting up WebSocket listeners...');

    // Listen for action acknowledgments
    this.notificationService.actionAcknowledged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        console.log('🎯 [MANUAL-ACTIONS-V2] Action acknowledged:', data);
        this.updateActionStatus(data.actionId, 'success');
      });

    // Listen for action failures
    this.notificationService.actionFailed$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        console.log('❌ [MANUAL-ACTIONS-V2] Action failed:', data);
        this.updateActionStatus(data.actionId, 'failed', data.error);
      });

    // Listen for action timeouts
    this.notificationService.actionTimeout$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        console.log('⏰ [MANUAL-ACTIONS-V2] Action timeout:', data);
        this.updateActionStatus(data.actionId, 'timeout');
      });
  }

  async executeAction(device: Device, action: ActionTemplate): Promise<void> {
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('📤 [MANUAL-ACTIONS-V2] Executing action:', { actionId, device: device.device_id, action: action.name });

    // Add to executing actions (use execution ID, not template ID)
    this.executingActions.update(actions => new Set([...actions, actionId]));

    // Add template ID to executing templates
    this.executingTemplates.update(templates => new Set([...templates, action.id]));

    // Add to pending actions
    this.addPendingAction(actionId, device.device_id, action.name);

    try {
      const request: ExecuteActionRequest = {
        deviceId: device.device_id,
        action: action.actionUri.replace('{device_id}', device.device_id),
        actionId: actionId,
        actionType: action.actionType,
        context: {
          sensorId: 'manual_trigger',
          sensorType: 'manual',
          value: 0,
          unit: '',
          violationType: 'manual'
        }
      };

      await this.apiService.executeAction(request).toPromise();

      this.snackBar.open(
        this.languageService.t()('manualControl.actionSentMessage', { actionName: this.getActionNameTranslation(action.name) }),
        this.languageService.t()('common.close'),
        { duration: 3000 }
      );

    } catch (error) {
      console.error('Error executing action:', error);
      this.snackBar.open(
        this.languageService.t()('manualControl.actionFailedMessage', { actionName: this.getActionNameTranslation(action.name) }),
        this.languageService.t()('common.close'),
        { duration: 3000 }
      );

      // Remove from executing and pending on error
      this.executingActions.update(actions => {
        const newSet = new Set(actions);
        newSet.delete(actionId);
        return newSet;
      });

      this.executingTemplates.update(templates => {
        const newSet = new Set(templates);
        newSet.delete(action.id);
        return newSet;
      });

      this.pendingActions.update(actions => {
        const newMap = new Map(actions);
        newMap.delete(actionId);
        return newMap;
      });
    }
  }

  private addPendingAction(actionId: string, deviceId: string, actionName: string): void {
    const pendingAction: PendingAction = {
      actionId,
      deviceId,
      actionName,
      status: 'pending',
      timestamp: new Date()
    };

    this.pendingActions.update(actions => {
      const newMap = new Map(actions);
      newMap.set(actionId, pendingAction);
      return newMap;
    });

    // Set timeout for 30 seconds
    setTimeout(() => {
      this.updateActionStatus(actionId, 'timeout');
    }, 30000);
  }

  private updateActionStatus(actionId: string, status: 'success' | 'failed' | 'timeout', error?: string): void {
    console.log('🔄 [MANUAL-ACTIONS-V2] Updating action status:', { actionId, status, error });

    this.pendingActions.update(actions => {
      const newMap = new Map(actions);
      const action = newMap.get(actionId);

      if (action) {
        action.status = status;
        if (error) action.error = error;
        newMap.set(actionId, action);

        // Remove from executing actions
        this.executingActions.update(executing => {
          const newSet = new Set(executing);
          newSet.delete(actionId);
          return newSet;
        });

        // Remove from executing templates - find the template ID from deviceActions
        for (const [deviceId, actions] of this.deviceActions().entries()) {
          const matchingAction = actions.find(a =>
            a.name.toLowerCase() === action.actionName.toLowerCase() ||
            a.actionUri.includes(action.actionName.toLowerCase().replace(' ', '_'))
          );
          if (matchingAction) {
            this.executingTemplates.update(templates => {
              const newSet = new Set(templates);
              newSet.delete(matchingAction.id);
              return newSet;
            });
            break;
          }
        }

        // Show notification
        const message = status === 'success'
          ? this.languageService.t()('manualControl.actionSuccessMessage', { actionName: this.getActionNameTranslation(action.actionName) })
          : status === 'failed'
          ? this.languageService.t()('manualControl.actionFailedMessage', { actionName: this.getActionNameTranslation(action.actionName), error: error || this.languageService.t()('common.unknownError') })
          : this.languageService.t()('manualControl.actionTimeoutMessage', { actionName: this.getActionNameTranslation(action.actionName) });

        this.snackBar.open(message, this.languageService.t()('common.close'), {
          duration: status === 'success' ? 3000 : 5000,
          panelClass: status === 'success' ? 'success-snackbar' : 'error-snackbar'
        });

        // Remove from pending after showing status for 2 seconds
        setTimeout(() => {
          this.pendingActions.update(pendingActions => {
            const updatedMap = new Map(pendingActions);
            updatedMap.delete(actionId);
            return updatedMap;
          });
        }, 2000);
      } else {
        console.warn('⚠️ [MANUAL-ACTIONS-V2] Action not found for ID:', actionId);
      }

      return newMap;
    });
  }

  getActionsForDevice(device: Device): ActionTemplate[] {
    // Return dynamic actions for this specific device
    return this.deviceActions().get(device.device_id) || [];
  }

  isActionExecuting(actionTemplateId: string): boolean {
    return this.executingTemplates().has(actionTemplateId);
  }

  getDeviceIcon(device: Device): string {
    return 'sensors';
  }

  getActionIcon(actionName: string): string {
    const name = actionName.toLowerCase();
    if (name.includes('irrigation') || name.includes('water')) return 'water_drop';
    if (name.includes('fan') || name.includes('ventil')) return 'air';
    if (name.includes('heat')) return 'local_fire_department';
    if (name.includes('light')) return 'lightbulb';
    if (name.includes('roof')) return 'open_in_full';
    if (name.includes('restart')) return 'restart_alt';
    if (name.includes('calibrate')) return 'tune';
    return 'smart_toy';
  }

  getActionColor(actionType: string): 'primary' | 'accent' | 'warn' {
    switch (actionType) {
      case 'critical': return 'warn';
      case 'important': return 'accent';
      default: return 'primary';
    }
  }

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'success': return 'accent';
      case 'failed': return 'warn';
      case 'timeout': return 'warn';
      default: return 'primary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return this.languageService.t()('manualControl.statusPending');
      case 'success': return this.languageService.t()('manualControl.statusSuccess');
      case 'failed': return this.languageService.t()('manualControl.statusFailed');
      case 'timeout': return this.languageService.t()('manualControl.statusTimeout');
      default: return status;
    }
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
      'light off': this.languageService.t()('actions.actionTypes.lightOff'),
      'pump on': this.languageService.t()('actions.actionTypes.waterPumpOn'),
      'pump off': this.languageService.t()('actions.actionTypes.waterPumpOff'),
      'turn on': this.languageService.t()('actions.actionTypes.turnOnLight'),
      'turn off': this.languageService.t()('actions.actionTypes.turnOffLight'),
      // Additional patterns for common variations
      'waterpump on': this.languageService.t()('actions.actionTypes.waterPumpOn'),
      'waterpump off': this.languageService.t()('actions.actionTypes.waterPumpOff'),
      'water_pump on': this.languageService.t()('actions.actionTypes.waterPumpOn'),
      'water_pump off': this.languageService.t()('actions.actionTypes.waterPumpOff'),
      'light_on': this.languageService.t()('actions.actionTypes.lightOn'),
      'light_off': this.languageService.t()('actions.actionTypes.lightOff'),
      'pump_on': this.languageService.t()('actions.actionTypes.waterPumpOn'),
      'pump_off': this.languageService.t()('actions.actionTypes.waterPumpOff')
    };

    // Try exact match first
    let translatedName = actionMap[actionName.toLowerCase()];
    if (translatedName) {
      return translatedName;
    }

    // Handle complex action names with context (e.g., "Ventilator Off (temperature Low)")
    const lowerActionName = actionName.toLowerCase();

    // Extract the main action from complex names
    if (lowerActionName.includes('ventilator off')) {
      return this.languageService.t()('actions.actionTypes.ventilatorOff');
    }
    if (lowerActionName.includes('ventilator on')) {
      return this.languageService.t()('actions.actionTypes.ventilatorOn');
    }
    if (lowerActionName.includes('humidifier on')) {
      return this.languageService.t()('actions.actionTypes.humidifierOn');
    }
    if (lowerActionName.includes('humidifier off')) {
      return this.languageService.t()('actions.actionTypes.humidifierOff');
    }
    if (lowerActionName.includes('open roof')) {
      return this.languageService.t()('actions.actionTypes.openRoof');
    }
    if (lowerActionName.includes('close roof')) {
      return this.languageService.t()('actions.actionTypes.closeRoof');
    }
    if (lowerActionName.includes('water pump on')) {
      return this.languageService.t()('actions.actionTypes.waterPumpOn');
    }
    if (lowerActionName.includes('water pump off')) {
      return this.languageService.t()('actions.actionTypes.waterPumpOff');
    }
    if (lowerActionName.includes('light on')) {
      return this.languageService.t()('actions.actionTypes.lightOn');
    }
    if (lowerActionName.includes('light off')) {
      return this.languageService.t()('actions.actionTypes.lightOff');
    }

    // Try partial matches for complex action names
    if (lowerActionName.includes('water') && lowerActionName.includes('pump') && lowerActionName.includes('on')) {
      return this.languageService.t()('actions.actionTypes.waterPumpOn');
    }
    if (lowerActionName.includes('water') && lowerActionName.includes('pump') && lowerActionName.includes('off')) {
      return this.languageService.t()('actions.actionTypes.waterPumpOff');
    }
    if (lowerActionName.includes('light') && lowerActionName.includes('on')) {
      return this.languageService.t()('actions.actionTypes.lightOn');
    }
    if (lowerActionName.includes('light') && lowerActionName.includes('off')) {
      return this.languageService.t()('actions.actionTypes.lightOff');
    }
    if (lowerActionName.includes('pump') && lowerActionName.includes('on')) {
      return this.languageService.t()('actions.actionTypes.waterPumpOn');
    }
    if (lowerActionName.includes('pump') && lowerActionName.includes('off')) {
      return this.languageService.t()('actions.actionTypes.waterPumpOff');
    }

    // Fallback to original name if no translation found
    return actionName;
  }

  getDeviceDisplayName(deviceName: string): string {
    // Translate common device names/IDs
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

    const translatedName = deviceMap[deviceName.toLowerCase()];
    return translatedName || deviceName;
  }

  getDeviceStatusTranslation(status: string): string {
    switch (status) {
      case 'online': return this.languageService.t()('devices.statusOnline');
      case 'offline': return this.languageService.t()('devices.statusOffline');
      case 'active': return this.languageService.t()('devices.statusActive');
      case 'inactive': return this.languageService.t()('devices.statusInactive');
      case 'error': return this.languageService.t()('devices.statusError');
      default: return status;
    }
  }

  // TrackBy functions for better performance
  trackByDeviceId(index: number, device: Device): string {
    return device.device_id;
  }

  trackByActionId(index: number, action: PendingAction): string {
    return action.actionId;
  }

  trackByActionTemplateId(index: number, action: ActionTemplate): string {
    return action.id;
  }

  // Hover handlers for button animations
  onButtonHover(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    button.classList.add('hover');
  }

  onButtonLeave(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    button.classList.remove('hover');
  }

  // Get button tooltip with explanation for disabled state
  getButtonTooltip(action: ActionTemplate, device: Device): string {
    const isExecuting = this.isActionExecuting(action.id);
    const isDeviceOffline = device.status !== DeviceStatus.ONLINE && device.status !== DeviceStatus.ACTIVE;

    if (isExecuting) {
      return this.languageService.t()('manualControl.actionExecutingTooltip', { actionName: this.getActionNameTranslation(action.name) });
    }

    if (isDeviceOffline) {
      return this.languageService.t()('manualControl.deviceOfflineTooltip', {
        deviceName: this.getDeviceDisplayName(device.name),
        status: this.getDeviceStatusTranslation(device.status)
      });
    }

    // Default tooltip with description
    return action.description || this.getActionNameTranslation(action.name);
  }
}
