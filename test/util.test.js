import { describe, expect, it } from '@jest/globals';

import { Random, Timer } from '../lib/util.js';
import { Duration } from '../lib/time.js';

describe('Util', () => {
  describe('Random', () => {
    it('Generates a random boolean', () => {
      const r = new Random().nextBoolean();

      expect(r === true || r === false).toEqual(true);
    });

    it('Generates an optional random boolean', () => {
      const r = new Random().nextBoolean(0.5);

      expect(r === undefined || typeof r === 'boolean').toEqual(true);
    });

    it('Generates a random integer between origin and bound', () => {
      const r = new Random().nextInt(5, 7);

      expect(r).toBeGreaterThanOrEqual(5);
      expect(r).toBeLessThan(7);
    });

    it('Generates an optional random integer', () => {
      const r = new Random().nextInt(undefined, undefined, 0.5);

      expect(r === undefined || typeof r === 'number').toEqual(true);
    });

    it('Generates a random float between origin and bound', () => {
      const r = new Random().nextFloat(0.5, 0.7);

      expect(r).toBeGreaterThanOrEqual(0.5);
      expect(r).toBeLessThanOrEqual(0.7);
    });

    it('Generates an optional random float ', () => {
      const r = new Random().nextFloat(undefined, undefined, 0.5);

      expect(r === undefined || typeof r === 'number').toEqual(true);
    });

    it('Generates a random date with offset', () => {
      const currentMillis = new Date().getTime();
      const r = new Random().nextDate(Duration.parse('PT1S'));

      expect(r).toBeInstanceOf(Date);
      expect(r.getTime()).toBeGreaterThanOrEqual(currentMillis - 1000);
      expect(r.getTime()).toBeLessThanOrEqual(currentMillis + 1000);
    });

    it('Generates an optional random date', () => {
      const r = new Random().nextDate(undefined, 0.5);

      expect(r === undefined || r instanceof Date).toEqual(true);
    });

    it('Generates a random value', () => {
      const values = ['a', 'b', 'c'];
      const r = new Random().nextValue(values);

      expect(values.includes(r)).toEqual(true);
    });

    it('Returns nothing if no values are given', () => {
      const r = new Random().nextValue();

      expect(r).toBeUndefined();
    });

    it('Generates an optional random value', () => {
      const values = ['a', 'b', 'c'];
      const r = new Random().nextValue(values, 0.5);

      expect(r === undefined || values.includes(r)).toEqual(true);
    });
  });

  describe('Timer', () => {
    it('Schedules a task', () => {
      const timer = Timer.createNull();
      const scheduledTasks = timer.trackScheduledTasks();
      const task = () => {};

      timer.schedule(task, 1000);

      expect(scheduledTasks.data).toEqual([{ task, period: 1000 }]);
    });

    it('Simulates task execution', async () => {
      const timer = Timer.createNull();
      let calls = 0;
      const task = () => {
        calls++;
      };
      timer.schedule(task, 1000);

      await timer.simulateTaskExecution({ times: 3 });

      expect(calls).toBe(3);
    });

    it('Cancels all tasks', () => {
      const timer = Timer.createNull();
      const canceledTasks = timer.trackCanceledTasks();
      const task1 = () => {};
      const task2 = () => {};

      timer.schedule(task1, 1000);
      timer.schedule(task2, 2000);
      timer.cancel();

      expect(canceledTasks.data).toEqual([{ task: task1 }, { task: task2 }]);
    });

    it('Cancels a task', () => {
      const timer = Timer.createNull();
      const canceledTasks = timer.trackCanceledTasks();
      const task = () => {};

      const cancel = timer.schedule(task, 1000);
      cancel();

      expect(canceledTasks.data).toEqual([{ task }]);
    });
  });
});
