import type { CalendarEvent } from '../types';
import { format, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';

export interface LookerStudioRow {
  FECHA: string;
  SEMANA: number;
  PRODUCT: string;
  PEDIDO: string;
  POS: number;
  PROYECTO: string;
  PLAN: number;
  REAL: number;
  '$/UND': number;
  'PLAN $': number;
  'REAL $': number;
  LINEA: string;
}

/**
 * Genera los datos para exportar a Looker Studio desde eventos de P2
 */
export function generateLookerStudioData(events: CalendarEvent[]): LookerStudioRow[] {
  // Filtrar solo eventos de P2 (ensamblaje) Y que estén EXPLÍCITAMENTE programados
  const p2Events = events.filter(event => 
    event.planta === 'P2' && event.isScheduled === true
  );
  
  console.log(`📊 Generando datos Looker Studio para ${p2Events.length} eventos programados de P2 (de ${events.filter(e => e.planta === 'P2').length} totales)`);
  
  const rows: LookerStudioRow[] = p2Events.map((event, index) => {
    const eventDate = new Date(event.start);
    const fecha = format(eventDate, 'dd-MMM-yy', { locale: es });
    const semana = getWeek(eventDate, { 
      locale: es, 
      weekStartsOn: 1, // Lunes como inicio de semana
      firstWeekContainsDate: 4 // ISO 8601: primera semana contiene el 4 de enero
    });
    const unitPrice = event.unitPrice || 0;
    const plan = event.esperado || 0;
    const real = event.real || 0;
    
    // Debug: Log de los primeros 3 eventos
    if (index < 3) {
      console.log(`📋 Evento ${index + 1}:`, {
        pedido: event.pedido,
        proyecto: event.proyecto,
        product: event.product,
        unitPrice,
        plan,
        real,
        'plan$': plan * unitPrice,
        'real$': real * unitPrice
      });
    }
    
    const row: LookerStudioRow = {
      FECHA: fecha,
      SEMANA: semana,
      PRODUCT: event.product || '',
      PEDIDO: event.pedido || '',
      POS: event.pos || 0,
      PROYECTO: event.proyecto || '',
      PLAN: plan,
      REAL: real,
      '$/UND': unitPrice,
      'PLAN $': plan * unitPrice,
      'REAL $': real * unitPrice,
      LINEA: event.linea || event.machine || 'Sin asignar'
    };
    
    return row;
  });
  
  // Ordenar por fecha (de menor a mayor) y luego por línea
  rows.sort((a, b) => {
    // Parsear las fechas en formato "dd-MMM-yy" a objetos Date para comparación correcta
    const parseDate = (dateStr: string): Date => {
      // Formato: "01-ene-26" -> Date
      const parts = dateStr.split('-');
      const day = parseInt(parts[0]);
      const monthMap: { [key: string]: number } = {
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
      };
      const month = monthMap[parts[1].toLowerCase()] || 0;
      const year = 2000 + parseInt(parts[2]); // Asume años 20xx
      
      return new Date(year, month, day);
    };
    
    const dateA = parseDate(a.FECHA);
    const dateB = parseDate(b.FECHA);
    
    const dateCompare = dateA.getTime() - dateB.getTime();
    if (dateCompare !== 0) return dateCompare;
    
    // Si las fechas son iguales, ordenar por línea
    return a.LINEA.localeCompare(b.LINEA);
  });
  
  console.log(`✅ Generadas ${rows.length} filas para Looker Studio (ordenadas por fecha)`);
  
  return rows;
}

/**
 * Exporta los datos a Google Sheets en la hoja LOOKERSTUDIO
 */
export async function exportToLookerStudio(
  spreadsheetId: string,
  events: CalendarEvent[],
  accessToken: string
): Promise<{ success: boolean; message: string; rowsExported?: number }> {
  try {
    console.log('🚀 Iniciando exportación a Looker Studio...');
    
    // Generar datos
    const data = generateLookerStudioData(events);
    
    if (data.length === 0) {
      return {
        success: false,
        message: 'No hay datos de Planta 2 para exportar'
      };
    }
    
    const sheetName = 'LOOKERSTUDIO';
    
    // 1. Verificar si la hoja existe, si no crearla
    const sheetExists = await checkSheetExists(spreadsheetId, sheetName, accessToken);
    
    if (!sheetExists) {
      console.log(`📝 Creando hoja ${sheetName}...`);
      await createSheet(spreadsheetId, sheetName, accessToken);
    } else {
      console.log(`✅ Hoja ${sheetName} ya existe`);
    }
    
    // 2. Limpiar la hoja antes de escribir
    console.log('🧹 Limpiando datos anteriores...');
    await clearSheet(spreadsheetId, sheetName, accessToken);
    
    // 3. Preparar datos para escribir (headers + datos)
    const headers = ['FECHA', 'SEMANA', 'PRODUCT', 'PEDIDO', 'POS', 'PROYECTO', 'PLAN', 'REAL', '$/UND', 'PLAN $', 'REAL $', 'LINEA'];
    const values = [
      headers,
      ...data.map((row, index) => {
        const rowData = [
          row.FECHA,
          row.SEMANA,
          row.PRODUCT,
          row.PEDIDO,
          row.POS,
          row.PROYECTO,
          row.PLAN,
          row.REAL,
          row['$/UND'],
          row['PLAN $'],
          row['REAL $'],
          row.LINEA
        ];
        
        // Debug: Log de las primeras 3 filas
        if (index < 3) {
          console.log(`📝 Fila ${index + 1} para escribir:`, rowData);
          console.log(`   $/UND = ${row['$/UND']} (tipo: ${typeof row['$/UND']})`);
        }
        
        return rowData;
      })
    ];
    
    console.log(`📊 Total valores a escribir: ${values.length} filas (incluyendo header)`);
    
    // 4. Escribir datos
    console.log(`📝 Escribiendo ${data.length} filas...`);
    await writeToSheet(spreadsheetId, sheetName, values, accessToken);
    
    // 5. Formatear la hoja
    console.log('🎨 Aplicando formato...');
    await formatLookerStudioSheet(spreadsheetId, sheetName, accessToken);
    
    console.log('✅ Exportación completada exitosamente');
    
    return {
      success: true,
      message: `Se exportaron ${data.length} filas a la hoja ${sheetName}`,
      rowsExported: data.length
    };
    
  } catch (error) {
    console.error('❌ Error en exportación:', error);
    return {
      success: false,
      message: `Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

/**
 * Verifica si una hoja existe en el spreadsheet
 */
async function checkSheetExists(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<boolean> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Error al verificar hojas: ${response.statusText}`);
  }
  
  const data = await response.json();
  const sheets = data.sheets || [];
  
  return sheets.some((sheet: any) => sheet.properties.title === sheetName);
}

/**
 * Crea una nueva hoja en el spreadsheet
 */
async function createSheet(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                frozenRowCount: 1 // Congelar fila de encabezados
              }
            }
          }
        }]
      })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error al crear hoja:', errorData);
    throw new Error(`Error al crear hoja (${response.status}): ${errorData.error?.message || response.statusText}`);
  }
}

