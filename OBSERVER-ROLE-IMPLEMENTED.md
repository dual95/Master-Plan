# Rol Observer Implementado ✅

## Resumen

Se ha implementado un nuevo rol "**observer**" con permisos de **solo lectura**. Este rol es más restrictivo que el rol "user".

## Comparación de Roles

| Permiso | Admin | User | Observer |
|---------|-------|------|----------|
| Ver calendario | ✅ | ✅ | ✅ |
| Crear/editar eventos | ✅ | ❌ | ❌ |
| Editar campo "Real" | ✅ | ✅ | ❌ |
| Editar campo "Status" | ✅ | ✅ | ❌ |
| Drag & Drop tasks | ✅ | ❌ | ❌ |
| QuickTaskPicker | ✅ | ❌ | ❌ |
| Pestaña "Conexión" | ✅ | ❌ | ❌ |
| Pestaña "Exportar" | ✅ | ❌ | ❌ |
| Eliminar eventos | ✅ | ❌ | ❌ |

## Archivos Modificados

### 1. `src/services/authService.ts`
```typescript
export type UserRole = 'admin' | 'user' | 'observer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole; // Antes era string
}
```

### 2. `src/components/EventModal.tsx`
- Agregado: `const isObserver = currentUser?.role === 'observer';`
- Campo **Status**: `disabled={isObserver}` con estilo gris
- Campo **Real**: `readOnly={isObserver}` con estilo gris
- Label "Real": Solo muestra "(Editable)" si NO es admin ni observer

### 3. Base de Datos (`server.js`)
La tabla `users` ya soporta el rol observer:
```sql
role VARCHAR(50) DEFAULT 'user'
```
No requiere cambios en el esquema.

### 4. Vistas P2 y P3
Ya funcionan correctamente:
- Solo `isAdmin` permite drag & drop
- Solo `isAdmin` muestra QuickTaskPicker
- Observer se comporta igual que user (solo lectura)

### 5. App.tsx
Las pestañas ya están correctamente ocultas:
- Solo `isAdmin` ve "Conexión" y "Exportar"
- Observer y user solo ven "Calendario"

## Cómo Crear un Usuario Observer

### Opción 1: Directamente en PostgreSQL (Heroku)
```bash
heroku pg:psql -a your-app-name

INSERT INTO users (id, email, password, name, role)
VALUES (
  'observer-test-001',
  'observer@example.com',
  '$2b$10$HASHED_PASSWORD_HERE',
  'Observer Test',
  'observer'
);
```

### Opción 2: Modificar un usuario existente
```sql
UPDATE users SET role = 'observer' WHERE email = 'usuario@example.com';
```

### Opción 3: Registro desde la app (requiere modificación)
Actualmente el endpoint de registro usa rol 'user' por defecto. Si quieres permitir auto-registro de observers, modifica:

**server.js** línea ~150:
```javascript
const role = req.body.role || 'user'; // Permite pasar role en registro
```

## Testing

Para probar el rol observer:

1. **Crear usuario observer** (ver opciones arriba)
2. **Login** con las credenciales del observer
3. **Verificar permisos**:
   - ✅ Puede ver el calendario
   - ✅ Puede hacer click en tasks para ver detalles
   - ❌ NO puede editar Status (dropdown gris)
   - ❌ NO puede editar Real (input gris)
   - ❌ NO puede editar otros campos (solo admin)
   - ❌ NO puede hacer drag & drop
   - ❌ NO ve QuickTaskPicker
   - ❌ NO ve pestañas "Conexión" ni "Exportar"

## Seguridad Backend

⚠️ **IMPORTANTE**: Los cambios actuales son solo en el frontend. Para seguridad completa, debes agregar validación en el backend:

```javascript
// server.js - En cada endpoint de modificación
app.put('/api/events/:id', authenticateToken, (req, res) => {
  if (req.user.role === 'observer') {
    return res.status(403).json({ error: 'Observers cannot modify events' });
  }
  // ... resto del código
});
```

Sin esta validación, un observer técnico podría modificar datos usando herramientas como Postman.

## Estado Final

✅ **Implementación Frontend Completa**
- Tipo UserRole con 'observer'
- EventModal con campos bloqueados
- Vistas P2/P3 sin drag&drop para observer
- App.tsx sin pestañas Conexión/Exportar para observer

⏳ **Pendiente (opcional)**
- Validación backend en endpoints de modificación
- Endpoint de registro que permita crear observers
- Tests automatizados para permisos de observer

---
**Fecha**: 2025
**Versión**: Master Plan v1.0
