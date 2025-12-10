import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Crop } from '../../../../core/models/farm.model';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-crop-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="crop-selector-container">
      <mat-form-field class="crop-select" appearance="outline">
        <mat-label>
          <mat-icon>eco</mat-icon>
          {{ 'crops.dashboard.selectCrop' | translate }}
        </mat-label>
        <mat-select 
          [value]="selectedCropId()"
          (selectionChange)="cropSelected.emit($event.value)"
          [disabled]="loading()">
          @for (crop of crops(); track crop.crop_id) {
            <mat-option [value]="crop.crop_id">
              <div class="crop-option">
                <mat-icon class="crop-icon">{{ getCropIcon(crop.variety || crop.name) }}</mat-icon>
                <span class="crop-name">{{ crop.name }}</span>
                @if (crop.variety) {
                  <span class="crop-variety">{{ crop.variety }}</span>
                }
              </div>
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .crop-selector-container {
      width: 100%;
    }

    .crop-select {
      width: 100%;
      
      ::ng-deep .mat-mdc-form-field-flex {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 8px 16px;
        border: 1px solid rgba(16, 185, 129, 0.2);
        transition: all 0.3s ease;
      }

      ::ng-deep .mat-mdc-form-field-flex:hover {
        border-color: rgba(16, 185, 129, 0.4);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
      }

      mat-label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #047857;
        font-weight: 600;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    .crop-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0;
    }

    .crop-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #10b981;
      flex-shrink: 0;
    }

    .crop-name {
      font-weight: 600;
      color: #1f2937;
      flex: 1;
    }

    .crop-variety {
      font-size: 0.875rem;
      color: #6b7280;
      padding: 2px 8px;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 12px;
    }

    /* Dark theme */
    :host-context(body.dark-theme) {
      .crop-select ::ng-deep .mat-mdc-form-field-flex {
        background: rgba(30, 41, 59, 0.9);
        border-color: rgba(16, 185, 129, 0.3);
      }

      .crop-name {
        color: #f1f5f9;
      }

      .crop-variety {
        background: rgba(16, 185, 129, 0.2);
        color: #cbd5e1;
      }
    }
  `]
})
export class CropSelectorComponent {
  crops = input.required<Crop[]>();
  selectedCropId = input<string | null>(null);
  loading = input<boolean>(false);
  
  cropSelected = output<string>();

  getCropIcon(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('wheat') || lowerName.includes('grain')) return 'grass';
    if (lowerName.includes('tomato') || lowerName.includes('vegetable')) return 'eco';
    if (lowerName.includes('fruit')) return 'apple';
    if (lowerName.includes('herb')) return 'spa';
    if (lowerName.includes('flower')) return 'local_florist';
    return 'agriculture';
  }
}

