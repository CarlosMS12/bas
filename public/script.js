// ==========================================
// CONFIGURACIÓN Y CONTROL DE RACE CONDITIONS
// ==========================================

// Ya no necesitamos API_BASE_URL ni getAuthHeaders() 
// porque usamos API_Services que llama directamente a Supabase

// Sistema de tokens para cancelar requests obsoletos
class RequestController {
    constructor() {
        this.tokens = {
            filterOptions: Symbol('filterOptions'),
            studentsList: Symbol('studentsList'),
            search: Symbol('search')
        };
        this.activeRequests = new Map();
    }

    startRequest(token) {
        this.activeRequests.set(token, true);
        return token;
    }

    isActive(token) {
        return this.activeRequests.has(token) && this.activeRequests.get(token);
    }

    cancelRequest(token) {
        if (this.activeRequests.has(token)) {
            this.activeRequests.set(token, false);
        }
    }

    cancelAllRequests() {
        for (const token of this.activeRequests.keys()) {
            this.activeRequests.set(token, false);
        }
    }
}

const requestController = new RequestController();

// Sistema de caché mejorado
class CacheManager {
    constructor(duration = 5 * 60 * 1000) {
        this.duration = duration;
        this.storage = new Map();
    }

    getCacheKey(endpoint, params = {}) {
        return `${endpoint}:${JSON.stringify(params)}`;
    }

    get(key) {
        const item = this.storage.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.duration) {
            this.storage.delete(key);
            return null;
        }
        return item.data;
    }

    set(key, data) {
        this.storage.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    invalidate(pattern) {
        for (const key of this.storage.keys()) {
            if (key.includes(pattern)) {
                this.storage.delete(key);
            }
        }
    }

    clear() {
        this.storage.clear();
    }
}

const cacheManager = new CacheManager();

// ==========================================
// ESTADO GLOBAL
// ==========================================

let allStudents = [];
let currentStudent = null;
let isEditMode = false;
let originalData = null;
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

// Debounce timers
let searchDebounceTimer = null;
let filterDebounceTimer = null;

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================

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
    deleteStudentBtn: document.getElementById('deleteStudentBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    saveEditBtn: document.getElementById('saveEditBtn'),
    listHeader: document.getElementById('listHeader'),
    addStudentBtn: document.getElementById('addStudentBtn'),
    addStudentModal: document.getElementById('addStudentModal'),
    addStudentModalClose: document.getElementById('addStudentModalClose'),
    addStudentContent: document.getElementById('addStudentContent'),
    cancelAddBtn: document.getElementById('cancelAddBtn'),
    saveAddBtn: document.getElementById('saveAddBtn'),
    paginationContainer: document.getElementById('paginationContainer'),
    paginationInfo: document.getElementById('paginationInfo'),
    pageSize: document.getElementById('pageSize'),
    firstPageBtn: document.getElementById('firstPageBtn'),
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),
    lastPageBtn: document.getElementById('lastPageBtn'),
    pageNumbers: document.getElementById('pageNumbers')
};

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        showLoading(true);
        console.log('[INIT] Iniciando aplicación...');

        // Paso 1: Cargar opciones de filtro (grados y secciones) - UNA SOLA VEZ
        console.log('[INIT] Cargando opciones de filtro...');
        await loadFilterOptions();

        // Paso 2: Cargar estudiantes iniciales
        console.log('[INIT] Cargando estudiantes iniciales...');
        await loadStudents();

        // Paso 3: Configurar event listeners
        console.log('[INIT] Configurando event listeners...');
        setupEventListeners();

        console.log('[INIT] Aplicación inicializada correctamente');
        showLoading(false);
    } catch (error) {
        console.error('[INIT] Error:', error);
        showError('Error al cargar la aplicación: ' + error.message);
        showLoading(false);
    }
}

// ==========================================
// CARGAR DATOS DE FILTROS
// ==========================================

