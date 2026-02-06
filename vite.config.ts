// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import path from "node:path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/mod.ts"),
      name: "Shared",
      fileName: "shared",
    },
    sourcemap: true,
  },
  plugins: [dts({ rollupTypes: true, tsconfigPath: "./tsconfig.app.json" })],
});
