#!/bin/bash

# 🎯 Setup Completo - Local y Heroku Idénticos
# Este script automatiza TODO el proceso

set -e

echo "🎯 Setup Completo: Local ↔ Heroku"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Paso 1: Verificar .env
echo "📋 PASO 1/5: Verificar archivo .env"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f .env ]; then
    print_warning "Archivo .env no encontrado"
    
    if [ -f .env.example ]; then
        read -p "¿Copiar .env.example a .env? (y/n): " CREATE_ENV
        
        if [[ $CREATE_ENV =~ ^[Yy]$ ]]; then
            cp .env.example .env
            print_success ".env creado desde .env.example"
            print_warning "IMPORTANTE: Edita .env con tus credenciales reales"
            echo ""
            echo "Abre .env y configura:"
            echo "  - VITE_GOOGLE_API_KEY"
            echo "  - VITE_GOOGLE_CLIENT_ID"
            echo "  - VITE_GOOGLE_REDIRECT_URI (opcional)"
            echo ""
            read -p "Presiona Enter cuando hayas configurado .env..."
        else
            print_error "No se puede continuar sin .env"
            exit 1
        fi
    else
        print_error "No se encontró .env.example"
        exit 1
    fi
else
    print_success "Archivo .env encontrado"
fi

# Validar que .env tenga valores
LOCAL_API_KEY=$(grep VITE_GOOGLE_API_KEY .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
LOCAL_CLIENT_ID=$(grep VITE_GOOGLE_CLIENT_ID .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)

if [ -z "$LOCAL_API_KEY" ] || [[ "$LOCAL_API_KEY" == *"tu_google"* ]]; then
    print_error "VITE_GOOGLE_API_KEY no está configurado en .env"
    echo "Edita .env y agrega tu API Key real"
    exit 1
fi

if [ -z "$LOCAL_CLIENT_ID" ] || [[ "$LOCAL_CLIENT_ID" == *"tu_google"* ]]; then
    print_error "VITE_GOOGLE_CLIENT_ID no está configurado en .env"
    echo "Edita .env y agrega tu Client ID real"
    exit 1
fi

print_success "Variables de entorno configuradas"
echo ""

# Paso 2: Verificar Google Cloud Console
echo "📋 PASO 2/5: Verificar Google Cloud Console"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "IMPORTANTE: Verifica que tengas configurado en Google Cloud Console:"
echo ""
echo "1. Ve a: https://console.cloud.google.com/"
echo "2. APIs & Services > Credentials"
echo "3. OAuth 2.0 Client ID"
echo "4. Authorized JavaScript origins:"
echo "   ✓ http://localhost:5173"
echo "   ✓ https://tu-app.herokuapp.com (agrega después de crear la app)"
echo "5. Authorized redirect URIs:"
echo "   ✓ http://localhost:5173"
echo "   ✓ https://tu-app.herokuapp.com (agrega después de crear la app)"
echo ""
read -p "¿Has verificado la configuración de Google Cloud? (y/n): " VERIFIED_GOOGLE

if [[ ! $VERIFIED_GOOGLE =~ ^[Yy]$ ]]; then
    print_warning "Por favor, configura Google Cloud Console primero"
    exit 1
fi

print_success "Google Cloud Console verificado"
echo ""

# Paso 3: Probar localmente
echo "📋 PASO 3/5: Probar versión local"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "¿Quieres probar la versión local primero? (y/n): " TEST_LOCAL

if [[ $TEST_LOCAL =~ ^[Yy]$ ]]; then
    print_info "Iniciando servidor local de prueba..."
    echo ""
    echo "Se abrirá en http://localhost:5173"
    echo "Prueba la conexión con Google Drive"
    echo "Presiona Ctrl+C cuando hayas terminado"
    echo ""
    npm run dev
fi

echo ""

# Paso 4: Login en Heroku
echo "📋 PASO 4/5: Login en Heroku"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ! command -v heroku &> /dev/null; then
    print_error "Heroku CLI no está instalado"
    echo ""
    echo "Instalalo con:"
    echo "  curl https://cli-assets.heroku.com/install.sh | sh"
    exit 1
fi

if ! heroku auth:whoami &> /dev/null; then
    print_warning "No hay sesión activa en Heroku"
    heroku login
fi

print_success "Sesión activa en Heroku"
echo ""

# Paso 5: Deploy con sincronización
echo "📋 PASO 5/5: Deploy a Heroku"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "El script de deploy:"
echo "  ✓ Creará/verificará la app en Heroku"
echo "  ✓ Sincronizará variables de entorno automáticamente"
echo "  ✓ Compilará la aplicación"
echo "  ✓ Desplegará a Heroku"
echo ""
read -p "¿Continuar con el deploy? (y/n): " DO_DEPLOY

if [[ $DO_DEPLOY =~ ^[Yy]$ ]]; then
    ./deploy.sh
else
    print_warning "Deploy cancelado"
    echo ""
    print_info "Cuando estés listo, ejecuta:"
    echo "  ./deploy.sh"
fi

echo ""
print_success "═══════════════════════════════════"
print_success "  ¡SETUP COMPLETADO!"
print_success "═══════════════════════════════════"
echo ""
print_info "Próximos pasos:"
echo "  1. Verifica que la app funcione en Heroku"
echo "  2. Agrega la URL de Heroku a Google Cloud Console"
echo "  3. Ejecuta ./verify-config.sh para confirmar sincronización"
echo ""
