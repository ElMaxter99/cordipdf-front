import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UndoRedoService<T> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];

  push(state: T): void {
    this.undoStack.push(this.clone(state));
    this.redoStack = [];
  }

  undo(current: T): T | null {
    if (!this.undoStack.length) {
      return null;
    }
    this.redoStack.push(this.clone(current));
    return this.clone(this.undoStack.pop() as T);
  }

  redo(current: T): T | null {
    if (!this.redoStack.length) {
      return null;
    }
    this.undoStack.push(this.clone(current));
    return this.clone(this.redoStack.pop() as T);
  }

  private clone(state: T): T {
    return JSON.parse(JSON.stringify(state));
  }
}
