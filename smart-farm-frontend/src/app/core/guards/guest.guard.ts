import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth initialization to complete
  const isAuthenticated = await authService.waitForInit();

  if (!isAuthenticated) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
