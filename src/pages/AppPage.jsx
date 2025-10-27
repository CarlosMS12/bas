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
import {supabase} from '../lib/supabase';

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
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	// Cerrar dropdown al hacer click fuera
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (showUserDropdown && !e.target.closest('.user-profile-dropdown-container')) {
				setShowUserDropdown(false);
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	}, [showUserDropdown]);

	// Verificar autenticación periódicamente
	// Si el usuario fue eliminado en Supabase o hay problemas de conexión, cerrar sesión automáticamente
	useEffect(() => {
		const verifyAuthentication = async () => {
			try {
				// Verificar si el usuario actual aún existe en Supabase
				const {data, error} = await supabase.auth.getUser();

				if (error || !data?.user) {
					// Usuario no autenticado o error de conexión
					console.warn('Usuario no autenticado, cerrando sesión automáticamente');
					await logout();
					navigate('/login');
				}
			} catch (error) {
				console.error('Error verificando autenticación:', error);
				// En caso de error de conexión, cerrar sesión también
				await logout();
				navigate('/login');
			}
		};

		// Verificar cada 60 segundos (1 minuto)
		const interval = setInterval(verifyAuthentication, 60000);

		// También verificar al cargar la página
		verifyAuthentication();

		return () => clearInterval(interval);
	}, [navigate, logout]);

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
		try {
			setIsLoggingOut(true);
			const result = await logout();

			// Cerrar modal y dropdown
			setShowLogoutConfirm(false);
			setShowUserDropdown(false);

			// Redirigir a login
			navigate('/login');
		} catch (error) {
			console.error('Error durante logout:', error);
			// Igual redirigir aunque haya error
			setShowLogoutConfirm(false);
			setShowUserDropdown(false);
			navigate('/login');
		} finally {
			setIsLoggingOut(false);
		}
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

	const getInitial = (name) => {
		return (name || 'U').charAt(0).toUpperCase();
	};

	const userInitial = getInitial(user?.full_name || user?.email);

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
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						flexDirection: 'row',
					}}
				>
					{/* Spacer izquierdo */}
					<div style={{paddingLeft: '35px', width: '60px'}}></div>

					{/* Contenido central */}
					<div
						style={{
							maxWidth: '1200px',
							margin: '0 auto',
							padding: '16px 24px',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							flex: 1,
						}}
					>
						<div>
							<img
								src="/assets/logo.jpg"
								alt="Logo"
								style={{height: '110px', objectFit: 'cover'}}
								onError={(e) => {
									e.target.style.display = 'none';
								}}
							/>
						</div>
						<div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
							<span className="material-icons" style={{fontSize: '32px', color: '#1976d2'}}>
								school
							</span>
							<h1 style={{fontSize: '24px', fontWeight: '600', color: '#212121', margin: 0}}>
								Sistema de Estudiantes
							</h1>
						</div>
						<div
							style={{
								display: 'flex',
								gap: '24px',
							}}
						>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									padding: '8px 16px',
									background: '#1976d2',
									color: 'white',
									borderRadius: '8px',
									minWidth: '80px',
								}}
							>
								<span style={{fontSize: '20px', fontWeight: '700'}}>
									{pagination.total || 0}
								</span>
								<span style={{fontSize: '12px', opacity: 0.9}}>Estudiantes</span>
							</div>
						</div>
					</div>

					{/* Perfil de usuario */}
					<div className="user-profile-dropdown-container">
						<button
							onClick={() => setShowUserDropdown(!showUserDropdown)}
							className="user-profile-btn"
							title="Perfil de usuario"
						>
							<div className="user-dropdown-avatar">{userInitial}</div>
						</button>

						{/* Dropdown Menu */}
						{showUserDropdown && (
							<div className="user-dropdown active">
								<div className="user-dropdown-header">
									<div className="user-dropdown-avatar">{userInitial}</div>
									<div className="user-dropdown-info">
										<div className="user-dropdown-name">
											Hola {(user?.full_name || 'Usuario')?.split(' ')[0] || 'Usuario'}
										</div>
										<div className="user-dropdown-email">{user?.email}</div>
									</div>
								</div>
								<div className="user-dropdown-divider"></div>
								<div className="user-dropdown-role">
									Rol:{' '}
									{user?.role
										? user.role.charAt(0).toUpperCase() + user.role.slice(1)
										: 'Usuario'}
								</div>
								<div className="user-dropdown-divider"></div>
								<button
									onClick={() => setShowLogoutConfirm(true)}
									className="user-dropdown-logout"
								>
									<span className="material-icons">logout</span>
									Cerrar sesión
								</button>
							</div>
						)}
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
				{/* Search and Filters */}
				<div
					style={{
						background: 'white',
						borderRadius: '12px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
						marginBottom: '24px',
						overflow: 'hidden',
					}}
				>
					<SearchAndFilters
						onSearch={handleSearch}
						grados={grados}
						secciones={secciones}
					/>
				</div>

				{/* Results Container */}
				<div
					style={{
						background: 'white',
						borderRadius: '12px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
						overflow: 'hidden',
					}}
				>
					{/* Results Header */}
					<div
						style={{
							padding: '24px',
							borderBottom: '1px solid #e0e0e0',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<h2 style={{fontSize: '18px', fontWeight: '600', color: '#212121', margin: 0}}>
							Resultados
						</h2>
						<span
							style={{
								fontSize: '14px',
								color: '#757575',
								background: '#f5f5f5',
								padding: '4px 8px',
								borderRadius: '8px',
							}}
						>
							{students.length > 0
								? `${students.length} resultado${students.length !== 1 ? 's' : ''}`
								: '0 resultados'}
						</span>
					</div>

					{/* Students List */}
					{isLoading && students.length === 0 ? (
						<div
							style={{
								minHeight: '240px',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								padding: '48px',
								gap: '16px',
								color: '#757575',
							}}
						>
							<LoadingSpinner />
						</div>
					) : students.length > 0 ? (
						<>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									gap: '8px',
									padding: '24px',
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
							<div style={{borderTop: '1px solid #e0e0e0'}}>
								<Pagination
									pagination={pagination}
									onPageChange={(page) => updatePagination({page})}
									onPageSizeChange={(limit) => updatePagination({page: 1, limit})}
								/>
							</div>
						</>
					) : (
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								padding: '48px',
								textAlign: 'center',
								color: '#757575',
							}}
						>
							<span
								className="material-icons"
								style={{
									fontSize: '64px',
									marginBottom: '16px',
									opacity: 0.5,
								}}
							>
								search_off
							</span>
							<h3 style={{fontSize: '18px', marginBottom: '8px', color: '#212121'}}>
								No se encontraron resultados
							</h3>
							<p style={{margin: 0}}>Intenta ajustar los filtros o modificar la búsqueda</p>
						</div>
					)}
				</div>

				{/* Botón flotante para agregar estudiante */}
				<button
					onClick={() => setIsAddModalOpen(true)}
					style={{
						position: 'fixed',
						bottom: '24px',
						right: '24px',
						width: '56px',
						height: '56px',
						borderRadius: '50%',
						background: '#1976d2',
						color: 'white',
						border: 'none',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
						transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
						zIndex: 1000,
					}}
					title="Agregar nuevo estudiante"
					onMouseEnter={(e) => {
						e.currentTarget.style.background = '#1565c0';
						e.currentTarget.style.boxShadow =
							'0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)';
						e.currentTarget.style.transform = 'scale(1.05)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = '#1976d2';
						e.currentTarget.style.boxShadow =
							'0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)';
						e.currentTarget.style.transform = 'scale(1)';
					}}
					onMouseDown={(e) => {
						e.currentTarget.style.transform = 'scale(0.95)';
					}}
					onMouseUp={(e) => {
						e.currentTarget.style.transform = 'scale(1.05)';
					}}
				>
					<span className="material-icons" style={{fontSize: '24px'}}>
						person_add
					</span>
				</button>
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

			{/* Logout Confirmation Modal */}
			{showLogoutConfirm && (
				<div className="modal-overlay show">
					<div
						className="modal"
						style={{maxWidth: '400px', borderRadius: '12px', overflow: 'hidden'}}
					>
						<div style={{padding: '48px 32px 40px', textAlign: 'center'}}>
							<p
								style={{
									fontSize: '19px',
									fontWeight: '500',
									color: '#212121',
									margin: '0',
									letterSpacing: '-0.4px',
									lineHeight: '1.4',
								}}
							>
								¿Cerrar sesión?
							</p>
						</div>
						<div
							style={{
								padding: '0 32px 40px',
								display: 'flex',
								gap: '20px',
								justifyContent: 'center',
								borderTop: 'none',
							}}
						>
							<button
								onClick={() => setShowLogoutConfirm(false)}
								style={{
									minWidth: '120px',
									padding: '14px 32px',
									border: 'none',
									background: '#f5f5f5',
									borderRadius: '8px',
									cursor: 'pointer',
									fontSize: '15px',
									fontWeight: '500',
									color: '#424242',
									transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
									userSelect: 'none',
								}}
								onMouseEnter={(e) => (e.currentTarget.style.background = '#eeeeee')}
								onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f5')}
								disabled={isLoggingOut}
							>
								Cancelar
							</button>
							<button
								onClick={handleLogout}
								style={{
									minWidth: '120px',
									padding: '14px 32px',
									border: 'none',
									background: '#d32f2f',
									borderRadius: '8px',
									cursor: isLoggingOut ? 'not-allowed' : 'pointer',
									fontSize: '15px',
									fontWeight: '600',
									color: 'white',
									transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
									opacity: isLoggingOut ? 0.7 : 1,
									letterSpacing: '0.3px',
									userSelect: 'none',
								}}
								onMouseEnter={(e) => {
									if (!isLoggingOut) {
										e.currentTarget.style.background = '#b71c1c';
										e.currentTarget.style.boxShadow = '0 6px 16px rgba(211, 47, 47, 0.25)';
										e.currentTarget.style.transform = 'translateY(-1px)';
									}
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = '#d32f2f';
									e.currentTarget.style.boxShadow = 'none';
									e.currentTarget.style.transform = 'translateY(0)';
								}}
								disabled={isLoggingOut}
							>
								{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
