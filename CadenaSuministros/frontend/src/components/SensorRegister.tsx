import { useState, useEffect } from 'react';
import type { Shipment, SensorReadingRequest } from '../types';
import { shipmentService } from '../api/shipmentService';
import { sensorService } from '../api/sensorService';
import { STATUS_LABELS } from '../utils/constants';

interface SensorRegisterProps {
  onSuccess: () => void;
}

export function SensorRegister({ onSuccess }: SensorRegisterProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(true);

  const [formData, setFormData] = useState<SensorReadingRequest>({
    shipmentId: '',
    temperatureC: null,
    humidityPct: null,
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadShipments = async () => {
      try {
        const data = await shipmentService.listAll();
        setShipments(data);
      } catch (err) {
        console.error('Error loading shipments:', err);
      } finally {
        setLoadingShipments(false);
      }
    };
    loadShipments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sensorService.create(formData);
      setFormData({
        shipmentId: '',
        temperatureC: null,
        humidityPct: null,
        latitude: null,
        longitude: null,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const handleNumber =
    (field: keyof SensorReadingRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: value === '' ? null : parseFloat(value),
      }));
    };

  const canSubmit = formData.shipmentId && shipments.length > 0;

  return (
    <div className="sen-form">
      <div className="sen-form-head">
        <div className="sen-form-icon">📡</div>
        <div>
          <div className="sen-form-title">Nueva Lectura</div>
          <div className="sen-form-sub">Registrar medición de sensores</div>
        </div>
      </div>

      <form className="sen-form-body" onSubmit={handleSubmit}>
        <div className="sen-field">
          <label className="sen-label" htmlFor="sen-shipment">Envío</label>
          <select
            id="sen-shipment"
            className="sen-select"
            value={formData.shipmentId}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, shipmentId: e.target.value }))
            }
            required
            disabled={loadingShipments}
          >
            <option value="">
              {loadingShipments ? 'Cargando...' : '— Seleccionar —'}
            </option>
            {shipments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id.slice(0, 8)} — {STATUS_LABELS[s.status] || s.status} ({s.currentLocation})
              </option>
            ))}
          </select>
          {shipments.length === 0 && !loadingShipments && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              No hay envíos disponibles. Crea un envío primero.
            </p>
          )}
        </div>

        <div className="sen-form-row">
          <div className="sen-field">
            <label className="sen-label" htmlFor="sen-temp">Temperatura (°C)</label>
            <input
              id="sen-temp"
              className="sen-input"
              type="number"
              step="0.1"
              value={formData.temperatureC ?? ''}
              onChange={handleNumber('temperatureC')}
              placeholder="25.0"
            />
          </div>
          <div className="sen-field">
            <label className="sen-label" htmlFor="sen-hum">Humedad (%)</label>
            <input
              id="sen-hum"
              className="sen-input"
              type="number"
              step="0.1"
              value={formData.humidityPct ?? ''}
              onChange={handleNumber('humidityPct')}
              placeholder="60.0"
            />
          </div>
        </div>

        <div className="sen-form-row">
          <div className="sen-field">
            <label className="sen-label" htmlFor="sen-lat">Latitud</label>
            <input
              id="sen-lat"
              className="sen-input"
              type="number"
              step="0.0001"
              value={formData.latitude ?? ''}
              onChange={handleNumber('latitude')}
              placeholder="4.7110"
            />
          </div>
          <div className="sen-field">
            <label className="sen-label" htmlFor="sen-lng">Longitud</label>
            <input
              id="sen-lng"
              className="sen-input"
              type="number"
              step="0.0001"
              value={formData.longitude ?? ''}
              onChange={handleNumber('longitude')}
              placeholder="-74.0721"
            />
          </div>
        </div>

        {error && (
          <div style={{
            fontSize: '0.75rem', color: 'var(--danger)',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.75rem', marginBottom: '0.75rem',
            lineHeight: '1.4',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="sen-submit"
          disabled={loading || loadingShipments || !canSubmit}
        >
          {loading ? (
            <span className="cp-submit-loading">
              <span className="cp-spinner" />
              Registrando...
            </span>
          ) : (
            '📡 Registrar Lectura'
          )}
        </button>
      </form>
    </div>
  );
}

export default SensorRegister;
