import type { CalendarEvent } from '../types';

// Función para generar eventos de ejemplo
export function generateSampleEvents(): CalendarEvent[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  return [
    {
      id: 'sample-1',
      title: 'Reunión de proyecto Master Plan',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30),
      description: 'Revisión del progreso del proyecto y planificación de siguientes pasos',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Equipo Desarrollo',
      category: 'Reuniones',
      color: '#e74c3c'
    },
    {
      id: 'sample-2',
      title: 'Implementar integración Google Drive',
      start: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0),
      end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 17, 0),
      description: 'Completar la conexión con Google Drive API y probar funcionalidad',
      priority: 'medium',
      status: 'in-progress',
      assignedTo: 'Juan Pérez',
      category: 'Desarrollo',
      color: '#f39c12'
    },
    {
      id: 'sample-3',
      title: 'Diseño de interfaz de usuario',
      start: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 14, 0),
      end: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 16, 0),
      description: 'Crear mockups y prototipos de la interfaz',
      priority: 'low',
      status: 'completed',
      assignedTo: 'María García',
      category: 'Diseño',
      color: '#27ae60'
    },
    {
      id: 'sample-4',
      title: 'Pruebas de calendario interactivo',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 11, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 12, 30),
      description: 'Verificar funcionalidad drag & drop y responsividad',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Carlos López',
      category: 'Testing',
      color: '#e74c3c'
    },
    {
      id: 'sample-5',
      title: 'Documentación del proyecto',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 15, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 17, 0),
      description: 'Actualizar README y crear documentación técnica',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Ana Rodríguez',
      category: 'Documentación',
      color: '#f39c12'
    }
  ];
}

// Función para formatear fechas en español
export function formatDateSpanish(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Función para obtener el color según la prioridad
export function getPriorityColor(priority: 'low' | 'medium' | 'high'): string {
  switch (priority) {
    case 'high':
      return '#e74c3c';
    case 'medium':
      return '#f39c12';
    case 'low':
      return '#27ae60';
    default:
      return '#3498db';
  }
}

// Función para validar si una fecha es válida
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

// Función para convertir string a Date de manera segura
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isValidDate(date) ? date : null;
}
