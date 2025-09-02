// Configuración de la aplicación
const API_BASE_URL = '/api';

// Estado global de la aplicación
let allStudents = [];
let currentPagination = {
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
};

let currentFilters = {
    search: '',
    grado: '',
    seccion: '',
    sexo: '',
    searchType: 'general'
};

// Elementos del DOM
const elements = {
    searchInput: document.getElementById('searchInput'),
    filterToggle: document.getElementById('filterToggle'),
    filtersPanel: document.getElementById('filtersPanel'),
    gradoFilter: document.getElementById('gradoFilter'),
    seccionFilter: document.getElementById('seccionFilter'),
    sexoFilter: document.getElementById('sexoFilter'),
    searchType: document.getElementById('searchType'),
    clearFilters: document.getElementById('clearFilters'),
    resultsGrid: document.getElementById('resultsGrid'),
    resultsCount: document.getElementById('resultsCount'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    noResults: document.getElementById('noResults'),
    totalEstudiantes: document.getElementById('totalEstudiantes'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalClose: document.getElementById('modalClose'),
    modalContent: document.getElementById('modalContent'),
    
    // Elementos de paginación
    paginationContainer: document.getElementById('paginationContainer'),
    paginationInfo: document.getElementById('paginationInfo'),
    pageSize: document.getElementById('pageSize'),
    firstPageBtn: document.getElementById('firstPageBtn'),
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),
    lastPageBtn: document.getElementById('lastPageBtn'),
    pageNumbers: document.getElementById('pageNumbers')
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        showLoading(true);
        
        // Cargar datos iniciales
        await loadStudents();
        await loadFilterOptions();
        
        // Configurar event listeners
        setupEventListeners();
        
        showLoading(false);
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Error al cargar la aplicación');
        showLoading(false);
    }
}

// Cargar estudiantes desde el servidor con paginación
async function loadStudents(page = 1, limit = 24) {
    try {
        const hasFilters = currentFilters.search || currentFilters.grado || 
                          currentFilters.seccion || currentFilters.sexo;
        
        let url = hasFilters ? `${API_BASE_URL}/search` : `${API_BASE_URL}/students`;
        
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });
        
        // Agregar filtros si existen
        if (hasFilters) {
            if (currentFilters.search) params.append('q', currentFilters.search);
            if (currentFilters.grado) params.append('grado', currentFilters.grado);
            if (currentFilters.seccion) params.append('seccion', currentFilters.seccion);
            if (currentFilters.sexo) params.append('sexo', currentFilters.sexo);
            if (currentFilters.searchType) params.append('type', currentFilters.searchType);
        }
        
        url += '?' + params.toString();
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al cargar estudiantes');
        
        const data = await response.json();
        
        allStudents = data.students;
        currentPagination = data.pagination;
        
        // Actualizar contador total solo en la primera carga sin filtros
        if (!hasFilters && page === 1) {
            elements.totalEstudiantes.textContent = data.pagination.total;
        }
        
        displayStudents(allStudents);
        updatePagination();
        
    } catch (error) {
        console.error('Error loading students:', error);
        throw error;
    }
}

