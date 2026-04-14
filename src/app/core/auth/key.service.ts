import { Injectable } from '@angular/core';

interface UserProfile {
  userKey: string;
  userName: string;
}

const STORAGE_KEY = 'userProfile';

@Injectable({ providedIn: 'root' })
export class KeyService {
  getProfile(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  setProfile(userName: string, userKey: string): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userKey, userName }));
  }

  getKey(): string | null {
    return this.getProfile()?.userKey ?? null;
  }

  setKey(key: string): void {
    const existing = this.getProfile();
    this.setProfile(existing?.userName ?? '', key);
  }

  clearKey(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
