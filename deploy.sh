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
