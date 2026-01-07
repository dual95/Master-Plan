import { useState, useEffect } from 'react';
import type { CalendarEvent } from '../types';
import type { User } from '../services/authService';
import './EventModal.css';

interface EventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  currentUser: User | null;
}

export function EventModal({ event, isOpen, onClose, onSave, onDelete, currentUser }: EventModalProps) {
  const isAdmin = currentUser?.role === 'admin';
  const isObserver = currentUser?.role === 'observer';
  const [formData, setFormData] = useState<CalendarEvent>({
    id: '',
    title: '',
    description: '',
    start: '',
    end: '',
    priority: 'medium',
    status: 'pending',
    category: '',
    assignee: ''
  });

  useEffect(() => {
    if (event) {
      console.log('📝 EventModal: Abriendo evento:', {
        id: event.id,
        title: event.title,
        pedido: event.pedido,
        unitPrice: event.unitPrice,
        esperado: event.esperado,
        real: event.real,
        hasUnitPrice: 'unitPrice' in event
      });
      setFormData(event);
    } else {
      // Limpiar formulario para nuevo evento
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      setFormData({
        id: '',
        title: '',
        description: '',
        start: now.toISOString().slice(0, 16),
        end: oneHourLater.toISOString().slice(0, 16),
        priority: 'medium',
        status: 'pending',
        category: '',
        assignee: ''
      });
    }
  }, [event]);

  if (!isOpen) return null;

  const handleChange = (field: keyof CalendarEvent, value: string) => {
    // Convertir a número para campos numéricos
    if (field === 'esperado' || field === 'real' || field === 'unitPrice') {
      const numValue = value === '' ? undefined : parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [field]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('El título es requerido');
      return;
    }

    const eventToSave: CalendarEvent = {
      ...formData,
      id: formData.id || `event-${Date.now()}`,
      title: formData.title.trim()
    };

    onSave(eventToSave);
    onClose();
  };

  const handleDelete = () => {
    if (formData.id && window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      onDelete(formData.id);
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="event-modal-overlay" onClick={handleOverlayClick}>
      <div className="event-modal">
        <div className="modal-header">
          <h3>{event ? '✏️ Editar Evento' : '➕ Nuevo Evento'}</h3>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <label htmlFor="title">Título *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Nombre del evento"
              required
              readOnly={!isAdmin}
              style={!isAdmin ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descripción del evento (opcional)"
              rows={3}
              readOnly={!isAdmin}
              style={!isAdmin ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start">Fecha y hora de inicio *</label>
              <input
                id="start"
                type="datetime-local"
                value={typeof formData.start === 'string' ? formData.start.slice(0, 16) : formData.start.toISOString().slice(0, 16)}
                onChange={(e) => handleChange('start', e.target.value)}
                required
                readOnly={!isAdmin}
                style={!isAdmin ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end">Fecha y hora de fin *</label>
              <input
                id="end"
                type="datetime-local"
                value={typeof formData.end === 'string' ? formData.end.slice(0, 16) : formData.end.toISOString().slice(0, 16)}
                onChange={(e) => handleChange('end', e.target.value)}
                required
                readOnly={!isAdmin}
                style={!isAdmin ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Prioridad</label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                disabled={!isAdmin}
                style={!isAdmin ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
              >
                <option value="low">🟢 Baja</option>
                <option value="medium">🟡 Media</option>
                <option value="high">🔴 Alta</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Estado</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={isObserver}
                style={isObserver 
                  ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' }
                  : { borderColor: '#2196f3', borderWidth: '2px' }
                }
              >
                <option value="pending">⏳ Pendiente</option>
                <option value="in-progress">🔄 En Progreso</option>
                <option value="completed">✅ Completado</option>
                <option value="cancelled">❌ Cancelado</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Categoría</label>
              <input
                id="category"
                type="text"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="ej: Trabajo, Personal, Reunión"
                readOnly={!isAdmin}
                style={!isAdmin ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
              />
            </div>

            <div className="form-group">
              <label htmlFor="assignee">Asignado a</label>
              <input
                id="assignee"
                type="text"
                value={formData.assignee}
                onChange={(e) => handleChange('assignee', e.target.value)}
                placeholder="Nombre de la persona responsable"
                readOnly={!isAdmin}
                style={!isAdmin ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
              />
            </div>
          </div>

          {/* Campos manuales: Esperado y Real */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="esperado">📊 Esperado</label>
              <input
                id="esperado"
                type="number"
                step="0.01"
                value={formData.esperado || ''}
                onChange={(e) => handleChange('esperado', e.target.value)}
                placeholder="Valor esperado"
                readOnly={!isAdmin}
                style={!isAdmin ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
              />
            </div>

            <div className="form-group">
              <label htmlFor="real">📈 Real {!isAdmin && !isObserver && '(Editable)'}</label>
              <input
                id="real"
                type="number"
                step="0.01"
                value={formData.real || ''}
                onChange={(e) => handleChange('real', e.target.value)}
                placeholder="Valor real"
                readOnly={isObserver}
                style={isObserver 
                  ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' }
                  : !isAdmin 
                    ? { borderColor: '#4caf50', borderWidth: '2px' }
                    : {}
                }
              />
            </div>
          </div>

          {/* Campo de precio unitario */}
          <div className="form-group">
            <label htmlFor="unitPrice">💰 $/UND (Precio Unitario)</label>
            <input
              id="unitPrice"
              type="number"
              step="0.0001"
              value={formData.unitPrice || ''}
              onChange={(e) => handleChange('unitPrice', e.target.value)}
              placeholder="Precio por unidad (desde Excel)"
              readOnly={!isAdmin}
              style={!isAdmin ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
            />
            <small style={{ color: '#666', fontSize: '0.85rem' }}>
              {isAdmin 
                ? 'Este valor se lee automáticamente del Excel. Puedes editarlo manualmente si es necesario.'
                : 'Solo lectura - contacta al administrador para cambios'}
            </small>
          </div>

          <div className="modal-actions">
            <div className="left-actions">
              {event && isAdmin && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="delete-button"
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>

            <div className="right-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Cancelar
              </button>
              <button type="submit" className="save-button">
                {event ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
