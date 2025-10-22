import React, {useState, useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {useStudentContext} from '../context/StudentContext';
import {useCache, useRequestController} from '../hooks/useCache';
import {StudentCard} from '../components/StudentCard';
import {SearchAndFilters} from '../components/SearchAndFilters';
import {Pagination} from '../components/Pagination';
import {StudentDetailModal} from '../components/StudentDetailModal';
import {AddStudentModal} from '../components/AddStudentModal';
import {Notification, LoadingSpinner} from '../components/Common';
import * as api from '../services/api';

export function AppPage() {
	const navigate = useNavigate();
	const {user, logout} = useAuth();
	const {
		students,
		setStudents,
		grados,
		setGrados,
		secciones,
		setSecciones,
		pagination,
		updatePagination,
		filters,
		setIsLoading,
		isLoading,
	} = useStudentContext();

	const cache = useCache();
	const requestController = useRequestController();

	const [selectedStudent, setSelectedStudent] = useState(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [notification, setNotification] = useState(null);
	const [isSavingStudent, setIsSavingStudent] = useState(false);

	// Cargar grados y secciones una sola vez
	useEffect(() => {
		loadFilterOptions();
	}, []);

	// Cargar estudiantes cuando cambian los filtros o paginación
	useEffect(() => {
		loadStudents(pagination.page, pagination.limit);
	}, [filters, pagination.page, pagination.limit]);

	const loadFilterOptions = async () => {
		const token = requestController.startRequest(
			requestController.tokens.filterOptions
		);

		try {
			const [gradosData, seccionesData] = await Promise.all([
				api.getGrados(),
				api.getSecciones(),
			]);

			if (!requestController.isActive(token)) return;

			setGrados(Array.isArray(gradosData) ? gradosData : []);
			setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
		} catch (error) {
			if (requestController.isActive(token)) {
				showNotification('Error al cargar opciones de filtro', 'error');
			}
		}
	};

	const loadStudents = async (page = 1, limit = 24) => {
		const token = requestController.startRequest(
			requestController.tokens.studentsList
		);

		try {
			setIsLoading(true);

			const hasFilters =
				filters.search || filters.grado || filters.seccion || filters.sexo;

			let data;
			if (hasFilters) {
				data = await api.searchStudents(filters, page, limit);
			} else {
				data = await api.getStudents(page, limit);
			}

			if (!requestController.isActive(token)) return;

			setStudents(data.students || []);
			updatePagination(data.pagination);
		} catch (error) {
			if (requestController.isActive(token)) {
				showNotification('Error al cargar estudiantes: ' + error.message, 'error');
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearch = useCallback(
		(newFilters) => {
			updatePagination({page: 1});
			// Los filtros se actualizan en el contexto, lo que dispara el useEffect
		},
		[updatePagination]
	);

	const handleStudentClick = (student) => {
		setSelectedStudent(student);
		setIsDetailModalOpen(true);
	};

	const handleSaveStudent = async (updatedStudent) => {
		try {
			setIsSavingStudent(true);

			const studentData = {
				nombres: updatedStudent.nombres,
				apellidos: updatedStudent.apellidos,
				dni: updatedStudent.dni,
				fecha_nacimiento: updatedStudent.fecha_nacimiento || null,
				sexo: updatedStudent.sexo,
				discapacidad: updatedStudent.discapacidad || null,
				grado: updatedStudent.grado || null,
				seccion: updatedStudent.seccion || null,
			};

			await api.updateStudent(updatedStudent.id, studentData);

			if (updatedStudent.apoderado && updatedStudent.apoderado.id) {
				const apoderadoData = {
					nombres: updatedStudent.apoderado.nombres,
					apellidos: updatedStudent.apoderado.apellidos,
					dni: updatedStudent.apoderado.dni,
					fecha_nacimiento: updatedStudent.apoderado.fecha_nacimiento || null,
					celular: updatedStudent.apoderado.celular || null,
				};

				await api.updateApoderado(updatedStudent.apoderado.id, apoderadoData);
			}

			if (
				updatedStudent.direccion &&
				(updatedStudent.direccion.id || updatedStudent.direccion_id)
			) {
				const direccionId = updatedStudent.direccion.id || updatedStudent.direccion_id;
				const direccionData = {
					departamento: updatedStudent.direccion.departamento || null,
					provincia: updatedStudent.direccion.provincia || null,
					distrito: updatedStudent.direccion.distrito || null,
					domicilio: updatedStudent.direccion.domicilio || null,
				};

				await api.updateDireccion(direccionId, direccionData);
			}

			cache.invalidate('students');
			await loadStudents(pagination.page, pagination.limit);
			setIsDetailModalOpen(false);
			showNotification('Estudiante actualizado exitosamente', 'success');
		} catch (error) {
			showNotification('Error al guardar cambios: ' + error.message, 'error');
		} finally {
			setIsSavingStudent(false);
		}
	};

	const handleDeleteStudent = async (studentId) => {
		try {
			setIsSavingStudent(true);
			await api.deleteStudent(studentId);
			cache.invalidate('students');
			await loadStudents(pagination.page, pagination.limit);
			setIsDetailModalOpen(false);
			showNotification('Estudiante eliminado exitosamente', 'success');
		} catch (error) {
			showNotification('Error al eliminar estudiante: ' + error.message, 'error');
		} finally {
			setIsSavingStudent(false);
		}
	};

	const handleAddStudent = async (formData) => {
		try {
			setIsSavingStudent(true);

			const apoderadoData =
				formData.apoderado.nombres || formData.apoderado.apellidos
					? formData.apoderado
					: null;
			const direccionData =
				formData.direccion.departamento ||
				formData.direccion.provincia ||
				formData.direccion.distrito ||
				formData.direccion.domicilio
					? formData.direccion
					: null;

			const studentData = {
				nombres: formData.nombres,
				apellidos: formData.apellidos,
				dni: formData.dni,
				fecha_nacimiento: formData.fecha_nacimiento || null,
				sexo: formData.sexo,
				discapacidad: formData.discapacidad || null,
				grado: formData.grado || null,
				seccion: formData.seccion || null,
				apoderado: apoderadoData,
				direccion: direccionData,
			};

			await api.createStudent(studentData);
			cache.invalidate('students');
			await loadStudents(1, pagination.limit);
			setIsAddModalOpen(false);
			showNotification('Estudiante creado exitosamente', 'success');
		} catch (error) {
			showNotification('Error al crear estudiante: ' + error.message, 'error');
		} finally {
			setIsSavingStudent(false);
		}
	};

	const handleLogout = async () => {
		await logout();
		navigate('/login');
	};

	const showNotification = (message, type = 'error') => {
		setNotification({message, type});
		setTimeout(() => setNotification(null), 5000);
	};

	// Nota: no hacemos un return temprano aquí porque eso desmonta
	// todo el layout (incluyendo el input de búsqueda) y provoca
	// que el foco se pierda cada vez que hay una búsqueda sin resultados.
	// En su lugar mostramos el spinner únicamente en el área de resultados
	// cuando corresponde.

	return (
		<div style={{minHeight: '100vh', background: '#fafafa'}}>
			{/* Header */}
			<header
				style={{
					background: 'white',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
					borderBottom: '1px solid #e0e0e0',
					position: 'sticky',
					top: 0,
					zIndex: 100,
				}}
			>
				<div
					style={{
						maxWidth: '1200px',
						margin: '0 auto',
						padding: '16px 24px',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<div>
						<h1 style={{fontSize: '24px', fontWeight: '600', color: '#212121', margin: 0}}>
							<span
								className="material-icons"
								style={{verticalAlign: 'middle', marginRight: '8px'}}
							>
								school
							</span>
							Sistema de Estudiantes
						</h1>
					</div>

					<div style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
						<div
							style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'}}
						>
							<span className="material-icons" style={{fontSize: '20px', color: '#1976d2'}}>
								person
							</span>
							<span>{user?.full_name || user?.email}</span>
						</div>
						<button
							onClick={handleLogout}
							style={{
								padding: '8px 16px',
								background: '#b00020',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '500',
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
							}}
						>
							<span className="material-icons" style={{fontSize: '18px'}}>
								logout
							</span>
							Salir
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main
				style={{
					maxWidth: '1200px',
					margin: '0 auto',
					padding: '24px',
				}}
			>
				{/* Controls */}
				<div
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '16px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '16px',
						}}
					>
						<div style={{fontSize: '14px', color: '#757575'}}>
							{students.length > 0 && (
								<>
									{(pagination.page - 1) * pagination.limit + 1}-
									{Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
									{pagination.total} resultado
									{pagination.total !== 1 ? 's' : ''}
								</>
							)}
							{students.length === 0 && '0 resultados'}
						</div>
						<button
							onClick={() => setIsAddModalOpen(true)}
							style={{
								padding: '10px 16px',
								background: '#4caf50',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '500',
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
							}}
						>
							<span className="material-icons" style={{fontSize: '18px'}}>
								person_add
							</span>
							Agregar Estudiante
						</button>
					</div>

					<SearchAndFilters
						onSearch={handleSearch}
						grados={grados}
						secciones={secciones}
					/>
				</div>

				{/* Students Grid */}
				{isLoading && students.length === 0 ? (
					<div
						style={{
							minHeight: '240px',
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							background: 'white',
							borderRadius: '8px',
							padding: '24px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
						}}
					>
						<LoadingSpinner />
					</div>
				) : students.length > 0 ? (
					<>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
								gap: '16px',
								marginBottom: '24px',
							}}
						>
							{students.map((student) => (
								<StudentCard
									key={student.id}
									student={student}
									onClick={() => handleStudentClick(student)}
								/>
							))}
						</div>

						{/* Pagination */}
						<Pagination
							pagination={pagination}
							onPageChange={(page) => updatePagination({page})}
							onPageSizeChange={(limit) => updatePagination({page: 1, limit})}
						/>
					</>
				) : (
					<div
						style={{
							background: 'white',
							borderRadius: '8px',
							padding: '48px 24px',
							textAlign: 'center',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
						}}
					>
						<span
							className="material-icons"
							style={{
								fontSize: '48px',
								color: '#9e9e9e',
								display: 'block',
								marginBottom: '16px',
							}}
						>
							person_search
						</span>
						<p style={{fontSize: '18px', color: '#757575', margin: 0}}>
							No se encontraron estudiantes
						</p>
					</div>
				)}
			</main>

			{/* Modals */}
			<StudentDetailModal
				student={selectedStudent}
				isOpen={isDetailModalOpen}
				onClose={() => setIsDetailModalOpen(false)}
				onEdit={handleSaveStudent}
				onDelete={handleDeleteStudent}
				grados={grados}
				secciones={secciones}
			/>

			<AddStudentModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSave={handleAddStudent}
				grados={grados}
				secciones={secciones}
				isLoading={isSavingStudent}
			/>

			{/* Notification */}
			{notification && (
				<Notification
					message={notification.message}
					type={notification.type}
					onClose={() => setNotification(null)}
				/>
			)}
		</div>
	);
}
