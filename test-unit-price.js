/**
 * Script para depurar la lectura de la columna $/UND
 * 
 * Este script simula el proceso de lectura de una fila del Excel
 * para identificar por qué la columna $/UND se lee como 0
 */

// Simular una fila del spreadsheet tal como viene de Google Sheets
const simulatedRow = {
  'PEDIDO': '140204863210',
  'POS': '2',
  'PROYECTO': 'SKINCARE OIL - HIGH END BOX',
  'TROQUELADO': 'TRUE',
  '$/UND': '1,0640', // Formato con coma como en la imagen
  // También probar otros formatos posibles:
  // '$/UND': '$1,0640',
  // '$/UND': '1.0640',
  // '$/UND': 1.0640,
};

// Función parseNumber tal como está en productionParser.ts
const parseNumber = (value) => {
  console.log('📥 parseNumber recibe:', { tipo: typeof value, valor: value });
  
  if (typeof value === 'number') {
    console.log('✅ Ya es número:', value);
    return value;
  }
  
  if (typeof value === 'string') {
    // Primero eliminar el símbolo $ si existe
    let cleaned = value.replace(/\$/g, '');
    console.log('🧹 Después de quitar $:', cleaned);
    
    // Eliminar puntos (separadores de miles) y reemplazar comas por puntos
    cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
    console.log('🧹 Después de limpiar separadores:', cleaned);
    
    const num = Number(cleaned);
    console.log('🔢 Resultado Number():', { num, esNaN: isNaN(num) });
    
    return isNaN(num) ? 0 : num;
  }
  
  console.log('❌ Tipo no soportado, retornando 0');
  return 0;
};

// Función getColumnValue simulada
const getColumnValue = (possibleNames, debugLabel) => {
  for (const name of possibleNames) {
    if (simulatedRow[name] !== undefined && simulatedRow[name] !== null && String(simulatedRow[name]).trim() !== '') {
      console.log(`✅ ${debugLabel}: Encontrada columna "${name}" con valor "${simulatedRow[name]}"`);
      return simulatedRow[name];
    }
  }
  console.log(`❌ ${debugLabel}: No encontrada en`, possibleNames);
  return '';
};

// Test principal
console.log('🧪 ===== TEST DE LECTURA DE $/UND =====\n');

console.log('1️⃣ Probando getColumnValue:');
const foundValue = getColumnValue(['$/UND', '$ / UND', '$/und', 'PRECIO', 'PRICE'], '$/UND');
console.log('Valor encontrado:', foundValue);
console.log('');

console.log('2️⃣ Probando parseNumber con el valor encontrado:');
const parsedValue = parseNumber(foundValue);
console.log('Valor final:', parsedValue);
console.log('');

console.log('3️⃣ Resultado completo:');
const finalUnitPrice = foundValue !== '' ? parseNumber(foundValue) : 0;
console.log('$/UND final:', finalUnitPrice);
console.log('');

// Probar diferentes formatos
console.log('4️⃣ Probando diferentes formatos:');
const testFormats = [
  '1,0640',    // Formato con coma decimal (europeo)
  '1.0640',    // Formato con punto decimal
  '$1,0640',   // Con símbolo de dólar
  '$1.0640',   // Con símbolo de dólar y punto
  '1,064.0',   // Formato americano (coma miles, punto decimal)
  1.0640,      // Ya es número
];

testFormats.forEach(format => {
  console.log(`\nFormato: "${format}" (${typeof format})`);
  const result = parseNumber(format);
  console.log(`Resultado: ${result}`);
});

console.log('\n🎯 ===== FIN DEL TEST =====');
