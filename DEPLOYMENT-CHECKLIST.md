# ✅ CHECKLIST DE DESPLIEGUE - Master Plan

## 📋 Pre-Requisitos

### Software Necesario
- [ ] Node.js 20.x instalado
  ```bash
  node --version  # Debe mostrar v20.x.x
  ```
- [ ] npm 10.x instalado
  ```bash
  npm --version  # Debe mostrar 10.x.x
  ```
- [ ] Git instalado
  ```bash
  git --version
  ```
- [ ] Heroku CLI instalado
  ```bash
  heroku --version
  ```

### Cuentas Necesarias
- [ ] Cuenta de GitHub (opcional pero recomendado)
- [ ] Cuenta de Heroku creada en https://signup.heroku.com/

---

## 🔍 Verificación Local

### 1. Instalación de Dependencias
```bash
npm install
```
- [ ] Completado sin errores
- [ ] `node_modules/` creado
- [ ] `package-lock.json` actualizado

### 2. Build Local
```bash
npm run build
```
- [ ] Compilación exitosa
- [ ] Carpeta `dist/` creada
- [ ] Sin errores de TypeScript

### 3. Prueba en Modo Producción
```bash
./test-production.sh
```
- [ ] Servidor inicia en http://localhost:3000
- [ ] Aplicación carga correctamente
- [ ] Puedes navegar sin errores
- [ ] Cargar Excel funciona
- [ ] Calendario muestra eventos
- [ ] Colores se aplican correctamente
- [ ] Persistencia funciona (F5 mantiene datos)

---

## 🚀 Despliegue a Heroku

### 1. Login en Heroku
```bash
heroku login
```
- [ ] Navegador abre
- [ ] Login exitoso
- [ ] Terminal confirma autenticación

### 2. Crear Aplicación (Primera vez)
```bash
# Opción A: Nombre automático
heroku create

# Opción B: Nombre específico
heroku create masterplan-produccion
```
- [ ] App creada exitosamente
- [ ] URL de Heroku recibida
- [ ] Remote de git configurado

### 3. Verificar Archivos de Configuración
- [ ] `server.js` existe
- [ ] `Procfile` existe y contiene: `web: node server.js`
- [ ] `package.json` tiene script `start`
- [ ] `package.json` tiene script `heroku-postbuild`
- [ ] Express está en `dependencies`

### 4. Commit de Cambios
```bash
git add .
git commit -m "Deploy to Heroku"
```
- [ ] Todos los archivos agregados
- [ ] Commit creado
- [ ] `.gitignore` respetado (no se suben node_modules, dist, .env)

### 5. Push a Heroku
```bash
git push heroku main
```
- [ ] Build inicia en Heroku
- [ ] `npm install` ejecuta
- [ ] `npm run heroku-postbuild` ejecuta
- [ ] Build completa exitosamente
- [ ] Dyno web inicia

### 6. Verificación Post-Deploy
```bash
heroku open
```
- [ ] Navegador abre la app
- [ ] Aplicación carga (puede tomar 10-30 seg la primera vez)
- [ ] No hay "Application Error"
- [ ] UI se ve correctamente

---

## 🧪 Testing en Producción

### Funcionalidades Básicas
- [ ] Página principal carga
- [ ] Calendario se muestra
- [ ] Tabs de Planta 2/3 funcionan
- [ ] Leyenda de colores visible

### Carga de Excel
- [ ] Botón de cargar Excel funciona
- [ ] Puede seleccionar archivo
- [ ] Excel se procesa correctamente
- [ ] Eventos aparecen en calendario
- [ ] Colores correctos según UPDATE:
  - [ ] Verde para COMPLETED
  - [ ] Naranja para IN PROCESS
  - [ ] Gris para PENDING/vacío

### Persistencia
- [ ] Eventos persisten al recargar (F5)
- [ ] Drag & drop funciona
- [ ] Posiciones se mantienen al recargar
- [ ] Botón "Limpiar Datos" funciona

