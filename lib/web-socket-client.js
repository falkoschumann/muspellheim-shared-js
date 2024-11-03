import { MessageClient } from './message-client.js';
import { OutputTracker } from './output-tracker.js';
import { Timer, TimerTask } from './timer.js';

export const HEARTBEAT_TYPE = 'heartbeat';

const MESSAGE_SENT_EVENT = 'message-sent';

/**
 * A client for the WebSocket protocol.
 *
 * Emits the following events:
 *
 * - open, {@link Event}
 * - message, {@link MessageEvent}
 * - error, {@link Event}
 * - close, {@link CloseEvent}
 *
 * @implements {MessageClient}
 */
export class WebSocketClient extends MessageClient {
  // TODO Recover connection with timeout after an error event.

  /**
   * Creates a WebSocket client.
   *
   * @param {object} options
   * @param {number} [options.heartbeat=30000] The heartbeat interval i
   *   milliseconds. A value <= 0 disables the heartbeat.
   * @returns {WebSocketClient} A new WebSocket client.
   */
  static create({ heartbeat = 30000 } = {}) {
    return new WebSocketClient(heartbeat, Timer.create(), WebSocket);
  }

  /**
   * Creates a nulled WebSocket client.
   *
   * @param {object} options
   * @param {number} [options.heartbeat=-1] The heartbeat interval in
   *   milliseconds. A value <= 0 disables the heartbeat.
   * @returns {WebSocketClient} A new nulled WebSocket client.
   */
  static createNull({ heartbeat = -1 } = {}) {
    return new WebSocketClient(heartbeat, Timer.createNull(), WebSocketStub);
  }

  #heartbeat;
  #timer;
  #webSocketConstructor;
  /** @type {WebSocket} */ #webSocket;

  /**
   * The constructor is for internal use. Use the factory methods instead.
   *
   * @see WebSocketClient.create
   * @see WebSocketClient.createNull
   */
  constructor(
    /** @type {number} */ heartbeat,
    /** @type {Timer} */ timer,
    /** @type {function(new:WebSocket)} */ webSocketConstructor,
  ) {
    super();
    this.#heartbeat = heartbeat;
    this.#timer = timer;
    this.#webSocketConstructor = webSocketConstructor;
  }

  get isConnected() {
    return this.#webSocket?.readyState === WebSocket.OPEN;
  }

  get url() {
    return this.#webSocket?.url;
  }

  async connect(/** @type {string | URL} */ url) {
    await new Promise((resolve, reject) => {
      if (this.isConnected) {
        reject(new Error('Already connected.'));
        return;
      }

      try {
        this.#webSocket = new this.#webSocketConstructor(url);
        this.#webSocket.addEventListener('open', (e) => {
          this.#handleOpen(e);
          resolve();
        });
        this.#webSocket.addEventListener(
          'message',
          (e) => this.#handleMessage(e),
        );
        this.#webSocket.addEventListener('close', (e) => this.#handleClose(e));
        this.#webSocket.addEventListener('error', (e) => this.#handleError(e));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sends a message to the server.
   *
   * @param {string} message The message to send.
   */
  send(message) {
    this.#webSocket.send(message);
    this.dispatchEvent(
      new CustomEvent(MESSAGE_SENT_EVENT, { detail: message }),
    );
  }

  /**
   * Returns a tracker for messages sent.
   *
   * @returns {OutputTracker} A new output tracker.
   */
  trackMessageSent() {
    return OutputTracker.create(this, MESSAGE_SENT_EVENT);
  }

  /**
   * Closes the connection.
   *
   * If a code is provided, also a reason should be provided.
   *
   * @param {number} code An optional code.
   * @param {string} reason An optional reason.
   */
  async close(code, reason) {
    await new Promise((resolve) => {
      if (!this.isConnected) {
        resolve();
        return;
      }

      this.#webSocket.addEventListener('close', () => resolve());
      this.#webSocket.close(code, reason);
    });
  }

  /**
   * Simulates a message event from the server.
   *
   * @param {string} message The message to receive.
   */
  simulateMessage(message) {
    this.#handleMessage(new MessageEvent('message', { data: message }));
  }

  /**
   * Simulates a heartbeat.
   */
  simulateHeartbeat() {
    this.#timer.simulateTaskExecution({ ticks: this.#heartbeat });
  }

  /**
   * Simulates a close event.
   *
   * @param {number} code An optional code.
   * @param {string} reason An optional reason.
   */
  simulateClose(code, reason) {
    this.#handleClose(new CloseEvent('close', { code, reason }));
  }

  /**
   * Simulates an error event.
   */
  simulateError() {
    this.#handleError(new Event('error'));
  }

  #handleOpen(event) {
    this.dispatchEvent(new event.constructor(event.type, event));
    this.#startHeartbeat();
  }

  #handleMessage(event) {
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #handleClose(event) {
    this.#stopHeartbeat();
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #handleError(event) {
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #startHeartbeat() {
    if (this.#heartbeat <= 0) {
      return;
    }

    this.#timer.scheduleAtFixedRate(
      new HeartbeatTask(this),
      this.#heartbeat,
      this.#heartbeat,
    );
  }

  #stopHeartbeat() {
    this.#timer.cancel();
  }
}

class HeartbeatTask extends TimerTask {
  #client;

  constructor(/** @type {WebSocketClient} */ client) {
    super();
    this.#client = client;
  }

  run() {
    this.#client.send(HEARTBEAT_TYPE);
  }
}

class WebSocketStub extends EventTarget {
  readyState = WebSocket.CONNECTING;

  constructor(url) {
    super();
    this.url = url;
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.dispatchEvent(new Event('open'));
    }, 0);
  }

  send() {}

  close() {
    this.readyState = WebSocket.CLOSED;
    this.dispatchEvent(new Event('close'));
  }
}
