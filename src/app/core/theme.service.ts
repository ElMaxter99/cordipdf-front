import { Injectable, Signal, signal } from '@angular/core';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'cordipdf-theme';
  private readonly themeSignal = signal<ThemeMode>('light');

  constructor() {
    const saved = (localStorage.getItem(this.storageKey) as ThemeMode | null) ?? 'light';
    this.apply(saved);
  }

  theme(): Signal<ThemeMode> {
    return this.themeSignal.asReadonly();
  }

  toggle(): void {
    this.apply(this.themeSignal() === 'light' ? 'dark' : 'light');
  }

  apply(mode: ThemeMode): void {
    this.themeSignal.set(mode);
    const body = document.body;
    body.classList.remove('dark-theme', 'light-theme');
    body.classList.add(mode === 'dark' ? 'dark-theme' : 'light-theme');
    body.setAttribute('data-theme', mode);
    localStorage.setItem(this.storageKey, mode);
  }
}
