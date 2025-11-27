import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<UserProfile | null>(null);

  login(email: string, password: string): Observable<UserProfile> {
    const mockedUser: UserProfile = {
      id: 'user-1',
      name: 'Demo User',
      email,
      token: 'demo-token'
    };
    return of(mockedUser).pipe(
      delay(300),
      tap((profile) => this.user.set(profile))
    );
  }

  logout(): void {
    this.user.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.user();
  }
}
