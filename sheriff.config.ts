// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { sameTag, type SheriffConfig } from "@softarc/sheriff-core";

export const config: SheriffConfig = {
  autoTagging: false,
  enableBarrelLess: true,
  barrelFileName: "mod.ts",
  entryPoints: {
    src: "src/lib.ts",
  },
  modules: {
    src: ["layer:entry"],
    "src/common": ["layer:common"],
    "src/domain": ["layer:domain"],
    "src/infrastructure": ["layer:infrastructure"],
  },
  depRules: {
    "layer:entry": ["layer:*"],
    "layer:*": [sameTag, "layer:common", "layer:domain"],
  },
};
