/**
 * @import http from 'node:http'
 */

/**
 * An object for sending
 * [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).
 */
export class SseEmitter {
  /** @type {?number} */ #timeout;
  /** @type {http.ServerResponse|undefined} */ #response;

  /**
   * Creates a new SSE emitter with an optional timeout.
   *
   * @param {number} [timeout] - the timeout in milliseconds after which the connection will be closed
   */
  constructor(timeout) {
    this.#timeout = timeout;
  }

  /**
   * The timeout in milliseconds after which the connection will be closed or
   * undefined if no timeout is set.
   *
   * @type {number|undefined}
   */
  get timeout() {
    return this.#timeout;
  }

  /**
   * Sets and extends the response object for sending Server-Sent Events.
   *
   * @param {http.ServerResponse} outputMessage - the response object to use
   */
  extendResponse(outputMessage) {
    // TODO check HTTP version, is it HTTP/2 when using EventSource?
    outputMessage.statusCode = 200;
    this.#response = outputMessage
      .setHeader('Content-Type', 'text/event-stream')
      .setHeader('Cache-Control', 'no-cache')
      .setHeader('Keep-Alive', 'timeout=60')
      .setHeader('Connection', 'keep-alive');

    if (this.timeout != null) {
      const timeoutId = setTimeout(() => this.#close(), this.timeout);
      this.#response.addListener('close', () => clearTimeout(timeoutId));
    }
  }

  /**
   * Sends a SSE event.
   *
   * @param {object} event - the event to send
   * @param {string} [event.id] - add a SSE "id" line
   * @param {string} [event.name] - add a SSE "event" line
   * @param {number} [event.reconnectTime] - add a SSE "retry" line
   * @param {string} [event.comment] - add a SSE "comment" line
   * @param {string|object} event.data] - add a SSE "data" line
   */
  send({ id, name, reconnectTime, comment, data } = {}) {
    if (comment != null) {
      this.#response.write(`: ${comment}\n`);
    }

    if (name != null) {
      this.#response.write(`event: ${name}\n`);
    }

    if (data != null) {
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      } else {
        data = String(data).replaceAll('\n', '\ndata: ');
      }
      this.#response.write(`data: ${data}\n`);
    }

    if (id != null) {
      this.#response.write(`id: ${id}\n`);
    }

    if (reconnectTime != null) {
      this.#response.write(`retry: ${reconnectTime}\n`);
    }

    this.#response.write('\n');
  }

  /**
   * Simulates a timeout.
   */
  simulateTimeout() {
    this.#close();
  }

  #close() {
    this.#response.end();
  }
}
