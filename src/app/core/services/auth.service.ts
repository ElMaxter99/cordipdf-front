import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface UserSession {
  token: string;
  name: string;
  role: 'admin' | 'user';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'cordi_auth';
  private readonly sessionSignal = signal<UserSession | null>(this.readSession());

  constructor(private readonly router: Router) {}

  login(username: string, password: string): Promise<UserSession> {
    const fakeToken = btoa(`${username}:${password}:${Date.now()}`);
    const session: UserSession = { token: fakeToken, name: username, role: 'admin' };
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.sessionSignal.set(session);
    return Promise.resolve(session);
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.sessionSignal.set(null);
    this.router.navigate(['/templates']);
  }

  isAuthenticated(): boolean {
    return Boolean(this.sessionSignal());
  }

  get token(): string | null {
    return this.sessionSignal()?.token ?? null;
  }

  get user(): UserSession | null {
    return this.sessionSignal();
  }

  private readSession(): UserSession | null {
    const data = localStorage.getItem(this.storageKey);
    return data ? (JSON.parse(data) as UserSession) : null;
  }
}
