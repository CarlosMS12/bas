/**
 * Módulo de Autenticación del Frontend
 * Maneja login, registro, logout y gestión de sesiones
 */

class AuthManager {
	static apiUrl = 'http://localhost:3000/api/auth';

	/**
	 * Registrar un nuevo usuario
	 */
	static async register(email, password, fullName, role) {
		try {
			const response = await fetch(`${this.apiUrl}/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					password,
					full_name: fullName,
					role,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: data.error || 'Error al registrar',
				};
			}

			// Si requiere confirmación de email, intentar el endpoint de desarrollo
			if (data.requiresEmailConfirmation) {
				console.log(
					'[AUTH] Email requiere confirmación, intentando endpoint de desarrollo...'
				);
				try {
					const confirmResponse = await fetch(`${this.apiUrl}/dev-confirm-email`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							email,
							password,
						}),
					});

					const confirmData = await confirmResponse.json();

					if (confirmResponse.ok && confirmData.token) {
						console.log('[AUTH] Email confirmado mediante endpoint de desarrollo');
						SessionManager.setToken(confirmData.token);
						SessionManager.setUser({
							email,
							full_name: fullName,
							role,
						});
						return {
							success: true,
							user: {
								email,
								full_name: fullName,
								role,
							},
						};
					}
				} catch (err) {
					console.error('[AUTH] Error en dev-confirm-email:', err);
				}

				// Si no funciona, devolver mensaje amigable
				return {
					success: false,
					error:
						'Se creó la cuenta pero requiere configuración. Verifica la consola del servidor.',
					requiresEmailConfirmation: true,
				};
			}

			// Guardar token y sesión
			SessionManager.setToken(data.token);
			SessionManager.setUser(data.user);
			if (data.session?.refresh_token) {
				SessionManager.setRefreshToken(data.session.refresh_token);
			}

			return {
				success: true,
				user: data.user,
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
	 * Iniciar sesión
	 */
	static async login(email, password) {
		try {
			const response = await fetch(`${this.apiUrl}/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: data.error || 'Error al iniciar sesión',
				};
			}

			// Guardar token y sesión
			SessionManager.setToken(data.token);
			SessionManager.setUser(data.user);
			if (data.session?.refresh_token) {
				SessionManager.setRefreshToken(data.session.refresh_token);
			}

			return {
				success: true,
				user: data.user,
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
	 * Obtener información del usuario actual
	 */
	static async getCurrentUser() {
		const token = SessionManager.getToken();
		if (!token) {
			return null;
		}

		try {
			const response = await fetch(`${this.apiUrl}/me`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				// Token inválido o expirado
				SessionManager.clear();
				return null;
			}

			const data = await response.json();
			SessionManager.setUser(data.user);
			return data.user;
		} catch (error) {
			console.error('Error obteniendo usuario actual:', error);
			return null;
		}
	}

	/**
	 * Cerrar sesión
	 */
	static async logout() {
		const token = SessionManager.getToken();
		if (!token) {
			SessionManager.clear();
			return {success: true};
		}

		try {
			await fetch(`${this.apiUrl}/logout`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
		} catch (error) {
			console.error('Error en logout:', error);
		}

		// Limpiar sesión local independientemente
		SessionManager.clear();
		return {success: true};
	}

	/**
	 * Refrescar token
	 */
	static async refreshToken() {
		const refreshToken = SessionManager.getRefreshToken();
		if (!refreshToken) {
			return null;
		}

		try {
			const response = await fetch(`${this.apiUrl}/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					refresh_token: refreshToken,
				}),
			});

			if (!response.ok) {
				SessionManager.clear();
				return null;
			}

			const data = await response.json();
			SessionManager.setToken(data.token);
			return data.token;
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
