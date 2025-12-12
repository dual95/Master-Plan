# 📊 Guía de Exportación a Looker Studio

## ✅ Implementación Completada

Se ha implementado la funcionalidad completa de exportación de datos de **Planta 2 (P2)** a Google Sheets para su uso en Looker Studio.

## 🎯 Características

### Datos Exportados
La hoja **LOOKERSTUDIO** se crea automáticamente con las siguientes columnas:

1. **FECHA** - Fecha de la tarea (formato DD/MM/YYYY)
2. **PEDIDO** - Número de pedido
3. **POS** - Posición
4. **PROYECTO** - Nombre del proyecto
5. **PLAN** - Cantidad planificada
6. **REAL** - Cantidad real completada
7. **$/UND** - Precio por unidad (leído del Excel)
8. **PLAN $** - Fórmula: `PLAN × $/UND`
9. **REAL $** - Fórmula: `REAL × $/UND`
10. **LINEA** - Línea de ensamblaje (MOEX, YOBEL, MELISSA, CAJA 1, CAJA 2, CAJA 3)

### Formato Automático
- ✅ **Cabeceras azules** con texto en negrita
- ✅ **Columnas auto-ajustadas** al contenido
- ✅ **Fórmulas** en columnas PLAN $ y REAL $
- ✅ **Filtrado** por líneas de Planta 2

## 🚀 Cómo Usar

### Paso 1: Conectar Google Drive
1. Ve a la aplicación Master Plan
2. En la sección **Conectar Drive**, haz clic en **"Conectar con Google Drive"**
3. Autoriza los permisos solicitados (lectura y escritura - ya incluidos desde el inicio)
4. Carga tu archivo de producción (Excel o Google Sheets)

### Paso 2: Exportar a Looker Studio
1. Ve a la pestaña **P2 - Líneas de Ensamblaje**
2. Haz clic en el botón **📤 Exportar a Looker Studio** (botón verde)
3. Si es la primera vez o faltan permisos:
   - El sistema automáticamente renovará los permisos necesarios
   - Se te pedirá autorización nuevamente (solo si es necesario)
   - La exportación continuará automáticamente
4. Espera a que aparezca el mensaje de éxito
5. La hoja **LOOKERSTUDIO** se habrá creado en tu archivo de Google Sheets

### Paso 3: Conectar con Looker Studio
1. Abre [Looker Studio](https://lookerstudio.google.com/)
2. Crea un nuevo informe
3. Selecciona **Google Sheets** como fuente de datos
4. Busca tu archivo y selecciona la hoja **LOOKERSTUDIO**
5. ¡Empieza a crear tus visualizaciones!

## 🔧 Solución de Problemas

### Error: "No hay archivo de Google Sheets cargado"
**Causa:** No has conectado un archivo de producción.  
**Solución:** Conecta con Google Drive y carga un archivo primero.

### Error: "Permisos insuficientes" (Error 403)
**Causa:** El token de acceso no tiene permisos de escritura.  
**Solución:** 
- **Automático**: El sistema detecta esto y renueva los permisos automáticamente
- Solo necesitas aceptar la ventana de autorización de Google cuando aparezca
- La exportación continuará automáticamente después

### Error: "No se pudo crear la hoja LOOKERSTUDIO"
**Causa:** Puede haber un problema de conexión o el archivo no está accesible.  
**Solución:**
1. Verifica que el archivo de Google Sheets esté abierto en tu cuenta
2. Intenta exportar nuevamente (el sistema renovará permisos si es necesario)
3. Si persiste, desconecta y vuelve a conectar Google Drive

### Error: "Failed to fetch" o error de red
**Causa:** Problema de conexión a internet o APIs de Google.  
**Solución:**
1. Verifica tu conexión a internet
2. Recarga la página (F5)
3. Intenta exportar nuevamente

## 📝 Archivos Modificados

### Nuevos Archivos
- `src/services/lookerStudioExport.ts` - Servicio completo de exportación

### Archivos Modificados
- `src/services/googleDrive.ts` - Permisos de escritura incluidos desde el inicio y renovación automática
- `src/features/calendar/P2SwimlanesView.tsx` - Exportación con renovación automática de permisos
- `src/features/calendar/P2SwimlanesView.css` - Estilos para el botón de exportación
- `src/types/index.ts` - Agregado campo `unitPrice` a `CalendarEvent` y `ProductionItem`
- `src/utils/productionParser.ts` - Lectura de columna `$/UND` del Excel

## ⚡ Comportamiento Automático

El sistema ahora maneja los permisos de forma inteligente:

**Flujo normal (con permisos correctos):**
```
1. Click "📤 Exportar a Looker Studio"
2. ⏳ Exportando...
3. ✅ Hoja LOOKERSTUDIO creada exitosamente
```

**Flujo con renovación automática:**
```
1. Click "📤 Exportar a Looker Studio"
2. 🔄 Permisos insuficientes detectados
3. 🔄 Renovando permisos automáticamente...
4. 📋 [Acepta en ventana de Google si aparece]
5. ✅ Permisos renovados
6. ⏳ Reintentando exportación...
7. ✅ Hoja LOOKERSTUDIO creada exitosamente
```

**No necesitas hacer nada extra** - el sistema se encarga de todo automáticamente.

## 🔐 Permisos Requeridos

La aplicación ahora solicita los siguientes permisos de Google:

1. **`drive.file`** - Acceso a archivos creados o abiertos por la aplicación
2. **`spreadsheets`** - Acceso completo de lectura y escritura a Google Sheets

Estos permisos son necesarios para:
- Leer archivos de producción (Excel/Sheets)
- Crear y escribir en la hoja LOOKERSTUDIO
- Aplicar formato a la hoja exportada

## 💡 Recomendaciones

1. **Exporta regularmente** - Mantén tu hoja LOOKERSTUDIO actualizada con los últimos datos
2. **Verifica las fórmulas** - Asegúrate de que las columnas PLAN $ y REAL $ calculen correctamente
3. **Revisa el formato** - Si necesitas cambios en el formato, modifica `lookerStudioExport.ts`
4. **Mantén conexión estable** - La exportación puede tardar unos segundos dependiendo de la cantidad de datos

## 🎨 Personalización

Para personalizar la exportación, edita el archivo:
```
src/services/lookerStudioExport.ts
```

Puedes modificar:
- Columnas exportadas
- Formato de las celdas
- Colores y estilos
- Fórmulas aplicadas

---

**¿Necesitas ayuda?** Consulta los logs de la consola del navegador (F12) para más detalles sobre errores.
