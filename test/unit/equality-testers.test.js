import { describe, expect, it } from 'vitest';

import '../../lib/vitest/equality-testers.js';

describe('Equality testers', () => {
  describe('Equatable', () => {
    it('Returns true for 2 equatable objects', () => {
      const a = new Foo(1);
      const b = new Foo(1);

      expect(a).toEqual(b);
    });

    it('Returns false for 2 equatable objects', () => {
      const a = new Foo(1);
      const b = new Foo(2);

      expect(a).not.toEqual(b);
    });

    it('Returns false for 1 equatable object and 1 other object', () => {
      const a = new Foo(1);
      const b = new Bar(1);

      expect(a).not.toEqual(b);
    });

    it('Returns true for 2 other objects', () => {
      // The 2 objects have no public property to compare, so they are equal.
      // Synthetic properties are ignored.
      const a = new Bar(1);
      const b = new Bar(1);

      expect(a).toEqual(b);
    });
  });
});

class Foo {
  #value;

  constructor(value) {
    this.#value = value;
  }

  get value() {
    return this.#value;
  }

  equals(other) {
    return this.#value === other.#value;
  }
}

class Bar {
  #value;

  constructor(value) {
    this.#value = value;
  }

  get value() {
    return this.#value;
  }
}
