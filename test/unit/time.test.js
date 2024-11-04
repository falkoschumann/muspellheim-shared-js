// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from 'vitest';

import { Clock, Duration } from '../../lib/time.js';

describe('Time', () => {
  describe('Clock', () => {
    it('gets current date', () => {
      const clock = Clock.system();

      const date = clock.date();

      expect(date).toBeInstanceOf(Date);
    });

    it('gets current millis', () => {
      const current = new Date();
      const clock = Clock.system();

      const millis = clock.millis();

      expect(millis).toBeGreaterThanOrEqual(current.getTime());
    });

    describe('Fixed', () => {
      it('gets a fixed date', () => {
        const clock = Clock.fixed();

        const date = clock.date();

        expect(date).toEqual(new Date('2024-02-21T19:16:00Z'));
      });

      it('adds milliseconds to a fixed date', () => {
        const clock = Clock.fixed('2024-02-21T19:22:58Z');

        clock.add(5000);

        expect(clock.date()).toEqual(new Date('2024-02-21T19:23:03Z'));
      });

      it('adds duration to a fixed date', () => {
        const clock = Clock.fixed('2024-02-21T19:22:58Z');

        clock.add(new Duration('PT3M10S'));

        expect(clock.date()).toEqual(new Date('2024-02-21T19:26:08Z'));
      });
    });
  });

  describe('Duration', () => {
    describe('Zero', () => {
      it('creates with factory', () => {
        const duration = Duration.zero();

        expect(duration.isZero()).toBe(true);
      });

      it('creates with constructor', () => {
        const duration = new Duration();

        expect(duration.isZero()).toBe(true);
      });

      it('creates from 0', () => {
        const duration = new Duration(0);

        expect(duration.isZero()).toBe(true);
        expect(duration.millis).toBe(0);
      });

      it('creates from null', () => {
        const duration = new Duration(null);

        expect(duration.isZero()).toBe(true);
      });

      it('has 0 milliseconds', () => {
        const duration = Duration.zero();

        expect(duration.millis).toBe(0);
      });
    });

    describe('Parse', () => {
      it('returns zero duration', () => {
        const duration = Duration.parse('PT0S');

        expect(duration.isZero()).toBe(true);
        expect(duration.millis).toBe(0);
      });

      it('returns positive duration', () => {
        const duration = Duration.parse('P1DT1H1M1.1S');

        expect(duration.millis).toBe(90061100);
      });

      it('returns negative duration', () => {
        const duration = Duration.parse('-P2DT2H2M2.2S');

        expect(duration.isNegative()).toEqual(true);
        expect(duration.millis).toBe(-180122200);
      });

      it('returns invalid duration when string is not parsable', () => {
        const duration = Duration.parse('foo');

        expect(duration.toString()).toBe('Invalid Duration');
        expect(duration.valueOf()).toBeNaN();
      });
    });

    describe('Between', () => {
      it('returns zero duration when start is equal to end', () => {
        const start = new Date('2024-02-21T19:22:58Z');
        const end = start;

        const duration = Duration.between(start, end);

        expect(duration).toEqual(Duration.zero());
      });

      it('calculates positive duration between two dates', () => {
        const start = new Date('2024-02-21T19:22:58Z');
        const end = new Date('2024-02-21T19:26:08Z');

        const duration = Duration.between(start, end);

        expect(duration).toEqual(new Duration('PT3M10S'));
      });

      it('calculates negative duration between two dates in reverse order', () => {
        const start = new Date('2024-02-21T19:26:08Z');
        const end = new Date('2024-02-21T19:22:58Z');

        const duration = Duration.between(start, end);

        expect(duration).toEqual(new Duration('-PT3M10S'));
      });
    });

    describe('Creation', () => {
      it('returns duration from number of milliseconds', () => {
        const duration = new Duration(4711);

        expect(duration.millis).toBe(4711);
      });

      it('copies another duration', () => {
        const duration = new Duration(new Duration(4711));

        expect(duration.millis).toBe(4711);
      });

      it('copies another duration', () => {
        const other = new Duration(4711);

        const duration = new Duration(other);

        expect(duration).toEqual(other);
        expect(duration).not.toBe(other);
      });

      it.each([
        Number.NaN,
        Number.POSITIVE_INFINITY,
        'foo',
        true,
        { foo: 42 },
        ['foo', 42],
      ])(
        'returns invalid duration when value type is not accepted: %s',
        (value) => {
          const duration = new Duration(value);

          expect(duration.toString()).toEqual('Invalid Duration');
          expect(duration.valueOf()).toBeNaN();
        },
      );
    });

    describe('Values', () => {
      it('returns zero values', () => {
        const duration = Duration.zero();

        expect(duration.days).toBe(0);
        expect(duration.hours).toBe(0);
        expect(duration.minutes).toBe(0);
        expect(duration.seconds).toBe(0);
        expect(duration.millis).toBe(0);
      });

      it('returns positive values', () => {
        const duration = new Duration('P3DT8H33M19.8S');

        expect(duration.days).toBe(3);
        expect(duration.hours).toBe(80);
        expect(duration.minutes).toBe(4833);
        expect(duration.seconds).toBe(289999);
        expect(duration.millis).toBe(289999800);
      });

      it('returns negative values', () => {
        const duration = new Duration('-P3DT8H33M19.8S');

        expect(duration.days).toBe(-3);
        expect(duration.hours).toBe(-80);
        expect(duration.minutes).toBe(-4833);
        expect(duration.seconds).toBe(-289999);
        expect(duration.millis).toBe(-289999800);
      });
    });

    describe('Parts', () => {
      it('returns zero values', () => {
        const duration = Duration.zero();

        expect(duration.daysPart).toEqual(0);
        expect(duration.hoursPart).toEqual(0);
        expect(duration.minutesPart).toEqual(0);
        expect(duration.secondsPart).toEqual(0);
        expect(duration.millisPart).toEqual(0);
      });

      it('returns positive values', () => {
        const duration = new Duration('P1DT8H33M19.8S');

        expect(duration.daysPart).toEqual(1);
        expect(duration.hoursPart).toEqual(8);
        expect(duration.minutesPart).toEqual(33);
        expect(duration.secondsPart).toEqual(19);
        expect(duration.millisPart).toEqual(800);
      });

      it('returns negative values', () => {
        const duration = new Duration('-P1DT8H33M19.8S');

        expect(duration.daysPart).toEqual(-1);
        expect(duration.hoursPart).toEqual(-8);
        expect(duration.minutesPart).toEqual(-33);
        expect(duration.secondsPart).toEqual(-19);
        expect(duration.millisPart).toEqual(-800);
      });
    });

    describe('Sign', () => {
      it('is neither positive or negative if duration is zero', () => {
        const duration = Duration.zero();

        expect(duration.isZero()).toBe(true);
        expect(duration.isPositive()).toBe(false);
        expect(duration.isNegative()).toBe(false);
      });

      it('is positive if duration is positive', () => {
        const duration = new Duration(5);

        expect(duration.isZero()).toBe(false);
        expect(duration.isPositive()).toBe(true);
        expect(duration.isNegative()).toBe(false);
      });

      it('is negative if duration is negative', () => {
        const duration = new Duration(-5);

        expect(duration.isZero()).toBe(false);
        expect(duration.isPositive()).toBe(false);
        expect(duration.isNegative()).toBe(true);
      });
    });

    it('gets absolutized value', () => {
      const duration = new Duration('-PT8H30M');

      const result = duration.absolutized();

      expect(result).toEqual(new Duration('PT8H30M'));
    });

    it('gets negated value', () => {
      const duration = new Duration('PT20M');

      const result = duration.negated();

      expect(result).toEqual(new Duration('-PT20M'));
    });

    it('adds duration', () => {
      const duration = new Duration('PT1H');

      const result = duration.plus(new Duration('PT30M'));

      expect(result).toEqual(new Duration('PT1H30M'));
    });

    it('subtracts duration', () => {
      const duration = new Duration('PT1H');

      const result = duration.minus(new Duration('PT30M'));

      expect(result).toEqual(new Duration('PT30M'));
    });

    it('multiplies duration', () => {
      const duration = new Duration('PT1H');

      const result = duration.multipliedBy(2);

      expect(result).toEqual(new Duration('PT2H'));
    });

    it('divides duration', () => {
      const duration = new Duration('PT1H');

      const result = duration.dividedBy(2);

      expect(result).toEqual(new Duration('PT30M'));
    });

    describe('Convert to ISO 8601 string', () => {
      it('returns ISO 8601 string for 0', () => {
        const duration = Duration.zero();

        expect(duration.toISOString()).toBe('PT0S');
      });

      it('returns ISO 8601 string with only days', () => {
        const duration = new Duration(172800000);

        expect(duration.toISOString()).toBe('PT48H');
      });

      it('returns ISO 8601 string with only hours', () => {
        const duration = new Duration(7200000);

        expect(duration.toISOString()).toBe('PT2H');
      });

      it('returns ISO 8601 string with only minutes', () => {
        const duration = new Duration(120000);

        expect(duration.toISOString()).toBe('PT2M');
      });

      it('returns ISO 8601 string with only seconds', () => {
        const duration = new Duration(2000);

        expect(duration.toISOString()).toBe('PT2S');
      });

      it('returns ISO 8601 string with only milliseconds', () => {
        const duration = new Duration(2);

        expect(duration.toISOString()).toBe('PT0.002S');
      });

      it('returns ISO 8601 string', () => {
        const duration = new Duration(90061001);

        expect(duration.toISOString()).toBe('PT25H1M1.001S');
      });

      it('returns negative value', () => {
        const duration = new Duration(-5000);

        expect(duration.toISOString()).toBe('-PT5S');
      });
    });

    it('converts to JSON', () => {
      const duration = new Duration(91815250);

      const json = JSON.stringify(duration);

      expect(json).toBe('"PT25H30M15.25S"');
    });

    describe('Convert to string', () => {
      it('returns medium string as default', () => {
        const duration = new Duration('PT25H01M01S');

        expect(duration.toString()).toBe('25:01:01');
      });

      it('returns short string', () => {
        const duration = new Duration('PT25H01M01S');

        expect(duration.toString({ style: 'short' })).toBe('25:01');
      });

      it('returns long string', () => {
        const duration = new Duration('PT25H01M01.001S');

        expect(duration.toString({ style: 'long' })).toBe('25:01:01.001');
      });

      it('returns negative value', () => {
        const duration = new Duration('-PT5S');

        expect(duration.toString()).toBe('-00:00:05');
      });

      it('is used by string interpolation', () => {
        const duration = new Duration('PT25H01M01S');

        const result = `${duration}`;

        expect(result).toBe('25:01:01');
      });

      it('is used by string concatenation', () => {
        const duration = new Duration('PT25H01M01S');

        const result = 'Duration: ' + duration;

        expect(result).toBe('Duration: 25:01:01');
      });
    });

    describe('Convert to value', () => {
      it('returns milliseconds', () => {
        const duration = new Duration(3661);

        expect(duration.valueOf()).toBe(3661);
      });

      it('returns negative value', () => {
        const duration = new Duration(-500);

        expect(duration.valueOf()).toBe(-500);
      });

      it('is used by numeric operations', () => {
        const duration = new Duration(3661);

        const result = 1 - duration;

        expect(result).toBe(-3660);
      });
    });
  });
});
