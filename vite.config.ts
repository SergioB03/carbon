import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// CarbonBridge POC — frontend-only, mock data, no backend.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
})
