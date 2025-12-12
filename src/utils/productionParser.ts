import type { 
  CalendarEvent, 
  ProductionItem, 
  ProductionTask, 
  ProductionProcess, 
  SpreadsheetRow,
  ProcessConfiguration 
} from '../types';

// Configuración de procesos estándar por tipo de material
export const STANDARD_PROCESSES: ProcessConfiguration = {
  'BOLSA': [
    { id: 'impresion', name: 'IMPRESIÓN', duration: 2, sequence: 1, machine: 'COUCHE' },
    { id: 'barniz', name: 'BARNIZ', duration: 1, sequence: 2, dependencies: ['impresion'] },
    { id: 'laminado', name: 'LAMINADO', duration: 1.5, sequence: 3, dependencies: ['barniz'] },
    { id: 'troquelado', name: 'TROQUELADO', duration: 1, sequence: 4, dependencies: ['laminado'] },
    { id: 'ensamblaje', name: 'ENSAMBLAJE', duration: 2, sequence: 5, dependencies: ['troquelado'] }
  ],
  'PP': [
    { id: 'impresion', name: 'IMPRESIÓN', duration: 1.5, sequence: 1, machine: 'PP' },
    { id: 'troquelado', name: 'TROQUELADO', duration: 0.5, sequence: 2, dependencies: ['impresion'] },
    { id: 'ensamblaje', name: 'ENSAMBLAJE', duration: 1, sequence: 3, dependencies: ['troquelado'] }
  ],
  'COUCHE': [
    { id: 'impresion', name: 'IMPRESIÓN', duration: 2, sequence: 1, machine: 'COUCHE' },
    { id: 'barniz', name: 'BARNIZ', duration: 1, sequence: 2, dependencies: ['impresion'] },
    { id: 'ensamblaje', name: 'ENSAMBLAJE', duration: 1.5, sequence: 3, dependencies: ['barniz'] }
  ]
};

// Mapeo de máquinas por proceso y planta
export const MACHINE_MAPPING = {
  P3: { // Planta de Producción
    'IMPRESION': ['IMPRESION_01', 'IMPRESION_02', 'IMPRESION_03'],
    'BARNIZ': ['BARNIZ_01', 'BARNIZ_02'],
    'LAMINADO': ['LAMINADO_01', 'LAMINADO_02'],
    'ESTAMPADO': ['ESTAMPADO_01'],
    'REALZADO': ['REALZADO_01'],
    'TROQUELADO': ['TROQUELADO_01', 'TROQUELADO_02']
  },
  P2: { // Planta de Ensamblaje
    'ENSAMBLAJE': ['ENSAMBLAJE_01', 'ENSAMBLAJE_02', 'ENSAMBLAJE_03']
  }
};

// Interface para los datos de entrada desde Google Drive
export interface ProductionSpreadsheetRow {
  [key: string]: any;
  PEDIDO: string;
  POS: number | string;
  PROYECTO: string;
  COMPONENTE: string;
  MATERIAL: string;
  'F PRD': string;
  'CTD PEDIDO': number;
  PLIEGOS: number;
  'MC FECHAS': string;
  IMPRESION: boolean;
  BARNIZ: boolean;
  LAMINADO: boolean;
  ESTAMPADO: boolean;
  REALZADO: boolean;
  TROQUELADO: boolean;
  UPDATE?: string; // Nueva columna UPDATE
}

export interface ProductionPlan {
  items: ProductionItem[];
  tasks: ProductionTask[];
  machines: typeof MACHINE_MAPPING;
}

/**
 * Convierte una fila del spreadsheet a ProductionSpreadsheetRow con mapeo flexible de columnas
 */
