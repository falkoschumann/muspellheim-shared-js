// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.
// Copyright 2020-2022 Titanium I.T. LLC. MIT License.

/**
 * Track output events.
 *
 * This is one of the nullability patterns from James Shore's article on
 * [testing without mocks](https://www.jamesshore.com/v2/projects/nullables/testing-without-mocks#output-tracking).
 *
 * Example implementation of an event store:
 *
 * ```javascript
 * async record(event) {
 *   // ...
 *   this.dispatchEvent(new CustomEvent("eventRecorded", { detail: event }));
 * }
 *
 * trackEventsRecorded() {
 *   return new OutputTracker(this, "eventRecorded");
 * }
 * ```
 *
 * Example usage:
 *
 * ```javascript
 * const eventsRecorded = eventStore.trackEventsRecorded();
 * // ...
 * const data = eventsRecorded.data(); // [event1, event2, ...]
 * ```
 */
export class OutputTracker<T = unknown> {
  /**
   * Create a tracker for a specific event of an event target.
   *
   * @param eventTarget The target to track.
   * @param event The event name to track.
   */
  static create<T>(eventTarget: EventTarget, event: string) {
    return new OutputTracker<T>(eventTarget, event);
  }

  readonly #eventTarget;
  readonly #event;
  readonly #data: T[];
  readonly #tracker;

  /**
   * Create a tracker for a specific event of an event target.
   *
   * @param eventTarget The target to track.
   * @param event The event name to track.
   */
  constructor(eventTarget: EventTarget, event: string) {
    this.#eventTarget = eventTarget;
    this.#event = event;
    this.#data = [];
    this.#tracker = (event: Event) =>
      this.#data.push((event as CustomEvent<T>).detail);

    this.#eventTarget.addEventListener(this.#event, this.#tracker);
  }

  /**
   * Return the tracked data.
   *
   * @return The tracked data.
   */
  get data(): T[] {
    return this.#data;
  }

  /**
   * Clear the tracked data and return the cleared data.
   *
   * @return The cleared data.
   */
  clear(): T[] {
    const result = [...this.#data];
    this.#data.length = 0;
    return result;
  }

  /**
   * Stop tracking.
   */
  stop() {
    this.#eventTarget.removeEventListener(this.#event, this.#tracker);
  }
}
