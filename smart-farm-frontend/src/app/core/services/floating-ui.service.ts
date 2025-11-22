import { Injectable, inject, ElementRef } from '@angular/core';
import { ThemeService } from './theme.service';
import { LanguageService } from './language.service';

export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';
export type Strategy = 'absolute' | 'fixed';

export interface FloatingOptions {
  placement?: Placement;
  strategy?: Strategy;
  offset?: number;
  flip?: boolean;
  shift?: boolean;
  autoUpdate?: boolean;
  middleware?: any[];
  customClass?: string;
  showArrow?: boolean;
  arrowPadding?: number;
  boundary?: Element | 'viewport';
  hideOnEscape?: boolean;
  hideOnOutsideClick?: boolean;
  hideOnScroll?: boolean;
  animationDuration?: number;
  animationDelay?: number;
  zIndex?: number;
}

export interface TooltipOptions extends FloatingOptions {
  content: string;
  html?: boolean;
  interactive?: boolean;
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  delay?: number;
  hideDelay?: number;
}

export interface DropdownOptions extends FloatingOptions {
  content: HTMLElement | string;
  html?: boolean;
  interactive?: boolean;
  trigger?: 'click' | 'hover' | 'focus' | 'manual';
  closeOnSelect?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  onContentCreated?: (element: HTMLElement) => void;
}

@Injectable({
  providedIn: 'root'
})
export class FloatingUIService {
  private themeService = inject(ThemeService);
  private languageService = inject(LanguageService);

  private activeElements = new Map<HTMLElement, {
    tooltip?: HTMLElement;
    dropdown?: HTMLElement;
    cleanup?: () => void;
    options?: any;
  }>();

  constructor() {}

