# 🔧 Excel Support - Troubleshooting Guide

## 🐛 Problemas Comunes y Soluciones

### **Error: "Failed to execute 'atob' on 'Window'"**

#### 🔍 **Diagnóstico**
```
Error convirtiendo respuesta a ArrayBuffer: 
DOMException: Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.
```

#### 🔧 **Causas Comunes**
1. **Google Drive API respuesta no es base64** - La respuesta viene en formato binario directo
2. **Codificación incorrecta** - Datos binarios tratados como texto
3. **CORS issues** - Problemas de política de origen cruzado

#### ✅ **Soluciones Implementadas**

##### **1. Descarga Directa con Fetch API**
```typescript
// Método preferido - Descarga directa
const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
const response = await fetch(downloadUrl, {
  headers: {
    'Authorization': `Bearer ${this.accessToken}`
  }
});
const arrayBuffer = await response.arrayBuffer();
```

##### **2. Fallback con GAPI Client + Manejo Robusto**
```typescript
// Método de respaldo si fetch falla
const gapiResponse = await this.gapi.client.drive.files.get({
  fileId: fileId,
  alt: 'media'
});
const arrayBuffer = this.responseToArrayBuffer(gapiResponse);
```

##### **3. Función responseToArrayBuffer Mejorada**
```typescript
private responseToArrayBuffer(response: any): ArrayBuffer {
  // Maneja múltiples formatos:
  // - ArrayBuffer directo
  // - Uint8Array
  // - String base64
  // - String binario
  // - Objetos con .body o .result
}
```

---

## 🧪 Pasos de Depuración

### **1. Verificar Logs de Consola**
Buscar estos mensajes en la consola del navegador:
```
📗 Leyendo archivo Excel desde Google Drive...
🔄 Intentando descarga directa con fetch...
✅ Descarga directa exitosa, tamaño: XXXXX bytes
```

### **2. Si Aparece Warning de Fallback**
```
⚠️ Descarga directa falló, intentando con gapi.client...
✅ Descarga con gapi.client exitosa, tamaño: XXXXX bytes
```
Esto es normal y el sistema debería funcionar correctamente.

### **3. Verificar Permisos de Google Drive**
- Confirmar que la aplicación tiene permisos de lectura
- Verificar que el token OAuth está activo
- Comprobar que el archivo existe y es accesible

### **4. Validar Formato del Archivo**
```typescript
// El sistema detecta automáticamente:
mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
mimeType === 'application/vnd.ms-excel' // .xls
```

---

## 🔍 Información de Depuración Adicional

### **Logs Detallados Disponibles**
```
🔍 Analizando tipo de respuesta: [object/string/etc]
🔍 Es ArrayBuffer? [true/false]
✅ Respuesta ya es ArrayBuffer
✅ Convirtiendo Uint8Array a ArrayBuffer
✅ Decodificado como base64
⚠️ No es base64, tratando como string binario
```

### **Verificación de Tamaño de Archivo**
- **Archivos pequeños** (< 1MB): Descarga inmediata
- **Archivos medianos** (1-10MB): Puede tardar unos segundos
- **Archivos grandes** (> 10MB): Considerar optimización

---

## 🚨 Errores Específicos y Soluciones

### **Error: "HTTP 403: Forbidden"**
```
Causa: Sin permisos para acceder al archivo
Solución: Verificar que el archivo es accesible por la aplicación OAuth
```

### **Error: "HTTP 404: Not Found"**
```
Causa: Archivo no existe o ID incorrecto
Solución: Verificar que el archivo existe en Google Drive
```

### **Error: "Invalid file format"**
```
Causa: Archivo no es Excel válido o está corrupto
Solución: Verificar integridad del archivo Excel
```

### **Error: "No data found in Excel sheet"**
```
Causa: Hoja está vacía o no tiene el formato esperado
Solución: Verificar que la hoja "PROCESOS PRD" tiene datos
```

---

## 🎯 Validación del Proceso Excel

### **Checklist de Funcionamiento Correcto**

#### ✅ **Paso 1: Listado de Archivos**
- [ ] Archivos Excel aparecen con badge naranja 📗
- [ ] Botón muestra "📗 Cargar Excel"
- [ ] No hay errores en consola

#### ✅ **Paso 2: Descarga de Archivo**
- [ ] Mensaje: "📗 Leyendo archivo Excel desde Google Drive..."
- [ ] Sin errores de atob o ArrayBuffer
- [ ] Tamaño de archivo reportado correctamente

#### ✅ **Paso 3: Análisis de Hojas**
- [ ] Lista de hojas disponibles se muestra
- [ ] Detección automática de "PROCESOS PRD"
- [ ] Fallback a primera hoja si no encuentra "PROCESOS PRD"

#### ✅ **Paso 4: Procesamiento de Datos**
- [ ] Headers detectados correctamente
- [ ] Número de filas reportado
- [ ] Generación de tareas P2/P3 exitosa

#### ✅ **Paso 5: Visualización Final**
- [ ] Eventos aparecen en calendario
- [ ] Separación visual P2 (verde) y P3 (naranja)
- [ ] Drag & drop funciona normalmente

---

## 🔄 Si Todo Falla: Método Manual

### **Conversión a Google Sheets**
1. Abrir archivo Excel en Google Drive
2. "Abrir con Google Sheets"
3. Guardar como Google Sheets
4. Usar el flujo normal de Google Sheets

### **Verificación de Formato**
- Asegurar que la hoja se llama exactamente "PROCESOS PRD"
- Verificar que las columnas necesarias están presentes
- Confirmar que hay datos en las filas

---

## 🛠️ Configuración de Desarrollo

### **Para Desarrolladores**
```bash
# Verificar dependencias
npm list xlsx
npm list @types/xlsx

# Logs adicionales en desarrollo
console.log('🔍 Response type:', typeof response);
console.log('🔍 Response keys:', Object.keys(response || {}));
```

### **Variables de Entorno**
```
VITE_GOOGLE_CLIENT_ID=tu_client_id
VITE_GOOGLE_API_KEY=tu_api_key
```

---

**✅ Con estas mejoras, el sistema maneja automáticamente los diferentes formatos de respuesta de Google Drive API y proporciona mensajes de error claros para facilitar el debugging.**
