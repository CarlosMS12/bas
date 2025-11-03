/**
 * Servicios API - Llamadas directas a Supabase
 * Elimina la necesidad de un servidor backend Express
 */

import {supabase} from '../lib/supabase';

/**
 * Estudiantes - GET todos con paginación
 */
export async function getStudents(page = 1, limit = 24) {
	try {
		const offset = (page - 1) * limit;

		// Contar total de estudiantes
		const {count, error: countError} = await supabase
			.from('estudiantes')
			.select('*', {count: 'exact', head: true});

		if (countError) throw countError;

		const total = count;
		const totalPages = Math.ceil(total / limit);

		// Obtener estudiantes con relaciones
		const {data, error} = await supabase
			.from('estudiantes')
			.select(
				`
				id,
				apellidos,
				nombres,
				dni,
				fecha_nacimiento,
				sexo,
				discapacidad,
				aula_id,
				apoderado_id,
				direccion_id,
				aulas(id, grado, seccion, anio, nivel_id),
				apoderados(id, apellidos, nombres, dni, fecha_nacimiento, celular),
				direcciones(departamento, provincia, distrito, domicilio)
			`
			)
			.order('aulas(grado)', {ascending: true})
			.order('aulas(seccion)', {ascending: true})
			.order('apellidos', {ascending: true})
			.range(offset, offset + limit - 1);

		if (error) throw error;

		// Obtener niveles
		const aulaIds = data.map((e) => e.aula_id).filter(Boolean);
		let niveles = {};

		if (aulaIds.length > 0) {
			const {data: aulaData} = await supabase
				.from('aulas')
				.select('id, niveles(nombre)')
				.in('id', aulaIds);

			if (aulaData) {
				aulaData.forEach((a) => {
					niveles[a.id] = a.niveles?.nombre;
				});
			}
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
						id: row.direccion_id,
						departamento: row.direcciones.departamento,
						provincia: row.direcciones.provincia,
						distrito: row.direcciones.distrito,
						domicilio: row.direcciones.domicilio,
				  }
				: null,
		}));

		return {
			students,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		};
	} catch (error) {
		console.error('Error al obtener estudiantes:', error);
		throw new Error(error.message || 'Error al obtener estudiantes');
	}
}

/**
 * Estudiantes - GET por ID
 */
export async function getStudentById(id) {
	try {
		const {data, error} = await supabase
			.from('estudiantes')
			.select(
				`
				id,
				apellidos,
				nombres,
				dni,
				fecha_nacimiento,
				sexo,
				discapacidad,
				aula_id,
				apoderado_id,
				direccion_id,
				aulas(id, grado, seccion, anio),
				apoderados(id, apellidos, nombres, dni, fecha_nacimiento, celular),
				direcciones(departamento, provincia, distrito, domicilio)
			`
			)
			.eq('id', id)
			.single();

		if (error && error.code === 'PGRST116') {
			throw new Error('Estudiante no encontrado');
		}
		if (error) throw error;

		// Obtener nivel
		let nivel = null;
		if (data.aula_id) {
			const {data: aulaData} = await supabase
				.from('aulas')
				.select('niveles(nombre)')
				.eq('id', data.aula_id)
				.single();

			if (aulaData) nivel = aulaData.niveles?.nombre;
		}

		return {
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
						id: data.direccion_id,
						departamento: data.direcciones.departamento,
						provincia: data.direcciones.provincia,
						distrito: data.direcciones.distrito,
						domicilio: data.direcciones.domicilio,
				  }
				: null,
		};
	} catch (error) {
		console.error('Error al obtener estudiante:', error);
		throw new Error(error.message || 'Error al obtener estudiante');
	}
}

/**
 * Estudiantes - POST crear
 */
export async function createStudent(studentData) {
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
		} = studentData;

		if (!nombres || !apellidos || !dni || !sexo) {
			throw new Error('Campos obligatorios: nombres, apellidos, dni, sexo');
		}

		// Obtener aula_id si se proporcionan grado y sección
		let aulaId = null;
		if (grado && seccion) {
			const {data: aulaData} = await supabase
				.from('aulas')
				.select('id')
				.eq('grado', grado)
				.eq('seccion', seccion)
				.single();

			if (!aulaData) {
				throw new Error('Combinación de grado y sección no válida');
			}
			aulaId = aulaData.id;
		}

		// Crear dirección si existe
		let direccionId = null;
		if (
			direccion &&
			(direccion.departamento ||
				direccion.provincia ||
				direccion.distrito ||
				direccion.domicilio)
		) {
			const {data: dir, error: dirError} = await supabase
				.from('direcciones')
				.insert([
					{
						departamento: direccion.departamento || null,
						provincia: direccion.provincia || null,
						distrito: direccion.distrito || null,
						domicilio: direccion.domicilio || null,
					},
				])
				.select()
				.single();

			if (dirError) throw dirError;
			direccionId = dir.id;
		}

		// Crear apoderado si existe
		let apoderadoId = null;
		if (apoderado && (apoderado.nombres || apoderado.apellidos)) {
			const {data: apo, error: apoError} = await supabase
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
				.select()
				.single();

			if (apoError) throw apoError;
			apoderadoId = apo.id;
		}

		// Crear estudiante
		const {data: studentResult, error: studentError} = await supabase
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
			.select()
			.single();

		if (studentError) {
			if (studentError.message.includes('unique')) {
				throw new Error('Ya existe un estudiante con este DNI');
			}
			throw studentError;
		}

		return {
			message: 'Estudiante creado exitosamente',
			studentId: studentResult.id,
		};
	} catch (error) {
		console.error('Error al crear estudiante:', error);
		throw new Error(error.message || 'Error al crear estudiante');
	}
}

