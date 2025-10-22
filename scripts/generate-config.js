#!/usr/bin/env node

/**
 * Script para generar public/config.js desde variables de entorno
 * 
 * Uso:
 * - En desarrollo: Lee desde .env
 * - En Netlify: Lee desde process.env (configurado en Netlify dashboard)
 */

const fs = require('fs');
const path = require('path');

// Intentar cargar dotenv solo si existe (opcional en producción)
try {
    require('dotenv').config();
} catch (err) {
    console.log('dotenv no disponible, usando process.env directamente');
}

// Obtener variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validar que existan
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ ERROR: Faltan variables de entorno requeridas:');
    if (!SUPABASE_URL) console.error('  - SUPABASE_URL');
    if (!SUPABASE_ANON_KEY) console.error('  - SUPABASE_ANON_KEY');
    console.error('\nConfigura estas variables en:');
    console.error('  - Desarrollo: archivo .env en la raíz del proyecto');
    console.error('  - Netlify: Site settings > Environment variables');
    process.exit(1);
}

// Generar el contenido de config.js
const configContent = `// ⚠️ ARCHIVO AUTO-GENERADO - NO EDITAR MANUALMENTE
// Generado por scripts/generate-config.js desde variables de entorno

window.SUPABASE_CONFIG = {
    url: '${SUPABASE_URL}',
    anonKey: '${SUPABASE_ANON_KEY}'
};

console.log('[CONFIG] Configuración de Supabase cargada');
`;

// Ruta del archivo de salida
const outputPath = path.join(__dirname, '../public/config.js');

// Escribir el archivo
try {
    fs.writeFileSync(outputPath, configContent, 'utf8');
    console.log('✅ config.js generado exitosamente en:', outputPath);
    console.log('   - SUPABASE_URL:', SUPABASE_URL);
    console.log('   - SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
} catch (err) {
    console.error('❌ Error al escribir config.js:', err.message);
    process.exit(1);
}
