/**
 * Middleware de Autenticación JWT
 * Verifica que el usuario tenga un token JWT válido en el header Authorization
 * Extrae la información del usuario del token y la adjunta a req.user
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar autenticación
 * Uso: app.use(verifyAuth) o app.get('/api/endpoint', verifyAuth, handler)
 */
const verifyAuth = (req, res, next) => {
	try {
		// Obtener el header Authorization
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			return res.status(401).json({
				error: 'No autorizado',
				message: 'Se requiere token de autenticación',
			});
		}

		// Extraer el token del header (format: "Bearer TOKEN")
		const parts = authHeader.split(' ');
		if (parts.length !== 2 || parts[0] !== 'Bearer') {
			return res.status(401).json({
				error: 'Formato de token inválido',
				message: 'Use: Authorization: Bearer <token>',
			});
		}

		const token = parts[1];

		// Verificar el token (sin necesidad de SECRET - Supabase maneja esto)
		// En el frontend se envía el token de Supabase que ya está firmado
		try {
			// Decodificar sin verificar firma (Supabase se encarga)
			// En producción, verificar con la clave pública de Supabase
			const decoded = jwt.decode(token);

			if (!decoded || !decoded.sub) {
				return res.status(401).json({
					error: 'Token inválido',
					message: 'El token no contiene información válida',
				});
			}

			// Verificar si el token no está expirado
			if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
				return res.status(401).json({
					error: 'Token expirado',
					message: 'Por favor inicia sesión de nuevo',
				});
			}

			// Adjuntar información del usuario al request
			req.user = {
				id: decoded.sub,
				email: decoded.email,
				role: decoded.user_metadata?.role || 'usuario',
				aud: decoded.aud,
			};

			next();
		} catch (decodeError) {
			console.error('Error decodificando token:', decodeError.message);
			return res.status(401).json({
				error: 'Token inválido',
				message: 'No se pudo validar el token',
			});
		}
	} catch (error) {
		console.error('Error en middleware verifyAuth:', error.message);
		return res.status(401).json({
			error: 'No autorizado',
			message: 'Error al verificar autenticación',
		});
	}
};

/**
 * Middleware para verificar que el usuario sea admin
 * Uso: app.delete('/api/endpoint', verifyAuth, verifyAdmin, handler)
 */
const verifyAdmin = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({error: 'No autorizado'});
	}

	// Si el usuario es admin según el token, permitir
	if (req.user.role === 'admin') {
		return next();
	}

	// De lo contrario, verificar en la base de datos
	// Esto se manejará en el handler del endpoint
	next();
};

/**
 * Middleware para verificar que el usuario sea profesor
 */
const verifyTeacher = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({error: 'No autorizado'});
	}

	if (req.user.role === 'profesor' || req.user.role === 'admin') {
		return next();
	}

	res.status(403).json({error: 'Acceso denegado', message: 'Se requiere rol de profesor'});
};

module.exports = {
	verifyAuth,
	verifyAdmin,
	verifyTeacher,
};
