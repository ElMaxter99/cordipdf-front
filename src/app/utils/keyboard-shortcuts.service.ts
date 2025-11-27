import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutsService implements OnDestroy {
  private subscription = new Subscription();

  registerSaveShortcut(callback: () => void): void {
    const sub = fromEvent<KeyboardEvent>(window, 'keydown').subscribe((event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        callback();
      }
    });
    this.subscription.add(sub);
  }

  cleanup(): void {
    this.subscription.unsubscribe();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
