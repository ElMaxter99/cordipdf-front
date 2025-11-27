export class HistoryStack<T> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];

  constructor(private readonly limit = 30) {}

  push(state: T): void {
    this.undoStack.push(structuredClone(state));
    if (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(current: T): T | undefined {
    if (!this.undoStack.length) return undefined;
    const prev = this.undoStack.pop();
    if (prev) {
      this.redoStack.push(structuredClone(current));
    }
    return prev;
  }

  redo(current: T): T | undefined {
    if (!this.redoStack.length) return undefined;
    const next = this.redoStack.pop();
    if (next) {
      this.undoStack.push(structuredClone(current));
    }
    return next;
  }
}
