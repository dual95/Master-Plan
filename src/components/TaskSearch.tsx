import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApp } from '../hooks/useApp';
import type { CalendarEvent } from '../types';
import './TaskSearch.css';

interface SearchResult {
  event: CalendarEvent;
  matchType: 'exact' | 'partial';
  formattedDate: string;
}

export function TaskSearch() {
  const { state } = useApp();
  const [searchPO, setSearchPO] = useState('');
  const [searchPOS, setSearchPOS] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Buscar tareas que coincidan con PO y/o POS
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchPO.trim() && !searchPOS.trim()) {
      return [];
    }

    const poLower = searchPO.trim().toLowerCase();
    const posNumber = searchPOS.trim();

    const results: SearchResult[] = [];

    state.events.forEach((event) => {
      let matches = false;
      let matchType: 'exact' | 'partial' = 'partial';

      // Buscar por PO (pedido)
      const hasPOMatch = !!(poLower && event.pedido && 
        event.pedido.toLowerCase().includes(poLower));

      // Buscar por POS
      const hasPOSMatch = !!(posNumber && event.pos && 
        event.pos.toString() === posNumber);

      // Determinar si hay coincidencia
      if (searchPO.trim() && searchPOS.trim()) {
        // Ambos campos: debe coincidir exactamente
        matches = hasPOMatch && hasPOSMatch;
        matchType = 'exact';
      } else if (searchPO.trim()) {
        // Solo PO
        matches = hasPOMatch;
        matchType = 'partial';
      } else if (searchPOS.trim()) {
        // Solo POS
        matches = hasPOSMatch;
        matchType = 'partial';
      }

      if (matches) {
        const startDate = new Date(event.start);
        results.push({
          event,
          matchType,
          formattedDate: format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }),
        });
      }
    });

    // Ordenar por fecha
    results.sort((a, b) => {
      const dateA = new Date(a.event.start).getTime();
      const dateB = new Date(b.event.start).getTime();
      return dateA - dateB;
    });

    return results;
  }, [state.events, searchPO, searchPOS]);

  const handleClear = () => {
    setSearchPO('');
    setSearchPOS('');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in-progress':
        return '#2196f3';
      case 'pending':
        return '#ff9800';
      case 'cancelled':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in-progress':
        return 'En Proceso';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Sin estado';
    }
  };

  return (
    <div className={`task-search ${isExpanded ? 'expanded' : ''}`}>
      <div className="task-search-header">
        <h3>🔍 Buscar Tarea</h3>
        <button 
          className="expand-button"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Contraer' : 'Expandir'}
        >
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {isExpanded && (
        <div className="task-search-content">
          <div className="search-inputs">
            <div className="search-field">
              <label htmlFor="search-po">PO (Pedido):</label>
              <input
                id="search-po"
                type="text"
                placeholder="Ej: 12345"
                value={searchPO}
                onChange={(e) => setSearchPO(e.target.value)}
              />
            </div>

            <div className="search-field">
              <label htmlFor="search-pos">POS:</label>
              <input
                id="search-pos"
                type="number"
                placeholder="Ej: 10"
                value={searchPOS}
                onChange={(e) => setSearchPOS(e.target.value)}
              />
            </div>

            <button 
              className="clear-button"
              onClick={handleClear}
              disabled={!searchPO && !searchPOS}
            >
              🗑️ Limpiar
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              <h4>📋 Resultados ({searchResults.length})</h4>
              <div className="results-list">
                {searchResults.map((result, index) => (
                  <div 
                    key={`${result.event.id}-${index}`} 
                    className={`result-item ${result.matchType}`}
                  >
                    <div className="result-header">
                      <span className="result-title">{result.event.title}</span>
                      {result.matchType === 'exact' && (
                        <span className="exact-badge">✓ Exacto</span>
                      )}
                    </div>
                    
                    <div className="result-info">
                      <div className="info-row">
                        <span className="info-label">📅 Fecha:</span>
                        <span className="info-value">{result.formattedDate}</span>
                      </div>
                      
                      {result.event.pedido && (
                        <div className="info-row">
                          <span className="info-label">📦 PO:</span>
                          <span className="info-value">{result.event.pedido}</span>
                        </div>
                      )}
                      
                      {result.event.pos && (
                        <div className="info-row">
                          <span className="info-label">🔢 POS:</span>
                          <span className="info-value">{result.event.pos}</span>
                        </div>
                      )}
                      
                      {result.event.proyecto && (
                        <div className="info-row">
                          <span className="info-label">🏗️ Proyecto:</span>
                          <span className="info-value">{result.event.proyecto}</span>
                        </div>
                      )}
                      
                      {result.event.componente && (
                        <div className="info-row">
                          <span className="info-label">🔧 Componente:</span>
                          <span className="info-value">{result.event.componente}</span>
                        </div>
                      )}
                      
                      {result.event.machine && (
                        <div className="info-row">
                          <span className="info-label">🏭 Máquina:</span>
                          <span className="info-value">{result.event.machine}</span>
                        </div>
                      )}
                      
                      {result.event.planta && (
                        <div className="info-row">
                          <span className="info-label">🏢 Planta:</span>
                          <span className="info-value">{result.event.planta}</span>
                        </div>
                      )}
                      
                      <div className="info-row">
                        <span className="info-label">📊 Estado:</span>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(result.event.status) }}
                        >
                          {getStatusLabel(result.event.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(searchPO || searchPOS) && searchResults.length === 0 && (
            <div className="no-results">
              <p>❌ No se encontraron tareas con los criterios especificados</p>
              <p className="hint">
                💡 Tip: Intenta buscar solo por PO o por POS para obtener más resultados
              </p>
            </div>
          )}

          {!searchPO && !searchPOS && (
            <div className="search-help">
              <p>💡 Ingresa un PO y/o POS para buscar tareas</p>
              <ul>
                <li>Usa ambos campos para búsqueda exacta</li>
                <li>Usa un solo campo para búsqueda amplia</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
