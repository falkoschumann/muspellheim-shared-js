import { describe, expect, it } from 'vitest';

import {
  ConsoleHandler,
  Handler,
  JsonFormatter,
  Level,
  Logger,
  LogRecord,
  SimpleFormatter,
} from '../../lib/logging.js';

describe('Logging', () => {
  describe('Level', () => {
    it('converts to string', () => {
      const string = Level.INFO.toString();

      expect(string).toBe('INFO');
    });

    it('converts to value', () => {
      const value = Level.INFO.valueOf();

      expect(value).toBe(800);
    });

    it('converts to JSON ', () => {
      const json = Level.INFO.toJSON();

      expect(json).toBe('INFO');
    });

    it('parses level by name', () => {
      const level = Level.parse('WARNING');

      expect(level).toBe(Level.WARNING);
    });

    it('parses level by value', () => {
      const level = Level.parse('1000');

      expect(level).toBe(Level.ERROR);
    });

    it('throws when level can not be parsed', () => {
      expect(() => Level.parse('NON_EXISTING')).toThrow();
    });
  });

  describe('Logger', () => {
    describe('Root', () => {
      it('is initialized', () => {
        const log = Logger.getLogger('');

        expect(log.name).toBe('');
        expect(log.parent).toBeUndefined();
        expect(log.level).toBe(Level.INFO);
        expect(log.getHandlers().length).toBe(1);
        expect(log.getHandlers()[0]).toBeInstanceOf(ConsoleHandler);
        expect(log.getHandlers()[0].level).toBe(Level.ALL);
        expect(log.getHandlers()[0].formatter).toBeInstanceOf(SimpleFormatter);
      });
    });

    describe('Anonymous', () => {
      it('is initialized', () => {
        const log = Logger.getAnonymousLogger();

        expect(log.name).toBeNull();
        expect(log.parent.name).toBe(''); // root logger
        expect(log.level).toBeUndefined();
        expect(log.getHandlers().length).toBe(0);
      });

      it('returns a new logger when getting anonymous logger', () => {
        const log1 = Logger.getAnonymousLogger();
        const log2 = Logger.getAnonymousLogger();

        expect(log1).not.toBe(log2);
      });
    });

    describe('Named', () => {
      it('is initialized', () => {
        const log = Logger.getLogger('inizialized-logger');

        expect(log.name).toBe('inizialized-logger');
        expect(log.parent.name).toBe(''); // root logger
        expect(log.level).toBeUndefined();
        expect(log.getHandlers().length).toBe(0);
      });

      it('returns the same logger when name is equal', () => {
        const log1 = Logger.getLogger('my-logger');
        const log2 = Logger.getLogger('my-logger');

        expect(log1).toBe(log2);
      });
    });

    it.skip('logs at info level by default', () => {
      const log = Logger.getAnonymousLogger();
      const loggedMessages = log.trackMessagesLogged();

      log.error('error message');
      log.warning('warning message');
      log.info('info message');
      log.debug('debug message');
      log.trace('trace message');

      expect(loggedMessages.data).toEqual([
        objectContaining({
          level: Level.ERROR,
          message: ['error message'],
        }),
        objectContaining({
          level: Level.WARNING,
          message: ['warning message'],
        }),
        objectContaining({
          level: Level.INFO,
          message: ['info message'],
        }),
      ]);
    });

    it('logs with locally set level', () => {
      const log = Logger.getAnonymousLogger();
      log.level = Level.ERROR;
      const loggedMessages = log.trackMessagesLogged();

      log.error('error message');
      log.warning('warning message');

      expect(loggedMessages.data).toEqual([
        expect.objectContaining({
          level: Level.ERROR,
          message: ['error message'],
        }),
      ]);
    });

    it('logs with level set on parent', () => {
      const log = Logger.getAnonymousLogger();
      log.level = undefined;
      log.parent.level = Level.DEBUG;
      const loggedMessages = log.trackMessagesLogged();

      log.debug('debug message');
      log.trace('trace message');

      expect(loggedMessages.data).toEqual([
        expect.objectContaining({
          level: Level.DEBUG,
          message: ['debug message'],
        }),
      ]);
    });
  });

  describe('Handler', () => {
    it('handles all levels as default', () => {
      const handler = new Handler();

      expect(handler.isLoggable(Level.ALL)).toEqual(true);
    });

    it('does not handle below level', () => {
      const handler = new Handler();
      handler.level = Level.WARNING;

      expect(handler.isLoggable(Level.ERROR)).toEqual(true);
      expect(handler.isLoggable(Level.WARNING)).toEqual(true);
      expect(handler.isLoggable(Level.INFO)).toEqual(false);
    });
  });

  describe('Simple formatter', () => {
    it('returns 1 line', () => {
      const formatter = new SimpleFormatter();

      const record = new LogRecord(Level.INFO, 'my message');
      record.date = new Date('2024-07-02T11:38:00');
      const s = formatter.format(record);

      expect(s).toEqual('2024-07-02T09:38:00.000Z INFO - my message');
    });

    it('writes logger name', () => {
      const formatter = new SimpleFormatter();

      const record = new LogRecord(Level.INFO, 'my message');
      record.loggerName = 'test-logger';
      record.date = new Date('2024-07-02T11:38:00');
      const s = formatter.format(record);

      expect(s).toEqual(
        '2024-07-02T09:38:00.000Z [test-logger] INFO - my message',
      );
    });

    it('concats messages with space', () => {
      const formatter = new SimpleFormatter();

      const record = new LogRecord(Level.INFO, 'count:', 5);
      record.date = new Date('2024-07-02T11:38:00');
      const s = formatter.format(record);

      expect(s).toEqual('2024-07-02T09:38:00.000Z INFO - count: 5');
    });

    it('stringifies object and array', () => {
      const formatter = new SimpleFormatter();

      const record = new LogRecord(Level.INFO, { foo: 'bar' }, [1, 2, 3]);
      record.date = new Date('2024-07-02T11:38:00');
      const s = formatter.format(record);

      expect(s).toEqual(
        '2024-07-02T09:38:00.000Z INFO - {"foo":"bar"} [1,2,3]',
      );
    });
  });

  describe('JSON formatter', () => {
    it('Returns 1 line', () => {
      const formatter = new JsonFormatter();

      const record = new LogRecord(Level.INFO, 'my message');
      record.date = new Date('2024-07-02T11:38:00');
      const s = formatter.format(record);

      const json = JSON.parse(s);
      expect(json).toEqual({
        date: '2024-07-02T09:38:00.000Z',
        millis: 1719913080000,
        sequence: expect.any(Number),
        level: 'INFO',
        message: 'my message',
      });
    });

    it('Writes logger name', () => {
      const formatter = new JsonFormatter();

      const record = new LogRecord(Level.INFO, 'my message');
      record.loggerName = 'test-logger';
      record.date = new Date('2024-07-02T11:38:00');
      const s = formatter.format(record);

      const json = JSON.parse(s);
      expect(json).toEqual({
        date: '2024-07-02T09:38:00.000Z',
        millis: 1719913080000,
        sequence: expect.any(Number),
        logger: 'test-logger',
        level: 'INFO',
        message: 'my message',
      });
    });

    it('Concats messages with space', () => {
      const formatter = new JsonFormatter();

      const record = new LogRecord(Level.INFO, 'count:', 5);
      record.date = new Date('2024-07-02T11:38:00');
      const s = formatter.format(record);

      const json = JSON.parse(s);
      expect(json).toEqual({
        date: '2024-07-02T09:38:00.000Z',
        millis: 1719913080000,
        sequence: expect.any(Number),
        level: 'INFO',
        message: 'count: 5',
      });
    });

    it('Stringifies object and array', () => {
      const formatter = new JsonFormatter();

      const record = new LogRecord(Level.INFO, { foo: 'bar' }, [1, 2, 3]);
      record.date = new Date('2024-07-02T11:38:00');
      const s = formatter.format(record);

      const json = JSON.parse(s);
      expect(json).toEqual({
        date: '2024-07-02T09:38:00.000Z',
        millis: 1719913080000,
        sequence: expect.any(Number),
        level: 'INFO',
        message: '{"foo":"bar"} [1,2,3]',
      });
    });
  });
});
