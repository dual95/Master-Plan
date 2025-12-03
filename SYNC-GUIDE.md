# 🔄 Guía de Sincronización Local ↔ Heroku

Esta guía asegura que tu versión local y la versión de Heroku sean **idénticas**.

## ⚡ Inicio Rápido

### 1️⃣ Verifica tu configuración actual

```bash
./verify-config.sh
```

Este script te mostrará:
- ✅ Variables configuradas localmente (.env)
- ✅ Variables configuradas en Heroku
- ⚠️ Diferencias entre ambas configuraciones

### 2️⃣ Sincroniza automáticamente

```bash
./deploy.sh
```

El script de deploy:
1. ✅ Lee tu archivo `.env` local
2. ✅ Sincroniza automáticamente las variables a Heroku
3. ✅ Te recuerda verificar Google Cloud Console
4. ✅ Despliega la aplicación

### 3️⃣ Configura Google Cloud Console

**IMPORTANTE:** Ambas URLs (local y Heroku) deben estar configuradas.

#### Pasos:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services > Credentials**
4. Edita tu **OAuth 2.0 Client ID**
5. Agrega en **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   https://tu-app-name.herokuapp.com
   ```
6. Agrega en **Authorized redirect URIs:**
   ```
   http://localhost:5173
   https://tu-app-name.herokuapp.com
   ```

---

## 📋 Checklist de Sincronización

Antes de deployar, verifica que:

- [ ] Tienes archivo `.env` configurado localmente
- [ ] `VITE_GOOGLE_API_KEY` está configurado
- [ ] `VITE_GOOGLE_CLIENT_ID` está configurado
- [ ] `VITE_GOOGLE_REDIRECT_URI` está configurado (opcional, se auto-genera)
- [ ] Google Cloud Console tiene AMBAS URLs (localhost y Heroku)
- [ ] Has ejecutado `./verify-config.sh` sin errores

---

## 🔧 Configuración Manual

### Opción A: Sincronización Automática (Recomendado)

```bash
./deploy.sh
```

Durante el deploy, el script te preguntará si quieres sincronizar las variables.

### Opción B: Sincronización Manual

Si prefieres hacerlo manualmente:

```bash
# Configurar variables en Heroku
heroku config:set VITE_GOOGLE_API_KEY="tu_api_key_aquí"
heroku config:set VITE_GOOGLE_CLIENT_ID="tu_client_id_aquí"
heroku config:set VITE_GOOGLE_REDIRECT_URI="https://tu-app.herokuapp.com"

# Verificar
heroku config
```

---

## 🎯 Workflow Recomendado

### Desarrollo Local
```bash
# 1. Asegúrate de tener .env configurado
cp .env.example .env
# Edita .env con tus credenciales

# 2. Ejecuta localmente
npm run dev

# 3. Prueba en http://localhost:5173
```

### Deploy a Heroku
```bash
# 1. Verifica que todo esté sincronizado
./verify-config.sh

# 2. Deploy automático (incluye sincronización)
./deploy.sh

# 3. Abre la app en Heroku
heroku open
```

---

## 🔍 Solución de Problemas

### Problema: "La pestaña Conexión se ve diferente en Heroku"

**Causa:** Variables de entorno no sincronizadas.

**Solución:**
```bash
# Verifica diferencias
./verify-config.sh

# Sincroniza
./deploy.sh
```

### Problema: "Google OAuth no funciona en Heroku"

**Causa:** URL de Heroku no está en Google Cloud Console.

**Solución:**
1. Ve a Google Cloud Console
2. Agrega la URL de Heroku a:
   - Authorized JavaScript origins
   - Authorized redirect URIs

### Problema: "Variables de entorno no se cargan"

**Verificación:**
```bash
# Local
cat .env

# Heroku
heroku config

# Comparar
./verify-config.sh
```

---

## 📚 Archivos Relacionados

- `deploy.sh` - Script principal de deploy con sincronización automática
- `verify-config.sh` - Verifica y compara configuraciones
- `.env.example` - Template de variables de entorno
- `.env` - Tu configuración local (no se sube a git)
- `DEPLOYMENT-CHECKLIST.md` - Checklist completo de deploy

---

## 🎉 Resultado Esperado

Después de seguir esta guía:

✅ Versión local y Heroku son **idénticas**
✅ Google OAuth funciona en **ambas** versiones
✅ La pestaña "Conexión" se ve **igual** en ambas
✅ Puedes conectarte a Google Drive desde **cualquier** versión

---

## 🚀 Comandos Rápidos

```bash
# Ver configuración local
cat .env

# Ver configuración Heroku
heroku config

# Comparar ambas
./verify-config.sh

# Sincronizar y deployar
./deploy.sh

# Ver logs de Heroku
heroku logs --tail

# Abrir app de Heroku
heroku open
```

---

**¿Necesitas ayuda?** Consulta `HEROKU-DEPLOYMENT-GUIDE.md` o `START-HERE.txt`
