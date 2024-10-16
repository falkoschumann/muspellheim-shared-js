'use strict';

var fsPromises = require('node:fs/promises');
var path = require('node:path');
var _ = require('lodash');

const FACTOR = 0.7;

class Color {
  #value;

  constructor(red, green, blue) {
    if (green === undefined && blue === undefined) {
      if (typeof red === 'string') {
        this.#value = parseInt(red, 16);
        return;
      }

      this.#value = Number(red);
      return;
    }

    this.#value =
      ((red & 0xff) << 16) | ((green & 0xff) << 8) | ((blue & 0xff) << 0);
  }

  get rgb() {
    return this.#value;
  }

  get red() {
    return (this.rgb >> 16) & 0xff;
  }

  get green() {
    return (this.rgb >> 8) & 0xff;
  }

  get blue() {
    return (this.rgb >> 0) & 0xff;
  }

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

  valueOf() {
    return this.rgb;
  }

  toString() {
    if (Number.isNaN(this.rgb)) {
      return 'Invalid Color';
    }

    return this.rgb.toString(16).padStart(6, '0');
  }
}

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
   * @param {*|Array} responses - a single response or an array of responses
   * @param {string} [name] - an optional name for the responses
   */
  static create(responses, name) {
    return new ConfigurableResponses(responses, name);
  }

  #description;
  #responses;

  /** @hideconstructor */
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
   * @returns {*} the next response
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

// TODO Use JSON schema to validate like Java Bean Validation?

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** @returns {never} */
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

