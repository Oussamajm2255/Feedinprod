import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { LanguageService } from './language.service';
import { ThemeService } from './theme.service';
import { TOAST_DURATIONS } from '../config/notification.config';

/**
 * Unified Toast Notification Service
 * 
 * Provides a consistent, accessible API for all toast notifications across the app.
 * - Always displays text (never just icons)
 * - Uses translations automatically
 * - Glassmorphic design consistent with dashboard
 * - Supports all types: success, error, warning, info
 * - Works with RTL and dark theme
 */
@Injectable({
  providedIn: 'root'
})
export class ToastNotificationService {
  private snackBar = inject(MatSnackBar);
  private languageService = inject(LanguageService);
  private themeService = inject(ThemeService);

  /**
   * Show a success toast notification
   * @param message Translation key or message text
   * @param details Optional additional details (translation key or text)
   * @param duration Duration in milliseconds (default: from config)
   */
  success(message: string, details?: string, duration: number = TOAST_DURATIONS.SUCCESS): MatSnackBarRef<SimpleSnackBar> {
    const translatedMessage = this.translateMessage(message);
    const translatedDetails = details ? this.translateMessage(details) : undefined;
    
    const fullMessage = translatedDetails 
      ? `${translatedMessage}${translatedDetails ? ' ' + translatedDetails : ''}` 
      : translatedMessage;

    return this.showToast(fullMessage, 'success', duration);
  }

  /**
   * Show an error toast notification
   * @param message Translation key or message text
   * @param details Optional additional details (translation key or text)
   * @param duration Duration in milliseconds (default: from config)
   */
  error(message: string, details?: string, duration: number = TOAST_DURATIONS.ERROR): MatSnackBarRef<SimpleSnackBar> {
    const translatedMessage = this.translateMessage(message);
    const translatedDetails = details ? this.translateMessage(details) : undefined;
    
    const fullMessage = translatedDetails 
      ? `${translatedMessage}${translatedDetails ? ' ' + translatedDetails : ''}` 
      : translatedMessage;

    return this.showToast(fullMessage, 'error', duration);
  }

  /**
   * Show a warning toast notification
   * @param message Translation key or message text
   * @param details Optional additional details (translation key or text)
   * @param duration Duration in milliseconds (default: from config)
   */
  warning(message: string, details?: string, duration: number = TOAST_DURATIONS.WARNING): MatSnackBarRef<SimpleSnackBar> {
    const translatedMessage = this.translateMessage(message);
    const translatedDetails = details ? this.translateMessage(details) : undefined;
    
    const fullMessage = translatedDetails 
      ? `${translatedMessage}${translatedDetails ? ' ' + translatedDetails : ''}` 
      : translatedMessage;

    return this.showToast(fullMessage, 'warning', duration);
  }

  /**
   * Show an info toast notification
   * @param message Translation key or message text
   * @param details Optional additional details (translation key or text)
   * @param duration Duration in milliseconds (default: from config)
   */
  info(message: string, details?: string, duration: number = TOAST_DURATIONS.INFO): MatSnackBarRef<SimpleSnackBar> {
    const translatedMessage = this.translateMessage(message);
    const translatedDetails = details ? this.translateMessage(details) : undefined;
    
    const fullMessage = translatedDetails 
      ? `${translatedMessage}${translatedDetails ? ' ' + translatedDetails : ''}` 
      : translatedMessage;

    return this.showToast(fullMessage, 'info', duration);
  }

  /**
   * Internal method to show toast with proper styling
   */
  private showToast(
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info', 
    duration: number
  ): MatSnackBarRef<SimpleSnackBar> {
    // Ensure message is never empty
    const safeMessage = this.ensureMessage(message, type);

    // Get close button text (translated)
    const closeText = this.languageService.translate('common.close') || 'Close';

    // Configure snackbar
    const config: MatSnackBarConfig = {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [
        'glass-toast',
        `${type}-toast`,
        this.themeService.currentTheme === 'dark' ? 'dark-theme-toast' : 'light-theme-toast',
        this.languageService.isRTL() ? 'rtl-toast' : 'ltr-toast'
      ],
      data: {
        message: safeMessage,
        type
      }
    };

    return this.snackBar.open(safeMessage, closeText, config);
  }

  /**
   * Ensure message is never empty or undefined
   */
  private ensureMessage(message: string | undefined | null, type: 'success' | 'error' | 'warning' | 'info'): string {
    if (message && message.trim()) {
      return message.trim();
    }

    // Fallback messages based on type
    const fallbacks: Record<typeof type, string> = {
      success: this.languageService.translate('common.success') || 'Success',
      error: this.languageService.translate('common.error') || 'Error',
      warning: this.languageService.translate('common.warning') || 'Warning',
      info: this.languageService.translate('common.info') || 'Info'
    };

    return fallbacks[type];
  }

  /**
   * Translate a message (handles both translation keys and plain text)
   */
  private translateMessage(message: string): string {
    if (!message || !message.trim()) {
      return '';
    }

    // Try to translate (if it's a key, it will be translated; if not, it returns the original)
    const translated = this.languageService.translate(message);
    
    // If translation returned the key unchanged and it contains dots, it might be a real key
    // Otherwise, use the translated value (which might be the original message)
    return translated === message && message.includes('.') 
      ? message // Likely a translation key that wasn't found
      : translated;
  }
}

