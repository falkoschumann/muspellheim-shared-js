import { ConfigurableResponses } from './configurable-responses.js';
import { MessageClient } from './message-client.js';
import { OutputTracker } from './output-tracker.js';
import { sleep } from './timer.js';

const REQUEST_SENT_EVENT = 'request-sent';

/**
 * A client handling long polling a HTTP request.
 *
 * @implements {MessageClient}
 */
export class LongPollingClient extends MessageClient {
  /**
   * Creates a long polling client.
   *
   * @param {object} options
   * @param {number} [options.wait=90000] The wait interval for a response.
   * @param {number} [options.retry=1000] The retry interval after an error.
   * @returns {LongPollingClient} A new long polling client.
   */
  static create({ wait = 90000, retry = 1000 } = {}) {
    return new LongPollingClient(
      wait,
      retry,
      globalThis.fetch.bind(globalThis),
    );
  }

  /**
   * Creates a nulled long polling client.
   *
   * @param {object} options
   * @returns {LongPollingClient} A new nulled long polling client.
   */
  static createNull(
    {
      fetchResponse = {
        status: 304,
        statusText: 'Not Modified',
        headers: undefined,
        body: null,
      },
    } = {},
  ) {
    return new LongPollingClient(90000, 0, createFetchStub(fetchResponse));
  }

  #wait;
  #retry;
  #fetch;
  #connected;
  #aboutController;
  #url;
  #tag;

  /**
   * The constructor is for internal use. Use the factory methods instead.
   *
   * @see LongPollingClient.create
   * @see LongPollingClient.createNull
   */
  constructor(
    /** @type {number} */ wait,
    /** @type {number} */ retry,
    /** @type {fetch} */ fetchFunc,
  ) {
    super();
    this.#wait = wait;
    this.#retry = retry;
    this.#fetch = fetchFunc;
    this.#connected = false;
    this.#aboutController = new AbortController();
  }

  get isConnected() {
    return this.#connected;
  }

  get url() {
    return this.#url;
  }

  async connect(url) {
    if (this.isConnected) {
      throw new Error('Already connected.');
    }

    this.#url = url;
    this.#startPolling();
    this.dispatchEvent(new Event('open'));
    await Promise.resolve();
  }

  /**
   * Returns a tracker for requests sent.
   *
   * @returns {OutputTracker} A new output tracker.
   */
  trackRequestSent() {
    return OutputTracker.create(this, REQUEST_SENT_EVENT);
  }

  async close() {
    this.#aboutController.abort();
    this.#connected = false;
    await Promise.resolve();
  }

  async #startPolling() {
    this.#connected = true;
    while (this.isConnected) {
      try {
        const headers = { Prefer: `wait=${this.#wait / 1000}` };
        if (this.#tag) {
          headers['If-None-Match'] = this.#tag;
        }
        this.dispatchEvent(
          new CustomEvent(REQUEST_SENT_EVENT, { detail: { headers } }),
        );
        const response = await this.#fetch(this.#url, {
          headers,
          signal: this.#aboutController.signal,
        });
        await this.#handleResponse(response);
      } catch (error) {
        if (error.name === 'AbortError') {
          break;
        } else {
          this.#handleError(error);
        }
      }
    }
  }

  async #handleResponse(/** @type {Response} */ response) {
    if (response.status === 304) {
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    this.#tag = response.headers.get('ETag');
    const message = await response.text();
    this.dispatchEvent(new MessageEvent('message', { data: message }));
  }

  #handleError(error) {
    console.error(error);
    this.dispatchEvent(new Event('error'));
  }
}

function createFetchStub(response) {
  const responses = ConfigurableResponses.create(response);
  return async (_url, options) => {
    await sleep(0);
    return new Promise((resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject());
      const res = responses.next();
      resolve(
        new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        }),
      );
    });
  };
}
