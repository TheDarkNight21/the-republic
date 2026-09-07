/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@engine': path.resolve(__dirname, 'src/engine'),
      '@ui': path.resolve(__dirname, 'src/ui'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 60000,
  },
});
