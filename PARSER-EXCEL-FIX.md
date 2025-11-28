# 🔧 Parser Excel - Corrección de "Datos Insuficientes"

## 🐛 Problema Identificado
```
⚠️ Fila X omitida: datos insuficientes
```

## 📋 Análisis del Excel
Basándome en la captura, el Excel tiene estas columnas:
- **PO** (en lugar de PEDIDO)
- **POS** 
- **PROYECTO**
- **MATERIAL** 
- **IMPRESION**, **BARNIZ**, **LAMINADO**, **ESTAMPADO**, **REALZADO**, **TROQUELADO**

## ✅ Soluciones Implementadas

### **1. Mapeo Flexible de Columnas**
```typescript
const getColumnValue = (possibleNames: string[]) => {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== '') {
      return row[name];
    }
  }
  return '';
};

// Mapeos flexibles
const pedido = String(getColumnValue(['PEDIDO', 'PO', 'ORDER']) || '');
const proyecto = String(getColumnValue(['PROYECTO', 'PROJECT', 'DESCRIPCION']) || '');
```

### **2. Validación Mejorada**
```typescript
// Solo requiere PEDIDO O PROYECTO (no ambos)
if (!pedido && !proyecto) {
  return null;
}
```

### **3. Filtrado de Filas Vacías**
```typescript
const validRows = spreadsheetRows.filter((row, index) => {
  const hasAnyData = Object.values(row).some(value => 
    value !== null && value !== undefined && String(value).trim() !== ''
  );
  return hasAnyData;
});
```

### **4. Logs de Debugging Mejorados**
```typescript
console.log('📋 Columnas disponibles en Excel:', Object.keys(sampleRow));
console.log('📊 Total de filas a procesar:', spreadsheetRows.length);
console.log('🔍 Filas válidas para procesar:', validRows.length);
```

## 🎯 Resultado Esperado
Después de estos cambios, deberías ver:
```
📋 Columnas disponibles en Excel: ['PO', 'POS', 'PROYECTO', 'MATERIAL', ...]
📊 Total de filas a procesar: 999
🔍 Filas válidas para procesar: 85
🔍 Primera fila procesada: { pedido: "1402249737", proyecto: "BOLSA MAUI...", ... }
✅ Procesado desde Excel hoja "PROCESOS PRD": 85 productos → X tareas P3 + Y tareas P2
```

## 🚀 Próximos Pasos
1. **Recarga la página** del navegador
2. **Vuelve a cargar el archivo Excel**
3. **Revisa la consola** para ver los nuevos logs informativos
4. **Verifica que se generen tareas** en el calendario

---

**Los cambios están ya aplicados y deberían resolver el problema de "datos insuficientes".**
