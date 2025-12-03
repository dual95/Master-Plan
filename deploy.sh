#!/bin/bash

# 🚀 Script de Despliegue Rápido para Heroku
# Autor: Master Plan Team
# Descripción: Automatiza el proceso de despliegue a Heroku

set -e  # Exit on error

echo "🚀 Iniciando proceso de despliegue a Heroku..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que Heroku CLI está instalado
if ! command -v heroku &> /dev/null; then
    print_error "Heroku CLI no está instalado"
    echo "Instalalo con: curl https://cli-assets.heroku.com/install.sh | sh"
    exit 1
fi

print_success "Heroku CLI encontrado"

# Verificar que estamos en un repo git
if [ ! -d .git ]; then
    print_warning "No se encontró repo git. Inicializando..."
    git init
    print_success "Git inicializado"
fi

# Verificar login en Heroku
echo ""
echo "🔐 Verificando sesión de Heroku..."
if heroku auth:whoami &> /dev/null; then
    print_success "Sesión activa en Heroku"
else
    print_warning "No hay sesión activa. Iniciando login..."
    heroku login
fi

# Preguntar nombre de la app
echo ""
read -p "📝 ¿Nombre de la app en Heroku? (deja vacío para auto-generar): " APP_NAME

# Verificar si la app ya existe
if [ -z "$APP_NAME" ]; then
    # Crear app con nombre auto-generado
    print_warning "Creando app con nombre automático..."
    heroku create
else
    # Verificar si la app existe
    if heroku apps:info "$APP_NAME" &> /dev/null; then
        print_success "App '$APP_NAME' ya existe"
    else
        print_warning "Creando app '$APP_NAME'..."
        heroku create "$APP_NAME"
    fi
fi

print_success "App configurada en Heroku"

# Sincronizar variables de entorno
echo ""
echo "🔧 Sincronizando variables de entorno..."

