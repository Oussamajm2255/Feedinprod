import { HttpInterceptorFn } from '@angular/common/http';

// Attach credentials (cookies) to all API requests
// No CSRF token needed - using JWT in httpOnly cookies
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Always send credentials (cookies) for all requests
  const modified = req.clone({ withCredentials: true });
  return next(modified);
};
