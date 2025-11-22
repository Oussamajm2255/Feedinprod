# Sensor Readings - Quick Reference Guide

## 🎨 Color Palette Reference

### Primary Colors
```scss
// Light Mode - Deep Teal (Nature-Tech)
$primary-light: #005f5b;
$primary-hover-light: #047857;

// Dark Mode - Soft Aqua
$primary-dark: #80cbc4;
$primary-hover-dark: #64ffda;
```

### Accent Colors
```scss
// Emerald Accent
$accent-light: #10b981;
$accent-dark: #34d399;
```

### Status Colors
```scss
// Normal/Optimal
$status-normal-light: #10b981;
$status-normal-dark: #34d399;

// Warning
$status-warning-light: #f59e0b;
$status-warning-dark: #fcd34d;

// Critical
$status-critical-light: #ef4444;
$status-critical-dark: #fca5a5;

// Offline
$status-offline-light: #6b7280;
$status-offline-dark: #cbd5e1;
```

---

## 📏 Spacing System (8px Grid)

```typescript
XS:   8px   // Tight spacing, icon gaps
SM:   12px  // Small gaps, inline elements
MD:   16px  // Standard card padding, item gaps
LG:   24px  // Section spacing, larger gaps
XL:   32px  // Container padding, major sections
XXL:  48px  // Large sectional breaks
```

### Usage Examples
```scss
// Card padding
padding: 16px 20px;

// Grid gaps
gap: 12px;

// Container padding
padding: 24px 32px;
```

---

## 🔲 Border Radius

```scss
$radius-sm: 8px;   // Small elements
$radius-md: 12px;  // Buttons, inputs
$radius-lg: 16px;  // Cards, panels
$radius-xl: 20px;  // Major containers
$radius-full: 9999px; // Pills, badges
```

---

## ⏱️ Transitions

### Standard Timing
```scss
// Fast interactions (button hover)
transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

// Normal interactions (most UI elements)
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

// Slow animations (page transitions)
transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
```

### Custom Easing
```scss
$ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 🎭 Shadow Levels

### Light Mode
```scss
// Level 1 - Subtle elevation
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

// Level 2 - Card elevation
box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);

// Level 3 - Hover/Active
box-shadow: 0 12px 32px rgba(16, 185, 129, 0.25),
            0 0 20px rgba(16, 185, 129, 0.15);
```

### Dark Mode
```scss
// Level 1
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

// Level 2
box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);

// Level 3
box-shadow: 0 12px 32px rgba(16, 185, 129, 0.35),
            0 0 24px rgba(16, 185, 129, 0.2);
```

---

## 🧊 Glass Effects

### Light Mode
```scss
background: rgba(255, 255, 255, 0.75);
backdrop-filter: blur(16px);
border: 1px solid rgba(16, 185, 129, 0.2);
```

### Dark Mode
```scss
background: rgba(30, 41, 59, 0.75);
backdrop-filter: blur(16px);
border: 1px solid rgba(100, 116, 139, 0.3);
```

---

## 📱 Breakpoints

```scss
// Mobile
@media (max-width: 480px) { ... }

// Tablet
@media (max-width: 768px) { ... }

// Small Desktop
@media (max-width: 1024px) { ... }

// Medium Desktop
@media (max-width: 1280px) { ... }

