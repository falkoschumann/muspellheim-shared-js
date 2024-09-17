export class WebSocketClient extends EventTarget {
  static create() {
    return new WebSocketClient(WebSocket);
  }

  static createNull() {
    return new WebSocketClient(WebSocketStub);
  }

  isHeartbeatEnabled = true;

  #webSocketConstructor;
  /** @type {WebSocket} */ #webSocket;
  #heartbeatId;

  constructor(/** @type {typeof WebSocket} */ webSocketConstructor) {
    super();
    this.#webSocketConstructor = webSocketConstructor;
  }

  get isConnected() {
    return this.#webSocket?.readyState === this.#webSocketConstructor.OPEN;
  }

  connect(/** @type {string | URL} */ url) {
    return new Promise((resolve, reject) => {
      try {
        this.#webSocket = new this.#webSocketConstructor(url);
        this.#webSocket.onmessage = (event) =>
          this.dispatchEvent(new event.constructor(event.type, event));
        this.#webSocket.onclose = (event) => {
          this.dispatchEvent(new event.constructor(event.type, event));
          this.#stopHeartbeat();
        };
        this.#webSocket.onerror = (event) =>
          this.dispatchEvent(new event.constructor(event.type, event));
        this.#webSocket.onopen = (event) => {
          this.dispatchEvent(new event.constructor(event.type, event));
          this.#startHeartbeat();
          resolve();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      function closeHandler() {
        this.removeEventListener('close', closeHandler);
        resolve();
      }

      try {
        this.addEventListener('close', closeHandler);
        this.#webSocket.close(1000, 'user request');
      } catch (error) {
        reject(error);
      }
    });
  }

  send(message) {
    this.#webSocket.send(JSON.stringify(message));
  }

  simulateMessageReceived({ data }) {
    return new Promise((resolve) => {
      function messageHandler() {
        this.removeEventListener('message', messageHandler);
        resolve();
      }

      this.addEventListener('message', messageHandler);
      this.#webSocket.simulateMessageReceived({ data });
    });
  }

  simulateErrorOccurred() {
    return new Promise((resolve) => {
      function errorHandler() {
        this.removeEventListener('error', errorHandler);
        resolve();
      }

      this.addEventListener('error', errorHandler);
      this.#webSocket.simulateErrorOccurred();
    });
  }

  #startHeartbeat() {
    if (!this.isHeartbeatEnabled) {
      return;
    }

    this.#heartbeatId = setInterval(
      () => this.send({ type: 'heartbeat' }),
      30000,
    );
  }

  #stopHeartbeat() {
    clearInterval(this.#heartbeatId);
  }
}

class WebSocketStub {
  // TODO simplify WebSocket fake to stub
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = WebSocketStub.CONNECTING;
  onclose;
  onerror;

  #onopen;

  get onopen() {
    return this.#onopen;
  }

  set onopen(listener) {
    this.#onopen = listener;
    setTimeout(() => {
      this.readyState = WebSocketStub.OPEN;
      this.onopen(new Event('open'));
    });
  }

  close(code, reason) {
    setTimeout(() => {
      this.readyState = WebSocketStub.CLOSED;
      this.onclose?.(new CloseEvent('close', { wasClean: true, code, reason }));
    });
  }

  send() {}

  simulateMessageReceived({ data }) {
    setTimeout(() => {
      let jsonString =
        typeof data === 'string' ||
        data instanceof Blob ||
        data instanceof ArrayBuffer
          ? data
          : JSON.stringify(data);
      this.onmessage?.(new MessageEvent('message', { data: jsonString }));
    });
  }

  simulateErrorOccurred() {
    setTimeout(() => {
      this.readyState = WebSocketStub.CLOSED;
      this.onclose?.(new globalThis.CloseEvent('close', { wasClean: false }));
      this.onerror?.(new Event('error'));
    });
  }
}
