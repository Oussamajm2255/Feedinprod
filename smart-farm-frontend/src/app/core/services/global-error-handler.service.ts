import { Injectable, ErrorHandler, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  private snackBar = inject(MatSnackBar);

  handleError(error: any): void {
    console.error('Global Error:', error);

    // In production, send error to monitoring service
    if (environment.production && environment.enableErrorReporting) {
      this.reportError(error);
    }

    // Show user-friendly error message
    const message = this.getUserFriendlyMessage(error);
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private getUserFriendlyMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    
    if (error?.message) {
      return error.message;
    }

    if (error?.status === 0) {
      return 'Network error. Please check your connection.';
    }

    if (error?.status >= 500) {
      return 'Server error. Please try again later.';
    }

    if (error?.status === 401) {
      return 'Authentication required. Please log in again.';
    }

    if (error?.status === 403) {
      return 'Access denied. You do not have permission to perform this action.';
    }

    if (error?.status === 404) {
      return 'Resource not found.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  private reportError(error: any): void {
    // In a real application, you would send this to your error monitoring service
    // like Sentry, LogRocket, or Bugsnag
    try {
      // Example: Send to error monitoring service
      // errorMonitoringService.captureException(error);
      console.log('Error reported to monitoring service:', error);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }
}
