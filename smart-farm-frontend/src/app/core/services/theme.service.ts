import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  private readonly THEME_KEY = 'smart-farm-theme';
  private readonly TRANSITION_DURATION = 400; // 400ms smooth transition
  private themeSubject = new BehaviorSubject<Theme>(this.getInitialTheme());
  private systemPreferenceListener?: MediaQueryList;

  constructor() {
    this.applyTheme(this.currentTheme, false); // No transition on initial load
    this.setupSystemPreferenceListener();
  }

  ngOnDestroy(): void {
    if (this.systemPreferenceListener) {
      this.systemPreferenceListener.removeEventListener('change', this.handleSystemPreferenceChange);
    }
  }

  get currentTheme(): Theme {
    return this.themeSubject.value;
  }

  get theme$(): Observable<Theme> {
    return this.themeSubject.asObservable();
  }

  private getInitialTheme(): Theme {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }

    // Check system preference with improved detection
    return this.detectSystemPreference();
  }

  private detectSystemPreference(): Theme {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light';
    }

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      return mediaQuery.matches ? 'dark' : 'light';
    } catch (error) {
      console.warn('System preference detection failed:', error);
      return 'light';
    }
  }

  private setupSystemPreferenceListener(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    try {
      this.systemPreferenceListener = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPreferenceListener.addEventListener('change', this.handleSystemPreferenceChange);
    } catch (error) {
      console.warn('System preference listener setup failed:', error);
    }
  }

  private handleSystemPreferenceChange = (event: MediaQueryListEvent): void => {
    // Only auto-switch if user hasn't manually set a preference
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (!savedTheme) {
      const newTheme = event.matches ? 'dark' : 'light';
      this.setTheme(newTheme, true);
    }
  };

  setTheme(theme: Theme, withTransition: boolean = true): void {
    if (this.currentTheme === theme) {
      return; // No change needed
    }

    this.themeSubject.next(theme);
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme, withTransition);
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme, true);
  }

  private applyTheme(theme: Theme, withTransition: boolean = true): void {
    const body = document.body;
    const root = document.documentElement;

    // Add transition class for smooth theme switching
    if (withTransition) {
      root.classList.add('theme-transitioning');
      // Remove transition class after animation completes
      setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, this.TRANSITION_DURATION);
    }

    // Remove existing theme classes
    body.classList.remove('light-theme', 'dark-theme');

    // Add new theme class
    body.classList.add(`${theme}-theme`);

    // Update CSS custom properties with transition support
    this.updateCSSVariables(theme);
  }

  private updateCSSVariables(theme: Theme): void {
    const root = document.documentElement;

    if (theme === 'light') {
      // Light theme colors - WCAG AA compliant
      root.style.setProperty('--header-bg', '#fafafa');
      root.style.setProperty('--header-bg-gradient', 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)');
      root.style.setProperty('--header-text', '#1f2937'); // High contrast
      root.style.setProperty('--header-text-secondary', '#4b5563'); // WCAG AA compliant
      root.style.setProperty('--header-border', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--header-shadow', '0 4px 20px rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--nav-item-hover', 'rgba(16, 185, 129, 0.08)');
      root.style.setProperty('--nav-item-active', 'rgba(16, 185, 129, 0.15)');
      root.style.setProperty('--user-menu-bg', '#ffffff');
      root.style.setProperty('--user-menu-shadow', '0 8px 32px rgba(0, 0, 0, 0.12)');
      root.style.setProperty('--user-menu-border', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--user-menu-item-hover', 'rgba(16, 185, 129, 0.08)');
      root.style.setProperty('--user-menu-item-active', 'rgba(16, 185, 129, 0.12)');
      root.style.setProperty('--text-primary', '#1f2937');
      root.style.setProperty('--text-secondary', '#6b7280');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--border-color', '#e5e7eb');
      root.style.setProperty('--divider-color', 'rgba(0, 0, 0, 0.08)');
    } else {
      // Dark theme colors - WCAG AA compliant
      root.style.setProperty('--header-bg', '#1e293b');
      root.style.setProperty('--header-bg-gradient', 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)');
      root.style.setProperty('--header-text', '#f1f5f9'); // High contrast
      root.style.setProperty('--header-text-secondary', '#cbd5e1'); // WCAG AA compliant
      root.style.setProperty('--header-border', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--header-shadow', '0 4px 20px rgba(0, 0, 0, 0.4)');
      root.style.setProperty('--nav-item-hover', 'rgba(16, 185, 129, 0.12)');
      root.style.setProperty('--nav-item-active', 'rgba(16, 185, 129, 0.2)');
      root.style.setProperty('--user-menu-bg', '#1e293b');
      root.style.setProperty('--user-menu-shadow', '0 8px 32px rgba(0, 0, 0, 0.5)');
      root.style.setProperty('--user-menu-border', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--user-menu-item-hover', 'rgba(16, 185, 129, 0.12)');
      root.style.setProperty('--user-menu-item-active', 'rgba(16, 185, 129, 0.18)');
      root.style.setProperty('--text-primary', '#f1f5f9');
      root.style.setProperty('--text-secondary', '#94a3b8');
      root.style.setProperty('--card-bg', '#1e293b');
      root.style.setProperty('--border-color', '#334155');
      root.style.setProperty('--divider-color', 'rgba(255, 255, 255, 0.1)');
    }
  }
}
