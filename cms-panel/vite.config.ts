import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // 🔥 To gwarantuje, że kod zostanie "zmielony" i ukryty
    sourcemap: false, 
  },
    base: "/zarzadzanie-d8a2/", 
  server: {
    port: 5174, // Wymuszamy inny port dla admina!
    strictPort: true,
  }
})