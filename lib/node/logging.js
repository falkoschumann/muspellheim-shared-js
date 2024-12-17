// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * @import { LogRecord } from '../logging.js';
 */

import fsPromises from 'node:fs/promises';

import { Handler } from '../logging.js';

/**
 * A `Handler` that writes log messages to a file.
 *
 * @extends {Handler}
 */
export class FileHandler extends Handler {
  #filename;
  #limit;

  /**
   * Initialize a new `FileHandler`.
   *
   * @param {string} filename The name of the file to write log messages to.
   * @param {number} [limit=0] The maximum size of the file in bytes before it
   *   is rotated.
   */
  constructor(filename, limit = 0) {
    super();
    this.#filename = filename;
    this.#limit = limit < 0 ? 0 : limit;
  }

  /** @override  */
  async publish(/** @type {LogRecord} */ record) {
    if (!this.isLoggable(record.level)) {
      return;
    }

    const message = this.formatter.format(record);
    if (this.#limit > 0) {
      try {
        const stats = await fsPromises.stat(this.#filename);
        const fileSize = stats.size;
        const newSize = fileSize + message.length;
        if (newSize > this.#limit) {
          await fsPromises.rm(this.#filename);
        }
      } catch (error) {
        // @ts-ignore NodeJS error code
        if (error.code === 'ENOENT') {
          // ignore error if file does not exist
          console.error(error);
        } else {
          throw error;
        }
      }
    }
    await fsPromises.appendFile(this.#filename, message + '\n');
  }
}
