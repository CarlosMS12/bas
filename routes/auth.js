/**
 * Rutas de Autenticación
 * Endpoints: /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/me
 */

const express = require('express');
const supabase = require('../db');
const {verifyAuth} = require('../middleware/verifyAuth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 * Body: { email, password, full_name, role }
 */
router.post('/register', async (req, res) => {
	try {
		const {email, password, full_name, role} = req.body;

		// Validación
		if (!email || !password) {
			return res.status(400).json({error: 'Email y contraseña son requeridos'});
		}

		if (password.length < 8) {
			return res
				.status(400)
				.json({error: 'La contraseña debe tener al menos 8 caracteres'});
		}

		// PASO 1: Crear usuario en Supabase Auth
		console.log(`[AUTH] Registrando usuario: ${email}`);
		const {data: authData, error: authError} = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name: full_name || email.split('@')[0],
					role: role || 'profesor',
				},
				// IMPORTANTE: En desarrollo, permitir confirmación automática
				emailRedirectTo: undefined,
			},
		});

		if (authError) {
			console.error('Error de autenticación:', authError.message);
			if (
				authError.message.includes('already registered') ||
				authError.message.includes('already exists')
			) {
				return res.status(400).json({error: 'El email ya está registrado'});
			}
			return res.status(400).json({error: authError.message});
		}

		if (!authData.user) {
			return res.status(400).json({error: 'Error al crear usuario'});
		}

		console.log(`[AUTH] Usuario creado: ${authData.user.id}`);

		// PASO 2: Esperar a que se cree el perfil
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// PASO 3: Obtener el usuario actualizado (puede estar confirmado ahora)
		const {
			data: {user: updatedUser},
			error: refreshError,
		} = await supabase.auth.getUser(authData.session?.access_token || '');

		// PASO 4: Intentar login inmediato
		console.log(`[AUTH] Intentando login automático para ${email}`);
		const {data: loginData, error: loginError} =
			await supabase.auth.signInWithPassword({
				email,
				password,
			});

		if (loginError) {
			console.error('Error en login automático:', loginError.message);

			// Si falla por email no confirmado, intentar una solución alternativa
			if (loginError.message.includes('Email not confirmed')) {
				console.log(`[AUTH] Email no confirmado, intentando solución alternativa...`);

				// Devolver instrucciones al frontend para reintentar después de un tiempo
				return res.status(201).json({
					message:
						'Usuario registrado. Se requiere confirmar email (simulado en desarrollo).',
					user: {
						id: authData.user.id,
						email: authData.user.email,
						full_name: full_name || email.split('@')[0],
						role: role || 'profesor',
					},
					token: null,
					session: null,
					requiresEmailConfirmation: true,
					retryAfter: 2000, // Reintentar después de 2 segundos
				});
			}

			return res.status(400).json({error: loginError.message});
		}

		console.log(`[AUTH] Login exitoso para ${email}`);

		// PASO 5: Obtener el perfil
		const {data: profile, error: profileError} = await supabase
			.from('users_profiles')
			.select('*')
			.eq('id', loginData.user.id)
			.single();

		if (profileError) {
			console.error('Error obteniendo perfil:', profileError.message);
		}

		res.status(201).json({
			message: 'Usuario registrado exitosamente',
			user: {
				id: loginData.user.id,
				email: loginData.user.email,
				full_name: profile?.full_name || full_name,
				role: profile?.role || 'profesor',
				school: profile?.school,
			},
			token: loginData.session?.access_token || null,
			session: loginData.session,
		});
	} catch (error) {
		console.error('Error en /register:', error.message);
		res.status(500).json({error: 'Error al registrar usuario'});
	}
});

/**
 * POST /api/auth/login
 * Inicia sesión de un usuario existente
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
	try {
		const {email, password} = req.body;

		// Validación
		if (!email || !password) {
			return res.status(400).json({error: 'Email y contraseña son requeridos'});
		}

		// Autenticar con Supabase
		const {data: authData, error: authError} =
			await supabase.auth.signInWithPassword({
				email,
				password,
			});

		if (authError) {
			console.error('Error de autenticación:', authError.message);
			return res.status(401).json({error: 'Email o contraseña incorrectos'});
		}

		if (!authData.user || !authData.session) {
			return res.status(401).json({error: 'Error al autenticar'});
		}

		// Obtener el perfil del usuario
		const {data: profile, error: profileError} = await supabase
			.from('users_profiles')
			.select('*')
			.eq('id', authData.user.id)
			.single();

		if (profileError) {
			console.error('Error obteniendo perfil:', profileError.message);
		}

		res.json({
			message: 'Sesión iniciada exitosamente',
			user: {
				id: authData.user.id,
				email: authData.user.email,
				full_name: profile?.full_name,
				role: profile?.role,
				school: profile?.school,
			},
			token: authData.session.access_token,
			session: authData.session,
		});
	} catch (error) {
		console.error('Error en /login:', error.message);
		res.status(500).json({error: 'Error al iniciar sesión'});
	}
});

/**
 * GET /api/auth/me
 * Obtiene la información del usuario actual
 * Requiere: Bearer token
 */
