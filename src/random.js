import { Duration } from './duration.js';

export function randomOptional(randomFunction, probabilityOfUndefined = 0.2) {
  const r = Math.random();
  return r < probabilityOfUndefined ? undefined : randomFunction();
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

export function randomOptionalInt(min, max, probabilityOfUndefined = 0.2) {
  return randomOptional(() => randomInt(min, max), probabilityOfUndefined);
}

export function randomDate(maxDuration = Duration.zero()) {
  const now = new Date();
  let t = now.getTime();
  const r = Math.random();
  t += r * maxDuration;
  return new Date(t);
}

export function randomOptionalDate(maxDuration, probabilityOfUndefined = 0.2) {
  return randomOptional(() => randomDate(maxDuration), probabilityOfUndefined);
}

export function randomValue(values = []) {
  const index = randomInt(0, values.length);
  return values[index];
}

export function randomOptionalValue(values, probabilityOfUndefined = 0.2) {
  return randomOptional(() => randomValue(values), probabilityOfUndefined);
}
