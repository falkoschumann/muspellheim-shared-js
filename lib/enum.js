import { ensureArguments } from './validation.js';

export class Enum {
  static values() {
    return Object.values(this);
  }

  static valueOf(name) {
    const value = this.values().find((v) => v.name === name);
    if (value == null) {
      throw new Error(`No enum constant ${this.name}.${name} exists.`);
    }

    return value;
  }

  constructor(ordinal, name) {
    ensureArguments(arguments, [Number, String]);
    this.ordinal = ordinal;
    this.name = name;
  }

  toString() {
    return this.name;
  }

  valueOf() {
    return this.ordinal;
  }

  toJSON() {
    return this.name;
  }
}
