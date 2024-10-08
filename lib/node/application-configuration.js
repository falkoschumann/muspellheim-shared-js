import fsPromises from 'node:fs/promises';
import path from 'node:path';
import merge from 'lodash/merge.js';

// TODO override configuration with environment variables

/**
 * Provide the configuration of an application.
 *
 * The configuration is read from a JSON file.
 */
export class ApplicationConfiguration {
  /**
   * Creates an instance of the application configuration.
   *
   * @param {object} options - the configuration options
   * @param {object} [options.defaultConfig={}] - the default configuration
   * @param {string} [options.name='application.json'] - the name of the configuration file
   * @param {string[]} [options.location=['.', 'config']] - the locations where to search for the configuration file
   * @returns {ApplicationConfiguration} the new instance
   */
  static create({
    defaultConfig = {},
    name = 'application.json',
    location = ['.', 'config'],
  } = {}) {
    return new ApplicationConfiguration(
      defaultConfig,
      name,
      location,
      fsPromises,
    );
  }

  /**
   * Creates a nullable of the application configuration.
   *
   * @param {object} options - the configuration options
   * @param {object} [options.defaultConfig={}] - the default configuration
   * @param {string} [options.name='application.json'] - the name of the configuration file
   * @param {string[]} [options.location=['.', 'config']] - the locations where to search for the configuration file
   * @param {object} [options.files={}] - the files and file content that are available
   */
  static createNull({
    defaultConfig = {},
    name = 'application.json',
    location = ['.', 'config'],
    files = {},
  } = {}) {
    return new ApplicationConfiguration(
      defaultConfig,
      name,
      location,
      new FsStub(files),
    );
  }

  #defaultConfig;
  #name;
  #locations;
  #fs;

  /** @hideconstructor */
  constructor(
    /** @type {object} */ defaultConfig,
    /** @type {string} */ name,
    /** @type {string[]} */ locations,
    /** @type {fsPromises} */ fs,
  ) {
    this.#defaultConfig = defaultConfig;
    this.#name = name;
    this.#locations = locations;
    this.#fs = fs;
  }

  /**
   * Loads the configuration from the file.
   *
   * @returns {Promise<object>} the configuration object
   */
  async load() {
    for (const location of this.#locations) {
      try {
        const filePath = path.join(location, this.#name);
        const content = await this.#fs.readFile(filePath, 'utf-8');
        const config = JSON.parse(content);
        return merge(this.#defaultConfig, config);
      } catch {
        // Ignore error and try next location
      }
    }

    return {};
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
