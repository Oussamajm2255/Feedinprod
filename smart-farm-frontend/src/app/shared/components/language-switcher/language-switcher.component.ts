import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { LanguageService, Language } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <button 
      class="language-switcher-button"
      [matMenuTriggerFor]="languageMenu"
      [matTooltip]="languageService.t()('language.switch')"
      [class.rtl]="languageService.isRTL()"
      [style.border]="getActionButtonBorder()">
      <img [src]="'assets/images/icons/language.png'" 
           alt="Language" 
           class="custom-icon" 
           [style.filter]="getIconFilter('language.png')"
           (error)="onIconError($event, 'language')" />
      <mat-icon class="fallback-icon" style="display: none;">language</mat-icon>
    </button>

    <mat-menu #languageMenu="matMenu" class="language-menu">
      <div class="menu-header">
        <div class="menu-title">
          <mat-icon>language</mat-icon>
          <span>{{ languageService.t()('language.select') }}</span>
        </div>
      </div>
      
      <mat-divider></mat-divider>
      
      <div class="language-list">
        <button 
          class="language-item"
          *ngFor="let language of availableLanguages"
          (click)="switchLanguage(language.code)"
          [class.selected]="language.code === currentLanguageCode"
          [class.rtl]="language.direction === 'rtl'">
          <div class="language-content">
            <div class="language-info">
              <div class="flag-container">
                <img [src]="getFlagUrl(language.code)" 
                     [alt]="language.name + ' flag'"
                     class="language-flag"
                     (error)="onFlagError($event, language.code)" />
                <div class="flag-fallback" [style.display]="'none'">
                  {{ language.flag }}
                </div>
              </div>
              <div class="language-details">
                <div class="language-primary">
                  <span class="language-name">{{ language.nativeName }}</span>
                  <span class="language-english">{{ language.name }}</span>
                </div>
                <div class="language-secondary">
                  <span class="language-code">{{ language.code.toUpperCase() }}</span>
                  <span class="language-direction">{{ language.direction.toUpperCase() }}</span>
                </div>
              </div>
            </div>
            <div class="language-status">
              <div class="status-indicator" *ngIf="language.code === currentLanguageCode">
                <mat-icon class="check-icon">check_circle</mat-icon>
                <span class="status-text">Active</span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </mat-menu>
  `,
  styles: [`
    .language-switcher-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 12px;
      background: transparent;
      color: var(--header-text-secondary, rgba(255, 255, 255, 0.9));
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .language-switcher-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--nav-item-hover, rgba(255, 255, 255, 0.1));
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 12px;
    }

    .language-switcher-button:hover::before {
      opacity: 1;
    }

    .language-switcher-button:hover {
      color: var(--header-text, #ffffff);
      transform: translateY(-1px);
    }

    .language-switcher-button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      position: relative;
      z-index: 1;
    }

    .language-switcher-button .custom-icon {
      width: 20px;
      height: 20px;
      object-fit: contain;
      position: relative;
      z-index: 1;
      transition: all 0.3s ease;
    }

    .language-switcher-button .fallback-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      position: relative;
      z-index: 1;
    }

    .language-switcher-button.rtl {
      transform: scaleX(-1);
    }

    .language-menu {
      background: var(--user-menu-bg, #ffffff);
      border-radius: 16px;
      box-shadow: var(--user-menu-shadow, 0 8px 32px rgba(0, 0, 0, 0.12));
      border: 1px solid var(--header-border, rgba(0, 0, 0, 0.1));
      padding: 8px;
      min-width: 320px;
      max-width: 400px;
      margin-top: 8px;
    }

    .menu-header {
      padding: 16px;
      border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
      margin-bottom: 8px;
    }

    .menu-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--header-text, #2c3e50);
      font-weight: 600;
      font-size: 16px;
    }

    .menu-title mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--header-text-secondary, #7f8c8d);
    }

    .language-list {
      padding: 8px 0;
    }

    .language-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 16px;
      border: none;
      background: transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin: 2px 0;
      position: relative;
      overflow: hidden;
    }

    .language-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--nav-item-hover, rgba(0, 0, 0, 0.05));
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 12px;
    }

    .language-item:hover::before {
      opacity: 1;
    }

    .language-item:hover {
      transform: translateX(4px);
    }

    .language-item.selected {
      background: var(--nav-item-active, rgba(16, 185, 129, 0.15));
      color: var(--header-text, #2c3e50);
      border: 1px solid var(--primary-green, rgba(16, 185, 129, 0.3));
    }

    .language-item.selected::before {
      opacity: 0;
    }

    .language-item.rtl {
      direction: rtl;
      text-align: right;
    }

    .language-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      position: relative;
      z-index: 1;
    }

    .language-info {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .flag-container {
      position: relative;
      width: 40px;
      height: 30px;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    }

    .language-flag {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .flag-fallback {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      background: var(--nav-item-active, rgba(46, 125, 50, 0.1));
      border-radius: 6px;
    }

    .language-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    .language-primary {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .language-name {
      font-weight: 600;
      font-size: 16px;
      color: var(--header-text, #2c3e50);
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .language-english {
      font-weight: 400;
      font-size: 13px;
      color: var(--header-text-secondary, #7f8c8d);
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .language-secondary {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .language-code {
      font-size: 11px;
      color: var(--header-text-secondary, #7f8c8d);
      font-weight: 500;
      line-height: 1;
      background: var(--nav-item-hover, rgba(0, 0, 0, 0.05));
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .language-direction {
      font-size: 10px;
      color: var(--header-text-secondary, #7f8c8d);
      font-weight: 400;
      line-height: 1;
      opacity: 0.7;
    }

    .language-status {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--nav-item-active, rgba(16, 185, 129, 0.15));
      padding: 4px 8px;
      border-radius: 12px;
      border: 1px solid var(--primary-green, rgba(16, 185, 129, 0.3));
    }

    .check-icon {
      color: var(--primary-green, #10b981);
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .status-text {
      font-size: 11px;
      color: var(--primary-green, #10b981);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* RTL specific styles */
    .rtl .language-item {
      text-align: right;
    }

    .rtl .language-details {
      text-align: right;
    }

    /* Dark theme adjustments */
    .dark-theme .language-menu {
      background: var(--user-menu-bg, #1e293b);
      box-shadow: var(--user-menu-shadow, 0 8px 32px rgba(0, 0, 0, 0.4));
      border-color: var(--user-menu-border, rgba(255, 255, 255, 0.1));
    }

    body.dark-theme .language-menu .menu-header {
      border-bottom-color: var(--divider-color, rgba(255, 255, 255, 0.1));
    }

    .dark-theme .menu-title {
      color: var(--header-text, #f1f5f9);
    }

    .dark-theme .menu-title mat-icon {
      color: var(--header-text-secondary, #cbd5e1);
    }

    .dark-theme .language-name {
      color: var(--header-text, #f1f5f9);
    }

    .dark-theme .language-english {
      color: var(--header-text-secondary, #cbd5e1);
    }

    .dark-theme .language-code {
      color: var(--header-text-secondary, rgba(255, 255, 255, 0.8));
      background: var(--nav-item-hover, rgba(255, 255, 255, 0.08));
    }

    .dark-theme .language-item.selected {
      background: var(--nav-item-active, rgba(16, 185, 129, 0.2));
      border-color: var(--primary-green, rgba(16, 185, 129, 0.4));
    }

    .dark-theme .status-indicator {
      background: var(--nav-item-active, rgba(16, 185, 129, 0.2));
      border-color: var(--primary-green, rgba(16, 185, 129, 0.4));
    }

    /* Scrollbar in language menu */
    .language-menu {
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: var(--light-bg, #f1f1f1);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--border-color, #cbd5e1);
        border-radius: 3px;

        &:hover {
          background: var(--text-secondary, #94a3b8);
        }
      }
    }

    .dark-theme .language-menu {
      &::-webkit-scrollbar-track {
        background: var(--card-bg, #1e293b);
      }

      &::-webkit-scrollbar-thumb {
        background: var(--border-color, #475569);
      }
    }

    /* Responsive Design */
    @media (max-width: 480px) {
      .language-menu {
        min-width: 280px;
        max-width: 320px;
      }
      
      .language-item {
        padding: 12px;
      }
      
      .language-info {
        gap: 12px;
      }
      
      .flag-container {
        width: 32px;
        height: 24px;
      }
      
      .language-name {
        font-size: 14px;
      }
      
      .language-english {
        font-size: 12px;
      }
      
      .status-indicator {
        padding: 3px 6px;
      }
      
      .status-text {
        font-size: 10px;
      }
    }

    @media (max-width: 360px) {
      .language-menu {
        min-width: 260px;
        max-width: 280px;
      }
      
      .language-item {
        padding: 10px;
      }
      
      .language-info {
        gap: 10px;
      }
      
      .flag-container {
        width: 28px;
        height: 21px;
      }
      
      .language-name {
        font-size: 13px;
      }
      
      .language-english {
        font-size: 11px;
      }
      
      .language-code {
        font-size: 10px;
        padding: 1px 4px;
      }
      
      .status-indicator {
        padding: 2px 4px;
      }
      
      .status-text {
        display: none;
      }
    }
  `]
})
export class LanguageSwitcherComponent {
  public languageService = inject(LanguageService);
  
  public availableLanguages: Language[] = [];
  public currentLanguageCode: string = '';

  constructor() {
    this.availableLanguages = this.languageService.getAvailableLanguages();
    this.currentLanguageCode = this.languageService.getCurrentLanguageCode();
    
    // Subscribe to language changes
    this.languageService.getTranslations().subscribe(() => {
      this.currentLanguageCode = this.languageService.getCurrentLanguageCode();
    });
  }

  public switchLanguage(languageCode: string): void {
    this.languageService.setLanguage(languageCode);
  }

  public getFlagUrl(languageCode: string): string {
    const flagMap: { [key: string]: string } = {
      'en-US': 'https://flagcdn.com/w40/us.png',
      'fr-FR': 'https://flagcdn.com/w40/fr.png',
      'ar-TN': 'https://flagcdn.com/w40/tn.png'
    };
    return flagMap[languageCode] || `https://flagcdn.com/w40/${languageCode.split('-')[1].toLowerCase()}.png`;
  }

  public onFlagError(event: Event, languageCode: string): void {
    const target = event.target as HTMLImageElement;
    const fallback = target.nextElementSibling as HTMLElement;
    
    if (target && fallback) {
      target.style.display = 'none';
      fallback.style.display = 'flex';
    }
  }

  // Dynamic icon filter based on theme
  getIconFilter(iconName: string): string {
    // Check if body has dark theme class
    const isDarkTheme = document.body.classList.contains('dark-theme');
    
    if (isDarkTheme) {
      // Dark mode: invert colors to make black icons white
      return 'invert(1)';
    }
    
    // Light mode: show original black icons
    return 'none';
  }

  // Dynamic border for action buttons
  getActionButtonBorder(): string {
    // Check if body has dark theme class
    const isDarkTheme = document.body.classList.contains('dark-theme');
    
    if (isDarkTheme) {
      return '0.5px solid rgba(255, 255, 255, 0.15)';
    }
    
    return '0.5px solid rgba(0, 0, 0, 0.2)';
  }

  // Handle custom icon error - show fallback Material icon
  onIconError(event: Event, fallbackIconName: string): void {
    const target = event.target as HTMLImageElement;
    const fallbackIcon = target.nextElementSibling as HTMLElement;
    
    if (target && fallbackIcon) {
      target.style.display = 'none';
      fallbackIcon.style.display = 'flex';
      fallbackIcon.textContent = fallbackIconName;
    }
  }
}
