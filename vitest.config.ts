import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.{test,spec}.ts?(x)'],
  },
  resolve: {
    alias: [
      { find: /^(\.\/.+)\.js$/, replacement: '$1.ts' }
    ]
  }
})