/**
 * Estudiantes - PUT actualizar
 */
export async function updateStudent(id, studentData) {
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
		} = studentData;

		// Obtener aula_id si se proporcionan grado y sección
		let aulaId = null;
		if (grado && seccion) {
			const {data: aulaData} = await supabase
				.from('aulas')
				.select('id')
				.eq('grado', grado)
				.eq('seccion', seccion)
				.single();

			if (!aulaData) {
				throw new Error('Combinación de grado y sección no válida');
			}
			aulaId = aulaData.id;
		}

		const updateData = {
			nombres,
			apellidos,
			dni,
			fecha_nacimiento: fecha_nacimiento || null,
			sexo,
			discapacidad: discapacidad || null,
		};

		if (aulaId) {
			updateData.aula_id = aulaId;
		}

		const {error} = await supabase
			.from('estudiantes')
			.update(updateData)
			.eq('id', id);

		if (error) throw error;

		return {message: 'Estudiante actualizado exitosamente'};
	} catch (error) {
		console.error('Error al actualizar estudiante:', error);
		throw new Error(error.message || 'Error al actualizar estudiante');
	}
}

/**
 * Estudiantes - DELETE
 */
export async function deleteStudent(id) {
	try {
		// Obtener datos del estudiante para eliminar relaciones
		const {data: student, error: getError} = await supabase
			.from('estudiantes')
			.select('apoderado_id, direccion_id')
			.eq('id', id)
			.single();

		if (getError && getError.code === 'PGRST116') {
			throw new Error('Estudiante no encontrado');
		}
		if (getError) throw getError;

		// Eliminar estudiante
		const {error: deleteError} = await supabase
			.from('estudiantes')
			.delete()
			.eq('id', id);

		if (deleteError) throw deleteError;

		let deletedRecords = 1;

		// Eliminar apoderado si existe
		if (student.apoderado_id) {
			const {error} = await supabase
				.from('apoderados')
				.delete()
				.eq('id', student.apoderado_id);

			if (!error) deletedRecords++;
		}

		// Eliminar dirección si existe
		if (student.direccion_id) {
			const {error} = await supabase
				.from('direcciones')
				.delete()
				.eq('id', student.direccion_id);

			if (!error) deletedRecords++;
		}

		return {
			message: 'Estudiante eliminado exitosamente',
			deletedRecords,
		};
	} catch (error) {
		console.error('Error al eliminar estudiante:', error);
		throw new Error(error.message || 'Error al eliminar estudiante');
	}
}

/**
 * Búsqueda - GET con filtros
 */
