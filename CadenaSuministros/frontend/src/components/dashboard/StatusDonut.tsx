import { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SHIPMENT_STATE_CONFIG, STATUS_ORDER } from '../../utils/constants';
import type { ShipmentStatus } from '../../types';

interface StatusDonutProps {
  pending: number;
  transit: number;
  delivered: number;
  delayed: number;
}

const COLORS = STATUS_ORDER.map(s => SHIPMENT_STATE_CONFIG[s as ShipmentStatus].colorVar);

export const StatusDonut = memo(function StatusDonut({ pending, transit, delivered, delayed }: StatusDonutProps) {
  const data = [
    { name: 'Pendiente', value: pending },
    { name: 'En tránsito', value: transit },
    { name: 'Entregado', value: delivered },
    { name: 'Retrasado', value: delayed },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return <div className="empty-state-sm">Sin datos</div>;
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="status-donut">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.8125rem',
            }}
            formatter={((value: number, name: string) => [`${value} (${(value / total * 100).toFixed(0)}%)`, name]) as any}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div key={d.name} className="donut-legend-item">
            <span className="donut-legend-dot" style={{ backgroundColor: COLORS[i] }} />
            <span className="donut-legend-label">{d.name}</span>
            <span className="donut-legend-value">{d.value}</span>
            <span className="donut-legend-pct">{(d.value / total * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
});
