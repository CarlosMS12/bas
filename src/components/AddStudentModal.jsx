import React, {useState} from 'react';

export function AddStudentModal({
	isOpen,
	onClose,
	onSave,
	grados,
	secciones,
	isLoading,
}) {
	const [formData, setFormData] = useState({
		nombres: '',
		apellidos: '',
		dni: '',
		fecha_nacimiento: '',
		sexo: '',
		grado: '',
		seccion: '',
		discapacidad: '',
		apoderado: {
			nombres: '',
			apellidos: '',
			dni: '',
			fecha_nacimiento: '',
			celular: '',
		},
		direccion: {
			departamento: '',
			provincia: '',
			distrito: '',
			domicilio: '',
		},
	});

	const [errors, setErrors] = useState({});

	const handleInputChange = (e) => {
		const {name, value} = e.target;

		if (name.startsWith('apoderado_')) {
			const field = name.replace('apoderado_', '');
			setFormData((prev) => ({
				...prev,
				apoderado: {
					...prev.apoderado,
					[field]: value,
				},
			}));
		} else if (name.startsWith('direccion_')) {
			const field = name.replace('direccion_', '');
			setFormData((prev) => ({
				...prev,
				direccion: {
					...prev.direccion,
					[field]: value,
				},
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				[name]: value,
			}));
		}

		// Clear error for this field
		if (errors[name]) {
			setErrors((prev) => {
				const newErrors = {...prev};
				delete newErrors[name];
				return newErrors;
			});
		}
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.nombres.trim()) newErrors.nombres = 'Este campo es requerido';
		if (!formData.apellidos.trim()) newErrors.apellidos = 'Este campo es requerido';
		if (!formData.dni.trim()) newErrors.dni = 'Este campo es requerido';
		if (formData.dni && !/^[0-9A-Za-z]{1,12}$/.test(formData.dni)) {
			newErrors.dni = 'DNI inválido';
		}
		if (!formData.sexo) newErrors.sexo = 'Este campo es requerido';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (validateForm()) {
			onSave(formData);
			setFormData({
				nombres: '',
				apellidos: '',
				dni: '',
				fecha_nacimiento: '',
				sexo: '',
				grado: '',
				seccion: '',
				discapacidad: '',
				apoderado: {
					nombres: '',
					apellidos: '',
					dni: '',
					fecha_nacimiento: '',
					celular: '',
				},
				direccion: {
					departamento: '',
					provincia: '',
					distrito: '',
					domicilio: '',
				},
			});
			setErrors({});
		}
	};

	const handleClose = () => {
		setFormData({
			nombres: '',
			apellidos: '',
			dni: '',
			fecha_nacimiento: '',
			sexo: '',
			grado: '',
			seccion: '',
			discapacidad: '',
			apoderado: {
				nombres: '',
				apellidos: '',
				dni: '',
				fecha_nacimiento: '',
				celular: '',
			},
			direccion: {
				departamento: '',
				provincia: '',
				distrito: '',
				domicilio: '',
			},
		});
		setErrors({});
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="modal-overlay show" onClick={handleClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="modal-header">
					<h3>Agregar Nuevo Estudiante</h3>
					<button className="modal-close" onClick={handleClose} aria-label="Cerrar modal">
						×
					</button>
				</div>

				{/* Content */}
				<div className="modal-content">
					{/* Student Info */}
					<div className="form-section">
						<h3>Información del Estudiante</h3>
						<div className="form-grid">
							<FormField
								label="Nombres *"
								name="nombres"
								value={formData.nombres}
								onChange={handleInputChange}
								error={errors.nombres}
								placeholder="Nombres del estudiante"
							/>
							<FormField
								label="Apellidos *"
								name="apellidos"
								value={formData.apellidos}
								onChange={handleInputChange}
								error={errors.apellidos}
								placeholder="Apellidos del estudiante"
							/>
							<FormField
								label="DNI *"
								name="dni"
								value={formData.dni}
								onChange={handleInputChange}
								error={errors.dni}
								placeholder="Documento de identidad"
								maxLength="12"
							/>
							<FormField
								label="Fecha de Nacimiento"
								name="fecha_nacimiento"
								type="date"
								value={formData.fecha_nacimiento}
								onChange={handleInputChange}
							/>
							<SelectFormField
								label="Sexo *"
								name="sexo"
								value={formData.sexo}
								onChange={handleInputChange}
								error={errors.sexo}
								options={[
									{value: '', label: 'Seleccionar...'},
									{value: 'M', label: 'Masculino'},
									{value: 'F', label: 'Femenino'},
								]}
							/>
							<SelectFormField
								label="Grado"
								name="grado"
								value={formData.grado}
								onChange={handleInputChange}
								options={[
									{value: '', label: 'Seleccionar...'},
									...grados.map((g) => ({value: g.grado, label: g.grado})),
								]}
							/>
							<SelectFormField
								label="Sección"
								name="seccion"
								value={formData.seccion}
								onChange={handleInputChange}
								options={[
									{value: '', label: 'Seleccionar...'},
									...secciones.map((s) => ({value: s.seccion, label: s.seccion})),
								]}
							/>
							<FormField
								label="Discapacidad"
								name="discapacidad"
								value={formData.discapacidad}
								onChange={handleInputChange}
								placeholder="Especificar si tiene alguna discapacidad"
							/>
						</div>
					</div>

					{/* Apoderado Info */}
					<div className="form-section">
						<h3>Información del Apoderado</h3>
						<div className="form-grid">
							<FormField
								label="Nombres"
								name="apoderado_nombres"
								value={formData.apoderado.nombres}
								onChange={handleInputChange}
								placeholder="Nombres del apoderado"
							/>
							<FormField
								label="Apellidos"
								name="apoderado_apellidos"
								value={formData.apoderado.apellidos}
								onChange={handleInputChange}
								placeholder="Apellidos del apoderado"
							/>
							<FormField
								label="DNI"
								name="apoderado_dni"
								value={formData.apoderado.dni}
								onChange={handleInputChange}
								placeholder="Documento del apoderado"
								maxLength="12"
							/>
							<FormField
								label="Fecha de Nacimiento"
								name="apoderado_fecha_nacimiento"
								type="date"
								value={formData.apoderado.fecha_nacimiento}
								onChange={handleInputChange}
							/>
							<FormField
								label="Celular"
								name="apoderado_celular"
								value={formData.apoderado.celular}
								onChange={handleInputChange}
								placeholder="Ej: 987654321"
								maxLength="50"
							/>
						</div>
					</div>

					{/* Dirección Info */}
					<div className="form-section">
						<h3>Información de Dirección</h3>
						<div className="form-grid">
							<FormField
								label="Departamento"
								name="direccion_departamento"
								value={formData.direccion.departamento}
								onChange={handleInputChange}
								placeholder="Departamento"
							/>
							<FormField
								label="Provincia"
								name="direccion_provincia"
								value={formData.direccion.provincia}
								onChange={handleInputChange}
								placeholder="Provincia"
							/>
							<FormField
								label="Distrito"
								name="direccion_distrito"
								value={formData.direccion.distrito}
								onChange={handleInputChange}
								placeholder="Distrito"
							/>
							<FormField
								label="Domicilio"
								name="direccion_domicilio"
								value={formData.direccion.domicilio}
								onChange={handleInputChange}
								placeholder="Dirección específica"
							/>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="modal-footer">
					<button className="cancel-btn" onClick={handleClose}>
						Cancelar
					</button>
					<button className="save-btn" onClick={handleSubmit} disabled={isLoading}>
						<span className="material-icons">
							{isLoading ? 'hourglass_empty' : 'person_add'}
						</span>
						{isLoading ? 'Guardando...' : 'Agregar Estudiante'}
					</button>
				</div>
			</div>
		</div>
	);
}

function FormField({
	label,
	name,
	value,
	onChange,
	error,
	type = 'text',
	placeholder = '',
	maxLength = '',
}) {
	return (
		<div className="form-field">
			<label>{label}</label>
			<input
				type={type}
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				maxLength={maxLength}
				className={error ? 'error' : ''}
			/>
			{error && <span className="form-field-error">{error}</span>}
		</div>
	);
}

function SelectFormField({label, name, value, onChange, error, options}) {
	return (
		<div className="form-field">
			<label>{label}</label>
			<select
				name={name}
				value={value}
				onChange={onChange}
				className={error ? 'error' : ''}
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
			{error && <span className="form-field-error">{error}</span>}
		</div>
	);
}
