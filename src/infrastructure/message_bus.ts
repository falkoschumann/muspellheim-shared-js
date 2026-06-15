// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import type { Log } from "../common";

/**
 * Handle a message.
 */
export type MessageHandler<M = unknown> = (message: M) => void;

/**
 * A simple in-memory message bus.
 */
export class MessageBus<T = Record<string, unknown>> {
  readonly #log;

  #handlers = new Map<keyof T, MessageHandler[]>();

  /**
   * Creates an message bus with options.
   * @param options
   * @param options.log Logger, default is the console.
   */
  constructor({ log = globalThis.console }: { log?: Log } = {}) {
    this.#log = log;
  }

  /**
   * Subscribe a message handler for a message type.
   *
   * @returns Unsubscribe function.
   */
  subscribe<K extends keyof T>(type: K, handler: MessageHandler<T[K]>) {
    if (!this.#handlers.has(type)) {
      this.#handlers.set(type, []);
    }

    const subscribers = this.#handlers.get(type)!;
    subscribers.push(handler as MessageHandler);

    return () => {
      const filtered = this.#handlers.get(type)!.filter((h) => h !== handler);
      this.#handlers.set(type, filtered);
    };
  }

  /**
   * Publish a message to all handlers of a type.
   */
  publish<K extends keyof T>(type: K, message: T[K]): void {
    const subscribers = this.#handlers.get(type);
    subscribers?.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        this.#log.error(
          `Error in message handler for message type "${String(type)}":`,
          error,
        );
      }
    });
  }
}
