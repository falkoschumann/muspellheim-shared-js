/**
 * @import { LongPollingClient } from './long-polling-client.js'
 * @import { SseClient } from './sse-client.js'
 * @import { WebSocketClient } from './web-socket-client.js'
 */

/**
 * An interface for a streaming message client.
 *
 * Emits the following events:
 *
 * - open
 * - message
 * - close
 * - error
 *
 * It is used for wrappers around {@link EventSource} and {@link WebSocket},
 * also for long polling.
 *
 * @interface
 * @see SseClient
 * @see WebSocketClient
 * @see LongPollingClient
 */
export class MessageClient extends EventTarget {
  /**
   * Returns whether the client is connected.
   *
   * @type {boolean}
   * @readonly
   */
  get isConnected() {
    throw new Error('Not implemented.');
  }

  /**
   * Returns the server URL.
   *
   * @type {string}
   * @readonly
   */
  get url() {
    throw new Error('Not implemented.');
  }

  /**
   * Connects to the server.
   *
   * @param {URL | string} url The server URL to connect to.
   */
  async connect(_url) {
    await Promise.reject('Not implemented.');
  }

  /**
   * Sends a message to the server.
   *
   * This is an optional method for streams with bidirectional communication.
   *
   * @param {string} message The message to send.
   * @param {string} type The optional message type.
   */
  async send(_message, _type) {
    await Promise.reject('Not implemented.');
  }

  /**
   * Closes the connection.
   */
  async close() {
    await Promise.reject('Not implemented.');
  }
}
