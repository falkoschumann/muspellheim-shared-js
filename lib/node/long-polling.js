/**
 * @import * as express from 'express'
 */

import * as handler from './handler.js';

export class LongPolling {
  #version = 0;
  #waiting = [];
  #getData;

  constructor(/** @type {function(): Promise<*>} */ getData) {
    this.#getData = getData;
  }

  async poll(
    /** @type {express.Request} */ request,
    /** @type {express.Response} */ response,
  ) {
    if (this.#isCurrentVersion(request)) {
      const responseData = await this.#tryLongPolling(request);
      handler.reply(response, responseData);
    } else {
      const responseData = await this.#getResponse();
      handler.reply(response, responseData);
    }
  }

  async send() {
    this.#version++;
    const response = await this.#getResponse();
    this.#waiting.forEach((resolve) => resolve(response));
    this.#waiting = [];
  }

  #isCurrentVersion(/** @type {express.Request} */ request) {
    const tag = /"(.*)"/.exec(request.get('If-None-Match'));
    return tag && tag[1] === String(this.#version);
  }

  #tryLongPolling(/** @type {express.Request} */ request) {
    const time = this.#getPollingTime(request);
    if (time == null) {
      return { status: 304 };
    }

    return this.#waitForChange(time);
  }

  #getPollingTime(/** @type {express.Request} */ request) {
    const wait = /\bwait=(\d+)/.exec(request.get('Prefer'));
    return wait != null ? Number(wait[1]) : null;
  }

  #waitForChange(/** @type {number} */ time) {
    return new Promise((resolve) => {
      this.#waiting.push(resolve);
      setTimeout(() => {
        if (this.#waiting.includes(resolve)) {
          this.#waiting = this.#waiting.filter((r) => r !== resolve);
          resolve({ status: 304 });
        }
      }, time * 1000);
    });
  }

  async #getResponse() {
    const data = await this.#getData();
    const body = JSON.stringify(data);
    return {
      headers: {
        'Content-Type': 'application/json',
        ETag: `"${this.#version}"`,
        'Cache-Control': 'no-store',
      },
      body,
    };
  }
}
