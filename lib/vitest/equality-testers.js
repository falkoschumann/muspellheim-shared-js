import { expect } from 'vitest';

function isEquatable(a) {
  return a != null && typeof a.equals === 'function';
}

function testEquatable(a, b) {
  const isAEquatable = isEquatable(a);
  const isBEquatable = isEquatable(b);
  if (isAEquatable && isBEquatable) {
    return a.equals(b);
  } else if (isAEquatable === isBEquatable) {
    return undefined;
  } else {
    return false;
  }
}

expect.addEqualityTesters([testEquatable]);
