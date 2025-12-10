import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <h2>{{ languageService.t()('notifications.title') }}</h2>
      <p>{{ languageService.t()('notifications.subtitle') }}</p>

      <mat-card class="section">
        <mat-card-title>{{ languageService.t()('notifications.quietHours') }}</mat-card-title>
        <mat-card-content>
          <div class="row">
            <mat-slide-toggle [(ngModel)]="quietEnabled">{{ languageService.t()('notifications.enableQuietHours') }}</mat-slide-toggle>
          </div>
          <div class="row hours" *ngIf="quietEnabled">
            <mat-form-field appearance="outline">
              <mat-label>{{ languageService.t()('notifications.startHour') }}</mat-label>
              <input matInput type="number" [(ngModel)]="startHour" min="0" max="23">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ languageService.t()('notifications.endHour') }}</mat-label>
              <input matInput type="number" [(ngModel)]="endHour" min="0" max="23">
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="section">
        <mat-card-title>{{ languageService.t()('notifications.cooldown') }}</mat-card-title>
        <mat-card-content>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>{{ languageService.t()('notifications.cooldownMinutes') }}</mat-label>
              <input matInput type="number" [(ngModel)]="cooldown" min="0" max="120">
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="section">
        <mat-card-title>{{ languageService.t()('notifications.categories') }}</mat-card-title>
        <mat-card-content>
          <div class="row">
            <mat-slide-toggle [(ngModel)]="levels.critical">{{ languageService.t()('notifications.critical') }}</mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="levels.warning">{{ languageService.t()('notifications.warning') }}</mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="levels.info">{{ languageService.t()('notifications.info') }}</mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="levels.success">{{ languageService.t()('notifications.success') }}</mat-slide-toggle>
          </div>
          <div class="row">
            <mat-slide-toggle [(ngModel)]="sources.sensor">{{ languageService.t()('notifications.sensors') }}</mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="sources.device">{{ languageService.t()('notifications.devices') }}</mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="sources.action">{{ languageService.t()('notifications.actions') }}</mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="sources.system">{{ languageService.t()('notifications.system') }}</mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="sources.maintenance">{{ languageService.t()('notifications.maintenance') }}</mat-slide-toggle>
            <mat-slide-toggle [(ngModel)]="sources.security">{{ languageService.t()('notifications.security') }}</mat-slide-toggle>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="actions">
        <button mat-raised-button color="primary" (click)="save()">
          <mat-icon>save</mat-icon>
          {{ languageService.t()('notifications.saveSettings') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 900px; margin: 24px auto; padding: 0 16px; }
    h2 { margin: 0 0 8px 0; }
    p { margin: 0 0 24px 0; color: #666; }
    .section { margin-bottom: 16px; }
    .row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .hours { margin-top: 12px; }
    mat-form-field { width: 180px; }
    .actions { display: flex; justify-content: flex-end; margin-top: 16px; }
  `]
})
export class NotificationSettingsComponent {
  private svc = inject(NotificationService);
  private snack = inject(MatSnackBar);
  public languageService = inject(LanguageService);

  quietEnabled = true;
  startHour = 22;
  endHour = 6;
  cooldown = 15;
  levels = { critical: true, warning: true, info: true, success: true };
  sources = { sensor: true, device: true, action: true, system: true, maintenance: true, security: true };

  constructor() {
    const pref = this.svc.getPreferences();
    this.cooldown = Math.round(pref.cooldownMs / 60000);
    this.quietEnabled = pref.quietHours.enabled;
    this.startHour = pref.quietHours.startHour;
    this.endHour = pref.quietHours.endHour;
    this.levels = { ...this.levels, ...pref.levels } as any;
    this.sources = { ...this.sources, ...pref.sources } as any;
  }

  save() {
    this.svc.setQuietHours(this.quietEnabled, this.startHour, this.endHour);
    this.svc.setCooldownMinutes(this.cooldown);
    (Object.keys(this.levels) as Array<keyof typeof this.levels>).forEach(k => this.svc.setLevelEnabled(k, this.levels[k]));
    Object.keys(this.sources).forEach(k => this.svc.setSourceEnabled(k, (this.sources as any)[k]));
    this.snack.open(this.languageService.t()('notifications.settingsSaved'), this.languageService.t()('common.close'), { duration: 2000 });
  }
}
