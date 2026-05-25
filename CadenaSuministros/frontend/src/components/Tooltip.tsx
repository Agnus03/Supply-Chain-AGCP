interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  return (
    <div className="tooltip-wrapper" style={{ position: 'relative', display: 'inline-flex' }}>
      {children}
      <span className="tooltip-text" style={{
        position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
        background: 'var(--surface)', color: 'var(--text)', padding: '0.375rem 0.625rem',
        borderRadius: 'var(--radius)', fontSize: '0.75rem', whiteSpace: 'nowrap',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'none', opacity: 0,
        transition: 'opacity 0.15s', zIndex: 100,
      }}>
        {text}
      </span>
      <style>{`
        .tooltip-wrapper:hover .tooltip-text { opacity: 1; }
      `}</style>
    </div>
  );
}
