import React from 'react';

export function StudentCard({student, onClick}) {
	const getInitials = (nombres, apellidos) => {
		const firstInitial = nombres ? nombres.charAt(0).toUpperCase() : '';
		const lastInitial = apellidos ? apellidos.charAt(0).toUpperCase() : '';
		return firstInitial + lastInitial;
	};

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

	const initials = getInitials(student.nombres, student.apellidos);
	const age = calculateAge(student.fecha_nacimiento);

	return (
		<div
			onClick={onClick}
			style={{
				background: 'white',
				borderRadius: '8px',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
				padding: '16px',
				cursor: 'pointer',
				transition: 'all 0.2s ease',
				display: 'flex',
				gap: '16px',
			}}
			className="student-card"
			onMouseEnter={(e) => {
				e.currentTarget.style.boxShadow =
					'0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)';
				e.currentTarget.style.transform = 'translateY(-2px)';
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.boxShadow =
					'0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)';
				e.currentTarget.style.transform = 'translateY(0)';
			}}
		>
			{/* Avatar */}
			<div
				style={{
					width: '56px',
					height: '56px',
					minWidth: '56px',
					borderRadius: '50%',
					background: '#1976d2',
					color: 'white',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: '20px',
					fontWeight: '700',
					userSelect: 'none',
				}}
			>
				{initials}
			</div>

			{/* Info */}
			<div style={{flex: 1, minWidth: 0}}>
				<div style={{marginBottom: '8px'}}>
					<div style={{fontSize: '16px', fontWeight: '600', color: '#212121'}}>
						{student.apellidos}, {student.nombres}
					</div>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '4px',
							fontSize: '12px',
							color: '#757575',
						}}
					>
						<span className="material-icons" style={{fontSize: '14px'}}>
							badge
						</span>
						<span>{student.dni}</span>
					</div>
				</div>

				<div
					style={{display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '12px'}}
				>
					<div style={{color: '#757575'}}>{age} años</div>
					<div style={{color: '#757575'}}>{student.sexo === 'M' ? 'M' : 'F'}</div>
				</div>

				<div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
					{student.grado && (
						<span
							style={{
								background: '#e3f2fd',
								color: '#1976d2',
								padding: '2px 8px',
								borderRadius: '4px',
								fontSize: '12px',
								fontWeight: '500',
							}}
						>
							{student.grado}
						</span>
					)}
					{student.seccion && (
						<span
							style={{
								background: '#f3e5f5',
								color: '#6a1b9a',
								padding: '2px 8px',
								borderRadius: '4px',
								fontSize: '12px',
								fontWeight: '500',
							}}
						>
							{student.seccion}
						</span>
					)}
				</div>

				{student.apoderado && (
					<div style={{fontSize: '12px', marginBottom: '4px'}}>
						<div style={{color: '#212121', fontWeight: '500'}}>
							{student.apoderado.nombres} {student.apoderado.apellidos}
						</div>
						<div
							style={{color: '#757575', display: 'flex', alignItems: 'center', gap: '4px'}}
						>
							<span className="material-icons" style={{fontSize: '12px'}}>
								phone
							</span>
							<span>{student.apoderado.celular || 'Sin teléfono'}</span>
						</div>
					</div>
				)}

				{student.direccion && (
					<div style={{fontSize: '12px', color: '#757575'}}>
						{student.direccion.distrito}, {student.direccion.provincia}
					</div>
				)}
			</div>
		</div>
	);
}
