import React, { useState, useEffect } from 'react';
import { driveService } from '../../services/googleDrive';
import type { DriveFile, SpreadsheetData, ColumnMapping, CalendarEvent } from '../../types';
import { useApp, useAppActions } from '../../hooks/useApp';
import { GoogleSetupInstructions } from '../../components/GoogleSetupInstructions';
import { DebugInfo } from '../../components/DebugInfo';
import { GoogleTestConnection } from '../../components/GoogleTestConnection';
import './DriveConnect.css';

export function DriveConnect() {
  const { state } = useApp();
  const { setSelectedFile, setSpreadsheetData, setColumnMapping, setLoading, setError, setEvents } = useAppActions();
  
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    checkSignInStatus();
  }, []);

  const checkSignInStatus = () => {
    const signedIn = driveService.isSignedIn();
    setIsSignedIn(signedIn);
    if (signedIn) {
      setCurrentUser(driveService.getCurrentUser());
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const success = await driveService.signIn();
      if (success) {
        setIsSignedIn(true);
        setCurrentUser(driveService.getCurrentUser());
        await loadSpreadsheets();
      } else {
        setError('No se pudo iniciar sesión en Google Drive');
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      setError(error.message || 'Error al conectar con Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await driveService.signOut();
      setIsSignedIn(false);
      setCurrentUser(null);
      setDriveFiles([]);
      setSelectedFile(null);
      setSpreadsheetData(null);
      setColumnMapping(null);
    } catch (error) {
      console.error('Sign-out error:', error);
      setError('Error al cerrar sesión');
    }
  };

  const loadSpreadsheets = async () => {
    try {
      setLoading(true);
      const files = await driveService.listSpreadsheets();
      setDriveFiles(files);
    } catch (error) {
      console.error('Error loading spreadsheets:', error);
      setError('Error al cargar las hojas de cálculo');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: DriveFile) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedFile(file);
      
      const data = await driveService.readSpreadsheet(file.id);
      setSpreadsheetData(data);
      setShowMapping(true);
    } catch (error) {
      console.error('Error reading spreadsheet:', error);
      setError('Error al leer la hoja de cálculo');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingSubmit = (mapping: ColumnMapping) => {
    if (!state.spreadsheetData) return;

    try {
      setLoading(true);
      const events: CalendarEvent[] = [];

      state.spreadsheetData.rows.forEach((row, index) => {
        const title = row[mapping.title] as string;
        const startValue = row[mapping.start];
        
        if (!title || !startValue) return;

        let start: Date;
        let end: Date;

        // Intentar parsear la fecha de inicio
        try {
          start = new Date(startValue.toString());
          if (isNaN(start.getTime())) {
            console.warn(`Invalid start date for row ${index + 1}: ${startValue}`);
            return;
          }
        } catch {
          console.warn(`Could not parse start date for row ${index + 1}: ${startValue}`);
          return;
        }

        // Intentar parsear la fecha de fin
        if (mapping.end && row[mapping.end]) {
          try {
            end = new Date(row[mapping.end].toString());
            if (isNaN(end.getTime())) {
              end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hora por defecto
            }
          } catch {
            end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hora por defecto
          }
        } else {
          end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hora por defecto
        }

        const event: CalendarEvent = {
          id: `imported-${index}`,
          title,
          start,
          end,
          description: mapping.description ? row[mapping.description] as string : undefined,
          priority: mapping.priority ? (row[mapping.priority] as 'low' | 'medium' | 'high') || 'medium' : 'medium',
          status: mapping.status ? (row[mapping.status] as 'pending' | 'in-progress' | 'completed') || 'pending' : 'pending',
          assignedTo: mapping.assignedTo ? row[mapping.assignedTo] as string : undefined,
          category: mapping.category ? row[mapping.category] as string : undefined,
        };

        events.push(event);
      });

      setEvents(events);
      setColumnMapping(mapping);
      setShowMapping(false);
      setError(null);
    } catch (error) {
      console.error('Error processing spreadsheet data:', error);
      setError('Error al procesar los datos de la hoja de cálculo');
    } finally {
      setLoading(false);
    }
  };

  // Verificar si las credenciales están configuradas
  const hasCredentials = import.meta.env.VITE_GOOGLE_API_KEY && import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!hasCredentials) {
    return (
      <div className="drive-connect">
        <GoogleSetupInstructions />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="drive-connect">
        <div className="drive-signin">
          <h3>Conectar con Google Drive</h3>
          <p>Para importar datos de hojas de cálculo, necesitas conectarte a Google Drive.</p>
          <button 
            onClick={handleSignIn} 
            className="signin-button"
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Conectando...' : '🔗 Conectar con Google Drive'}
          </button>
          
          {state.error && (
            <div className="signin-error">
              <p>❌ Error: {state.error}</p>
            </div>
          )}
        </div>
        
        <GoogleTestConnection />
        <DebugInfo />
      </div>
    );
  }

  return (
    <div className="drive-connect">
      <div className="drive-header">
        <div className="user-info">
          <span>👤 {currentUser}</span>
          <button onClick={handleSignOut} className="signout-button">
            Cerrar Sesión
          </button>
        </div>
        <button onClick={loadSpreadsheets} disabled={state.isLoading}>
          🔄 Actualizar Lista
        </button>
      </div>

      {driveFiles.length > 0 && (
        <div className="files-list">
          <h4>Hojas de Cálculo Disponibles</h4>
          <div className="files-grid">
            {driveFiles.map((file) => (
              <div 
                key={file.id} 
                className={`file-card ${state.selectedFile?.id === file.id ? 'selected' : ''}`}
                onClick={() => handleFileSelect(file)}
              >
                <div className="file-icon">📊</div>
                <div className="file-info">
                  <h5>{file.name}</h5>
                  <p>Modificado: {new Date(file.modifiedTime).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showMapping && state.spreadsheetData && (
        <ColumnMappingModal 
          data={state.spreadsheetData}
          onSubmit={handleMappingSubmit}
          onCancel={() => setShowMapping(false)}
        />
      )}
    </div>
  );
}

interface ColumnMappingModalProps {
  data: SpreadsheetData;
  onSubmit: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

function ColumnMappingModal({ data, onSubmit, onCancel }: ColumnMappingModalProps) {
  const [mapping, setMapping] = useState<ColumnMapping>({
    title: '',
    start: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapping.title || !mapping.start) {
      alert('Por favor selecciona al menos las columnas de Título y Fecha de Inicio');
      return;
    }
    onSubmit(mapping);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Mapear Columnas</h3>
        <p>Selecciona qué columna corresponde a cada campo:</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mapping-fields">
            <div className="field-group">
              <label>Título del Evento *</label>
              <select 
                value={mapping.title}
                onChange={(e) => setMapping({...mapping, title: e.target.value})}
                required
              >
                <option value="">Seleccionar columna...</option>
                {data.headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>Fecha de Inicio *</label>
              <select 
                value={mapping.start}
                onChange={(e) => setMapping({...mapping, start: e.target.value})}
                required
              >
                <option value="">Seleccionar columna...</option>
                {data.headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>Fecha de Fin</label>
              <select 
                value={mapping.end || ''}
                onChange={(e) => setMapping({...mapping, end: e.target.value})}
              >
                <option value="">Seleccionar columna...</option>
                {data.headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>Descripción</label>
              <select 
                value={mapping.description || ''}
                onChange={(e) => setMapping({...mapping, description: e.target.value})}
              >
                <option value="">Seleccionar columna...</option>
                {data.headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>Prioridad</label>
              <select 
                value={mapping.priority || ''}
                onChange={(e) => setMapping({...mapping, priority: e.target.value})}
              >
                <option value="">Seleccionar columna...</option>
                {data.headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>Estado</label>
              <select 
                value={mapping.status || ''}
                onChange={(e) => setMapping({...mapping, status: e.target.value})}
              >
                <option value="">Seleccionar columna...</option>
                {data.headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>Asignado a</label>
              <select 
                value={mapping.assignedTo || ''}
                onChange={(e) => setMapping({...mapping, assignedTo: e.target.value})}
              >
                <option value="">Seleccionar columna...</option>
                {data.headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>Categoría</label>
              <select 
                value={mapping.category || ''}
                onChange={(e) => setMapping({...mapping, category: e.target.value})}
              >
                <option value="">Seleccionar columna...</option>
                {data.headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancelar
            </button>
            <button type="submit" className="submit-button">
              Importar Datos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
