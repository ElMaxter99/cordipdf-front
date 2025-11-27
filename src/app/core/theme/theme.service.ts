import { Injectable, computed, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly darkMode = signal(false);
  readonly isDarkMode = computed(() => this.darkMode());

  constructor() {
    effect(() => {
      const isDark = this.darkMode();
      document.body.classList.toggle('dark-theme', isDark);
    });
  }

  toggle(): void {
    this.darkMode.update((prev) => !prev);
  }

  setDark(value: boolean): void {
    this.darkMode.set(value);
  }
}
