import React from 'react';
import type { CalendarEvent } from '../types';
import './EventModal.css';

interface EventInfoModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EventInfoModal: React.FC<EventInfoModalProps> = ({ event, isOpen, onClose }) => {
  if (!isOpen || !event) return null;

  return (
    <div className="event-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="event-modal">
        <div className="modal-header">
          <h3>Información de Actividad</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <div className="event-info-fields">
          <div className="info-row"><strong>PO:</strong> {event.pedido || '-'}</div>
          <div className="info-row"><strong>POS:</strong> {event.pos ?? '-'}</div>
          <div className="info-row"><strong>PROYECTO:</strong> {event.proyecto || '-'}</div>
          <div className="info-row"><strong>PLIEGOS:</strong> {event.pliegos ?? '-'}</div>
        </div>
      </div>
    </div>
  );
};
