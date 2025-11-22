import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

export interface Translation {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'smart-farm-language';
  private readonly DEFAULT_LANGUAGE = 'ar-TN';

  private currentLanguageSubject = new BehaviorSubject<string>(this.DEFAULT_LANGUAGE);
  private translationsSubject = new BehaviorSubject<Translation>({});

  // Enhanced caching system
  private translationCache = new Map<string, Translation>();
  private warnedKeys = new Set<string>();
  private englishFallback: Translation = {};

  // Signals for reactive programming
  public currentLanguage = signal<string>(this.DEFAULT_LANGUAGE);
  public translations = signal<Translation>({});
  public isLoading = signal<boolean>(false);
  public isTransitioning = signal<boolean>(false);

  // Available languages
  public readonly languages: Language[] = [
    {
      code: 'ar-TN',
      name: 'Tunisian Arabic',
      nativeName: 'العربية التونسية',
      flag: '🇹🇳',
      direction: 'rtl'
    },
    {
      code: 'fr-FR',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      direction: 'ltr'
    },
    {
      code: 'en-US',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      direction: 'ltr'
    }
  ];

  constructor(private http: HttpClient) {
    this.initializeLanguage();
    this.loadEnglishFallback();

    // Enhanced reactivity effect for automatic UI updates
    effect(() => {
      const currentLang = this.currentLanguage();
      const translations = this.translations();

      // Trigger reactive updates when language or translations change
      if (translations && Object.keys(translations).length > 0) {
        // Force change detection for all components using translations
        this.translationsSubject.next(translations);
      }
    });
  }

  private initializeLanguage(): void {
    const savedLanguage = localStorage.getItem(this.STORAGE_KEY);
    const language = savedLanguage || this.DEFAULT_LANGUAGE;
    this.setLanguage(language);
  }

  private loadEnglishFallback(): void {
    // Pre-load English fallback for better performance
    this.http.get<Translation>('/assets/i18n/en-US.json').pipe(
      catchError(() => of({}))
    ).subscribe(translations => {
      this.englishFallback = translations;
    });
  }

  public setLanguage(languageCode: string): void {
    if (!this.languages.find(lang => lang.code === languageCode)) {
      console.warn(`Language ${languageCode} not supported`);
      return;
    }

    // Check if translations are already cached
    if (this.translationCache.has(languageCode)) {
      const cachedTranslations = this.translationCache.get(languageCode)!;
      this.applyLanguageChange(languageCode, cachedTranslations);
      return;
    }

    this.isLoading.set(true);
    this.isTransitioning.set(true);

    this.loadTranslations(languageCode).subscribe({
      next: (translations) => {
        // Cache the translations
        this.translationCache.set(languageCode, translations);
        this.applyLanguageChange(languageCode, translations);
      },
      error: (error) => {
        console.error('Error loading translations:', error);
        this.isLoading.set(false);
        this.isTransitioning.set(false);
      }
    });
  }

  private applyLanguageChange(languageCode: string, translations: Translation): void {
    this.currentLanguageSubject.next(languageCode);
    this.currentLanguage.set(languageCode);
    this.translationsSubject.next(translations);
    this.translations.set(translations);
    localStorage.setItem(this.STORAGE_KEY, languageCode);

    // Update document attributes with smooth transition
    this.updateDocumentAttributes(languageCode);

    this.isLoading.set(false);

    // Reset transition state after animation
    setTimeout(() => {
      this.isTransitioning.set(false);
    }, 300);
  }

  private loadTranslations(languageCode: string): Observable<Translation> {
    return this.http.get<Translation>(`/assets/i18n/${languageCode}.json`).pipe(
      catchError((error) => {
        console.error(`Failed to load translations for ${languageCode}:`, error);
        // Fallback to English if translation file not found
        if (languageCode !== 'en-US') {
          return this.http.get<Translation>('/assets/i18n/en-US.json');
        }
        return of({});
      })
    );
  }

