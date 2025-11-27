export class UndoRedoStack<T> {
  private stack: T[] = [];
  private redoStack: T[] = [];

  constructor(private readonly limit = 30) {}

  push(state: T) {
    this.stack.push(this.clone(state));
    if (this.stack.length > this.limit) this.stack.shift();
    this.redoStack = [];
  }

  undo(current: T): T | null {
    if (!this.stack.length) return null;
    const last = this.stack.pop() as T;
    this.redoStack.push(this.clone(current));
    return this.clone(last);
  }

  redo(current: T): T | null {
    if (!this.redoStack.length) return null;
    const next = this.redoStack.pop() as T;
    this.stack.push(this.clone(current));
    return this.clone(next);
  }

  private clone(state: T): T {
    return structuredClone(state);
  }
}
