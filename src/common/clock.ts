// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

/**
 * A clock provides access to the current timestamp.
 */
export class Clock {
  /**
   * Create a clock using system the clock.
   *
   * @return A clock that uses the system clock.
   */
  static system(): Clock {
    return new Clock();
  }

  /**
   * Create a clock using a fixed date.
   *
   * @param date The fixed date of the clock.
   * @return A clock that always returns a fixed date.
   */
  static fixed(date: Date | string | number): Clock {
    return new Clock(new Date(date));
  }

  /**
   * Create a clock that returns a fixed offset from the given clock.
   *
   * @param clock The clock to offset from.
   * @param offsetMillis The offset in milliseconds.
   * @return A clock that returns a fixed offset from the given clock.
   */
  static offset(clock: Clock, offsetMillis: number): Clock {
    return new Clock(new Date(clock.millis() + offsetMillis));
  }

  readonly #date?: Date;

  private constructor(date?: Date) {
    this.#date = date;
  }

  /**
   * Return the current timestamp of the clock.
   *
   * @return The current timestamp.
   */
  date(): Date {
    return this.#date ? new Date(this.#date) : new Date();
  }

  /**
   * Return the current timestamp of the clock in milliseconds.
   *
   * @return The current timestamp in milliseconds.
   */
  millis(): number {
    return this.date().getTime();
  }
}
