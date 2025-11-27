# 🔧 Orígenes Recomendados para Google OAuth

Agrega TODOS estos orígenes en tu configuración de OAuth 2.0 Client ID en Google Cloud Console:

## Orígenes de JavaScript autorizados:

```
http://localhost:5173
http://127.0.0.1:5173
http://[::1]:5173
http://localhost:3000
http://127.0.0.1:3000
```

## Pasos detallados para configurar:

1. **Ir a Google Cloud Console:**
   https://console.cloud.google.com/

2. **Navegar a APIs y servicios:**
   - Menú hamburguesa → "APIs y servicios" → "Credenciales"

3. **Editar el OAuth 2.0 Client ID:**
   - Busca tu Client ID: `501834389412-he8c9j1pql1scsat649ofoq8fqaet9ut.apps.googleusercontent.com`
   - Haz clic en el ícono de editar (lápiz)

4. **Agregar orígenes autorizados:**
   - En "Orígenes de JavaScript autorizados"
   - Agregar CADA UNO de los orígenes listados arriba
   - **IMPORTANTE**: No usar barras finales (/) en las URLs

5. **Guardar cambios:**
   - Hacer clic en "GUARDAR"
   - Esperar 2-5 minutos para que los cambios se propaguen

## ⚠️ Posibles causas del error:

1. **Cambios no propagados:** Los cambios en Google Cloud tardan unos minutos
2. **Barra final en URL:** No usar `http://localhost:5173/`
3. **Protocolo incorrecto:** Asegurarse de usar `http://` no `https://`
4. **Puerto incorrecto:** Verificar que el puerto sea exactamente 5173
5. **Client ID incorrecto:** Verificar que el Client ID sea exacto

## 🔄 Soluciones adicionales:

### Si el error persiste:

1. **Crear nuevo OAuth Client:**
   - Crear un nuevo OAuth 2.0 Client ID específico para desarrollo
   - Usar solo `http://localhost:5173` como origen

2. **Verificar APIs habilitadas:**
   - Google Drive API debe estar habilitada
   - Google Sheets API debe estar habilitada

3. **Verificar cuotas:**
   - Ir a "APIs y servicios" → "Cuotas"
   - Verificar que no se hayan excedido límites

4. **Modo incógnito:**
   - Probar en una ventana de incógnito
   - Limpiar caché del navegador

## 📋 Checklist de verificación:

- [ ] APIs habilitadas (Drive + Sheets)
- [ ] OAuth 2.0 Client ID creado
- [ ] Orígenes agregados correctamente
- [ ] Sin barras finales en URLs
- [ ] Cambios guardados hace más de 2 minutos
- [ ] Client ID correcto en .env
- [ ] API Key correcta en .env
- [ ] Servidor reiniciado después de cambiar .env

---

Si después de seguir todos estos pasos el error persiste, 
considera crear un nuevo proyecto en Google Cloud Console.
