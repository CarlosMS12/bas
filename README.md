# Sistema de Gestión de Estudiantes - React + Vite

Migración completa de una aplicación vanilla JavaScript a React 19 con Vite, manteniendo 100% de funcionalidad con arquitectura moderna y optimizada.

## 📋 Características

✅ **Autenticación**

- Login con email/contraseña
- Integración con Supabase
- Gestión de tokens JWT
- Persistencia de sesión en localStorage

✅ **Gestión de Estudiantes (CRUD)**

- Visualización de lista paginada (1,254+ registros)
- Crear nuevos estudiantes
- Editar información completa (estudiante, apoderado, dirección)
- Eliminar estudiantes con confirmación
- Datos relacionados (apoderado, dirección por estudiante)

✅ **Búsqueda y Filtros Avanzados**

- Búsqueda en tiempo real con debounce (300ms)
- Búsqueda por nombre, DNI, apoderado
- Filtros por grado, sección, sexo
- Búsqueda tipo: general, estudiantes, apoderados, DNI
- Limpiar filtros con un clic

✅ **Paginación**

- Controles de primera/anterior/siguiente/última página
- Selector de tamaño de página (12, 24, 48, 100 registros)
- Indicador de resultados (ej: "1-24 de 1254 resultados")

✅ **Interfaz**

- Diseño Material Design responsive
- Modal para ver/editar detalles de estudiante
- Modal para crear nuevo estudiante
- Notificaciones toast para acciones exitosas/errores
- Spinner de carga fluido
- Funciona perfectamente en desktop, tablet y móvil

## 🏗️ Arquitectura

### Stack Tecnológico

```
Frontend:
├─ React 19.1.1 (UI components)
├─ Vite 7.1.14 (dev server + build tool)
├─ React Router 7.9.4 (client-side routing)
├─ Supabase JS 2.76.1 (database client)
└─ CSS-in-JS (inline styles + Material Design)

Backend:
├─ Express 4.18.2 (REST API)
├─ Node.js (runtime)
├─ Supabase (PostgreSQL database + auth)
└─ CORS enabled

Development:
├─ Vite dev server: localhost:5173
├─ Express API: localhost:3000
└─ Proxy: /api/* → localhost:3000
```

### Estructura de Carpetas

```
src/
├─ components/          # Componentes reutilizables
│  ├─ Common.jsx       # Notification, LoadingSpinner, Avatar
│  ├─ ProtectedRoute.jsx
│  ├─ StudentCard.jsx
│  ├─ SearchAndFilters.jsx
│  ├─ Pagination.jsx
│  ├─ StudentDetailModal.jsx
│  └─ AddStudentModal.jsx
├─ pages/              # Páginas/vistas
│  ├─ LoginPage.jsx
│  └─ AppPage.jsx
├─ context/            # State management
│  ├─ AuthContext.jsx
│  └─ StudentContext.jsx
├─ hooks/              # Custom hooks
│  ├─ useAuth.js
│  └─ useCache.js
├─ services/           # API abstraction
│  └─ api.js          # Todas las funciones HTTP
├─ utils/              # Utilidades
│  └─ SessionManager.js
├─ styles/
│  └─ main.css
├─ main.jsx            # Entry point
└─ App.jsx             # Routes setup

dist/                  # Production build
public/                # Static files (favicon, etc)
server.js              # Express backend
vite.config.js         # Vite configuration
package.json           # Dependencies
.env                   # Environment variables
```

### Context API + Custom Hooks

**AuthContext**: Gestión de autenticación

- login(email, password)
- register(email, password, fullName)
- logout()
- getCurrentUser()
- isAuthenticated, isLoading, user

**StudentContext**: Estado global de estudiantes

- students[], grados[], secciones[]
- pagination (page, limit, total, totalPages, hasNext, hasPrev)
- filters (search, grado, seccion, sexo, searchType)
- updateFilters(), resetFilters(), updatePagination()

**useCache**: Caché de 5 minutos para optimizar requests

- getCacheKey(), get(), set(), invalidate(), clear()

**useRequestController**: Cancelación automática de requests obsoletas

- Evita race conditions
- startRequest(token), isActive(token), cancelRequest(token)

## 🚀 Instalación y Setup

### Requisitos

- Node.js v18+
- npm o yarn
- Credenciales Supabase configuradas en `.env`

### Pasos

1. **Clonar/acceder al proyecto**

   ```bash
   cd /home/carlos/Descargas/Practicas/bas
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   ```bash
   # Crear/verificar archivo .env con:
   SUPABASE_URL=tu_url_supabase
   SUPABASE_ANON_KEY=tu_anon_key
   ```

4. **Iniciar desarrollo**

   ```bash
   # Terminal 1: Backend Express
   npm run dev:backend

   # Terminal 2: Frontend Vite
   npm run dev
   ```

   O en una sola terminal:

   ```bash
   # Terminal 1
   node server.js

   # Terminal 2
   npm run dev
   ```

5. **Abrir en navegador**
   ```
   http://localhost:5173
   ```

### Credenciales de Prueba

```
Email: admin@gmail.com
Contraseña: admin123.com
```

## 📦 Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor Vite (port 5173)
npm run dev:backend     # Inicia servidor Express (port 3000)

# Producción
npm run build           # Build optimizado a dist/
npm run preview         # Previsualiza build en local

# Linting
npm run lint            # ESLint check
```

