# Master Plan - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Proyecto Master Plan

Este es un proyecto de aplicación web que permite:
1. Conectar con Google Drive para leer archivos de hojas de cálculo
2. Mostrar información en un calendario interactivo
3. Permitir reordenamiento drag-and-drop de elementos del calendario
4. Exportar datos organizados a Looker Studio

## Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Vite
- **Estilos**: CSS Modules o Styled Components (por decidir)
- **Calendario**: React Big Calendar o FullCalendar
- **Drag & Drop**: React DnD
- **Google APIs**: Google Drive API, Google Sheets API
- **Estado**: Context API + useReducer o Zustand
- **Backend**: Node.js + Express (en futuro)

## Patrones de Desarrollo

1. Usar TypeScript estricto con interfaces bien definidas
2. Componentes funcionales con hooks
3. Arquitectura por características (features) no por tipo de archivo
4. Manejo de estado centralizado
5. Separación clara entre lógica de negocio y presentación
6. Pruebas unitarias para funciones críticas

## Estructura de Carpetas

```
src/
├── components/          # Componentes reutilizables
├── features/           # Funcionalidades específicas
│   ├── calendar/       # Todo lo relacionado al calendario
│   ├── drive/          # Integración con Google Drive
│   └── looker/         # Exportación a Looker Studio
├── hooks/              # Custom hooks
├── services/           # APIs y servicios externos
├── types/              # Definiciones de TypeScript
└── utils/              # Utilidades generales
```

## APIs a Integrar

- Google Drive API para acceder a archivos
- Google Sheets API para leer datos de hojas de cálculo
- Looker Studio API para exportar datos

## Consideraciones de UX/UI

- Interfaz moderna y limpia
- Responsive design
- Feedback visual para drag & drop
- Loading states para operaciones asíncronas
- Manejo de errores user-friendly