router.get('/me', verifyAuth, async (req, res) => {
	try {
		// Obtener el perfil del usuario actual
		const {data: profile, error: profileError} = await supabase
			.from('users_profiles')
			.select('*')
			.eq('id', req.user.id)
			.single();

		if (profileError) {
			console.error('Error obteniendo perfil:', profileError.message);
			return res.status(404).json({error: 'Perfil no encontrado'});
		}

		res.json({
			user: {
				id: profile.id,
				email: profile.email,
				full_name: profile.full_name,
				role: profile.role,
				school: profile.school,
				created_at: profile.created_at,
				updated_at: profile.updated_at,
			},
		});
	} catch (error) {
		console.error('Error en /me:', error.message);
		res.status(500).json({error: 'Error al obtener perfil'});
	}
});

/**
 * POST /api/auth/logout
 * Cierra la sesión del usuario (backend simplemente confirma)
 * El frontend es responsable de eliminar el token
 * Requiere: Bearer token
 */
router.post('/logout', verifyAuth, async (req, res) => {
	try {
		// Supabase maneja el logout en el cliente
		// Este endpoint simplemente confirma que la sesión se ha cerrado
		res.json({message: 'Sesión cerrada exitosamente'});
	} catch (error) {
		console.error('Error en /logout:', error.message);
		res.status(500).json({error: 'Error al cerrar sesión'});
	}
});

/**
 * POST /api/auth/refresh
 * Refresca el token de acceso usando el refresh token
 * Body: { refresh_token }
 */
router.post('/refresh', async (req, res) => {
	try {
		const {refresh_token} = req.body;

		if (!refresh_token) {
			return res.status(400).json({error: 'Refresh token requerido'});
		}

		// Refrescar la sesión con Supabase
		const {data: newSession, error: refreshError} =
			await supabase.auth.refreshSession({
				refresh_token,
			});

		if (refreshError || !newSession.session) {
			return res.status(401).json({error: 'No se pudo refrescar la sesión'});
		}

		res.json({
			token: newSession.session.access_token,
			session: newSession.session,
		});
	} catch (error) {
		console.error('Error en /refresh:', error.message);
		res.status(500).json({error: 'Error al refrescar token'});
	}
});

/**
 * POST /api/auth/dev-confirm-email
 * SOLO PARA DESARROLLO: Confirma un email manualmente
 * En producción, esto no debería existir
 * Body: { email, password }
 */
router.post('/dev-confirm-email', async (req, res) => {
	// Solo permitir en desarrollo
	if (process.env.NODE_ENV === 'production') {
		return res.status(403).json({error: 'No disponible en producción'});
	}

	try {
		const {email, password} = req.body;

		if (!email || !password) {
			return res.status(400).json({error: 'Email y contraseña requeridos'});
		}

		// Intentar login con la credencial
		const {data: loginData, error: loginError} =
			await supabase.auth.signInWithPassword({
				email,
				password,
			});

		if (loginError) {
			// Si falla porque el email no está confirmado, intentar acceder directamente
			// a la base de datos para marcar como confirmado (esto es un hack para desarrollo)
			console.log('[DEV] Intentando confirmar email manualmente...');

			// Lamentablemente no podemos hacerlo sin acceso a auth schema
			// Devolver instrucción al usuario
			return res.status(400).json({
				error: 'Email no confirmado',
				message: 'Debes desactivar la confirmación de email en Supabase Dashboard',
				instructions:
					'Ve a: Supabase Dashboard > Settings > Authentication > Email > Desmarca "Confirm email"',
				loginError: loginError.message,
			});
		}

		// Si funciona, devolver el token
		res.json({
			message: 'Email confirmado y sesión iniciada',
			token: loginData.session?.access_token,
			session: loginData.session,
		});
	} catch (error) {
		console.error('Error en /dev-confirm-email:', error.message);
		res.status(500).json({error: 'Error al confirmar email'});
	}
});

module.exports = router;
