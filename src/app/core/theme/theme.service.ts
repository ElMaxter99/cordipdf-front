import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'cordipdf:theme';
  readonly mode = signal<ThemeMode>(this.restore());

  constructor() {
    this.applyMode(this.mode());
  }

  toggle() {
    const next: ThemeMode = this.mode() === 'light' ? 'dark' : 'light';
    this.mode.set(next);
    this.applyMode(next);
    localStorage.setItem(this.storageKey, next);
  }

  private restore(): ThemeMode {
    const saved = (localStorage.getItem(this.storageKey) as ThemeMode | null) ?? 'light';
    return saved === 'dark' ? 'dark' : 'light';
  }

  private applyMode(mode: ThemeMode) {
    const body = document.querySelector('body');
    if (!body) return;
    body.classList.toggle('dark-theme', mode === 'dark');
    body.classList.toggle('light-theme', mode === 'light');
  }
}