if [ -f .env ]; then
    print_success "Archivo .env encontrado"
    
    # Leer variables del .env y configurarlas en Heroku
    echo ""
    echo "📋 Variables de entorno a configurar en Heroku:"
    
    # Extraer variables VITE_GOOGLE_*
    GOOGLE_API_KEY=$(grep VITE_GOOGLE_API_KEY .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
    GOOGLE_CLIENT_ID=$(grep VITE_GOOGLE_CLIENT_ID .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
    GOOGLE_REDIRECT_URI=$(grep VITE_GOOGLE_REDIRECT_URI .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
    
    # Mostrar valores (parcialmente ocultos por seguridad)
    if [ ! -z "$GOOGLE_API_KEY" ]; then
        MASKED_KEY="${GOOGLE_API_KEY:0:10}...${GOOGLE_API_KEY: -4}"
        echo "   VITE_GOOGLE_API_KEY: $MASKED_KEY"
    fi
    
    if [ ! -z "$GOOGLE_CLIENT_ID" ]; then
        MASKED_ID="${GOOGLE_CLIENT_ID:0:20}..."
        echo "   VITE_GOOGLE_CLIENT_ID: $MASKED_ID"
    fi
    
    if [ ! -z "$GOOGLE_REDIRECT_URI" ]; then
        echo "   VITE_GOOGLE_REDIRECT_URI: $GOOGLE_REDIRECT_URI"
    fi
    
    echo ""
    read -p "¿Configurar estas variables en Heroku? (y/n): " SYNC_VARS
    
    if [[ $SYNC_VARS =~ ^[Yy]$ ]]; then
        if [ ! -z "$GOOGLE_API_KEY" ]; then
            heroku config:set VITE_GOOGLE_API_KEY="$GOOGLE_API_KEY"
        fi
        
        if [ ! -z "$GOOGLE_CLIENT_ID" ]; then
            heroku config:set VITE_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
        fi
        
        if [ ! -z "$GOOGLE_REDIRECT_URI" ]; then
            heroku config:set VITE_GOOGLE_REDIRECT_URI="$GOOGLE_REDIRECT_URI"
        else
            # Auto-generar REDIRECT_URI para Heroku
            APP_URL=$(heroku info -s | grep web_url | cut -d= -f2 | tr -d '\n')
            if [ ! -z "$APP_URL" ]; then
                heroku config:set VITE_GOOGLE_REDIRECT_URI="${APP_URL}"
                print_success "REDIRECT_URI configurado automáticamente: ${APP_URL}"
            fi
        fi
        
        print_success "Variables sincronizadas con Heroku"
    else
        print_warning "Variables NO sincronizadas. Recuerda configurarlas manualmente:"
        echo "   heroku config:set VITE_GOOGLE_API_KEY=tu_key"
        echo "   heroku config:set VITE_GOOGLE_CLIENT_ID=tu_client_id"
    fi
else
    print_warning "Archivo .env no encontrado"
    print_warning "⚠️  IMPORTANTE: Configura manualmente las variables en Heroku:"
    echo ""
    echo "   heroku config:set VITE_GOOGLE_API_KEY=tu_key"
    echo "   heroku config:set VITE_GOOGLE_CLIENT_ID=tu_client_id"
    echo ""
    read -p "Presiona Enter para continuar..."
fi

# Verificar configuración de Google OAuth
echo ""
echo "🔍 Verificación de Google OAuth..."
echo ""
print_warning "RECORDATORIO: Verifica en Google Cloud Console:"
echo "   1. OAuth 2.0 Client ID configurado"
echo "   2. JavaScript origins autorizados:"
echo "      - http://localhost:5173"
echo "      - https://tu-app.herokuapp.com"
echo "   3. Redirect URIs autorizados:"
echo "      - http://localhost:5173"
echo "      - https://tu-app.herokuapp.com"
echo ""
read -p "¿Has verificado la configuración de Google Cloud Console? (y/n): " VERIFIED_OAUTH

if [[ ! $VERIFIED_OAUTH =~ ^[Yy]$ ]]; then
    print_error "DETÉN EL DEPLOY"
    echo ""
    echo "📘 Sigue estos pasos:"
    echo "   1. Ve a https://console.cloud.google.com/"
    echo "   2. Selecciona tu proyecto"
    echo "   3. Ve a 'APIs & Services' > 'Credentials'"
    echo "   4. Edita tu OAuth 2.0 Client ID"
    echo "   5. Agrega las URLs de localhost y Heroku"
    echo ""
    read -p "Presiona Enter cuando hayas terminado..."
fi

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install

# Build local para verificar
echo ""
echo "🔨 Compilando aplicación (verificación)..."
npm run build

if [ ! -d "dist" ]; then
    print_error "La carpeta 'dist' no fue creada. Build falló."
    exit 1
fi

print_success "Build exitoso"

# Agregar archivos a git
echo ""
echo "📝 Preparando commit..."
git add .

# Commit
if git diff --staged --quiet; then
    print_warning "No hay cambios para commitear"
else
    git commit -m "Deploy to Heroku - $(date +%Y-%m-%d_%H:%M:%S)"
    print_success "Commit creado"
fi

# Obtener el nombre de la rama actual
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Deploy a Heroku
echo ""
echo "🚀 Desplegando a Heroku..."
echo "   Rama: $CURRENT_BRANCH"
echo ""

if git push heroku $CURRENT_BRANCH:main; then
    print_success "¡Deploy exitoso!"
    
    # Abrir la app
    echo ""
    read -p "¿Abrir la aplicación en el navegador? (y/n): " OPEN_APP
    
    if [[ $OPEN_APP =~ ^[Yy]$ ]]; then
        heroku open
    fi
    
    echo ""
    print_success "==================================="
    print_success "  ¡DEPLOY COMPLETADO! 🎉"
    print_success "==================================="
    echo ""
    echo "📱 URL de tu app:"
    heroku info -s | grep web_url | cut -d= -f2
    echo ""
    echo "📊 Ver logs en tiempo real:"
    echo "   heroku logs --tail"
    echo ""
    echo "🔄 Para actualizar en el futuro:"
    echo "   ./deploy.sh"
    echo ""
    
else
    print_error "Deploy falló. Revisa los logs:"
    echo "   heroku logs --tail"
    exit 1
fi
