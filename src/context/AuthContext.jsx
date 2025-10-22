import React, {createContext, useState, useCallback, useEffect} from 'react';
import SessionManager from '../utils/SessionManager';

export const AuthContext = createContext();

export function AuthProvider({children}) {
	const [user, setUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// Inicializar desde SessionManager
	useEffect(() => {
		const storedUser = SessionManager.getUser();
		const token = SessionManager.getToken();

		if (token && storedUser) {
			setUser(storedUser);
			setIsAuthenticated(true);
		}
		setIsLoading(false);
	}, []);

	/**
	 * Registrar nuevo usuario
	 */
	const register = useCallback(
		async (email, password, fullName, role = 'profesor') => {
			try {
				const response = await fetch('/api/auth/register', {
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

				// Guardar sesión
				SessionManager.setToken(data.token);
				SessionManager.setUser(data.user);
				if (data.session?.refresh_token) {
					SessionManager.setRefreshToken(data.session.refresh_token);
				}

				setUser(data.user);
				setIsAuthenticated(true);

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
		},
		[]
	);

	/**
	 * Iniciar sesión
	 */
	const login = useCallback(async (email, password) => {
		try {
			const response = await fetch('/api/auth/login', {
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

			// Guardar sesión
			SessionManager.setToken(data.token);
			SessionManager.setUser(data.user);
			if (data.session?.refresh_token) {
				SessionManager.setRefreshToken(data.session.refresh_token);
			}

			setUser(data.user);
			setIsAuthenticated(true);

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
	}, []);

	/**
	 * Cerrar sesión
	 */
	const logout = useCallback(async () => {
		try {
			await fetch('/api/auth/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...SessionManager.getAuthHeader(),
				},
			});
		} catch (error) {
			console.error('Error en logout:', error);
		} finally {
			SessionManager.clear();
			setUser(null);
			setIsAuthenticated(false);
		}
	}, []);

	/**
	 * Obtener usuario actual
	 */
	const getCurrentUser = useCallback(async () => {
		try {
			const response = await fetch('/api/auth/me', {
				headers: {
					...SessionManager.getAuthHeader(),
				},
			});

			if (!response.ok) {
				SessionManager.clear();
				setUser(null);
				setIsAuthenticated(false);
				return null;
			}

			const data = await response.json();
			setUser(data.user);
			setIsAuthenticated(true);
			return data.user;
		} catch (error) {
			console.error('Error al obtener usuario:', error);
			return null;
		}
	}, []);

	const value = {
		user,
		isLoading,
		isAuthenticated,
		register,
		login,
		logout,
		getCurrentUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
