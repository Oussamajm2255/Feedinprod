import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel;
  private enabledInProduction = false;

  constructor() {
    // Set log level based on environment
    this.logLevel = environment.production ? LogLevel.ERROR : LogLevel.DEBUG;
    this.enabledInProduction = environment.logLevel === 'debug';
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log error messages (always logged, even in production)
   */
  error(message: string, error?: any, context?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, error, context);
      
      // In production, send to error tracking service
      if (environment.production && environment.enableErrorReporting) {
        this.sendToErrorTracking(message, error, context);
      }
    }
  }

  /**
   * Log with custom emoji prefix (for WebSocket, Notifications, etc.)
   */
  logWithPrefix(prefix: string, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`${prefix} ${message}`, ...args);
    }
  }

  /**
   * Check if we should log at this level
   */
  private shouldLog(level: LogLevel): boolean {
    if (environment.production && !this.enabledInProduction) {
      return level >= LogLevel.ERROR;
    }
    return level >= this.logLevel;
  }

  /**
   * Send error to tracking service (Sentry, LogRocket, etc.)
   */
  private sendToErrorTracking(message: string, error?: any, context?: any): void {
    // TODO: Integrate with error tracking service
    // Example: Sentry.captureException(error, { extra: { message, context } });
  }

  /**
   * Group logs together
   */
  group(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.group(label);
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.groupEnd();
    }
  }
}



