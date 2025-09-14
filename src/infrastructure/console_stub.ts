// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { OutputTracker } from "../common/output_tracker";

const MESSAGE_EVENT = "message";

/**
 * A stub for the console interface.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Console_API
 */
export class ConsoleStub extends EventTarget {
  log(...data: unknown[]) {
    this.dispatchEvent(
      new CustomEvent(MESSAGE_EVENT, {
        detail: { level: "log", message: data },
      }),
    );
  }

  error(...data: unknown[]) {
    this.dispatchEvent(
      new CustomEvent(MESSAGE_EVENT, {
        detail: { level: "error", message: data },
      }),
    );
  }

  warn(...data: unknown[]) {
    this.dispatchEvent(
      new CustomEvent(MESSAGE_EVENT, {
        detail: { level: "warn", message: data },
      }),
    );
  }

  info(...data: unknown[]) {
    this.dispatchEvent(
      new CustomEvent(MESSAGE_EVENT, {
        detail: { level: "info", message: data },
      }),
    );
  }

  debug(...data: unknown[]) {
    this.dispatchEvent(
      new CustomEvent(MESSAGE_EVENT, {
        detail: { level: "debug", message: data },
      }),
    );
  }

  trace(...data: unknown[]) {
    this.dispatchEvent(
      new CustomEvent(MESSAGE_EVENT, {
        detail: { level: "trace", message: data },
      }),
    );
  }

  /**
   * Tracks console messages.
   */
  trackMessages() {
    return new OutputTracker(this, MESSAGE_EVENT);
  }
}
