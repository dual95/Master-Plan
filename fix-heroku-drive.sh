#!/bin/bash

# 🔧 Fix rápido: Configura variables y fuerza rebuild en Heroku

set -e

echo "🔧 Fix para botón de Google Drive en Heroku"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Verificar .env
if [ ! -f .env ]; then
    print_error "Archivo .env no encontrado"
    exit 1
fi

# Leer variables
GOOGLE_API_KEY=$(grep VITE_GOOGLE_API_KEY .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
GOOGLE_CLIENT_ID=$(grep VITE_GOOGLE_CLIENT_ID .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)

if [ -z "$GOOGLE_API_KEY" ] || [ -z "$GOOGLE_CLIENT_ID" ]; then
    print_error "Variables no configuradas en .env"
    exit 1
fi

print_success ".env configurado correctamente"

# Configurar en Heroku
echo ""
echo "📝 Configurando variables en Heroku..."

heroku config:set \
  VITE_GOOGLE_API_KEY="$GOOGLE_API_KEY" \
  VITE_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"

print_success "Variables configuradas en Heroku"

# Verificar
echo ""
echo "🔍 Verificando..."
heroku config | grep VITE_GOOGLE

# Forzar rebuild
echo ""
print_warning "Forzando rebuild en Heroku..."
print_warning "Esto puede tardar 2-3 minutos"
echo ""

# Hacer un commit vacío para forzar rebuild
git commit --allow-empty -m "Force rebuild with env vars"
git push heroku main

echo ""
print_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "  ¡FIX COMPLETADO!"
print_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Abre tu app y verifica:"
heroku open
echo ""
echo "📊 Si hay problemas, ver logs:"
echo "   heroku logs --tail"
