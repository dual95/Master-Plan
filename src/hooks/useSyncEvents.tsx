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

    console.log('🔧 Iniciando sincronización automática cada 5 segundos...');

    const syncEvents = async () => {
      // Evitar sincronizaciones concurrentes
      if (isSyncing) {
        console.log('⏭️ Sync ya en progreso, saltando...');
        return;
      }

      setIsSyncing(true);
      
      try {
        // Obtener eventos del servidor
        const response = await apiService.syncEvents(lastSyncTime);
        
        console.log(`📊 Sync response:`, {
          hasChanges: response.hasChanges,
          eventsCount: response.events.length,
          serverTime: response.serverTime,
          isFirstSync: isFirstSyncRef.current
        });
        
        if (response.hasChanges) {
          if (!isFirstSyncRef.current) {
            console.log(`🔄 Sync: Detectados ${response.events.length} eventos actualizados desde servidor`);
          }
          
          // MERGE COMPLETO: Actualizar todos los eventos con la versión del servidor
          // El servidor es la fuente de verdad
          setEvents(response.events);
          
          console.log(`✅ Eventos actualizados: ${response.events.length} total`);
        } else {
          console.log('✅ No hay cambios nuevos');
        }
        
        // Actualizar timestamp de última sincronización
        setLastSyncTime(response.serverTime);
        
        // Marcar que ya no es la primera sincronización
        if (isFirstSyncRef.current) {
          isFirstSyncRef.current = false;
          console.log('✅ Primera sincronización completada');
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
    syncIntervalRef.current = setInterval(syncEvents, SYNC_INTERVAL) as unknown as number;

    // Cleanup: limpiar intervalo al desmontar
    return () => {
      console.log('🛑 Deteniendo sincronización automática');
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [enabled]); // Solo depender de enabled para evitar recreación constante

  return {
    isSyncing,
    lastSyncTime
  };
}
