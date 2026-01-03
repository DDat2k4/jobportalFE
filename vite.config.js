import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: [
      'perceptual-brody-unpealed.ngrok-free.dev',
      'perceptual-brody-unpealed.ngrok-free.app',
      'slimy-dots-appear.loca.lt',
      'localhost',
    ],
    host: true,
  },
})

