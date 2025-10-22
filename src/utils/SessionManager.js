/**
 * Gestor de sesión del cliente
 * Maneja el almacenamiento de tokens y datos de usuario
 */

class SessionManager {
	constructor() {
		this.tokenKey = 'auth_token';
		this.userKey = 'auth_user';
		this.refreshTokenKey = 'refresh_token';
	}

	/**
	 * Obtener token de autenticación
	 */
	getToken() {
		return localStorage.getItem(this.tokenKey);
	}

	/**
	 * Guardar token de autenticación
	 */
	setToken(token) {
		if (token) {
			localStorage.setItem(this.tokenKey, token);
		} else {
			localStorage.removeItem(this.tokenKey);
		}
	}

	/**
	 * Obtener usuario actual
	 */
	getUser() {
		const userStr = localStorage.getItem(this.userKey);
		return userStr ? JSON.parse(userStr) : null;
	}

	/**
	 * Guardar información del usuario
	 */
	setUser(user) {
		if (user) {
			localStorage.setItem(this.userKey, JSON.stringify(user));
		} else {
			localStorage.removeItem(this.userKey);
		}
	}

	/**
	 * Guardar refresh token
	 */
	setRefreshToken(token) {
		if (token) {
			localStorage.setItem(this.refreshTokenKey, token);
		} else {
			localStorage.removeItem(this.refreshTokenKey);
		}
	}

	/**
	 * Obtener refresh token
	 */
	getRefreshToken() {
		return localStorage.getItem(this.refreshTokenKey);
	}

	/**
	 * Obtener header de autenticación
	 */
	getAuthHeader() {
		const token = this.getToken();
		if (token) {
			return {
				Authorization: `Bearer ${token}`,
			};
		}
		return {};
	}

	/**
	 * Limpiar sesión completa
	 */
	clear() {
		localStorage.removeItem(this.tokenKey);
		localStorage.removeItem(this.userKey);
		localStorage.removeItem(this.refreshTokenKey);
	}

	/**
	 * Verificar si hay sesión activa
	 */
	isAuthenticated() {
		return !!this.getToken();
	}
}

export default new SessionManager();
