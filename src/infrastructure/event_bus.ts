// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import type { Log } from "../common";
import type { Message, MessageHandler } from "../domain";

/**
 * A simple in-memory event bus.
 */
export class EventBus {
  readonly #cacheSize;
  readonly #log;

  #handlers: MessageHandler<Message, void>[] = [];
  readonly #events: Message[] = [];

  /**
   * Creates an event bus with options.
   *
   * @param options
   * @param options.cacheSize Number of cached last events.
   * @param options.log Logger, default is the console.
   */
  constructor({
    cacheSize = 100,
    log = globalThis.console,
  }: { cacheSize?: number; log?: Log } = {}) {
    this.#cacheSize = cacheSize;
    this.#log = log;
  }

  /**
   * Subscribe a handler to all events.
   *
   * @returns Unsubscribe function.
   */
  subscribe<TMessage extends Message>(handler: MessageHandler<TMessage, void>) {
    this.#handlers = [
      ...this.#handlers,
      handler as MessageHandler<Message, void>,
    ];
    return () => {
      this.#handlers = this.#handlers.filter((h) => h !== handler);
    };
  }

  /**
   * Publish an event to all handlers.
   */
  publish(event: Message) {
    this.#events.push(event);
    while (this.#events.length > this.#cacheSize) {
      this.#events.shift();
    }

    this.#handlers.forEach((handler) => {
      try {
        if (typeof handler === "function") {
          handler(event);
        } else {
          handler.handle(event);
        }
      } catch (error) {
        this.#log?.error("Error in event handler:", error);
      }
    });
  }

  /**
   * Return the cached events.
   */
  getEvents() {
    return this.#events;
  }
}
