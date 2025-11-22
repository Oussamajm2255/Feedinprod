import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ALERT_DURATIONS } from '../config/notification.config';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

export interface CustomAlertResult<T = any> {
  isConfirmed: boolean;
  isDismissed: boolean;
  value?: T;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  public alerts$: Observable<Alert[]> = this.alertsSubject.asObservable();

  private idCounter = 0;

  /**
   * Show a new alert
   * @param type - The type of alert (success, error, warning, info)
   * @param title - The alert title (translation key or text)
   * @param message - The alert message (translation key or text)
   * @param duration - Auto-dismiss duration in ms (default: 5000, 0 = no auto-dismiss)
   * @param dismissible - Whether the alert can be manually dismissed (default: true)
   */
  show(
    type: AlertType,
    title: string,
    message: string,
    duration: number = 5000,
    dismissible: boolean = true
  ): string {
    const id = `alert-${++this.idCounter}-${Date.now()}`;
    
    const alert: Alert = {
      id,
      type,
      title,
      message,
      duration,
      dismissible
    };

    const currentAlerts = this.alertsSubject.value;
    this.alertsSubject.next([...currentAlerts, alert]);

    // Auto-dismiss if duration is set
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  /**
   * Show a success alert
   */
  success(title: string, message: string, duration: number = ALERT_DURATIONS.SUCCESS): Promise<CustomAlertResult> {
    this.show('success', title, message, duration);
    return Promise.resolve({ isConfirmed: true, isDismissed: false });
  }

  /**
   * Show an error alert
   */
  error(title: string, message: string, duration: number = ALERT_DURATIONS.ERROR): Promise<CustomAlertResult> {
    this.show('error', title, message, duration);
    return Promise.resolve({ isConfirmed: true, isDismissed: false });
  }

  /**
   * Show a warning alert
   */
  warning(title: string, message: string, duration: number = ALERT_DURATIONS.WARNING): Promise<CustomAlertResult> {
    this.show('warning', title, message, duration);
    return Promise.resolve({ isConfirmed: true, isDismissed: false });
  }

  /**
   * Show an info alert
   */
  info(title: string, message: string, duration: number = ALERT_DURATIONS.INFO): Promise<CustomAlertResult> {
    this.show('info', title, message, duration);
    return Promise.resolve({ isConfirmed: true, isDismissed: false });
  }

  /**
   * Dismiss a specific alert by ID
   */
  dismiss(id: string): void {
    const currentAlerts = this.alertsSubject.value;
    this.alertsSubject.next(currentAlerts.filter(alert => alert.id !== id));
  }

  /**
   * Clear all alerts
   */
  clear(): void {
    this.alertsSubject.next([]);
  }

  /**
   * Legacy method for backward compatibility - closes all alerts
   */
  close(): void {
    this.clear();
  }

  /**
   * Legacy method - custom alert with options
   */
  custom(options: any): Promise<CustomAlertResult> {
    const type = (options.icon || 'info') as AlertType;
    const title = options.title || 'Alert';
    const message = options.text || '';
    const duration = options.timer ?? 5000;
    
    this.show(type, title, message, duration);
    return Promise.resolve({ isConfirmed: true, isDismissed: false });
  }

  /**
   * Legacy method - loading alert (info type, longer duration)
   */
  loading(title?: string, message?: string): Promise<CustomAlertResult> {
    this.show('info', title || 'common.loading', message || '', 0); // 0 = no auto-dismiss
    return Promise.resolve({ isConfirmed: true, isDismissed: false });
  }

  /**
   * Legacy method - confirmation dialog (not implemented as alert, kept for compatibility)
   * For real confirmation dialogs, use a separate modal service
   */
  confirm(
    title: string,
    text?: string,
    confirmText?: string,
    cancelText?: string
  ): Promise<CustomAlertResult> {
    // This should be implemented with a proper modal dialog component
    // For now, we'll just show an info alert
    console.warn('AlertService.confirm() should use a dedicated modal dialog component');
    this.show('info', title, text || '', 0);
    return Promise.resolve({ isConfirmed: false, isDismissed: true });
  }

  /**
   * Legacy method - prompt dialog (not implemented as alert, kept for compatibility)
   */
  prompt(
    title: string,
    text?: string,
    inputType: string = 'text',
    inputValue?: string,
    inputPlaceholder?: string
  ): Promise<CustomAlertResult<string>> {
    console.warn('AlertService.prompt() should use a dedicated modal dialog component');
    this.show('info', title, text || '', 0);
    return Promise.resolve({ isConfirmed: false, isDismissed: true, value: '' });
  }
}
