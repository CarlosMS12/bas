# Sistema de Estudiantes - Supabase Edition

Una aplicación web moderna para la gestión y búsqueda de información de estudiantes, construida con Node.js, Express, Supabase (PostgreSQL) y vanilla JavaScript.

## ✨ Características

- **Búsqueda avanzada**: Búsqueda por nombre, apellido, DNI, información de apoderados
- **Filtros múltiples**: Por grado, sección, sexo y tipo de búsqueda
- **Interfaz responsiva**: Diseño material minimalista adaptable a diferentes pantallas
- **Información completa**: Datos del estudiante, apoderado y dirección
- **Modal de detalles**: Vista detallada de la información del estudiante
- **CRUD completo**: Crear, leer, actualizar y eliminar estudiantes

## 🛠 Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Base de datos**: Supabase (PostgreSQL)
- **ORM/Cliente**: @supabase/supabase-js
- **Estilos**: Material Design inspirado, Google Fonts, Material Icons

## 📦 Instalación

1. Clona o descarga el proyecto
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno creando un archivo `.env`:
   ```bash
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu-clave-anonima
   NODE_ENV=development
   PORT=3000
   ```
4. Inicia el servidor:
   ```bash
   npm start
   ```
5. Abre tu navegador en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
├── public/
│   ├── index.html      # Interfaz principal
│   ├── styles.css      # Estilos CSS
│   └── script.js       # Lógica del frontend
├── server.js           # Servidor Express y API
├── db.js              # Cliente Supabase
├── .env               # Variables de entorno (no versionar)
├── package.json       # Dependencias y scripts
└── README.md         # Este archivo
```

## 🔌 API Endpoints

### Estudiantes
- `GET /api/students` - Obtener todos los estudiantes (con paginación)
- `GET /api/students/:id` - Obtener un estudiante específico
- `POST /api/students` - Crear un nuevo estudiante
- `PUT /api/students/:id` - Actualizar un estudiante
- `DELETE /api/students/:id` - Eliminar un estudiante

### Apoderados
- `PUT /api/apoderados/:id` - Actualizar información de apoderado

### Direcciones
- `PUT /api/direcciones/:id` - Actualizar información de dirección

### Búsqueda y Filtros
- `GET /api/search` - Búsqueda avanzada con filtros
- `GET /api/grados` - Obtener grados disponibles
- `GET /api/secciones` - Obtener secciones disponibles
- `GET /api/aula` - Obtener aula por grado y sección

### Estadísticas
- `GET /api/stats` - Obtener estadísticas generales

## 🗄 Estructura de la Base de Datos

La aplicación utiliza las siguientes tablas en Supabase:

### Tabla: `niveles`
- `id` (BIGSERIAL) - Identificador único
- `nombre` (TEXT) - Nombre del nivel educativo

### Tabla: `aulas`
- `id` (BIGSERIAL) - Identificador único
- `grado` (TEXT) - Grado académico (1°, 2°, etc.)
- `seccion` (TEXT) - Sección (A, B, C, etc.)
- `anio` (INTEGER) - Año académico
- `nivel_id` (BIGINT FK) - Referencia a niveles

### Tabla: `apoderados`
- `id` (BIGSERIAL) - Identificador único
- `apellidos` (TEXT) - Apellidos del apoderado
- `nombres` (TEXT) - Nombres del apoderado
- `dni` (TEXT) - Documento de identidad
- `fecha_nacimiento` (DATE) - Fecha de nacimiento
- `celular` (TEXT) - Número de teléfono celular

### Tabla: `direcciones`
- `id` (BIGSERIAL) - Identificador único
- `departamento` (TEXT) - Departamento
- `provincia` (TEXT) - Provincia
- `distrito` (TEXT) - Distrito
- `domicilio` (TEXT) - Dirección completa

### Tabla: `estudiantes`
- `id` (BIGSERIAL) - Identificador único
- `apellidos` (TEXT) - Apellidos del estudiante
- `nombres` (TEXT) - Nombres del estudiante
- `dni` (TEXT) - Documento de identidad
- `fecha_nacimiento` (DATE) - Fecha de nacimiento
- `sexo` (TEXT) - Género
- `discapacidad` (TEXT) - Información de discapacidad
- `aula_id` (BIGINT FK) - Referencia a aulas
- `apoderado_id` (BIGINT FK) - Referencia a apoderados
- `direccion_id` (BIGINT FK) - Referencia a direcciones

## 🔍 Funcionalidades

### Búsqueda
- **General**: Busca en todos los campos disponibles
- **Solo estudiantes**: Busca solo en nombres y DNI de estudiantes
- **Solo apoderados**: Busca solo en información de apoderados
- **Por DNI**: Búsqueda específica por documento de identidad

### Filtros
- **Grado**: Filtrar por grado académico (1° a 5°)
- **Sección**: Filtrar por sección (A, B, C, etc.)
- **Sexo**: Filtrar por género (Masculino/Femenino)

### Paginación
- Hasta 24 registros por página por defecto
- Navegación entre páginas
- Información de total de registros

## 💻 Desarrollo

Para desarrollo con recarga automática:

```bash
npm run dev
```

Requiere `nodemon` instalado como devDependency.

## 🎨 Personalización

### Colores
Los colores principales se pueden modificar en las variables CSS en `styles.css`:

```css
:root {
    --primary-color: #1976d2;
    --secondary-color: #03dac6;
    --background-color: #fafafa;
    /* ... más variables */
}
```

### Configuración de Supabase
Todas las credenciales se manejan a través de variables de entorno en `.env` para seguridad.

## 🚀 Deployment

Para desplegar en producción:

1. Configura las variables de entorno en tu plataforma de hosting
2. Ejecuta `npm install` para instalar dependencias
3. Ejecuta `npm start` para iniciar el servidor
4. Asegúrate de que Supabase esté accesible desde tu servidor

## 📝 Scripts NPM

- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor con recarga automática (desarrollo)
- `npm run test` - Ejecuta tests (no configurado aún)

## 🔐 Seguridad

- ✅ Variables de entorno para credenciales sensibles
- ✅ Validación de entrada en el backend
- ✅ Manejo de errores robusto
- ✅ SQL injection prevención (uso de Supabase ORM)

## 📊 Estadísticas

La aplicación proporciona estadísticas en tiempo real:
- Total de estudiantes
- Estudiantes por grado
- Estudiantes por sección
- Estudiantes por género

## ✅ Estado Actual

- ✅ Migración completada de SQLite a Supabase
- ✅ 3,226 registros importados correctamente
- ✅ Todas las relaciones funcionando
- ✅ API completa operacional
- ✅ Frontend compatible

## 🤝 Soporte

Para soporte o reportar problemas, por favor contacta al administrador del sistema.

## 📄 Licencia

MIT License
