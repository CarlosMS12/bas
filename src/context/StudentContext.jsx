import React, {createContext, useState, useCallback} from 'react';

export const StudentContext = createContext();

export function StudentProvider({children}) {
	const [students, setStudents] = useState([]);
	const [grados, setGrados] = useState([]);
	const [secciones, setSecciones] = useState([]);

	const [pagination, setPagination] = useState({
		page: 1,
		limit: 24,
		total: 0,
		totalPages: 0,
		hasNext: false,
		hasPrev: false,
	});

	const [filters, setFilters] = useState({
		search: '',
		grado: '',
		seccion: '',
		sexo: '',
		searchType: 'general',
	});

	const [isLoading, setIsLoading] = useState(false);

	const updatePagination = useCallback((newPagination) => {
		setPagination((prev) => ({
			...prev,
			...newPagination,
		}));
	}, []);

	const updateFilters = useCallback((newFilters) => {
		setFilters((prev) => ({
			...prev,
			...newFilters,
		}));
	}, []);

	const resetFilters = useCallback(() => {
		setFilters({
			search: '',
			grado: '',
			seccion: '',
			sexo: '',
			searchType: 'general',
		});
	}, []);

	const value = {
		students,
		setStudents,
		grados,
		setGrados,
		secciones,
		setSecciones,
		pagination,
		updatePagination,
		filters,
		updateFilters,
		resetFilters,
		isLoading,
		setIsLoading,
	};

	return (
		<StudentContext.Provider value={value}>{children}</StudentContext.Provider>
	);
}

/**
 * Hook para usar el StudentContext
 */
export function useStudentContext() {
	const context = React.useContext(StudentContext);
	if (!context) {
		throw new Error('useStudentContext debe ser usado dentro de StudentProvider');
	}
	return context;
}
