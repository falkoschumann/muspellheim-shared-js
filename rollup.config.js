// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: 'lib/node/index.js',
  external: ['node:fs/promises', 'node:path', 'node:process'],
  output: {
    file: 'dist/index.cjs',
    format: 'cjs',
  },
};

export default config;
