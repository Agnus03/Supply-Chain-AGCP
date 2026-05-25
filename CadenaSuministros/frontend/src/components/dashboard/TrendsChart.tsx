import { memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { TrendPoint } from '../../types';

interface TrendsChartProps {
  data: TrendPoint[];
  loading?: boolean;
  onRetry?: () => void;
}

export const TrendsChart = memo(function TrendsChart({ data, loading, onRetry }: TrendsChartProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-header"><span className="card-title">Tendencia Temp / Humedad</span></div>
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="card-header"><span className="card-title">Tendencia Temp / Humedad</span></div>
        <div style={{ padding: '2rem 1rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>📊</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            Sin datos de tendencia en las últimas 24h
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '1rem' }}>
            El simulador genera una lectura cada hora. Vuelve pronto o agrega lecturas manualmente.
          </p>
          {onRetry && (
            <button className="btn btn-outline btn-sm" onClick={onRetry}>
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Tendencia Temp / Humedad</span>
        <span className="text-xs text-secondary">Últimas 24h</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--success)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getHours().toString().padStart(2, '0')}:00`;
            }}
            stroke="var(--border)"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            stroke="var(--border)"
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.8125rem',
            }}
            labelFormatter={(v) => new Date(v).toLocaleString('es-CO')}
          />
          <Area
            type="monotone"
            dataKey="avgTemperature"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#tempGrad)"
            name="Temp °C"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="avgHumidity"
            stroke="var(--success)"
            strokeWidth={2}
            fill="url(#humGrad)"
            name="Humedad %"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        <span className="chart-legend-item"><span className="chart-legend-line" style={{ background: 'var(--primary)' }} /> Temp °C</span>
        <span className="chart-legend-item"><span className="chart-legend-line" style={{ background: 'var(--success)' }} /> Humedad %</span>
      </div>
    </div>
  );
});
