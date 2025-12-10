import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'smart-farm-theme';
  private themeSubject = new BehaviorSubject<Theme>(this.getInitialTheme());

  constructor() {
    this.applyTheme(this.currentTheme);
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

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // Default to light mode
    return 'light';
  }

  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private applyTheme(theme: Theme): void {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('light-theme', 'dark-theme');
    
    // Add new theme class
    body.classList.add(`${theme}-theme`);
    
    // Update CSS custom properties
    this.updateCSSVariables(theme);
  }

  private updateCSSVariables(theme: Theme): void {
    const root = document.documentElement;
    
    if (theme === 'light') {
      // Light theme colors
      root.style.setProperty('--header-bg', '#fafafa');
      root.style.setProperty('--header-bg-gradient', 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)');
      root.style.setProperty('--header-text', '#2c3e50');
      root.style.setProperty('--header-text-secondary', '#7f8c8d');
      root.style.setProperty('--header-border', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--header-shadow', '0 4px 20px rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--nav-item-hover', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--nav-item-active', 'rgba(46, 125, 50, 0.1)');
      root.style.setProperty('--user-menu-bg', '#ffffff');
      root.style.setProperty('--user-menu-shadow', '0 8px 32px rgba(0, 0, 0, 0.12)');
    } else {
      // Clean dark theme with sophisticated greys
      root.style.setProperty('--header-bg', '#1a1a1a');
      root.style.setProperty('--header-bg-gradient', 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)');
      root.style.setProperty('--header-text', '#ffffff');
      root.style.setProperty('--header-text-secondary', 'rgba(255, 255, 255, 0.8)');
      root.style.setProperty('--header-border', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--header-shadow', '0 4px 20px rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--nav-item-hover', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--nav-item-active', 'rgba(255, 255, 255, 0.15)');
      root.style.setProperty('--user-menu-bg', '#2d2d2d');
      root.style.setProperty('--user-menu-shadow', '0 8px 32px rgba(0, 0, 0, 0.4)');
    }
  }
}
