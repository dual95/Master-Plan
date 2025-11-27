import { generateSampleEvents } from '../utils/calendar';
import { useAppActions } from '../hooks/useApp';
import './SampleDataLoader.css';

export function SampleDataLoader() {
  const { setEvents } = useAppActions();

  const loadSampleData = () => {
    const sampleEvents = generateSampleEvents();
    setEvents(sampleEvents);
  };

  return (
    <div className="sample-data-loader">
      <div className="sample-info">
        <h4>🎯 Datos de Ejemplo</h4>
        <p>¿No tienes una hoja de cálculo lista? Carga algunos eventos de ejemplo para probar la funcionalidad.</p>
      </div>
      <button 
        onClick={loadSampleData}
        className="load-sample-button"
        type="button"
      >
        📊 Cargar Eventos de Ejemplo
      </button>
    </div>
  );
}
