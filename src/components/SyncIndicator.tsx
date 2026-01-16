import { useSyncEvents } from '../hooks/useSyncEvents';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import './SyncIndicator.css';

interface SyncIndicatorProps {
  enabled?: boolean;
}

export function SyncIndicator({ enabled = true }: SyncIndicatorProps) {
  const { isSyncing, lastSyncTime } = useSyncEvents(enabled);

  if (!enabled) return null;

  const timeSinceSync = lastSyncTime 
    ? formatDistanceToNow(new Date(lastSyncTime), { locale: es, addSuffix: true })
    : 'nunca';

  return (
    <div className="sync-indicator">
      <div className={`sync-status ${isSyncing ? 'syncing' : 'idle'}`}>
        <span className="sync-icon">
          {isSyncing ? '🔄' : '✅'}
        </span>
        <span className="sync-text">
          {isSyncing ? 'Sincronizando...' : 'Sincronizado'}
        </span>
      </div>
      <small className="sync-time">
        Última actualización: {timeSinceSync}
      </small>
    </div>
  );
}
