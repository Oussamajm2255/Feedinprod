# 🎨 Modern Glassmorphic Toast Notifications Guide

## ✨ Overview

Beautiful, modern toast notifications that match the SmartFarm glassmorphism aesthetic. These toasts provide instant feedback for login errors, success messages, and any other user interactions.

---

## 🎯 Features

### Visual Design
- ✅ **Glassmorphic aesthetic** (25% translucent with backdrop blur)
- ✅ **Neumorphic shadows** for depth and elevation
- ✅ **Smooth animations** (slide-in with bounce effect)
- ✅ **Hover effects** (scale and lift on hover)
- ✅ **Color-coded** borders (green, red, orange, blue)

### User Experience
- ✅ **Auto-dismiss** with progress bar
- ✅ **Close button** with rotation animation
- ✅ **Responsive** (mobile, tablet, desktop)
- ✅ **Accessible** (ARIA labels, keyboard support)
- ✅ **Reduced motion** support

### Technical
- ✅ **SweetAlert2** integration
- ✅ **Language service** integration (multi-language)
- ✅ **Theme support** (light/dark)
- ✅ **RTL support** (Arabic, Hebrew)

---

## 📖 Usage

### In Login Component (Example)

```typescript
import { AlertService } from '../../../core/services/alert.service';

export class LoginComponent {
  private alertService = inject(AlertService);

  onSubmit() {
    this.authService.login(loginData).subscribe({
      next: (response) => {
        // Success toast
        this.alertService.success(
          this.languageService.t()('auth.loginSuccess'),
          this.languageService.t()('auth.welcomeBack')
        );
      },
      error: (error) => {
        // Error toast
        this.alertService.error(
          this.languageService.t()('auth.loginError'),
          'Identifiants invalides' // Or any error message
        );
      }
    });
  }
}
```

---

## 🎨 Toast Types

### 1. Success Toast ✅
```typescript
this.alertService.success(
  'Connexion réussie',
  'Bienvenue dans SmartFarm'
);
```

**Visual**:
- Green left border (4px)
- Green checkmark icon
- White text with shadow
- Auto-dismiss: 2.5 seconds

---

### 2. Error Toast ❌
```typescript
this.alertService.error(
  'Erreur de connexion',
  'Identifiants invalides'
);
```

**Visual**:
- Red left border (4px)
- Red X icon
- White text with shadow
- Auto-dismiss: 4 seconds

---

### 3. Warning Toast ⚠️
```typescript
this.alertService.warning(
  'Attention',
  'Votre session va expirer dans 5 minutes'
);
```

**Visual**:
- Orange left border (4px)
- Orange exclamation icon
- White text with shadow
- Auto-dismiss: 3 seconds

---

### 4. Info Toast ℹ️
```typescript
this.alertService.info(
  'Information',
  'Nouvelle version disponible'
);
```

**Visual**:
- Blue left border (4px)
- Blue info icon
- White text with shadow
- Auto-dismiss: 2.5 seconds

---

## 🎬 Animation Sequence

### Appearance
```
1. Slide in from right (100px)
2. Overshoot slightly (-10px)
3. Settle to final position (0px)
Duration: 400ms
Easing: cubic-bezier(0.34, 1.56, 0.64, 1) (bounce effect)
```

### Hover
```
- Scale: 1.02
- Lift: -2px
- Enhanced shadow
Duration: 300ms
Easing: ease-in-out
```

### Dismissal
```
- Fade out
- Slide right (100px)
- Scale down (0.9)
Duration: 300ms
```

---

## 🎨 Visual Specifications

### Card Design
```scss
Background: rgba(255, 255, 255, 0.25)
Backdrop Filter: blur(20px) saturate(180%)
Border: 1px solid rgba(255, 255, 255, 0.3)
Border Radius: 16px
Padding: 16px 20px
Min Width: 320px
Max Width: 400px
```

### Shadows
```scss
Default:
  0 4px 12px rgba(0, 0, 0, 0.15),
  0 2px 6px rgba(0, 0, 0, 0.1),
  inset 0 1px 0 rgba(255, 255, 255, 0.4)

Hover:
  0 6px 16px rgba(0, 0, 0, 0.2),
  0 3px 8px rgba(0, 0, 0, 0.15),
  inset 0 1px 0 rgba(255, 255, 255, 0.5)
```

