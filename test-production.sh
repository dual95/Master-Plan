#!/bin/bash

# 🧪 Script de Prueba Local antes de Deploy
# Simula el entorno de Heroku localmente

set -e

echo "🧪 Probando aplicación localmente (modo producción)..."
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Limpiar dist anterior
if [ -d "dist" ]; then
    echo "🧹 Limpiando build anterior..."
    rm -rf dist
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Build
echo ""
echo "🔨 Compilando aplicación..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build falló - carpeta dist no creada${NC}"
    exit 1
fi

print_success "Build exitoso"
echo ""

# Verificar que server.js existe
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ server.js no encontrado${NC}"
    exit 1
fi

# Mostrar tamaño del build
DIST_SIZE=$(du -sh dist | cut -f1)
print_info "Tamaño del build: $DIST_SIZE"

# Contar archivos en dist
FILE_COUNT=$(find dist -type f | wc -l)
print_info "Archivos generados: $FILE_COUNT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "Todo listo para iniciar servidor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Servidor iniciando en http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener"
echo ""

# Iniciar servidor
npm start
