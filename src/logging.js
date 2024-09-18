import { OutputTracker } from './output-tracker.js';

export const MESSAGE_LOGGED_EVENT = 'message-logged';

export class Level {
  static #levels = [];

  static OFF = new Level('OFF', Number.MAX_SAFE_INTEGER);
  static ERROR = new Level('ERROR', 1000);
  static WARNING = new Level('WARNING', 900);
  static INFO = new Level('INFO', 800);
  static DEBUG = new Level('DEBUG', 700);
  static TRACE = new Level('TRACE', 600);
  static ALL = new Level('ALL', Number.MIN_SAFE_INTEGER);

  static parse(/** @type {string|number} */ name) {
    const level = Level.#levels.find(
      (level) => level.name === String(name) || level.value === Number(name),
    );
    if (level == null) {
      throw new Error(`Bad log level "${name}".`);
    }

    return level;
  }

  constructor(/** @type {string} */ name, /** @type {number} */ value) {
    this.name = name;
    this.value = value;
    Level.#levels.push(this);
  }

  toString() {
    return this.name;
  }

  valueOf() {
    return this.value;
  }

  toJSON() {
    return this.name;
  }
}

export class Logger extends EventTarget {
  static getLogger(/** @type {string} */ name) {
    const manager = LogManager.getLogManager();
    return manager.demandLogger(name);
  }

  static getAnonymousLogger() {
    const manager = LogManager.getLogManager();
    const logger = new Logger();
    logger.parent = manager.getLogger('');
    return logger;
  }

  static createNull({ level = Level.INFO } = {}) {
    const logger = new Logger('null-logger');
    logger.level = level;
    logger.handler = new Handler();
    return logger;
  }

  /** @type {?Logger} */ parent;
  /** @type {?Level} */ level;
  /** @type {Handler[]} */ #handlers = [];

  #name;

  constructor(/** @type {string} */ name) {
    super();
    this.#name = name;
  }

  get name() {
    return this.#name;
  }

  error(...message) {
    this.log(Level.ERROR, ...message);
  }

  warning(...message) {
    this.log(Level.WARNING, ...message);
  }

  info(...message) {
    this.log(Level.INFO, ...message);
  }

  debug(...message) {
    this.log(Level.DEBUG, ...message);
  }

  trace(...message) {
    this.log(Level.TRACE, ...message);
  }

  log(/** @type {Level} */ level, ...message) {
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

  isLoggable(/** @type {Level} */ level) {
    return this.level != null
      ? level >= this.level
      : this.parent?.isLoggable(level);
  }

  addHandler(/** @type {Handler} */ handler) {
    this.#handlers.push(handler);
  }

  removeHandler(/** @type {Handler} */ handler) {
    const index = this.#handlers.indexOf(handler);
    if (index !== -1) {
      this.#handlers.splice(index, 1);
    }
  }

  trackMessagesLogged() {
    return new OutputTracker(this, MESSAGE_LOGGED_EVENT);
  }
}

export class LogRecord {
  /** @type {?string} */ loggerName;

  constructor(/** @type {Level} */ level, /** @type {any[]} */ ...message) {
    this.level = level;
    this.message = message;
    this.timestamp = new Date();
  }
}

export class Formatter {
  format(/** @type {LogRecord} */ record) {
    return String(record.message);
  }
}

export class SimpleFormatter extends Formatter {
  format(/** @type {LogRecord} */ record) {
    let s = record.timestamp.toISOString();
    if (record.loggerName) {
      s += ' ' + record.loggerName;
    }
    s += ' ' + record.level.toString();
    s +=
      ' ' +
      record.message
        .map((m) => (typeof m === 'object' ? JSON.stringify(m) : m))
        .join(' ');
    return s;
  }
}

export class Handler {
  level = Level.ALL;
  /** @type {Formatter} */ formatter;

  // eslint-disable-next-line no-unused-vars
  async publish(/** @type {LogRecord} */ record) {}

  isLoggable(/** @type {Level} */ level) {
    return level >= this.level;
  }
}

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
