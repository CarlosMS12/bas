// Configuración de la aplicación
const API_BASE_URL = '/api';

// Estado global de la aplicación
let allStudents = [];
let currentStudent = null;
let isEditMode = false;
let originalData = null;

// Datos de opciones disponibles
let availableGrados = [];
let availableSecciones = [];

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
    modalFooter: document.getElementById('modalFooter'),
    editToggleBtn: document.getElementById('editToggleBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    saveEditBtn: document.getElementById('saveEditBtn'),
    listHeader: document.getElementById('listHeader'),
    
    // Elementos del modal de agregar estudiante
    addStudentBtn: document.getElementById('addStudentBtn'),
    addStudentModal: document.getElementById('addStudentModal'),
    addStudentModalClose: document.getElementById('addStudentModalClose'),
    addStudentContent: document.getElementById('addStudentContent'),
    cancelAddBtn: document.getElementById('cancelAddBtn'),
    saveAddBtn: document.getElementById('saveAddBtn'),
    
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
        await loadInitialData();
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

// Cargar datos iniciales
async function loadInitialData() {
    try {
        // Cargar grados y secciones disponibles
        await Promise.all([
            loadAvailableGrados(),
            loadAvailableSecciones()
        ]);
        
        // Cargar estudiantes
        await loadStudents();
        
        // Configurar el estado inicial de filtros
        clearAllFilters();
        
        console.log('Datos iniciales cargados correctamente');
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        showError('Error al cargar los datos iniciales');
    }
}

// Cargar grados disponibles
async function loadAvailableGrados() {
    try {
        const response = await fetch(`${API_BASE_URL}/grados`);
        if (!response.ok) throw new Error('Error al cargar grados');
        
        availableGrados = await response.json();
        console.log('Grados cargados:', availableGrados);
    } catch (error) {
        console.error('Error al cargar grados:', error);
        availableGrados = [];
    }
}

// Cargar secciones disponibles
async function loadAvailableSecciones() {
    try {
        const response = await fetch(`${API_BASE_URL}/secciones`);
        if (!response.ok) throw new Error('Error al cargar secciones');
        
        availableSecciones = await response.json();
        console.log('Secciones cargadas:', availableSecciones);
    } catch (error) {
        console.error('Error al cargar secciones:', error);
        availableSecciones = [];
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
    elements.editToggleBtn.addEventListener('click', toggleEditMode);
    elements.cancelEditBtn.addEventListener('click', cancelEdit);
    elements.saveEditBtn.addEventListener('click', saveChanges);
    elements.modalOverlay.addEventListener('click', function(e) {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    });
    
    // Modal de agregar estudiante
    elements.addStudentBtn.addEventListener('click', openAddStudentModal);
    elements.addStudentModalClose.addEventListener('click', closeAddStudentModal);
    elements.cancelAddBtn.addEventListener('click', closeAddStudentModal);
    elements.saveAddBtn.addEventListener('click', saveNewStudent);
    elements.addStudentModal.addEventListener('click', function(e) {
        if (e.target === elements.addStudentModal) {
            closeAddStudentModal();
        }
    });
    
    // Teclas de escape para cerrar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (elements.addStudentModal.classList.contains('show')) {
                closeAddStudentModal();
            } else {
                closeModal();
            }
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
        elements.listHeader.style.display = 'none';
        elements.noResults.style.display = 'flex';
        elements.paginationContainer.style.display = 'none';
        return;
    }
    
    elements.noResults.style.display = 'none';
    elements.resultsGrid.style.display = 'flex';
    elements.listHeader.style.display = 'flex';
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
            <div class="student-avatar">${initials}</div>
            <div class="student-info">
                <div class="student-name-section">
                    <div class="student-name">${student.apellidos}, ${student.nombres}</div>
                    <div class="student-dni">
                        <span class="material-icons" style="font-size: 14px;">badge</span>
                        <span>${student.dni}</span>
                    </div>
                </div>
                
                <div class="student-personal-info">
                    <div class="student-age">${age} años</div>
                    <div class="student-gender">${student.sexo === 'M' ? 'M' : 'F'}</div>
                </div>
                
                <div class="student-academic">
                    <div class="student-grade-section">
                        <span class="badge">${student.grado}</span>
                        <span class="badge section">${student.seccion}</span>
                    </div>
                </div>
                
                <div class="student-apoderado">
                    ${student.apoderado ? `
                        <div class="apoderado-name">${student.apoderado.nombres} ${student.apoderado.apellidos}</div>
                        <div class="apoderado-contact">
                            <span class="material-icons" style="font-size: 12px;">phone</span>
                            <span>${student.apoderado.celular || 'Sin teléfono'}</span>
                        </div>
                    ` : `
                        <div class="apoderado-name">Sin apoderado</div>
                        <div class="apoderado-contact">-</div>
                    `}
                </div>
                
                <div class="student-location">
                    ${student.direccion ? `
                        <div class="location-district">${student.direccion.distrito}</div>
                        <div class="location-province">${student.direccion.provincia}</div>
                    ` : `
                        <div class="location-district">Sin dirección</div>
                        <div class="location-province">-</div>
                    `}
                </div>
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
    
    // Parse the date manually to avoid timezone issues
    const [year, month, day] = birthDate.split('-').map(num => parseInt(num, 10));
    const birth = new Date(year, month - 1, day); // month is 0-indexed
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
    currentStudent = student;
    isEditMode = false;
    originalData = JSON.parse(JSON.stringify(student)); // Deep copy
    
    // Reset UI state
    elements.editToggleBtn.classList.remove('editing');
    elements.modalFooter.style.display = 'none';
    
    renderStudentDetails(false);
    
    elements.modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Renderizar detalles del estudiante
function renderStudentDetails(editMode = false) {
    const student = currentStudent;
    const age = calculateAge(student.fecha_nacimiento);
    
    elements.modalContent.innerHTML = `
        <div class="detail-section">
            <h4>Información del Estudiante</h4>
            <div class="detail-grid">
                <div class="detail-field">
                    <label>Nombres</label>
                    ${editMode ? 
                        `<input type="text" value="${student.nombres || ''}" name="nombres" required>` :
                        `<span>${student.nombres || 'N/A'}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>Apellidos</label>
                    ${editMode ? 
                        `<input type="text" value="${student.apellidos || ''}" name="apellidos" required>` :
                        `<span>${student.apellidos || 'N/A'}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>DNI</label>
                    ${editMode ? 
                        `<input type="text" value="${student.dni || ''}" name="dni" maxlength="12" pattern="[0-9A-Za-z]{1,12}" required>` :
                        `<span>${student.dni || 'N/A'}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>Fecha de Nacimiento</label>
                    ${editMode ? 
                        `<input type="date" value="${student.fecha_nacimiento || ''}" name="fecha_nacimiento">` :
                        `<span>${formatDate(student.fecha_nacimiento)}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>Edad</label>
                    <span>${age} años</span>
                </div>
                <div class="detail-field">
                    <label>Sexo</label>
                    ${editMode ? 
                        `<select name="sexo" required>
                            <option value="M" ${student.sexo === 'M' ? 'selected' : ''}>Masculino</option>
                            <option value="F" ${student.sexo === 'F' ? 'selected' : ''}>Femenino</option>
                        </select>` :
                        `<span>${student.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>Grado</label>
                    ${editMode ? 
                        `<select name="grado" required>
                            <option value="">Seleccionar grado...</option>
                            ${availableGrados.map(g => 
                                `<option value="${g.grado}" ${student.grado === g.grado ? 'selected' : ''}>${g.grado}</option>`
                            ).join('')}
                        </select>` :
                        `<span>${student.grado || 'N/A'}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>Sección</label>
                    ${editMode ? 
                        `<select name="seccion" required>
                            <option value="">Seleccionar sección...</option>
                            ${availableSecciones.map(s => 
                                `<option value="${s.seccion}" ${student.seccion === s.seccion ? 'selected' : ''}>${s.seccion}</option>`
                            ).join('')}
                        </select>` :
                        `<span>${student.seccion || 'N/A'}</span>`
                    }
                </div>
                ${student.discapacidad || editMode ? `
                <div class="detail-field">
                    <label>Discapacidad</label>
                    ${editMode ? 
                        `<input type="text" value="${student.discapacidad || ''}" name="discapacidad">` :
                        `<span>${student.discapacidad || 'Ninguna'}</span>`
                    }
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
                    ${editMode ? 
                        `<input type="text" value="${student.apoderado.nombres || ''}" name="apoderado_nombres" required>` :
                        `<span>${student.apoderado.nombres || 'N/A'}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>Apellidos</label>
                    ${editMode ? 
                        `<input type="text" value="${student.apoderado.apellidos || ''}" name="apoderado_apellidos" required>` :
                        `<span>${student.apoderado.apellidos || 'N/A'}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>DNI</label>
                    ${editMode ? 
                        `<input type="text" value="${student.apoderado.dni || ''}" name="apoderado_dni" maxlength="12" pattern="[0-9A-Za-z]{1,12}" required>` :
                        `<span>${student.apoderado.dni || 'N/A'}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>Fecha de Nacimiento</label>
                    ${editMode ? 
                        `<input type="date" value="${student.apoderado.fecha_nacimiento || ''}" name="apoderado_fecha_nacimiento">` :
                        `<span>${formatDate(student.apoderado.fecha_nacimiento)}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>Celular</label>
                    ${editMode ? 
                        `<input type="text" value="${student.apoderado.celular || ''}" name="apoderado_celular" maxlength="50" placeholder="Ej: 987654321, 123456789, 555666777">` :
                        `<span>${student.apoderado.celular || 'N/A'}</span>`
                    }
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
                    ${editMode ? 
                        `<input type="text" value="${student.direccion.departamento || ''}" name="direccion_departamento">` :
                        `<span>${student.direccion.departamento || 'N/A'}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>Provincia</label>
                    ${editMode ? 
                        `<input type="text" value="${student.direccion.provincia || ''}" name="direccion_provincia">` :
                        `<span>${student.direccion.provincia || 'N/A'}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>Distrito</label>
                    ${editMode ? 
                        `<input type="text" value="${student.direccion.distrito || ''}" name="direccion_distrito">` :
                        `<span>${student.direccion.distrito || 'N/A'}</span>`
                    }
                </div>
                <div class="detail-field">
                    <label>Domicilio</label>
                    ${editMode ? 
                        `<input type="text" value="${student.direccion.domicilio || ''}" name="direccion_domicilio">` :
                        `<span>${student.direccion.domicilio || 'N/A'}</span>`
                    }
                </div>
            </div>
        </div>
        ` : ''}
    `;
}

// Cerrar modal
function closeModal() {
    if (isEditMode) {
        const confirmClose = confirm('¿Estás seguro de que deseas cerrar? Se perderán los cambios no guardados.');
        if (!confirmClose) return;
    }
    
    elements.modalOverlay.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Reset state
    currentStudent = null;
    isEditMode = false;
    originalData = null;
    elements.editToggleBtn.classList.remove('editing');
    elements.modalFooter.style.display = 'none';
}

// Toggle edit mode
function toggleEditMode() {
    isEditMode = !isEditMode;
    
    if (isEditMode) {
        elements.editToggleBtn.classList.add('editing');
        elements.modalFooter.style.display = 'flex';
        renderStudentDetails(true);
    } else {
        cancelEdit();
    }
}

// Cancelar edición
function cancelEdit() {
    isEditMode = false;
    elements.editToggleBtn.classList.remove('editing');
    elements.modalFooter.style.display = 'none';
    
    // Restore original data
    currentStudent = JSON.parse(JSON.stringify(originalData));
    renderStudentDetails(false);
}

// Guardar cambios
async function saveChanges() {
    try {
        elements.saveEditBtn.disabled = true;
        elements.saveEditBtn.textContent = 'Guardando...';
        
        // Collect form data
        const formData = collectFormData();
        
        // Validate data
        if (!validateFormData(formData)) {
            return;
        }
        
        // Update student data
        await updateStudentData(formData);
        
        // Update UI
        isEditMode = false;
        elements.editToggleBtn.classList.remove('editing');
        elements.modalFooter.style.display = 'none';
        
        // Refresh data
        await loadStudents(currentPagination.page, currentPagination.limit);
        
        // Show success message
        showSuccess('Datos actualizados exitosamente');
        
        // Update modal content with new data
        const updatedStudent = allStudents.find(s => s.id === currentStudent.id);
        if (updatedStudent) {
            currentStudent = updatedStudent;
            originalData = JSON.parse(JSON.stringify(updatedStudent));
            renderStudentDetails(false);
        }
        
    } catch (error) {
        console.error('Error saving changes:', error);
        showError('Error al guardar los cambios: ' + error.message);
    } finally {
        elements.saveEditBtn.disabled = false;
        elements.saveEditBtn.innerHTML = '<span class="material-icons">save</span>Guardar Cambios';
    }
}

// Recopilar datos del formulario
function collectFormData() {
    const inputs = elements.modalContent.querySelectorAll('input, select');
    const data = {};
    
    inputs.forEach(input => {
        const name = input.name;
        const value = input.value.trim();
        
        if (name.startsWith('apoderado_')) {
            const field = name.replace('apoderado_', '');
            if (!data.apoderado) data.apoderado = {};
            data.apoderado[field] = value;
        } else if (name.startsWith('direccion_')) {
            const field = name.replace('direccion_', '');
            if (!data.direccion) data.direccion = {};
            data.direccion[field] = value;
        } else {
            data[name] = value;
        }
    });
    
    return data;
}

// Validar datos del formulario
function validateFormData(data) {
    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
    document.querySelectorAll('.form-error').forEach(el => el.remove());
    
    let isValid = true;
    
    // Validate required fields
    const requiredFields = ['nombres', 'apellidos', 'dni', 'sexo'];
    requiredFields.forEach(field => {
        if (!data[field] || data[field].length === 0) {
            showFieldError(field, 'Este campo es requerido');
            isValid = false;
        }
    });
    
    // Validate DNI format (8-12 characters, numbers and letters for foreign documents)
    if (data.dni && !/^[0-9A-Za-z]{1,12}$/.test(data.dni)) {
        showFieldError('dni', 'DNI debe tener entre 1 y 12 caracteres (números y letras)');
        isValid = false;
    }
    
    // Validate apoderado DNI if exists
    if (data.apoderado && data.apoderado.dni && !/^[0-9A-Za-z]{1,12}$/.test(data.apoderado.dni)) {
        showFieldError('apoderado_dni', 'DNI debe tener entre 1 y 12 caracteres (números y letras)');
        isValid = false;
    }
    
    // Validate phone number if exists (now allows multiple numbers separated by commas, spaces, or other separators)
    if (data.apoderado && data.apoderado.celular && data.apoderado.celular.length > 50) {
        showFieldError('apoderado_celular', 'Campo de celular demasiado largo (máximo 50 caracteres)');
        isValid = false;
    }
    
    return isValid;
}

// Mostrar error en campo específico
function showFieldError(fieldName, message) {
    const input = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
    if (input) {
        input.classList.add('field-error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }
}

// Actualizar datos del estudiante
async function updateStudentData(formData) {
    const promises = [];
    
    // Update student
    const studentData = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        dni: formData.dni,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        sexo: formData.sexo,
        discapacidad: formData.discapacidad || null,
        grado: formData.grado || null,
        seccion: formData.seccion || null
    };
    
    promises.push(
        fetch(`${API_BASE_URL}/students/${currentStudent.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        })
    );
    
    // Update apoderado if exists and has valid ID
    if (currentStudent.apoderado && formData.apoderado && currentStudent.apoderado.id) {
        const apoderadoData = {
            nombres: formData.apoderado.nombres,
            apellidos: formData.apoderado.apellidos,
            dni: formData.apoderado.dni,
            fecha_nacimiento: formData.apoderado.fecha_nacimiento || null,
            celular: formData.apoderado.celular || null
        };
        
        promises.push(
            fetch(`${API_BASE_URL}/apoderados/${currentStudent.apoderado.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apoderadoData)
            })
        );
    }
    
    // Update direccion if exists and has valid ID
    if (currentStudent.direccion && formData.direccion && (currentStudent.direccion.id || currentStudent.direccion_id)) {
        const direccionId = currentStudent.direccion.id || currentStudent.direccion_id;
        
        // Only update if we have some direccion data to update
        const hasData = formData.direccion.departamento || 
                       formData.direccion.provincia || 
                       formData.direccion.distrito || 
                       formData.direccion.domicilio;
        
        if (hasData) {
            const direccionData = {
                departamento: formData.direccion.departamento || null,
                provincia: formData.direccion.provincia || null,
                distrito: formData.direccion.distrito || null,
                domicilio: formData.direccion.domicilio || null
            };
            
            promises.push(
                fetch(`${API_BASE_URL}/direcciones/${direccionId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(direccionData)
                })
            );
        }
    }
    
    // Wait for all updates
    const responses = await Promise.all(promises);
    
    // Check if all requests were successful
    for (const response of responses) {
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar datos');
        }
    }
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    // Parse the date manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Mostrar/ocultar loading
function showLoading(show) {
    elements.loadingSpinner.classList.toggle('show', show);
    elements.resultsGrid.style.display = show ? 'none' : 'flex';
    elements.listHeader.style.display = show ? 'none' : 'flex';
}

// Mostrar error
function showError(message) {
    showNotification(message, 'error');
}

// Mostrar éxito
function showSuccess(message) {
    showNotification(message, 'success');
}

// Mostrar notificación
function showNotification(message, type = 'error') {
    const notificationDiv = document.createElement('div');
    notificationDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : 'var(--error-color)'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: var(--shadow-2);
        z-index: 1001;
        font-family: var(--font-family);
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    const icon = type === 'success' ? 'check_circle' : 'error';
    notificationDiv.innerHTML = `
        <span class="material-icons" style="font-size: 20px;">${icon}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notificationDiv);
    
    setTimeout(() => {
        if (document.body.contains(notificationDiv)) {
            document.body.removeChild(notificationDiv);
        }
    }, 5000);
}

// ========================================
// FUNCIONALIDAD DE AGREGAR ESTUDIANTE
// ========================================

// Abrir modal de agregar estudiante
function openAddStudentModal() {
    console.log('Opening add student modal...');
    renderAddStudentForm();
    elements.addStudentModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    console.log('Modal opened successfully');
}

// Cerrar modal de agregar estudiante
function closeAddStudentModal() {
    elements.addStudentModal.classList.remove('show');
    document.body.style.overflow = '';
}

// Renderizar formulario de agregar estudiante
function renderAddStudentForm() {
    elements.addStudentContent.innerHTML = `
        <div class="detail-section">
            <h4>Información del Estudiante</h4>
            <div class="detail-grid">
                <div class="detail-field">
                    <label for="add-nombres">Nombres *</label>
                    <input type="text" id="add-nombres" name="nombres" required placeholder="Nombres del estudiante">
                </div>
                <div class="detail-field">
                    <label for="add-apellidos">Apellidos *</label>
                    <input type="text" id="add-apellidos" name="apellidos" required placeholder="Apellidos del estudiante">
                </div>
                <div class="detail-field">
                    <label for="add-dni">DNI *</label>
                    <input type="text" id="add-dni" name="dni" maxlength="12" pattern="[0-9A-Za-z]{1,12}" required placeholder="Documento de identidad">
                </div>
                <div class="detail-field">
                    <label for="add-fecha-nacimiento">Fecha de Nacimiento</label>
                    <input type="date" id="add-fecha-nacimiento" name="fecha_nacimiento">
                </div>
                <div class="detail-field">
                    <label for="add-sexo">Sexo *</label>
                    <select id="add-sexo" name="sexo" required>
                        <option value="">Seleccionar sexo...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                    </select>
                </div>
                <div class="detail-field">
                    <label for="add-grado">Grado</label>
                    <select id="add-grado" name="grado">
                        <option value="">Seleccionar grado...</option>
                        ${availableGrados.map(g => 
                            `<option value="${g.grado}">${g.grado}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="detail-field">
                    <label for="add-seccion">Sección</label>
                    <select id="add-seccion" name="seccion">
                        <option value="">Seleccionar sección...</option>
                        ${availableSecciones.map(s => 
                            `<option value="${s.seccion}">${s.seccion}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="detail-field">
                    <label for="add-discapacidad">Discapacidad</label>
                    <input type="text" id="add-discapacidad" name="discapacidad" placeholder="Especificar si tiene alguna discapacidad">
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Información del Apoderado</h4>
            <div class="detail-grid">
                <div class="detail-field">
                    <label for="add-apoderado-nombres">Nombres</label>
                    <input type="text" id="add-apoderado-nombres" name="apoderado_nombres" placeholder="Nombres del apoderado">
                </div>
                <div class="detail-field">
                    <label for="add-apoderado-apellidos">Apellidos</label>
                    <input type="text" id="add-apoderado-apellidos" name="apoderado_apellidos" placeholder="Apellidos del apoderado">
                </div>
                <div class="detail-field">
                    <label for="add-apoderado-dni">DNI</label>
                    <input type="text" id="add-apoderado-dni" name="apoderado_dni" maxlength="12" pattern="[0-9A-Za-z]{1,12}" placeholder="Documento del apoderado">
                </div>
                <div class="detail-field">
                    <label for="add-apoderado-fecha-nacimiento">Fecha de Nacimiento</label>
                    <input type="date" id="add-apoderado-fecha-nacimiento" name="apoderado_fecha_nacimiento">
                </div>
                <div class="detail-field">
                    <label for="add-apoderado-celular">Celular</label>
                    <input type="text" id="add-apoderado-celular" name="apoderado_celular" maxlength="50" placeholder="Ej: 987654321, 123456789">
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Información de Dirección</h4>
            <div class="detail-grid">
                <div class="detail-field">
                    <label for="add-direccion-departamento">Departamento</label>
                    <input type="text" id="add-direccion-departamento" name="direccion_departamento" placeholder="Departamento">
                </div>
                <div class="detail-field">
                    <label for="add-direccion-provincia">Provincia</label>
                    <input type="text" id="add-direccion-provincia" name="direccion_provincia" placeholder="Provincia">
                </div>
                <div class="detail-field">
                    <label for="add-direccion-distrito">Distrito</label>
                    <input type="text" id="add-direccion-distrito" name="direccion_distrito" placeholder="Distrito">
                </div>
                <div class="detail-field">
                    <label for="add-direccion-domicilio">Domicilio</label>
                    <input type="text" id="add-direccion-domicilio" name="direccion_domicilio" placeholder="Dirección específica">
                </div>
            </div>
        </div>
    `;
}

// Recopilar datos del formulario de agregar estudiante
function collectAddStudentFormData() {
    const inputs = elements.addStudentContent.querySelectorAll('input, select');
    const data = {};
    
    inputs.forEach(input => {
        const name = input.name;
        const value = input.value.trim();
        
        if (name.startsWith('apoderado_')) {
            const field = name.replace('apoderado_', '');
            if (!data.apoderado) data.apoderado = {};
            data.apoderado[field] = value || null;
        } else if (name.startsWith('direccion_')) {
            const field = name.replace('direccion_', '');
            if (!data.direccion) data.direccion = {};
            data.direccion[field] = value || null;
        } else {
            data[name] = value || null;
        }
    });
    
    return data;
}

// Validar datos del nuevo estudiante
function validateAddStudentData(data) {
    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
    document.querySelectorAll('.form-error').forEach(el => el.remove());
    
    let isValid = true;
    
    // Validate required fields
    const requiredFields = ['nombres', 'apellidos', 'dni', 'sexo'];
    requiredFields.forEach(field => {
        if (!data[field] || data[field].length === 0) {
            showFieldError(field, 'Este campo es requerido');
            isValid = false;
        }
    });
    
    // Validate DNI format
    if (data.dni && !/^[0-9A-Za-z]{1,12}$/.test(data.dni)) {
        showFieldError('dni', 'DNI debe tener entre 1 y 12 caracteres (números y letras)');
        isValid = false;
    }
    
    // Validate apoderado DNI if exists
    if (data.apoderado && data.apoderado.dni && !/^[0-9A-Za-z]{1,12}$/.test(data.apoderado.dni)) {
        showFieldError('apoderado_dni', 'DNI debe tener entre 1 y 12 caracteres (números y letras)');
        isValid = false;
    }
    
    // Validate phone number if exists
    if (data.apoderado && data.apoderado.celular && data.apoderado.celular.length > 50) {
        showFieldError('apoderado_celular', 'Campo de celular demasiado largo (máximo 50 caracteres)');
        isValid = false;
    }
    
    return isValid;
}

// Guardar nuevo estudiante
async function saveNewStudent() {
    try {
        const formData = collectAddStudentFormData();
        
        if (!validateAddStudentData(formData)) {
            return;
        }
        
        // Show loading state
        elements.saveAddBtn.disabled = true;
        elements.saveAddBtn.innerHTML = `
            <span class="material-icons">hourglass_empty</span>
            Guardando...
        `;
        
        const response = await fetch(`${API_BASE_URL}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear estudiante');
        }
        
        const result = await response.json();
        showSuccess('Estudiante creado exitosamente');
        
        // Close modal and refresh data
        closeAddStudentModal();
        await loadStudents();
        
    } catch (error) {
        console.error('Error saving new student:', error);
        showError('Error al crear estudiante: ' + error.message);
    } finally {
        // Restore button state
        elements.saveAddBtn.disabled = false;
        elements.saveAddBtn.innerHTML = `
            <span class="material-icons">person_add</span>
            Agregar Estudiante
        `;
    }
}
