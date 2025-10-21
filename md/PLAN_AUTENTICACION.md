# 🔐 Plan de Implementación - Sistema de Autenticación

## 📋 Resumen Ejecutivo

Se implementará un sistema de autenticación completo usando **Supabase Auth** para proteger la aplicación. Actualmente, la aplicación funciona con un `.env` que contiene credenciales públicas (ANON_KEY). Con la autenticación:

- ✅ Usuarios deben registrarse/login para acceder
- ✅ Cada usuario solo ve sus datos o datos públicos según su rol
- ✅ Se implementan roles: `admin`, `profesor`, `apoderado`
- ✅ Mantiene la funcionalidad actual pero de forma segura

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Login/App)                   │
│  - login.html: Pantalla de registro/login               │
│  - auth.js: Gestión de sesión y tokens                  │
│  - script.js: Modificado para agregar Bearer token      │
└─────────────────────────────────────────────────────────┘
                          ↓ (Bearer Token)
┌─────────────────────────────────────────────────────────┐
│                   Backend Express (Node.js)              │
│  - server.js: Endpoints con middleware auth            │
│  - verifyAuth.js: Middleware JWT verification          │
│  - /api/auth/*: Endpoints de autenticación             │
│  - Otros endpoints: Protegidos con verifyAuth          │
└─────────────────────────────────────────────────────────┘
                          ↓ (Session + RLS)
┌─────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL + RLS                   │
│  - auth.users: Supabase Auth (automático)              │
│  - users_profiles: Rol + Escuela (custom)              │
│  - estudiantes: Protegido por RLS                      │
│  - RLS: Admin ve todo, otros ven según rol             │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Autenticación

### 1. Registro (Sign Up)
```
Usuario ingresa email + password
         ↓
POST /api/auth/register
         ↓
Supabase crea auth.users + token
         ↓
Backend crea users_profiles
         ↓
Frontend almacena token en sessionStorage
         ↓
Redirige a /app (dashboard)
```

### 2. Login
```
Usuario ingresa email + password
         ↓
POST /api/auth/login
         ↓
Supabase verifica credenciales
         ↓
Devuelve JWT token
         ↓
Frontend almacena token
         ↓
Redirige a /app
```

### 3. Acceso a Endpoint Protegido
```
GET /api/students
Header: Authorization: Bearer <JWT_TOKEN>
         ↓
Middleware verifyAuth() valida token
         ↓
Extrae user_id del token
         ↓
Si válido: procesa request
Si inválido: devuelve 401
```

### 4. Logout
```
GET /api/auth/logout
         ↓
Backend invalida sesión (opcional)
         ↓
Frontend elimina token de sessionStorage
         ↓
Redirige a /login
```

---

## 📊 Base de Datos - Nuevas Tablas

### Tabla: `users_profiles` (Pública - Lectura)
```sql
CREATE TABLE users_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'profesor', -- admin, profesor, apoderado
  school VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

RLS:
- SELECT: Authenticated users
- INSERT: Authenticated users (solo su propio perfil)
- UPDATE: Admin + own profile
- DELETE: Admin only
```

### Tabla: `estudiantes` (Actualización de RLS)
```sql
Nuevas RLS Policies:

1. SELECT - Admins ven todo
   authenticated AND role = 'admin'

2. SELECT - Profesores ven estudiantes de su escuela
   authenticated AND role = 'profesor'

3. SELECT - Apoderados solo ven sus hijos
   authenticated AND role = 'apoderado'
   AND estudiante.apoderado_id = auth.uid()

4. INSERT/UPDATE/DELETE - Solo admins
   authenticated AND role = 'admin'
```

---

## 📁 Estructura de Archivos a Crear/Modificar

### Crear
```
├── middleware/
│   └── verifyAuth.js         [NUEVO] Middleware JWT
├── public/
│   ├── login.html            [NUEVO] Página login
│   ├── auth.js               [NUEVO] Módulo auth frontend
│   └── dashboard.html        [NUEVO] Dashboard usuario
├── AUTENTICACION.md          [NUEVO] Documentación
└── MIGRACION_AUTH.md         [NUEVO] Scripts SQL
```

### Modificar
```
├── server.js                 [EDITAR] Agregar endpoints /api/auth/*
├── public/script.js          [EDITAR] Agregar Bearer token
├── public/index.html         [EDITAR] Redirigir a login si no auth
└── db.js                     [EDITAR] Manejar sesión autenticada
```

---

## 🛠️ Pasos de Implementación

### Fase 1: Backend (Autenticación)
1. ✅ Crear tabla `users_profiles` en Supabase
2. ✅ Configurar RLS policies
3. ✅ Crear middleware `verifyAuth.js`
4. ✅ Agregar endpoints en `server.js`:
   - POST /api/auth/register
   - POST /api/auth/login
   - POST /api/auth/logout
   - GET /api/auth/me
5. ✅ Proteger endpoints con verifyAuth

### Fase 2: Frontend (Interfaz)
1. ✅ Crear `public/login.html` (formulario)
2. ✅ Crear `public/auth.js` (gestor sesión)
3. ✅ Crear `public/dashboard.html` (info usuario)
4. ✅ Modificar `script.js` para agregar token Bearer

### Fase 3: Integración & Pruebas
1. ✅ Verificar flujo completo: registro → login → app → logout
2. ✅ Pruebas de RLS: admin ve todo, otros ven según rol
3. ✅ Pruebas de endpoints protegidos

### Fase 4: Documentación
1. ✅ Crear `AUTENTICACION.md` con guía de uso
2. ✅ Crear `MIGRACION_AUTH.md` con scripts SQL

---

## 🔑 Variables de Entorno (sin cambios)

```env
SUPABASE_URL=https://fnoebgtfnfecpgajzjpe.supabase.co
SUPABASE_ANON_KEY=[tu_llave_anon]
SUPABASE_JWT_SECRET=[requerido para verificar JWT en backend]
PORT=3000
NODE_ENV=development
```

⚠️ **Nota:** `SUPABASE_JWT_SECRET` se obtiene de: Supabase Dashboard → Settings → API

---

## 📱 Flujo de Usuario

### Primer Acceso
```
Usuario abre http://localhost:3000
         ↓
Verifica sessionStorage.token
         ↓
NO hay token → Redirige a /login
         ↓
Usuario ve: login.html (opción Register/Login)
         ↓
Elige Register → Ingresa email + contraseña
         ↓
Backend crea auth.users + users_profiles
         ↓
Almacena token en sessionStorage
         ↓
Redirige a /app
         ↓
Usuario ve: dashboard con lista de estudiantes
```

### Acceso Posterior
```
Usuario abre http://localhost:3000
         ↓
Lee token de sessionStorage
         ↓
SÍ hay token → Verifica validez en /api/auth/me
         ↓
Token válido → Carga /app con datos
         ↓
Token inválido → Redirige a /login
```

---

## 🎯 Roles y Permisos

| Rol | Registro | Ver Estudiantes | Editar | Crear | Eliminar |
|-----|----------|-----------------|--------|-------|----------|
| **admin** | Sí | Todos | Sí | Sí | Sí |
| **profesor** | Sí (por admin) | Su escuela | Sí | Sí | No |
| **apoderado** | Sí | Sus hijos | No | No | No |

---

## 🧪 Pruebas

### Test 1: Registro
```bash
POST /api/auth/register
{
  "email": "admin@escuela.edu",
  "password": "SecurePass123!",
  "full_name": "Admin",
  "role": "admin"
}
Response: { token, user }
```

### Test 2: Login
```bash
POST /api/auth/login
{
  "email": "admin@escuela.edu",
  "password": "SecurePass123!"
}
Response: { token, user }
```

### Test 3: Endpoint Protegido
```bash
GET /api/students
Header: Authorization: Bearer <token>
Response: { students, pagination }
```

### Test 4: Sin Token
```bash
GET /api/students
(sin header Authorization)
Response: { error: "No autorizado", statusCode: 401 }
```

---

## 🔒 Seguridad

✅ **Implementado:**
- JWT tokens con expiración
- RLS policies en base de datos
- Middleware verifyAuth en backend
- Tokens en sessionStorage (no localStorage)

⚠️ **A Considerar:**
- HTTPS en producción (no HTTP)
- Refresh tokens para renovación automática
- Rate limiting en /api/auth/*
- Validación de email (confirmar)

---

## 📊 Cronograma Estimado

| Fase | Tarea | Duración |
|------|-------|----------|
| 1 | Crear tabla + RLS | 15 min |
| 1 | Crear middleware verifyAuth | 10 min |
| 1 | Endpoints autenticación | 20 min |
| 2 | Frontend login.html + auth.js | 30 min |
| 2 | Modificar script.js | 10 min |
| 3 | Pruebas integración | 20 min |
| 4 | Documentación | 15 min |
| **Total** | | **2 horas** |

---

## 🚀 Inicio

Procedamos con la **Fase 1: Backend** primero. ¿Comenzamos?

```
Próximo paso: Crear tabla users_profiles en Supabase
```