function convertToProductionRow(row: SpreadsheetRow, debugIndex: number = 0): ProductionSpreadsheetRow | null {
  // Mapear nombres de columnas flexibles con debugging mejorado
  const getColumnValue = (possibleNames: string[], debugLabel?: string) => {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== '') {
        if (debugLabel && debugIndex <= 2) {
          console.log(`✅ ${debugLabel}: Encontrada columna "${name}" con valor "${row[name]}"`);
        }
        return row[name];
      }
    }
    if (debugLabel && debugIndex <= 2) {
      console.log(`❌ ${debugLabel}: No encontrada en`, possibleNames, 'disponibles:', Object.keys(row).filter(k => k.toLowerCase().includes(possibleNames[0].toLowerCase().split(' ')[0])));
    }
    return '';
  };

  // Utilidad para parsear números con comas y puntos (soporta formato europeo y americano)
  const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Eliminar espacios y símbolo de dólar
      let cleaned = value.trim().replace(/\$/g, '');
      
      // Detectar formato: si tiene coma como último separador, es formato europeo (1.234,56)
      // Si tiene punto como último separador, es formato americano (1,234.56)
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      
      if (lastComma > lastDot) {
        // Formato europeo: 1.234,56 o 1234,56
        // Eliminar puntos (separadores de miles) y reemplazar coma por punto
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else if (lastDot > lastComma) {
        // Formato americano: 1,234.56 o 1234.56
        // Eliminar comas (separadores de miles)
        cleaned = cleaned.replace(/,/g, '');
      } else if (lastComma === -1 && lastDot === -1) {
        // Sin separadores decimales, número entero
        // No hacer nada
      }
      
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // Buscar columnas con nombres flexibles
  const pedido = String(getColumnValue(['PO', 'PO_ID', 'PEDIDO', 'ORDER'], 'PO') || '').trim();
  const proyecto = String(getColumnValue(['PROYECTO', 'PROJECT', 'DESCRIPCION'], 'PROYECTO') || '').trim();
  const componente = String(getColumnValue(['COMPONENTE', 'COMPONENT', 'TIPO'], 'COMPONENTE') || '').trim();
  const pos = getColumnValue(['POS', 'POSICION', 'LINE'], 'POS');

  // Una fila es válida si tiene pedido O proyecto O posición válida
  if (!pedido && !proyecto && !pos) {
    return null;
  }

  // Crear objeto con mapeo flexible de columnas
  const result: ProductionSpreadsheetRow = {
    ...row,
    PEDIDO: pedido,
    POS: pos !== '' ? parseNumber(pos) : 0,
    PROYECTO: proyecto,
    COMPONENTE: componente,
    MATERIAL: String(getColumnValue(['MATERIAL', 'MAT', 'TYPE'], 'MATERIAL') || ''),
    'F PRD': String(getColumnValue(['F PRD', 'FECHA', 'DATE', 'REQ DATE'], 'F PRD') || ''),
    'CTD PEDIDO': getColumnValue(['CTD PEDIDO', 'CANTIDAD', 'QTY', 'QUANTITY', 'QTY + OVER'], 'CTD PEDIDO') !== '' ? parseNumber(getColumnValue(['CTD PEDIDO', 'CANTIDAD', 'QTY', 'QUANTITY', 'QTY + OVER'], 'CTD PEDIDO')) : 0,
    PLIEGOS: getColumnValue(['PLIEGOS', 'SHEETS', 'HOJAS'], 'PLIEGOS') !== '' ? parseNumber(getColumnValue(['PLIEGOS', 'SHEETS', 'HOJAS'], 'PLIEGOS')) : 0,
    'MC FECHAS': String(getColumnValue(['MC FECHAS', 'FECHAS'], 'MC FECHAS') || ''),
    UPDATE: String(getColumnValue(['UPDATE', 'ESTADO', 'STATUS'], 'UPDATE') || '').trim().toUpperCase(),
    '$/UND': getColumnValue(['$/UND', '$ / UND', '$/und', 'PRECIO', 'PRICE', 'UNIT_PRICE', 'PRECIO UNITARIO'], '$/UND') !== '' ? parseNumber(getColumnValue(['$/UND', '$ / UND', '$/und', 'PRECIO', 'PRICE', 'UNIT_PRICE', 'PRECIO UNITARIO'], '$/UND')) : 0,
    IMPRESION: String(row.IMPRESION || row.IMPRESIÓN || row['IMPRESIÓN'] || '').toUpperCase() === 'TRUE',
    BARNIZ: String(row.BARNIZ || '').toUpperCase() === 'TRUE',
    LAMINADO: String(row.LAMINADO || '').toUpperCase() === 'TRUE',
    ESTAMPADO: String(row.ESTAMPADO || '').toUpperCase() === 'TRUE',
    REALZADO: String(row.REALZADO || '').toUpperCase() === 'TRUE',
    TROQUELADO: String(row.TROQUELADO || '').toUpperCase() === 'TRUE'
  };

  // Debug: Log del objeto resultado para las primeras filas
  if (debugIndex <= 2) {
    console.log(`🔧 Objeto resultado fila ${debugIndex + 1}:`, {
      PEDIDO: result.PEDIDO,
      PROYECTO: result.PROYECTO,
      COMPONENTE: result.COMPONENTE,
      MATERIAL: result.MATERIAL,
      POS: result.POS,
      '$/UND': result['$/UND'], // Agregar logging del precio
      processes: {
        IMPRESION: result.IMPRESION,
        BARNIZ: result.BARNIZ,
        LAMINADO: result.LAMINADO,
        TROQUELADO: result.TROQUELADO
      }
    });
    // Debug adicional: mostrar todas las columnas disponibles
    console.log('📋 Columnas disponibles en la fila:', Object.keys(row).filter(k => k.includes('$') || k.toLowerCase().includes('precio') || k.toLowerCase().includes('price')));
  }

  return result;
}

