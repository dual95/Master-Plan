
import { useState, useEffect } from 'react';
import { AppProvider } from './hooks/useApp';
import { MasterCalendar } from './features/calendar/MasterCalendar';
import { DriveConnect } from './features/drive/DriveConnect';
import { LookerExport } from './features/looker/LookerExport';
import { SampleDataLoader } from './components/SampleDataLoader';
import { ProductionLoader } from './components/ProductionLoader';
import { Login } from './components/Login';
import { authService } from './services/authService';
import type { User } from './services/authService';
import './App.css';

type TabType = 'calendar' | 'drive' | 'export';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setAuthLoading(true);
    try {
      if (authService.isAuthenticated()) {
        const result = await authService.getCurrentUser();
        if (result.success && result.user) {
          setCurrentUser(result.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    checkAuth();
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('calendar');
  };

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">⏳</div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <MasterCalendar />;
      case 'drive':
        return (
          <div className="drive-content">
            <DriveConnect />
            <ProductionLoader />
            <SampleDataLoader />
          </div>
        );
      case 'export':
        return <LookerExport />;
      default:
        return <MasterCalendar />;
    }
  };

  return (
    <AppProvider>
      <div className="app">
        <header className="app-header">
          <div className="app-header-content">
            <div>
              <h1>🗓️ Master Plan</h1>
              <p>Gestiona tu calendario importando datos desde Google Drive</p>
            </div>
            <div className="user-info">
              <span className="user-name">👤 {currentUser?.name}</span>
              <button className="logout-button" onClick={handleLogout}>
                🚪 Salir
              </button>
            </div>
          </div>
          
          <nav className="app-tabs">
            <button
              className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              📅 Calendario
            </button>
            <button
              className={`tab ${activeTab === 'drive' ? 'active' : ''}`}
              onClick={() => setActiveTab('drive')}
            >
              🔗 Conexión
            </button>
            <button
              className={`tab ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              📊 Exportar
            </button>
          </nav>
        </header>
        
        <main className="app-main">
          {renderContent()}
        </main>
        
        <footer className="app-footer">
          <p>© 2025 Master Plan - Creado con React + TypeScript</p>
        </footer>
      </div>
    </AppProvider>
  );
}

export default App;
