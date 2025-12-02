# 🚀 Guía de Despliegue en Heroku - Master Plan

## ✅ Archivos Configurados

Se han creado y configurado los siguientes archivos para el despliegue:

### 1. `server.js`
Servidor Express que sirve la aplicación compilada.

### 2. `Procfile`
Le indica a Heroku cómo ejecutar la aplicación:
```
web: node server.js
```

### 3. `package.json` (actualizado)
- ✅ Script `start`: Inicia el servidor
- ✅ Script `heroku-postbuild`: Compila la app automáticamente
- ✅ Dependencia `express` agregada
- ✅ Especifica versión de Node.js (20.x)

## 📋 Prerequisitos

1. **Cuenta de Heroku**
   - Crear cuenta en: https://signup.heroku.com/

2. **Heroku CLI instalado**
   ```bash
   # Verificar si está instalado
   heroku --version
   
   # Si no está instalado, instalarlo:
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

3. **Git inicializado**
   ```bash
   git init  # Si no tienes repo git
   ```

## 🎯 Pasos para Desplegar

### Paso 1: Instalar Express
```bash
npm install express
```

### Paso 2: Probar localmente
```bash
# Compilar la aplicación
npm run build

# Iniciar el servidor
npm start
```
Visita http://localhost:3000 para verificar que funciona.

### Paso 3: Login en Heroku
```bash
heroku login
```
Se abrirá tu navegador para autenticarte.

### Paso 4: Crear aplicación en Heroku
```bash
# Crear nueva app (Heroku generará un nombre automático)
heroku create

# O con un nombre específico (debe ser único globalmente)
heroku create masterplan-produccion
```

### Paso 5: Configurar buildpack de Node.js (opcional, Heroku lo detecta automáticamente)
```bash
heroku buildpacks:set heroku/nodejs
```

### Paso 6: Commit de los cambios
```bash
# Agregar todos los archivos nuevos
git add .

# Hacer commit
git commit -m "Configure Heroku deployment with Express server"
```

### Paso 7: Desplegar a Heroku
```bash
git push heroku main
```

Si tu rama principal se llama `master`:
```bash
git push heroku master
```

### Paso 8: Abrir la aplicación
```bash
heroku open
```

## 🔍 Comandos Útiles de Heroku

### Ver logs en tiempo real
```bash
heroku logs --tail
```

### Ver estado de la app
```bash
heroku ps
```

### Reiniciar la app
```bash
heroku restart
```

### Ver variables de entorno
```bash
heroku config
```

### Agregar variable de entorno
```bash
heroku config:set NOMBRE_VARIABLE=valor
```

### Escalar dynos (instancias)
```bash
# Ver dynos actuales
heroku ps:scale

