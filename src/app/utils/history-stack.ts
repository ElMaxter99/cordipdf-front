export class HistoryStack<T> {
  private readonly undoStack: T[] = [];
  private readonly redoStack: T[] = [];

  push(state: T): void {
    this.undoStack.push(structuredClone(state));
    this.redoStack.length = 0;
  }

  undo(current: T): T | null {
    if (!this.undoStack.length) {
      return null;
    }
    this.redoStack.push(structuredClone(current));
    return structuredClone(this.undoStack.pop() as T);
  }

  redo(current: T): T | null {
    if (!this.redoStack.length) {
      return null;
    }
    this.undoStack.push(structuredClone(current));
    return structuredClone(this.redoStack.pop() as T);
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  reset(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
