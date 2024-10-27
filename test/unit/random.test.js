import { describe, expect, it } from '@jest/globals';

import { Random } from '../../lib/random.js';
import { Duration } from '../../lib/time.js';

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
