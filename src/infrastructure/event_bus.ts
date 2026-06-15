// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import type { Log } from "../common";

/**
 * An event has a type to identify and data as payload.
 */
export type Event<TData = unknown> = Readonly<{ type: string; data: TData }>;

/**
 * Handle an event.
 */
export type EventHandler<TData = unknown> = (event: Event<TData>) => void;

/**
 * A simple in-memory event bus.
 */
export class EventBus<TData = unknown> {
  readonly #cacheSize;
  readonly #log;

  #handlers: EventHandler<TData>[] = [];
  #events: Event<TData>[] = [];

  /**
   * Creates an event bus with options.
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
  subscribe(handler: EventHandler<TData>) {
    this.#handlers = [...this.#handlers, handler];
    return () => (this.#handlers = this.#handlers.filter((h) => h !== handler));
  }

  /**
   * Publish an event to all handlers.
   */
  publish(event: Event<TData>): void {
    this.#events.push(event);
    while (this.#events.length > this.#cacheSize) {
      this.#events.shift();
    }

    this.#handlers.forEach((handler) => {
      try {
        handler(event);
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
