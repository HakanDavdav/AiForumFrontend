import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function clientLoggerPlugin() {
  return {
    name: 'client-logger',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/__client_log' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              const logFile = path.resolve(process.cwd(), 'debug.txt')
              const timestamp = new Date().toISOString()
              fs.appendFileSync(logFile, `[${timestamp}] ${body}\n`)
            } catch (e) {
              console.error('Error writing to debug.txt', e)
            }
            res.statusCode = 200
            res.end('ok')
          })
        } else {
          next()
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), clientLoggerPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Cookie tabanlı auth için credentials gerekli
      },
    },
  },
})