export function parseProductionSpreadsheet(spreadsheetRows: SpreadsheetRow[]): ProductionPlan {
  const items: ProductionItem[] = [];
  const tasks: ProductionTask[] = [];
  let processedCount = 0; // Contador para debugging
  
  console.log('🎯 =================================');
  console.log('🎯 PARSEANDO HOJA DE PRODUCCIÓN');
  console.log('🎯 =================================');
  
  // Debug: Mostrar las columnas disponibles
  if (spreadsheetRows.length > 0) {
    const sampleRow = spreadsheetRows[0];
    const allKeys = Object.keys(sampleRow);
    
    console.log('📋 Total de filas recibidas:', spreadsheetRows.length);
    console.log('📋 Total de columnas:', allKeys.length);
    console.log('📋 Columnas disponibles:', allKeys);
    
    // Buscar las columnas clave
    const keyColumns = {
      PO: allKeys.find(k => k.toUpperCase() === 'PO'),
      PEDIDO: allKeys.find(k => k.toUpperCase() === 'PEDIDO'),
      PROJECT: allKeys.find(k => k.toUpperCase() === 'PROJECT'),
      PROYECTO: allKeys.find(k => k.toUpperCase() === 'PROYECTO'),
      POS: allKeys.find(k => k.toUpperCase() === 'POS'),
      MATERIAL: allKeys.find(k => k.toUpperCase() === 'MATERIAL'),
      UPDATE: allKeys.find(k => k.toUpperCase() === 'UPDATE')
    };
    
    console.log('🔑 Columnas clave encontradas:', keyColumns);
    console.log('📝 Muestra de primera fila:', {
      PO: sampleRow[keyColumns.PO || 'PO'],
      PROJECT: sampleRow[keyColumns.PROJECT || 'PROJECT'],
      MATERIAL: sampleRow[keyColumns.MATERIAL || 'MATERIAL'],
      POS: sampleRow[keyColumns.POS || 'POS']
    });
  } else {
    console.error('❌ No hay filas para procesar');
    return { items, tasks, machines: MACHINE_MAPPING };
  }

  // Debug: Analizar las primeras filas para entender el problema
  console.log('🔍 Analizando primeras 3 filas:');
  spreadsheetRows.slice(0, 3).forEach((row, index) => {
    console.log(`Fila ${index + 2}:`, {
      keys: Object.keys(row),
      values: Object.values(row).slice(0, 5), // Solo los primeros 5 valores
      PO: row.PO || row.PEDIDO,
      PROYECTO: row.PROYECTO,
      PROJECT: row.PROJECT,
      // 🚨 DEBUGGING CRÍTICO DE PROCESOS:
      procesosRaw: {
        'IMPRESION': row.IMPRESION,
        'IMPRESIÓN': row.IMPRESIÓN,
        'BARNIZ': row.BARNIZ,
        'LAMINADO': row.LAMINADO,
        'TROQUELADO': row.TROQUELADO,
        'ESTAMPADO': row.ESTAMPADO,
        'REALZADO': row.REALZADO
      },
      todasLasColumnasDeProcesos: Object.entries(row).filter(([key, value]) => 
        key.includes('IMPRES') || key.includes('BARNIZ') || key.includes('TROQUELADO') || 
        key.includes('LAMINADO') || key.includes('ESTAMPADO') || key.includes('REALZADO')
      ),
      hasValues: Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '')
    });
  });

  // Filtrar filas con un criterio más permisivo
  const validRows = spreadsheetRows.filter((row, index) => {
    // Buscar campos clave específicos incluyendo PROJECT
    const pedido = row.PO || row.PEDIDO || '';
    const proyecto = row.PROYECTO || row.PROJECT || '';
    const pos = row.POS || '';
    
    // Una fila es válida si tiene al menos pedido O proyecto O posición
    const isValid = String(pedido).trim() !== '' || 
                   String(proyecto).trim() !== '' || 
                   String(pos).trim() !== '';
    
    if (!isValid && index < 10) { // Log solo las primeras 10 filas inválidas
      console.log(`📄 Fila ${index + 2} omitida - PO: "${pedido}", PROYECTO: "${proyecto}", PROJECT: "${row.PROJECT}", POS: "${pos}"`);
    }
    
    return isValid;
  });

  console.log(`🔍 Filas válidas para procesar: ${validRows.length} de ${spreadsheetRows.length}`);
  
  // Procesos disponibles en el Excel
  const processColumns = ['IMPRESION', 'BARNIZ', 'LAMINADO', 'ESTAMPADO', 'REALZADO', 'TROQUELADO'];
  
  // Mapear nombres de columnas de procesos con tildes
  const getProcessValue = (row: any, processName: string): boolean => {
    const variants = [
      processName,
      processName === 'IMPRESION' ? 'IMPRESIÓN' : processName
    ];
    
    for (const variant of variants) {
      if (row[variant] !== undefined) {
        return String(row[variant]).toUpperCase() === 'TRUE';
      }
    }
    return false;
  };
  
  validRows.forEach((row, index) => {
    const typedRow = convertToProductionRow(row, processedCount);
    
    if (!typedRow) {
      if (index < 5) { // Solo log las primeras 5 filas rechazadas
        console.warn(`⚠️ Fila ${index + 2} omitida - datos:`, {
          PO: row.PO,
          PEDIDO: row.PEDIDO,
          PROYECTO: row.PROYECTO,
          PROJECT: row.PROJECT,
          POS: row.POS
        });
      }
      return;
    }

    processedCount++;

    // Log de primeras filas procesadas para debug
    if (processedCount <= 3) {
      console.log(`🔍 Fila ${processedCount} procesada exitosamente:`, {
        pedido: typedRow.PEDIDO,
        proyecto: typedRow.PROYECTO,
        material: typedRow.MATERIAL,
        pos: typedRow.POS,
        procesos: {
          IMPRESION: typedRow.IMPRESION,
          BARNIZ: typedRow.BARNIZ,
          LAMINADO: typedRow.LAMINADO,
          ESTAMPADO: typedRow.ESTAMPADO,
          REALZADO: typedRow.REALZADO,
          TROQUELADO: typedRow.TROQUELADO
        },
        procesosOriginales: {
          'IMPRESION (original)': row.IMPRESION,
          'IMPRESIÓN (con tilde)': row.IMPRESIÓN || row['IMPRESIÓN'],
          'BARNIZ': row.BARNIZ,
          'TROQUELADO': row.TROQUELADO
        }
      });
    }


    // Crear el item de producción
    const productionItem: ProductionItem = {
      id: `${typedRow.PEDIDO}-${typedRow.POS || index}`,
      pos: parseInt(String(typedRow.POS || index)),
      material: String(typedRow.MATERIAL || ''),
      quantity: parseInt(String(typedRow['CTD PEDIDO'] || 0)),
      pliegos: parseInt(String(typedRow.PLIEGOS || 0)),
      pedido: String(typedRow.PEDIDO),
      fechaEstimacion: String(typedRow['F PRD'] || ''),
      progresado: false, // Se puede calcular más tarde
      realizado: false,  // Se puede calcular más tarde
      laminado: isProcessRequired(typedRow.LAMINADO),
      estimacion: true,
      proyecto: String(typedRow.PROYECTO || ''),
      componente: String(typedRow.COMPONENTE || ''),
      unitPrice: parseFloat(String(typedRow['$/UND'] || 0)) // Agregar precio unitario
    };
    
    // Debug: verificar unitPrice en ProductionItem
    if (index <= 2) {
      console.log(`💰 ProductionItem creado para ${productionItem.pedido}:`, {
        'typedRow["$/UND"]': typedRow['$/UND'],
        'String(typedRow["$/UND"])': String(typedRow['$/UND'] || 0),
        'parseFloat': parseFloat(String(typedRow['$/UND'] || 0)),
        'productionItem.unitPrice': productionItem.unitPrice
      });
    }

    items.push(productionItem);

    // 🚨 DETECTAR SI LOS PROCESOS ESTÁN VACÍOS Y USAR FALLBACK
    const hasAnyProcess = processColumns.some(processType => {
      const processValue = processType === 'IMPRESION' 
        ? (row.IMPRESION || row.IMPRESIÓN || row['IMPRESIÓN'])
        : row[processType as keyof ProductionSpreadsheetRow];
      return isProcessRequired(processValue);
    });

    console.log(`🔍 Producto ${productionItem.pedido}: hasAnyProcess=${hasAnyProcess}, material=${productionItem.material}`);

    if (!hasAnyProcess) {
      console.log(`⚠️ No se encontraron procesos definidos para ${productionItem.pedido}. Usando procesos automáticos por material: ${productionItem.material}`);
      
      // USAR PROCESOS AUTOMÁTICOS BASADOS EN MATERIAL
      const productTasks = generateAutomaticTasksForProduct(productionItem, processColumns);
      tasks.push(...productTasks);
    } else {
      // Generar tareas para cada proceso requerido (método original)
      const productTasks = generateTasksForProduct(productionItem, typedRow, processColumns);
      tasks.push(...productTasks);
    }
  });

  // Log de resumen final
  console.log('📊 Resumen del procesamiento:');
  console.log(`   📦 Productos procesados: ${items.length}`);
  console.log(`   🔧 Total tareas generadas: ${tasks.length}`);
  console.log(`   🏭 Tareas P3: ${tasks.filter(t => t.planta === 'P3').length}`);
  console.log(`   🔧 Tareas P2: ${tasks.filter(t => t.planta === 'P2').length}`);

  return {
    items,
    tasks,
    machines: MACHINE_MAPPING
  };
}

