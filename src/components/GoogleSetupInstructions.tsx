import './GoogleSetupInstructions.css';

export function GoogleSetupInstructions() {
  return (
    <div className="google-setup-instructions">
      <div className="instructions-header">
        <h3>🔧 Configuración de Google API</h3>
        <p>Para usar Master Plan con Google Drive, necesitas configurar las credenciales de Google Cloud.</p>
      </div>

      <div className="steps">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Crear proyecto en Google Cloud</h4>
            <p>Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a> y crea un nuevo proyecto o selecciona uno existente.</p>
          </div>
        </div>

        <div className="step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Habilitar APIs necesarias</h4>
            <p>En la consola, habilita estas APIs:</p>
            <ul>
              <li>Google Drive API</li>
              <li>Google Sheets API</li>
            </ul>
          </div>
        </div>

        <div className="step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Crear credenciales</h4>
            <p>Ve a "Credenciales" y crea:</p>
            <ul>
              <li><strong>API Key</strong> - Para acceso público a las APIs</li>
              <li><strong>OAuth 2.0 Client ID</strong> - Para autenticación de usuarios</li>
            </ul>
          </div>
        </div>

        <div className="step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h4>Configurar orígenes autorizados</h4>
            <p>En las credenciales OAuth 2.0, agrega estos orígenes:</p>
            <ul>
              <li><code>http://localhost:5173</code> (para desarrollo)</li>
              <li>Tu dominio de producción (cuando publiques)</li>
            </ul>
          </div>
        </div>

        <div className="step">
          <div className="step-number">5</div>
          <div className="step-content">
            <h4>Configurar variables de entorno</h4>
            <p>Copia tus credenciales al archivo <code>.env</code>:</p>
            <div className="code-block">
              <pre>
{`VITE_GOOGLE_API_KEY=tu_api_key_aquí
VITE_GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="instructions-footer">
        <p>💡 <strong>Tip:</strong> Mantén tus credenciales seguras y nunca las subas a repositorios públicos.</p>
        <p>🔄 Después de configurar las credenciales, recarga la página para usar la funcionalidad de Google Drive.</p>
      </div>
    </div>
  );
}
