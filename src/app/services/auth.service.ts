import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private jwtHelper = inject(JwtHelperService);
  private router = inject(Router);

  private userPermissions: string[] = [];
  private userName = new BehaviorSubject<string | null>(null);
  public userName$ = this.userName.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDataFromToken();
    }
  }

  login(credentials: { login: string; password: string }): Observable<LoginResponse> {
    const loginUrl = `${this.apiUrl}/painel/auth/login`;
    return this.http.post<LoginResponse>(loginUrl, credentials).pipe(
      tap(response => this.saveToken(response.access_token))
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshUrl = `${this.apiUrl}/painel/auth/refresh`;
    return this.http.post<LoginResponse>(refreshUrl, {}).pipe(
      tap(response => {
        this.saveToken(response.access_token);
      })
    );
  }

  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('authToken', token);
      this.decodeAndStoreData(token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('authToken');
    }
    this.userPermissions = [];
    this.userName.next(null);
    this.router.navigate(['/painel/login']);
  }

  private decodeAndStoreData(token: string | null): void {
    if (token) {
      try {
        const decodedToken = this.jwtHelper.decodeToken(token);
        this.userPermissions = decodedToken?.permissions || decodedToken?.permissoes || [];
        const name = decodedToken?.name || null;
        this.userName.next(name);
      } catch (error) {
        this.userPermissions = [];
        this.userName.next(null);
      }
    } else {
      this.userPermissions = [];
      this.userName.next(null);
    }
  }

  private loadDataFromToken(): void {
    const token = this.getToken();
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      this.decodeAndStoreData(token);
    } else {
       this.userPermissions = [];
       this.userName.next(null);
    }
  }

  hasPermission(permission: string): boolean {
    return this.userPermissions.includes(permission);
  }

  hasAllPermissions(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) {
      return true;
    }
    return permissions.every(p => this.userPermissions.includes(p));
  }
}
