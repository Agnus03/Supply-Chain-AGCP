import { useCallback } from 'react';

interface ExportButtonProps {
  data: Record<string, any>[];
  filename?: string;
}

export function ExportButton({ data, filename = 'export' }: ExportButtonProps) {
  const exportCSV = useCallback(() => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val == null) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(',')
      ),
    ];
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, filename]);

  const exportJSON = useCallback(() => {
    if (data.length === 0) return;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, filename]);

  return (
    <div className="btn-group" style={{ display: 'flex', gap: '0.25rem' }}>
      <button className="btn btn-sm btn-outline" onClick={exportCSV} disabled={data.length === 0} title="Exportar a CSV">
        📥 CSV
      </button>
      <button className="btn btn-sm btn-outline" onClick={exportJSON} disabled={data.length === 0} title="Exportar a JSON">
        📥 JSON
      </button>
    </div>
  );
}
