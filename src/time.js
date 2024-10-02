/**
 * A clock providing access to the current timestamp.
 *
 * In contrast to the Java `Clock` class, this class is mutable.
 */
export class Clock {
  /**
   * Creates a clock using system clock.
   *
   * @returns {Clock} a clock that uses system clock
   */
  static system() {
    return new Clock();
  }

  /**
   * Creates a clock using a fixed date.
   *
   * @param {Object} options - the options to create the clock
   * @param {Date} [options.fixed=new Date('2024-02-21T19:16:00Z')] - the fixed date of the clock
   * @returns {Clock} a clock that returns alaways a fixed date
   * @see {@link Clock#add}
   */
  static fixed(fixedDate = new Date('2024-02-21T19:16:00Z')) {
    return new Clock(fixedDate);
  }

  #date;

  /** @hideconstructor */
  constructor(/** @type {string|number|Date|null} */ date) {
    this.#date = date;
  }

  /**
   * Returns the current date and time of the clock.
   *
   * @returns {Date} the current date
   */
  date() {
    return this.#date ? new Date(this.#date) : new Date();
  }

  /**
   * Adds the specified number of milliseconds to the current timestamp of
   * the clock and use it as fixed date.
   *
   * @param {Duration|number} offsetDuration - the duration or number of millis to add
   */
  add(offsetDuration) {
    const now = this.date();
    this.#date = new Date(now.getTime() + offsetDuration);
  }
}

/**
 * A time-based amount of time, such as '34.5 seconds'.
 *
 * In contrast to the Java `Date` class, this class is mutable.
 */
export class Duration {
  /**
   * Creates a duration with zero value.
   *
   * @returns {Duration} A new instance of the duration with zero value.
   */
  static zero() {
    return new Duration();
  }

  /**
   * Creates a duration from a ISO 8601 string like `[-]P[dD]T[hH][mM][s[.f]S]`.
   *
   * @param {string} isoString - The ISO 8601 string to parse.
   * @returns {Duration} The parsed duration.
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
   * Gets the number of days in the duration.
   *
   * @type {number}
   */
  millis;

  /**
   * Creates a new instance of the duration.
   *
   * @param {number|string|Duration} [value=0] - The duration in millis or an ISO 8601 string.
   */
  constructor(value) {
    if (value === null || arguments.length === 0) {
      this.millis = 0;
    } else if (typeof value === 'string') {
      this.millis = Duration.parse(value).millis;
    } else if (typeof value === 'number') {
      if (Number.isFinite(value)) {
        this.millis = value < 0 ? Math.ceil(value) : Math.floor(value);
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
   * Checks if the duration is zero.
   *
   * @type {boolean}
   */
  get isZero() {
    return this.millis === 0;
  }

  /**
   * Checks if the duration is negative.
   *
   * @type {boolean}
   */
  get isNegative() {
    return this.millis < 0;
  }

  /**
   * Checks if the duration is positive.
   *
   * @type {boolean}
   */
  get isPositive() {
    return this.millis > 0;
  }

  /**
   * Gets the number of days in the duration.
   *
   * @type {number}
   */
  get days() {
    return this.millis / 86400000;
  }

  /**
   * Extracts the number of days in the duration.
   *
   * @type {number}
   */
  get daysPart() {
    const value = this.millis / 86400000;
    return this.isNegative ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Gets the number of hours in the duration.
   *
   * @type {number}
   */
  get hours() {
    return this.millis / 3600000;
  }

  /**
   * Extracts the number of hours in the duration.
   *
   * @type {number}
   */
  get hoursPart() {
    const value = (this.millis - this.daysPart * 86400000) / 3600000;
    return this.isNegative ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Gets the number of minutes in the duration.
   *
   * @type {number}
   */
  get minutes() {
    return this.millis / 60000;
  }

  /**
   * Extracts the number of minutes in the duration.
   *
   * @type {number}
   */
  get minutesPart() {
    const value =
      (this.millis - this.daysPart * 86400000 - this.hoursPart * 3600000) /
      60000;
    return this.isNegative ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Gets the number of seconds in the duration.
   *
   * @type {number}
   */
  get seconds() {
    return this.millis / 1000;
  }

  /**
   * Extracts the number of seconds in the duration.
   *
   * @type {number}
   */
  get secondsPart() {
    const value =
      (this.millis -
        this.daysPart * 86400000 -
        this.hoursPart * 3600000 -
        this.minutesPart * 60000) /
      1000;
    return this.isNegative ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Gets the number of milliseconds in the duration.
   *
   * @type {number}
   */
  get millisPart() {
    const value =
      this.millis -
      this.daysPart * 86400000 -
      this.hoursPart * 3600000 -
      this.minutesPart * 60000 -
      this.secondsPart * 1000;
    return this.isNegative ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Returns a copy of this duration with a positive length.
   *
   * @returns {Duration} the absolute value of the duration
   */
  absolutized() {
    return new Duration(Math.abs(this.millis));
  }

  /**
   * Returns a copy of this duration with length negated.
   *
   * @returns {Duration} the negated value of the duration
   */
  negated() {
    return new Duration(-this.millis);
  }

  /**
   * Adds the specified duration to this duration.
   *
   * @param {Duration|number} duration - the duration to add
   * @returns {Duration} this duration
   */
  plus(duration) {
    this.millis += duration;
    return this;
  }

  /**
   * Subtracts the specified duration from this duration.
   *
   * @param {Duration|number} duration - the duration to subtract
   * @returns {Duration} this duration
   */
  minus(duration) {
    this.millis -= duration;
    return this;
  }

  /**
   * Returns a string representation of this duration using ISO 8601, such as
   * `PT8H6M12.345S`.
   *
   * @returns {string} the ISO 8601 string representation of the duration
   */
  toISOString() {
    const value = this.absolutized();

    let period = 'P';
    const days = value.daysPart;
    if (days > 0) {
      period += `${days}D`;
    }

    let time = '';
    const hours = value.hoursPart;
    if (hours > 0) {
      time += `${hours}H`;
    }
    const minutes = value.minutesPart;
    if (minutes > 0) {
      time += `${minutes}M`;
    }
    const seconds = value.secondsPart;
    const millis = value.millisPart;
    if (seconds > 0 || millis > 0) {
      time += `${seconds + millis / 1000}S`;
    }
    if (time !== '') {
      period += `T${time}`;
    }
    if (period === 'P') {
      period += 'T0S';
    }
    if (this.isNegative) {
      period = `-${period}`;
    }
    return period;
  }

  /**
   * Returns a string representation of this duration.
   *
   * @returns {string} the ISO 8601 string representation of tis duration
   */
  toJSON() {
    return this.toISOString();
  }

  /**
   * Returns a string representation of this duration, such as `08:06:12`.
   * @param {object} options - the options to create the string
   * @param {string} [options.style='medium'] - the style of the string (`short`, `medium`, `long`)
   * @returns {string} the string representation of the duration
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
    if (this.isNegative) {
      result = `-${result}`;
    }
    return result;
  }

  /**
   * Returns the value of the duration in milliseconds.
   *
   * @returns {number} the value of the duration in milliseconds
   */
  valueOf() {
    return this.millis;
  }
}
