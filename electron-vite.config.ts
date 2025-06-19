import { defineConfig } from 'vite'

export default defineConfig({
  root: 'electron',
  server: {
    open: true,
  },
  build: {
    outDir: 'electron-dist',
  },
})
