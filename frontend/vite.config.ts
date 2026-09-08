import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves project pages from /<repo-name>/, not the domain
  // root, so production asset URLs need this base path baked in. Keep the
  // dev server at "/" so `npm run dev` doesn't need the extra path segment.
  base: command === "build" ? "/quickMap/" : "/",
}))
