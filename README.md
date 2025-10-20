# Sistema de Estudiantes

Una aplicación web minimalista para la gestión y búsqueda de información de estudiantes, construida con Node.js, Express, SQLite y vanilla JavaScript.

## Características

- **Búsqueda avanzada**: Búsqueda por nombre, apellido, DNI, información de apoderados
- **Filtros múltiples**: Por grado, sección, sexo y tipo de búsqueda
- **Interfaz responsiva**: Diseño material minimalista adaptable a diferentes pantallas
- **Información completa**: Datos del estudiante, apoderado y dirección
- **Modal de detalles**: Vista detallada de la información del estudiante

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Base de datos**: SQLite3
- **Estilos**: Material Design inspirado, Google Fonts, Material Icons

## Instalación

1. Clona o descarga el proyecto
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Asegúrate de que el archivo `estudiantes.db` esté en la raíz del proyecto
4. Inicia el servidor:
   ```bash
   npm start
   ```
5. Abre tu navegador en `http://localhost:3000`

## Estructura del Proyecto

```
├── public/
│   ├── index.html      # Interfaz principal
│   ├── styles.css      # Estilos CSS
│   └── script.js       # Lógica del frontend
├── server.js           # Servidor Express y API
├── package.json        # Dependencias y scripts
├── estudiantes.db      # Base de datos SQLite
└── README.md          # Este archivo
```

## API Endpoints

- `GET /api/students` - Obtener todos los estudiantes
- `GET /api/students/:id` - Obtener un estudiante específico
- `GET /api/search` - Búsqueda con filtros
- `GET /api/stats` - Estadísticas generales

## Base de Datos

La aplicación utiliza una base de datos SQLite con las siguientes tablas:

- **estudiantes**: Información básica de los estudiantes
- **apoderados**: Información de los apoderados/tutores
- **direcciones**: Direcciones de residencia
- **aulas**: Información de grados y secciones
- **niveles**: Niveles educativos

## Funcionalidades

### Búsqueda
- **General**: Busca en todos los campos disponibles
- **Solo estudiantes**: Busca solo en nombres y DNI de estudiantes
- **Solo apoderados**: Busca solo en información de apoderados
- **Por DNI**: Búsqueda específica por documento de identidad

### Filtros
- **Grado**: Filtrar por grado académico (1° a 5°)
- **Sección**: Filtrar por sección (A, B, C, etc.)
- **Sexo**: Filtrar por género (Masculino/Femenino)

### Interfaz
- Diseño responsivo para desktop y móvil
- Tarjetas de estudiantes con información resumida
- Modal con información detallada
- Indicadores de carga y estado
- Manejo de errores y estados vacíos

## Desarrollo

Para desarrollo con recarga automática:

```bash
npm run dev
```

## Personalización

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

### Funcionalidades adicionales
El código está estructurado para facilitar la adición de nuevas funcionalidades:

- Edición de estudiantes
- Exportación de datos
- Reportes avanzados
- Autenticación
- Gestión de usuarios

## Soporte

Para soporte o reportar problemas, por favor contacta al administrador del sistema.

## Licencia

MIT License
