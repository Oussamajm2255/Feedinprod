import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    TranslatePipe
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  user = this.authService.user;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isLoading = false;
  isPasswordLoading = false;
  hidePassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  protected languageService = inject(LanguageService);

  constructor() {
    this.profileForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      city: [''],
      country: [''],
      date_of_birth: [''],
      gender: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.profileForm.patchValue({
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        email: currentUser.email,
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        city: currentUser.city || '',
        country: currentUser.country || '',
        date_of_birth: currentUser.date_of_birth || '',
        gender: currentUser.gender || ''
      });
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onProfileSubmit(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      const currentUser = this.user();
      
      if (currentUser) {
        this.apiService.updateUser(currentUser.user_id, this.profileForm.value).subscribe({
          next: (updatedUser) => {
            this.isLoading = false;
            this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
            // Update the user in the auth service
            this.authService.user.set(updatedUser);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating profile:', error);
            this.snackBar.open('Error updating profile', 'Close', { duration: 3000 });
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.profileForm);
    }
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.valid) {
      this.isPasswordLoading = true;
      const currentUser = this.user();
      
      if (currentUser) {
        this.apiService.updatePassword(currentUser.user_id, this.passwordForm.get('newPassword')?.value).subscribe({
          next: () => {
            this.isPasswordLoading = false;
            this.snackBar.open('Password updated successfully', 'Close', { duration: 3000 });
            this.passwordForm.reset();
          },
          error: (error) => {
            this.isPasswordLoading = false;
            console.error('Error updating password:', error);
            this.snackBar.open('Error updating password', 'Close', { duration: 3000 });
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.passwordForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(formGroup: FormGroup, fieldName: string): string {
    const control = formGroup.get(fieldName);
    if (control?.hasError('required')) {
      return this.languageService.translate('validation.fieldRequiredWithName', {
        field: this.getFieldLabel(fieldName)
      });
    }
    if (control?.hasError('email')) {
      return this.languageService.translate('validation.invalidEmailWithName', {
        field: this.getFieldLabel(fieldName)
      });
    }
    if (control?.hasError('minlength')) {
      return this.languageService.translate('validation.minLengthWithName', {
        field: this.getFieldLabel(fieldName),
        min: control.errors?.['minlength'].requiredLength
      });
    }
    if (control?.hasError('passwordMismatch')) {
      return this.languageService.translate('auth.passwordMismatch');
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const fieldMap: Record<string, string> = {
      first_name: 'auth.firstName',
      last_name: 'auth.lastName',
      email: 'common.email',
      phone: 'profile.fields.phone',
      address: 'profile.fields.address',
      city: 'profile.fields.city',
      country: 'profile.fields.country',
      date_of_birth: 'profile.fields.dateOfBirth',
      gender: 'profile.fields.gender',
      currentPassword: 'profile.currentPassword',
      newPassword: 'profile.newPassword',
      confirmPassword: 'profile.confirmNewPassword'
    };

    const key = fieldMap[fieldName] || `profile.fields.${fieldName}`;
    return this.languageService.translate(key);
  }
}