## 🔄 Flujo de Funcionamiento

### 1. Login

```
Usuario ingresa email/contraseña
    ↓
POST /api/auth/login (backend)
    ↓
Respuesta con JWT token
    ↓
Guardado en localStorage (SessionManager)
    ↓
Redirige a /app
```

### 2. Cargar Estudiantes

```
AppPage monta
    ↓
useEffect carga grados y secciones
    ↓
useEffect carga lista de estudiantes (página 1, 24 por página)
    ↓
GET /api/students?page=1&limit=24 (con token en header)
    ↓
StudentContext actualiza estado
    ↓
Componentes se re-renderizan con datos
```

### 3. Búsqueda

```
Usuario escribe en input de búsqueda
    ↓
Debounce 300ms (evita búsqueda por cada carácter)
    ↓
updateFilters() en StudentContext
    ↓
useEffect dispara loadStudents()
    ↓
POST /api/search (si hay filtros)
    ↓
Resultados se muestran, foco se mantiene en input
```

### 4. Editar Estudiante

```
Usuario hace click en StudentCard
    ↓
setSelectedStudent(student)
    ↓
StudentDetailModal abre con datos
    ↓
Usuario edita y presiona "Guardar"
    ↓
PUT /api/students/:id
    ↓
PUT /api/apoderados/:id (si aplica)
    ↓
PUT /api/direcciones/:id (si aplica)
    ↓
Cache invalidado, lista recargada
    ↓
Notificación "Guardado exitosamente"
```

## 🎨 Características de UX

### Debounce en Búsqueda

- 300ms de espera antes de ejecutar búsqueda
- Preserva foco del input mientras escribes
- Evita re-montar la UI por cada carácter

### Spinner Inteligente

- Solo muestra en el área de resultados
- No desmonta el layout completo
- Mantiene buscador y filtros visibles

### Caché Inteligente

- 5 minutos de TTL para grados/secciones
- Evita requests innecesarios
- Invalidación automática al CRUD

### Cancelación de Requests

- Cancela automáticamente requests anteriores
- Evita race conditions
- Previene actualización de state en componentes desmontados

## 🔐 Seguridad

- Tokens JWT almacenados en localStorage
- Auth header (Bearer token) en todos los requests protegidos
- Rutas protegidas con ProtectedRoute
- SessionManager centraliza acceso a tokens
- Logout limpia localStorage completamente

## 📊 Performance

**Build Size (Gzipped)**

- HTML: 0.53 kB
- CSS: 3.56 kB
- JavaScript: 141.26 kB
- Total: ~145 kB

**Optimizaciones Aplicadas**

- Tree-shaking automático de Vite
- Code splitting de React Router
- Lazy loading de componentes
- CSS inlining (no genera archivos CSS separados innecesarios)
- Rolldown transpiler para máximo rendimiento

## 🔧 Troubleshooting

### "No encontrado" en búsqueda pero aparece después

**Arreglado**: Implementamos debounce + spinner inteligente

### Modal vacío al hacer click en estudiante

**Arreglado**: Añadimos useEffect para sincronizar props → state

### Servidor dice "puerto en uso"

```bash
# Matar procesos Node
killall node

# O usar puerto diferente
PORT=3001 node server.js
```

### Vite dice "Cannot find module"

```bash
# Limpiar caché y reinstalar
rm -rf node_modules dist
npm install
npm run dev
```

## 📝 Notas de la Migración

### Cambios Principales

1. **Vanilla JS → React**: Todos los manipuladores de DOM convertidos a componentes
2. **MVC → Context API**: Estado centralizado con useContext + custom hooks
3. **XHR/Fetch → Services**: Capa de abstracción en services/api.js
4. **Estilos inline**: CSS-in-JS para flexibilidad y reactividad
5. **Router**: React Router v7 para SPA routing
6. **Build**: Vite para dev server ultra-rápido y builds optimizados

### Mantiene 100% Compatibilidad

- Mismas rutas API del backend Express
- Mismo esquema de BD (Supabase)
- Mismo flujo de autenticación
- Mismo set de funcionalidades

## 👨‍💻 Desarrollo

### Agregar nueva página

```jsx
// src/pages/NewPage.jsx
import React from 'react';

export function NewPage() {
	return <div>Mi nueva página</div>;
}

// src/App.jsx - agregar ruta:
<Route path="/new" element={<NewPage />} />;
```

### Agregar nuevo componente reutilizable

```jsx
// src/components/MyComponent.jsx
export function MyComponent({prop1, prop2}) {
	return (
		<div>
			{prop1} - {prop2}
		</div>
	);
}

// Usar en otro componente:
import {MyComponent} from '../components/MyComponent';
<MyComponent prop1="valor" prop2="otro" />;
```

### Agregar nuevo endpoint API

```javascript
// src/services/api.js
export async function myNewEndpoint(param) {
	const response = await fetch(`${API_URL}/api/my-endpoint/${param}`, {
		headers: getAuthHeader(),
	});
	return response.json();
}

// Usar en componente:
import * as api from '../services/api';
const data = await api.myNewEndpoint('value');
```

## 📚 Referencias Útiles

- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Material Design](https://material.io/design)

## 📄 Licencia

Proyecto para gestión educativa. Uso interno.

---

**Última actualización**: 22 de octubre de 2025
**Versión**: 1.0.0 (Migración completada)
**Estado**: ✅ Funcional, testeado, listo para producción
