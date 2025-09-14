// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { OutputTracker } from "../common/output_tracker";
import type { MessageClient } from "./message_client";

export const HEARTBEAT_TYPE = "heartbeat";

const MESSAGE_SENT_EVENT = "message-sent";

/**
 * Options for the WebSocket client.
 */
export interface WebSocketOptions {
  /**
   * The heartbeat interval in milliseconds. A value <= 0 disables the
   * heartbeat.
   */
  heartbeat?: number;
}

/**
 * A client for the WebSocket protocol.
 */
export class WebSocketClient extends EventTarget implements MessageClient {
  // TODO Recover connection with timeout after an error event.

  /**
   * Creates a WebSocket client.
   *
   * @param options The options for the WebSocket client.
   * @return A new WebSocket client.
   */
  static create({ heartbeat = 30000 }: WebSocketOptions = {}): WebSocketClient {
    return new WebSocketClient(heartbeat, WebSocket);
  }

  /**
   * Creates a nulled WebSocket client.
   *
   * @param options The options for the WebSocket client.
   * @return A new nulled WebSocket client.
   */
  static createNull({ heartbeat = -1 }: WebSocketOptions = {}) {
    return new WebSocketClient(
      heartbeat,
      WebSocketStub as unknown as typeof WebSocket,
    );
  }

  readonly #heartbeat: number;
  readonly #webSocketConstructor: typeof WebSocket;

  #webSocket?: WebSocket;
  #heartbeatId?: ReturnType<typeof setTimeout>;

  private constructor(
    heartbeat: number,
    webSocketConstructor: typeof WebSocket,
  ) {
    super();
    this.#heartbeat = heartbeat;
    this.#webSocketConstructor = webSocketConstructor;
  }

  get isConnected(): boolean {
    return this.#webSocket?.readyState === WebSocket.OPEN;
  }

  get url(): string | undefined {
    return this.#webSocket?.url;
  }

  async connect(url: string | URL): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (this.isConnected) {
        reject(new Error("Already connected."));
        return;
      }

      try {
        this.#webSocket = new this.#webSocketConstructor(url);
        this.#webSocket.addEventListener("open", (e) => {
          this.#handleOpen(e);
          resolve();
        });
        this.#webSocket.addEventListener("message", (e) =>
          this.#handleMessage(e),
        );
        this.#webSocket.addEventListener("close", (e) => this.#handleClose(e));
        this.#webSocket.addEventListener("error", (e) => this.#handleError(e));
      } catch (error) {
        reject(error);
      }
    });
  }

  async send(message: string) {
    if (!this.isConnected) {
      throw new Error("Not connected.");
    }

    this.#webSocket!.send(message);
    this.dispatchEvent(
      new CustomEvent(MESSAGE_SENT_EVENT, { detail: message }),
    );
    await Promise.resolve();
  }

  /**
   * Returns a tracker for messages sent.
   *
   * @return A new output tracker.
   */
  trackMessageSent(): OutputTracker<string> {
    return OutputTracker.create(this, MESSAGE_SENT_EVENT);
  }

  /**
   * Closes the connection.
   *
   * If a code is provided, also a reason should be provided.
   *
   * @param code An optional code.
   * @param reason An optional reason.
   */
  async close(code?: number, reason?: string): Promise<void> {
    await new Promise<void>((resolve) => {
      if (!this.isConnected) {
        resolve();
        return;
      }

      this.#webSocket!.addEventListener("close", () => resolve());
      this.#webSocket!.close(code, reason);
    });
  }

  /**
   * Simulates a message event from the server.
   *
   * @param message The message to receive.
   */
  simulateMessage(message: string) {
    this.#handleMessage(new MessageEvent("message", { data: message }));
  }

  /**
   * Simulates a heartbeat.
   */
  simulateHeartbeat() {
    this.#sendHeartbeat();
  }

  /**
   * Simulates a close event.
   *
   * @param code An optional code.
   * @param reason An optional reason.
   */
  simulateClose(code?: number, reason?: string) {
    this.#handleClose(new CloseEvent("close", { code, reason }));
  }

  /**
   * Simulates an error event.
   */
  simulateError() {
    this.#handleError(new Event("error"));
  }

  #handleOpen(event: Event) {
    // @ts-expect-error create copy of event
    this.dispatchEvent(new event.constructor(event.type, event));
    this.#startHeartbeat();
  }

  #handleMessage(event: MessageEvent) {
    this.dispatchEvent(
      // @ts-expect-error create copy of event
      new event.constructor(event.type, event as unknown as MessageEventInit),
    );
  }

  #handleClose(event: CloseEvent) {
    this.#stopHeartbeat();
    // @ts-expect-error create copy of event
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #handleError(event: Event) {
    // @ts-expect-error create copy of event
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #startHeartbeat() {
    if (this.#heartbeat <= 0) {
      return;
    }

    this.#heartbeatId = setInterval(
      () => this.#sendHeartbeat(),
      this.#heartbeat,
    );
  }

  #stopHeartbeat() {
    clearInterval(this.#heartbeatId);
    this.#heartbeatId = undefined;
  }

  #sendHeartbeat() {
    if (this.#heartbeatId == null) {
      return;
    }

    void this.send(HEARTBEAT_TYPE);
  }
}

class WebSocketStub extends EventTarget {
  url: string;
  readyState: number = WebSocket.CONNECTING;

  constructor(url: string | URL) {
    super();
    this.url = url.toString();
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.dispatchEvent(new Event("open"));
    }, 0);
  }

  send() {}

  close() {
    this.readyState = WebSocket.CLOSED;
    this.dispatchEvent(new Event("close"));
  }
}
