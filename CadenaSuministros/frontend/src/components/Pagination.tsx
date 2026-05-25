import { useMemo } from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalItems, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const pages = useMemo(() => {
    const result: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) result.push(i);
    } else {
      result.push(1);
      if (currentPage > 3) result.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        result.push(i);
      }
      if (currentPage < totalPages - 2) result.push('...');
      result.push(totalPages);
    }
    return result;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center', padding: '1rem' }}>
      <button className="btn btn-sm btn-outline" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>←</button>
      {pages.map((p, i) =>
        typeof p === 'string' ? (
          <span key={`ellipsis-${i}`} className="text-xs text-secondary" style={{ padding: '0 0.25rem' }}>...</span>
        ) : (
          <button
            key={p}
            className={`btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button className="btn btn-sm btn-outline" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>→</button>
    </div>
  );
}