### Text
```scss
Title:
  Color: #ffffff
  Font Size: 0.95rem
  Font Weight: 600
  Shadow: 0 2px 4px rgba(0, 0, 0, 0.8)

Message:
  Color: rgba(255, 255, 255, 0.9)
  Font Size: 0.85rem
  Font Weight: 400
  Shadow: 0 1px 3px rgba(0, 0, 0, 0.8)
```

---

## 📱 Responsive Behavior

### Desktop (>768px)
- Position: Top-right corner
- Margin: 24px from edges
- Full width toast (320-400px)

### Tablet (768px)
- Position: Top-right corner
- Margin: 16px from edges
- Slightly narrower toast

### Mobile (<768px)
- Position: Top, full width
- Margin: 16px left/right
- Adapts to screen width
- Smaller padding (12px 16px)
- Smaller font sizes

### Extra Small (<480px)
- Margin: 12px left/right
- Compact padding
- Further reduced font sizes
- Maintained readability

---

## 🎯 Color System

### Success (Green)
```scss
Border: #4caf50
Icon BG: rgba(76, 175, 80, 0.15)
Hover Glow: rgba(76, 175, 80, 0.3)
Progress Bar: linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)
```

### Error (Red)
```scss
Border: #f44336
Icon BG: rgba(244, 67, 54, 0.15)
Hover Glow: rgba(244, 67, 54, 0.3)
Progress Bar: rgba(255, 255, 255, 0.3)
```

### Warning (Orange)
```scss
Border: #ff9800
Icon BG: rgba(255, 152, 0, 0.15)
Hover Glow: rgba(255, 152, 0, 0.3)
Progress Bar: rgba(255, 255, 255, 0.3)
```

### Info (Blue)
```scss
Border: #2196f3
Icon BG: rgba(33, 150, 243, 0.15)
Hover Glow: rgba(33, 150, 243, 0.3)
Progress Bar: rgba(255, 255, 255, 0.3)
```

---

## 🌐 Common Error Messages (Login)

### Invalid Credentials
```typescript
this.alertService.error(
  this.languageService.t()('auth.loginError'),
  this.languageService.t()('auth.invalidCredentials')
);
```
**French**: "Identifiants invalides"  
**English**: "Invalid credentials"  
**Arabic**: "بيانات الاعتماد غير صحيحة"

### Network Error
```typescript
this.alertService.error(
  this.languageService.t()('auth.loginError'),
  this.languageService.t()('auth.networkError')
);
```
**French**: "Erreur réseau. Vérifiez votre connexion."  
**English**: "Network error. Check your connection."

### Too Many Attempts
```typescript
this.alertService.error(
  this.languageService.t()('auth.loginError'),
  this.languageService.t()('auth.tooManyAttempts')
);
```
**French**: "Trop de tentatives. Réessayez plus tard."  
**English**: "Too many attempts. Try again later."

### Invalid Email Format
```typescript
this.alertService.error(
  this.languageService.t()('auth.loginError'),
  this.languageService.t()('auth.invalidEmailFormat')
);
```
**French**: "Format d'email invalide"  
**English**: "Invalid email format"

---

## ⚙️ Customization

### Change Position
```scss
// In toast-notifications.scss
.swal2-container.swal2-top-end {
  top: 24px !important;
  right: 24px !important;
  // Change to: top-start, center, bottom-end, etc.
}
```

### Change Duration
```typescript
// In alert.service.ts
success(title: string, text?: string) {
  return Swal.fire({
    // ... other options
    timer: 2500, // Change duration (milliseconds)
  });
}
```

### Change Colors
```scss
// In toast-notifications.scss
.swal2-toast.swal2-icon-success {
  border-left: 4px solid #YOUR_COLOR !important;
}
```

### Disable Auto-Dismiss
```typescript
// In alert.service.ts
success(title: string, text?: string) {
  return Swal.fire({
    // ... other options
    timer: undefined, // Remove auto-dismiss
    showConfirmButton: true, // Show OK button
  });
}
```

---

## 🔧 Advanced Usage

