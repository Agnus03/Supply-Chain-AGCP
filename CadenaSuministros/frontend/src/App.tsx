import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { AlertCenter } from './components/AlertCenter';
import { ErrorBoundary } from './components/ErrorBoundary';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const SensorsPage = lazy(() => import('./pages/SensorsPage').then(m => ({ default: m.SensorsPage })));
const ShipmentsPage = lazy(() => import('./pages/ShipmentsPage').then(m => ({ default: m.ShipmentsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ShippingCostPage = lazy(() => import('./pages/ShippingCostPage').then(m => ({ default: m.ShippingCostPage })));
const AuditPanelPage = lazy(() => import('./pages/AuditPanelPage').then(m => ({ default: m.AuditPanelPage })));

const THEME_KEY = 'logistrictrack-theme';

function useTheme() {
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', stored);
  }, []);
}

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '◈' },
  { path: '/productos', label: 'Productos', icon: '◎' },
  { path: '/sensores', label: 'Sensores', icon: '◉' },
  { path: '/envios', label: 'Envíos', icon: '◇' },
  { path: '/costos', label: 'Costos', icon: '$' },
  { path: '/reportes', label: 'Reportes', icon: '□' },
  { path: '/auditoria', label: 'Auditoría', icon: '📋' },
];

function PageFallback() {
  return (
    <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: 32, width: '60%', margin: '0 auto 1rem' }} />
      <div className="skeleton" style={{ height: 100 }} />
      <div className="skeleton" style={{ height: 100 }} />
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-enter">
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function AppLayout() {
  useTheme();

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <NavLink to="/" className="app-logo">
            <span className="app-logo-icon">◇</span>
            <span className="app-logo-text">LogisticTrack</span>
          </NavLink>
          <nav className="app-nav">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-link-icon">{item.icon}</span>
                <span className="nav-link-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="app-header-actions">
            <AlertCenter />
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title="Cambiar tema"
              aria-label="Cambiar tema"
            >
              <span className="theme-toggle-icon" />
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <div className="app-container">
          <Routes>
            <Route path="/" element={<PageShell><DashboardPage /></PageShell>} />
            <Route path="/productos" element={<PageShell><ProductsPage /></PageShell>} />
            <Route path="/sensores" element={<PageShell><SensorsPage /></PageShell>} />
            <Route path="/envios" element={<PageShell><ShipmentsPage /></PageShell>} />
            <Route path="/reportes" element={<PageShell><ReportsPage /></PageShell>} />
            <Route path="/costos" element={<PageShell><ShippingCostPage /></PageShell>} />
            <Route path="/auditoria" element={<PageShell><AuditPanelPage /></PageShell>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
