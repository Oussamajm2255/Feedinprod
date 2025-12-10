import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-crops-ultra-minimal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 2rem;">
      <h1>Crops Page - Ultra Minimal Test</h1>
      <p>If you see this, the routing works!</p>
      <p>The freeze was caused by child components.</p>
    </div>
  `
})
export class CropsUltraMinimalComponent {
  constructor() {
    console.log('[CropsUltraMinimal] Component loaded successfully!');
  }
}

