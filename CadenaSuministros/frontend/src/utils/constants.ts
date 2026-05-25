import type { ShipmentStateConfig, ShipmentStatus } from '../types';

export const SHIPMENT_STATE_CONFIG: Record<ShipmentStatus, ShipmentStateConfig> = {
  PENDING: {
    status: 'PENDING',
    label: 'Pendiente',
    color: '#f59e0b',
    colorVar: 'var(--warning)',
    allowedTransitions: ['IN_TRANSIT', 'DELAYED'],
    isTerminal: false,
    badgeClass: 'badge-pending',
    confirmVariant: null,
  },
  IN_TRANSIT: {
    status: 'IN_TRANSIT',
    label: 'En tránsito',
    color: '#3b82f6',
    colorVar: 'var(--primary)',
    allowedTransitions: ['DELIVERED', 'DELAYED'],
    isTerminal: false,
    badgeClass: 'badge-transit',
    confirmVariant: null,
  },
  DELIVERED: {
    status: 'DELIVERED',
    label: 'Entregado',
    color: '#22c55e',
    colorVar: 'var(--success)',
    allowedTransitions: [],
    isTerminal: true,
    badgeClass: 'badge-delivered',
    confirmVariant: 'primary',
  },
  DELAYED: {
    status: 'DELAYED',
    label: 'Retrasado',
    color: '#ef4444',
    colorVar: 'var(--danger)',
    allowedTransitions: ['PENDING', 'IN_TRANSIT', 'DELIVERED'],
    isTerminal: false,
    badgeClass: 'badge-delayed',
    confirmVariant: 'danger',
  },
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: SHIPMENT_STATE_CONFIG.PENDING.label,
  IN_TRANSIT: SHIPMENT_STATE_CONFIG.IN_TRANSIT.label,
  DELIVERED: SHIPMENT_STATE_CONFIG.DELIVERED.label,
  DELAYED: SHIPMENT_STATE_CONFIG.DELAYED.label,
};

export const STATUS_ORDER: string[] = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'DELAYED'];

export const STATUS_OPTIONS: string[] = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'DELAYED'];

export const LOCATION_OPTIONS: string[] = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Manizales',
];

export const LOCALE = 'es-CO';

export const REFRESH_INTERVALS = {
  DASHBOARD: 30000,
  ALERTS: 30000,
  ALERT_PANEL: 15000,
};
