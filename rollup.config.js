/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: 'lib/node/index.js',
  external: ['lodash', 'node:fs/promises', 'node:path'],
  output: {
    file: 'dist/index.cjs',
    format: 'cjs',
  },
};

export default config;