export async function searchStudents(filters = {}, page = 1, limit = 24) {
	try {
		const offset = (page - 1) * limit;
		const {search, grado, seccion, sexo} = filters;

		// Filtrar aulas si se especifican grado/sección
		let aulaIds = null;
		if (grado || seccion) {
			let aulaQuery = supabase.from('aulas').select('id');

			if (grado) aulaQuery = aulaQuery.eq('grado', grado);
			if (seccion) aulaQuery = aulaQuery.eq('seccion', seccion);

			const {data: aulasData, error: aulasError} = await aulaQuery;

			if (aulasError) throw aulasError;

			aulaIds = aulasData.map((a) => a.id);

			if (aulaIds.length === 0) {
				return {
					students: [],
					pagination: {
						page,
						limit,
						total: 0,
						totalPages: 0,
						hasNext: false,
						hasPrev: false,
					},
				};
			}
		}

		// Construir query de estudiantes
		let query = supabase.from('estudiantes').select(
			`
				id,
				apellidos,
				nombres,
				dni,
				fecha_nacimiento,
				sexo,
				discapacidad,
				aula_id,
				apoderado_id,
				direccion_id,
				aulas(id, grado, seccion, anio, nivel_id),
				apoderados(id, apellidos, nombres, dni, fecha_nacimiento, celular),
				direcciones(departamento, provincia, distrito, domicilio)
			`,
			{count: 'exact'}
		);

		// Buscar en texto
		if (search) {
			query = query.or(
				`nombres.ilike.%${search}%,apellidos.ilike.%${search}%,dni.ilike.%${search}%`
			);
		}

		// Filtrar por aula_id
		if (aulaIds) {
			query = query.in('aula_id', aulaIds);
		}

		// Filtrar por sexo
		if (sexo) {
			query = query.eq('sexo', sexo);
		}

		// Ordenar y paginar
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

			if (aulaData) {
				aulaData.forEach((a) => {
					niveles[a.id] = a.niveles?.nombre;
				});
			}
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
						id: row.direccion_id,
						departamento: row.direcciones.departamento,
						provincia: row.direcciones.provincia,
						distrito: row.direcciones.distrito,
						domicilio: row.direcciones.domicilio,
				  }
				: null,
		}));

		return {
			students,
			pagination: {
				page,
				limit,
				total,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		};
	} catch (error) {
		console.error('Error en búsqueda:', error);
		throw new Error(error.message || 'Error en la búsqueda');
	}
}

/**
 * Grados - GET todos
 */
export async function getGrados() {
	try {
		const {data, error} = await supabase
			.from('aulas')
			.select('grado')
			.order('grado', {ascending: true});

		if (error) throw error;

		const uniqueGrados = [...new Set(data.map((d) => d.grado))];
		return uniqueGrados.map((grado) => ({grado}));
	} catch (error) {
		console.error('Error al obtener grados:', error);
		throw new Error(error.message || 'Error al obtener grados');
	}
}

/**
 * Secciones - GET todas
 */
export async function getSecciones() {
	try {
		const {data, error} = await supabase
			.from('aulas')
			.select('seccion')
			.order('seccion', {ascending: true});

		if (error) throw error;

		const uniqueSecciones = [...new Set(data.map((d) => d.seccion))];
		return uniqueSecciones.map((seccion) => ({seccion}));
	} catch (error) {
		console.error('Error al obtener secciones:', error);
		throw new Error(error.message || 'Error al obtener secciones');
	}
}

/**
 * Aulas - GET por grado y sección
 */
export async function getAulaByGradoSeccion(grado, seccion) {
	try {
		if (!grado || !seccion) {
			throw new Error('Grado y sección son requeridos');
		}

		const {data, error} = await supabase
			.from('aulas')
			.select('id')
			.eq('grado', grado)
			.eq('seccion', seccion)
			.single();

		if (error && error.code === 'PGRST116') {
			throw new Error('Aula no encontrada');
		}
		if (error) throw error;

		return {aula_id: data.id};
	} catch (error) {
		console.error('Error al obtener aula:', error);
		throw new Error(error.message || 'Error al obtener aula');
	}
}

/**
 * Estadísticas - GET
 */
export async function getStats() {
	try {
		const stats = {};

		// Total de estudiantes
		const {count: totalStudents} = await supabase
			.from('estudiantes')
			.select('*', {count: 'exact', head: true});

		stats.totalStudents = [{count: totalStudents}];

		// Estudiantes por grado
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

		return stats;
	} catch (error) {
		console.error('Error al obtener estadísticas:', error);
		throw new Error(error.message || 'Error al obtener estadísticas');
	}
}

/**
 * Apoderados - PUT actualizar
 */
export async function updateApoderado(id, apoderadoData) {
	try {
		const {nombres, apellidos, dni, fecha_nacimiento, celular} = apoderadoData;

		const {error} = await supabase
			.from('apoderados')
			.update({
				nombres,
				apellidos,
				dni,
				fecha_nacimiento: fecha_nacimiento || null,
				celular: celular || null,
			})
			.eq('id', id);

		if (error) throw error;

		return {message: 'Apoderado actualizado exitosamente'};
	} catch (error) {
		console.error('Error al actualizar apoderado:', error);
		throw new Error(error.message || 'Error al actualizar apoderado');
	}
}

/**
 * Direcciones - PUT actualizar
 */
export async function updateDireccion(id, direccionData) {
	try {
		const {departamento, provincia, distrito, domicilio} = direccionData;

		const {error} = await supabase
			.from('direcciones')
			.update({
				departamento: departamento || null,
				provincia: provincia || null,
				distrito: distrito || null,
				domicilio: domicilio || null,
			})
			.eq('id', id);

		if (error) throw error;

		return {message: 'Dirección actualizada exitosamente'};
	} catch (error) {
		console.error('Error al actualizar dirección:', error);
		throw new Error(error.message || 'Error al actualizar dirección');
	}
}
