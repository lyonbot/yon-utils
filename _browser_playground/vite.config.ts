import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      'yon-utils': '../index.js',
    }
  }
})