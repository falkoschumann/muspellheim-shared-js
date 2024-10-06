import { OutputTracker } from './output-tracker.js';

export const TIMER_TASK_SCHEDULED_EVENT = 'timer-task-scheduled';
export const TIMER_TASK_CANCELED_EVENT = 'timer-task-canceled';

/**
 * A task that can be scheduled by a {@link Timer}.
 */
export class TimerTask {
  /**
   * The scheduled execution time of the most recent actual execution of this
   * task.
   */
  scheduledExecutionTime;

  /**
   * Runs the task.
   *
   * @abstract
   */
  run() {
    throw new Error('Not implemented');
  }

  /**
   * Cancels the task.
   */
  cancel() {}
}

/**
 * A timer that schedules and cancels tasks.
 *
 * Tasks may be scheduled for one-time execution or for repeated execution at
 * regular intervals.
 */
export class Timer extends EventTarget {
  /**
   * Returns a new `Timer`.
   */
  static create() {
    return new Timer(globalThis);
  }

  /**
   * Returns a new `Timer` for testing without side effects.
   */
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

  /**
   *
   * @param {TimerTask} task
   * @param {} period
   * @returns
   */
  schedule(/** @type {function(): void} */ task, /** @type {number} */ period) {
    // TODO Add parameter delay/time
    const intervalId = this.#global.setInterval(task, period);
    this.#intervalIds.set(intervalId, task);
    this.dispatchEvent(
      new CustomEvent(TIMER_TASK_SCHEDULED_EVENT, { detail: { task, period } }),
    );
    return () => this.#doCancel(intervalId, task);
  }

  trackScheduledTasks() {
    return new OutputTracker(this, TIMER_TASK_SCHEDULED_EVENT);
  }

  cancel() {
    this.#intervalIds.forEach((task, id) => this.#doCancel(id, task));
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

  #doCancel(intervalId, task) {
    this.#global.clearInterval(intervalId);
    this.dispatchEvent(
      new CustomEvent(TIMER_TASK_CANCELED_EVENT, { detail: { task } }),
    );
    this.#intervalIds.delete(intervalId);
  }
}

class IntervalStub {
  #lastIntervalId = 0;

  setInterval() {
    return this.#lastIntervalId++;
  }

  clearInterval() {}
}