// Cargar opciones para los filtros
async function loadFilterOptions() {
    try {
        // Para obtener todas las opciones únicas, hacemos una consulta sin paginación
        const response = await fetch(`${API_BASE_URL}/students?limit=1000`);
        if (!response.ok) throw new Error('Error al cargar opciones de filtros');
        
        const data = await response.json();
        const allData = data.students;
        
        // Obtener valores únicos
        const grados = [...new Set(allData.map(s => s.grado))].filter(Boolean).sort();
        const secciones = [...new Set(allData.map(s => s.seccion))].filter(Boolean).sort();
        
        // Poblar select de grados
        grados.forEach(grado => {
            const option = document.createElement('option');
            option.value = grado;
            option.textContent = grado;
            elements.gradoFilter.appendChild(option);
        });
        
        // Poblar select de secciones
        secciones.forEach(seccion => {
            const option = document.createElement('option');
            option.value = seccion;
            option.textContent = seccion;
            elements.seccionFilter.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda en tiempo real
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Toggle de filtros
    elements.filterToggle.addEventListener('click', toggleFilters);
    
    // Filtros
    elements.gradoFilter.addEventListener('change', handleFilterChange);
    elements.seccionFilter.addEventListener('change', handleFilterChange);
    elements.sexoFilter.addEventListener('change', handleFilterChange);
    elements.searchType.addEventListener('change', handleFilterChange);
    
    // Limpiar filtros
    elements.clearFilters.addEventListener('click', clearAllFilters);
    
    // Paginación
    elements.pageSize.addEventListener('change', handlePageSizeChange);
    elements.firstPageBtn.addEventListener('click', () => goToPage(1));
    elements.prevPageBtn.addEventListener('click', () => goToPage(currentPagination.page - 1));
    elements.nextPageBtn.addEventListener('click', () => goToPage(currentPagination.page + 1));
    elements.lastPageBtn.addEventListener('click', () => goToPage(currentPagination.totalPages));
    
    // Modal
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', function(e) {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    });
    
    // Teclas de escape para cerrar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Función de debounce para búsqueda
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Manejar búsqueda
function handleSearch() {
    currentFilters.search = elements.searchInput.value.trim();
    resetToFirstPage();
}

// Manejar cambios en filtros
function handleFilterChange() {
    currentFilters.grado = elements.gradoFilter.value;
    currentFilters.seccion = elements.seccionFilter.value;
    currentFilters.sexo = elements.sexoFilter.value;
    currentFilters.searchType = elements.searchType.value;
    
    resetToFirstPage();
}

// Manejar cambio de tamaño de página
function handlePageSizeChange() {
    currentPagination.limit = parseInt(elements.pageSize.value);
    resetToFirstPage();
}

// Resetear a la primera página y aplicar filtros
async function resetToFirstPage() {
    showLoading(true);
    try {
        await loadStudents(1, currentPagination.limit);
    } catch (error) {
        showError('Error al aplicar filtros');
    }
    showLoading(false);
}

// Ir a una página específica
async function goToPage(page) {
    if (page < 1 || page > currentPagination.totalPages) return;
    
    showLoading(true);
    try {
        await loadStudents(page, currentPagination.limit);
    } catch (error) {
        showError('Error al cargar página');
    }
    showLoading(false);
}

// Mostrar/ocultar panel de filtros
function toggleFilters() {
    const isVisible = elements.filtersPanel.classList.contains('show');
    elements.filtersPanel.classList.toggle('show', !isVisible);
    elements.filterToggle.classList.toggle('active', !isVisible);
}

// Limpiar todos los filtros
function clearAllFilters() {
    currentFilters = {
        search: '',
        grado: '',
        seccion: '',
        sexo: '',
        searchType: 'general'
    };
    
    elements.searchInput.value = '';
    elements.gradoFilter.value = '';
    elements.seccionFilter.value = '';
    elements.sexoFilter.value = '';
    elements.searchType.value = 'general';
    
    resetToFirstPage();
}

// Mostrar estudiantes en la interfaz
function displayStudents(students) {
    const total = currentPagination.total;
    const start = (currentPagination.page - 1) * currentPagination.limit + 1;
    const end = Math.min(start + students.length - 1, total);
    
    elements.resultsCount.textContent = total > 0 ? 
        `${start}-${end} de ${total} resultado${total !== 1 ? 's' : ''}` :
        '0 resultados';
    
    if (students.length === 0) {
        elements.resultsGrid.style.display = 'none';
        elements.noResults.style.display = 'flex';
        elements.paginationContainer.style.display = 'none';
        return;
    }
    
    elements.noResults.style.display = 'none';
    elements.resultsGrid.style.display = 'grid';
    elements.paginationContainer.style.display = 'flex';
    
    elements.resultsGrid.innerHTML = students.map(student => createStudentCard(student)).join('');
    
    // Agregar event listeners a las tarjetas
    elements.resultsGrid.querySelectorAll('.student-card').forEach((card, index) => {
        card.addEventListener('click', () => showStudentDetails(students[index]));
    });
}

// Actualizar controles de paginación
function updatePagination() {
    const { page, totalPages, hasNext, hasPrev } = currentPagination;
    
    // Actualizar información de página
    elements.paginationInfo.textContent = `Página ${page} de ${totalPages}`;
    
    // Actualizar botones de navegación
    elements.firstPageBtn.disabled = !hasPrev;
    elements.prevPageBtn.disabled = !hasPrev;
    elements.nextPageBtn.disabled = !hasNext;
    elements.lastPageBtn.disabled = !hasNext;
    
    // Generar números de página
    generatePageNumbers();
}

// Generar números de página
function generatePageNumbers() {
    const { page, totalPages } = currentPagination;
    elements.pageNumbers.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustar si estamos cerca del final
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Agregar primera página y ellipsis si es necesario
    if (startPage > 1) {
        addPageNumber(1);
        if (startPage > 2) {
            addPageEllipsis();
        }
    }
    
    // Agregar páginas visibles
    for (let i = startPage; i <= endPage; i++) {
        addPageNumber(i);
    }
    
    // Agregar ellipsis y última página si es necesario
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            addPageEllipsis();
        }
        addPageNumber(totalPages);
    }
}

// Agregar número de página
function addPageNumber(pageNum) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `page-number ${pageNum === currentPagination.page ? 'active' : ''}`;
    pageBtn.textContent = pageNum;
    pageBtn.addEventListener('click', () => goToPage(pageNum));
    elements.pageNumbers.appendChild(pageBtn);
}

// Agregar ellipsis
function addPageEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.className = 'page-ellipsis';
    ellipsis.textContent = '...';
    elements.pageNumbers.appendChild(ellipsis);
}

