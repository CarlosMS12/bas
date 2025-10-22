/**
 * Módulo de Autenticación del Frontend - Supabase Auth Directo
 * Maneja login, registro, logout y gestión de sesiones usando Supabase Auth
 */

class AuthManager {
	/**
	 * Registrar un nuevo usuario con Supabase Auth
	 */
	static async register(email, password, fullName, role = 'profesor') {
		try {
			// Registrar con Supabase Auth
			const {data, error} = await supabaseClient.auth.signUp({
				email,
				password,
				options: {
					data: {
						full_name: fullName,
						role: role,
					},
				},
			});

			if (error) {
				return {
					success: false,
					error: error.message || 'Error al registrar',
				};
			}

			// Usuario creado exitosamente
			if (data.user) {
				// Guardar en SessionManager para compatibilidad
				const userData = {
					id: data.user.id,
					email: data.user.email,
					full_name: fullName,
					role: role,
				};

				SessionManager.setUser(userData);

				// Si hay sesión activa, guardar token
				if (data.session) {
					SessionManager.setToken(data.session.access_token);
					if (data.session.refresh_token) {
						SessionManager.setRefreshToken(data.session.refresh_token);
					}
				}

				return {
					success: true,
					user: userData,
					message: data.session
						? 'Registro exitoso'
						: 'Registro exitoso. Por favor verifica tu email si es requerido.',
				};
			}

			return {
				success: false,
				error: 'No se pudo crear el usuario',
			};
		} catch (error) {
			console.error('Error en registro:', error);
			return {
				success: false,
				error: error.message || 'Error de conexión',
			};
		}
	}

	/**
	 * Iniciar sesión con Supabase Auth
	 */
	static async login(email, password) {
		try {
			const {data, error} = await supabaseClient.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				return {
					success: false,
					error: error.message || 'Error al iniciar sesión',
				};
			}

			if (data.user && data.session) {
				// Guardar en SessionManager
				const userData = {
					id: data.user.id,
					email: data.user.email,
					full_name: data.user.user_metadata?.full_name || data.user.email,
					role: data.user.user_metadata?.role || 'profesor',
				};

				SessionManager.setToken(data.session.access_token);
				SessionManager.setUser(userData);
				if (data.session.refresh_token) {
					SessionManager.setRefreshToken(data.session.refresh_token);
				}

				return {
					success: true,
					user: userData,
				};
			}

			return {
				success: false,
				error: 'No se pudo iniciar sesión',
			};
		} catch (error) {
			console.error('Error en login:', error);
			return {
				success: false,
				error: error.message || 'Error de conexión',
			};
		}
	}

	/**
	 * Obtener información del usuario actual desde Supabase
	 */
	static async getCurrentUser() {
		try {
			const {
				data: {user},
				error,
			} = await supabaseClient.auth.getUser();

			if (error || !user) {
				SessionManager.clear();
				return null;
			}

			const userData = {
				id: user.id,
				email: user.email,
				full_name: user.user_metadata?.full_name || user.email,
				role: user.user_metadata?.role || 'profesor',
			};

			SessionManager.setUser(userData);
			return userData;
		} catch (error) {
			console.error('Error obteniendo usuario actual:', error);
			return null;
		}
	}

	/**
	 * Cerrar sesión con Supabase Auth
	 */
	static async logout() {
		try {
			await supabaseClient.auth.signOut();
		} catch (error) {
			console.error('Error en logout:', error);
		} finally {
			SessionManager.clear();
			return {success: true};
		}
	}

	/**
	 * Refrescar token con Supabase Auth
	 */
	static async refreshToken() {
		try {
			const {data, error} = await supabaseClient.auth.refreshSession();

			if (error || !data.session) {
				SessionManager.clear();
				return null;
			}

			SessionManager.setToken(data.session.access_token);
			if (data.session.refresh_token) {
				SessionManager.setRefreshToken(data.session.refresh_token);
			}

			return data.session.access_token;
		} catch (error) {
			console.error('Error refrescando token:', error);
			return null;
		}
	}
}

/**
 * Gestor de Sesión
 * Maneja almacenamiento de tokens y datos del usuario
 */
class SessionManager {
	static TOKEN_KEY = 'auth_token';
	static USER_KEY = 'auth_user';
	static REFRESH_TOKEN_KEY = 'refresh_token';

	/**
	 * Guardar token
	 */
	static setToken(token) {
		if (token) {
			sessionStorage.setItem(this.TOKEN_KEY, token);
		}
	}

	/**
	 * Obtener token
	 */
	static getToken() {
		return sessionStorage.getItem(this.TOKEN_KEY);
	}

	/**
	 * Guardar refresh token
	 */
	static setRefreshToken(token) {
		if (token) {
			sessionStorage.setItem(this.REFRESH_TOKEN_KEY, token);
		}
	}

	/**
	 * Obtener refresh token
	 */
	static getRefreshToken() {
		return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
	}

	/**
	 * Guardar información del usuario
	 */
	static setUser(user) {
		if (user) {
			sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
		}
	}

	/**
	 * Obtener información del usuario
	 */
	static getUser() {
		const userStr = sessionStorage.getItem(this.USER_KEY);
		return userStr ? JSON.parse(userStr) : null;
	}

	/**
	 * Verificar si hay sesión activa
	 */
	static isAuthenticated() {
		return !!this.getToken();
	}

	/**
	 * Limpiar sesión
	 */
	static clear() {
		sessionStorage.removeItem(this.TOKEN_KEY);
		sessionStorage.removeItem(this.USER_KEY);
		sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
	}

	/**
	 * Obtener header Authorization
	 */
	static getAuthHeader() {
		const token = this.getToken();
		if (!token) {
			return null;
		}
		return {
			Authorization: `Bearer ${token}`,
		};
	}
}

/**
 * Protector de rutas
 * Redirige a login si no hay sesión
 */
class RouteProtector {
	/**
	 * Verificar autenticación y redirigir si es necesario
	 * Uso: document.addEventListener('DOMContentLoaded', () => RouteProtector.check());
	 */
	static async check() {
		const isLoginPage =
			window.location.pathname === '/login.html' || window.location.pathname === '/';
		const token = SessionManager.getToken();

		if (isLoginPage && token) {
			// Si estamos en login pero hay sesión, ir a app
			window.location.href = '/app';
			return;
		}

		if (!isLoginPage && !token) {
			// Si estamos en app pero no hay sesión, ir a login
			window.location.href = '/login.html';
			return;
		}

		if (!isLoginPage && token) {
			// Verificar que el token sea válido
			const user = await AuthManager.getCurrentUser();
			if (!user) {
				window.location.href = '/login.html';
			}
		}
	}
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {AuthManager, SessionManager, RouteProtector};
}
