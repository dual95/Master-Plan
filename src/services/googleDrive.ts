import type { DriveFile, SpreadsheetData, SpreadsheetRow } from '../types';
import * as XLSX from 'xlsx';

// Configuración de Google Drive API
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest'
];

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

// Interfaces para Google APIs (mantenido para referencia futura)
// interface GoogleAuth {
//   getAuthInstance: () => any;
//   currentUser: {
//     get: () => any;
//   };
// }

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
      // Incluir tanto Google Sheets como archivos Excel
      const query = [
        "mimeType='application/vnd.google-apps.spreadsheet'", // Google Sheets
        "mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'", // Excel .xlsx
        "mimeType='application/vnd.ms-excel'", // Excel .xls
        "mimeType='text/csv'" // CSV files
      ].join(' or ');

      const response = await this.gapi.client.drive.files.list({
        q: `(${query}) and trashed=false`,
        fields: 'files(id,name,mimeType,modifiedTime,webViewLink,size)',
        orderBy: 'modifiedTime desc',
        pageSize: 50 // Aumentar el límite para ver más archivos
      });

      const files = response.result.files || [];
      
      // Agregar información adicional sobre el tipo de archivo
      return files.map((file: any) => ({
        ...file,
        // Agregar un indicador del tipo de archivo para la UI
        fileType: this.getFileTypeLabel(file.mimeType),
        isGoogleSheet: file.mimeType === 'application/vnd.google-apps.spreadsheet',
        isExcel: file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.mimeType === 'application/vnd.ms-excel'
      }));
      
    } catch (error) {
      console.error('Error listing spreadsheets:', error);
      throw error;
    }
  }

  private getFileTypeLabel(mimeType: string): string {
    switch (mimeType) {
      case 'application/vnd.google-apps.spreadsheet':
        return '📊 Google Sheets';
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return '📗 Excel (.xlsx)';
      case 'application/vnd.ms-excel':
        return '📗 Excel (.xls)';
      case 'text/csv':
        return '📄 CSV';
      default:
        return '📋 Hoja de cálculo';
    }
  }

  async readSpreadsheet(fileId: string, sheetName?: string): Promise<SpreadsheetData> {
    if (!this.isInitialized) {
      throw new Error('Google API not initialized');
    }

    try {
      // Primero verificar el tipo de archivo
      const fileInfo = await this.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'mimeType,name'
      });

      const mimeType = fileInfo.result.mimeType;
      
      // Si es Excel, usar el método específico para Excel
      if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          mimeType === 'application/vnd.ms-excel') {
        return this.readExcelFile(fileId, sheetName);
      }

      // Si es Google Sheets, usar el método original
      const spreadsheetResponse = await this.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: fileId
      });

      const sheets = spreadsheetResponse.result.sheets;
      
      // Buscar específicamente la hoja "PROCESOS PRD" si no se especifica otra
      let targetSheet = sheetName;
      
      if (!targetSheet) {
        // Buscar hoja "PROCESOS PRD" (case insensitive)
        const procesosPrdSheet = sheets.find((sheet: any) => 
          sheet.properties.title.toUpperCase().includes('PROCESOS PRD') ||
          sheet.properties.title.toUpperCase().includes('PROCESOS_PRD') ||
          sheet.properties.title.toUpperCase() === 'PROCESOS PRD'
        );
        
        if (procesosPrdSheet) {
          targetSheet = procesosPrdSheet.properties.title;
          console.log(`✅ Encontrada hoja de producción: "${targetSheet}"`);
        } else {
          // Si no encuentra "PROCESOS PRD", usar la primera hoja
          targetSheet = sheets[0].properties.title;
          console.warn(`⚠️ No se encontró hoja "PROCESOS PRD", usando: "${targetSheet}"`);
        }
      }

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
        sheetName: targetSheet || 'Unknown Sheet',
        headers,
        rows
      };
    } catch (error) {
      console.error('Error reading spreadsheet:', error);
      throw error;
    }
  }

  private async readExcelFile(fileId: string, sheetName?: string): Promise<SpreadsheetData> {
    try {
      console.log('📗 Leyendo archivo Excel desde Google Drive...');
      
      let arrayBuffer: ArrayBuffer;
      
      try {
        // Método 1: Usar fetch directo (más confiable para archivos binarios)
        console.log('🔄 Intentando descarga directa con fetch...');
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        arrayBuffer = await response.arrayBuffer();
        console.log('✅ Descarga directa exitosa, tamaño:', arrayBuffer.byteLength, 'bytes');
        
      } catch (fetchError) {
        console.warn('⚠️ Descarga directa falló, intentando con gapi.client...', fetchError);
        
        // Método 2: Fallback usando gapi.client
        const gapiResponse = await this.gapi.client.drive.files.get({
          fileId: fileId,
          alt: 'media'
        });
        
        arrayBuffer = this.responseToArrayBuffer(gapiResponse);
        console.log('✅ Descarga con gapi.client exitosa, tamaño:', arrayBuffer.byteLength, 'bytes');
      }
      
      // Parsear el archivo Excel
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Obtener nombres de hojas
      const sheetNames = workbook.SheetNames;
      
      // Buscar específicamente la hoja "PROCESOS PRD" si no se especifica otra
      let targetSheet = sheetName;
      
      if (!targetSheet) {
        const procesosPrdSheet = sheetNames.find(name => 
          name.toUpperCase().includes('PROCESOS PRD') ||
          name.toUpperCase().includes('PROCESOS_PRD') ||
          name.toUpperCase() === 'PROCESOS PRD'
        );
        
        if (procesosPrdSheet) {
          targetSheet = procesosPrdSheet;
          console.log(`✅ Encontrada hoja de producción en Excel: "${targetSheet}"`);
        } else {
          targetSheet = sheetNames[0];
          console.warn(`⚠️ No se encontró hoja "PROCESOS PRD" en Excel, usando: "${targetSheet}"`);
        }
      }
      
      if (!workbook.Sheets[targetSheet]) {
        throw new Error(`Hoja "${targetSheet}" no encontrada en el archivo Excel`);
      }
      
      // Convertir la hoja a JSON probando diferentes métodos
      const worksheet = workbook.Sheets[targetSheet];
      
      console.log('🔍 Rango de la hoja:', worksheet['!ref']);
      
      // Método 1: Probar conversión con headers automáticos
      let jsonData: any[];
      let headers: string[];
      
      try {
        // Intentar método automático primero
        const autoData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (autoData.length > 0 && Object.keys(autoData[0]).length > 1) {
          // Si funciona y tiene múltiples columnas, usar este método
          jsonData = autoData;
          headers = Object.keys(autoData[0]);
          console.log('✅ Método automático exitoso, headers:', headers.slice(0, 10));
        } else {
          throw new Error('Método automático no funcionó, probando manual');
        }
      } catch (error) {
        console.log('⚠️ Método automático falló, usando método manual...');
        
        // Método 2: Conversión manual con array de arrays
        const arrayData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '',
          raw: false 
        });
        
        if (arrayData.length === 0) {
          throw new Error('No data found in Excel sheet');
        }
        
        // La primera fila son los headers
        headers = (arrayData[0] as string[]).map((header, index) => 
          header && String(header).trim() !== '' ? String(header) : `Col${index + 1}`
        );
        
        console.log('🔍 Headers manuales detectados:', headers.slice(0, 10));
        
        // Convertir el resto de las filas a objetos
        jsonData = arrayData.slice(1).map((row: any[]) => {
          const rowObject: any = {};
          headers.forEach((header, index) => {
            rowObject[header] = row[index] || '';
          });
          return rowObject;
        });
      }
      
      console.log('🔍 Primera fila de datos:', jsonData[0]);
      console.log('🔍 Claves finales:', Object.keys(jsonData[0] || {}));
      
      // Convertir a SpreadsheetRow format
      const rows: SpreadsheetRow[] = jsonData.map((row: any) => {
        const rowData: SpreadsheetRow = {};
        Object.keys(row).forEach(key => {
          rowData[key] = String(row[key] || '');
        });
        return rowData;
      });
      
      console.log(`✅ Excel procesado exitosamente:`);
      console.log(`   📊 Hoja: "${targetSheet}"`);
      console.log(`   📋 Headers detectados: ${headers.length} columnas`);
      console.log(`   📋 Headers completos:`, headers);
      console.log(`   📄 Datos: ${rows.length} filas`);
      
      if (rows.length > 0) {
        console.log('🔍 Análisis de primera fila:');
        console.log('   - Claves disponibles:', Object.keys(rows[0]));
        console.log('   - Valores muestra:', Object.entries(rows[0]).slice(0, 8));
        
        // Buscar las columnas clave específicamente
        const keyColumns = ['PO', 'PEDIDO', 'PROYECTO', 'MATERIAL', 'IMPRESION'];
        keyColumns.forEach(col => {
          if (rows[0][col] !== undefined) {
            console.log(`   - ${col}:`, rows[0][col]);
          }
        });
      }
      
      return {
        sheetName: targetSheet || 'Unknown Sheet',
        headers,
        rows
      };
    } catch (error: any) {
      console.error('Error reading Excel file:', error);
      
      // Proporcionar mensajes de error más específicos
      if (error.message?.includes('Invalid file')) {
        throw new Error('El archivo no es un Excel válido o está corrupto');
      } else if (error.message?.includes('access_denied')) {
        throw new Error('Sin permisos para leer el archivo. Verifica que la aplicación tenga acceso a Google Drive');
      } else if (error.message?.includes('not found')) {
        throw new Error('Archivo no encontrado en Google Drive');
      } else {
        throw new Error(`Error al leer archivo Excel: ${error.message || 'Error desconocido'}`);
      }
    }
  }

  private responseToArrayBuffer(response: any): ArrayBuffer {
    try {
      console.log('🔍 Analizando tipo de respuesta:', typeof response);
      console.log('🔍 Es ArrayBuffer?', response instanceof ArrayBuffer);
      
      // Si la respuesta ya es ArrayBuffer, devolverla directamente
      if (response instanceof ArrayBuffer) {
        console.log('✅ Respuesta ya es ArrayBuffer');
        return response;
      }
      
      // Si es un Uint8Array, convertir a ArrayBuffer
      if (response instanceof Uint8Array) {
        console.log('✅ Convirtiendo Uint8Array a ArrayBuffer');
        return response.buffer;
      }
      
      // Si es una cadena, puede ser base64 o datos binarios
      if (typeof response === 'string') {
        console.log('🔍 Respuesta es string, longitud:', response.length);
        
        try {
          // Intentar decodificar como base64
          const binaryString = atob(response);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          console.log('✅ Decodificado como base64');
          return bytes.buffer;
        } catch (base64Error) {
          console.log('⚠️ No es base64, tratando como string binario');
          // Si no es base64, tratar como string binario directo
          const bytes = new Uint8Array(response.length);
          for (let i = 0; i < response.length; i++) {
            bytes[i] = response.charCodeAt(i);
          }
          return bytes.buffer;
        }
      }
      
      // Si es un objeto con propiedad body
      if (response && response.body) {
        console.log('🔍 Respuesta tiene propiedad body');
        return this.responseToArrayBuffer(response.body);
      }
      
      // Si es un objeto con propiedad result
      if (response && response.result) {
        console.log('🔍 Respuesta tiene propiedad result');
        return this.responseToArrayBuffer(response.result);
      }
      
      console.error('❌ Formato de respuesta no reconocido:', response);
      throw new Error('Formato de respuesta no reconocido');
    } catch (error: any) {
      console.error('❌ Error convirtiendo respuesta a ArrayBuffer:', error);
      throw new Error(`Error procesando datos del archivo Excel: ${error.message}`);
    }
  }

  private async getExcelSheetNames(fileId: string): Promise<string[]> {
    try {
      console.log('📋 Obteniendo nombres de hojas de Excel...');
      
      let arrayBuffer: ArrayBuffer;
      
      try {
        // Método 1: Usar fetch directo
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        arrayBuffer = await response.arrayBuffer();
        console.log('✅ Descarga directa exitosa para análisis de hojas, tamaño:', arrayBuffer.byteLength, 'bytes');
        
      } catch (fetchError) {
        console.warn('⚠️ Descarga directa falló, usando gapi.client...', fetchError);
        
        // Método 2: Fallback usando gapi.client  
        const gapiResponse = await this.gapi.client.drive.files.get({
          fileId: fileId,
          alt: 'media'
        });
        
        arrayBuffer = this.responseToArrayBuffer(gapiResponse);
        console.log('✅ Descarga con gapi.client exitosa, tamaño:', arrayBuffer.byteLength, 'bytes');
      }
      
      // Parsear el archivo Excel
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      return workbook.SheetNames;
    } catch (error) {
      console.error('Error getting Excel sheet names:', error);
      throw error;
    }
  }

  async getSheetNames(fileId: string): Promise<string[]> {
    if (!this.isInitialized) {
      throw new Error('Google API not initialized');
    }

    try {
      // Primero verificar el tipo de archivo
      const fileInfo = await this.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'mimeType'
      });

      const mimeType = fileInfo.result.mimeType;
      
      // Si es Excel, usar el método específico para Excel
      if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          mimeType === 'application/vnd.ms-excel') {
        return this.getExcelSheetNames(fileId);
      }

      // Si es Google Sheets, usar el método original
      const spreadsheetResponse = await this.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: fileId
      });

      const sheets = spreadsheetResponse.result.sheets;
      return sheets.map((sheet: any) => sheet.properties.title);
    } catch (error) {
      console.error('Error getting sheet names:', error);
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
