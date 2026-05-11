import { useState, useEffect } from 'react';
import SensorsPage from './pages/SensorsPage';
import ShipmentsPage from './pages/ShipmentsPage';
import ReportsPage from './pages/ReportsPage';
import ProductsPage from './pages/ProductsPage';

type Page = 'products' | 'sensors' | 'shipments' | 'reports';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('products');

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('logistictrack-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('logistictrack-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  const navItems: { id: Page; label: string }[] = [
    { id: 'products', label: 'Productos' },
    { id: 'sensors', label: 'Sensores' },
    { id: 'shipments', label: 'Envíos' },
    { id: 'reports', label: 'Reportes' },
  ];

  return (
    <div>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <span className="app-logo-icon">🚚</span>
            <span>LogisticTrack</span>
          </div>
          <nav className="app-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <main style={{ paddingTop: '1.5rem' }}>
        <div className="container">
          {currentPage === 'products' && <ProductsPage />}
          {currentPage === 'sensors' && <SensorsPage />}
          {currentPage === 'shipments' && <ShipmentsPage />}
          {currentPage === 'reports' && <ReportsPage />}
        </div>
      </main>
    </div>
  );
}

export default App;