# Escalar a 1 web dyno (gratis)
heroku ps:scale web=1
```

### Ejecutar comandos en Heroku
```bash
heroku run bash
heroku run npm run build
```

### Ver información de la app
```bash
heroku info
```

## 🔧 Configuración Adicional (Opcional)

### 1. Agregar dominio personalizado
```bash
heroku domains:add www.tudominio.com
```

### 2. Configurar HTTPS automático
Heroku ya incluye SSL/HTTPS automáticamente en sus dominios `.herokuapp.com`.

### 3. Monitoreo y métricas
```bash
heroku addons:create papertrail  # Logs avanzados
heroku addons:create newrelic    # Monitoreo de performance
```

## 📊 Estructura de Despliegue

```
┌─────────────────────────────────────────┐
│         Usuario (Navegador)             │
└────────────────┬────────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────────┐
│     Heroku Router & Load Balancer       │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Node.js + Express               │
│         (server.js)                     │
│                                         │
│   ┌─────────────────────────────┐     │
│   │   Archivos Estáticos        │     │
│   │   (dist/)                   │     │
│   │   - index.html              │     │
│   │   - assets/*.js             │     │
│   │   - assets/*.css            │     │
│   └─────────────────────────────┘     │
└─────────────────────────────────────────┘
```

## 🐛 Troubleshooting

### Error: "Application error"
```bash
# Ver los logs para identificar el problema
heroku logs --tail
```

### Error: "H10 - App crashed"
- Verificar que `npm start` funcione localmente
- Revisar logs: `heroku logs`
- Verificar que el `Procfile` exista y esté correcto

### Error: "Cannot GET /"
- Asegurarse de que la carpeta `dist/` se haya compilado
- Ejecutar `npm run build` antes de desplegar

### Error: Build failed
```bash
# Ver logs de build
heroku builds:output

# Limpiar cache y volver a desplegar
heroku plugins:install heroku-repo
heroku repo:purge_cache -a nombre-de-tu-app
git commit --allow-empty -m "Purge cache"
git push heroku main
```

### La aplicación es muy lenta
- El dyno gratuito "duerme" después de 30 minutos de inactividad
- Primera carga puede tomar 10-30 segundos (cold start)
- Considerar upgrade a dyno "Hobby" ($7/mes) para evitar sleep

## 💰 Planes de Heroku

### Free (Eco Dyno - $5/mes por 1000 horas compartidas)
- ✅ Perfecto para desarrollo y pruebas
- ⚠️ Duerme después de 30 minutos sin actividad
- ⚠️ Límite de 550-1000 horas/mes

### Hobby ($7/mes por app)
- ✅ Nunca duerme
- ✅ SSL incluido
- ✅ Métricas básicas

### Production ($25-$500/mes)
- ✅ Múltiples workers
- ✅ Auto-scaling
- ✅ Métricas avanzadas

## 🔐 Variables de Entorno para Google Drive API

Si tu app usa Google Drive API, necesitas configurar las credenciales:

```bash
heroku config:set GOOGLE_CLIENT_ID="tu-client-id"
heroku config:set GOOGLE_CLIENT_SECRET="tu-client-secret"
heroku config:set GOOGLE_REDIRECT_URI="https://tu-app.herokuapp.com/callback"
```

**Importante**: Actualizar las URIs autorizadas en Google Cloud Console:
1. Ir a: https://console.cloud.google.com/
2. Seleccionar tu proyecto
3. Ir a "Credenciales"
4. Editar el cliente OAuth 2.0
5. Agregar: `https://tu-app.herokuapp.com` a "Orígenes autorizados"
6. Agregar: `https://tu-app.herokuapp.com/callback` a "URIs de redirección"

## 📱 Alternativas a Heroku

Si buscas alternativas gratuitas:

### 1. **Vercel** (Recomendado para frontend)
```bash
npm install -g vercel
vercel login
vercel
```

### 2. **Netlify**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### 3. **Railway**
- Similar a Heroku
- $5/mes de crédito gratis
- Despliegue automático desde GitHub

### 4. **Render**
- Similar a Heroku
- Plan gratuito disponible
- Auto-deploy desde Git

## 📝 Checklist Pre-Deploy

- [ ] `npm install` ejecutado sin errores
- [ ] `npm run build` funciona localmente
- [ ] `npm start` sirve la app correctamente en local
- [ ] Archivos `server.js` y `Procfile` creados
- [ ] Git repo inicializado
- [ ] Cambios commiteados
- [ ] Heroku CLI instalado y login realizado
- [ ] App creada en Heroku

## 🎉 Deploy Exitoso

Después de `git push heroku main`, deberías ver:

```
remote: -----> Building on the Heroku-20 stack
remote: -----> Using buildpack: heroku/nodejs
remote: -----> Node.js app detected
remote: -----> Installing dependencies
remote: -----> Build succeeded!
remote: -----> Discovering process types
remote:        Procfile declares types -> web
remote: -----> Compressing...
remote: -----> Launching...
remote:        Released v1
remote:        https://tu-app.herokuapp.com/ deployed to Heroku
```

Tu app estará disponible en: `https://tu-app.herokuapp.com`

## 🔄 Actualizaciones Futuras

Para actualizar la app después de hacer cambios:

```bash
git add .
git commit -m "Descripción de los cambios"
git push heroku main
```

Heroku automáticamente:
1. Detecta los cambios
2. Instala dependencias
3. Ejecuta `heroku-postbuild` (compila con Vite)
4. Reinicia el servidor
5. Tu app está actualizada ✨

---

## 📞 Soporte

- Documentación oficial: https://devcenter.heroku.com/
- Status de Heroku: https://status.heroku.com/
- Community: https://help.heroku.com/

¡Listo para desplegar! 🚀
