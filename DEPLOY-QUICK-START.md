# 🚀 Despliegue Rápido - Master Plan

## 📋 Resumen Ejecutivo

Tu aplicación **Master Plan** está lista para desplegarse en Heroku. Todos los archivos necesarios ya están configurados.

## ⚡ Despliegue en 3 Pasos

### 1️⃣ Instalar Heroku CLI (si no lo tienes)
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

### 2️⃣ Probar localmente
```bash
./test-production.sh
```
Visita http://localhost:3000 para verificar que funciona.

### 3️⃣ Desplegar a Heroku
```bash
./deploy.sh
```
El script te guiará por todo el proceso.

## 📁 Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| `server.js` | Servidor Express para producción |
| `Procfile` | Configuración de Heroku |
| `deploy.sh` | Script automatizado de deploy |
| `test-production.sh` | Prueba local antes de deploy |
| `HEROKU-DEPLOYMENT-GUIDE.md` | Guía completa y detallada |

## 🔧 Comandos Útiles

### Ver logs en tiempo real
```bash
heroku logs --tail
```

### Abrir la aplicación
```bash
heroku open
```

### Ver estado
```bash
heroku ps
```

### Reiniciar
```bash
heroku restart
```

## 🎯 Flujo de Trabajo

```
1. Hacer cambios en el código
   ↓
2. Probar localmente: ./test-production.sh
   ↓
3. Si todo funciona: ./deploy.sh
   ↓
4. ¡Aplicación actualizada en Heroku! ✨
```

## ⚠️ Importante

- El plan **gratuito** de Heroku duerme después de 30 min sin actividad
- Primera carga puede tomar 10-30 segundos (cold start)
- Puedes actualizar a plan "Hobby" ($7/mes) para evitar el sleep

## 🆘 Problemas Comunes

### "Application error" en Heroku
```bash
heroku logs --tail  # Ver qué está pasando
```

### Build falla
```bash
# Limpiar cache
heroku plugins:install heroku-repo
heroku repo:purge_cache -a tu-app
git commit --allow-empty -m "Purge cache"
git push heroku main
```

### Servidor no inicia localmente
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm start
```

## 📱 Alternativas a Heroku

Si prefieres otra plataforma:

### Vercel (Recomendado para SPAs)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Railway
- Conecta tu repo de GitHub
- Auto-deploy en cada push
- $5/mes crédito gratis

## 📖 Documentación Completa

Para más detalles, consulta: **HEROKU-DEPLOYMENT-GUIDE.md**

## ✅ Checklist Pre-Deploy

- [ ] `npm install` sin errores
- [ ] `./test-production.sh` funciona
- [ ] Git repo inicializado
- [ ] Heroku CLI instalado
- [ ] Cuenta de Heroku creada

## 🎉 ¡Ya Estás Listo!

Ejecuta `./deploy.sh` y en minutos tu app estará en producción.

---

**¿Necesitas ayuda?** Revisa `HEROKU-DEPLOYMENT-GUIDE.md` para guía completa.
