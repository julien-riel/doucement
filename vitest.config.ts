import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'e2e'],
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/hooks/**', 'src/utils/**'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/index.ts'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
      },
      reporter: ['text', 'text-summary', 'lcov'],
    },
  },
})
