import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../core/services/api.service';
import { Crop } from '../../core/models/farm.model';

@Component({
  selector: 'app-crops-direct-api-test',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  template: `
    <div style="padding: 2rem;">
      <h1>🎯 Crops - Direct API Test (Like Farms Component)</h1>
      
      @if (isLoading) {
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading crops...</p>
      } @else if (crops.length > 0) {
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-top: 2rem;">
          @for (crop of crops; track crop.crop_id) {
            <mat-card style="padding: 1rem;">
              <h3>{{ crop.name }}</h3>
              <p><strong>ID:</strong> {{ crop.crop_id }}</p>
              <p><strong>Status:</strong> {{ crop.status }}</p>
              <p><strong>Variety:</strong> {{ crop.variety || 'N/A' }}</p>
            </mat-card>
          }
        </div>
      } @else {
        <p>No crops found</p>
      }
    </div>
  `
})
export class CropsDirectApiTestComponent implements OnInit {
  private apiService = inject(ApiService);  // ← DIRECT like Farms!
  
  crops: Crop[] = [];
  isLoading = true;

  constructor() {
    console.log('[CropsDirectApiTest] Constructor called');
  }

  ngOnInit(): void {
    console.log('[CropsDirectApiTest] ngOnInit called');
    this.loadCrops();
  }

  private loadCrops(): void {
    console.log('[CropsDirectApiTest] Loading crops...');
    this.isLoading = true;
    
    this.apiService.getCrops().subscribe({
      next: (crops) => {
        console.log('[CropsDirectApiTest] Crops loaded:', crops.length);
        this.crops = crops;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('[CropsDirectApiTest] Error:', error);
        this.isLoading = false;
      }
    });
  }
}