### Custom Toast
```typescript
this.alertService.custom({
  icon: 'success',
  title: 'Custom Title',
  text: 'Custom message',
  toast: true,
  position: 'top-end',
  timer: 3000,
  timerProgressBar: true,
  showConfirmButton: false,
  customClass: {
    popup: 'my-custom-class'
  }
});
```

### Confirm Dialog (Not Toast)
```typescript
const result = await this.alertService.confirm(
  'Confirmer la déconnexion',
  'Êtes-vous sûr de vouloir vous déconnecter?',
  'Oui',
  'Non'
);

if (result.isConfirmed) {
  // User clicked Yes
  this.logout();
}
```

### Loading Toast
```typescript
this.alertService.loading(
  'Chargement...',
  'Connexion en cours'
);

// Later, close it
this.alertService.close();
```

---

## 🎬 Demo Examples

### Login Success Flow
```typescript
// 1. Show loading
this.isLoading.set(true);

// 2. API call
this.authService.login(data).subscribe({
  next: (response) => {
    this.isLoading.set(false);
    this.loginSuccess.set(true);
    
    // 3. Success toast
    this.alertService.success(
      'Connexion réussie!',
      'Bienvenue dans SmartFarm'
    );
    
    // 4. Navigate after toast
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 1500);
  },
  error: (error) => {
    this.isLoading.set(false);
    
    // 5. Error toast
    this.alertService.error(
      'Erreur de connexion',
      'Identifiants invalides'
    );
  }
});
```

---

## ♿ Accessibility

### Features
- ✅ **ARIA labels** on all elements
- ✅ **Keyboard navigation** (Escape to close)
- ✅ **Focus management** (auto-focus on close button)
- ✅ **Screen reader** compatible
- ✅ **Reduced motion** support
- ✅ **High contrast** mode support

### Keyboard Shortcuts
- **Escape**: Close toast
- **Enter**: Click close button (when focused)
- **Tab**: Navigate to close button

---

## 📁 File Structure

```
smart-farm-frontend/
├── src/
│   ├── app/
│   │   └── core/
│   │       └── styles/
│   │           └── toast-notifications.scss  ← Toast styles
│   │       └── services/
│   │           └── alert.service.ts          ← Alert service
│   └── styles.scss                           ← Import here
```

---

## ✅ Quality Checklist

### Visual
- [✅] Glassmorphic background (25% opacity)
- [✅] Backdrop blur (20px)
- [✅] Neumorphic shadows
- [✅] Color-coded borders
- [✅] Smooth animations
- [✅] Hover effects

### Functional
- [✅] Auto-dismiss with timer
- [✅] Progress bar indicator
- [✅] Close button
- [✅] Multi-language support
- [✅] Error handling
- [✅] Success feedback

### Responsive
- [✅] Desktop layout
- [✅] Tablet layout
- [✅] Mobile layout
- [✅] Touch-friendly
- [✅] Adaptive sizing

### Accessibility
- [✅] ARIA labels
- [✅] Keyboard navigation
- [✅] Screen reader support
- [✅] Reduced motion
- [✅] High contrast

---

## 🚀 Status

**Implementation**: ✅ **COMPLETE**  
**Integration**: ✅ **LOGIN COMPONENT**  
**Styling**: ✅ **GLASSMORPHIC**  
**Quality**: ✅ **PRODUCTION READY**

---

## 📸 Visual Preview

```
┌─────────────────────────────────────────┐
│ ✅  Connexion réussie!                  │ ← Success (Green border)
│     Bienvenue dans SmartFarm         ×  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░        │ ← Progress bar
└─────────────────────────────────────────┘
  ↑ Glassmorphic (25% white + blur)

┌─────────────────────────────────────────┐
│ ❌  Erreur de connexion                 │ ← Error (Red border)
│     Identifiants invalides           ×  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⚠️  Attention                           │ ← Warning (Orange border)
│     Session expirant bientôt         ×  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ℹ️  Information                         │ ← Info (Blue border)
│     Nouvelle mise à jour disponible  ×  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░        │
└─────────────────────────────────────────┘
```

---

**Ready to use!** 🎉

Your SmartFarm application now has beautiful, modern toast notifications that match the glassmorphism aesthetic perfectly!

