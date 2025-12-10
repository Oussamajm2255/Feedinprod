import { Component, inject, HostListener, signal, OnDestroy, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiService } from '../../../core/services/api.service';
import { ActionEventsService } from '../../../core/services/action-events.service';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService, Theme } from '../../../core/services/theme.service';
import { FarmManagementService } from '../../../core/services/farm-management.service';
import { CustomDropdownComponent, DropdownItem } from '../custom-dropdown/custom-dropdown.component';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { Farm } from '../../../core/models/farm.model';

// Navigation Item Interface
export interface NavItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  svgPath: string;
  priority: 'primary' | 'secondary';  // primary = show on mobile bottom nav
  translationKey: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    CustomDropdownComponent,
    LanguageSwitcherComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  public notificationService = inject(NotificationService);
  private actionEvents = inject(ActionEventsService);
  private api = inject(ApiService);
  public languageService = inject(LanguageService);
  public themeService = inject(ThemeService);
  private farmManagement = inject(FarmManagementService);
  private router = inject(Router);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;
  showMobileMenu = false;
  showFarmSelector = false;
  showMoreMenu = false;
  isMobile = signal(false);
  isTablet = signal(false);
  currentRoute = signal('');

  // Farm selector properties
  farmSearchQuery = '';
  filteredFarms: Farm[] = [];

  // Theme properties
  currentTheme$ = this.themeService.theme$;
  currentTheme = signal(this.themeService.currentTheme);

  // Farm management - computed from global service
  get farms() { return this.farmManagement.farms(); }
  get selectedFarm() { return this.farmManagement.selectedFarm(); }

  unreadCount: number = 0;

  // Store subscriptions for cleanup
  private subscriptions = new Subscription();
  private refreshInterval?: number;

  // Navigation Items (reusable for both desktop and mobile)
  navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
      svgPath: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
      priority: 'primary',
      translationKey: 'navigation.dashboard'
    },
    {
      id: 'devices',
      label: 'Devices',
      route: '/devices',
      icon: 'devices',
      svgPath: 'M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z',
      priority: 'primary',
      translationKey: 'navigation.devices'
    },
    {
      id: 'sensors',
      label: 'Sensors',
      route: '/sensors',
      icon: 'sensors',
      svgPath: 'M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
      priority: 'secondary',
      translationKey: 'navigation.sensors'
    },
    {
      id: 'readings',
      label: 'Live Readings',
      route: '/sensor-readings',
      icon: 'analytics',
      svgPath: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6.75',
      priority: 'secondary',
      translationKey: 'navigation.liveReadings'
    },
    {
      id: 'actions',
      label: 'Actions',
      route: '/actions',
      icon: 'bolt',
      svgPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
      priority: 'primary',
      translationKey: 'navigation.actions'
    },
    {
      id: 'crops',
      label: 'Crops',
      route: '/crops',
      icon: 'spa',
      svgPath: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
      priority: 'primary',
      translationKey: 'navigation.crops'
    }
  ];

  // Get all nav items for mobile bottom nav
  get primaryNavItems(): NavItem[] {
    return this.navItems; // All navigation items
  }

  // Get secondary nav items for tablet "More" menu
  get secondaryNavItems(): NavItem[] {
    return this.navItems.filter(item => item.priority === 'secondary');
  }

  // Computed signals for better performance
  private navBorder = computed(() =>
    this.currentTheme() === 'dark'
      ? '0.5px solid rgba(255, 255, 255, 0.15)'
      : '0.5px solid rgba(0, 0, 0, 0.2)'
  );

  private actionBorder = computed(() =>
    this.currentTheme() === 'dark'
      ? '0.5px solid rgba(255, 255, 255, 0.15)'
      : '0.5px solid rgba(0, 0, 0, 0.2)'
  );

  constructor() {
    // Start global action events polling
    this.actionEvents.start();

    // Refresh unread count from backend periodically
    this.refreshUnread();
    this.refreshInterval = window.setInterval(() => this.refreshUnread(), 15000);

    // Initialize websocket for live notifications
    this.notificationService.initSocket();

    // Subscribe to new notifications
    this.subscriptions.add(
      this.notificationService.newNotification$.subscribe((notification) => {
        console.log('🔔 [HEADER] New notification received:', notification);
        this.unreadCount = (this.unreadCount || 0) + 1;
        console.log('📊 [HEADER] Updated unreadCount to:', this.unreadCount);
      })
    );

    // Subscribe to theme changes
    this.subscriptions.add(
      this.themeService.theme$.subscribe(theme => {
        this.currentTheme.set(theme);
      })
    );

    // Initialize filtered farms
    this.filteredFarms = this.farms;

    // Detect initial screen size
    this.checkScreenSize();

    // Track route changes
    this.subscriptions.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          this.currentRoute.set(event.urlAfterRedirects || event.url);
        })
    );
  }

  ngOnInit(): void {
    // Set initial route
    this.currentRoute.set(this.router.url);
  }

  // Screen size detection
  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    const width = window.innerWidth;
    this.isMobile.set(width <= 768);
    this.isTablet.set(width > 768 && width <= 1024);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();

    // Clear interval
    if (this.refreshInterval) {
      window.clearInterval(this.refreshInterval);
    }

    // Restore body scroll
    document.body.style.overflow = '';
  }

  getUnreadBadge(): number {
    const live = this.notificationService.unreadSignal?.() ?? 0;
    const result = live || this.unreadCount || 0;
    console.log('🔔 [HEADER] getUnreadBadge - live:', live, 'unreadCount:', this.unreadCount, 'result:', result);
    return result;
  }

  // Debug method to test notifications
  testNotification() {
    console.log('🧪 [HEADER] Testing notification system');
    this.notificationService.testNotification();
  }
  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;

    // Prevent body scroll when mobile menu is open
    if (this.showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
    document.body.style.overflow = '';
  }

  // Close mobile menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const mobileMenu = target.closest('.mobile-menu');
    const mobileButton = target.closest('.mobile-menu-toggle');

    if (!mobileMenu && !mobileButton && this.showMobileMenu) {
      this.closeMobileMenu();
    }
  }


  // Prevent body scroll when component is destroyed with open menu
  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    document.body.style.overflow = '';
  }

  private async refreshUnread(): Promise<void> {
    try {
      const res = await this.api.getNotificationsUnreadCount().toPromise();
      const count = res?.count ?? 0;
      this.unreadCount = count;
      this.notificationService.setUnreadCountFromApi(count);
      if (count === 0) {
        this.notificationService.markAllRead();
      }
    } catch (error) {
      // Silently fail - optional: log to error tracking service
      if (error instanceof Error) {
        console.error('Failed to refresh unread count:', error.message);
      }
    }
  }

  logout(): void {
    this.closeMobileMenu();
    this.authService.logout();
  }

  // Get user initials for avatar
  getInitials(): string {
    const user = this.user();
    if (!user) return 'U';

    const firstName = user.first_name || '';
    const lastName = user.last_name || '';

    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }

    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return 'U';
  }

  // Navigate to full notifications page
  navigateToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  // Handle logo image error - show fallback icon
  onLogoError(event: Event): void {
    const target = event.target as HTMLImageElement;
    const fallbackIcon = target.nextElementSibling as HTMLElement;

    if (target && fallbackIcon) {
      target.style.display = 'none';
      fallbackIcon.style.display = 'flex';
    }
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

  // Theme methods
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  // Dynamic icon filter based on theme
  getIconFilter(iconName: string): string {
    const currentTheme = this.currentTheme();

    // Live readings icon always shows original colors
    if (iconName.includes('Live_readings')) {
      return 'none';
    }

    // Dark mode: invert icons to white
    if (currentTheme === 'dark') {
      return 'invert(1)';
    }

    // Light mode: show original black icons
    return 'none';
  }

  // Dynamic border for navigation container
  getNavContainerBorder(): string {
    return this.navBorder();
  }

  // Dynamic border for action buttons
  getActionButtonBorder(): string {
    return this.actionBorder();
  }

  // Custom dropdown data
  userDropdownSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          label: 'Profile',
          subtitle: 'Manage your account',
          icon: 'person',
          routerLink: '/profile'
        },
        {
          id: 'settings',
          label: 'Settings',
          subtitle: 'Preferences & configuration',
          icon: 'settings',
          routerLink: '/settings'
        }
      ]
    },
    {
      title: 'Session',
      items: [
        {
          id: 'logout',
          label: 'Logout',
          subtitle: 'Sign out of your account',
          icon: 'logout',
          action: () => this.logout()
        }
      ]
    }
  ];

  languageDropdownItems: DropdownItem[] = [
    {
      id: 'en-US',
      label: 'English',
      subtitle: 'English',
      flag: 'https://flagcdn.com/w40/us.png',
      badge: 'EN'
    },
    {
      id: 'fr-FR',
      label: 'Français',
      subtitle: 'French',
      flag: 'https://flagcdn.com/w40/fr.png',
      badge: 'FR'
    },
    {
      id: 'ar-TN',
      label: 'العربية',
      subtitle: 'Arabic',
      flag: 'https://flagcdn.com/w40/tn.png',
      badge: 'AR'
    }
  ];

  onUserItemSelected(item: DropdownItem): void {
    if (item.action) {
      item.action();
    }
    // Router navigation is handled by routerLink in template
  }

  onLanguageItemSelected(item: DropdownItem): void {
    this.languageService.setLanguage(item.id);
  }

  getSelectedLanguageId(): string {
    return this.languageService.getCurrentLanguageCode();
  }

  // Farm Selector Methods
  toggleFarmSelector(): void {
    this.showFarmSelector = !this.showFarmSelector;
    if (this.showFarmSelector) {
      document.body.style.overflow = 'hidden';
      this.filteredFarms = this.farms;
      this.farmSearchQuery = '';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeFarmSelector(): void {
    this.showFarmSelector = false;
    document.body.style.overflow = '';
    this.farmSearchQuery = '';
  }

  closeFarmSelectorOnBackdrop(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeFarmSelector();
    }
  }

  filterFarms(): void {
    const query = this.farmSearchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredFarms = this.farms;
      return;
    }

    this.filteredFarms = this.farms.filter(farm =>
      farm.name.toLowerCase().includes(query) ||
      (farm.location && farm.location.toLowerCase().includes(query))
    );
  }

  getCurrentFarmName(): string {
    return this.farmManagement.getFarmDisplayName();
  }

  isSelectedFarm(farm: Farm): boolean {
    return this.selectedFarm?.farm_id === farm.farm_id;
  }

  selectFarmFromModal(farm: Farm): void {
    this.farmManagement.selectFarm(farm);
    this.closeFarmSelector();
  }

  getFarmDeviceCount(farm: Farm): number {
    // This would ideally come from the farm data or API
    // For now, return a placeholder
    return 0;
  }

  // Close farm selector on escape key
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showFarmSelector) {
      this.closeFarmSelector();
    } else if (this.showMobileMenu) {
      this.closeMobileMenu();
    } else if (this.showMoreMenu) {
      this.showMoreMenu = false;
    }
  }

  // Check if route is active
  isRouteActive(route: string): boolean {
    return this.currentRoute().startsWith(route);
  }

  // Get translation for nav item
  getNavLabel(translationKey: string): string {
    return this.languageService.t()(translationKey);
  }

  // Check if current language is RTL
  isRTL(): boolean {
    return this.languageService.getCurrentLanguageCode() === 'ar-TN';
  }

  // Toggle more menu (for tablet)
  toggleMoreMenu(): void {
    this.showMoreMenu = !this.showMoreMenu;
  }

  closeMoreMenu(): void {
    this.showMoreMenu = false;
  }


  // Navigate to route and close menus
  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.closeMobileMenu();
    this.closeMoreMenu();
  }

  // Quick action handler for FAB
  handleQuickAction(): void {
    // Navigate to manual control/actions page
    this.router.navigate(['/actions'], { queryParams: { mode: 'manual' } });
  }
}
