import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Der Build läuft auf GitHub Pages unter /hildes-pfotenkueche/, lokal unter /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/hildes-pfotenkueche/' : '/',
  plugins: [react()],
}))
