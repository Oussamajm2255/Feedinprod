import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Device, DeviceStatus } from '../../../../core/models/farm.model';
import { ApiService } from '../../../../core/services/api.service';
import { FarmManagementService } from '../../../../core/services/farm-management.service';
import { LanguageService } from '../../../../core/services/language.service';

export interface DeviceFormDialogData {
  device?: Device; // If provided, it's edit mode
  farmId: string;
}

@Component({
  selector: 'app-device-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './device-form.component.html',
  styleUrl: './device-form.component.scss'
})
export class DeviceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private farmManagement = inject(FarmManagementService);
  private snackBar = inject(MatSnackBar);
  public languageService = inject(LanguageService);

  deviceForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  deviceStatuses = Object.values(DeviceStatus);
  deviceTypes = [
    'sensor',
    'controller',
    'gateway',
    'camera',
    'actuator',
    'monitor'
  ];

  constructor(
    public dialogRef: MatDialogRef<DeviceFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeviceFormDialogData
  ) {
    this.isEditMode = !!data.device;
    this.deviceForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.device) {
      this.populateForm(this.data.device);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      location: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      device_type: ['', Validators.required],
      status: [DeviceStatus.OFFLINE, Validators.required],
      description: ['', Validators.maxLength(500)],
      ip_address: ['', [Validators.pattern(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)]],
      mac_address: ['', [Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)]],
      firmware_version: ['', Validators.maxLength(50)]
    });
  }

  private populateForm(device: Device): void {
    this.deviceForm.patchValue({
      name: device.name,
      location: device.location,
      device_type: device.device_type || '',
      status: device.status,
      description: device.description || '',
      ip_address: device.ip_address || '',
      mac_address: device.mac_address || '',
      firmware_version: device.firmware_version || ''
    });
  }

  onSubmit(): void {
    if (this.deviceForm.valid) {
      this.isLoading = true;
      const formData = this.deviceForm.value;

      // Add farm_id to the form data
      formData.farm_id = this.data.farmId;

      if (this.isEditMode && this.data.device) {
        // Update existing device
        this.apiService.updateDevice(this.data.device.device_id, formData).subscribe({
          next: (updatedDevice) => {
            this.isLoading = false;
            this.snackBar.open(
              this.languageService.t()('devices.deviceUpdated'),
              this.languageService.t()('common.close'),
              { duration: 3000, panelClass: ['success-snackbar'] }
            );
            this.dialogRef.close({ action: 'updated', device: updatedDevice });
          },
          error: (error) => {
            console.error('Error updating device:', error);
            this.isLoading = false;
            this.snackBar.open(
              this.languageService.t()('errors.updateError'),
              this.languageService.t()('common.close'),
              { duration: 3000, panelClass: ['error-snackbar'] }
            );
          }
        });
      } else {
        // Create new device
        this.apiService.createDevice(formData).subscribe({
          next: (newDevice) => {
            this.isLoading = false;
            this.snackBar.open(
              this.languageService.t()('devices.deviceCreated'),
              this.languageService.t()('common.close'),
              { duration: 3000, panelClass: ['success-snackbar'] }
            );
            this.dialogRef.close({ action: 'created', device: newDevice });
          },
          error: (error) => {
            console.error('Error creating device:', error);
            this.isLoading = false;
            this.snackBar.open(
              this.languageService.t()('errors.createError'),
              this.languageService.t()('common.close'),
              { duration: 3000, panelClass: ['error-snackbar'] }
            );
          }
        });
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.deviceForm.controls).forEach(key => {
        this.deviceForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getFieldError(fieldName: string): string {
    const field = this.deviceForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return this.languageService.t()('validation.required');
      }
      if (field.errors['minlength']) {
        return this.languageService.t()('validation.minLength', { min: field.errors['minlength'].requiredLength });
      }
      if (field.errors['maxlength']) {
        return this.languageService.t()('validation.maxLength', { max: field.errors['maxlength'].requiredLength });
      }
      if (field.errors['pattern']) {
        return this.languageService.t()('validation.invalidFormat');
      }
    }
    return '';
  }

  getDeviceTypeTranslation(deviceType: string): string {
    return this.languageService.t()('devices.deviceTypes.' + deviceType) || deviceType;
  }

  getStatusTranslation(status: string): string {
    return this.languageService.t()('dashboard.deviceStatus.' + status) || status;
  }
}

