import { useState, useCallback } from 'react';
import { useAppActions } from '../hooks/useApp';
import { 
  parseProductionSpreadsheet, 
  generateSampleProductionData, 
  convertTasksToCalendarEvents, 
  scheduleProductionTasks,
  type ProductionPlan 
} from '../utils/productionParser';
import { driveService } from '../services/googleDrive';
import type { DriveFile } from '../types';
import './ProductionLoader.css';

export function ProductionLoader() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [productionPlan, setProductionPlan] = useState<ProductionPlan | null>(null);
  const [showTaskList, setShowTaskList] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<DriveFile[]>([]);
  const [, setSelectedFile] = useState<DriveFile | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [spreadsheetData, setSpreadsheetData] = useState<any>(null);
  
  const { setEvents } = useAppActions();

  // Cargar lista de archivos de Google Drive
  const loadDriveFiles = useCallback(async () => {
    if (!driveService.isSignedIn()) {
      setProcessingStatus('❌ Debes conectar con Google Drive primero');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Cargando archivos de Google Drive...');

    try {
      const files = await driveService.listSpreadsheets();
      setAvailableFiles(files);
      setProcessingStatus(`✅ ${files.length} hojas de cálculo encontradas`);
    } catch (error) {
      console.error('Error cargando archivos:', error);
      setProcessingStatus('❌ Error al cargar archivos de Drive');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Procesar archivo seleccionado de Google Drive
  const handleDriveFileSelect = useCallback(async (file: DriveFile) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setProcessingStatus(`Analizando hojas en ${file.name}...`);

    try {
      // Obtener la lista de hojas disponibles (funciona para Google Sheets y Excel)
      const sheets = await driveService.getSheetNames(file.id);
      setAvailableSheets(sheets);
      
      const procesosPrdSheet = sheets.find(sheet => 
        sheet.toUpperCase().includes('PROCESOS PRD') ||
        sheet.toUpperCase().includes('PROCESOS_PRD') ||
        sheet.toUpperCase() === 'PROCESOS PRD'
      );
      
      const fileTypeText = file.isExcel ? '📗 Excel' : '📊 Google Sheets';
      
      if (procesosPrdSheet) {
        setSelectedSheet(procesosPrdSheet);
        setProcessingStatus(`✅ Encontrada hoja "${procesosPrdSheet}" en ${fileTypeText} - Leyendo datos...`);
      } else {
        setSelectedSheet(sheets[0]);
        setProcessingStatus(`⚠️ No se encontró "PROCESOS PRD" en ${fileTypeText}, usando "${sheets[0]}" - Leyendo datos...`);
      }
      
      // Leer datos de la hoja (automáticamente buscará PROCESOS PRD)
      const spreadsheetResult = await driveService.readSpreadsheet(file.id, selectedSheet || undefined);
      
      // Guardar los datos del spreadsheet para usar el nombre de hoja real
      setSpreadsheetData(spreadsheetResult);
      
      setProcessingStatus(`Procesando datos de producción desde ${fileTypeText}...`);
      
      // Parsear los datos de la hoja de cálculo
      const productionPlan = parseProductionSpreadsheet(spreadsheetResult.rows);
      
      // Programar las tareas automáticamente
      const scheduledTasks = scheduleProductionTasks(productionPlan.tasks);
      productionPlan.tasks = scheduledTasks;
      
      // Convertir a eventos de calendario
      const calendarEvents = convertTasksToCalendarEvents(productionPlan.tasks);
      
      setProductionPlan(productionPlan);
      setEvents(calendarEvents);
      
      const p3Tasks = productionPlan.tasks.filter(t => t.planta === 'P3');
      const p2Tasks = productionPlan.tasks.filter(t => t.planta === 'P2');
      
      const fileType = file.isExcel ? 'Excel' : 'Google Sheets';
      // Usar el nombre de hoja real del resultado, no el estado local
      const actualSheetName = spreadsheetResult.sheetName || selectedSheet || 'Sin nombre';
      setProcessingStatus(
        `✅ Procesado desde ${fileType} hoja "${actualSheetName}": ${productionPlan.items.length} productos → ` +
        `${p3Tasks.length} tareas P3 (Producción) + ${p2Tasks.length} tareas P2 (Ensamblaje)`
      );
      setShowTaskList(true);
      
    } catch (error) {
      console.error('Error procesando archivo:', error);
      setProcessingStatus(`❌ Error al procesar ${file.name}`);
    } finally {
      setIsProcessing(false);
    }
  }, [setEvents]);

  // Cargar datos de muestra
  const loadSampleData = useCallback(() => {
    setIsProcessing(true);
    setProcessingStatus('Generando datos de muestra...');

    setTimeout(() => {
      const samplePlan = generateSampleProductionData();
      const calendarEvents = convertTasksToCalendarEvents(samplePlan.tasks);
      
      setProductionPlan(samplePlan);
      setEvents(calendarEvents);
      
      setProcessingStatus(`✅ Datos de muestra cargados: ${samplePlan.items.length} productos, ${samplePlan.tasks.length} tareas`);
      setShowTaskList(true);
      setIsProcessing(false);
    }, 1500);
  }, [setEvents]);

  // Limpiar datos cargados
  const clearData = useCallback(() => {
    setProductionPlan(null);
    setShowTaskList(false);
    setProcessingStatus('');
    setSelectedFile(null);
    setEvents([]);
  }, [setEvents, setSelectedFile]);

  return (
    <div className="production-loader">
      <div className="loader-header">
        <h3>📊 Cargar Plan de Producción</h3>
        <p>Sube tu archivo Excel de PROCESOS PRD para generar tareas automáticamente</p>
      </div>

      <div className="upload-section">
        {/* Google Drive Integration */}
        <div className="drive-section">
          <h4>📂 Google Drive</h4>
          <div className="drive-controls">
            <button 
              onClick={loadDriveFiles}
              disabled={isProcessing || !driveService.isSignedIn()}
              className="drive-button"
            >
              🔄 Cargar Archivos de Drive
            </button>
            {!driveService.isSignedIn() && (
              <p className="drive-warning">⚠️ Conecta con Google Drive primero</p>
            )}
          </div>
          
          {availableFiles.length > 0 && (
            <div className="files-list">
              <h5>Hojas de cálculo disponibles:</h5>
              {availableFiles.map(file => (
                <div key={file.id} className="file-item">
                  <div className="file-info">
                    <div className="file-header">
                      <strong>{file.name}</strong>
                      {file.fileType && (
                        <span className={`file-type-badge ${file.isExcel ? 'excel' : 'google-sheets'}`}>
                          {file.fileType}
                        </span>
                      )}
                    </div>
                    <small>
                      Modificado: {new Date(file.modifiedTime).toLocaleDateString()}
                      {file.size && ` • Tamaño: ${file.size}`}
                    </small>
                  </div>
                  <button 
                    onClick={() => handleDriveFileSelect(file)}
                    disabled={isProcessing}
                    className="select-file-button"
                  >
                    {file.isExcel ? '📗 Cargar Excel' : '📊 Cargar Sheets'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {availableSheets.length > 0 && (
            <div className="sheets-info">
              <h5>📋 Hojas disponibles en el archivo:</h5>
              <div className="sheets-list">
                {availableSheets.map(sheet => (
                  <span 
                    key={sheet} 
                    className={`sheet-tag ${sheet === selectedSheet ? 'selected' : ''} ${
                      sheet.toUpperCase().includes('PROCESOS PRD') ? 'procesos-prd' : ''
                    }`}
                  >
                    {sheet}
                    {sheet === selectedSheet && ' ✓'}
                    {sheet.toUpperCase().includes('PROCESOS PRD') && ' 🎯'}
                  </span>
                ))}
              </div>
              {selectedSheet && (
                <p className="selected-sheet-info">
                  📊 <strong>Hoja seleccionada:</strong> "{selectedSheet}"
                  {selectedSheet.toUpperCase().includes('PROCESOS PRD') 
                    ? ' ✅ (Correcta para producción)' 
                    : ' ⚠️ (Verificar si contiene datos de PROCESOS PRD)'
                  }
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sample Data Section */}
        <div className="sample-data-section">
          <h4>🧪 Datos de Muestra</h4>
          <p>O utiliza datos de ejemplo para probar el sistema:</p>
          <button 
            onClick={loadSampleData}
            disabled={isProcessing}
            className="sample-button"
          >
            🧪 Cargar Datos de Muestra
          </button>
        </div>
      </div>

      {processingStatus && (
        <div className={`processing-status ${processingStatus.includes('❌') ? 'error' : processingStatus.includes('✅') ? 'success' : 'info'}`}>
          {isProcessing && <div className="spinner"></div>}
          <span>{processingStatus}</span>
        </div>
      )}

      {productionPlan && showTaskList && (
        <div className="production-summary">
          <h4>📋 Resumen de Producción</h4>
          
          <div className="summary-stats">
            <div className="stat-card">
              <span className="stat-number">{productionPlan.items.length}</span>
              <span className="stat-label">Productos Excel</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{productionPlan.tasks.length}</span>
              <span className="stat-label">Total Tareas</span>
            </div>
            <div className="stat-card plan-p3">
              <span className="stat-number">
                {productionPlan.tasks.filter(t => t.planta === 'P3').length}
              </span>
              <span className="stat-label">🏭 PLAN P3 (Producción)</span>
            </div>
            <div className="stat-card plan-p2">
              <span className="stat-number">
                {productionPlan.tasks.filter(t => t.planta === 'P2').length}
              </span>
              <span className="stat-label">🔧 PLAN P2 (Ensamblaje)</span>
            </div>
          </div>

          {(selectedSheet || (spreadsheetData && spreadsheetData.sheetName)) && (
            <div className="sheet-summary">
              <p><strong>📊 Hoja procesada:</strong> "{spreadsheetData?.sheetName || selectedSheet}"</p>
              <p><strong>🔄 Flujo generado:</strong> 
                Excel PROCESOS PRD → 
                {productionPlan.tasks.filter(t => t.planta === 'P3').length} tareas P3 → 
                {productionPlan.tasks.filter(t => t.planta === 'P2').length} tareas P2 → 
                Calendario interactivo
              </p>
            </div>
          )}

          <div className="tasks-preview">
            <h5>🔧 Tareas Generadas por Planta</h5>
            
            {/* PLAN P3 - Producción */}
            <div className="plant-section p3-section">
              <h6>🏭 PLAN P3 - PRODUCCIÓN</h6>
              <div className="process-groups">
                {['IMPRESION', 'BARNIZ', 'LAMINADO', 'ESTAMPADO', 'REALZADO', 'TROQUELADO'].map(process => {
                  const processTasks = productionPlan.tasks.filter(t => 
                    t.processType === process && t.planta === 'P3'
                  );
                  if (processTasks.length === 0) return null;

                  return (
                    <div key={process} className="process-group p3-process">
                      <div className="process-header">
                        <span className="process-name">{process}</span>
                        <span className="process-count">{processTasks.length} tareas</span>
                      </div>
                    <div className="tasks-list">
                      {processTasks.slice(0, 3).map(task => (
                        <div key={task.id} className="task-item">
                          <div className="task-info">
                            <strong>{task.proyecto}</strong>
                            <small>Pedido: {task.pedido || '-'} | Pliegos: {typeof task.pliegos !== 'undefined' ? task.pliegos : '-'} | {task.duration}h | {task.quantity} unidades</small>
                          </div>
                          <div className={`task-priority ${task.priority}`}>
                            {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                          </div>
                        </div>
                      ))}
                      {processTasks.length > 3 && (
                        <div className="more-tasks">
                          +{processTasks.length - 3} tareas más...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

            {/* PLAN P2 - Ensamblaje */}
            <div className="plant-section p2-section">
              <h6>🔧 PLAN P2 - ENSAMBLAJE</h6>
              <div className="process-groups">
                {(() => {
                  const ensambleTasks = productionPlan.tasks.filter(t => 
                    t.processType === 'ENSAMBLAJE' && t.planta === 'P2'
                  );
                  
                  if (ensambleTasks.length === 0) return <p className="no-tasks">No hay tareas de ensamblaje</p>;

                  return (
                    <div className="process-group p2-process">
                      <div className="process-header">
                        <span className="process-name">ENSAMBLAJE</span>
                        <span className="process-count">{ensambleTasks.length} tareas</span>
                      </div>
                      <div className="tasks-list">
                        {ensambleTasks.slice(0, 3).map(task => (
                          <div key={task.id} className="task-item">
                            <div className="task-info">
                              <strong>{task.proyecto}</strong>
                              <small>Pedido: {task.pedido} | {task.duration}h | {task.quantity} unidades</small>
                              <small className="dependencies-info">
                                Depende de: {task.dependencies?.length || 0} procesos P3
                              </small>
                            </div>
                            <div className={`task-priority ${task.priority}`}>
                              {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                            </div>
                          </div>
                        ))}
                        {ensambleTasks.length > 3 && (
                          <div className="more-tasks">
                            +{ensambleTasks.length - 3} tareas más...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={() => setShowTaskList(false)}
              className="close-button"
            >
              Cerrar Resumen
            </button>
            <button 
              onClick={clearData}
              className="reload-button"
            >
              🔄 Cargar Nuevo Archivo
            </button>
          </div>
        </div>
      )}

      <div className="instructions">
        <h4>📖 Instrucciones para Excel con Múltiples Hojas</h4>
        <ol>
          <li><strong>Hoja requerida:</strong> El archivo debe contener una hoja llamada "PROCESOS PRD"</li>
          <li><strong>Detección automática:</strong> El sistema buscará automáticamente la hoja "PROCESOS PRD"</li>
          <li><strong>Formato requerido:</strong> Columnas PEDIDO, PROYECTO, MATERIAL, IMPRESION, BARNIZ, etc.</li>
          <li><strong>Procesos P3:</strong> Marcar con "TRUE" los procesos de producción (IMPRESION → TROQUELADO)</li>
          <li><strong>Ensamblaje P2:</strong> Se genera automáticamente si hay procesos P3 completados</li>
          <li><strong>Calendario final:</strong> Todas las tareas aparecen diferenciadas por planta en el calendario</li>
        </ol>
        
        <div className="workflow-diagram">
          <h5>🔄 Flujo Automatizado:</h5>
          <p>
            <span className="workflow-step">Excel "PROCESOS PRD"</span> → 
            <span className="workflow-step p3">PLAN P3 (Producción)</span> → 
            <span className="workflow-step p2">PLAN P2 (Ensamblaje)</span> → 
            <span className="workflow-step">Calendario Interactivo</span>
          </p>
        </div>
      </div>
    </div>
  );
}
