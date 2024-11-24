// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * An API for time and durations.
 *
 * Portated from
 * [Java Time](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/package-summary.html).
 *
 * @module
 */

/**
 * A clock provides access to the current timestamp.
 */
export class Clock {
  /**
   * Creates a clock using system clock.
   *
   * @return {Clock} A clock that uses system clock.
   */
  static system() {
    return new Clock();
  }

  /**
   * Creates a clock using a fixed date.
   *
   * @param {Date} [date='2024-02-21T19:16:00Z'] The fixed date of the clock.
   * @return {Clock} A clock that returns alaways a fixed date.
   * @see Clock#add
   */
  static fixed(date = new Date('2024-02-21T19:16:00Z')) {
    return new Clock(date);
  }

  #date;

  /** @hideconstructor */
  constructor(/** @type {Date} */ date) {
    this.#date = date;
  }

  /**
   * Returns the current timestamp of the clock.
   *
   * @return {Date} The current timestamp.
   */
  date() {
    return this.#date ? new Date(this.#date) : new Date();
  }

  /**
   * Returns the current timestamp of the clock in milliseconds.
   *
   * @return {number} The current timestamp in milliseconds.
   */
  millis() {
    return this.date().getTime();
  }

  /**
   * Adds a duration to the current timestamp of the clock.
   *
   * @param {Duration|string|number} offsetDuration The duration or number of
   *   millis to add.
   */
  add(offsetDuration) {
    const current = this.date();
    this.#date = new Date(
      current.getTime() + new Duration(offsetDuration).millis,
    );
  }
}

/**
 * A duration is a time-based amount of time, such as '34.5 seconds'.
 */
export class Duration {
  /**
   * Creates a duration with zero value.
   *
   * @return {Duration} A zero duration.
   */
  static zero() {
    return new Duration();
  }

