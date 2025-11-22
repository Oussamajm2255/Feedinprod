import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { LanguageService } from '../services/language.service';
import { Subscription } from 'rxjs';

/**
 * Translation Pipe - TerraFlow Smart Farm
 * 
 * Usage:
 *   {{ 'CROPS.LOADING' | translate }}
 *   {{ 'CROPS.WELCOME' | translate:{ name: userName } }}
 * 
 * Features:
 * - Reactive to language changes
 * - Parameter interpolation support
 * - Fallback to English if key not found
 * - Performance optimized with impure pipe
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Impure to react to language changes
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private languageService = inject(LanguageService);
  private cdr = inject(ChangeDetectorRef);
  private subscription?: Subscription;
  private lastKey: string = '';
  private lastParams?: { [key: string]: any };
  private lastValue: string = '';

  constructor() {
    // Subscribe to translation changes for reactivity
    this.subscription = this.languageService.getTranslations().subscribe(() => {
      // Force change detection when translations update
      this.cdr.markForCheck();
    });
  }

  transform(key: string, params?: { [key: string]: any }): string {
    if (!key) return '';

    // Performance optimization: return cached value if key and params haven't changed
    if (key === this.lastKey && JSON.stringify(params) === JSON.stringify(this.lastParams)) {
      return this.lastValue;
    }

    this.lastKey = key;
    this.lastParams = params;
    this.lastValue = this.languageService.translate(key, params);

    return this.lastValue;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