/**
 * Genera tareas automáticas cuando no se detectan procesos en el Excel
 */
function generateAutomaticTasksForProduct(
  item: ProductionItem, 
  processColumns: string[]
): ProductionTask[] {
  const tasks: ProductionTask[] = [];
  let previousTaskId: string | null = null;
  
  console.log(`🤖 Generando procesos automáticos para ${item.pedido} (${item.material})`);
  
  // Definir procesos automáticos según material
  const automaticProcesses = getAutomaticProcessesByMaterial(item.material);
  
  automaticProcesses.forEach((processType, processIndex) => {
    const process: ProductionProcess = {
      id: processType.toLowerCase(),
      name: processType,
      duration: estimateProcessDuration(processType.toLowerCase(), item.pliegos, item.quantity),
      sequence: processIndex + 1,
      dependencies: previousTaskId ? [previousTaskId] : [],
      machine: getDefaultMachineForProcess(processType)
    };

    const taskId = `${item.pedido}-${processType}-${item.pos}-${Date.now()}-${processIndex}`;
    
    const task: ProductionTask = {
      id: taskId,
      title: generateStandardTaskName(item.proyecto, item.componente, processType),
      start: new Date(),
      end: new Date(new Date().setHours(23,59,59,999)), // Termina el mismo día
      description: `Pedido: ${item.pedido}\nProyecto: ${item.proyecto}\nComponente: ${item.componente}\nMaterial: ${item.material}\nCantidad: ${item.quantity}\n[PROCESO AUTOMÁTICO]`,
      priority: determineTaskPriority(item.fechaEstimacion),
      status: 'pending',
      category: processType,
      
      // Datos específicos de producción
      productId: item.id,
      pedido: item.pedido,
      processType: processType,
      duration: process.duration,
      quantity: item.quantity,
      dependencies: process.dependencies,
      machine: process.machine || 'Sin asignar',
      
      // Datos extendidos para ProductionTask
      productionItem: item,
      process: process,
      estimatedHours: process.duration,
      planta: 'P3',
      sequence: process.sequence,
      
      // Datos adicionales del Excel
      pos: item.pos,
      material: item.material,
      pliegos: item.pliegos,
      proyecto: item.proyecto,
      componente: item.componente,
      unitPrice: item.unitPrice || 0,
      updateStatus: '' // Las tareas automáticas no tienen estado inicial
    };

    tasks.push(task);
    previousTaskId = taskId;
    
    console.log(`  ✅ Proceso automático agregado: ${processType} (${process.duration}h)`);
  });

  // Agregar tarea de ensamblaje si tiene procesos previos
  if (tasks.length > 0) {
    const assignedLine = assignP2Line(); // Asignar línea automáticamente
    
    const ensambleProcess: ProductionProcess = {
      id: 'ensamblaje',
      name: 'ENSAMBLAJE',
      duration: Math.ceil(item.quantity / 1000), // 1 hora por cada 1000 unidades
      sequence: tasks.length + 1,
      dependencies: tasks.map(t => t.id),
      machine: assignedLine // Usar la línea asignada
    };
    
    const ensambleTaskId = `${item.pedido}-ENSAMBLAJE-${item.pos}-${Date.now()}`;
    
    // Debug: verificar unitPrice del item
    console.log(`🔍 Creando tarea ENSAMBLAJE para ${item.pedido}:`, {
      pedido: item.pedido,
      proyecto: item.proyecto,
      'item.unitPrice': item.unitPrice,
      pos: item.pos
    });
      
    const ensambleTask: ProductionTask = {
      id: ensambleTaskId,
      title: generateStandardTaskName(item.proyecto, item.componente, 'ENSAMBLAJE'),
      start: new Date(),
      end: new Date(new Date().setHours(23,59,59,999)), // Termina el mismo día
      description: `Pedido: ${item.pedido}\nProyecto: ${item.proyecto}\nComponente: ${item.componente}\nMaterial: ${item.material}\nCantidad: ${item.quantity}\n[ENSAMBLAJE AUTOMÁTICO]`,
      priority: determineTaskPriority(item.fechaEstimacion),
      status: 'pending',
      category: 'ENSAMBLAJE',
      
      // Datos específicos de producción
      productId: item.id,
      pedido: item.pedido,
      processType: 'ENSAMBLAJE',
      duration: ensambleProcess.duration,
      quantity: item.quantity,
      dependencies: ensambleProcess.dependencies,
      machine: assignedLine,
    
      // Datos extendidos para ProductionTask
      productionItem: item,
      process: ensambleProcess,
      estimatedHours: ensambleProcess.duration,
      planta: 'P2',
      sequence: ensambleProcess.sequence,
      
      // Datos adicionales del Excel
      pos: item.pos,
      material: item.material,
      pliegos: item.pliegos,
      proyecto: item.proyecto,
      componente: item.componente,
      linea: assignedLine, // Agregar línea asignada
      unitPrice: item.unitPrice || 0, // Agregar precio unitario
      updateStatus: '' // Las tareas automáticas no tienen estado inicial
    };

    tasks.push(ensambleTask);
    console.log(`  ✅ Ensamblaje automático agregado: ENSAMBLAJE (${ensambleProcess.duration}h) en P2`);
  }

  return tasks;
}

