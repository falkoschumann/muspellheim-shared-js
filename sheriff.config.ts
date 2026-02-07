// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { type SheriffConfig } from "@softarc/sheriff-core";

export const config: SheriffConfig = {
  autoTagging: false,
  enableBarrelLess: true,
  barrelFileName: "mod.ts",
  entryPoints: {
    src: "src/mod.ts",
  },
  modules: {
    src: ["layer:entry"],
    "src/application": ["layer:application"],
    "src/common": ["layer:common"],
    "src/domain": ["layer:domain"],
    "src/infrastructure": ["layer:infrastructure"],
    "src/ui": ["layer:ui"],
  },
  depRules: {
    "layer:entry": ["layer:*"],
    "layer:ui": ["layer:application", "layer:domain"],
    "layer:application": ["layer:domain", "layer:infrastructure"],
    "layer:infrastructure": ["layer:domain"],
    "layer:*": ["layer:common"],
  },
};
