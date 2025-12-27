import type { CalendarEvent } from '../types';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authService.getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

export const apiService = {
  /**
   * Obtener todos los eventos del servidor
   */
  async getEvents(): Promise<CalendarEvent[]> {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/events`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📥 Recibidos ${data.events?.length || 0} eventos del servidor`);
      
      return data.events || [];
    } catch (error) {
      console.error('❌ Error obteniendo eventos:', error);
      throw error;
    }
  },

  /**
   * Guardar todos los eventos en el servidor (sobrescribe)
   */
  async saveEvents(events: CalendarEvent[]): Promise<void> {
    try {
      console.log(`📤 Enviando ${events.length} eventos al servidor...`);
      
      const response = await fetchWithAuth(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        body: JSON.stringify({ events }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Eventos guardados en el servidor:', data.message);
    } catch (error) {
      console.error('❌ Error guardando eventos:', error);
      throw error;
    }
  },

  /**
   * Actualizar un evento específico
   */
  async updateEvent(event: CalendarEvent): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/events/${event.id}`, {
        method: 'PUT',
        body: JSON.stringify(event),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Evento ${event.id} actualizado en el servidor`);
    } catch (error) {
      console.error('❌ Error actualizando evento:', error);
      throw error;
    }
  },

  /**
   * Eliminar un evento específico
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/events/${eventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Evento ${eventId} eliminado del servidor`);
    } catch (error) {
      console.error('❌ Error eliminando evento:', error);
      throw error;
    }
  },

  /**
   * Verificar salud de la API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      
      return data.status === 'ok' && data.database === 'connected';
    } catch (error) {
      console.error('❌ Health check falló:', error);
      return false;
    }
  }
};
