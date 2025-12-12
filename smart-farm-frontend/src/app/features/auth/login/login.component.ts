import { Component, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/user.model';
import { LanguageService } from '../../../core/services/language.service';
import { AlertService } from '../../../core/services/alert.service';
import { environment } from '../../../../environments/environment';

/**
 * LoginComponent - A glassmorphism-styled login form with video background
 *
 * Features:
 * - Reactive form validation with Angular FormBuilder
 * - Video background that plays once and pauses on final frame
 * - Glassmorphism UI with backdrop-filter effects
 * - Fully responsive design (mobile, tablet, desktop)
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Loading states with smooth animations
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-30px)' }),
        animate('0.8s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})

export class LoginComponent implements AfterViewInit, OnDestroy {
  // Dependency injection using modern Angular inject()
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);
  public readonly languageService = inject(LanguageService);

  // Reference to video element
  @ViewChild('bgVideo', { static: false }) bgVideo!: ElementRef<HTMLVideoElement>;

  // Form state
  loginForm: FormGroup;

  // UI state signals
  readonly isLoading = signal(false);
  readonly hidePassword = signal(true);
  readonly isVideoLoaded = signal(false);
  readonly loginSuccess = signal(false);
  readonly showFallbackIcon = signal(false);
  readonly videoError = signal(false);
  readonly loginAttempts = signal(0);
  readonly isRateLimited = signal(false);
  readonly isCardActive = signal(false);

  // Configuration
  public readonly config = environment;

  // Computed properties
  readonly isFormValid = computed(() => this.loginForm?.valid ?? false);
  readonly canSubmit = computed(() => !this.isLoading() && this.isFormValid() && !this.isRateLimited());

  constructor() {
    this.loginForm = this.createLoginForm();
    this.initializeFormState();
  }

  // Form initialization
  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Removed async validator - check-email endpoint doesn't exist in production
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  private initializeFormState(): void {
    this.loadFormData();
    this.loadRememberedEmail();
    this.checkRateLimit();
    this.setupFormAutoSave();
  }

  private setupFormAutoSave(): void {
    this.loginForm.valueChanges.subscribe(() => this.saveFormData());
  }

  ngAfterViewInit(): void {
    this.setupVideoPlayback();
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    this.cleanupVideoListeners();
  }

  private cleanupVideoListeners(): void {
    const video = this.bgVideo?.nativeElement;
    if (!video) return;

    video.removeEventListener('loadeddata', this.onVideoLoaded);
    video.removeEventListener('ended', this.onVideoEnded);
    video.removeEventListener('error', this.onVideoError);
  }

  // Video playback setup
  private setupVideoPlayback(): void {
    const video = this.bgVideo?.nativeElement;
    if (!video) {
      this.handleVideoNotFound();
      return;
    }

    this.attachVideoListeners(video);
    video.muted = true; // Required for autoplay
    this.playVideo();
  }

  private handleVideoNotFound(): void {
    console.warn('Video element not found');
    this.videoError.set(true);
  }

  private attachVideoListeners(video: HTMLVideoElement): void {
    video.addEventListener('loadeddata', this.onVideoLoaded.bind(this));
    video.addEventListener('ended', this.onVideoEnded.bind(this));
    video.addEventListener('error', this.onVideoError.bind(this));
  }

  // Video event handlers
  private onVideoLoaded(): void {
    this.isVideoLoaded.set(true);
  }

  private onVideoEnded(): void {
    this.bgVideo?.nativeElement?.pause();
  }

  private onVideoError(): void {
    this.videoError.set(true);
    console.warn('Video failed to load, using fallback background');
  }

  private playVideo(): void {
    const video = this.bgVideo?.nativeElement;
    if (!video) return;

    video.play()?.catch(() => {
      console.warn('Video autoplay prevented by browser');
      video.currentTime = 0; // Show first frame
    });
  }

  // Form submission
  onSubmit(): void {
    if (!this.validateSubmission()) return;

    if (this.loginForm.valid) {
      this.performLogin();
    }
  }

  private validateSubmission(): boolean {
    if (this.isRateLimited()) {
      this.showRateLimitWarning();
      return false;
    }

    if (!this.loginForm.valid) {
      this.markFormGroupTouched();
      return false;
    }

    return true;
  }

  private performLogin(): void {
    this.isLoading.set(true);
    this.loginSuccess.set(false);

    const credentials = this.getLoginCredentials();

    this.authService.login(credentials).subscribe({
      next: () => this.handleLoginSuccess(credentials.email),
      error: (error) => this.handleLoginError(error)
    });
  }

  private getLoginCredentials(): LoginRequest {
    return {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };
  }

  private handleLoginSuccess(email: string): void {
    this.isLoading.set(false);
    this.loginSuccess.set(true);

    this.trackLoginAttempt(email, true);
    this.resetLoginAttempts();
    this.handleRememberMe(email);
    this.showSuccessMessage();
    this.clearFormData();

    this.navigateAfterDelay();
  }

  private handleLoginError(error: any): void {
    this.isLoading.set(false);
    this.loginSuccess.set(false);

    this.trackLoginAttempt(this.loginForm.get('email')?.value, false);
    this.incrementLoginAttempts();
    this.clearPasswordField();
    this.showErrorMessage(error);

    console.error('Login error:', error);
  }

  private handleRememberMe(email: string): void {
    if (this.loginForm.get('rememberMe')?.value) {
      this.saveUserCredentials(email);
    }
  }

  private clearPasswordField(): void {
    this.loginForm.patchValue({ password: '' });
  }

  private showSuccessMessage(): void {
    this.alertService.success(
      this.languageService.t()('auth.loginSuccess'),
      this.languageService.t()('auth.welcomeBack')
    );
  }

  private showErrorMessage(error: any): void {
    const errorMessage = this.getSpecificErrorMessage(error);
    this.alertService.error(
      this.languageService.t()('auth.loginError'),
      errorMessage
    );
  }

  private showRateLimitWarning(): void {
    this.alertService.warning(
      this.languageService.t()('auth.rateLimitTitle'),
      this.languageService.t()('auth.rateLimitMessage')
    );
  }

  private navigateAfterDelay(): void {
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, this.config.auth.loginSuccessDelay);
  }

  private markFormGroupTouched(): void {
    Object.values(this.loginForm.controls).forEach(control => control.markAsTouched());
  }

  // Form validation helpers
  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (!control) return '';

    if (control.hasError('required')) {
      return this.getRequiredErrorMessage(fieldName);
    }

    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }

    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Password must be at least ${minLength} characters long`;
    }

    return '';
  }

  private getRequiredErrorMessage(fieldName: string): string {
    const errorMap: Record<string, string> = {
      email: this.languageService.t()('auth.emailRequired'),
      password: this.languageService.t()('auth.passwordRequired')
    };
    return errorMap[fieldName] || `${fieldName} is required`;
  }

  hasError(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control?.invalid && control.touched);
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(value => !value);
  }

  onLogoError(event: Event): void {
    this.showFallbackIcon.set(true);
  }

  // Removed emailExistsValidator - check-email endpoint doesn't exist in production

  // Error handling
  private getSpecificErrorMessage(error: any): string {
    const errorMessages: Record<number, string> = {
      401: this.languageService.t()('auth.invalidCredentials'),
      422: this.languageService.t()('auth.invalidEmailFormat'),
      429: this.languageService.t()('auth.tooManyAttempts')
    };

    if (error.status in errorMessages) {
      return errorMessages[error.status];
    }

    if (error.status === 0 || error.status >= 500) {
      return this.languageService.t()('auth.networkError');
    }

    return this.languageService.t()('auth.loginError');
  }

  // Form persistence (sessionStorage)
  private saveFormData(): void {
    const formData = {
      email: this.loginForm.get('email')?.value,
      rememberMe: this.loginForm.get('rememberMe')?.value
    };
    this.setStorageItem('session', 'loginFormData', formData);
  }

  private loadFormData(): void {
    const formData = this.getStorageItem('session', 'loginFormData');
    if (formData) {
      this.loginForm.patchValue({
        email: formData.email || '',
        rememberMe: formData.rememberMe || false
      });
    }
  }

  private clearFormData(): void {
    sessionStorage.removeItem('loginFormData');
  }

  // Remember me functionality (localStorage)
  private saveUserCredentials(email: string): void {
    this.setStorageItem('local', 'rememberedEmail', email);
  }

  private loadRememberedEmail(): void {
    const email = this.getStorageItem('local', 'rememberedEmail');
    if (email) {
      this.loginForm.patchValue({ email, rememberMe: true });
    }
  }

  // Keyboard shortcuts
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', this.handleKeyboardShortcut.bind(this));
  }

  private handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key === 'l') {
      event.preventDefault();
      document.getElementById('email-input')?.focus();
    }

    if (event.key === 'Escape') {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.loginForm.reset({ rememberMe: false });
  }

  // Analytics tracking
  private trackLoginAttempt(email: string, success: boolean): void {
    if (!this.config.enableAnalytics) return;
    console.log(`Login attempt: ${email}, Success: ${success}`);
  }

  // Rate limiting
  private checkRateLimit(): void {
    const attemptsData = this.getStorageItem('local', 'loginAttempts');
    if (!attemptsData) return;

    const { count, timestamp } = attemptsData;
    const isWithinWindow = Date.now() - timestamp < this.config.auth.loginAttemptWindow;

    if (isWithinWindow) {
      this.loginAttempts.set(count);
      if (count >= this.config.auth.maxLoginAttempts) {
        this.isRateLimited.set(true);
      }
    } else {
      this.resetLoginAttempts();
    }
  }

  private incrementLoginAttempts(): void {
    const newCount = this.loginAttempts() + 1;
    this.loginAttempts.set(newCount);

    const attemptsData = { count: newCount, timestamp: Date.now() };
    this.setStorageItem('local', 'loginAttempts', attemptsData);

    if (newCount >= this.config.auth.maxLoginAttempts) {
      this.handleRateLimitReached();
    }
  }

  private handleRateLimitReached(): void {
    this.isRateLimited.set(true);
    this.alertService.error(
      this.languageService.t()('auth.tooManyAttempts'),
      this.languageService.t()('auth.pleaseWait15Minutes')
    );
  }

  private resetLoginAttempts(): void {
    this.loginAttempts.set(0);
    this.isRateLimited.set(false);
    localStorage.removeItem('loginAttempts');
  }

  // Focus/blur handlers for card animation
  onFocus(event: FocusEvent): void {
    this.isCardActive.set(true);
  }

  onBlur(event: FocusEvent): void {
    setTimeout(() => {
      if (!this.isAnyFormFieldFocused()) {
        this.isCardActive.set(false);
      }
    }, 100);
  }

  private isAnyFormFieldFocused(): boolean {
    const activeElement = document.activeElement;
    return activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
  }

  // Storage helpers
  private setStorageItem(type: 'local' | 'session', key: string, value: any): void {
    try {
      const storage = type === 'local' ? localStorage : sessionStorage;
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${type} storage item:`, error);
    }
  }

  private getStorageItem(type: 'local' | 'session', key: string): any {
    try {
      const storage = type === 'local' ? localStorage : sessionStorage;
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Failed to load ${type} storage item:`, error);
      return null;
    }
  }
}
