export interface Command<T = unknown> {
  execute(): Promise<T>;
  undo(): Promise<void>;
  getDescription(): string;
}

export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxSize = 20;
  private listeners = new Set<() => void>();

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async execute<T>(command: Command<T>): Promise<T> {
    const result = await command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    if (this.undoStack.length > this.maxSize) this.undoStack.shift();
    this.notify();
    return result;
  }

  async undo(): Promise<void> {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    try {
      await cmd.undo();
      this.redoStack.push(cmd);
    } catch (e) {
      this.undoStack.push(cmd);
      throw e;
    } finally {
      this.notify();
    }
  }

  async redo(): Promise<void> {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    try {
      await cmd.execute();
      this.undoStack.push(cmd);
    } catch (e) {
      this.redoStack.push(cmd);
      throw e;
    } finally {
      this.notify();
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}

export const commandHistory = new CommandHistory();
