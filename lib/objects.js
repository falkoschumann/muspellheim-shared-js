// TODO deep copy
// TODO deep equals

export function deepMerge(source, target) {
  if (target === undefined) {
    return source;
  }

  if (typeof target !== 'object' || target === null) {
    return target;
  }

  if (Array.isArray(source) && Array.isArray(target)) {
    for (const item of target) {
      const element = deepMerge(undefined, item);
      source.push(element);
    }
    return source;
  }

  for (const key in target) {
    if (typeof source !== 'object' || source === null) {
      source = {};
    }

    source[key] = deepMerge(source[key], target[key]);
  }

  return source;
}
