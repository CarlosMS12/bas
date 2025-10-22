const express = require('express');
const path = require('path');
const cors = require('cors');
const supabase = require('./db');
const authRoutes = require('./routes/auth');
const {verifyAuth, verifyAdmin} = require('./middleware/verifyAuth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// En desarrollo, no servir archivos estáticos (Vite lo hace)
// En producción, servir archivos de build
if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.join(__dirname, 'dist')));
}

// Rutas de autenticación (sin protección)
app.use('/api/auth', authRoutes);

// Rutas API (protegidas)
app.get('/api/students', verifyAuth, async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 24;
		const offset = (page - 1) * limit;

		const {count, error: countError} = await supabase
			.from('estudiantes')
			.select('*', {count: 'exact', head: true});

		if (countError) throw countError;

		const total = count;
		const totalPages = Math.ceil(total / limit);

		const {data, error} = await supabase
			.from('estudiantes')
			.select(
				`id, apellidos, nombres, dni, fecha_nacimiento, sexo, discapacidad, aula_id, apoderado_id, direccion_id, aulas(id, grado, seccion, anio, nivel_id), apoderados(id, apellidos, nombres, dni, fecha_nacimiento, celular), direcciones(departamento, provincia, distrito, domicilio)`
			)
			.order('aulas(grado)', {ascending: true})
			.order('aulas(seccion)', {ascending: true})
			.order('apellidos', {ascending: true})
			.range(offset, offset + limit - 1);

		if (error) throw error;

		const aulaIds = data.map((e) => e.aula_id).filter(Boolean);
		let niveles = {};

		if (aulaIds.length > 0) {
			const {data: aulaData} = await supabase
				.from('aulas')
				.select('id, niveles(nombre)')
				.in('id', aulaIds);
			if (aulaData)
				aulaData.forEach((a) => {
					niveles[a.id] = a.niveles?.nombre;
				});
		}

		const students = data.map((row) => ({
			id: row.id,
			apellidos: row.apellidos,
			nombres: row.nombres,
			dni: row.dni,
			fecha_nacimiento: row.fecha_nacimiento,
			sexo: row.sexo,
			discapacidad: row.discapacidad,
			grado: row.aulas?.grado,
			seccion: row.aulas?.seccion,
			anio: row.aulas?.anio,
			nivel: niveles[row.aula_id],
			apoderado: row.apoderados
				? {
						id: row.apoderados.id,
						apellidos: row.apoderados.apellidos,
						nombres: row.apoderados.nombres,
						dni: row.apoderados.dni,
						fecha_nacimiento: row.apoderados.fecha_nacimiento,
						celular: row.apoderados.celular,
				  }
				: null,
			direccion: row.direcciones
				? {
						departamento: row.direcciones.departamento,
						provincia: row.direcciones.provincia,
						distrito: row.direcciones.distrito,
						domicilio: row.direcciones.domicilio,
				  }
				: null,
		}));

		res.json({
			students,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno del servidor'});
	}
});

