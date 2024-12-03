// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import path from 'node:path';
import process from 'node:process';
import { afterEach, describe, expect, it } from 'vitest';

import { ConfigurationProperties } from '../../lib/node/configuration-properties.js';

describe('Configuration properties', () => {
  afterEach(() => {
    delete process.env.CONFIG_NAME;
    delete process.env.CONFIG_LOCATION;
    delete process.argv.CONFIG_NAME;
    delete process.argv.CONFIG_LOCATION;
  });

  it('Loads configuration from file', async () => {
    process.env.CONFIG_NAME = 'configuration.json';
    process.env.CONFIG_LOCATION = path.join(import.meta.dirname, 'data');
    const configuration = ConfigurationProperties.create();

    const config = await configuration.get();

    expect(config).toEqual({
      port: 8080,
      database: { host: 'localhost', port: 5432 },
    });
  });

  it('Does not fail when configuration file does not exist', async () => {
    process.env.CONFIG_NAME = 'configuration-non-existent.json';
    process.env.CONFIG_LOCATION = path.join(import.meta.dirname, 'data');
    const configuration = ConfigurationProperties.create();

    const config = await configuration.get();

    expect(config).toBeNull();
  });

  it('Fails when configuration file is corrupt', async () => {
    process.env.CONFIG_NAME = 'configuration-corrupt.json';
    process.env.CONFIG_LOCATION = path.join(import.meta.dirname, 'data');
    const configuration = ConfigurationProperties.create();

    const config = configuration.get();

    await expect(config).rejects.toThrow(SyntaxError);
  });

  it('Loads configuration from default path', async () => {
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

  it('Loads configuration from subdir', async () => {
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

  it('Returns null when configuration file not found', async () => {
    const configuration = ConfigurationProperties.createNull();

    const config = await configuration.get();

    expect(config).toBeNull();
  });

  it('Returns default configuration when configuration file not found', async () => {
    const configuration = ConfigurationProperties.createNull({
      defaultProperties: {
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

  it('Merges file configuration into default configuration', async () => {
    const configuration = ConfigurationProperties.createNull({
      defaultProperties: {
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

  it('Loads configuration subset', async () => {
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

  it('Loads configuration sub-subset', async () => {
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
    it('Overwrites number value', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.NUMBERVALUE = '42';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, numberValue: 42 });
    });

    it('Unsets number value', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.NUMBERVALUE = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, numberValue: null });
    });

    it('Overwrites string value', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.STRINGVALUE = 'bar';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, stringValue: 'bar' });
    });

    it('Unsets string value', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.STRINGVALUE = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, stringValue: null });
    });

    it('Overwrites boolean value', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.BOOLEANVALUE = 'false';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, booleanValue: false });
    });

    it('Unsets boolean value', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.BOOLEANVALUE = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, booleanValue: null });
    });

    it('Overwrites objects property', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.OBJECTVALUE_KEY = 'other';

      const config = await configuration.get();

      expect(config).toEqual({
        ...defaultProperties,
        objectValue: { key: 'other' },
      });
    });

    it('Unsets objects property', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.OBJECTVALUE_KEY = '';

      const config = await configuration.get();

      expect(config).toEqual({
        ...defaultProperties,
        objectValue: { key: null },
      });
    });

    it('Unsets object', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.OBJECTVALUE = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, objectValue: null });
    });

    it('Overwrites an array element', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.ARRAYVALUE_1 = 'b';

      const config = await configuration.get();

      expect(config).toEqual({
        ...defaultProperties,
        arrayValue: [1, 'b', true],
      });
    });

    it('Overwrites array', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.ARRAYVALUE = '2,b,false';

      const config = await configuration.get();

      expect(config).toEqual({
        ...defaultProperties,
        arrayValue: ['2', 'b', 'false'],
      });
    });

    it('Unsets array', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.ARRAYVALUE = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, arrayValue: null });
    });

    it('Overwrites null value', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.NULLVALUE = '5';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, nullValue: '5' });
    });

    it('Unsets null value', async () => {
      const { configuration, defaultProperties } = configure();
      process.env.NULLVALUE = '';

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, nullValue: null });
    });
  });

  describe('Apply command line arguments', () => {
    it('Overwrites number value', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--numberValue=42');

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, numberValue: 42 });
    });

    it('Unsets number value', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--numberValue=');

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, numberValue: null });
    });

    it('Overwrites string value', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--stringValue=bar');

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, stringValue: 'bar' });
    });

    it('Unsets string value', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--stringValue=');

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, stringValue: null });
    });

    it('Overwrites boolean value', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--booleanValue=false');

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, booleanValue: false });
    });

    it('Unsets boolean value', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--booleanValue=');

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, booleanValue: null });
    });

    it('Overwrites objects property', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--objectValue.key=other');

      const config = await configuration.get();

      expect(config).toEqual({
        ...defaultProperties,
        objectValue: { key: 'other' },
      });
    });

    it('Unsets objects property', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--objectValue.key=');

      const config = await configuration.get();

      expect(config).toEqual({
        ...defaultProperties,
        objectValue: { key: null },
      });
    });

    it('Unsets object', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--objectValue=');

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, objectValue: null });
    });

    it.skip('Overwrites an array element', async () => {
      // TODO Implement array element
      const { configuration, defaultProperties } = configure();
      process.argv.push('--arrayValue[1]=b');

      const config = await configuration.get();

      expect(config).toEqual({
        ...defaultProperties,
        arrayValue: [1, 'b', true],
      });
    });

    it('Overwrites array', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--arrayValue=2,b,false');

      const config = await configuration.get();

      expect(config).toEqual({
        ...defaultProperties,
        arrayValue: ['2', 'b', 'false'],
      });
    });

    it('Unsets array', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--arrayValue=');

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, arrayValue: null });
    });

    it('Overwrites null value', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--nullValue=5');

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, nullValue: '5' });
    });

    it('Unsets null value', async () => {
      const { configuration, defaultProperties } = configure();
      process.argv.push('--nullValue=');

      const config = await configuration.get();

      expect(config).toEqual({ ...defaultProperties, nullValue: null });
    });
  });
});

function configure({
  defaultProperties = {
    numberValue: 5,
    stringValue: 'foo',
    booleanValue: true,
    objectValue: { key: 'value' },
    arrayValue: [1, 'a', true],
    nullValue: null,
  },
} = {}) {
  process.argv = process.argv.slice(0, 2);

  delete process.env.NUMBERVALUE;
  delete process.env.STRINGVALUE;
  delete process.env.BOOLEANVALUE;
  delete process.env.OBJECTVALUE;
  delete process.env.OBJECTVALUE_KEY;
  delete process.env.ARRAYVALUE;
  delete process.env.ARRAYVALUE_1;
  delete process.env.NULLVALUE;

  const configuration = ConfigurationProperties.createNull({
    defaultProperties,
  });
  return { configuration, defaultProperties };
}
