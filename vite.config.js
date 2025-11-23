import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Важно для Electron, чтобы пути к файлам были относительными
  root: 'src', // Указываем, что исходники лежат в src
  build: {
    outDir: '../dist', // Куда складывать собранный React
    emptyOutDir: true,
  },
  server: {
    port: 5173, // Порт для dev-режима
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})