app.get('/api/students/:id', verifyAuth, async (req, res) => {
	try {
		const {data, error} = await supabase
			.from('estudiantes')
			.select(
				`id, apellidos, nombres, dni, fecha_nacimiento, sexo, discapacidad, aula_id, apoderado_id, direccion_id, aulas(id, grado, seccion, anio), apoderados(id, apellidos, nombres, dni, fecha_nacimiento, celular), direcciones(departamento, provincia, distrito, domicilio)`
			)
			.eq('id', req.params.id)
			.single();
		if (error && error.code === 'PGRST116') {
			res.status(404).json({error: 'Estudiante no encontrado'});
			return;
		}
		if (error) throw error;
		let nivel = null;
		if (data.aula_id) {
			const {data: aulaData} = await supabase
				.from('aulas')
				.select('niveles(nombre)')
				.eq('id', data.aula_id)
				.single();
			if (aulaData) nivel = aulaData.niveles?.nombre;
		}
		res.json({
			id: data.id,
			apellidos: data.apellidos,
			nombres: data.nombres,
			dni: data.dni,
			fecha_nacimiento: data.fecha_nacimiento,
			sexo: data.sexo,
			discapacidad: data.discapacidad,
			grado: data.aulas?.grado,
			seccion: data.aulas?.seccion,
			anio: data.aulas?.anio,
			nivel,
			apoderado: data.apoderados
				? {
						id: data.apoderados.id,
						apellidos: data.apoderados.apellidos,
						nombres: data.apoderados.nombres,
						dni: data.apoderados.dni,
						fecha_nacimiento: data.apoderados.fecha_nacimiento,
						celular: data.apoderados.celular,
				  }
				: null,
			direccion: data.direcciones
				? {
						departamento: data.direcciones.departamento,
						provincia: data.direcciones.provincia,
						distrito: data.direcciones.distrito,
						domicilio: data.direcciones.domicilio,
				  }
				: null,
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno del servidor'});
	}
});

app.get('/api/search', verifyAuth, async (req, res) => {
	try {
		const {q, type, grado, seccion, sexo} = req.query;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 24;
		const offset = (page - 1) * limit;

		// Paso 1: Filtrar aulas si se especifican grado/sección
		let aulaIds = null;
		if (grado || seccion) {
			let aulaQuery = supabase.from('aulas').select('id');
			if (grado) aulaQuery = aulaQuery.eq('grado', grado);
			if (seccion) aulaQuery = aulaQuery.eq('seccion', seccion);
			const {data: aulasData, error: aulasError} = await aulaQuery;
			if (aulasError) throw aulasError;
			aulaIds = aulasData.map((a) => a.id);
			if (aulaIds.length === 0) {
				// No hay aulas que coincidan
				return res.json({
					students: [],
					pagination: {
						page,
						limit,
						total: 0,
						totalPages: 0,
						hasNext: false,
						hasPrev: false,
					},
				});
			}
		}

		// Paso 2: Filtrar estudiantes
		let query = supabase
			.from('estudiantes')
			.select(
				`id, apellidos, nombres, dni, fecha_nacimiento, sexo, discapacidad, aula_id, apoderado_id, direccion_id, aulas(id, grado, seccion, anio, nivel_id), apoderados(id, apellidos, nombres, dni, fecha_nacimiento, celular), direcciones(departamento, provincia, distrito, domicilio)`,
				{count: 'exact'}
			);

		// Buscar en texto
		if (q) {
			query = query.or(
				`nombres.ilike.%${q}%,apellidos.ilike.%${q}%,dni.ilike.%${q}%`
			);
		}

		// Filtrar por aula_id si tenemos aulas
		if (aulaIds) {
			query = query.in('aula_id', aulaIds);
		}

		// Filtrar por sexo
		if (sexo) {
			query = query.eq('sexo', sexo);
		}

		// Ordenar por grado, sección y apellidos
		const {data, count, error} = await query
			.order('aulas(grado)', {ascending: true})
			.order('aulas(seccion)', {ascending: true})
			.order('apellidos', {ascending: true})
			.range(offset, offset + limit - 1);

		if (error) throw error;

		const total = count || 0;
		const totalPages = Math.ceil(total / limit);

		// Obtener niveles
		const aulasIdsData = data.map((e) => e.aula_id).filter(Boolean);
		let niveles = {};

		if (aulasIdsData.length > 0) {
			const {data: aulaData} = await supabase
				.from('aulas')
				.select('id, niveles(nombre)')
				.in('id', aulasIdsData);
			if (aulaData)
				aulaData.forEach((a) => {
					niveles[a.id] = a.niveles?.nombre;
				});
		}

		// Mapear datos
		const students = data.map((row) => ({
			id: row.id,
			apellidos: row.apellidos,
			nombres: row.nombres,
			dni: row.dni,
			fecha_nacimiento: row.fecha_nacimiento,
			sexo: row.sexo,
			discapacidad: row.discapacidad,
			grado: row.aulas?.grado,
			seccion: row.aulas?.seccion,
			anio: row.aulas?.anio,
			nivel: niveles[row.aula_id],
			apoderado: row.apoderados
				? {
						id: row.apoderados.id,
						apellidos: row.apoderados.apellidos,
						nombres: row.apoderados.nombres,
						dni: row.apoderados.dni,
						fecha_nacimiento: row.apoderados.fecha_nacimiento,
						celular: row.apoderados.celular,
				  }
				: null,
			direccion: row.direcciones
				? {
						departamento: row.direcciones.departamento,
						provincia: row.direcciones.provincia,
						distrito: row.direcciones.distrito,
						domicilio: row.direcciones.domicilio,
				  }
				: null,
		}));

		res.json({
			students,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno del servidor'});
	}
});

app.post('/api/students', verifyAuth, verifyAdmin, async (req, res) => {
	try {
		const {
			nombres,
			apellidos,
			dni,
			fecha_nacimiento,
			sexo,
			discapacidad,
			grado,
			seccion,
			apoderado,
			direccion,
		} = req.body;
		if (!nombres || !apellidos || !dni || !sexo) {
			res.status(400).json({error: 'Campos obligatorios'});
			return;
		}
		let aulaId = null;
		if (grado && seccion) {
			const {data} = await supabase
				.from('aulas')
				.select('id')
				.eq('grado', grado)
				.eq('seccion', seccion)
				.single();
			if (!data) {
				res.status(400).json({error: 'Aula no válida'});
				return;
			}
			aulaId = data.id;
		}
		let direccionId = null;
		if (
			direccion &&
			(direccion.departamento ||
				direccion.provincia ||
				direccion.distrito ||
				direccion.domicilio)
		) {
			const {data: dir} = await supabase
				.from('direcciones')
				.insert([
					{
						departamento: direccion.departamento || null,
						provincia: direccion.provincia || null,
						distrito: direccion.distrito || null,
						domicilio: direccion.domicilio || null,
					},
				])
				.select();
			if (dir) direccionId = dir[0].id;
		}
		let apoderadoId = null;
		if (apoderado && (apoderado.nombres || apoderado.apellidos)) {
			const {data: apo} = await supabase
				.from('apoderados')
				.insert([
					{
						nombres: apoderado.nombres || null,
						apellidos: apoderado.apellidos || null,
						dni: apoderado.dni || null,
						fecha_nacimiento: apoderado.fecha_nacimiento || null,
						celular: apoderado.celular || null,
					},
				])
				.select();
			if (apo) apoderadoId = apo[0].id;
		}
		const {data: studentData, error: studentError} = await supabase
			.from('estudiantes')
			.insert([
				{
					nombres,
					apellidos,
					dni,
					fecha_nacimiento: fecha_nacimiento || null,
					sexo,
					discapacidad: discapacidad || null,
					aula_id: aulaId,
					apoderado_id: apoderadoId,
					direccion_id: direccionId,
				},
			])
			.select();
		if (studentError) {
			if (studentError.message.includes('unique')) {
				res.status(400).json({error: 'DNI duplicado'});
			} else throw studentError;
			return;
		}
		res.status(201).json({message: 'Creado', studentId: studentData[0].id});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.put('/api/students/:id', verifyAuth, verifyAdmin, async (req, res) => {
	try {
		const {
			nombres,
			apellidos,
			dni,
			fecha_nacimiento,
			sexo,
			discapacidad,
			grado,
			seccion,
		} = req.body;
		let aulaId = null;
		if (grado && seccion) {
			const {data} = await supabase
				.from('aulas')
				.select('id')
				.eq('grado', grado)
				.eq('seccion', seccion)
				.single();
			if (!data) {
				res.status(400).json({error: 'Aula no válida'});
				return;
			}
			aulaId = data.id;
		}
		const updateData = {
			nombres,
			apellidos,
			dni,
			fecha_nacimiento: fecha_nacimiento || null,
			sexo,
			discapacidad: discapacidad || null,
		};
		if (aulaId) updateData.aula_id = aulaId;
		const {error} = await supabase
			.from('estudiantes')
			.update(updateData)
			.eq('id', req.params.id);
		if (error) throw error;
		res.json({message: 'Actualizado'});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.put('/api/apoderados/:id', verifyAuth, verifyAdmin, async (req, res) => {
	try {
		const {nombres, apellidos, dni, fecha_nacimiento, celular} = req.body;
		const {error} = await supabase
			.from('apoderados')
			.update({
				nombres,
				apellidos,
				dni,
				fecha_nacimiento: fecha_nacimiento || null,
				celular: celular || null,
			})
			.eq('id', req.params.id);
		if (error) throw error;
		res.json({message: 'Actualizado'});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.put('/api/direcciones/:id', verifyAuth, verifyAdmin, async (req, res) => {
	try {
		const {departamento, provincia, distrito, domicilio} = req.body;
		const {error} = await supabase
			.from('direcciones')
			.update({
				departamento: departamento || null,
				provincia: provincia || null,
				distrito: distrito || null,
				domicilio: domicilio || null,
			})
			.eq('id', req.params.id);
		if (error) throw error;
		res.json({message: 'Actualizado'});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.delete('/api/students/:id', verifyAuth, verifyAdmin, async (req, res) => {
	try {
		const {data: student, error: getError} = await supabase
			.from('estudiantes')
			.select('apoderado_id, direccion_id')
			.eq('id', req.params.id)
			.single();
		if (getError && getError.code === 'PGRST116') {
			res.status(404).json({error: 'No encontrado'});
			return;
		}
		if (getError) throw getError;
		const {error: deleteError} = await supabase
			.from('estudiantes')
			.delete()
			.eq('id', req.params.id);
		if (deleteError) throw deleteError;
		let deletedRecords = 1;
		if (student.apoderado_id) {
			const {error} = await supabase
				.from('apoderados')
				.delete()
				.eq('id', student.apoderado_id);
			if (!error) deletedRecords++;
		}
		if (student.direccion_id) {
			const {error} = await supabase
				.from('direcciones')
				.delete()
				.eq('id', student.direccion_id);
			if (!error) deletedRecords++;
		}
		res.json({message: 'Eliminado', deletedRecords});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.get('/api/grados', verifyAuth, async (req, res) => {
	try {
		const {data, error} = await supabase
			.from('aulas')
			.select('grado')
			.order('grado', {ascending: true});
		if (error) throw error;
		const uniqueGrados = [...new Set(data.map((d) => d.grado))];
		res.json(uniqueGrados.map((grado) => ({grado})));
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.get('/api/secciones', verifyAuth, async (req, res) => {
	try {
		const {data, error} = await supabase
			.from('aulas')
			.select('seccion')
			.order('seccion', {ascending: true});
		if (error) throw error;
		const uniqueSecciones = [...new Set(data.map((d) => d.seccion))];
		res.json(uniqueSecciones.map((seccion) => ({seccion})));
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.get('/api/aula', verifyAuth, async (req, res) => {
	try {
		const {grado, seccion} = req.query;
		if (!grado || !seccion) {
			res.status(400).json({error: 'Requeridos'});
			return;
		}
		const {data, error} = await supabase
			.from('aulas')
			.select('id')
			.eq('grado', grado)
			.eq('seccion', seccion)
			.single();
		if (error && error.code === 'PGRST116') {
			res.status(404).json({error: 'No encontrada'});
			return;
		}
		if (error) throw error;
		res.json({aula_id: data.id});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.get('/api/stats', verifyAuth, async (req, res) => {
	try {
		const stats = {};
		const {count: totalStudents} = await supabase
			.from('estudiantes')
			.select('*', {count: 'exact', head: true});
		stats.totalStudents = [{count: totalStudents}];
		const {data: byGrade} = await supabase
			.from('estudiantes')
			.select('aula_id, aulas(grado)');
		const grouped = {};
		byGrade.forEach((e) => {
			const grado = e.aulas?.grado;
			if (grado) grouped[grado] = (grouped[grado] || 0) + 1;
		});
		stats.studentsByGrade = Object.entries(grouped).map(([grado, count]) => ({
			grado,
			count,
		}));
		res.json(stats);
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

// En producción, servir el índice para SPA
if (process.env.NODE_ENV === 'production') {
	app.get('*', (req, res) => {
		res.sendFile(path.join(__dirname, 'dist', 'index.html'));
	});
}

// Manejo de errores global
app.use((err, req, res, next) => {
	console.error('Error:', err.stack);
	res.status(500).json({error: 'Error interno'});
});

app.use((req, res) => {
	res.status(404).json({error: 'No encontrado'});
});

app.listen(PORT, () => {
	console.log(`Servidor en http://localhost:${PORT}`);
	console.log('Conectado a Supabase ✅');
});

process.on('SIGINT', () => {
	console.log('Cerrando...');
	process.exit(0);
});

// Rutas de autenticación (sin protección)
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para la página de login
app.get('/login', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ruta para la aplicación principal (después del login)
app.get('/app', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

app.get('/api/students', verifyAuth, async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 24;
		const offset = (page - 1) * limit;

		const {count, error: countError} = await supabase
			.from('estudiantes')
			.select('*', {count: 'exact', head: true});

		if (countError) throw countError;

		const total = count;
		const totalPages = Math.ceil(total / limit);

		const {data, error} = await supabase
			.from('estudiantes')
			.select(
				`id, apellidos, nombres, dni, fecha_nacimiento, sexo, discapacidad, aula_id, apoderado_id, direccion_id, aulas(id, grado, seccion, anio, nivel_id), apoderados(id, apellidos, nombres, dni, fecha_nacimiento, celular), direcciones(departamento, provincia, distrito, domicilio)`
			)
			.order('aulas(grado)', {ascending: true})
			.order('aulas(seccion)', {ascending: true})
			.order('apellidos', {ascending: true})
			.range(offset, offset + limit - 1);

		if (error) throw error;

		const aulaIds = data.map((e) => e.aula_id).filter(Boolean);
		let niveles = {};

		if (aulaIds.length > 0) {
			const {data: aulaData} = await supabase
				.from('aulas')
				.select('id, niveles(nombre)')
				.in('id', aulaIds);
			if (aulaData)
				aulaData.forEach((a) => {
					niveles[a.id] = a.niveles?.nombre;
				});
		}

		const students = data.map((row) => ({
			id: row.id,
			apellidos: row.apellidos,
			nombres: row.nombres,
			dni: row.dni,
			fecha_nacimiento: row.fecha_nacimiento,
			sexo: row.sexo,
			discapacidad: row.discapacidad,
			grado: row.aulas?.grado,
			seccion: row.aulas?.seccion,
			anio: row.aulas?.anio,
			nivel: niveles[row.aula_id],
			apoderado: row.apoderados
				? {
						id: row.apoderados.id,
						apellidos: row.apoderados.apellidos,
						nombres: row.apoderados.nombres,
						dni: row.apoderados.dni,
						fecha_nacimiento: row.apoderados.fecha_nacimiento,
						celular: row.apoderados.celular,
				  }
				: null,
			direccion: row.direcciones
				? {
						departamento: row.direcciones.departamento,
						provincia: row.direcciones.provincia,
						distrito: row.direcciones.distrito,
						domicilio: row.direcciones.domicilio,
				  }
				: null,
		}));

		res.json({
			students,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno del servidor'});
	}
});

app.get('/api/students/:id', verifyAuth, async (req, res) => {
	try {
		const {data, error} = await supabase
			.from('estudiantes')
			.select(
				`id, apellidos, nombres, dni, fecha_nacimiento, sexo, discapacidad, aula_id, apoderado_id, direccion_id, aulas(id, grado, seccion, anio), apoderados(id, apellidos, nombres, dni, fecha_nacimiento, celular), direcciones(departamento, provincia, distrito, domicilio)`
			)
			.eq('id', req.params.id)
			.single();
		if (error && error.code === 'PGRST116') {
			res.status(404).json({error: 'Estudiante no encontrado'});
			return;
		}
		if (error) throw error;
		let nivel = null;
		if (data.aula_id) {
			const {data: aulaData} = await supabase
				.from('aulas')
				.select('niveles(nombre)')
				.eq('id', data.aula_id)
				.single();
			if (aulaData) nivel = aulaData.niveles?.nombre;
		}
		res.json({
			id: data.id,
			apellidos: data.apellidos,
			nombres: data.nombres,
			dni: data.dni,
			fecha_nacimiento: data.fecha_nacimiento,
			sexo: data.sexo,
			discapacidad: data.discapacidad,
			grado: data.aulas?.grado,
			seccion: data.aulas?.seccion,
			anio: data.aulas?.anio,
			nivel,
			apoderado: data.apoderados
				? {
						id: data.apoderados.id,
						apellidos: data.apoderados.apellidos,
						nombres: data.apoderados.nombres,
						dni: data.apoderados.dni,
						fecha_nacimiento: data.apoderados.fecha_nacimiento,
						celular: data.apoderados.celular,
				  }
				: null,
			direccion: data.direcciones
				? {
						departamento: data.direcciones.departamento,
						provincia: data.direcciones.provincia,
						distrito: data.direcciones.distrito,
						domicilio: data.direcciones.domicilio,
				  }
				: null,
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno del servidor'});
	}
});

app.get('/api/search', verifyAuth, async (req, res) => {
	try {
		const {q, type, grado, seccion, sexo} = req.query;
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 24;
		const offset = (page - 1) * limit;

		// Paso 1: Filtrar aulas si se especifican grado/sección
		let aulaIds = null;
		if (grado || seccion) {
			let aulaQuery = supabase.from('aulas').select('id');
			if (grado) aulaQuery = aulaQuery.eq('grado', grado);
			if (seccion) aulaQuery = aulaQuery.eq('seccion', seccion);
			const {data: aulasData, error: aulasError} = await aulaQuery;
			if (aulasError) throw aulasError;
			aulaIds = aulasData.map((a) => a.id);
			if (aulaIds.length === 0) {
				// No hay aulas que coincidan
				return res.json({
					students: [],
					pagination: {
						page,
						limit,
						total: 0,
						totalPages: 0,
						hasNext: false,
						hasPrev: false,
					},
				});
			}
		}

		// Paso 2: Filtrar estudiantes
		let query = supabase
			.from('estudiantes')
			.select(
				`id, apellidos, nombres, dni, fecha_nacimiento, sexo, discapacidad, aula_id, apoderado_id, direccion_id, aulas(id, grado, seccion, anio, nivel_id), apoderados(id, apellidos, nombres, dni, fecha_nacimiento, celular), direcciones(departamento, provincia, distrito, domicilio)`,
				{count: 'exact'}
			);

		// Buscar en texto
		if (q) {
			query = query.or(
				`nombres.ilike.%${q}%,apellidos.ilike.%${q}%,dni.ilike.%${q}%`
			);
		}

		// Filtrar por aula_id si tenemos aulas
		if (aulaIds) {
			query = query.in('aula_id', aulaIds);
		}

		// Filtrar por sexo
		if (sexo) {
			query = query.eq('sexo', sexo);
		}

		// Ordenar por grado, sección y apellidos
		const {data, count, error} = await query
			.order('aulas(grado)', {ascending: true})
			.order('aulas(seccion)', {ascending: true})
			.order('apellidos', {ascending: true})
			.range(offset, offset + limit - 1);

		if (error) throw error;

		const total = count || 0;
		const totalPages = Math.ceil(total / limit);

		// Obtener niveles
		const aulasIdsData = data.map((e) => e.aula_id).filter(Boolean);
		let niveles = {};

		if (aulasIdsData.length > 0) {
			const {data: aulaData} = await supabase
				.from('aulas')
				.select('id, niveles(nombre)')
				.in('id', aulasIdsData);
			if (aulaData)
				aulaData.forEach((a) => {
					niveles[a.id] = a.niveles?.nombre;
				});
		}

		// Mapear datos
		const students = data.map((row) => ({
			id: row.id,
			apellidos: row.apellidos,
			nombres: row.nombres,
			dni: row.dni,
			fecha_nacimiento: row.fecha_nacimiento,
			sexo: row.sexo,
			discapacidad: row.discapacidad,
			grado: row.aulas?.grado,
			seccion: row.aulas?.seccion,
			anio: row.aulas?.anio,
			nivel: niveles[row.aula_id],
			apoderado: row.apoderados
				? {
						id: row.apoderados.id,
						apellidos: row.apoderados.apellidos,
						nombres: row.apoderados.nombres,
						dni: row.apoderados.dni,
						fecha_nacimiento: row.apoderados.fecha_nacimiento,
						celular: row.apoderados.celular,
				  }
				: null,
			direccion: row.direcciones
				? {
						departamento: row.direcciones.departamento,
						provincia: row.direcciones.provincia,
						distrito: row.direcciones.distrito,
						domicilio: row.direcciones.domicilio,
				  }
				: null,
		}));

		res.json({
			students,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno del servidor'});
	}
});

app.post('/api/students', verifyAuth, verifyAdmin, async (req, res) => {
	try {
		const {
			nombres,
			apellidos,
			dni,
			fecha_nacimiento,
			sexo,
			discapacidad,
			grado,
			seccion,
			apoderado,
			direccion,
		} = req.body;
		if (!nombres || !apellidos || !dni || !sexo) {
			res.status(400).json({error: 'Campos obligatorios'});
			return;
		}
		let aulaId = null;
		if (grado && seccion) {
			const {data} = await supabase
				.from('aulas')
				.select('id')
				.eq('grado', grado)
				.eq('seccion', seccion)
				.single();
			if (!data) {
				res.status(400).json({error: 'Aula no válida'});
				return;
			}
			aulaId = data.id;
		}
		let direccionId = null;
		if (
			direccion &&
			(direccion.departamento ||
				direccion.provincia ||
				direccion.distrito ||
				direccion.domicilio)
		) {
			const {data: dir} = await supabase
				.from('direcciones')
				.insert([
					{
						departamento: direccion.departamento || null,
						provincia: direccion.provincia || null,
						distrito: direccion.distrito || null,
						domicilio: direccion.domicilio || null,
					},
				])
				.select();
			if (dir) direccionId = dir[0].id;
		}
		let apoderadoId = null;
		if (apoderado && (apoderado.nombres || apoderado.apellidos)) {
			const {data: apo} = await supabase
				.from('apoderados')
				.insert([
					{
						nombres: apoderado.nombres || null,
						apellidos: apoderado.apellidos || null,
						dni: apoderado.dni || null,
						fecha_nacimiento: apoderado.fecha_nacimiento || null,
						celular: apoderado.celular || null,
					},
				])
				.select();
			if (apo) apoderadoId = apo[0].id;
		}
		const {data: studentData, error: studentError} = await supabase
			.from('estudiantes')
			.insert([
				{
					nombres,
					apellidos,
					dni,
					fecha_nacimiento: fecha_nacimiento || null,
					sexo,
					discapacidad: discapacidad || null,
					aula_id: aulaId,
					apoderado_id: apoderadoId,
					direccion_id: direccionId,
				},
			])
			.select();
		if (studentError) {
			if (studentError.message.includes('unique')) {
				res.status(400).json({error: 'DNI duplicado'});
			} else throw studentError;
			return;
		}
		res.status(201).json({message: 'Creado', studentId: studentData[0].id});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.put('/api/students/:id', verifyAuth, verifyAdmin, async (req, res) => {
	try {
		const {
			nombres,
			apellidos,
			dni,
			fecha_nacimiento,
			sexo,
			discapacidad,
			grado,
			seccion,
		} = req.body;
		let aulaId = null;
		if (grado && seccion) {
			const {data} = await supabase
				.from('aulas')
				.select('id')
				.eq('grado', grado)
				.eq('seccion', seccion)
				.single();
			if (!data) {
				res.status(400).json({error: 'Aula no válida'});
				return;
			}
			aulaId = data.id;
		}
		const updateData = {
			nombres,
			apellidos,
			dni,
			fecha_nacimiento: fecha_nacimiento || null,
			sexo,
			discapacidad: discapacidad || null,
		};
		if (aulaId) updateData.aula_id = aulaId;
		const {error} = await supabase
			.from('estudiantes')
			.update(updateData)
			.eq('id', req.params.id);
		if (error) throw error;
		res.json({message: 'Actualizado'});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.put('/api/apoderados/:id', verifyAuth, verifyAdmin, async (req, res) => {
	try {
		const {nombres, apellidos, dni, fecha_nacimiento, celular} = req.body;
		const {error} = await supabase
			.from('apoderados')
			.update({
				nombres,
				apellidos,
				dni,
				fecha_nacimiento: fecha_nacimiento || null,
				celular: celular || null,
			})
			.eq('id', req.params.id);
		if (error) throw error;
		res.json({message: 'Actualizado'});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.put('/api/direcciones/:id', verifyAuth, verifyAdmin, async (req, res) => {
	try {
		const {departamento, provincia, distrito, domicilio} = req.body;
		const {error} = await supabase
			.from('direcciones')
			.update({
				departamento: departamento || null,
				provincia: provincia || null,
				distrito: distrito || null,
				domicilio: domicilio || null,
			})
			.eq('id', req.params.id);
		if (error) throw error;
		res.json({message: 'Actualizado'});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.delete('/api/students/:id', verifyAuth, verifyAdmin, async (req, res) => {
	try {
		const {data: student, error: getError} = await supabase
			.from('estudiantes')
			.select('apoderado_id, direccion_id')
			.eq('id', req.params.id)
			.single();
		if (getError && getError.code === 'PGRST116') {
			res.status(404).json({error: 'No encontrado'});
			return;
		}
		if (getError) throw getError;
		const {error: deleteError} = await supabase
			.from('estudiantes')
			.delete()
			.eq('id', req.params.id);
		if (deleteError) throw deleteError;
		let deletedRecords = 1;
		if (student.apoderado_id) {
			const {error} = await supabase
				.from('apoderados')
				.delete()
				.eq('id', student.apoderado_id);
			if (!error) deletedRecords++;
		}
		if (student.direccion_id) {
			const {error} = await supabase
				.from('direcciones')
				.delete()
				.eq('id', student.direccion_id);
			if (!error) deletedRecords++;
		}
		res.json({message: 'Eliminado', deletedRecords});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.get('/api/grados', verifyAuth, async (req, res) => {
	try {
		const {data, error} = await supabase
			.from('aulas')
			.select('grado')
			.order('grado', {ascending: true});
		if (error) throw error;
		const uniqueGrados = [...new Set(data.map((d) => d.grado))];
		res.json(uniqueGrados.map((grado) => ({grado})));
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.get('/api/secciones', verifyAuth, async (req, res) => {
	try {
		const {data, error} = await supabase
			.from('aulas')
			.select('seccion')
			.order('seccion', {ascending: true});
		if (error) throw error;
		const uniqueSecciones = [...new Set(data.map((d) => d.seccion))];
		res.json(uniqueSecciones.map((seccion) => ({seccion})));
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.get('/api/aula', verifyAuth, async (req, res) => {
	try {
		const {grado, seccion} = req.query;
		if (!grado || !seccion) {
			res.status(400).json({error: 'Requeridos'});
			return;
		}
		const {data, error} = await supabase
			.from('aulas')
			.select('id')
			.eq('grado', grado)
			.eq('seccion', seccion)
			.single();
		if (error && error.code === 'PGRST116') {
			res.status(404).json({error: 'No encontrada'});
			return;
		}
		if (error) throw error;
		res.json({aula_id: data.id});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});

app.get('/api/stats', verifyAuth, async (req, res) => {
	try {
		const stats = {};
		const {count: totalStudents} = await supabase
			.from('estudiantes')
			.select('*', {count: 'exact', head: true});
		stats.totalStudents = [{count: totalStudents}];
		const {data: byGrade} = await supabase
			.from('estudiantes')
			.select('aula_id, aulas(grado)');
		const grouped = {};
		byGrade.forEach((e) => {
			const grado = e.aulas?.grado;
			if (grado) grouped[grado] = (grouped[grado] || 0) + 1;
		});
		stats.studentsByGrade = Object.entries(grouped).map(([grado, count]) => ({
			grado,
			count,
		}));
		res.json(stats);
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({error: 'Error interno'});
	}
});
