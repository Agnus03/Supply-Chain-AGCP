import { ShipmentCreate } from './ShipmentCreate';

interface ShipmentDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShipmentDrawer({ open, onClose, onSuccess }: ShipmentDrawerProps) {
  return (
    <>
      <div className={`drawer-overlay ${open ? 'visible' : ''}`} onClick={onClose} />
      <div className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2 className="drawer-title">Nuevo Envío</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="drawer-body">
          <ShipmentCreate onSuccess={onSuccess} />
        </div>
      </div>
    </>
  );
}
