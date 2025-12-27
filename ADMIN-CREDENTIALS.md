# 👤 Credenciales de Administrador

## 🔐 Cuenta Principal

**Email:** `admin@masterplan.com`  
**Contraseña:** `Admin2025!`  
**Rol:** `admin`

---

## 📋 Información de la Base de Datos

**Tabla:** `users`  
**ID:** `admin_1735315200000`  
**Fecha de creación:** 27 de diciembre, 2025

---

## 🎯 Roles del Sistema

### Admin (Administrador)
- Email: `admin@masterplan.com`
- Acceso completo al sistema
- Puede gestionar todos los eventos del calendario
- Puede conectar Google Drive
- Puede exportar a Looker Studio

### User (Usuario Regular)
- Todos los usuarios registrados desde la app tienen este rol automáticamente
- Pueden ver y editar eventos del calendario (compartidos con todos)
- Pueden conectar su propio Google Drive
- Pueden exportar a Looker Studio

---

## ✅ Usuarios Actuales en la Base de Datos

```sql
SELECT id, email, name, role, created_at 
FROM users 
ORDER BY role DESC;
```

| Email | Nombre | Rol | Creado |
|-------|--------|-----|--------|
| admin@masterplan.com | Administrador | admin | 2025-12-27 |
| manupoetablack@gmail.com | Manuel | user | 2025-12-27 |

---

## 🔄 Comportamiento del Sistema

1. **Registro desde la app:**
   - Todos los usuarios nuevos automáticamente reciben rol `'user'`
   - No es posible crear admins desde la interfaz
   - Los admins solo se crean directamente en la base de datos

2. **Datos compartidos:**
   - Todos los usuarios (admin y user) ven los mismos eventos del calendario
   - Los cambios de cualquier usuario se reflejan para todos
   - No hay aislamiento por usuario en los eventos

3. **Google Drive:**
   - Cada usuario puede conectar su propio Google Drive
   - El OAuth es individual por usuario
   - Los archivos cargados se convierten en eventos compartidos

---

## 🛡️ Seguridad

- Contraseña hasheada con bcrypt (10 salt rounds)
- JWT con expiración de 7 días
- Todos los endpoints de API requieren autenticación
- No se pueden crear admins desde la interfaz web

---

## 📝 Notas

⚠️ **IMPORTANTE**: Guarda estas credenciales en un lugar seguro. Si pierdes la contraseña del administrador, necesitarás resetearla directamente en la base de datos.

Para cambiar la contraseña del admin, ejecuta:

```bash
# 1. Generar nuevo hash localmente
node -e "import('bcrypt').then(b => b.default.hash('NuevaContraseña', 10).then(console.log))"

# 2. Actualizar en Heroku
heroku pg:psql postgresql-rugged-00195 -a master-plan
UPDATE users SET password = 'NUEVO_HASH_AQUI' WHERE email = 'admin@masterplan.com';
```

---

**Creado:** 27 de diciembre, 2025  
**Sistema:** Master Plan - Gestión de Producción
