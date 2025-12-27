# 🔐 Sistema de Autenticación - Implementación Completa

## ✅ Implementado

### Backend (server.js)

1. **Dependencias agregadas**:
   - `bcrypt ^5.1.1` - Hash de contraseñas con salt rounds: 10
   - `jsonwebtoken ^9.0.2` - Generación y validación de tokens JWT

2. **Tabla de usuarios en PostgreSQL**:
   ```sql
   CREATE TABLE users (
     id VARCHAR(255) PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     name VARCHAR(255),
     role VARCHAR(50) DEFAULT 'user',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   CREATE INDEX idx_users_email ON users(email);
   ```

3. **Endpoints de autenticación**:
   - `POST /api/auth/register` - Registro de nuevos usuarios
   - `POST /api/auth/login` - Inicio de sesión (devuelve JWT)
   - `GET /api/auth/me` - Obtener usuario actual (requiere JWT)

4. **Middleware de autenticación**:
   - `authenticateToken()` - Valida JWT en header Authorization
   - Todos los endpoints `/api/events/*` ahora están protegidos

5. **Seguridad**:
   - Contraseñas hasheadas con bcrypt (10 salt rounds)
   - JWT con expiración de 7 días
   - Variable de entorno `JWT_SECRET` para producción

### Frontend

1. **authService.ts** (nuevo):
   - Clase `AuthService` para manejo de autenticación
   - Métodos: `register()`, `login()`, `getCurrentUser()`, `logout()`
   - Persistencia en localStorage: token y datos de usuario
   - Interfaces TypeScript: `User`, `AuthResponse`

2. **apiService.ts** (actualizado):
   - Nueva función `fetchWithAuth()` agrega header `Authorization: Bearer ${token}`
   - Todos los métodos API ahora usan autenticación automática

3. **Login.tsx** (nuevo componente):
   - Tabs para registro e inicio de sesión
   - Validación de formularios (email, contraseña mínimo 6 caracteres)
   - Manejo de errores con mensajes user-friendly
   - Auto-login después de registro exitoso
   - Estados de carga (loading states)

4. **Login.css** (nuevo):
   - Diseño moderno con gradiente purple (667eea → 764ba2)
   - Animaciones: slideUp, shake (errores)
   - Tarjeta blanca centrada con sombras
   - Responsive design (mobile-first)

5. **App.tsx** (actualizado):
   - Estado de autenticación: `isAuthenticated`, `currentUser`, `authLoading`
   - Verificación de auth al cargar: `checkAuth()`
   - Renderizado condicional: Login o MasterCalendar
   - Header con info de usuario y botón de logout
   - Pantalla de carga durante verificación inicial

6. **App.css** (actualizado):
   - Estilos para `.auth-loading` (spinner animado)
   - Header reorganizado con `.app-header-content`
   - `.user-info` y `.logout-button` con gradiente purple
   - Animación de rotación para loading spinner

## 🔄 Flujo de Autenticación

1. **Usuario nuevo visita la app**:
   ```
   → App.tsx verifica auth (loading)
   → No hay token → Muestra Login.tsx
   → Usuario se registra (email, password, nombre)
   → POST /api/auth/register → bcrypt.hash()
   → Auto-login → POST /api/auth/login
   → Recibe JWT (expira en 7 días)
   → Token guardado en localStorage
   → Redirect a MasterCalendar (P3 swimlanes)
   ```

2. **Usuario existente inicia sesión**:
   ```
   → Login.tsx → tab "Iniciar Sesión"
   → Ingresa email y password
   → POST /api/auth/login
   → bcrypt.compare() valida password
   → jwt.sign() genera token
   → Token guardado en localStorage
   → GET /api/auth/me obtiene datos completos
   → Redirect a MasterCalendar
   ```

3. **Acceso a API protegida**:
   ```
   → apiService.getEvents()
   → fetchWithAuth() agrega header:
     Authorization: Bearer <token>
   → GET /api/events
   → authenticateToken() middleware valida JWT
   → Si válido: req.user = decoded
   → Si inválido: 401 Unauthorized
   ```

4. **Cierre de sesión**:
   ```
   → Click en "🚪 Salir"
   → authService.logout()
   → localStorage.removeItem('token')
   → localStorage.removeItem('user')
   → setIsAuthenticated(false)
   → Redirect a Login
   ```

