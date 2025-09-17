// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import type { MessageClient } from "./message_client";

/**
 * A client for the server-sent events protocol.
 */
export class SseClient extends EventTarget implements MessageClient {
  /**
   * Create an SSE client.
   *
   * @return A new SSE client.
   */
  static create(): SseClient {
    return new SseClient(EventSource);
  }

  /**
   * Create a nulled SSE client.
   *
   * @return A new SSE client.
   */
  static createNull(): SseClient {
    return new SseClient(EventSourceStub as typeof EventSource);
  }

  readonly #eventSourceConstructor: typeof EventSource;

  #eventSource?: EventSource;

  private constructor(eventSourceConstructor: typeof EventSource) {
    super();
    this.#eventSourceConstructor = eventSourceConstructor;
  }

  get isConnected(): boolean {
    return this.#eventSource?.readyState === this.#eventSourceConstructor.OPEN;
  }

  get url(): string | undefined {
    return this.#eventSource?.url;
  }

  async connect(
    url: string | URL,
    eventName = "message",
    ...otherEvents: string[]
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (this.isConnected) {
        reject(new Error("Already connected."));
        return;
      }

      try {
        this.#eventSource = new this.#eventSourceConstructor(url);
        this.#eventSource.addEventListener("open", (e) => {
          this.#handleOpen(e);
          resolve();
        });
        this.#eventSource.addEventListener(eventName, (e) =>
          this.#handleMessage(e),
        );
        for (const otherEvent of otherEvents) {
          this.#eventSource.addEventListener(otherEvent, (e) =>
            this.#handleMessage(e),
          );
        }
        this.#eventSource.addEventListener("error", (e) =>
          this.#handleError(e),
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  send(_message: string, _type?: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (!this.isConnected) {
        resolve();
        return;
      }

      try {
        this.#eventSource!.close();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Simulate a message event from the server.
   *
   * @param message The message to receive.
   * @param eventName The optional event type.
   * @param lastEventId The optional last event ID.
   */
  simulateMessage(
    message: string,
    eventName = "message",
    lastEventId?: string,
  ) {
    this.#handleMessage(
      new MessageEvent(eventName, { data: message, lastEventId }),
    );
  }

  /**
   * Simulate an error event.
   */
  simulateError() {
    this.#handleError(new Event("error"));
  }

  #handleOpen(event: Event) {
    // @ts-expect-error create copy of event
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #handleMessage(event: MessageEvent) {
    // @ts-expect-error create copy of event
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  #handleError(event: Event) {
    // @ts-expect-error create copy of event
    this.dispatchEvent(new event.constructor(event.type, event));
  }
}

class EventSourceStub extends EventTarget {
  // The constants have to be defined here because Node.js support is currently
  // experimental only.
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  url: string;
  readyState = EventSourceStub.CONNECTING;

  constructor(url: string | URL) {
    super();
    this.url = url.toString();
    setTimeout(() => {
      this.readyState = EventSourceStub.OPEN;
      this.dispatchEvent(new Event("open"));
    }, 0);
  }

  close() {
    this.readyState = EventSourceStub.CLOSED;
  }
}
