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
		<>
			{/* Search bar */}
			<div className="search-bar">
				<span className="material-icons search-icon">search</span>
				<input
					type="text"
					placeholder="Buscar por nombre, apellido, DNI..."
					value={filters.search}
					onChange={handleSearchChange}
					className="search-input"
				/>
				<button
					onClick={() => setShowFilters(!showFilters)}
					className={`filter-toggle ${showFilters ? 'active' : ''}`}
				>
					<span className="material-icons">tune</span>
				</button>
			</div>

			{/* Filters panel */}
			{showFilters && (
				<div className="filters-panel show">
					{/* Grado filter */}
					<div className="filter-group">
						<label>Grado</label>
						<select
							value={filters.grado}
							onChange={(e) => handleFilterChange('grado', e.target.value)}
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
					<div className="filter-group">
						<label>Sección</label>
						<select
							value={filters.seccion}
							onChange={(e) => handleFilterChange('seccion', e.target.value)}
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
					<div className="filter-group">
						<label>Sexo</label>
						<select
							value={filters.sexo}
							onChange={(e) => handleFilterChange('sexo', e.target.value)}
						>
							<option value="">Ambos</option>
							<option value="M">Masculino</option>
							<option value="F">Femenino</option>
						</select>
					</div>

					{/* Search type filter */}
					<div className="filter-group">
						<label>Tipo de búsqueda</label>
						<select
							value={filters.searchType}
							onChange={(e) => handleFilterChange('searchType', e.target.value)}
						>
							<option value="general">General</option>
							<option value="students">Solo estudiantes</option>
							<option value="guardians">Solo apoderados</option>
							<option value="dni">Por DNI</option>
						</select>
					</div>

					{/* Clear filters button */}
					<button onClick={handleClearFilters} className="clear-filters">
						<span className="material-icons">clear</span>
						Limpiar filtros
					</button>
				</div>
			)}
		</>
	);
}
