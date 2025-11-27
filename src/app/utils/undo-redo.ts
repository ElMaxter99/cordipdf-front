export class UndoRedoStack<T> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];

  constructor(private readonly cloneFn: (payload: T) => T) {}

  push(state: T): void {
    this.undoStack.push(this.cloneFn(state));
    this.redoStack = [];
  }

  undo(current: T): T | null {
    if (this.undoStack.length === 0) {
      return null;
    }
    const prev = this.undoStack.pop()!;
    this.redoStack.push(this.cloneFn(current));
    return this.cloneFn(prev);
  }

  redo(current: T): T | null {
    if (this.redoStack.length === 0) {
      return null;
    }
    const next = this.redoStack.pop()!;
    this.undoStack.push(this.cloneFn(current));
    return this.cloneFn(next);
  }

  hasUndo(): boolean {
    return this.undoStack.length > 0;
  }

  hasRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
