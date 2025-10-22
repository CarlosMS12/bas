import React, {useState, useRef} from 'react';
import {useStudentContext} from '../context/StudentContext';

export function SearchAndFilters({onSearch, grados, secciones}) {
	const {filters, updateFilters, resetFilters} = useStudentContext();
	const [showFilters, setShowFilters] = useState(false);

	const debounceRef = useRef(null);
	const handleSearchChange = (e) => {
		const value = e.target.value;
		updateFilters({search: value});

		// Debounce: esperar 300ms desde la última tecla antes de disparar onSearch
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			onSearch({...filters, search: value});
		}, 300);
	};

	const handleFilterChange = (filterName, value) => {
		const newFilters = {...filters, [filterName]: value};
		updateFilters(newFilters);
		onSearch(newFilters);
	};

	const handleClearFilters = () => {
		resetFilters();
		onSearch({
			search: '',
			grado: '',
			seccion: '',
			sexo: '',
			searchType: 'general',
		});
	};

	return (
		<div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
			{/* Search bar */}
			<div style={{display: 'flex', gap: '8px'}}>
				<div style={{flex: 1, position: 'relative'}}>
					<input
						type="text"
						placeholder="Buscar por nombre, DNI, apoderado..."
						value={filters.search}
						onChange={handleSearchChange}
						style={{
							width: '100%',
							padding: '12px 16px',
							border: '1px solid #e0e0e0',
							borderRadius: '8px',
							fontSize: '14px',
							fontFamily: 'inherit',
							outline: 'none',
							transition: 'all 0.2s ease',
						}}
						onFocus={(e) => {
							e.target.style.borderColor = '#1976d2';
							e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)';
						}}
						onBlur={(e) => {
							e.target.style.borderColor = '#e0e0e0';
							e.target.style.boxShadow = 'none';
						}}
					/>
					<span
						className="material-icons"
						style={{
							position: 'absolute',
							right: '12px',
							top: '50%',
							transform: 'translateY(-50%)',
							color: '#9e9e9e',
							pointerEvents: 'none',
						}}
					>
						search
					</span>
				</div>

				{/* Filter toggle button */}
				<button
					onClick={() => setShowFilters(!showFilters)}
					style={{
						padding: '12px 16px',
						background: showFilters ? '#1976d2' : '#f5f5f5',
						color: showFilters ? 'white' : '#212121',
						border: 'none',
						borderRadius: '8px',
						cursor: 'pointer',
						transition: 'all 0.2s ease',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						fontSize: '14px',
						fontWeight: '500',
					}}
					onMouseEnter={(e) => {
						if (!showFilters) e.target.style.background = '#eeeeee';
					}}
					onMouseLeave={(e) => {
						if (!showFilters) e.target.style.background = '#f5f5f5';
					}}
				>
					<span className="material-icons" style={{fontSize: '20px'}}>
						tune
					</span>
					Filtros
				</button>
			</div>

			{/* Filters panel */}
			{showFilters && (
				<div
					style={{
						background: '#fafafa',
						border: '1px solid #e0e0e0',
						borderRadius: '8px',
						padding: '16px',
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
						gap: '16px',
					}}
				>
					{/* Grado filter */}
					<div style={{display: 'flex', flexDirection: 'column'}}>
						<label
							style={{
								marginBottom: '8px',
								fontSize: '12px',
								fontWeight: '600',
								color: '#757575',
								textTransform: 'uppercase',
							}}
						>
							Grado
						</label>
						<select
							value={filters.grado}
							onChange={(e) => handleFilterChange('grado', e.target.value)}
							style={{
								padding: '8px 12px',
								border: '1px solid #e0e0e0',
								borderRadius: '6px',
								fontSize: '14px',
								fontFamily: 'inherit',
								outline: 'none',
								cursor: 'pointer',
							}}
						>
							<option value="">Todos los grados</option>
							{grados.map((g) => (
								<option key={g.grado} value={g.grado}>
									{g.grado}
								</option>
							))}
						</select>
					</div>

					{/* Sección filter */}
					<div style={{display: 'flex', flexDirection: 'column'}}>
						<label
							style={{
								marginBottom: '8px',
								fontSize: '12px',
								fontWeight: '600',
								color: '#757575',
								textTransform: 'uppercase',
							}}
						>
							Sección
						</label>
						<select
							value={filters.seccion}
							onChange={(e) => handleFilterChange('seccion', e.target.value)}
							style={{
								padding: '8px 12px',
								border: '1px solid #e0e0e0',
								borderRadius: '6px',
								fontSize: '14px',
								fontFamily: 'inherit',
								outline: 'none',
								cursor: 'pointer',
							}}
						>
							<option value="">Todas las secciones</option>
							{secciones.map((s) => (
								<option key={s.seccion} value={s.seccion}>
									{s.seccion}
								</option>
							))}
						</select>
					</div>

					{/* Sexo filter */}
					<div style={{display: 'flex', flexDirection: 'column'}}>
						<label
							style={{
								marginBottom: '8px',
								fontSize: '12px',
								fontWeight: '600',
								color: '#757575',
								textTransform: 'uppercase',
							}}
						>
							Sexo
						</label>
						<select
							value={filters.sexo}
							onChange={(e) => handleFilterChange('sexo', e.target.value)}
							style={{
								padding: '8px 12px',
								border: '1px solid #e0e0e0',
								borderRadius: '6px',
								fontSize: '14px',
								fontFamily: 'inherit',
								outline: 'none',
								cursor: 'pointer',
							}}
						>
							<option value="">Ambos</option>
							<option value="M">Masculino</option>
							<option value="F">Femenino</option>
						</select>
					</div>

					{/* Search type filter */}
					<div style={{display: 'flex', flexDirection: 'column'}}>
						<label
							style={{
								marginBottom: '8px',
								fontSize: '12px',
								fontWeight: '600',
								color: '#757575',
								textTransform: 'uppercase',
							}}
						>
							Tipo de búsqueda
						</label>
						<select
							value={filters.searchType}
							onChange={(e) => handleFilterChange('searchType', e.target.value)}
							style={{
								padding: '8px 12px',
								border: '1px solid #e0e0e0',
								borderRadius: '6px',
								fontSize: '14px',
								fontFamily: 'inherit',
								outline: 'none',
								cursor: 'pointer',
							}}
						>
							<option value="general">General</option>
							<option value="students">Solo estudiantes</option>
							<option value="guardians">Solo apoderados</option>
							<option value="dni">Por DNI</option>
						</select>
					</div>

					{/* Clear filters button */}
					<button
						onClick={handleClearFilters}
						style={{
							padding: '8px 16px',
							background: '#ffebee',
							color: '#c62828',
							border: 'none',
							borderRadius: '6px',
							cursor: 'pointer',
							fontSize: '14px',
							fontWeight: '500',
							transition: 'all 0.2s ease',
							alignSelf: 'flex-end',
						}}
						onMouseEnter={(e) => {
							e.target.style.background = '#ffcdd2';
						}}
						onMouseLeave={(e) => {
							e.target.style.background = '#ffebee';
						}}
					>
						<span
							className="material-icons"
							style={{fontSize: '16px', verticalAlign: 'middle'}}
						>
							clear_all
						</span>{' '}
						Limpiar filtros
					</button>
				</div>
			)}
		</div>
	);
}
