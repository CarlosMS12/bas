/**
 * Cliente de Supabase para Vanilla JavaScript
 * Usa la librería de Supabase desde CDN
 * Configuración cargada desde config.js (generado en build time)
 */

// Validar que la configuración esté disponible
if (!window.SUPABASE_CONFIG) {
	console.error('❌ ERROR: window.SUPABASE_CONFIG no está definido');
	console.error('Asegúrate de que config.js esté cargado ANTES de supabase.js');
	throw new Error('Configuración de Supabase no disponible');
}

const {url, anonKey} = window.SUPABASE_CONFIG;

// Validar credenciales
if (!url || !anonKey) {
	console.error('❌ ERROR: Credenciales de Supabase incompletas');
	console.error('URL:', url ? '✓' : '✗');
	console.error('Anon Key:', anonKey ? '✓' : '✗');
	throw new Error('Credenciales de Supabase inválidas');
}

// Crear cliente de Supabase
const supabaseClient = window.supabase.createClient(url, anonKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
		storage: window.sessionStorage,
	},
});

/**
 * Helper: Obtener usuario actual
 */
async function getCurrentSupabaseUser() {
	const {
		data: {user},
		error,
	} = await supabaseClient.auth.getUser();
	if (error) throw error;
	return user;
}

/**
 * Helper: Obtener sesión actual
 */
async function getCurrentSupabaseSession() {
	const {
		data: {session},
		error,
	} = await supabaseClient.auth.getSession();
	if (error) throw error;
	return session;
}

/**
 * Helper: Cerrar sesión
 */
async function signOutSupabase() {
	const {error} = await supabaseClient.auth.signOut();
	if (error) throw error;
}

// Exponer cliente globalmente
window.supabaseClient = supabaseClient;
window.getCurrentSupabaseUser = getCurrentSupabaseUser;
window.getCurrentSupabaseSession = getCurrentSupabaseSession;
window.signOutSupabase = signOutSupabase;

console.log('[SUPABASE] Cliente inicializado correctamente desde config.js');
console.log('[SUPABASE] URL:', url);
