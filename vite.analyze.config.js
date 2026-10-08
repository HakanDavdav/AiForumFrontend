import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    svgr({ include: '**/*.svg?*react' }),
    visualizer({ filename: 'bundle-stats.json', template: 'raw-data', gzipSize: true }),
  ],
  build: { outDir: 'dist-analyze' },
  define: { 'import.meta.env.VITE_IS_ADMIN_BUILD': JSON.stringify('false') },
})
