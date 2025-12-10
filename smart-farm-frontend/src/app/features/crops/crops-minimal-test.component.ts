import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CropDashboardService } from './services/crop-dashboard.service';

/**
 * MINIMAL TEST COMPONENT
 * Use this to test if basic functionality works
 * Replace app-crops selector temporarily in routing
 */
@Component({
  selector: 'app-crops-test',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule],
  template: `
    <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
      <h1>Crop Dashboard - Minimal Test</h1>
      
      @if (isLoading()) {
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading crops...</p>
      } @else {
        <div style="background: #f0fdf4; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <h2>✅ SUCCESS! App is responsive</h2>
          <p><strong>Crops loaded:</strong> {{ crops().length }}</p>
          <button mat-raised-button color="primary" (click)="testClick()">
            Test Button Click
          </button>
          <p *ngIf="clicked">Button works! Clicks: {{ clickCount }}</p>
        </div>

        <div style="background: #fff; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3>Loaded Crops:</h3>
          <ul>
            @for (crop of crops(); track crop.crop_id) {
              <li>{{ crop.name }} (ID: {{ crop.crop_id }})</li>
            }
          </ul>
        </div>

        <div style="margin-top: 2rem; padding: 1rem; background: #fef3c7; border-radius: 8px;">
          <h3>📝 Next Steps:</h3>
          <ol>
            <li>If you see this page, <strong>basic functionality works!</strong></li>
            <li>The freeze is likely caused by:
              <ul>
                <li>Charts rendering too much data</li>
                <li>Virtual scrolling with CDK</li>
                <li>Complex child components</li>
              </ul>
            </li>
            <li>Gradually add components back to find the culprit</li>
          </ol>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CropsMinimalTestComponent implements OnInit, OnDestroy {
  private dashboardService = inject(CropDashboardService);
  private destroy$ = new Subject<void>();

  isLoading = signal(true);
  crops = signal<any[]>([]);
  clicked = false;
  clickCount = 0;

  ngOnInit(): void {
    console.log('🧪 [TEST] Minimal component initialized');
    console.time('TEST Load Time');
    
    this.dashboardService.loadCrops()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (crops) => {
          console.log('✅ [TEST] Crops loaded:', crops.length);
          console.timeEnd('TEST Load Time');
          this.crops.set(crops);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('❌ [TEST] Error loading crops:', err);
          this.isLoading.set(false);
        }
      });
  }

  testClick(): void {
    this.clickCount++;
    this.clicked = true;
    console.log('✅ [TEST] Button clicked! Count:', this.clickCount);
  }

  ngOnDestroy(): void {
    console.log('🧪 [TEST] Component destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }
}

