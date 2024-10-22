// TODO Use JSON schema to validate like Java Bean Validation?

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** @returns {never} */
export function ensureUnreachable(message = 'Unreachable code executed.') {
  throw new Error(message);
}

export function ensureThat(
  value,
  predicate,
  message = 'Expected predicate is not true.',
) {
  const condition = predicate(value);
  if (!condition) {
    throw new ValidationError(message);
  }

  return value;
}

export function ensureAnything(value, { name = 'value' } = {}) {
  if (value == null) {
    throw new ValidationError(`The ${name} is required, but it was ${value}.`);
  }

  return value;
}

export function ensureNonEmpty(value, { name = 'value' } = {}) {
  const valueType = getType(value);
  if (
    (valueType === String && value.length === 0) ||
    (valueType === Array && value.length === 0) ||
    (valueType === Object && Object.keys(value).length === 0)
  ) {
    throw new ValidationError(
      `The ${name} must not be empty, but it was ${JSON.stringify(value)}.`,
    );
  }

  return value;
}

/*
 * type: undefined | null | Boolean | Number | BigInt | String | Symbol | Function | Object | Array | Enum | constructor | Record<string, type>
 * expectedType: type | [ type ]
 */

export function ensureType(value, expectedType, { name = 'value' } = {}) {
  const result = checkType(value, expectedType, { name });
  if (result.error) {
    throw new ValidationError(result.error);
  }
  return result.value;
}

export function ensureItemType(array, expectedType, { name = 'value' } = {}) {
  const result = checkType(array, Array, { name });
  if (result.error) {
    throw new ValidationError(result.error);
  }

  array.forEach((item, index) => {
    const result = checkType(item, expectedType, {
      name: `${name}.${index}`,
    });
    if (result.error) {
      throw new ValidationError(result.error);
    }
    array[index] = result.value;
  });
  return array;
}

export function ensureArguments(args, expectedTypes = [], names = []) {
  ensureThat(
    expectedTypes,
    Array.isArray,
    'The expectedTypes must be an array.',
  );
  ensureThat(names, Array.isArray, 'The names must be an array.');
  if (args.length > expectedTypes.length) {
    throw new ValidationError(
      `Too many arguments: expected ${expectedTypes.length}, but got ${args.length}.`,
    );
  }
  expectedTypes.forEach((expectedType, index) => {
    const name = names[index] ? names[index] : `argument #${index + 1}`;
    ensureType(args[index], expectedType, { name });
  });
}

/** @returns {{value: ?*, error: ?string}}} */
function checkType(value, expectedType, { name = 'value' } = {}) {
  const valueType = getType(value);

  // Check built-in types
  if (
    expectedType === undefined ||
    expectedType === null ||
    expectedType === Boolean ||
    expectedType === Number ||
    expectedType === BigInt ||
    expectedType === String ||
    expectedType === Symbol ||
    expectedType === Function ||
    expectedType === Object ||
    expectedType === Array
  ) {
    if (valueType === expectedType) {
      return { value };
    }

    return {
      error: `The ${name} must be ${describe(expectedType, {
        articles: true,
      })}, but it was ${describe(valueType, { articles: true })}.`,
    };
  }

  // Check enum types
  if (Object.getPrototypeOf(expectedType).name === 'Enum') {
    try {
      return { value: expectedType.valueOf(String(value).toUpperCase()) };
    } catch {
      return {
        error: `The ${name} must be ${describe(expectedType, {
          articles: true,
        })}, but it was ${describe(valueType, { articles: true })}.`,
      };
    }
  }

  // Check constructor types
  if (typeof expectedType === 'function') {
    if (value instanceof expectedType) {
      return { value };
    } else {
      const convertedValue = new expectedType(value);
      if (String(convertedValue).toLowerCase().startsWith('invalid')) {
        let error = `The ${name} must be a valid ${describe(
          expectedType,
        )}, but it was ${describe(valueType, { articles: true })}`;
        if (valueType != null) {
          error += `: ${JSON.stringify(value, { articles: true })}`;
        }
        error += '.';
        return { error };
      }

      return { value: convertedValue };
    }
  }

  // Check one of multiple types
  if (Array.isArray(expectedType)) {
    for (const type of expectedType) {
      const result = checkType(value, type, { name });
      if (!result.error) {
        return { value };
      }
    }

    return {
      error: `The ${name} must be ${describe(expectedType, {
        articles: true,
      })}, but it was ${describe(valueType, { articles: true })}.`,
    };
  }

  if (typeof expectedType === 'object') {
    // Check struct types
    const result = checkType(value, Object, { name });
    if (result.error) {
      return result;
    }

    for (const key in expectedType) {
      const result = checkType(value[key], expectedType[key], {
        name: `${name}.${key}`,
      });
      if (result.error) {
        return result;
      }
      value[key] = result.value;
    }

    return { value };
  }

  ensureUnreachable();
}

function getType(value) {
  if (value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return Array;
  }
  if (Number.isNaN(value)) {
    return NaN;
  }

  switch (typeof value) {
    case 'undefined':
      return undefined;
    case 'boolean':
      return Boolean;
    case 'number':
      return Number;
    case 'bigint':
      return BigInt;
    case 'string':
      return String;
    case 'symbol':
      return Symbol;
    case 'function':
      return Function;
    case 'object':
      return Object;
    default:
      ensureUnreachable(`Unknown typeof value: ${typeof value}.`);
  }
}

function describe(type, { articles = false } = {}) {
  if (Array.isArray(type)) {
    const types = type.map((t) => describe(t, { articles }));
    if (types.length <= 2) {
      return types.join(' or ');
    } else {
      const allButLast = types.slice(0, -1);
      const last = types.at(-1);
      return allButLast.join(', ') + ', or ' + last;
    }
  }

  if (Number.isNaN(type)) {
    return 'NaN';
  }

  let name;
  switch (type) {
    case null:
      return 'null';
    case undefined:
      return 'undefined';
    case Array:
      name = 'array';
      break;
    case Boolean:
      name = 'boolean';
      break;
    case Number:
      name = 'number';
      break;
    case BigInt:
      name = 'bigint';
      break;
    case String:
      name = 'string';
      break;
    case Symbol:
      name = 'symbol';
      break;
    case Function:
      name = 'function';
      break;
    case Object:
      name = 'object';
      break;
    default:
      name = type.name;
      break;
  }

  if (articles) {
    name = 'aeiou'.includes(name[0].toLowerCase()) ? `an ${name}` : `a ${name}`;
  }
  return name;
}
