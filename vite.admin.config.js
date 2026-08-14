import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/bot-api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/bot-api/, '/api'), // BotMicroservice expects /api/admin...
      }
    },
  },
  define: {
    'import.meta.env.VITE_IS_ADMIN_BUILD': JSON.stringify('true')
  }
})
