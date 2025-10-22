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
					<h2 style={{fontSize: '20px', fontWeight: '600'}}>Agregar Nuevo Estudiante</h2>
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
					<div>
						<h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: '16px'}}>
							Información de Dirección
						</h3>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
								gap: '16px',
							}}
						>
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
				<div
					style={{
						display: 'flex',
						gap: '8px',
						padding: '24px',
						borderTop: '1px solid #e0e0e0',
						justifyContent: 'flex-end',
					}}
				>
					<button
						onClick={handleClose}
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
						onClick={handleSubmit}
						disabled={isLoading}
						style={{
							padding: '10px 16px',
							background: isLoading ? '#90caf9' : '#4caf50',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							cursor: isLoading ? 'not-allowed' : 'pointer',
							fontSize: '14px',
							fontWeight: '500',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<span className="material-icons" style={{fontSize: '16px'}}>
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
			</label>
			<input
				type={type}
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				maxLength={maxLength}
				style={{
					padding: '8px 12px',
					border: error ? '2px solid #b00020' : '1px solid #e0e0e0',
					borderRadius: '6px',
					fontSize: '14px',
					fontFamily: 'inherit',
					outline: 'none',
					transition: 'all 0.2s ease',
				}}
				onFocus={(e) => {
					if (!error) e.target.style.borderColor = '#1976d2';
				}}
				onBlur={(e) => {
					if (!error) e.target.style.borderColor = '#e0e0e0';
				}}
			/>
			{error && (
				<span style={{fontSize: '12px', color: '#b00020', marginTop: '4px'}}>
					{error}
				</span>
			)}
		</div>
	);
}

function SelectFormField({label, name, value, onChange, error, options}) {
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
			</label>
			<select
				name={name}
				value={value}
				onChange={onChange}
				style={{
					padding: '8px 12px',
					border: error ? '2px solid #b00020' : '1px solid #e0e0e0',
					borderRadius: '6px',
					fontSize: '14px',
					fontFamily: 'inherit',
					outline: 'none',
					cursor: 'pointer',
					transition: 'all 0.2s ease',
				}}
				onFocus={(e) => {
					if (!error) e.target.style.borderColor = '#1976d2';
				}}
				onBlur={(e) => {
					if (!error) e.target.style.borderColor = '#e0e0e0';
				}}
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
			{error && (
				<span style={{fontSize: '12px', color: '#b00020', marginTop: '4px'}}>
					{error}
				</span>
			)}
		</div>
	);
}
