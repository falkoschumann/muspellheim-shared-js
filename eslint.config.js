import js from '@eslint/js';
import globals from 'globals';

/** @type { import("eslint").Linter.Config[] } */
export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      globals: {
        ...globals.node,
        ...globals.browser,
        //...globals.serviceworker,
        //...globals['shared-node-browser'],
      },
    },
    ignores: ['**/coverage/**', '**/data/**', '**/vendor/**'],
  },
];
