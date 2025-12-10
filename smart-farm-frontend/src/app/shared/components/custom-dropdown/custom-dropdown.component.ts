import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

export interface DropdownItem {
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
  image?: string;
  flag?: string;
  badge?: string;
  disabled?: boolean;
  divider?: boolean;
  action?: () => void;
  routerLink?: string;
}

@Component({
  selector: 'app-custom-dropdown',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDividerModule],
  template: `
    <div class="dropdown-container" #dropdownContainer>
      <button 
        class="dropdown-trigger"
        [class.active]="isOpen()"
        [style.border]="getTriggerBorder()"
        (click)="toggleDropdown()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="true">
        
        <ng-content select="[slot=trigger]"></ng-content>
      </button>

      <div 
        class="dropdown-menu"
        [class.open]="isOpen()"
        [class.above]="positionAbove()"
        [style.background]="getMenuBackground()"
        [style.border]="getMenuBorder()"
        [style.box-shadow]="getMenuShadow()"
        *ngIf="isOpen()">
        
        <div class="menu-content">
          <!-- Header Section -->
          <div class="menu-header" *ngIf="title || subtitle">
            <div class="header-content">
              <div class="header-icon" *ngIf="headerIcon">
                <mat-icon>{{ headerIcon }}</mat-icon>
              </div>
              <div class="header-text">
                <div class="header-title" [style.color]="getPrimaryTextColor()">{{ title }}</div>
                <div class="header-subtitle" [style.color]="getSecondaryTextColor()" *ngIf="subtitle">{{ subtitle }}</div>
              </div>
            </div>
          </div>

          <mat-divider *ngIf="title || subtitle" [style.border-color]="getDividerColor()"></mat-divider>

          <!-- Items Section -->
          <div class="menu-items">
            <div 
              class="menu-section" 
              *ngFor="let section of groupedItems">
              
              <div class="section-title" [style.color]="getSecondaryTextColor()" *ngIf="section.title">
                {{ section.title }}
              </div>

              <button
                class="menu-item"
                *ngFor="let item of section.items"
                [class.disabled]="item.disabled"
                [class.selected]="item.id === selectedItemId"
                [style.color]="getItemTextColor(item)"
                (click)="selectItem(item)"
                [disabled]="item.disabled">
                
                <div class="item-content">
                  <div class="item-icon" *ngIf="item.icon || item.image || item.flag">
                    <mat-icon *ngIf="item.icon">{{ item.icon }}</mat-icon>
                    <img *ngIf="item.image" [src]="item.image" [alt]="item.label" class="item-image" />
                    <img *ngIf="item.flag" [src]="item.flag" [alt]="item.label + ' flag'" class="item-flag" />
                  </div>
                  
                  <div class="item-text">
                    <div class="item-label" [style.color]="getItemTextColor(item)">{{ item.label }}</div>
                    <div class="item-subtitle" [style.color]="getSecondaryTextColor()" *ngIf="item.subtitle">{{ item.subtitle }}</div>
                  </div>
                  
                  <div class="item-badge" *ngIf="item.badge" [style.background]="getBadgeBackground()" [style.color]="getBadgeTextColor()">
                    {{ item.badge }}
                  </div>
                  
                  <div class="item-arrow" *ngIf="item.routerLink">
                    <mat-icon [style.color]="getSecondaryTextColor()">chevron_right</mat-icon>
                  </div>
                </div>
              </button>

              <mat-divider *ngIf="!section.isLast" [style.border-color]="getDividerColor()"></mat-divider>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dropdown-container {
      position: relative;
      display: inline-block;
    }

    .dropdown-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 12px;
      padding: 0;
      margin: 0;
    }

    .dropdown-trigger:hover {
      transform: translateY(-1px);
    }

    .dropdown-trigger.active {
      transform: translateY(-1px);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      min-width: 320px;
      max-width: 400px;
      border-radius: 16px;
      z-index: 1002 !important;
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      overflow: hidden;
    }

    .dropdown-menu.above {
      top: auto;
      bottom: 100%;
      margin-top: 0;
      margin-bottom: 8px;
    }

    .dropdown-menu.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    .menu-content {
      padding: 8px;
    }

    .menu-header {
      padding: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      margin-bottom: 8px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.05);
    }

    .header-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .header-text {
      flex: 1;
    }

    .header-title {
      font-weight: 600;
      font-size: 16px;
      line-height: 1.2;
    }

    .header-subtitle {
      font-size: 13px;
      margin-top: 2px;
      opacity: 0.8;
    }

    .menu-items {
      padding: 8px 0;
    }

    .menu-section {
      margin-bottom: 8px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 16px 4px;
      margin-bottom: 4px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin: 2px 0;
      position: relative;
      overflow: hidden;
    }

    .menu-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.05);
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 12px;
    }

    .menu-item:hover::before {
      opacity: 1;
    }

    .menu-item:hover {
      transform: translateX(4px);
    }

    .menu-item.selected {
      background: rgba(46, 125, 50, 0.1);
      border: 1px solid rgba(46, 125, 50, 0.2);
    }

    .menu-item.selected::before {
      opacity: 0;
    }

    .menu-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .menu-item.disabled:hover {
      transform: none;
    }

    .item-content {
      display: flex;
      align-items: center;
      width: 100%;
      position: relative;
      z-index: 1;
    }

    .item-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .item-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .item-image, .item-flag {
      width: 24px;
      height: 24px;
      object-fit: cover;
      border-radius: 4px;
    }

    .item-flag {
      border-radius: 2px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .item-text {
      flex: 1;
      min-width: 0;
    }

    .item-label {
      font-weight: 500;
      font-size: 14px;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-subtitle {
      font-size: 12px;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 8px;
      margin-left: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .item-arrow {
      margin-left: 8px;
    }

    .item-arrow mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Dark theme styles - Clean sophisticated greys */
    .dark-theme .menu-header {
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }

    .dark-theme .header-icon {
      background: rgba(255, 255, 255, 0.08);
    }

    .dark-theme .menu-item::before {
      background: rgba(255, 255, 255, 0.08);
    }

    .dark-theme .menu-item.selected {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.15);
    }

    /* Responsive design */
    @media (max-width: 480px) {
      .dropdown-menu {
        min-width: 280px;
        max-width: 320px;
      }
      
      .menu-item {
        padding: 10px 12px;
      }
      
      .item-icon {
        width: 28px;
        height: 28px;
        margin-right: 10px;
      }
      
      .item-label {
        font-size: 13px;
      }
      
      .item-subtitle {
        font-size: 11px;
      }
    }

    @media (max-width: 360px) {
      .dropdown-menu {
        min-width: 260px;
        max-width: 280px;
      }
      
      .menu-item {
        padding: 8px 10px;
      }
      
      .item-icon {
        width: 24px;
        height: 24px;
        margin-right: 8px;
      }
      
      .item-label {
        font-size: 12px;
      }
      
      .item-subtitle {
        font-size: 10px;
      }
    }
  `]
})
export class CustomDropdownComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() headerIcon?: string;
  @Input() items: DropdownItem[] = [];
  @Input() selectedItemId?: string;
  @Input() sections: { title?: string; items: DropdownItem[] }[] = [];
  @Input() position: 'below' | 'above' = 'below';

  @Output() itemSelected = new EventEmitter<DropdownItem>();
  @Output() dropdownToggled = new EventEmitter<boolean>();

  @ViewChild('dropdownContainer', { static: true }) dropdownContainer!: ElementRef;

  isOpen = signal(false);
  positionAbove = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.dropdownContainer.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen()) {
      this.updatePosition();
    }
  }

  toggleDropdown(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(): void {
    this.isOpen.set(true);
    this.updatePosition();
    this.dropdownToggled.emit(true);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.positionAbove.set(false);
    this.dropdownToggled.emit(false);
  }

  selectItem(item: DropdownItem): void {
    if (item.disabled) return;
    
    this.selectedItemId = item.id;
    this.itemSelected.emit(item);
    
    if (item.action) {
      item.action();
    }
    
    this.closeDropdown();
  }

  private updatePosition(): void {
    const rect = this.dropdownContainer.nativeElement.getBoundingClientRect();
    const menuHeight = 400; // Approximate menu height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    this.positionAbove.set(spaceBelow < menuHeight && spaceAbove > menuHeight);
  }

  get groupedItems(): { title?: string; items: DropdownItem[]; isLast: boolean }[] {
    if (this.sections.length > 0) {
      return this.sections.map((section, index) => ({
        ...section,
        isLast: index === this.sections.length - 1
      }));
    }
    
    return [{ items: this.items, isLast: true }];
  }

  // Theme-aware styling methods
  getTriggerBorder(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme 
      ? '0.5px solid rgba(255, 255, 255, 0.3)' 
      : '0.5px solid rgba(0, 0, 0, 0.2)';
  }

  getMenuBackground(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme ? '#2d2d2d' : '#ffffff';
  }

  getMenuBorder(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme 
      ? '1px solid rgba(255, 255, 255, 0.1)' 
      : '1px solid rgba(0, 0, 0, 0.1)';
  }

  getMenuShadow(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme 
      ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
      : '0 8px 32px rgba(0, 0, 0, 0.12)';
  }

  getPrimaryTextColor(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme ? '#ffffff' : '#2c3e50';
  }

  getSecondaryTextColor(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme ? 'rgba(255, 255, 255, 0.8)' : '#7f8c8d';
  }

  getDividerColor(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  }

  getItemTextColor(item: DropdownItem): string {
    if (item.id === 'logout') {
      return '#ff6b6b';
    }
    return this.getPrimaryTextColor();
  }

  getBadgeBackground(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  }

  getBadgeTextColor(): string {
    return this.getSecondaryTextColor();
  }
}
