import React, {useState, useEffect} from 'react';

export function StudentDetailModal({
	student,
	isOpen,
	onClose,
	onEdit,
	onDelete,
	grados,
	secciones,
}) {
	const [isEditMode, setIsEditMode] = useState(false);
	const [editedData, setEditedData] = useState(student);

	// Sincronizar editedData cuando cambia el estudiante
	useEffect(() => {
		if (student) {
			setEditedData(student);
			setIsEditMode(false); // Resetear modo edición
		}
	}, [student, isOpen]);

	const calculateAge = (birthDate) => {
		if (!birthDate) return 'N/A';
		const [year, month, day] = birthDate.split('-').map((num) => parseInt(num, 10));
		const birth = new Date(year, month - 1, day);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	};

	const formatDate = (dateString) => {
		if (!dateString) return 'N/A';
		const [year, month, day] = dateString
			.split('-')
			.map((num) => parseInt(num, 10));
		const date = new Date(year, month - 1, day);
		return date.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	const handleInputChange = (e) => {
		const {name, value} = e.target;
		if (name.startsWith('apoderado_')) {
			const field = name.replace('apoderado_', '');
			setEditedData((prev) => ({
				...prev,
				apoderado: {
					...prev.apoderado,
					[field]: value,
				},
			}));
		} else if (name.startsWith('direccion_')) {
			const field = name.replace('direccion_', '');
			setEditedData((prev) => ({
				...prev,
				direccion: {
					...prev.direccion,
					[field]: value,
				},
			}));
		} else {
			setEditedData((prev) => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const handleSave = () => {
		onEdit(editedData);
		setIsEditMode(false);
	};

	const handleCancel = () => {
		setEditedData(student);
		setIsEditMode(false);
	};

	const handleClose = () => {
		if (isEditMode) {
			if (confirm('¿Descartar cambios?')) {
				setIsEditMode(false);
				onClose();
			}
		} else {
			onClose();
		}
	};

	if (!isOpen || !student || !editedData) return null;

	const age = calculateAge(student.fecha_nacimiento);

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				background: 'rgba(0, 0, 0, 0.5)',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				zIndex: 999,
				padding: '16px',
			}}
			onClick={handleClose}
		>
			<div
				style={{
					background: 'white',
					borderRadius: '12px',
					maxWidth: '600px',
					width: '100%',
					maxHeight: '90vh',
					overflowY: 'auto',
					boxShadow: '0 14px 28px rgba(0, 0, 0, 0.25)',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: '24px',
						borderBottom: '1px solid #e0e0e0',
					}}
				>
					<h2 style={{fontSize: '20px', fontWeight: '600'}}>
						{editedData.nombres} {editedData.apellidos}
					</h2>
					<button
						onClick={handleClose}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							padding: '8px',
							display: 'flex',
							alignItems: 'center',
						}}
					>
						<span className="material-icons">close</span>
					</button>
				</div>

				{/* Content */}
				<div
					style={{padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px'}}
				>
					{/* Student Info */}
					<div>
						<h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: '16px'}}>
							Información del Estudiante
						</h3>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
								gap: '16px',
							}}
						>
							<DetailField
								label="Nombres"
								value={editedData.nombres}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="nombres"
								required
							/>
							<DetailField
								label="Apellidos"
								value={editedData.apellidos}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="apellidos"
								required
							/>
							<DetailField
								label="DNI"
								value={editedData.dni}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="dni"
								required
							/>
							<DetailField
								label="Fecha de Nacimiento"
								value={editedData.fecha_nacimiento}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="fecha_nacimiento"
								type="date"
							/>
							<DetailField label="Edad" value={`${age} años`} isEditMode={false} />
							<SelectField
								label="Sexo"
								value={editedData.sexo}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="sexo"
								options={[
									{value: 'M', label: 'Masculino'},
									{value: 'F', label: 'Femenino'},
								]}
								required
							/>
							<SelectField
								label="Grado"
								value={editedData.grado || ''}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="grado"
								options={[
									{value: '', label: 'Seleccionar...'},
									...grados.map((g) => ({value: g.grado, label: g.grado})),
								]}
							/>
							<SelectField
								label="Sección"
								value={editedData.seccion || ''}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="seccion"
								options={[
									{value: '', label: 'Seleccionar...'},
									...secciones.map((s) => ({value: s.seccion, label: s.seccion})),
								]}
							/>
							<DetailField
								label="Discapacidad"
								value={editedData.discapacidad}
								isEditMode={isEditMode}
								onChange={handleInputChange}
								name="discapacidad"
							/>
						</div>
					</div>

					{/* Apoderado Info */}
					{editedData.apoderado && (
						<div>
							<h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: '16px'}}>
								Información del Apoderado
							</h3>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
									gap: '16px',
								}}
							>
								<DetailField
									label="Nombres"
									value={editedData.apoderado.nombres}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="apoderado_nombres"
									required
								/>
								<DetailField
									label="Apellidos"
									value={editedData.apoderado.apellidos}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="apoderado_apellidos"
									required
								/>
								<DetailField
									label="DNI"
									value={editedData.apoderado.dni}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="apoderado_dni"
								/>
								<DetailField
									label="Fecha de Nacimiento"
									value={editedData.apoderado.fecha_nacimiento}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="apoderado_fecha_nacimiento"
									type="date"
								/>
								<DetailField
									label="Celular"
									value={editedData.apoderado.celular}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="apoderado_celular"
								/>
							</div>
						</div>
					)}

					{/* Dirección Info */}
					{editedData.direccion && (
						<div>
							<h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: '16px'}}>
								Dirección
							</h3>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
									gap: '16px',
								}}
							>
								<DetailField
									label="Departamento"
									value={editedData.direccion.departamento}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="direccion_departamento"
								/>
								<DetailField
									label="Provincia"
									value={editedData.direccion.provincia}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="direccion_provincia"
								/>
								<DetailField
									label="Distrito"
									value={editedData.direccion.distrito}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="direccion_distrito"
								/>
								<DetailField
									label="Domicilio"
									value={editedData.direccion.domicilio}
									isEditMode={isEditMode}
									onChange={handleInputChange}
									name="direccion_domicilio"
								/>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div
					style={{
						display: 'flex',
						gap: '8px',
						padding: '24px',
						borderTop: '1px solid #e0e0e0',
						justifyContent: 'flex-end',
					}}
				>
					{!isEditMode ? (
						<>
							<button
								onClick={() => setIsEditMode(true)}
								style={{
									padding: '10px 16px',
									background: '#1976d2',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '500',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								<span className="material-icons" style={{fontSize: '16px'}}>
									edit
								</span>
								Editar
							</button>
							<button
								onClick={() => {
									if (confirm('¿Estás seguro de eliminar este estudiante?')) {
										onDelete(student.id);
									}
								}}
								style={{
									padding: '10px 16px',
									background: '#b00020',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '500',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								<span className="material-icons" style={{fontSize: '16px'}}>
									delete
								</span>
								Eliminar
							</button>
						</>
					) : (
						<>
							<button
								onClick={handleCancel}
								style={{
									padding: '10px 16px',
									background: '#f5f5f5',
									color: '#212121',
									border: '1px solid #e0e0e0',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '500',
								}}
							>
								Cancelar
							</button>
							<button
								onClick={handleSave}
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
									gap: '8px',
								}}
							>
								<span className="material-icons" style={{fontSize: '16px'}}>
									save
								</span>
								Guardar Cambios
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

function DetailField({
	label,
	value,
	isEditMode,
	onChange,
	name,
	type = 'text',
	required = false,
}) {
	return (
		<div style={{display: 'flex', flexDirection: 'column'}}>
			<label
				style={{
					fontSize: '12px',
					fontWeight: '600',
					marginBottom: '6px',
					color: '#757575',
				}}
			>
				{label}
				{required && <span style={{color: '#b00020'}}> *</span>}
			</label>
			{isEditMode ? (
				<input
					type={type}
					name={name}
					value={value || ''}
					onChange={onChange}
					required={required}
					style={{
						padding: '8px 12px',
						border: '1px solid #e0e0e0',
						borderRadius: '6px',
						fontSize: '14px',
						fontFamily: 'inherit',
						outline: 'none',
					}}
					onFocus={(e) => {
						e.target.style.borderColor = '#1976d2';
					}}
					onBlur={(e) => {
						e.target.style.borderColor = '#e0e0e0';
					}}
				/>
			) : (
				<span style={{fontSize: '14px', color: '#212121'}}>{value || 'N/A'}</span>
			)}
		</div>
	);
}

function SelectField({
	label,
	value,
	isEditMode,
	onChange,
	name,
	options,
	required = false,
}) {
	return (
		<div style={{display: 'flex', flexDirection: 'column'}}>
			<label
				style={{
					fontSize: '12px',
					fontWeight: '600',
					marginBottom: '6px',
					color: '#757575',
				}}
			>
				{label}
				{required && <span style={{color: '#b00020'}}> *</span>}
			</label>
			{isEditMode ? (
				<select
					name={name}
					value={value || ''}
					onChange={onChange}
					required={required}
					style={{
						padding: '8px 12px',
						border: '1px solid #e0e0e0',
						borderRadius: '6px',
						fontSize: '14px',
						fontFamily: 'inherit',
						outline: 'none',
						cursor: 'pointer',
					}}
					onFocus={(e) => {
						e.target.style.borderColor = '#1976d2';
					}}
					onBlur={(e) => {
						e.target.style.borderColor = '#e0e0e0';
					}}
				>
					{options.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			) : (
				<span style={{fontSize: '14px', color: '#212121'}}>
					{options.find((o) => o.value === value)?.label || 'N/A'}
				</span>
			)}
		</div>
	);
}
