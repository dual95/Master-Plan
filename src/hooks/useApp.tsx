import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction, CalendarEvent } from '../types';

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

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

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
    setEvents: (events: CalendarEvent[]) =>
      dispatch({ type: 'SET_EVENTS', payload: events }),
    
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
  };
}
