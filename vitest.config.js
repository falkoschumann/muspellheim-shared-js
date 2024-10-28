/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globalSetup: './vitest.globalSetup.js',
    coverage: {
      provider: 'v8',
      include: ['lib/**/*'],
    },
  },
});