/**
 * Limpia todos los datos de una hoja
 */
async function clearSheet(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}:clear`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error al limpiar hoja:', errorData);
    throw new Error(`Error al limpiar hoja (${response.status}): ${errorData.error?.message || response.statusText}`);
  }
}

/**
 * Escribe datos en una hoja
 */
async function writeToSheet(
  spreadsheetId: string,
  sheetName: string,
  values: any[][],
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values
      })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error al escribir datos:', errorData);
    throw new Error(`Error al escribir datos (${response.status}): ${errorData.error?.message || response.statusText}`);
  }
}

/**
 * Aplica formato a la hoja LOOKERSTUDIO
 */
async function formatLookerStudioSheet(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<void> {
  // Obtener el ID de la hoja
  const spreadsheetResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  const spreadsheetData = await spreadsheetResponse.json();
  const sheet = spreadsheetData.sheets.find((s: any) => s.properties.title === sheetName);
  
  if (!sheet) return;
  
  const sheetId = sheet.properties.sheetId;
  
  // Aplicar formato
  const requests = [
    // Formato de encabezados (negrita, fondo azul)
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 1
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true
            },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
      }
    },
    // Auto-resize de columnas
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 10
        }
      }
    }
  ];
  
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    }
  );
}

// ==================== LOOKER STUDIO 2 (PLANTA 3) ====================

export interface LookerStudio2Row {
  ID: string;
  PEDIDO: string;
  POS: number;
  PROYECTO: string;
  PROCESO: string;
  ESTATUS: string;
}

/**
 * Genera los datos para exportar a Looker Studio 2 desde eventos de P3
 * Solo incluye la tarea más reciente para cada combinación única de PEDIDO+POS+PROCESO
 */
export function generateLookerStudio2Data(events: CalendarEvent[]): LookerStudio2Row[] {
  // Filtrar solo eventos de P3 Y que estén EXPLÍCITAMENTE programados
  const p3Events = events.filter(event => 
    event.planta === 'P3' && event.isScheduled === true
  );
  
  console.log(`📊 Generando datos Looker Studio 2 para ${p3Events.length} eventos programados de P3 (de ${events.filter(e => e.planta === 'P3').length} totales)`);
  
  // Agrupar por PEDIDO + POS + PROCESO y tomar solo la más reciente
  const groupedMap = new Map<string, CalendarEvent>();
  
  p3Events.forEach(event => {
    const key = `${event.pedido || ''}-${event.pos || 0}-${event.processType || event.category || ''}`;
    const existing = groupedMap.get(key);
    
    if (!existing) {
      groupedMap.set(key, event);
    } else {
      // Comparar fechas y quedarse con la más reciente
      const existingDate = new Date(existing.start);
      const currentDate = new Date(event.start);
      
      if (currentDate > existingDate) {
        groupedMap.set(key, event);
      }
    }
  });
  
  console.log(`📊 ${groupedMap.size} tareas únicas después de deduplicación (de ${p3Events.length} totales)`);
  
  // Convertir a filas
  const rows: LookerStudio2Row[] = Array.from(groupedMap.values()).map((event, index) => {
    const pedido = event.pedido || '';
    const pos = event.pos || 0;
    const id = `${pedido}${pos}`;
    const proyecto = event.product || '';
    const proceso = event.processType || event.category || '';
    
    // Mapear status a español
    let estatus = '';
    if (event.updateStatus) {
      estatus = event.updateStatus;
    } else {
      const statusMap: { [key: string]: string } = {
        'completed': 'COMPLETADO',
        'in-progress': 'EN PROCESO',
        'pending': 'PENDIENTE',
        'cancelled': 'CANCELADO'
      };
      estatus = statusMap[event.status] || event.status?.toUpperCase() || 'PENDIENTE';
    }
    
    // Debug: Log de los primeros 3 eventos
    if (index < 3) {
      console.log(`📋 P3 Evento ${index + 1}:`, {
        id,
        pedido,
        pos,
        proyecto,
        proceso,
        estatus,
        fecha: event.start
      });
    }
    
    const row: LookerStudio2Row = {
      ID: id,
      PEDIDO: pedido,
      POS: pos,
      PROYECTO: proyecto,
      PROCESO: proceso,
      ESTATUS: estatus
    };
    
    return row;
  });
  
  // Ordenar por PEDIDO y POS
  rows.sort((a, b) => {
    const pedidoCompare = a.PEDIDO.localeCompare(b.PEDIDO);
    if (pedidoCompare !== 0) return pedidoCompare;
    return a.POS - b.POS;
  });
  
  console.log(`✅ Generadas ${rows.length} filas para Looker Studio 2 (ordenadas por pedido y pos)`);
  
  return rows;
}

/**
 * Exporta los datos de P3 a Google Sheets en la hoja LOOKERSTUDIO2
 */
export async function exportToLookerStudio2(
  spreadsheetId: string,
  events: CalendarEvent[],
  accessToken: string
): Promise<{ success: boolean; message: string; rowsExported?: number }> {
  try {
    console.log('🚀 Iniciando exportación a Looker Studio 2 (P3)...');
    
    // Generar datos
    const data = generateLookerStudio2Data(events);
    
    if (data.length === 0) {
      return {
        success: false,
        message: 'No hay datos de Planta 3 para exportar'
      };
    }
    
    const sheetName = 'LOOKERSTUDIO2';
    
    // 1. Verificar si la hoja existe, si no crearla
    const sheetExists = await checkSheetExists(spreadsheetId, sheetName, accessToken);
    
    if (!sheetExists) {
      console.log(`📝 Creando hoja ${sheetName}...`);
      await createSheet(spreadsheetId, sheetName, accessToken);
    } else {
      console.log(`✅ Hoja ${sheetName} ya existe`);
    }
    
    // 2. Limpiar la hoja antes de escribir
    console.log('🧹 Limpiando datos anteriores...');
    await clearSheet(spreadsheetId, sheetName, accessToken);
    
    // 3. Preparar datos para escribir (headers + datos)
    const headers = ['ID', 'PEDIDO', 'POS', 'PROYECTO', 'PROCESO', 'ESTATUS'];
    const values = [
      headers,
      ...data.map(row => [
        row.ID,
        row.PEDIDO,
        row.POS,
        row.PROYECTO,
        row.PROCESO,
        row.ESTATUS
      ])
    ];
    
    console.log(`📊 Total valores a escribir: ${values.length} filas (incluyendo header)`);
    
    // 4. Escribir datos
    console.log(`📝 Escribiendo ${data.length} filas...`);
    await writeToSheet(spreadsheetId, sheetName, values, accessToken);
    
    // 5. Formatear la hoja
    console.log('🎨 Aplicando formato...');
    await formatLookerStudio2Sheet(spreadsheetId, sheetName, accessToken);
    
    console.log('✅ Exportación a Looker Studio 2 completada exitosamente');
    
    return {
      success: true,
      message: `Se exportaron ${data.length} filas a la hoja ${sheetName}`,
      rowsExported: data.length
    };
    
  } catch (error) {
    console.error('❌ Error en exportación a Looker Studio 2:', error);
    return {
      success: false,
      message: `Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

/**
 * Aplica formato a la hoja LOOKERSTUDIO2
 */
async function formatLookerStudio2Sheet(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<void> {
  // Obtener el sheetId
  const metadataResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );
  
  const metadata = await metadataResponse.json();
  const sheet = metadata.sheets.find((s: any) => s.properties.title === sheetName);
  const sheetId = sheet?.properties?.sheetId;
  
  if (!sheetId) {
    console.warn('No se pudo obtener sheetId para formatear');
    return;
  }
  
  const requests = [
    // Formato del header
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 1
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.4, blue: 0.6 },
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontSize: 11
            },
            horizontalAlignment: 'CENTER'
          }
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
      }
    },
    // Congelar primera fila
    {
      updateSheetProperties: {
        properties: {
          sheetId: sheetId,
          gridProperties: {
            frozenRowCount: 1
          }
        },
        fields: 'gridProperties.frozenRowCount'
      }
    },
    // Auto-resize columnas
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 6
        }
      }
    }
  ];
  
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    }
  );
}