/** @returns {{value: ?any, error: ?string}}} */
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
      error: `The ${name} must be ${describe(expectedType, { articles: true })}, but it was ${describe(valueType, { articles: true })}.`,
    };
  }

  // Check enum types
  if (Object.getPrototypeOf(expectedType).name === 'Enum') {
    try {
      return { value: expectedType.valueOf(String(value).toUpperCase()) };
    } catch {
      return {
        error: `The ${name} must be ${describe(expectedType, { articles: true })}, but it was ${describe(valueType, { articles: true })}.`,
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
        let error = `The ${name} must be a valid ${describe(expectedType)}, but it was ${describe(valueType, { articles: true })}`;
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
      error: `The ${name} must be ${describe(expectedType, { articles: true })}, but it was ${describe(valueType, { articles: true })}.`,
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

class Enum {
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

class FeatureToggle {
  /*
  static isFoobarEnabled() {
    return true;
  }
  */
}

const Status = Object.freeze({
  UP: 'UP',
  DOWN: 'DOWN',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
  UNKNOWN: 'UNKNOWN',
});

class Health {
  static up(/** @type {?Record<string, any>} */ details) {
    return new Health(Status.UP, details);
  }

  static down(/** @type {?Record<string, any>} */ details) {
    return new Health(Status.DOWN, details);
  }

  static outOfService(/** @type {?Record<string, any>} */ details) {
    return new Health(Status.OUT_OF_SERVICE, details);
  }

  static unknown(/** @type {?Record<string, any>} */ details) {
    return new Health(Status.UNKNOWN, details);
  }

  constructor(
    /** @type {Status} */ status = Status.UP,
    /** @type {?Record<string, any>} */ details,
  ) {
    this.status = status;
    this.details = details; /** e.g. error: "..." */
  }
}

class HealthIndicator {
  health() {
    return Health.up();
  }
}

class HealthRegistry {
  static create() {
    return new HealthRegistry();
  }

  /** @type {Map<string, HealthIndicator>} */ #registry = new Map();

  health() {
    if (this.#registry.size === 0) {
      return Health.up();
    }

    const order = ['DOWN', 'OUT_OF_SERVICE', 'UP', 'UNKNOWN'];
    const statuses = [];
    const components = {};
    for (const [name, healthIndicator] of this.#registry.entries()) {
      components[name] = healthIndicator.health();
      statuses.push(components[name].status);
    }

    statuses.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const status = statuses[0];
    return { status, components };
  }

  register(
    /** @type {string} */ name,
    /** @type {HealthIndicator} */ healthIndicator,
  ) {
    this.#registry.set(name, healthIndicator);
  }

  unregister(/** @type {string} */ name) {
    this.#registry.delete(name);
  }
}

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
   * @param {EventTarget} eventTarget - the event target to track
   * @param {string} event - the event name to track
   */
  static create(eventTarget, event) {
    return new OutputTracker(eventTarget, event);
  }

  #eventTarget;
  #event;
  #tracker;
  #data = [];

  /** @hideconstructor */
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
   * @returns {Array} the tracked data
   */
  get data() {
    return this.#data;
  }

  /**
   * Clears the tracked data and returns the cleared data.
   *
   * @returns {Array} the cleared data
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
   * @static
   */
  static OFF = new Level('OFF', Number.MAX_SAFE_INTEGER);

  /**
   * `ERROR` is a message level indicating a serious failure.
   *
   * @type {Level}
   * @static
   */
  static ERROR = new Level('ERROR', 1000);

  /**
   * `WARNING` is a message level indicating a potential problem.
   *
   * @type {Level}
   * @static
   */
  static WARNING = new Level('WARNING', 900);

  /**
   * `INFO` is a message level for informational messages.
   *
   * @type {Level}
   * @static
   */
  static INFO = new Level('INFO', 800);

  /**
   * `DEBUG` is a message level providing tracing information.
   *
   * @type {Level}
   * @static
   */
  static DEBUG = new Level('DEBUG', 700);

  /**
   * `TRACE` is a message level providing fine-grained tracing information.
   *
   * @type {Level}
   * @static
   */
  static TRACE = new Level('TRACE', 600);

  /**
   * `ALL` indicates that all messages should be logged.
   *
   * @type {Level}
   * @static
   */
  static ALL = new Level('ALL', Number.MIN_SAFE_INTEGER);

  /**
   * Parses a level string or number into a Level.
   *
   * For example:
   * - "ERROR"
   * - "1000"
   *
   * @param {string|number} name - the name or value of the level
   * @returns the parsed value
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
   * @param {string} name - the name of the level
   * @param {number} value - the value of the level
   */
  constructor(name, value) {
    this.name = name;
    this.value = value;
    Level.#levels.push(this);
  }

  /**
   * Returns a string representation of the level.
   *
   * @returns {string} - the name of the level
   */
  toString() {
    return this.name;
  }

  /**
   * Returns the value of the level.
   *
   * @returns {number} - the value of the level
   */
  valueOf() {
    return this.value;
  }

  /**
   * Returns the name of the level.
   *
   * @returns {string} - the name of the level
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
   * @param {string} name - the name of the logger
   * @returns {Logger} - the logger
   */
  static getLogger(name) {
    const manager = LogManager.getLogManager();
    return manager.demandLogger(name);
  }

  /**
   * Creates a new logger without any handlers.
   *
   * @param {Object} options - the options for the logger
   * @param {Level} options.level - the level of the logger
   * @returns {Logger} - the logger
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

  /** @hideconstructor */
  constructor(/** @type {string} */ name) {
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
   * @param  {...*} message - the message to log
   */
  error(...message) {
    this.log(Level.ERROR, ...message);
  }

  /**
   * Logs a message with the `WARNING` level.
   *
   * @param  {...*} message - the message to log
   */
  warning(...message) {
    this.log(Level.WARNING, ...message);
  }

  /**
   * Logs a message with the `INFO` level.
   *
   * @param  {...*} message - the message to log
   */
  info(...message) {
    this.log(Level.INFO, ...message);
  }

  /**
   * Logs a message with the `DEBUG` level.
   *
   * @param  {...*} message - the message to log
   */
  debug(...message) {
    this.log(Level.DEBUG, ...message);
  }

  /**
   * Logs a message with the `TRACE` level.
   *
   * @param  {...*} message - the message to log
   */

  trace(...message) {
    this.log(Level.TRACE, ...message);
  }
  /**
   * Logs a message.
   *
   * @param {Level} level - the level of the message
   * @param  {...*} message - the message to log
   */
  log(level, ...message) {
    if (!this.isLoggable(level)) {
      return;
    }

    const record = new LogRecord(level, ...message);
    record.loggerName = this.name;
    let logger = this;
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
   * @returns {OutputTracker} - the output tracker
   */
  trackMessagesLogged() {
    return new OutputTracker(this, MESSAGE_LOGGED_EVENT);
  }

  /**
   * Checks if a message of the given level would actually be logged by this
   * logger.
   *
   * @param {Level} level - the level to check
   * @returns {boolean} - `true` if the message would be logged
   */
  isLoggable(level) {
    return this.level != null
      ? level >= this.level
      : this.parent.isLoggable(level);
  }

  /**
   * Adds a log handler to receive logging messages.
   *
   * @param {Handler} handler
   */
  addHandler(handler) {
    this.#handlers.push(handler);
  }

  /**
   * Removes a log handler.
   *
   * @param {Handler} handler
   */
  removeHandler(handler) {
    this.#handlers = this.#handlers.filter((h) => h !== handler);
  }

  /**
   * Returns the handlers of the logger.
   *
   * @returns {Handler[]} - the handlers
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
   * @param {Level} level - the level of the log record
   * @param  {...*} message - the message to log
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
   * @param {LogRecord} record - the log record to publish
   * @abstract
   */
  async publish() {
    throw new Error('Not implemented');
  }

  /**
   * Checks if this handler would actually log a given `LogRecord`.
   *
   * @param {Level} level - the level to check
   * @returns {boolean} - `true` if the message would be logged
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
  }
}

/**
 * A `Formatter` provides support for formatting log records.
 *
 * @abstract
 */
class Formatter {
  /**
   * Formats the given log record and return the formatted string.
   *
   * @param {LogRecord} record - the log record to format
   * @returns {string} - the formatted log record
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
    s +=
      ' - ' +
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

/**
 * A client handling long polling a HTTP request.
 */
class LongPollingClient {
  static create({ timeout = 1000 } = {}) {
    return new LongPollingClient(timeout, globalThis.fetch.bind(globalThis));
  }

  static createNull() {
    return new LongPollingClient(0, { fetch: fetchStub });
  }

  #timeout;
  #fetch;
  #connected = false;
  #aboutController = new AbortController();
  #tag;
  #eventListener;

  /** @hideconstructor */
  constructor(/** @type {number} */ timeout, /** @type {fetch} */ fetchFunc) {
    this.#timeout = timeout;
    this.#fetch = fetchFunc;
  }

  get isConnected() {
    return this.#connected;
  }

  async connect(eventListener) {
    this.#handleConnect(eventListener);
    new Promise((resolve) => {
      (async () => {
        while (this.isConnected) {
          try {
            const headers = this.#createHeaders();
            const response = await this.#fetch('/api/talks', {
              headers,
            });
            await this.#handleResponse(response);
          } catch (error) {
            await this.#handleError(error);
          }
        }
        resolve();
      })();
    });
  }

  async close() {
    this.#aboutController.abort();
    this.#connected = false;
  }

  simulateConnected(eventListener) {
    this.#handleConnect(eventListener);
  }

  async simulateResponse({ status, headers, body }) {
    await this.#handleResponse(new ResponseStub({ status, headers, body }));
  }

  simulateError(error) {
    this.#handleError(error);
  }

  #handleConnect(eventListener) {
    if (this.isConnected) {
      throw new Error('Already connected.');
    }

    this.#eventListener = eventListener;
    this.#connected = true;
  }

  #createHeaders() {
    const headers = { signal: this.#aboutController.signal };
    if (this.#tag) {
      headers['If-None-Match'] = this.#tag;
      headers.Prefer = 'wait=90';
    }
    return headers;
  }

  async #handleResponse(/** @type {Response} */ response) {
    if (response.status === 304) {
      return;
    }

    if (!response.ok) {
      // retry on server errors
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    this.#tag = response.headers.get('ETag');
    const data = await response.json();
    this.#eventListener(new MessageEvent('message', { data }));
  }

  async #handleError(error) {
    console.error(error);
    await new Promise((resolve) => setTimeout(resolve, this.#timeout));
  }
}

async function fetchStub(url, options) {
  // TODO use stub
  await new Promise((resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject());
  });
}

class ResponseStub {
  #status;
  #headers;
  #body;

  constructor({ status, headers, body }) {
    this.#status = status;
    this.#headers = new Headers(headers);
    this.#body = body;
  }

  get ok() {
    return this.#status >= 200 && this.#status < 300;
  }

  get status() {
    return this.#status;
  }

  get headers() {
    return this.#headers;
  }

  async json() {
    return this.#body;
  }
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
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {boolean|undefined} a random boolean between `origin` (inclusive) and `bound` (exclusive) or undefined
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
   * @param {number} [origin=0] - the least value that can be returned
   * @param {number} [bound=1] - the upper bound (exclusive) for the returned value
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {number|undefined} a random integer between `origin` (inclusive) and `bound` (exclusive) or undefined
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
   * @param {number} [origin=0.0] - the least value that can be returned
   * @param {number} [bound=1.0] - the upper bound (exclusive) for the returned value
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {number|undefined} a random float between `origin` (inclusive) and `bound` (exclusive) or undefined
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
   * @param {number} [maxMillis=0] - the maximum offset in milliseconds
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {Date|undefined} - a random timestamp or `undefined`
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
   * @param {Array} [values=[]] - the array of values
   * @param {number} [probabilityOfUndefined=0.0] - the probability of returning `undefined`
   * @returns {*|undefined} - a random value from the array or `undefined`
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

/**
 * A central place to register and resolve services.
 */
class ServiceLocator {
  static #instance = new ServiceLocator();

  /**
   * Gets the default service locator.
   *
   * @returns {ServiceLocator} the default service locator
   */
  static getDefault() {
    return ServiceLocator.#instance;
  }

  #services = new Map();

  /**
   * Registers a service with name.
   *
   * @param {string} name - the name of the service
   * @param {object|Function} service - the service object or constructor
   */
  register(name, service) {
    this.#services.set(name, service);
  }

  /**
   * Resolves a service by name.
   *
   * @param {string} name - the name of the service
   * @returns {object} the service object
   */
  resolve(name) {
    const service = this.#services.get(name);
    if (service == null) {
      throw new Error(`Service not found: ${name}.`);
    }

    return typeof service === 'function' ? service() : service;
  }
}

class SseClient {
  static create() {
    return new SseClient(EventSource);
  }

  static createNull() {
    return new SseClient(EventSourceStub);
  }

  #eventSourceConstructor;
  /** @type {EventSource} */ #eventSource;

  /** @hideconstructor */
  constructor(/** @type {function(new:EventSource)} */ eventSourceConstructor) {
    this.#eventSourceConstructor = eventSourceConstructor;
  }

  get isConnected() {
    return this.#eventSource?.readyState === this.#eventSourceConstructor.OPEN;
  }

  async connect(eventListenerOrEventType, eventListener) {
    if (this.isConnected) {
      throw new Error('Already connected.');
    }

    const eventType =
      typeof eventListenerOrEventType === 'string'
        ? eventListenerOrEventType
        : 'message';
    if (typeof eventListenerOrEventType === 'function') {
      eventListener = eventListenerOrEventType;
    }
    await new Promise((resolve) => {
      this.#eventSource = new this.#eventSourceConstructor('/api/talks');
      this.#eventSource.addEventListener(eventType, eventListener);
      this.#eventSource.addEventListener('open', () => resolve());
    });
  }

  async close() {
    this.#eventSource.close();
  }

  simulateMessage(data, eventType = 'message') {
    this.#eventSource.dispatchEvent(new MessageEvent(eventType, { data }));
  }
}

class EventSourceStub extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor() {
    super();

    this.readyState = EventSourceStub.CONNECTING;
    setTimeout(() => {
      this.readyState = EventSourceStub.OPEN;
      this.dispatchEvent(new Event('open'));
    });
  }

  close() {
    this.readyState = EventSourceStub.CLOSED;
  }
}

class StopWatch {
  #startTime;
  #stopTime;

  start() {
    this.#startTime = Date.now();
  }

  stop() {
    this.#stopTime = Date.now();
  }

  getTotalTimeMillis() {
    return this.#stopTime - this.#startTime;
  }

  getTotalTimeSeconds() {
    return this.getTotalTimeMillis / 1000;
  }
}

/**
 * A reducer is a function that changes the state of the application based on an
 * action.
 *
 * @callback ReducerType
 * @param {StateType} state the current state of the application
 * @param {ActionType} action the action to handle
 * @returns {StateType} the next state of the application or the initial state
 *   if the state parameter is `undefined`
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
 * @property {string} type a string that identifies the action
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
 * @param {ReducerType} reducer the reducer function
 * @param {StateType} [preloadedState] the optional initial state of the store
 * @returns {Store} the new store
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

  /** @hideconstructor */
  constructor(
    /** @type {ReducerType} */ reducer,
    /** @type {StateType} */ initialState,
  ) {
    this.#reducer = reducer;
    this.#state = initialState;
  }

  /**
   * Returns the current state of the store.
   *
   * @returns {StateType} the current state of the store
   */
  getState() {
    return this.#state;
  }

  /**
   * Updates the state of the store by dispatching an action to the reducer.
   *
   * @param {ActionType} action the action to dispatch
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
   * @param {ListenerType} listener the listener to subscribe
   * @returns {UnsubscriberType} a function that unsubscribes the listener
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

/**
 * A clock provides access to the current timestamp.
 */
class Clock {
  /**
   * Creates a clock using system clock.
   *
   * @returns {Clock} a clock that uses system clock
   */
  static system() {
    return new Clock();
  }

  /**
   * Creates a clock using a fixed date.
   *
   * @param {Date} [fixed='2024-02-21T19:16:00Z'] - the fixed date of the clock
   * @returns {Clock} a clock that returns alaways a fixed date
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
   * @returns {Date} the current timestamp
   */
  date() {
    return this.#date ? new Date(this.#date) : new Date();
  }

  /**
   * Returns the current timestamp of the clock in milliseconds.
   *
   * @returns {number} the current timestamp in milliseconds
   */
  millis() {
    return this.date().getTime();
  }

  /**
   * Adds a duration to the current timestamp of the clock.
   *
   * @param {Duration|string|number} offsetDuration - the duration or number of millis to add
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
   * @returns {Duration} a zero duration
   */
  static zero() {
    return new Duration();
  }

  /**
   * Creates a duration from a ISO 8601 string like `[-]P[dD]T[hH][mM][s[.f]S]`.
   *
   * @param {string} isoString - the ISO 8601 string to parse
   * @returns {Duration} the parsed duration
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
   * @param {Date|number} startInclusive - the start date or millis, inclusive
   * @param {Date|number} endExclusive - the end date or millis, exclusive
   * @returns {Duration} the duration between the two dates
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
   * @param {number|string|Duration} [value] - the duration in millis, an ISO 8601 string or another duration
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
    const value =
      (this.millis -
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
    const value =
      this.millis -
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
   * @returns {Duration} the absolute value of the duration
   */
  absolutized() {
    return new Duration(Math.abs(this.millis));
  }

  /**
   * Returns a copy of this duration with length negated.
   *
   * @returns {Duration} the negated value of the duration
   */
  negated() {
    return new Duration(-this.millis);
  }

  /**
   * Returns a copy of this duration with the specified duration added.
   *
   * @param {Duration|string|number} duration - the duration to add or number of millis
   * @returns {Duration} the new duration
   */
  plus(duration) {
    return new Duration(this.millis + new Duration(duration).millis);
  }

  /**
   * Returns a copy of this duration with the specified duration subtracted.
   *
   * @param {Duration|string|number} duration - the duration to subtract or number of millis
   * @returns {Duration} the new duration
   */
  minus(duration) {
    return new Duration(this.millis - new Duration(duration));
  }

  /**
   * Returns a copy of this duration multiplied by the scalar.
   *
   * @param {number} multiplicand - the value to multiply the duration by
   * @returns {Duration} the new duration
   */
  multipliedBy(multiplicand) {
    return new Duration(this.millis * multiplicand);
  }

  /**
   * Returns a copy of this duration divided by the specified value.
   *
   * @param {number} divisor - the value to divide the duration by
   * @returns {Duration} the new duration
   */
  dividedBy(divisor) {
    return new Duration(this.millis / divisor);
  }

  /**
   * Returns a string representation of this duration using ISO 8601, such as
   * `PT8H6M12.345S`.
   *
   * @returns {string} the ISO 8601 string representation of the duration
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
   * @returns {string} the string representation of this duration
   */
  toJSON() {
    return this.toISOString();
  }

  /**
   * Returns a string representation of this duration, such as `08:06:12`.
   *
   * @param {object} options - the options to create the string
   * @param {string} [options.style='medium'] - the style of the string (`short`, `medium`, `long`)
   * @returns {string} the string representation of the duration
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
   * @returns {number} the value of the duration in milliseconds
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

const TASK_CREATED = 'created';
const TASK_SCHEDULED = 'scheduled';
const TASK_EXECUTED = 'executed';
const TASK_CANCELLED = 'cancelled';

/**
 * A task that can be scheduled by a {@link Timer}.
 *
 * @abstract
 */
class TimerTask {
  _state = TASK_CREATED;
  _nextExecutionTime = 0;
  _period = 0;

  /**
   * Runs the task.
   */
  run() {
    throw new Error('Method not implemented.');
  }

  /**
   * Cancels the task.
   *
   * @returns {boolean} `true` if this task was scheduled for one-time execution
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
   * @returns {number} the time in milliseconds since the epoch, undefined if
   *   the task has not yet run for the first time
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

  /** @hideconstructor */
  constructor(/** @type {Clock} */ clock, /** @type {globalThis} */ global) {
    super();
    this.#clock = clock;
    this.#global = global;
    this._queue = [];
  }

  /**
   * Schedules a task for repeated execution at regular intervals.
   *
   * @param {TimerTask} task - the task to execute
   * @param {number|Date} delayOrTime - the delay before the first execution, in milliseconds or the time of the first execution
   * @param {number} [period=0] - the interval between executions, in milliseconds; 0 means single execution
   */
  schedule(task, delayOrTime, period = 0) {
    this.#doSchedule(task, delayOrTime, -period);
  }

  /**
   * Schedule a task for repeated fixed-rate execution.
   *
   * @param {TimerTask} task - the task to execute
   * @param {number|Date} delayOrTime - the delay before the first execution, in milliseconds or the time of the first
   * @param {number} period - the interval between executions, in milliseconds
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
   * @returns {number} the number of tasks removed from the task queue
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
   * @param {object} options - the simulation options
   * @param {number} [options.ticks=1000] - the number of milliseconds to advance the clock
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
    console.log('taskFired', taskFired, executionTime, now);
    if (taskFired) {
      if (task._period === 0) {
        this._queue.shift();
        task._state = TASK_EXECUTED;
      } else {
        task._nextExecutionTime =
          task._period < 0 ? now - task._period : executionTime + task._period;
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

/**
 * A vector in a two-dimensional space.
 */
class Vector2D {
  /**
   * Creates a vector from 2 points.
   *
   * @param {Vector2D} a - the first point
   * @param {Vector2D} b - the second point
   * @returns {Vector2D} the vector from a to b
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
   * @param {number|Array<number>|Vector2D} [x=0] - the x coordinate or an array or another vector
   * @param {number} [y=0] - the y coordinate or undefined if x is an array or another vector
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
   * @returns {number} the length of the vector
   */
  length() {
    return Math.hypot(this.x, this.y);
  }

  /**
   * Adds another vector to this vector and return the new vector.
   *
   * @param {Vector2D} v - the vector to add
   * @returns {Vector2D} the new vector
   */
  add(v) {
    v = new Vector2D(v);
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  /**
   * Subtracts another vector from this vector and return the new vector.
   *
   * @param {Vector2D} v - the vector to subtract
   * @returns {Vector2D} the new vector
   */
  subtract(v) {
    v = new Vector2D(v);
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  /**
   * Multiplies the vector with a scalar and returns the new vector.
   *
   * @param {number} scalar - the scalar to multiply with
   * @returns {Vector2D} the new vector
   */
  scale(scalar) {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  /**
   * Multiplies the vector with another vector and returns the scalar.
   *
   * @param {Vector2D} v - the vector to multiply with
   * @returns {number} the scalar
   */
  dot(v) {
    v = new Vector2D(v);
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Returns the distance between this vector and another vector.
   *
   * @param {Vector2D} v - the other vector
   * @returns {number} the distance
   */
  distance(v) {
    v = new Vector2D(v);
    return Vector2D.fromPoints(this, v).length();
  }

  /**
   * Returns the rotated vector by the given angle in radians.
   *
   * @param {number} angle - the angle in radians
   * @returns {Vector2D} the rotated vector
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
   * @returns {Vector2D} the unit vector
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
   * @param {Vector2D} a - the first point
   * @param {Vector2D} b - the second point
   * @returns {Line2D} the line from a to b
   */
  static fromPoints(a, b) {
    return new Line2D(a, Vector2D.fromPoints(a, b));
  }

  /**
   * Creates a new line.
   *
   * @param {Vector2D} point - a point on the line
   * @param {Vector2D} direction - the direction of the line
   */
  constructor(point, direction) {
    this.point = new Vector2D(point);
    this.direction = new Vector2D(direction);
  }

  /**
   * Returns the perpendicular of a point on this line.
   *
   * @param {Vector2D} point - a point
   * @returns {{foot: number, scalar: number}} the `foot` and the `scalar`
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

class WebSocketClient extends EventTarget {
  static create() {
    return new WebSocketClient(WebSocket);
  }

  static createNull() {
    return new WebSocketClient(WebSocketStub);
  }

  isHeartbeatEnabled = true;

  #webSocketConstructor;
  /** @type {WebSocket} */ #webSocket;
  #heartbeatId;

  /** @hideconstructor */
  constructor(/** @type {function(new:EventSource)} */ webSocketConstructor) {
    super();
    this.#webSocketConstructor = webSocketConstructor;
  }

  get isConnected() {
    return this.#webSocket?.readyState === this.#webSocketConstructor.OPEN;
  }

  async connect(/** @type {string | URL} */ url) {
    if (this.isConnected) {
      throw new Error('Already connected.');
    }

    return new Promise((resolve, reject) => {
      try {
        this.#webSocket = new this.#webSocketConstructor(url);
        this.#webSocket.onmessage = (event) =>
          this.dispatchEvent(new event.constructor(event.type, event));
        this.#webSocket.onclose = (event) => {
          this.dispatchEvent(new event.constructor(event.type, event));
          this.#stopHeartbeat();
        };
        this.#webSocket.onerror = (event) =>
          this.dispatchEvent(new event.constructor(event.type, event));
        this.#webSocket.onopen = (event) => {
          this.dispatchEvent(new event.constructor(event.type, event));
          this.#startHeartbeat();
          resolve();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      function closeHandler() {
        this.removeEventListener('close', closeHandler);
        resolve();
      }

      try {
        this.addEventListener('close', closeHandler);
        this.#webSocket.close(1000, 'user request');
      } catch (error) {
        reject(error);
      }
    });
  }

  send(message) {
    this.#webSocket.send(JSON.stringify(message));
  }

  async simulateMessageReceived({ data }) {
    return new Promise((resolve) => {
      function messageHandler() {
        this.removeEventListener('message', messageHandler);
        resolve();
      }

      this.addEventListener('message', messageHandler);
      this.#webSocket.simulateMessageReceived({ data });
    });
  }

  async simulateErrorOccurred() {
    return new Promise((resolve) => {
      function errorHandler() {
        this.removeEventListener('error', errorHandler);
        resolve();
      }

      this.addEventListener('error', errorHandler);
      this.#webSocket.simulateErrorOccurred();
    });
  }

  #startHeartbeat() {
    if (!this.isHeartbeatEnabled) {
      return;
    }

    this.#heartbeatId = setInterval(
      () => this.send({ type: 'heartbeat' }),
      30000,
    );
  }

  #stopHeartbeat() {
    clearInterval(this.#heartbeatId);
  }
}

class WebSocketStub {
  // TODO simplify WebSocket fake to stub
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = WebSocketStub.CONNECTING;
  onclose;
  onerror;

  #onopen;

  get onopen() {
    return this.#onopen;
  }

  set onopen(listener) {
    this.#onopen = listener;
    setTimeout(() => {
      this.readyState = WebSocketStub.OPEN;
      this.onopen(new Event('open'));
    });
  }

  close(code, reason) {
    setTimeout(() => {
      this.readyState = WebSocketStub.CLOSED;
      this.onclose?.(new CloseEvent('close', { wasClean: true, code, reason }));
    });
  }

  send() {}

  simulateMessageReceived({ data }) {
    setTimeout(() => {
      let jsonString =
        typeof data === 'string' ||
        data instanceof Blob ||
        data instanceof ArrayBuffer
          ? data
          : JSON.stringify(data);
      this.onmessage?.(new MessageEvent('message', { data: jsonString }));
    });
  }

  simulateErrorOccurred() {
    setTimeout(() => {
      this.readyState = WebSocketStub.CLOSED;
      this.onclose?.(new globalThis.CloseEvent('close', { wasClean: false }));
      this.onerror?.(new Event('error'));
    });
  }
}

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
   * @param {object} options - the configuration options
   * @param {object} [options.defaults={}] - the default configuration
   * @param {string} [options.prefix=""] - the prefix of the properties to get
   * @param {string} [options.name='application.json'] - the name of the configuration file
   * @param {string[]} [options.location=['.', 'config']] - the locations where to search for the configuration file
   * @returns {ConfigurationProperties} the new instance
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
   * @param {object} options - the configuration options
   * @param {object} [options.defaults={}] - the default configuration
   * @param {string} [options.prefix=""] - the prefix of the properties to get
   * @param {string} [options.name='application.json'] - the name of the configuration file
   * @param {string[]} [options.location=['.', 'config']] - the locations where to search for the configuration file
   * @param {object} [options.files={}] - the files and file content that are available
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

  /** @hideconstructor */
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
   * @returns {Promise<object>} the configuration object
   */
  async get() {
    let config = await this.#loadFile();
    config = _.merge(this.#defaults, config);
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
      } catch {
        // Ignore error and try next location
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

  async readFile(path) {
    const fileContent = this.#files[path];
    if (fileContent == null) {
      throw new Error(`File not found: ${path}`);
    }

    if (typeof fileContent === 'string') {
      return fileContent;
    }

    return JSON.stringify(fileContent);
  }
}

/**
 * @import { LogRecord } from '../logging.js';
 */


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
   * @param {string} filename - the name of the file to write log messages to
   * @param {number} [limit=0] - the maximum size of the file in bytes before it is rotated
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

exports.Clock = Clock;
exports.Color = Color;
exports.ConfigurableResponses = ConfigurableResponses;
exports.ConfigurationProperties = ConfigurationProperties;
exports.ConsoleHandler = ConsoleHandler;
exports.Duration = Duration;
exports.Enum = Enum;
exports.FeatureToggle = FeatureToggle;
exports.FileHandler = FileHandler;
exports.Formatter = Formatter;
exports.Handler = Handler;
exports.Health = Health;
exports.HealthIndicator = HealthIndicator;
exports.HealthRegistry = HealthRegistry;
exports.JsonFormatter = JsonFormatter;
exports.Level = Level;
exports.Line2D = Line2D;
exports.LogRecord = LogRecord;
exports.Logger = Logger;
exports.LongPollingClient = LongPollingClient;
exports.OutputTracker = OutputTracker;
exports.Random = Random;
exports.ServiceLocator = ServiceLocator;
exports.SimpleFormatter = SimpleFormatter;
exports.SseClient = SseClient;
exports.Status = Status;
exports.StopWatch = StopWatch;
exports.Store = Store;
exports.Timer = Timer;
exports.TimerTask = TimerTask;
exports.ValidationError = ValidationError;
exports.Vector2D = Vector2D;
exports.WebSocketClient = WebSocketClient;
exports.createStore = createStore;
exports.ensureAnything = ensureAnything;
exports.ensureArguments = ensureArguments;
exports.ensureItemType = ensureItemType;
exports.ensureNonEmpty = ensureNonEmpty;
exports.ensureThat = ensureThat;
exports.ensureType = ensureType;
exports.ensureUnreachable = ensureUnreachable;
