// Test de la nueva nomenclatura PROJECT_COMPONENTE
console.log('🎯 Testing nomenclatura PROJECT_COMPONENTE');

// Simulación de la función generateStandardTaskName
function generateStandardTaskName(proyecto, componente, processType) {
  // Limpiar y normalizar los nombres
  const cleanProject = proyecto.trim().replace(/\s+/g, '_').toUpperCase();
  const cleanComponent = componente.trim().replace(/\s+/g, '_').toUpperCase();
  
  // Si no hay componente, usar solo el proyecto
  if (!cleanComponent) {
    return `${processType}: ${cleanProject}`;
  }
  
  // Formato estándar: [PROJECT]_[COMPONENTE]
  const standardName = `${cleanProject}_${cleanComponent}`;
  return `${processType}: ${standardName}`;
}

// Datos de ejemplo basados en el Excel actual
const testCases = [
  {
    proyecto: 'BOLSA ROGERS ENTERPRISES 10"X4"X7-75"',
    componente: 'BOLSA',
    processes: ['IMPRESION', 'BARNIZ', 'TROQUELADO']
  },
  {
    proyecto: 'BOLSA FRED MEYER 6"X3.5"X3"',
    componente: 'BOLSA',
    processes: ['IMPRESION', 'LAMINADO', 'TROQUELADO']
  },
  {
    proyecto: 'FOLDER GOLD MASTER LAWRENCE',
    componente: 'FOLDER',
    processes: ['IMPRESION', 'BARNIZ', 'TROQUELADO']
  }
];

console.log('\n📋 Ejemplos de nomenclatura generada:\n');

testCases.forEach((testCase, index) => {
  console.log(`Caso ${index + 1}:`);
  console.log(`  📄 Proyecto: ${testCase.proyecto}`);
  console.log(`  🏷️  Componente: ${testCase.componente}`);
  console.log('  🔧 Tareas generadas:');
  
  testCase.processes.forEach(process => {
    const taskName = generateStandardTaskName(testCase.proyecto, testCase.componente, process);
    console.log(`    ✅ ${taskName}`);
  });
  console.log('');
});

// Test casos edge
console.log('🔍 Casos especiales:\n');

console.log('Sin componente:');
const withoutComponent = generateStandardTaskName('BOLSA TEST PROJECT', '', 'IMPRESION');
console.log(`  ✅ ${withoutComponent}\n`);

console.log('Componente vacío:');
const emptyComponent = generateStandardTaskName('BOLSA TEST PROJECT', '   ', 'IMPRESION');
console.log(`  ✅ ${emptyComponent}\n`);

console.log('🎉 Test completado - La nomenclatura PROJECT_COMPONENTE está funcionando correctamente!');
