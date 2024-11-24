// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { MessageClient } from './message-client.js';

/**
 * @ignore @typedef {typeof EventSource} EventSourceConstructor
 */

/**
 * A client for the server-sent events protocol.
 *
 * @implements {MessageClient}
 */
export class SseClient extends MessageClient {
  /**
   * Creates a SSE client.
   *
   * @return {SseClient} A new SSE client.
   */
  static create() {
    return new SseClient(EventSource);
  }

  /**
   * Creates a nulled SSE client.
   *
   * @return {SseClient} A new SSE client.
   */
  static createNull() {
    return new SseClient(EventSourceStub);
  }

  #eventSourceConstructor;
  /** @type {EventSource} */ #eventSource;

  /**
   * The constructor is for internal use. Use the factory methods instead.
   *
   * @param {EventSourceConstructor} eventSourceConstructor
   * @see SseClient.create
   * @see SseClient.createNull
   */
  constructor(eventSourceConstructor) {
    super();
    this.#eventSourceConstructor = eventSourceConstructor;
  }

  get isConnected() {
    return this.#eventSource?.readyState === this.#eventSourceConstructor.OPEN;
  }

  get url() {
    return this.#eventSource?.url;
  }

  /**
   * Connects to the server.
   *
   * @param {URL | string} url The server URL to connect to.
   * @param {string} [eventName=message] The optional event type to listen to.
   */

  async connect(url, eventName = 'message') {
    await new Promise((resolve, reject) => {
      if (this.isConnected) {
        reject(new Error('Already connected.'));
        return;
      }

      try {
        this.#eventSource = new this.#eventSourceConstructor(url);
        this.#eventSource.addEventListener('open', (e) => {
          this.#handleOpen(e);
          resolve();
        });
        this.#eventSource.addEventListener(eventName, (e) =>
          this.#handleMessage(e),
        );
        this.#eventSource.addEventListener('error', (e) =>
          this.#handleError(e),
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  async close() {
    await new Promise((resolve, reject) => {
      if (!this.isConnected) {
        resolve();
        return;
      }

      try {
        this.#eventSource.close();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Simulates a message event from the server.
   *
   * @param {string} message The message to receive.
   * @param {string} [eventName=message] The optional event type.
   * @param {string} [lastEventId] The optional last event ID.
   */
  simulateMessage(message, eventName = 'message', lastEventId = undefined) {
    this.#handleMessage(
      new MessageEvent(eventName, { data: message, lastEventId }),
    );
  }

  /**
   * Simulates an error event.
   */
  simulateError() {
    this.#handleError(new Event('error'));
  }

  #handleOpen(event) {
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #handleMessage(event) {
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #handleError(event) {
    this.dispatchEvent(new event.constructor(event.type, event));
  }
}

class EventSourceStub extends EventTarget {
  // The constants have to be defined here because JSDOM is missing EventSource.
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor(url) {
    super();
    this.url = url;
    setTimeout(() => {
      this.readyState = EventSourceStub.OPEN;
      this.dispatchEvent(new Event('open'));
    }, 0);
  }

  close() {
    this.readyState = EventSourceStub.CLOSED;
  }
}
