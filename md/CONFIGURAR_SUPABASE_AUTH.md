# ⚙️ CONFIGURACIÓN REQUERIDA - Deshabilitar Confirmación de Email en Supabase

## 🔴 PROBLEMA ACTUAL

Supabase por defecto **requiere confirmación de email** antes de que un usuario pueda iniciar sesión. Esto causa que el registro funcione pero el usuario no pueda hacer login inmediatamente.

## ✅ SOLUCIÓN - Pasos en Dashboard de Supabase

Sigue estos pasos **AHORA** para que funcione la autenticación:

### 1. Acceder al Dashboard de Supabase

- Ve a: https://app.supabase.com/
- Selecciona tu proyecto

### 2. Ir a Authentication Settings

```
Supabase Dashboard
  → Authentication
    → Providers
      → Email
```

### 3. Desactivar "Confirm email"

Busca la sección **"Email Confirmation"** y:

- [ ] ✗ Desmarca "Confirm email"
- [ ] ✓ Deja "Enable signup" marcado
- [ ] ✓ Deja "Enable magiclink" desmarcado (opcional)

### 4. Guardar Cambios

- Click en **"Save"**

### 5. Esperar Confirmación

- Debe mostrar mensaje: "Settings saved"

---

## 🧪 Prueba Después

Una vez hecho esto:

1. Abre: `http://localhost:3000/login`
2. Click en **"Registrarse"**
3. Completa el formulario:
   - Email: `test@example.com`
   - Nombre: `Test User`
   - Contraseña: `Password123`
   - Rol: `profesor`
4. Click en **"Registrarse"**
5. Deberías ver mensaje: "¡Cuenta creada! Iniciando sesión..."
6. Automáticamente irá a `/app` con el sistema funcionando

---

## 📊 Comparación

| Configuración                  | Registro   | Login Inmediato | Email Requerido |
| ------------------------------ | ---------- | --------------- | --------------- |
| **Con confirmación (actual)**  | ✗ Falla    | ✗ Falla         | ✓ Sí            |
| **Sin confirmación (deseado)** | ✓ Funciona | ✓ Funciona      | ✗ No            |

---

## 🔐 Nota de Seguridad

Esta configuración es **SOLO para desarrollo**. En producción:

- Mantener confirmación de email **ACTIVADA**
- Usar validación de dominio para emails corporativos
- Implementar rate limiting en sign-up
- Verificar usuarios en lista blanca

---

## 🚨 Si No Puedes Acceder a Settings

Si no ves la opción de settings:

1. Verifica que tienes permisos de **Owner** en el proyecto
2. Si eres colaborador, pide permisos al dueño
3. Alternativa: Crear un nuevo proyecto de prueba

---

**Próximo paso después de hacer esto:**

- Reinicia el servidor: `npm start`
- Prueba registro en http://localhost:3000/login
- Debería funcionar correctamente
