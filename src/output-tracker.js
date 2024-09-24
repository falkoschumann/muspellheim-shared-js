/**
 * Tracks output events.
 *
 * This is one of the nullability patterns from James Shore for
 * [testing without mocks](https://www.jamesshore.com/v2/projects/nullables/testing-without-mocks#output-tracking).
 *
 * Example implementation:
 *
 * ```javascript
 * async record(event) {
 *   // ...
 *   this.dispatchEvent(new CustomEvent(EVENT_RECORDED_EVENT, { detail: event }));
 * }
 *
 * trackEventsRecorded() {
 *   return new OutputTracker(this, EVENT_RECORDED_EVENT);
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
export class OutputTracker {
  /**
   * Creates a tracker for a specific event of an event target.
   */
  static create(
    /** @type {EventTarget} */ eventTarget,
    /** @type {string} */ event,
  ) {
    return new OutputTracker(eventTarget, event);
  }

  #eventTarget;
  #event;
  #tracker;
  #data = [];

  constructor(
    /** @type {EventTarget} */ eventTarget,
    /** @type {string} */ event,
  ) {
    this.#eventTarget = eventTarget;
    this.#event = event;
    this.#tracker = (event) => this.#data.push(event.detail);

    this.#eventTarget.addEventListener(this.#event, this.#tracker);
  }

  /**
   * Returns the tracked data.
   */
  get data() {
    return this.#data;
  }

  /**
   * Clears the tracked data and returns the cleared data.
   */
  clear() {
    const result = [...this.#data];
    this.#data.length = 0;
    return result;
  }

  /**
   * Stops tracking.
   */
  stop() {
    this.#eventTarget.removeEventListener(this.#event, this.#tracker);
  }
}
