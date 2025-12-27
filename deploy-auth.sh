#!/bin/bash

echo "🔐 Configurando autenticación en Heroku..."

# Generar JWT_SECRET aleatorio y configurarlo en Heroku
echo "📝 Generando JWT_SECRET..."
JWT_SECRET=$(openssl rand -base64 32)

echo "☁️ Configurando variable de entorno en Heroku..."
heroku config:set JWT_SECRET="$JWT_SECRET"

echo "✅ JWT_SECRET configurado exitosamente"

echo ""
echo "📦 Agregando cambios a Git..."
git add .

echo "💬 Creando commit..."
git commit -m "feat: Add complete authentication system with JWT and bcrypt"

echo "🚀 Desplegando a Heroku..."
git push heroku main

echo ""
echo "✅ Deploy completo!"
echo ""
echo "🔍 Verificando tabla de usuarios..."
heroku pg:psql -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

echo ""
echo "📊 Estado de la aplicación:"
heroku ps

echo ""
echo "🌐 Abriendo aplicación..."
heroku open

echo ""
echo "✅ Todo listo! El sistema de autenticación está activo."
