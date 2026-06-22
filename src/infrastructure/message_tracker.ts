// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import type { MessageRouter } from "./message_router";
import type { Message } from "../domain";

/**
 * Track messages from a message router.
 *
 * **Note:** A stubbed message handler will be registered and replace existing
 * handlers.
 */
export class MessageTracker<T extends Message = Message> {
  static create(messageRouter: MessageRouter, ...type: string[]) {
    return new MessageTracker(messageRouter, type);
  }

  #messages: T[];

  /**
   * Create a tracker for a specific message of a message router.
   *
   * @param messageRouter The router to track.
   * @param types The message type to track.
   */
  constructor(messageRouter: MessageRouter, types: string[]) {
    this.#messages = [];

    types.forEach((type) =>
      messageRouter.register(type, (message) =>
        this.#messages.push(message as T),
      ),
    );
  }

  /**
   * Return the tracked messages.
   *
   * @return The tracked messages.
   */
  get messages(): T[] {
    return this.#messages;
  }

  /**
   * Clear the tracked messages and return the cleared messages.
   *
   * @return The cleared messages.
   */
  clear(): T[] {
    const result = [...this.#messages];
    this.#messages.length = 0;
    return result;
  }
}
