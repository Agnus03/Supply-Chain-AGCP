import { useState, useCallback } from 'react';
import type { SortConfig, SortDirection } from '../types';

export function useSort<T extends Record<string, any>>(defaultKey?: keyof T) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: (defaultKey ?? '') as unknown as keyof T,
    direction: 'asc' as SortDirection,
  });

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const sorted = useCallback((data: T[], config?: SortConfig<T>) => {
    const cfg = config ?? sortConfig;
    if (!cfg || !cfg.key) return data;
    return [...data].sort((a, b) => {
      const aVal = a[cfg.key];
      const bVal = b[cfg.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return cfg.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return cfg.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortConfig]);

  return { sortConfig, handleSort, sorted };
}