async function loadFilterOptions() {
    const token = requestController.startRequest(requestController.tokens.filterOptions);

    try {
        // Usar caché si está disponible
        const cacheKey = cacheManager.getCacheKey('filter-options');
        let cachedOptions = cacheManager.get(cacheKey);

        if (cachedOptions) {
            console.log('[CACHE] Usando opciones de filtro en caché');
            availableGrados = cachedOptions.grados;
            availableSecciones = cachedOptions.secciones;
            populateFilterSelects();
            return;
        }

        // Cargar grados y secciones en paralelo
        console.log('[FETCH] Obteniendo grados y secciones...');
        const [gradosData, seccionesData] = await Promise.all([
            API_Services.getGrados(),
            API_Services.getSecciones()
        ]);

        // Verificar que la request siga siendo activa
        if (!requestController.isActive(token)) {
            console.log('[CANCEL] Request de filter options cancelada');
            return;
        }

        // Validar que los datos sean arrays
        availableGrados = Array.isArray(gradosData) ? gradosData : [];
        availableSecciones = Array.isArray(seccionesData) ? seccionesData : [];

        console.log('[SUCCESS] Grados cargados:', availableGrados.length);
        console.log('[SUCCESS] Secciones cargadas:', availableSecciones.length);

        // Guardar en caché
        cacheManager.set(cacheKey, {
            grados: availableGrados,
            secciones: availableSecciones
        });

        // Poblar selects
        populateFilterSelects();

    } catch (error) {
        if (requestController.isActive(token)) {
            console.error('[ERROR] Error al cargar opciones de filtro:', error);
            showError('Error al cargar opciones de filtro');
            availableGrados = [];
            availableSecciones = [];
        }
    }
}

function populateFilterSelects() {
    console.log('[UI] Poblando selects de filtros...');

    // Limpiar opciones actuales (mantener el primer option vacío)
    const gradoOptions = elements.gradoFilter.querySelectorAll('option:not(:first-child)');
    gradoOptions.forEach(opt => opt.remove());

    const seccionOptions = elements.seccionFilter.querySelectorAll('option:not(:first-child)');
    seccionOptions.forEach(opt => opt.remove());

    // Agregar nuevas opciones
    availableGrados.forEach(grado => {
        const value = grado.grado || grado;
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        elements.gradoFilter.appendChild(option);
    });

    availableSecciones.forEach(seccion => {
        const value = seccion.seccion || seccion;
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        elements.seccionFilter.appendChild(option);
    });

    console.log('[UI] Selects poblados correctamente');
}

// ==========================================
// CARGAR ESTUDIANTES
// ==========================================

async function loadStudents(page = 1, limit = 24) {
    const token = requestController.startRequest(requestController.tokens.studentsList);

    try {
        showLoading(true);

        const hasFilters = currentFilters.search || currentFilters.grado ||
            currentFilters.seccion || currentFilters.sexo;

        let url = hasFilters ? 'search' : 'students';

        // Preparar filtros para API_Services
        const filters = {};
        if (hasFilters) {
            if (currentFilters.search) filters.search = currentFilters.search;
            if (currentFilters.grado) filters.grado = currentFilters.grado;
            if (currentFilters.seccion) filters.seccion = currentFilters.seccion;
            if (currentFilters.sexo) filters.sexo = currentFilters.sexo;
        }

        // Intentar obtener del caché si NO hay filtros
        let data = null;
        if (!hasFilters) {
            const cacheKey = cacheManager.getCacheKey(url, {page, limit});
            data = cacheManager.get(cacheKey);
            if (data) {
                console.log('[CACHE] Usando datos de estudiantes en caché');
            }
        }

        // Si no está en caché, hacer la llamada
        if (!data) {
            console.log('[FETCH] Obteniendo estudiantes de página', page);
            
            // Usar API_Services en lugar de fetch
            data = hasFilters 
                ? await API_Services.searchStudents(filters, page, limit)
                : await API_Services.getStudents(page, limit);

            if (!requestController.isActive(token)) {
                console.log('[CANCEL] Request de estudiantes cancelada');
                return;
            }

            // Guardar en caché si NO hay filtros
            if (!hasFilters) {
                const cacheKey = cacheManager.getCacheKey(url, {page, limit});
                cacheManager.set(cacheKey, data);
            }
        }

        // Validar estructura de datos
        if (!data.students || !Array.isArray(data.students)) {
            throw new Error('Formato de respuesta inválido');
        }

        allStudents = data.students;
        currentPagination = data.pagination;

        // Actualizar contador total solo en primera página sin filtros
        if (!hasFilters && page === 1) {
            elements.totalEstudiantes.textContent = data.pagination.total;
        }

        console.log('[SUCCESS] Estudiantes cargados:', allStudents.length);

        displayStudents(allStudents);
        updatePagination();

    } catch (error) {
        if (requestController.isActive(token)) {
            console.error('[ERROR] Error al cargar estudiantes:', error);
            showError('Error al cargar estudiantes: ' + error.message);
        }
    } finally {
        showLoading(false);
    }
}