/**
 * Asigna automáticamente una línea de ensamblaje P2 basándose en la carga de trabajo
 * Distribuye las tareas equitativamente entre las líneas disponibles
 */
const P2_LINES = ['MOEX', 'YOBEL', 'MELISSA', 'CAJA 1', 'CAJA 2', 'CAJA 3'];
let currentLineIndex = 0;

function assignP2Line(): string {
  const line = P2_LINES[currentLineIndex];
  currentLineIndex = (currentLineIndex + 1) % P2_LINES.length;
  return line;
}

/**
 * Genera un ID único para una tarea con mejor aleatoriedad
 */
function generateUniqueTaskId(pedido: string, processType: string, pos: string | number, index: number): string {
  // Combinar timestamp con valores aleatorios para máxima unicidad
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const counter = index;
  
  return `${pedido}-${processType}-${pos}-${timestamp}-${counter}-${random}`;
}

/**
 * Genera la nomenclatura estándar [PROJECT]_[COMPONENTE] para tareas
 */
function generateStandardTaskName(proyecto: string, componente: string, processType: string): string {
  // Limpiar y normalizar los nombres
  const cleanProject = proyecto.trim().replace(/\s+/g, '_').toUpperCase();
  const cleanComponent = componente.trim().replace(/\s+/g, '_').toUpperCase();
  
  // Si no hay componente, usar solo el proyecto
  if (!cleanComponent) {
    return cleanProject;
  }
  
  // Formato estándar: [PROJECT]_[COMPONENTE] (sin el prefijo de proceso)
  const standardName = `${cleanProject}_${cleanComponent}`;
  return standardName;
}

