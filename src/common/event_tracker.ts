// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

/**
 * Track events from an event target.
 *
 * Wait asynchronously for events. Useful in test code.
 */
export class EventTracker<T extends Event> {
  /**
   * Create a tracker for a specific event of an event target.
   *
   * @param eventTarget The target to track.
   * @param event The event name to track.
   */
  static create<T extends Event>(eventTarget: EventTarget, ...event: string[]) {
    return new EventTracker<T>(eventTarget, event);
  }

  readonly #eventTarget;
  readonly #event;
  readonly #events: T[];
  readonly #tracker;

  /**
   * Create a tracker for a specific event of an event target.
   *
   * @param eventTarget The target to track.
   * @param event The event name to track.
   */
  constructor(eventTarget: EventTarget, event: string[]) {
    this.#eventTarget = eventTarget;
    this.#event = event;
    this.#events = [];
    this.#tracker = (event: Event) => this.#events.push(event as T);

    this.#event.forEach((event) =>
      this.#eventTarget.addEventListener(event, this.#tracker),
    );
  }

  /**
   * Return the tracked events.
   *
   * @return The tracked events.
   */
  get events(): T[] {
    return this.#events;
  }

  /**
   * Clear the tracked events and return the cleared events.
   *
   * @return The cleared events.
   */
  clear(): T[] {
    const result = [...this.#events];
    this.#events.length = 0;
    return result;
  }

  /**
   * Stop tracking.
   */
  stop() {
    this.#event.forEach((event) =>
      this.#eventTarget.removeEventListener(event, this.#tracker),
    );
  }

  /**
   * Wait asynchronously for a number of events.
   *
   * @param count number of events, default 1.
   */
  async waitFor(count = 1) {
    return new Promise<T[]>((resolve) => {
      const checkEvents = () => {
        if (this.#events.length >= count) {
          this.#event.forEach((event) =>
            this.#eventTarget.removeEventListener(event, checkEvents),
          );
          resolve(this.events);
        }
      };

      this.#event.forEach((event) =>
        this.#eventTarget.addEventListener(event, checkEvents),
      );
      checkEvents();
    });
  }
}