### Performance
- [ ] Carga inicial < 5 segundos
- [ ] Navegación fluida
- [ ] Drag & drop suave
- [ ] No hay lag visible

---

## 📊 Monitoreo Post-Deploy

### Logs
```bash
heroku logs --tail
```
- [ ] No hay errores críticos
- [ ] Servidor inicia correctamente
- [ ] No hay warnings importantes

### Estado
```bash
heroku ps
```
- [ ] Dyno web está "up"
- [ ] Sin crashes recientes

### Información
```bash
heroku info
```
- [ ] URL correcta
- [ ] Stack: heroku-22 o heroku-20
- [ ] Región: US o EU

---

## 🔧 Configuración Adicional (Opcional)

### Variables de Entorno
Si usas Google Drive API u otros servicios:
```bash
heroku config:set GOOGLE_CLIENT_ID="..."
heroku config:set GOOGLE_CLIENT_SECRET="..."
```
- [ ] Variables configuradas
- [ ] App reiniciada después de cambios

### Dominio Personalizado
```bash
heroku domains:add www.tudominio.com
```
- [ ] Dominio agregado
- [ ] DNS configurado
- [ ] HTTPS funcionando

### Monitoreo Avanzado
```bash
heroku addons:create papertrail:choklad
```
- [ ] Addon instalado
- [ ] Logs centralizados

---

## 🐛 Troubleshooting

### Si hay "Application Error"
```bash
heroku logs --tail
```
- [ ] Revisar últimos logs
- [ ] Identificar error específico
- [ ] Corregir localmente
- [ ] Re-deploy

### Si Build Falla
```bash
# Limpiar cache
heroku plugins:install heroku-repo
heroku repo:purge_cache -a nombre-app
git commit --allow-empty -m "Purge cache"
git push heroku main
```
- [ ] Cache limpiado
- [ ] Re-build exitoso

### Si es Muy Lento (Cold Start)
- [ ] Considerar upgrade a Hobby Dyno ($7/mes)
- [ ] O usar servicio como "Kaffeine" para mantenerlo activo

---

## ✨ Post-Despliegue

### Documentación
- [ ] URL de producción documentada
- [ ] Credenciales guardadas de forma segura
- [ ] Equipo notificado

### Compartir
- [ ] URL compartida con stakeholders
- [ ] Demo realizada
- [ ] Feedback recolectado

### Mantenimiento
- [ ] Calendario de actualizaciones definido
- [ ] Sistema de backup configurado (si aplica)
- [ ] Monitoreo continuo establecido

---

## 📈 Métricas de Éxito

### Performance
- [ ] Tiempo de carga < 3 segundos
- [ ] No hay errores en consola
- [ ] 100% uptime en primeras 24 horas

### Funcionalidad
- [ ] Todos los features funcionan
- [ ] No hay bugs críticos
- [ ] UX es fluida

### Usuarios
- [ ] Feedback positivo
- [ ] Sin quejas técnicas
- [ ] Adopción exitosa

---

## 🎉 ¡Despliegue Completado!

Si todas las casillas están marcadas, **¡felicitaciones!** 🎊

Tu aplicación Master Plan está:
- ✅ En producción
- ✅ Funcionando correctamente
- ✅ Lista para usar

### Próximos Pasos
1. Monitorear logs durante las primeras 24 horas
2. Recolectar feedback de usuarios
3. Planear próximas mejoras
4. Mantener actualizada la documentación

---

## 📞 Recursos de Ayuda

- **Documentación Local**: 
  - `HEROKU-DEPLOYMENT-GUIDE.md` - Guía completa
  - `DEPLOY-QUICK-START.md` - Inicio rápido
  - `RESUMEN-COMPLETO.md` - Vista general

- **Heroku**:
  - https://devcenter.heroku.com/
  - https://status.heroku.com/
  - https://help.heroku.com/

- **Comandos Rápidos**:
  ```bash
  ./heroku-commands.sh  # Ver todos los comandos
  ```

---

**Última actualización**: 2 de Diciembre, 2025
**Versión**: 2.0
