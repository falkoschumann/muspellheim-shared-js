// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

/**
 * A simple logging facade.
 *
 * This is a subset of the `console` interface.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Console_API
 */
export interface Log {
  log(...data: unknown[]): void;
  error(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  info(...data: unknown[]): void;
  debug(...data: unknown[]): void;
  trace(...data: unknown[]): void;
}
