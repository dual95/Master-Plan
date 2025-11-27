
import { useState } from 'react';
import { AppProvider } from './hooks/useApp';
import { MasterCalendar } from './features/calendar/MasterCalendar';
import { DriveConnect } from './features/drive/DriveConnect';
import { LookerExport } from './features/looker/LookerExport';
import { SampleDataLoader } from './components/SampleDataLoader';
import './App.css';

type TabType = 'calendar' | 'drive' | 'export';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <MasterCalendar />;
      case 'drive':
        return (
          <div className="drive-content">
            <DriveConnect />
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
          <h1>🗓️ Master Plan</h1>
          <p>Gestiona tu calendario importando datos desde Google Drive</p>
          
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
