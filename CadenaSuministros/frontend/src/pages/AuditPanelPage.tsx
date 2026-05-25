import { useState, useEffect, useCallback } from 'react';
import { auditService } from '../api/auditService';
import { PageHeader } from '../components/PageHeader';

export function AuditPanelPage() {
  const [commands, setCommands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const cmds = await auditService.getCommandHistory();
      setCommands(cmds);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial de comandos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div>
      <PageHeader title="Panel de Auditoría" subtitle="Historial de comandos ejecutados y operaciones realizadas">
        <button className="btn btn-outline btn-sm" onClick={fetchAll}>Actualizar</button>
      </PageHeader>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Comandos Ejecutados</span>
          <span className="text-xs text-secondary">{commands.length} operaciones</span>
        </div>
        {loading ? (
          <div className="card-body"><div className="skeleton" style={{ height: 300 }} /></div>
        ) : error ? (
          <div className="card-body"><p style={{ color: 'var(--danger)' }}>Error: {error}</p></div>
        ) : commands.length === 0 ? (
          <div className="card-body"><p className="empty-state-sm">No hay comandos registrados. Realiza operaciones en la sección de Envíos para ver el historial.</p></div>
        ) : (
          <div className="overflow-auto">
            <table className="table-enhanced">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Descripción</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {commands.map((cmd, i) => {
                  const isUndo = cmd.toLowerCase().includes('undo') || cmd.toLowerCase().includes('reverse');
                  const isStatus = cmd.startsWith('UpdateStatus');
                  const isLocation = cmd.startsWith('UpdateLocation');
                  const isCreate = cmd.startsWith('CreateShipment');
                  return (
                    <tr key={i} className="row-enter">
                      <td className="text-xs text-secondary font-mono">{commands.length - i}</td>
                      <td className="font-mono text-sm">{cmd}</td>
                      <td>
                        {isCreate ? <span className="badge badge-delivered">Creación</span>
                          : isStatus ? <span className="badge badge-transit">Estado</span>
                          : isLocation ? <span className="badge badge-pending">Ubicación</span>
                          : isUndo ? <span className="badge badge-delayed">Reversión</span>
                          : <span className="badge">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--secondary)' }}>
          Este panel muestra el historial de comandos ejecutados en el backend. Los comandos se almacenan en el Invoker con un máximo de 50 entradas.
        </div>
      </div>
    </div>
  );
}

export default AuditPanelPage;
