import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import type { CalendarEvent } from '../types';
import './QuickTaskPicker.css';

interface QuickTaskPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (task: CalendarEvent) => void;
  targetDate?: Date;
  targetLine?: string;
}

interface SearchResult {
  event: CalendarEvent;
  matchType: 'exact' | 'partial';
}

export function QuickTaskPicker({ 
  isOpen, 
  onClose, 
  onSelectTask,
  targetDate,
  targetLine 
}: QuickTaskPickerProps) {
  const { state } = useApp();
  const [searchPO, setSearchPO] = useState('');
  const [searchPOS, setSearchPOS] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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
        results.push({
          event,
          matchType,
        });
      }
    });

    // Ordenar: exactos primero, luego por pedido
    results.sort((a, b) => {
      if (a.matchType === 'exact' && b.matchType !== 'exact') return -1;
      if (a.matchType !== 'exact' && b.matchType === 'exact') return 1;
      return (a.event.pedido || '').localeCompare(b.event.pedido || '');
    });

    return results;
  }, [state.events, searchPO, searchPOS]);

  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
      e.preventDefault();
      handleSelectTask(searchResults[selectedIndex].event);
    }
  };

  const handleSelectTask = (task: CalendarEvent) => {
    onSelectTask(task);
    setSearchPO('');
    setSearchPOS('');
    setSelectedIndex(0);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="quick-picker-backdrop" onClick={handleBackdropClick}>
      <div className="quick-picker-modal">
        <div className="quick-picker-header">
          <h3>🔍 Buscar Task</h3>
          {targetLine && <span className="target-info">📍 {targetLine}</span>}
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="quick-picker-search">
          <div className="search-field">
            <label>PO / Pedido:</label>
            <input
              ref={inputRef}
              type="text"
              value={searchPO}
              onChange={(e) => {
                setSearchPO(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ej: 4506113490"
            />
          </div>

          <div className="search-field">
            <label>POS:</label>
            <input
              type="text"
              value={searchPOS}
              onChange={(e) => {
                setSearchPOS(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ej: 30"
            />
          </div>
        </div>

        <div className="quick-picker-results">
          {searchResults.length === 0 && (searchPO || searchPOS) && (
            <div className="no-results">
              <p>No se encontraron tasks</p>
              <small>Intenta con otro PO o POS</small>
            </div>
          )}

          {searchResults.length === 0 && !searchPO && !searchPOS && (
            <div className="no-results">
              <p>👆 Ingresa un PO o POS para buscar</p>
            </div>
          )}

          {searchResults.map((result, index) => (
            <div
              key={result.event.id}
              className={`result-item ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => handleSelectTask(result.event)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="result-header">
                <span className="result-pedido">📦 {result.event.pedido}</span>
                <span className="result-pos">#{result.event.pos}</span>
                {result.matchType === 'exact' && (
                  <span className="exact-badge">✓ Exacto</span>
                )}
              </div>
              
              <div className="result-details">
                <span className="result-proyecto">
                  {result.event.proyecto || 'Sin proyecto'}
                </span>
                
                {result.event.planta === 'P2' && result.event.linea && (
                  <span className="result-location">📍 {result.event.linea}</span>
                )}
                
                {result.event.planta === 'P3' && result.event.processType && (
                  <span className="result-location">⚙️ {result.event.processType}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="quick-picker-footer">
          <small>💡 Usa ↑↓ para navegar, Enter para seleccionar, Esc para cerrar</small>
        </div>
      </div>
    </div>
  );
}
