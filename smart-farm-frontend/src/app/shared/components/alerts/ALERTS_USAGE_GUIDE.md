# 🎨 Glassmorphic Alert System - Usage Guide

## Overview

A modern, theme-aware, i18n-ready alert system with glassmorphic design that perfectly integrates with the Smart Farm Management System's eco-futuristic aesthetic.

## ✨ Features

- ✅ **4 Alert Types**: success, error, warning, info
- ✅ **Glassmorphic Design**: Smooth blur effects with gradient icons
- ✅ **Theme Integration**: Seamless dark/light mode support
- ✅ **i18n Ready**: Full translation support (EN/FR/AR)
- ✅ **RTL Support**: Proper layout for Arabic
- ✅ **Auto-dismiss**: Configurable timeout (default: 5s)
- ✅ **Hover Pause**: Auto-dismiss pauses on hover
- ✅ **Smooth Animations**: Slide-in/out with scale effects
- ✅ **Accessible**: ARIA labels and keyboard support
- ✅ **Mobile Responsive**: Adapts to all screen sizes

## 🚀 Quick Start

### 1. Import the AlertService

```typescript
import { AlertService } from '@app/core/services/alert.service';
import { inject } from '@angular/core';

export class MyComponent {
  private alertService = inject(AlertService);
}
```

### 2. Show Alerts

```typescript
// Success alert
this.alertService.show('success', 'common.success', 'Operation completed successfully');

// Error alert
this.alertService.show('error', 'common.error', 'Something went wrong');

// Warning alert
this.alertService.show('warning', 'common.warning', 'Please review this action');

// Info alert
this.alertService.show('info', 'common.info', 'New update available');
```

### 3. Using Convenience Methods

```typescript
// Success (auto-dismiss after 5s)
this.alertService.success('common.success', 'sensors.sensorActivated');

// Error (auto-dismiss after 7s)
this.alertService.error('common.error', 'sensors.activationFailed');

// Warning (auto-dismiss after 6s)
this.alertService.warning('common.warning', 'devices.lowBattery');

// Info (auto-dismiss after 5s)
this.alertService.info('common.info', 'system.updateAvailable');
```

## 🎯 Real-World Examples

### Device Activation

```typescript
activateDevice(deviceId: string) {
  this.deviceService.activate(deviceId).subscribe({
    next: () => {
      this.alertService.success(
        'devices.activationSuccess',
        'devices.deviceActivatedMessage'
      );
    },
    error: () => {
      this.alertService.error(
        'devices.activationError',
        'devices.pleaseCheckConnection'
      );
    }
  });
}
```

### Sensor Reading Alert

```typescript
onSensorThresholdExceeded(sensor: Sensor) {
  this.alertService.warning(
    'sensors.thresholdExceeded',
    `sensors.${sensor.type}AboveNormal`
  );
}
```

### Form Validation

```typescript
onSubmit() {
  if (this.form.invalid) {
    this.alertService.warning(
      'common.validationError',
      'common.pleaseCheckAllFields'
    );
    return;
  }
  
  // Submit form...
}
```

### Background Operations

```typescript
syncData() {
  // Show loading alert (no auto-dismiss)
  const loadingId = this.alertService.show(
    'info',
    'common.syncing',
    'common.pleaseWait',
    0  // 0 = no auto-dismiss
  );
  
  this.dataService.sync().subscribe({
    next: () => {
      // Dismiss loading alert
      this.alertService.dismiss(loadingId);
      
      // Show success
      this.alertService.success('common.success', 'common.syncComplete');
    },
    error: () => {
      // Dismiss loading alert
      this.alertService.dismiss(loadingId);
      
      // Show error
      this.alertService.error('common.error', 'common.syncFailed');
    }
  });
}
```

## ⚙️ Advanced Configuration

### Custom Duration

```typescript
// Show alert for 10 seconds
this.alertService.show(
  'info',
  'Title',
  'Message',
  10000  // duration in milliseconds
);

// Show alert indefinitely (must dismiss manually)
this.alertService.show(
  'warning',
  'Title',
  'Message',
  0  // 0 = no auto-dismiss
);
```

### Manual Dismissal

```typescript
// Get alert ID
const alertId = this.alertService.show('info', 'Title', 'Message', 0);

// Dismiss specific alert
setTimeout(() => {
  this.alertService.dismiss(alertId);
}, 5000);

// Clear all alerts
this.alertService.clear();
```

### Non-dismissible Alerts

```typescript
this.alertService.show(
  'error',
  'Critical Error',
  'System requires attention',
  0,
  false  // not dismissible
);
```

## 🌐 Translation Keys

### Adding Custom Translation Keys

**en-US.json:**
```json
{
  "devices": {
    "activationSuccess": "Device Activated",
    "deviceActivatedMessage": "The device has been successfully activated"
  }
}
```

**fr-FR.json:**
```json
{
  "devices": {
    "activationSuccess": "Appareil Activé",
    "deviceActivatedMessage": "L'appareil a été activé avec succès"
  }
}
```

**ar-TN.json:**
```json
{
  "devices": {
    "activationSuccess": "تم تفعيل الجهاز",
    "deviceActivatedMessage": "تم تفعيل الجهاز بنجاح"
  }
}
```

## 🎨 Styling Customization

The alerts automatically adapt to:
- Current theme (light/dark)
- Current language direction (LTR/RTL)
- Screen size (responsive)
- User preferences (reduced motion)

All styling is managed in `alerts.component.scss` using CSS variables from the global theme.

## 📱 Mobile Behavior

- Alerts stack vertically
- Smaller padding and font sizes
- Touch-friendly close buttons
- Swipe gesture support (future enhancement)

## ♿ Accessibility

- Proper ARIA roles and labels
- Screen reader announcements
- Keyboard navigation support
- Focus management
- High contrast mode support

## 🔄 Migration from Old Alert System

### Before (Old System)
```typescript
// Old MatSnackBar or SweetAlert2
this.snackBar.open('Success!', 'Close', { duration: 3000 });
Swal.fire('Success', 'Operation completed', 'success');
```

### After (New System)
```typescript
// New Glassmorphic Alerts
this.alertService.success('common.success', 'Operation completed');
```

## 🐛 Troubleshooting

### Alerts not showing?
- Ensure `<app-alerts></app-alerts>` is in your `app.html`
- Check that `AlertsComponent` is imported in `app.ts`
- Verify AlertService is properly injected

### Translations not working?
- Check translation keys exist in all language files
- Verify LanguageService is initialized
- Use browser console to check for missing keys

### Styling issues?
- Check that CSS variables are defined in `styles.scss`
- Verify theme service is working
- Clear browser cache

## 📚 API Reference

### AlertService Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `show()` | type, title, message, duration?, dismissible? | Show a new alert |
| `success()` | title, message, duration? | Show success alert |
| `error()` | title, message, duration? | Show error alert |
| `warning()` | title, message, duration? | Show warning alert |
| `info()` | title, message, duration? | Show info alert |
| `dismiss()` | alertId | Dismiss specific alert |
| `clear()` | none | Clear all alerts |

### Alert Types

- `success` - Green gradient, checkmark icon
- `error` - Red gradient, X icon
- `warning` - Orange gradient, warning icon
- `info` - Blue gradient, info icon

---

**Created for TerraFlow Smart Farm Management System** 🌱