  private updateDocumentAttributes(languageCode: string): void {
    const language = this.languages.find(lang => lang.code === languageCode);
    if (language) {
      // Add transition class for smooth direction change
      document.body.classList.add('language-transitioning');

      document.documentElement.lang = languageCode;
      document.documentElement.dir = language.direction;

      // Update body class for RTL/LTR styling
      document.body.classList.remove('rtl', 'ltr');
      document.body.classList.add(language.direction);

      // Remove transition class after animation
      setTimeout(() => {
        document.body.classList.remove('language-transitioning');
      }, 300);
    }
  }

  public getCurrentLanguage(): Language {
    return this.languages.find(lang => lang.code === this.currentLanguage()) || this.languages[0];
  }

  public getCurrentLanguageCode(): string {
    return this.currentLanguage();
  }

  public getTranslations(): Observable<Translation> {
    return this.translationsSubject.asObservable();
  }

  public translate(key: string, params?: { [key: string]: any }): string {
    const translations = this.translations();

    // If translations are not loaded yet, return the key
    if (!translations || Object.keys(translations).length === 0) {
      this.warnOnce(`Translations not loaded yet for key: ${key}`);
      return key;
    }

    const keys = key.split('.');
    let value: any = translations;

    // Navigate through nested object keys
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Try English fallback before giving up
        const fallbackValue = this.getFallbackTranslation(key);
        if (fallbackValue !== null) {
          this.warnOnce(`Translation key not found in ${this.currentLanguage()}, using English fallback: ${key}`);
          return this.interpolateString(fallbackValue, params);
        }

        this.warnOnce(`Translation key not found: ${key}`);
        return key; // Return the key if translation not found
      }
    }

    if (typeof value !== 'string') {
      this.warnOnce(`Translation value is not a string for key: ${key}`);
      return key;
    }

    // Replace parameters in translation string
    if (params) {
      return this.interpolateString(value, params);
    }

    return value;
  }

  private getFallbackTranslation(key: string): string | null {
    if (!this.englishFallback || Object.keys(this.englishFallback).length === 0) {
      return null;
    }

    const keys = key.split('.');
    let value: any = this.englishFallback;

    // Navigate through nested object keys
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return typeof value === 'string' ? value : null;
  }

  private warnOnce(message: string): void {
    if (!this.warnedKeys.has(message)) {
      console.warn(message);
      this.warnedKeys.add(message);
    }
  }

  private interpolateString(str: string, params?: { [key: string]: any }): string {
    if (!params) return str;
    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  // Computed signal for easy access to translations
  public t = computed(() => {
    const translations = this.translations();
    const currentLang = this.currentLanguage();

    return (key: string, params?: { [key: string]: any }) => {
      return this.translate(key, params);
    };
  });

  // Method to get all available languages
  public getAvailableLanguages(): Language[] {
    return [...this.languages];
  }

  // Method to check if current language is RTL
  public isRTL(): boolean {
    return this.getCurrentLanguage().direction === 'rtl';
  }

  // Method to get current language direction
  public getDirection(): 'ltr' | 'rtl' {
    return this.getCurrentLanguage().direction;
  }

  // Enhanced developer experience methods
  public missingTranslations(): string[] {
    const missingKeys: string[] = [];
    const currentTranslations = this.translations();
    const englishKeys = this.getAllKeys(this.englishFallback);

    for (const key of englishKeys) {
      if (!this.hasTranslationKey(currentTranslations, key)) {
        missingKeys.push(key);
      }
    }

    return missingKeys;
  }

  private getAllKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          keys.push(...this.getAllKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
    }

    return keys;
  }

  private hasTranslationKey(translations: any, key: string): boolean {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return false;
      }
    }

    return typeof value === 'string';
  }

  // Method to clear warning cache (useful for development)
  public clearWarningCache(): void {
    this.warnedKeys.clear();
  }

  // Method to get cached languages
  public getCachedLanguages(): string[] {
    return Array.from(this.translationCache.keys());
  }
}