## 📦 Estructura de Datos

### User (TypeScript)
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
```

### JWT Payload
```javascript
{
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  iat: timestamp,
  exp: timestamp + 7 days
}
```

### AuthResponse
```typescript
interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}
```

## 🚀 Deploy a Heroku

### Comando rápido:
```bash
./deploy-auth.sh
```

### Pasos manuales:

1. **Configurar JWT_SECRET**:
   ```bash
   heroku config:set JWT_SECRET=$(openssl rand -base64 32)
   ```

2. **Commit y push**:
   ```bash
   git add .
   git commit -m "feat: Add complete authentication system"
   git push heroku main
   ```

3. **Verificar tablas creadas**:
   ```bash
   heroku pg:psql
   \dt
   SELECT * FROM users;
   ```

4. **Ver logs**:
   ```bash
   heroku logs --tail
   ```

## ✅ Checklist de Deploy

- [x] Dependencias instaladas (bcrypt, jsonwebtoken)
- [x] package-lock.json actualizado
- [x] server.js con endpoints de auth
- [x] Middleware authenticateToken implementado
- [x] Tabla users con índice en email
- [x] authService.ts creado
- [x] apiService.ts actualizado con JWT
- [x] Login.tsx componente completo
- [x] Login.css con diseño moderno
- [x] App.tsx con wrapper de autenticación
- [x] App.css con estilos de auth
- [ ] JWT_SECRET configurado en Heroku
- [ ] Deploy a producción
- [ ] Tabla users verificada en PostgreSQL
- [ ] Prueba de registro de usuario
- [ ] Prueba de login
- [ ] Prueba de acceso a calendario
- [ ] Prueba de logout

## 🔍 Testing Local

1. **Iniciar servidor**:
   ```bash
   npm start
   ```

2. **Abrir http://localhost:3000**:
   - Debe mostrar pantalla de Login

3. **Registrar usuario**:
   - Tab "Registrarse"
   - Email: test@example.com
   - Password: test123
   - Nombre: Usuario Prueba

4. **Verificar redirect a calendario**:
   - Debe mostrar P3 swimlanes
   - Header debe mostrar "👤 Usuario Prueba"
   - Botón "🚪 Salir" debe estar visible

5. **Cerrar sesión y volver a entrar**:
   - Click en "🚪 Salir"
   - Tab "Iniciar Sesión"
   - Usar mismas credenciales

## 📊 Datos Compartidos

- **Todos los usuarios autenticados ven los mismos eventos** (PostgreSQL centralizado)
- **Cada usuario puede conectar su propio Google Drive** (OAuth individual)
- **Eventos creados/editados por cualquier usuario se replican a todos**
- **No hay aislamiento por usuario en los eventos** (diseño intencional)

## 🛡️ Seguridad Implementada

1. **Contraseñas**: NUNCA se almacenan en texto plano (bcrypt hash)
2. **JWT**: Token firmado con secret, no se puede falsificar
3. **Expiración**: Tokens expiran en 7 días (balance seguridad/UX)
4. **HTTPS**: Heroku provee SSL automático
5. **CORS**: Configurado para permitir solo orígenes autorizados
6. **SQL Injection**: Prevención con queries parametrizadas (pg)
7. **XSS**: React escapa strings automáticamente

## 🎨 Diseño UI/UX

- **Gradiente purple corporativo**: 667eea → 764ba2
- **Animaciones suaves**: slideUp (0.4s), shake (errores)
- **Loading states**: Spinner animado, botones deshabilitados
- **Error handling**: Mensajes claros en español
- **Responsive**: Mobile-first, funciona en todos los tamaños
- **Accesibilidad**: Labels en inputs, contraste adecuado

## 🔄 Próximos Pasos

1. ✅ Deploy a producción
2. ⏳ Pruebas con usuarios reales
3. ⏳ Agregar "Olvidé mi contraseña" (opcional)
4. ⏳ Agregar roles de permisos (admin vs user) (opcional)
5. ⏳ Implementar refresh tokens (para mayor seguridad) (opcional)

---

**Estado**: ✅ **IMPLEMENTACIÓN COMPLETA - LISTA PARA DEPLOY**

**Creado**: $(date)
**Tecnologías**: React 19 + TypeScript + Node.js + Express + PostgreSQL + JWT + bcrypt
