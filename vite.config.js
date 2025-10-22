import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	// Ya no necesitamos proxy porque hacemos llamadas directas a Supabase
	build: {
		outDir: 'dist',
		sourcemap: false,
	},
});
