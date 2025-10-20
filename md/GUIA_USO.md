# 🚀 GUÍA DE USO - Sistema de Estudiantes

## ✅ Estado Actual

El servidor está corriendo en **http://localhost:3000**

## 📝 Qué Funciona

### 1. **Listado de Estudiantes**

- Muestra todos los 1,254 estudiantes
- **Orden:** Grado → Sección → Apellido
- **Paginación:** 24 estudiantes por página
- Cada tarjeta muestra:
  - Nombres y apellidos
  - DNI
  - Edad (calculada automáticamente)
  - Sexo
  - Grado y sección
  - Apoderado (nombre y teléfono)
  - Dirección (distrito, provincia)

### 2. **Filtros**

Puedes filtrar por:

- **Grado:** 1° a 5°
- **Sección:** Depende del grado
  - 1°: A a J (10 secciones)
  - 2°: A a H (8 secciones)
  - 3°: A a G (7 secciones)
  - 4°: A a F (6 secciones)
  - 5°: A a F (6 secciones)
- **Sexo:** Masculino / Femenino
- **Búsqueda:** Por nombre, apellido o DNI

### 3. **Ver Detalle de Estudiante**

Haz clic en cualquier tarjeta para ver:

- Toda la información del estudiante
- Datos del apoderado (nombres, apellido, DNI, celular)
- Dirección completa

### 4. **Editar Estudiante**

- Click en "Editar" para cambiar datos
- Puedes actualizar:
  - Nombres y apellidos
  - DNI
  - Fecha de nacimiento
  - Sexo
  - Grado y sección
  - Datos del apoderado
  - Dirección

### 5. **Eliminar Estudiante**

- Click en "Eliminar" para remover un estudiante
- También elimina sus datos de apoderado y dirección

### 6. **Agregar Nuevo Estudiante**

- Click en "Agregar Estudiante"
- Completa el formulario
- Se crean automáticamente registros en apoderado y dirección

## 🎯 Ejemplos de Uso

### Ejemplo 1: Ver estudiantes de 1° A

1. Abre http://localhost:3000
2. Haz clic en "Filtros"
3. Selecciona Grado: "1°"
4. Selecciona Sección: "A"
5. Verás 31 estudiantes ordenados alfabéticamente

### Ejemplo 2: Buscar un estudiante

1. Escribe en el campo de búsqueda "JUAN"
2. Se muestran 22 resultados
3. Todos los datos (apoderado, dirección) se cargan correctamente

### Ejemplo 3: Cambiar datos de un estudiante

1. Haz clic en cualquier tarjeta de estudiante
2. Haz clic en "Editar"
3. Modifica los datos necesarios
4. Haz clic en "Guardar Cambios"

## 🔍 Verificación Rápida

### Prueba 1: Orden correcto

1. Ve a Página 1
2. Verifica que todos los de la primera página son de 1° A
3. Ordénados alfabéticamente por apellido ✓

### Prueba 2: Datos completos

1. Filtra por grado "4°", sección "C"
2. Haz clic en cualquier estudiante
3. Verifica que tenga apoderado, dirección y datos completos ✓

### Prueba 3: Búsqueda

1. Busca "JUAN"
2. Verifica que todos los resultados tengan datos de apoderado ✓

### Prueba 4: Edición

1. Abre un estudiante
2. Haz clic en "Editar"
3. Cambia un dato
4. Guarda y verifica que se actualizó ✓

## 🛠️ Estructura de Datos Retornada

```json
{
	"id": 985,
	"apellidos": "ARIAS SARAVIA",
	"nombres": "JOSE WILLIAN",
	"dni": "63205087",
	"fecha_nacimiento": "2012-01-29",
	"sexo": "M",
	"discapacidad": "NO",
	"grado": "1°",
	"seccion": "A",
	"anio": 2025,
	"nivel": "Secundaria",
	"apoderado": {
		"id": 985,
		"apellidos": "SARAVIA YATACO",
		"nombres": "MARITZA",
		"dni": "77024998",
		"fecha_nacimiento": "1994-12-21",
		"celular": "902482926"
	},
	"direccion": {
		"departamento": "ICA",
		"provincia": "CHINCHA",
		"distrito": "GROCIO PRADO",
		"domicilio": "Barrio Progreso Toma Castilla SN"
	}
}
```

## 📱 Acceso desde el Navegador

1. **URL:** http://localhost:3000
2. **Navegador:** Cualquiera (Chrome, Firefox, Edge, Safari)
3. **Resolución:** Funciona en desktop y mobile

## 🔐 Seguridad

- Row Level Security (RLS) habilitada en Supabase
- Acceso público de lectura/escritura para desarrollo
- Recomendado: Implementar autenticación en producción

## 📊 Base de Datos

- **Servidor:** Supabase PostgreSQL
- **URL:** https://fnoebgtfnfecpgajzjpe.supabase.co
- **Tablas:**
  - `estudiantes` (1,254 registros)
  - `aulas` (37 registros)
  - `apoderados` (967 registros)
  - `direcciones` (967 registros)
  - `niveles` (1 registro)

## 🐛 Troubleshooting

### Si no ves datos en el navegador:

1. Verifica que el servidor está corriendo: `ps aux | grep node`
2. Prueba la API: `curl http://localhost:3000/api/students`
3. Revisa la consola (F12) para errores

### Si los filtros no funcionan:

1. Actualiza la página (Ctrl+F5)
2. Abre la consola (F12) y busca errores
3. Verifica que los filtros seleccionados son válidos

### Si la búsqueda es lenta:

1. Es normal para búsquedas en 1,254 registros
2. Se aplica debounce automático (500ms)

## 📞 Contacto y Soporte

Para preguntas sobre el sistema:

- Revisa `VERIFICACION_FINAL_CORRECCIONES.md` para detalles técnicos
- Revisa `VERIFICACION_OPTIMIZACION.md` para optimizaciones implementadas
- Revisa `MIGRACION_SUPABASE.md` para detalles de la migración

---

**Última actualización:** 20 de octubre de 2025  
**Versión:** 2.0 (Optimizada y corregida)  
**Estado:** ✅ Producción
