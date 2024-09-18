import fsPromises from 'node:fs/promises';

import { Handler } from '../logging.js';

export class FileHandler extends Handler {
  #filename;
  #limit;

  constructor(/** @type {string} */ filename, /** @type {number} */ limit = 0) {
    super();
    this.#filename = filename;
    this.#limit = limit < 0 ? 0 : limit;
  }

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
        // ignore error if file does not exist
        if (error.code !== 'ENOENT') {
          console.error(error);
        }
      }
    }
    await fsPromises.appendFile(this.#filename, message + '\n');
  }
}
