# 📋 Guía de Importación de CSV a Supabase

## ✅ Archivos CSV Disponibles

Los siguientes archivos CSV están listos para importar a Supabase:

| Archivo           | Registros | Descripción                       |
| ----------------- | --------- | --------------------------------- |
| `niveles.csv`     | 1         | Niveles educativos (Secundaria)   |
| `apoderados.csv`  | 967       | Información de apoderados/tutores |
| `direcciones.csv` | 967       | Direcciones de estudiantes        |
| `aulas.csv`       | 37        | Información de aulas/secciones    |
| `estudiantes.csv` | 1254      | Registros de estudiantes          |
| **TOTAL**         | **3226**  | **Registros a importar**          |

---

## 🔑 Orden de Importación (IMPORTANTE)

Debes importar los archivos en este orden para respetar las restricciones de claves foráneas:

### 1️⃣ Primero: `niveles.csv`

- **Tabla destino**: `niveles`
- **Registros**: 1
- **Dependencias**: Ninguna
- **Razón**: Tabla padre, sin dependencias

### 2️⃣ Segundo: `apoderados.csv` y `direcciones.csv`

- **Tabla destino**: `apoderados` y `direcciones`
- **Registros**: 967 cada una
- **Dependencias**: Ninguna
- **Razón**: Tablas independientes entre sí

### 3️⃣ Tercero: `aulas.csv`

- **Tabla destino**: `aulas`
- **Registros**: 37
- **Dependencias**: `nivel_id` → tabla `niveles`
- **Razón**: Referencia a niveles (que ya debe estar importado)

### 4️⃣ Cuarto: `estudiantes.csv`

- **Tabla destino**: `estudiantes`
- **Registros**: 1254
- **Dependencias**:
  - `aula_id` → tabla `aulas`
  - `apoderado_id` → tabla `apoderados`
  - `direccion_id` → tabla `direcciones`
- **Razón**: Última tabla, referencia a todas las demás

---

## 📤 Procedimiento de Importación en Supabase

Para cada CSV, sigue estos pasos:

1. **Abre Supabase** → Tu proyecto
2. **Ve a** → SQL Editor o Table Editor
3. **En la tabla destino**, busca el botón **"Import"** o **"Insert rows"**
4. **Selecciona** el archivo CSV correspondiente
5. **Configura las opciones**:
   - ✅ Ignorar encabezados (está incluido en el CSV)
   - ✅ Codificación UTF-8 (para caracteres españoles)
6. **Importa** los datos

---

## 📝 Ejemplo de Importación

### Paso 1: Importar `niveles.csv`

```
Tabla: niveles
Registros a importar: 1
Contenido esperado:
  - id: 1
  - nombre: Secundaria
```

### Paso 2: Importar `apoderados.csv`

```
Tabla: apoderados
Registros a importar: 967
Contenido ejemplo:
  - id: 960, apellidos: TALLA ALMEYDA, nombres: KELLY ANDREA, ...
  - id: 961, apellidos: YATACO MATEO, nombres: ARACELI, ...
  (... 965 registros más)
```

### Paso 3: Importar `direcciones.csv`

```
Tabla: direcciones
Registros a importar: 967
Contenido ejemplo:
  - id: 960, departamento: ICA, provincia: CHINCHA, ...
  - id: 961, departamento: ICA, provincia: CHINCHA, ...
  (... 965 registros más)
```

### Paso 4: Importar `aulas.csv`

```
Tabla: aulas
Registros a importar: 37
Contenido ejemplo:
  - id: 1, grado: 1°, seccion: A, anio: 2025, nivel_id: 1
  - id: 2, grado: 1°, seccion: B, anio: 2025, nivel_id: 1
  (... 35 registros más)
```

### Paso 5: Importar `estudiantes.csv`

```
Tabla: estudiantes
Registros a importar: 1254
Contenido ejemplo:
  - id: 960, apellidos: PACHAS TALLA, nombres: VALERY ANDREA, ...
  - id: 961, apellidos: SEBASTIAN YATACO, nombres: LEANDRO JESUS, ...
  (... 1252 registros más)
```

---

## ⚠️ Consideraciones Importantes

### Valores NULL

- Si un campo está vacío en el CSV, se importará como `NULL`
- Esto es normal para campos como `celular` o `fecha_nacimiento` en algunos registros

### Caracteres Especiales

- Los nombres y direcciones contienen acentos (ó, á, í, é, ñ, etc.)
- Los archivos están codificados en UTF-8
- Supabase los importará correctamente

### Claves Foráneas

- Cada registro en `estudiantes` referencia:
  - Un `aula_id` válido (1-37)
  - Un `apoderado_id` válido (o NULL si no tiene)
  - Un `direccion_id` válido (o NULL si no tiene)
- Asegúrate de importar en el orden correcto

---

## ✨ Verificación Post-Importación

Después de importar todos los archivos, verifica que:

1. ✅ **niveles**: 1 registro
2. ✅ **apoderados**: 967 registros
3. ✅ **direcciones**: 967 registros
4. ✅ **aulas**: 37 registros
5. ✅ **estudiantes**: 1254 registros

**Total esperado**: 3,226 registros

---

## 🆘 Si hay errores

### Error: "Foreign key violation"

- **Causa**: No importaste las tablas en el orden correcto
- **Solución**: Importa siempre en este orden:
  1. niveles
  2. apoderados y direcciones
  3. aulas
  4. estudiantes

### Error: "Duplicate key"

- **Causa**: Intentaste importar dos veces el mismo archivo
- **Solución**: Limpia la tabla y vuelve a intentar

### Error: "Character encoding"

- **Causa**: El archivo no tiene codificación UTF-8
- **Solución**: Los archivos generados sí tienen UTF-8, verifica en Supabase que uses esa codificación

---

## 📚 Archivos CSV

Todos están en: `/home/carlos/Descargas/Practicas/bas/csv_export/`

```
csv_export/
├── niveles.csv        (25 B)
├── apoderados.csv     (64 KB)
├── direcciones.csv    (59 KB)
├── aulas.csv          (652 B)
└── estudiantes.csv    (89 KB)
```

---

✅ **¡Listo para importar a Supabase!**

Sigue el orden correcto y tendrás todos tus 3,226 registros en Supabase.