// Large Desktop
@media (max-width: 1440px) { ... }
```

---

## 🎯 Component Classes

### Selection States
```scss
.selected {
  border-color: #10b981;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3),
              0 0 20px rgba(16, 185, 129, 0.15);
  transform: translateX(8px);
}
```

### Hover States
```scss
.hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.2);
}
```

### Active States
```scss
.active {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #065f46;
}
```

---

## 🔧 Common Patterns

### KPI Card
```scss
.kpi-card {
  padding: 16px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(16, 185, 129, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.2);
}
```

### Action Button
```scss
.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.08));
}
```

### List Item
```scss
.list-item {
  padding: 16px;
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-item:hover {
  transform: translateX(8px) scale(1.02);
  border-color: rgba(16, 185, 129, 0.5);
}

.list-item.selected {
  border-color: #10b981;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}
```

---

## ✨ Special Effects

### Glow Animation
```scss
@keyframes glowPulse {
  0%, 100% {
    box-shadow: 3px 0 12px rgba(16, 185, 129, 0.6);
  }
  50% {
    box-shadow: 3px 0 20px rgba(16, 185, 129, 0.8);
  }
}

.glow {
  animation: glowPulse 2s ease-in-out infinite;
}
```

### Shimmer Effect
```scss
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.shimmer {
  background: linear-gradient(90deg, #10b981, #34d399, #10b981);
  background-size: 200% 100%;
  animation: shimmer 3s linear infinite;
}
```

### Ripple Effect
```scss
.ripple::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.1), transparent);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.ripple:hover::after {
  width: 300px;
  height: 300px;
}
```

---

## 🎯 Helper Utilities

### Import the Display Utilities
```typescript
import {
  getSensorIcon,
  getSensorDisplayName,
  getSensorColor,
  getStatusIcon,
  THEME_COLORS,
  SPACING,
} from './utils/sensor-display.util';
```

### Get Sensor Info
```typescript
// Get icon for temperature sensor
const icon = getSensorIcon('temperature'); // 'thermostat'

// Get display name
const name = getSensorDisplayName('soil_moisture'); // 'Soil Moisture'

// Get color based on theme
const color = getSensorColor('humidity', isDarkMode);
```

### Get Status Info
```typescript
// Get status icon
const statusIcon = getStatusIcon('critical'); // 'error'

// Get status color
const statusColor = getStatusColor('warning', isDarkMode);
```

---

## 📊 Component Structure

```
sensor-readings/
├── sensor-readings.component.ts (Main container)
├── components/
│   ├── global-filter-header/ (Top header with filters)
│   ├── device-list-panel/ (Left sidebar - sensor list)
│   ├── device-detail-panel/ (Right panel - detail view)
│   └── footer-summary/ (Bottom summary bar)
├── services/
│   └── readings-map.service.ts (Data management)
└── utils/
    ├── sensor-status.util.ts (Status calculations)
    ├── sensor-thresholds.util.ts (Threshold logic)
    └── sensor-display.util.ts (Display helpers) ⭐ NEW
```

---

## 🚀 Quick Tips

### 1. Always use the utility functions
```typescript
// ❌ Bad
const icon = 'thermostat';

// ✅ Good
const icon = getSensorIcon(sensor.type);
```

### 2. Follow the 8px grid
```scss
// ❌ Bad
padding: 15px;

// ✅ Good
padding: 16px; // 2 × 8px
```

### 3. Use consistent transitions
```scss
// ❌ Bad
transition: all 0.2s ease;

// ✅ Good
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### 4. Apply proper shadow levels
```scss
// ❌ Bad - single flat shadow
box-shadow: 0 2px 4px rgba(0,0,0,0.1);

// ✅ Good - layered shadows for depth
box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2),
            0 0 20px rgba(16, 185, 129, 0.1);
```

---

## 🎨 Design Principles

1. **Consistent Spacing**: Always use the 8px grid
2. **Smooth Transitions**: Use cubic-bezier easing for natural motion
3. **Layered Shadows**: Create depth with multiple shadow layers
4. **Glass Effects**: Use backdrop blur for modern aesthetics
5. **Eco-Futuristic**: Combine nature colors with tech interactions
6. **Clear Selection**: Make active states obvious with glowing borders
7. **Responsive Design**: Adapt spacing and layout for all screens
8. **Dark Mode First**: Ensure both themes look equally polished

---

**Pro Tip**: When in doubt, check `sensor-display.util.ts` for the canonical values! 🎯

