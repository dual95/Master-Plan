import { useState } from 'react';
import './GoogleTestConnection.css';

export function GoogleTestConnection() {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string, isError: boolean = false) => {
    const prefix = isError ? '❌' : '✅';
    setResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const testGoogleAPI = async () => {
    setIsLoading(true);
    setResults([]);
    setStep(0);

    try {
      // Paso 1: Verificar que gapi esté cargado
      setStep(1);
      addResult('Verificando carga de Google API...');
      
      if (typeof (window as any).gapi === 'undefined') {
        addResult('Google API no está cargada', true);
        return;
      }
      addResult('Google API está disponible');

      // Paso 2: Verificar credenciales
      setStep(2);
      addResult('Verificando credenciales...');
      
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!apiKey) {
        addResult('VITE_GOOGLE_API_KEY no configurada', true);
        return;
      }
      if (!clientId) {
        addResult('VITE_GOOGLE_CLIENT_ID no configurada', true);
        return;
      }
      addResult('Credenciales configuradas correctamente');

      // Paso 3: Verificar Google Identity Services
      setStep(3);
      addResult('Verificando Google Identity Services...');
      
      if (typeof (window as any).google === 'undefined' || !(window as any).google.accounts) {
        addResult('Google Identity Services no está disponible', true);
        return;
      }
      addResult('Google Identity Services disponible');

      // Paso 4: Cargar librería client de Google
      setStep(4);
      addResult('Cargando librería client...');
      
      await new Promise((resolve, reject) => {
        (window as any).gapi.load('client', () => {
          (window as any).gapi.client.init({
            apiKey: apiKey,
            discoveryDocs: [
              'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
              'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest'
            ]
          }).then(() => {
            addResult('Cliente GAPI inicializado correctamente');
            resolve(true);
          }).catch(reject);
        });
        
        // Timeout después de 10 segundos
        setTimeout(() => {
          reject(new Error('Timeout cargando librerías'));
        }, 10000);
      });

      // Paso 5: Inicializar Token Client
      setStep(5);
      addResult('Inicializando Token Client...');
      
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/spreadsheets.readonly'
        ].join(' '),
        callback: (response: any) => {
          if (response.error) {
            addResult(`Error en callback: ${response.error}`, true);
          } else {
            addResult('Token obtenido exitosamente');
          }
        },
      });
      
      if (!tokenClient) {
        addResult('No se pudo crear Token Client', true);
        return;
      }
      addResult('Token Client inicializado correctamente');

      addResult('🎉 ¡Todas las verificaciones pasaron! Intenta conectar con Google Drive ahora.');

    } catch (error: any) {
      console.error('Error en test:', error);
      addResult(`Error: ${error.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="google-test-connection">
      <h4>🧪 Prueba de Conectividad Google API</h4>
      
      <button 
        onClick={testGoogleAPI} 
        disabled={isLoading}
        className="test-button"
      >
        {isLoading ? '🔄 Probando...' : '🧪 Probar Conexión'}
      </button>

      {results.length > 0 && (
        <div className="test-results">
          <h5>Resultados de la prueba:</h5>
          <div className="results-list">
            {results.map((result, index) => (
              <div key={index} className="result-item">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {step > 0 && (
        <div className="test-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            Paso {step} de 5: {
              step === 1 ? 'Verificando API' :
              step === 2 ? 'Verificando credenciales' :
              step === 3 ? 'Verificando Google Identity Services' :
              step === 4 ? 'Inicializando cliente GAPI' :
              step === 5 ? 'Inicializando Token Client' : ''
            }
          </span>
        </div>
      )}
    </div>
  );
}
