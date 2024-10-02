import { OutputTracker } from './output-tracker.js';

/**
 * An instance of `Random` is used to generate random numbers.
 */
export class Random {
  static create() {
    return new Random();
  }

  /** @hideconstructor */
  constructor() {}

  /**
   * Returns a random boolean value.
   *
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {boolean|undefined} a random boolean between `origin` (inclusive) and `bound` (exclusive) or undefined
   */
  nextBoolean(probabilityOfUndefined = 0.0) {
    return this.#randomOptional(
      () => Math.random() < 0.5,
      probabilityOfUndefined,
    );
  }

  /**
   * Returns a random integer between `origin` (inclusive) and `bound`
   * (exclusive).
   *
   * @param {number} [origin=0] - the least value that can be returned
   * @param {number} [bound=1] - the upper bound (exclusive) for the returned value
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {number|undefined} a random integer between `origin` (inclusive) and `bound` (exclusive) or undefined
   */
  nextInt(origin = 0, bound = 1, probabilityOfUndefined = 0.0) {
    return this.#randomOptional(
      () => Math.floor(this.nextFloat(origin, bound)),
      probabilityOfUndefined,
    );
  }

  /**
   * Returns a random float between `origin` (inclusive) and `bound`
   * (exclusive).
   *
   * @param {number} [origin=0.0] - the least value that can be returned
   * @param {number} [bound=1.0] - the upper bound (exclusive) for the returned value
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {number|undefined} a random float between `origin` (inclusive) and `bound` (exclusive) or undefined
   */
  nextFloat(origin = 0.0, bound = 1.0, probabilityOfUndefined = 0.0) {
    return this.#randomOptional(
      () => Math.random() * (bound - origin) + origin,
      probabilityOfUndefined,
    );
  }

  /**
   * Returns a random timestamp with optional random offset.
   *
   * @param {number} [maxMillis=0] - the maximum offset in milliseconds
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {Date|undefined} - a random timestamp or `undefined`
   */
  nextDate(maxMillis = 0, probabilityOfUndefined = 0.0) {
    return this.#randomOptional(() => {
      const now = new Date();
      let t = now.getTime();
      const r = Math.random();
      t += r * maxMillis;
      return new Date(t);
    }, probabilityOfUndefined);
  }

  /**
   * Returns a random value from an array.
   *
   * @param {Array} [values=[]] - the array of values
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {*|undefined} - a random value from the array or `undefined`
   */
  nextValue(values = [], probabilityOfUndefined = 0.0) {
    return this.#randomOptional(() => {
      const index = new Random().nextInt(0, values.length - 1);
      return values[index];
    }, probabilityOfUndefined);
  }

  #randomOptional(randomFactory, probabilityOfUndefined) {
    const r = Math.random();
    return r < probabilityOfUndefined ? undefined : randomFactory();
  }
}

export const TIMER_TASK_SCHEDULED_EVENT = 'timer-task-scheduled';
export const TIMER_TASK_CANCELED_EVENT = 'timer-task-canceled';

export class Timer extends EventTarget {
  static create() {
    return new Timer(globalThis);
  }

  static createNull() {
    return new Timer(new IntervalStub());
  }

  #global;
  #intervalIds = new Map();

  /** @hideconstructor */
  constructor(/** @type {globalThis} */ global) {
    super();
    this.#global = global;
  }

  schedule(/** @type {function(): void} */ task, /** @type {number} */ period) {
    const intervalId = this.#doSchedule(task, period);
    this.dispatchEvent(
      new CustomEvent(TIMER_TASK_SCHEDULED_EVENT, { detail: { task, period } }),
    );
    return () => this.#doCancel(intervalId, task);
  }

  #doSchedule(task, period) {
    const intervalId = this.#global.setInterval(task, period);
    this.#intervalIds.set(intervalId, task);
    return intervalId;
  }

  trackScheduledTasks() {
    return new OutputTracker(this, TIMER_TASK_SCHEDULED_EVENT);
  }

  cancel() {
    this.#intervalIds.forEach((task, id) => this.#doCancel(id, task));
  }

  #doCancel(intervalId, task) {
    this.#global.clearInterval(intervalId);
    this.dispatchEvent(
      new CustomEvent(TIMER_TASK_CANCELED_EVENT, { detail: { task } }),
    );
    this.#intervalIds.delete(intervalId);
  }

  trackCanceledTasks() {
    return new OutputTracker(this, TIMER_TASK_CANCELED_EVENT);
  }

  async simulateTaskExecution({ times = 1 } = {}) {
    for (let i = 0; i < times; i++) {
      for (const task of this.#intervalIds.values()) {
        await task();
      }
    }
  }
}

class IntervalStub {
  #lastIntervalId = 0;

  setInterval() {
    return this.#lastIntervalId++;
  }

  clearInterval() {}
}
