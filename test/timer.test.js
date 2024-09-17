import { describe, expect, test } from '@jest/globals';

import { Timer } from '../src/timer.js';

describe('Timer', () => {
  test('Schedules a task', () => {
    const timer = Timer.createNull();
    const scheduledTasks = timer.trackScheduledTasks();
    const task = () => {};

    timer.schedule(task, 1000);

    expect(scheduledTasks.data).toEqual([{ task, period: 1000 }]);
  });

  test('Simulates task execution', async () => {
    const timer = Timer.createNull();
    let calls = 0;
    const task = () => {
      calls++;
    };
    timer.schedule(task, 1000);

    await timer.simulateTaskExecution({ times: 3 });

    expect(calls).toBe(3);
  });

  test('Cancels all tasks', () => {
    const timer = Timer.createNull();
    const canceledTasks = timer.trackCanceledTasks();
    const task1 = () => {};
    const task2 = () => {};

    timer.schedule(task1, 1000);
    timer.schedule(task2, 2000);
    timer.cancel();

    expect(canceledTasks.data).toEqual([{ task: task1 }, { task: task2 }]);
  });

  test('Cancels a task', () => {
    const timer = Timer.createNull();
    const canceledTasks = timer.trackCanceledTasks();
    const task = () => {};

    const cancel = timer.schedule(task, 1000);
    cancel();

    expect(canceledTasks.data).toEqual([{ task }]);
  });
});
