import { Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { FloatingUIService, TooltipOptions } from '../../core/services/floating-ui.service';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnInit, OnDestroy {
  @Input('appTooltip') content: string = '';
  @Input() tooltipOptions: Partial<TooltipOptions> = {};

  private floatingUIService = inject(FloatingUIService);
  private tooltipInstance: { destroy: () => void; update: (options: Partial<TooltipOptions>) => void } | null = null;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    if (this.content) {
      this.createTooltip();
    }
  }

  ngOnDestroy(): void {
    this.destroyTooltip();
  }

  private createTooltip(): void {
    if (!this.content) return;

    const options: TooltipOptions = {
      content: this.content,
      placement: 'top',
      trigger: 'hover',
      delay: 300,
      hideDelay: 100,
      ...this.tooltipOptions
    };

    this.tooltipInstance = this.floatingUIService.createTooltip(this.elementRef, options);
  }

  private destroyTooltip(): void {
    if (this.tooltipInstance) {
      this.tooltipInstance.destroy();
      this.tooltipInstance = null;
    }
  }

  // Method to update tooltip content dynamically
  updateContent(newContent: string): void {
    this.content = newContent;
    if (this.tooltipInstance) {
      this.tooltipInstance.update({ content: newContent });
    } else if (newContent) {
      this.createTooltip();
    }
  }

  // Method to update tooltip options dynamically
  updateOptions(newOptions: Partial<TooltipOptions>): void {
    this.tooltipOptions = { ...this.tooltipOptions, ...newOptions };
    if (this.tooltipInstance) {
      this.tooltipInstance.update(newOptions);
    }
  }
}
