#!/usr/bin/env node

/**
 * Script para desactivar confirmación de email en Supabase (Development)
 *
 * Uso: node scripts/disable-email-confirmation.js
 *
 * NOTA: Esto requiere tener acceso a la API de management de Supabase
 * que actualmente NO está disponible públicamente.
 *
 * SOLUCIÓN: Usar el Dashboard de Supabase manualmente.
 * Ver: CONFIGURAR_SUPABASE_AUTH.md
 */

const https = require('https');
require('dotenv').config();

const SUPABASE_PROJECT_ID =
	process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0];
const SUPABASE_API_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_PROJECT_ID || !SUPABASE_API_KEY) {
	console.error('❌ Error: Variables de entorno no configuradas');
	console.error('Requerido: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
	process.exit(1);
}

console.log('⚠️  IMPORTANTE:');
console.log('El cambio de configuración de email DEBE hacerse manualmente en:');
console.log(
	`https://app.supabase.com/project/${SUPABASE_PROJECT_ID}/settings/auth`
);
console.log('');
console.log('Pasos:');
console.log('1. Ve al Dashboard de Supabase');
console.log('2. Settings > Authentication > Email');
console.log('3. Desmarca "Confirm email"');
console.log('4. Click "Save"');
console.log('');
console.log('Alternativamente, si tienes access token:');
console.log('- Pueden usar la Management API de Supabase');
console.log(
	'- Pero requiere permisos especiales que generalmente no están disponibles'
);
console.log('');

// Función para intentar desactivar via API (probablemente falle)
async function tryDisableEmailConfirmation() {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: 'api.supabase.com',
			port: 443,
			path: `/v1/projects/${SUPABASE_PROJECT_ID}/auth/config`,
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${SUPABASE_API_KEY}`,
				'Content-Type': 'application/json',
			},
		};

		const req = https.request(options, (res) => {
			let data = '';
			res.on('data', (chunk) => {
				data += chunk;
			});
			res.on('end', () => {
				if (res.statusCode === 200) {
					console.log('✅ Éxito: Email confirmation desactivado');
					resolve(true);
				} else {
					console.error(`❌ Error: ${res.statusCode}`);
					console.error(data);
					reject(new Error(data));
				}
			});
		});

		req.on('error', (error) => {
			reject(error);
		});

		const payload = JSON.stringify({
			disable_signup: false,
			auto_confirm: true,
		});

		req.write(payload);
		req.end();
	});
}

// Intentar (probablemente falle)
console.log('Intentando desactivar via API...');
tryDisableEmailConfirmation()
	.then(() => {
		console.log('✅ Configuración actualizada!');
	})
	.catch((error) => {
		console.log('⚠️  No se pudo actualizar via API');
		console.log('📝 Por favor, hazlo manualmente en el Dashboard:');
		console.log(
			`https://app.supabase.com/project/${SUPABASE_PROJECT_ID}/settings/auth`
		);
	});
