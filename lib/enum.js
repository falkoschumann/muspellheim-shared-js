// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { ensureArguments } from './validation.js';

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
 *
 * @template [T=Enum] - the type of the enum object
 */
export class Enum {
  /**
   * Returns all enum constants.
   *
   * @returns {T[]} All enum constants.
   */
  static values() {
    return Object.values(this);
  }

  /**
   * Returns an enum constant by its name.
   *
   * @param {string} name The name of the enum constant.
   * @returns {T} The enum constant.
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
   * @param {number} ordinal The ordinal of the enum constant.
   * @param {string} name The name of the enum constant.
   */
  constructor(name, ordinal) {
    ensureArguments(arguments, [String, Number]);
    this.name = name;
    this.ordinal = ordinal;
  }

  /**
   * Returns the name of the enum constant.
   *
   * @returns {string} The name of the enum constant.
   */
  toString() {
    return this.name;
  }

  /**
   * Returns the ordinal of the enum constant.
   *
   * @returns {number} The ordinal of the enum constant.
   */
  valueOf() {
    return this.ordinal;
  }

  /**
   * Returns the name of the enum constant.
   *
   * @returns {string} The name of the enum constant.
   */
  toJSON() {
    return this.name;
  }
}