// Función para determinar prioridad basada en fecha de entrega
function determineTaskPriority(fPrp: string): 'high' | 'medium' | 'low' {
  if (!fPrp) return 'medium';
  
  try {
    const deliveryDate = new Date(fPrp);
    const today = new Date();
    const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDelivery <= 3) return 'high';
    if (daysUntilDelivery <= 7) return 'medium';
    return 'low';
  } catch {
    return 'medium';
  }
}

/**
 * Determina procesos automáticos según el tipo de material
 */
function getAutomaticProcessesByMaterial(material: string): string[] {
  const materialUpper = material.toUpperCase();
  
  if (materialUpper.includes('PP')) {
    return ['IMPRESION', 'TROQUELADO'];
  } else if (materialUpper.includes('COUCHE')) {
    return ['IMPRESION', 'BARNIZ', 'TROQUELADO'];
  } else if (materialUpper.includes('CMPC')) {
    return ['IMPRESION', 'LAMINADO', 'TROQUELADO'];
  } else {
    // Default para cualquier material
    return ['IMPRESION', 'TROQUELADO'];
  }
}

/**
 * Genera tareas de producción para un producto específico
 */
function generateTasksForProduct(
  item: ProductionItem, 
  row: ProductionSpreadsheetRow, 
  processColumns: string[]
): ProductionTask[] {
  const tasks: ProductionTask[] = [];
  let previousTaskId: string | null = null;

  // Procesos de producción (P3)
  processColumns.forEach((processType, processIndex) => {
    // Usar la función helper para manejar variantes de nombres de columnas
    const processValue = processType === 'IMPRESION' 
      ? (row.IMPRESION || row.IMPRESIÓN || row['IMPRESIÓN'])
      : row[processType as keyof ProductionSpreadsheetRow];
      
    if (isProcessRequired(processValue)) {
      const process: ProductionProcess = {
        id: processType.toLowerCase(),
        name: processType,
        duration: estimateProcessDuration(processType.toLowerCase(), item.pliegos, item.quantity),
        sequence: processIndex + 1,
        dependencies: previousTaskId ? [previousTaskId] : [],
        machine: getDefaultMachineForProcess(processType)
      };

      const taskId = generateUniqueTaskId(item.pedido, processType, item.pos, processIndex);
      
      const task: ProductionTask = {
        id: taskId,
        title: generateStandardTaskName(item.proyecto, item.componente, processType),
        start: new Date(),
        end: new Date(new Date().setHours(23,59,59,999)), // Termina el mismo día
        description: `Pedido: ${item.pedido}\nProyecto: ${item.proyecto}\nComponente: ${item.componente}\nMaterial: ${item.material}\nCantidad: ${item.quantity}`,
        priority: determineTaskPriority(item.fechaEstimacion),
        status: 'pending',
        category: processType,
        
        // Datos específicos de producción
        productId: item.id,
        pedido: item.pedido,
        processType: processType,
        duration: process.duration,
        quantity: item.quantity,
        dependencies: process.dependencies,
        machine: process.machine || 'Sin asignar',
        
        // Datos extendidos para ProductionTask
        productionItem: item,
        process: process,
        estimatedHours: process.duration,
        planta: 'P3',
        sequence: process.sequence,
        
        // Datos adicionales del Excel
        pos: item.pos,
        material: item.material,
        pliegos: item.pliegos,
        proyecto: item.proyecto,
        componente: item.componente,
        unitPrice: item.unitPrice || 0,
        updateStatus: (row.UPDATE || '') as 'COMPLETED' | 'IN PROCESS' | 'PENDING' | ''
      };

      tasks.push(task);
      previousTaskId = taskId;
    }
  });

  // Agregar tarea de ensamblaje si tiene procesos previos
  if (tasks.length > 0) {
    const assignedLine = assignP2Line(); // Asignar línea automáticamente
    
    const ensambleProcess: ProductionProcess = {
      id: 'ensamblaje',
      name: 'ENSAMBLAJE',
      duration: Math.ceil(item.quantity / 1000), // 1 hora por cada 1000 unidades
      sequence: tasks.length + 1,
      dependencies: tasks.map(t => t.id),
      machine: assignedLine // Usar la línea asignada
    };
    
    const ensambleTaskId = generateUniqueTaskId(item.pedido, 'ENSAMBLAJE', item.pos, tasks.length);
      
      const ensambleTask: ProductionTask = {
        id: ensambleTaskId,
        title: generateStandardTaskName(item.proyecto, item.componente, 'ENSAMBLAJE'),
        start: new Date(),
        end: new Date(new Date().setHours(23,59,59,999)), // Termina el mismo día
        description: `Pedido: ${item.pedido}\nProyecto: ${item.proyecto}\nComponente: ${item.componente}\nMaterial: ${item.material}\nCantidad: ${item.quantity}`,
        priority: determineTaskPriority(item.fechaEstimacion),
        status: 'pending',
        category: 'ENSAMBLAJE',
        
        // Datos específicos de producción
        productId: item.id,
        pedido: item.pedido,
        processType: 'ENSAMBLAJE',
        duration: ensambleProcess.duration,
        quantity: item.quantity,
        dependencies: ensambleProcess.dependencies,
        machine: assignedLine,
      
      // Datos extendidos para ProductionTask
      productionItem: item,
      process: ensambleProcess,
      estimatedHours: ensambleProcess.duration,
      planta: 'P2',
      sequence: ensambleProcess.sequence,
      
      // Datos adicionales del Excel
      pos: item.pos,
      material: item.material,
      pliegos: item.pliegos,
      proyecto: item.proyecto,
      componente: item.componente,
      unitPrice: item.unitPrice || 0,
      linea: assignedLine, // Agregar línea asignada
      updateStatus: (row.UPDATE || '') as 'COMPLETED' | 'IN PROCESS' | 'PENDING' | ''
    };

    tasks.push(ensambleTask);
  }

  return tasks;
}

