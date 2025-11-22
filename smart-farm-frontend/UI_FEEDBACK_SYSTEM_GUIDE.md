# Smart Farming Dashboard - UI Feedback System

## Overview

The Smart Farming Dashboard now features a comprehensive UI feedback system built with **SweetAlert2** and **Floating UI** (Popper.js). This system provides:

- 🎨 **Theme-aware alerts and toasts** that automatically adapt to light/dark themes
- 🌍 **Multi-language support** with automatic translation integration
- 🎯 **Smart tooltips and dropdowns** that never clip or overflow
- ⚡ **Performance optimized** with proper cleanup and event management
- ♿ **Accessibility compliant** with ARIA labels and keyboard navigation

## 🚀 Quick Start

### 1. SweetAlert2 Integration

The `AlertService` provides a wrapper around SweetAlert2 with theme and translation integration:

```typescript
import { AlertService } from '../core/services/alert.service';

// Inject the service
constructor(private alertService: AlertService) {}

// Success toast (auto-closes in 2.5s)
this.alertService.success('Operation completed!', 'Your data has been saved successfully');

// Error toast (auto-closes in 4s)
this.alertService.error('Error occurred!', 'Please check your input and try again');

// Warning toast (auto-closes in 3s)
this.alertService.warning('Warning!', 'This action cannot be undone');

// Info toast (auto-closes in 2.5s)
this.alertService.info('Information', 'Here is some useful information');

// Confirmation dialog
const result = await this.alertService.confirm(
  'Delete Item',
  'Are you sure you want to delete this item?',
  'Yes, delete',
  'Cancel'
);

if (result.isConfirmed) {
  // User confirmed
}

// Input prompt
const result = await this.alertService.prompt(
  'Enter Name',
  'Please enter your name:',
  'text',
  '',
  'Your name here'
);

if (result.isConfirmed) {
  console.log('User entered:', result.value);
}

// Loading spinner
const loadingToast = await this.alertService.loading('Processing...', 'Please wait');
// ... do async work ...
this.alertService.close(); // Close the loading spinner
```

### 2. Floating UI Integration

The `FloatingUIService` provides smart tooltips and dropdowns:

```typescript
import { FloatingUIService } from '../core/services/floating-ui.service';

// Inject the service
constructor(private floatingUIService: FloatingUIService) {}

// Create a tooltip
const tooltipInstance = this.floatingUIService.createTooltip(element, {
  content: 'This is a helpful tooltip',
  placement: 'top',
  trigger: 'hover',
  delay: 300,
  hideDelay: 100
});

// Create a dropdown
const dropdownInstance = this.floatingUIService.createDropdown(element, {
  content: dropdownContentElement,
  placement: 'bottom-start',
  trigger: 'click',
  closeOnOutsideClick: true,
  closeOnEscape: true
});

// Clean up when done
tooltipInstance.destroy();
dropdownInstance.destroy();
```

### 3. Using Directives

For easier integration, use the provided directives:

```html
<!-- Tooltip directive -->
<button 
  appTooltip="This is a helpful tooltip"
  [tooltipOptions]="{ placement: 'top', delay: 300 }">
  Hover me
</button>

<!-- Dropdown directive -->
<button 
  appDropdown="dropdown-content-id"
  [dropdownOptions]="{ placement: 'bottom-end', trigger: 'click' }">
  Click me
</button>

<!-- Hidden dropdown content -->
<div id="dropdown-content-id" style="display: none;">
  <div class="dropdown-menu">
    <div class="dropdown-item">Option 1</div>
    <div class="dropdown-item">Option 2</div>
  </div>
</div>
```

## 🎨 Theme Integration

All components automatically adapt to the current theme:

### Light Theme
- Background: `rgba(255, 255, 255, 0.95)`
- Text: `#2c3e50`
- Borders: `rgba(0, 0, 0, 0.1)`
- Shadows: Subtle with low opacity

### Dark Theme
- Background: `rgba(20, 20, 20, 0.9)`
- Text: `#ffffff`
- Borders: `rgba(255, 255, 255, 0.1)`
- Shadows: Stronger with higher opacity

## 🌍 Translation Integration

All text is automatically translated using the `LanguageService`:

```typescript
// These will be automatically translated
this.alertService.success('common.success', 'devices.operationComplete');
this.alertService.error('common.error', 'devices.operationFailed');

// Custom translations
this.alertService.custom({
  title: 'devices.customTitle',
  text: 'devices.customMessage',
  confirmButtonText: 'common.confirm',
  cancelButtonText: 'common.cancel'
});
```

