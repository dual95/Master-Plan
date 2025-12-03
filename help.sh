#!/bin/bash

# 🎯 Menú de Ayuda - Master Plan
# Muestra todos los comandos disponibles

cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║                    🎯 MASTER PLAN - MENÚ DE AYUDA                       ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝


┌─────────────────────────────────────────────────────────────────────────┐
│  📚 DOCUMENTACIÓN PRINCIPAL                                             │
└─────────────────────────────────────────────────────────────────────────┘

  START-HERE.txt ................. 👈 EMPIEZA AQUÍ
  SYNC-RESUMEN.txt ............... Resumen de sincronización
  SYNC-GUIDE.md .................. Guía completa de sincronización
  SINCRONIZACION-COMPLETA.md ..... Documentación técnica sync
  RESUMEN-COMPLETO.md ............ Resumen del proyecto completo
  HEROKU-DEPLOYMENT-GUIDE.md ..... Guía completa de Heroku


┌─────────────────────────────────────────────────────────────────────────┐
│  🚀 SCRIPTS DISPONIBLES                                                 │
└─────────────────────────────────────────────────────────────────────────┘

  Setup Inicial:
  └─ ./setup-complete.sh ......... 🌟 Setup completo guiado

  Sincronización:
  └─ ./verify-config.sh .......... 🔍 Verificar Local vs Heroku

  Deployment:
  ├─ ./deploy.sh ................. 🚀 Deploy + Sync automático
  └─ ./quick-fix-deploy.sh ....... ⚡ Deploy rápido sin preguntas

  Testing:
  ├─ ./test-production.sh ........ 🧪 Probar build producción local
  └─ ./demo.sh ................... 📊 Demo de la aplicación

  Heroku:
  └─ ./heroku-commands.sh ........ 📖 Comandos útiles de Heroku


┌─────────────────────────────────────────────────────────────────────────┐
│  ⚡ COMANDOS NPM                                                        │
└─────────────────────────────────────────────────────────────────────────┘

  Desarrollo:
  ├─ npm run dev ................. Servidor desarrollo (Vite)
  ├─ npm run build ............... Compilar para producción
  ├─ npm start ................... Servidor producción (Express)
  └─ npm run preview ............. Preview del build

  Heroku:
  ├─ npm run heroku-postbuild .... Build automático en Heroku
  └─ npm run start ............... Inicia servidor en Heroku


┌─────────────────────────────────────────────────────────────────────────┐
│  🎯 FLUJO DE TRABAJO RECOMENDADO                                        │
└─────────────────────────────────────────────────────────────────────────┘

  PRIMERA VEZ (Setup Inicial):

    1. Configurar entorno local
       $ cp .env.example .env
       $ nano .env  # Editar con credenciales

    2. Ejecutar setup completo
       $ ./setup-complete.sh

    3. Verificar funcionamiento
       $ npm run dev
       $ # Probar en http://localhost:5173


  DESARROLLO DIARIO:

    1. Desarrollar localmente
       $ npm run dev

    2. Probar cambios
       $ # Navegar a http://localhost:5173

    3. Cuando esté listo, deployar
       $ git add .
       $ git commit -m "Descripción"
       $ ./deploy.sh


  ANTES DE DEPLOYAR:

    1. Verificar sincronización
       $ ./verify-config.sh

    2. Si hay diferencias, el deploy las resolverá
       $ ./deploy.sh


  DESPUÉS DE DEPLOYAR:

    1. Verificar que funcione
       $ heroku open

    2. Ver logs si hay problemas
       $ heroku logs --tail


┌─────────────────────────────────────────────────────────────────────────┐
│  🔧 COMANDOS HEROKU ÚTILES                                              │
└─────────────────────────────────────────────────────────────────────────┘

  Información:
  ├─ heroku info ................. Info de la app
  ├─ heroku config ............... Ver variables de entorno
  └─ heroku apps:info ............ Info detallada

  Logs:
  ├─ heroku logs --tail .......... Logs en tiempo real
  ├─ heroku logs -n 200 .......... Últimos 200 logs
  └─ heroku logs --source app .... Solo logs de la app

  Control:
  ├─ heroku open ................. Abrir app en navegador
  ├─ heroku restart .............. Reiniciar app
  └─ heroku ps ................... Ver procesos

  Variables:
  ├─ heroku config:set VAR=valor . Configurar variable
  ├─ heroku config:get VAR ....... Ver variable específica
  └─ heroku config:unset VAR ..... Eliminar variable


┌─────────────────────────────────────────────────────────────────────────┐
│  📋 CHECKLIST RÁPIDO                                                    │
└─────────────────────────────────────────────────────────────────────────┘

  Antes de tu primer deploy:
  ☐ Archivo .env creado y configurado
  ☐ Google Cloud Console configurado
  ☐ Heroku CLI instalado
  ☐ Login en Heroku (heroku login)
  ☐ Probado localmente (npm run dev)
  ☐ Verificado sincronización (./verify-config.sh)

  Antes de cada deploy subsecuente:
  ☐ Cambios commiteados en git
  ☐ Verificado localmente
  ☐ Sin errores en build local
  ☐ Opcional: ./verify-config.sh


┌─────────────────────────────────────────────────────────────────────────┐
│  🆘 AYUDA RÁPIDA                                                        │
└─────────────────────────────────────────────────────────────────────────┘

  ¿Primera vez?
  → Lee START-HERE.txt
  → Ejecuta ./setup-complete.sh

  ¿No sabes si local y Heroku están sincronizados?
  → ./verify-config.sh

  ¿Listo para deployar?
  → ./deploy.sh

  ¿Quieres probar el build localmente?
  → ./test-production.sh

  ¿Problemas con Google OAuth?
  → Lee SYNC-GUIDE.md
  → Verifica Google Cloud Console

  ¿La app no funciona en Heroku?
  → heroku logs --tail
  → Verifica variables: heroku config

  ¿Quieres empezar de cero?
  → heroku repo:purge_cache
  → git push heroku main --force


┌─────────────────────────────────────────────────────────────────────────┐
│  📞 RECURSOS                                                            │
└─────────────────────────────────────────────────────────────────────────┘

  Documentación Local:
  ├─ START-HERE.txt
  ├─ SYNC-GUIDE.md
  ├─ SYNC-RESUMEN.txt
  ├─ SINCRONIZACION-COMPLETA.md
  ├─ RESUMEN-COMPLETO.md
  ├─ HEROKU-DEPLOYMENT-GUIDE.md
  └─ DEPLOYMENT-CHECKLIST.md

  Documentación Externa:
  ├─ Heroku: https://devcenter.heroku.com/
  ├─ Google Cloud: https://console.cloud.google.com/
  └─ Vite: https://vitejs.dev/


┌─────────────────────────────────────────────────────────────────────────┐
│  🎯 SIGUIENTE PASO                                                      │
└─────────────────────────────────────────────────────────────────────────┘

  Si es tu primera vez:
    → ./setup-complete.sh

  Si ya configuraste todo:
    → ./verify-config.sh
    → ./deploy.sh

  Si solo quieres desarrollar:
    → npm run dev


╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║                    Para más ayuda, ejecuta:                             ║
║                    $ cat START-HERE.txt                                 ║
║                    $ cat SYNC-RESUMEN.txt                               ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
EOF
