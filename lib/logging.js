// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Provides the classes and interfaces of a logging facilities.
 *
 * Portated from
 * [Java Logging](https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/package-summary.html).
 *
 * @module
 */

import { OutputTracker } from './output-tracker.js';

const MESSAGE_LOGGED_EVENT = 'message-logged';

/**
 * Define a set of standard logging levels that can be used to control logging
 * output.
 */
export class Level {
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
export class Logger extends EventTarget {
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
export class LogRecord {
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
export class Handler {
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
export class ConsoleHandler extends Handler {
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
export class Formatter {
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
export class SimpleFormatter extends Formatter {
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
export class JsonFormatter extends Formatter {
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
