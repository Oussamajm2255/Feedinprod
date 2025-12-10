import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// Services
import { CropDashboardService } from './services/crop-dashboard.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

// Components
import { CropSelectorComponent } from './components/crop-selector/crop-selector.component';
import { CropKpisComponent } from './components/crop-kpis/crop-kpis.component';
import { HealthAnalyticsPanelComponent } from './components/health-analytics-panel/health-analytics-panel.component';
import { CropDetailsSidebarComponent } from './components/crop-details-sidebar/crop-details-sidebar.component';
import { SmartActionsPanelComponent } from './components/smart-actions-panel/smart-actions-panel.component';
import { EventsTimelineComponent } from './components/events-timeline/events-timeline.component';
import { MapComparisonTabsComponent } from './components/map-comparison-tabs/map-comparison-tabs.component';
import { SustainabilityMetricsComponent } from './components/sustainability-metrics/sustainability-metrics.component';

@Component({
  selector: 'app-crops',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslatePipe,
    CropSelectorComponent,
    CropKpisComponent,
    HealthAnalyticsPanelComponent,
    CropDetailsSidebarComponent,
    SmartActionsPanelComponent,
    EventsTimelineComponent,
    MapComparisonTabsComponent,
    SustainabilityMetricsComponent
  ],
  templateUrl: './crops.component.html',
  styleUrl: './crops.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CropsComponent implements OnInit, OnDestroy {
  private dashboardService = inject(CropDashboardService);
  private snackBar = inject(MatSnackBar);
  private languageService = inject(LanguageService);
  private destroy$ = new Subject<void>();

  // Signals for reactive state
  isLoading = signal<boolean>(true);
  isLoadingData = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Data signals
  crops = this.dashboardService.crops;
  selectedCropId = this.dashboardService.selectedCropId;
  selectedCrop = this.dashboardService.selectedCrop;
  
  kpis = signal<any>(null);
  analytics = signal<any>(null);
  events = signal<any>(null);
  comparisonData = signal<any>(null);
  sustainabilityMetrics = signal<any>(null);
  
  private lastLoadedCropId: string | null = null;
  private isInitialLoad = true;

  constructor() {
    // NO EFFECT - Use manual subscription instead for better control
  }

  ngOnInit(): void {
    console.time('CropDashboard Init');
    this.loadInitialData();
    
    // Watch for crop selection changes AFTER initial load
    setTimeout(() => {
      this.setupCropWatcher();
    }, 100);
  }

  private setupCropWatcher(): void {
    // Simple property watcher - no complex effect needed
    let previousCropId = this.selectedCropId();
    
    const checkCropChange = () => {
      const currentCropId = this.selectedCropId();
      
      if (currentCropId !== previousCropId && !this.isLoading() && !this.isLoadingData()) {
        console.log('[CropsComponent] Crop changed from', previousCropId, 'to', currentCropId);
        
        if (currentCropId && this.crops().length > 0) {
          this.loadCropData(currentCropId);
        } else if (!currentCropId) {
          this.clearCropData();
        }
        
        previousCropId = currentCropId;
      }
      
      // Check again in 500ms (only if component is still alive)
      if (!this.destroy$.closed) {
        setTimeout(checkCropChange, 500);
      }
    };
    
    checkCropChange();
  }

  ngOnDestroy(): void {
    console.timeEnd('CropDashboard Init');
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    console.log('[CropsComponent] Loading initial data...');
    this.isLoading.set(true);
    this.error.set(null);

    this.dashboardService.loadCrops()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (crops) => {
          console.log('[CropsComponent] Crops loaded successfully:', crops.length);
          this.isLoading.set(false);
          this.isInitialLoad = false;
          
          // Auto-load first crop if one is selected
          const selectedId = this.selectedCropId();
          if (selectedId && crops.length > 0) {
            console.log('[CropsComponent] Auto-loading selected crop:', selectedId);
            setTimeout(() => this.loadCropData(selectedId), 100);
          }
        },
        error: (err) => {
          console.error('[CropsComponent] Error loading crops:', err);
          this.error.set(this.languageService.translate('crops.dashboard.error'));
          this.isLoading.set(false);
          this.isInitialLoad = false;
          this.showError(this.languageService.translate('crops.dashboard.error'));
        }
      });
  }

  private loadCropData(cropId: string): void {
    // Prevent multiple simultaneous loads
    if (this.isLoadingData()) {
      console.log('[CropsComponent] Already loading data, skipping...');
      return;
    }

    console.log('[CropsComponent] Loading crop data for:', cropId);
    this.isLoadingData.set(true);
    this.error.set(null);

    // Combine all API calls into one using forkJoin for better performance
    forkJoin({
      kpis: this.dashboardService.getCropKPIs(cropId),
      analytics: this.dashboardService.getCropAnalytics(cropId),
      events: this.dashboardService.getCropEvents(cropId),
      metrics: this.dashboardService.getSustainabilityMetrics(cropId),
      comparison: this.dashboardService.getCropComparison()
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoadingData.set(false))
    ).subscribe({
      next: (data) => {
        console.log('[CropsComponent] All crop data loaded successfully');
        this.kpis.set(data.kpis);
        this.analytics.set(data.analytics);
        this.events.set(data.events);
        this.sustainabilityMetrics.set(data.metrics);
        this.comparisonData.set(data.comparison);
      },
      error: (err) => {
        console.error('[CropsComponent] Error loading crop data:', err);
        this.lastLoadedCropId = null; // Reset to allow retry
        this.error.set(this.languageService.translate('crops.dashboard.error'));
        this.showError(this.languageService.translate('crops.dashboard.error'));
      }
    });
  }

  private clearCropData(): void {
    this.kpis.set(null);
    this.analytics.set(null);
    this.events.set(null);
    this.comparisonData.set(null);
    this.sustainabilityMetrics.set(null);
  }

  onCropSelected(cropId: string): void {
    this.dashboardService.selectCrop(cropId);
  }

  onActionExecuted(action: string): void {
    const cropId = this.selectedCropId();
    if (!cropId) {
      this.showError(this.languageService.translate('crops.dashboard.noCropSelected'));
      return;
    }

    this.dashboardService.executeAction(cropId, action)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: any) => {
          if (result && result.ok) {
            this.showSuccess(this.languageService.translate('crops.actions.actionExecuted'));
            // Reload events to show the new action
            this.dashboardService.getCropEvents(cropId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (events) => this.events.set(events),
                error: (err) => console.error('Error reloading events:', err)
              });
          } else {
            this.showError(this.languageService.translate('crops.actions.actionFailed'));
          }
        },
        error: (err) => {
          console.error('Error executing action:', err);
          this.showError(this.languageService.translate('crops.actions.actionFailed'));
        }
      });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, this.languageService.translate('common.close'), {
      duration: 3000,
      panelClass: 'success-snackbar'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, this.languageService.translate('common.close'), {
      duration: 5000,
      panelClass: 'error-snackbar'
    });
  }
}

