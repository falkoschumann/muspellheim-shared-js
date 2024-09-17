import { OutputTracker } from './output-tracker.js';

export const TIMER_TASK_SCHEDULED_EVENT = 'timer-task-scheduled';
export const TIMER_TASK_CANCELED_EVENT = 'timer-task-canceled';

export class Timer extends EventTarget {
  static create() {
    return new Timer(globalThis);
  }

  static createNull() {
    return new Timer(new IntervalStub());
  }

  #interval;
  #intervalIds = new Map();

  constructor(/** @type {typeof globalThis} */ interval) {
    super();
    this.#interval = interval;
  }

  schedule(/** @type {Function} */ task, /** @type {number} */ period) {
    const intervalId = this.#doSchedule(task, period);
    this.dispatchEvent(
      new CustomEvent(TIMER_TASK_SCHEDULED_EVENT, { detail: { task, period } }),
    );
    return () => this.#doCancel(intervalId, task);
  }

  #doSchedule(task, period) {
    const intervalId = this.#interval.setInterval(task, period);
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
    this.#interval.clearInterval(intervalId);
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
