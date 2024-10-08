import fsPromises from 'node:fs/promises';
import path from 'node:path';

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
   * @param {string} [options.name='application.json'] - the name of the configuration file
   * @param {string[]} [options.location=['.', 'config']] - the locations where to search for the configuration file
   * @returns {ApplicationConfiguration} the new instance
   */
  static create({
    name = 'application.json',
    location = ['.', 'config'],
  } = {}) {
    return new ApplicationConfiguration(name, location, fsPromises);
  }

  /**
   * Creates a nullable of the application configuration.
   *
   * @param {object} options - the configuration options
   * @param {string} [options.name='application.json'] - the name of the configuration file
   * @param {string[]} [options.location=['.', 'config']] - the locations where to search for the configuration file
   * @param {object} [options.files={}] - the files and file content that are available
   */
  static createNull({
    name = 'application.json',
    location = ['.', 'config'],
    files = {},
  } = {}) {
    return new ApplicationConfiguration(name, location, new FsStub(files));
  }

  #name;
  #locations;
  #fs;

  /** @hideconstructor */
  constructor(
    /** @type {string} */ name,
    /** @type {string[]} */ locations,
    /** @type {fsPromises} */ fs,
  ) {
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
        return JSON.parse(content);
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
