import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Customize SASS options to avoid conflicts
        quietDeps: true,
        loadPaths: ['node_modules'],
        // This ensures CoreUI variables don't conflict with each other
        additionalData: `$enable-dark-mode: false;\n`
      }
    }
  },
  build: {
    // Add source maps for better debugging
    sourcemap: true,
    // Customize chunk size and splitting
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
  }
})