  createTooltip(
    referenceElement: HTMLElement | ElementRef<HTMLElement>,
    options: TooltipOptions
  ): { destroy: () => void; update: (newOptions: Partial<TooltipOptions>) => void } {
    const element = referenceElement instanceof ElementRef ? referenceElement.nativeElement : referenceElement;

    this.destroyTooltip(element);

    const tooltip = this.createTooltipElement(options);
    document.body.appendChild(tooltip);

    let isVisible = false;
    let showTimeout: number | undefined;
    let hideTimeout: number | undefined;

    const show = () => {
      if (isVisible) return;
      clearTimeout(hideTimeout);
      showTimeout = window.setTimeout(() => {
        this.positionElement(element, tooltip, options);
        tooltip.classList.add('visible');
        isVisible = true;
        if (options.autoUpdate !== false) {
          const reposition = () => this.positionElement(element, tooltip, options);
          window.addEventListener('scroll', reposition, true);
          window.addEventListener('resize', reposition);
          this.activeElements.set(element, {
            ...(this.activeElements.get(element) || {}),
            tooltip,
            cleanup: () => {
              window.removeEventListener('scroll', reposition, true);
              window.removeEventListener('resize', reposition);
              tooltip.remove();
              this.activeElements.delete(element);
            },
            options
          });
        }
      }, options.delay || 0);
    };

    const hide = () => {
      if (!isVisible) return;
      clearTimeout(showTimeout);
      hideTimeout = window.setTimeout(() => {
        tooltip.classList.remove('visible');
        isVisible = false;
        const active = this.activeElements.get(element);
        active?.cleanup?.();
      }, options.hideDelay || 0);
    };

    const trigger = options.trigger || 'hover';
    if (trigger === 'hover') {
      element.addEventListener('mouseenter', show);
      element.addEventListener('mouseleave', hide);
      tooltip.addEventListener('mouseenter', show);
      tooltip.addEventListener('mouseleave', hide);
    } else if (trigger === 'click') {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isVisible) hide(); else show();
      });
    } else if (trigger === 'focus') {
      element.addEventListener('focus', show);
      element.addEventListener('blur', hide);
    }

    this.activeElements.set(element, {
      tooltip,
      cleanup: () => {
        clearTimeout(showTimeout);
        clearTimeout(hideTimeout);
        tooltip.remove();
        this.activeElements.delete(element);
      },
      options
    });

    return {
      destroy: () => {
        const active = this.activeElements.get(element);
        active?.cleanup?.();
      },
      update: (newOptions: Partial<TooltipOptions>) => {
        const active = this.activeElements.get(element);
        if (active) {
          Object.assign(active.options, newOptions);
          if (newOptions.content) this.updateTooltipContent(tooltip, newOptions);
          if (isVisible) this.positionElement(element, tooltip, { ...active.options, ...newOptions });
        }
      }
    };
  }

  createDropdown(
    referenceElement: HTMLElement | ElementRef<HTMLElement>,
    options: DropdownOptions
  ): { destroy: () => void; update: (newOptions: Partial<DropdownOptions>) => void } {
    const element = referenceElement instanceof ElementRef ? referenceElement.nativeElement : referenceElement;

    this.destroyDropdown(element);

    const dropdown = this.createDropdownElement(options);
    
    // Call onContentCreated callback if provided
    if (options.onContentCreated) {
      options.onContentCreated(dropdown);
    }
    
    document.body.appendChild(dropdown);

    let isVisible = false;
    let cleanup: (() => void) | undefined;

    const show = () => {
      if (isVisible) return;
      this.positionElement(element, dropdown, options);
      dropdown.classList.add('visible');
      isVisible = true;

      const reposition = () => this.positionElement(element, dropdown, options);
      if (options.autoUpdate !== false) {
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
      }

      const handlers: Array<() => void> = [];
      if (options.closeOnOutsideClick !== false) {
        const outside = (e: Event) => {
          if (!element.contains(e.target as Node) && !dropdown.contains(e.target as Node)) hide();
        };
        document.addEventListener('click', outside);
        handlers.push(() => document.removeEventListener('click', outside));
      }
      if (options.closeOnEscape !== false) {
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') hide(); };
        document.addEventListener('keydown', esc);
        handlers.push(() => document.removeEventListener('keydown', esc));
      }

      cleanup = () => {
        window.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
        handlers.forEach(h => h());
      };
    };

    const hide = () => {
      if (!isVisible) return;
      dropdown.classList.remove('visible');
      isVisible = false;
      cleanup?.();
      cleanup = undefined;
    };

    const trigger = options.trigger || 'click';
    if (trigger === 'click') {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isVisible) hide(); else show();
      });
    } else if (trigger === 'hover') {
      element.addEventListener('mouseenter', show);
      element.addEventListener('mouseleave', hide);
      dropdown.addEventListener('mouseenter', show);
      dropdown.addEventListener('mouseleave', hide);
    } else if (trigger === 'focus') {
      element.addEventListener('focus', show);
      element.addEventListener('blur', hide);
    }

    this.activeElements.set(element, {
      dropdown,
      cleanup: () => {
        cleanup?.();
        dropdown.remove();
        this.activeElements.delete(element);
      },
      options
    });

    return {
      destroy: () => {
        const active = this.activeElements.get(element);
        active?.cleanup?.();
      },
      update: (newOptions: Partial<DropdownOptions>) => {
        const active = this.activeElements.get(element);
        if (active) {
          Object.assign(active.options, newOptions);
          if (newOptions.content) this.updateDropdownContent(dropdown, newOptions);
          if (isVisible) this.positionElement(element, dropdown, { ...active.options, ...newOptions });
        }
      }
    };
  }

  private positionElement(referenceElement: HTMLElement, floatingElement: HTMLElement, options: FloatingOptions): void {
    const offsetValue = options.offset ?? 8;
    const rect = referenceElement.getBoundingClientRect();
    const floatRect = floatingElement.getBoundingClientRect();

    let x = rect.left + (options.strategy === 'fixed' ? 0 : window.scrollX);
    let y = rect.top + (options.strategy === 'fixed' ? 0 : window.scrollY);

    const placement = options.placement || 'bottom';
    switch (placement) {
      case 'top':
        x += rect.width / 2 - floatRect.width / 2;
        y -= floatRect.height + offsetValue;
        break;
      case 'bottom':
        x += rect.width / 2 - floatRect.width / 2;
        y += rect.height + offsetValue;
        break;
      case 'left':
        x -= floatRect.width + offsetValue;
        y += rect.height / 2 - floatRect.height / 2;
        break;
      case 'right':
        x += rect.width + offsetValue;
        y += rect.height / 2 - floatRect.height / 2;
        break;
      case 'top-start':
        y -= floatRect.height + offsetValue;
        break;
      case 'top-end':
        x += rect.width - floatRect.width;
        y -= floatRect.height + offsetValue;
        break;
      case 'bottom-start':
        y += rect.height + offsetValue;
        break;
      case 'bottom-end':
        x += rect.width - floatRect.width;
        y += rect.height + offsetValue;
        break;
      default:
        y += rect.height + offsetValue;
        x += rect.width / 2 - floatRect.width / 2;
    }

    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const pad = 8;

    if (options.flip !== false) {
      if (y + floatRect.height > window.scrollY + vpH) {
        y = rect.top + (options.strategy === 'fixed' ? 0 : window.scrollY) - floatRect.height - offsetValue;
      }
      if (y < window.scrollY) {
        y = rect.top + (options.strategy === 'fixed' ? 0 : window.scrollY) + rect.height + offsetValue;
      }
    }

    if (options.shift !== false) {
      if (x + floatRect.width > window.scrollX + vpW - pad) {
        x = window.scrollX + vpW - floatRect.width - pad;
      }
      if (x < window.scrollX + pad) {
        x = window.scrollX + pad;
      }
    }

    Object.assign(floatingElement.style, {
      position: options.strategy || 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: String(options.zIndex || 1000)
    } as CSSStyleDeclaration);
  }

  private createTooltipElement(options: TooltipOptions): HTMLElement {
    const tooltip = document.createElement('div');
    tooltip.className = `floating-tooltip ${this.getThemeClass()} ${options.customClass || ''}`;
    if (options.html) tooltip.innerHTML = options.content; else tooltip.textContent = options.content;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-hidden', 'true');
    return tooltip;
  }

  private createDropdownElement(options: DropdownOptions): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.className = `floating-dropdown ${this.getThemeClass()} ${options.customClass || ''}`;
    if (options.html) {
      if (typeof options.content === 'string') {
        dropdown.innerHTML = options.content;
      } else if (options.content instanceof HTMLElement) {
        // Clone the element and append it
        const cloned = options.content.cloneNode(true) as HTMLElement;
        dropdown.appendChild(cloned);
      }
    } else if (typeof options.content === 'string') {
      dropdown.textContent = options.content;
    } else if (options.content instanceof HTMLElement) {
      dropdown.appendChild(options.content.cloneNode(true) as HTMLElement);
    }
    dropdown.setAttribute('role', 'menu');
    dropdown.setAttribute('aria-hidden', 'true');
    return dropdown;
  }

  private updateTooltipContent(tooltip: HTMLElement, options: Partial<TooltipOptions>): void {
    if (options.html) tooltip.innerHTML = options.content || '';
    else tooltip.textContent = options.content || '';
  }

  private updateDropdownContent(dropdown: HTMLElement, options: Partial<DropdownOptions>): void {
    if (options.html) dropdown.innerHTML = options.content as string || '';
    else if (typeof options.content === 'string') dropdown.textContent = options.content;
    else if (options.content) { dropdown.innerHTML = ''; dropdown.appendChild(options.content); }
  }

  private getThemeClass(): string {
    const isDark = this.themeService.currentTheme === 'dark';
    const isRTL = this.languageService.isRTL();
    return `${isDark ? 'dark-theme' : 'light-theme'} ${isRTL ? 'rtl' : 'ltr'}`;
  }

  destroyTooltip(element: HTMLElement): void {
    const active = this.activeElements.get(element);
    if (active?.tooltip) active.cleanup?.();
  }

  destroyDropdown(element: HTMLElement): void {
    const active = this.activeElements.get(element);
    if (active?.dropdown) active.cleanup?.();
  }

  destroyAll(): void {
    this.activeElements.forEach((active) => active.cleanup?.());
    this.activeElements.clear();
  }

  getActiveCount(): number {
    return this.activeElements.size;
  }
}




