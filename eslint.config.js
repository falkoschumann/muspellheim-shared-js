// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import js from "@eslint/js";
import { defineConfig } from "eslint/config";
// @ts-expect-error ESLint headers plugin does not have TypeScript types
import headers from "eslint-plugin-headers";
import globals from "globals";
import sheriffPlugin from "@sheriff-arch/eslint-plugin-sheriff";
import ts from "typescript-eslint";

export default defineConfig([
  { ignores: ["coverage", "dist", "docs"] },
  {
    .../** @type {import("eslint").Linter.Config} */ (
      sheriffPlugin.configs.all
    ),
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["test/**", "**/*.test.*"],
  },
  {
    extends: [js.configs.recommended, ts.configs.recommended],
    files: ["**/*.{cjs,mjs,js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.browser,
    },
    plugins: { headers },
    rules: {
      "headers/header-format": [
        "error",
        {
          source: "string",
          style: "line",
          trailingNewlines: 2,
          content: `Copyright (c) (copyrightYear) Falko Schumann. All rights reserved. MIT license.`,
          patterns: {
            copyrightYear: {
              pattern: "\\d{4}",
              defaultValue: new Date().getUTCFullYear().toString(),
            },
          },
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
]);
