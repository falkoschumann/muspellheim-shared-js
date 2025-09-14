// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import js from "@eslint/js";
import headers from "eslint-plugin-headers";
import globals from "globals";
import ts from "typescript-eslint";

export default ts.config(
  { ignores: ["coverage", "dist", "docs"] },
  {
    extends: [js.configs.recommended, ...ts.configs.recommended],
    files: ["**/*.{cjs,mjs,js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      headers,
    },
    rules: {
      "headers/header-format": [
        "error",
        {
          source: "string",
          style: "line",
          trailingNewlines: 2,
          content: `Copyright (c) ${new Date().getUTCFullYear()} Falko Schumann. All rights reserved. MIT license.`,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
