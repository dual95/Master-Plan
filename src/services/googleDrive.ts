import type { DriveFile, SpreadsheetData, SpreadsheetRow } from '../types';

// Configuración de Google Drive API
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest'
];

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

interface GoogleAuth {
  getAuthInstance: () => any;
  currentUser: {
    get: () => any;
  };
}

declare global {
  interface Window {
    gapi?: any;
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
        };
      };
    };
  }
}

class GoogleDriveService {
  private isInitialized = false;
  private gapi: any = null;
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // No inicializamos automáticamente, esperamos a que se llame signIn
  }

  private async initializeGapi(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Verificar si Google API está disponible
      if (typeof window === 'undefined') {
        reject(new Error('Ventana no disponible (SSR)'));
        return;
      }

      const checkGapi = () => {
        if (window.gapi && window.google) {
          this.gapi = window.gapi;
          
          // Usar Google Identity Services en lugar de auth2
          this.initializeTokenClient()
            .then(() => {
              this.isInitialized = true;
              resolve();
            })
            .catch(reject);
        } else {
          // Si no está disponible, esperar un poco y reintentar
          setTimeout(checkGapi, 100);
        }
      };

      checkGapi();
    });

    return this.initPromise;
  }

  private async initializeTokenClient(): Promise<void> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

    console.log('🔧 Inicializando cliente de Google API con GIS...');

    if (!apiKey || !clientId) {
      throw new Error('Credenciales de Google API no configuradas. Verifica VITE_GOOGLE_API_KEY y VITE_GOOGLE_CLIENT_ID en el archivo .env');
    }

    try {
      // Inicializar gapi client
      await new Promise<void>((resolve, reject) => {
        this.gapi.load('client', () => {
          this.gapi.client.init({
            apiKey: apiKey,
            discoveryDocs: DISCOVERY_DOCS,
          }).then(() => {
            console.log('✅ Cliente GAPI inicializado');
            resolve();
          }).catch(reject);
        });
      });

      // Configurar token client con Google Identity Services
      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services no está disponible');
      }

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES.join(' '),
        callback: (response: any) => {
          if (response.error) {
            console.error('❌ Error en autenticación:', response.error);
            throw new Error(`Error de autenticación: ${response.error}`);
          }
          this.accessToken = response.access_token;
          console.log('✅ Token de acceso obtenido');
        },
      });

      if (!this.tokenClient) {
        throw new Error('No se pudo crear el cliente de tokens');
      }

      console.log('✅ Google API inicializada correctamente');
    } catch (error: any) {
      console.error('❌ Error al inicializar Google API:', error);
      
      // Mensajes de error más específicos
      if (error.status === 403) {
        throw new Error('Error 403: API Key no válida o sin permisos. Verifica tu API Key en Google Cloud Console.');
      } else if (error.status === 400) {
        throw new Error('Error 400: Client ID no válido o mal configurado. Verifica tu Client ID en Google Cloud Console.');
      } else if (error.error === 'idpiframe_initialization_failed') {
        throw new Error('Error de inicialización OAuth. Esto suele ocurrir por cookies bloqueadas o configuración incorrecta.');
      } else if (error.details && error.details.includes('origin')) {
        throw new Error(`Origen no autorizado: ${window.location.origin}. Agrega este origen en Google Cloud Console.`);
      } else {
        throw new Error(`Error de inicialización: ${error.message || error.error || 'Error desconocido'}`);
      }
    }
  }

  async signIn(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.log('Inicializando Google API...');
        await this.initializeGapi();
      }

      if (!this.tokenClient) {
        throw new Error('Cliente de tokens no inicializado');
      }

      if (this.accessToken) {
        console.log('Ya tienes un token de acceso válido');
        return true;
      }
      
      console.log('Iniciando proceso de autenticación...');
      
      return new Promise<boolean>((resolve, reject) => {
        // Configurar callback temporal para esta solicitud
        const originalCallback = this.tokenClient.callback;
        
        this.tokenClient.callback = (response: any) => {
          if (response.error) {
            console.error('❌ Error en autenticación:', response.error);
            reject(new Error(`Error de autenticación: ${response.error}`));
            return;
          }
          
          this.accessToken = response.access_token;
          console.log('✅ Token de acceso obtenido exitosamente');
          
          // Configurar el token en gapi.client
          this.gapi.client.setToken({
            access_token: response.access_token
          });
          
          // Restaurar callback original
          this.tokenClient.callback = originalCallback;
          
          resolve(true);
        };

        // Solicitar token
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      });
    } catch (error: any) {
      console.error('Error en signIn:', error);
      
      if (error.message?.includes('popup_closed_by_user')) {
        throw new Error('La ventana de autenticación fue cerrada. Por favor, inténtalo de nuevo.');
      } else if (error.message?.includes('access_denied')) {
        throw new Error('Acceso denegado. Por favor, autoriza la aplicación para continuar.');
      } else if (error.details && error.details.includes('origin')) {
        throw new Error('Error de configuración OAuth. Verifica que el origen esté autorizado en Google Cloud Console.');
      } else {
        throw new Error(`Error de autenticación: ${error.message || error.error || 'Error desconocido'}`);
      }
    }
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Limpiar token de acceso
      this.accessToken = null;
      
      // Revocar token si está disponible
      if (this.gapi.client.getToken()) {
        this.gapi.client.setToken(null);
      }
      
      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  async listSpreadsheets(): Promise<DriveFile[]> {
    if (!this.isInitialized) {
      throw new Error('Google API not initialized');
    }

    try {
      const response = await this.gapi.client.drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
        orderBy: 'modifiedTime desc'
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Error listing spreadsheets:', error);
      throw error;
    }
  }

  async readSpreadsheet(fileId: string, sheetName?: string): Promise<SpreadsheetData> {
    if (!this.isInitialized) {
      throw new Error('Google API not initialized');
    }

    try {
      // Obtener las hojas disponibles
      const spreadsheetResponse = await this.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: fileId
      });

      const sheets = spreadsheetResponse.result.sheets;
      const targetSheet = sheetName || sheets[0].properties.title;

      // Leer datos de la hoja
      const range = `${targetSheet}!A:Z`; // Leer las primeras 26 columnas
      const valuesResponse = await this.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: fileId,
        range: range
      });

      const values = valuesResponse.result.values || [];
      if (values.length === 0) {
        throw new Error('No data found in spreadsheet');
      }

      const headers = values[0];
      const rows: SpreadsheetRow[] = values.slice(1).map((row: any[]) => {
        const rowData: SpreadsheetRow = {};
        headers.forEach((header: string, index: number) => {
          rowData[header] = row[index] || '';
        });
        return rowData;
      });

      return {
        sheetName: targetSheet,
        headers,
        rows
      };
    } catch (error) {
      console.error('Error reading spreadsheet:', error);
      throw error;
    }
  }

  isSignedIn(): boolean {
    if (!this.isInitialized) return false;
    return !!this.accessToken;
  }

  getCurrentUser(): string | null {
    if (!this.isSignedIn()) return null;
    // Con Google Identity Services, necesitaríamos hacer una llamada a la API
    // para obtener la información del usuario. Por ahora retornamos null
    // hasta implementar esa funcionalidad si es necesaria.
    return null;
  }
}

export const driveService = new GoogleDriveService();
