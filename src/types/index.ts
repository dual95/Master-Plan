// Tipos de datos para eventos del calendario
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  assignee?: string; // Alias para compatibilidad
  category?: string;
  color?: string;
  
  // Datos específicos de producción
  productId?: string;
  pedido?: string;
  processType?: string;
  duration?: number; // en horas
  quantity?: number;
  dependencies?: string[];
  machine?: string;
  
  // Datos del Excel de producción
  pos?: number;
  material?: string;
  proceso?: string;
  pliegos?: number;
  realizados?: boolean;
  progresado?: boolean;
  laminado?: boolean;
  estimacion?: boolean;
  fechaEstimacion?: string;
  proyecto?: string;
  componente?: string;
  planta?: 'P2' | 'P3';
  linea?: string; // MOEX, YOBEL, MELISSA, etc.
  updateStatus?: 'COMPLETED' | 'IN PROCESS' | 'PENDING' | ''; // Estado de la columna UPDATE
  
  // Campos manuales (no vienen del Excel)
  esperado?: number; // Valor esperado (manual)
  real?: number; // Valor real (manual)
}

// Tipos para datos de Google Drive
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
  size?: string;
  fileType?: string;
  isGoogleSheet?: boolean;
  isExcel?: boolean;
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

// Tipos específicos para el sistema de producción
export interface ProductionItem {
  id: string;
  pos: number;
  material: string;
  quantity: number;
  pliegos: number;
  pedido: string;
  fechaEstimacion: string;
  progresado: boolean;
  realizado: boolean;
  laminado: boolean;
  estimacion: boolean;
  proyecto: string;
  componente: string;
}

export interface ProductionProcess {
  id: string;
  name: string;
  duration: number; // horas estimadas
  machine?: string;
  sequence: number; // orden en el proceso
  dependencies?: string[]; // IDs de procesos previos requeridos
}

export interface ProductionTask extends CalendarEvent {
  productionItem: ProductionItem;
  process: ProductionProcess;
  estimatedHours: number;
  actualHours?: number;
  machine: string;
  planta: 'P2' | 'P3';
  sequence: number;
}

// Configuración de procesos por tipo de material
export interface ProcessConfiguration {
  [materialType: string]: ProductionProcess[];
}

// Estado de la planificación de producción
export interface ProductionPlanningState {
  items: ProductionItem[];
  tasks: ProductionTask[];
  processConfig: ProcessConfiguration;
  currentPlant: 'P2' | 'P3';
}
