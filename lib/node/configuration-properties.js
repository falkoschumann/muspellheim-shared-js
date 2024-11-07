// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import fsPromises from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { deepMerge } from '../util.js';

// TODO How to handle optional values? Cast to which type?
// TODO Use JSON schema to validate the configuration?

/**
 * Provide the configuration of an application.
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
 */
export class ConfigurationProperties {
  /**
   * Creates an instance of the application configuration.
   *
   * @param {object} options The configuration options.
   * @param {object} [options.defaults={}] The default configuration.
   * @param {string} [options.prefix=""] The prefix of the properties to get.
   * @param {string} [options.name='application.json'] The name of the
   *   configuration file.
   * @param {string[]} [options.location=['.', 'config']] The locations where to
   *   search for the configuration file.
   * @return {ConfigurationProperties} The new instance.
   */
  static create({
    defaults = {},
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
   * @param {object} options The configuration options.
   * @param {object} [options.defaults={}] The default configuration.
   * @param {string} [options.prefix=""] The prefix of the properties to get.
   * @param {string} [options.name='application.json'] The name of the
   *   configuration file.
   * @param {string[]} [options.location=['.', 'config']] The locations where to
   *   search for the configuration file.
   * @param {object} [options.files={}] The files and file content that are
   *   available.
   */
  static createNull({
    defaults = {},
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

  /**
   * The constructor is for internal use. Use the factory methods instead.
   *
   * @see ConfigurationProperties.create
   * @see ConfigurationProperties.createNull
   */
  constructor(
    /** @type {object} */ defaults,
    /** @type {string} */ prefix,
    /** @type {string} */ name,
    /** @type {string[]} */ locations,
    /** @type {fsPromises} */ fs,
  ) {
    this.#defaults = defaults;
    this.#prefix = prefix;
    this.#name = name;
    this.#locations = locations;
    this.#fs = fs;
  }

  /**
   * Loads the configuration from the file.
   *
   * @return {Promise<object>} The configuration object.
   */
  async get() {
    let config = await this.#loadFile();
    // FIXME copy defaults before merging
    config = deepMerge(this.#defaults, config);
    this.#applyEnvironmentVariables(config);
    // TODO apply command line arguments
    return this.#getSubset(config, this.#prefix);
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

class FsStub {
  #files;

  constructor(files) {
    this.#files = files;
  }

  readFile(path) {
    const fileContent = this.#files[path];
    if (fileContent == null) {
      const err = new Error(`File not found: ${path}`);
      err.code = 'ENOENT';
      throw err;
    }

    if (typeof fileContent === 'string') {
      return fileContent;
    }

    return JSON.stringify(fileContent);
  }
}
