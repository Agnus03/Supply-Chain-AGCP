import { memo, useEffect, useState } from 'react';

export interface ToastItem {
  id: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

interface AlertToastProps {
  alerts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ICONS: Record<string, string> = {
  critical: '🔴',
  warning: '🟡',
  info: '🔵',
};

export function AlertToast({ alerts, onDismiss }: AlertToastProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="toast-stack">
      {alerts.map(alert => (
        <ToastItem key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const ToastItem = memo(function ToastItem({ alert, onDismiss }: { alert: ToastItem; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(alert.id), 300);
    }, 8000);
    return () => clearTimeout(timer);
  }, [alert.id, onDismiss]);

  const severityColors = {
    critical: 'var(--danger)',
    warning: 'var(--warning)',
    info: 'var(--primary)',
  };

  return (
    <div className={`toast-item ${visible ? 'toast-item-visible' : ''}`}>
      <div className="toast-item-inner" style={{ borderLeftColor: severityColors[alert.severity] }}>
        <span className="toast-item-icon">{ICONS[alert.severity]}</span>
        <span className="toast-item-message">{alert.message}</span>
        <button
          className="toast-item-close"
          onClick={() => { setVisible(false); setTimeout(() => onDismiss(alert.id), 300); }}
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  );
});
