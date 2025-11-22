import { Directive, ElementRef, Input, OnInit, OnDestroy, inject, TemplateRef, ViewContainerRef, NgZone } from '@angular/core';
import { FloatingUIService, DropdownOptions } from '../../core/services/floating-ui.service';

@Directive({
  selector: '[appDropdown]',
  standalone: true
})
export class DropdownDirective implements OnInit, OnDestroy {
  @Input('appDropdown') content: HTMLElement | string = '';
  @Input() dropdownOptions: Partial<DropdownOptions> = {};

  private floatingUIService = inject(FloatingUIService);
  private ngZone = inject(NgZone);
  private dropdownInstance: { destroy: () => void; update: (options: Partial<DropdownOptions>) => void } | null = null;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    if (this.content) {
      this.createDropdown();
    }
  }

  ngOnDestroy(): void {
    this.destroyDropdown();
  }

  private createDropdown(): void {
    if (!this.content) return;

    // If content is a string (ID), find the element
    let contentElement: HTMLElement | string = this.content;
    let originalElement: HTMLElement | null = null;
    
    if (typeof this.content === 'string') {
      originalElement = document.getElementById(this.content);
      if (originalElement) {
        // Clone the element to avoid moving the original from the DOM
        contentElement = originalElement.cloneNode(true) as HTMLElement;
        // Remove the original element's hidden styling from clone
        (contentElement as HTMLElement).removeAttribute('style');
        (contentElement as HTMLElement).removeAttribute('id');
        (contentElement as HTMLElement).classList.remove('dropdown-template');
      } else {
        console.warn(`Dropdown: Element with ID "${this.content}" not found`);
        return;
      }
    }

    const options: DropdownOptions = {
      content: contentElement,
      html: true,
      placement: 'bottom-start',
      trigger: 'click',
      closeOnOutsideClick: true,
      closeOnEscape: true,
      onContentCreated: (clonedElement: HTMLElement) => {
        // Attach event listeners to cloned dropdown items
        if (originalElement) {
          this.attachEventListeners(clonedElement, originalElement);
        }
      },
      ...this.dropdownOptions
    };

    this.dropdownInstance = this.floatingUIService.createDropdown(this.elementRef, options);
  }

  /**
   * Attach event listeners to cloned dropdown items
   */
  private attachEventListeners(clonedElement: HTMLElement, originalElement: HTMLElement): void {
    const clonedItems = clonedElement.querySelectorAll('.dropdown-item');
    const originalItems = originalElement.querySelectorAll('.dropdown-item');

    clonedItems.forEach((clonedItem, index) => {
      const originalItem = originalItems[index];
      if (originalItem && clonedItem) {
        // Get the click handler from the original element's data attribute or find the button
        clonedItem.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Execute the click handler from the original element
          this.ngZone.run(() => {
            const originalButton = originalItem as HTMLElement;
            originalButton.click();
          });
        });
      }
    });
  }

  private destroyDropdown(): void {
    if (this.dropdownInstance) {
      this.dropdownInstance.destroy();
      this.dropdownInstance = null;
    }
  }

  // Method to update dropdown content dynamically
  updateContent(newContent: HTMLElement | string): void {
    this.content = newContent;
    if (this.dropdownInstance) {
      this.dropdownInstance.update({ content: newContent });
    } else if (newContent) {
      this.createDropdown();
    }
  }

  // Method to update dropdown options dynamically
  updateOptions(newOptions: Partial<DropdownOptions>): void {
    this.dropdownOptions = { ...this.dropdownOptions, ...newOptions };
    if (this.dropdownInstance) {
      this.dropdownInstance.update(newOptions);
    }
  }

  // Method to programmatically show dropdown
  show(): void {
    if (this.dropdownInstance) {
      // Trigger click to show dropdown
      this.elementRef.nativeElement.click();
    }
  }

  // Method to programmatically hide dropdown
  hide(): void {
    // This would need to be implemented in the FloatingUIService
    // For now, clicking outside will hide it
  }
}




