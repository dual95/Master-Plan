import * as XLSX from 'xlsx';
import * as fs from 'fs';

// Leer el archivo Excel local
const filePath = './MASTER PLAN 2.0 PRUEBA.xlsx';

try {
  const data = fs.readFileSync(filePath);
  const workbook = XLSX.read(data, { type: 'buffer' });
  
  console.log('📋 Hojas disponibles:', workbook.SheetNames);
  
  // Buscar la hoja PROCESOS PRD
  const procesosPrdSheet = workbook.SheetNames.find(name => 
    name.toUpperCase().includes('PROCESOS PRD') ||
    name.toUpperCase().includes('PROCESOS_PRD') ||
    name.toUpperCase() === 'PROCESOS PRD'
  );
  
  const targetSheet = procesosPrdSheet || workbook.SheetNames[0];
  console.log('🎯 Hoja seleccionada:', targetSheet);
  
  const worksheet = workbook.Sheets[targetSheet];
  console.log('🔍 Rango de la hoja:', worksheet['!ref']);
  
  // Obtener las primeras filas para ver la estructura
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, 
    range: 0, // Solo las primeras filas
    defval: '' 
  });
  
  console.log('📊 Primeras 5 filas del Excel:');
  jsonData.slice(0, 5).forEach((row, index) => {
    console.log(`Fila ${index + 1}:`, row);
  });
  
  // También probar el método automático
  const autoData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  console.log('🔍 Método automático - primera fila:', autoData[0]);
  console.log('🔍 Claves detectadas:', Object.keys(autoData[0] || {}));
  
} catch (error) {
  console.error('Error:', error.message);
}
