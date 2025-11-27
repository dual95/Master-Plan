import './DebugInfo.css';

export function DebugInfo() {
  const currentOrigin = window.location.origin;
  const hasApiKey = !!import.meta.env.VITE_GOOGLE_API_KEY;
  const hasClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const gapiLoaded = typeof (window as any)?.gapi !== 'undefined';
  
  return (
    <div className="debug-info">
      <h4>🔍 Información de Debug - OAuth</h4>
      <div className="debug-items">
        <div className="debug-item">
          <span className="debug-label">Origen actual:</span>
          <span className="debug-value origin">{currentOrigin}</span>
        </div>
        <div className="debug-item">
          <span className="debug-label">API Key configurada:</span>
          <span className={`debug-value ${hasApiKey ? 'success' : 'error'}`}>
            {hasApiKey ? '✅ Sí' : '❌ No'}
          </span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Client ID configurado:</span>
          <span className={`debug-value ${hasClientId ? 'success' : 'error'}`}>
            {hasClientId ? '✅ Sí' : '❌ No'}
          </span>
        </div>
        <div className="debug-item">
          <span className="debug-label">Google API cargada:</span>
          <span className={`debug-value ${gapiLoaded ? 'success' : 'error'}`}>
            {gapiLoaded ? '✅ Sí' : '❌ No'}
          </span>
        </div>
        {hasClientId && (
          <div className="debug-item">
            <span className="debug-label">Client ID:</span>
            <span className="debug-value small">
              {import.meta.env.VITE_GOOGLE_CLIENT_ID}
            </span>
          </div>
        )}
      </div>
      
      <div className="debug-instructions">
        <h5>📋 Pasos para resolver el error de origen:</h5>
        <ol>
          <li>Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
          <li>Navega a "APIs y servicios" → "Credenciales"</li>
          <li>Haz clic en tu OAuth 2.0 Client ID</li>
          <li>En "Orígenes de JavaScript autorizados", asegúrate de tener:</li>
          <ul>
            <li><code>{currentOrigin}</code></li>
            <li><code>http://localhost:5173</code></li>
            <li><code>http://127.0.0.1:5173</code></li>
          </ul>
          <li>Guarda los cambios y espera 2-3 minutos</li>
          <li>Recarga esta página y prueba de nuevo</li>
        </ol>
      </div>

      <div className="debug-actions">
        <button 
          onClick={() => window.location.reload()} 
          className="debug-button"
        >
          🔄 Recargar Página
        </button>
        <button 
          onClick={() => console.log('Estado Google API:', {
            gapi: (window as any)?.gapi,
            auth2: (window as any)?.gapi?.auth2,
            loaded: typeof (window as any)?.gapi !== 'undefined'
          })} 
          className="debug-button"
        >
          🔍 Verificar APIs en Consola
        </button>
      </div>

      <div className="debug-tip">
        💡 <strong>Tip:</strong> Si el error persiste, intenta crear un nuevo OAuth 2.0 Client ID 
        específicamente para desarrollo local.
      </div>
    </div>
  );
}
