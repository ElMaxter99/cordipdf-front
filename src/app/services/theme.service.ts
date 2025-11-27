import { Injectable, Renderer2, RendererFactory2, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly renderer: Renderer2;
  private readonly darkModeSignal = signal<boolean>(false);

  readonly isDark = this.darkModeSignal.asReadonly();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  toggle(): void {
    this.setDarkMode(!this.darkModeSignal());
  }

  setDarkMode(enabled: boolean): void {
    this.darkModeSignal.set(enabled);
    const className = 'dark-theme';
    if (enabled) {
      this.renderer.addClass(document.body, className);
    } else {
      this.renderer.removeClass(document.body, className);
    }
  }
}
