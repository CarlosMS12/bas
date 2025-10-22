/**
 * Servicios API - Llamadas directas a Supabase desde Vanilla JS
 * Reemplaza las llamadas al backend Express
 */

const API_Services = {
	/**
	 * Estudiantes - GET todos con paginación eficiente
	 * Ordena en la base de datos y trae solo los necesarios
	 */
	async getStudents(page = 1, limit = 24) {
		try {
			const offset = (page - 1) * limit;

			// Paso 1: Obtener TODOS los estudiantes con grado/sección para ordenar (solo IDs y campos de orden)
			// Usar paginación interna para obtener TODOS los registros (sin límite del servidor)
			let allSortData = [];
			let fetchMore = true;
			let currentPage = 0;
			const batchSize = 1000; // Tamaño de lote por petición

			while (fetchMore) {
				const {data: sortData, error: sortError} = await supabaseClient
					.from('estudiantes')
					.select('id, apellidos, aula_id, aulas(grado, seccion)')
					.range(currentPage * batchSize, (currentPage + 1) * batchSize - 1);

				if (sortError) throw sortError;

				if (sortData && sortData.length > 0) {
					allSortData = allSortData.concat(sortData);
					currentPage++;

					// Si recibimos menos registros que el tamaño del lote, ya no hay más
					if (sortData.length < batchSize) {
						fetchMore = false;
					}
				} else {
					fetchMore = false;
				}
			}

			console.log(
				`[getStudents] Total de registros obtenidos: ${allSortData.length}`
			);

			// Ordenar en el cliente
			const sortedData = allSortData.sort((a, b) => {
				const gradoA = a.aulas?.grado || '';
				const gradoB = b.aulas?.grado || '';

				const numA = parseInt(gradoA.replace(/\D/g, '')) || 999;
				const numB = parseInt(gradoB.replace(/\D/g, '')) || 999;

				if (numA !== numB) return numA - numB;

				const seccionA = a.aulas?.seccion || '';
				const seccionB = b.aulas?.seccion || '';
				if (seccionA !== seccionB) return seccionA.localeCompare(seccionB);

				return a.apellidos.localeCompare(b.apellidos);
			});

			const total = sortedData.length;
			const totalPages = Math.ceil(total / limit);

			// Validar que la página solicitada existe
			if (page > totalPages && total > 0) {
				throw new Error(`Página ${page} no existe. Total de páginas: ${totalPages}`);
			}

			// Paso 2: Obtener solo los IDs de la página actual
			const pageIds = sortedData.slice(offset, offset + limit).map((s) => s.id);

			if (pageIds.length === 0) {
				return {
					students: [],
					pagination: {
						page,
						limit,
						total,
						totalPages,
						hasNext: false,
						hasPrev: page > 1,
					},
				};
			}

			// Paso 3: Obtener datos completos solo de esos IDs
			const {data, error} = await supabaseClient
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
				.in('id', pageIds);

			if (error) throw error;

			// Obtener niveles
			const aulaIds = data.map((e) => e.aula_id).filter(Boolean);
			let niveles = {};

			if (aulaIds.length > 0) {
				const {data: aulaData} = await supabaseClient
					.from('aulas')
					.select('id, niveles(nombre)')
					.in('id', aulaIds);

				if (aulaData) {
					aulaData.forEach((a) => {
						niveles[a.id] = a.niveles?.nombre;
					});
				}
			}

			// Crear mapa de estudiantes
			const studentsMap = new Map();
			data.forEach((row) => {
				studentsMap.set(row.id, {
					id: row.id,
					apellidos: row.apellidos,
					nombres: row.nombres,
					dni: row.dni,
					fecha_nacimiento: row.fecha_nacimiento,
					sexo: row.sexo,
					discapacidad: row.discapacidad,
					grado: row.aulas?.grado || '',
					seccion: row.aulas?.seccion || '',
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
				});
			});

			// Ordenar según pageIds (mantener el orden correcto)
			const students = pageIds.map((id) => studentsMap.get(id)).filter(Boolean);

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
	},

	/**
	 * Estudiantes - GET por ID
	 */
	async getStudentById(id) {
		try {
			const {data, error} = await supabaseClient
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
				const {data: aulaData} = await supabaseClient
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
	},

	/**
	 * Búsqueda - GET con filtros
	 * Optimizado: trae solo campos necesarios para ordenar, luego datos completos paginados
	 */
	async searchStudents(filters = {}, page = 1, limit = 24) {
		try {
			const offset = (page - 1) * limit;
			const {search, grado, seccion, sexo} = filters;

			// Paso 1: Obtener IDs con campos de orden (ligero)
			// Usar paginación interna para obtener TODOS los registros (sin límite del servidor)
			let allSortData = [];
			let fetchMore = true;
			let currentPage = 0;
			const batchSize = 1000; // Tamaño de lote por petición

			while (fetchMore) {
				let query = supabaseClient
					.from('estudiantes')
					.select('id, apellidos, aula_id, aulas(grado, seccion)')
					.range(currentPage * batchSize, (currentPage + 1) * batchSize - 1);

				// Aplicar filtros de texto
				if (search) {
					query = query.or(
						`nombres.ilike.%${search}%,apellidos.ilike.%${search}%,dni.ilike.%${search}%`
					);
				}

				// Filtrar por sexo
				if (sexo) {
					query = query.eq('sexo', sexo);
				}

				const {data: sortData, error: sortError} = await query;

				if (sortError) throw sortError;

				if (sortData && sortData.length > 0) {
					allSortData = allSortData.concat(sortData);
					currentPage++;

					// Si recibimos menos registros que el tamaño del lote, ya no hay más
					if (sortData.length < batchSize) {
						fetchMore = false;
					}
				} else {
					fetchMore = false;
				}
			}

			console.log(
				`[searchStudents] Total de registros obtenidos: ${
					allSortData.length
				}, Filtros aplicados: ${JSON.stringify(filters)}`
			);

			if (!allSortData || allSortData.length === 0) {
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

			// Filtrar por grado/sección si se especifica
			let filteredData = allSortData.filter((student) => {
				if (grado && student.aulas?.grado !== grado) return false;
				if (seccion && student.aulas?.seccion !== seccion) return false;
				return true;
			});

			// Ordenar
			filteredData.sort((a, b) => {
				const gradoA = a.aulas?.grado || '';
				const gradoB = b.aulas?.grado || '';

				const numA = parseInt(gradoA.replace(/\D/g, '')) || 999;
				const numB = parseInt(gradoB.replace(/\D/g, '')) || 999;

				if (numA !== numB) return numA - numB;

				const seccionA = a.aulas?.seccion || '';
				const seccionB = b.aulas?.seccion || '';
				if (seccionA !== seccionB) return seccionA.localeCompare(seccionB);

				return a.apellidos.localeCompare(b.apellidos);
			});

			const total = filteredData.length;
			const totalPages = Math.ceil(total / limit);

			// Validar página
			if (page > totalPages && total > 0) {
				throw new Error(`Página ${page} no existe. Total de páginas: ${totalPages}`);
			}

			// Paso 2: Obtener IDs de la página actual
			const pageIds = filteredData.slice(offset, offset + limit).map((s) => s.id);

			if (pageIds.length === 0) {
				return {
					students: [],
					pagination: {
						page,
						limit,
						total,
						totalPages,
						hasNext: false,
						hasPrev: page > 1,
					},
				};
			}

			// Paso 3: Obtener datos completos
			const {data, error} = await supabaseClient
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
				.in('id', pageIds);

			if (error) throw error;

			// Obtener niveles
			const aulaIds = data.map((e) => e.aula_id).filter(Boolean);
			let niveles = {};

			if (aulaIds.length > 0) {
				const {data: aulaData} = await supabaseClient
					.from('aulas')
					.select('id, niveles(nombre)')
					.in('id', aulaIds);

				if (aulaData) {
					aulaData.forEach((a) => {
						niveles[a.id] = a.niveles?.nombre;
					});
				}
			}

			// Crear mapa de estudiantes
			const studentsMap = new Map();
			data.forEach((row) => {
				studentsMap.set(row.id, {
					id: row.id,
					apellidos: row.apellidos,
					nombres: row.nombres,
					dni: row.dni,
					fecha_nacimiento: row.fecha_nacimiento,
					sexo: row.sexo,
					discapacidad: row.discapacidad,
					grado: row.aulas?.grado || '',
					seccion: row.aulas?.seccion || '',
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
				});
			});

			// Ordenar según pageIds
			const students = pageIds.map((id) => studentsMap.get(id)).filter(Boolean);

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
	},

	/**
	 * Grados - GET todos
	 */
	async getGrados() {
		try {
			const {data, error} = await supabaseClient
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
	},

	/**
	 * Secciones - GET todas
	 */
	async getSecciones() {
		try {
			const {data, error} = await supabaseClient
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
	},

	/**
	 * Estudiantes - POST crear
	 */
	async createStudent(studentData) {
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

			// Obtener aula_id
			let aulaId = null;
			if (grado && seccion) {
				const {data: aulaData} = await supabaseClient
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
				const {data: dir, error: dirError} = await supabaseClient
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
				const {data: apo, error: apoError} = await supabaseClient
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
			const {data: studentResult, error: studentError} = await supabaseClient
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
	},

	/**
	 * Estudiantes - PUT actualizar
	 */
	async updateStudent(id, studentData) {
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

			let aulaId = null;
			if (grado && seccion) {
				const {data: aulaData} = await supabaseClient
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

			const {error} = await supabaseClient
				.from('estudiantes')
				.update(updateData)
				.eq('id', id);

			if (error) throw error;

			return {message: 'Estudiante actualizado exitosamente'};
		} catch (error) {
			console.error('Error al actualizar estudiante:', error);
			throw new Error(error.message || 'Error al actualizar estudiante');
		}
	},

	/**
	 * Apoderados - PUT actualizar
	 */
	async updateApoderado(id, apoderadoData) {
		try {
			const {nombres, apellidos, dni, fecha_nacimiento, celular} = apoderadoData;

			const {error} = await supabaseClient
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
	},

	/**
	 * Direcciones - PUT actualizar
	 */
	async updateDireccion(id, direccionData) {
		try {
			const {departamento, provincia, distrito, domicilio} = direccionData;

			const {error} = await supabaseClient
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
	},

	/**
	 * Estudiantes - DELETE
	 */
	async deleteStudent(id) {
		try {
			// Obtener datos del estudiante
			const {data: student, error: getError} = await supabaseClient
				.from('estudiantes')
				.select('apoderado_id, direccion_id')
				.eq('id', id)
				.single();

			if (getError && getError.code === 'PGRST116') {
				throw new Error('Estudiante no encontrado');
			}
			if (getError) throw getError;

			// Eliminar estudiante
			const {error: deleteError} = await supabaseClient
				.from('estudiantes')
				.delete()
				.eq('id', id);

			if (deleteError) throw deleteError;

			let deletedRecords = 1;

			// Eliminar apoderado si existe
			if (student.apoderado_id) {
				const {error} = await supabaseClient
					.from('apoderados')
					.delete()
					.eq('id', student.apoderado_id);

				if (!error) deletedRecords++;
			}

			// Eliminar dirección si existe
			if (student.direccion_id) {
				const {error} = await supabaseClient
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
	},

	/**
	 * Estadísticas - GET
	 */
	async getStats() {
		try {
			const stats = {};

			// Total de estudiantes
			const {count: totalStudents} = await supabaseClient
				.from('estudiantes')
				.select('*', {count: 'exact', head: true});

			stats.totalStudents = [{count: totalStudents}];

			// Estudiantes por grado
			const {data: byGrade} = await supabaseClient
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
	},
};

// Exponer globalmente
window.API_Services = API_Services;
