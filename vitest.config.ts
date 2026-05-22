// FIX-TEST-01: Vitest configuration
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'app/api/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.config.*', 'tests/**'],
      thresholds: {
        // razorpay.ts must be 100% — this is where real money verification happens
        'lib/razorpay.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        // global minimums
        global: { statements: 70, branches: 65, functions: 70, lines: 70 },
      },
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['tests/e2e/**', 'node_modules/**', '.next/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
