const XLSX = require('xlsx');
const fs = require('fs');

console.log('🔍 Analizando archivo Excel con el método corregido...');

// Cargar el archivo Excel local para probar el fix
try {
  const workbook = XLSX.readFile('./MASTER PLAN 2.0 PRUEBA.xlsx');
  console.log('✅ Archivo Excel cargado exitosamente');
  
  const sheetNames = workbook.SheetNames;
  console.log('📋 Hojas disponibles:', sheetNames);
  
  // Buscar hoja "PROCESOS PRD"
  let targetSheet = sheetNames.find(name => 
    name.toUpperCase().includes('PROCESOS PRD') ||
    name.toUpperCase().includes('PROCESOS_PRD') ||
    name.toUpperCase() === 'PROCESOS PRD'
  );
  
  if (!targetSheet) {
    targetSheet = sheetNames[0];
    console.warn(`⚠️ No se encontró hoja "PROCESOS PRD", usando: "${targetSheet}"`);
  } else {
    console.log(`✅ Encontrada hoja de producción: "${targetSheet}"`);
  }
  
  const worksheet = workbook.Sheets[targetSheet];
  console.log('🔍 Rango de la hoja:', worksheet['!ref']);
  
  // APLICAR EL FIX: Método manual en lugar del automático
  console.log('✅ Usando método manual para headers correctos...');
  
  // Conversión manual con array de arrays (FIJO)
  const arrayData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,  // Tratar la primera fila como array, no como headers
    defval: '',
    raw: false,
    range: 1 // Empezar desde la fila 2 (B2) para evitar títulos en A1
  });
  
  if (arrayData.length === 0) {
    throw new Error('No data found in Excel sheet');
  }
  
  console.log('🔍 Datos sin procesar (primeras 2 filas):');
  console.log('  Fila 0:', arrayData[0]);
  console.log('  Fila 1:', arrayData[1]);
  
  // 🚨 FIX CRÍTICO: La primera fila contiene los headers reales
  const rawHeaders = arrayData[0];
  
  // Procesar headers: tomar desde índice 1 (columna B) y limpiar
  const headers = rawHeaders.slice(1).map((header, index) => {
    const cleanHeader = header && String(header).trim() !== '' ? 
      String(header).trim().toUpperCase() : 
      `COL${index + 2}`; // +2 porque empezamos desde B
    return cleanHeader;
  }).filter(h => h !== ''); // Eliminar headers vacíos
  
  console.log('🔍 Headers procesados desde primera fila:', headers);
  
  // Convertir el resto de las filas a objetos (empezar desde fila 2)
  const jsonData = arrayData.slice(1).map((row) => {
    const rowArray = row;
    const rowObject = {};
    
    // Procesar desde columna B (índice 1)
    const dataValues = rowArray.slice(1);
    
    headers.forEach((header, index) => {
      rowObject[header] = dataValues[index] ? String(dataValues[index]) : '';
    });
    
    return rowObject;
  }).filter(row => {
    // Filtrar filas completamente vacías
    return Object.values(row).some(value => value && String(value).trim() !== '');
  });
  
  console.log(`✅ Excel procesado exitosamente:`);
  console.log(`   📊 Hoja: "${targetSheet}"`);
  console.log(`   📋 Headers detectados: ${headers.length} columnas`);
  console.log(`   📋 Headers completos:`, headers);
  console.log(`   📄 Datos: ${jsonData.length} filas`);
  
  if (jsonData.length > 0) {
    console.log('🔍 Análisis de primera fila de datos:');
    console.log('   - Claves disponibles:', Object.keys(jsonData[0]));
    console.log('   - Valores muestra:', Object.entries(jsonData[0]).slice(0, 8));
    
    // Buscar las columnas clave específicamente
    const keyColumns = ['PO', 'PEDIDO', 'PROYECTO', 'PROJECT', 'MATERIAL', 'IMPRESION'];
    console.log('🔍 Verificación de columnas clave:');
    keyColumns.forEach(col => {
      if (jsonData[0][col] !== undefined) {
        console.log(`   ✅ ${col}: "${jsonData[0][col]}"`);
      } else {
        console.log(`   ❌ ${col}: NO ENCONTRADA`);
      }
    });
    
    // Contar filas con datos válidos
    const validRows = jsonData.filter(row => {
      const pedido = row.PO || row.PEDIDO || '';
      const proyecto = row.PROYECTO || row.PROJECT || '';
      return String(pedido).trim() !== '' || String(proyecto).trim() !== '';
    });
    
    console.log(`🎯 RESULTADO DEL FIX:`);
    console.log(`   📊 Filas totales procesadas: ${jsonData.length}`);
    console.log(`   ✅ Filas válidas con datos: ${validRows.length}`);
    console.log(`   🔧 Headers mapeados correctamente: ${headers.includes('PO') || headers.includes('PEDIDO') ? 'SÍ' : 'NO'}`);
    
    if (validRows.length > 0) {
      console.log('✅ FIX EXITOSO: Se pueden procesar los datos de Excel correctamente');
    } else {
      console.log('❌ FIX FALLÓ: No se encontraron filas válidas');
    }
  }
  
} catch (error) {
  console.error('❌ Error analizando Excel:', error.message);
}
