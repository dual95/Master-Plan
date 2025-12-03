#!/bin/bash

# 🔄 Forzar Rebuild en Heroku (después de configurar variables en web)

echo "🔄 Forzando rebuild en Heroku..."
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de haber configurado las variables en:"
echo "   https://dashboard.heroku.com/apps/TU-APP/settings"
echo ""
echo "Variables necesarias:"
echo "   - VITE_GOOGLE_API_KEY"
echo "   - VITE_GOOGLE_CLIENT_ID"
echo ""
read -p "¿Ya configuraste las variables en Heroku web? (y/n): " CONFIGURED

if [[ ! $CONFIGURED =~ ^[Yy]$ ]]; then
    echo ""
    echo "Por favor, configura primero las variables:"
    echo "1. Ve a https://dashboard.heroku.com/apps"
    echo "2. Selecciona tu app"
    echo "3. Settings > Config Vars > Reveal Config Vars"
    echo "4. Agrega VITE_GOOGLE_API_KEY y VITE_GOOGLE_CLIENT_ID"
    exit 1
fi

echo ""
echo "🚀 Forzando rebuild con commit vacío..."

# Commit vacío para forzar rebuild
git commit --allow-empty -m "Force rebuild to load env vars"
git push heroku main

echo ""
echo "✅ Rebuild iniciado en Heroku"
echo "📊 Ver progreso:"
echo "   heroku logs --tail"
echo ""
echo "📱 Cuando termine, abre tu app:"
echo "   heroku open"
