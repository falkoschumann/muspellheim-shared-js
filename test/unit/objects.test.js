// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from 'vitest';

import { deepMerge } from '../../lib/objects.js';

describe('Objects', () => {
  describe('deep merge', () => {
    it('returns string when target is a string', () => {
      const result = deepMerge(undefined, 'a');

      expect(result).toBe('a');
    });

    it('returns number when target is a number', () => {
      const result = deepMerge(undefined, 1);

      expect(result).toBe(1);
    });

    it('returns boolean when target is a boolean', () => {
      const result = deepMerge(undefined, false);

      expect(result).toBe(false);
    });

    it('returns null when target is null', () => {
      const result = deepMerge(undefined, null);

      expect(result).toBeNull();
    });

    it('returns source value when target is undefined', () => {
      const result = deepMerge(2, undefined);

      expect(result).toBe(2);
    });

    it('merges target property when source does not have it', () => {
      const result = deepMerge({ a: 1 }, { b: 2 });

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('overrides source property with target property', () => {
      const result = deepMerge({ a: 1 }, { a: 2 });

      expect(result).toEqual({ a: 2 });
    });

    it('merges nested objects', () => {
      const result = deepMerge({ a: { b: 1 } }, { a: { c: 2 } });

      expect(result).toEqual({ a: { b: 1, c: 2 } });
    });

    it('creates nested objects when source does not have it', () => {
      const result = deepMerge({}, { a: { b: 2 } });

      expect(result).toEqual({ a: { b: 2 } });
    });

    it('overrides type of property', () => {
      const result = deepMerge({ a: 1 }, { a: { b: 2 } });

      expect(result).toEqual({ a: { b: 2 } });
    });

    it('combines arrays', () => {
      const result = deepMerge({ a: [1] }, { a: [{ b: 2 }] });

      expect(result).toEqual({ a: [1, { b: 2 }] });
    });
  });
});
