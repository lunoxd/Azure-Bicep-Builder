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
})
