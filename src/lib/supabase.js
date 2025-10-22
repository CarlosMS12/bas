/**
 * Cliente de Supabase para el Frontend
 * Configuración centralizada de Supabase
 */

import {createClient} from '@supabase/supabase-js';

// Obtener variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		'Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY'
	);
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
	},
});

/**
 * Helper: Obtener usuario actual
 */
export async function getCurrentUser() {
	const {
		data: {user},
		error,
	} = await supabase.auth.getUser();
	if (error) throw error;
	return user;
}

/**
 * Helper: Obtener sesión actual
 */
export async function getCurrentSession() {
	const {
		data: {session},
		error,
	} = await supabase.auth.getSession();
	if (error) throw error;
	return session;
}

/**
 * Helper: Cerrar sesión
 */
export async function signOut() {
	const {error} = await supabase.auth.signOut();
	if (error) throw error;
}

export default supabase;
