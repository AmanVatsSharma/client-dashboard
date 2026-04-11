/**
 * @file vitest.config.ts
 * @module client-dashboard
 * @description Vitest config for unit tests (lib rules, schemas).
 * @author BharatERP
 * @created 2026-04-09
 */

import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
