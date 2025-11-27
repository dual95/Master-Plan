import { useState } from 'react';
import type { CalendarEvent } from '../../types';
import { useApp } from '../../hooks/useApp';
import './LookerExport.css';

interface ExportOptions {
  format: 'csv' | 'json' | 'sheets';
  dateRange: 'all' | 'month' | 'quarter' | 'year';
  includeFields: {
    title: boolean;
    description: boolean;
    start: boolean;
    end: boolean;
    priority: boolean;
    status: boolean;
    category: boolean;
    assignee: boolean;
  };
}

const defaultExportOptions: ExportOptions = {
  format: 'csv',
  dateRange: 'all',
  includeFields: {
    title: true,
    description: true,
    start: true,
    end: true,
    priority: true,
    status: true,
    category: true,
    assignee: true,
  }
};

export function LookerExport() {
  const { state } = useApp();
  const [options, setOptions] = useState<ExportOptions>(defaultExportOptions);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');

  const updateOptions = (newOptions: Partial<ExportOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  };

  const updateIncludeFields = (field: keyof ExportOptions['includeFields'], value: boolean) => {
    setOptions(prev => ({
      ...prev,
      includeFields: {
        ...prev.includeFields,
        [field]: value
      }
    }));
  };

  const filterEventsByDateRange = (events: CalendarEvent[], range: string): CalendarEvent[] => {
    if (range === 'all') return events;
    
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return events.filter(event => new Date(event.start) >= startDate);
  };

  const exportToCSV = (events: CalendarEvent[]): string => {
    const fields = Object.entries(options.includeFields)
      .filter(([_, include]) => include)
      .map(([field, _]) => field);
    
    const headers = fields.map(field => {
      switch (field) {
        case 'title': return 'Título';
        case 'description': return 'Descripción';
        case 'start': return 'Fecha Inicio';
        case 'end': return 'Fecha Fin';
        case 'priority': return 'Prioridad';
        case 'status': return 'Estado';
        case 'category': return 'Categoría';
        case 'assignee': return 'Asignado';
        default: return field;
      }
    });

    const rows = events.map(event => 
      fields.map(field => {
        const value = event[field as keyof CalendarEvent];
        if (field === 'start' || field === 'end') {
          return new Date(value as string).toLocaleString('es-ES');
        }
        return `"${String(value || '').replace(/"/g, '""')}"`;
      })
    );

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  };

  const exportToJSON = (events: CalendarEvent[]): string => {
    const filteredEvents = events.map(event => {
      const filtered: any = {};
      Object.entries(options.includeFields).forEach(([field, include]) => {
        if (include) {
          filtered[field] = event[field as keyof CalendarEvent];
        }
      });
      return filtered;
    });

    return JSON.stringify(filteredEvents, null, 2);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('Preparando exportación...');

    try {
      const filteredEvents = filterEventsByDateRange(state.events, options.dateRange);
      
      if (filteredEvents.length === 0) {
        setExportStatus('No hay eventos para exportar en el rango seleccionado');
        return;
      }

      setExportStatus(`Exportando ${filteredEvents.length} eventos...`);

      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      
      switch (options.format) {
        case 'csv':
          const csvContent = exportToCSV(filteredEvents);
          downloadFile(csvContent, `master-plan-${timestamp}.csv`, 'text/csv');
          setExportStatus('✅ Archivo CSV descargado exitosamente');
          break;
          
        case 'json':
          const jsonContent = exportToJSON(filteredEvents);
          downloadFile(jsonContent, `master-plan-${timestamp}.json`, 'application/json');
          setExportStatus('✅ Archivo JSON descargado exitosamente');
          break;
          
        case 'sheets':
          setExportStatus('🔄 Creando hoja de cálculo en Google Sheets...');
          // TODO: Implementar exportación directa a Google Sheets
          setExportStatus('⚠️ Exportación directa a Google Sheets no implementada aún. Use CSV por ahora.');
          break;
          
        default:
          throw new Error('Formato de exportación no válido');
      }

    } catch (error) {
      console.error('Error en exportación:', error);
      setExportStatus(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus(''), 5000);
    }
  };

  return (
    <div className="looker-export">
      <div className="export-header">
        <h3>📊 Exportar a Looker Studio</h3>
        <p>Configura y exporta tus datos del calendario para análisis en Looker Studio</p>
      </div>

      <div className="export-options">
        <div className="option-group">
          <h4>Formato de exportación</h4>
          <div className="format-options">
            <label className="radio-option">
              <input
                type="radio"
                value="csv"
                checked={options.format === 'csv'}
                onChange={(e) => updateOptions({ format: e.target.value as 'csv' })}
              />
              <span>CSV (recomendado para Looker Studio)</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                value="json"
                checked={options.format === 'json'}
                onChange={(e) => updateOptions({ format: e.target.value as 'json' })}
              />
              <span>JSON</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                value="sheets"
                checked={options.format === 'sheets'}
                onChange={(e) => updateOptions({ format: e.target.value as 'sheets' })}
              />
              <span>Google Sheets (próximamente)</span>
            </label>
          </div>
        </div>

        <div className="option-group">
          <h4>Rango de fechas</h4>
          <select
            value={options.dateRange}
            onChange={(e) => updateOptions({ dateRange: e.target.value as ExportOptions['dateRange'] })}
            className="date-range-select"
          >
            <option value="all">Todos los eventos</option>
            <option value="month">Último mes</option>
            <option value="quarter">Últimos 3 meses</option>
            <option value="year">Último año</option>
          </select>
        </div>

        <div className="option-group">
          <h4>Campos a incluir</h4>
          <div className="fields-grid">
            {Object.entries(options.includeFields).map(([field, checked]) => (
              <label key={field} className="checkbox-option">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updateIncludeFields(field as keyof ExportOptions['includeFields'], e.target.checked)}
                />
                <span>{field === 'title' ? 'Título' :
                       field === 'description' ? 'Descripción' :
                       field === 'start' ? 'Fecha Inicio' :
                       field === 'end' ? 'Fecha Fin' :
                       field === 'priority' ? 'Prioridad' :
                       field === 'status' ? 'Estado' :
                       field === 'category' ? 'Categoría' :
                       field === 'assignee' ? 'Asignado' : field}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="export-summary">
        <p>
          <strong>Resumen:</strong> Se exportarán{' '}
          <span className="highlight">
            {filterEventsByDateRange(state.events, options.dateRange).length}
          </span>{' '}
          eventos en formato <span className="highlight">{options.format.toUpperCase()}</span>
        </p>
      </div>

      <div className="export-actions">
        <button
          onClick={handleExport}
          disabled={isExporting || state.events.length === 0}
          className="export-button"
        >
          {isExporting ? '🔄 Exportando...' : '📤 Exportar Datos'}
        </button>
      </div>

      {exportStatus && (
        <div className={`export-status ${exportStatus.includes('❌') ? 'error' : exportStatus.includes('✅') ? 'success' : 'info'}`}>
          {exportStatus}
        </div>
      )}

      <div className="looker-instructions">
        <h4>📋 Cómo importar en Looker Studio</h4>
        <ol>
          <li>Descarga el archivo CSV usando el botón de arriba</li>
          <li>Ve a <a href="https://lookerstudio.google.com" target="_blank" rel="noopener noreferrer">Looker Studio</a></li>
          <li>Crea un nuevo reporte o abre uno existente</li>
          <li>Haz clic en "Agregar datos" y selecciona "Subir archivo"</li>
          <li>Sube tu archivo CSV descargado</li>
          <li>Configura los tipos de datos y crea tus visualizaciones</li>
        </ol>
      </div>
    </div>
  );
}
