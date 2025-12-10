import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { Crop } from '../../core/models/farm.model';

@Component({
  selector: 'app-crops-with-fallback',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="crops-container">
      <div class="header">
        <div class="header-content">
          <mat-icon class="header-icon">agriculture</mat-icon>
          <div>
            <h1>🌾 Crop Management</h1>
            <p class="subtitle">Manage and monitor your crops</p>
          </div>
        </div>
        <button mat-raised-button color="primary" (click)="retryLoad()" [disabled]="isLoading()">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading crops...</p>
        </div>
      }

      <!-- Error State (Backend Issue) -->
      @else if (hasError()) {
        <mat-card class="error-card">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h2>⚠️ Backend Connection Error</h2>
          <p class="error-message">{{ errorMessage() }}</p>
          
          <div class="error-details">
            <h3>Possible Issues:</h3>
            <ul>
              <li>✗ Backend server is not running</li>
              <li>✗ Database connection failed</li>
              <li>✗ Crops table doesn't exist</li>
              <li>✗ API endpoint returning 500 error</li>
            </ul>
          </div>

          <div class="error-actions">
            <h3>🔧 How to Fix:</h3>
            <div class="fix-steps">
              <div class="fix-step">
                <strong>1. Check Backend:</strong>
                <code>cd smart-farm-backend && npm run start:dev</code>
              </div>
              <div class="fix-step">
                <strong>2. Test API:</strong>
                <code>curl http://localhost:3000/api/crops</code>
              </div>
              <div class="fix-step">
                <strong>3. Run Migrations:</strong>
                <code>npm run migration:run</code>
              </div>
            </div>
          </div>

          <button mat-raised-button color="primary" (click)="retryLoad()">
            <mat-icon>refresh</mat-icon>
            Try Again
          </button>
        </mat-card>
      }

      <!-- Success State -->
      @else if (crops().length > 0) {
        <div class="crops-grid">
          @for (crop of crops(); track crop.crop_id) {
            <mat-card class="crop-card">
              <div class="crop-header">
                <mat-icon class="crop-icon">eco</mat-icon>
                <h3>{{ crop.name }}</h3>
              </div>
              <div class="crop-details">
                <div class="detail-row">
                  <span class="label">Variety:</span>
                  <span class="value">{{ crop.variety || 'N/A' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="value status" [class]="crop.status">{{ crop.status | titlecase }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Planted:</span>
                  <span class="value">{{ crop.planting_date | date:'shortDate' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Expected Harvest:</span>
                  <span class="value">{{ crop.expected_harvest_date | date:'shortDate' }}</span>
                </div>
              </div>
              @if (crop.description) {
                <p class="crop-description">{{ crop.description }}</p>
              }
            </mat-card>
          }
        </div>
      }

      <!-- Empty State -->
      @else {
        <mat-card class="empty-state">
          <mat-icon class="empty-icon">agriculture</mat-icon>
          <h2>No Crops Found</h2>
          <p>Backend is working, but no crops have been added yet.</p>
          <button mat-raised-button color="primary">
            <mat-icon>add</mat-icon>
            Add Your First Crop
          </button>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .crops-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid rgba(16, 185, 129, 0.2);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #10b981;
    }

    h1 {
      margin: 0;
      color: #1f2937;
      font-size: 2rem;
    }

    .subtitle {
      margin: 0;
      color: #6b7280;
      font-size: 0.95rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      gap: 1rem;
      color: #6b7280;
    }

    .error-card {
      padding: 3rem;
      text-align: center;
      background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
      border: 2px solid #f87171;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #dc2626;
      margin-bottom: 1rem;
    }

    .error-card h2 {
      color: #dc2626;
      margin: 1rem 0;
    }

    .error-message {
      color: #991b1b;
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }

    .error-details {
      text-align: left;
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      margin: 2rem 0;
      border: 1px solid #fca5a5;
    }

    .error-details h3 {
      color: #dc2626;
      margin-top: 0;
    }

    .error-details ul {
      list-style: none;
      padding: 0;
      margin: 1rem 0;
    }

    .error-details li {
      padding: 0.5rem 0;
      color: #991b1b;
      font-size: 0.95rem;
    }

    .error-actions {
      text-align: left;
      background: #fff7ed;
      padding: 1.5rem;
      border-radius: 12px;
      margin: 2rem 0;
      border: 1px solid #fb923c;
    }

    .error-actions h3 {
      color: #ea580c;
      margin-top: 0;
    }

    .fix-steps {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .fix-step {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      border-left: 3px solid #10b981;
    }

    .fix-step strong {
      display: block;
      color: #047857;
      margin-bottom: 0.5rem;
    }

    .fix-step code {
      background: #1f2937;
      color: #10b981;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      display: block;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .crops-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .crop-card {
      padding: 1.5rem;
      transition: all 0.3s ease;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .crop-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.4);
    }

    .crop-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(16, 185, 129, 0.2);
    }

    .crop-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #10b981;
    }

    .crop-header h3 {
      margin: 0;
      color: #1f2937;
      font-size: 1.25rem;
    }

    .crop-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .label {
      color: #6b7280;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .value {
      color: #1f2937;
      font-weight: 600;
    }

    .value.status {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.85rem;
    }

    .value.status.growing {
      background: #d1fae5;
      color: #065f46;
    }

    .value.status.planted {
      background: #dbeafe;
      color: #1e40af;
    }

    .value.status.harvested {
      background: #fef3c7;
      color: #92400e;
    }

    .crop-description {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(16, 185, 129, 0.1);
      color: #6b7280;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .empty-state {
      padding: 4rem;
      text-align: center;
      background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
    }

    .empty-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #10b981;
      opacity: 0.5;
      margin-bottom: 1rem;
    }

    .empty-state h2 {
      color: #1f2937;
      margin: 1rem 0;
    }

    .empty-state p {
      color: #6b7280;
      margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
      .crops-container {
        padding: 1rem;
      }

      .header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .crops-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CropsWithFallbackComponent implements OnInit {
  private apiService = inject(ApiService);
  
  crops = signal<Crop[]>([]);
  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    console.log('[CropsWithFallback] Component initialized');
    this.loadCrops();
  }

  private loadCrops(): void {
    console.log('[CropsWithFallback] Loading crops...');
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');
    
    this.apiService.getCrops().subscribe({
      next: (crops) => {
        console.log('[CropsWithFallback] ✅ Success! Crops loaded:', crops.length);
        this.crops.set(crops);
        this.isLoading.set(false);
        this.hasError.set(false);
      },
      error: (error) => {
        console.error('[CropsWithFallback] ❌ Error loading crops:', error);
        
        let message = 'Unable to load crops from backend.';
        
        if (error.status === 500) {
          message = '500 Internal Server Error - Backend crashed while fetching crops.';
        } else if (error.status === 404) {
          message = '404 Not Found - Crops endpoint does not exist.';
        } else if (error.status === 0) {
          message = 'Cannot connect to backend - Server might be offline.';
        }
        
        this.errorMessage.set(message);
        this.isLoading.set(false);
        this.hasError.set(true);
      }
    });
  }

  retryLoad(): void {
    console.log('[CropsWithFallback] Retrying...');
    this.loadCrops();
  }
}

