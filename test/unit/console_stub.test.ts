// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import {
  type ConsoleMessage,
  ConsoleStub,
} from "../../src/infrastructure/console_stub";

describe("Console stub", () => {
  it("should track messages", () => {
    const console = new ConsoleStub();
    const messages = console.trackMessages();

    console.log("test-log");
    console.error("test-error");
    console.warn("test-warn");
    console.info("test-info");
    console.debug("test-debug");
    console.trace("test-trace");

    expect(messages.data).toEqual<ConsoleMessage[]>([
      { level: "log", message: ["test-log"] },
      { level: "error", message: ["test-error"] },
      { level: "warn", message: ["test-warn"] },
      { level: "info", message: ["test-info"] },
      { level: "debug", message: ["test-debug"] },
      { level: "trace", message: ["test-trace"] },
    ]);
  });
});
