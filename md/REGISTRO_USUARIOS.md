# Registro de Usuarios - Guía de Administración

## Estado Actual

La opción de **Registro** está **OCULTA** por defecto en el login. Solo aparece la opción de **Iniciar Sesión**.

## Cómo Habilitar el Registro

Cuando necesites registrar un nuevo usuario, sigue estos pasos:

### Opción 1: Habilitar desde el Código (Recomendado)

1. Abre el archivo `/public/login.html`
2. Ve a la línea **~295** donde está este CSS:

```css
/* Ocultar opción de registrarse - cambiar display a 'flex' para habilitar */
.form-tab[data-tab='register'],
#register {
	display: none !important;
}
```

3. Cambia `display: none` a `display: block`:

```css
/* Opción de registrarse HABILITADA */
.form-tab[data-tab='register'],
#register {
	display: block !important;
}
```

4. Guarda el archivo
5. Recarga el navegador (Ctrl+F5 para limpiar caché)
6. Verás la pestaña "Registrarse" disponible

### Opción 2: Desactivar Nuevamente

Una vez registrado el nuevo usuario:

1. Vuelve a cambiar `display: block` por `display: none`:

```css
.form-tab[data-tab='register'],
#register {
	display: none !important;
}
```

2. Guarda y recarga el navegador

## Flujo de Registro

Cuando el registro está habilitado:

1. El usuario hace clic en la pestaña "Registrarse"
2. Completa el formulario:

   - **Email**: Dirección de correo único
   - **Nombre Completo**: Su nombre completo
   - **Rol**: Por defecto es "profesor" (puedes cambiar después en la BD)
   - **Contraseña**: Mínimo 8 caracteres
   - **Confirmar Contraseña**: Debe coincidir

3. Se crea la cuenta en Supabase Auth
4. Se crea automáticamente el perfil en `users_profiles` con el rol seleccionado
5. Se inicia sesión automáticamente y se redirige a `/app`

## Cambiar Rol de un Usuario

Todos los usuarios nuevos se crean con rol "profesor" por defecto. Para cambiar un usuario a "admin":

### Vía SQL (Recomendado)

```sql
UPDATE public.users_profiles
SET role = 'admin'
WHERE email = 'usuario@email.com';
```

### Cambiar Todos a Admin

```sql
UPDATE public.users_profiles
SET role = 'admin'
WHERE role != 'admin';
```

## Roles Disponibles

- **admin**: Acceso total. Puede ver, crear, editar y eliminar estudiantes, aulas, etc.
- **profesor**: Acceso limitado. Puede ver estudiantes.
- **apoderado**: Acceso limitado. Solo ve sus propios estudiantes.

## Lista de Usuarios Actuales

```sql
SELECT email, full_name, role, created_at
FROM public.users_profiles
ORDER BY created_at DESC;
```

## Seguridad

⚠️ **Importante**: Por seguridad, el registro está deshabilitado por defecto. Solo el administrador debe tener acceso a habilitar el registro cuando sea necesario crear nuevos usuarios.

## Troubleshooting

**Problema**: El registro sigue oculto después de cambiar el CSS

- **Solución**: Limpia el caché del navegador (Ctrl+Shift+Delete) y recarga con Ctrl+F5

**Problema**: El usuario registrado no puede acceder

- **Solución**: Verifica que el usuario tenga rol "admin" en la tabla `users_profiles`

**Problema**: La contraseña dice "Mínimo 8 caracteres" pero escribí más

- **Solución**: Supabase requiere exactamente 8+ caracteres. Intentalo de nuevo.
