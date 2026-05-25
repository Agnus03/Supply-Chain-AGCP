import { useEffect, useCallback } from 'react';

export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  const beforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', beforeUnload);
      return () => window.removeEventListener('beforeunload', beforeUnload);
    }
  }, [hasUnsavedChanges, beforeUnload]);
}

export function useConfirmLeave(hasUnsavedChanges: boolean, message?: string) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (_e: PopStateEvent) => {
      if (!window.confirm(message ?? 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [hasUnsavedChanges, message]);
}
