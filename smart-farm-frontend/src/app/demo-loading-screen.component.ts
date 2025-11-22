/**
 * DEMO PAGE - Smart Loading Screen Preview
 *
 * This component lets you see the ACTUAL loading screen with all animations!
 *
 * To view:
 * 1. Add this to your routes
 * 2. Navigate to /demo-loading
 * 3. Click the button to toggle the loading screen
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SmartLoadingScreenSimpleComponent } from './shared/components/smart-loading-screen/smart-loading-screen-simple.component';

@Component({
  selector: 'app-demo-loading-screen',
  standalone: true,
  imports: [CommonModule, MatIconModule, SmartLoadingScreenSimpleComponent],
  template: `
    <div class="demo-page">
      <!-- Control Panel -->
      <div class="control-panel" *ngIf="!isLoading">
        <div class="card">
          <h1>
            <mat-icon>eco</mat-icon>
            Smart Loading Screen Demo
          </h1>
          <p class="subtitle">See the FULL animated loading screen in action!</p>

          <div class="features">
            <h3>
              <mat-icon>visibility</mat-icon>
              What You'll See:
            </h3>
            <ul>
              <li>
                <mat-icon>agriculture</mat-icon>
                Agriculture SVG with line-drawing animation
              </li>
              <li>
                <mat-icon>gradient</mat-icon>
                Animated gradient background (15s loop)
              </li>
              <li>
                <mat-icon>stars</mat-icon>
                20 floating particles drifting upward
              </li>
              <li>
                <mat-icon>loop</mat-icon>
                Infinite seamless loop (3s cycle)
              </li>
              <li>
                <mat-icon>radio_button_checked</mat-icon>
                Three bouncing progress dots
              </li>
              <li>
                <mat-icon>animation</mat-icon>
                Smooth fade-in/fade-out transitions
              </li>
              <li>
                <mat-icon>accessibility</mat-icon>
                Accessibility-friendly (respects reduced motion)
              </li>
            </ul>
          </div>

          <div class="button-group">
            <button class="btn-primary" (click)="showLoading()">
              <mat-icon>play_arrow</mat-icon>
              Show Loading Screen
            </button>
            <button class="btn-secondary" (click)="showLoadingTimed()">
              <mat-icon>schedule</mat-icon>
              Show for 5 Seconds
            </button>
          </div>

          <div class="info">
            <p><strong>Note:</strong> Pure CSS animations - no external dependencies! Lightweight and fast.</p>
          </div>
        </div>
      </div>

      <!-- The ACTUAL Loading Screen Component -->
      <app-smart-loading-screen
        [isLoading]="isLoading"
        [message]="currentMessage">
      </app-smart-loading-screen>

      <!-- Close Button (only shows when loading is active) -->
      <button
        *ngIf="isLoading"
        class="close-btn"
        (click)="hideLoading()">
        <mat-icon>close</mat-icon>
        Close Demo
      </button>
    </div>
  `,
  styles: [`
    .demo-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      padding: 2rem;
      position: relative;
    }

    .control-panel {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }

    .card {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      max-width: 700px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    h1 {
      font-size: 2.5rem;
      color: #2e7d32;
      margin: 0 0 0.5rem 0;
      font-family: 'Roboto', sans-serif;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    h1 mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #2e7d32;
    }

    .subtitle {
      font-size: 1.2rem;
      color: #666;
      margin: 0 0 2rem 0;
    }

    .features {
      background: #f1f8f4;
      border-left: 4px solid #4caf50;
      padding: 1.5rem;
      margin: 2rem 0;
      border-radius: 8px;
    }

    .features h3 {
      color: #2e7d32;
      margin: 0 0 1rem 0;
      font-size: 1.3rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .features h3 mat-icon {
      font-size: 1.3rem;
      width: 1.3rem;
      height: 1.3rem;
      color: #2e7d32;
    }

    .features ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .features li {
      padding: 0.5rem 0;
      font-size: 1.1rem;
      color: #555;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .features li mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
      color: #4caf50;
      flex-shrink: 0;
    }

    .button-group {
      display: flex;
      gap: 1rem;
      margin: 2rem 0;
      flex-wrap: wrap;
    }

    .btn-primary,
    .btn-secondary {
      flex: 1;
      min-width: 200px;
      padding: 1.2rem 2rem;
      font-size: 1.1rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      font-family: 'Roboto', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-primary mat-icon,
    .btn-secondary mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
    }

    .btn-secondary {
      background: white;
      color: #4caf50;
      border: 2px solid #4caf50;
    }

    .btn-secondary:hover {
      background: #f1f8f4;
      transform: translateY(-2px);
    }

    .info {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 1rem;
      border-radius: 4px;
      margin-top: 2rem;
    }

    .info p {
      margin: 0;
      color: #e65100;
      font-weight: 500;
    }

    .close-btn {
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: rgba(255, 255, 255, 0.95);
      color: #2e7d32;
      border: 2px solid rgba(255, 255, 255, 0.8);
      padding: 1rem 1.5rem;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      z-index: 10000;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .close-btn mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .close-btn:hover {
      background: white;
      transform: scale(1.05);
      box-shadow: 0 6px 30px rgba(0, 0, 0, 0.3);
    }

    @media (max-width: 768px) {
      .card {
        padding: 2rem;
      }

      h1 {
        font-size: 2rem;
      }

      .button-group {
        flex-direction: column;
      }

      .btn-primary,
      .btn-secondary {
        width: 100%;
      }

      .close-btn {
        top: 1rem;
        right: 1rem;
        padding: 0.75rem 1.25rem;
      }
    }
  `]
})
export class DemoLoadingScreenComponent {
  isLoading = false;
  currentMessage = 'Growing your smart network…';

  private messages = [
    'Growing your smart network…',
    'Connecting to IoT devices…',
    'Syncing sensor data…',
    'Loading farm analytics…',
    'Preparing your dashboard…'
  ];

  showLoading() {
    this.isLoading = true;
    this.cycleMessages();
  }

  showLoadingTimed() {
    this.showLoading();
    setTimeout(() => {
      this.hideLoading();
    }, 5000);
  }

  hideLoading() {
    this.isLoading = false;
  }

  private cycleMessages() {
    let index = 0;
    const interval = setInterval(() => {
      if (!this.isLoading) {
        clearInterval(interval);
        return;
      }
      this.currentMessage = this.messages[index % this.messages.length];
      index++;
    }, 2000);
  }
}

