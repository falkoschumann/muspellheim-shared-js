// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * An instance of `Random` is used to generate random numbers.
 */
export class Random {
  static create() {
    return new Random();
  }

  /** @hideconstructor */
  constructor() {}

  /**
   * Returns a random boolean value.
   *
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {boolean|undefined} a random boolean between `origin` (inclusive) and `bound` (exclusive) or undefined
   */
  nextBoolean(probabilityOfUndefined = 0.0) {
    return this.#randomOptional(
      () => Math.random() < 0.5,
      probabilityOfUndefined,
    );
  }

  /**
   * Returns a random integer between `origin` (inclusive) and `bound`
   * (exclusive).
   *
   * @param {number} [origin=0] - the least value that can be returned
   * @param {number} [bound=1] - the upper bound (exclusive) for the returned value
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {number|undefined} a random integer between `origin` (inclusive) and `bound` (exclusive) or undefined
   */
  nextInt(origin = 0, bound = 1, probabilityOfUndefined = 0.0) {
    return this.#randomOptional(
      () => Math.floor(this.nextFloat(origin, bound)),
      probabilityOfUndefined,
    );
  }

  /**
   * Returns a random float between `origin` (inclusive) and `bound`
   * (exclusive).
   *
   * @param {number} [origin=0.0] - the least value that can be returned
   * @param {number} [bound=1.0] - the upper bound (exclusive) for the returned value
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {number|undefined} a random float between `origin` (inclusive) and `bound` (exclusive) or undefined
   */
  nextFloat(origin = 0.0, bound = 1.0, probabilityOfUndefined = 0.0) {
    return this.#randomOptional(
      () => Math.random() * (bound - origin) + origin,
      probabilityOfUndefined,
    );
  }

  /**
   * Returns a random timestamp with optional random offset.
   *
   * @param {number} [maxMillis=0] - the maximum offset in milliseconds
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {Date|undefined} - a random timestamp or `undefined`
   */
  nextDate(maxMillis = 0, probabilityOfUndefined = 0.0) {
    return this.#randomOptional(() => {
      const now = new Date();
      let t = now.getTime();
      const r = Math.random();
      t += r * maxMillis;
      return new Date(t);
    }, probabilityOfUndefined);
  }

  /**
   * Returns a random value from an array.
   *
   * @param {Array} [values=[]] - the array of values
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {*|undefined} - a random value from the array or `undefined`
   */
  nextValue(values = [], probabilityOfUndefined = 0.0) {
    return this.#randomOptional(() => {
      const index = new Random().nextInt(0, values.length - 1);
      return values[index];
    }, probabilityOfUndefined);
  }

  #randomOptional(randomFactory, probabilityOfUndefined) {
    const r = Math.random();
    return r < probabilityOfUndefined ? undefined : randomFactory();
  }
}
