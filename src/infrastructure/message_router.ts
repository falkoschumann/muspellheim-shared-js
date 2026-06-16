// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import type { Message } from "../domain";

export type MessageHandlerFunction<TData = unknown, TResponse = unknown> = (
  message: Message<TData>,
) => TResponse;

export interface MessageHandlerObject<TData = unknown, TResponse = unknown> {
  handle(message: Message<TData>): TResponse;
}
export type MessageHandler<TData = unknown, TResponse = unknown> =
  | MessageHandlerFunction<TData, TResponse>
  | MessageHandlerObject<TData, TResponse>;

export class MessageRouter {
  #routing = new Map<string, MessageHandler>();

  register(type: string, handler: MessageHandler) {
    this.#routing.set(type, handler);
  }

  route<TResponse = unknown>(message: Message): TResponse {
    const handler = this.#routing.get(message.type);
    if (handler == null) {
      throw new Error(
        `No handler registered for message type: ${message.type}`,
      );
    }

    if (typeof handler === "function") {
      return handler(message) as TResponse;
    } else {
      return handler.handle(message) as TResponse;
    }
  }
}
