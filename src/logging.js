/**
 * Provides classes for logging.
 *
 * This module adopts some classes from the Java `java.util.logging` package.
 * The interfaces are almost identical and are only changed to be more idiomatic
 * in JavaScript.
 *
 * @module @muspellheim/utils/logging
 */

import { OutputTracker } from './output-tracker.js';

export const MESSAGE_LOGGED_EVENT = 'message-logged';

/**
 * Defines a set of standard logging levels that can be used to control logging
 * output.
 */
export class Level {
  static #levels = [];

  /**
   * `OFF` is a special level that can be used to turn off logging.
   *
   * @type {module:@muspellheim/utils/logging.Level}
   * @static
   */
  static OFF = new Level('OFF', Number.MAX_SAFE_INTEGER);

  /**
   * `ERROR` is a message level indicating a serious failure.
   *
   * @type {module:@muspellheim/utils/logging.Level}
   * @static
   */
  static ERROR = new Level('ERROR', 1000);

  /**
   * `WARNING` is a message level indicating a potential problem.
   *
   * @type {module:@muspellheim/utils/logging.Level}
   * @static
   */
  static WARNING = new Level('WARNING', 900);

  /**
   * `INFO` is a message level for informational messages.
   *
   * @type {module:@muspellheim/utils/logging.Level}
   * @static
   */
  static INFO = new Level('INFO', 800);

  /**
   * `DEBUG` is a message level providing tracing information.
   *
   * @type {module:@muspellheim/utils/logging.Level}
   * @static
   */
  static DEBUG = new Level('DEBUG', 700);

  /**
   * `TRACE` is a message level providing fine-grained tracing information.
   *
   * @type {module:@muspellheim/utils/logging.Level}
   * @static
   */
  static TRACE = new Level('TRACE', 600);

  /**
   * `ALL` indicates that all messages should be logged.
   *
   * @type {module:@muspellheim/utils/logging.Level}
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
   * Creates a new level and registers it.
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
 * A Logger object is used to log messages for a specific system or application
 * component.
 */
export class Logger extends EventTarget {
  /**
   * Finds or creates a logger with the given name.
   *
   * @param {string} name - the name of the logger
   * @returns {module:@muspellheim/utils/logging.Logger} - the logger
   */
  static getLogger(name) {
    const manager = LogManager.getLogManager();
    return manager.demandLogger(name);
  }

  /**
   * Creates a new logger without any handlers.
   *
   * @param {Object} options - the options for the logger
   * @param {module:@muspellheim/utils/logging.Level} options.level - the level of the logger
   * @returns {module:@muspellheim/utils/logging.Logger} - the logger
   */
  static createNull({ level = Level.INFO } = {}) {
    const logger = new Logger('null-logger');
    logger.level = level;
    return logger;
  }

  /** @type {?module:@muspellheim/utils/logging.Logger} */ parent;
  /** @type {?module:@muspellheim/utils/logging.Level} */ level;
  /** @type {module:@muspellheim/utils/logging.Handler[]} */ #handlers = [];

  #name;

  /** @hideconstructor */
  constructor(/** @type {string} */ name) {
    super();
    this.#name = name;
  }

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
   * @param {module:@muspellheim/utils/logging.Level} level - the level of the message
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
   * Check if a message of the given level would actually be logged by this
   * logger.
   *
   * @param {module:@muspellheim/utils/logging.Level} level - the level to check
   * @returns {boolean} - `true` if the message would be logged
   */
  isLoggable(/** @type {Level} */ level) {
    return this.level != null
      ? level >= this.level
      : this.parent?.isLoggable(level);
  }

  /**
   * Add a log handler to receive logging messages.
   *
   * @param {module:@muspellheim/utils/logging.Handler} handler
   */
  addHandler(handler) {
    this.#handlers.push(handler);
  }

  /**
   * Remove a log handler.
   *
   * @param {module:@muspellheim/utils/logging.Handler} handler
   */
  removeHandler(handler) {
    this.#handlers = this.#handlers.filter((h) => h !== handler);
  }

