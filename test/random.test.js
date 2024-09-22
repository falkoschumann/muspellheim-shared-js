import { describe, expect, test } from '@jest/globals';

import {
  randomDate,
  randomInt,
  randomOptionalDate,
  randomOptionalInt,
  randomOptionalValue,
  randomValue,
} from '../src/random.js';

describe('Random', () => {
  test('Generates a random number between 5 and 7', () => {
    const r = randomInt(5, 7);

    expect(r).toBeGreaterThanOrEqual(5);
    expect(r).toBeLessThanOrEqual(7);
  });

  test('Generates an optional random number ', () => {
    const r = randomOptionalInt(5, 7);

    expect(r === undefined || typeof r === 'number').toBeTruthy();
  });

  test('Generates a random date', () => {
    const r = randomDate();

    expect(r).toBeInstanceOf(Date);
  });

  test('Generates a random date with a maximum duration', () => {
    const currentMillis = new Date().getTime();

    const r = randomDate(1000);

    expect(r.getTime()).toBeGreaterThanOrEqual(currentMillis - 1000);
    expect(r.getTime()).toBeLessThanOrEqual(currentMillis + 1000);
  });

  test('Generates an optional random date', () => {
    const r = randomOptionalDate();

    expect(r === undefined || r instanceof Date).toBeTruthy();
  });

  test('Generates a random value', () => {
    const values = ['a', 'b', 'c'];
    const r = randomValue(values);

    expect(values.includes(r)).toBeTruthy();
  });

  test('Returns nothing if no values are given', () => {
    const r = randomValue();

    expect(r).toBeUndefined();
  });

  test('Generates a random value', () => {
    const values = ['a', 'b', 'c'];
    const r = randomOptionalValue(values);

    expect(r === undefined || values.includes(r)).toBeTruthy();
  });
});
