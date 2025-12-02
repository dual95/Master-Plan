#!/bin/bash

# Script rápido para re-deploy después del fix

echo "🔧 Corrigiendo error de TypeScript y re-desplegando..."
echo ""

# Agregar cambios
git add src/services/googleDrive.ts

# Commit
git commit -m "Fix: TypeScript error in googleDrive.ts - ArrayBuffer type casting"

# Push a Heroku
echo "🚀 Desplegando a Heroku..."
git push heroku main

echo ""
echo "✅ Deploy completado!"
echo ""
echo "Para ver logs:"
echo "  heroku logs --tail"
echo ""
echo "Para abrir la app:"
echo "  heroku open"
