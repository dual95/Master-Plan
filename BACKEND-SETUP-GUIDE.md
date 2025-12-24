# 🚀 Deployment en Heroku con PostgreSQL

## Configuración de Base de Datos Compartida

Ahora la aplicación usa **PostgreSQL** para que todos los usuarios vean las mismas tasks, sin importar desde dónde se conecten.

## 📋 Pasos para Deployment

### 1️⃣ Instalar dependencias nuevas

Primero, instala las nuevas dependencias localmente:

```bash
npm install
```

Esto instalará:
- `pg` - Driver de PostgreSQL
- `cors` - Para permitir requests desde el frontend

### 2️⃣ Agregar PostgreSQL en Heroku

Ejecuta este comando en tu terminal (debes tener Heroku CLI instalado):

```bash
heroku addons:create heroku-postgresql:essential-0 -a tu-nombre-de-app
```

Reemplaza `tu-nombre-de-app` con el nombre de tu app en Heroku.

**Nota:** El plan `essential-0` es GRATIS y soporta hasta 10,000 filas.

### 3️⃣ Verificar que se creó la base de datos

```bash
heroku config -a tu-nombre-de-app
```

Deberías ver una variable `DATABASE_URL` con la conexión a PostgreSQL.

### 4️⃣ Hacer commit y push

```bash
git add .
git commit -m "feat: agregar backend con PostgreSQL para datos compartidos"
git push heroku main
```

### 5️⃣ Verificar logs

```bash
heroku logs --tail -a tu-nombre-de-app
```

Deberías ver:
```
✅ Base de datos inicializada
🚀 Servidor corriendo en puerto 3000
💾 Base de datos: PostgreSQL (Heroku)
```

## 🔍 Endpoints de la API

El servidor ahora expone estos endpoints:

- `GET /api/events` - Obtener todos los eventos
- `POST /api/events` - Guardar todos los eventos
- `PUT /api/events/:id` - Actualizar un evento
- `DELETE /api/events/:id` - Eliminar un evento
- `GET /api/health` - Verificar salud del servidor y BD

## 💡 Cómo Funciona

1. **Al cargar la página**: Se obtienen los eventos desde PostgreSQL
2. **Al modificar un evento**: Se guarda automáticamente en PostgreSQL
3. **Fallback**: Si el servidor falla, usa localStorage como respaldo
4. **Sincronización**: Todos los usuarios ven los mismos datos en tiempo real

## 🧪 Probar localmente

Para probar con PostgreSQL local (opcional):

```bash
# Instalar PostgreSQL en tu máquina
# Crear base de datos
createdb masterplan_dev

# Configurar variable de entorno
export DATABASE_URL="postgresql://localhost/masterplan_dev"

# Iniciar servidor
npm start
```

## ⚠️ Importante

- **Primera carga**: Los eventos actuales en localStorage se subirán al servidor
- **Persistencia**: Los datos ahora persisten en PostgreSQL, no en el navegador
- **Compartido**: Todos los usuarios conectados a tu Heroku app ven los mismos eventos

## 🆘 Troubleshooting

### "Error inicializando base de datos"
```bash
heroku restart -a tu-nombre-de-app
```

### Ver datos en la base de datos
```bash
heroku pg:psql -a tu-nombre-de-app
\dt  # Listar tablas
SELECT count(*) FROM events;  # Contar eventos
\q   # Salir
```

### Limpiar base de datos
```bash
heroku pg:psql -a tu-nombre-de-app
DELETE FROM events;
\q
```

## 📊 Monitoreo

Ver cuántos eventos tienes guardados:
```bash
heroku pg:info -a tu-nombre-de-app
```

## 🎉 Resultado

Ahora cualquier persona que entre a tu aplicación verá **exactamente las mismas tasks**, sin importar desde qué navegador o dispositivo se conecte!
