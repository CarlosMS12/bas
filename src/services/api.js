/**
 * Servicios API
 * Centraliza todas las llamadas HTTP a la API del backend
 */

import SessionManager from '../utils/SessionManager';

const API_BASE_URL = '/api';

/**
 * Helper para obtener headers de autenticación
 */
function getAuthHeaders() {
	const authHeader = SessionManager.getAuthHeader();
	const headers = {'Content-Type': 'application/json'};
	if (authHeader) {
		Object.assign(headers, authHeader);
	}
	return headers;
}

/**
 * Estudiantes - GET todos
 */
export async function getStudents(page = 1, limit = 24) {
	const response = await fetch(
		`${API_BASE_URL}/students?page=${page}&limit=${limit}`,
		{headers: getAuthHeaders()}
	);

	if (!response.ok) {
		throw new Error('Error al obtener estudiantes');
	}

	return response.json();
}

/**
 * Estudiantes - GET por ID
 */
export async function getStudentById(id) {
	const response = await fetch(`${API_BASE_URL}/students/${id}`, {
		headers: getAuthHeaders(),
	});

	if (!response.ok) {
		throw new Error('Estudiante no encontrado');
	}

	return response.json();
}

/**
 * Estudiantes - POST crear
 */
export async function createStudent(studentData) {
	const response = await fetch(`${API_BASE_URL}/students`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(studentData),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Error al crear estudiante');
	}

	return response.json();
}

/**
 * Estudiantes - PUT actualizar
 */
export async function updateStudent(id, studentData) {
	const response = await fetch(`${API_BASE_URL}/students/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(studentData),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Error al actualizar estudiante');
	}

	return response.json();
}

/**
 * Estudiantes - DELETE
 */
export async function deleteStudent(id) {
	const response = await fetch(`${API_BASE_URL}/students/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders(),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Error al eliminar estudiante');
	}

	return response.json();
}

/**
 * Búsqueda - GET con filtros
 */
export async function searchStudents(filters = {}, page = 1, limit = 24) {
	const params = new URLSearchParams({
		page: page.toString(),
		limit: limit.toString(),
	});

	if (filters.search) params.append('q', filters.search);
	if (filters.grado) params.append('grado', filters.grado);
	if (filters.seccion) params.append('seccion', filters.seccion);
	if (filters.sexo) params.append('sexo', filters.sexo);
	if (filters.searchType) params.append('type', filters.searchType);

	const response = await fetch(`${API_BASE_URL}/search?${params}`, {
		headers: getAuthHeaders(),
	});

	if (!response.ok) {
		throw new Error('Error en la búsqueda');
	}

	return response.json();
}

/**
 * Grados - GET todos
 */
export async function getGrados() {
	const response = await fetch(`${API_BASE_URL}/grados`, {
		headers: getAuthHeaders(),
	});

	if (!response.ok) {
		throw new Error('Error al obtener grados');
	}

	return response.json();
}

/**
 * Secciones - GET todas
 */
export async function getSecciones() {
	const response = await fetch(`${API_BASE_URL}/secciones`, {
		headers: getAuthHeaders(),
	});

	if (!response.ok) {
		throw new Error('Error al obtener secciones');
	}

	return response.json();
}

/**
 * Aulas - GET por grado y sección
 */
export async function getAulaByGradoSeccion(grado, seccion) {
	const response = await fetch(
		`${API_BASE_URL}/aula?grado=${grado}&seccion=${seccion}`,
		{headers: getAuthHeaders()}
	);

	if (!response.ok) {
		throw new Error('Aula no encontrada');
	}

	return response.json();
}

/**
 * Estadísticas - GET
 */
export async function getStats() {
	const response = await fetch(`${API_BASE_URL}/stats`, {
		headers: getAuthHeaders(),
	});

	if (!response.ok) {
		throw new Error('Error al obtener estadísticas');
	}

	return response.json();
}

/**
 * Apoderados - PUT actualizar
 */
export async function updateApoderado(id, apoderadoData) {
	const response = await fetch(`${API_BASE_URL}/apoderados/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(apoderadoData),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Error al actualizar apoderado');
	}

	return response.json();
}

/**
 * Direcciones - PUT actualizar
 */
export async function updateDireccion(id, direccionData) {
	const response = await fetch(`${API_BASE_URL}/direcciones/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(direccionData),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Error al actualizar dirección');
	}

	return response.json();
}
