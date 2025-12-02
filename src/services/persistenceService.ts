import type { CalendarEvent } from '../types';

export interface PersistedState {
  events: CalendarEvent[];
  lastUpdated: string;
  fileName?: string;
}

const STORAGE_KEY = 'masterplan_events';
const STORAGE_VERSION = '1.0';

export const persistenceService = {
  /**
   * Guarda los eventos en localStorage
   */
  saveEvents(events: CalendarEvent[], fileName?: string): void {
    try {
      const state: PersistedState = {
        events,
        lastUpdated: new Date().toISOString(),
        fileName
      };
      
      const dataToStore = {
        version: STORAGE_VERSION,
        data: state
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      console.log(`✅ Guardados ${events.length} eventos en localStorage`);
    } catch (error) {
      console.error('❌ Error al guardar eventos:', error);
      throw new Error('Error al guardar los datos. Posiblemente el localStorage está lleno.');
    }
  },

  /**
   * Carga los eventos desde localStorage
   */
  loadEvents(): PersistedState | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        console.log('ℹ️ No hay datos guardados en localStorage');
        return null;
      }
      
      const parsed = JSON.parse(stored);
      
      // Verificar versión
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('⚠️ Versión de datos incompatible, limpiando localStorage');
        this.clearEvents();
        return null;
      }
      
      const state: PersistedState = parsed.data;
      
      // Convertir strings de fechas a objetos Date
      state.events = state.events.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
      
      console.log(`✅ Cargados ${state.events.length} eventos desde localStorage`);
      console.log(`📅 Última actualización: ${new Date(state.lastUpdated).toLocaleString()}`);
      
      return state;
    } catch (error) {
      console.error('❌ Error al cargar eventos:', error);
      return null;
    }
  },

  /**
   * Limpia todos los datos guardados
   */
  clearEvents(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('✅ Datos borrados de localStorage');
    } catch (error) {
      console.error('❌ Error al borrar datos:', error);
    }
  },

  /**
   * Verifica si hay datos guardados
   */
  hasPersistedData(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  },

  /**
   * Obtiene información sobre los datos guardados
   */
  getStorageInfo(): { size: number; lastUpdated: string | null; eventCount: number } | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      const state: PersistedState = parsed.data;
      
      return {
        size: new Blob([stored]).size,
        lastUpdated: state.lastUpdated,
        eventCount: state.events.length
      };
    } catch {
      return null;
    }
  }
};
