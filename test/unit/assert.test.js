// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from 'vitest';

import { assertNotNull } from '../../lib/assert.js';

describe('assertNotNull', () => {
  it('does not throw an error when object is not null', () => {
    expect(() => assertNotNull({})).not.toThrow();
  });

  it('throws an error when object is null', () => {
    expect(() => assertNotNull(null)).toThrow();
  });

  it('throws an error with given message', () => {
    expect(() => assertNotNull(null, 'Object is null')).toThrow(
      'Object is null',
    );
  });

  it('throws an error with given message factory', () => {
    expect(() => assertNotNull(null, () => 'Object is null')).toThrow(
      'Object is null',
    );
  });
});
