import { describe, expect, test } from '@jest/globals';

import { Clock } from '../src/clock.js';
import { Duration } from '../src/duration.js';

describe('Clock', () => {
  test('Gets current date', () => {
    const clock = Clock.create();

    const date = clock.date();

    expect(date).toBeInstanceOf(Date);
  });

  describe('Nullable', () => {
    test('Gets a fixed date', () => {
      const clock = Clock.createNull();

      const date = clock.date();

      expect(date).toEqual(new Date('2024-02-21T19:16:00Z'));
    });

    test('Adds milliseconds to a fixed date', () => {
      const clock = Clock.createNull({ fixed: '2024-02-21T19:22:58Z' });

      clock.add(5000);

      expect(clock.date()).toEqual(new Date('2024-02-21T19:23:03Z'));
    });

    test('Adds duration to a fixed date', () => {
      const clock = Clock.createNull({ fixed: '2024-02-21T19:22:58Z' });

      clock.add(new Duration('PT3M10S'));

      expect(clock.date()).toEqual(new Date('2024-02-21T19:26:08Z'));
    });
  });
});
