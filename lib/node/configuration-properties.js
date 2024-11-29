// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Provide the configuration of an application.
 *
 * The sources in order of priority:
 *
 * 1. JSON file
 * 2. Environment variables
 * 3. Command line arguments
 *
 * @module
 */

import fsPromises from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { deepMerge } from '../util.js';

// TODO How to handle optional values? Cast to which type?
// TODO Use JSON schema to validate the configuration?

/**
 * Reads the configuration from file and environment variables.
 *
 * The configuration is read from a JSON file `application.json` from the
 * working directory. Can be configured with `config.name`, `config.location`.
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
 *   defaultProperties: {
 *       port: 8080,
 *       database: { host: 'localhost', port: 5432 },
 *   },
 * });
 * const config = await configuration.get();
 * ```
 *
 * @template T
 */
export class ConfigurationProperties {
  /**
   * Creates an instance of the application configuration.
   *
   * @template T
   * @param {object} options The configuration options.
   * @param {T} [options.defaultProperties=null] The default configuration.
   * @param {string} [options.prefix=""] The prefix of the properties to get.
   * @return {ConfigurationProperties<T>} The new instance.
   */
  static create({ defaultProperties = null, prefix = '' } = {}) {
    return new ConfigurationProperties(defaultProperties, prefix, fsPromises);
  }

  /**
   * Creates a nullable of the application configuration.
   *
   * @template T
   * @param {object} options The configuration options.
   * @param {T} [options.defaultProperties=null] The default configuration.
   * @param {string} [options.prefix=""] The prefix of the properties to get.
   * @param {object} [options.files={}] The files and file content that are
   *   available.
   * @return {ConfigurationProperties<T>} The new instance.
   */
  static createNull({
    defaultProperties = null,
    prefix = '',
    files = {},
  } = {}) {
    return new ConfigurationProperties(
      defaultProperties,
      prefix,
      new FsStub(files),
    );
  }

  /** @type {T} */
  #defaultProperties;

  /** @type {string} */
  #prefix;

  /** @type {fsPromises} */
  #fs;

  /** @type {T} */
  #cached;

  /**
   * The constructor is for internal use. Use the factory methods instead.
   *
   * @param {T} defaultProperties
   * @param {string} prefix
   * @param {fsPromises} fs
   * @see ConfigurationProperties.create
   * @see ConfigurationProperties.createNull
   */
  constructor(defaultProperties, prefix, fs) {
    this.#defaultProperties = defaultProperties;
    this.#prefix = prefix;
    this.#fs = fs;
  }

  /**
   * Loads the configuration from the file.
   *
   * @return {Promise<T>} The configuration object.
   */
  async get() {
    if (this.#cached) {
      return this.#cached;
    }

    // TODO Interpret placeholders like ${foo.bar}
    // TODO Interpret placeholders with default value like ${foo.bar:default}

    let config = await this.#loadFile();
    config = deepMerge(this.#defaultProperties, config);
    // TODO apply environment variable APPLICATION_JSON as JSON string
    this.#applyVariables(config, getEnv);
    this.#applyVariables(config, getArg);
    this.#cached = this.#getSubset(config, this.#prefix);
    return this.#cached;
  }

  async #loadFile() {
    // TODO read config.name and config.location from env and args
    const name = 'application.json';
    const locations = ['.', 'config'];
    let config = {};
    for (const location of locations) {
      try {
        const filePath = path.join(location, name);
        const content = await this.#fs.readFile(filePath, 'utf-8');
        config = JSON.parse(content);
        break;
      } catch (err) {
        // @ts-ignore NodeJS error code
        if (err.code === 'ENOENT') {
          // ignore file not found
          continue;
        }

        throw err;
      }
    }
    return config;
  }

  #applyVariables(config, getValue, path) {
    // handle object
    // handle array
    // handle string
    // handle number
    // handle boolean (true, false)
    // handle null (empty string set the value to null)
    // if value is undefined, keep the default value
    for (const key in config) {
      if (typeof config[key] === 'boolean') {
        const value = getValue(key, path);
        if (value === null) {
          config[key] = null;
        } else if (value) {
          config[key] = value.toLowerCase() === 'true';
        }
      } else if (typeof config[key] === 'number') {
        const value = getValue(key, path);
        if (value === null) {
          config[key] = null;
        } else if (value) {
          config[key] = Number(value);
        }
      } else if (typeof config[key] === 'string') {
        const value = getValue(key, path);
        if (value === null) {
          config[key] = null;
        } else if (value) {
          config[key] = String(value);
        }
      } else if (config[key] === null) {
        const value = getValue(key, path);
        if (value === null) {
          config[key] = null;
        } else if (value) {
          config[key] = value;
        }
      } else if (typeof config[key] === 'object') {
        const value = getValue(key, path);
        if (value === null) {
          config[key] = null;
        } else if (Array.isArray(config[key]) && value) {
          config[key] = value.split(',');
        } else {
          this.#applyVariables(config[key], getValue, key);
        }
      } else {
        throw new Error(`Unsupported type: ${typeof config[key]}`);
      }
    }
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

function getEnv(key, path = '') {
  if (path) {
    key = `${path}_${key}`;
  }
  key = key.toUpperCase();
  const value = process.env[key];
  if (value === '') {
    return null;
  }
  return value;
}

function getArg(key, path = '') {
  if (path) {
    key = `${path}.${key}`;
  }
  key = `--${key}=`;
  const keyValue = process.argv.find((arg) => arg.startsWith(key));
  if (keyValue == null) {
    return;
  }

  const [, value] = keyValue.split('=');
  if (value === '') {
    return null;
  }
  return value;
}

/**
 * @ignore
 */
class FsStub {
  /** @type {Record<string, string>} */
  #files;

  /**
   * @param {Record<string, string>} files
   */
  constructor(files) {
    this.#files = files;
  }

  readFile(path) {
    const fileContent = this.#files[path];
    if (fileContent == null) {
      const err = new Error(`No such file or directory`);
      // @ts-ignore NodeJS error code
      err.code = 'ENOENT';
      throw err;
    }

    return JSON.stringify(fileContent);
  }
}