  /**
   * Creates a duration from a ISO 8601 string like `[-]P[dD]T[hH][mM][s[.f]S]`.
   *
   * @param {string} isoString The ISO 8601 string to parse.
   * @return {Duration} The parsed duration.
   */
  static parse(isoString) {
    const match = isoString.match(
      /^(-)?P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+\.?\d*)S)?$/,
    );
    if (match == null) {
      return new Duration(NaN);
    }

    const sign = match[1] === '-' ? -1 : 1;
    const days = Number(match[2] || 0);
    const hours = Number(match[3] || 0);
    const minutes = Number(match[4] || 0);
    const seconds = Number(match[5] || 0);
    const millis = Number(match[6] || 0);
    return new Duration(
      sign *
        (days * 86400000 +
          hours * 3600000 +
          minutes * 60000 +
          seconds * 1000 +
          millis),
    );
  }

  /**
   * Obtains a Duration representing the duration between two temporal objects.
   *
   * @param {Date|number} startInclusive  The start date or millis, inclusive.
   * @param {Date|number} endExclusive  The end date or millis, exclusive.
   * @return {Duration} The duration between the two dates.
   */
  static between(startInclusive, endExclusive) {
    return new Duration(endExclusive - startInclusive);
  }

  /**
   * The total length of the duration in milliseconds.
   *
   * @type {number}
   */
  millis;

  /**
   * Creates a duration.
   *
   * The duration is zero if no value is provided.
   *
   * @param {number|string|Duration} [value] The duration in millis, an ISO 8601
   *   string or another duration.
   */
  constructor(value) {
    if (value === null || arguments.length === 0) {
      this.millis = 0;
    } else if (typeof value === 'string') {
      this.millis = Duration.parse(value).millis;
    } else if (typeof value === 'number') {
      if (Number.isFinite(value)) {
        this.millis = Math.trunc(value);
      } else {
        this.millis = NaN;
      }
    } else if (value instanceof Duration) {
      this.millis = value.millis;
    } else {
      this.millis = NaN;
    }
  }

  /**
   * Gets the number of days in the duration.
   *
   * @type {number}
   * @readonly
   */
  get days() {
    return Math.trunc(this.millis / 86400000);
  }

  /**
   * Extracts the number of days in the duration.
   *
   * @type {number}
   * @readonly
   */
  get daysPart() {
    const value = this.millis / 86400000;
    return this.isNegative() ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Gets the number of hours in the duration.
   *
   * @type {number}
   * @readonly
   */
  get hours() {
    return Math.trunc(this.millis / 3600000);
  }

  /**
   * Extracts the number of hours in the duration.
   *
   * @type {number}
   * @readonly
   */
  get hoursPart() {
    const value = (this.millis - this.daysPart * 86400000) / 3600000;
    return this.isNegative() ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Gets the number of minutes in the duration.
   *
   * @type {number}
   * @readonly
   */
  get minutes() {
    return Math.trunc(this.millis / 60000);
  }

  /**
   * Extracts the number of minutes in the duration.
   *
   * @type {number}
   * @readonly
   */
  get minutesPart() {
    const value =
      (this.millis - this.daysPart * 86400000 - this.hoursPart * 3600000) /
      60000;
    return this.isNegative() ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Gets the number of seconds in the duration.
   *
   * @type {number}
   * @readonly
   */
  get seconds() {
    return Math.trunc(this.millis / 1000);
  }

  /**
   * Extracts the number of seconds in the duration.
   *
   * @type {number}
   * @readonly
   */
  get secondsPart() {
    const value =
      (this.millis -
        this.daysPart * 86400000 -
        this.hoursPart * 3600000 -
        this.minutesPart * 60000) /
      1000;
    return this.isNegative() ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Gets the number of milliseconds in the duration.
   *
   * @type {number}
   * @readonly
   */
  get millisPart() {
    const value =
      this.millis -
      this.daysPart * 86400000 -
      this.hoursPart * 3600000 -
      this.minutesPart * 60000 -
      this.secondsPart * 1000;
    return this.isNegative() ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Checks if the duration is zero.
   *
   * @return {boolean}
   */
  isZero() {
    return this.millis === 0;
  }

  /**
   * Checks if the duration is negative.
   *
   * @return {boolean}
   */
  isNegative() {
    return this.millis < 0;
  }

  /**
   * Checks if the duration is positive.
   *
   * @return {boolean}
   */
  isPositive() {
    return this.millis > 0;
  }

  /**
   * Returns a copy of this duration with a positive length.
   *
   * @return {Duration} The absolute value of the duration.
   */
  absolutized() {
    return new Duration(Math.abs(this.millis));
  }

  /**
   * Returns a copy of this duration with length negated.
   *
   * @return {Duration} The negated value of the duration.
   */
  negated() {
    return new Duration(-this.millis);
  }

  /**
   * Returns a copy of this duration with the specified duration added.
   *
   * @param {Duration|string|number} duration The duration to add or number of
   *   millis.
   * @return {Duration} The new duration.
   */
  plus(duration) {
    return new Duration(this.millis + new Duration(duration).millis);
  }

  /**
   * Returns a copy of this duration with the specified duration subtracted.
   *
   * @param {Duration|string|number} duration The duration to subtract or number
   *   of millis.
   * @return {Duration} The new duration.
   */
  minus(duration) {
    return new Duration(this.millis - new Duration(duration));
  }

  /**
   * Returns a copy of this duration multiplied by the scalar.
   *
   * @param {number} multiplicand The value to multiply the duration by.
   * @return {Duration} The new duration.
   */
  multipliedBy(multiplicand) {
    return new Duration(this.millis * multiplicand);
  }

  /**
   * Returns a copy of this duration divided by the specified value.
   *
   * @param {number} divisor The value to divide the duration by.
   * @return {Duration} The new duration.
   */
  dividedBy(divisor) {
    return new Duration(this.millis / divisor);
  }

  /**
   * Returns a string representation of this duration using ISO 8601, such as
   * `PT8H6M12.345S`.
   *
   * @return {string} The ISO 8601 string representation of the duration.
   */
  toISOString() {
    if (this.isZero()) {
      return 'PT0S';
    }

    const value = this.absolutized();

    let period = 'PT';
    const days = value.daysPart;
    const hours = value.hoursPart;
    if (days > 0 || hours > 0) {
      period += `${days * 24 + hours}H`;
    }
    const minutes = value.minutesPart;
    if (minutes > 0) {
      period += `${minutes}M`;
    }
    const seconds = value.secondsPart;
    const millis = value.millisPart;
    if (seconds > 0 || millis > 0) {
      period += `${seconds + millis / 1000}S`;
    }
    if (this.isNegative()) {
      period = `-${period}`;
    }
    return period;
  }

  /**
   * Returns a parsable string representation of this duration.
   *
   * @return {string} The string representation of this duration.
   */
  toJSON() {
    return this.toISOString();
  }

  /**
   * Returns a string representation of this duration, such as `08:06:12`.
   *
   * @param {object} options The options to create the string.
   * @param {string} [options.style='medium'] The style of the string (`short`,
   *   `medium`, `long`).
   * @return {string} The string representation of the duration.
   */
  toString({ style = 'medium' } = {}) {
    if (Number.isNaN(this.valueOf())) {
      return 'Invalid Duration';
    }

    const value = this.absolutized();
    const hours = String(Math.floor(value.hours)).padStart(2, '0');
    const minutes = String(value.minutesPart).padStart(2, '0');
    const seconds = String(value.secondsPart).padStart(2, '0');
    let result = `${hours}:${minutes}`;
    if (style === 'medium' || style === 'long') {
      result += `:${seconds}`;
    }
    if (style === 'long') {
      result += `.${String(value.millisPart).padStart(3, '0')}`;
    }
    if (this.isNegative()) {
      result = `-${result}`;
    }
    return result;
  }

  /**
   * Returns the value of the duration in milliseconds.
   *
   * @return {number} The value of the duration in milliseconds.
   */
  valueOf() {
    return this.millis;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'number') {
      return this.valueOf();
    } else {
      return this.toString();
    }
  }
}
