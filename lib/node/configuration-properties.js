import fsPromises from 'node:fs/promises';
import path from 'node:path';
import _ from 'lodash';

// TODO Add parameter `prefix` to the constructor
// TODO override configuration with environment variables

/**
 * Provide the configuration of an application.
 *
 * The configuration is read from a JSON file.
 */
export class ConfigurationProperties {
  /**
   * Creates an instance of the application configuration.
   *
   * @param {object} options - the configuration options
   * @param {object} [options.defaults={}] - the default configuration
   * @param {string} [options.name='application.json'] - the name of the configuration file
   * @param {string[]} [options.location=['.', 'config']] - the locations where to search for the configuration file
   * @returns {ConfigurationProperties} the new instance
   */
  static create({
    defaults = {},
    name = 'application.json',
    location = ['.', 'config'],
  } = {}) {
    return new ConfigurationProperties(defaults, name, location, fsPromises);
  }

  /**
   * Creates a nullable of the application configuration.
   *
   * @param {object} options - the configuration options
   * @param {object} [options.defaults={}] - the default configuration
   * @param {string} [options.name='application.json'] - the name of the configuration file
   * @param {string[]} [options.location=['.', 'config']] - the locations where to search for the configuration file
   * @param {object} [options.files={}] - the files and file content that are available
   */
  static createNull({
    defaults = {},
    name = 'application.json',
    location = ['.', 'config'],
    files = {},
  } = {}) {
    return new ConfigurationProperties(
      defaults,
      name,
      location,
      new FsStub(files),
    );
  }

  #defaults;
  #name;
  #locations;
  #fs;

  /** @hideconstructor */
  constructor(
    /** @type {object} */ defaults,
    /** @type {string} */ name,
    /** @type {string[]} */ locations,
    /** @type {fsPromises} */ fs,
  ) {
    this.#defaults = defaults;
    this.#name = name;
    this.#locations = locations;
    this.#fs = fs;
  }

  /**
   * Loads the configuration from the file.
   *
   * @returns {Promise<object>} the configuration object
   */
  async get() {
    let config = await this.#loadFile();
    config = _.merge(this.#defaults, config);
    this.#applyEnvironmentVariables(config);
    // TODO apply command line arguments
    return config;
  }

  async #loadFile() {
    let config = {};
    for (const location of this.#locations) {
      try {
        const filePath = path.join(location, this.#name);
        const content = await this.#fs.readFile(filePath, 'utf-8');
        config = JSON.parse(content);
        break;
      } catch {
        // Ignore error and try next location
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
    // TODO How to handle optional values? Cast to which type?
    // TODO Use JSON schema to validate the configuration?
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
}

class FsStub {
  #files;

  constructor(files) {
    this.#files = files;
  }

  async readFile(path) {
    const fileContent = this.#files[path];
    if (fileContent == null) {
      throw new Error(`File not found: ${path}`);
    }

    if (typeof fileContent === 'string') {
      return fileContent;
    }

    return JSON.stringify(fileContent);
  }
}