// ==========================================
// SETUP DE EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    // Búsqueda con debounce mejorado
    elements.searchInput.addEventListener('input', function(e) {
        clearTimeout(searchDebounceTimer);
        console.log('[SEARCH] Input detectado:', e.target.value);

        searchDebounceTimer = setTimeout(() => {
            handleSearch();
        }, 500); // Esperar 500ms después de que deje de escribir
    });

    // Filtros con debounce
    [elements.gradoFilter, elements.seccionFilter, elements.sexoFilter, elements.searchType].forEach(element => {
        element.addEventListener('change', function(e) {
            clearTimeout(filterDebounceTimer);
            console.log('[FILTER] Cambio detectado en:', e.target.name || e.target.id);

            filterDebounceTimer = setTimeout(() => {
                handleFilterChange();
            }, 300); // Esperar 300ms para procesar filtro
        });
    });

    // Toggle filtros
    elements.filterToggle.addEventListener('click', toggleFilters);

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
    elements.deleteStudentBtn.addEventListener('click', deleteStudent);
    elements.cancelEditBtn.addEventListener('click', cancelEdit);
    elements.saveEditBtn.addEventListener('click', saveChanges);
    elements.modalOverlay.addEventListener('click', function(e) {
        if (e.target === elements.modalOverlay) closeModal();
    });

    // Modal agregar estudiante
    elements.addStudentBtn.addEventListener('click', openAddStudentModal);
    elements.addStudentModalClose.addEventListener('click', closeAddStudentModal);
    elements.cancelAddBtn.addEventListener('click', closeAddStudentModal);
    elements.saveAddBtn.addEventListener('click', saveNewStudent);
    elements.addStudentModal.addEventListener('click', function(e) {
        if (e.target === elements.addStudentModal) closeAddStudentModal();
    });

    // Escape para cerrar modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (elements.addStudentModal.classList.contains('show')) {
                closeAddStudentModal();
            } else {
                closeModal();
            }
        }
    });

    console.log('[UI] Event listeners configurados');
}

// ==========================================
// FUNCIONES DE BÚSQUEDA Y FILTROS
// ==========================================

function handleSearch() {
    const newSearch = elements.searchInput.value.trim();

    if (newSearch !== currentFilters.search) {
        console.log('[SEARCH] Aplicando búsqueda:', newSearch);
        currentFilters.search = newSearch;

        // Invalidar caché cuando cambia búsqueda
        cacheManager.invalidate('students');
        cacheManager.invalidate('search');

        resetToFirstPage();
    }
}

function handleFilterChange() {
    const newGrado = elements.gradoFilter.value;
    const newSeccion = elements.seccionFilter.value;
    const newSexo = elements.sexoFilter.value;
    const newSearchType = elements.searchType.value;

    if (
        newGrado !== currentFilters.grado ||
        newSeccion !== currentFilters.seccion ||
        newSexo !== currentFilters.sexo ||
        newSearchType !== currentFilters.searchType
    ) {
        console.log('[FILTER] Aplicando filtros:', { newGrado, newSeccion, newSexo });

        currentFilters.grado = newGrado;
        currentFilters.seccion = newSeccion;
        currentFilters.sexo = newSexo;
        currentFilters.searchType = newSearchType;

        // Invalidar caché
        cacheManager.invalidate('search');

        resetToFirstPage();
    }
}

