import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow connections from any IP
    port: 5173, // Default Vite port
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  optimizeDeps: {
    include: ['lightweight-charts'],
  },
})
