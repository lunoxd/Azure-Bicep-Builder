import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/ms-login': {
        target: 'https://login.microsoftonline.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ms-login/, ''),
        secure: true,
      },
      '/api/azure-arm': {
        target: 'https://management.azure.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/azure-arm/, ''),
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@monaco-editor')) return 'monaco-vendor';
          if (id.includes('@xyflow')) return 'flow-vendor';
          if (id.includes('lucide-react')) return 'lucide-vendor';
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})
