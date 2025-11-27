import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface UserSession {
  token: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'cordipdf:session';
  readonly user = signal<UserSession | null>(this.restore());

  constructor(private readonly router: Router) {}

  login(email: string, password: string) {
    const fakeToken = btoa(`${email}:${password}:${new Date().toISOString()}`);
    const session: UserSession = { token: fakeToken, name: email.split('@')[0] || 'User', email };
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.user.set(session);
  }

  logout() {
    localStorage.removeItem(this.storageKey);
    this.user.set(null);
    this.router.navigate(['/templates']);
  }

  isAuthenticated() {
    return !!this.user();
  }

  private restore(): UserSession | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserSession;
    } catch (error) {
      console.warn('Cannot parse session', error);
      return null;
    }
  }
}
