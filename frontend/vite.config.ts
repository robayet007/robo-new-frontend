import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  // PWA configuration
  publicDir: 'public',
  // Base path - empty for root domain (works with custom domains)
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Ensure assets are referenced correctly
    assetsDir: 'assets',
  },
  // Server configuration for WebSocket
  server: {
    hmr: {
      // Suppress WebSocket connection errors in console
      overlay: true,
      clientPort: 5173,
    },
    // Handle WebSocket reconnection gracefully
    watch: {
      usePolling: false,
    },
  },
  // Suppress WebSocket warnings in production builds
  logLevel: 'warn',
})