function handlePageSizeChange() {
    const newLimit = parseInt(elements.pageSize.value);
    console.log('[PAGINATION] Cambio de tamaño de página a:', newLimit);

    currentPagination.limit = newLimit;
    cacheManager.invalidate('students');
    resetToFirstPage();
}

async function resetToFirstPage() {
    console.log('[NAV] Volviendo a primera página');
    await goToPage(1);
}

async function goToPage(page) {
    // Permitir ir a página 1 siempre (para recargas)
    if (page < 1) {
        console.warn('[NAV] Página inválida:', page);
        return;
    }
    
    // Solo validar totalPages si ya hay datos cargados y no es página 1
    if (page > 1 && currentPagination.totalPages > 0 && page > currentPagination.totalPages) {
        console.warn('[NAV] Página inválida:', page, '(total:', currentPagination.totalPages + ')');
        return;
    }

    console.log('[NAV] Ir a página:', page);
    await loadStudents(page, currentPagination.limit);
}

function clearAllFilters() {
    console.log('[FILTER] Limpiando todos los filtros');

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

    // Invalidar caché
    cacheManager.invalidate('search');

    resetToFirstPage();
}

// ==========================================
// FUNCIONES DE UI
// ==========================================

function toggleFilters() {
    const isVisible = elements.filtersPanel.classList.contains('show');
    elements.filtersPanel.classList.toggle('show', !isVisible);
    elements.filterToggle.classList.toggle('active', !isVisible);
}

function showLoading(show) {
    elements.loadingSpinner.classList.toggle('show', show);
    if (!show) {
        elements.resultsGrid.style.display = allStudents.length > 0 ? 'flex' : 'none';
        elements.listHeader.style.display = allStudents.length > 0 ? 'flex' : 'none';
    }
}

function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

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

// ==========================================
// MOSTRAR ESTUDIANTES
// ==========================================

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

    // Agregar listeners a tarjetas
    elements.resultsGrid.querySelectorAll('.student-card').forEach((card, index) => {
        card.addEventListener('click', () => showStudentDetails(students[index]));
    });
}

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
                        <span class="badge">${student.grado || 'N/A'}</span>
                        <span class="badge section">${student.seccion || 'N/A'}</span>
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

function updatePagination() {
    const { page, totalPages, hasNext, hasPrev } = currentPagination;

    elements.paginationInfo.textContent = `Página ${page} de ${totalPages}`;

    elements.firstPageBtn.disabled = !hasPrev;
    elements.prevPageBtn.disabled = !hasPrev;
    elements.nextPageBtn.disabled = !hasNext;
    elements.lastPageBtn.disabled = !hasNext;

    generatePageNumbers();
}

function generatePageNumbers() {
    const { page, totalPages } = currentPagination;
    elements.pageNumbers.innerHTML = '';

    if (totalPages <= 1) return;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        addPageNumber(1);
        if (startPage > 2) addPageEllipsis();
    }

    for (let i = startPage; i <= endPage; i++) {
        addPageNumber(i);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) addPageEllipsis();
        addPageNumber(totalPages);
    }
}

function addPageNumber(pageNum) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `page-number ${pageNum === currentPagination.page ? 'active' : ''}`;
    pageBtn.textContent = pageNum;
    pageBtn.addEventListener('click', () => goToPage(pageNum));
    elements.pageNumbers.appendChild(pageBtn);
}

function addPageEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.className = 'page-ellipsis';
    ellipsis.textContent = '...';
    elements.pageNumbers.appendChild(ellipsis);
}

// ==========================================
// UTILIDADES
// ==========================================

function getInitials(nombres, apellidos) {
    const firstInitial = nombres ? nombres.charAt(0).toUpperCase() : '';
    const lastInitial = apellidos ? apellidos.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
}

