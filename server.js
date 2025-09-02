const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conexión a la base de datos SQLite
const dbPath = path.join(__dirname, 'estudiantes.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite');
    }
});

// Ruta principal - servir el archivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para obtener estudiantes con paginación
app.get('/api/students', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24; // 24 por página por defecto
    const offset = (page - 1) * limit;
    
    // Query para contar el total de estudiantes
    const countQuery = `SELECT COUNT(*) as total FROM estudiantes`;
    
    // Query para obtener estudiantes con paginación
    const studentsQuery = `
        SELECT 
            e.id,
            e.apellidos,
            e.nombres,
            e.dni,
            e.fecha_nacimiento,
            e.sexo,
            e.discapacidad,
            a.grado,
            a.seccion,
            a.anio,
            ap.id as apoderado_id,
            ap.apellidos as apoderado_apellidos,
            ap.nombres as apoderado_nombres,
            ap.dni as apoderado_dni,
            ap.fecha_nacimiento as apoderado_fecha_nacimiento,
            ap.celular as apoderado_celular,
            d.departamento,
            d.provincia,
            d.distrito,
            d.domicilio,
            n.nombre as nivel
        FROM estudiantes e
        LEFT JOIN aulas a ON e.aula_id = a.id
        LEFT JOIN apoderados ap ON e.apoderado_id = ap.id
        LEFT JOIN direcciones d ON e.direccion_id = d.id
        LEFT JOIN niveles n ON a.nivel_id = n.id
        ORDER BY a.grado, a.seccion, e.apellidos, e.nombres
        LIMIT ? OFFSET ?
    `;
    
    // Primero obtener el total
    db.get(countQuery, [], (err, countResult) => {
        if (err) {
            console.error('Error al contar estudiantes:', err.message);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }
        
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);
        
        // Luego obtener los estudiantes de la página actual
        db.all(studentsQuery, [limit, offset], (err, rows) => {
            if (err) {
                console.error('Error al obtener estudiantes:', err.message);
                res.status(500).json({ error: 'Error interno del servidor' });
                return;
            }
            
            // Transformar los datos
            const students = rows.map(row => ({
                id: row.id,
                apellidos: row.apellidos,
                nombres: row.nombres,
                dni: row.dni,
                fecha_nacimiento: row.fecha_nacimiento,
                sexo: row.sexo,
                discapacidad: row.discapacidad,
                grado: row.grado,
                seccion: row.seccion,
                anio: row.anio,
                nivel: row.nivel,
                apoderado: row.apoderado_id ? {
                    id: row.apoderado_id,
                    apellidos: row.apoderado_apellidos,
                    nombres: row.apoderado_nombres,
                    dni: row.apoderado_dni,
                    fecha_nacimiento: row.apoderado_fecha_nacimiento,
                    celular: row.apoderado_celular
                } : null,
                direccion: row.departamento ? {
                    departamento: row.departamento,
                    provincia: row.provincia,
                    distrito: row.distrito,
                    domicilio: row.domicilio
                } : null
            }));
            
            res.json({
                students,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            });
        });
    });
});

// API para obtener un estudiante específico por ID
app.get('/api/students/:id', (req, res) => {
    const studentId = req.params.id;
    
    const query = `
        SELECT 
            e.id,
            e.apellidos,
            e.nombres,
            e.dni,
            e.fecha_nacimiento,
            e.sexo,
            e.discapacidad,
            a.grado,
            a.seccion,
            a.anio,
            ap.id as apoderado_id,
            ap.apellidos as apoderado_apellidos,
            ap.nombres as apoderado_nombres,
            ap.dni as apoderado_dni,
            ap.fecha_nacimiento as apoderado_fecha_nacimiento,
            ap.celular as apoderado_celular,
            d.departamento,
            d.provincia,
            d.distrito,
            d.domicilio,
            n.nombre as nivel
        FROM estudiantes e
        LEFT JOIN aulas a ON e.aula_id = a.id
        LEFT JOIN apoderados ap ON e.apoderado_id = ap.id
        LEFT JOIN direcciones d ON e.direccion_id = d.id
        LEFT JOIN niveles n ON a.nivel_id = n.id
        WHERE e.id = ?
    `;
    
    db.get(query, [studentId], (err, row) => {
        if (err) {
            console.error('Error al obtener estudiante:', err.message);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Estudiante no encontrado' });
            return;
        }
        
        const student = {
            id: row.id,
            apellidos: row.apellidos,
            nombres: row.nombres,
            dni: row.dni,
            fecha_nacimiento: row.fecha_nacimiento,
            sexo: row.sexo,
            discapacidad: row.discapacidad,
            grado: row.grado,
            seccion: row.seccion,
            anio: row.anio,
            nivel: row.nivel,
            apoderado: row.apoderado_id ? {
                id: row.apoderado_id,
                apellidos: row.apoderado_apellidos,
                nombres: row.apoderado_nombres,
                dni: row.apoderado_dni,
                fecha_nacimiento: row.apoderado_fecha_nacimiento,
                celular: row.apoderado_celular
            } : null,
            direccion: row.departamento ? {
                departamento: row.departamento,
                provincia: row.provincia,
                distrito: row.distrito,
                domicilio: row.domicilio
            } : null
        };
        
        res.json(student);
    });
});

