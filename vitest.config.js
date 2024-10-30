/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './vitest.global-setup.js',
    coverage: {
      provider: 'v8',
      include: ['lib/**/*'],
    },
  },
});