// Crear tarjeta de estudiante
function createStudentCard(student) {
    const initials = getInitials(student.nombres, student.apellidos);
    const age = calculateAge(student.fecha_nacimiento);
    
    return `
        <div class="student-card">
            <div class="student-header">
                <div class="student-avatar">${initials}</div>
                <div class="student-info">
                    <div class="student-name">${student.apellidos}, ${student.nombres}</div>
                    <div class="student-details">
                        <div class="detail-item">
                            <span class="material-icons">badge</span>
                            <span>DNI: ${student.dni}</span>
                        </div>
                        <div class="detail-item">
                            <span class="material-icons">cake</span>
                            <span>${age} años</span>
                        </div>
                        <div class="detail-item">
                            <span class="material-icons">person</span>
                            <span>${student.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
                        </div>
                        ${student.apoderado ? `
                        <div class="detail-item">
                            <span class="material-icons">family_restroom</span>
                            <span>${student.apoderado.nombres} ${student.apoderado.apellidos}</span>
                        </div>
                        ` : ''}
                        ${student.direccion ? `
                        <div class="detail-item">
                            <span class="material-icons">location_on</span>
                            <span>${student.direccion.distrito}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="student-badges">
                <span class="badge">${student.grado}</span>
                <span class="badge section">${student.seccion}</span>
            </div>
        </div>
    `;
}

// Obtener iniciales del nombre
function getInitials(nombres, apellidos) {
    const firstInitial = nombres ? nombres.charAt(0).toUpperCase() : '';
    const lastInitial = apellidos ? apellidos.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
}

// Calcular edad
function calculateAge(birthDate) {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Mostrar detalles del estudiante en modal
function showStudentDetails(student) {
    const age = calculateAge(student.fecha_nacimiento);
    
    elements.modalContent.innerHTML = `
        <div class="detail-section">
            <h4>Información del Estudiante</h4>
            <div class="detail-grid">
                <div class="detail-field">
                    <label>Nombres</label>
                    <span>${student.nombres || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <label>Apellidos</label>
                    <span>${student.apellidos || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <label>DNI</label>
                    <span>${student.dni || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <label>Fecha de Nacimiento</label>
                    <span>${formatDate(student.fecha_nacimiento)}</span>
                </div>
                <div class="detail-field">
                    <label>Edad</label>
                    <span>${age} años</span>
                </div>
                <div class="detail-field">
                    <label>Sexo</label>
                    <span>${student.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
                </div>
                <div class="detail-field">
                    <label>Grado</label>
                    <span>${student.grado || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <label>Sección</label>
                    <span>${student.seccion || 'N/A'}</span>
                </div>
                ${student.discapacidad ? `
                <div class="detail-field">
                    <label>Discapacidad</label>
                    <span>${student.discapacidad}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        ${student.apoderado ? `
        <div class="detail-section">
            <h4>Información del Apoderado</h4>
            <div class="detail-grid">
                <div class="detail-field">
                    <label>Nombres</label>
                    <span>${student.apoderado.nombres || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <label>Apellidos</label>
                    <span>${student.apoderado.apellidos || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <label>DNI</label>
                    <span>${student.apoderado.dni || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <label>Fecha de Nacimiento</label>
                    <span>${formatDate(student.apoderado.fecha_nacimiento)}</span>
                </div>
                <div class="detail-field">
                    <label>Celular</label>
                    <span>${student.apoderado.celular || 'N/A'}</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        ${student.direccion ? `
        <div class="detail-section">
            <h4>Dirección</h4>
            <div class="detail-grid">
                <div class="detail-field">
                    <label>Departamento</label>
                    <span>${student.direccion.departamento || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <label>Provincia</label>
                    <span>${student.direccion.provincia || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <label>Distrito</label>
                    <span>${student.direccion.distrito || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <label>Domicilio</label>
                    <span>${student.direccion.domicilio || 'N/A'}</span>
                </div>
            </div>
        </div>
        ` : ''}
    `;
    
    elements.modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal
function closeModal() {
    elements.modalOverlay.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Mostrar/ocultar loading
function showLoading(show) {
    elements.loadingSpinner.classList.toggle('show', show);
    elements.resultsGrid.style.display = show ? 'none' : 'grid';
}

// Mostrar error
function showError(message) {
    // Crear notificación de error simple
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--error-color);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: var(--shadow-2);
        z-index: 1001;
        font-family: var(--font-family);
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (document.body.contains(errorDiv)) {
            document.body.removeChild(errorDiv);
        }
    }, 5000);
}