// API para búsqueda de estudiantes con paginación
app.get('/api/search', (req, res) => {
    const { q, type, grado, seccion, sexo } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const offset = (page - 1) * limit;
    
    let baseQuery = `
        FROM estudiantes e
        LEFT JOIN aulas a ON e.aula_id = a.id
        LEFT JOIN apoderados ap ON e.apoderado_id = ap.id
        LEFT JOIN direcciones d ON e.direccion_id = d.id
        LEFT JOIN niveles n ON a.nivel_id = n.id
        WHERE 1=1
    `;
    
    const params = [];
    
    // Aplicar filtros de búsqueda
    if (q) {
        switch (type) {
            case 'estudiante':
                baseQuery += ` AND (e.nombres LIKE ? OR e.apellidos LIKE ? OR e.dni LIKE ?)`;
                params.push(`%${q}%`, `%${q}%`, `%${q}%`);
                break;
            case 'apoderado':
                baseQuery += ` AND (ap.nombres LIKE ? OR ap.apellidos LIKE ? OR ap.dni LIKE ?)`;
                params.push(`%${q}%`, `%${q}%`, `%${q}%`);
                break;
            case 'dni':
                baseQuery += ` AND (e.dni LIKE ? OR ap.dni LIKE ?)`;
                params.push(`%${q}%`, `%${q}%`);
                break;
            default: // general
                baseQuery += ` AND (
                    e.nombres LIKE ? OR e.apellidos LIKE ? OR e.dni LIKE ? OR
                    ap.nombres LIKE ? OR ap.apellidos LIKE ? OR ap.dni LIKE ? OR
                    d.distrito LIKE ? OR d.provincia LIKE ? OR d.domicilio LIKE ?
                )`;
                params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
        }
    }
    
    // Aplicar filtros adicionales
    if (grado) {
        baseQuery += ` AND a.grado = ?`;
        params.push(grado);
    }
    
    if (seccion) {
        baseQuery += ` AND a.seccion = ?`;
        params.push(seccion);
    }
    
    if (sexo) {
        baseQuery += ` AND e.sexo = ?`;
        params.push(sexo);
    }
    
    // Query para contar resultados
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    
    // Query para obtener resultados con paginación
    const studentsQuery = `
        SELECT 
            e.id,
            e.apellidos,
            e.nombres,
            e.dni,
            e.fecha_nacimiento,
            e.sexo,
            e.discapacidad,
            a.grado,
            a.seccion,
            a.anio,
            ap.id as apoderado_id,
            ap.apellidos as apoderado_apellidos,
            ap.nombres as apoderado_nombres,
            ap.dni as apoderado_dni,
            ap.fecha_nacimiento as apoderado_fecha_nacimiento,
            ap.celular as apoderado_celular,
            d.departamento,
            d.provincia,
            d.distrito,
            d.domicilio,
            n.nombre as nivel
        ${baseQuery}
        ORDER BY a.grado, a.seccion, e.apellidos, e.nombres
        LIMIT ? OFFSET ?
    `;
    
    // Primero obtener el total
    db.get(countQuery, params, (err, countResult) => {
        if (err) {
            console.error('Error en conteo de búsqueda:', err.message);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }
        
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);
        
        // Luego obtener los resultados de la página actual
        const searchParams = [...params, limit, offset];
        db.all(studentsQuery, searchParams, (err, rows) => {
            if (err) {
                console.error('Error en búsqueda:', err.message);
                res.status(500).json({ error: 'Error interno del servidor' });
                return;
            }
            
            const students = rows.map(row => ({
                id: row.id,
                apellidos: row.apellidos,
                nombres: row.nombres,
                dni: row.dni,
                fecha_nacimiento: row.fecha_nacimiento,
                sexo: row.sexo,
                discapacidad: row.discapacidad,
                grado: row.grado,
                seccion: row.seccion,
                anio: row.anio,
                nivel: row.nivel,
                apoderado: row.apoderado_id ? {
                    id: row.apoderado_id,
                    apellidos: row.apoderado_apellidos,
                    nombres: row.apoderado_nombres,
                    dni: row.apoderado_dni,
                    fecha_nacimiento: row.apoderado_fecha_nacimiento,
                    celular: row.apoderado_celular
                } : null,
                direccion: row.departamento ? {
                    departamento: row.departamento,
                    provincia: row.provincia,
                    distrito: row.distrito,
                    domicilio: row.domicilio
                } : null
            }));
            
            res.json({
                students,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            });
        });
    });
});

// API para obtener estadísticas
app.get('/api/stats', (req, res) => {
    const queries = {
        totalStudents: `SELECT COUNT(*) as count FROM estudiantes`,
        studentsByGrade: `
            SELECT a.grado, COUNT(*) as count 
            FROM estudiantes e 
            JOIN aulas a ON e.aula_id = a.id 
            GROUP BY a.grado 
            ORDER BY a.grado
        `,
        studentsBySection: `
            SELECT a.seccion, COUNT(*) as count 
            FROM estudiantes e 
            JOIN aulas a ON e.aula_id = a.id 
            GROUP BY a.seccion 
            ORDER BY a.seccion
        `,
        studentsBySex: `
            SELECT sexo, COUNT(*) as count 
            FROM estudiantes 
            GROUP BY sexo
        `
    };
    
    const stats = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;
    
    Object.entries(queries).forEach(([key, query]) => {
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error(`Error en query ${key}:`, err.message);
                stats[key] = [];
            } else {
                stats[key] = rows;
            }
            
            completed++;
            if (completed === totalQueries) {
                res.json(stats);
            }
        });
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Ruta 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

// Manejo de cierre de la aplicación
process.on('SIGINT', () => {
    console.log('Cerrando servidor...');
    db.close((err) => {
        if (err) {
            console.error('Error al cerrar la base de datos:', err.message);
        } else {
            console.log('Conexión a la base de datos cerrada.');
        }
        process.exit(0);
    });
});
