import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from './core/services/auth.service';
import { LanguageService } from './core/services/language.service';
import { ThemeService } from './core/services/theme.service';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { SmartLoadingScreenSimpleComponent } from './shared/components/smart-loading-screen/smart-loading-screen-simple.component';
import { AlertsComponent } from './shared/components/alerts/alerts.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent, FooterComponent, SmartLoadingScreenSimpleComponent, AlertsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private languageService = inject(LanguageService);
  private themeService = inject(ThemeService);

  isAuthenticated = this.authService.isAuthenticated;

  // Loading screen control
  isLoading = true;

  async ngOnInit() {
    // Always show loading screen first (even if already authenticated)
    this.isLoading = true;

    // DO NOT initialize auth here - let guards handle it
    // authGuard will call initAuth() on protected routes
    // guestGuard will NOT call initAuth() on /login

    // Initialize theme service (this will apply the saved theme)
    // The theme service constructor already handles initialization

    // Show loading screen for at least 4.5 seconds to see the full animation cycle
    // (1 full SVG drawing cycle = 3s, plus time for particles and effects)
    setTimeout(() => {
      this.isLoading = false;
    }, 4500); // 4.5 seconds to see complete animation with all effects
  }
}
