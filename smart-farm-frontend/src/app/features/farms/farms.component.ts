import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';

import { ApiService } from '../../core/services/api.service';
import { Farm } from '../../core/models/farm.model';

@Component({
  selector: 'app-farms',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  templateUrl: './farms.component.html',
  styleUrl: './farms.component.scss'
})
export class FarmsComponent implements OnInit {
  private apiService = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  farms: Farm[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadFarms();
  }

  private loadFarms(): void {
    this.isLoading = true;
    this.apiService.getFarms().subscribe({
      next: (farms) => {
        this.farms = farms;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading farms:', error);
        this.isLoading = false;
        this.snackBar.open('Error loading farms', 'Close', { duration: 3000 });
      }
    });
  }

  addFarm(): void {
    // TODO: Implement add farm dialog
    this.snackBar.open('Add farm functionality coming soon', 'Close', { duration: 3000 });
  }

  editFarm(farm: Farm): void {
    // TODO: Implement edit farm dialog
    this.snackBar.open('Edit farm functionality coming soon', 'Close', { duration: 3000 });
  }

  deleteFarm(farm: Farm): void {
    if (confirm(`Are you sure you want to delete farm "${farm.name}"?`)) {
      this.apiService.deleteFarm(farm.farm_id).subscribe({
        next: () => {
          this.snackBar.open('Farm deleted successfully', 'Close', { duration: 3000 });
          this.loadFarms();
        },
        error: (error) => {
          console.error('Error deleting farm:', error);
          this.snackBar.open('Error deleting farm', 'Close', { duration: 3000 });
        }
      });
    }
  }

  refreshFarms(): void {
    this.loadFarms();
  }
}