function calculateAge(birthDate) {
    if (!birthDate) return 'N/A';

    const [year, month, day] = birthDate.split('-').map(num => parseInt(num, 10));
    const birth = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ==========================================
// FUNCIONALIDADES DE MODAL (copiar del script original)
// ==========================================

// Mostrar detalles del estudiante
function showStudentDetails(student) {
    currentStudent = student;
    isEditMode = false;
    originalData = JSON.parse(JSON.stringify(student));

    elements.editToggleBtn.classList.remove('editing');
    elements.deleteStudentBtn.style.display = 'flex';
    elements.modalFooter.style.display = 'none';

    renderStudentDetails(false);

    elements.modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Renderizar detalles
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
                        `<input type="text" value="${student.apoderado.celular || ''}" name="apoderado_celular" maxlength="50" placeholder="Ej: 987654321">` :
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
        elements.deleteStudentBtn.style.display = 'none';
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
    elements.deleteStudentBtn.style.display = 'flex';
    elements.modalFooter.style.display = 'none';

    currentStudent = JSON.parse(JSON.stringify(originalData));
    renderStudentDetails(false);
}

// Guardar cambios
async function saveChanges() {
    try {
        elements.saveEditBtn.disabled = true;
        elements.saveEditBtn.textContent = 'Guardando...';

        const formData = collectFormData();

        if (!validateFormData(formData)) {
            return;
        }

        await updateStudentData(formData);

        isEditMode = false;
        elements.editToggleBtn.classList.remove('editing');
        elements.modalFooter.style.display = 'none';

        // Invalidar caché
        cacheManager.invalidate('students');
        cacheManager.invalidate('search');

        await loadStudents(currentPagination.page, currentPagination.limit);

        showSuccess('Datos actualizados exitosamente');

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

// Validar datos
function validateFormData(data) {
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
    document.querySelectorAll('.form-error').forEach(el => el.remove());

    let isValid = true;

    const requiredFields = ['nombres', 'apellidos', 'dni', 'sexo'];
    requiredFields.forEach(field => {
        if (!data[field] || data[field].length === 0) {
            showFieldError(field, 'Este campo es requerido');
            isValid = false;
        }
    });

    if (data.dni && !/^[0-9A-Za-z]{1,12}$/.test(data.dni)) {
        showFieldError('dni', 'DNI debe tener entre 1 y 12 caracteres (números y letras)');
        isValid = false;
    }

    if (data.apoderado && data.apoderado.dni && !/^[0-9A-Za-z]{1,12}$/.test(data.apoderado.dni)) {
        showFieldError('apoderado_dni', 'DNI debe tener entre 1 y 12 caracteres (números y letras)');
        isValid = false;
    }

    if (data.apoderado && data.apoderado.celular && data.apoderado.celular.length > 50) {
        showFieldError('apoderado_celular', 'Campo de celular demasiado largo (máximo 50 caracteres)');
        isValid = false;
    }

    return isValid;
}

// Mostrar error en campo
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

    const studentData = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        dni: formData.dni,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        sexo: formData.sexo,
        discapacidad: formData.discapacidad || null
    };

    // Actualizar estudiante usando API_Services
    promises.push(
        API_Services.updateStudent(currentStudent.id, studentData)
    );

    if (currentStudent.apoderado && formData.apoderado && currentStudent.apoderado.id) {
        const apoderadoData = {
            nombres: formData.apoderado.nombres,
            apellidos: formData.apoderado.apellidos,
            dni: formData.apoderado.dni,
            fecha_nacimiento: formData.apoderado.fecha_nacimiento || null,
            celular: formData.apoderado.celular || null
        };

        // Actualizar apoderado usando API_Services
        promises.push(
            API_Services.updateApoderado(currentStudent.apoderado.id, apoderadoData)
        );
    }

    if (currentStudent.direccion && formData.direccion && (currentStudent.direccion.id || currentStudent.direccion_id)) {
        const direccionId = currentStudent.direccion.id || currentStudent.direccion_id;

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

            // Actualizar dirección usando API_Services
            promises.push(
                API_Services.updateDireccion(direccionId, direccionData)
            );
        }
    }

    await Promise.all(promises);
}

