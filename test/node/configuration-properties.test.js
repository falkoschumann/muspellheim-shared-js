import { describe, expect, it } from '@jest/globals';

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

  it('overrides configuration with environment variable', async () => {
    // TODO split test into multiple tests, e.g. by property type
    const configuration = ConfigurationProperties.createNull({
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

    const config = await configuration.get();

    expect(config).toEqual({
      port: 3000,
      database: { host: 'localhost', port: 2345, useSsl: true },
      logger: { level: 'info' },
      prod: false,
      optionalValue: null,
    });
  });
});
