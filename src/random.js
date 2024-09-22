import { Duration } from './duration.js';

/**
 * Returns a random value or `undefined`.
 */
export function randomOptional(
  /** @type {()=>any} */ randomFactory,
  probabilityOfUndefined = 0.2,
) {
  const r = Math.random();
  return r < probabilityOfUndefined ? undefined : randomFactory();
}

/**
 * Returns a random integer between `min` and `max`, both inclusive.
 */
export function randomInt(min = 0, max = 1) {
  return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Returns a random integer or `undefined`.
 */
export function randomOptionalInt(min, max, probabilityOfUndefined = 0.2) {
  return randomOptional(() => randomInt(min, max), probabilityOfUndefined);
}

/**
 * Returns a random float between `min` and `max`, both inclusive.
 */
export function randomFloat(min = 0.0, max = 1.0) {
  return Math.random() * (max - min) + min;
}

/**
 * Returns a random float or `undefined`.
 */
export function randomOptionalFloat(min, max, probabilityOfUndefined = 0.2) {
  return randomOptional(() => randomFloat(min, max), probabilityOfUndefined);
}

/**
 * Returns a random date with optional random offset.
 */
export function randomDate(maxDuration = Duration.zero()) {
  const now = new Date();
  let t = now.getTime();
  const r = Math.random();
  t += r * maxDuration;
  return new Date(t);
}

/**
 * Returns a random date or `undefined`.
 */
export function randomOptionalDate(maxDuration, probabilityOfUndefined = 0.2) {
  return randomOptional(() => randomDate(maxDuration), probabilityOfUndefined);
}

/**
 * Returns a random value from an array.
 */
export function randomValue(values = []) {
  const index = randomInt(0, values.length - 1);
  return values[index];
}

/**
 * Returns a random value from an array or `undefined` with a given probability.
 */
export function randomOptionalValue(values, probabilityOfUndefined = 0.2) {
  return randomOptional(() => randomValue(values), probabilityOfUndefined);
}
