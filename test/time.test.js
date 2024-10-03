import { describe, expect, it } from '@jest/globals';

import { Clock, Duration } from '../lib/time.js';

describe('Time', () => {
  describe('Clock', () => {
    it('Gets current date', () => {
      const clock = Clock.system();

      const date = clock.date();

      expect(date).toBeInstanceOf(Date);
    });

    describe('Nullable', () => {
      it('Gets a fixed date', () => {
        const clock = Clock.fixed();

        const date = clock.date();

        expect(date).toEqual(new Date('2024-02-21T19:16:00Z'));
      });

      it('Adds milliseconds to a fixed date', () => {
        const clock = Clock.fixed('2024-02-21T19:22:58Z');

        clock.add(5000);

        expect(clock.date()).toEqual(new Date('2024-02-21T19:23:03Z'));
      });

      it('Adds duration to a fixed date', () => {
        const clock = Clock.fixed('2024-02-21T19:22:58Z');

        clock.add(new Duration('PT3M10S'));

        expect(clock.date()).toEqual(new Date('2024-02-21T19:26:08Z'));
      });
    });
  });

  describe('Duration', () => {
    describe('Creation', () => {
      describe('Zero', () => {
        it('Uses factory', () => {
          const duration = Duration.zero();

          expect(duration.isZero).toEqual(true);
          expect(duration.millis).toEqual(0);
        });

        it('Creates without parameter', () => {
          const duration = new Duration();

          expect(duration.isZero).toEqual(true);
          expect(duration.millis).toEqual(0);
        });

        it('Creates with null', () => {
          const duration = new Duration(null);

          expect(duration.isZero).toEqual(true);
          expect(duration.millis).toEqual(0);
        });

        it('Creates with undefined', () => {
          const duration = new Duration(undefined);

          expect(duration.toString()).toEqual('Invalid Duration');
          expect(duration.valueOf()).toEqual(NaN);
        });
      });

      describe('From number of milliseconds', () => {
        it('Creates zero duration', () => {
          const duration = new Duration(0);

          expect(duration.isZero).toEqual(true);
          expect(duration.millis).toEqual(0);
        });

        it('Creates positive duration', () => {
          const duration = new Duration(5000);

          expect(duration.isPositive).toEqual(true);
          expect(duration.millis).toEqual(5000);
        });

        it('Creates negative duration', () => {
          const duration = new Duration(-3000);

          expect(duration.isNegative).toEqual(true);
          expect(duration.millis).toEqual(-3000);
        });

        it('Creates invalid duration', () => {
          const duration = new Duration(Number.POSITIVE_INFINITY);

          expect(duration.toString()).toEqual('Invalid Duration');
          expect(duration.valueOf()).toEqual(NaN);
        });
      });

      it('From another duration', () => {
        const duration = new Duration(new Duration(4711));

        expect(duration.millis).toEqual(4711);
      });

      describe('From ISO 8601 string', () => {
        it('Creates zero duration', () => {
          const duration = new Duration('PT0S');

          expect(duration.isZero).toEqual(true);
          expect(duration.millis).toEqual(0);
        });

        it('Creates positive duration', () => {
          const duration = new Duration('P1DT1H1M1.1S');

          expect(duration.millis).toEqual(90061100);
        });

        it('Creates negative duration', () => {
          const duration = new Duration('-P2DT2H2M2.2S');

          expect(duration.isNegative).toEqual(true);
          expect(duration.millis).toEqual(-180122200);
        });

        it('Creates invalid duration', () => {
          const duration = new Duration('foo');

          expect(duration.toString()).toEqual('Invalid Duration');
          expect(duration.valueOf()).toEqual(NaN);
        });
      });

      it.each([true, {}, []])(
        'Creates invalid duration if value type is not accepted: %s',
        (value) => {
          const duration = new Duration(value);

          expect(duration.toString()).toEqual('Invalid Duration');
          expect(duration.valueOf()).toEqual(NaN);
        },
      );
    });

    describe('Values', () => {
      it('Returns zero values', () => {
        const duration = Duration.zero();

        expect(duration.days).toEqual(0);
        expect(duration.hours).toEqual(0);
        expect(duration.minutes).toEqual(0);
        expect(duration.seconds).toEqual(0);
        expect(duration.millis).toEqual(0);
      });

      it('Returns positive values', () => {
        const duration = new Duration('P3DT8H33M19.8S');

        expect(duration.days).toBeCloseTo(3.35648, 0.00001);
        expect(duration.hours).toEqual(80.5555);
        expect(duration.minutes).toEqual(4833.33);
        expect(duration.seconds).toEqual(289999.8);
        expect(duration.millis).toEqual(289999800);
      });

      it('Returns negative values', () => {
        const duration = new Duration('-P3DT8H33M19.8S');

        expect(duration.days).toBeCloseTo(-3.35648, 0.00001);
        expect(duration.hours).toEqual(-80.5555);
        expect(duration.minutes).toEqual(-4833.33);
        expect(duration.seconds).toEqual(-289999.8);
        expect(duration.millis).toEqual(-289999800);
      });
    });

    it('Gets absolutized value', () => {
      const duration = new Duration('-PT8H30M');

      expect(duration.absolutized()).toEqual(new Duration('PT8H30M'));
    });

    it('Gets negated value', () => {
      const duration = new Duration('PT20M');

      expect(duration.negated()).toEqual(new Duration('-PT20M'));
    });

    describe('Parts', () => {
      it('Returns zero values', () => {
        const duration = Duration.zero();

        expect(duration.daysPart).toEqual(0);
        expect(duration.hoursPart).toEqual(0);
        expect(duration.minutesPart).toEqual(0);
        expect(duration.secondsPart).toEqual(0);
        expect(duration.millisPart).toEqual(0);
      });

      it('Returns positive values', () => {
        const duration = new Duration('P1DT8H33M19.8S');

        expect(duration.daysPart).toEqual(1);
        expect(duration.hoursPart).toEqual(8);
        expect(duration.minutesPart).toEqual(33);
        expect(duration.secondsPart).toEqual(19);
        expect(duration.millisPart).toEqual(800);
      });

      it('Returns negative values', () => {
        const duration = new Duration('-P1DT8H33M19.8S');

        expect(duration.daysPart).toEqual(-1);
        expect(duration.hoursPart).toEqual(-8);
        expect(duration.minutesPart).toEqual(-33);
        expect(duration.secondsPart).toEqual(-19);
        expect(duration.millisPart).toEqual(-800);
      });
    });

    describe('Addition', () => {
      it('Adds duration', () => {
        const duration = new Duration('PT1H');

        duration.plus(new Duration('PT30M'));

        expect(duration).toEqual(new Duration('PT1H30M'));
      });

      it('Adds milliseconds', () => {
        const duration = new Duration(3600);

        duration.plus(1800);

        expect(duration).toEqual(new Duration(5400));
      });

      it('Changes sign', () => {
        const duration = new Duration('-PT30M');

        duration.plus(new Duration('PT1H'));

        expect(duration).toEqual(new Duration('PT30M'));
      });
    });

    describe('Subtraction', () => {
      it('Subtracts duration', () => {
        const duration = new Duration('PT1H');

        duration.minus(new Duration('PT30M'));

        expect(duration).toEqual(new Duration('PT30M'));
      });

      it('Subtracts seconds', () => {
        const duration = new Duration(3600);

        duration.minus(1800);

        expect(duration).toEqual(new Duration(1800));
      });

      it('Changes sign', () => {
        const duration = new Duration('PT30M');

        duration.minus(new Duration('PT1H'));

        expect(duration).toEqual(new Duration('-PT30M'));
      });
    });

    describe('Convert to ISO 8601 string', () => {
      it('Returns ISO 8601 string', () => {
        const duration = new Duration(90061001);

        expect(duration.toISOString()).toEqual('P1DT1H1M1.001S');
      });

      it('Returns ISO 8601 string for 0', () => {
        const duration = Duration.zero();

        expect(duration.toISOString()).toEqual('PT0S');
      });

      it('Returns ISO 8601 string with only days', () => {
        const duration = new Duration(172800000);

        expect(duration.toISOString()).toEqual('P2D');
      });

      it('Returns ISO 8601 string with only hours', () => {
        const duration = new Duration(7200000);

        expect(duration.toISOString()).toEqual('PT2H');
      });

      it('Returns ISO 8601 string with only minutes', () => {
        const duration = new Duration(120000);

        expect(duration.toISOString()).toEqual('PT2M');
      });

      it('Returns ISO 8601 string with only seconds', () => {
        const duration = new Duration(2000);

        expect(duration.toISOString()).toEqual('PT2S');
      });

      it('Returns ISO 8601 string with only milliseconds', () => {
        const duration = new Duration(2);

        expect(duration.toISOString()).toEqual('PT0.002S');
      });

      it('Returns negative value', () => {
        const duration = new Duration(-5000);

        expect(duration.toISOString()).toEqual('-PT5S');
      });
    });

    describe('Convert to JSON', () => {
      it('Returns ISO string', () => {
        const duration = new Duration(91815250);

        const json = JSON.stringify(duration);

        expect(json).toEqual('"P1DT1H30M15.25S"');
      });
    });

    describe('Convert to string', () => {
      it('Returns medium string as default', () => {
        const duration = new Duration(90061001);

        expect(duration.toString()).toEqual('25:01:01');
      });

      it('Returns short string', () => {
        const duration = new Duration(90061001);

        expect(duration.toString({ style: 'short' })).toEqual('25:01');
      });

      it('Returns long string', () => {
        const duration = new Duration(90061001);

        expect(duration.toString({ style: 'long' })).toEqual('25:01:01.001');
      });

      it('Returns negative value', () => {
        const duration = new Duration('-PT5S');

        expect(duration.toString()).toEqual('-00:00:05');
      });

      it('Is used by string interpolation', () => {
        const duration = new Duration(90061001);

        const result = `${duration}`;

        expect(result).toEqual('25:01:01');
      });
    });

    describe('Convert to value', () => {
      it('Returns seconds', () => {
        const duration = new Duration(3661);

        expect(duration.valueOf()).toEqual(3661);
      });

      it('Returns negative value', () => {
        const duration = new Duration(-500);

        expect(duration.valueOf()).toEqual(-500);
      });

      it('Is used by number addition', () => {
        const duration = new Duration(3661);

        const result = 1 + duration;

        expect(result).toEqual(3662);
      });

      it('Is used by string concatenation', () => {
        const duration = new Duration(3661);

        const result = '' + duration;

        expect(result).toEqual('3661');
      });
    });
  });
});
