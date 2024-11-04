// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from 'vitest';

import { Clock } from '../../lib/time.js';
import { Timer, TimerTask } from '../../lib/timer.js';

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

class StubbedTask extends TimerTask {
  runs = 0;

  run() {
    this.runs++;
  }
}
