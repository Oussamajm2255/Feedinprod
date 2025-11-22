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
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

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
    MatSnackBarModule,
    TranslatePipe
  ],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss'
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
