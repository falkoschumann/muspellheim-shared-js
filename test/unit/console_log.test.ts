// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import {
  ConsoleLog,
  type ConsoleMessage,
} from "../../src/infrastructure/console_log";

describe("Console log", () => {
  it("should log messages with level trace and above", () => {
    const console = ConsoleLog.createNull();
    console.level = "trace";
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

  it("should log messages with level debug and above", () => {
    const console = ConsoleLog.createNull();
    console.level = "debug";
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
    ]);
  });

  it("should log messages with level info and above", () => {
    const console = ConsoleLog.createNull();
    console.level = "info";
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
    ]);
  });

  it("should log messages with level log and above", () => {
    const console = ConsoleLog.createNull();
    console.level = "log";
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
    ]);
  });

  it("should log messages with level warn and above", () => {
    const console = ConsoleLog.createNull();
    console.level = "warn";
    const messages = console.trackMessages();

    console.log("test-log");
    console.error("test-error");
    console.warn("test-warn");
    console.info("test-info");
    console.debug("test-debug");
    console.trace("test-trace");

    expect(messages.data).toEqual<ConsoleMessage[]>([
      { level: "error", message: ["test-error"] },
      { level: "warn", message: ["test-warn"] },
    ]);
  });

  it("should log messages with level error and above", () => {
    const console = ConsoleLog.createNull();
    console.level = "error";
    const messages = console.trackMessages();

    console.log("test-log");
    console.error("test-error");
    console.warn("test-warn");
    console.info("test-info");
    console.debug("test-debug");
    console.trace("test-trace");

    expect(messages.data).toEqual<ConsoleMessage[]>([
      { level: "error", message: ["test-error"] },
    ]);
  });

  it("should log no messages when level is off", () => {
    const console = ConsoleLog.createNull();
    console.level = "off";
    const messages = console.trackMessages();

    console.log("test-log");
    console.error("test-error");
    console.warn("test-warn");
    console.info("test-info");
    console.debug("test-debug");
    console.trace("test-trace");

    expect(messages.data).toEqual<ConsoleMessage[]>([]);
  });

  it("should log messages with level info by default", () => {
    const console = ConsoleLog.createNull();
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
    ]);
  });
});
