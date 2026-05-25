import { useCallback, useSyncExternalStore } from 'react';
import { commandHistory, type Command } from '../commands/Command';

export function useCommand() {
  const canUndo = useSyncExternalStore(
    cb => commandHistory.subscribe(cb),
    () => commandHistory.canUndo(),
    () => commandHistory.canUndo(),
  );

  const canRedo = useSyncExternalStore(
    cb => commandHistory.subscribe(cb),
    () => commandHistory.canRedo(),
    () => commandHistory.canRedo(),
  );

  const execute = useCallback(async <T>(command: Command<T>): Promise<T> => {
    return commandHistory.execute(command);
  }, []);

  const undo = useCallback(async () => {
    await commandHistory.undo();
  }, []);

  const redo = useCallback(async () => {
    await commandHistory.redo();
  }, []);

  return { execute, undo, redo, canUndo, canRedo };
}
