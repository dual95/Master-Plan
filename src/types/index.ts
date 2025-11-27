// Tipos de datos para eventos del calendario
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  category?: string;
  color?: string;
}

// Tipos para datos de Google Drive
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
}

// Tipos para datos de hoja de cálculo
export interface SpreadsheetRow {
  [key: string]: string | number | Date;
}

export interface SpreadsheetData {
  sheetName: string;
  headers: string[];
  rows: SpreadsheetRow[];
}

// Tipos para la configuración de mapeo de columnas
export interface ColumnMapping {
  title: string;
  start: string;
  end?: string;
  description?: string;
  priority?: string;
  status?: string;
  assignedTo?: string;
  category?: string;
}

// Estados de la aplicación
export interface AppState {
  events: CalendarEvent[];
  selectedFile: DriveFile | null;
  spreadsheetData: SpreadsheetData | null;
  columnMapping: ColumnMapping | null;
  isLoading: boolean;
  error: string | null;
}

// Acciones para el reducer
export type AppAction =
  | { type: 'SET_EVENTS'; payload: CalendarEvent[] }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_EVENT'; payload: CalendarEvent }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_SELECTED_FILE'; payload: DriveFile | null }
  | { type: 'SET_SPREADSHEET_DATA'; payload: SpreadsheetData | null }
  | { type: 'SET_COLUMN_MAPPING'; payload: ColumnMapping | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };
