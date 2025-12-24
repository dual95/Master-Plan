import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentar límite para eventos grandes

// Configurar PostgreSQL
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Crear tabla si no existe
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_events_updated_at ON events(updated_at DESC);
    `);
    
    console.log('✅ Base de datos inicializada');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

// Inicializar DB al arrancar
initDatabase();

// ==================== API ENDPOINTS ====================

// GET /api/events - Obtener todos los eventos
app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM events ORDER BY updated_at DESC');
    const events = result.rows.map(row => row.data);
    
    console.log(`📦 Enviando ${events.length} eventos`);
    res.json({ events, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

// POST /api/events - Guardar todos los eventos (sobrescribe)
app.post('/api/events', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Se esperaba un array de eventos' });
    }

    console.log(`💾 Guardando ${events.length} eventos...`);

    // Iniciar transacción
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Eliminar todos los eventos existentes
      await client.query('DELETE FROM events');
      
      // Insertar nuevos eventos
      for (const event of events) {
        await client.query(
          'INSERT INTO events (id, data, updated_at) VALUES ($1, $2, NOW())',
          [event.id, JSON.stringify(event)]
        );
      }
      
      await client.query('COMMIT');
      console.log(`✅ ${events.length} eventos guardados exitosamente`);
      
      res.json({ 
        success: true, 
        message: `${events.length} eventos guardados`,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error guardando eventos:', error);
    res.status(500).json({ error: 'Error al guardar eventos' });
  }
});

// PUT /api/events/:id - Actualizar un evento específico
app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = req.body;
    
    if (!event || !event.id) {
      return res.status(400).json({ error: 'Evento inválido' });
    }

    console.log(`🔄 Actualizando evento ${id}...`);

    const result = await pool.query(
      `INSERT INTO events (id, data, updated_at) 
       VALUES ($1, $2, NOW())
       ON CONFLICT (id) 
       DO UPDATE SET data = $2, updated_at = NOW()`,
      [id, JSON.stringify(event)]
    );
    
    console.log(`✅ Evento ${id} actualizado`);
    res.json({ success: true, event });
  } catch (error) {
    console.error('Error actualizando evento:', error);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
});

// DELETE /api/events/:id - Eliminar un evento específico
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Eliminando evento ${id}...`);
    
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
    
    console.log(`✅ Evento ${id} eliminado`);
    res.json({ success: true, message: 'Evento eliminado' });
  } catch (error) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
});

// GET /api/health - Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// ==================== SERVIR FRONTEND ====================

// Servir archivos estáticos de la carpeta 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// Para cualquier ruta que NO sea /api, servir el index.html (SPA routing)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`💾 Base de datos: ${process.env.DATABASE_URL ? 'PostgreSQL (Heroku)' : 'No configurada'}`);
});
