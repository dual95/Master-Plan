import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, getWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CalendarEvent } from '../../types';
import type { User } from '../../services/authService';
import { useApp, useAppActions } from '../../hooks/useApp';
import { EventModal } from '../../components/EventModal';
import { EventInfoModal } from '../../components/EventInfoModal';
import { TaskSearch } from '../../components/TaskSearch';
import { P2SwimlanesView } from './P2SwimlanesView';
import { P3SwimlanesView } from './P3SwimlanesView';
import { persistenceService } from '../../services/persistenceService';
import { driveService } from '../../services/googleDrive';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './MasterCalendar.css';

// Configurar localizador para date-fns
const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Crear componente del calendario con drag & drop
const DnDCalendar = withDragAndDrop(Calendar);

interface MasterCalendarProps {
  height?: number;
  currentUser: User | null;
}

export function MasterCalendar({ height = 600, currentUser }: MasterCalendarProps) {
  const { state } = useApp();
  const { setError, updateEvent, addEvent, deleteEvent, clearPersistedData, setEvents } = useAppActions();
  
  // Estado para el modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Modal de info por doble clic
  const [infoEvent, setInfoEvent] = useState<CalendarEvent | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  // Estado para el mes actual del calendario
  const [currentDate, setCurrentDate] = useState(new Date());

  // Estado para la pestaña activa (P3 o P2)
  const [activePlant, setActivePlant] = useState<'P3' | 'P2'>('P3');

  // Recargar eventos desde BD cuando se monta el componente (al cambiar a pestaña Calendario)
  useEffect(() => {
    async function reloadFromDatabase() {
      try {
        console.log('📂 Recargando eventos desde base de datos...');
        const persistedState = await persistenceService.loadEvents();
        
        if (persistedState && persistedState.events && persistedState.events.length > 0) {
          // Solo recargar si hay eventos en BD y son diferentes a los actuales
          const currentEventIds = new Set(state.events.map(e => e.id));
          const dbEventIds = new Set(persistedState.events.map(e => e.id));
          
          const hasChanges = 
            state.events.length !== persistedState.events.length ||
            persistedState.events.some(e => !currentEventIds.has(e.id)) ||
            state.events.some(e => !dbEventIds.has(e.id));
          
          if (hasChanges) {
            console.log(`🔄 Sincronizando: ${persistedState.events.length} eventos desde BD`);
            setEvents(persistedState.events); // Actualizar estado con eventos de BD
          } else {
            console.log('✅ Eventos ya sincronizados, no se requiere recarga');
          }
        }
      } catch (error) {
        console.error('❌ Error recargando desde BD:', error);
      }
    }
    
    reloadFromDatabase();
  }, []); // Solo al montar, no cuando cambie state.events

  // Función para calcular las semanas visibles en la vista del mes
  const getVisibleWeeks = useCallback((date: Date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    
    // Obtener el primer día de la semana del mes (puede ser del mes anterior)
    const startOfFirstWeek = startOfWeek(startOfMonth, { 
      locale: es,
      weekStartsOn: 1 // Lunes como primer día de la semana
    });
    
    // Calcular cuántas semanas necesitamos mostrar (siempre 6 filas en vista mensual)
    const weeks = [];
    let currentWeekStart = new Date(startOfFirstWeek);
    
    for (let i = 0; i < 6; i++) {
      const weekNumber = getWeek(currentWeekStart, { 
        locale: es,
        weekStartsOn: 1,
        firstWeekContainsDate: 4 // ISO 8601 - primera semana contiene el 4 de enero
      });
      
      weeks.push(weekNumber);
      
      // Avanzar a la siguiente semana
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  }, []);

  // Calcular las semanas visibles para el mes actual
  const visibleWeeks = useMemo(() => getVisibleWeeks(currentDate), [currentDate, getVisibleWeeks]);
  
  // Obtener el número de la semana actual
  const currentWeekNumber = useMemo(() => {
    return getWeek(new Date(), { 
      locale: es,
      weekStartsOn: 1,
      firstWeekContainsDate: 4
    });
  }, []);

  // Handler para cuando cambia el mes/año en el calendario
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Handler para cuando cambia la vista del calendario
  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
    console.log(`📅 Vista cambiada a: ${view}`);
  }, []);

  // Handler para navegación por número de semana
  const handleWeekClick = useCallback((weekNumber: number) => {
    // Calcular la fecha del primer día de esa semana
    const year = currentDate.getFullYear();
    
    // Crear una fecha aproximada para esa semana
    const januaryFirst = new Date(year, 0, 1);
    const daysToAdd = (weekNumber - 1) * 7;
    const weekStart = new Date(januaryFirst);
    weekStart.setDate(januaryFirst.getDate() + daysToAdd);
    
    // Encontrar el lunes de esa semana
    const mondayOfWeek = startOfWeek(weekStart, { 
      locale: es, 
      weekStartsOn: 1 
    });
    
    setCurrentDate(mondayOfWeek);
    console.log(`📅 Navegando a la semana ${weekNumber} del año ${year}`);
    
    // Mostrar feedback visual temporal
    const weekElement = document.querySelector(`[data-week="${weekNumber}"]`);
    if (weekElement) {
      weekElement.classList.add('clicked');
      setTimeout(() => {
        weekElement.classList.remove('clicked');
      }, 300);
    }
  }, [currentDate]);

  // Vista actual del calendario
  const [currentView, setCurrentView] = useState<View>('month');

  // Convertir eventos para react-big-calendar
  const calendarEvents = useMemo(() => {
    return state.events.map(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      
      // En vistas de semana y día, normalizar todas las tareas al mismo rango horario
      // para que se muestren como bloques compactos sin importar la duración
      if (currentView === 'week' || currentView === 'day') {
        // Todas las tareas ocupan el mismo espacio: 8:00 AM a 8:30 AM
        const normalizedStart = new Date(start);
        normalizedStart.setHours(8, 0, 0, 0);
        
        const normalizedEnd = new Date(start);
        normalizedEnd.setHours(8, 30, 0, 0);
        
        return {
          ...event,
          start: normalizedStart,
          end: normalizedEnd,
        };
      }
      
      // En vista de mes, mantener el comportamiento normal
      return {
        ...event,
        start,
        end,
      };
    });
  }, [state.events, currentView]);

  // Filtrar eventos según la planta seleccionada
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter(e => e.planta === activePlant);
  }, [calendarEvents, activePlant]);

  // Doble clic manual: distinguir entre click y doble click
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickedEventId = useRef<string | null>(null);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (clickTimeout.current && lastClickedEventId.current === event.id) {
      // Doble clic detectado
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      lastClickedEventId.current = null;
      setInfoEvent(event);
      setIsInfoOpen(true);
    } else {
      // Esperar para ver si es doble clic
      lastClickedEventId.current = event.id;
      clickTimeout.current = setTimeout(() => {
        setSelectedEvent(event);
        setIsModalOpen(true);
        clickTimeout.current = null;
        lastClickedEventId.current = null;
      }, 250); // 250ms ventana para doble clic
    }
  }, []);

  // Doble clic: solo info
  const handleDoubleClickEvent = useCallback((event: CalendarEvent) => {
    setInfoEvent(event);
    setIsInfoOpen(true);
  }, []);

  // Handlers del modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, []);

  const handleCloseInfo = useCallback(() => {
    setIsInfoOpen(false);
    setInfoEvent(null);
  }, []);

  const handleSaveEvent = useCallback((event: CalendarEvent) => {
    try {
      if (selectedEvent) {
        // Actualizar evento existente
        updateEvent(event);
        console.log('✅ Evento actualizado:', event.title);
      } else {
        // Crear nuevo evento
        addEvent(event);
        console.log('✅ Evento creado:', event.title);
      }
    } catch (error) {
      console.error('❌ Error al guardar evento:', error);
      setError('Error al guardar el evento');
    }
  }, [selectedEvent, updateEvent, addEvent, setError]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    try {
      deleteEvent(eventId);
      console.log('✅ Evento eliminado');
    } catch (error) {
      console.error('❌ Error al eliminar evento:', error);
      setError('Error al eliminar el evento');
    }
  }, [deleteEvent, setError]);

  // Manejar creación de nuevo evento con doble clic
  const handleSelectSlot = useCallback((slotInfo: any) => {
    const eventTemplate: CalendarEvent = {
      id: '',
      title: '',
      description: '',
      start: slotInfo.start.toISOString(),
      end: slotInfo.end.toISOString(),
      priority: 'medium',
      status: 'pending',
      category: '',
      assignee: ''
    };
    setSelectedEvent(null); // Null indica nuevo evento
    setIsModalOpen(true);
  }, []);

  // Handlers para drag & drop
  const handleEventDrop = useCallback(({ event, start, end }: { 
    event: CalendarEvent; 
    start: Date; 
    end: Date; 
  }) => {
    try {
      console.log('🔄 Moviendo evento:', { event: event.title, start, end });
      
      const updatedEvent = {
        ...event,
        start: start.toISOString(),
        end: end.toISOString(),
      };
      
      updateEvent(updatedEvent);
      console.log('✅ Evento actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error al mover evento:', error);
      setError('Error al actualizar la posición del evento');
    }
  }, [updateEvent, setError]);

  const handleEventResize = useCallback(({ event, start, end }: { 
    event: CalendarEvent; 
    start: Date; 
    end: Date; 
  }) => {
    try {
      console.log('🔄 Redimensionando evento:', { event: event.title, start, end });
      
      const updatedEvent = {
        ...event,
        start: start.toISOString(),
        end: end.toISOString(),
      };
      
      updateEvent(updatedEvent);
      console.log('✅ Evento redimensionado exitosamente');
    } catch (error) {
      console.error('❌ Error al redimensionar evento:', error);
      setError('Error al redimensionar el evento');
    }
  }, [updateEvent, setError]);

  // Personalizar el estilo de los eventos según su prioridad y estado de UPDATE
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';
    
    // Prioridad por estado de UPDATE
    if (event.updateStatus) {
      if (event.updateStatus === 'COMPLETED') {
        backgroundColor = '#4caf50'; // Verde para completado
      } else if (event.updateStatus === 'IN PROCESS') {
        backgroundColor = '#ff9800'; // Naranja para en proceso
      } else if (event.updateStatus === 'CANCELED' || event.updateStatus === 'CANCELLED') {
        backgroundColor = '#f44336'; // Rojo para cancelado
      } else if (event.updateStatus === 'PENDING') {
        backgroundColor = '#9e9e9e'; // Gris para pendiente
      }
    } else {
      // Si no hay updateStatus, usar prioridad
      switch (event.priority) {
        case 'high':
          backgroundColor = '#d32f2f';
          break;
        case 'medium':
          backgroundColor = '#f57c00';
          break;
        case 'low':
          backgroundColor = '#388e3c';
          break;
        default:
          backgroundColor = event.color || '#3174ad';
      }
    }

    const style = {
      backgroundColor,
      borderRadius: '5px',
      opacity: event.status === 'completed' ? 0.6 : 1,
      color: 'white',
      border: '0px',
      display: 'block',
    };

    return { style };
  };

  // Componente personalizado para mostrar eventos en vista de semana/día
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="custom-event">
      <strong>{event.title}</strong>
      {event.machine && <div className="event-machine">🏭 {event.machine}</div>}
      {event.pedido && <div className="event-pedido">📦 PO: {event.pedido}</div>}
      {event.pos && <div className="event-pos">🔢 POS: {event.pos}</div>}
    </div>
  );

  if (state.isLoading) {
    return (
      <div className="calendar-loading">
        <div className="loading-spinner"></div>
        <p>Cargando calendario...</p>
      </div>
    );
  }

  return (
    <div className="master-calendar-container">
      {/* Buscador de tareas */}
      <TaskSearch />
      
      <div className="calendar-header">
        <div className="header-top">
          <h2>Master Plan - Calendario</h2>
          <div className="header-actions">
            <button 
              className="new-event-button"
              onClick={() => {
                setSelectedEvent(null);
                setIsModalOpen(true);
              }}
            >
              ➕ Nuevo Evento
            </button>
            {persistenceService.hasPersistedData() && (
              <button 
                className="clear-data-button"
                onClick={async () => {
                  if (window.confirm('¿Estás seguro de borrar todos los datos guardados? Esta acción no se puede deshacer.')) {
                    await clearPersistedData();
                  }
                }}
                title="Borrar datos guardados"
              >
                🗑️ Limpiar Datos
              </button>
            )}
          </div>
        </div>
        {/* Tabs de planta */}
        <div className="plant-tabs">
          <button
            className={activePlant === 'P3' ? 'active' : ''}
            onClick={() => setActivePlant('P3')}
          >
            Planta 3
          </button>
          <button
            className={activePlant === 'P2' ? 'active' : ''}
            onClick={() => setActivePlant('P2')}
          >
            Planta 2
          </button>
        </div>
        
        {/* Leyenda de colores según estado UPDATE */}
        <div className="status-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#4caf50' }}></span>
            <span className="legend-label">COMPLETED</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ff9800' }}></span>
            <span className="legend-label">IN PROCESS</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#9e9e9e' }}></span>
            <span className="legend-label">PENDING / Sin Estado</span>
          </div>
        </div>
        
        <div className="calendar-stats">
          <span className="stat">
            Total de eventos: <strong>{state.events.length}</strong>
          </span>
          <span className="stat">
            Completados: <strong>
              {state.events.filter(e => e.status === 'completed').length}
            </strong>
          </span>
          <span className="stat">
            Pendientes: <strong>
              {state.events.filter(e => e.status === 'pending').length}
            </strong>
          </span>
          <span className="stat week-info">
            📅 <strong>Sem. {currentWeekNumber}</strong> (actual)
          </span>
        </div>
      </div>

      <div className="calendar-info">
        <small>💡 <strong>Tip:</strong> {activePlant === 'P3' ? 'Arrastra las tareas entre procesos para reorganizarlas' : 'Arrastra las tareas entre líneas para reorganizarlas'}</small>
      </div>

      {/* Renderizar vistas especiales para P2 y P3 */}
      {activePlant === 'P3' ? (
        <P3SwimlanesView 
          events={state.events}
          onEventClick={handleSelectEvent}
          spreadsheetId={state.selectedFile?.id}
          accessToken={driveService.getAccessToken() || undefined}
          currentUser={currentUser}
        />
      ) : activePlant === 'P2' ? (
        <P2SwimlanesView 
          events={state.events}
          onEventClick={handleSelectEvent}
          spreadsheetId={state.selectedFile?.id}
          accessToken={driveService.getAccessToken() || undefined}
          currentUser={currentUser}
        />
      ) : (
        <div className="calendar-with-weeks">
          {/* Números de semana a la izquierda */}
          <div className="week-numbers">
            <div className="week-numbers-header">
              <span>Sem</span>
            </div>
            {visibleWeeks.map((weekNum, index) => (
              <div 
                key={index} 
                className={`week-number ${weekNum === currentWeekNumber ? 'current-week' : ''}`}
                data-week={weekNum}
                title={`Semana ${weekNum} del año ${weekNum === currentWeekNumber ? '(Semana actual)' : ''}\nHaz clic para navegar a esta semana`}
                onClick={() => handleWeekClick(weekNum)}
              >
              {weekNum}
              {weekNum === currentWeekNumber && <span className="current-indicator">●</span>}
            </div>
          ))}
        </div>

        {/* Calendario principal */}
        <div className="calendar-main">
          <DnDCalendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor={(event: any) => event.start}
            endAccessor={(event: any) => event.end}
            style={{ height }}
            date={currentDate} // <-- Controla la navegación
            view={currentView}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent as any}
            onDoubleClickEvent={handleDoubleClickEvent as any}
            selectable
            eventPropGetter={eventStyleGetter as any}
            components={{
              event: EventComponent as any,
            }}
            messages={{
              next: 'Siguiente',
              previous: 'Anterior',
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              agenda: 'Agenda',
              date: 'Fecha',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'No hay eventos en este rango',
            }}
            formats={{
              dateFormat: 'dd',
              dayFormat: (date: Date) => 
                format(date, 'dd/MM', { locale: es }),
              dayHeaderFormat: (date: Date) => 
                format(date, 'cccc d/M', { locale: es }),
              monthHeaderFormat: (date: Date) => 
                format(date, 'MMMM yyyy', { locale: es }),
              timeGutterFormat: () => '', // Ocultar columna de horas en semana/día
              eventTimeRangeFormat: () => '', // Ocultar rango de horas en eventos
            }}
            onEventDrop={handleEventDrop as any}
            onEventResize={handleEventResize as any}
            onSelectSlot={handleSelectSlot as any}
            resizable
            draggableAccessor={() => true}
          />
        </div>
        </div>
      )
      }

      {state.error && (
        <div className="calendar-error">
          <p>❌ {state.error}</p>
          <button onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}

      {/* Modal para editar/crear eventos */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        currentUser={currentUser}
      />
      {/* Modal solo info por doble clic */}
      <EventInfoModal
        event={infoEvent}
        isOpen={isInfoOpen}
        onClose={handleCloseInfo}
      />
    </div>
  );
}
