import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'cordi_theme';
  private readonly themeSignal = signal<'light' | 'dark'>(this.readTheme());

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.applyTheme(this.themeSignal());
  }

  toggle(): void {
    const next = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.themeSignal.set(next);
    localStorage.setItem(this.storageKey, next);
    this.applyTheme(next);
  }

  current(): 'light' | 'dark' {
    return this.themeSignal();
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const body = this.document.body;
    body.classList.remove('light', 'dark');
    body.classList.add(theme);
  }

  private readTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem(this.storageKey) as 'light' | 'dark' | null;
    return stored ?? 'light';
  }
}
