import path from "path";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      // REST
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
      // Socket.IO
      '/socket.io': {
        target: 'http://localhost:5050',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
