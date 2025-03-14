import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:8081',
        ws: true,
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/stream': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  }
})
