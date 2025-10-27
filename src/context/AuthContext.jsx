import React, {createContext, useState, useCallback, useEffect} from 'react';
import {supabase} from '../lib/supabase';

export const AuthContext = createContext();

export function AuthProvider({children}) {
	const [user, setUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	/**
	 * Enriquecer usuario con datos de users_profiles (sin timeout)
	 */
	const enrichUserWithProfile = useCallback(async (authUser) => {
		if (!authUser?.id) {
			console.warn('No hay ID de usuario para enriquecer');
			return authUser;
		}

		try {
			const {data, error} = await supabase
				.from('users_profiles')
				.select('full_name, role, school')
				.eq('id', authUser.id)
				.single();

			if (error || !data) {
				console.warn('No se encontraron datos de perfil, usando valores por defecto');
				return {
					...authUser,
					full_name: authUser.user_metadata?.full_name || authUser.email || 'Usuario',
					role: authUser.user_metadata?.role || 'profesor',
				};
			}

			return {
				...authUser,
				full_name: data.full_name || authUser.email || 'Usuario',
				role: data.role || 'profesor',
				school: data.school,
			};
		} catch (error) {
			console.error('Error enriqueciendo usuario:', error);
			return {
				...authUser,
				full_name: authUser.user_metadata?.full_name || authUser.email || 'Usuario',
				role: authUser.user_metadata?.role || 'profesor',
			};
		}
	}, []);

	// Inicializar y escuchar cambios de autenticación
	useEffect(() => {
		let mounted = true;

		const initializeAuth = async () => {
			try {
				// Obtener sesión inicial
				const {
					data: {session},
				} = await supabase.auth.getSession();

				if (mounted) {
					if (session?.user) {
						// NO enriquecer en la inicialización para no bloquear
						// Solo usar el usuario de autenticación con datos básicos
						setUser({
							...session.user,
							full_name:
								session.user.user_metadata?.full_name || session.user.email || 'Usuario',
							role: session.user.user_metadata?.role || 'profesor',
						});
						setIsAuthenticated(true);

						// Enriquecer de forma asincrónica en el fondo
						enrichUserWithProfile(session.user).then((enrichedUser) => {
							if (mounted) {
								setUser(enrichedUser);
							}
						});
					} else {
						setIsAuthenticated(false);
					}
					setIsLoading(false);
				}
			} catch (error) {
				console.error('Error inicializando autenticación:', error);
				if (mounted) {
					setIsLoading(false);
					setIsAuthenticated(false);
				}
			}
		};

		initializeAuth();

		// Escuchar cambios en la autenticación
		const {
			data: {subscription},
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			if (mounted) {
				if (session?.user) {
					// Mostrar datos básicos inmediatamente
					setUser({
						...session.user,
						full_name:
							session.user.user_metadata?.full_name || session.user.email || 'Usuario',
						role: session.user.user_metadata?.role || 'profesor',
					});
					setIsAuthenticated(true);

					// Enriquecer de forma asincrónica
					enrichUserWithProfile(session.user).then((enrichedUser) => {
						if (mounted) {
							setUser(enrichedUser);
						}
					});
				} else {
					setUser(null);
					setIsAuthenticated(false);
				}
			}
		});

		return () => {
			mounted = false;
			subscription.unsubscribe();
		};
	}, [enrichUserWithProfile]);

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
					// Enriquecer con datos de users_profiles
					const enrichedUser = await enrichUserWithProfile(data.user);
					setUser(enrichedUser);
					setIsAuthenticated(true);

					return {
						success: true,
						user: enrichedUser,
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
		[enrichUserWithProfile]
	);

	/**
	 * Iniciar sesión con Supabase Auth
	 */
	const login = useCallback(
		async (email, password) => {
			try {
				const {data, error} = await supabase.auth.signInWithPassword({
					email,
					password,
				});

				if (error) {
					// Mapear mensajes de error a mensajes amigables
					let friendlyError = error.message || 'Error al iniciar sesión';

					if (
						error.message.includes('Failed to fetch') ||
						error.message.includes('NetworkError')
					) {
						friendlyError = 'Error de conexión. Verifica tu internet.';
					} else if (error.message.includes('Invalid login credentials')) {
						friendlyError = 'Credenciales incorrectas. Verifica email y contraseña.';
					} else if (error.message.includes('User not found')) {
						friendlyError = 'Usuario no encontrado.';
					} else if (error.message.includes('Email not confirmed')) {
						friendlyError = 'Email no verificado. Revisa tu bandeja de entrada.';
					}

					return {
						success: false,
						error: friendlyError,
					};
				}

				if (data.user) {
					// Enriquecer con datos de users_profiles
					const enrichedUser = await enrichUserWithProfile(data.user);
					setUser(enrichedUser);
					setIsAuthenticated(true);

					return {
						success: true,
						user: enrichedUser,
					};
				}

				return {
					success: false,
					error: 'No se pudo iniciar sesión',
				};
			} catch (error) {
				console.error('Error en login:', error);
				let friendlyError = 'Error de conexión. Intenta de nuevo.';

				if (error.message && error.message.includes('Failed to fetch')) {
					friendlyError = 'Error de conexión. Verifica tu internet.';
				}

				return {
					success: false,
					error: friendlyError,
				};
			}
		},
		[enrichUserWithProfile]
	);

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
				// Enriquecer con datos de users_profiles
				const enrichedUser = await enrichUserWithProfile(user);
				setUser(enrichedUser);
				setIsAuthenticated(true);
				return enrichedUser;
			}

			return null;
		} catch (error) {
			console.error('Error al obtener usuario:', error);
			return null;
		}
	}, [enrichUserWithProfile]);

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
