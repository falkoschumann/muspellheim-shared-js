import process from 'node:process';
import { describe, expect, it } from 'vitest';

import { ConfigurationProperties } from '../../lib/node/configuration-properties.js';

describe('Configuration properties', () => {
  it('loads configuration from default path', async () => {
    const configuration = ConfigurationProperties.createNull({
      files: {
        'application.json': {
          port: 8080,
          database: { host: 'localhost', port: 5432 },
        },
      },
    });

    const config = await configuration.get();

    expect(config).toEqual({
      port: 8080,
      database: { host: 'localhost', port: 5432 },
    });
  });

  it('loads configuration from subdir', async () => {
    const configuration = ConfigurationProperties.createNull({
      files: {
        'config/application.json': {
          port: 8080,
          database: { host: 'localhost', port: 5432 },
        },
      },
    });

    const config = await configuration.get();

    expect(config).toEqual({
      port: 8080,
      database: { host: 'localhost', port: 5432 },
    });
  });

  it('returns empty object when configuration file not found', async () => {
    const configuration = ConfigurationProperties.createNull();

    const config = await configuration.get();

    expect(config).toEqual({});
  });

  it('returns default configuration when configuration file not found', async () => {
    const configuration = ConfigurationProperties.createNull({
      defaults: {
        port: 8080,
        database: { host: 'localhost', port: 5432 },
      },
    });

    const config = await configuration.get();

    expect(config).toEqual({
      port: 8080,
      database: { host: 'localhost', port: 5432 },
    });
  });

  it('merges default configuration with custom configuration', async () => {
    const configuration = ConfigurationProperties.createNull({
      defaults: {
        port: 8080,
        database: { host: 'localhost', port: 5432 },
      },
      files: {
        'application.json': {
          logLevel: 'warning',
          database: { port: 2345 },
        },
      },
    });

    const config = await configuration.get();

    expect(config).toEqual({
      port: 8080,
      logLevel: 'warning',
      database: { host: 'localhost', port: 2345 },
    });
  });

  it('loads configuration subset', async () => {
    const configuration = ConfigurationProperties.createNull({
      files: {
        'application.json': {
          port: 8080,
          database: { host: 'localhost', port: 5432 },
        },
      },
      prefix: 'database',
    });

    const config = await configuration.get();

    expect(config).toEqual({ host: 'localhost', port: 5432 });
  });

  it('loads configuration sub-subset', async () => {
    const configuration = ConfigurationProperties.createNull({
      files: {
        'application.json': {
          a: { b: { c: 42 } },
        },
      },
      prefix: 'a.b',
    });

    const config = await configuration.get();

    expect(config).toEqual({ c: 42 });
  });

  describe('Apply environment variables', () => {
    it('overwrites number value', async () => {
      const { configuration, defaults } = configure();
      process.env.NUMBERVALUE = '42';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, numberValue: 42 });
    });

    it('unsets number value', async () => {
      const { configuration, defaults } = configure();
      process.env.NUMBERVALUE = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, numberValue: null });
    });

    it('overwrites string value', async () => {
      const { configuration, defaults } = configure();
      process.env.STRINGVALUE = 'bar';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, stringValue: 'bar' });
    });

    it('unsets string value', async () => {
      const { configuration, defaults } = configure();
      process.env.STRINGVALUE = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, stringValue: null });
    });

    it('overwrites boolean value', async () => {
      const { configuration, defaults } = configure();
      process.env.BOOLEANVALUE = 'false';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, booleanValue: false });
    });

    it('unsets boolean value', async () => {
      const { configuration, defaults } = configure();
      process.env.BOOLEANVALUE = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, booleanValue: null });
    });

    it('overwrites objects property', async () => {
      const { configuration, defaults } = configure();
      process.env.OBJECTVALUE_KEY = 'other';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, objectValue: { key: 'other' } });
    });

    it('unsets objects property', async () => {
      const { configuration, defaults } = configure();
      process.env.OBJECTVALUE_KEY = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, objectValue: { key: null } });
    });

    it('unsets object', async () => {
      const { configuration, defaults } = configure();
      process.env.OBJECTVALUE = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, objectValue: null });
    });

    it('overwrites an array element', async () => {
      const { configuration, defaults } = configure();
      process.env.ARRAYVALUE_1 = 'b';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, arrayValue: [1, 'b', true] });
    });

    it('overwrites array', async () => {
      const { configuration, defaults } = configure();
      process.env.ARRAYVALUE = '2,b,false';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, arrayValue: ['2', 'b', 'false'] });
    });

    it('unsets array', async () => {
      const { configuration, defaults } = configure();
      process.env.ARRAYVALUE = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, arrayValue: null });
    });

    it('overwrites null value', async () => {
      const { configuration, defaults } = configure();
      process.env.NULLVALUE = '5';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, nullValue: '5' });
    });

    it('unsets null value', async () => {
      const { configuration, defaults } = configure();
      process.env.NULLVALUE = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaults, nullValue: null });
    });
  });
});

function configure({
  defaults = {
    numberValue: 5,
    stringValue: 'foo',
    booleanValue: true,
    objectValue: { key: 'value' },
    arrayValue: [1, 'a', true],
    nullValue: null,
  },
} = {}) {
  delete process.env.NUMBERVALUE;
  delete process.env.STRINGVALUE;
  delete process.env.BOOLEANVALUE;
  delete process.env.OBJECTVALUE;
  delete process.env.OBJECTVALUE_KEY;
  delete process.env.ARRAYVALUE;
  delete process.env.ARRAYVALUE_1;
  delete process.env.NULLVALUE;

  const configuration = ConfigurationProperties.createNull({ defaults });
  return { configuration, defaults };
}
