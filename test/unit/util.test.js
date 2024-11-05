// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from 'vitest';

import { Clock, Duration } from '../../lib/time.js';
import { deepMerge, Random, Timer, TimerTask } from '../../lib/util.js';

describe('Util', () => {
  describe('Objects', () => {
    describe('deep merge', () => {
      it('returns string when target is a string', () => {
        const result = deepMerge(undefined, 'a');

        expect(result).toBe('a');
      });

      it('returns number when target is a number', () => {
        const result = deepMerge(undefined, 1);

        expect(result).toBe(1);
      });

      it('returns boolean when target is a boolean', () => {
        const result = deepMerge(undefined, false);

        expect(result).toBe(false);
      });

      it('returns null when target is null', () => {
        const result = deepMerge(undefined, null);

        expect(result).toBeNull();
      });

      it('returns source value when target is undefined', () => {
        const result = deepMerge(2, undefined);

        expect(result).toBe(2);
      });

      it('merges target property when source does not have it', () => {
        const result = deepMerge({ a: 1 }, { b: 2 });

        expect(result).toEqual({ a: 1, b: 2 });
      });

      it('overrides source property with target property', () => {
        const result = deepMerge({ a: 1 }, { a: 2 });

        expect(result).toEqual({ a: 2 });
      });

      it('merges nested objects', () => {
        const result = deepMerge({ a: { b: 1 } }, { a: { c: 2 } });

        expect(result).toEqual({ a: { b: 1, c: 2 } });
      });

      it('creates nested objects when source does not have it', () => {
        const result = deepMerge({}, { a: { b: 2 } });

        expect(result).toEqual({ a: { b: 2 } });
      });

      it('overrides type of property', () => {
        const result = deepMerge({ a: 1 }, { a: { b: 2 } });

        expect(result).toEqual({ a: { b: 2 } });
      });

      it('combines arrays', () => {
        const result = deepMerge({ a: [1] }, { a: [{ b: 2 }] });

        expect(result).toEqual({ a: [1, { b: 2 }] });
      });
    });
  });

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
    it('schedules a task with delay', () => {
      const clock = Clock.fixed(1000);
      const timer = Timer.createNull({ clock });

      const task = new TimerTask();
      timer.schedule(task, 140);

      expect(task.scheduledExecutionTime()).toBe(1140);
      expect(task).toMatchObject({
        _state: 'scheduled',
        _nextExecutionTime: 1140,
        _period: -0,
      });
    });

    it('schedules a task at time', () => {
      const clock = Clock.fixed(1000);
      const timer = Timer.createNull({ clock });

      const task = new TimerTask();
      timer.schedule(task, new Date(clock.millis() + 234));

      expect(task.scheduledExecutionTime()).toBe(1234);
      expect(task).toMatchObject({
        _state: 'scheduled',
        _nextExecutionTime: 1234,
        _period: -0,
      });
    });

    it('schedules a periodic task with delay', () => {
      const clock = Clock.fixed(2000);
      const timer = Timer.createNull({ clock });

      const task = new StubbedTask();
      timer.schedule(task, 100, 60);

      expect(task.scheduledExecutionTime()).toBe(2040);
      expect(task).toMatchObject({
        _state: 'scheduled',
        _nextExecutionTime: 2100,
        _period: -60,
      });

      timer.simulateTaskExecution({ ticks: 120 });

      expect(task.scheduledExecutionTime()).toBe(2120);
      expect(task).toMatchObject({
        _state: 'scheduled',
        _nextExecutionTime: 2180,
        _period: -60,
      });
    });

    it('schedules a periodic task with start time', () => {
      const clock = Clock.fixed(2000);
      const timer = Timer.createNull({ clock });

      const task = new StubbedTask();
      timer.schedule(task, new Date(clock.millis() + 100), 60);

      expect(task.scheduledExecutionTime()).toBe(2040);
      expect(task).toMatchObject({
        _state: 'scheduled',
        _nextExecutionTime: 2100,
        _period: -60,
      });

      timer.simulateTaskExecution({ ticks: 120 });

      expect(task.scheduledExecutionTime()).toBe(2120);
      expect(task).toMatchObject({
        _state: 'scheduled',
        _nextExecutionTime: 2180,
        _period: -60,
      });
    });

    it('schedules at fixed rate a periodic task with delay', () => {
      const clock = Clock.fixed(2000);
      const timer = Timer.createNull({ clock });

      const task = new StubbedTask();
      timer.scheduleAtFixedRate(task, 100, 60);

      expect(task.scheduledExecutionTime()).toBe(2040);
      expect(task).toMatchObject({
        _state: 'scheduled',
        _nextExecutionTime: 2100,
        _period: 60,
      });

      timer.simulateTaskExecution({ ticks: 120 });

      expect(task.scheduledExecutionTime()).toBe(2100);
      expect(task).toMatchObject({
        _state: 'scheduled',
        _nextExecutionTime: 2160,
        _period: 60,
      });
    });

    it('schedules at fixed rate a periodic task with start time', () => {
      const clock = Clock.fixed(2000);
      const timer = Timer.createNull({ clock });

      const task = new StubbedTask();
      timer.scheduleAtFixedRate(task, new Date(clock.millis() + 100), 60);

      expect(task.scheduledExecutionTime()).toBe(2040);
      expect(task).toMatchObject({
        _state: 'scheduled',
        _nextExecutionTime: 2100,
        _period: 60,
      });

      timer.simulateTaskExecution({ ticks: 120 });

      expect(task.scheduledExecutionTime()).toBe(2100);
      expect(task).toMatchObject({
        _state: 'scheduled',
        _nextExecutionTime: 2160,
        _period: 60,
      });
    });

    it('cancels a task', () => {
      const clock = Clock.fixed(1000);
      const timer = Timer.createNull({ clock });
      const task = new TimerTask();
      timer.schedule(task, 140);

      const result = task.cancel();

      expect(result).toBe(true);
      expect(task).toMatchObject({
        _state: 'cancelled',
        _nextExecutionTime: 1140,
        _period: -0,
      });
    });

    it('cancels a task that has not yet been scheduled', () => {
      const task = new TimerTask();

      const result = task.cancel();

      expect(result).toBe(false);
      expect(task).toMatchObject({
        _state: 'cancelled',
        _nextExecutionTime: 0,
        _period: 0,
      });
    });

    it('cancels all tasks', () => {
      const timer = Timer.createNull();
      const task1 = new TimerTask();
      const task2 = new TimerTask();

      timer.schedule(task1, 1000);
      timer.schedule(task2, 2000);
      timer.cancel();

      expect(task1._state).toBe('cancelled');
      expect(task2._state).toBe('cancelled');
    });

    it('purges cancelled tasks', () => {
      const timer = Timer.createNull();
      const task1 = new TimerTask();
      const task2 = new TimerTask();

      timer.schedule(task1, 1000);
      timer.schedule(task2, 2000);
      task1.cancel();
      const result = timer.purge();

      expect(result).toBe(1);
      expect(task1._state).toBe('cancelled');
      expect(task2._state).toBe('scheduled');
    });

    it('queues tasks in ascending next execution time', () => {
      const timer = Timer.createNull();
      const task1 = new TimerTask();
      const task2 = new TimerTask();
      timer.schedule(task1, 2000);
      timer.schedule(task2, 1000);

      expect(timer._queue).toEqual([task1, task2]);
    });

    describe('Simulate task execution', () => {
      it('ticks until before execution and time does not execute task', () => {
        const timer = Timer.createNull();
        const task = new StubbedTask();
        timer.schedule(task, 500);

        timer.simulateTaskExecution({ ticks: 499 });

        expect(task.runs).toBe(0);
        expect(task._state).toBe('scheduled');
      });

      it('ticks until execution time and executes task', () => {
        const timer = Timer.createNull();
        const task = new StubbedTask();
        timer.schedule(task, 500);

        timer.simulateTaskExecution({ ticks: 500 });

        expect(task.runs).toBe(1);
        expect(task._state).toBe('executed');
      });

      it('ticks beyond execution time and executes task', () => {
        const timer = Timer.createNull();
        const task = new StubbedTask();
        timer.schedule(task, 500);

        timer.simulateTaskExecution();

        expect(task.runs).toBe(1);
        expect(task._state).toBe('executed');
      });

      it('removes cancelled task from queue', () => {
        const timer = Timer.createNull();
        const task = new StubbedTask();
        timer.schedule(task, 500);

        task.cancel();
        timer.simulateTaskExecution();

        expect(task.runs).toBe(0);
        expect(task._state).toBe('cancelled');
        expect(timer._queue).toEqual([]);
      });

      it('ticks until first execution of periodic task', () => {
        const timer = Timer.createNull();
        const task = new StubbedTask();
        timer.schedule(task, 500, 50);

        timer.simulateTaskExecution({ ticks: 500 });

        expect(task.runs).toBe(1);
        expect(task._state).toBe('scheduled');
      });

      it('ticks until 2 executions of periodic task', () => {
        const timer = Timer.createNull();
        const task = new StubbedTask();
        timer.schedule(task, 500, 50);

        timer.simulateTaskExecution({ ticks: 500 });
        timer.simulateTaskExecution({ ticks: 550 });

        expect(task.runs).toBe(2);
        expect(task._state).toBe('scheduled');
      });
    });
  });
});

class StubbedTask extends TimerTask {
  runs = 0;

  run() {
    this.runs++;
  }
}
