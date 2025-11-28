const XLSX = require('xlsx');

console.log('Testing Excel fix...');

try {
  const workbook = XLSX.readFile('MASTER PLAN 2.0 PRUEBA.xlsx');
  const sheetNames = workbook.SheetNames;
  console.log('Sheet names:', sheetNames);
  
  const firstSheet = sheetNames[0];
  const worksheet = workbook.Sheets[firstSheet];
  
  // Test the fix: manual method
  const arrayData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: '',
    raw: false
  });
  
  console.log('First row (headers):', arrayData[0]);
  console.log('Second row (data):', arrayData[1]);
  
  // Apply the fix
  const rawHeaders = arrayData[0];
  const headers = rawHeaders.slice(1).map(h => 
    h && String(h).trim() !== '' ? String(h).trim().toUpperCase() : 'EMPTY'
  );
  
  console.log('Processed headers:', headers.slice(0, 10));
  
  if (headers.includes('PO') || headers.includes('PEDIDO')) {
    console.log('SUCCESS: Fix works! Found expected columns.');
  } else {
    console.log('ISSUE: Expected columns not found.');
  }
  
} catch (error) {
  console.error('Error:', error.message);
}