## 📱 Responsive Design

All components are fully responsive:

- **Desktop**: Full feature set with hover effects
- **Tablet**: Optimized spacing and touch targets
- **Mobile**: Simplified interactions and larger touch areas

## ♿ Accessibility Features

- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **Focus management** for modals
- **High contrast** support
- **Reduced motion** respect

## 🔧 Advanced Configuration

### Custom Alert Options

```typescript
this.alertService.custom({
  title: 'Custom Alert',
  text: 'This is a custom alert with full control',
  icon: 'question',
  showCancelButton: true,
  confirmButtonText: 'Proceed',
  cancelButtonText: 'Cancel',
  timer: 5000,
  timerProgressBar: true,
  allowOutsideClick: false,
  allowEscapeKey: true,
  customClass: {
    popup: 'my-custom-popup',
    title: 'my-custom-title'
  }
});
```

### Custom Floating UI Options

```typescript
this.floatingUIService.createTooltip(element, {
  content: 'Custom tooltip',
  placement: 'bottom',
  strategy: 'fixed',
  offset: 12,
  flip: true,
  shift: true,
  autoUpdate: true,
  middleware: [
    offset(12),
    flip(),
    shift({ padding: 8 })
  ],
  customClass: 'my-custom-tooltip',
  showArrow: true,
  arrowPadding: 8,
  boundary: 'viewport',
  hideOnEscape: true,
  hideOnOutsideClick: true,
  hideOnScroll: true,
  animationDuration: 300,
  animationDelay: 200,
  zIndex: 1000
});
```

## 🎯 Best Practices

### 1. Performance
- Always clean up tooltip/dropdown instances
- Use debouncing for search inputs
- Avoid creating too many simultaneous alerts

### 2. UX Guidelines
- Use success toasts for positive feedback
- Use error toasts for recoverable errors
- Use confirmation dialogs for destructive actions
- Keep tooltips concise and helpful

### 3. Accessibility
- Always provide meaningful ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper focus management

## 🧪 Testing

### Demo Component

Visit `/ui-demo` to see all features in action:

- SweetAlert2 alerts and toasts
- Floating UI tooltips and dropdowns
- Theme switching
- Language switching
- Responsive behavior

### Manual Testing

```typescript
// Test notifications
this.notificationService.testNotification();

// Test alerts
this.alertService.success('Test', 'This is a test alert');

// Test tooltips
const element = document.querySelector('#test-element');
this.floatingUIService.createTooltip(element, {
  content: 'Test tooltip',
  placement: 'top'
});
```

## 🔍 Troubleshooting

### Common Issues

1. **Tooltips not showing**: Check if element is visible and has proper positioning
2. **Alerts not themed**: Ensure ThemeService is properly initialized
3. **Translations not working**: Verify LanguageService is loaded and translation keys exist
4. **Performance issues**: Check for memory leaks in tooltip/dropdown cleanup

### Debug Mode

Enable debug logging:

```typescript
// In browser console
(window as any).alertService = this.alertService;
(window as any).floatingUIService = this.floatingUIService;
```

## 📚 API Reference

### AlertService Methods

- `success(title, text?, options?)` - Success toast
- `error(title, text?, options?)` - Error toast
- `warning(title, text?, options?)` - Warning toast
- `info(title, text?, options?)` - Info toast
- `confirm(title, text?, confirmText?, cancelText?, options?)` - Confirmation dialog
- `prompt(title, text?, inputType?, inputValue?, inputPlaceholder?, options?)` - Input prompt
- `loading(title?, text?, options?)` - Loading spinner
- `close()` - Close current alert
- `custom(options)` - Custom alert with full control
- `toast(title, text?, icon?, position?, timer?, options?)` - Custom toast
- `modal(title, text?, icon?, options?)` - Modal dialog

### FloatingUIService Methods

- `createTooltip(referenceElement, options)` - Create tooltip
- `createDropdown(referenceElement, options)` - Create dropdown
- `destroyTooltip(element)` - Destroy tooltip
- `destroyDropdown(element)` - Destroy dropdown
- `destroyAll()` - Destroy all floating elements
- `getActiveCount()` - Get active elements count

## 🚀 Future Enhancements

- [ ] Animation presets
- [ ] Custom themes
- [ ] Voice announcements
- [ ] Gesture support
- [ ] Advanced positioning algorithms
- [ ] Performance monitoring
- [ ] A/B testing integration

---

For more examples and advanced usage, check the demo component at `/ui-demo` or explore the source code in the `core/services` directory.




