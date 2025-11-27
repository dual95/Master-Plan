# 🗓️ Master Plan

**Master Plan** es una aplicación web moderna que permite gestionar calendarios importando datos desde Google Drive y organizándolos de manera interactiva con funcionalidades de arrastrar y soltar.

## 🚀 Características

- **Conexión con Google Drive**: Importa hojas de cálculo directamente desde tu Drive
- **Calendario Interactivo**: Visualiza eventos en un calendario completamente funcional
- **Drag & Drop**: Reordena eventos fácilmente arrastrando y soltando
- **Mapeo de Columnas**: Configura cómo se mapean los datos de tu hoja de cálculo
- **Responsive**: Funciona perfectamente en dispositivos móviles y desktop
- **Exportación**: Prepara los datos para exportar a Looker Studio

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript
- **Bundler**: Vite
- **Calendario**: React Big Calendar
- **Drag & Drop**: React DnD
- **APIs**: Google Drive API, Google Sheets API
- **Estilos**: CSS personalizado con diseño moderno

## 📋 Requisitos Previos

- Node.js 18+ o 20+
- Cuenta de Google con acceso a Google Drive
- Credenciales de Google Cloud Platform

## 🔧 Instalación y Configuración

1. **Clonar e instalar dependencias**:
   ```bash
   git clone <tu-repositorio>
   cd masterPlan
   npm install
   ```

2. **Configurar credenciales de Google API**:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente
   - Habilita las APIs de Google Drive y Google Sheets:
     - Google Drive API
     - Google Sheets API
   - Crea credenciales:
     - **API Key** para acceso público a las APIs
     - **OAuth 2.0 Client ID** para autenticación de usuarios
   - Copia `.env.example` a `.env` y configura tus credenciales:
     ```bash
     cp .env.example .env
     ```
   - Edita `.env` con tus credenciales reales

3. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

4. **Construir para producción**:
   ```bash
   npm run build
   ```

## 🎯 Cómo Usar

### 1. Conectar con Google Drive
- Haz clic en "Conectar con Google Drive"
- Autoriza la aplicación para acceder a tus archivos
- Verás la lista de hojas de cálculo disponibles

### 2. Seleccionar Hoja de Cálculo
- Haz clic en cualquier hoja de cálculo de la lista
- La aplicación leerá automáticamente los datos

### 3. Mapear Columnas
- Se abrirá un modal para mapear las columnas de tu hoja de cálculo
- Selecciona qué columna corresponde a cada campo:
  - **Título del Evento** (obligatorio)
  - **Fecha de Inicio** (obligatorio)  
  - **Fecha de Fin** (opcional)
  - **Descripción** (opcional)
  - **Prioridad** (opcional)
  - **Estado** (opcional)
  - **Asignado a** (opcional)
  - **Categoría** (opcional)

### 4. Gestionar el Calendario
- Los eventos aparecerán en el calendario
- Arrastra eventos para cambiar fechas
- Redimensiona eventos para cambiar duración
- Los colores reflejan la prioridad (rojo=alta, naranja=media, verde=baja)

## 📊 Formato de Datos Esperado

Tu hoja de cálculo debería tener columnas como:

| Título | Fecha Inicio | Fecha Fin | Prioridad | Estado | Responsable |
|--------|--------------|-----------|-----------|--------|-------------|
| Reunión de proyecto | 2025-11-28 10:00 | 2025-11-28 11:00 | alta | pendiente | Juan Pérez |
| Entrega de informe | 2025-11-30 | 2025-11-30 | media | en progreso | María García |

## 🎨 Personalización

### Colores por Prioridad
- **Alta**: Rojo (#e74c3c)
- **Media**: Naranja (#f39c12) 
- **Baja**: Verde (#27ae60)

### Estados de Eventos
- **Pendiente**: Opacidad normal
- **En Progreso**: Opacidad normal
- **Completado**: Opacidad reducida + tachado

## 🚧 Próximas Características

- [ ] Exportación directa a Looker Studio
- [ ] Filtros avanzados por categoría y responsable
- [ ] Vista de lista además de calendario
- [ ] Sincronización bidireccional con Google Sheets
- [ ] Notificaciones y recordatorios
- [ ] Modo colaborativo en tiempo real

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de característica (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ve el archivo [LICENSE](LICENSE) para detalles.

## ⚠️ Notas de Seguridad

- Nunca commits tus credenciales de Google en el repositorio
- El archivo `.env` está en `.gitignore` por seguridad
- Las credenciales solo se usan en el frontend para autenticación OAuth
- Los datos se procesan localmente en tu navegador

## 📞 Soporte

Si tienes problemas:
1. Revisa que tus credenciales de Google estén configuradas correctamente
2. Verifica que las APIs estén habilitadas en Google Cloud Console
3. Asegúrate de que tu hoja de cálculo tenga los permisos correctos
4. Abre un issue en GitHub con detalles del problema

---

**Desarrollado con ❤️ usando React + TypeScript + Vite**
