// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * import { Duration } from './time.js'
 */

import { Clock } from './time.js';

const TASK_CREATED = 'created';
const TASK_SCHEDULED = 'scheduled';
const TASK_EXECUTED = 'executed';
const TASK_CANCELLED = 'cancelled';

/**
 * Temporarily cease execution for the specified duration.
 *
 * @param {number} millis The duration to sleep in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the specified
 *   duration.
 */
export async function sleep(millis) {
  await new Promise((resolve) => setTimeout(resolve, millis));
}

/**
 * A task that can be scheduled by a {@link Timer}.
 */
export class TimerTask {
  _state = TASK_CREATED;
  _nextExecutionTime = 0;
  _period = 0;

  /**
   * Runs the task.
   *
   * @abstract
   */
  run() {
    throw new Error('Method not implemented.');
  }

  /**
   * Cancels the task.
   *
   * @returns {boolean} `true` if this task was scheduled for one-time execution
   *   and has not yet run, or this task was scheduled for repeated execution.
   *   Return `false` if the task was scheduled for one-time execution and has
   *   already run, or if the task was never scheduled, or if the task was
   *   already cancelled.
   */
  cancel() {
    const result = this._state === TASK_SCHEDULED;
    this._state = TASK_CANCELLED;
    return result;
  }

  /**
   * Returns scheduled execution time of the most recent actual execution of
   * this task.
   *
   * Example usage:
   *
   * ```javascript
   * run() {
   *   if (Date.now() - scheduledExecutionTime() >= MAX_TARDINESS) {
   *     return; // Too late; skip this execution.
   *   }
   *   // Perform the task
   * }
   *
   * ```
   *
   * @returns {number} The time in milliseconds since the epoch, undefined if
   *   the task has not yet run for the first time.
   */
  scheduledExecutionTime() {
    return this._period < 0
      ? this._nextExecutionTime + this._period
      : this._nextExecutionTime - this._period;
  }
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
    return new Timer(Clock.system(), globalThis);
  }

  /**
   * Returns a new `Timer` for testing without side effects.
   */
  static createNull({ clock = Clock.fixed() } = {}) {
    return new Timer(clock, new TimeoutStub(clock));
  }

  #clock;
  #global;
  _queue;

  /**
   * Returns a new `Timer`.
   */
  constructor(
    /** @type {Clock} */ clock = Clock.system(),
    /** @type {globalThis} */ global = globalThis,
  ) {
    super();
    this.#clock = clock;
    this.#global = global;
    this._queue = [];
  }

  /**
   * Schedules a task for repeated execution at regular intervals.
   *
   * @param {TimerTask} task The task to execute.
   * @param {number|Date} delayOrTime The delay before the first execution, in
   *   milliseconds or the time of the first execution.
   * @param {number} [period=0] The interval between executions, in
   *   milliseconds; 0 means single execution.
   */
  schedule(task, delayOrTime, period = 0) {
    this.#doSchedule(task, delayOrTime, -period);
  }

  /**
   * Schedule a task for repeated fixed-rate execution.
   *
   * @param {TimerTask} task The task to execute.
   * @param {number|Date} delayOrTime The delay before the first execution, in
   *   milliseconds or the time of the first.
   * @param {number} period The interval between executions, in milliseconds.
   */
  scheduleAtFixedRate(task, delayOrTime, period) {
    this.#doSchedule(task, delayOrTime, period);
  }

  /**
   * Cancels all scheduled tasks.
   */
  cancel() {
    for (const task of this._queue) {
      task.cancel();
    }
    this._queue = [];
  }

  /**
   * Removes all cancelled tasks from the task queue.
   *
   * @returns {number} The number of tasks removed from the task queue.
   */
  purge() {
    let result = 0;
    for (let i = 0; i < this._queue.length; i++) {
      if (this._queue[i]._state === TASK_CANCELLED) {
        this._queue.splice(i, 1);
        i--;
        result++;
      }
    }
    return result;
  }

  /**
   * Simulates the execution of a task.
   *
   * @param {object} options The simulation options.
   * @param {number} [options.ticks=1000] The number of milliseconds to advance
   *   the clock.
   */
  simulateTaskExecution({ ticks = 1000 } = {}) {
    this.#clock.add(ticks);
    this.#runMainLoop();
  }

  #doSchedule(task, delayOrTime, period) {
    if (delayOrTime instanceof Date) {
      task._nextExecutionTime = delayOrTime.getTime();
    } else {
      task._nextExecutionTime = this.#clock.millis() + delayOrTime;
    }
    task._period = period;
    task._state = TASK_SCHEDULED;
    this._queue.push(task);
    this._queue.sort((a, b) => b._nextExecutionTime - a._nextExecutionTime);
    if (this._queue[0] === task) {
      this.#runMainLoop();
    }
  }

  #runMainLoop() {
    if (this._queue.length === 0) {
      return;
    }

    /** @type {TimerTask} */ const task = this._queue[0];
    if (task._state === TASK_CANCELLED) {
      this._queue.shift();
      return this.#runMainLoop();
    }

    const now = this.#clock.millis();
    const executionTime = task._nextExecutionTime;
    const taskFired = executionTime <= now;
    if (taskFired) {
      if (task._period === 0) {
        this._queue.shift();
        task._state = TASK_EXECUTED;
      } else {
        task._nextExecutionTime = task._period < 0
          ? now - task._period
          : executionTime + task._period;
      }
      task.run();
    } else {
      this.#global.setTimeout(() => this.#runMainLoop(), executionTime - now);
    }
  }
}

class TimeoutStub {
  setTimeout() {}
}
