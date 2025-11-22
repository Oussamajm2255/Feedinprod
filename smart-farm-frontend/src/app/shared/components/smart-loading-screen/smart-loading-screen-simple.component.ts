/**
 * Smart Loading Screen Component - Agriculture Theme
 *
 * Pure CSS animation loader with agriculture/plant growth theme.
 * Lightweight, no external dependencies, smooth infinite loop.
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-smart-loading-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-wrapper" *ngIf="isLoading" [@fadeInOut]>
      <!-- Animated Gradient Background -->
      <div class="gradient-background"></div>

      <!-- Floating Particles -->
      <div class="particles-container">
        <div *ngFor="let i of particleIndexes" 
             class="particle" 
             [style.--particle-index]="i">
        </div>
      </div>

      <!-- Main Loader Container -->
      <div class="loader-container">
        <!-- Agriculture SVG Animation -->
        <svg class="agriculture-loader" 
             xmlns="http://www.w3.org/2000/svg" 
             viewBox="0 0 200 200"
             aria-label="Loading animation">
          <g class="loader-circle">
            <path d="M100 197.6c-53.9 0-97.6-43.7-97.6-97.6S46.1 2.4 100 2.4s97.6 43.7 97.6 97.6-43.7 97.6-97.6 97.6z"/>
          </g>
          <path class="loader-stem-base" d="M100 197.5v-32.8c-.1-5.1-1.1-12.4-5.8-17.1-7.3-7.3-23-5.4-23-5.4s-2.5 15 5.4 23c3.5 3.5 8.8 4.9 13.5 5.4m9.9 26.9v-32.8c.1-5.1 1.1-12.4 5.8-17.1 7.3-7.3 23-5.4 23-5.4s2.5 15-5.4 23c-3.5 3.5-8.8 4.9-13.5 5.4"/>
          <path class="loader-stem-mid" d="M100 162.5v-32.8c-.1-5.1-1.1-12.4-5.8-17.1-7.3-7.3-23-5.4-23-5.4s-2.5 15 5.4 23c3.5 3.5 8.8 4.9 13.5 5.4m9.9 26.9v-32.8c.1-5.1 1.1-12.4 5.8-17.1 7.3-7.3 23-5.4 23-5.4s2.5 15-5.4 23c-3.5 3.5-8.8 4.9-13.5 5.4"/>
          <path class="loader-stem-top" d="M100 129.5V93.7c-.1-5.1-1.1-12.4-5.8-17.1-7.3-7.3-23-5.4-23-5.4s-2.5 15 5.4 23c3.5 3.5 8.8 4.9 13.5 5.4m9.9 29.9V93.7c.1-5.1 1.1-12.4 5.8-17.1 7.3-7.3 23-5.4 23-5.4s2.5 15-5.4 23c-3.5 3.5-8.8 4.9-13.5 5.4"/>
          <path class="loader-leaf-top" d="M112.4 51.4c0 10.5-12.4 20.1-12.4 20.1s-12.4-9-12.4-20.1C87.6 41 100 31.3 100 31.3s12.4 8.9 12.4 20.1z"/>
        </svg>

        <!-- Glow Effect -->
        <div class="loader-glow"></div>
      </div>

      <!-- Loading Message -->
      <div class="loader-content">
        <h2 class="loader-message">{{ message }}</h2>
        
        <!-- Progress Dots -->
        <div class="loader-dots">
          <div class="dot dot-1"></div>
          <div class="dot dot-2"></div>
          <div class="dot dot-3"></div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./smart-loading-screen-simple.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void <=> *', animate('600ms ease-in-out'))
    ])
  ]
})
export class SmartLoadingScreenSimpleComponent {
  @Input() isLoading: boolean = true;
  @Input() message: string = 'Growing your smart network…';

  // Generate array for floating particles
  particleIndexes = Array.from({ length: 20 }, (_, i) => i);
}

