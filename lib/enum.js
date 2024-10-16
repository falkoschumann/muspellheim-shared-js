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
   * @returns {T[]} all enum constants
   */
  static values() {
    return Object.values(this);
  }

  /**
   * Returns an enum constant by its name.
   *
   * @param {string} name - the name of the enum constant
   * @returns {T} the enum constant
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
   * @param {number} ordinal - the ordinal of the enum constant
   * @param {string} name - the name of the enum constant
   */
  constructor(name, ordinal) {
    ensureArguments(arguments, [String, Number]);
    this.name = name;
    this.ordinal = ordinal;
  }

  /**
   * Returns the name of the enum constant.
   *
   * @returns {string} the name of the enum constant
   */
  toString() {
    return this.name;
  }

  /**
   * Returns the ordinal of the enum constant.
   *
   * @returns {number} the ordinal of the enum constant
   */
  valueOf() {
    return this.ordinal;
  }

  /**
   * Returns the name of the enum constant.
   *
   * @returns {string} the name of the enum constant
   */
  toJSON() {
    return this.name;
  }
}
