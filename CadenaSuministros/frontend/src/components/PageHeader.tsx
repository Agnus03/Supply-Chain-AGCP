import { memo } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const PageHeader = memo(function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="section-header">
      <div className={children ? 'section-header-row' : undefined}>
        <div>
          <h1 className="section-title">{title}</h1>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    </div>
  );
});
