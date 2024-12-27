// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Contains missing language features.
 *
 * Portated from
 * [Java Lang](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/package-summary.html).
 *
 * @module
 */

/**
 * This is a base class for creating enum objects.
 *
 * Example:
 *
 * ```js
 * class YesNo extends Enum {
 *   static YES = new YesNo('YES', 0);
 *   static NO = new YesNo('NO', 1);
 * }
 * ```
 */
export class Enum {
  /**
   * Returns all enum constants.
   *
   * @return {Enum[]} All enum constants.
   */
  static values() {
    return Object.values(this);
  }

  /**
   * Returns an enum constant by its name.
   *
   * @param {string} name The name of the enum constant.
   * @return {Enum} The enum constant.
   */
  static valueOf(name) {
    const value = this.values().find((v) => v.name === name);
    if (value == null) {
      throw new Error(`No enum constant ${this.name}.${name} exists.`);
    }

    return value;
  }

  /**
   * Creates an enum object.
   *
   * @param {string} name The name of the enum constant.
   * @param {number} ordinal The ordinal of the enum constant.
   */
  constructor(name, ordinal) {
    this.name = name;
    this.ordinal = ordinal;
  }

  /**
   * Returns the name of the enum constant.
   *
   * @return {string} The name of the enum constant.
   */
  toString() {
    return this.name;
  }

  /**
   * Returns the ordinal of the enum constant.
   *
   * @return {number} The ordinal of the enum constant.
   */
  valueOf() {
    return this.ordinal;
  }

  /**
   * Returns the name of the enum constant.
   *
   * @return {string} The name of the enum constant.
   */
  toJSON() {
    return this.name;
  }
}

/**
 * Temporarily cease execution for the specified duration.
 *
 * @param {number} millis The duration to sleep in milliseconds.
 * @return {Promise<void>} A promise that resolves after the specified
 *   duration.
 */
export async function sleep(millis) {
  await new Promise((resolve) => setTimeout(resolve, millis));
}
