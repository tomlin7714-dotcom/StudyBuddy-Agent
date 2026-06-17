import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:9000',
      '/chat': 'http://localhost:9000',
      '/documents': 'http://localhost:9000',
      '/learn': 'http://localhost:9000',
      '/health': 'http://localhost:9000',
    }
  }
})