/**
 * Verifica si un proceso es requerido basado en el valor del Excel
 */
function isProcessRequired(value: string | boolean | number | Date | undefined): boolean {
  if (value === undefined || value === null) return false;
  
  const stringValue = String(value).toUpperCase();
  return stringValue === 'TRUE' || stringValue === '1' || stringValue === 'SÍ' || stringValue === 'SI' || value === true;
}

/**
 * Obtiene la máquina por defecto para un proceso
 */
function getDefaultMachineForProcess(processType: string): string {
  const processUpper = processType.toUpperCase();
  
  if (MACHINE_MAPPING.P3[processUpper as keyof typeof MACHINE_MAPPING.P3]) {
    return MACHINE_MAPPING.P3[processUpper as keyof typeof MACHINE_MAPPING.P3][0];
  }
  
  if (MACHINE_MAPPING.P2[processUpper as keyof typeof MACHINE_MAPPING.P2]) {
    return MACHINE_MAPPING.P2[processUpper as keyof typeof MACHINE_MAPPING.P2][0];
  }
  
  return 'Sin asignar';
}

/**
 * Estima la duración de un proceso basado en tipo y cantidad
 */
function estimateProcessDuration(processType: string, pliegos: number, cantidad: number): number {
  const baseDurations: Record<string, number> = {
    impresion: 0.5, // horas por cada 100 pliegos
    barniz: 0.3,
    laminado: 0.4,
    estampado: 0.6,
    realzado: 0.5,
    troquelado: 0.7
  };

  const baseHours = baseDurations[processType.toLowerCase()] || 0.5;
  const estimatedHours = Math.max(1, Math.ceil((pliegos / 100) * baseHours + (cantidad / 5000)));
  
  return estimatedHours;
}

/**
 * Convierte tareas de producción a eventos de calendario
 */
export function convertTasksToCalendarEvents(tasks: ProductionTask[]): CalendarEvent[] {
  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    start: task.start,
    end: task.end,
    priority: task.priority,
    status: task.status,
    category: task.category,
    assignee: task.machine,
    
    // Datos específicos de producción
    productId: task.productId,
    pedido: task.pedido,
    processType: task.processType,
    duration: task.duration,
    quantity: task.quantity,
    dependencies: task.dependencies,
    machine: task.machine,
    
    // Datos adicionales del Excel
    pos: task.pos,
    material: task.material,
    pliegos: task.pliegos,
    proyecto: task.proyecto,
    componente: task.componente,
    planta: task.planta,
    linea: task.linea,
    unitPrice: task.unitPrice,
    updateStatus: task.updateStatus
  }));
}

/**
 * Programa automáticamente las tareas considerando dependencias y disponibilidad de máquinas
 */
