import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // On guest routes (login/register), DO NOT initialize auth
  // Only check if user is already authenticated (has token in memory)
  // If they have a token, redirect to dashboard
  // If not, allow access to login page

  // Check if already authenticated (but don't call /auth/me)
  if (authService.isAuthenticated()) {
    router.navigate(['/dashboard']);
    return false;
  }

  // Not authenticated, allow access to login/register
  return true;
};
