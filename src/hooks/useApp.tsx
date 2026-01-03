import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction, CalendarEvent } from '../types';
import { persistenceService } from '../services/persistenceService';
import { apiService } from '../services/apiService';

// Estado inicial
const initialState: AppState = {
  events: [],
  selectedFile: null,
  spreadsheetData: null,
  columnMapping: null,
  isLoading: false,
  error: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    
    case 'UPDATE_EVENT':
      // Verificar duplicados de ID antes de actualizar
      const duplicates = state.events.filter(e => e.id === action.payload.id);
      if (duplicates.length > 1) {
        console.error(`⚠️ ADVERTENCIA: Se encontraron ${duplicates.length} eventos con el mismo ID: ${action.payload.id}`);
        console.error('Eventos duplicados:', duplicates.map(e => ({ 
          id: e.id, 
          title: e.title, 
          pedido: e.pedido, 
          pos: e.pos 
        })));
      }
      
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? action.payload : event
        ),
      };
    
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
      };
    
    case 'SET_SELECTED_FILE':
      return { ...state, selectedFile: action.payload };
    
    case 'SET_SPREADSHEET_DATA':
      return { ...state, spreadsheetData: action.payload };
    
    case 'SET_COLUMN_MAPPING':
      return { ...state, columnMapping: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

/**
 * Detecta y corrige eventos con IDs duplicados
 */
function deduplicateEvents(events: CalendarEvent[]): CalendarEvent[] {
  const seenIds = new Set<string>();
  const uniqueEvents: CalendarEvent[] = [];
  const duplicates: CalendarEvent[] = [];
  
  events.forEach(event => {
    if (seenIds.has(event.id)) {
      // ID duplicado encontrado - regenerar ID
      console.warn(`⚠️ ID duplicado detectado: ${event.id} para ${event.title}`);
      duplicates.push(event);
      
      // Generar nuevo ID único
      const newId = `${event.pedido || 'unknown'}-${event.processType || 'task'}-${event.pos || '0'}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      uniqueEvents.push({ ...event, id: newId });
      seenIds.add(newId);
    } else {
      uniqueEvents.push(event);
      seenIds.add(event.id);
    }
  });
  
  if (duplicates.length > 0) {
    console.log(`🔧 Se corrigieron ${duplicates.length} IDs duplicados`);
  }
  
  return uniqueEvents;
}

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Cargar datos al montar el componente
  useEffect(() => {
    async function loadPersistedData() {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const persistedState = await persistenceService.loadEvents();
        
        if (persistedState && persistedState.events.length > 0) {
          console.log('🔄 Restaurando eventos guardados...');
          
          // Deduplicar eventos antes de cargar
          const uniqueEvents = deduplicateEvents(persistedState.events);
          dispatch({ type: 'SET_EVENTS', payload: uniqueEvents });
          
          console.log(`📊 Eventos restaurados: ${uniqueEvents.length}`);
          console.log(`📅 Última actualización: ${new Date(persistedState.lastUpdated || '').toLocaleString()}`);
        } else {
          console.log('ℹ️ No hay eventos guardados');
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    
    loadPersistedData();
  }, []);

  // Guardar datos automáticamente cuando cambian los eventos
  useEffect(() => {
    async function saveData() {
      if (state.events.length > 0) {
        try {
          await persistenceService.saveEvents(state.events, state.selectedFile?.name);
        } catch (error) {
          console.error('Error guardando eventos:', error);
        }
      }
    }
    
    // Debounce para evitar guardar demasiado frecuentemente
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [state.events, state.selectedFile]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook personalizado
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Funciones de utilidad para acciones comunes
export function useAppActions() {
  const { dispatch } = useApp();

  return {
    setEvents: (events: CalendarEvent[]) => {
      // Deduplicar eventos antes de guardar
      const uniqueEvents = deduplicateEvents(events);
      dispatch({ type: 'SET_EVENTS', payload: uniqueEvents });
    },
    
    addEvent: (event: CalendarEvent) =>
      dispatch({ type: 'ADD_EVENT', payload: event }),
    
    updateEvent: (event: CalendarEvent) =>
      dispatch({ type: 'UPDATE_EVENT', payload: event }),
    
    deleteEvent: (eventId: string) =>
      dispatch({ type: 'DELETE_EVENT', payload: eventId }),
    
    setSelectedFile: (file: any) =>
      dispatch({ type: 'SET_SELECTED_FILE', payload: file }),
    
    setSpreadsheetData: (data: any) =>
      dispatch({ type: 'SET_SPREADSHEET_DATA', payload: data }),
    
    setColumnMapping: (mapping: any) =>
      dispatch({ type: 'SET_COLUMN_MAPPING', payload: mapping }),
    
    setLoading: (loading: boolean) =>
      dispatch({ type: 'SET_LOADING', payload: loading }),
    
    setError: (error: string | null) =>
      dispatch({ type: 'SET_ERROR', payload: error }),
    
    // Nueva función para limpiar datos guardados
    clearPersistedData: async () => {
      try {
        // Limpiar localStorage
        persistenceService.clearEvents();
        
        // Limpiar base de datos
        await apiService.clearAllEvents();
        
        // Limpiar estado de la aplicación
        dispatch({ type: 'SET_EVENTS', payload: [] });
        
        console.log('✅ Datos eliminados de localStorage y base de datos');
      } catch (error) {
        console.error('❌ Error limpiando datos:', error);
        // Aunque falle la API, igual limpiamos localStorage y estado local
        dispatch({ type: 'SET_EVENTS', payload: [] });
      }
    },
  };
}
