// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * Provide the configuration of an application.
 *
 * Sources are:
 *
 * - JSON file
 * - Environment variables
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
 * Reds the configuration from file and environment variables.
 *
 * The configuration is read from a JSON file `application.json` from the
 * working directory.
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
 *   defaults: {
 *       port: 8080,
 *       database: { host: 'localhost', port: 5432 },
 *   },
 * });
 * const config = await configuration.get();
 * ```
 *
 * @template {object|array|string|number|boolean|null} T
 */
export class ConfigurationProperties {
  /**
   * Creates an instance of the application configuration.
   *
   * @template {object|array|string|number|boolean|null} T
   * @param {object} options The configuration options.
   * @param {T} [options.defaults=null] The default configuration.
   * @param {string} [options.prefix=""] The prefix of the properties to get.
   * @param {string} [options.name='application.json'] The name of the
   *   configuration file.
   * @param {string[]} [options.location=['.', 'config']] The locations where to
   *   search for the configuration file.
   * @return {ConfigurationProperties<T>} The new instance.
   */
  static create({
    defaults = null,
    prefix = '',
    name = 'application.json',
    location = ['.', 'config'],
  } = {}) {
    return new ConfigurationProperties(
      defaults,
      prefix,
      name,
      location,
      fsPromises,
    );
  }

  /**
   * Creates a nullable of the application configuration.
   *
   * @template {object|array|string|number|boolean|null} T
   * @param {object} options The configuration options.
   * @param {T} [options.defaults=null] The default configuration.
   * @param {string} [options.prefix=""] The prefix of the properties to get.
   * @param {string} [options.name='application.json'] The name of the
   *   configuration file.
   * @param {string[]} [options.location=['.', 'config']] The locations where to
   *   search for the configuration file.
   * @param {object} [options.files={}] The files and file content that are
   *   available.
   * @return {ConfigurationProperties<T>} The new instance.
   */
  static createNull({
    defaults = null,
    prefix = '',
    name = 'application.json',
    location = ['.', 'config'],
    files = {},
  } = {}) {
    return new ConfigurationProperties(
      defaults,
      prefix,
      name,
      location,
      new FsStub(files),
    );
  }

  #defaults;
  #prefix;
  #name;
  #locations;
  #fs;

  /** @type {T} */ #cached;

  /**
   * The constructor is for internal use. Use the factory methods instead.
   *
   * @param {T} defaults
   * @param {string} prefix
   * @param {string} name
   * @param {string[]} locations
   * @param {fsPromises} fs
   * @see ConfigurationProperties.create
   * @see ConfigurationProperties.createNull
   */
  constructor(defaults, prefix, name, locations, fs) {
    this.#defaults = defaults;
    this.#prefix = prefix;
    this.#name = name;
    this.#locations = locations;
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

    let config = await this.#loadFile();
    // FIXME deep copy defaults before merging
    config = deepMerge(this.#defaults, config);
    this.#applyEnvironmentVariables(config);
    // TODO apply command line arguments
    this.#cached = config = this.#getSubset(config, this.#prefix);
    return this.#cached;
  }

  async #loadFile() {
    let config = {};
    for (const location of this.#locations) {
      try {
        const filePath = path.join(location, this.#name);
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

  #applyEnvironmentVariables(config, path) {
    // handle object
    // handle array
    // handle string
    // handle number
    // handle boolean (true, false)
    // handle null (empty env var set the value to null)
    // if env var is undefined, keep the default value
    for (const key in config) {
      if (typeof config[key] === 'boolean') {
        const value = this.#getEnv(key, path);
        if (value === null) {
          config[key] = null;
        } else if (value) {
          config[key] = value.toLowerCase() === 'true';
        }
      } else if (typeof config[key] === 'number') {
        const value = this.#getEnv(key, path);
        if (value === null) {
          config[key] = null;
        } else if (value) {
          config[key] = Number(value);
        }
      } else if (typeof config[key] === 'string') {
        const value = this.#getEnv(key, path);
        if (value === null) {
          config[key] = null;
        } else if (value) {
          config[key] = String(value);
        }
      } else if (config[key] === null) {
        const value = this.#getEnv(key, path);
        if (value === null) {
          config[key] = null;
        } else if (value) {
          config[key] = value;
        }
      } else if (typeof config[key] === 'object') {
        const value = this.#getEnv(key, path);
        if (value === null) {
          config[key] = null;
        } else if (Array.isArray(config[key]) && value) {
          config[key] = value.split(',');
        } else {
          this.#applyEnvironmentVariables(config[key], key);
        }
      } else {
        throw new Error(`Unsupported type: ${typeof config[key]}`);
      }
    }
  }

  #getEnv(key, path = '') {
    let envKey = key;
    if (path) {
      envKey = `${path}_${envKey}`;
    }
    envKey = envKey.toUpperCase();
    const value = process.env[envKey];
    if (value === '') {
      return null;
    }
    return value;
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

/**
 * @ignore
 */
class FsStub {
  #files;

  /**
   * @param {Record<string, string>} files
   */
  constructor(files) {
    this.#files = files;
  }

  /**
   * @param {string} path
   */
  readFile(path) {
    const fileContent = this.#files[path];
    if (fileContent == null) {
      const err = new Error(`File not found: ${path}`);
      // @ts-ignore NodeJS error code
      err.code = 'ENOENT';
      throw err;
    }

    if (typeof fileContent === 'string') {
      return fileContent;
    }

    return JSON.stringify(fileContent);
  }
}
