import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'farms',
    loadComponent: () => import('./features/farms/farms.component').then(m => m.FarmsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'devices',
    loadComponent: () => import('./features/devices/devices.component').then(m => m.DevicesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'sensors',
    loadComponent: () => import('./features/sensors/sensors.component').then(m => m.SensorsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'sensor-readings',
    loadComponent: () => import('./features/sensors/sensor-readings/sensor-readings.component').then(m => m.SensorReadingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'actions',
    loadComponent: () => import('./features/actions/actions.component').then(m => m.ActionsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'crops',
    loadComponent: () => import('./features/crops/crops-with-fallback.component').then(m => m.CropsWithFallbackComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings/notifications',
    loadComponent: () => import('./features/settings/notification-settings/notification-settings.component').then(m => m.NotificationSettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
