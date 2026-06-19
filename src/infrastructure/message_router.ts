// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import type { Message, MessageHandler } from "../domain";

/**
 * Route messages to a registered handler.
 */
export class MessageRouter {
  #routing = new Map<string, MessageHandler>();

  /**
   * Register a handler for a message type.
   */
  register(type: string, handler: MessageHandler) {
    this.#routing.set(type, handler);
  }

  /**
   * Route a message to the registered handler and return the response.
   *
   * @throws Error if no handler is registered for the message type.
   */
  async route<TResponse = unknown>(message: Message): Promise<TResponse> {
    const handler = this.#routing.get(message.type);
    if (handler == null) {
      throw new Error(
        `No handler registered for message type: ${message.type}`,
      );
    }

    if (typeof handler === "function") {
      return (await handler(message)) as TResponse;
    } else {
      return (await handler.handle(message)) as TResponse;
    }
  }
}
