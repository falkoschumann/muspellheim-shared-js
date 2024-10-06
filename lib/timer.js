import { OutputTracker } from './output-tracker.js';

const TIMER_TASK_SCHEDULED_EVENT = 'timer-task-scheduled';
const TIMER_TASK_CANCELED_EVENT = 'timer-task-canceled';

/**
 * A task that can be scheduled by a {@link Timer}.
 *
 * @callback TimerTask
 */

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
   * Schedules a task for repeated execution at regular intervals.
   *
   * @param {TimerTask} task - the task to execute
   * @param {number} period - the interval between executions, in milliseconds
   * @returns {function} a function that cancels the scheduled task
   */
  schedule(task, period) {
    // TODO Replace task function with task object
    // TODO Add parameter delay/time
    const intervalId = this.#global.setInterval(task, period);
    this.#intervalIds.set(intervalId, task);
    this.dispatchEvent(
      new CustomEvent(TIMER_TASK_SCHEDULED_EVENT, { detail: { task, period } }),
    );
    return () => this.#doCancel(intervalId, task);
  }

  /**
   * Tracks tasks that have been scheduled.
   *
   * @returns {OutputTracker} an output tracker for scheduled tasks
   */
  trackScheduledTasks() {
    return new OutputTracker(this, TIMER_TASK_SCHEDULED_EVENT);
  }

  /**
   * Cancels all scheduled tasks.
   */
  cancel() {
    this.#intervalIds.forEach((task, id) => this.#doCancel(id, task));
  }

  /**
   * Tracks tasks that have been canceled.
   *
   * @returns {OutputTracker} an output tracker for canceled tasks
   */
  trackCanceledTasks() {
    return new OutputTracker(this, TIMER_TASK_CANCELED_EVENT);
  }

  /**
   * Simulates the execution of all scheduled tasks.
   *
   * @param {object} options
   * @param {number} options.times - the number of times to execute the tasks
   */
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