export function scheduleProductionTasks(tasks: ProductionTask[], startDate: Date = new Date()): ProductionTask[] {
  const scheduledTasks = [...tasks];
  const machineSchedules: { [machine: string]: Date } = {};
  
  // Ordenar tareas por prioridad y dependencias
  const sortedTasks = scheduledTasks.sort((a, b) => {
    // Prioridad: high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Fecha de entrega más cercana primero
    const dateA = new Date(a.productionItem.fechaEstimacion || '2999-12-31');
    const dateB = new Date(b.productionItem.fechaEstimacion || '2999-12-31');
    return dateA.getTime() - dateB.getTime();
  });

  // Programar cada tarea
  sortedTasks.forEach(task => {
    let taskStartDate = new Date(startDate);
    
    // Verificar dependencias
    if (task.dependencies && task.dependencies.length > 0) {
      const dependencyTasks = scheduledTasks.filter(t => task.dependencies!.includes(t.id));
      if (dependencyTasks.length > 0) {
        const latestDependencyEnd = Math.max(
          ...dependencyTasks.map(t => new Date(t.end).getTime())
        );
        taskStartDate = new Date(Math.max(taskStartDate.getTime(), latestDependencyEnd));
      }
    }
    
    // Verificar disponibilidad de máquina
    const machine = task.machine;
    if (machineSchedules[machine]) {
      taskStartDate = new Date(Math.max(taskStartDate.getTime(), machineSchedules[machine].getTime()));
    }
    
    // Ajustar para horario laboral (8:00 - 18:00)
    taskStartDate = adjustToWorkingHours(taskStartDate);
    
    const taskEndDate = new Date(new Date(taskStartDate).setHours(23,59,59,999)); // Termina el mismo día
    
    // Actualizar las fechas de la tarea
    task.start = taskStartDate;
    task.end = taskEndDate;
    
    // Actualizar el horario de la máquina
    machineSchedules[machine] = taskEndDate;
  });

  return scheduledTasks;
}

/**
 * Ajusta una fecha al horario laboral
 */
function adjustToWorkingHours(date: Date): Date {
  const adjustedDate = new Date(date);
  const hours = adjustedDate.getHours();
  
  // Si es antes de las 8:00, mover a las 8:00
  if (hours < 8) {
    adjustedDate.setHours(8, 0, 0, 0);
  }
  // Si es después de las 18:00, mover al día siguiente a las 8:00
  else if (hours >= 18) {
    adjustedDate.setDate(adjustedDate.getDate() + 1);
    adjustedDate.setHours(8, 0, 0, 0);
  }
  
  // Si es fin de semana, mover al lunes
  const dayOfWeek = adjustedDate.getDay();
  if (dayOfWeek === 0) { // Domingo
    adjustedDate.setDate(adjustedDate.getDate() + 1);
  } else if (dayOfWeek === 6) { // Sábado
    adjustedDate.setDate(adjustedDate.getDate() + 2);
  }
  
  return adjustedDate;
}

/**
 * Genera datos de muestra para pruebas
 */
export function generateSampleProductionData(): ProductionPlan {
  const sampleRows: ProductionSpreadsheetRow[] = [
    {
      PEDIDO: '1402048642',
      POS: 10,
      PROYECTO: 'BOLSA ROGERS ENTERPRISES 10"X4"X7"75',
      COMPONENTE: 'BOLSA',
      MATERIAL: 'PP',
      'F PRD': '2025-01-15',
      'CTD PEDIDO': 21000,
      PLIEGOS: 1050,
      'MC FECHAS': '2025-01-01',
      IMPRESION: true,
      BARNIZ: true,
      LAMINADO: false,
      ESTAMPADO: false,
      REALZADO: false,
      TROQUELADO: true
    },
    {
      PEDIDO: '1402048677',
      POS: 10,
      PROYECTO: 'BOLSA FRED MEYER 6"X3.5"X3"',
      COMPONENTE: 'BOLSA',
      MATERIAL: 'COUCHE',
      'F PRD': '2025-01-20',
      'CTD PEDIDO': 39294,
      PLIEGOS: 3600,
      'MC FECHAS': '2025-01-02',
      IMPRESION: true,
      BARNIZ: false,
      LAMINADO: true,
      ESTAMPADO: true,
      REALZADO: false,
      TROQUELADO: true
    },
    {
      PEDIDO: '1402049207',
      POS: 30,
      PROYECTO: 'BOLSA PINOS JEWELERS 7"X5"X9"',
      COMPONENTE: 'BOLSA',
      MATERIAL: 'COUCHE',
      'F PRD': '2025-01-10',
      'CTD PEDIDO': 14400,
      PLIEGOS: 1200,
      'MC FECHAS': '2025-01-03',
      IMPRESION: true,
      BARNIZ: true,
      LAMINADO: false,
      ESTAMPADO: false,
      REALZADO: true,
      TROQUELADO: true
    }
  ];

  const plan = parseProductionSpreadsheet(sampleRows);
  
  // Programar las tareas automáticamente
  plan.tasks = scheduleProductionTasks(plan.tasks);
  
  return plan;
}
