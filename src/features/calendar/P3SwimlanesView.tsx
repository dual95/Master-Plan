import { useMemo, useState, useCallback } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CalendarEvent } from '../../types';
import type { User } from '../../services/authService';
import { useAppActions } from '../../hooks/useApp';
import { QuickTaskPicker } from '../../components/QuickTaskPicker';
import { exportToLookerStudio2 } from '../../services/lookerStudioExport';
import { driveService } from '../../services/googleDrive';
import './P3SwimlanesView.css';

// Procesos de Planta 3
const P3_PROCESSES = ['RESMADO', 'IMPRESIÓN', 'BARNIZ', 'LAMINADO', 'ESTAMPADO', 'REALZADO', 'TROQUELADO'] as const;
type P3Process = typeof P3_PROCESSES[number];

interface P3SwimlanesViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  spreadsheetId?: string;
  accessToken?: string;
  currentUser: User | null;
}

export function P3SwimlanesView({ events, onEventClick, spreadsheetId, accessToken, currentUser }: P3SwimlanesViewProps) {
  const isAdmin = currentUser?.role === 'admin';
  const { updateEvent, addEvent } = useAppActions();
  const [draggedTask, setDraggedTask] = useState<CalendarEvent | null>(null);
  const [dateFilter, setDateFilter] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { locale: es, weekStartsOn: 1 }));
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [quickPickerTarget, setQuickPickerTarget] = useState<{ process: P3Process; date: Date } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Calcular rango de fechas a mostrar
  const dateRange = useMemo(() => {
    if (dateFilter === 'week') {
      const weekStart = currentWeekStart;
      const weekEnd = endOfWeek(weekStart, { locale: es, weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      // Mostrar 4 semanas (28 días)
      const start = currentWeekStart;
      const end = addDays(start, 27);
      return eachDayOfInterval({ start, end });
    }
  }, [dateFilter, currentWeekStart]);

  // Filtrar tareas de P3 y agrupar por proceso y fecha
  const tasksByProcessAndDate = useMemo(() => {
    const p3Tasks = events.filter(e => e.planta === 'P3');
    
    const grouped: Record<P3Process, Record<string, CalendarEvent[]>> = {
      'RESMADO': {},
      'IMPRESIÓN': {},
      'BARNIZ': {},
      'LAMINADO': {},
      'ESTAMPADO': {},
      'REALZADO': {},
      'TROQUELADO': {}
    };

    // Inicializar todos los días con arrays vacíos
    P3_PROCESSES.forEach(process => {
      dateRange.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        grouped[process][dateKey] = [];
      });
    });

    // Agrupar tareas por proceso y fecha
    p3Tasks.forEach(event => {
      const processType = event.processType?.toUpperCase() || event.category?.toUpperCase() || 'IMPRESIÓN';
      
      // Normalizar nombres de procesos
      let process: P3Process = 'IMPRESIÓN';
      if (processType.includes('RESMA')) process = 'RESMADO';
      else if (processType.includes('IMPRES')) process = 'IMPRESIÓN';
      else if (processType.includes('BARNIZ')) process = 'BARNIZ';
      else if (processType.includes('LAMINAD')) process = 'LAMINADO';
      else if (processType.includes('ESTAMPA')) process = 'ESTAMPADO';
      else if (processType.includes('REALZA')) process = 'REALZADO';
      else if (processType.includes('TROQUEL')) process = 'TROQUELADO';
      
      const eventDate = new Date(event.start);
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      
      if (process in grouped && dateKey in grouped[process]) {
        grouped[process][dateKey].push(event);
      }
    });

    return grouped;
  }, [events, dateRange]);

  // Calcular estadísticas por proceso
  const processStats = useMemo(() => {
    const p3Tasks = events.filter(e => e.planta === 'P3');
    const stats: Record<P3Process, { total: number; completed: number; pending: number }> = {
      'RESMADO': { total: 0, completed: 0, pending: 0 },
      'IMPRESIÓN': { total: 0, completed: 0, pending: 0 },
      'BARNIZ': { total: 0, completed: 0, pending: 0 },
      'LAMINADO': { total: 0, completed: 0, pending: 0 },
      'ESTAMPADO': { total: 0, completed: 0, pending: 0 },
      'REALZADO': { total: 0, completed: 0, pending: 0 },
      'TROQUELADO': { total: 0, completed: 0, pending: 0 }
    };

    p3Tasks.forEach(task => {
      const processType = task.processType?.toUpperCase() || task.category?.toUpperCase() || 'IMPRESIÓN';
      
      // Normalizar nombres de procesos
      let process: P3Process = 'IMPRESIÓN';
      if (processType.includes('RESMA')) process = 'RESMADO';
      else if (processType.includes('IMPRES')) process = 'IMPRESIÓN';
      else if (processType.includes('BARNIZ')) process = 'BARNIZ';
      else if (processType.includes('LAMINAD')) process = 'LAMINADO';
      else if (processType.includes('ESTAMPA')) process = 'ESTAMPADO';
      else if (processType.includes('REALZA')) process = 'REALZADO';
      else if (processType.includes('TROQUEL')) process = 'TROQUELADO';
      
      if (process in stats) {
        stats[process].total++;
        if (task.status === 'completed') stats[process].completed++;
        if (task.status === 'pending') stats[process].pending++;
      }
    });

    return stats;
  }, [events]);

  // Drag & Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, event: CalendarEvent) => {
    // Solo admins pueden mover/copiar tareas
    if (!isAdmin) {
      e.preventDefault();
      return;
    }
    
    e.stopPropagation();
    e.dataTransfer.effectAllowed = e.shiftKey ? 'copy' : 'move';
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.setData('shiftKey', e.shiftKey.toString());
    setDraggedTask(event);
  }, [isAdmin]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Mostrar cursor de copia si Shift está presionado
    e.dataTransfer.dropEffect = e.shiftKey ? 'copy' : 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetProcess: P3Process, targetDate: Date) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedTask) return;

    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId !== draggedTask.id) {
      console.warn('Mismatch between dragged task IDs');
      setDraggedTask(null);
      return;
    }

    // Calcular nueva fecha manteniendo la hora
    const oldDate = new Date(draggedTask.start);
    const newStart = new Date(targetDate);
    newStart.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds());
    
    const oldEnd = new Date(draggedTask.end);
    const duration = oldEnd.getTime() - oldDate.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    // Detectar si Shift estaba presionado (modo duplicación)
    const isDuplicate = e.shiftKey;

    if (isDuplicate) {
      // Crear una copia de la tarea con nuevo ID
      const duplicatedEvent: CalendarEvent = {
        ...draggedTask,
        id: `${draggedTask.id}-copy-${Date.now()}`,
        processType: targetProcess,
        category: targetProcess,
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
        isScheduled: true // Marcar como programada
      };
      
      console.log('📋 Duplicando tarea:', draggedTask.title, 'a proceso', targetProcess);
      addEvent(duplicatedEvent);
    } else {
      // Actualizar el proceso y fecha de la tarea
      const updatedEvent: CalendarEvent = {
        ...draggedTask,
        processType: targetProcess,
        category: targetProcess,
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
        isScheduled: true // Marcar como programada
      };

      updateEvent(updatedEvent);
    }
    
    setDraggedTask(null);
  }, [draggedTask, updateEvent, addEvent]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedTask(null);
  }, []);

  // Handler para abrir el buscador al hacer click en una celda vacía
  const handleCellClick = useCallback((e: React.MouseEvent, process: P3Process, date: Date) => {
    // Solo admins pueden usar QuickTaskPicker
    if (!isAdmin) return;
    
    // Solo abrir si el click fue directamente en la celda (no en una tarea)
    if (e.target === e.currentTarget) {
      setQuickPickerTarget({ process, date });
      setShowQuickPicker(true);
    }
  }, [isAdmin]);

  // Handler para cuando se selecciona un task del buscador
  const handleQuickPickerSelect = useCallback((task: CalendarEvent) => {
    if (!quickPickerTarget) return;

    const { process, date } = quickPickerTarget;
    
    console.log(`📌 Moviendo task ${task.id} a ${process} en ${format(date, 'yyyy-MM-dd')}`);

    // Actualizar el task con el nuevo proceso y fecha
    const updatedTask: CalendarEvent = {
      ...task,
      processType: process,
      category: process,
      start: date.toISOString(),
      end: date.toISOString(),
      isScheduled: true, // Marcar como programada cuando se asigna manualmente
    };

    updateEvent(updatedTask);
    setShowQuickPicker(false);
    setQuickPickerTarget(null);
  }, [quickPickerTarget, updateEvent]);

  // Click handler para editar tarea
  const handleTaskClick = useCallback((e: React.MouseEvent, task: CalendarEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onEventClick) {
      onEventClick(task);
    }
  }, [onEventClick]);

  // Navegación de semanas
  const goToPreviousWeek = useCallback(() => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentWeekStart(startOfWeek(new Date(), { locale: es, weekStartsOn: 1 }));
  }, []);

  // Función para exportar a Looker Studio 2
  const handleExportToLookerStudio = useCallback(async () => {
    if (!spreadsheetId) {
      alert('❌ No hay un archivo de Google Sheets conectado. Por favor, conecta primero un archivo.');
      return;
    }

    setIsExporting(true);
    try {
      // Obtener token actual
      let currentToken = accessToken || driveService.getAccessToken();
      
      if (!currentToken) {
        alert('❌ No hay token de acceso. Por favor, conecta con Google Drive primero.');
        setIsExporting(false);
        return;
      }

      const result = await exportToLookerStudio2(spreadsheetId, events, currentToken);
      
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error exportando a Looker Studio 2:', error);
      alert(`❌ Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsExporting(false);
    }
  }, [spreadsheetId, accessToken, events]);

  // Obtener color según el estado
  const getTaskColor = (task: CalendarEvent) => {
    // Normalizar updateStatus a mayúsculas para comparación
    const updateStatus = task.updateStatus?.toUpperCase().trim() || '';
    const status = (task.status || '') as string;
    
    // Debug: mostrar el estado en consola
    if (updateStatus || status) {
      console.log('P3 Task:', task.title, 'UpdateStatus:', updateStatus, 'Status:', status);
    }
    
    // Prioridad a updateStatus de la columna UPDATE
    if (updateStatus === 'CANCELED' || updateStatus === 'CANCELLED' || updateStatus === 'CANCELADO') return '#f44336'; // Rojo
    if (updateStatus === 'COMPLETED' || updateStatus === 'COMPLETADO') return '#4caf50'; // Verde
    if (updateStatus === 'IN PROCESS' || updateStatus === 'EN PROCESO') return '#ffc107'; // Amarillo
    if (updateStatus === 'PENDING' || updateStatus === 'PENDIENTE') return '#9e9e9e'; // Gris
    
    // Fallback a status si no hay updateStatus
    if (status === 'cancelled' || status === 'canceled') return '#f44336'; // Rojo
    if (status === 'completed') return '#4caf50'; // Verde
    if (status === 'in-progress') return '#ffc107'; // Amarillo
    return '#9e9e9e'; // Gris
  };

  // Filtrar tareas de P3 Y que estén EXPLÍCITAMENTE programadas (isScheduled === true)
  const p3Events = events.filter(e => e.planta === 'P3' && e.isScheduled === true);
  const today = new Date();

  return (
    <div className="p3-swimlanes-container">
      {/* Header con navegación y filtros */}
      <div className="swimlanes-header">
        <div className="header-left">
          <h2>🏭 Planta 3 - Procesos de Producción</h2>
          <div className="week-navigation">
            <button onClick={goToPreviousWeek} className="nav-button">◀ Anterior</button>
            <button onClick={goToToday} className="today-button">📍 Hoy</button>
            <button onClick={goToNextWeek} className="nav-button">Siguiente ▶</button>
          </div>
        </div>
        <div className="header-right">
          {isAdmin && (
            <button
              className="export-button"
              onClick={handleExportToLookerStudio}
              disabled={isExporting}
              title="Exportar a Looker Studio (Hoja LOOKERSTUDIO2)"
              style={{
                marginRight: '10px',
                padding: '8px 16px',
                backgroundColor: isExporting ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {isExporting ? '⏳ Exportando...' : '📊 Exportar a Looker Studio'}
            </button>
          )}
          <div className="date-filters">
            <button
              className={dateFilter === 'week' ? 'active' : ''}
              onClick={() => setDateFilter('week')}
            >
              📅 Semana
            </button>
            <button
              className={dateFilter === 'month' ? 'active' : ''}
              onClick={() => setDateFilter('month')}
            >
              📊 Mes (4 sem)
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="p3-stats">
        <div className="stat-card">
          <span className="stat-label">Total Tareas P3:</span>
          <span className="stat-value">{p3Events.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completadas:</span>
          <span className="stat-value completed">{p3Events.filter(e => e.status === 'completed').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pendientes:</span>
          <span className="stat-value pending">{p3Events.filter(e => e.status === 'pending').length}</span>
        </div>
      </div>

      {/* Swimlanes con Timeline Horizontal */}
      <div className="timeline-container">
        {/* Header de fechas */}
        <div className="timeline-header">
          <div className="line-label-cell">Proceso</div>
          {dateRange.map((date, index) => {
            const isToday = isSameDay(date, today);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            return (
              <div 
                key={index} 
                className={`date-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
              >
                <div className="date-day">{format(date, 'EEE', { locale: es })}</div>
                <div className="date-number">{format(date, 'd')}</div>
                <div className="date-month">{format(date, 'MMM', { locale: es })}</div>
              </div>
            );
          })}
        </div>

        {/* Filas de procesos con tareas */}
        {P3_PROCESSES.map(process => (
          <div key={process} className="timeline-row">
            {/* Etiqueta de proceso */}
            <div className="line-label">
              <h4>{process}</h4>
              <div className="line-stats-mini">
                <span className="stat-mini total" title="Total">{processStats[process].total}</span>
                <span className="stat-mini completed" title="Completadas">{processStats[process].completed}</span>
                <span className="stat-mini pending" title="Pendientes">{processStats[process].pending}</span>
              </div>
            </div>

            {/* Celdas de días */}
            {dateRange.map((date, dateIndex) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const tasksForDay = tasksByProcessAndDate[process][dateKey] || [];
              const isToday = isSameDay(date, today);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={dateIndex}
                  className={`day-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, process, date)}
                  onClick={(e) => handleCellClick(e, process, date)}
                  style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                  title={isAdmin ? "Click para buscar y mover un task aquí" : ""}
                >
                  {tasksForDay.map(task => (
                    <div
                      key={task.id}
                      className={`timeline-task ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                      draggable={isAdmin}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => handleTaskClick(e, task)}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        backgroundColor: getTaskColor(task),
                        cursor: isAdmin ? 'grab' : 'pointer',
                      }}
                      title={isAdmin ? `${task.title}\nPO: ${task.pedido || '-'}\nPOS: ${task.pos || '-'}\nPLIEGOS: ${task.pliegos || '-'}\nClick para editar` : `${task.title}\n(Solo lectura - contacta al administrador para cambios)`}
                    >
                      <span className="task-title-mini">{task.title}</span>
                      {task.pos && <span className="task-pos-mini">#{task.pos}</span>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="swimlanes-legend">
        <h4>💡 Cómo usar:</h4>
        <ul>
          <li>🖱️ Arrastra las tareas entre celdas para cambiar de proceso y/o fecha</li>
          <li>📋 <strong>Shift + Arrastra</strong> para duplicar una tarea (deja el original y crea una copia)</li>
          <li>🔍 <strong>Click en una celda vacía</strong> para buscar y mover un task a esa ubicación</li>
          <li>✏️ Haz click en una tarea para editarla</li>
          <li>📅 Usa los botones de navegación y filtros de fecha arriba</li>
          <li>🎨 Los colores indican el estado: 🔴 Rojo (Cancelado), 🟢 Verde (Completado), 🟡 Amarillo (En Proceso), ⚪ Gris (Pendiente)</li>
        </ul>
      </div>

      {/* Buscador rápido */}
      <QuickTaskPicker
        isOpen={showQuickPicker}
        onClose={() => {
          setShowQuickPicker(false);
          setQuickPickerTarget(null);
        }}
        onSelectTask={handleQuickPickerSelect}
        targetLine={quickPickerTarget?.process}
      />
    </div>
  );
}
