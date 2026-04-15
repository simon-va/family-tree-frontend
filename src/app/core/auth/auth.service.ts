import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface UserProfile {
  firstName: string;
  lastName: string;
}

const AUTH_URL = 'https://auth.tobit.com/v2/token';
const LOCATION_ID = 243012;
const REFRESH_COOKIE = 'refreshToken';
const PROFILE_KEY = 'userProfile';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly userToken = signal<string | null>(null);

  getRefreshToken(): string | null {
    const match = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${REFRESH_COOKIE}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  }

  setRefreshToken(token: string): void {
    const maxAge = 90 * 24 * 60 * 60;
    document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(token)}; max-age=${maxAge}; SameSite=Strict; path=/`;
  }

  getUserToken(): string | null {
    return this.userToken();
  }

  setUserToken(token: string): void {
    this.userToken.set(token);
  }

  getProfile(): UserProfile | null {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  setProfile(firstName: string, lastName: string): void {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ firstName, lastName }));
  }

  clearAuth(): void {
    document.cookie = `${REFRESH_COOKIE}=; max-age=0; path=/`;
    localStorage.removeItem(PROFILE_KEY);
    this.userToken.set(null);
  }

  fetchRefreshToken(username: string, password: string): Observable<string> {
    const credentials = btoa(`${username}:${password}`);
    return this.http
      .post<{ token: string }>(
        AUTH_URL,
        { tokenType: 4, locationId: LOCATION_ID },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Basic ${credentials}`,
          },
        }
      )
      .pipe(map((res) => res.token));
  }

  fetchUserToken(refreshToken: string): Observable<string> {
    return this.http
      .post<{ token: string }>(
        AUTH_URL,
        { tokenType: 1 },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      )
      .pipe(map((res) => res.token));
  }
}
