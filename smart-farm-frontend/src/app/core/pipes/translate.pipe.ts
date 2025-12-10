import { Pipe, PipeTransform, inject, effect, signal } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Required for reactive translations
})
export class TranslatePipe implements PipeTransform {
  private languageService = inject(LanguageService);
  private translations = this.languageService.translations;
  private currentLanguage = this.languageService.currentLanguage;

  // Internal signal to force re-evaluation when language changes
  private translationTrigger = signal(0);

  constructor() {
    // Enhanced reactivity effect to ensure pipe updates when language changes
    effect(() => {
      // Access both signals to establish dependency
      const translations = this.translations();
      const language = this.currentLanguage();

      // Trigger re-evaluation by updating the internal signal
      this.translationTrigger.set(this.translationTrigger() + 1);
    });
  }

  transform(key: string, params?: { [key: string]: any }): string {
    // Access the trigger signal to ensure reactivity
    this.translationTrigger();

    return this.languageService.translate(key, params);
  }
}




