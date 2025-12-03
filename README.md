# 🎯 Master Plan - Calendario de Producción

Aplicación web para gestionar y visualizar el calendario de producción de múltiples plantas, con integración a Google Drive y exportación a Looker Studio.

## ✨ Características Principales

- 📊 **Carga de Excel desde Google Drive** - Conecta con tu cuenta y carga archivos de producción
- 🗓️ **Calendario Interactivo** - Visualiza tareas de múltiples plantas en un calendario drag & drop
- 🎨 **Sistema de Colores por Estado** - Verde (Completado), Naranja (En Proceso), Gris (Pendiente)
- 💾 **Persistencia Automática** - Guarda automáticamente el estado en localStorage
- 🔄 **Sincronización Local ↔ Heroku** - Sistema automatizado para despliegues idénticos

## 🚀 Inicio Rápido

### Primera Vez

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Google

# 2. Setup completo (guiado)
./setup-complete.sh

# 3. Desarrollo local
npm run dev
```

### Deploys Subsecuentes

```bash
# Verificar sincronización
./verify-config.sh

# Deploy a Heroku (sincroniza automáticamente)
./deploy.sh
```

## 📚 Documentación

- **[START-HERE.txt](START-HERE.txt)** - 👈 Comienza aquí
- **[SYNC-RESUMEN.txt](SYNC-RESUMEN.txt)** - Resumen de sincronización Local ↔ Heroku
- **[SYNC-GUIDE.md](SYNC-GUIDE.md)** - Guía completa de sincronización
- **[RESUMEN-COMPLETO.md](RESUMEN-COMPLETO.md)** - Resumen del proyecto
- **[HEROKU-DEPLOYMENT-GUIDE.md](HEROKU-DEPLOYMENT-GUIDE.md)** - Guía de Heroku

## 🛠️ Scripts Disponibles

```bash
./help.sh              # Menú de ayuda completo
./setup-complete.sh    # Setup inicial guiado
./verify-config.sh     # Verificar sincronización Local vs Heroku
./deploy.sh            # Deploy a Heroku con sync automático
./test-production.sh   # Probar build de producción localmente
npm run dev            # Servidor de desarrollo
npm run build          # Compilar para producción
npm start              # Servidor de producción
```

## 🔧 Configuración Requerida

### Google Cloud Console

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilita las APIs:
   - Google Drive API
   - Google Sheets API
3. Crea credenciales:
   - API Key
   - OAuth 2.0 Client ID
4. Configura Authorized JavaScript origins:
   - `http://localhost:5173`
   - `https://tu-app.herokuapp.com`
5. Configura Authorized redirect URIs:
   - `http://localhost:5173`
   - `https://tu-app.herokuapp.com`

### Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
VITE_GOOGLE_API_KEY=tu_google_api_key
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173
```

## 🎯 Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Vite
- **Calendario**: React Big Calendar
- **Estado**: Context API + useReducer
- **Persistencia**: localStorage
- **Backend**: Node.js + Express
- **Deploy**: Heroku
- **APIs**: Google Drive API, Google Sheets API

## 📊 Flujo de Datos

```
Excel (Google Drive) → Parser → Estado Global → Calendario → localStorage
                                     ↓
                              Drag & Drop + Colores
```

## 🔄 Sincronización Local ↔ Heroku

El sistema incluye sincronización automática de variables de entorno:

1. Configuras `.env` localmente
2. Ejecutas `./deploy.sh`
3. El script sincroniza automáticamente las variables a Heroku
4. Resultado: **Versiones 100% idénticas**

## 🆘 Ayuda

```bash
# Ver menú de ayuda completo
./help.sh

# Verificar configuración
./verify-config.sh

# Ver logs de Heroku
heroku logs --tail

# Abrir app en navegador
heroku open
```

---

## 📝 React + TypeScript + Vite (Template Original)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
