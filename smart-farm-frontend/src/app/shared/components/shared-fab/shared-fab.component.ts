import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService } from '../../../core/services/theme.service';

interface FabContext {
  icon: string;
  tooltip: string;
  action: () => void;
  color: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-shared-fab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  animations: [
    // FAB appearance animation
    trigger('fabAppear', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'scale(0.8) rotate(180deg)'
        }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({
          opacity: 1,
          transform: 'scale(1) rotate(0deg)'
        }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({
          opacity: 0,
          transform: 'scale(0.8) rotate(-180deg)'
        }))
      ])
    ]),
    // Theme transition animation
    trigger('themeTransition', [
      transition('* => *', [
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ]),
    // Icon rotation animation
    trigger('iconRotate', [
      state('default', style({ transform: 'rotate(0deg)' })),
      state('rotated', style({ transform: 'rotate(180deg)' })),
      transition('default <=> rotated', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ],
  template: `
    <div class="shared-fab-container"
         [@fabAppear]
         [@themeTransition]
         [class.dark-theme]="themeService.currentTheme === 'dark'">

      <!-- Main FAB Button -->
      <button mat-fab
              [color]="fabContext().color"
              [matTooltip]="fabContext().tooltip"
              [matTooltipPosition]="'left'"
              [matTooltipShowDelay]="500"
              (click)="fabContext().action()"
              class="main-fab"
              [class.pulsing]="isPulsing()"
              [@iconRotate]="isRotated() ? 'rotated' : 'default'">
        <mat-icon>{{ fabContext().icon }}</mat-icon>
      </button>

      <!-- Quick Actions Menu (Optional) -->
      @if (showQuickActions()) {
        <div class="quick-actions">
          @for (action of quickActions(); track action.icon + action.tooltip; let i = $index) {
            <button mat-mini-fab
                    [color]="action.color"
                    [matTooltip]="action.tooltip"
                    [matTooltipPosition]="'left'"
                    (click)="action.action()"
                    class="quick-action-btn"
                    [style.animation-delay]="i * 100 + 'ms'">
              <mat-icon>{{ action.icon }}</mat-icon>
            </button>
          }
        </div>
      }

      <!-- Context Indicator -->
      @if (showContextIndicator()) {
        <div class="context-indicator">
          <div class="indicator-dot"></div>
          <span class="indicator-text">{{ getContextText() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .shared-fab-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .main-fab {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, var(--primary-green), #059669);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
      border: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);

        &::before {
          opacity: 1;
        }
      }

      &:active {
        transform: scale(0.95);
      }

      &.pulsing {
        animation: pulseInfinite 1000ms ease-in-out infinite;
      }

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }

    @keyframes pulseInfinite {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
    }

    .quick-action-btn {
      width: 40px;
      height: 40px;
      background: var(--glass-bg, rgba(255, 255, 255, 0.9));
      backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.4));
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: scale(1.1) translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--text-primary);
      }
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .context-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--glass-bg, rgba(255, 255, 255, 0.9));
      backdrop-filter: blur(12px);
      border-radius: 24px;
      border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.4));
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      animation: fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      .indicator-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--primary-green);
        animation: pulseDot 2s ease-in-out infinite;
      }

      .indicator-text {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
      }
    }

    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes pulseDot {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.2);
      }
    }

    // Dark Theme Support
    .shared-fab-container.dark-theme {
      .main-fab {
        background: linear-gradient(135deg, #059669, #047857);
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
      }

      .quick-action-btn {
        background: var(--glass-bg, rgba(30, 41, 59, 0.9));
        border-color: var(--glass-border, rgba(100, 116, 139, 0.3));
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

        mat-icon {
          color: var(--text-primary);
        }
      }

      .context-indicator {
        background: var(--glass-bg, rgba(30, 41, 59, 0.9));
        border-color: var(--glass-border, rgba(100, 116, 139, 0.3));
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

        .indicator-text {
          color: var(--text-primary);
        }
      }
    }

    // Responsive Design
    @media (max-width: 768px) {
      .shared-fab-container {
        bottom: 1rem;
        right: 1rem;
      }

      .main-fab {
        width: 48px;
        height: 48px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .quick-action-btn {
        width: 36px;
        height: 36px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .context-indicator {
        padding: 0.375rem 0.75rem;

        .indicator-text {
          font-size: 0.7rem;
        }
      }
    }

    @media (max-width: 480px) {
      .shared-fab-container {
        bottom: 0.75rem;
        right: 0.75rem;
      }

      .main-fab {
        width: 44px;
        height: 44px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .quick-actions {
        gap: 0.5rem;
      }

      .quick-action-btn {
        width: 32px;
        height: 32px;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }
    }

    // Accessibility
    @media (prefers-reduced-motion: reduce) {
      .main-fab,
      .quick-action-btn,
      .context-indicator {
        transition: none;
        animation: none;
      }
    }

    // High contrast mode
    @media (prefers-contrast: high) {
      .main-fab {
        border: 2px solid white;
      }

      .quick-action-btn {
        border: 2px solid var(--text-primary);
      }
    }
  `]
})
export class SharedFabComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  public languageService = inject(LanguageService);
  public themeService = inject(ThemeService);
  private routerSubscription: any;

  // Signals
  currentRoute = signal<string>('');
  isRotated = signal(false);
  isPulsing = signal(false);

  // Computed properties
  fabContext = computed((): FabContext => {
    const route = this.currentRoute();

    // Define context based on current route
    if (route.includes('/devices')) {
      return {
        icon: 'add',
        tooltip: this.languageService.t()('fab.addDevice'),
        action: () => this.addDevice(),
        color: 'primary'
      };
    }

    if (route.includes('/users')) {
      return {
        icon: 'person_add',
        tooltip: this.languageService.t()('fab.addUser'),
        action: () => this.addUser(),
        color: 'primary'
      };
    }

    if (route.includes('/settings')) {
      return {
        icon: 'settings',
        tooltip: this.languageService.t()('fab.quickSettings'),
        action: () => this.openQuickSettings(),
        color: 'accent'
      };
    }

    if (route.includes('/analytics')) {
      return {
        icon: 'download',
        tooltip: this.languageService.t()('fab.exportData'),
        action: () => this.exportData(),
        color: 'primary'
      };
    }

    if (route.includes('/manual-control')) {
      return {
        icon: 'emergency',
        tooltip: this.languageService.t()('fab.emergencyStop'),
        action: () => this.emergencyStop(),
        color: 'warn'
      };
    }

    if (route.includes('/recent-actions')) {
      return {
        icon: 'refresh',
        tooltip: this.languageService.t()('fab.refreshActions'),
        action: () => this.refreshActions(),
        color: 'primary'
      };
    }

    // Default context
    return {
      icon: 'add',
      tooltip: this.languageService.t()('fab.addItem'),
      action: () => this.defaultAction(),
      color: 'primary'
    };
  });

  quickActions = computed(() => {
    const route = this.currentRoute();
    const actions: FabContext[] = [];

    // Add context-specific quick actions
    if (route.includes('/manual-control')) {
      actions.push(
        {
          icon: 'power_settings_new',
          tooltip: this.languageService.t()('fab.turnAllOn'),
          action: () => this.turnAllDevicesOn(),
          color: 'primary'
        },
        {
          icon: 'power_off',
          tooltip: this.languageService.t()('fab.turnAllOff'),
          action: () => this.turnAllDevicesOff(),
          color: 'warn'
        }
      );
    }

    if (route.includes('/recent-actions')) {
      actions.push(
        {
          icon: 'filter_list',
          tooltip: this.languageService.t()('fab.filterActions'),
          action: () => this.openActionFilters(),
          color: 'accent'
        },
        {
          icon: 'download',
          tooltip: this.languageService.t()('fab.exportActions'),
          action: () => this.exportActions(),
          color: 'primary'
        }
      );
    }

    return actions;
  });

  showQuickActions = computed(() => {
    return this.quickActions().length > 0;
  });

  showContextIndicator = computed(() => {
    const route = this.currentRoute();
    return route.includes('/manual-control') || route.includes('/recent-actions');
  });

  ngOnInit(): void {
    // Subscribe to route changes
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute.set(event.url);
        this.updateFabState();
      });

    // Initialize with current route
    this.currentRoute.set(this.router.url);
    this.updateFabState();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updateFabState(): void {
    const route = this.currentRoute();

    // Set rotation state based on route
    this.isRotated.set(route.includes('/settings') || route.includes('/analytics'));

    // Set pulsing state for urgent actions
    this.isPulsing.set(route.includes('/manual-control'));
  }

  getContextText(): string {
    const route = this.currentRoute();

    if (route.includes('/manual-control')) {
      return this.languageService.t()('fab.controlMode');
    }

    if (route.includes('/recent-actions')) {
      return this.languageService.t()('fab.monitoringMode');
    }

    return '';
  }

  // Action methods
  addDevice(): void {
    console.log('Adding new device...');
    // Implement add device logic
  }

  addUser(): void {
    console.log('Adding new user...');
    // Implement add user logic
  }

  openQuickSettings(): void {
    console.log('Opening quick settings...');
    // Implement quick settings logic
  }

  exportData(): void {
    console.log('Exporting data...');
    // Implement export data logic
  }

  emergencyStop(): void {
    console.log('Emergency stop activated!');
    // Implement emergency stop logic
    this.isPulsing.set(true);
    setTimeout(() => this.isPulsing.set(false), 3000);
  }

  refreshActions(): void {
    console.log('Refreshing actions...');
    // Implement refresh actions logic
  }

  defaultAction(): void {
    console.log('Default action triggered...');
    // Implement default action logic
  }

  turnAllDevicesOn(): void {
    console.log('Turning all devices on...');
    // Implement turn all devices on logic
  }

  turnAllDevicesOff(): void {
    console.log('Turning all devices off...');
    // Implement turn all devices off logic
  }

  openActionFilters(): void {
    console.log('Opening action filters...');
    // Implement open action filters logic
  }

  exportActions(): void {
    console.log('Exporting actions...');
    // Implement export actions logic
  }

  trackByActionId(index: number, action: FabContext): string {
    return action.icon + action.tooltip;
  }
}
