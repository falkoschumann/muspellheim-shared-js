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

  it('returns empty object if configuration file not found', async () => {
    const configuration = ApplicationConfiguration.createNull();

    const config = await configuration.load();

    expect(config).toEqual({});
  });

  it('merges default configuration with custom configuration', async () => {
    const configuration = ApplicationConfiguration.createNull({
      defaultConfig: {
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

    const config = await configuration.load();

    expect(config).toEqual({
      port: 8080,
      logLevel: 'warning',
      database: { host: 'localhost', port: 2345 },
    });
  });
});
