import React, {useState, useEffect} from 'react';

export function StudentDetailModal({
	student,
	isOpen,
	onClose,
	onEdit,
	onDelete,
	grados = [],
	secciones = [],
}) {
	const [isEditMode, setIsEditMode] = useState(false);
	const [editedData, setEditedData] = useState(student);

	useEffect(() => {
		if (student) {
			setEditedData(student);
			setIsEditMode(false);
		}
	}, [student, isOpen]);

	const calculateAge = (birthDate) => {
		if (!birthDate) return 'N/A';
		const [year, month, day] = birthDate.split('-').map((n) => parseInt(n, 10));
		const birth = new Date(year, month - 1, day);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	};

	const handleInputChange = (e) => {
		const {name, value} = e.target;
		if (name.startsWith('apoderado_')) {
			const field = name.replace('apoderado_', '');
			setEditedData((prev) => ({
				...prev,
				apoderado: {...(prev.apoderado || {}), [field]: value},
			}));
		} else if (name.startsWith('direccion_')) {
			const field = name.replace('direccion_', '');
			setEditedData((prev) => ({
				...prev,
				direccion: {...(prev.direccion || {}), [field]: value},
			}));
		} else {
			setEditedData((prev) => ({...prev, [name]: value}));
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
		<div className={`modal-overlay ${isOpen ? 'show' : ''}`} onClick={handleClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3>
						{editedData.nombres} {editedData.apellidos}
					</h3>
					<button className="modal-close" onClick={handleClose} aria-label="Cerrar modal">
						×
					</button>
				</div>

				<div className="modal-content">
					<div className="detail-section">
						<h4>Información del Estudiante</h4>
						<div className="detail-grid">
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

					{editedData.apoderado && (
						<div className="detail-section">
							<h4>Información del Apoderado</h4>
							<div className="detail-grid">
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

					{editedData.direccion && (
						<div className="detail-section">
							<h4>Dirección</h4>
							<div className="detail-grid">
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

				<div className="modal-footer">
					{!isEditMode ? (
						<>
							<button className="edit-toggle-btn" onClick={() => setIsEditMode(true)}>
								Editar
							</button>
							<button
								className="delete-btn"
								onClick={() => {
									if (confirm('¿Estás seguro de eliminar este estudiante?')) {
										onDelete(student.id);
									}
								}}
							>
								Eliminar
							</button>
						</>
					) : (
						<>
							<button className="cancel-btn" onClick={handleCancel}>
								Cancelar
							</button>
							<button className="save-btn" onClick={handleSave}>
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
		<div className="detail-field">
			<label>
				{label}
				{required && <span className="field-required">*</span>}
			</label>
			{isEditMode ? (
				<input
					type={type}
					name={name}
					value={value || ''}
					onChange={onChange}
					required={required}
				/>
			) : (
				<span>{value || 'N/A'}</span>
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
	options = [],
	required = false,
}) {
	return (
		<div className="detail-field">
			<label>
				{label}
				{required && <span className="field-required">*</span>}
			</label>
			{isEditMode ? (
				<select name={name} value={value || ''} onChange={onChange} required={required}>
					{options.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			) : (
				<span>{options.find((o) => o.value === value)?.label || value || 'N/A'}</span>
			)}
		</div>
	);
}

export default StudentDetailModal;
