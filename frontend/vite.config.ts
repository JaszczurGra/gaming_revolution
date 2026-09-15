import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on 0.0.0.0, e.g. so it's reachable over Tailscale
    allowedHosts: true, // don't reject requests by Host header (needed for a Tailscale IP/name)
  },
})
