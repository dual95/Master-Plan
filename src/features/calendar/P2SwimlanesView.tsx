import { useMemo, useState, useCallback } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CalendarEvent } from '../../types';
import { useAppActions } from '../../hooks/useApp';
import { exportToLookerStudio } from '../../services/lookerStudioExport';
import { driveService } from '../../services/googleDrive';
import './P2SwimlanesView.css';

// Líneas de ensamblaje de Planta 2
const P2_LINES = ['MOEX', 'YOBEL', 'MELISSA', 'CAJA 1', 'CAJA 2', 'CAJA 3'] as const;
type P2Line = typeof P2_LINES[number];

interface P2SwimlanesViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  spreadsheetId?: string;
  accessToken?: string;
}

export function P2SwimlanesView({ events, onEventClick, spreadsheetId, accessToken }: P2SwimlanesViewProps) {
  const { updateEvent } = useAppActions();
  const [draggedTask, setDraggedTask] = useState<CalendarEvent | null>(null);
  const [dateFilter, setDateFilter] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { locale: es, weekStartsOn: 1 }));
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Filtrar tareas de P2 y agrupar por línea y fecha
  const tasksByLineAndDate = useMemo(() => {
    const p2Tasks = events.filter(e => e.planta === 'P2');
    
    const grouped: Record<P2Line, Record<string, CalendarEvent[]>> = {
      'MOEX': {},
      'YOBEL': {},
      'MELISSA': {},
      'CAJA 1': {},
      'CAJA 2': {},
      'CAJA 3': {}
    };

    // Inicializar todos los días con arrays vacíos
    P2_LINES.forEach(line => {
      dateRange.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        grouped[line][dateKey] = [];
      });
    });

    // Agrupar tareas por línea y fecha
    p2Tasks.forEach(event => {
      const line = (event.linea || event.machine || 'MOEX') as P2Line;
      const eventDate = new Date(event.start);
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      
      if (line in grouped && dateKey in grouped[line]) {
        grouped[line][dateKey].push(event);
      }
    });

    return grouped;
  }, [events, dateRange]);

  // Calcular estadísticas por línea
  const lineStats = useMemo(() => {
    const p2Tasks = events.filter(e => e.planta === 'P2');
    const stats: Record<P2Line, { total: number; completed: number; pending: number }> = {
      'MOEX': { total: 0, completed: 0, pending: 0 },
      'YOBEL': { total: 0, completed: 0, pending: 0 },
      'MELISSA': { total: 0, completed: 0, pending: 0 },
      'CAJA 1': { total: 0, completed: 0, pending: 0 },
      'CAJA 2': { total: 0, completed: 0, pending: 0 },
      'CAJA 3': { total: 0, completed: 0, pending: 0 }
    };

    p2Tasks.forEach(task => {
      const line = (task.linea || task.machine || 'MOEX') as P2Line;
      if (line in stats) {
        stats[line].total++;
        if (task.status === 'completed') stats[line].completed++;
        if (task.status === 'pending') stats[line].pending++;
      }
    });

    return stats;
  }, [events]);

  // Drag & Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, event: CalendarEvent) => {
    e.stopPropagation();
    // Importante: establecer efectos permitidos para el drag
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    setDraggedTask(event);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetLine: P2Line, targetDate: Date) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedTask) return;

    // Verificar que el evento arrastrado es el correcto
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

    // Actualizar la línea y fecha de la tarea
    const updatedEvent: CalendarEvent = {
      ...draggedTask,
      linea: targetLine,
      machine: targetLine,
      start: newStart.toISOString(),
      end: newEnd.toISOString()
    };

    updateEvent(updatedEvent);
    setDraggedTask(null);
  }, [draggedTask, updateEvent]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedTask(null);
  }, []);

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

  // Obtener color según el estado
  const getTaskColor = (task: CalendarEvent) => {
    // Normalizar updateStatus a mayúsculas para comparación
    const updateStatus = task.updateStatus?.toUpperCase().trim() || '';
    const status = (task.status || '') as string;
    
    // Debug: mostrar el estado en consola
    if (updateStatus || status) {
      console.log('P2 Task:', task.title, 'UpdateStatus:', updateStatus, 'Status:', status);
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

  // Handler para exportar a Looker Studio
  const handleExportToLookerStudio = useCallback(async () => {
    if (!spreadsheetId) {
      setExportMessage({
        type: 'error',
        text: 'No hay un archivo de Google Sheets conectado. Por favor, conecta primero un archivo.'
      });
      setTimeout(() => setExportMessage(null), 5000);
      return;
    }

    setIsExporting(true);
    setExportMessage(null);

    try {
      // Obtener token actual
      let currentToken = accessToken || driveService.getAccessToken();
      
      if (!currentToken) {
        setExportMessage({
          type: 'error',
          text: '❌ No hay token de acceso. Por favor, conecta con Google Drive primero.'
        });
        setIsExporting(false);
        setTimeout(() => setExportMessage(null), 5000);
        return;
      }

      // Primer intento de exportación
      let result = await exportToLookerStudio(spreadsheetId, events, currentToken);
      
      // Si falla por permisos, renovar token y reintentar
      if (!result.success && (result.message.includes('403') || result.message.includes('insufficient'))) {
        setExportMessage({
          type: 'error',
          text: '🔄 Permisos insuficientes. Renovando permisos...'
        });
        
        // Renovar token con nuevos permisos
        const renewed = await driveService.signIn(true);
        
        if (renewed) {
          // Obtener nuevo token y reintentar
          currentToken = driveService.getAccessToken();
          if (currentToken) {
            setExportMessage({
              type: 'success',
              text: '✅ Permisos renovados. Reintentando exportación...'
            });
            
            // Segundo intento con nuevo token
            result = await exportToLookerStudio(spreadsheetId, events, currentToken);
          }
        } else {
          setExportMessage({
            type: 'error',
            text: '❌ No se pudieron renovar los permisos. Intenta conectar de nuevo con Google Drive.'
          });
          setIsExporting(false);
          setTimeout(() => setExportMessage(null), 8000);
          return;
        }
      }
      
      // Mostrar resultado final
      if (result.success) {
        setExportMessage({
          type: 'success',
          text: result.message
        });
      } else {
        setExportMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error) {
      setExportMessage({
        type: 'error',
        text: `Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 8000);
    }
  }, [spreadsheetId, accessToken, events]);



  const p2Events = events.filter(e => e.planta === 'P2');
  const today = new Date();

  return (
    <div className="p2-swimlanes-container">
      {/* Header con navegación y filtros */}
      <div className="swimlanes-header">
        <div className="header-left">
          <h2>🏭 Planta 2 - Líneas de Ensamblaje</h2>
          <div className="week-navigation">
            <button onClick={goToPreviousWeek} className="nav-button">◀ Anterior</button>
            <button onClick={goToToday} className="today-button">📍 Hoy</button>
            <button onClick={goToNextWeek} className="nav-button">Siguiente ▶</button>
          </div>
        </div>
        <div className="header-right">
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
          <button
            onClick={handleExportToLookerStudio}
            disabled={isExporting}
            className="export-button"
            title="Exportar datos a hoja LOOKERSTUDIO (renueva permisos automáticamente si es necesario)"
          >
            {isExporting ? '⏳ Exportando...' : '📤 Exportar a Looker Studio'}
          </button>
        </div>
      </div>

      {/* Mensaje de exportación */}
      {exportMessage && (
        <div className={`export-message ${exportMessage.type}`}>
          {exportMessage.type === 'success' ? '✅' : '❌'} {exportMessage.text}
        </div>
      )}

      {/* Estadísticas generales */}
      <div className="p2-stats">
        <div className="stat-card">
          <span className="stat-label">Total Tareas P2:</span>
          <span className="stat-value">{p2Events.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completadas:</span>
          <span className="stat-value completed">{p2Events.filter(e => e.status === 'completed').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pendientes:</span>
          <span className="stat-value pending">{p2Events.filter(e => e.status === 'pending').length}</span>
        </div>
      </div>

      {/* Swimlanes con Timeline Horizontal */}
      <div className="timeline-container">
        {/* Header de fechas */}
        <div className="timeline-header">
          <div className="line-label-cell">Línea</div>
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

        {/* Líneas con tareas */}
        {P2_LINES.map(line => (
          <div key={line} className="timeline-row">
            {/* Etiqueta de línea */}
            <div className="line-label">
              <h4>{line}</h4>
              <div className="line-stats-mini">
                <span className="stat-mini total" title="Total">{lineStats[line].total}</span>
                <span className="stat-mini completed" title="Completadas">{lineStats[line].completed}</span>
                <span className="stat-mini pending" title="Pendientes">{lineStats[line].pending}</span>
              </div>
            </div>

            {/* Celdas de días */}
            {dateRange.map((date, dateIndex) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const tasksForDay = tasksByLineAndDate[line][dateKey] || [];
              const isToday = isSameDay(date, today);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={dateIndex}
                  className={`day-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, line, date)}
                >
                  {tasksForDay.map(task => (
                    <div
                      key={task.id}
                      className={`timeline-task ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => handleTaskClick(e, task)}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        backgroundColor: getTaskColor(task),
                      }}
                      title={`${task.title}\nPO: ${task.pedido || '-'}\nPOS: ${task.pos || '-'}\nQTY: ${task.quantity || '-'}\nClick para editar`}
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
          <li>🖱️ Arrastra las tareas entre celdas para cambiar de línea y/o fecha</li>
          <li>✏️ Haz click en una tarea para editarla</li>
          <li>📅 Usa los botones de navegación y filtros de fecha arriba</li>
          <li>🎨 Los colores indican el estado: 🔴 Rojo (Cancelado), 🟢 Verde (Completado), 🟡 Amarillo (En Proceso), ⚪ Gris (Pendiente)</li>
        </ul>
      </div>
    </div>
  );
}
