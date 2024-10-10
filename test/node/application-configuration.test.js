import { describe, expect, it } from '@jest/globals';
import { ApplicationConfiguration } from '../../lib/node/application-configuration.js';

describe('Application configuration', () => {
  it('loads configuration from default path', async () => {
    const configuration = ApplicationConfiguration.createNull({
      files: {
        'application.json': {
          port: 8080,
          database: { host: 'localhost', port: 5432 },
        },
      },
    });

    const config = await configuration.load();

    expect(config).toEqual({
      port: 8080,
      database: { host: 'localhost', port: 5432 },
    });
  });

  it('loads configuration from subdir', async () => {
    const configuration = ApplicationConfiguration.createNull({
      files: {
        'config/application.json': {
          port: 8080,
          database: { host: 'localhost', port: 5432 },
        },
      },
    });

    const config = await configuration.load();

    expect(config).toEqual({
      port: 8080,
      database: { host: 'localhost', port: 5432 },
    });
  });

  it('returns empty object when configuration file not found', async () => {
    const configuration = ApplicationConfiguration.createNull();

    const config = await configuration.load();

    expect(config).toEqual({});
  });

  it('returns default configuration when configuration file not found', async () => {
    const configuration = ApplicationConfiguration.createNull({
      defaults: {
        port: 8080,
        database: { host: 'localhost', port: 5432 },
      },
    });

    const config = await configuration.load();

    expect(config).toEqual({
      port: 8080,
      database: { host: 'localhost', port: 5432 },
    });
  });

  it('merges default configuration with custom configuration', async () => {
    const configuration = ApplicationConfiguration.createNull({
      defaults: {
        port: 8080,
        database: { host: 'localhost', port: 5432 },
        prod: true,
      },
      files: {
        'application.json': {
          logLevel: 'warning',
          database: { port: 2345 },
        },
      },
    });

    const config = await configuration.load();

    expect(config).toEqual({
      port: 8080,
      logLevel: 'warning',
      database: { host: 'localhost', port: 2345 },
      prod: true,
    });
  });

  it('overrides configuration with environment variable', async () => {
    // TODO split test into multiple tests, e.g. by property type
    const configuration = ApplicationConfiguration.createNull({
      defaults: {
        port: 8080,
        database: { host: 'localhost', port: 5432, useSsl: false },
        logger: { level: 'warning' },
        prod: true,
        optionalValue: 'default',
      },
    });
    process.env.PORT = '3000';
    process.env.DATABASE_PORT = '2345';
    process.env.DATABASE_USESSL = 'true';
    process.env.LOGGER_LEVEL = 'info';
    process.env.PROD = 'false';
    process.env.OPTIONALVALUE = '';

    const config = await configuration.load();

    expect(config).toEqual({
      port: 3000,
      database: { host: 'localhost', port: 2345, useSsl: true },
      logger: { level: 'info' },
      prod: false,
      optionalValue: null,
    });
  });
});
