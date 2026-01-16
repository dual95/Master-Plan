import { useEffect, useRef, useState } from 'react';
import { useApp, useAppActions } from './useApp';
import { apiService } from '../services/apiService';
import type { CalendarEvent } from '../types';

/**
 * Hook para sincronización automática de eventos en tiempo real
 * Polling cada 5 segundos para detectar cambios del servidor
 */
export function useSyncEvents(enabled: boolean = true) {
  const { state } = useApp();
  const { setEvents } = useAppActions();
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const [isSyncing, setIsSyncing] = useState(false);
  const syncIntervalRef = useRef<number | null>(null);
  const isFirstSyncRef = useRef(true);

  // Intervalo de sincronización (5 segundos)
  const SYNC_INTERVAL = 5000;

  useEffect(() => {
    if (!enabled) return;

    const syncEvents = async () => {
      // Evitar sincronizaciones concurrentes
      if (isSyncing) {
        return;
      }

      setIsSyncing(true);
      
      try {
        // Obtener eventos del servidor
        const response = await apiService.syncEvents(lastSyncTime);
        
        if (response.hasChanges && !isFirstSyncRef.current) {
          // Merge: Last Write Wins - El servidor siempre gana
          const serverEventIds = new Set(response.events.map((e: CalendarEvent) => e.id));
          
          // Mantener eventos locales que no están en el servidor
          const localOnlyEvents = state.events.filter(e => !serverEventIds.has(e.id));
          
          // Combinar eventos del servidor + eventos locales únicos
          const mergedEvents = [...response.events, ...localOnlyEvents];
          
          // Actualizar estado
          setEvents(mergedEvents);
          
          console.log(`🔄 Sync: ${response.events.length} eventos actualizados desde servidor`);
        }
        
        // Actualizar timestamp de última sincronización
        setLastSyncTime(response.serverTime);
        
        // Marcar que ya no es la primera sincronización
        if (isFirstSyncRef.current) {
          isFirstSyncRef.current = false;
        }
        
      } catch (error) {
        console.error('❌ Error en sincronización:', error);
        // No mostrar error al usuario para mantener experiencia silenciosa
      } finally {
        setIsSyncing(false);
      }
    };

    // Ejecutar primera sincronización inmediatamente
    syncEvents();

    // Configurar intervalo de sincronización
    syncIntervalRef.current = setInterval(syncEvents, SYNC_INTERVAL);

    // Cleanup: limpiar intervalo al desmontar
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [enabled, lastSyncTime, isSyncing, state.events, setEvents]);

  return {
    isSyncing,
    lastSyncTime
  };
}
