import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of, map, firstValueFrom } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  // No localStorage for token; rely on httpOnly cookie set by the backend

  private userSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private initPromise: Promise<void> | null = null;
  private initialized = false;

  // Signals for reactive programming
  public user = signal<User | null>(null);
  public token = signal<string | null>(null);
  public isAuthenticated = computed(() => !!this.token());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Don't initialize immediately - wait for Angular to be ready
  }

  // Initialize auth - only check /auth/me (no CSRF needed with JWT/cookies)
  async initAuth(): Promise<void> {
    if (this.initialized) return;
    
    this.initPromise = this.initializeAuth();
    await this.initPromise;
    this.initialized = true;
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Try to fetch current user from server session/cookie
      const user = await firstValueFrom(this.http.get<User>(`${this.API_URL}/auth/me`, { withCredentials: true }));
      this.setAuthData(user);
    } catch (error) {
      // No valid session, clear auth state silently (don't navigate)
      this.clearAuthState(false);
    }
  }

  // Method for guards to wait for initialization
  // Only called on protected routes (authGuard), never on /login
  async waitForInit(): Promise<boolean> {
    if (!this.initialized) {
      await this.initAuth();
    }
    return this.isAuthenticated();
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<{ user: User }>(`${this.API_URL}/auth/login`, credentials, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response?.user) {
            this.setAuthData(response.user);
            this.router.navigate(['/dashboard']);
          }
        }),
        map(response => response.user)
      );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.http.post<{ user: User }>(`${this.API_URL}/users/register`, userData, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response?.user) {
            this.setAuthData(response.user);
            this.router.navigate(['/dashboard']);
          }
        }),
        catchError(error => {
          console.error('Registration error:', error);
          throw error;
        }),
        map(response => response.user)
      );
  }

  logout(navigate: boolean = true): void {
    // Try to clear server cookie, but don't fail if request fails
    this.http.post(`${this.API_URL}/auth/logout`, {}, { withCredentials: true }).subscribe({ 
      complete: () => {},
      error: () => {
        // Ignore logout errors (e.g., no valid session)
        console.log('Logout request failed, but clearing local state anyway');
      }
    });

    this.clearAuthState(navigate);
  }

  private clearAuthState(navigate: boolean = true): void {
    this.user.set(null);
    this.token.set(null);
    this.userSubject.next(null);
    this.tokenSubject.next(null);
    if (navigate) this.router.navigate(['/login']);
  }

  private setAuthData(user: User): void {
    this.user.set(user);
    this.token.set('cookie');
    this.userSubject.next(user);
    this.tokenSubject.next('cookie');
  }

  getCurrentUser(): User | null {
    return this.user();
  }

  getToken(): string | null { return null; }

  isTokenValid(): boolean { return !!this.token(); }

  refreshToken(): Observable<any> {
    // Implement token refresh logic if needed
    return of(null);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }
}
