import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  name: string;
  avatar: string;
  role: 'admin' | 'editor';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<UserProfile | null>({
    name: 'Jane Doe',
    avatar: 'https://i.pravatar.cc/100?img=12',
    role: 'editor'
  });

  readonly user = this.userSignal.asReadonly();

  loginMock(): void {
    localStorage.setItem('auth_token', 'mock-token');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.userSignal.set(null);
  }
}
