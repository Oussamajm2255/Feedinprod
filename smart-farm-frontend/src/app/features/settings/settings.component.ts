import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="container">
      <h2>Settings</h2>
      <div class="grid">
        <mat-card class="item">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>notifications</mat-icon>
              Notification Settings
            </mat-card-title>
            <mat-card-subtitle>Quiet hours, categories, cooldown</mat-card-subtitle>
          </mat-card-header>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/settings/notifications">
              Open
            </button>
          </mat-card-actions>
        </mat-card>
        <!-- Placeholder for future settings -->
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 1000px; margin: 24px auto; padding: 0 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .item mat-card-title { display: flex; align-items: center; gap: 8px; }
  `]
})
export class SettingsComponent {}
