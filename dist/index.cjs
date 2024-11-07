'use strict';

var process = require('node:process');
var fsPromises = require('node:fs/promises');
var path = require('node:path');

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Assert that an object is not `null`.
 *
 * @param {*} object The object to check.
 * @param {string|Function} message The message to throw or a function that
 *   returns the message.
 */
function assertNotNull(object, message) {
  if (object == null) {
    message = typeof message === 'function' ? message() : message;
    throw new ReferenceError(message);
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

const FACTOR = 0.7;

/**
 * The Color class represents a color in the RGB color space.
 */
class Color {
  #value;

  /**
   * Creates a color instance from RGB values.
   *
   * @param {number} red The red component or the RGB value.
   * @param {number} [green] The green component.
   * @param {number} [blue] The blue component.
   */
  constructor(red, green, blue) {
    if (green === undefined && blue === undefined) {
      if (typeof red === 'string') {
        this.#value = parseInt(red, 16);
        return;
      }

      this.#value = Number(red);
      return;
    }

    this.#value = ((red & 0xff) << 16) | ((green & 0xff) << 8) |
      ((blue & 0xff) << 0);
  }

  /**
   * The RGB value of the color.
   *
   * @type {number}
   */
  get rgb() {
    return this.#value;
  }

  /**
   * The red component of the color.
   *
   * @type {number}
   */
  get red() {
    return (this.rgb >> 16) & 0xff;
  }

  /**
   * The green component of the color.
   *
   * @type {number}
   */
  get green() {
    return (this.rgb >> 8) & 0xff;
  }

  /**
   * The blue component of the color.
   *
   * @type {number}
   */
  get blue() {
    return (this.rgb >> 0) & 0xff;
  }

  /**
   * Creates a new color that is brighter than this color.
   *
   * @param {number} [factor] The optional factor to brighten the color.
   * @return {Color} The brighter color.
   */
  brighter(factor = FACTOR) {
    if (Number.isNaN(this.rgb)) {
      return new Color();
    }

    let red = this.red;
    let green = this.green;
    let blue = this.blue;

    const inverse = Math.floor(1 / (1 - factor));
    if (red === 0 && green === 0 && blue === 0) {
      return new Color(inverse, inverse, inverse);
    }

    if (red > 0 && red < inverse) red = inverse;
    if (green > 0 && green < inverse) green = inverse;
    if (blue > 0 && blue < inverse) blue = inverse;

    return new Color(
      Math.min(Math.floor(red / FACTOR), 255),
      Math.min(Math.floor(green / FACTOR), 255),
      Math.min(Math.floor(blue / FACTOR), 255),
    );
  }

  /**
   * Creates a new color that is darker than this color.
   *
   * @param {number} [factor] The optional factor to darken the color.
   * @return {Color} The darker color.
   */
  darker(factor = FACTOR) {
    if (Number.isNaN(this.rgb)) {
      return new Color();
    }

    return new Color(
      Math.max(Math.floor(this.red * factor), 0),
      Math.max(Math.floor(this.green * factor), 0),
      Math.max(Math.floor(this.blue * factor), 0),
    );
  }

  /**
   * Returns the RGB value of the color.
   *
   * @return {number} The RGB value of the color.
   */
  valueOf() {
    return this.rgb;
  }

  /**
   * Returns the hexadecimal representation of the color.
   *
   * @return {string} The hexadecimal representation of the color.
   */
  toString() {
    if (Number.isNaN(this.rgb)) {
      return 'Invalid Color';
    }

    return this.rgb.toString(16).padStart(6, '0');
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Handle returning a pre-configured responses.
 *
 * This is one of the nullability patterns from James Shore's article on
 * [testing without mocks](https://www.jamesshore.com/v2/projects/nullables/testing-without-mocks#configurable-responses).
 *
 * Example usage for stubbing `fetch` function:
 *
 * ```javascript
 * function createFetchStub(responses) {
 *   const configurableResponses = ConfigurableResponses.create(responses);
 *   return async function () {
 *     const response = configurableResponses.next();
 *     return {
 *       status: response.status,
 *       json: async () => response.body,
 *     };
 *   };
 * }
 * ```
 */
class ConfigurableResponses {
  /**
   * Creates a configurable responses instance from a single response or an
   * array of responses with an optional response name.
   *
   * @param {*|Array} responses A single response or an array of responses.
   * @param {string} [name] An optional name for the responses.
   */
  static create(responses, name) {
    return new ConfigurableResponses(responses, name);
  }

  #description;
  #responses;

  /**
   * Creates a configurable responses instance from a single response or an
   * array of responses with an optional response name.
   *
   * @param {*|Array} responses A single response or an array of responses.
   * @param {string} [name] An optional name for the responses.
   */
  constructor(/** @type {*|Array} */ responses, /** @type {?string} */ name) {
    this.#description = name == null ? '' : ` in ${name}`;
    this.#responses = Array.isArray(responses) ? [...responses] : responses;
  }

  /**
   * Returns the next response.
   *
   * If there are no more responses, an error is thrown. If a single response is
   * configured, it is always returned.
   *
   * @return {*} The next response.
   */
  next() {
    const response = Array.isArray(this.#responses)
      ? this.#responses.shift()
      : this.#responses;
    if (response === undefined) {
      throw new Error(`No more responses configured${this.#description}.`);
    }

    return response;
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

// TODO Use JSON schema to validate like Java Bean Validation?

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** @return {never} */
function ensureUnreachable(message = 'Unreachable code executed.') {
  throw new Error(message);
}

function ensureThat(
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

function ensureAnything(value, { name = 'value' } = {}) {
  if (value == null) {
    throw new ValidationError(`The ${name} is required, but it was ${value}.`);
  }

  return value;
}

function ensureNonEmpty(value, { name = 'value' } = {}) {
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

function ensureType(value, expectedType, { name = 'value' } = {}) {
  const result = checkType(value, expectedType, { name });
  if (result.error) {
    throw new ValidationError(result.error);
  }
  return result.value;
}

function ensureItemType(array, expectedType, { name = 'value' } = {}) {
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

function ensureArguments(args, expectedTypes = [], names = []) {
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

/** @return {{value: ?*, error: ?string}}} */
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
      error: `The ${name} must be ${
        describe(expectedType, {
          articles: true,
        })
      }, but it was ${describe(valueType, { articles: true })}.`,
    };
  }

  // Check enum types
  if (Object.getPrototypeOf(expectedType).name === 'Enum') {
    try {
      return { value: expectedType.valueOf(String(value).toUpperCase()) };
    } catch {
      return {
        error: `The ${name} must be ${
          describe(expectedType, {
            articles: true,
          })
        }, but it was ${describe(valueType, { articles: true })}.`,
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
        let error = `The ${name} must be a valid ${
          describe(
            expectedType,
          )
        }, but it was ${describe(valueType, { articles: true })}`;
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
      error: `The ${name} must be ${
        describe(expectedType, {
          articles: true,
        })
      }, but it was ${describe(valueType, { articles: true })}.`,
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

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


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
class Enum {
  /**
   * Returns all enum constants.
   *
   * @return {T[]} All enum constants.
   */
  static values() {
    return Object.values(this);
  }

  /**
   * Returns an enum constant by its name.
   *
   * @param {string} name The name of the enum constant.
   * @return {T} The enum constant.
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
   * @param {number} ordinal The ordinal of the enum constant.
   * @param {string} name The name of the enum constant.
   */
  constructor(name, ordinal) {
    ensureArguments(arguments, [String, Number]);
    this.name = name;
    this.ordinal = ordinal;
  }

  /**
   * Returns the name of the enum constant.
   *
   * @return {string} The name of the enum constant.
   */
  toString() {
    return this.name;
  }

  /**
   * Returns the ordinal of the enum constant.
   *
   * @return {number} The ordinal of the enum constant.
   */
  valueOf() {
    return this.ordinal;
  }

  /**
   * Returns the name of the enum constant.
   *
   * @return {string} The name of the enum constant.
   */
  toJSON() {
    return this.name;
  }
}

/**
 * Temporarily cease execution for the specified duration.
 *
 * @param {number} millis The duration to sleep in milliseconds.
 * @return {Promise<void>} A promise that resolves after the specified
 *   duration.
 */
async function sleep(millis) {
  await new Promise((resolve) => setTimeout(resolve, millis));
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

class FeatureToggle {
  /*
  static isFoobarEnabled() {
    return true;
  }
  */
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


/**
 * Express state of a component.
 */
class Status {
  /**
   * Indicates the component is in an unknown state.
   *
   * @type {Status}
   */
  static UNKNOWN = new Status('UNKNOWN');

  /**
   * Indicates the component is functioning as expected
   *
   * @type {Status}
   */
  static UP = new Status('UP');

  /**
   *  Indicates the component has suffered an unexpected failure.
   *
   * @type {Status}
   */
  static DOWN = new Status('DOWN');

  /**
   *  Indicates the component has been taken out of service and should not be used.
   *
   * @type {Status}
   */
  static OUT_OF_SERVICE = new Status('OUT_OF_SERVICE');

  /**
   * Creates a new status.
   *
   * @param {string} code The status code.
   */
  constructor(code) {
    assertNotNull(code, 'Code must not be null.');
    this.code = code;
  }

  /**
   * Returns a string representation of the status.
   *
   * @return {string} The status code.
   */
  toString() {
    return this.code;
  }

  /**
   * Returns the value of the status.
   *
   * @return {string} The status code.
   */
  valueOf() {
    return this.code;
  }

  /**
   * Returns the status code.
   *
   * @return {string} The status code.
   */
  toJSON() {
    return this.code;
  }
}

/**
 * Carry information about the health of a component.
 */
class Health {
  /**
   * Creates a new health object with status {@link Status.UNKNOWN}.
   *
   * @param {object} options The health options.
   * @param {Record<string, *>} [options.details] The details of the health.
   */
  static unknown({ details } = {}) {
    return Health.status({ status: Status.UNKNOWN, details });
  }

  /**
   * Creates a new health object with status {@link Status.UP}.
   *
   * @param {object} options The health options.
   * @param {Record<string, *>} [options.details] The details of the health.
   */
  static up({ details } = {}) {
    return Health.status({ status: Status.UP, details });
  }

  /**
   * Creates a new health object with status {@link Status.DOWN}.
   *
   * @param {object} options The health options.
   * @param {Record<string, *>} [options.details] The details of the health.
   * @param {Error} [options.error] The error of the health.
   */
  static down({ details, error } = {}) {
    return Health.status({ status: Status.DOWN, details, error });
  }

  /**
   * Creates a new health object with status {@link Status.OUT_OF_SERVICE}.
   *
   * @param {object} options The health options.
   * @param {Record<string, *>} [options.details] The details of the health.
   */
  static outOfService({ details } = {}) {
    return Health.status({ status: Status.OUT_OF_SERVICE, details });
  }

  /**
   * Creates a new health object.
   *
   * @param {object} options The health options.
   * @param {Status} options.status The status of the health.
   * @param {Record<string, *>} [options.details] The details of the health.
   * @param {Error} [options.error] The error of the health.
   */
  static status({ status = Status.UNKNOWN, details, error } = {}) {
    if (error) {
      details = { ...details, error: `${error.name}: ${error.message}` };
    }
    return new Health(status, details);
  }

  /**
   * The status of the health.
   *
   * @type {Status}
   */
  status;

  /**
   * The details of the health.
   *
   * @type {?Record<string, *>}
   */
  details;

  /**
   * Creates a new health object.
   *
   * @param {Status} status The status of the health.
   * @param {Record<string, *>} details The details of the health.
   */
  constructor(
    /** @type {Status} */ status,
    /** @type {?Record<string, *>} */ details,
  ) {
    assertNotNull(status, 'Status must not be null.');
    // TODO assertNotNull(details, 'Details must not be null.');

    this.status = status;
    this.details = details;
  }
}

/**
 * A {@link Health} that is composed of other {@link Health} instances.
 */
class CompositeHealth {
  /**
   * The status of the component.
   *
   * @type {Status}
   */
  status;

  /**
   * The components of the health.
   *
   * @type {?Record<string, Health|CompositeHealth>}
   */
  components;

  /**
   * Creates a new composite health object.
   *
   * @param {Status} status The combined status of the components.
   * @param {Record<string, Health|CompositeHealth>} [components] The components.
   */
  constructor(
    /** @type {Status} */ status,
    /** @type {?Record<string, Health|CompositeHealth>} */ components,
  ) {
    assertNotNull(status, 'Status must not be null.');

    this.status = status;
    this.components = components;
  }
}

/**
 * Strategy interface used to contribute {@link Health} to the results returned
 * from the {@link HealthEndpoint}.
 *
 * @typedef {object} HealthIndicator
 * @property {function(): Health} health Returns the health of the component.
 */

/**
 * A named {@link HealthIndicator}.
 *
 * @typedef {object} NamedContributor
 * @property {string} name The name of the contributor.
 * @property {HealthIndicator} contributor The contributor.
 */

/**
 * A registry of {@link HealthIndicator} instances.
 */
class HealthContributorRegistry {
  static #instance = new HealthContributorRegistry();

  /**
   * Returns the default registry.
   *
   * @return {HealthContributorRegistry} The default registry.
   */
  static getDefault() {
    return HealthContributorRegistry.#instance;
  }

  #contributors;

  /**
   * Creates a new registry.
   *
   * @param {Map<string, HealthIndicator>} [contributors] The initial
   *   contributors.
   */
  constructor(contributors) {
    this.#contributors = contributors ?? new Map();
  }

  /**
   * Registers a contributor.
   *
   * @param {string} name The name of the contributor.
   * @param {HealthIndicator} contributor The contributor.
   */
  registerContributor(name, contributor) {
    this.#contributors.set(name, contributor);
  }

  /**
   * Unregisters a contributor.
   *
   * @param {string} name The name of the contributor.
   */
  unregisterContributor(name) {
    this.#contributors.delete(name);
  }

  /**
   * Returns a contributor by name.
   *
   * @param {string} name The name of the contributor.
   * @return {HealthIndicator} The contributorm or `undefined` if not found.
   */
  getContributor(name) {
    return this.#contributors.get(name);
  }

  /**
   * Returns an iterator over the named contributors.
   *
   * @return {IterableIterator<NamedContributor>} The iterator.
   */
  *[Symbol.iterator]() {
    for (const [name, contributor] of this.#contributors) {
      yield { name, contributor };
    }
  }
}

/**
 * Strategy interface used to aggregate multiple {@link Status} instances into a
 * single one.
 */
class StatusAggregator {
  /**
   * Returns the default status aggregator.
   *
   * @return {StatusAggregator} The default status aggregator.
   */
  static getDefault() {
    return SimpleStatusAggregator.INSTANCE;
  }

  /**
   * Returns the aggregate status of the given statuses.
   *
   * @param {Status[]} statuses The statuses to aggregate.
   * @return {Status} The aggregate status.
   * @abstract
   */
  getAggregateStatus(_statuses) {
    throw new Error('Method not implemented.');
  }
}

/**
 * A simple {@link StatusAggregator} that uses a predefined order to determine
 * the aggregate status.
 *
 * @extends StatusAggregator
 */
class SimpleStatusAggregator extends StatusAggregator {
  static #DEFAULT_ORDER = [
    Status.DOWN,
    Status.OUT_OF_SERVICE,
    Status.UP,
    Status.UNKNOWN,
  ];

  static INSTANCE = new SimpleStatusAggregator();

  #order;

  /**
   * Creates a new aggregator.
   *
   * @param {Status[]} order The order of the statuses.
   */
  constructor(order = SimpleStatusAggregator.#DEFAULT_ORDER) {
    super();
    this.#order = order;
  }

  /** @override */
  getAggregateStatus(statuses) {
    if (statuses.length === 0) {
      return Status.UNKNOWN;
    }

    statuses.sort((a, b) => this.#order.indexOf(a) - this.#order.indexOf(b));
    return statuses[0];
  }
}

/**
 * Strategy interface used to map {@link Status} instances to HTTP status codes.
 */
class HttpCodeStatusMapper {
  /**
   * Returns the default HTTP code status mapper.
   *
   * @return {HttpCodeStatusMapper} The default HTTP code status mapper.
   */
  static getDefault() {
    return SimpleHttpCodeStatusMapper.INSTANCE;
  }

  /**
   * Returns the HTTP status code for the given status.
   *
   * @param {Status} status The status.
   * @return {number} The HTTP status code.
   * @abstract
   */
  getStatusCode(_status) {
    throw new Error('Method not implemented.');
  }
}

/**
 * A simple {@link HttpCodeStatusMapper} that uses a predefined mapping to
 * determine the HTTP status code.
 *
 * @extends HttpCodeStatusMapper
 */
class SimpleHttpCodeStatusMapper extends HttpCodeStatusMapper {
  static #DEFAULT_MAPPING = new Map([
    [Status.DOWN, 503],
    [Status.OUT_OF_SERVICE, 503],
  ]);

  static INSTANCE = new SimpleHttpCodeStatusMapper();

  #mappings;

  constructor(mappings = SimpleHttpCodeStatusMapper.#DEFAULT_MAPPING) {
    super();
    this.#mappings = mappings;
  }

  /** @override */
  getStatusCode(/** @type {Status} */ status) {
    return this.#mappings.get(status) ?? 200;
  }
}

/**
 * A logical grouping of health contributors that can be exposed by the
 * {@link HealthEndpoint}.
 *
 * @typedef {object} HealthEndpointGroup
 * @property {StatusAggregator} statusAggregator The status aggregator.
 * @property {HttpCodeStatusMapper} httpCodeStatusMapper The HTTP code status
 *   mapper.
 */

/**
 * A collection of groups for use with a health endpoint.
 *
 * @typedef {object} HealthEndpointGroups
 * @property {HealthEndpointGroup} primary The primary group.
 */

/**
 * Returned by an operation to provide addtional, web-specific information such
 * as the HTTP status code.
 *
 * @typedef {object} EndpointResponse
 * @property {number} status The HTTP status code.
 * @property {Health | CompositeHealth} body The response body.
 */

/**
 * A health endpoint that provides information about the health of the
 * application.
 */
class HealthEndpoint {
  static ID = 'health';

  static #INSTANCE = new HealthEndpoint(
    HealthContributorRegistry.getDefault(),
    {
      primary: {
        statusAggregator: StatusAggregator.getDefault(),
        httpCodeStatusMapper: HttpCodeStatusMapper.getDefault(),
      },
    },
  );

  /**
   * Returns the default health endpoint.
   *
   * @return {HealthEndpoint} The default health endpoint.
   */
  static getDefault() {
    return HealthEndpoint.#INSTANCE;
  }

  #registry;
  #groups;

  /**
   * Creates a new health endpoint.
   *
   * @param {HealthContributorRegistry} registry The health contributor
   *   registry.
   * @param {HealthEndpointGroups} groups The health groups.
   */
  constructor(/** @type {HealthContributorRegistry} */ registry, groups) {
    assertNotNull(registry, 'Registry must not be null.');
    assertNotNull(groups, 'Groups must not be null.');
    this.#registry = registry;
    this.#groups = groups;
  }

  /**
   * Returns the health of the application.
   *
   * @return {EndpointResponse} The health response.
   */
  health() {
    const result = this.#getHealth();
    const health = result.health;
    const status = result.group.httpCodeStatusMapper.getStatusCode(
      health.status,
    );
    return { status, body: health };
  }

  #getHealth() {
    const statuses = [];
    const components = {};
    for (const { name, contributor } of this.#registry) {
      components[name] = contributor.health();
      statuses.push(components[name].status);
    }

    let health;
    if (statuses.length > 0) {
      const status = this.#groups.primary.statusAggregator.getAggregateStatus(
        statuses,
      );
      health = new CompositeHealth(status, components);
    } else {
      health = Health.up();
    }
    return { health, group: this.#groups.primary };
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Tracks output events.
 *
 * This is one of the nullability patterns from James Shore's article on
 * [testing without mocks](https://www.jamesshore.com/v2/projects/nullables/testing-without-mocks#output-tracking).
 *
 * Example implementation of an event store:
 *
 * ```javascript
 * async record(event) {
 *   // ...
 *   this.dispatchEvent(new CustomEvent(EVENT_RECORDED_EVENT, { detail: event }));
 * }
 *
 * trackEventsRecorded() {
 *   return new OutputTracker(this, EVENT_RECORDED_EVENT);
 * }
 * ```
 *
 * Example usage:
 *
 * ```javascript
 * const eventsRecorded = eventStore.trackEventsRecorded();
 * // ...
 * const data = eventsRecorded.data(); // [event1, event2, ...]
 * ```
 */
class OutputTracker {
  /**
   * Creates a tracker for a specific event of an event target.
   *
   * @param {EventTarget} eventTarget The event target to track.
   * @param {string} event The event name to track.
   */
  static create(eventTarget, event) {
    return new OutputTracker(eventTarget, event);
  }

  #eventTarget;
  #event;
  #tracker;
  #data = [];

  /**
   * Creates a tracker for a specific event of an event target.
   *
   * @param {EventTarget} eventTarget The event target to track.
   * @param {string} event The event name to track.
   */
  constructor(
    /** @type {EventTarget} */ eventTarget,
    /** @type {string} */ event,
  ) {
    this.#eventTarget = eventTarget;
    this.#event = event;
    this.#tracker = (event) => this.#data.push(event.detail);

    this.#eventTarget.addEventListener(this.#event, this.#tracker);
  }

  /**
   * Returns the tracked data.
   *
   * @return {Array} The tracked data.
   */
  get data() {
    return this.#data;
  }

  /**
   * Clears the tracked data and returns the cleared data.
   *
   * @return {Array} The cleared data.
   */
  clear() {
    const result = [...this.#data];
    this.#data.length = 0;
    return result;
  }

  /**
   * Stops tracking.
   */
  stop() {
    this.#eventTarget.removeEventListener(this.#event, this.#tracker);
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


const MESSAGE_LOGGED_EVENT = 'message-logged';

/**
 * Define a set of standard logging levels that can be used to control logging
 * output.
 */
class Level {
  static #levels = [];

  /**
   * `OFF` is a special level that can be used to turn off logging.
   *
   * @type {Level}
   */
  static OFF = new Level('OFF', Number.MAX_SAFE_INTEGER);

  /**
   * `ERROR` is a message level indicating a serious failure.
   *
   * @type {Level}
   */
  static ERROR = new Level('ERROR', 1000);

  /**
   * `WARNING` is a message level indicating a potential problem.
   *
   * @type {Level}
   */
  static WARNING = new Level('WARNING', 900);

  /**
   * `INFO` is a message level for informational messages.
   *
   * @type {Level}
   */
  static INFO = new Level('INFO', 800);

  /**
   * `DEBUG` is a message level providing tracing information.
   *
   * @type {Level}
   */
  static DEBUG = new Level('DEBUG', 700);

  /**
   * `TRACE` is a message level providing fine-grained tracing information.
   *
   * @type {Level}
   */
  static TRACE = new Level('TRACE', 600);

  /**
   * `ALL` indicates that all messages should be logged.
   *
   * @type {Level}
   */
  static ALL = new Level('ALL', Number.MIN_SAFE_INTEGER);

  /**
   * Parses a level string or number into a Level.
   *
   * For example:
   * - "ERROR"
   * - "1000"
   *
   * @param {string|number} name The name or value of the level.
   * @return The parsed value.
   */
  static parse(name) {
    const level = Level.#levels.find(
      (level) => level.name === String(name) || level.value === Number(name),
    );
    if (level == null) {
      throw new Error(`Bad log level "${name}".`);
    }

    return level;
  }

  /**
   * The name of the level.
   *
   * @type {string}
   */
  name;

  /**
   * The value of the level.
   *
   * @type {number}
   */
  value;

  /**
   * Initializes a new level and registers it.
   *
   * @param {string} name The name of the level.
   * @param {number} value The value of the level.
   */
  constructor(name, value) {
    this.name = name;
    this.value = value;
    Level.#levels.push(this);
  }

  /**
   * Returns a string representation of the level.
   *
   * @return {string} The name of the level.
   */
  toString() {
    return this.name;
  }

  /**
   * Returns the value of the level.
   *
   * @return {number} The value of the level.
   */
  valueOf() {
    return this.value;
  }

  /**
   * Returns the name of the level.
   *
   * @return {string} The name of the level.
   */
  toJSON() {
    return this.name;
  }
}

/**
 * A `Logger` object is used to log messages for a specific system or
 * application component.
 */
class Logger extends EventTarget {
  /**
   * Finds or creates a logger with the given name.
   *
   * @param {string} name The name of the logger.
   * @return {Logger} The logger.
   */
  static getLogger(name) {
    const manager = LogManager.getLogManager();
    return manager.demandLogger(name);
  }

  /**
   * Creates a new logger without any handlers.
   *
   * @param {Object} options The options for the logger.
   * @param {Level} options.level The level of the logger.
   * @return {Logger} The logger.
   */
  static getAnonymousLogger() {
    const manager = LogManager.getLogManager();
    const logger = new Logger(null);
    logger.parent = manager.getLogger('');
    return logger;
  }

  /**
   * The parent logger.
   *
   * The root logger has not a parent.
   *
   * @type {?Logger}
   */
  parent;

  /**
   * The level of the logger.
   *
   * If the level is not set, it will use the level of the parent logger.
   *
   * @type {?Level}
   */
  level;

  /**
   * @type {Handler[]}
   */
  #handlers = [];

  #name;

  /**
   * Initializes a new logger with the given name.
   *
   * @param {string} name The name of the logger.
   * @private
   */
  constructor(name) {
    super();
    this.#name = name;
  }

  /**
   * The name of the logger.
   *
   * @type {string}
   */
  get name() {
    return this.#name;
  }

  /**
   * Logs a message with the `ERROR` level.
   *
   * @param  {...*} message The message to log.
   */
  error(...message) {
    this.log(Level.ERROR, ...message);
  }

  /**
   * Logs a message with the `WARNING` level.
   *
   * @param  {...*} message The message to log.
   */
  warning(...message) {
    this.log(Level.WARNING, ...message);
  }

  /**
   * Logs a message with the `INFO` level.
   *
   * @param  {...*} message The message to log.
   */
  info(...message) {
    this.log(Level.INFO, ...message);
  }

  /**
   * Logs a message with the `DEBUG` level.
   *
   * @param  {...*} message The message to log.
   */
  debug(...message) {
    this.log(Level.DEBUG, ...message);
  }

  /**
   * Logs a message with the `TRACE` level.
   *
   * @param  {...*} message The message to log.
   */

  trace(...message) {
    this.log(Level.TRACE, ...message);
  }
  /**
   * Logs a message.
   *
   * @param {Level} level The level of the message.
   * @param  {...*} message The message to log.
   */
  log(level, ...message) {
    if (!this.isLoggable(level)) {
      return;
    }

    const record = new LogRecord(level, ...message);
    record.loggerName = this.name;
    this.#handlers.forEach((handler) => handler.publish(record));
    let logger = this.parent;
    while (logger != null) {
      logger.#handlers.forEach((handler) => handler.publish(record));
      logger = logger.parent;
    }
    this.dispatchEvent(
      new CustomEvent(MESSAGE_LOGGED_EVENT, { detail: record }),
    );
  }

  /**
   * Returns an output tracker for messages logged by this logger.
   *
   * @return {OutputTracker} The output tracker.
   */
  trackMessagesLogged() {
    return new OutputTracker(this, MESSAGE_LOGGED_EVENT);
  }

  /**
   * Checks if a message of the given level would actually be logged by this
   * logger.
   *
   * @param {Level} level The level to check.
   * @return {boolean} `true` if the message would be logged.
   */
  isLoggable(level) {
    return this.level != null
      ? level >= this.level
      : this.parent.isLoggable(level);
  }

  /**
   * Adds a log handler to receive logging messages.
   *
   * @param {Handler} handler The handler to add.
   */
  addHandler(handler) {
    this.#handlers.push(handler);
  }

  /**
   * Removes a log handler.
   *
   * @param {Handler} handler The handler to remove.
   */
  removeHandler(handler) {
    this.#handlers = this.#handlers.filter((h) => h !== handler);
  }

  /**
   * Returns the handlers of the logger.
   *
   * @return {Handler[]} The handlers of the logger.
   */
  getHandlers() {
    return Array.from(this.#handlers);
  }
}

/**
 * A `LogRecord` object is used to pass logging requests between the logging
 * framework and individual log handlers.
 */
class LogRecord {
  static #globalSequenceNumber = 1;

  /**
   * The timestamp when the log record was created.
   *
   * @type {Date}
   */
  date;

  /**
   * The sequence number of the log record.
   *
   * @type {number}
   */
  sequenceNumber;

  /**
   * The log level.
   *
   * @type {Level}
   */
  level;

  /**
   * The log message.
   *
   * @type {Array}
   */
  message;

  /**
   * The name of the logger.
   *
   * @type {string|undefined}
   */
  loggerName;

  /**
   * Initializes a new log record.
   *
   * @param {Level} level The level of the log record.
   * @param  {...*} message The message to log.
   */
  constructor(level, ...message) {
    this.date = new Date();
    this.sequenceNumber = LogRecord.#globalSequenceNumber++;
    this.level = level;
    this.message = message;
  }

  /**
   * Returns the timestamp of the log record in milliseconds.
   *
   * @type {number}
   * @readonly
   */
  get millis() {
    return this.date.getTime();
  }
}

/**
 * A `Handler` object takes log messages from a Logger and exports them.
 */
class Handler {
  /**
   * The log level which messages will be logged by this `Handler`.
   *
   * @type {Level}
   */
  level = Level.ALL;

  /**
   * The formatter used to format log records.
   *
   * @type {Formatter}
   */
  formatter;

  /**
   * Publishes a `LogRecord`.
   *
   * @param {LogRecord} record The log record to publish.
   * @abstract
   */
  async publish() {
    await Promise.reject('Not implemented');
  }

  /**
   * Checks if this handler would actually log a given `LogRecord`.
   *
   * @param {Level} level The level to check.
   * @return {boolean} `true` if the message would be logged.
   */
  isLoggable(level) {
    return level >= this.level;
  }
}

/**
 * A `Handler` that writes log messages to the console.
 *
 * @extends Handler
 */
class ConsoleHandler extends Handler {
  /** @override */
  async publish(/** @type {LogRecord} */ record) {
    if (!this.isLoggable(record.level)) {
      return;
    }

    const message = this.formatter.format(record);
    switch (record.level) {
      case Level.ERROR:
        console.error(message);
        break;
      case Level.WARNING:
        console.warn(message);
        break;
      case Level.INFO:
        console.info(message);
        break;
      case Level.DEBUG:
        console.debug(message);
        break;
      case Level.TRACE:
        console.trace(message);
        break;
    }

    await Promise.resolve();
  }
}

/**
 * A `Formatter` provides support for formatting log records.
 */
class Formatter {
  /**
   * Formats the given log record and return the formatted string.
   *
   * @param {LogRecord} record The log record to format.
   * @return {string} The formatted log record.
   * @abstract
   */
  format() {
    throw new Error('Not implemented');
  }
}

/**
 * Print a brief summary of the `LogRecord` in a human readable format.
 *
 * @implements {Formatter}
 */
class SimpleFormatter extends Formatter {
  /** @override  */
  format(/** @type {LogRecord} */ record) {
    let s = record.date.toISOString();
    if (record.loggerName) {
      s += ' [' + record.loggerName + ']';
    }
    s += ' ' + record.level.toString();
    s += ' - ' +
      record.message
        .map((m) => (typeof m === 'object' ? JSON.stringify(m) : m))
        .join(' ');
    return s;
  }
}

/**
 * Format a `LogRecord` into a JSON object.
 *
 * The JSON object has the following properties:
 * - `date`: string
 * - `millis`: number
 * - `sequence`: number
 * - `logger`: string (optional)
 * - `level`: string
 * - `message`: string
 *
 * @implements {Formatter}
 */
class JsonFormatter extends Formatter {
  /** @override  */
  format(/** @type {LogRecord} */ record) {
    const data = {
      date: record.date.toISOString(),
      millis: record.millis,
      sequence: record.sequenceNumber,
      logger: record.loggerName,
      level: record.level.toString(),
      message: record.message
        .map((m) => (typeof m === 'object' ? JSON.stringify(m) : m))
        .join(' '),
    };
    return JSON.stringify(data);
  }
}

class LogManager {
  /** @type {LogManager} */ static #logManager;

  /** @type {Map<string, Logger>} */ #namedLoggers = new Map();
  /** @type {Logger} */ #rootLogger;

  static getLogManager() {
    if (!LogManager.#logManager) {
      LogManager.#logManager = new LogManager();
    }

    return LogManager.#logManager;
  }

  constructor() {
    this.#rootLogger = this.#createRootLogger();
  }

  demandLogger(/** @type {string} */ name) {
    let logger = this.getLogger(name);
    if (logger == null) {
      logger = this.#createLogger(name);
    }
    return logger;
  }

  addLogger(/** @type {Logger} */ logger) {
    this.#namedLoggers.set(logger.name, logger);
  }

  getLogger(/** @type {string} */ name) {
    return this.#namedLoggers.get(name);
  }

  #createRootLogger() {
    const logger = new Logger('');
    logger.level = Level.INFO;
    const handler = new ConsoleHandler();
    handler.formatter = new SimpleFormatter();
    logger.addHandler(handler);
    this.addLogger(logger);
    return logger;
  }

  #createLogger(/** @type {string} */ name) {
    const logger = new Logger(name);
    logger.parent = this.#rootLogger;
    this.addLogger(logger);
    return logger;
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * @import { LongPollingClient } from './long-polling-client.js'
 * @import { SseClient } from './sse-client.js'
 * @import { WebSocketClient } from './web-socket-client.js'
 */

/**
 * An interface for a streaming message client.
 *
 * Emits the following events:
 *
 * - open, {@link Event}
 * - message, {@link MessageEvent}
 * - error, {@link Event}
 *
 * It is used for wrappers around {@link EventSource} and {@link WebSocket},
 * also for long polling.
 *
 * @interface
 * @see SseClient
 * @see WebSocketClient
 * @see LongPollingClient
 */
class MessageClient extends EventTarget {
  /**
   * Returns whether the client is connected.
   *
   * @type {boolean}
   * @readonly
   */
  get isConnected() {
    throw new Error('Not implemented.');
  }

  /**
   * Returns the server URL.
   *
   * @type {string}
   * @readonly
   */
  get url() {
    throw new Error('Not implemented.');
  }

  /**
   * Connects to the server.
   *
   * @param {URL | string} url The server URL to connect to.
   */
  async connect(_url) {
    await Promise.reject('Not implemented.');
  }

  /**
   * Sends a message to the server.
   *
   * This is an optional method for streams with bidirectional communication.
   *
   * @param {string} message The message to send.
   * @param {string} type The optional message type.
   */
  async send(_message, _type) {
    await Promise.reject('Not implemented.');
  }

  /**
   * Closes the connection.
   */
  async close() {
    await Promise.reject('Not implemented.');
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


const REQUEST_SENT_EVENT = 'request-sent';

/**
 * A client handling long polling a HTTP request.
 *
 * @implements {MessageClient}
 */
class LongPollingClient extends MessageClient {
  /**
   * Creates a long polling client.
   *
   * @param {object} options
   * @param {number} [options.wait=90000] The wait interval for a response.
   * @param {number} [options.retry=1000] The retry interval after an error.
   * @return {LongPollingClient} A new long polling client.
   */
  static create({ wait = 90000, retry = 1000 } = {}) {
    return new LongPollingClient(
      wait,
      retry,
      globalThis.fetch.bind(globalThis),
    );
  }

  /**
   * Creates a nulled long polling client.
   *
   * @param {object} options
   * @return {LongPollingClient} A new nulled long polling client.
   */
  static createNull(
    {
      fetchResponse = {
        status: 304,
        statusText: 'Not Modified',
        headers: undefined,
        body: null,
      },
    } = {},
  ) {
    return new LongPollingClient(90000, 0, createFetchStub(fetchResponse));
  }

  #wait;
  #retry;
  #fetch;
  #connected;
  #aboutController;
  #url;
  #tag;

  /**
   * The constructor is for internal use. Use the factory methods instead.
   *
   * @see LongPollingClient.create
   * @see LongPollingClient.createNull
   */
  constructor(
    /** @type {number} */ wait,
    /** @type {number} */ retry,
    /** @type {fetch} */ fetchFunc,
  ) {
    super();
    this.#wait = wait;
    this.#retry = retry;
    this.#fetch = fetchFunc;
    this.#connected = false;
    this.#aboutController = new AbortController();
  }

  get isConnected() {
    return this.#connected;
  }

  get url() {
    return this.#url;
  }

  async connect(url) {
    if (this.isConnected) {
      throw new Error('Already connected.');
    }

    this.#url = url;
    this.#startPolling();
    this.dispatchEvent(new Event('open'));
    await Promise.resolve();
  }

  /**
   * Returns a tracker for requests sent.
   *
   * @return {OutputTracker} A new output tracker.
   */
  trackRequestSent() {
    return OutputTracker.create(this, REQUEST_SENT_EVENT);
  }

  async close() {
    this.#aboutController.abort();
    this.#connected = false;
    await Promise.resolve();
  }

  async #startPolling() {
    this.#connected = true;
    while (this.isConnected) {
      try {
        const headers = { Prefer: `wait=${this.#wait / 1000}` };
        if (this.#tag) {
          headers['If-None-Match'] = this.#tag;
        }
        this.dispatchEvent(
          new CustomEvent(REQUEST_SENT_EVENT, { detail: { headers } }),
        );
        const response = await this.#fetch(this.#url, {
          headers,
          signal: this.#aboutController.signal,
        });
        await this.#handleResponse(response);
      } catch (error) {
        if (error.name === 'AbortError') {
          break;
        } else {
          this.#handleError(error);
        }
      }
    }
  }

  async #handleResponse(/** @type {Response} */ response) {
    if (response.status === 304) {
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    this.#tag = response.headers.get('ETag');
    const message = await response.text();
    this.dispatchEvent(new MessageEvent('message', { data: message }));
  }

  #handleError(error) {
    console.error(error);
    this.dispatchEvent(new Event('error'));
  }
}

function createFetchStub(response) {
  const responses = ConfigurableResponses.create(response);
  return async (_url, options) => {
    await sleep(0);
    return new Promise((resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject());
      const res = responses.next();
      resolve(
        new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        }),
      );
    });
  };
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


// TODO Create gauges (can increment and decrement)
// TODO Create timers (total time, average time and count)
// TODO Publish metrics to a server via HTTP
// TODO Provide metrics for Prometheus

class MeterRegistry {
  static create() {
    return new MeterRegistry();
  }

  #meters = [];

  get meters() {
    return this.#meters;
  }

  counter(name, tags) {
    const id = MeterId.create({ name, tags, type: MeterType.COUNTER });
    /** @type {Counter} */ let meter = this.#meters.find((meter) =>
      meter.id.equals(id)
    );
    if (!meter) {
      meter = new Counter(id);
      this.#meters.push(meter);
    }

    // TODO validate found meter is a counter
    return meter;
  }
}

class Meter {
  #id;

  constructor(/** @type {MeterId} */ id) {
    // TODO validate parameters are not null
    this.#id = id;
  }

  get id() {
    return this.#id;
  }
}

class Counter extends Meter {
  #count = 0;

  constructor(/** @type {MeterId} */ id) {
    super(id);
    // TODO validate type is counter
  }

  count() {
    return this.#count;
  }

  increment(amount = 1) {
    this.#count += amount;
  }
}

class MeterId {
  static create({ name, tags = [], type }) {
    return new MeterId(name, tags, type);
  }

  #name;
  #tags;
  #type;

  constructor(
    /** @type {string} */ name,
    /** @type {string[]} */ tags,
    /** @type {MeterType} */ type,
  ) {
    // TODO validate parameters are not null
    this.#name = name;
    this.#tags = Array.from(tags).sort();
    this.#type = type;
  }

  get name() {
    return this.#name;
  }

  get tags() {
    return this.#tags;
  }

  get type() {
    return this.#type;
  }

  equals(other) {
    return (
      this.name === other.name &&
      this.tags.length === other.tags.length &&
      this.tags.every((tag, index) => tag === other.tags[index])
    );
  }
}

class MeterType extends Enum {
  static COUNTER = new MeterType('COUNTER', 0);
  static GAUGE = new MeterType('GAUGE', 1);
  static TIMER = new MeterType('TIMER', 2);
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * A central place to register and resolve services.
 */
class ServiceLocator {
  static #instance = new ServiceLocator();

  /**
   * Gets the default service locator.
   *
   * @return {ServiceLocator} The default service locator.
   */
  static getDefault() {
    return ServiceLocator.#instance;
  }

  #services = new Map();

  /**
   * Registers a service with name.
   *
   * @param {string} name The name of the service.
   * @param {object|Function} service The service object or constructor.
   */
  register(name, service) {
    this.#services.set(name, service);
  }

  /**
   * Resolves a service by name.
   *
   * @param {string} name The name of the service.
   * @return {object} The service object.
   */
  resolve(name) {
    const service = this.#services.get(name);
    if (service == null) {
      throw new Error(`Service not found: ${name}.`);
    }

    return typeof service === 'function' ? service() : service;
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


/**
 * A client for the server-sent events protocol.
 *
 * @implements {MessageClient}
 */
class SseClient extends MessageClient {
  /**
   * Creates a SSE client.
   *
   * @return {SseClient} A new SSE client.
   */
  static create() {
    return new SseClient(EventSource);
  }

  /**
   * Creates a nulled SSE client.
   *
   * @return {SseClient} A new SSE client.
   */
  static createNull() {
    return new SseClient(EventSourceStub);
  }

  #eventSourceConstructor;
  /** @type {EventSource} */ #eventSource;

  /**
   * The constructor is for internal use. Use the factory methods instead.
   *
   * @see SseClient.create
   * @see SseClient.createNull
   */
  constructor(/** @type {function(new:EventSource)} */ eventSourceConstructor) {
    super();
    this.#eventSourceConstructor = eventSourceConstructor;
  }

  get isConnected() {
    return this.#eventSource?.readyState === this.#eventSourceConstructor.OPEN;
  }

  get url() {
    return this.#eventSource?.url;
  }

  /**
   * Connects to the server.
   *
   * @param {URL | string} url The server URL to connect to.
   * @param {string} [eventName=message] The optional event type to listen to.
   */

  async connect(url, eventName = 'message') {
    await new Promise((resolve, reject) => {
      if (this.isConnected) {
        reject(new Error('Already connected.'));
        return;
      }

      try {
        this.#eventSource = new this.#eventSourceConstructor(url);
        this.#eventSource.addEventListener('open', (e) => {
          this.#handleOpen(e);
          resolve();
        });
        this.#eventSource.addEventListener(
          eventName,
          (e) => this.#handleMessage(e),
        );
        this.#eventSource.addEventListener(
          'error',
          (e) => this.#handleError(e),
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  async close() {
    await new Promise((resolve, reject) => {
      if (!this.isConnected) {
        resolve();
        return;
      }

      try {
        this.#eventSource.close();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Simulates a message event from the server.
   *
   * @param {string} message The message to receive.
   * @param {string} [eventName=message] The optional event type.
   * @param {string} [lastEventId] The optional last event ID.
   */
  simulateMessage(message, eventName = 'message', lastEventId = undefined) {
    this.#handleMessage(
      new MessageEvent(eventName, { data: message, lastEventId }),
    );
  }

  /**
   * Simulates an error event.
   */
  simulateError() {
    this.#handleError(new Event('error'));
  }

  #handleOpen(event) {
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #handleMessage(event) {
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #handleError(event) {
    this.dispatchEvent(new event.constructor(event.type, event));
  }
}

class EventSourceStub extends EventTarget {
  // The constants have to be defined here because JSDOM is missing EventSource.
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor(url) {
    super();
    this.url = url;
    setTimeout(() => {
      this.readyState = EventSourceStub.OPEN;
      this.dispatchEvent(new Event('open'));
    }, 0);
  }

  close() {
    this.readyState = EventSourceStub.CLOSED;
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * An API for time and durations.
 *
 * Portated from
 * [Java Time](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/package-summary.html).
 *
 * @module
 */

/**
 * A clock provides access to the current timestamp.
 */
class Clock {
  /**
   * Creates a clock using system clock.
   *
   * @return {Clock} A clock that uses system clock.
   */
  static system() {
    return new Clock();
  }

  /**
   * Creates a clock using a fixed date.
   *
   * @param {Date} [fixed='2024-02-21T19:16:00Z'] The fixed date of the clock.
   * @return {Clock} A clock that returns alaways a fixed date.
   * @see Clock#add
   */
  static fixed(fixedDate = new Date('2024-02-21T19:16:00Z')) {
    return new Clock(fixedDate);
  }

  #date;

  /** @hideconstructor */
  constructor(/** @type {Date} */ date) {
    this.#date = date;
  }

  /**
   * Returns the current timestamp of the clock.
   *
   * @return {Date} The current timestamp.
   */
  date() {
    return this.#date ? new Date(this.#date) : new Date();
  }

  /**
   * Returns the current timestamp of the clock in milliseconds.
   *
   * @return {number} The current timestamp in milliseconds.
   */
  millis() {
    return this.date().getTime();
  }

  /**
   * Adds a duration to the current timestamp of the clock.
   *
   * @param {Duration|string|number} offsetDuration The duration or number of
   *   millis to add.
   */
  add(offsetDuration) {
    const current = this.date();
    this.#date = new Date(
      current.getTime() + new Duration(offsetDuration).millis,
    );
  }
}

/**
 * A duration is a time-based amount of time, such as '34.5 seconds'.
 */
class Duration {
  /**
   * Creates a duration with zero value.
   *
   * @return {Duration} A zero duration.
   */
  static zero() {
    return new Duration();
  }

  /**
   * Creates a duration from a ISO 8601 string like `[-]P[dD]T[hH][mM][s[.f]S]`.
   *
   * @param {string} isoString The ISO 8601 string to parse.
   * @return {Duration} The parsed duration.
   */
  static parse(isoString) {
    const match = isoString.match(
      /^(-)?P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+\.?\d*)S)?$/,
    );
    if (match == null) {
      return new Duration(NaN);
    }

    const sign = match[1] === '-' ? -1 : 1;
    const days = Number(match[2] || 0);
    const hours = Number(match[3] || 0);
    const minutes = Number(match[4] || 0);
    const seconds = Number(match[5] || 0);
    const millis = Number(match[6] || 0);
    return new Duration(
      sign *
        (days * 86400000 +
          hours * 3600000 +
          minutes * 60000 +
          seconds * 1000 +
          millis),
    );
  }

  /**
   * Obtains a Duration representing the duration between two temporal objects.
   *
   * @param {Date|number} startInclusive  The start date or millis, inclusive.
   * @param {Date|number} endExclusive  The end date or millis, exclusive.
   * @return {Duration} The duration between the two dates.
   */
  static between(startInclusive, endExclusive) {
    return new Duration(endExclusive - startInclusive);
  }

  /**
   * The total length of the duration in milliseconds.
   *
   * @type {number}
   */
  millis;

  /**
   * Creates a duration.
   *
   * The duration is zero if no value is provided.
   *
   * @param {number|string|Duration} [value] The duration in millis, an ISO 8601
   *   string or another duration.
   */
  constructor(value) {
    if (value === null || arguments.length === 0) {
      this.millis = 0;
    } else if (typeof value === 'string') {
      this.millis = Duration.parse(value).millis;
    } else if (typeof value === 'number') {
      if (Number.isFinite(value)) {
        this.millis = Math.trunc(value);
      } else {
        this.millis = NaN;
      }
    } else if (value instanceof Duration) {
      this.millis = value.millis;
    } else {
      this.millis = NaN;
    }
  }

  /**
   * Gets the number of days in the duration.
   *
   * @type {number}
   * @readonly
   */
  get days() {
    return Math.trunc(this.millis / 86400000);
  }

  /**
   * Extracts the number of days in the duration.
   *
   * @type {number}
   * @readonly
   */
  get daysPart() {
    const value = this.millis / 86400000;
    return this.isNegative() ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Gets the number of hours in the duration.
   *
   * @type {number}
   * @readonly
   */
  get hours() {
    return Math.trunc(this.millis / 3600000);
  }

  /**
   * Extracts the number of hours in the duration.
   *
   * @type {number}
   * @readonly
   */
  get hoursPart() {
    const value = (this.millis - this.daysPart * 86400000) / 3600000;
    return this.isNegative() ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Gets the number of minutes in the duration.
   *
   * @type {number}
   * @readonly
   */
  get minutes() {
    return Math.trunc(this.millis / 60000);
  }

  /**
   * Extracts the number of minutes in the duration.
   *
   * @type {number}
   * @readonly
   */
  get minutesPart() {
    const value =
      (this.millis - this.daysPart * 86400000 - this.hoursPart * 3600000) /
      60000;
    return this.isNegative() ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Gets the number of seconds in the duration.
   *
   * @type {number}
   * @readonly
   */
  get seconds() {
    return Math.trunc(this.millis / 1000);
  }

  /**
   * Extracts the number of seconds in the duration.
   *
   * @type {number}
   * @readonly
   */
  get secondsPart() {
    const value = (this.millis -
      this.daysPart * 86400000 -
      this.hoursPart * 3600000 -
      this.minutesPart * 60000) /
      1000;
    return this.isNegative() ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Gets the number of milliseconds in the duration.
   *
   * @type {number}
   * @readonly
   */
  get millisPart() {
    const value = this.millis -
      this.daysPart * 86400000 -
      this.hoursPart * 3600000 -
      this.minutesPart * 60000 -
      this.secondsPart * 1000;
    return this.isNegative() ? Math.ceil(value) : Math.floor(value);
  }

  /**
   * Checks if the duration is zero.
   *
   * @type {boolean}
   */
  isZero() {
    return this.millis === 0;
  }

  /**
   * Checks if the duration is negative.
   *
   * @type {boolean}
   */
  isNegative() {
    return this.millis < 0;
  }

  /**
   * Checks if the duration is positive.
   *
   * @type {boolean}
   */
  isPositive() {
    return this.millis > 0;
  }

  /**
   * Returns a copy of this duration with a positive length.
   *
   * @return {Duration} The absolute value of the duration.
   */
  absolutized() {
    return new Duration(Math.abs(this.millis));
  }

  /**
   * Returns a copy of this duration with length negated.
   *
   * @return {Duration} The negated value of the duration.
   */
  negated() {
    return new Duration(-this.millis);
  }

  /**
   * Returns a copy of this duration with the specified duration added.
   *
   * @param {Duration|string|number} duration The duration to add or number of
   *   millis.
   * @return {Duration} The new duration.
   */
  plus(duration) {
    return new Duration(this.millis + new Duration(duration).millis);
  }

  /**
   * Returns a copy of this duration with the specified duration subtracted.
   *
   * @param {Duration|string|number} duration The duration to subtract or number
   *   of millis.
   * @return {Duration} The new duration.
   */
  minus(duration) {
    return new Duration(this.millis - new Duration(duration));
  }

  /**
   * Returns a copy of this duration multiplied by the scalar.
   *
   * @param {number} multiplicand The value to multiply the duration by.
   * @return {Duration} The new duration.
   */
  multipliedBy(multiplicand) {
    return new Duration(this.millis * multiplicand);
  }

  /**
   * Returns a copy of this duration divided by the specified value.
   *
   * @param {number} divisor The value to divide the duration by.
   * @return {Duration} The new duration.
   */
  dividedBy(divisor) {
    return new Duration(this.millis / divisor);
  }

  /**
   * Returns a string representation of this duration using ISO 8601, such as
   * `PT8H6M12.345S`.
   *
   * @return {string} The ISO 8601 string representation of the duration.
   */
  toISOString() {
    if (this.isZero()) {
      return 'PT0S';
    }

    const value = this.absolutized();

    let period = 'PT';
    const days = value.daysPart;
    const hours = value.hoursPart;
    if (days > 0 || hours > 0) {
      period += `${days * 24 + hours}H`;
    }
    const minutes = value.minutesPart;
    if (minutes > 0) {
      period += `${minutes}M`;
    }
    const seconds = value.secondsPart;
    const millis = value.millisPart;
    if (seconds > 0 || millis > 0) {
      period += `${seconds + millis / 1000}S`;
    }
    if (this.isNegative()) {
      period = `-${period}`;
    }
    return period;
  }

  /**
   * Returns a parsable string representation of this duration.
   *
   * @return {string} The string representation of this duration.
   */
  toJSON() {
    return this.toISOString();
  }

  /**
   * Returns a string representation of this duration, such as `08:06:12`.
   *
   * @param {object} options The options to create the string.
   * @param {string} [options.style='medium'] The style of the string (`short`,
   *   `medium`, `long`).
   * @return {string} The string representation of the duration.
   */
  toString({ style = 'medium' } = {}) {
    if (Number.isNaN(this.valueOf())) {
      return 'Invalid Duration';
    }

    const value = this.absolutized();
    const hours = String(Math.floor(value.hours)).padStart(2, '0');
    const minutes = String(value.minutesPart).padStart(2, '0');
    const seconds = String(value.secondsPart).padStart(2, '0');
    let result = `${hours}:${minutes}`;
    if (style === 'medium' || style === 'long') {
      result += `:${seconds}`;
    }
    if (style === 'long') {
      result += `.${String(value.millisPart).padStart(3, '0')}`;
    }
    if (this.isNegative()) {
      result = `-${result}`;
    }
    return result;
  }

  /**
   * Returns the value of the duration in milliseconds.
   *
   * @return {number} The value of the duration in milliseconds.
   */
  valueOf() {
    return this.millis;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'number') {
      return this.valueOf();
    } else {
      return this.toString();
    }
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


/**
 * A simple stop watch.
 */
class StopWatch {
  #clock;
  #startTime;
  #stopTime;

  /**
   * Creates a new stop watch.
   *
   * @param {Clock} [clock=Clock.system()] The clock to use for time
   *   measurement.
   */
  constructor(clock = Clock.system()) {
    this.#clock = clock;
  }

  /**
   * Starts an unnamed task.
   */
  start() {
    this.#startTime = this.#clock.millis();
  }

  /**
   * Stops the current task.
   */
  stop() {
    this.#stopTime = this.#clock.millis();
  }

  /**
   * Gets the total time in milliseconds.
   *
   * @return {number} The total time in milliseconds.
   */
  getTotalTimeMillis() {
    return this.#stopTime - this.#startTime;
  }

  /**
   * Gets the total time in seconds.
   *
   * @return {number} The total time in seconds.
   */
  getTotalTimeSeconds() {
    return this.getTotalTimeMillis() / 1000;
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Simple global state management with store and reducer.
 *
 * This implementation is compatible with [Redux](https://redux.js.org). It is
 * intended to replace it with Redux if necessary, for example if the
 * application grows.
 *
 * @module
 */

/**
 * A reducer is a function that changes the state of the application based on an
 * action.
 *
 * @callback ReducerType
 * @param {StateType} state The current state of the application.
 * @param {ActionType} action The action to handle.
 * @return {StateType} The next state of the application or the initial state
 *   if the state parameter is `undefined`.
 */

/**
 * The application state can be any object.
 *
 * @typedef {object} StateType
 */

/**
 * An action describe an command or an event that changes the state of the
 * application.
 *
 * An action can have any properties, but it should have a `type` property.
 *
 * @typedef {object} ActionType
 * @property {string} type A string that identifies the action.
 */

/**
 * A listener is a function that is called when the state of the store changes.
 *
 * @callback ListenerType
 */

/**
 * An unsubscriber is a function that removes a listener from the store.
 *
 * @callback UnsubscriberType
 */

/**
 * Creates a new store with the given reducer and optional preloaded state.
 *
 * @param {ReducerType} reducer The reducer function.
 * @param {StateType} [preloadedState] The optional initial state of the store.
 * @return {Store} The new store.
 */
function createStore(reducer, preloadedState) {
  const initialState = preloadedState || reducer(undefined, { type: '@@INIT' });
  return new Store(reducer, initialState);
}

/**
 * A simple store compatible with [Redux](https://redux.js.org/api/store).
 */
class Store {
  #reducer;
  #state;
  #listeners = [];

  /**
   * Creates a new store with the given reducer and initial state.
   *
   * @param {ReducerType} reducer
   * @param {StateType} initialState
   */
  constructor(reducer, initialState) {
    this.#reducer = reducer;
    this.#state = initialState;
  }

  /**
   * Returns the current state of the store.
   *
   * @return {StateType} The current state of the store.
   */
  getState() {
    return this.#state;
  }

  /**
   * Updates the state of the store by dispatching an action to the reducer.
   *
   * @param {ActionType} action The action to dispatch.
   */
  dispatch(action) {
    const oldState = this.#state;
    this.#state = this.#reducer(this.#state, action);
    if (oldState !== this.#state) {
      this.#emitChange();
    }
  }

  /**
   * Subscribes a listener to store changes.
   *
   * @param {ListenerType} listener The listener to subscribe.
   * @return {UnsubscriberType} A function that unsubscribes the listener.
   */
  subscribe(listener) {
    this.#listeners.push(listener);
    return () => this.#unsubscribe(listener);
  }

  #emitChange() {
    this.#listeners.forEach((listener) => {
      // Unsubscribe replace listeners array with a new array, so we must double
      // check if listener is still subscribed.
      if (this.#listeners.includes(listener)) {
        listener();
      }
    });
  }

  #unsubscribe(listener) {
    this.#listeners = this.#listeners.filter((l) => l !== listener);
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


// TODO check if import from time.js is needed
// TODO deep copy
// TODO deep equals

function deepMerge(source, target) {
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

/**
 * An instance of `Random` is used to generate random numbers.
 */
class Random {
  static create() {
    return new Random();
  }

  /** @hideconstructor */
  constructor() {}

  /**
   * Returns a random boolean value.
   *
   * @param {number} [probabilityOfUndefined=0.0] The probability of returning
   *   `undefined`.
   * @return {boolean|undefined} A random boolean between `origin` (inclusive)
   *   and `bound` (exclusive) or undefined.
   */
  nextBoolean(probabilityOfUndefined = 0.0) {
    return this.#randomOptional(
      () => Math.random() < 0.5,
      probabilityOfUndefined,
    );
  }

  /**
   * Returns a random integer between `origin` (inclusive) and `bound`
   * (exclusive).
   *
   * @param {number} [origin=0] The least value that can be returned.
   * @param {number} [bound=1] The upper bound (exclusive) for the returned
   *   value.
   * @param {number} [probabilityOfUndefined=0.0] The probability of returning
   *  `undefined`.
   * @return {number|undefined} A random integer between `origin` (inclusive)
   *   and `bound` (exclusive) or undefined.
   */
  nextInt(origin = 0, bound = 1, probabilityOfUndefined = 0.0) {
    return this.#randomOptional(
      () => Math.floor(this.nextFloat(origin, bound)),
      probabilityOfUndefined,
    );
  }

  /**
   * Returns a random float between `origin` (inclusive) and `bound`
   * (exclusive).
   *
   * @param {number} [origin=0.0] The least value that can be returned.
   * @param {number} [bound=1.0] The upper bound (exclusive) for the returned
   *   value.
   * @param {number} [probabilityOfUndefined=0.0] The probability of returning
   *   `undefined`.
   * @return {number|undefined} A random float between `origin` (inclusive) and
   *   `bound` (exclusive) or undefined.
   */
  nextFloat(origin = 0.0, bound = 1.0, probabilityOfUndefined = 0.0) {
    return this.#randomOptional(
      () => Math.random() * (bound - origin) + origin,
      probabilityOfUndefined,
    );
  }

  /**
   * Returns a random timestamp with optional random offset.
   *
   * @param {number} [maxMillis=0] The maximum offset in milliseconds.
   * @param {number} [probabilityOfUndefined=0.0] The probability of returning
   *   `undefined`.
   * @return {Date|undefined} A random timestamp or `undefined`.
   */
  nextDate(maxMillis = 0, probabilityOfUndefined = 0.0) {
    return this.#randomOptional(() => {
      const now = new Date();
      let t = now.getTime();
      const r = Math.random();
      t += r * maxMillis;
      return new Date(t);
    }, probabilityOfUndefined);
  }

  /**
   * Returns a random value from an array.
   *
   * @param {Array} [values=[]] The array of values.
   * @param {number} [probabilityOfUndefined=0.0] The probability of returning
   *   `undefined`.
   * @return {*|undefined} A random value from the array or `undefined`.
   */
  nextValue(values = [], probabilityOfUndefined = 0.0) {
    return this.#randomOptional(() => {
      const index = new Random().nextInt(0, values.length - 1);
      return values[index];
    }, probabilityOfUndefined);
  }

  #randomOptional(randomFactory, probabilityOfUndefined) {
    const r = Math.random();
    return r < probabilityOfUndefined ? undefined : randomFactory();
  }
}

const TASK_CREATED = 'created';
const TASK_SCHEDULED = 'scheduled';
const TASK_EXECUTED = 'executed';
const TASK_CANCELLED = 'cancelled';

/**
 * A task that can be scheduled by a {@link Timer}.
 */
class TimerTask {
  _state = TASK_CREATED;
  _nextExecutionTime = 0;
  _period = 0;

  /**
   * Runs the task.
   *
   * @abstract
   */
  run() {
    throw new Error('Method not implemented.');
  }

  /**
   * Cancels the task.
   *
   * @return {boolean} `true` if this task was scheduled for one-time execution
   *   and has not yet run, or this task was scheduled for repeated execution.
   *   Return `false` if the task was scheduled for one-time execution and has
   *   already run, or if the task was never scheduled, or if the task was
   *   already cancelled.
   */
  cancel() {
    const result = this._state === TASK_SCHEDULED;
    this._state = TASK_CANCELLED;
    return result;
  }

  /**
   * Returns scheduled execution time of the most recent actual execution of
   * this task.
   *
   * Example usage:
   *
   * ```javascript
   * run() {
   *   if (Date.now() - scheduledExecutionTime() >= MAX_TARDINESS) {
   *     return; // Too late; skip this execution.
   *   }
   *   // Perform the task
   * }
   *
   * ```
   *
   * @return {number} The time in milliseconds since the epoch, undefined if
   *   the task has not yet run for the first time.
   */
  scheduledExecutionTime() {
    return this._period < 0
      ? this._nextExecutionTime + this._period
      : this._nextExecutionTime - this._period;
  }
}

/**
 * A timer that schedules and cancels tasks.
 *
 * Tasks may be scheduled for one-time execution or for repeated execution at
 * regular intervals.
 */
class Timer extends EventTarget {
  /**
   * Returns a new `Timer`.
   */
  static create() {
    return new Timer(Clock.system(), globalThis);
  }

  /**
   * Returns a new `Timer` for testing without side effects.
   */
  static createNull({ clock = Clock.fixed() } = {}) {
    return new Timer(clock, new TimeoutStub(clock));
  }

  #clock;
  #global;
  _queue;

  /**
   * Returns a new `Timer`.
   */
  constructor(
    /** @type {Clock} */ clock = Clock.system(),
    /** @type {globalThis} */ global = globalThis,
  ) {
    super();
    this.#clock = clock;
    this.#global = global;
    this._queue = [];
  }

  /**
   * Schedules a task for repeated execution at regular intervals.
   *
   * @param {TimerTask} task The task to execute.
   * @param {number|Date} delayOrTime The delay before the first execution, in
   *   milliseconds or the time of the first execution.
   * @param {number} [period=0] The interval between executions, in
   *   milliseconds; 0 means single execution.
   */
  schedule(task, delayOrTime, period = 0) {
    this.#doSchedule(task, delayOrTime, -period);
  }

  /**
   * Schedule a task for repeated fixed-rate execution.
   *
   * @param {TimerTask} task The task to execute.
   * @param {number|Date} delayOrTime The delay before the first execution, in
   *   milliseconds or the time of the first.
   * @param {number} period The interval between executions, in milliseconds.
   */
  scheduleAtFixedRate(task, delayOrTime, period) {
    this.#doSchedule(task, delayOrTime, period);
  }

  /**
   * Cancels all scheduled tasks.
   */
  cancel() {
    for (const task of this._queue) {
      task.cancel();
    }
    this._queue = [];
  }

  /**
   * Removes all cancelled tasks from the task queue.
   *
   * @return {number} The number of tasks removed from the task queue.
   */
  purge() {
    let result = 0;
    for (let i = 0; i < this._queue.length; i++) {
      if (this._queue[i]._state === TASK_CANCELLED) {
        this._queue.splice(i, 1);
        i--;
        result++;
      }
    }
    return result;
  }

  /**
   * Simulates the execution of a task.
   *
   * @param {object} options The simulation options.
   * @param {number} [options.ticks=1000] The number of milliseconds to advance
   *   the clock.
   */
  simulateTaskExecution({ ticks = 1000 } = {}) {
    this.#clock.add(ticks);
    this.#runMainLoop();
  }

  #doSchedule(task, delayOrTime, period) {
    if (delayOrTime instanceof Date) {
      task._nextExecutionTime = delayOrTime.getTime();
    } else {
      task._nextExecutionTime = this.#clock.millis() + delayOrTime;
    }
    task._period = period;
    task._state = TASK_SCHEDULED;
    this._queue.push(task);
    this._queue.sort((a, b) => b._nextExecutionTime - a._nextExecutionTime);
    if (this._queue[0] === task) {
      this.#runMainLoop();
    }
  }

  #runMainLoop() {
    if (this._queue.length === 0) {
      return;
    }

    /** @type {TimerTask} */ const task = this._queue[0];
    if (task._state === TASK_CANCELLED) {
      this._queue.shift();
      return this.#runMainLoop();
    }

    const now = this.#clock.millis();
    const executionTime = task._nextExecutionTime;
    const taskFired = executionTime <= now;
    if (taskFired) {
      if (task._period === 0) {
        this._queue.shift();
        task._state = TASK_EXECUTED;
      } else {
        task._nextExecutionTime = task._period < 0
          ? now - task._period
          : executionTime + task._period;
      }
      task.run();
    } else {
      this.#global.setTimeout(() => this.#runMainLoop(), executionTime - now);
    }
  }
}

class TimeoutStub {
  setTimeout() {}
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Calculate with vectors in a two-dimensional space.
 *
 * @module
 */

/**
 * A vector in a two-dimensional space.
 */
class Vector2D {
  /**
   * Creates a vector from 2 points.
   *
   * @param {Vector2D} a The first point.
   * @param {Vector2D} b The second point.
   * @return {Vector2D} The vector from a to b.
   */
  static fromPoints(a, b) {
    return new Vector2D(b.x - a.x, b.y - a.y);
  }

  /**
   * Creates a new vector.
   *
   * Examples:
   *
   * ```java
   * new Vector2D(1, 2)
   * new Vector2D([1, 2])
   * new Vector2D({ x: 1, y: 2 })
   * ```
   *
   * @param {number|Array<number>|Vector2D} [x=0] The x coordinate or an array
   *   or another vector.
   * @param {number} [y=0] The y coordinate or undefined if x is an array or
   *   another vector.
   */
  constructor(x = 0, y = 0) {
    if (Array.isArray(x)) {
      this.x = Number(x[0]);
      this.y = Number(x[1]);
    } else if (typeof x === 'object' && 'x' in x && 'y' in x) {
      this.x = Number(x.x);
      this.y = Number(x.y);
    } else {
      this.x = Number(x);
      this.y = Number(y);
    }
  }

  /**
   * Returns the length of the vector.
   *
   * @return {number} The length of the vector.
   */
  length() {
    return Math.hypot(this.x, this.y);
  }

  /**
   * Adds another vector to this vector and return the new vector.
   *
   * @param {Vector2D} v The vector to add.
   * @return {Vector2D} The new vector.
   */
  add(v) {
    v = new Vector2D(v);
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  /**
   * Subtracts another vector from this vector and return the new vector.
   *
   * @param {Vector2D} v The vector to subtract.
   * @return {Vector2D} The new vector.
   */
  subtract(v) {
    v = new Vector2D(v);
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  /**
   * Multiplies the vector with a scalar and returns the new vector.
   *
   * @param {number} scalar The scalar to multiply with.
   * @return {Vector2D} The new vector.
   */
  scale(scalar) {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  /**
   * Multiplies the vector with another vector and returns the scalar.
   *
   * @param {Vector2D} v The vector to multiply with.
   * @return {number} The scalar.
   */
  dot(v) {
    v = new Vector2D(v);
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Returns the distance between this vector and another vector.
   *
   * @param {Vector2D} v The other vector.
   * @return {number} The distance.
   */
  distance(v) {
    v = new Vector2D(v);
    return Vector2D.fromPoints(this, v).length();
  }

  /**
   * Returns the rotated vector by the given angle in radians.
   *
   * @param {number} angle The angle in radians.
   * @return {Vector2D} The rotated vector.
   */
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2D(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
    );
  }

  /**
   * Returns the unit vector of this vector.
   *
   * @return {Vector2D} The unit vector.
   */
  normalize() {
    return this.scale(1 / this.length());
  }
}

/**
 * A line in a two-dimensional space.
 */
class Line2D {
  /**
   * Creates a line from 2 points.
   *
   * @param {Vector2D} a The first point.
   * @param {Vector2D} b The second point.
   * @return {Line2D} The line from a to b.
   */
  static fromPoints(a, b) {
    return new Line2D(a, Vector2D.fromPoints(a, b));
  }

  /**
   * Creates a new line.
   *
   * @param {Vector2D} point A point on the line.
   * @param {Vector2D} direction The direction of the line.
   */
  constructor(point, direction) {
    this.point = new Vector2D(point);
    this.direction = new Vector2D(direction);
  }

  /**
   * Returns the perpendicular of a point on this line.
   *
   * @param {Vector2D} point A point.
   * @return {{foot: number, scalar: number}} The `foot` and the `scalar`.
   */
  perpendicular(point) {
    // dissolve after r: (line.position + r * line.direction - point) * line.direction = 0
    const a = this.point.subtract(point);
    const b = a.dot(this.direction);
    const c = this.direction.dot(this.direction);
    const r = b !== 0 ? -b / c : 0;

    // solve with r: line.position + r * line.direction = foot
    const foot = this.point.add(this.direction.scale(r));

    let scalar;
    if (this.direction.x !== 0.0) {
      scalar = (foot.x - this.point.x) / this.direction.x;
    } else if (this.direction.y !== 0.0) {
      scalar = (foot.y - this.point.y) / this.direction.y;
    } else {
      scalar = Number.NaN;
    }

    return { foot, scalar };
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


const HEARTBEAT_TYPE = 'heartbeat';

const MESSAGE_SENT_EVENT = 'message-sent';

/**
 * A client for the WebSocket protocol.
 *
 * Emits the following events:
 *
 * - open, {@link Event}
 * - message, {@link MessageEvent}
 * - error, {@link Event}
 * - close, {@link CloseEvent}
 *
 * @implements {MessageClient}
 */
class WebSocketClient extends MessageClient {
  // TODO Recover connection with timeout after an error event.

  /**
   * Creates a WebSocket client.
   *
   * @param {object} options
   * @param {number} [options.heartbeat=30000] The heartbeat interval i
   *   milliseconds. A value <= 0 disables the heartbeat.
   * @return {WebSocketClient} A new WebSocket client.
   */
  static create({ heartbeat = 30000 } = {}) {
    return new WebSocketClient(heartbeat, Timer.create(), WebSocket);
  }

  /**
   * Creates a nulled WebSocket client.
   *
   * @param {object} options
   * @param {number} [options.heartbeat=-1] The heartbeat interval in
   *   milliseconds. A value <= 0 disables the heartbeat.
   * @return {WebSocketClient} A new nulled WebSocket client.
   */
  static createNull({ heartbeat = -1 } = {}) {
    return new WebSocketClient(heartbeat, Timer.createNull(), WebSocketStub);
  }

  #heartbeat;
  #timer;
  #webSocketConstructor;
  /** @type {WebSocket} */ #webSocket;

  /**
   * The constructor is for internal use. Use the factory methods instead.
   *
   * @see WebSocketClient.create
   * @see WebSocketClient.createNull
   */
  constructor(
    /** @type {number} */ heartbeat,
    /** @type {Timer} */ timer,
    /** @type {function(new:WebSocket)} */ webSocketConstructor,
  ) {
    super();
    this.#heartbeat = heartbeat;
    this.#timer = timer;
    this.#webSocketConstructor = webSocketConstructor;
  }

  get isConnected() {
    return this.#webSocket?.readyState === WebSocket.OPEN;
  }

  get url() {
    return this.#webSocket?.url;
  }

  async connect(/** @type {string | URL} */ url) {
    await new Promise((resolve, reject) => {
      if (this.isConnected) {
        reject(new Error('Already connected.'));
        return;
      }

      try {
        this.#webSocket = new this.#webSocketConstructor(url);
        this.#webSocket.addEventListener('open', (e) => {
          this.#handleOpen(e);
          resolve();
        });
        this.#webSocket.addEventListener(
          'message',
          (e) => this.#handleMessage(e),
        );
        this.#webSocket.addEventListener('close', (e) => this.#handleClose(e));
        this.#webSocket.addEventListener('error', (e) => this.#handleError(e));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sends a message to the server.
   *
   * @param {string} message The message to send.
   */
  send(message) {
    this.#webSocket.send(message);
    this.dispatchEvent(
      new CustomEvent(MESSAGE_SENT_EVENT, { detail: message }),
    );
  }

  /**
   * Returns a tracker for messages sent.
   *
   * @return {OutputTracker} A new output tracker.
   */
  trackMessageSent() {
    return OutputTracker.create(this, MESSAGE_SENT_EVENT);
  }

  /**
   * Closes the connection.
   *
   * If a code is provided, also a reason should be provided.
   *
   * @param {number} code An optional code.
   * @param {string} reason An optional reason.
   */
  async close(code, reason) {
    await new Promise((resolve) => {
      if (!this.isConnected) {
        resolve();
        return;
      }

      this.#webSocket.addEventListener('close', () => resolve());
      this.#webSocket.close(code, reason);
    });
  }

  /**
   * Simulates a message event from the server.
   *
   * @param {string} message The message to receive.
   */
  simulateMessage(message) {
    this.#handleMessage(new MessageEvent('message', { data: message }));
  }

  /**
   * Simulates a heartbeat.
   */
  simulateHeartbeat() {
    this.#timer.simulateTaskExecution({ ticks: this.#heartbeat });
  }

  /**
   * Simulates a close event.
   *
   * @param {number} code An optional code.
   * @param {string} reason An optional reason.
   */
  simulateClose(code, reason) {
    this.#handleClose(new CloseEvent('close', { code, reason }));
  }

  /**
   * Simulates an error event.
   */
  simulateError() {
    this.#handleError(new Event('error'));
  }

  #handleOpen(event) {
    this.dispatchEvent(new event.constructor(event.type, event));
    this.#startHeartbeat();
  }

  #handleMessage(event) {
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #handleClose(event) {
    this.#stopHeartbeat();
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #handleError(event) {
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #startHeartbeat() {
    if (this.#heartbeat <= 0) {
      return;
    }

    this.#timer.scheduleAtFixedRate(
      new HeartbeatTask(this),
      this.#heartbeat,
      this.#heartbeat,
    );
  }

  #stopHeartbeat() {
    this.#timer.cancel();
  }
}

class HeartbeatTask extends TimerTask {
  #client;

  constructor(/** @type {WebSocketClient} */ client) {
    super();
    this.#client = client;
  }

  run() {
    this.#client.send(HEARTBEAT_TYPE);
  }
}

class WebSocketStub extends EventTarget {
  readyState = WebSocket.CONNECTING;

  constructor(url) {
    super();
    this.url = url;
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.dispatchEvent(new Event('open'));
    }, 0);
  }

  send() {}

  close() {
    this.readyState = WebSocket.CLOSED;
    this.dispatchEvent(new Event('close'));
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * @import * as express from 'express'
 */

function runSafe(/** @type {express.RequestHandler} */ handler) {
  // TODO runSafe is obsolete with with Express 5
  return async (request, response, next) => {
    try {
      await handler(request, response);
    } catch (error) {
      next(error);
    }
  };
}

function reply(
  /** @type {express.Response} */ response,
  { status = 200, headers = { 'Content-Type': 'text/plain' }, body = '' } = {},
) {
  response.status(status).header(headers).send(body);
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


class ActuatorController {
  #services;
  #healthContributorRegistry;

  constructor(
    services, // FIXME Services is not defined in library
    /** @type {HealthContributorRegistry} */ healthContributorRegistry,
    /** @type {express.Express} */ app,
  ) {
    this.#services = services;
    this.#healthContributorRegistry = healthContributorRegistry;

    app.get('/actuator', this.#getActuator.bind(this));
    app.get('/actuator/info', this.#getActuatorInfo.bind(this));
    app.get('/actuator/metrics', this.#getActuatorMetrics.bind(this));
    app.get('/actuator/health', this.#getActuatorHealth.bind(this));
    app.get(
      '/actuator/prometheus',
      runSafe(this.#getMetrics.bind(this)),
    );
  }

  #getActuator(
    /** @type {express.Request} */ request,
    /** @type {express.Response} */ response,
  ) {
    let requestedUrl = request.protocol + '://' + request.get('host') +
      request.originalUrl;
    if (!requestedUrl.endsWith('/')) {
      requestedUrl += '/';
    }
    response.status(200).json({
      _links: {
        self: { href: requestedUrl },
        info: { href: requestedUrl + 'info' },
        metrics: { href: requestedUrl + 'metrics' },
        health: { href: requestedUrl + 'health' },
        prometheus: { href: requestedUrl + 'prometheus' },
      },
    });
  }

  #getActuatorInfo(
    /** @type {express.Request} */ _request,
    /** @type {express.Response} */ response,
  ) {
    const info = {};
    info[process.env.npm_package_name] = {
      version: process.env.npm_package_version,
    };
    response.status(200).json(info);
  }

  #getActuatorMetrics(
    /** @type {express.Request} */ _request,
    /** @type {express.Response} */ response,
  ) {
    response.status(200).json({
      cpu: process.cpuUsage(),
      mem: process.memoryUsage(),
      uptime: process.uptime(),
    });
  }

  #getActuatorHealth(
    /** @type {express.Request} */ _request,
    /** @type {express.Response} */ response,
  ) {
    const health = this.#healthContributorRegistry.health();
    const status = health.status === 'UP' ? 200 : 503;
    response.status(status).json(health);
  }

  async #getMetrics(
    /** @type {express.Request} */ _request,
    /** @type {express.Response} */ response,
  ) {
    // TODO count warnings and errors
    // TODO create class MeterRegistry

    const metrics = await this.#services.getMetrics();
    const timestamp = new Date().getTime();
    let body =
      `# TYPE talks_count gauge\ntalks_count ${metrics.talksCount} ${timestamp}\n\n`;
    body +=
      `# TYPE presenters_count gauge\npresenters_count ${metrics.presentersCount} ${timestamp}\n\n`;
    body +=
      `# TYPE comments_count gauge\ncomments_count ${metrics.commentsCount} ${timestamp}\n\n`;
    reply(response, { body });
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


// TODO How to handle optional values? Cast to which type?
// TODO Use JSON schema to validate the configuration?

/**
 * Provide the configuration of an application.
 *
 * The configuration is read from a JSON file `application.json` from the
 * working directory.
 *
 * Example:
 *
 * ```javascript
 * const configuration = ConfigurationProperties.create();
 * const config = await configuration.get();
 * ```
 *
 * With default values:
 *
 * ```javascript
 * const configuration = ConfigurationProperties.create({
 *   defaults: {
 *       port: 8080,
 *       database: { host: 'localhost', port: 5432 },
 *   },
 * });
 * const config = await configuration.get();
 * ```
 */
class ConfigurationProperties {
  /**
   * Creates an instance of the application configuration.
   *
   * @param {object} options The configuration options.
   * @param {object} [options.defaults={}] The default configuration.
   * @param {string} [options.prefix=""] The prefix of the properties to get.
   * @param {string} [options.name='application.json'] The name of the
   *   configuration file.
   * @param {string[]} [options.location=['.', 'config']] The locations where to
   *   search for the configuration file.
   * @return {ConfigurationProperties} The new instance.
   */
  static create({
    defaults = {},
    prefix = '',
    name = 'application.json',
    location = ['.', 'config'],
  } = {}) {
    return new ConfigurationProperties(
      defaults,
      prefix,
      name,
      location,
      fsPromises,
    );
  }

  /**
   * Creates a nullable of the application configuration.
   *
   * @param {object} options The configuration options.
   * @param {object} [options.defaults={}] The default configuration.
   * @param {string} [options.prefix=""] The prefix of the properties to get.
   * @param {string} [options.name='application.json'] The name of the
   *   configuration file.
   * @param {string[]} [options.location=['.', 'config']] The locations where to
   *   search for the configuration file.
   * @param {object} [options.files={}] The files and file content that are
   *   available.
   */
  static createNull({
    defaults = {},
    prefix = '',
    name = 'application.json',
    location = ['.', 'config'],
    files = {},
  } = {}) {
    return new ConfigurationProperties(
      defaults,
      prefix,
      name,
      location,
      new FsStub(files),
    );
  }

  #defaults;
  #prefix;
  #name;
  #locations;
  #fs;

  /**
   * The constructor is for internal use. Use the factory methods instead.
   *
   * @see ConfigurationProperties.create
   * @see ConfigurationProperties.createNull
   */
  constructor(
    /** @type {object} */ defaults,
    /** @type {string} */ prefix,
    /** @type {string} */ name,
    /** @type {string[]} */ locations,
    /** @type {fsPromises} */ fs,
  ) {
    this.#defaults = defaults;
    this.#prefix = prefix;
    this.#name = name;
    this.#locations = locations;
    this.#fs = fs;
  }

  /**
   * Loads the configuration from the file.
   *
   * @return {Promise<object>} The configuration object.
   */
  async get() {
    let config = await this.#loadFile();
    // FIXME copy defaults before merging
    config = deepMerge(this.#defaults, config);
    this.#applyEnvironmentVariables(config);
    // TODO apply command line arguments
    return this.#getSubset(config, this.#prefix);
  }

  async #loadFile() {
    let config = {};
    for (const location of this.#locations) {
      try {
        const filePath = path.join(location, this.#name);
        const content = await this.#fs.readFile(filePath, 'utf-8');
        config = JSON.parse(content);
        break;
      } catch (err) {
        if (err.code === 'ENOENT') {
          // ignore file not found
          continue;
        }

        throw err;
      }
    }
    return config;
  }

  #applyEnvironmentVariables(config, path) {
    // handle object
    // handle array
    // handle string
    // handle number
    // handle boolean (true, false)
    // handle null (empty env var set the value to null)
    // if env var is undefined, keep the default value
    for (const key in config) {
      if (typeof config[key] === 'boolean') {
        const value = this.#getEnv(key, path);
        if (value === null) {
          config[key] = null;
        } else if (value) {
          config[key] = value.toLowerCase() === 'true';
        }
      } else if (typeof config[key] === 'number') {
        const value = this.#getEnv(key, path);
        if (value === null) {
          config[key] = null;
        } else if (value) {
          config[key] = Number(value);
        }
      } else if (typeof config[key] === 'string') {
        const value = this.#getEnv(key, path);
        if (value === null) {
          config[key] = null;
        } else if (value) {
          config[key] = String(value);
        }
      } else if (config[key] === null) {
        const value = this.#getEnv(key, path);
        if (value === null) {
          config[key] = null;
        } else if (value) {
          config[key] = value;
        }
      } else if (typeof config[key] === 'object') {
        const value = this.#getEnv(key, path);
        if (value === null) {
          config[key] = null;
        } else if (Array.isArray(config[key]) && value) {
          config[key] = value.split(',');
        } else {
          this.#applyEnvironmentVariables(config[key], key);
        }
      } else {
        throw new Error(`Unsupported type: ${typeof config[key]}`);
      }
    }
  }

  #getEnv(key, path = '') {
    let envKey = key;
    if (path) {
      envKey = `${path}_${envKey}`;
    }
    envKey = envKey.toUpperCase();
    const value = process.env[envKey];
    if (value === '') {
      return null;
    }
    return value;
  }

  #getSubset(config, prefix) {
    if (prefix === '') {
      return config;
    }

    const [key, ...rest] = prefix.split('.');
    if (rest.length === 0) {
      return config[key];
    }

    return this.#getSubset(config[key], rest.join('.'));
  }
}

class FsStub {
  #files;

  constructor(files) {
    this.#files = files;
  }

  readFile(path) {
    const fileContent = this.#files[path];
    if (fileContent == null) {
      const err = new Error(`File not found: ${path}`);
      err.code = 'ENOENT';
      throw err;
    }

    if (typeof fileContent === 'string') {
      return fileContent;
    }

    return JSON.stringify(fileContent);
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


/**
 * A `Handler` that writes log messages to a file.
 *
 * @extends {Handler}
 */
class FileHandler extends Handler {
  #filename;
  #limit;

  /**
   * Initialize a new `FileHandler`.
   *
   * @param {string} filename The name of the file to write log messages to.
   * @param {number} [limit=0] The maximum size of the file in bytes before it
   *   is rotated.
   */
  constructor(filename, limit = 0) {
    super();
    this.#filename = filename;
    this.#limit = limit < 0 ? 0 : limit;
  }

  /** @override  */
  async publish(/** @type {LogRecord} */ record) {
    if (!this.isLoggable(record.level)) {
      return;
    }

    const message = this.formatter.format(record);
    if (this.#limit > 0) {
      try {
        const stats = await fsPromises.stat(this.#filename);
        const fileSize = stats.size;
        const newSize = fileSize + message.length;
        if (newSize > this.#limit) {
          await fsPromises.rm(this.#filename);
        }
      } catch (error) {
        // ignore error if file does not exist
        if (error.code !== 'ENOENT') {
          console.error(error);
        }
      }
    }
    await fsPromises.appendFile(this.#filename, message + '\n');
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.


class LongPolling {
  #version = 0;
  #waiting = [];
  #getData;

  constructor(/** @type {function(): Promise<*>} */ getData) {
    this.#getData = getData;
  }

  async poll(
    /** @type {express.Request} */ request,
    /** @type {express.Response} */ response,
  ) {
    if (this.#isCurrentVersion(request)) {
      const responseData = await this.#tryLongPolling(request);
      reply(response, responseData);
    } else {
      const responseData = await this.#getResponse();
      reply(response, responseData);
    }
  }

  async send() {
    this.#version++;
    const response = await this.#getResponse();
    this.#waiting.forEach((resolve) => resolve(response));
    this.#waiting = [];
  }

  #isCurrentVersion(/** @type {express.Request} */ request) {
    const tag = /"(.*)"/.exec(request.get('If-None-Match'));
    return tag && tag[1] === String(this.#version);
  }

  #tryLongPolling(/** @type {express.Request} */ request) {
    const time = this.#getPollingTime(request);
    if (time == null) {
      return { status: 304 };
    }

    return this.#waitForChange(time);
  }

  #getPollingTime(/** @type {express.Request} */ request) {
    const wait = /\bwait=(\d+)/.exec(request.get('Prefer'));
    return wait != null ? Number(wait[1]) : null;
  }

  #waitForChange(/** @type {number} */ time) {
    return new Promise((resolve) => {
      this.#waiting.push(resolve);
      setTimeout(() => {
        if (this.#waiting.includes(resolve)) {
          this.#waiting = this.#waiting.filter((r) => r !== resolve);
          resolve({ status: 304 });
        }
      }, time * 1000);
    });
  }

  async #getResponse() {
    const data = await this.#getData();
    const body = JSON.stringify(data);
    return {
      headers: {
        'Content-Type': 'application/json',
        ETag: `"${this.#version}"`,
        'Cache-Control': 'no-store',
      },
      body,
    };
  }
}

// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * @import http from 'node:http'
 */

/**
 * An object for sending
 * [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).
 */
class SseEmitter {
  /** @type {?number} */ #timeout;
  /** @type {http.ServerResponse|undefined} */ #response;

  /**
   * Creates a new SSE emitter with an optional timeout.
   *
   * @param {number} [timeout] The timeout in milliseconds after which the
   *   connection will be closed.
   */
  constructor(timeout) {
    this.#timeout = timeout;
  }

  /**
   * The timeout in milliseconds after which the connection will be closed or
   * undefined if no timeout is set.
   *
   * @type {number|undefined}
   */
  get timeout() {
    return this.#timeout;
  }

  /**
   * Sets and extends the response object for sending Server-Sent Events.
   *
   * @param {http.ServerResponse} outputMessage The response object to use.
   */
  extendResponse(outputMessage) {
    // TODO check HTTP version, is it HTTP/2 when using EventSource?
    outputMessage.statusCode = 200;
    this.#response = outputMessage
      .setHeader('Content-Type', 'text/event-stream')
      .setHeader('Cache-Control', 'no-cache')
      .setHeader('Keep-Alive', 'timeout=60')
      .setHeader('Connection', 'keep-alive');

    if (this.timeout != null) {
      const timeoutId = setTimeout(() => this.#close(), this.timeout);
      this.#response.addListener('close', () => clearTimeout(timeoutId));
    }
  }

  /**
   * Sends a SSE event.
   *
   * @param {object} event The event to send.
   * @param {string} [event.id] Add a SSE "id" line.
   * @param {string} [event.name] Add a SSE "event" line.
   * @param {number} [event.reconnectTime] Add a SSE "retry" line.
   * @param {string} [event.comment] Add a SSE "comment" line.
   * @param {string|object} [event.data] Add a SSE "data" line.
   */
  send({ id, name, reconnectTime, comment, data } = {}) {
    if (comment != null) {
      this.#response.write(`: ${comment}\n`);
    }

    if (name != null) {
      this.#response.write(`event: ${name}\n`);
    }

    if (data != null) {
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      } else {
        data = String(data).replaceAll('\n', '\ndata: ');
      }
      this.#response.write(`data: ${data}\n`);
    }

    if (id != null) {
      this.#response.write(`id: ${id}\n`);
    }

    if (reconnectTime != null) {
      this.#response.write(`retry: ${reconnectTime}\n`);
    }

    this.#response.write('\n');
  }

  /**
   * Simulates a timeout.
   */
  simulateTimeout() {
    this.#close();
  }

  #close() {
    this.#response.end();
  }
}

exports.ActuatorController = ActuatorController;
exports.Clock = Clock;
exports.Color = Color;
exports.CompositeHealth = CompositeHealth;
exports.ConfigurableResponses = ConfigurableResponses;
exports.ConfigurationProperties = ConfigurationProperties;
exports.ConsoleHandler = ConsoleHandler;
exports.Counter = Counter;
exports.Duration = Duration;
exports.Enum = Enum;
exports.FeatureToggle = FeatureToggle;
exports.FileHandler = FileHandler;
exports.Formatter = Formatter;
exports.HEARTBEAT_TYPE = HEARTBEAT_TYPE;
exports.Handler = Handler;
exports.Health = Health;
exports.HealthContributorRegistry = HealthContributorRegistry;
exports.HealthEndpoint = HealthEndpoint;
exports.HttpCodeStatusMapper = HttpCodeStatusMapper;
exports.JsonFormatter = JsonFormatter;
exports.Level = Level;
exports.Line2D = Line2D;
exports.LogRecord = LogRecord;
exports.Logger = Logger;
exports.LongPolling = LongPolling;
exports.LongPollingClient = LongPollingClient;
exports.MessageClient = MessageClient;
exports.Meter = Meter;
exports.MeterId = MeterId;
exports.MeterRegistry = MeterRegistry;
exports.MeterType = MeterType;
exports.OutputTracker = OutputTracker;
exports.Random = Random;
exports.ServiceLocator = ServiceLocator;
exports.SimpleFormatter = SimpleFormatter;
exports.SimpleHttpCodeStatusMapper = SimpleHttpCodeStatusMapper;
exports.SimpleStatusAggregator = SimpleStatusAggregator;
exports.SseClient = SseClient;
exports.SseEmitter = SseEmitter;
exports.Status = Status;
exports.StatusAggregator = StatusAggregator;
exports.StopWatch = StopWatch;
exports.Store = Store;
exports.Timer = Timer;
exports.TimerTask = TimerTask;
exports.ValidationError = ValidationError;
exports.Vector2D = Vector2D;
exports.WebSocketClient = WebSocketClient;
exports.assertNotNull = assertNotNull;
exports.createStore = createStore;
exports.deepMerge = deepMerge;
exports.ensureAnything = ensureAnything;
exports.ensureArguments = ensureArguments;
exports.ensureItemType = ensureItemType;
exports.ensureNonEmpty = ensureNonEmpty;
exports.ensureThat = ensureThat;
exports.ensureType = ensureType;
exports.ensureUnreachable = ensureUnreachable;
exports.reply = reply;
exports.runSafe = runSafe;
exports.sleep = sleep;
