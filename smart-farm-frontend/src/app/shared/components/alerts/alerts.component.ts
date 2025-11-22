import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { Subscription } from 'rxjs';

import { AlertService, Alert } from '../../../core/services/alert.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ 
          opacity: 0, 
          transform: 'translateY(-20px) scale(0.95)' 
        }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ 
            opacity: 1, 
            transform: 'translateY(0) scale(1)' 
          })
        )
      ]),
      transition(':leave', [
        animate('250ms cubic-bezier(0.4, 0, 1, 1)', 
          style({ 
            opacity: 0, 
            transform: 'translateY(-20px) scale(0.95)' 
          })
        )
      ])
    ])
  ]
})
export class AlertsComponent implements OnInit, OnDestroy {
  private alertService = inject(AlertService);
  public themeService = inject(ThemeService);
  public languageService = inject(LanguageService);

  alerts: Alert[] = [];
  private subscription?: Subscription;
  private pausedAlerts = new Set<string>();

  ngOnInit(): void {
    this.subscription = this.alertService.alerts$.subscribe(alerts => {
      this.alerts = alerts;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Dismiss an alert
   */
  dismiss(alertId: string): void {
    this.alertService.dismiss(alertId);
  }

  /**
   * Pause auto-dismiss on hover
   */
  onMouseEnter(alert: Alert): void {
    this.pausedAlerts.add(alert.id);
  }

  /**
   * Resume auto-dismiss on mouse leave
   */
  onMouseLeave(alert: Alert): void {
    this.pausedAlerts.delete(alert.id);
    
    // Restart the auto-dismiss timer if duration is set
    if (alert.duration && alert.duration > 0) {
      setTimeout(() => {
        // Only dismiss if not still hovered
        if (!this.pausedAlerts.has(alert.id)) {
          this.dismiss(alert.id);
        }
      }, alert.duration);
    }
  }

  /**
   * Get the icon for the alert type
   */
  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ⓘ'
    };
    return icons[type] || icons['info'];
  }

  /**
   * Translate a text (handles both translation keys and plain text)
   */
  translate(text: string): string {
    return this.languageService.translate(text);
  }

  /**
   * Check if current theme is dark
   */
  get isDarkTheme(): boolean {
    return this.themeService.currentTheme === 'dark';
  }

  /**
   * Check if current language is RTL
   */
  get isRtl(): boolean {
    return this.languageService.currentLanguage() === 'ar-TN';
  }
}

