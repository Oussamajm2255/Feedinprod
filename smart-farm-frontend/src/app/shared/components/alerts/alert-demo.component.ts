/**
 * DEMO COMPONENT - Alert System Demonstration
 * 
 * This is a standalone demo component to test and showcase the new glassmorphic alert system.
 * 
 * To use this demo:
 * 1. Add this route to your app.routes.ts:
 *    { path: 'alert-demo', component: AlertDemoComponent }
 * 
 * 2. Navigate to: http://localhost:4200/alert-demo
 * 
 * 3. Click buttons to see different alert types in action
 * 
 * You can delete this file after testing - it's purely for demonstration.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-alert-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-container">
      <div class="demo-header">
        <h1>🎨 Glassmorphic Alert System Demo</h1>
        <p>Click the buttons below to test different alert types</p>
      </div>

      <div class="demo-grid">
        <!-- Success Alerts -->
        <div class="demo-section">
          <h2>✅ Success Alerts</h2>
          <button class="btn btn-success" (click)="showSuccessAlert()">
            Show Success Alert
          </button>
          <button class="btn btn-success" (click)="showDeviceSuccess()">
            Device Activated
          </button>
          <button class="btn btn-success" (click)="showSensorSuccess()">
            Sensor Reading Saved
          </button>
        </div>

        <!-- Error Alerts -->
        <div class="demo-section">
          <h2>❌ Error Alerts</h2>
          <button class="btn btn-error" (click)="showErrorAlert()">
            Show Error Alert
          </button>
          <button class="btn btn-error" (click)="showConnectionError()">
            Connection Failed
          </button>
          <button class="btn btn-error" (click)="showValidationError()">
            Validation Error
          </button>
        </div>

        <!-- Warning Alerts -->
        <div class="demo-section">
          <h2>⚠️ Warning Alerts</h2>
          <button class="btn btn-warning" (click)="showWarningAlert()">
            Show Warning Alert
          </button>
          <button class="btn btn-warning" (click)="showBatteryWarning()">
            Low Battery Warning
          </button>
          <button class="btn btn-warning" (click)="showThresholdWarning()">
            Threshold Exceeded
          </button>
        </div>

        <!-- Info Alerts -->
        <div class="demo-section">
          <h2>ℹ️ Info Alerts</h2>
          <button class="btn btn-info" (click)="showInfoAlert()">
            Show Info Alert
          </button>
          <button class="btn btn-info" (click)="showUpdateInfo()">
            Update Available
          </button>
          <button class="btn btn-info" (click)="showSyncInfo()">
            Data Synced
          </button>
        </div>

        <!-- Advanced Examples -->
        <div class="demo-section demo-section-full">
          <h2>🚀 Advanced Examples</h2>
          <div class="demo-advanced">
            <button class="btn btn-primary" (click)="showMultipleAlerts()">
              Show Multiple Alerts
            </button>
            <button class="btn btn-primary" (click)="showLongDurationAlert()">
              10 Second Alert
            </button>
            <button class="btn btn-primary" (click)="showPersistentAlert()">
              Persistent Alert (No Auto-dismiss)
            </button>
            <button class="btn btn-danger" (click)="clearAllAlerts()">
              Clear All Alerts
            </button>
          </div>
        </div>

        <!-- Loading Demo -->
        <div class="demo-section demo-section-full">
          <h2>⏳ Loading Indicator Demo</h2>
          <button class="btn btn-primary" (click)="showLoadingDemo()">
            Simulate 3-Second Operation
          </button>
        </div>
      </div>

      <div class="demo-footer">
        <p>💡 <strong>Tip:</strong> Hover over alerts to pause auto-dismiss</p>
        <p>🌓 Try switching between light/dark themes!</p>
        <p>🌍 Try switching between EN/FR/AR languages for RTL support!</p>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
    }

    .demo-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .demo-header h1 {
      font-size: 2.5rem;
      color: var(--text-primary);
      margin-bottom: 1rem;
    }

    .demo-header p {
      font-size: 1.1rem;
      color: var(--text-secondary);
    }

    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .demo-section {
      background: var(--card-bg);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-color);
    }

    .demo-section-full {
      grid-column: 1 / -1;
    }

    .demo-section h2 {
      font-size: 1.3rem;
      color: var(--text-primary);
      margin-bottom: 1rem;
    }

    .demo-advanced {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 100%;
      margin-bottom: 0.75rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .btn-error {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }

    .btn-warning {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }

    .btn-info {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .btn-primary {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
    }

    .btn-danger {
      background: linear-gradient(135deg, #dc2626, #991b1b);
      color: white;
    }

    .demo-footer {
      text-align: center;
      padding: 2rem;
      background: var(--card-bg);
      border-radius: 16px;
      border: 1px solid var(--border-color);
    }

    .demo-footer p {
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    @media (max-width: 768px) {
      .demo-container {
        padding: 1rem;
      }

      .demo-header h1 {
        font-size: 1.8rem;
      }

      .demo-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .demo-advanced {
        flex-direction: column;
      }

      .btn {
        padding: 0.65rem 1.2rem;
        font-size: 0.9rem;
      }
    }
  `]
})
export class AlertDemoComponent {
  private alertService = inject(AlertService);

  // Basic Alert Examples
  showSuccessAlert() {
    this.alertService.success('common.success', 'common.operationSuccess');
  }

  showErrorAlert() {
    this.alertService.error('common.error', 'common.operationError');
  }

  showWarningAlert() {
    this.alertService.warning('common.warning', 'common.operationWarning');
  }

  showInfoAlert() {
    this.alertService.info('common.info', 'common.operationInfo');
  }

  // Contextual Examples
  showDeviceSuccess() {
    this.alertService.success(
      'Device Activated',
      'The irrigation pump has been activated successfully'
    );
  }

  showSensorSuccess() {
    this.alertService.success(
      'Reading Saved',
      'Soil moisture reading has been recorded'
    );
  }

  showConnectionError() {
    this.alertService.error(
      'Connection Failed',
      'Unable to connect to the sensor. Please check your network'
    );
  }

  showValidationError() {
    this.alertService.error(
      'Validation Error',
      'Please check all required fields before submitting'
    );
  }

  showBatteryWarning() {
    this.alertService.warning(
      'Low Battery',
      'Sensor battery level is below 20%. Consider replacing soon'
    );
  }

  showThresholdWarning() {
    this.alertService.warning(
      'Threshold Exceeded',
      'Soil moisture level is above the configured threshold'
    );
  }

  showUpdateInfo() {
    this.alertService.info(
      'Update Available',
      'A new version of the app is available for download'
    );
  }

  showSyncInfo() {
    this.alertService.info(
      'Data Synced',
      'All sensor data has been synchronized with the cloud'
    );
  }

  // Advanced Examples
  showMultipleAlerts() {
    this.alertService.success('Alert 1', 'First alert message');
    
    setTimeout(() => {
      this.alertService.info('Alert 2', 'Second alert message');
    }, 500);
    
    setTimeout(() => {
      this.alertService.warning('Alert 3', 'Third alert message');
    }, 1000);
  }

  showLongDurationAlert() {
    this.alertService.show(
      'info',
      'Extended Alert',
      'This alert will stay for 10 seconds',
      10000
    );
  }

  showPersistentAlert() {
    this.alertService.show(
      'warning',
      'Persistent Alert',
      'This alert will not auto-dismiss. Click X to close',
      0
    );
  }

  clearAllAlerts() {
    this.alertService.clear();
  }

  // Loading Demo
  showLoadingDemo() {
    const loadingId = this.alertService.show(
      'info',
      'Processing...',
      'Please wait while we process your request',
      0
    );

    setTimeout(() => {
      this.alertService.dismiss(loadingId);
      this.alertService.success(
        'Complete!',
        'Operation completed successfully'
      );
    }, 3000);
  }
}

