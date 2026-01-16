import { useEffect, useRef, useState } from 'react';
import { useApp, useAppActions } from './useApp';
import { apiService } from '../services/apiService';
import type { CalendarEvent } from '../types';

// Variable global para controlar si hay cambios locales pendientes de guardar
let pendingLocalChanges = false;
let lastLocalChangeTime = 0;

/**
 * Marca que hay un cambio local pendiente (usar cuando se hace drag & drop)
 */
export function markLocalChange() {
  pendingLocalChanges = true;
  lastLocalChangeTime = Date.now();
  console.log('🔒 Cambio local detectado - sync pausada temporalmente');
}

/**
 * Hook para sincronización automática de eventos en tiempo real
 * Polling cada 5 segundos para detectar cambios del servidor
 * Se pausa automáticamente cuando hay cambios locales pendientes
 * 
 * @param enabled - Si está habilitado el sync
 * @param syncMode - 'full' sincroniza todo, 'status-only' solo actualiza estados/colores (para admin)
 */
export function useSyncEvents(enabled: boolean = true, syncMode: 'full' | 'status-only' = 'full') {
  const { state } = useApp();
  const { setEvents } = useAppActions();
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const [isSyncing, setIsSyncing] = useState(false);
  const syncIntervalRef = useRef<number | null>(null);
  const isFirstSyncRef = useRef(true);

  // Intervalo de sincronización (5 segundos)
  const SYNC_INTERVAL = 5000;
  // Tiempo de espera después de un cambio local antes de permitir sync (2 segundos)
  const LOCAL_CHANGE_COOLDOWN = 2000;

  useEffect(() => {
    if (!enabled) return;

    console.log('🔧 Iniciando sincronización automática cada 5 segundos...');

    const syncEvents = async () => {
      // Evitar sincronizaciones concurrentes
      if (isSyncing) {
        console.log('⏭️ Sync ya en progreso, saltando...');
        return;
      }

      // Si hay cambios locales pendientes recientes, esperar
      const timeSinceLastChange = Date.now() - lastLocalChangeTime;
      if (pendingLocalChanges && timeSinceLastChange < LOCAL_CHANGE_COOLDOWN) {
        console.log(`⏳ Cambios locales pendientes (${timeSinceLastChange}ms), esperando ${LOCAL_CHANGE_COOLDOWN - timeSinceLastChange}ms más...`);
        return;
      }
      
      // Limpiar flag de cambios pendientes después del cooldown
      if (pendingLocalChanges && timeSinceLastChange >= LOCAL_CHANGE_COOLDOWN) {
        pendingLocalChanges = false;
        console.log('🔓 Cooldown completado - reanudando sync normal');
      }

      setIsSyncing(true);
      
      try {
        // Obtener eventos del servidor
        const response = await apiService.syncEvents(lastSyncTime);
        
        console.log(`📊 Sync response:`, {
          hasChanges: response.hasChanges,
          eventsCount: response.events.length,
          serverTime: response.serverTime,
          isFirstSync: isFirstSyncRef.current,
          syncMode
        });
        
        if (response.hasChanges) {
          if (!isFirstSyncRef.current) {
            console.log(`🔄 Sync (${syncMode}): Detectados ${response.events.length} eventos actualizados desde servidor`);
          }
          
          if (syncMode === 'status-only') {
            // MODO ADMIN: Solo actualizar estados (real, status) manteniendo posiciones locales
            const currentEvents = state.events;
            const updatedEvents = currentEvents.map(localEvent => {
              const serverEvent = response.events.find(e => e.id === localEvent.id);
              if (serverEvent) {
                // Actualizar SOLO campos de estado/color, mantener posición/fecha local
                return {
                  ...localEvent,
                  real: serverEvent.real,
                  status: serverEvent.status,
                  // Actualizar otros campos de metadata que no afectan posición
                  product: serverEvent.product,
                  title: serverEvent.title,
                  description: serverEvent.description,
                };
              }
              return localEvent;
            });
            
            // Agregar eventos nuevos que no existen localmente
            const newEvents = response.events.filter(
              serverEvent => !currentEvents.some(local => local.id === serverEvent.id)
            );
            
            setEvents([...updatedEvents, ...newEvents]);
            console.log(`✅ Estados actualizados (admin): ${updatedEvents.length} actualizados, ${newEvents.length} nuevos`);
          } else {
            // MODO COMPLETO: Actualizar todos los eventos con la versión del servidor
            // El servidor es la fuente de verdad
            setEvents(response.events);
            console.log(`✅ Eventos actualizados: ${response.events.length} total`);
          }
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
