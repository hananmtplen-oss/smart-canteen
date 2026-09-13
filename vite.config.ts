import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative asset paths so one build works at a domain root (Vercel) and under
  // a subfolder (GitHub Pages project site) without rebuilding for each host.
  // Safe here because routing is hash-based, so the document URL's directory
  // never changes underneath us.
  base: './',
  server: {
    port: 5273,
    strictPort: false,
    host: '127.0.0.1',
  },
});
