import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@actonce/types': resolve(__dirname, './packages/types/src/index.ts'),
      '@actonce/policy': resolve(__dirname, './packages/policy/src/index.ts'),
      '@actonce/dedupe': resolve(__dirname, './packages/dedupe/src/index.ts'),
      '@actonce/logger': resolve(__dirname, './packages/logger/src/index.ts'),
      '@actonce/approval': resolve(__dirname, './packages/approval/src/index.ts'),
      '@actonce/core': resolve(__dirname, './packages/core/src/index.ts'),
    },
  },
});