// ==========================================
// FUNCIONALIDAD DE AGREGAR ESTUDIANTE
// ==========================================

function openAddStudentModal() {
    console.log('[UI] Abriendo modal de agregar estudiante');
    renderAddStudentForm();
    elements.addStudentModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeAddStudentModal() {
    elements.addStudentModal.classList.remove('show');
    document.body.style.overflow = '';
}

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
                    <input type="text" id="add-apoderado-celular" name="apoderado_celular" maxlength="50" placeholder="Ej: 987654321">
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

function validateAddStudentData(data) {
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
    document.querySelectorAll('.form-error').forEach(el => el.remove());

    let isValid = true;

    const requiredFields = ['nombres', 'apellidos', 'dni', 'sexo'];
    requiredFields.forEach(field => {
        if (!data[field] || data[field].length === 0) {
            showFieldError(field, 'Este campo es requerido');
            isValid = false;
        }
    });

    if (data.dni && !/^[0-9A-Za-z]{1,12}$/.test(data.dni)) {
        showFieldError('dni', 'DNI debe tener entre 1 y 12 caracteres (números y letras)');
        isValid = false;
    }

    if (data.apoderado && data.apoderado.dni && !/^[0-9A-Za-z]{1,12}$/.test(data.apoderado.dni)) {
        showFieldError('apoderado_dni', 'DNI debe tener entre 1 y 12 caracteres (números y letras)');
        isValid = false;
    }

    if (data.apoderado && data.apoderado.celular && data.apoderado.celular.length > 50) {
        showFieldError('apoderado_celular', 'Campo de celular demasiado largo (máximo 50 caracteres)');
        isValid = false;
    }

    return isValid;
}

async function saveNewStudent() {
    try {
        const formData = collectAddStudentFormData();

        if (!validateAddStudentData(formData)) {
            return;
        }

        elements.saveAddBtn.disabled = true;
        elements.saveAddBtn.innerHTML = `
            <span class="material-icons">hourglass_empty</span>
            Guardando...
        `;

        // Crear estudiante usando API_Services
        const result = await API_Services.createStudent(formData);
        
        showSuccess('Estudiante creado exitosamente');

        // Invalidar caché
        cacheManager.invalidate('students');
        cacheManager.invalidate('search');

        closeAddStudentModal();
        await loadStudents();

    } catch (error) {
        console.error('Error saving new student:', error);
        showError('Error al crear estudiante: ' + error.message);
    } finally {
        elements.saveAddBtn.disabled = false;
        elements.saveAddBtn.innerHTML = `
            <span class="material-icons">person_add</span>
            Agregar Estudiante
        `;
    }
}

// ==========================================
// FUNCIONALIDAD DE ELIMINAR ESTUDIANTE
// ==========================================

async function deleteStudent() {
    if (!currentStudent) {
        showError('No hay estudiante seleccionado');
        return;
    }

    const studentName = `${currentStudent.nombres} ${currentStudent.apellidos}`;
    const confirmMessage = `¿Estás seguro de que deseas eliminar permanentemente a:\n\n${studentName}\n\nEsta acción no se puede deshacer.`;

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        elements.deleteStudentBtn.disabled = true;
        elements.deleteStudentBtn.innerHTML = `
            <span class="material-icons">hourglass_empty</span>
            <span class="btn-text">Eliminando...</span>
        `;

        // Eliminar estudiante usando API_Services
        const result = await API_Services.deleteStudent(currentStudent.id);
        
        showSuccess(`Estudiante ${studentName} eliminado exitosamente`);

        // Invalidar caché
        cacheManager.invalidate('students');
        cacheManager.invalidate('search');

        closeModal();
        await loadStudents();

    } catch (error) {
        console.error('Error deleting student:', error);
        showError('Error al eliminar estudiante: ' + error.message);
    } finally {
        elements.deleteStudentBtn.disabled = false;
        elements.deleteStudentBtn.innerHTML = `
            <span class="material-icons">delete</span>
            <span class="btn-text">Eliminar</span>
        `;
    }
}