  /**
   * Returns an output tracker for messages logged by this logger.
   *
   * @returns {OutputTracker} - the output tracker
   */
  trackMessagesLogged() {
    return new OutputTracker(this, MESSAGE_LOGGED_EVENT);
  }
}

/**
 * A `LogRecord` object is used to pass logging requests between the logging
 * framework and individual log Handlers.
 *
 * @property {number} sequenceNumber - the sequence number of the log record
 */
export class LogRecord {
  static #globalSequenceNumber = 1;

  /**
   * The log level.
   * @type {module:@muspellheim/utils/logging.Level}
   */
  level;

  /**
   * The log message.
   * @type {Array}
   */
  message;

  /**
   * The timestamp when the log record was created.
   * @type {Date}
   */
  date;

  /**
   * The sequence number of the log record.
   * @type {number}
   */
  sequenceNumber;

  /**
   * The name of the logger.
   * @type {string|undefined}
   */
  loggerName;

  constructor(level, ...message) {
    this.date = new Date();
    this.sequenceNumber = LogRecord.#globalSequenceNumber++;
    this.level = level;
    this.message = message;
  }

  get millis() {
    return this.date.getTime();
  }
}

/**
 * A `Formatter` provides support for formatting log records.
 *
 * @interface
 */
export class Formatter {
  /**
   * Format the given log record and return the formatted string.
   *
   * @param {module:@muspellheim/utils/logging.LogRecord} record - the log record to format
   * @returns {string} - the formatted log record
   */
  format() {
    throw new Error('Not implemented');
  }
}

/**
 * Prints a brief summary of the LogRecord in a human readable format.
 *
 * @implements {module:@muspellheim/utils/logging.Formatter}
 */
export class SimpleFormatter extends Formatter {
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
 * Format a LogRecord into a JSON object.
 *
 * The JSON object has the following properties:
 * - date: string
 * - millis: number
 * - sequence: number
 * - logger: string (optional)
 * - level: string
 *
 * @implements {module:@muspellheim/utils/logging.Formatter}
 */
export class JsonFormatter extends Formatter {
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

/**
 * A `Handler` object takes log messages from a Logger and exports them.
 */
export class Handler {
  /**
   * The log level which messages will be logged by this `Handler`.
   * @type {module:@muspellheim/utils/logging.Level}
   */
  level = Level.ALL;

  /**
   * The formatter used to format log records.
   * @type {module:@muspellheim/utils/logging.Formatter}
   */
  formatter;

  /**
   * Publish a `LogRecord`.
   *
   * @param {module:@muspellheim/utils/logging.LogRecord} record - the log record to publish
   */
  async publish() {}

  /**
   * Check if this handler would actually log a given `LogRecord`.
   *
   * @param {module:@muspellheim/utils/logging.Level} level - the level to check
   * @returns {boolean} - `true` if the message would be logged
   */
  isLoggable(level) {
    return level >= this.level;
  }
}

/**
 * A `Handler` that writes log messages to the console.
 *
 * @extends module:@muspellheim/utils/logging.Handler
 */
export class ConsoleHandler extends Handler {
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

class LogManager {
  /** @type {LogManager} */ static #logManager;

  /** @type {Map<string, Logger>} */ #namedLoggers = new Map();
  /** @type {Logger} */ #rootLogger;

  static getLogManager() {
    if (!LogManager.#logManager) {
      LogManager.#logManager = new LogManager();
      LogManager.#logManager.#rootLogger = createRootLogger();
      LogManager.#logManager.addLogger(LogManager.#logManager.#rootLogger);
    }

    return LogManager.#logManager;
  }

  getLogger(/** @type {string} */ name) {
    return this.#namedLoggers.get(name);
  }

  demandLogger(/** @type {string} */ name) {
    let logger = this.getLogger(name);
    if (logger == null) {
      logger = new Logger(name);
      logger.parent = this.#rootLogger;
      this.addLogger(logger);
    }
    return logger;
  }

  addLogger(/** @type {Logger} */ logger) {
    this.#namedLoggers.set(logger.name, logger);
  }
}

function createRootLogger() {
  const logger = new Logger('');
  logger.level = Level.INFO;
  const handler = new ConsoleHandler();
  handler.formatter = new SimpleFormatter();
  logger.addHandler(handler);
  return logger;
}
