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

  return (
    <div className="card">
      <h3 className="card-title mb-4">Registrar Lectura</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="shipmentId">Seleccionar Envío</label>
          <select
            id="shipmentId"
            value={formData.shipmentId}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, shipmentId: e.target.value }))
            }
            required
            disabled={loadingShipments}
          >
            <option value="">
              {loadingShipments ? 'Cargando...' : '-- Seleccionar --'}
            </option>
            {shipments.map((shipment) => (
              <option key={shipment.id} value={shipment.id}>
                {shipment.id.slice(0, 8)} -{' '}
                {STATUS_LABELS[shipment.status] || shipment.status} (
                {shipment.currentLocation})
              </option>
            ))}
          </select>
          {shipments.length === 0 && !loadingShipments && (
            <p className="text-xs text-secondary mt-2">
              No hay envíos disponibles. Crea un envío primero.
            </p>
          )}
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="temperatureC">Temperatura (°C)</label>
            <input
              id="temperatureC"
              type="number"
              step="0.1"
              value={formData.temperatureC ?? ''}
              onChange={handleNumber('temperatureC')}
              placeholder="25.0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="humidityPct">Humedad (%)</label>
            <input
              id="humidityPct"
              type="number"
              step="0.1"
              value={formData.humidityPct ?? ''}
              onChange={handleNumber('humidityPct')}
              placeholder="60.0"
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="latitude">Latitud</label>
            <input
              id="latitude"
              type="number"
              step="0.0001"
              value={formData.latitude ?? ''}
              onChange={handleNumber('latitude')}
              placeholder="4.7110"
            />
          </div>
          <div className="form-group">
            <label htmlFor="longitude">Longitud</label>
            <input
              id="longitude"
              type="number"
              step="0.0001"
              value={formData.longitude ?? ''}
              onChange={handleNumber('longitude')}
              placeholder="-74.0721"
            />
          </div>
        </div>

        {error && (
          <div className="alert-badge alert-danger w-full mb-4" style={{ justifyContent: 'center' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading || loadingShipments || shipments.length === 0}
        >
          {loading ? 'Registrando...' : 'Registrar Lectura'}
        </button>
      </form>
    </div>
  );
}

export default SensorRegister;
