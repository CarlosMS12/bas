import React, {createContext, useState, useCallback, useEffect} from 'react';
import {supabase} from '../lib/supabase';

export const AuthContext = createContext();

export function AuthProvider({children}) {
	const [user, setUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// Inicializar y escuchar cambios de autenticación
	useEffect(() => {
		// Obtener sesión inicial
		supabase.auth.getSession().then(({data: {session}}) => {
			if (session?.user) {
				setUser(session.user);
				setIsAuthenticated(true);
			}
			setIsLoading(false);
		});

		// Escuchar cambios en la autenticación
		const {
			data: {subscription},
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (session?.user) {
				setUser(session.user);
				setIsAuthenticated(true);
			} else {
				setUser(null);
				setIsAuthenticated(false);
			}
		});

		return () => subscription.unsubscribe();
	}, []);

	/**
	 * Registrar nuevo usuario con Supabase Auth
	 */
	const register = useCallback(
		async (email, password, fullName, role = 'profesor') => {
			try {
				// Registrar con Supabase Auth
				const {data, error} = await supabase.auth.signUp({
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
					setUser(data.user);
					setIsAuthenticated(true);

					return {
						success: true,
						user: data.user,
						message: 'Registro exitoso. Por favor verifica tu email si es requerido.',
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
		},
		[]
	);

	/**
	 * Iniciar sesión con Supabase Auth
	 */
	const login = useCallback(async (email, password) => {
		try {
			const {data, error} = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				return {
					success: false,
					error: error.message || 'Error al iniciar sesión',
				};
			}

			if (data.user) {
				setUser(data.user);
				setIsAuthenticated(true);

				return {
					success: true,
					user: data.user,
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
	}, []);

	/**
	 * Cerrar sesión con Supabase Auth
	 */
	const logout = useCallback(async () => {
		try {
			// Intentar cerrar sesión en Supabase
			const {error} = await supabase.auth.signOut();

			// Incluso si hay error, limpiar el estado local
			// Esto es importante porque si el usuario fue eliminado en Supabase
			// o hay problemas de conexión, igual necesitamos limpiar la sesión local
			setUser(null);
			setIsAuthenticated(false);

			if (error) {
				console.warn('Warning al cerrar sesión en Supabase:', error);
				// Retornar true igual porque limpiamos el estado local
				return {success: true, warning: true};
			}

			return {success: true};
		} catch (error) {
			console.error('Error en logout:', error);
			// Asegurar que limpiamos el estado local incluso con error
			setUser(null);
			setIsAuthenticated(false);
			return {success: true, error: error.message};
		}
	}, []);

	/**
	 * Obtener usuario actual
	 */
	const getCurrentUser = useCallback(async () => {
		try {
			const {
				data: {user},
				error,
			} = await supabase.auth.getUser();

			if (error) {
				setUser(null);
				setIsAuthenticated(false);
				return null;
			}

			if (user) {
				setUser(user);
				setIsAuthenticated(true);
				return user;
			}

			return null;
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
