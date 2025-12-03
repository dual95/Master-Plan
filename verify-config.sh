#!/bin/bash

# 🔍 Script de Verificación de Configuración
# Compara la configuración local con Heroku

set -e

echo "🔍 Verificando configuración local vs Heroku..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar login en Heroku
if ! heroku auth:whoami &> /dev/null; then
    print_error "No estás logueado en Heroku"
    echo "Ejecuta: heroku login"
    exit 1
fi

# Verificar archivo .env
if [ ! -f .env ]; then
    print_error "Archivo .env no encontrado"
    echo "Copia .env.example y configúralo:"
    echo "   cp .env.example .env"
    exit 1
fi

echo "📋 CONFIGURACIÓN LOCAL (.env):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOCAL_API_KEY=$(grep VITE_GOOGLE_API_KEY .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
LOCAL_CLIENT_ID=$(grep VITE_GOOGLE_CLIENT_ID .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
LOCAL_REDIRECT_URI=$(grep VITE_GOOGLE_REDIRECT_URI .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)

if [ ! -z "$LOCAL_API_KEY" ]; then
    MASKED_KEY="${LOCAL_API_KEY:0:10}...${LOCAL_API_KEY: -4}"
    echo "VITE_GOOGLE_API_KEY: $MASKED_KEY"
else
    print_error "VITE_GOOGLE_API_KEY no configurado"
fi

if [ ! -z "$LOCAL_CLIENT_ID" ]; then
    MASKED_ID="${LOCAL_CLIENT_ID:0:20}..."
    echo "VITE_GOOGLE_CLIENT_ID: $MASKED_ID"
else
    print_error "VITE_GOOGLE_CLIENT_ID no configurado"
fi

if [ ! -z "$LOCAL_REDIRECT_URI" ]; then
    echo "VITE_GOOGLE_REDIRECT_URI: $LOCAL_REDIRECT_URI"
else
    print_warning "VITE_GOOGLE_REDIRECT_URI no configurado (usando default)"
fi

echo ""
echo "📋 CONFIGURACIÓN HEROKU:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HEROKU_API_KEY=$(heroku config:get VITE_GOOGLE_API_KEY 2>/dev/null || echo "")
HEROKU_CLIENT_ID=$(heroku config:get VITE_GOOGLE_CLIENT_ID 2>/dev/null || echo "")
HEROKU_REDIRECT_URI=$(heroku config:get VITE_GOOGLE_REDIRECT_URI 2>/dev/null || echo "")

if [ ! -z "$HEROKU_API_KEY" ]; then
    MASKED_KEY="${HEROKU_API_KEY:0:10}...${HEROKU_API_KEY: -4}"
    echo "VITE_GOOGLE_API_KEY: $MASKED_KEY"
else
    print_error "VITE_GOOGLE_API_KEY no configurado en Heroku"
fi

if [ ! -z "$HEROKU_CLIENT_ID" ]; then
    MASKED_ID="${HEROKU_CLIENT_ID:0:20}..."
    echo "VITE_GOOGLE_CLIENT_ID: $MASKED_ID"
else
    print_error "VITE_GOOGLE_CLIENT_ID no configurado en Heroku"
fi

if [ ! -z "$HEROKU_REDIRECT_URI" ]; then
    echo "VITE_GOOGLE_REDIRECT_URI: $HEROKU_REDIRECT_URI"
else
    print_error "VITE_GOOGLE_REDIRECT_URI no configurado en Heroku"
fi

echo ""
echo "🔍 ANÁLISIS DE DIFERENCIAS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ISSUES=0

# Comparar API KEY
if [ "$LOCAL_API_KEY" != "$HEROKU_API_KEY" ]; then
    if [ -z "$HEROKU_API_KEY" ]; then
        print_error "API Key falta en Heroku"
    else
        print_error "API Key diferente entre local y Heroku"
    fi
    ISSUES=$((ISSUES + 1))
else
    print_success "API Key coincide"
fi

# Comparar CLIENT ID
if [ "$LOCAL_CLIENT_ID" != "$HEROKU_CLIENT_ID" ]; then
    if [ -z "$HEROKU_CLIENT_ID" ]; then
        print_error "Client ID falta en Heroku"
    else
        print_error "Client ID diferente entre local y Heroku"
    fi
    ISSUES=$((ISSUES + 1))
else
    print_success "Client ID coincide"
fi

# Verificar REDIRECT URI
if [ -z "$LOCAL_REDIRECT_URI" ]; then
    print_warning "Redirect URI no configurado localmente (usando default)"
fi

if [ -z "$HEROKU_REDIRECT_URI" ]; then
    print_warning "Redirect URI no configurado en Heroku"
fi

echo ""
if [ $ISSUES -eq 0 ]; then
    print_success "═══════════════════════════════════"
    print_success "  ¡CONFIGURACIONES SINCRONIZADAS!"
    print_success "═══════════════════════════════════"
    echo ""
    print_info "Ambas versiones (local y Heroku) usarán la misma configuración"
else
    print_error "═══════════════════════════════════"
    print_error "  SE ENCONTRARON $ISSUES DIFERENCIAS"
    print_error "═══════════════════════════════════"
    echo ""
    print_warning "Para sincronizar automáticamente, ejecuta:"
    echo "   ./deploy.sh"
    echo ""
    print_warning "O manualmente:"
    echo "   heroku config:set VITE_GOOGLE_API_KEY=\"tu_key\""
    echo "   heroku config:set VITE_GOOGLE_CLIENT_ID=\"tu_client_id\""
fi

echo ""
print_info "RECORDATORIO: Verifica Google Cloud Console"
echo "   1. Ve a https://console.cloud.google.com/"
echo "   2. APIs & Services > Credentials"
echo "   3. Authorized JavaScript origins:"
echo "      - http://localhost:5173"
echo "      - https://$(heroku info -s | grep web_url | cut -d= -f2 | sed 's|https://||' | sed 's|/||')"
echo "   4. Authorized redirect URIs:"
echo "      - http://localhost:5173"
echo "      - https://$(heroku info -s | grep web_url | cut -d= -f2 | sed 's|https://||' | sed 's|/||')"
echo ""
