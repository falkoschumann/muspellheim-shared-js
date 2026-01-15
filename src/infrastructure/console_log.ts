// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import type { Log, LogLevel } from "../common/log";
import { OutputTracker } from "./output_tracker";

const MESSAGE_EVENT = "message";

export interface ConsoleMessage {
  level: LogLevel;
  message: unknown[];
}

/**
 * Wraps the console interface and allow setting the log level.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Console_API
 */
export class ConsoleLog extends EventTarget implements Log {
  static create() {
    return new ConsoleLog(globalThis.console);
  }

  static createNull() {
    return new ConsoleLog(new ConsoleStub());
  }

  level: LogLevel = "info";

  #console;

  private constructor(console: Log) {
    super();
    this.#console = console;
  }

  log(...data: unknown[]) {
    if (!this.isLoggable("log")) {
      return;
    }

    this.#console.log(...data);
    this.dispatchEvent(
      new CustomEvent(MESSAGE_EVENT, {
        detail: { level: "log", message: data },
      }),
    );
  }

  error(...data: unknown[]) {
    if (!this.isLoggable("error")) {
      return;
    }

    this.#console.error(...data);
    this.dispatchEvent(
      new CustomEvent(MESSAGE_EVENT, {
        detail: { level: "error", message: data },
      }),
    );
  }

  warn(...data: unknown[]) {
    if (!this.isLoggable("warn")) {
      return;
    }

    this.#console.warn(...data);
    this.dispatchEvent(
      new CustomEvent(MESSAGE_EVENT, {
        detail: { level: "warn", message: data },
      }),
    );
  }

  info(...data: unknown[]) {
    if (!this.isLoggable("info")) {
      return;
    }

    this.#console.info(...data);
    this.dispatchEvent(
      new CustomEvent(MESSAGE_EVENT, {
        detail: { level: "info", message: data },
      }),
    );
  }

  debug(...data: unknown[]) {
    if (!this.isLoggable("debug")) {
      return;
    }

    this.#console.debug(...data);
    this.dispatchEvent(
      new CustomEvent(MESSAGE_EVENT, {
        detail: { level: "debug", message: data },
      }),
    );
  }

  trace(...data: unknown[]) {
    if (!this.isLoggable("trace")) {
      return;
    }

    this.#console.trace(...data);
    this.dispatchEvent(
      new CustomEvent(MESSAGE_EVENT, {
        detail: { level: "trace", message: data },
      }),
    );
  }

  /**
   * Track the console messages.
   */
  trackMessages() {
    return new OutputTracker<ConsoleMessage>(this, MESSAGE_EVENT);
  }

  isLoggable(level: LogLevel) {
    const normalize = (level: LogLevel) => (level === "log" ? "info" : level);
    const levels: LogLevel[] = [
      "off",
      "error",
      "warn",
      "info",
      "debug",
      "trace",
    ];
    const currentLevelIndex = levels.indexOf(normalize(this.level));
    const messageLevelIndex = levels.indexOf(normalize(level));
    return messageLevelIndex <= currentLevelIndex;
  }
}

class ConsoleStub implements Log {
  log(..._data: unknown[]) {}
  error(..._data: unknown[]) {}
  warn(..._data: unknown[]) {}
  info(..._data: unknown[]) {}
  debug(..._data: unknown[]) {}
  trace(..._data: unknown[]) {}
}
