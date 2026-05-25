import { memo } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: string;
  sparklineData?: { v: number }[];
  pulse?: boolean;
}

export const KpiCard = memo(function KpiCard({
  title,
  value,
  subtitle,
  icon,
  color = 'var(--primary)',
  sparklineData,
  pulse,
}: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-header">
        <span className="kpi-card-icon" style={{ color }}>{icon}</span>
        <span className="kpi-card-title">{title}</span>
      </div>
      <div className="kpi-card-main">
        <div className="kpi-card-left">
          <span className={`kpi-card-value ${pulse ? 'kpi-pulse' : ''}`} style={{ color: pulse ? 'var(--danger)' : undefined }}>
            {value}
          </span>
          {subtitle && <span className="kpi-card-subtitle">{subtitle}</span>}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="kpi-card-sparkline">
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`sparkGrad-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#sparkGrad-${title.replace(/\s/g, '')})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
});
