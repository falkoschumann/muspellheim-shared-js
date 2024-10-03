import { describe, expect, test } from '@jest/globals';

import { Clock, Duration } from '../lib/time.js';

describe('Time', () => {
  describe('Clock', () => {
    test('Gets current date', () => {
      const clock = Clock.system();

      const date = clock.date();

      expect(date).toBeInstanceOf(Date);
    });

    describe('Nullable', () => {
      test('Gets a fixed date', () => {
        const clock = Clock.fixed();

        const date = clock.date();

        expect(date).toEqual(new Date('2024-02-21T19:16:00Z'));
      });

      test('Adds milliseconds to a fixed date', () => {
        const clock = Clock.fixed('2024-02-21T19:22:58Z');

        clock.add(5000);

        expect(clock.date()).toEqual(new Date('2024-02-21T19:23:03Z'));
      });

      test('Adds duration to a fixed date', () => {
        const clock = Clock.fixed('2024-02-21T19:22:58Z');

        clock.add(new Duration('PT3M10S'));

        expect(clock.date()).toEqual(new Date('2024-02-21T19:26:08Z'));
      });
    });
  });

  describe('Duration', () => {
    describe('Creation', () => {
      describe('Zero', () => {
        test('Uses factory', () => {
          const duration = Duration.zero();

          expect(duration.isZero).toEqual(true);
          expect(duration.millis).toEqual(0);
        });

        test('Creates without parameter', () => {
          const duration = new Duration();

          expect(duration.isZero).toEqual(true);
          expect(duration.millis).toEqual(0);
        });

        test('Creates with null', () => {
          const duration = new Duration(null);

          expect(duration.isZero).toEqual(true);
          expect(duration.millis).toEqual(0);
        });

        test('Creates with undefined', () => {
          const duration = new Duration(undefined);

          expect(duration.toString()).toEqual('Invalid Duration');
          expect(duration.valueOf()).toEqual(NaN);
        });
      });

      describe('From number of milliseconds', () => {
        test('Creates zero duration', () => {
          const duration = new Duration(0);

          expect(duration.isZero).toEqual(true);
          expect(duration.millis).toEqual(0);
        });

        test('Creates positive duration', () => {
          const duration = new Duration(5000);

          expect(duration.isPositive).toEqual(true);
          expect(duration.millis).toEqual(5000);
        });

        test('Creates negative duration', () => {
          const duration = new Duration(-3000);

          expect(duration.isNegative).toEqual(true);
          expect(duration.millis).toEqual(-3000);
        });

        test('Creates invalid duration', () => {
          const duration = new Duration(Number.POSITIVE_INFINITY);

          expect(duration.toString()).toEqual('Invalid Duration');
          expect(duration.valueOf()).toEqual(NaN);
        });
      });

      test('From another duration', () => {
        const duration = new Duration(new Duration(4711));

        expect(duration.millis).toEqual(4711);
      });

      describe('From ISO 8601 string', () => {
        test('Creates zero duration', () => {
          const duration = new Duration('PT0S');

          expect(duration.isZero).toEqual(true);
          expect(duration.millis).toEqual(0);
        });

        test('Creates positive duration', () => {
          const duration = new Duration('P1DT1H1M1.1S');

          expect(duration.millis).toEqual(90061100);
        });

        test('Creates negative duration', () => {
          const duration = new Duration('-P2DT2H2M2.2S');

          expect(duration.isNegative).toEqual(true);
          expect(duration.millis).toEqual(-180122200);
        });

        test('Creates invalid duration', () => {
          const duration = new Duration('foo');

          expect(duration.toString()).toEqual('Invalid Duration');
          expect(duration.valueOf()).toEqual(NaN);
        });
      });

      test.each([true, {}, []])(
        'Creates invalid duration if value type is not accepted: %s',
        (value) => {
          const duration = new Duration(value);

          expect(duration.toString()).toEqual('Invalid Duration');
          expect(duration.valueOf()).toEqual(NaN);
        },
      );
    });

    describe('Values', () => {
      test('Returns zero values', () => {
        const duration = Duration.zero();

        expect(duration.days).toEqual(0);
        expect(duration.hours).toEqual(0);
        expect(duration.minutes).toEqual(0);
        expect(duration.seconds).toEqual(0);
        expect(duration.millis).toEqual(0);
      });

      test('Returns positive values', () => {
        const duration = new Duration('P3DT8H33M19.8S');

        expect(duration.days).toBeCloseTo(3.35648, 0.00001);
        expect(duration.hours).toEqual(80.5555);
        expect(duration.minutes).toEqual(4833.33);
        expect(duration.seconds).toEqual(289999.8);
        expect(duration.millis).toEqual(289999800);
      });

      test('Returns negative values', () => {
        const duration = new Duration('-P3DT8H33M19.8S');

        expect(duration.days).toBeCloseTo(-3.35648, 0.00001);
        expect(duration.hours).toEqual(-80.5555);
        expect(duration.minutes).toEqual(-4833.33);
        expect(duration.seconds).toEqual(-289999.8);
        expect(duration.millis).toEqual(-289999800);
      });
    });

    test('Gets absolutized value', () => {
      const duration = new Duration('-PT8H30M');

      expect(duration.absolutized()).toEqual(new Duration('PT8H30M'));
    });

    test('Gets negated value', () => {
      const duration = new Duration('PT20M');

      expect(duration.negated()).toEqual(new Duration('-PT20M'));
    });

    describe('Parts', () => {
      test('Returns zero values', () => {
        const duration = Duration.zero();

        expect(duration.daysPart).toEqual(0);
        expect(duration.hoursPart).toEqual(0);
        expect(duration.minutesPart).toEqual(0);
        expect(duration.secondsPart).toEqual(0);
        expect(duration.millisPart).toEqual(0);
      });

      test('Returns positive values', () => {
        const duration = new Duration('P1DT8H33M19.8S');

        expect(duration.daysPart).toEqual(1);
        expect(duration.hoursPart).toEqual(8);
        expect(duration.minutesPart).toEqual(33);
        expect(duration.secondsPart).toEqual(19);
        expect(duration.millisPart).toEqual(800);
      });

      test('Returns negative values', () => {
        const duration = new Duration('-P1DT8H33M19.8S');

        expect(duration.daysPart).toEqual(-1);
        expect(duration.hoursPart).toEqual(-8);
        expect(duration.minutesPart).toEqual(-33);
        expect(duration.secondsPart).toEqual(-19);
        expect(duration.millisPart).toEqual(-800);
      });
    });

    describe('Addition', () => {
      test('Adds duration', () => {
        const duration = new Duration('PT1H');

        duration.plus(new Duration('PT30M'));

        expect(duration).toEqual(new Duration('PT1H30M'));
      });

      test('Adds milliseconds', () => {
        const duration = new Duration(3600);

        duration.plus(1800);

        expect(duration).toEqual(new Duration(5400));
      });

      test('Changes sign', () => {
        const duration = new Duration('-PT30M');

        duration.plus(new Duration('PT1H'));

        expect(duration).toEqual(new Duration('PT30M'));
      });
    });

    describe('Subtraction', () => {
      test('Subtracts duration', () => {
        const duration = new Duration('PT1H');

        duration.minus(new Duration('PT30M'));

        expect(duration).toEqual(new Duration('PT30M'));
      });

      test('Subtracts seconds', () => {
        const duration = new Duration(3600);

        duration.minus(1800);

        expect(duration).toEqual(new Duration(1800));
      });

      test('Changes sign', () => {
        const duration = new Duration('PT30M');

        duration.minus(new Duration('PT1H'));

        expect(duration).toEqual(new Duration('-PT30M'));
      });
    });

    describe('Convert to ISO 8601 string', () => {
      test('Returns ISO 8601 string', () => {
        const duration = new Duration(90061001);

        expect(duration.toISOString()).toEqual('P1DT1H1M1.001S');
      });

      test('Returns ISO 8601 string for 0', () => {
        const duration = Duration.zero();

        expect(duration.toISOString()).toEqual('PT0S');
      });

      test('Returns ISO 8601 string with only days', () => {
        const duration = new Duration(172800000);

        expect(duration.toISOString()).toEqual('P2D');
      });

      test('Returns ISO 8601 string with only hours', () => {
        const duration = new Duration(7200000);

        expect(duration.toISOString()).toEqual('PT2H');
      });

      test('Returns ISO 8601 string with only minutes', () => {
        const duration = new Duration(120000);

        expect(duration.toISOString()).toEqual('PT2M');
      });

      test('Returns ISO 8601 string with only seconds', () => {
        const duration = new Duration(2000);

        expect(duration.toISOString()).toEqual('PT2S');
      });

      test('Returns ISO 8601 string with only milliseconds', () => {
        const duration = new Duration(2);

        expect(duration.toISOString()).toEqual('PT0.002S');
      });

      test('Returns negative value', () => {
        const duration = new Duration(-5000);

        expect(duration.toISOString()).toEqual('-PT5S');
      });
    });

    describe('Convert to JSON', () => {
      test('Returns ISO string', () => {
        const duration = new Duration(91815250);

        const json = JSON.stringify(duration);

        expect(json).toEqual('"P1DT1H30M15.25S"');
      });
    });

    describe('Convert to string', () => {
      test('Returns medium string as default', () => {
        const duration = new Duration(90061001);

        expect(duration.toString()).toEqual('25:01:01');
      });

      test('Returns short string', () => {
        const duration = new Duration(90061001);

        expect(duration.toString({ style: 'short' })).toEqual('25:01');
      });

      test('Returns long string', () => {
        const duration = new Duration(90061001);

        expect(duration.toString({ style: 'long' })).toEqual('25:01:01.001');
      });

      test('Returns negative value', () => {
        const duration = new Duration('-PT5S');

        expect(duration.toString()).toEqual('-00:00:05');
      });

      test('Is used by string interpolation', () => {
        const duration = new Duration(90061001);

        const result = `${duration}`;

        expect(result).toEqual('25:01:01');
      });
    });

    describe('Convert to value', () => {
      test('Returns seconds', () => {
        const duration = new Duration(3661);

        expect(duration.valueOf()).toEqual(3661);
      });

      test('Returns negative value', () => {
        const duration = new Duration(-500);

        expect(duration.valueOf()).toEqual(-500);
      });

      test('Is used by number addition', () => {
        const duration = new Duration(3661);

        const result = 1 + duration;

        expect(result).toEqual(3662);
      });

      test('Is used by string concatenation', () => {
        const duration = new Duration(3661);

        const result = '' + duration;

        expect(result).toEqual('3661');
      });
    });
  });
});
