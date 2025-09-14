// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

/**
 * An interface for a streaming message client.
 *
 * Emits the following events:
 *
 * - open, {@link Event}
 * - message, {@link MessageEvent}
 * - error, {@link Event}
 * - close, optional {@link CloseEvent}
 *
 * It is used for wrappers around {@link EventSource} and {@link WebSocket}.
 *
 * @see {@link SseClient}
 * @see {@link WebSocketClient}
 */
export interface MessageClient extends EventTarget {
  /**
   * Returns whether the client is connected.
   */
  get isConnected(): boolean;

  /**
   * Returns the server URL.
   */
  get url(): string | undefined;

  /**
   * Connects to the server.
   *
   * @param url The server URL to connect to.
   */
  connect(url: string | URL): Promise<void>;

  /**
   * Sends a message to the server.
   *
   * This is an optional method for streams with bidirectional communication.
   *
   * @param message The message to send.
   * @param type The optional message type.
   */
  send(message: string, type?: string): Promise<void>;

  /**
   * Closes the connection.
   */
  close(): Promise<void>;
}
